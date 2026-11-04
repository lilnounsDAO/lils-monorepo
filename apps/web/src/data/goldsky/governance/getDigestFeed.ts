import { graphQLFetch } from "@/data/utils/graphQLFetch";
import { CHAIN_CONFIG } from "@/config";
import { Address, getAddress, zeroAddress } from "viem";
import { isDaoVersion5 } from "@/utils/daoVersion";
import { makeUrlId } from "./getProposalIdeas";
import { makeTopicUrlId } from "./getTopics";

const FEED_BATCH = 50;
const ZERO = zeroAddress.toLowerCase();

export type DigestFeedFilter =
  | "all"
  | "proposals"
  | "votes"
  | "candidates"
  | "topics"
  | "market"
  | "delegates";

export type DigestEventKind =
  | "vote"
  | "proposal-created"
  | "voting-started"
  | "closing-soon"
  | "proposal-concluded"
  | "proposal-feedback"
  | "candidate-created"
  | "candidate-updated"
  | "candidate-feedback"
  | "topic-created"
  | "topic-feedback"
  | "sale"
  | "mint"
  | "transfer"
  | "delegate";

export type DigestConclusion =
  | "passed"
  | "queued"
  | "defeated"
  | "canceled"
  | "vetoed"
  | "executed";

export interface DigestEvent {
  id: string;
  kind: DigestEventKind;
  timestamp: number;
  href: string;
  actor?: Address;
  counterpart?: Address;
  nounIds?: string[];
  amountWei?: string;
  isVrgda?: boolean;
  support?: number;
  voteWeight?: number;
  proposalId?: string;
  proposalTitle?: string;
  candidateId?: string;
  candidateTitle?: string;
  topicId?: string;
  topicTitle?: string;
  reason?: string;
  conclusion?: DigestConclusion;
  endsAt?: number;
  /** Set when a clustered row went to more than one account. */
  counterparts?: Address[];
  replies?: DigestQuote[];
  revotes?: DigestQuote[];
  repostCount?: number;
  replyCount?: number;
  /** Set by the indexer: the proposal can still be voted on. */
  votingOpen?: boolean;
}

export interface DigestQuote {
  quote: string;
  body?: string;
  handle?: string;
  target?: Address;
  targetSupport?: number;
}

export interface DigestPage {
  events: DigestEvent[];
  nextCursor: string | null;
}

const coreQuery = `
  query GetDigestCore($first: Int!) {
    votes(first: $first, orderBy: blockTimestamp, orderDirection: desc) {
      id
      voter { id }
      supportDetailed
      votes
      reason
      blockTimestamp
      proposal { id title }
      nouns(first: 8) { id }
    }
    auctions(
      first: $first
      orderBy: settledTimestamp
      orderDirection: desc
      where: { settled: true }
    ) {
      id
      amount
      settledTimestamp
      isVrgda
      bidder { id }
      noun { id }
    }
    transferEvents(first: $first, orderBy: blockTimestamp, orderDirection: desc) {
      id
      noun { id }
      previousHolder { id }
      newHolder { id }
      blockTimestamp
    }
    delegationEvents(first: $first, orderBy: blockTimestamp, orderDirection: desc) {
      id
      noun { id }
      previousDelegate { id }
      newDelegate { id }
      blockTimestamp
    }
    proposals(first: $first, orderBy: createdTimestamp, orderDirection: desc) {
      id
      title
      proposer { id }
      createdTimestamp
      createdBlock
      startBlock
      endBlock
      status
      forVotes
      againstVotes
    }
  }
`;

const extrasQuery = `
  query GetDigestExtras($first: Int!) {
    proposalCandidates(first: $first, orderBy: lastUpdatedTimestamp, orderDirection: desc) {
      id
      slug
      createdTimestamp
      lastUpdatedTimestamp
      canceled
      latestVersion { content { title } }
    }
    topics(first: $first, orderBy: createdTimestamp, orderDirection: desc) {
      id
      slug
      title
      createdTimestamp
      canceled
      creator { id }
    }
    candidateFeedbacks(first: $first, orderBy: createdTimestamp, orderDirection: desc) {
      id
      voter { id }
      support
      reason
      createdTimestamp
      candidate { id slug latestVersion { content { title } } }
    }
    proposalFeedbacks(first: $first, orderBy: createdTimestamp, orderDirection: desc) {
      id
      voter { id }
      support
      reason
      createdTimestamp
      proposal { id title }
    }
    topicFeedbacks(first: $first, orderBy: createdTimestamp, orderDirection: desc) {
      id
      voter { id }
      support
      reason
      createdTimestamp
      topic { id slug title }
    }
  }
`;

