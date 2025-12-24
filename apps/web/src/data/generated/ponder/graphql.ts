/* eslint-disable */
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  BigInt: { input: string; output: string; }
};

export type Account = {
  __typename?: 'Account';
  address: Scalars['String']['output'];
  nounsNftBalance: Scalars['BigInt']['output'];
};

export type AccountConnection = {
  __typename?: 'AccountConnection';
  items: Array<Account>;
  pageInfo: PageInfo;
};

export type AccountWhere = {
  nounsNftBalance_gt?: InputMaybe<Scalars['String']['input']>;
};

export type Client = {
  __typename?: 'Client';
  approved: Scalars['Boolean']['output'];
  auctionsWon: Scalars['Int']['output'];
  id: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  proposalsCreated: Scalars['Int']['output'];
  rewardAmount: Scalars['BigInt']['output'];
  votesCast: Scalars['Int']['output'];
};

export type ClientConnection = {
  __typename?: 'ClientConnection';
  items: Array<Client>;
};

export type DailyFinancialSnapshot = {
  __typename?: 'DailyFinancialSnapshot';
  auctionRevenueInEth: Scalars['String']['output'];
  auctionRevenueInUsd: Scalars['String']['output'];
  propSpendInEth: Scalars['String']['output'];
  propSpendInUsd: Scalars['String']['output'];
  timestamp: Scalars['BigInt']['output'];
  treasuryBalanceInEth: Scalars['String']['output'];
  treasuryBalanceInUsd: Scalars['String']['output'];
};

export type DailyFinancialSnapshotConnection = {
  __typename?: 'DailyFinancialSnapshotConnection';
  items: Array<DailyFinancialSnapshot>;
  pageInfo: PageInfo;
};

export type ExecutedProposalConnection = {
  __typename?: 'ExecutedProposalConnection';
  totalCount: Scalars['Int']['output'];
};

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
};

export type Proposal = {
  __typename?: 'Proposal';
  abstainVotes: Scalars['BigInt']['output'];
  againstVotes: Scalars['BigInt']['output'];
  calldatas: Array<Scalars['String']['output']>;
  clientId: Scalars['Int']['output'];
  creationBlock: Scalars['BigInt']['output'];
  description: Scalars['String']['output'];
  executionEtaTimestamp: Scalars['BigInt']['output'];
  expiryTimestamp: Scalars['BigInt']['output'];
  forVotes: Scalars['BigInt']['output'];
  id: Scalars['Int']['output'];
  lastKnownState: Scalars['String']['output'];
  proposerAddress: Scalars['String']['output'];
  quorumVotes: Scalars['BigInt']['output'];
  signatures: Array<Scalars['String']['output']>;
  sponsorAddresses: Array<Scalars['String']['output']>;
  targets: Array<Scalars['String']['output']>;
  title: Scalars['String']['output'];
  updatePeriodEndBlock: Scalars['BigInt']['output'];
  values: Array<Scalars['String']['output']>;
  votes: VoteConnection;
  votingEndBlock: Scalars['BigInt']['output'];
  votingStartBlock: Scalars['BigInt']['output'];
};


export type ProposalVotesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<VoteWhere>;
};

export type ProposalConnection = {
  __typename?: 'ProposalConnection';
  items: Array<Proposal>;
};

export type ProposalWhereInput = {
  againstVotes_gt?: InputMaybe<Scalars['BigInt']['input']>;
  againstVotes_gte?: InputMaybe<Scalars['BigInt']['input']>;
  againstVotes_lt?: InputMaybe<Scalars['BigInt']['input']>;
  againstVotes_lte?: InputMaybe<Scalars['BigInt']['input']>;
  forVotes_gt?: InputMaybe<Scalars['BigInt']['input']>;
  forVotes_gte?: InputMaybe<Scalars['BigInt']['input']>;
  forVotes_lt?: InputMaybe<Scalars['BigInt']['input']>;
  forVotes_lte?: InputMaybe<Scalars['BigInt']['input']>;
  id?: InputMaybe<Scalars['Int']['input']>;
  id_gt?: InputMaybe<Scalars['Int']['input']>;
  id_gte?: InputMaybe<Scalars['Int']['input']>;
  id_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  id_lt?: InputMaybe<Scalars['Int']['input']>;
  id_lte?: InputMaybe<Scalars['Int']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['Int']['input']>>;
  lastKnownState?: InputMaybe<Scalars['String']['input']>;
  lastKnownState_in?: InputMaybe<Array<Scalars['String']['input']>>;
  lastKnownState_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  proposerAddress?: InputMaybe<Scalars['String']['input']>;
  proposerAddress_in?: InputMaybe<Array<Scalars['String']['input']>>;
  proposerAddress_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  title_contains?: InputMaybe<Scalars['String']['input']>;
  title_not_contains?: InputMaybe<Scalars['String']['input']>;
  votingEndBlock_gt?: InputMaybe<Scalars['BigInt']['input']>;
  votingEndBlock_gte?: InputMaybe<Scalars['BigInt']['input']>;
  votingEndBlock_lt?: InputMaybe<Scalars['BigInt']['input']>;
  votingEndBlock_lte?: InputMaybe<Scalars['BigInt']['input']>;
  votingStartBlock_gt?: InputMaybe<Scalars['BigInt']['input']>;
  votingStartBlock_gte?: InputMaybe<Scalars['BigInt']['input']>;
  votingStartBlock_lt?: InputMaybe<Scalars['BigInt']['input']>;
  votingStartBlock_lte?: InputMaybe<Scalars['BigInt']['input']>;
};

