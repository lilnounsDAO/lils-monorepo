#!/usr/bin/env node
/**
 * Funded rounds for Lil Nouns: an open round anyone can propose to, voted on
 * with delegated Lil Nouns votes, settled on a timer.
 *
 * Every write is a wallet signature over EIP-712 typed data (see src/eip712.mjs,
 * mirrored in apps/web/src/data/rounds/eip712.ts). Nothing is stored unless:
 *   - the signature recovers to the signer named in the payload (EOA or ERC-1271),
 *   - the payload is recent and its nonce has not been used before,
 *   - the round is in the state that allows the write, and
 *   - the signer's strategy gives them the right to it (propose) or enough
 *     unspent voting power at the round's snapshot block (vote).
 *
 * Rounds run themselves: the ticker opens proposing, pins the snapshot block
 * when voting starts, and assigns awards to the leading proposals at the end.
 * Reads derive state from the clock too, so a stalled ticker can't show a
 * closed round as open.
 */
import http from "node:http";
import { readFileSync } from "node:fs";
import pg from "pg";
import {
  createPublicClient,
  getAddress,
  http as httpTransport,
  isAddress,
  recoverTypedDataAddress,
} from "viem";
import { mainnet, sepolia } from "viem/chains";
import { TYPES, domain, encodeAwards, encodeBallot, hashText } from "./eip712.mjs";
import {
  DEFAULT_PROPOSE_STRATEGY,
  DEFAULT_VOTE_STRATEGY,
  VOTES_ABI,
  canPropose,
  describeStrategy,
  normalizeStrategy,
  votingPower,
} from "./strategies.mjs";

const env = process.env;
const PORT = Number(env.PORT || 3040);
const HOST = env.HOST || "127.0.0.1";
const DATABASE_URL = env.DATABASE_URL;
const CHAIN_ID = Number(env.CHAIN_ID || 1);
const TOKEN_ADDRESS = getAddress(
  env.TOKEN_ADDRESS || (CHAIN_ID === 1
    ? "0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B"
    : "0x1bCcE5eC2A785E7e9807766c4dbB72aB4a0014Cf"),
);
const SIGNATURE_TTL_MS = Number(env.SIGNATURE_TTL_MS || 10 * 60_000);
const TICK_MS = Number(env.TICK_MS || 30_000);
// Opening a funded round is a bigger deal than proposing to one.
const MIN_CREATE_VOTES = BigInt(env.MIN_CREATE_VOTES || 1);
const HOUSE_HANDLE = env.HOUSE_HANDLE || "lilnouns";
const HOUSE_ADMINS = (env.HOUSE_ADMINS || "")
  .split(",")
  .map((address) => address.trim().toLowerCase())
  .filter((address) => isAddress(address));
const MAX_AWARDS = 50;
const MAX_CONTENT_BYTES = 100_000;
const PAGE_SIZE = 50;
const ALLOWED_ORIGINS = (env.ALLOWED_ORIGINS ||
  "https://lilnouns.wtf,https://www.lilnouns.wtf,/^https:\\/\\/[a-z0-9-]+\\.lilnouns\\.wtf$/,/^https:\\/\\/[a-z0-9-]+--[a-z0-9-]+\\.netlify\\.app$/,http://localhost:3000,http://localhost:5173")
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean)
  .map((item) => (item.startsWith("/") && item.endsWith("/") ? new RegExp(item.slice(1, -1)) : item));

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}
if (!env.RPC_URL) {
  console.error("RPC_URL is required");
  process.exit(1);
}

const db = new pg.Pool({ connectionString: DATABASE_URL, max: 5 });
const client = createPublicClient({
  chain: CHAIN_ID === 1 ? mainnet : sepolia,
  transport: httpTransport(env.RPC_URL, { timeout: 15_000 }),
});
const chain = { client, token: TOKEN_ADDRESS };

// ---------------------------------------------------------------------------
// HTTP plumbing

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function corsOrigin(origin) {
  if (!origin) return null;
  return ALLOWED_ORIGINS.some((rule) => (typeof rule === "string" ? rule === origin : rule.test(origin)))
    ? origin
    : null;
}

function send(req, res, status, body, cache) {
  const origin = corsOrigin(req.headers.origin);
  res.writeHead(status, {
    "content-type": "application/json",
    "cache-control": cache || "no-store",
    "x-content-type-options": "nosniff",
    vary: "Origin",
    ...(origin && {
      "access-control-allow-origin": origin,
      "access-control-allow-methods": "GET, POST, PUT, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "600",
    }),
  });
  res.end(JSON.stringify(body));
}

const PUBLIC_CACHE = "public, max-age=10, s-maxage=20, stale-while-revalidate=120";

async function readJson(req, limit = 512 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) throw new HttpError(413, "That request is too large.");
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new HttpError(400, "Send a JSON body.");
  }
}

// ---------------------------------------------------------------------------
// Signatures