interface AccountRef {
  id: string;
}

interface CoreResponse {
  votes?: Array<{
    id: string;
    voter: AccountRef;
    supportDetailed: number;
    votes: string;
    reason?: string | null;
    blockTimestamp: string;
    proposal: { id: string; title: string };
    nouns?: Array<{ id: string }>;
  }>;
  auctions?: Array<{
    id: string;
    amount: string;
    settledTimestamp?: string | null;
    isVrgda: boolean;
    bidder?: AccountRef | null;
    noun: { id: string };
  }>;
  transferEvents?: Array<{
    id: string;
    noun: { id: string };
    previousHolder: AccountRef;
    newHolder: AccountRef;
    blockTimestamp: string;
  }>;
  delegationEvents?: Array<{
    id: string;
    noun: { id: string };
    previousDelegate: AccountRef;
    newDelegate: AccountRef;
    blockTimestamp: string;
  }>;
  proposals?: Array<{
    id: string;
    title: string;
    proposer: AccountRef;
    createdTimestamp: string;
    createdBlock: string;
    startBlock: string;
    endBlock: string;
    status: string;
    forVotes: string;
    againstVotes: string;
  }>;
}

interface ExtrasResponse {
  proposalCandidates?: Array<{
    id: string;
    slug: string;
    createdTimestamp: string;
    lastUpdatedTimestamp: string;
    canceled: boolean;
    latestVersion?: { content?: { title?: string | null } | null } | null;
  }>;
  topics?: Array<{
    id: string;
    slug: string;
    title: string;
    createdTimestamp: string;
    canceled: boolean;
    creator?: AccountRef | null;
  }>;
  candidateFeedbacks?: Array<{
    id: string;
    voter: AccountRef;
    support: number;
    reason?: string | null;
    createdTimestamp: string;
    candidate?: {
      id: string;
      slug?: string;
      latestVersion?: { content?: { title?: string | null } | null } | null;
    } | null;
  }>;
  proposalFeedbacks?: Array<{
    id: string;
    voter: AccountRef;
    support: number;
    reason?: string | null;
    createdTimestamp: string;
    proposal?: { id: string; title: string } | null;
  }>;
  topicFeedbacks?: Array<{
    id: string;
    voter: AccountRef;
    support: number;
    reason?: string | null;
    createdTimestamp: string;
    topic?: { id: string; slug?: string; title: string } | null;
  }>;
}

function toAddress(id?: string | null): Address | undefined {
  if (!id) return undefined;
  try {
    return getAddress(id);
  } catch {
    return undefined;
  }
}

function protocolAddresses(): Set<string> {
  const addrs = CHAIN_CONFIG.addresses;
  return new Set(
    [
      ZERO,
      addrs.lilVRGDAProxy,
      addrs.nounsAuctionHouseProxy,
      addrs.nounsToken,
    ]
      .filter(Boolean)
      .map((addr) => String(addr).toLowerCase()),
  );
}

function isProtocol(id?: string | null): boolean {
  if (!id) return true;
  return protocolAddresses().has(id.toLowerCase());
}

