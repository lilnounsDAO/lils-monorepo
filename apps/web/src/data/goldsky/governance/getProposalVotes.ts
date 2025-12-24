
import { graphQLFetch } from "@/data/utils/graphQLFetch";
import { CHAIN_CONFIG } from "@/config";
import { Vote } from "@/data/generated/goldsky/graphql";
import { getAddress } from "viem";
import { ProposalVote } from "./common";

const query = `
  query GetProposalVotes($proposalId: ID!, $timestamp: BigInt) {
    votes(
      first: 1000
      orderBy: blockTimestamp
      orderDirection: desc
      where: {
        proposal: $proposalId
        ${`blockTimestamp_gt: $timestamp`}
      }
    ) {
      id
      voter {
        id
      }
      supportDetailed
      votes
      reason
      transactionHash
      blockTimestamp
      nouns {
        id
      }
    }
  }
`;

const allVotesQuery = `
  query GetAllProposalVotes($proposalId: ID!) {
    votes(
      first: 1000
      orderBy: blockTimestamp
      orderDirection: desc
      where: {
        proposal: $proposalId
      }
    ) {
      id
      voter {
        id
      }
      supportDetailed
      votes
      reason
      transactionHash
      blockTimestamp
      nouns {
        id
      }
    }
  }
`;

interface ProposalVotesResponse {
  votes: Vote[];
}


export async function getProposalVotes(
  proposalId: string,
): Promise<ProposalVote[]> {
  try {
    const data = await graphQLFetch(
      CHAIN_CONFIG.goldskyUrl.primary,
      allVotesQuery,
      { proposalId },
      {
        cache: "no-cache",
      },
    ) as ProposalVotesResponse;

    if (!data?.votes) {
      return [];
    }

    return data.votes.map((vote) => ({
      id: vote.id,
      voterAddress: getAddress(vote.voter.id),
      supportDetailed: vote.supportDetailed,
      votes: vote.votes,
      weight: parseInt(vote.votes), // Alias for backward compatibility
      reason: vote.reason,
      transactionHash: vote.transactionHash,
      blockTimestamp: vote.blockTimestamp,
      timestamp: vote.blockTimestamp, // Alias for backward compatibility
      nouns: vote.nouns || [],
    }));
  } catch (error) {
    console.error('Failed to fetch proposal votes from Goldsky:', error);
    throw error;
  }
}

export async function getProposalVotesAfterTimestamp(
  proposalId: string,
  timestamp: number,
): Promise<ProposalVote[]> {
  try {
    const data = await graphQLFetch(
      CHAIN_CONFIG.goldskyUrl.primary,
      query,
      { proposalId, timestamp: timestamp.toString() },
      {
        cache: "no-cache",
      },
    ) as ProposalVotesResponse;

    if (!data?.votes) {
      return [];
    }

    return data.votes.map((vote) => ({
      id: vote.id,
      voterAddress: getAddress(vote.voter.id),
      supportDetailed: vote.supportDetailed,
      votes: vote.votes,
      weight: parseInt(vote.votes), // Alias for backward compatibility
      reason: vote.reason,
      transactionHash: vote.transactionHash,
      blockTimestamp: vote.blockTimestamp,
      timestamp: vote.blockTimestamp, // Alias for backward compatibility
      nouns: vote.nouns || [],
    }));
  } catch (error) {
    console.error('Failed to fetch proposal votes after timestamp from Goldsky:', error);
    throw error;
  }
}