/**
 * Verifies an EIP-712 payload and burns its nonce. `message` is the exact object
 * the wallet signed, so a mismatch anywhere in it fails here rather than later.
 */
async function verifySigned({ primaryType, message, signature, signer }) {
  if (typeof signature !== "string" || !/^0x[0-9a-fA-F]+$/.test(signature)) {
    throw new HttpError(400, "A write needs a signature.");
  }
  if (!isAddress(signer)) throw new HttpError(400, "That signer is not an address.");

  const issued = Number(message.issued) * 1000;
  if (!Number.isFinite(issued) || Math.abs(Date.now() - issued) > SIGNATURE_TTL_MS) {
    throw new HttpError(401, "That signature has expired. Sign again.");
  }
  if (typeof message.nonce !== "string" || message.nonce.length < 8 || message.nonce.length > 100) {
    throw new HttpError(400, "That signature is missing a nonce.");
  }

  const typedData = {
    domain: domain(CHAIN_ID),
    types: { [primaryType]: TYPES[primaryType] },
    primaryType,
    message,
  };
  // An ordinary wallet is recovered locally; only a contract wallet (ERC-1271)
  // needs an eth_call, so writes don't depend on the RPC in the common case.
  const recovered = await recoverTypedDataAddress({ ...typedData, signature }).catch(() => null);
  const valid =
    recovered?.toLowerCase() === signer.toLowerCase() ||
    (await client
      .verifyTypedData({ ...typedData, address: getAddress(signer), signature })
      .catch(() => false));
  if (!valid) throw new HttpError(401, "That signature does not match the wallet.");

  const { rowCount } = await db.query(
    `INSERT INTO rounds.nonce (nonce, signer) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [message.nonce, signer.toLowerCase()],
  );
  if (rowCount === 0) throw new HttpError(409, "That signature has already been used.");
}

// ---------------------------------------------------------------------------
// Shaping
//
// `state` is derived from the clock on every read, so it is right even if the
// ticker is behind; the stored column only drives the one-off side effects.

const STATE_SQL = `CASE
    WHEN now() < r.start_at THEN 'pending'
    WHEN now() < r.voting_start_at THEN 'proposing'
    WHEN now() < r.end_at THEN 'voting'
    ELSE 'ended'
  END`;

const ROUND_COLUMNS = `r.id, r.handle, r.house, r.name, r.description, r.content, r.image,
  r.creator, r.creator_name, r.creator_image, r.start_at, r.voting_start_at,
  r.end_at, ${STATE_SQL} AS state,
  r.snapshot_block, r.settled_at, r.propose_strategy, r.vote_strategy,
  r.source, r.source_id, r.source_url, r.featured, r.created_at`;

function shapeRound(row, extras = {}) {
  return {
    id: Number(row.id),
    handle: row.handle,
    house: row.house,
    name: row.name,
    description: row.description,
    content: row.content,
    image: row.image,
    creator: row.creator,
    creatorName: row.creator_name,
    creatorImage: row.creator_image,
    startAt: row.start_at,
    votingStartAt: row.voting_start_at,
    endAt: row.end_at,
    state: row.state,
    snapshotBlock: row.snapshot_block == null ? null : Number(row.snapshot_block),
    settledAt: row.settled_at,
    proposeStrategy: row.propose_strategy ?? DEFAULT_PROPOSE_STRATEGY,
    voteStrategy: row.vote_strategy ?? DEFAULT_VOTE_STRATEGY,
    proposeStrategyDescription: describeStrategy(row.propose_strategy, "propose"),
    voteStrategyDescription: describeStrategy(row.vote_strategy, "vote"),
    source: row.source,
    sourceId: row.source_id,
    sourceUrl: row.source_url,
    featured: row.featured,
    createdAt: row.created_at,
    proposalCount: Number(row.proposal_count ?? 0),
    voteCount: String(row.vote_total ?? "0"),
    voterCount: Number(row.voter_count ?? 0),
    ...extras,
  };
}

function shapeAward(row) {
  return {
    id: Number(row.id),
    place: Number(row.place),
    asset: row.asset,
    value: String(row.value),
    winnerProposalId: row.winner_proposal_id == null ? null : Number(row.winner_proposal_id),
    payoutTx: row.payout_tx,
  };
}

function shapeProposal(row) {
  return {
    id: Number(row.id),
    roundId: Number(row.round_id),
    roundHandle: row.round_handle,
    author: row.author,
    authorName: row.author_name,
    authorImage: row.author_image,
    title: row.title,
    tldr: row.tldr,
    content: row.content,
    voteCount: String(row.vote_count),
    voterCount: Number(row.voter_count ?? 0),
    rank: row.rank == null ? null : Number(row.rank),
    place: row.place == null ? null : Number(row.place),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    source: row.source,
  };
}

// ---------------------------------------------------------------------------
// Reads

async function getRound(handle) {
  const { rows: [row] } = await db.query(
    `SELECT ${ROUND_COLUMNS},
       (SELECT count(*) FROM rounds.proposal p WHERE p.round_id = r.id AND p.visible) AS proposal_count,
       (SELECT coalesce(sum(v.weight), 0) FROM rounds.vote v WHERE v.round_id = r.id) AS vote_total,
       (SELECT count(DISTINCT v.voter) FROM rounds.vote v WHERE v.round_id = r.id) AS voter_count
     FROM rounds.round r
     WHERE r.handle = $1 AND r.visible`,
    [handle],
  );
  if (!row) throw new HttpError(404, "No round with that handle.");
  return row;
}

async function listRounds(url) {
  const state = url.searchParams.get("state");
  const house = url.searchParams.get("house");
  const search = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(Number(url.searchParams.get("limit") || PAGE_SIZE) || PAGE_SIZE, 100);
  const cursor = Number(url.searchParams.get("cursor") || 0) || null;

  const where = ["r.visible"];
  const args = [];
  if (house) {
    args.push(house);
    where.push(`r.house = $${args.length}`);
  }
  if (state && ["pending", "proposing", "voting", "ended", "open"].includes(state)) {
    where.push(
      state === "open" ? `${STATE_SQL} IN ('proposing', 'voting')` : `${STATE_SQL} = '${state}'`,
    );
  }
  if (search) {
    args.push(`%${search}%`);
    where.push(`(r.name ILIKE $${args.length} OR r.description ILIKE $${args.length})`);
  }
  if (cursor) {
    args.push(cursor);
    where.push(`r.id < $${args.length}`);
  }
  args.push(limit + 1);

  const { rows } = await db.query(
    `SELECT ${ROUND_COLUMNS},
       (SELECT count(*) FROM rounds.proposal p WHERE p.round_id = r.id AND p.visible) AS proposal_count,
       (SELECT coalesce(sum(v.weight), 0) FROM rounds.vote v WHERE v.round_id = r.id) AS vote_total,
       (SELECT count(DISTINCT v.voter) FROM rounds.vote v WHERE v.round_id = r.id) AS voter_count
     FROM rounds.round r
     WHERE ${where.join(" AND ")}
     -- Live rounds first, then the most recently finished.
     ORDER BY (${STATE_SQL} IN ('proposing', 'voting')) DESC, r.end_at DESC, r.id DESC
     LIMIT $${args.length}`,
    args,
  );

  const page = rows.slice(0, limit);
  const awards = await awardsFor(page.map((row) => row.id));
  return {
    rounds: page.map((row) => shapeRound(row, { awards: awards.get(Number(row.id)) ?? [] })),
    nextCursor: rows.length > limit ? String(page[page.length - 1].id) : null,
  };
}

async function awardsFor(roundIds) {
  const grouped = new Map();
  if (roundIds.length === 0) return grouped;
  const { rows } = await db.query(
    `SELECT * FROM rounds.award WHERE round_id = ANY($1::bigint[]) ORDER BY place`,
    [roundIds],
  );
  for (const row of rows) {
    const key = Number(row.round_id);
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(shapeAward(row));
  }
  return grouped;
}

async function listProposals(round) {
  const { rows } = await db.query(
    `SELECT p.*, $2::text AS round_handle,
       (SELECT count(DISTINCT v.voter) FROM rounds.vote v WHERE v.proposal_id = p.id) AS voter_count,
       rank() OVER (ORDER BY p.vote_count DESC, p.created_at) AS rank,
       a.place
     FROM rounds.proposal p
     LEFT JOIN rounds.award a ON a.winner_proposal_id = p.id
     WHERE p.round_id = $1 AND p.visible
     ORDER BY p.vote_count DESC, p.created_at`,
    [round.id, round.handle],
  );
  return rows.map(shapeProposal);
}

/**
 * The round's story in one list: proposals, votes and the two lifecycle moments,
 * newest first.
 */
async function listActivity(round, url) {
  const limit = Math.min(Number(url.searchParams.get("limit") || PAGE_SIZE) || PAGE_SIZE, 200);
  const { rows } = await db.query(
    `SELECT 'vote' AS kind, v.id, v.created_at AS ts, v.voter AS actor,
            v.voter_name AS actor_name, v.voter_image AS actor_image, v.weight::text AS weight,
            p.id AS proposal_id, p.title AS proposal_title, p.author AS proposal_author
       FROM rounds.vote v JOIN rounds.proposal p ON p.id = v.proposal_id
      WHERE v.round_id = $1
     UNION ALL
     SELECT 'proposal' AS kind, p.id, p.created_at AS ts, p.author AS actor,
            p.author_name AS actor_name, p.author_image AS actor_image, NULL AS weight,
            p.id AS proposal_id, p.title AS proposal_title, p.author AS proposal_author
       FROM rounds.proposal p
      WHERE p.round_id = $1 AND p.visible
     ORDER BY ts DESC, id DESC
     LIMIT $2`,
    [round.id, limit],
  );

  const events = rows.map((row) => ({
    id: `${row.kind}-${row.id}`,
    kind: row.kind === "vote" ? "vote" : "proposal-created",
    timestamp: row.ts,
    actor: row.actor,
    actorName: row.actor_name,
    actorImage: row.actor_image,
    weight: row.weight,
    proposalId: Number(row.proposal_id),
    proposalTitle: row.proposal_title,
    proposalAuthor: row.proposal_author,
  }));

  const now = Date.now();
  const milestones = [
    { at: round.start_at, kind: "round-started" },
    { at: round.voting_start_at, kind: "voting-started" },
    { at: round.end_at, kind: "round-ended" },
  ]
    .filter(({ at }) => new Date(at).getTime() <= now)
    .map(({ at, kind }) => ({ id: kind, kind, timestamp: at }));

  return {
    events: [...events, ...milestones].sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp),
    ),
  };
}

/** What one wallet may still do in a round, so the UI can say so before signing. */
async function getPower(round, address) {
  if (!isAddress(address)) throw new HttpError(400, "That is not an address.");
  const voter = address.toLowerCase();
  const state = round.state;

  const power = state === "pending" || state === "proposing"
    ? await votingPower({ strategy: round.vote_strategy, chain, address, block: null })
    : await cachedVotingPower(round, address);
  const { rows: [spent] } = await db.query(
    `SELECT coalesce(sum(weight), 0)::text AS used FROM rounds.vote WHERE round_id = $1 AND voter = $2`,
    [round.id, voter],
  );
  const used = BigInt(spent.used);
  const eligible = await canPropose({ strategy: round.propose_strategy, chain, address });

  return {
    address: voter,
    votingPower: String(power),
    votesUsed: String(used),
    votesRemaining: String(power > used ? power - used : 0n),
    canPropose: eligible && state === "proposing",
    canVote: state === "voting" && power > used,
    snapshotBlock: round.snapshot_block == null ? null : Number(round.snapshot_block),
  };
}

/**
 * Voting power is pinned to the round's snapshot block and cached, so buying or
 * selling a Lil Noun mid-round cannot change a ballot already in flight.
 */
async function cachedVotingPower(round, address) {
  const voter = address.toLowerCase();
  const { rows: [cached] } = await db.query(
    `SELECT power::text AS power FROM rounds.voting_power WHERE round_id = $1 AND voter = $2`,
    [round.id, voter],
  );
  if (cached) return BigInt(cached.power);

  const needsBlock = (round.vote_strategy?.type ?? DEFAULT_VOTE_STRATEGY.type) === "lil-nouns-votes";
  const block = needsBlock ? round.snapshot_block ?? (await snapshotBlock(round)) : null;
  const power = await votingPower({ strategy: round.vote_strategy, chain, address, block });
  await db.query(
    `INSERT INTO rounds.voting_power (round_id, voter, power, block) VALUES ($1, $2, $3, $4)
     ON CONFLICT (round_id, voter) DO NOTHING`,
    [round.id, voter, String(power), block],
  );
  return power;
}

/**
 * The block voting power is read at. Normally the ticker pins it the moment
 * voting opens; this covers a round whose voting window opened while the ticker
 * was down.
 */
async function snapshotBlock(round) {
  if (round.snapshot_block != null) return Number(round.snapshot_block);
  const block = await client.getBlockNumber();
  const { rows: [updated] } = await db.query(
    `UPDATE rounds.round SET snapshot_block = coalesce(snapshot_block, $2), updated_at = now()
      WHERE id = $1 RETURNING snapshot_block`,
    [round.id, Number(block)],
  );
  round.snapshot_block = updated.snapshot_block;
  return Number(updated.snapshot_block);
}

// ---------------------------------------------------------------------------
// Writes

const HANDLE_PATTERN = /^[a-z0-9][a-z0-9-]{1,60}$/;

function requireText(value, field, max) {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new HttpError(400, `A round needs a ${field}.`);
  }
  if (Buffer.byteLength(value, "utf8") > max) throw new HttpError(400, `That ${field} is too long.`);
  return value.trim();
}

function parseAwards(input) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new HttpError(400, "A round needs at least one award.");
  }
  if (input.length > MAX_AWARDS) throw new HttpError(400, `A round can have at most ${MAX_AWARDS} awards.`);

  return input.map((award, index) => {
    const place = Number(award.place ?? index + 1);
    if (!Number.isInteger(place) || place < 1 || place > MAX_AWARDS) {
      throw new HttpError(400, "Award places must count up from 1.");
    }
    let value;
    try {
      value = BigInt(award.value);
    } catch {
      throw new HttpError(400, "An award value must be an integer in the asset's base units.");
    }
    if (value <= 0n) throw new HttpError(400, "An award must be worth more than zero.");

    const asset = award.asset ?? {};
    if (!isAddress(asset.address ?? "")) throw new HttpError(400, "An award needs an asset address.");
    return {
      place,
      value: String(value),
      asset: {
        name: requireText(asset.name, "asset name", 100),
        symbol: typeof asset.symbol === "string" ? asset.symbol.slice(0, 20) : null,
        image: typeof asset.image === "string" ? asset.image.slice(0, 500) : null,
        decimals: Number(asset.decimals ?? 18),
        chainId: Number(asset.chainId ?? CHAIN_ID),
        address: String(asset.address).toLowerCase(),
        tokenId: asset.tokenId == null ? null : String(asset.tokenId),
      },
    };
  });
}

async function createRound(req) {
  const body = await readJson(req);
  const { signature, signer } = body;
  const handle = String(body.handle ?? "").toLowerCase();
  if (!HANDLE_PATTERN.test(handle)) {
    throw new HttpError(400, "A handle is 2-61 characters of lowercase letters, numbers and dashes.");
  }

  const name = requireText(body.name, "name", 200);
  const description = requireText(body.description, "description", 1_000);
  const content = requireText(body.content, "body", MAX_CONTENT_BYTES);
  const awards = parseAwards(body.awards);
  const startAt = new Date(body.startAt);
  const votingStartAt = new Date(body.votingStartAt);
  const endAt = new Date(body.endAt);

  if ([startAt, votingStartAt, endAt].some((date) => Number.isNaN(date.getTime()))) {
    throw new HttpError(400, "A round needs valid start, voting and end times.");
  }
  if (!(startAt < votingStartAt && votingStartAt < endAt)) {
    throw new HttpError(400, "Proposing must open before voting, and voting must close last.");
  }
  if (startAt.getTime() < Date.now() - 60 * 60_000) {
    throw new HttpError(400, "A round cannot start in the past.");
  }
  if (endAt.getTime() - startAt.getTime() > 365 * 24 * 3_600_000) {
    throw new HttpError(400, "A round cannot run longer than a year.");
  }

  const proposeStrategy = normalizeStrategy(body.proposeStrategy, "propose");
  const voteStrategy = normalizeStrategy(body.voteStrategy, "vote");

  await verifySigned({
    primaryType: "Round",
    signer,
    signature,
    message: {
      handle,
      name,
      description,
      contentHash: hashText(content),
      awardsHash: hashText(encodeAwards(awards)),
      startAt: Math.floor(startAt.getTime() / 1000),
      votingStartAt: Math.floor(votingStartAt.getTime() / 1000),
      endAt: Math.floor(endAt.getTime() / 1000),
      creator: getAddress(signer),
      issued: Number(body.issued),
      nonce: String(body.nonce),
    },
  });

  const creator = signer.toLowerCase();
  const { rows: [house] } = await db.query(`SELECT admins FROM rounds.house WHERE handle = $1`, [
    HOUSE_HANDLE,
  ]);
  if (!house) throw new HttpError(500, "The house is not set up.");
  if (!house.admins.includes(creator)) {
    const votes = await client.readContract({
      address: TOKEN_ADDRESS,
      abi: VOTES_ABI,
      functionName: "getCurrentVotes",
      args: [getAddress(signer)],
    });
    if (votes < MIN_CREATE_VOTES) {
      throw new HttpError(403, "Only Lil Nouns voters and house admins can open a round.");
    }
  }

  const connection = await db.connect();
  try {
    await connection.query("BEGIN");
    const { rows: [round] } = await connection.query(
      `INSERT INTO rounds.round
         (handle, house, name, description, content, image, creator, start_at, voting_start_at,
          end_at, propose_strategy, vote_strategy, signed_data, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'lilnouns')
       ON CONFLICT (handle) DO NOTHING
       RETURNING id`,
      [
        handle,
        HOUSE_HANDLE,
        name,
        description,
        content,
        typeof body.image === "string" ? body.image.slice(0, 500) : null,
        creator,
        startAt.toISOString(),
        votingStartAt.toISOString(),
        endAt.toISOString(),
        proposeStrategy,
        voteStrategy,
        { signature, signer: creator, issued: body.issued, nonce: body.nonce },
      ],
    );
    if (!round) throw new HttpError(409, "A round already has that handle.");

    for (const award of awards) {
      await connection.query(
        `INSERT INTO rounds.award (round_id, place, asset, value) VALUES ($1, $2, $3, $4)`,
        [round.id, award.place, award.asset, award.value],
      );
    }
    await connection.query("COMMIT");
    console.log(`round ${handle} opened by ${creator}`);
    return { handle };
  } catch (error) {
    await connection.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

async function addProposal(req, handle) {
  const body = await readJson(req);
  const round = await getRound(handle);
  if (round.state !== "proposing") {
    throw new HttpError(
      409,
      round.state === "pending" ? "This round has not opened yet." : "Proposing has closed for this round.",
    );
  }

  const title = requireText(body.title, "title", 300);
  const tldr = typeof body.tldr === "string" ? body.tldr.trim().slice(0, 1_000) : "";
  const content = requireText(body.content, "proposal", MAX_CONTENT_BYTES);
  const { signature, signer } = body;

  await verifySigned({
    primaryType: "Proposal",
    signer,
    signature,
    message: {
      round: handle,
      title,
      tldr,
      contentHash: hashText(content),
      author: getAddress(signer),
      issued: Number(body.issued),
      nonce: String(body.nonce),
    },
  });

  const author = signer.toLowerCase();
  if (!(await canPropose({ strategy: round.propose_strategy, chain, address: signer }))) {
    throw new HttpError(403, "This round's rules do not let that wallet propose.");
  }

  const { rows: [proposal] } = await db.query(
    `INSERT INTO rounds.proposal (round_id, author, title, tldr, content, signed_data)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      round.id,
      author,
      title,
      tldr || null,
      content,
      { signature, signer: author, issued: body.issued, nonce: body.nonce },
    ],
  );
  console.log(`proposal ${proposal.id} added to ${handle} by ${author}`);
  return { id: Number(proposal.id) };
}

