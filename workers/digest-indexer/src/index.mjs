#!/usr/bin/env node
/**
 * Digest indexer: tails the Lil Nouns subgraph, normalizes DAO activity into
 * `digest.event` rows, and serves a cached, paginated feed over HTTP.
 *
 * Cost model: one batched GraphQL request per poll (default 60s), only for rows
 * newer than each stream's cursor. Reads never touch the subgraph.
 */
import http from "node:http";
import { readFileSync } from "node:fs";
import pg from "pg";

const env = process.env;
const SUBGRAPH_URL =
  env.SUBGRAPH_URL ||
  "https://api.goldsky.com/api/public/project_cldjvjgtylso13swq3dre13sf/subgraphs/lil-nouns-subgraph/1.0.10/gn";
const DATABASE_URL = env.DATABASE_URL;
const PORT = Number(env.PORT || 3020);
const HOST = env.HOST || "127.0.0.1";
const POLL_MS = Number(env.POLL_MS || 60_000);
// Votes and proposal state refresh faster than everything else.
const FAST_POLL_MS = Number(env.FAST_POLL_MS || 30_000);
const FAST_STREAMS = new Set(["votes", "proposals"]);
const PAGE = 1000;
const BLOCK_SECONDS = 12;
const CLOSING_SOON_BLOCKS = Number(env.CLOSING_SOON_BLOCKS || 7200); // ~24h
const RECENT_PROPOSAL_BLOCKS = Number(env.RECENT_PROPOSAL_BLOCKS || 216_000); // ~30d
const CACHE_TTL_MS = Number(env.CACHE_TTL_MS || 15_000);
const ZERO = "0x0000000000000000000000000000000000000000";
// Mints come from RPC logs because the subgraph doesn't record mint transfers.
const RPC_URL = env.RPC_URL;
const TOKEN_ADDRESS = (env.TOKEN_ADDRESS || "0x4b10701Bfd7BFEdc47d50562b76b436fbB5BdB3B").toLowerCase();
const TOKEN_START_BLOCK = Number(env.TOKEN_START_BLOCK || 14736710);
const MINT_RANGE = Number(env.MINT_RANGE || 1000);
const MINT_BATCH = Number(env.MINT_BATCH || 20);
const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO_TOPIC = `0x${"0".repeat(64)}`;
const PROTOCOL = new Set(
  [
    ZERO,
    "0x4b10701bfd7bfedc47d50562b76b436fbb5bdb3b", // token
    "0x55e0f7a3bb39a28bd7bcc458e04b3cf00ad3219e", // auction house
    "0xa2587b1e2626904c8575640512b987bd3d3b592d", // VRGDA
    ...(env.PROTOCOL_ADDRESSES || "").split(","),
  ]
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean),
);

if (!DATABASE_URL) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const db = new pg.Pool({ connectionString: DATABASE_URL, max: 3 });

// ---------------------------------------------------------------------------
// Subgraph access

