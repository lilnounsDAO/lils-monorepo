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
    "\n  query Auction($id: ID!) {\n    auction(id: $id) {\n      id\n      noun {\n        id\n      }\n      amount\n      startTime\n      endTime\n      bidder {\n        id\n      }\n      settled\n      isVrgda\n      bids {\n        id\n        bidder {\n          id\n        }\n        amount\n        blockTimestamp\n      }\n    }\n  }\n": typeof types.AuctionDocument,
    "\n  query CurrentAuctionId {\n    auctions(orderBy: startTime, orderDirection: desc, first: 1) {\n      id\n    }\n  }\n": typeof types.CurrentAuctionIdDocument,
    "\n  query NounSwapProposalsForProposer($proposerAsString: String!, $proposerAsBytes: Bytes!) {\n    proposals(\n      where: { proposer: $proposerAsString, title_contains: \"NounSwap\" }\n      first: 1000\n      orderBy: id\n      orderDirection: desc\n    ) {\n      id\n      title\n      description\n      status\n      quorumVotes\n      forVotes\n      againstVotes\n      endBlock\n      startBlock\n    }\n  }\n": typeof types.NounSwapProposalsForProposerDocument,
    "\n  query AllNouns($batchSize: Int!, $skip: Int!) {\n    nouns(first: $batchSize, skip: $skip) {\n      id\n      owner {\n        id\n      }\n      seed {\n        background\n        body\n        accessory\n        head\n        glasses\n      }\n    }\n  }\n": typeof types.AllNounsDocument,
    "\n  query NounById($id: ID!) {\n    noun(id: $id) {\n      id\n      owner {\n        id\n      }\n      seed {\n        background\n        body\n        accessory\n        head\n        glasses\n      }\n    }\n  }\n": typeof types.NounByIdDocument,
};
const documents: Documents = {
    "\n  query Auction($id: ID!) {\n    auction(id: $id) {\n      id\n      noun {\n        id\n      }\n      amount\n      startTime\n      endTime\n      bidder {\n        id\n      }\n      settled\n      isVrgda\n      bids {\n        id\n        bidder {\n          id\n        }\n        amount\n        blockTimestamp\n      }\n    }\n  }\n": types.AuctionDocument,
    "\n  query CurrentAuctionId {\n    auctions(orderBy: startTime, orderDirection: desc, first: 1) {\n      id\n    }\n  }\n": types.CurrentAuctionIdDocument,
    "\n  query NounSwapProposalsForProposer($proposerAsString: String!, $proposerAsBytes: Bytes!) {\n    proposals(\n      where: { proposer: $proposerAsString, title_contains: \"NounSwap\" }\n      first: 1000\n      orderBy: id\n      orderDirection: desc\n    ) {\n      id\n      title\n      description\n      status\n      quorumVotes\n      forVotes\n      againstVotes\n      endBlock\n      startBlock\n    }\n  }\n": types.NounSwapProposalsForProposerDocument,
    "\n  query AllNouns($batchSize: Int!, $skip: Int!) {\n    nouns(first: $batchSize, skip: $skip) {\n      id\n      owner {\n        id\n      }\n      seed {\n        background\n        body\n        accessory\n        head\n        glasses\n      }\n    }\n  }\n": types.AllNounsDocument,
    "\n  query NounById($id: ID!) {\n    noun(id: $id) {\n      id\n      owner {\n        id\n      }\n      seed {\n        background\n        body\n        accessory\n        head\n        glasses\n      }\n    }\n  }\n": types.NounByIdDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query Auction($id: ID!) {\n    auction(id: $id) {\n      id\n      noun {\n        id\n      }\n      amount\n      startTime\n      endTime\n      bidder {\n        id\n      }\n      settled\n      isVrgda\n      bids {\n        id\n        bidder {\n          id\n        }\n        amount\n        blockTimestamp\n      }\n    }\n  }\n"): typeof import('./graphql').AuctionDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query CurrentAuctionId {\n    auctions(orderBy: startTime, orderDirection: desc, first: 1) {\n      id\n    }\n  }\n"): typeof import('./graphql').CurrentAuctionIdDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NounSwapProposalsForProposer($proposerAsString: String!, $proposerAsBytes: Bytes!) {\n    proposals(\n      where: { proposer: $proposerAsString, title_contains: \"NounSwap\" }\n      first: 1000\n      orderBy: id\n      orderDirection: desc\n    ) {\n      id\n      title\n      description\n      status\n      quorumVotes\n      forVotes\n      againstVotes\n      endBlock\n      startBlock\n    }\n  }\n"): typeof import('./graphql').NounSwapProposalsForProposerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query AllNouns($batchSize: Int!, $skip: Int!) {\n    nouns(first: $batchSize, skip: $skip) {\n      id\n      owner {\n        id\n      }\n      seed {\n        background\n        body\n        accessory\n        head\n        glasses\n      }\n    }\n  }\n"): typeof import('./graphql').AllNounsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query NounById($id: ID!) {\n    noun(id: $id) {\n      id\n      owner {\n        id\n      }\n      seed {\n        background\n        body\n        accessory\n        head\n        glasses\n      }\n    }\n  }\n"): typeof import('./graphql').NounByIdDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