async function editProposal(req, id) {
  const body = await readJson(req);
  const { rows: [existing] } = await db.query(
    `SELECT p.id, p.author, r.handle, r.id AS round_id, ${STATE_SQL} AS state
       FROM rounds.proposal p JOIN rounds.round r ON r.id = p.round_id
      WHERE p.id = $1 AND p.visible`,
    [Number(id) || 0],
  );
  if (!existing) throw new HttpError(404, "No proposal with that id.");
  if (existing.state !== "proposing") throw new HttpError(409, "Proposing has closed for this round.");

  const title = requireText(body.title, "title", 300);
  const tldr = typeof body.tldr === "string" ? body.tldr.trim().slice(0, 1_000) : "";
  const content = requireText(body.content, "proposal", MAX_CONTENT_BYTES);
  const { signature, signer } = body;

  await verifySigned({
    primaryType: "Proposal",
    signer,
    signature,
    message: {
      round: existing.handle,
      title,
      tldr,
      contentHash: hashText(content),
      author: getAddress(signer),
      issued: Number(body.issued),
      nonce: String(body.nonce),
    },
  });

  if (signer.toLowerCase() !== existing.author) {
    throw new HttpError(403, "Only the author can edit a proposal.");
  }

  await db.query(
    `UPDATE rounds.proposal SET title = $2, tldr = $3, content = $4, signed_data = $5, updated_at = now()
      WHERE id = $1`,
    [
      existing.id,
      title,
      tldr || null,
      content,
      { signature, signer: signer.toLowerCase(), issued: body.issued, nonce: body.nonce },
    ],
  );
  return { id: Number(existing.id) };
}

