import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { cachedVotingPower } from "../src/voting-power-cache.mjs";

const db = new PGlite();
const originalDelegate = "0x0000000000000000000000000000000000000001";
const laterDelegate = "0x0000000000000000000000000000000000000002";
const snapshot = 100;
const gated = { type: "fixed", min: "2", votes: "5" };

before(async () => {
  await db.exec(await readFile(new URL("../schema.sql", import.meta.url), "utf8"));
  await db.query("INSERT INTO rounds.house (handle, name) VALUES ('house', 'House')");
});
after(() => db.close());

async function createRound(handle, strategy, block = snapshot) {
  const { rows: [round] } = await db.query(
    `INSERT INTO rounds.round
       (handle, house, name, creator, start_at, voting_start_at, end_at,
        propose_strategy, vote_strategy, snapshot_block)
     VALUES ($1, 'house', $1, $2, now(), now(), now() + interval '1 day', '{}', $3, $4)
     RETURNING id, vote_strategy, snapshot_block`,
    [handle, originalDelegate, JSON.stringify(strategy), block],
  );
  return round;
}

// The historical balance meets the minimum exactly. Current ownership can change.
function delegationFixture() {
  let current = originalDelegate;
  const client = {
    async readContract({ functionName, args }) {
      const [address, block] = args;
      if (functionName === "getCurrentVotes") return address === current ? 2n : 0n;
      assert.equal(functionName, "getPriorVotes");
      assert.equal(block, BigInt(snapshot));
      return address === originalDelegate ? 2n : 0n;
    },
  };
  return { chain: { client }, redelegate() { current = laterDelegate; } };
}

test("fixed voting power belongs only to the wallet eligible at the round snapshot", async () => {
  const round = await createRound("gated", gated);
  const { chain, redelegate } = delegationFixture();
  assert.equal(await cachedVotingPower(db, chain, round, originalDelegate), 5n);
  redelegate();
  assert.equal(await cachedVotingPower(db, chain, round, laterDelegate), 0n);
  // Both answers can now be served from the database without a chain read.
  assert.equal(await cachedVotingPower(db, {}, round, originalDelegate), 5n);
  assert.equal(await cachedVotingPower(db, {}, round, laterDelegate), 0n);
});

test("legacy fixed-vote cache entries are repaired in both directions", async () => {
  const round = await createRound("legacy", gated);
  await db.query(
    `INSERT INTO rounds.voting_power (round_id, voter, power, block)
     VALUES ($1, $2, 0, NULL), ($1, $3, 5, NULL)`,
    [round.id, originalDelegate, laterDelegate],
  );
  const { chain, redelegate } = delegationFixture();
  redelegate();
  assert.equal(await cachedVotingPower(db, chain, round, laterDelegate), 0n);
  assert.equal(await cachedVotingPower(db, chain, round, originalDelegate), 5n);
  const { rows } = await db.query(
    "SELECT block::int, power::int FROM rounds.voting_power WHERE round_id = $1 ORDER BY voter",
    [round.id],
  );
  assert.deepEqual(rows, [{ block: snapshot, power: 5 }, { block: snapshot, power: 0 }]);
});

test("a missing snapshot is pinned once even if a reader has a stale round object", async () => {
  const round = await createRound("late-ticker", gated, null);
  const stale = { ...round };
  const { chain } = delegationFixture();
  let head = snapshot;
  chain.client.getBlockNumber = async () => BigInt(head);
  assert.equal(await cachedVotingPower(db, chain, round, originalDelegate), 5n);
  head += 10;
  assert.equal(await cachedVotingPower(db, chain, stale, laterDelegate), 0n);
  const { rows: [stored] } = await db.query(
    "SELECT snapshot_block::int FROM rounds.round WHERE id = $1", [round.id],
  );
  assert.equal(stored.snapshot_block, snapshot);
});

test("fixed votes without a minimum work without a chain read or snapshot", async () => {
  const round = await createRound("open-fixed", { type: "fixed", min: "0", votes: "3" }, null);
  assert.equal(await cachedVotingPower(db, {}, round, laterDelegate), 3n);
});

test("an unavailable historical read leaves a legacy entry untrusted until retry", async () => {
  const round = await createRound("rpc-retry", gated);
  await db.query(
    "INSERT INTO rounds.voting_power (round_id, voter, power) VALUES ($1, $2, 5)",
    [round.id, laterDelegate],
  );
  const unavailable = { client: { readContract: async () => { throw new Error("RPC offline"); } } };
  await assert.rejects(cachedVotingPower(db, unavailable, round, laterDelegate), /RPC offline/);
  const { chain } = delegationFixture();
  assert.equal(await cachedVotingPower(db, chain, round, laterDelegate), 0n);
});

test("delegation-weighted voting still uses the historical balance and multiplier", async () => {
  const round = await createRound("weighted", { type: "lil-nouns-votes", multiplier: 3 });
  const { chain, redelegate } = delegationFixture();
  redelegate();
  assert.equal(await cachedVotingPower(db, chain, round, originalDelegate), 6n);
  assert.equal(await cachedVotingPower(db, chain, round, laterDelegate), 0n);
});