function sameAddr(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

function proposerFromCandidateId(id: string): Address | undefined {
  return toAddress(id.split("-")[0]);
}

function mapConclusion(status: string): DigestConclusion | undefined {
  switch (status.toUpperCase()) {
    case "SUCCEEDED":
    case "QUEUED":
      return "passed";
    case "EXECUTED":
      return "executed";
    case "DEFEATED":
    case "FAILED":
    case "EXPIRED":
      return "defeated";
    case "CANCELLED":
    case "CANCELED":
      return "canceled";
    case "VETOED":
      return "vetoed";
    default:
      return undefined;
  }
}

function blockTimestamp(
  createdTimestamp: number,
  createdBlock: number,
  targetBlock: number,
): number {
  return createdTimestamp + (targetBlock - createdBlock) * 12;
}

const CLUSTER_WINDOW_SECONDS = 1800;

// Same rules as the indexer: merge bursts from one account (transfers,
// delegations, mints) within 30 minutes, even when other events interleave.
function groupConsecutive(events: DigestEvent[]): DigestEvent[] {
  const grouped: DigestEvent[] = [];
  const open = new Map<string, { event: DigestEvent; oldest: number }>();

  for (const event of events) {
    const clusterable =
      event.kind === "transfer" || event.kind === "delegate" || event.kind === "mint";
    const key = `${event.kind}:${event.actor?.toLowerCase() ?? ""}`;
    const cluster = clusterable ? open.get(key) : undefined;

    if (cluster && cluster.oldest - event.timestamp <= CLUSTER_WINDOW_SECONDS) {
      const target = cluster.event;
      target.nounIds = Array.from(
        new Set([...(target.nounIds ?? []), ...(event.nounIds ?? [])]),
      );
      if (
        event.counterpart &&
        !target.counterparts?.some((address) => sameAddr(address, event.counterpart))
      ) {
        target.counterparts = [...(target.counterparts ?? []), event.counterpart];
      }
      cluster.oldest = event.timestamp;
      continue;
    }

    const copy: DigestEvent = {
      ...event,
      nounIds: event.nounIds ? [...event.nounIds] : undefined,
      counterparts: event.counterpart ? [event.counterpart] : undefined,
    };
    grouped.push(copy);
    if (clusterable) open.set(key, { event: copy, oldest: event.timestamp });
  }

  return grouped.map((event) =>
    (event.counterparts?.length ?? 0) > 1 ? event : { ...event, counterparts: undefined },
  );
}

export function eventMatchesFilter(
  event: DigestEvent,
  filter: DigestFeedFilter,
): boolean {
  if (filter === "all") return true;
  switch (filter) {
    case "proposals":
      return (
        event.kind === "vote" ||
        event.kind === "proposal-created" ||
        event.kind === "voting-started" ||
        event.kind === "closing-soon" ||
        event.kind === "proposal-concluded" ||
        event.kind === "proposal-feedback"
      );
    case "votes":
      return event.kind === "vote";
    case "candidates":
      return event.kind.startsWith("candidate-");
    case "topics":
      return event.kind.startsWith("topic-");
    case "market":
      return (
        event.kind === "sale" ||
        event.kind === "mint" ||
        event.kind === "transfer"
      );
    case "delegates":
      return event.kind === "delegate";
    default:
      return true;
  }
}

// Pre-indexed feed served by services/digest-indexer. Addresses
// come back lowercased, so checksum them to match the subgraph path.
function digestApiUrl(): string | undefined {
  return import.meta.env.VITE_DIGEST_API_URL?.trim() || undefined;
}

export function hasDigestApi(): boolean {
  return Boolean(digestApiUrl());
}

function checksumEvent(event: DigestEvent): DigestEvent {
  const quotes = (list?: DigestQuote[]) =>
    list?.map((item) => ({ ...item, target: toAddress(item.target) }));
  return {
    ...event,
    actor: toAddress(event.actor),
    counterpart: toAddress(event.counterpart),
    counterparts: event.counterparts
      ?.map((address) => toAddress(address))
      .filter((address): address is Address => Boolean(address)),
    replies: quotes(event.replies),
    revotes: quotes(event.revotes),
  };
}

export async function getDigestPage({
  filter = "all",
  search,
  cursor,
  limit = 50,
}: {
  filter?: DigestFeedFilter;
  search?: string;
  cursor?: string | null;
  limit?: number;
}): Promise<DigestPage> {
  const apiUrl = digestApiUrl();
  if (!apiUrl) throw new Error("VITE_DIGEST_API_URL is not set");
  const params = new URLSearchParams({ limit: String(limit) });
  if (filter !== "all") params.set("filter", filter);
  if (search) params.set("q", search);
  if (cursor) params.set("cursor", cursor);
  const res = await fetch(`${apiUrl}?${params}`);
  if (!res.ok) throw new Error(`digest API ${res.status}`);
  const body = (await res.json()) as DigestPage;
  return { events: body.events.map(checksumEvent), nextCursor: body.nextCursor };
}

export async function getDigestFeed(limit: number = 80): Promise<DigestEvent[]> {
  const goldskyUrl = CHAIN_CONFIG.goldskyUrl.primary;
  if (!goldskyUrl) return [];

  const [core, extras] = await Promise.all([
    graphQLFetch(goldskyUrl, coreQuery, { first: FEED_BATCH }, { cache: "no-cache" }) as Promise<CoreResponse | null>,
    isDaoVersion5()
      ? (graphQLFetch(goldskyUrl, extrasQuery, { first: FEED_BATCH }, { cache: "no-cache" }) as Promise<ExtrasResponse | null>)
      : Promise.resolve(null),
  ]);

  const events: DigestEvent[] = [];
  const saleKeys = new Set<string>();
  const transferKeys = new Set<string>();
  const now = Math.floor(Date.now() / 1000);

  for (const vote of core?.votes ?? []) {
    const actor = toAddress(vote.voter.id);
    if (!actor) continue;
    events.push({
      id: `vote-${vote.id}`,
      kind: "vote",
      timestamp: Number(vote.blockTimestamp),
      href: `/vote/${vote.proposal.id}`,
      actor,
      support: vote.supportDetailed,
      voteWeight: Number(vote.votes) || 0,
      proposalId: vote.proposal.id,
      proposalTitle: vote.proposal.title,
      reason: vote.reason ?? undefined,
      nounIds: vote.nouns?.map((noun) => noun.id),
    });
  }

  for (const auction of core?.auctions ?? []) {
    const actor = toAddress(auction.bidder?.id);
    const timestamp = Number(auction.settledTimestamp ?? 0);
    if (!actor || !timestamp) continue;
    const nounId = auction.noun.id;
    saleKeys.add(`${nounId}-${timestamp}`);
    events.push({
      id: `sale-${auction.id}`,
      kind: "sale",
      timestamp,
      href: "/",
      actor,
      nounIds: [nounId],
      amountWei: auction.amount,
      isVrgda: auction.isVrgda,
    });
  }

  for (const transfer of core?.transferEvents ?? []) {
    const timestamp = Number(transfer.blockTimestamp);
    const nounId = transfer.noun.id;
    // Delegations emitted by this transfer are echoes; hide them below.
    transferKeys.add(`${nounId}-${timestamp}`);
    if (saleKeys.has(`${nounId}-${timestamp}`)) continue;
    if (isProtocol(transfer.previousHolder.id)) continue;
    if (sameAddr(transfer.previousHolder.id, transfer.newHolder.id)) continue;
    const actor = toAddress(transfer.previousHolder.id);
    const counterpart = toAddress(transfer.newHolder.id);
    if (!actor || !counterpart) continue;
    events.push({
      id: `transfer-${transfer.id}`,
      kind: "transfer",
      timestamp,
      href: `/profile/${counterpart}`,
      actor,
      counterpart,
      nounIds: [nounId],
    });
  }

  for (const delegation of core?.delegationEvents ?? []) {
    const timestamp = Number(delegation.blockTimestamp);
    const nounId = delegation.noun.id;
    if (saleKeys.has(`${nounId}-${timestamp}`)) continue;
    if (transferKeys.has(`${nounId}-${timestamp}`)) continue;
    if (isProtocol(delegation.previousDelegate.id)) continue;
    if (sameAddr(delegation.previousDelegate.id, delegation.newDelegate.id)) continue;
    const actor = toAddress(delegation.previousDelegate.id);
    const counterpart = toAddress(delegation.newDelegate.id);
    if (!actor || !counterpart) continue;
    events.push({
      id: `delegate-${delegation.id}`,
      kind: "delegate",
      timestamp,
      href: `/profile/${counterpart}`,
      actor,
      counterpart,
      nounIds: [nounId],
    });
  }

  for (const proposal of core?.proposals ?? []) {
    const actor = toAddress(proposal.proposer.id);
    const created = Number(proposal.createdTimestamp);
    const createdBlock = Number(proposal.createdBlock);
    const startTs = blockTimestamp(created, createdBlock, Number(proposal.startBlock));
    const endTs = blockTimestamp(created, createdBlock, Number(proposal.endBlock));
    const href = `/vote/${proposal.id}`;

    if (actor) {
      events.push({
        id: `proposal-created-${proposal.id}`,
        kind: "proposal-created",
        timestamp: created,
        href,
        actor,
        proposalId: proposal.id,
        proposalTitle: proposal.title,
      });
    }

    if (startTs <= now && startTs > created) {
      events.push({
        id: `voting-started-${proposal.id}`,
        kind: "voting-started",
        timestamp: startTs,
        href,
        actor,
        proposalId: proposal.id,
        proposalTitle: proposal.title,
      });
    }

    const conclusion = mapConclusion(proposal.status);
    if (conclusion) {
      events.push({
        id: `proposal-concluded-${proposal.id}`,
        kind: "proposal-concluded",
        timestamp: Math.min(endTs, now),
        href,
        actor,
        proposalId: proposal.id,
        proposalTitle: proposal.title,
        conclusion,
        voteWeight: Number(proposal.forVotes) || 0,
        support: Number(proposal.againstVotes) || 0,
      });
    }
  }

  for (const candidate of extras?.proposalCandidates ?? []) {
    const actor = proposerFromCandidateId(candidate.id);
    const title = candidate.latestVersion?.content?.title || candidate.slug;
    const href = `/candidates/${makeUrlId(candidate.id)}`;
    const created = Number(candidate.createdTimestamp);
    const updated = Number(candidate.lastUpdatedTimestamp);

    if (actor) {
      events.push({
        id: `candidate-created-${candidate.id}`,
        kind: "candidate-created",
        timestamp: created,
        href,
        actor,
        candidateId: candidate.id,
        candidateTitle: title,
      });
    }

    if (updated > created + 30) {
      events.push({
        id: `candidate-updated-${candidate.id}-${updated}`,
        kind: "candidate-updated",
        timestamp: updated,
        href,
        actor,
        candidateId: candidate.id,
        candidateTitle: title,
      });
    }
  }

  for (const topic of extras?.topics ?? []) {
    const actor = toAddress(topic.creator?.id) ?? proposerFromCandidateId(topic.id);
    if (!actor) continue;
    events.push({
      id: `topic-created-${topic.id}`,
      kind: "topic-created",
      timestamp: Number(topic.createdTimestamp),
      href: `/topics/${makeTopicUrlId(topic.id)}`,
      actor,
      topicId: topic.id,
      topicTitle: topic.title,
    });
  }

  for (const feedback of extras?.candidateFeedbacks ?? []) {
    const actor = toAddress(feedback.voter.id);
    const candidate = feedback.candidate;
    if (!actor || !candidate) continue;
    events.push({
      id: `candidate-feedback-${feedback.id}`,
      kind: "candidate-feedback",
      timestamp: Number(feedback.createdTimestamp),
      href: `/candidates/${makeUrlId(candidate.id)}`,
      actor,
      support: feedback.support,
      reason: feedback.reason ?? undefined,
      candidateId: candidate.id,
      candidateTitle: candidate.latestVersion?.content?.title || candidate.slug,
    });
  }

  for (const feedback of extras?.proposalFeedbacks ?? []) {
    const actor = toAddress(feedback.voter.id);
    const proposal = feedback.proposal;
    if (!actor || !proposal) continue;
    events.push({
      id: `proposal-feedback-${feedback.id}`,
      kind: "proposal-feedback",
      timestamp: Number(feedback.createdTimestamp),
      href: `/vote/${proposal.id}`,
      actor,
      support: feedback.support,
      reason: feedback.reason ?? undefined,
      proposalId: proposal.id,
      proposalTitle: proposal.title,
    });
  }

  for (const feedback of extras?.topicFeedbacks ?? []) {
    const actor = toAddress(feedback.voter.id);
    const topic = feedback.topic;
    if (!actor || !topic) continue;
    events.push({
      id: `topic-feedback-${feedback.id}`,
      kind: "topic-feedback",
      timestamp: Number(feedback.createdTimestamp),
      href: `/topics/${makeTopicUrlId(topic.id)}`,
      actor,
      support: feedback.support,
      reason: feedback.reason ?? undefined,
      topicId: topic.id,
      topicTitle: topic.title,
    });
  }

  events.sort((a, b) => b.timestamp - a.timestamp);
  return groupConsecutive(events).slice(0, limit);
}