export type Query = {
  __typename?: 'Query';
  accounts: AccountConnection;
  clients: ClientConnection;
  dailyFinancialSnapshots: DailyFinancialSnapshotConnection;
  executedProposals: ExecutedProposalConnection;
  proposal?: Maybe<Proposal>;
  proposals: ProposalConnection;
  votes: VoteConnection;
};


export type QueryAccountsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<AccountWhere>;
};


export type QueryClientsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
};


export type QueryDailyFinancialSnapshotsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
};


export type QueryProposalArgs = {
  id: Scalars['Int']['input'];
};


export type QueryProposalsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<ProposalWhereInput>;
};


export type QueryVotesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderDirection?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<VoteWhere>;
};

export type Vote = {
  __typename?: 'Vote';
  id: Scalars['String']['output'];
  proposalId: Scalars['Int']['output'];
  reason: Scalars['String']['output'];
  timestamp: Scalars['BigInt']['output'];
  transactionHash: Scalars['String']['output'];
  value: VoteValue;
  voteReplies: VoteReplyConnection;
  voteRevotes: VoteRevoteConnection;
  voterAddress: Scalars['String']['output'];
  weight: Scalars['BigInt']['output'];
};

export type VoteConnection = {
  __typename?: 'VoteConnection';
  items: Array<Vote>;
};

export type VoteReply = {
  __typename?: 'VoteReply';
  reply: Scalars['String']['output'];
  replyVote: Vote;
};

export type VoteReplyConnection = {
  __typename?: 'VoteReplyConnection';
  items: Array<VoteReply>;
};

export type VoteRevote = {
  __typename?: 'VoteRevote';
  revote: Vote;
};

export type VoteRevoteConnection = {
  __typename?: 'VoteRevoteConnection';
  items: Array<VoteRevote>;
};

export enum VoteValue {
  Abstain = 'ABSTAIN',
  Against = 'AGAINST',
  For = 'FOR'
}

export type VoteWhere = {
  proposalId?: InputMaybe<Scalars['Int']['input']>;
  timestamp_gt?: InputMaybe<Scalars['BigInt']['input']>;
};

export type DailyFinancialSnapshotsQueryVariables = Exact<{
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type DailyFinancialSnapshotsQuery = { __typename?: 'Query', dailyFinancialSnapshots: { __typename?: 'DailyFinancialSnapshotConnection', pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor?: string | null }, items: Array<{ __typename?: 'DailyFinancialSnapshot', timestamp: string, treasuryBalanceInUsd: string, treasuryBalanceInEth: string, auctionRevenueInUsd: string, auctionRevenueInEth: string, propSpendInUsd: string, propSpendInEth: string }> } };

export type ProposalOverviewFragmentFragment = { __typename?: 'Proposal', id: number, title: string, proposerAddress: string, quorumVotes: string, forVotes: string, againstVotes: string, abstainVotes: string, lastKnownState: string, creationBlock: string, votingStartBlock: string, votingEndBlock: string, executionEtaTimestamp: string, expiryTimestamp: string };

export type ProposalVoteFragmentFragment = { __typename?: 'Vote', id: string, voterAddress: string, value: VoteValue, weight: string, reason: string, transactionHash: string, timestamp: string, voteRevotes: { __typename?: 'VoteRevoteConnection', items: Array<{ __typename?: 'VoteRevote', revote: { __typename?: 'Vote', voterAddress: string, value: VoteValue, reason: string } }> }, voteReplies: { __typename?: 'VoteReplyConnection', items: Array<{ __typename?: 'VoteReply', reply: string, replyVote: { __typename?: 'Vote', voterAddress: string, value: VoteValue, reason: string } }> } };

export type ExecutedProposalsCountQueryVariables = Exact<{ [key: string]: never; }>;


