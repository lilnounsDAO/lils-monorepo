"use client";
import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { 
  PonderNoun, 
  NounFilters, 
  NounSortField, 
  SortDirection 
} from '../nouns/types';
import { getNounById } from '../nouns/getNounById';
import { getNounsForAddress } from '../nouns/getNounsForAddress';
import { getNounsPaginated } from '../nouns/getNounsPaginated';

// Query for a specific noun by ID
export function useNounById(id: string | null) {
  return useQuery({
    queryKey: ['noun-by-id', id],
    queryFn: () => id ? getNounById(id) : null,
    enabled: !!id,
    staleTime: 300000, // 5 minutes (noun data rarely changes)
  });
}

// Query for nouns owned by an address
export function useNounsForAddress(address: string | null, limit: number = 50) {
  return useQuery({
    queryKey: ['nouns-for-address', address, limit],
    queryFn: () => address ? getNounsForAddress(address, limit, 0) : { nouns: [], hasMore: false },
    enabled: !!address,
    staleTime: 60000, // 1 minute
    select: (data) => data.nouns,
  });
}

// Query for paginated nouns with filters
export function useNounsPaginated(
  filters: NounFilters = {},
  sortField: NounSortField = 'id',
  sortDirection: SortDirection = 'desc',
  limit: number = 50
) {
  return useQuery({
    queryKey: ['nouns-paginated', filters, sortField, sortDirection, limit],
    queryFn: () => getNounsPaginated(filters, sortField, sortDirection, limit, 0),
    staleTime: 60000, // 1 minute
  });
}

// Infinite query for nouns (for pagination)
export function useInfiniteNouns(
  filters: NounFilters = {},
  sortField: NounSortField = 'id',
  sortDirection: SortDirection = 'desc',
  limit: number = 50
) {
  return useInfiniteQuery({
    queryKey: ['nouns-infinite', filters, sortField, sortDirection, limit],
    queryFn: ({ pageParam = 0 }) => 
      getNounsPaginated(filters, sortField, sortDirection, limit, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => 
      lastPage.hasMore ? allPages.length * limit : undefined,
    staleTime: 60000,
  });
}

// Helper hook for nouns by trait
export function useNounsByTrait(
  trait: 'background' | 'body' | 'accessory' | 'head' | 'glasses',
  value: number,
  limit: number = 20
) {
  const filters: NounFilters = {
    [trait]: value
  };

  return useNounsPaginated(filters, 'id', 'desc', limit);
}

// Helper hook for nouns with multiple traits
export function useNounsByTraits(traits: Partial<Record<keyof NounFilters, number>>, limit: number = 20) {
  const filters: NounFilters = {};
  
  Object.entries(traits).forEach(([key, value]) => {
    if (value !== undefined) {
      (filters as any)[key] = value;
    }
  });

  return useNounsPaginated(filters, 'id', 'desc', limit);
}

// Helper hook for recently created nouns
export function useRecentNouns(limit: number = 10) {
  return useNounsPaginated({}, 'createdAt', 'desc', limit);
}
