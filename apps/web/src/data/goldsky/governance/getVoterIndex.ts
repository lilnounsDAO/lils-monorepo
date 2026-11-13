import { graphQLFetch } from "@/data/utils/graphQLFetch";
import { CHAIN_CONFIG } from "@/config";
import { Address, getAddress, parseAbi, zeroAddress } from "viem";

// 0 = against, 1 = for, 2 = abstain (matches the governor's support values)
export type VoteSupport = 0 | 1 | 2;

export interface VoterStats {
  address: Address;
  /** Primary ENS name, verified forward; null when none is set */
  ensName: string | null;
  /** Votes delegated to this address right now (what they'd bring to a proposal created today) */
  currentVotes: number;
  /** Lil Nouns held, whoever they're delegated to */
  tokenBalance: number;
  /** Who this holder's votes go to, when it isn't themselves */
  delegate: Address | null;
  /** All-time proposals voted on */
  propsVoted: number;
  /** Proposals voted on out of the most recent `recentProposalCount` that got votes */
  recentPropsVoted: number;
  lastVotedAt: number;
  counts: Record<VoteSupport, number>;
  /** Null for holders and delegates who have never voted */
  mostFrequent: VoteSupport | null;
}

const PAGE_SIZE = 1000;

// Every query here paginates by id rather than skip, which subgraphs cap
const votesQuery = `
  query AllVotes($first: Int!, $lastId: ID!) {
    votes(first: $first, orderBy: id, orderDirection: asc, where: { id_gt: $lastId }) {
      id
      voter {
        id
      }
      proposal {
        id
      }
      supportDetailed
      votes
      blockTimestamp
    }
  }
`;

const delegatesQuery = `
  query Delegates($first: Int!, $lastId: ID!) {
    delegates(first: $first, orderBy: id, orderDirection: asc, where: { id_gt: $lastId, delegatedVotes_gt: 0 }) {
      id
      delegatedVotes
    }
  }
`;

const holdersQuery = `
  query Holders($first: Int!, $lastId: ID!) {
    accounts(first: $first, orderBy: id, orderDirection: asc, where: { id_gt: $lastId, tokenBalance_gt: 0 }) {
      id
      tokenBalance
      delegate {
        id
      }
    }
  }
`;

interface VoteRow {
  id: string;
  voter: { id: string };
  proposal: { id: string };
  supportDetailed: number;
  votes: string;
  blockTimestamp: string;
}

interface DelegateRow {
  id: string;
  delegatedVotes: string;
}

interface HolderRow {
  id: string;
  tokenBalance: string;
  delegate: { id: string } | null;
}

// ENS's ReverseRecords: primary names for many addresses in one call, each
// checked against its forward record, so a spoofed reverse record reads as "".
const REVERSE_RECORDS = "0x3671aE578E63FdF66ad4F3E12CC0c0d71Ac7510C" as const;
const reverseRecordsAbi = parseAbi([
  "function getNames(address[] addresses) view returns (string[] r)",
]);
const ENS_BATCH = 300;

// Tokens sent here are burned: they count as held and self-delegated, but no
// one can ever cast those votes
const BURN_ADDRESSES = new Set([
  zeroAddress,
  "0x0000000000000000000000000000000000000001",
  "0x000000000000000000000000000000000000dead",
]);

async function fetchWithFallback<T>(
  query: string,
  variables: Record<string, unknown>,
): Promise<T | null> {
  for (const url of [
    CHAIN_CONFIG.goldskyUrl.primary,
    CHAIN_CONFIG.goldskyUrl.fallback,
  ]) {
    try {
      const data = (await graphQLFetch(url, query, variables, {
        cache: "no-cache",
      })) as T | null;
      if (data) return data;
    } catch (e) {
      console.warn("Goldsky request failed", e);
    }
  }
  return null;
}

async function fetchAll<T extends { id: string }>(
  query: string,
  key: string,
): Promise<T[]> {
  const all: T[] = [];
  let lastId = "";
  for (;;) {
    const data = await fetchWithFallback<Record<string, T[]>>(query, {
      first: PAGE_SIZE,
      lastId,
    });
    if (!data) throw new Error(`Couldn't load ${key}`);
    const page = data[key] ?? [];
    all.push(...page);
    if (page.length < PAGE_SIZE) break;
    lastId = page[page.length - 1].id;
  }
  return all;
}

