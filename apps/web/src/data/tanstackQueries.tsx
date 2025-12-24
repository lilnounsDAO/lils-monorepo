import { BigIntString } from "@/utils/types";
import { Auction } from "./auction/types";
import { Noun, SecondaryNounListing, SecondaryNounOffer } from "./noun/types";
import { Address } from "viem";
import { ProposalVote } from "./goldsky/governance/common";
import { safeFetch } from "@/utils/safeFetch";

// Import data functions for direct calling (avoiding API routes)
import { getCurrentAuctionNounId } from "./auction/getCurrentAuctionNounId";
import { getAuctionById } from "./auction/getAuctionById";
import { getNounById } from "./noun/getNounById";
import { detectChainFromHostname } from "@/utils/networkDetection";

// Import new Ponder functions
import { 
  VrgdaPoolSeed, 
  VrgdaPoolStatus, 
  PonderNoun 
} from "./ponder";

export function currentAuctionIdQuery() {
  // Include chain ID in query key to prevent cross-chain cache pollution
  const chainId = typeof window !== 'undefined' ? detectChainFromHostname() : 1;
  return {
    queryKey: ["current-auction-id", chainId],
    queryFn: async () => await getCurrentAuctionNounId(),
  };
}

export function auctionQuery(id?: BigIntString) {
  return {
    queryKey: ["auction", id],
    queryFn: async () => {
      if (!id) return undefined;
      return await getAuctionById(id);
    },
    enabled: !!id,
  };
}

export function nounQuery(id?: BigIntString) {
  return {
    queryKey: ["noun", id],
    queryFn: async () => {
      if (!id) return undefined;
      return await getNounById(id);
    },
    enabled: !!id,
  };
}

export function secondaryFloorListingQuery() {
  return {
    queryKey: ["secondary-floor-listing"],
    queryFn: async () =>
      await safeFetch<SecondaryNounListing>(`/api/secondary-floor-listing`),
  };
}

export function secondaryTopOfferQuery() {
  return {
    queryKey: ["secondary-top-offer"],
    queryFn: async () =>
      await safeFetch<SecondaryNounOffer>(`/api/secondary-top-offer`),
  };
}

export function nogsQuery(nounId: string) {
  return {
    queryKey: ["nogs", nounId],
    queryFn: async () => await safeFetch<number>(`/api/noun/${nounId}/nogs`),
  };
}

export function proposalVotesAfterTimestampQuery(
  proposalId: number,
  timestamp: number,
) {
  return {
    queryKey: ["proposal-votes-after-timestamp", proposalId, timestamp],
    queryFn: async () =>
      await safeFetch<ProposalVote[]>(`/api/votes/${proposalId}/${timestamp}`),
  };
}

// === NEW PONDER QUERY FUNCTIONS ===

// Noun queries using Ponder GraphQL
export function ponderNounQuery(id?: string) {
  return {
    queryKey: ["ponder-noun", id],
    queryFn: async () => {
      if (!id) return null;
      const { getNounById } = await import("./ponder");
      return await getNounById(id);
    },
    enabled: !!id,
    staleTime: 300000, // 5 minutes
  };
}

export function ponderNounsForAddressQuery(address?: Address, limit: number = 50) {
  return {
    queryKey: ["ponder-nouns-for-address", address, limit],
    queryFn: async () => {
      if (!address) return [];
      const { getNounsForAddress } = await import("./ponder");
      const result = await getNounsForAddress(address, limit);
      return result.nouns;
    },
    enabled: !!address,
    staleTime: 60000, // 1 minute
  };
}

// VRGDA queries
export function vrgdaPoolStatusQuery() {
  return {
    queryKey: ["vrgda-pool-status"],
    queryFn: async () => {
      const { getVrgdaPoolStatus } = await import("./ponder");
      return await getVrgdaPoolStatus();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  };
}

export function latestVrgdaSeedsQuery(limit: number = 10) {
  return {
    queryKey: ["latest-vrgda-seeds", limit],
    queryFn: async () => {
      const { getLatestVrgdaSeeds } = await import("./ponder");
      return await getLatestVrgdaSeeds(limit);
    },
    staleTime: 12000, // 12 seconds
    refetchInterval: 15000, // 15 seconds
  };
}

export function vrgdaSeedByBlockQuery(blockNumber?: string) {
  return {
    queryKey: ["vrgda-seed-by-block", blockNumber],
    queryFn: async () => {
      if (!blockNumber) return null;
      const { getVrgdaSeedByBlock } = await import("./ponder");
      return await getVrgdaSeedByBlock(blockNumber);
    },
    enabled: !!blockNumber,
    staleTime: 300000, // 5 minutes (seeds don't change)
  };
}

export function availableVrgdaSeedsQuery(limit: number = 50) {
  return {
    queryKey: ["available-vrgda-seeds", limit],
    queryFn: async () => {
      const { getAvailableVrgdaSeeds } = await import("./ponder");
      const result = await getAvailableVrgdaSeeds(limit);
      return result.seeds;
    },
    staleTime: 30000, // 30 seconds
  };
}

export function upcomingAuctionSeedsQuery(count: number = 5) {
  return {
    queryKey: ["upcoming-auction-seeds", count],
    queryFn: async () => {
      const { getVrgdaPoolSeeds } = await import("./ponder");
      const result = await getVrgdaPoolSeeds(
        { isUsed: false },
        'blockNumber',
        'asc', // Ascending to get oldest available first
        count
      );
      return result.seeds;
    },
    staleTime: 15000, // 15 seconds
  };
}