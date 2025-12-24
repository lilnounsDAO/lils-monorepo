import { Noun } from "@/data/noun/types";

export type BigIntString = string;

// Need our own to add success and failed, extends ProposalStatus (autogen)
export enum ProposalState {
  Active = "ACTIVE",
  Cancelled = "CANCELLED",
  Executed = "EXECUTED",
  Pending = "PENDING",
  Queued = "QUEUED",
  Vetoed = "VETOED",
  Succeeded = "SUCCEEDED",
  Defeated = "DEFEATED",
  Updatable = "UPDATABLE",
  ObjectionPeriod = "OBJECTION_PERIOD",
  Candidate = "CANDIDATE",
}


export type Unit = "%" | "$";