export type ExecutedProposalsCountQuery = { __typename?: 'Query', executedProposals: { __typename?: 'ExecutedProposalConnection', totalCount: number } };

export type ProposalQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type ProposalQuery = { __typename?: 'Query', proposal?: { __typename?: 'Proposal', description: string, targets: Array<string>, signatures: Array<string>, values: Array<string>, calldatas: Array<string>, id: number, title: string, proposerAddress: string, quorumVotes: string, forVotes: string, againstVotes: string, abstainVotes: string, lastKnownState: string, creationBlock: string, votingStartBlock: string, votingEndBlock: string, executionEtaTimestamp: string, expiryTimestamp: string, votes: { __typename?: 'VoteConnection', items: Array<{ __typename?: 'Vote', id: string, voterAddress: string, value: VoteValue, weight: string, reason: string, transactionHash: string, timestamp: string, voteRevotes: { __typename?: 'VoteRevoteConnection', items: Array<{ __typename?: 'VoteRevote', revote: { __typename?: 'Vote', voterAddress: string, value: VoteValue, reason: string } }> }, voteReplies: { __typename?: 'VoteReplyConnection', items: Array<{ __typename?: 'VoteReply', reply: string, replyVote: { __typename?: 'Vote', voterAddress: string, value: VoteValue, reason: string } }> } }> } } | null };

export type AllProposalsQueryVariables = Exact<{ [key: string]: never; }>;


export type AllProposalsQuery = { __typename?: 'Query', proposals: { __typename?: 'ProposalConnection', items: Array<{ __typename?: 'Proposal', id: number, title: string, proposerAddress: string, quorumVotes: string, forVotes: string, againstVotes: string, abstainVotes: string, lastKnownState: string, creationBlock: string, votingStartBlock: string, votingEndBlock: string, executionEtaTimestamp: string, expiryTimestamp: string }> } };

export type ProposalTitleQueryVariables = Exact<{
  id: Scalars['Int']['input'];
}>;


export type ProposalTitleQuery = { __typename?: 'Query', proposal?: { __typename?: 'Proposal', title: string } | null };

export type ProposalVotesAfterBlockNumberQueryVariables = Exact<{
  id: Scalars['Int']['input'];
  timestamp: Scalars['BigInt']['input'];
}>;


export type ProposalVotesAfterBlockNumberQuery = { __typename?: 'Query', proposal?: { __typename?: 'Proposal', votes: { __typename?: 'VoteConnection', items: Array<{ __typename?: 'Vote', id: string, voterAddress: string, value: VoteValue, weight: string, reason: string, transactionHash: string, timestamp: string, voteRevotes: { __typename?: 'VoteRevoteConnection', items: Array<{ __typename?: 'VoteRevote', revote: { __typename?: 'Vote', voterAddress: string, value: VoteValue, reason: string } }> }, voteReplies: { __typename?: 'VoteReplyConnection', items: Array<{ __typename?: 'VoteReply', reply: string, replyVote: { __typename?: 'Vote', voterAddress: string, value: VoteValue, reason: string } }> } }> } } | null };

export type AccountLeaderboardQueryVariables = Exact<{
  cursor?: InputMaybe<Scalars['String']['input']>;
}>;


export type AccountLeaderboardQuery = { __typename?: 'Query', accounts: { __typename?: 'AccountConnection', pageInfo: { __typename?: 'PageInfo', hasNextPage: boolean, endCursor?: string | null }, items: Array<{ __typename?: 'Account', address: string, nounsNftBalance: string }> } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: NonNullable<DocumentTypeDecoration<TResult, TVariables>['__apiType']>;
  private value: string;
  public __meta__?: Record<string, any> | undefined;

  constructor(value: string, __meta__?: Record<string, any> | undefined) {
    super(value);
    this.value = value;
    this.__meta__ = __meta__;
  }

  override toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}
export const ProposalOverviewFragmentFragmentDoc = new TypedDocumentString(`
    fragment ProposalOverviewFragment on Proposal {
  id
  title
  proposerAddress
  quorumVotes
  forVotes
  againstVotes
  abstainVotes
  lastKnownState
  creationBlock
  votingStartBlock
  votingEndBlock
  executionEtaTimestamp
  expiryTimestamp
}
    `, {"fragmentName":"ProposalOverviewFragment"}) as unknown as TypedDocumentString<ProposalOverviewFragmentFragment, unknown>;
export const ProposalVoteFragmentFragmentDoc = new TypedDocumentString(`
    fragment proposalVoteFragment on Vote {
  id
  voterAddress
  value
  weight
  reason
  transactionHash
  timestamp
  voteRevotes {
    items {
      revote {
        voterAddress
        value
        reason
      }
    }
  }
  voteReplies {
    items {
      replyVote {
        voterAddress
        value
        reason
      }
      reply
    }
  }
}
    `, {"fragmentName":"proposalVoteFragment"}) as unknown as TypedDocumentString<ProposalVoteFragmentFragment, unknown>;
