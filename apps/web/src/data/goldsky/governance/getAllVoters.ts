import { graphQLFetch } from "@/data/utils/graphQLFetch";
import { CHAIN_CONFIG } from "@/config";
import { getAddress, Address } from "viem";

const allVotersQuery = `
  query GetAllVoters($first: Int!, $skip: Int!) {
    votes(
      first: $first
      skip: $skip
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      voter {
        id
      }
      proposal {
        id
      }
      votes
      blockTimestamp
    }
  }
`;

interface AllVotersResponse {
  votes: Array<{
    id: string;
    voter: {
      id: string;
    };
    proposal: {
      id: string;
    };
    votes: string;
    blockTimestamp: string;
  }>;
}

export interface VoterProfile {
  address: Address;
  proposalsVotedCount: number;
  totalVotes: number;
}

/**
 * Get all unique voters with their voting statistics
 */
export async function getAllVoters(
  limit: number = 1000
): Promise<VoterProfile[]> {
  try {
    const allVotes: AllVotersResponse['votes'] = [];
    let skip = 0;
    const batchSize = 1000;
    let hasMore = true;

    // Fetch all votes in batches
    while (hasMore && allVotes.length < limit) {
      const data = await graphQLFetch(
        CHAIN_CONFIG.goldskyUrl.primary,
        allVotersQuery,
        { first: batchSize, skip },
        {
          cache: "no-cache",
        }
      ) as AllVotersResponse | null;

      if (!data?.votes || data.votes.length === 0) {
        hasMore = false;
        break;
      }

      allVotes.push(...data.votes);
      skip += batchSize;

      if (data.votes.length < batchSize) {
        hasMore = false;
      }
    }

    // Aggregate votes by voter address
    const voterMap = new Map<string, { proposals: Set<string>; totalVotes: number }>();

    allVotes.forEach((vote) => {
      const voterAddress = getAddress(vote.voter.id).toLowerCase();
      const weight = parseInt(vote.votes);
      
      if (weight > 0 && vote.proposal?.id) {
        if (!voterMap.has(voterAddress)) {
          voterMap.set(voterAddress, {
            proposals: new Set(),
            totalVotes: 0,
          });
        }

        const voterData = voterMap.get(voterAddress)!;
        voterData.proposals.add(vote.proposal.id);
        voterData.totalVotes += weight;
      }
    });

    // Convert to array of VoterProfile
    const voters: VoterProfile[] = Array.from(voterMap.entries()).map(([address, data]) => ({
      address: getAddress(address) as Address,
      proposalsVotedCount: data.proposals.size,
      totalVotes: data.totalVotes,
    }));

    // Sort by proposals voted count (descending), then by total votes
    voters.sort((a, b) => {
      if (b.proposalsVotedCount !== a.proposalsVotedCount) {
        return b.proposalsVotedCount - a.proposalsVotedCount;
      }
      return b.totalVotes - a.totalVotes;
    });

    // Limit the number of voters returned
    return voters.slice(0, limit);
  } catch (error) {
    console.error("Failed to fetch all voters from Goldsky:", error);
    // Try fallback URL
    try {
      const allVotes: AllVotersResponse['votes'] = [];
      let skip = 0;
      const batchSize = 1000;
      let hasMore = true;

      while (hasMore && allVotes.length < limit) {
        const data = await graphQLFetch(
          CHAIN_CONFIG.goldskyUrl.fallback,
          allVotersQuery,
          { first: batchSize, skip },
          {
            cache: "no-cache",
          }
        ) as AllVotersResponse | null;

        if (!data?.votes || data.votes.length === 0) {
          hasMore = false;
          break;
        }

        allVotes.push(...data.votes);
        skip += batchSize;

        if (data.votes.length < batchSize) {
          hasMore = false;
        }
      }

      const voterMap = new Map<string, { proposals: Set<string>; totalVotes: number }>();

      allVotes.forEach((vote) => {
        const voterAddress = getAddress(vote.voter.id).toLowerCase();
        const weight = parseInt(vote.votes);
        
        if (weight > 0 && vote.proposal?.id) {
          if (!voterMap.has(voterAddress)) {
            voterMap.set(voterAddress, {
              proposals: new Set(),
              totalVotes: 0,
            });
          }

          const voterData = voterMap.get(voterAddress)!;
          voterData.proposals.add(vote.proposal.id);
          voterData.totalVotes += weight;
        }
      });

      const voters: VoterProfile[] = Array.from(voterMap.entries()).map(([address, data]) => ({
        address: getAddress(address) as Address,
        proposalsVotedCount: data.proposals.size,
        totalVotes: data.totalVotes,
      }));

      voters.sort((a, b) => {
        if (b.proposalsVotedCount !== a.proposalsVotedCount) {
          return b.proposalsVotedCount - a.proposalsVotedCount;
        }
        return b.totalVotes - a.totalVotes;
      });

      // Limit the number of voters returned
      return voters.slice(0, limit);
    } catch (fallbackError) {
      console.error("Failed to fetch all voters from fallback:", fallbackError);
      return [];
    }
  }
}

