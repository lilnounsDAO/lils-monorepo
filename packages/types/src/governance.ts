import { Address } from "viem";

export enum LastKnownProposalState {
  Cancelled = "CANCELLED",
  Executed = "EXECUTED",
  Vetoed = "VETOED",
  Queued = "QUEUED",
  Active = "ACTIVE",
  Pending = "PENDING",
  Successful = "SUCCESSFUL",
  Failed = "FAILED",
  Expired = "EXPIRED"
}

export type ProposalState =
  | "pending"
  | "active"
  | "successful"
  | "failed"
  | "queued"
  | "executed"
  | "cancelled"
  | "expired"
  | "vetoed";

export interface ProposalOverview {
  id: number;
  title: string;
  proposerAddress: Address;

  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  quorumVotes: number;

  state: ProposalState;

  creationBlock: number;
  votingStartBlock: number;
  votingStartTimestamp: number;
  votingEndBlock: number;
  votingEndTimestamp: number;
  executionEtaTimestamp?: number;
}