/**
 * One signature covers a whole ballot, so spreading votes over several proposals
 * is one wallet prompt. The allocation is checked against the voter's unspent
 * power inside the transaction, so two tabs can't both spend it.
 */
async function castVotes(req, handle) {
  const body = await readJson(req);
  const round = await getRound(handle);
  if (round.state !== "voting") {
    throw new HttpError(409, round.state === "ended" ? "Voting has closed for this round." : "Voting has not opened yet.");
  }

  const allocations = Array.isArray(body.votes) ? body.votes : [];
  if (allocations.length === 0) throw new HttpError(400, "Pick at least one proposal to vote for.");
  if (allocations.length > 100) throw new HttpError(400, "That is too many proposals in one ballot.");

  const parsed = allocations.map((entry) => {
    const proposal = Number(entry.proposal);
    let votes;
    try {
      votes = BigInt(entry.votes);
    } catch {
      throw new HttpError(400, "Vote counts must be whole numbers.");
    }
    if (!Number.isInteger(proposal) || proposal <= 0 || votes <= 0n) {
      throw new HttpError(400, "Vote counts must be whole numbers above zero.");
    }
    return { proposal, votes };
  });
  if (new Set(parsed.map((entry) => entry.proposal)).size !== parsed.length) {
    throw new HttpError(400, "That ballot votes for the same proposal twice.");
  }

  const { signature, signer } = body;
  await verifySigned({
    primaryType: "Vote",
    signer,
    signature,
    message: {
      round: handle,
      votes: encodeBallot(parsed),
      voter: getAddress(signer),
      issued: Number(body.issued),
      nonce: String(body.nonce),
    },
  });

  const voter = signer.toLowerCase();
  const power = await cachedVotingPower(round, signer);
  if (power === 0n) throw new HttpError(403, "That wallet had no Lil Nouns votes at the snapshot block.");

  const asked = parsed.reduce((total, entry) => total + entry.votes, 0n);
  const connection = await db.connect();
  try {
    await connection.query("BEGIN");
    // One ballot per wallet per round at a time, so two tabs can't both spend
    // the same votes between the check below and the inserts after it.
    await connection.query(`SELECT pg_advisory_xact_lock(hashtext($1 || ':' || $2)::bigint)`, [
      String(round.id),
      voter,
    ]);
    const { rows: [spent] } = await connection.query(
      `SELECT coalesce(sum(weight), 0)::text AS used FROM rounds.vote
        WHERE round_id = $1 AND voter = $2`,
      [round.id, voter],
    );
    const used = BigInt(spent.used);
    if (used + asked > power) {
      throw new HttpError(
        403,
        `That ballot spends ${asked} votes but only ${power - used} of ${power} are left.`,
      );
    }

    for (const entry of parsed) {
      const { rows: [proposal] } = await connection.query(
        `SELECT id FROM rounds.proposal WHERE id = $1 AND round_id = $2 AND visible`,
        [entry.proposal, round.id],
      );
      if (!proposal) throw new HttpError(404, `Proposal ${entry.proposal} is not in this round.`);

      await connection.query(
        `INSERT INTO rounds.vote (round_id, proposal_id, voter, weight, signed_data)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          round.id,
          entry.proposal,
          voter,
          String(entry.votes),
          { signature, signer: voter, issued: body.issued, nonce: body.nonce },
        ],
      );
      await connection.query(
        `UPDATE rounds.proposal SET vote_count = vote_count + $2 WHERE id = $1`,
        [entry.proposal, String(entry.votes)],
      );
    }
    await connection.query("COMMIT");
  } catch (error) {
    await connection.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    connection.release();
  }

  console.log(`${voter} cast ${asked} votes in ${handle}`);
  const remaining = power - (await usedVotes(round.id, voter));
  return { votesRemaining: String(remaining > 0n ? remaining : 0n) };
}

async function usedVotes(roundId, voter) {
  const { rows: [row] } = await db.query(
    `SELECT coalesce(sum(weight), 0)::text AS used FROM rounds.vote WHERE round_id = $1 AND voter = $2`,
    [roundId, voter],
  );
  return BigInt(row.used);
}

// ---------------------------------------------------------------------------
// The ticker
//
// Rounds run on their own clock: proposing opens, the snapshot block is pinned
// when voting opens, and awards land on the leading proposals once voting ends.

async function tick() {
  await db.query(
    `UPDATE rounds.round SET state = 'proposing', updated_at = now()
      WHERE visible AND state = 'pending' AND now() >= start_at AND now() < voting_start_at`,
  );

  const { rows: opening } = await db.query(
    `SELECT id, handle FROM rounds.round
      WHERE visible AND state IN ('pending', 'proposing')
        AND now() >= voting_start_at AND now() < end_at`,
  );
  for (const round of opening) {
    const block = await client.getBlockNumber().catch((error) => {
      console.error(`could not read the snapshot block for ${round.handle}:`, error.message);
      return null;
    });
    if (block == null) continue;
    await db.query(
      `UPDATE rounds.round
          SET state = 'voting', snapshot_block = coalesce(snapshot_block, $2), updated_at = now()
        WHERE id = $1`,
      [round.id, Number(block)],
    );
    console.log(`voting opened for ${round.handle} at block ${block}`);
  }

  const { rows: ending } = await db.query(
    `SELECT id, handle FROM rounds.round
      WHERE visible AND settled_at IS NULL AND now() >= end_at`,
  );
  for (const round of ending) await settle(round);
}

/**
 * Awards go to the top proposals in vote order, earliest first on a tie. Re-runs
 * are harmless: the same ranking is written again.
 */
async function settle(round) {
  const connection = await db.connect();
  try {
    await connection.query("BEGIN");
    const { rows: awards } = await connection.query(
      `SELECT id, place FROM rounds.award WHERE round_id = $1 ORDER BY place FOR UPDATE`,
      [round.id],
    );
    const { rows: ranked } = await connection.query(
      `SELECT id FROM rounds.proposal
        WHERE round_id = $1 AND visible AND vote_count > 0
        ORDER BY vote_count DESC, created_at
        LIMIT $2`,
      [round.id, awards.length],
    );
    for (const [index, award] of awards.entries()) {
      await connection.query(`UPDATE rounds.award SET winner_proposal_id = $2 WHERE id = $1`, [
        award.id,
        ranked[index]?.id ?? null,
      ]);
    }
    await connection.query(
      `UPDATE rounds.round SET state = 'ended', settled_at = coalesce(settled_at, now()), updated_at = now()
        WHERE id = $1`,
      [round.id],
    );
    await connection.query("COMMIT");
    console.log(`${round.handle} settled with ${ranked.length}/${awards.length} awards claimed`);
  } catch (error) {
    await connection.query("ROLLBACK").catch(() => {});
    console.error(`could not settle ${round.handle}:`, error.message);
  } finally {
    connection.release();
  }
}

// ---------------------------------------------------------------------------
// Router

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://local");
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const segments = path.split("/").filter(Boolean);

  try {
    if (req.method === "OPTIONS") return send(req, res, 204, {});

    if (path === "/health" && req.method === "GET") {
      await db.query("SELECT 1");
      return send(req, res, 200, { ok: true, chainId: CHAIN_ID });
    }

    if (path === "/house" && req.method === "GET") {
      const { rows: [house] } = await db.query(
        `SELECT handle, name, description, image, treasury FROM rounds.house WHERE handle = $1`,
        [HOUSE_HANDLE],
      );
      const { rows: [totals] } = await db.query(
        `SELECT count(*)::int AS rounds,
                (SELECT count(*)::int FROM rounds.proposal WHERE visible) AS proposals,
                (SELECT count(DISTINCT voter)::int FROM rounds.vote) AS voters
           FROM rounds.round WHERE visible`,
      );
      return send(req, res, 200, { house, totals }, PUBLIC_CACHE);
    }

    if (segments[0] === "rounds" && segments.length === 1) {
      if (req.method === "GET") return send(req, res, 200, await listRounds(url), PUBLIC_CACHE);
      if (req.method === "POST") return send(req, res, 201, await createRound(req));
    }

    if (segments[0] === "rounds" && segments.length === 2 && req.method === "GET") {
      const round = await getRound(segments[1]);
      const [awards, proposals] = await Promise.all([awardsFor([round.id]), listProposals(round)]);
      return send(
        req,
        res,
        200,
        { round: shapeRound(round, { awards: awards.get(Number(round.id)) ?? [] }), proposals },
        PUBLIC_CACHE,
      );
    }

    if (segments[0] === "rounds" && segments.length === 3) {
      const [, handle, section] = segments;
      if (section === "proposals") {
        if (req.method === "GET") {
          return send(req, res, 200, { proposals: await listProposals(await getRound(handle)) }, PUBLIC_CACHE);
        }
        if (req.method === "POST") return send(req, res, 201, await addProposal(req, handle));
      }
      if (section === "activity" && req.method === "GET") {
        return send(req, res, 200, await listActivity(await getRound(handle), url), PUBLIC_CACHE);
      }
      if (section === "votes" && req.method === "POST") {
        return send(req, res, 201, await castVotes(req, handle));
      }
    }

    if (segments[0] === "rounds" && segments.length === 4 && segments[2] === "power" && req.method === "GET") {
      const round = await getRound(segments[1]);
      return send(req, res, 200, await getPower(round, segments[3]));
    }

    if (segments[0] === "proposals" && segments.length === 2) {
      if (req.method === "GET") {
        const { rows: [row] } = await db.query(
          `SELECT p.*, r.handle AS round_handle,
             (SELECT count(DISTINCT v.voter) FROM rounds.vote v WHERE v.proposal_id = p.id) AS voter_count,
             a.place
             FROM rounds.proposal p
             JOIN rounds.round r ON r.id = p.round_id
             LEFT JOIN rounds.award a ON a.winner_proposal_id = p.id
            WHERE p.id = $1 AND p.visible AND r.visible`,
          [Number(segments[1]) || 0],
        );
        if (!row) throw new HttpError(404, "No proposal with that id.");
        return send(req, res, 200, { proposal: shapeProposal(row) }, PUBLIC_CACHE);
      }
      if (req.method === "PUT") return send(req, res, 200, await editProposal(req, segments[1]));
    }

    send(req, res, 404, { error: "Not found" });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : 500;
    if (status === 500) console.error(`${req.method} ${path} failed:`, error);
    send(req, res, status, { error: status === 500 ? "Something went wrong. Try again." : error.message });
  }
});

await db.query(readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
await db.query(
  `INSERT INTO rounds.house (handle, name, description, image, treasury, admins)
   VALUES ($1, $2, $3, $4, $5, $6)
   ON CONFLICT (handle) DO UPDATE SET admins = EXCLUDED.admins`,
  [
    HOUSE_HANDLE,
    env.HOUSE_NAME || "Lil Nouns",
    env.HOUSE_DESCRIPTION ||
      "A Lil Nouns DAO funded house for open rounds. Anyone can propose, and every Lil Noun votes.",
    env.HOUSE_IMAGE || null,
    env.HOUSE_TREASURY || null,
    HOUSE_ADMINS,
  ],
);

// Nonces only need to outlive the signature window; a day is plenty of slack.
setInterval(() => {
  db.query(`DELETE FROM rounds.nonce WHERE created_at < now() - interval '1 day'`).catch(() => {});
}, 3_600_000).unref();

await tick().catch((error) => console.error("first tick failed:", error));
setInterval(() => tick().catch((error) => console.error("tick failed:", error)), TICK_MS);

server.listen(PORT, HOST, () => {
  console.log(`rounds-api listening on ${HOST}:${PORT} (chain ${CHAIN_ID}, house ${HOUSE_HANDLE})`);
});
