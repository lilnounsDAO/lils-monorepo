import { Noun } from "./noun";

export type BigIntString = string;

// Need our own to add success and failed, extends ProposalStatus (autogen)
export enum ProposalStateEnum {
  Active = "ACTIVE",
  Cancelled = "CANCELLED",
  Executed = "EXECUTED",
  Pending = "PENDING",
  Queued = "QUEUED",
  Vetoed = "VETOED",
  Succeeded = "SUCCEEDED",
  Defeated = "DEFEATED",
}

export interface SwapNounProposal {
  id: number | string;
  state: ProposalStateEnum;
}

export type Unit = "%" | "$";
