/**
 * Who may propose, and how much a vote weighs.
 *
 * Both strategies live on the round as JSONB, so a round's rules are fixed when
 * it is created and the same rules are replayed for every later read.
 */
import { getAddress } from "viem";

export const VOTES_ABI = [
  {
    type: "function",
    name: "getCurrentVotes",
    stateMutability: "view",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ type: "uint96" }],
  },
  {
    type: "function",
    name: "getPriorVotes",
    stateMutability: "view",
    inputs: [
      { name: "account", type: "address" },
      { name: "blockNumber", type: "uint256" },
    ],
    outputs: [{ type: "uint96" }],
  },
];

export const DEFAULT_PROPOSE_STRATEGY = { type: "open" };
export const DEFAULT_VOTE_STRATEGY = { type: "lil-nouns-votes", multiplier: 1 };

function lowerEntries(entries) {
  const map = new Map();
  if (Array.isArray(entries)) {
    for (const entry of entries) map.set(String(entry).toLowerCase(), 1n);
  } else if (entries && typeof entries === "object") {
    for (const [address, votes] of Object.entries(entries)) {
      map.set(address.toLowerCase(), BigInt(votes));
    }
  }
  return map;
}

/** Delegated Lil Nouns votes, at the round's snapshot block once it has one. */
async function lilNounsVotes({ client, token, address, block }) {
  if (block) {
    return client.readContract({
      address: token,
      abi: VOTES_ABI,
      functionName: "getPriorVotes",
      args: [getAddress(address), BigInt(block)],
    });
  }
  return client.readContract({
    address: token,
    abi: VOTES_ABI,
    functionName: "getCurrentVotes",
    args: [getAddress(address)],
  });
}

/**
 * Voting power for one wallet in one round. Returns 0n when the wallet is not
 * eligible; the caller turns that into a 403.
 */
export async function votingPower({ strategy, chain, address, block }) {
  const rules = strategy ?? DEFAULT_VOTE_STRATEGY;
  const wallet = address.toLowerCase();

  // Imported rounds are read-only: their voting power came from a platform we
  // do not run, so nobody gets any here.
  if (rules.type === "archive") return 0n;

  if (rules.type === "allowlist") {
    return lowerEntries(rules.entries).get(wallet) ?? 0n;
  }

  if (rules.type === "fixed") {
    const min = BigInt(rules.min ?? 0);
    if (min > 0n) {
      const votes = await lilNounsVotes({ ...chain, address, block });
      if (votes < min) return 0n;
    }
    return BigInt(rules.votes ?? 1);
  }

  // lil-nouns-votes
  const votes = await lilNounsVotes({ ...chain, address, block });
  if (votes < BigInt(rules.min ?? 1)) return 0n;
  return votes * BigInt(rules.multiplier ?? 1);
}

/** Whether a wallet may add a proposal to a round. */
export async function canPropose({ strategy, chain, address }) {
  const rules = strategy ?? DEFAULT_PROPOSE_STRATEGY;
  const wallet = address.toLowerCase();

  if (rules.type === "archive") return false;
  if (rules.type === "allowlist") return lowerEntries(rules.entries).has(wallet);
  if (rules.type === "open") return true;

  // lil-nouns-votes
  const votes = await lilNounsVotes({ ...chain, address });
  return votes >= BigInt(rules.min ?? 1);
}

/** Human-readable rules for the round page, so the UI needn't know the shapes. */
export function describeStrategy(strategy, kind) {
  const rules = strategy ?? (kind === "propose" ? DEFAULT_PROPOSE_STRATEGY : DEFAULT_VOTE_STRATEGY);
  const verb = kind === "propose" ? "propose" : "vote";

  if (rules.type === "archive") {
    const where = rules.platform ? `on ${rules.platform}` : "elsewhere";
    return `Archived round, run ${where}`;
  }
  if (rules.type === "open") return "Anyone can propose";
  if (rules.type === "allowlist") {
    const count = Array.isArray(rules.entries)
      ? rules.entries.length
      : Object.keys(rules.entries ?? {}).length;
    return `${count} allowlisted ${count === 1 ? "wallet" : "wallets"} can ${verb}`;
  }
  if (rules.type === "fixed") {
    const votes = Number(rules.votes ?? 1);
    const gate = Number(rules.min ?? 0) > 0 ? " for Lil Nouns holders" : "";
    return `${votes} ${votes === 1 ? "vote" : "votes"} per wallet${gate}`;
  }

  const min = Number(rules.min ?? 1);
  const multiplier = Number(rules.multiplier ?? 1);
  if (kind === "propose") {
    return `Wallets with ${min}+ Lil Nouns ${min === 1 ? "vote" : "votes"} can propose`;
  }
  return multiplier === 1
    ? "1 vote per Lil Noun delegated"
    : `${multiplier} votes per Lil Noun delegated`;
}

export function normalizeStrategy(strategy, kind) {
  const fallback = kind === "propose" ? DEFAULT_PROPOSE_STRATEGY : DEFAULT_VOTE_STRATEGY;
  if (!strategy || typeof strategy !== "object") return fallback;

  const type = String(strategy.type ?? "");
  const allowed =
    kind === "propose"
      ? ["open", "allowlist", "lil-nouns-votes"]
      : ["lil-nouns-votes", "fixed", "allowlist"];
  // `archive` is written by the importer, never accepted from a request.
  if (!allowed.includes(type)) return fallback;

  if (type === "allowlist") {
    const entries = lowerEntries(strategy.entries);
    if (entries.size === 0) return fallback;
    return { type, entries: Object.fromEntries([...entries].map(([k, v]) => [k, String(v)])) };
  }
  if (type === "fixed") {
    return {
      type,
      votes: String(BigInt(strategy.votes ?? 1)),
      min: String(BigInt(strategy.min ?? 0)),
    };
  }
  if (type === "open") return { type };
  return {
    type,
    min: String(BigInt(strategy.min ?? 1)),
    ...(kind === "vote" && { multiplier: Number(strategy.multiplier ?? 1) }),
  };
}
