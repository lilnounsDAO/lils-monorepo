"use client";
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { 
  VrgdaPoolSeed, 
  VrgdaPoolStatus, 
  VrgdaFilters, 
  VrgdaSortField, 
  SortDirection 
} from '../vrgda/types';
import { getVrgdaPoolSeeds, getLatestVrgdaSeeds } from '../vrgda/getVrgdaPoolSeeds';
import { getVrgdaSeedByBlock } from '../vrgda/getVrgdaSeedByBlock';
import { getVrgdaPoolStatus } from '../vrgda/getVrgdaPoolStatus';
import { isSepoliaNetwork } from '@/utils/networkDetection';

// Query for VRGDA pool status
export function useVrgdaPoolStatus() {
  const isSepolia = isSepoliaNetwork();
  return useQuery({
    queryKey: ['vrgda-pool-status'],
    queryFn: () => getVrgdaPoolStatus(),
    enabled: !isSepolia, // Disable on Sepolia - not indexed in Ponder yet
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });
}

// Query for latest VRGDA seeds
export function useLatestVrgdaSeeds(limit: number = 10) {
  const isSepolia = isSepoliaNetwork();
  return useQuery({
    queryKey: ['vrgda-latest-seeds', limit],
    queryFn: () => getLatestVrgdaSeeds(limit),
    enabled: !isSepolia, // Disable on Sepolia - not indexed in Ponder yet
    staleTime: 12000, // 12 seconds (close to block time)
    refetchInterval: 15000, // 15 seconds
  });
}

// Query for a specific VRGDA seed by block
export function useVrgdaSeedByBlock(blockNumber: string | null) {
  const isSepolia = isSepoliaNetwork();
  return useQuery({
    queryKey: ['vrgda-seed-by-block', blockNumber],
    queryFn: () => blockNumber ? getVrgdaSeedByBlock(blockNumber) : null,
    enabled: !!blockNumber && !isSepolia, // Disable on Sepolia - not indexed in Ponder yet
    staleTime: 300000, // 5 minutes (seeds don't change once created)
  });
}

// Query for paginated VRGDA seeds with filters
export function useVrgdaPoolSeeds(
  filters: VrgdaFilters = {},
  sortField: VrgdaSortField = 'blockNumber',
  sortDirection: SortDirection = 'desc',
  limit: number = 50
) {
  const isSepolia = isSepoliaNetwork();
  return useQuery({
    queryKey: ['vrgda-pool-seeds', filters, sortField, sortDirection, limit],
    queryFn: () => getVrgdaPoolSeeds(filters, sortField, sortDirection, limit, 0),
    enabled: !isSepolia, // Disable on Sepolia - not indexed in Ponder yet
    staleTime: 30000, // 30 seconds
  });
}

// Infinite query for VRGDA seeds (for pagination)
export function useInfiniteVrgdaPoolSeeds(
  filters: VrgdaFilters = {},
  sortField: VrgdaSortField = 'blockNumber',
  sortDirection: SortDirection = 'desc',
  limit: number = 50
) {
  const isSepolia = isSepoliaNetwork();
  return useInfiniteQuery({
    queryKey: ['vrgda-pool-seeds-infinite', filters, sortField, sortDirection, limit],
    queryFn: ({ pageParam = 0 }) => 
      getVrgdaPoolSeeds(filters, sortField, sortDirection, limit, pageParam),
    enabled: !isSepolia, // Disable on Sepolia - not indexed in Ponder yet
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => 
      lastPage.hasMore ? allPages.length * limit : undefined,
    staleTime: 30000,
  });
}

// Helper hook for available seeds only
export function useAvailableVrgdaSeeds(limit: number = 50) {
  return useVrgdaPoolSeeds(
    { isUsed: false }, 
    'blockNumber', 
    'desc', 
    limit
  );
}

// Helper hook for upcoming auction seeds (next few available)
export function useUpcomingAuctionSeeds(count: number = 5) {
  const isSepolia = isSepoliaNetwork();
  return useQuery({
    queryKey: ['vrgda-upcoming-auction-seeds', count],
    queryFn: () => getVrgdaPoolSeeds(
      { isUsed: false },
      'blockNumber',
      'asc', // ascending to get oldest available first
      count,
      0
    ),
    enabled: !isSepolia, // Disable on Sepolia - not indexed in Ponder yet
    staleTime: 15000, // 15 seconds
    select: (data) => data.seeds,
  });
}
