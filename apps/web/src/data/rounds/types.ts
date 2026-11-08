import { Address } from "viem";

export type RoundState = "pending" | "proposing" | "voting" | "ended";

/** `lilnouns` for rounds opened here; the others are imported history. */
export type RoundSource = "lilnouns" | "prop-house" | "nouns.gg";

export interface RoundAsset {
  name: string;
  symbol: string | null;
  image: string | null;
  decimals: number;
  chainId: number;
  address: Address;
  tokenId: string | null;
}

export interface RoundAward {
  id: number;
  place: number;
  asset: RoundAsset;
  /** Base units, so it needs the asset's decimals to read. */
  value: string;
  winnerProposalId: number | null;
  payoutTx: string | null;
}

/** An award as the create-round form collects it, before the round exists. */
export interface RoundAwardInput {
  place: number;
  /** Base units of the asset. */
  value: string;
  asset: RoundAsset;
}

export type ProposeStrategy =
  | { type: "open" }
  | { type: "lil-nouns-votes"; min?: string }
  | { type: "allowlist"; entries?: Record<string, string> }
  | { type: "archive"; platform?: string };

export type VoteStrategy =
  | { type: "lil-nouns-votes"; min?: string; multiplier?: number }
  | { type: "fixed"; votes?: string; min?: string }
  | { type: "allowlist"; entries?: Record<string, string> }
  | { type: "archive"; platform?: string };

export interface Round {
  id: number;
  handle: string;
  house: string;
  name: string;
  description: string | null;
  content: string | null;
  image: string | null;
  /** An address, or `<platform>:<id>` for an imported round with no wallet. */
  creator: string;
  creatorName: string | null;
  creatorImage: string | null;
  startAt: string;
  votingStartAt: string;
  endAt: string;
  state: RoundState;
  snapshotBlock: number | null;
  settledAt: string | null;
  proposeStrategy: ProposeStrategy;
  voteStrategy: VoteStrategy;
  proposeStrategyDescription: string;
  voteStrategyDescription: string;
  source: RoundSource;
  sourceId: string | null;
  sourceUrl: string | null;
  featured: boolean;
  createdAt: string;
  proposalCount: number;
  voteCount: string;
  voterCount: number;
  awards: RoundAward[];
}

export interface RoundProposal {
  id: number;
  roundId: number;
  roundHandle: string;
  author: string;
  authorName: string | null;
  authorImage: string | null;
  title: string;
  tldr: string | null;
  content: string;
  voteCount: string;
  voterCount: number;
  rank: number | null;
  /** The award place this proposal won, once the round has settled. */
  place: number | null;
  createdAt: string;
  updatedAt: string;
  source: RoundSource;
}

export type RoundActivityKind =
  | "vote"
  | "proposal-created"
  | "round-started"
  | "voting-started"
  | "round-ended";

export interface RoundActivityEvent {
  id: string;
  kind: RoundActivityKind;
  timestamp: string;
  actor?: string;
  actorName?: string | null;
  actorImage?: string | null;
  weight?: string | null;
  proposalId?: number;
  proposalTitle?: string;
  proposalAuthor?: string;
}

/** What one wallet may still do in a round. */
export interface RoundPower {
  address: Address;
  votingPower: string;
  votesUsed: string;
  votesRemaining: string;
  canPropose: boolean;
  canVote: boolean;
  snapshotBlock: number | null;
}

export interface RoundHouse {
  handle: string;
  name: string;
  description: string | null;
  image: string | null;
  treasury: Address | null;
}

export interface RoundHouseTotals {
  rounds: number;
  proposals: number;
  voters: number;
}

export interface BallotAllocation {
  proposal: number;
  votes: string;
}

export interface RoundVote {
  id: number;
  timestamp: string;
  voter: string;
  voterName: string | null;
  voterImage: string | null;
  weight: string;
}

export interface ProposalVotes {
  proposal: {
    id: number;
    title: string;
    voteCount: string;
    roundHandle: string;
  };
  votes: RoundVote[];
}
