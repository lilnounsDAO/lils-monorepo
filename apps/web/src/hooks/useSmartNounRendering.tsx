// Smart Noun Rendering Hook
// Uses worker-filtered noun IDs for intelligent fetch strategy

import { useEffect, useState, useMemo } from 'react';
import { useFilterEngine } from '@/contexts/FilterEngineContext';
import { Noun } from '@/data/noun/types';
import { CHAIN_CONFIG } from '@/config';
import { GetNounsPaginatedDocument, OrderDirection } from '@/data/generated/ponder/clean-graphql';
import { transformVpsNounToNoun } from '@/data/noun/helpers';
import { useNounFilters } from '@/hooks/useNounFilters';

// GraphQL query to fetch nouns by specific IDs
const GetNounsByIdsDocument = `
  query GetNounsByIds($ids: [String!]!, $orderBy: String, $orderDirection: OrderDirection) {
    nouns(where: { id_in: $ids }, orderBy: $orderBy, orderDirection: $orderDirection, limit: 10000) {
      items {
        id
        owner
        delegate
        background
        body
        accessory
        head
        glasses
        createdAt
        updatedAt
      }
    }
  }
`;

const SMALL_RESULT_THRESHOLD = 200; // If filtered results < 200, fetch all at once
const MEDIUM_RESULT_THRESHOLD = 1000; // If < 1000, use larger page size
const LARGE_PAGE_SIZE = 200;
const SMALL_PAGE_SIZE = 100;

interface SmartRenderingResult {
  nouns: Noun[];
  isLoading: boolean;
  totalMatching: number;
  loadMore: () => void;
  hasMore: boolean;
}

