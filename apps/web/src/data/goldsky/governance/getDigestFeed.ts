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
  | "candidates"
  | "topics"
  | "market"
  | "delegates";

export type DigestEventKind =
  | "vote"
  | "proposal-created"
  | "voting-started"
  | "proposal-concluded"
  | "proposal-feedback"
  | "candidate-created"
  | "candidate-updated"
  | "candidate-feedback"
  | "topic-created"
  | "topic-feedback"
  | "sale"
  | "transfer"
  | "delegate";

export type DigestConclusion =
  | "passed"
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

function groupConsecutive(events: DigestEvent[]): DigestEvent[] {
  const grouped: DigestEvent[] = [];

  for (const event of events) {
    const prev = grouped[grouped.length - 1];
    const canGroup =
      prev &&
      (event.kind === "transfer" || event.kind === "delegate") &&
      prev.kind === event.kind &&
      sameAddr(prev.actor, event.actor) &&
      sameAddr(prev.counterpart, event.counterpart) &&
      Math.abs(prev.timestamp - event.timestamp) <= 120;

    if (canGroup && prev) {
      prev.nounIds = Array.from(
        new Set([...(prev.nounIds ?? []), ...(event.nounIds ?? [])]),
      );
      continue;
    }

    grouped.push({
      ...event,
      nounIds: event.nounIds ? [...event.nounIds] : undefined,
    });
  }

  return grouped;
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
        event.kind === "proposal-concluded" ||
        event.kind === "proposal-feedback"
      );
    case "candidates":
      return event.kind.startsWith("candidate-");
    case "topics":
      return event.kind.startsWith("topic-");
    case "market":
      return event.kind === "sale" || event.kind === "transfer";
    case "delegates":
      return event.kind === "delegate";
    default:
      return true;
  }
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
