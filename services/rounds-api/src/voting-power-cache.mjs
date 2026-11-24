import { DEFAULT_VOTE_STRATEGY, votingPower } from "./strategies.mjs";

/**
 * Voting power is pinned to the round's snapshot block and cached, so buying or
 * selling a Lil Noun mid-round cannot change a ballot already in flight.
 */
export async function cachedVotingPower(db, chain, round, address) {
  const voter = address.toLowerCase();
  const strategy = round.vote_strategy ?? DEFAULT_VOTE_STRATEGY;
  const usesDelegation = strategy.type === "lil-nouns-votes"
    || (strategy.type === "fixed" && BigInt(strategy.min ?? 0) > 0n);
  const block = usesDelegation ? await snapshotBlock(db, chain.client, round) : null;

  // Legacy gated fixed-vote entries have a NULL block and may reflect later delegation.
  const { rows: [cached] } = await db.query(
    `SELECT power::text AS power FROM rounds.voting_power
      WHERE round_id = $1 AND voter = $2 AND block IS NOT DISTINCT FROM $3`,
    [round.id, voter, block],
  );
  if (cached) return BigInt(cached.power);

  const power = await votingPower({ strategy, chain, address, block });
  await db.query(
    `INSERT INTO rounds.voting_power AS cached (round_id, voter, power, block) VALUES ($1, $2, $3, $4)
     ON CONFLICT (round_id, voter) DO UPDATE SET power = EXCLUDED.power, block = EXCLUDED.block
       WHERE cached.block IS DISTINCT FROM EXCLUDED.block`,
    [round.id, voter, String(power), block],
  );
  return power;
}

/**
 * The block voting power is read at. Normally the ticker pins it the moment
 * voting opens; this covers a round whose voting window opened while the ticker
 * was down.
 */
async function snapshotBlock(db, client, round) {
  if (round.snapshot_block != null) return round.snapshot_block;
  const block = await client.getBlockNumber();
  const { rows: [updated] } = await db.query(
    `UPDATE rounds.round SET snapshot_block = coalesce(snapshot_block, $2), updated_at = now()
      WHERE id = $1 RETURNING snapshot_block`,
    [round.id, String(block)],
  );
  round.snapshot_block = updated.snapshot_block;
  return updated.snapshot_block;
}