/** Primary ENS names by lowercase address; a failed batch just leaves its addresses unnamed. */
export async function fetchEnsNames(addresses: string[]): Promise<Map<string, string>> {
  const batches: string[][] = [];
  for (let i = 0; i < addresses.length; i += ENS_BATCH) {
    batches.push(addresses.slice(i, i + ENS_BATCH));
  }
  const names = new Map<string, string>();
  await Promise.all(
    batches.map(async (batch) => {
      try {
        const result = await CHAIN_CONFIG.publicClient.readContract({
          address: REVERSE_RECORDS,
          abi: reverseRecordsAbi,
          functionName: "getNames",
          args: [batch as Address[]],
        });
        result.forEach((name, i) => {
          if (name) names.set(batch[i].toLowerCase(), name);
        });
      } catch (e) {
        console.warn("ENS batch lookup failed", e);
      }
    }),
  );
  return names;
}

/**
 * Everyone who could weigh in on a proposal: every past voter, every delegate
 * holding votes and every holder, with how they usually vote, how active
 * they've been on the most recent proposals and how many votes they hold now.
 */
export async function getVoterIndex(
  recentProposalCount: number = 20,
): Promise<VoterStats[]> {
  const [votes, delegates, holders] = await Promise.all([
    fetchAll<VoteRow>(votesQuery, "votes"),
    fetchAll<DelegateRow>(delegatesQuery, "delegates"),
    fetchAll<HolderRow>(holdersQuery, "accounts"),
  ]);

  const recentProposals = new Set(
    Array.from(new Set(votes.map((v) => v.proposal.id)))
      .sort((a, b) => Number(b) - Number(a))
      .slice(0, recentProposalCount),
  );

  const history = new Map<
    string,
    {
      props: Set<string>;
      recent: Set<string>;
      lastVotedAt: number;
      counts: Record<VoteSupport, number>;
    }
  >();
  for (const vote of votes) {
    if (Number(vote.votes) === 0) continue;
    const support = vote.supportDetailed as VoteSupport;
    if (support !== 0 && support !== 1 && support !== 2) continue;
    const id = vote.voter.id.toLowerCase();
    const entry = history.get(id) ?? {
      props: new Set<string>(),
      recent: new Set<string>(),
      lastVotedAt: 0,
      counts: { 0: 0, 1: 0, 2: 0 },
    };
    entry.props.add(vote.proposal.id);
    if (recentProposals.has(vote.proposal.id)) entry.recent.add(vote.proposal.id);
    entry.lastVotedAt = Math.max(entry.lastVotedAt, Number(vote.blockTimestamp));
    entry.counts[support] += 1;
    history.set(id, entry);
  }

  const currentVotes = new Map(
    delegates.map((d) => [d.id.toLowerCase(), Number(d.delegatedVotes)] as const),
  );
  const holdings = new Map(
    holders.map((h) => [h.id.toLowerCase(), h] as const),
  );

  const ids = Array.from(
    new Set([...history.keys(), ...currentVotes.keys(), ...holdings.keys()]),
  ).filter((id) => !BURN_ADDRESSES.has(id));

  const ensNames = await fetchEnsNames(ids);

  return ids.map((id) => {
    const past = history.get(id);
    const holding = holdings.get(id);
    const counts = past?.counts ?? { 0: 0, 1: 0, 2: 0 };
    const delegateId = holding?.delegate?.id.toLowerCase();
    return {
      address: getAddress(id),
      ensName: ensNames.get(id) ?? null,
      currentVotes: currentVotes.get(id) ?? 0,
      tokenBalance: holding ? Number(holding.tokenBalance) : 0,
      delegate: delegateId && delegateId !== id ? getAddress(delegateId) : null,
      propsVoted: past?.props.size ?? 0,
      recentPropsVoted: past?.recent.size ?? 0,
      lastVotedAt: past?.lastVotedAt ?? 0,
      counts,
      // Ties resolve for > against > abstain
      mostFrequent: past
        ? ([1, 0, 2] as VoteSupport[]).reduce((best, s) =>
            counts[s] > counts[best] ? s : best,
          )
        : null,
    };
  });
}