async function gql(query) {
  const res = await fetch(SUBGRAPH_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query }),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`subgraph HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(`subgraph: ${json.errors[0].message}`);
  return json.data;
}

/** Which root fields / entity fields this deployment has (V5 topics, VRGDA auctions). */
async function introspect() {
  const data = await gql(`{
    __schema { queryType { fields { name } } }
    auction: __type(name: "Auction") { fields { name } }
    proposal: __type(name: "Proposal") { fields { name } }
  }`);
  const roots = new Set(data.__schema.queryType.fields.map((f) => f.name));
  const auctionFields = new Set((data.auction?.fields ?? []).map((f) => f.name));
  const proposalFields = new Set((data.proposal?.fields ?? []).map((f) => f.name));
  return { roots, auctionFields, proposalFields };
}

async function rpc(body) {
  const res = await fetch(RPC_URL, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`rpc HTTP ${res.status}`);
  const json = await res.json();
  const results = Array.isArray(json) ? json : [json];
  const failed = results.find((r) => r.error);
  if (failed) throw new Error(`rpc: ${failed.error.message}`);
  return Array.isArray(json) ? json.sort((a, b) => a.id - b.id).map((r) => r.result) : json.result;
}

// ---------------------------------------------------------------------------
// Normalization helpers

const lower = (a) => (a ? String(a).toLowerCase() : undefined);
const isProtocol = (a) => !a || PROTOCOL.has(a.toLowerCase());
const urlId = (id) => {
  const [owner, ...slug] = id.split("-");
  return `${slug.join("-")}-${owner.slice(2)}`;
};

// nouns.camp conventions: "+1\n\n> quote" is a revote and
// "@handle\n\nbody\n\n> quote" is a reply. What's left is the voter's own reason.
const QUOTE = String.raw`((?:^>.*(?:\n|$))+)`;
const REVOTE_RE = new RegExp(String.raw`^\+1\n\n` + QUOTE, "gm");
// The app itself writes "@0x…\n\nreply\n> quote" (one newline before the quote).
const REPLY_RE = new RegExp(String.raw`^@(\S+)\n\n([\s\S]+?)\n\n?` + QUOTE, "gm");
const QUOTED_AFTER_RE = new RegExp(String.raw`([\s\S]*?)(?:\n\n|^)` + QUOTE, "gm");
const unquote = (block) => block.replace(/^> ?/gm, "").trim();

export function parseReason(reason) {
  if (!reason) return {};
  const replies = [];
  const revotes = [];
  let rest = reason.replace(REPLY_RE, (_, handle, body, quote) => {
    replies.push({ handle, body: body.trim(), quote: unquote(quote) });
    return "";
  });
  rest = rest.replace(REVOTE_RE, (_, quote) => {
    revotes.push({ quote: unquote(quote) });
    return "";
  });
  // Looser style common on Lil Nouns: "my reply\n\n> quoted reason".
  rest = rest.replace(QUOTED_AFTER_RE, (_, body, quote) => {
    const text = body.trim();
    if (!text) return "";
    replies.push({ body: text, quote: unquote(quote) });
    return "";
  });
  return {
    reason: rest.trim() || undefined,
    replies: replies.length ? replies : undefined,
    revotes: revotes.length ? revotes : undefined,
  };
}

/** Point each reply/revote at the earlier vote it quotes, on the same proposal. */
async function resolveQuoteTargets(events) {
  let changed = false;
  for (const e of events) {
    if (e.kind !== "vote") continue;
    for (const ref of [...(e.replies ?? []), ...(e.revotes ?? [])]) {
      if (ref.target && ref.targetSupport !== undefined) continue;
      const needle = ref.quote.split("\n")[0].slice(0, 80);
      if (!needle) continue;
      const { rows } = await db.query(
        `SELECT actor, (data->>'support')::int AS support FROM digest.event
         WHERE kind = 'vote' AND proposal_id = $1 AND ts <= $2 AND id <> $3
           AND position($4 in data->>'reason') > 0
         ORDER BY ts DESC LIMIT 1`,
        [e.proposalId, e.timestamp, e.id, needle],
      );
      if (rows[0]?.actor) {
        ref.target = rows[0].actor;
        ref.targetSupport = rows[0].support ?? undefined;
        changed = true;
      }
    }
  }
  return changed;
}

function makeTsOf(head) {
  return (block) => head.ts + (Number(block) - head.block) * BLOCK_SECONDS;
}

function quorumFor(p) {
  const totalSupply = BigInt(p.totalSupply || 0);
  const maxBps = BigInt(p.maxQuorumVotesBPS || 0);
  const coefficient = BigInt(p.quorumCoefficient || 0);
  if (maxBps > 0n && coefficient > 0n && totalSupply > 0n) {
    const againstBps = (BigInt(p.againstVotes) * 10_000n) / totalSupply;
    const adjusted = BigInt(p.minQuorumVotesBPS || 0) + (coefficient * againstBps) / 1_000_000n;
    const bps = adjusted < maxBps ? adjusted : maxBps;
    return (bps * totalSupply) / 10_000n;
  }
  return BigInt(p.quorumVotes || 0);
}

function proposalEvents(p, head) {
  const tsOf = makeTsOf(head);
  const base = {
    href: `/vote/${p.id}`,
    proposalId: p.id,
    proposalTitle: p.title,
  };
  const actor = lower(p.proposer?.id);
  const out = [
    { id: `proposal-created-${p.id}`, kind: "proposal-created", timestamp: Number(p.createdTimestamp), actor, ...base },
  ];
  const terminatedAt = Number(p.canceledTimestamp || p.vetoedTimestamp || 0) || Infinity;

  const startTs = tsOf(p.startBlock);
  if (head.block >= Number(p.startBlock) && startTs < terminatedAt) {
    out.push({ id: `voting-started-${p.id}`, kind: "voting-started", timestamp: startTs, ...base });
  }

  const endBlock = Math.max(Number(p.endBlock), Number(p.objectionPeriodEndBlock || 0));
  const soonBlock = endBlock - CLOSING_SOON_BLOCKS;
  if (head.block >= soonBlock && soonBlock > Number(p.startBlock) && tsOf(soonBlock) < terminatedAt) {
    out.push({ id: `closing-soon-${p.id}`, kind: "closing-soon", timestamp: tsOf(soonBlock), endsAt: tsOf(endBlock), ...base });
  }

  if (head.block > endBlock && tsOf(endBlock) < terminatedAt) {
    const forVotes = BigInt(p.forVotes);
    const passed = Boolean(p.queuedTimestamp) || (forVotes > BigInt(p.againstVotes) && forVotes >= quorumFor(p));
    out.push({
      id: `proposal-result-${p.id}`,
      kind: "proposal-concluded",
      conclusion: passed ? "passed" : "defeated",
      timestamp: tsOf(endBlock),
      voteWeight: Number(p.forVotes),
      support: Number(p.againstVotes),
      ...base,
    });
  }

  for (const [conclusion, field] of [
    ["queued", "queuedTimestamp"],
    ["executed", "executedTimestamp"],
    ["canceled", "canceledTimestamp"],
    ["vetoed", "vetoedTimestamp"],
  ]) {
    if (!p[field]) continue;
    out.push({ id: `proposal-${conclusion}-${p.id}`, kind: "proposal-concluded", conclusion, timestamp: Number(p[field]), ...base });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Streams: one per subgraph collection, each tailed by its own timestamp cursor.

function buildStreams({ roots, auctionFields, proposalFields: available }) {
  const hasVrgda = auctionFields.has("isVrgda");
  const auctionTs = auctionFields.has("settledTimestamp") ? "settledTimestamp" : "endTime";
  // Older deployments (pre-V3) lack objectionPeriodEndBlock and friends.
  const proposalFields = [
    "id", "title", "createdTimestamp", "createdBlock", "startBlock", "endBlock", "objectionPeriodEndBlock",
    "forVotes", "againstVotes", "quorumVotes", "totalSupply", "minQuorumVotesBPS", "maxQuorumVotesBPS",
    "quorumCoefficient", "queuedTimestamp", "executedTimestamp", "canceledTimestamp", "vetoedTimestamp",
  ].filter((f) => available.has(f)).join(" ") + " proposer { id }";

  const streams = [
    {
      name: "votes",
      root: "votes",
      tsField: "blockTimestamp",
      select: "id supportDetailed votes reason blockTimestamp voter { id } proposal { id title } nouns(first: 20) { id }",
      map: (v) => [{
        id: `vote-${v.id}`, kind: "vote", timestamp: Number(v.blockTimestamp), href: `/vote/${v.proposal.id}`,
        actor: lower(v.voter.id), support: v.supportDetailed, voteWeight: Number(v.votes) || 0,
        proposalId: v.proposal.id, proposalTitle: v.proposal.title, ...parseReason(v.reason),
        nounIds: v.nouns?.map((n) => n.id),
      }],
    },
    {
      name: "sales",
      root: "auctions",
      tsField: auctionTs,
      where: "settled: true",
      select: `id amount ${auctionTs} ${hasVrgda ? "isVrgda" : ""} bidder { id } noun { id }`,
      map: (a) => (a.bidder ? [{
        id: `sale-${a.id}`, kind: "sale", timestamp: Number(a[auctionTs]), href: "/",
        actor: lower(a.bidder.id), nounIds: [a.noun.id], amountWei: a.amount, isVrgda: Boolean(a.isVrgda),
      }] : []),
    },
    {
      name: "transfers",
      root: "transferEvents",
      tsField: "blockTimestamp",
      select: "id blockTimestamp noun { id } previousHolder { id } newHolder { id }",
      map: (t) => {
        const from = lower(t.previousHolder.id);
        const to = lower(t.newHolder.id);
        const timestamp = Number(t.blockTimestamp);
        if (from === ZERO) {
          return [{
            id: `mint-${t.id}`, kind: "mint", timestamp, href: `/explore?nounId=${t.noun.id}`,
            actor: isProtocol(to) ? undefined : to, nounIds: [t.noun.id],
          }];
        }
        if (isProtocol(from) || from === to) return [];
        return [{
          id: `transfer-${t.id}`, kind: "transfer", timestamp, href: `/profile/${to}`,
          actor: from, counterpart: to, nounIds: [t.noun.id],
        }];
      },
    },
    {
      name: "delegations",
      root: "delegationEvents",
      tsField: "blockTimestamp",
      select: "id blockTimestamp noun { id } previousDelegate { id } newDelegate { id }",
      map: (d) => {
        const from = lower(d.previousDelegate.id);
        const to = lower(d.newDelegate.id);
        if (isProtocol(from) || from === to) return [];
        return [{
          id: `delegate-${d.id}`, kind: "delegate", timestamp: Number(d.blockTimestamp), href: `/profile/${to}`,
          actor: from, counterpart: to, nounIds: [d.noun.id],
        }];
      },
    },
    {
      name: "proposals",
      root: "proposals",
      tsField: "createdTimestamp",
      select: proposalFields,
      map: proposalEvents,
    },
    {
      name: "proposalFeedbacks",
      root: "proposalFeedbacks",
      tsField: "createdTimestamp",
      select: "id support reason createdTimestamp voter { id } proposal { id title }",
      map: (f) => (f.proposal ? [{
        id: `proposal-feedback-${f.id}`, kind: "proposal-feedback", timestamp: Number(f.createdTimestamp),
        href: `/vote/${f.proposal.id}`, actor: lower(f.voter.id), support: f.support, reason: f.reason || undefined,
        proposalId: f.proposal.id, proposalTitle: f.proposal.title,
      }] : []),
    },
    {
      name: "candidates",
      root: "proposalCandidates",
      tsField: "lastUpdatedTimestamp",
      select: "id slug createdTimestamp lastUpdatedTimestamp latestVersion { content { title } }",
      map: (c) => {
        const title = c.latestVersion?.content?.title || c.slug;
        const base = { href: `/candidates/${urlId(c.id)}`, actor: lower(c.id.split("-")[0]), candidateId: c.id, candidateTitle: title };
        const created = Number(c.createdTimestamp);
        const updated = Number(c.lastUpdatedTimestamp);
        const out = [{ id: `candidate-created-${c.id}`, kind: "candidate-created", timestamp: created, ...base }];
        if (updated > created + 30) {
          out.push({ id: `candidate-updated-${c.id}-${updated}`, kind: "candidate-updated", timestamp: updated, ...base });
        }
        return out;
      },
    },
    {
      name: "candidateFeedbacks",
      root: "candidateFeedbacks",
      tsField: "createdTimestamp",
      select: "id support reason createdTimestamp voter { id } candidate { id slug latestVersion { content { title } } }",
      map: (f) => (f.candidate ? [{
        id: `candidate-feedback-${f.id}`, kind: "candidate-feedback", timestamp: Number(f.createdTimestamp),
        href: `/candidates/${urlId(f.candidate.id)}`, actor: lower(f.voter.id), support: f.support,
        reason: f.reason || undefined, candidateId: f.candidate.id,
        candidateTitle: f.candidate.latestVersion?.content?.title || f.candidate.slug,
      }] : []),
    },
    {
      name: "topics",
      root: "topics",
      tsField: "createdTimestamp",
      select: "id title createdTimestamp creator { id }",
      map: (t) => [{
        id: `topic-created-${t.id}`, kind: "topic-created", timestamp: Number(t.createdTimestamp),
        href: `/topics/${urlId(t.id)}`, actor: lower(t.creator?.id ?? t.id.split("-")[0]), topicId: t.id, topicTitle: t.title,
      }],
    },
    {
      name: "topicFeedbacks",
      root: "topicFeedbacks",
      tsField: "createdTimestamp",
      select: "id support reason createdTimestamp voter { id } topic { id title }",
      map: (f) => (f.topic ? [{
        id: `topic-feedback-${f.id}`, kind: "topic-feedback", timestamp: Number(f.createdTimestamp),
        href: `/topics/${urlId(f.topic.id)}`, actor: lower(f.voter.id), support: f.support,
        reason: f.reason || undefined, topicId: f.topic.id, topicTitle: f.topic.title,
      }] : []),
    },
  ];
  return streams.filter((s) => roots.has(s.root));
}

// ---------------------------------------------------------------------------
// Storage

let version = 0;

async function upsert(events) {
  if (!events.length) return 0;
  let changed = 0;
  for (let i = 0; i < events.length; i += 500) {
    const chunk = events.slice(i, i + 500);
    const values = [];
    const params = [];
    for (const e of chunk) {
      const dedupe = ["sale", "mint", "transfer", "delegate"].includes(e.kind) ? `${e.nounIds?.[0]}-${e.timestamp}` : null;
      const n = params.length;
      values.push(`($${n + 1},$${n + 2},$${n + 3},$${n + 4},$${n + 5},$${n + 6},$${n + 7})`);
      params.push(e.id, e.kind, e.timestamp, dedupe, e.actor ?? null, e.proposalId ?? null, JSON.stringify(e));
    }
    const res = await db.query(
      `INSERT INTO digest.event (id, kind, ts, dedupe_key, actor, proposal_id, data)
       VALUES ${values.join(",")}
       ON CONFLICT (id) DO UPDATE SET kind = EXCLUDED.kind, ts = EXCLUDED.ts, dedupe_key = EXCLUDED.dedupe_key,
         actor = EXCLUDED.actor, proposal_id = EXCLUDED.proposal_id, data = EXCLUDED.data, updated_at = now()
       WHERE digest.event.data IS DISTINCT FROM EXCLUDED.data
          OR digest.event.dedupe_key IS DISTINCT FROM EXCLUDED.dedupe_key`,
      params,
    );
    changed += res.rowCount;
  }
  if (changed) version++;
  return changed;
}

// ---------------------------------------------------------------------------
// Ingestion loop

const cursors = new Map(); // stream -> { ts, skip }
let head = null;
let lastIngestAt = 0;
let lastError = null;

async function loadCursors(streams) {
  const { rows } = await db.query("SELECT stream, ts FROM digest.cursor");
  const saved = new Map(rows.map((r) => [r.stream, Number(r.ts)]));
  for (const s of streams) cursors.set(s.name, { ts: saved.get(s.name) ?? 0, skip: 0 });
}

function streamQuery(s) {
  const c = cursors.get(s.name);
  const where = [`${s.tsField}_gte: "${c.ts}"`, s.where].filter(Boolean).join(", ");
  return `${s.name}: ${s.root}(first: ${PAGE}, skip: ${c.skip}, orderBy: ${s.tsField}, orderDirection: asc, where: { ${where} }) { ${s.select} }`;
}

async function tick(streams) {
  let pending = streams;
  let written = 0;
  while (pending.length) {
    const recent = head ? `recentProposals: proposals(first: 200, where: { createdBlock_gte: "${Math.max(0, head.block - RECENT_PROPOSAL_BLOCKS)}" }) { ${streams.find((s) => s.name === "proposals")?.select} }` : "";
    const data = await gql(`{ _meta { block { number timestamp } } ${pending.map(streamQuery).join("\n")} ${recent} }`);
    head = { block: Number(data._meta.block.number), ts: Number(data._meta.block.timestamp) };

    const events = [];
    const next = [];
    for (const s of pending) {
      const rows = data[s.name] ?? [];
      for (const row of rows) events.push(...s.map(row, head));
      const c = cursors.get(s.name);
      if (rows.length === PAGE) {
        const lastTs = Number(rows[rows.length - 1][s.tsField]);
        if (lastTs === c.ts) c.skip += PAGE;
        else cursors.set(s.name, { ts: lastTs, skip: rows.filter((r) => Number(r[s.tsField]) === lastTs).length });
        next.push(s);
      } else {
        // Caught up: re-read rows at the last timestamp next tick (cheap, idempotent).
        if (rows.length) cursors.set(s.name, { ts: Number(rows[rows.length - 1][s.tsField]), skip: 0 });
        else c.skip = 0;
      }
    }
    // Recent proposals are re-derived every tick so reminders and outcomes appear on time.
    const proposals = streams.find((s) => s.name === "proposals");
    for (const p of data.recentProposals ?? []) events.push(...proposals.map(p, head));

    const fresh = events.filter((e) => e.timestamp <= head.ts + 60);
    written += await upsert(fresh);
    // Second pass: targets may sit in this same batch, so resolve after the first write.
    if (await resolveQuoteTargets(fresh)) written += await upsert(fresh.filter((e) => e.kind === "vote"));
    pending = next;
  }

  await db.query(
    `INSERT INTO digest.cursor (stream, ts) SELECT * FROM unnest($1::text[], $2::bigint[])
     ON CONFLICT (stream) DO UPDATE SET ts = EXCLUDED.ts, updated_at = now()`,
    [[...cursors.keys()], [...cursors.values()].map((c) => c.ts)],
  );
  await db.query(
    `INSERT INTO digest.head (id, block, ts) VALUES (1, $1, $2)
     ON CONFLICT (id) DO UPDATE SET block = EXCLUDED.block, ts = EXCLUDED.ts, updated_at = now()`,
    [head.block, head.ts],
  );
  lastIngestAt = Date.now();
  return written;
}

const hex = (n) => `0x${n.toString(16)}`;

// Goldsky Edge caps eth_getLogs at 1,000 blocks, so send many small ranges per HTTP batch.
async function getMintLogs(from, to) {
  const calls = [];
  for (let start = from, id = 0; start <= to; start += MINT_RANGE, id++) {
    calls.push({
      jsonrpc: "2.0", id, method: "eth_getLogs",
      params: [{
        address: TOKEN_ADDRESS, topics: [TRANSFER_TOPIC, ZERO_TOPIC],
        fromBlock: hex(start), toBlock: hex(Math.min(start + MINT_RANGE - 1, to)),
      }],
    });
  }
  return (await rpc(calls)).flat();
}

async function tickMints() {
  if (!RPC_URL || !head) return 0;
  const saved = await db.query("SELECT ts FROM digest.cursor WHERE stream = 'mints'");
  let from = saved.rows[0] ? Number(saved.rows[0].ts) + 1 : TOKEN_START_BLOCK;
  let written = 0;
  while (from <= head.block) {
    const to = Math.min(from + MINT_RANGE * MINT_BATCH - 1, head.block);
    const logs = await getMintLogs(from, to);
    const blocks = [...new Set(logs.map((l) => l.blockNumber))];
    const timestamps = new Map();
    for (let i = 0; i < blocks.length; i += 50) {
      const batch = blocks.slice(i, i + 50);
      const results = await rpc(batch.map((b, id) => ({ jsonrpc: "2.0", id, method: "eth_getBlockByNumber", params: [b, false] })));
      batch.forEach((b, j) => timestamps.set(b, Number(results[j].timestamp)));
    }
    written += await upsert(logs.map((l) => {
      const nounId = BigInt(l.topics[3]).toString();
      const to = `0x${l.topics[2].slice(26)}`;
      return {
        id: `mint-${l.transactionHash}_${Number(l.logIndex)}`, kind: "mint", timestamp: timestamps.get(l.blockNumber),
        href: `/explore?nounId=${nounId}`, actor: isProtocol(to) ? undefined : to, nounIds: [nounId],
      };
    }));
    await db.query(
      `INSERT INTO digest.cursor (stream, ts) VALUES ('mints', $1)
       ON CONFLICT (stream) DO UPDATE SET ts = EXCLUDED.ts, updated_at = now()`,
      [to],
    );
    from = to + 1;
  }
  return written;
}

async function runIndexer() {
  const streams = buildStreams(await introspect());
  await loadCursors(streams);
  console.log(`indexing ${streams.map((s) => s.name).join(", ")}${RPC_URL ? ", mints" : ""} from ${SUBGRAPH_URL}`);
  const fast = streams.filter((s) => FAST_STREAMS.has(s.name));
  const slowEvery = Math.max(1, Math.round(POLL_MS / FAST_POLL_MS));
  for (let i = 0; ; i++) {
    const started = Date.now();
    const full = i % slowEvery === 0;
    try {
      const written = full ? (await tick(streams)) + (await tickMints()) : await tick(fast);
      lastError = null;
      if (written) console.log(`block ${head.block}: ${written} events written in ${Date.now() - started}ms`);
    } catch (err) {
      lastError = String(err?.message || err);
      console.error("tick failed:", lastError);
    }
    await new Promise((r) => setTimeout(r, FAST_POLL_MS));
  }
}

// ---------------------------------------------------------------------------
// Read API

const FILTER_KINDS = {
  proposals: ["vote", "proposal-created", "voting-started", "closing-soon", "proposal-concluded", "proposal-feedback"],
  votes: ["vote"],
  candidates: ["candidate-created", "candidate-updated", "candidate-feedback"],
  topics: ["topic-created", "topic-feedback"],
  market: ["sale", "mint", "transfer"],
  delegates: ["delegate"],
};

const CLUSTER_KINDS = new Set(["transfer", "delegate", "mint"]);
const CLUSTER_WINDOW = Number(env.CLUSTER_WINDOW_SECONDS || 1800);

/**
 * Merge bursts from one account (e.g. a wallet moving 4 nouns to 2 addresses)
 * into a single row, even when other events are interleaved.
 */
function clusterEvents(events) {
  const out = [];
  const open = new Map(); // `${kind}:${actor}` -> cluster
  for (const e of events) {
    const key = `${e.kind}:${e.actor ?? ""}`;
    const cluster = CLUSTER_KINDS.has(e.kind) ? open.get(key) : undefined;
    if (cluster && cluster.oldest - e.timestamp <= CLUSTER_WINDOW) {
      cluster.event.nounIds = [...new Set([...(cluster.event.nounIds ?? []), ...(e.nounIds ?? [])])];
      if (e.counterpart && !cluster.event.counterparts.includes(e.counterpart)) {
        cluster.event.counterparts.push(e.counterpart);
      }
      cluster.oldest = e.timestamp;
      continue;
    }
    const copy = { ...e, counterparts: e.counterpart ? [e.counterpart] : [] };
    out.push(copy);
    if (CLUSTER_KINDS.has(e.kind)) open.set(key, { event: copy, oldest: e.timestamp });
  }
  return out.map(({ counterparts, ...e }) => (counterparts.length > 1 ? { ...e, counterparts } : e));
}

/** How often each vote on the page was revoted or replied to. */
async function attachThreadCounts(events) {
  const votes = events.filter((e) => e.kind === "vote" && e.reason && e.actor);
  if (!votes.length) return;
  const { rows } = await db.query(
    `SELECT p.pid, p.actor,
       count(*) FILTER (WHERE e.data->'revotes' @> jsonb_build_array(jsonb_build_object('target', p.actor)))::int AS reposts,
       count(*) FILTER (WHERE e.data->'replies' @> jsonb_build_array(jsonb_build_object('target', p.actor)))::int AS replies
     FROM unnest($1::text[], $2::text[]) AS p(pid, actor)
     JOIN digest.event e ON e.kind = 'vote' AND e.proposal_id = p.pid
     GROUP BY p.pid, p.actor`,
    [votes.map((v) => v.proposalId), votes.map((v) => v.actor)],
  );
  const counts = new Map(rows.map((r) => [`${r.pid}:${r.actor}`, r]));
  // Reply/revote only make sense while the proposal can still be voted on.
  const closed = await db.query(
    `SELECT DISTINCT proposal_id FROM digest.event
     WHERE proposal_id = ANY($1)
       AND (id LIKE 'proposal-result-%' OR id LIKE 'proposal-canceled-%' OR id LIKE 'proposal-vetoed-%')`,
    [[...new Set(votes.map((v) => v.proposalId))]],
  );
  const closedIds = new Set(closed.rows.map((r) => r.proposal_id));
  for (const vote of votes) {
    const row = counts.get(`${vote.proposalId}:${vote.actor}`);
    if (row?.reposts) vote.repostCount = row.reposts;
    if (row?.replies) vote.replyCount = row.replies;
    vote.votingOpen = !closedIds.has(vote.proposalId);
  }
}

async function readFeed(params) {
  const limit = Math.min(Math.max(Number(params.get("limit")) || 50, 1), 200);
  const where = ["e.ts <= $1"];
  // Use chain time too: the VPS clock can lag the chain and hide fresh events.
  const args = [Math.max(Math.floor(Date.now() / 1000), head?.ts ?? 0) + 60];
  const kinds = FILTER_KINDS[params.get("filter")];
  if (kinds) {
    args.push(kinds);
    where.push(`e.kind = ANY($${args.length})`);
  }
  const actor = params.get("actor");
  if (actor) {
    args.push(actor.toLowerCase());
    where.push(`e.actor = $${args.length}`);
  }
  const q = params.get("q")?.trim();
  if (q) {
    args.push(`%${q.replace(/[%_\\]/g, "\\$&")}%`);
    where.push(`e.data::text ILIKE $${args.length}`);
  }
  const [cursorTs, ...cursorId] = (params.get("cursor") || "").split(":");
  if (cursorTs && cursorId.length) {
    args.push(Number(cursorTs), cursorId.join(":"));
    where.push(`(e.ts, e.id) < ($${args.length - 1}, $${args.length})`);
  }
  args.push(limit);
  const { rows } = await db.query(
    `SELECT e.id, e.ts, e.data FROM digest.event e
     WHERE ${where.join(" AND ")}
       AND NOT (e.kind IN ('mint', 'transfer') AND EXISTS (
         SELECT 1 FROM digest.event s WHERE s.kind = 'sale' AND s.dedupe_key = e.dedupe_key))
       -- Votes follow the token, so a transfer/sale/mint also emits a delegation; hide that echo.
       AND NOT (e.kind = 'delegate' AND EXISTS (
         SELECT 1 FROM digest.event s WHERE s.kind IN ('sale', 'mint', 'transfer') AND s.dedupe_key = e.dedupe_key))
     ORDER BY e.ts DESC, e.id DESC LIMIT $${args.length}`,
    args,
  );
  const last = rows[rows.length - 1];
  const events = rows.map((r) => r.data);
  await attachThreadCounts(events);
  return {
    events: clusterEvents(events),
    nextCursor: rows.length === limit && last ? `${last.ts}:${last.id}` : null,
    head,
  };
}

const cache = new Map(); // query string -> { version, at, body }

function send(res, status, body, extra = {}) {
  res.writeHead(status, {
    "content-type": "application/json",
    "access-control-allow-origin": "*",
    ...extra,
  });
  res.end(body);
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  if (req.method === "OPTIONS") return send(res, 204, "", { "access-control-allow-methods": "GET" });
  if (req.method !== "GET") return send(res, 405, '{"error":"method not allowed"}');

  if (url.pathname.endsWith("/health")) {
    const lagSeconds = head ? Math.floor(Date.now() / 1000) - head.ts : null;
    const healthy = Date.now() - lastIngestAt < POLL_MS * 5;
    return send(res, healthy ? 200 : 503, JSON.stringify({ ok: healthy, head, lagSeconds, lastError }));
  }

  if (url.pathname.replace(/\/$/, "").endsWith("/digest")) {
    const key = url.searchParams.toString();
    const hit = cache.get(key);
    const headers = { "cache-control": "public, max-age=15, s-maxage=30, stale-while-revalidate=120" };
    if (hit && hit.version === version && Date.now() - hit.at < CACHE_TTL_MS) {
      return send(res, 200, hit.body, { ...headers, "x-cache": "hit" });
    }
    try {
      const body = JSON.stringify(await readFeed(url.searchParams));
      if (cache.size > 500) cache.clear();
      cache.set(key, { version, at: Date.now(), body });
      return send(res, 200, body, { ...headers, "x-cache": "miss" });
    } catch (err) {
      console.error("read failed:", err);
      return send(res, 500, '{"error":"internal"}');
    }
  }

  send(res, 404, '{"error":"not found"}');
});

await db.query(readFileSync(new URL("../schema.sql", import.meta.url), "utf8"));
const headRow = await db.query("SELECT block, ts FROM digest.head WHERE id = 1");
if (headRow.rows[0]) head = { block: Number(headRow.rows[0].block), ts: Number(headRow.rows[0].ts) };
server.listen(PORT, HOST, () => console.log(`digest API on http://${HOST}:${PORT}/digest`));
runIndexer();
