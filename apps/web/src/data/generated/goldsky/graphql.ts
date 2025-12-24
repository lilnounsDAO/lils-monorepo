// Goldsky GraphQL Types
// This is a minimal setup until proper codegen is configured

export interface Proposal {
  id: string;
  title: string;
  proposer: {
    id: string;
  };
  quorumVotes: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  status: string;
  createdBlock: string;
  startBlock: string;
  endBlock: string;
  executionETA?: string;
  createdTimestamp: string;
}

export interface Vote {
  id: string;
  voter: {
    id: string;
  };
  supportDetailed: number;
  votes: string;
  reason?: string;
  transactionHash: string;
  blockTimestamp: string;
  nouns: Array<{ id: string }>;
}

export interface Account {
  id: string;
  tokenBalance: string;
  totalTokensHeld: string;
  nouns: Array<{ id: string }>;
}

export interface QueryResponse<T> {
  [key: string]: T;
}