/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query DailyFinancialSnapshots($cursor: String) {\n    dailyFinancialSnapshots(\n      limit: 1000\n      orderBy: \"timestamp\"\n      orderDirection: \"asc\"\n      after: $cursor\n    ) {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      items {\n        timestamp\n\n        treasuryBalanceInUsd\n        treasuryBalanceInEth\n\n        auctionRevenueInUsd\n        auctionRevenueInEth\n\n        propSpendInUsd\n        propSpendInEth\n      }\n    }\n  }\n": typeof types.DailyFinancialSnapshotsDocument,
    "\n  fragment ProposalOverviewFragment on Proposal {\n    id\n    title\n    proposerAddress\n\n    quorumVotes\n    forVotes\n    againstVotes\n    abstainVotes\n\n    lastKnownState\n    creationBlock\n    votingStartBlock\n    votingEndBlock\n    executionEtaTimestamp\n    expiryTimestamp\n  }\n": typeof types.ProposalOverviewFragmentFragmentDoc,
    "\n  fragment proposalVoteFragment on Vote {\n    id\n    voterAddress\n    value\n    weight\n    reason\n    transactionHash\n    timestamp\n\n    voteRevotes {\n      items {\n        revote {\n          voterAddress\n          value\n          reason\n        }\n      }\n    }\n    voteReplies {\n      items {\n        replyVote {\n          voterAddress\n          value\n          reason\n        }\n        reply\n      }\n    }\n  }\n": typeof types.ProposalVoteFragmentFragmentDoc,
    "\n  query ExecutedProposalsCount {\n    executedProposals {\n      totalCount\n    }\n  }\n": typeof types.ExecutedProposalsCountDocument,
    "\n  query Proposal($id: Int!) {\n    proposal(id: $id) {\n      ...ProposalOverviewFragment\n      description\n\n      targets\n      signatures\n      values\n      calldatas\n\n      votes(limit: 1000, orderBy: \"timestamp\", orderDirection: \"desc\") {\n        items {\n          ...proposalVoteFragment\n        }\n      }\n    }\n  }\n": typeof types.ProposalDocument,
    "\n  query AllProposals {\n    proposals(limit: 1000) {\n      items {\n        ...ProposalOverviewFragment\n      }\n    }\n  }\n": typeof types.AllProposalsDocument,
    "\n  query ProposalTitle($id: Int!) {\n    proposal(id: $id) {\n      title\n    }\n  }\n": typeof types.ProposalTitleDocument,
    "\n  query ProposalVotesAfterBlockNumber($id: Int!, $timestamp: BigInt!) {\n    proposal(id: $id) {\n      votes(\n        limit: 1000\n        orderBy: \"timestamp\"\n        orderDirection: \"desc\"\n        where: { timestamp_gt: $timestamp }\n      ) {\n        items {\n          ...proposalVoteFragment\n        }\n      }\n    }\n  }\n": typeof types.ProposalVotesAfterBlockNumberDocument,
    "\n  query AccountLeaderboard($cursor: String) {\n    accounts(\n      orderBy: \"nounsNftBalance\"\n      orderDirection: \"desc\"\n      where: { nounsNftBalance_gt: \"0\" }\n      limit: 1000\n      after: $cursor\n    ) {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      items {\n        address\n        nounsNftBalance\n      }\n    }\n  }\n": typeof types.AccountLeaderboardDocument,
};
const documents: Documents = {
    "\n  query DailyFinancialSnapshots($cursor: String) {\n    dailyFinancialSnapshots(\n      limit: 1000\n      orderBy: \"timestamp\"\n      orderDirection: \"asc\"\n      after: $cursor\n    ) {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      items {\n        timestamp\n\n        treasuryBalanceInUsd\n        treasuryBalanceInEth\n\n        auctionRevenueInUsd\n        auctionRevenueInEth\n\n        propSpendInUsd\n        propSpendInEth\n      }\n    }\n  }\n": types.DailyFinancialSnapshotsDocument,
    "\n  fragment ProposalOverviewFragment on Proposal {\n    id\n    title\n    proposerAddress\n\n    quorumVotes\n    forVotes\n    againstVotes\n    abstainVotes\n\n    lastKnownState\n    creationBlock\n    votingStartBlock\n    votingEndBlock\n    executionEtaTimestamp\n    expiryTimestamp\n  }\n": types.ProposalOverviewFragmentFragmentDoc,
    "\n  fragment proposalVoteFragment on Vote {\n    id\n    voterAddress\n    value\n    weight\n    reason\n    transactionHash\n    timestamp\n\n    voteRevotes {\n      items {\n        revote {\n          voterAddress\n          value\n          reason\n        }\n      }\n    }\n    voteReplies {\n      items {\n        replyVote {\n          voterAddress\n          value\n          reason\n        }\n        reply\n      }\n    }\n  }\n": types.ProposalVoteFragmentFragmentDoc,
    "\n  query ExecutedProposalsCount {\n    executedProposals {\n      totalCount\n    }\n  }\n": types.ExecutedProposalsCountDocument,
    "\n  query Proposal($id: Int!) {\n    proposal(id: $id) {\n      ...ProposalOverviewFragment\n      description\n\n      targets\n      signatures\n      values\n      calldatas\n\n      votes(limit: 1000, orderBy: \"timestamp\", orderDirection: \"desc\") {\n        items {\n          ...proposalVoteFragment\n        }\n      }\n    }\n  }\n": types.ProposalDocument,
    "\n  query AllProposals {\n    proposals(limit: 1000) {\n      items {\n        ...ProposalOverviewFragment\n      }\n    }\n  }\n": types.AllProposalsDocument,
    "\n  query ProposalTitle($id: Int!) {\n    proposal(id: $id) {\n      title\n    }\n  }\n": types.ProposalTitleDocument,
    "\n  query ProposalVotesAfterBlockNumber($id: Int!, $timestamp: BigInt!) {\n    proposal(id: $id) {\n      votes(\n        limit: 1000\n        orderBy: \"timestamp\"\n        orderDirection: \"desc\"\n        where: { timestamp_gt: $timestamp }\n      ) {\n        items {\n          ...proposalVoteFragment\n        }\n      }\n    }\n  }\n": types.ProposalVotesAfterBlockNumberDocument,
    "\n  query AccountLeaderboard($cursor: String) {\n    accounts(\n      orderBy: \"nounsNftBalance\"\n      orderDirection: \"desc\"\n      where: { nounsNftBalance_gt: \"0\" }\n      limit: 1000\n      after: $cursor\n    ) {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      items {\n        address\n        nounsNftBalance\n      }\n    }\n  }\n": types.AccountLeaderboardDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query DailyFinancialSnapshots($cursor: String) {\n    dailyFinancialSnapshots(\n      limit: 1000\n      orderBy: \"timestamp\"\n      orderDirection: \"asc\"\n      after: $cursor\n    ) {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      items {\n        timestamp\n\n        treasuryBalanceInUsd\n        treasuryBalanceInEth\n\n        auctionRevenueInUsd\n        auctionRevenueInEth\n\n        propSpendInUsd\n        propSpendInEth\n      }\n    }\n  }\n"): typeof import('./graphql').DailyFinancialSnapshotsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment ProposalOverviewFragment on Proposal {\n    id\n    title\n    proposerAddress\n\n    quorumVotes\n    forVotes\n    againstVotes\n    abstainVotes\n\n    lastKnownState\n    creationBlock\n    votingStartBlock\n    votingEndBlock\n    executionEtaTimestamp\n    expiryTimestamp\n  }\n"): typeof import('./graphql').ProposalOverviewFragmentFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  fragment proposalVoteFragment on Vote {\n    id\n    voterAddress\n    value\n    weight\n    reason\n    transactionHash\n    timestamp\n\n    voteRevotes {\n      items {\n        revote {\n          voterAddress\n          value\n          reason\n        }\n      }\n    }\n    voteReplies {\n      items {\n        replyVote {\n          voterAddress\n          value\n          reason\n        }\n        reply\n      }\n    }\n  }\n"): typeof import('./graphql').ProposalVoteFragmentFragmentDoc;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ExecutedProposalsCount {\n    executedProposals {\n      totalCount\n    }\n  }\n"): typeof import('./graphql').ExecutedProposalsCountDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Proposal($id: Int!) {\n    proposal(id: $id) {\n      ...ProposalOverviewFragment\n      description\n\n      targets\n      signatures\n      values\n      calldatas\n\n      votes(limit: 1000, orderBy: \"timestamp\", orderDirection: \"desc\") {\n        items {\n          ...proposalVoteFragment\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').ProposalDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AllProposals {\n    proposals(limit: 1000) {\n      items {\n        ...ProposalOverviewFragment\n      }\n    }\n  }\n"): typeof import('./graphql').AllProposalsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProposalTitle($id: Int!) {\n    proposal(id: $id) {\n      title\n    }\n  }\n"): typeof import('./graphql').ProposalTitleDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query ProposalVotesAfterBlockNumber($id: Int!, $timestamp: BigInt!) {\n    proposal(id: $id) {\n      votes(\n        limit: 1000\n        orderBy: \"timestamp\"\n        orderDirection: \"desc\"\n        where: { timestamp_gt: $timestamp }\n      ) {\n        items {\n          ...proposalVoteFragment\n        }\n      }\n    }\n  }\n"): typeof import('./graphql').ProposalVotesAfterBlockNumberDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AccountLeaderboard($cursor: String) {\n    accounts(\n      orderBy: \"nounsNftBalance\"\n      orderDirection: \"desc\"\n      where: { nounsNftBalance_gt: \"0\" }\n      limit: 1000\n      after: $cursor\n    ) {\n      pageInfo {\n        hasNextPage\n        endCursor\n      }\n      items {\n        address\n        nounsNftBalance\n      }\n    }\n  }\n"): typeof import('./graphql').AccountLeaderboardDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