export function useSmartNounRendering(
  sortOrder: 'newest' | 'oldest' = 'newest'
): SmartRenderingResult {
  const { filterEngine, filteredNounCount } = useFilterEngine();
  const filters = useNounFilters();
  
  // Normalized state: stable entity map + ordered IDs
  const [nounIds, setNounIds] = useState<string[]>([]);
  const [nounEntities, setNounEntities] = useState<Map<string, Noun>>(() => new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [matchingNounIds, setMatchingNounIds] = useState<string[]>([]);
  const [currentOffset, setCurrentOffset] = useState(0);
  const BATCH_SIZE = 100;

  const orderDirection = sortOrder === 'newest' ? OrderDirection.Desc : OrderDirection.Asc;
  const hasMore = currentOffset + BATCH_SIZE < matchingNounIds.length;
  
  // Derive nouns array from normalized state (for backwards compatibility)
  const nouns = useMemo(() => {
    return nounIds.map(id => nounEntities.get(id)!).filter(Boolean);
  }, [nounIds, nounEntities]);

  // Get filtered noun IDs from worker when filters change
  useEffect(() => {
    console.log('🔍 Filter effect triggered:', { 
      hasEngine: !!filterEngine, 
      filteredCount: filteredNounCount,
      filters: filters.totalCount 
    });

    if (!filterEngine) {
      console.log('⏸️ No filter engine yet');
      setIsLoading(true); // Keep loading until engine is ready
      return;
    }

    const getFilteredIds = async () => {
      try {
        setIsLoading(true); // Start loading when fetching IDs
        
        // Apply filters to get matching noun IDs from worker
        const nounFilters = {
          background: filters.background.length > 0 ? filters.background.map(Number) : undefined,
          body: filters.body.length > 0 ? filters.body.map(Number) : undefined,
          accessory: filters.accessory.length > 0 ? filters.accessory.map(Number) : undefined,
          head: filters.head.length > 0 ? filters.head.map(Number) : undefined,
          glasses: filters.glasses.length > 0 ? filters.glasses.map(Number) : undefined,
        };

        console.log('🎯 Applying filters to worker:', nounFilters);
        const result = await filterEngine.applyFilters(nounFilters);
        console.log('📊 Worker returned:', result.total, 'matching nouns');
        
        // If no matches, set empty and return
        if (result.total === 0) {
          console.log('❌ No matching nouns');
          setNounIds([]);
          setNounEntities(new Map());
          setMatchingNounIds([]);
          setCurrentOffset(0);
          setIsLoading(false);
          return;
        }
        
        // Sort noun IDs based on sort order
        const sortedIds = [...result.matchingNounIds].sort((a, b) => {
          const numA = parseInt(a);
          const numB = parseInt(b);
          return sortOrder === 'newest' ? numB - numA : numA - numB;
        });

        console.log('✅ Got', sortedIds.length, 'matching noun IDs from worker, setting state...');
        setMatchingNounIds(sortedIds);
        setCurrentOffset(0); // Reset offset when filters change
        console.log('✅ State updated with', sortedIds.length, 'IDs');
      } catch (error) {
        console.error('❌ Error getting filtered IDs:', error);
        setIsLoading(false);
      }
    };

    getFilteredIds();
  }, [filterEngine, filters.background, filters.body, filters.accessory, filters.head, filters.glasses, sortOrder]);

  // Fetch initial batch when matching IDs change
  useEffect(() => {
    console.log('🚀 Initial fetch effect triggered:', { 
      hasEngine: !!filterEngine, 
      idCount: matchingNounIds.length,
      currentOffset
    });

    if (!filterEngine) {
      console.log('⏸️ Skipping fetch: no engine');
      return;
    }

    if (matchingNounIds.length === 0) {
      console.log('⏸️ Skipping fetch: no IDs yet');
      return;
    }

    const fetchInitialNouns = async () => {
      console.log('⏳ Starting initial fetch...');
      
      try {
        const idsToFetch = matchingNounIds.slice(0, BATCH_SIZE);

        console.log('📊 Fetching first', idsToFetch.length, 'nouns');

        const response = await fetch(CHAIN_CONFIG.indexerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: GetNounsByIdsDocument,
            variables: {
              ids: idsToFetch,
              orderBy: "id",
              orderDirection: orderDirection,
            }
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.errors) {
          console.error('❌ GraphQL errors:', result.errors);
          throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
        }

        const vpsResponse = result.data;

        if (!vpsResponse) {
          console.error('❌ No data in GraphQL response:', result);
          throw new Error('No data returned from GraphQL query');
        }

        if (vpsResponse?.nouns?.items) {
          const fetchedNouns = vpsResponse.nouns.items.map((noun: any) => transformVpsNounToNoun(noun));
          console.log('✅ Loaded', fetchedNouns.length, 'initial nouns');
          
          // Initialize normalized state with stable entities
          const entities = new Map<string, Noun>();
          const ids: string[] = [];
          
          for (const noun of fetchedNouns) {
            entities.set(noun.id, noun);
            ids.push(noun.id);
          }
          
          setNounEntities(entities);
          setNounIds(ids);
          setCurrentOffset(BATCH_SIZE);
        } else {
          console.warn('⚠️ No nouns.items in response:', vpsResponse);
          setNounEntities(new Map());
          setNounIds([]);
        }
      } catch (error) {
        console.error('❌ Error fetching initial nouns:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInitialNouns();
  }, [matchingNounIds, orderDirection, filterEngine]);

  // Load more function
  const loadMore = async () => {
    if (!hasMore || isLoading) {
      console.log('⏸️ Cannot load more:', { hasMore, isLoading });
      return;
    }

    console.log('📥 Loading more nouns from offset:', currentOffset);
    setIsLoading(true);

    try {
      const idsToFetch = matchingNounIds.slice(currentOffset, currentOffset + BATCH_SIZE);

      console.log('📊 Fetching next', idsToFetch.length, 'nouns');

      const response = await fetch(CHAIN_CONFIG.indexerUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: GetNounsByIdsDocument,
          variables: {
            ids: idsToFetch,
            orderBy: "id",
            orderDirection: orderDirection,
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.errors) {
        console.error('❌ GraphQL errors:', result.errors);
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      const vpsResponse = result.data;

      if (!vpsResponse) {
        console.error('❌ No data in GraphQL response:', result);
        throw new Error('No data returned from GraphQL query');
      }

      if (vpsResponse?.nouns?.items) {
        const fetchedNouns = vpsResponse.nouns.items.map((noun: any) => transformVpsNounToNoun(noun));
        console.log('✅ Loaded', fetchedNouns.length, 'more nouns, appending...');
        
        // APPEND to normalized state without touching existing entities
        setNounEntities(prev => {
          const next = new Map(prev);
          for (const noun of fetchedNouns) {
            if (!next.has(noun.id)) {
              next.set(noun.id, noun); // Only add truly new nouns
            }
          }
          return next;
        });
        
        setNounIds(prev => {
          const seen = new Set(prev);
          const newIds: string[] = [];
          
          for (const noun of fetchedNouns) {
            if (!seen.has(noun.id)) {
              newIds.push(noun.id);
            }
          }
          
          console.log('✅ Appending', newIds.length, 'new IDs. Total:', prev.length + newIds.length);
          return [...prev, ...newIds];
        });
        
        setCurrentOffset(prev => prev + BATCH_SIZE);
      } else {
        console.warn('⚠️ No nouns.items in response:', vpsResponse);
      }
    } catch (error) {
      console.error('❌ Error loading more nouns:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    nouns,
    isLoading,
    totalMatching: filteredNounCount,
    loadMore,
    hasMore,
  };
}


