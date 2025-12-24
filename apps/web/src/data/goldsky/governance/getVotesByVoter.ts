import { graphQLFetch } from "@/data/utils/graphQLFetch";
import { CHAIN_CONFIG } from "@/config";
import { Vote } from "@/data/generated/goldsky/graphql";
import { getAddress, Address } from "viem";

const votesByVoterQuery = `
  query GetVotesByVoter($voterAddress: ID!) {
    votes(
      first: 1000
      orderBy: blockTimestamp
      orderDirection: desc
      where: {
        voter: $voterAddress
      }
    ) {
      id
      proposal {
        id
      }
      votes
      blockTimestamp
    }
  }
`;

interface VotesByVoterResponse {
  votes: Array<{
    id: string;
    proposal: {
      id: string;
    };
    votes: string;
    blockTimestamp: string;
  }>;
}

/**
 * Get the number of unique proposals a voter has voted on with weight > 0
 */
export async function getProposalsVotedCount(
  voterAddress: Address
): Promise<number> {
  try {
    const normalizedAddress = getAddress(voterAddress).toLowerCase();
    
    const data = await graphQLFetch(
      CHAIN_CONFIG.goldskyUrl.primary,
      votesByVoterQuery,
      { voterAddress: normalizedAddress },
      {
        cache: "no-cache",
      }
    ) as VotesByVoterResponse;

    if (!data?.votes) {
      return 0;
    }

    // Filter votes with weight > 0 and get unique proposals
    const proposalsWithVotes = new Set<string>();
    
    data.votes.forEach((vote) => {
      const weight = parseInt(vote.votes);
      if (weight > 0 && vote.proposal?.id) {
        proposalsWithVotes.add(vote.proposal.id);
      }
    });

    return proposalsWithVotes.size;
  } catch (error) {
    console.error("Failed to fetch votes by voter from Goldsky:", error);
    // Try fallback URL
    try {
      const normalizedAddress = getAddress(voterAddress).toLowerCase();
      const data = await graphQLFetch(
        CHAIN_CONFIG.goldskyUrl.fallback,
        votesByVoterQuery,
        { voterAddress: normalizedAddress },
        {
          cache: "no-cache",
        }
      ) as VotesByVoterResponse;

      if (!data?.votes) {
        return 0;
      }

      const proposalsWithVotes = new Set<string>();
      data.votes.forEach((vote) => {
        const weight = parseInt(vote.votes);
        if (weight > 0 && vote.proposal?.id) {
          proposalsWithVotes.add(vote.proposal.id);
        }
      });

      return proposalsWithVotes.size;
    } catch (fallbackError) {
      console.error("Failed to fetch votes by voter from fallback:", fallbackError);
      return 0;
    }
  }
}

