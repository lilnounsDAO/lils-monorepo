"use client";
import { useState, useCallback, useEffect } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getNounsPaginatedCursor } from '@/data/noun/getAllNouns';
import { Noun } from '@/data/noun/types';

interface UsePaginatedNounsOptions {
  pageSize?: number;
  enabled?: boolean;
  onNewNouns?: (newNouns: Noun[]) => void;
}

export function usePaginatedNouns({
  pageSize = 100,
  enabled = true,
  onNewNouns
}: UsePaginatedNounsOptions = {}) {
  const [newNounIds, setNewNounIds] = useState<Set<string>>(new Set());

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['paginated-nouns-cursor', pageSize],
    queryFn: async ({ pageParam = 0 }) => {
      console.log('🔄 Fetching ordered page:', pageParam);
      const result = await getNounsPaginatedCursor(pageParam, pageSize);
      console.log('✅ Ordered page fetched:', { 
        page: pageParam, 
        count: result.nouns.length, 
        hasMore: result.hasMore
      });
      return result;
    },
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length; // Next page number
    },
    initialPageParam: 0, // Start with page 0
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    enabled,
  });

  // Flatten all pages into a single array of nouns
  const allNouns = data?.pages.flatMap(page => page.nouns) ?? [];

  // Track new nouns for animations
  useEffect(() => {
    if (data?.pages && data.pages.length > 1) {
      // Get the latest page (excluding the first one)
      const latestPage = data.pages[data.pages.length - 1];
      if (latestPage?.nouns) {
        const newIds = new Set(latestPage.nouns.map(noun => noun.id));
        setNewNounIds(newIds);
        onNewNouns?.(latestPage.nouns);
        
        // Clear the "new" status after a delay
        setTimeout(() => {
          setNewNounIds(new Set());
        }, 3000);
      }
    }
  }, [data?.pages, onNewNouns]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Auto-load more when reaching the end
  const handleScroll = useCallback((container: HTMLElement) => {
    const { scrollTop, scrollHeight, clientHeight } = container;
    const threshold = 1000; // Load more when 1000px from bottom
    
    if (scrollHeight - scrollTop - clientHeight < threshold && hasNextPage && !isFetchingNextPage) {
      loadMore();
    }
  }, [hasNextPage, isFetchingNextPage, loadMore]);

  return {
    // Data
    nouns: allNouns,
    newNounIds,
    totalLoaded: allNouns.length,
    
    // Loading states
    isLoading,
    isError,
    error,
    isFetching,
    isFetchingNextPage,
    
    // Pagination
    hasNextPage,
    loadMore,
    handleScroll,
    
    // Utils
    refetch,
  };
}