export const DailyFinancialSnapshotsDocument = new TypedDocumentString(`
    query DailyFinancialSnapshots($cursor: String) {
  dailyFinancialSnapshots(
    limit: 1000
    orderBy: "timestamp"
    orderDirection: "asc"
    after: $cursor
  ) {
    pageInfo {
      hasNextPage
      endCursor
    }
    items {
      timestamp
      treasuryBalanceInUsd
      treasuryBalanceInEth
      auctionRevenueInUsd
      auctionRevenueInEth
      propSpendInUsd
      propSpendInEth
    }
  }
}
    `) as unknown as TypedDocumentString<DailyFinancialSnapshotsQuery, DailyFinancialSnapshotsQueryVariables>;
export const ExecutedProposalsCountDocument = new TypedDocumentString(`
    query ExecutedProposalsCount {
  executedProposals {
    totalCount
  }
}
    `) as unknown as TypedDocumentString<ExecutedProposalsCountQuery, ExecutedProposalsCountQueryVariables>;
export const ProposalDocument = new TypedDocumentString(`
    query Proposal($id: Int!) {
  proposal(id: $id) {
    ...ProposalOverviewFragment
    description
    targets
    signatures
    values
    calldatas
    votes(limit: 1000, orderBy: "timestamp", orderDirection: "desc") {
      items {
        ...proposalVoteFragment
      }
    }
  }
}
    fragment ProposalOverviewFragment on Proposal {
  id
  title
  proposerAddress
  quorumVotes
  forVotes
  againstVotes
  abstainVotes
  lastKnownState
  creationBlock
  votingStartBlock
  votingEndBlock
  executionEtaTimestamp
  expiryTimestamp
}
fragment proposalVoteFragment on Vote {
  id
  voterAddress
  value
  weight
  reason
  transactionHash
  timestamp
  voteRevotes {
    items {
      revote {
        voterAddress
        value
        reason
      }
    }
  }
  voteReplies {
    items {
      replyVote {
        voterAddress
        value
        reason
      }
      reply
    }
  }
}`) as unknown as TypedDocumentString<ProposalQuery, ProposalQueryVariables>;
export const AllProposalsDocument = new TypedDocumentString(`
    query AllProposals {
  proposals(limit: 1000) {
    items {
      ...ProposalOverviewFragment
    }
  }
}
    fragment ProposalOverviewFragment on Proposal {
  id
  title
  proposerAddress
  quorumVotes
  forVotes
  againstVotes
  abstainVotes
  lastKnownState
  creationBlock
  votingStartBlock
  votingEndBlock
  executionEtaTimestamp
  expiryTimestamp
}`) as unknown as TypedDocumentString<AllProposalsQuery, AllProposalsQueryVariables>;
export const ProposalTitleDocument = new TypedDocumentString(`
    query ProposalTitle($id: Int!) {
  proposal(id: $id) {
    title
  }
}
    `) as unknown as TypedDocumentString<ProposalTitleQuery, ProposalTitleQueryVariables>;
export const ProposalVotesAfterBlockNumberDocument = new TypedDocumentString(`
    query ProposalVotesAfterBlockNumber($id: Int!, $timestamp: BigInt!) {
  proposal(id: $id) {
    votes(
      limit: 1000
      orderBy: "timestamp"
      orderDirection: "desc"
      where: {timestamp_gt: $timestamp}
    ) {
      items {
        ...proposalVoteFragment
      }
    }
  }
}
    fragment proposalVoteFragment on Vote {
  id
  voterAddress
  value
  weight
  reason
  transactionHash
  timestamp
  voteRevotes {
    items {
      revote {
        voterAddress
        value
        reason
      }
    }
  }
  voteReplies {
    items {
      replyVote {
        voterAddress
        value
        reason
      }
      reply
    }
  }
}`) as unknown as TypedDocumentString<ProposalVotesAfterBlockNumberQuery, ProposalVotesAfterBlockNumberQueryVariables>;
export const AccountLeaderboardDocument = new TypedDocumentString(`
    query AccountLeaderboard($cursor: String) {
  accounts(
    orderBy: "nounsNftBalance"
    orderDirection: "desc"
    where: {nounsNftBalance_gt: "0"}
    limit: 1000
    after: $cursor
  ) {
    pageInfo {
      hasNextPage
      endCursor
    }
    items {
      address
      nounsNftBalance
    }
  }
}
    `) as unknown as TypedDocumentString<AccountLeaderboardQuery, AccountLeaderboardQueryVariables>;