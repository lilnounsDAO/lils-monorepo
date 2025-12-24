"use client";
import { useState, useEffect, useCallback } from "react";
import { Noun } from "@/data/noun/types";
import { getNounsPaginated } from "@/data/noun/getAllNouns";
import NounExplorer from "./NounExplorer";
import { Skeleton } from "./ui/skeleton";
import AnimationGird from "./NounExplorer/NounGrid/AnimationGrid";

export default function NounExplorerWithInfiniteScroll() {
  const [nouns, setNouns] = useState<Noun[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadNouns = useCallback(async (pageNum: number, reset = false) => {
    try {
      if (pageNum === 0) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      console.log(`🔄 Loading page ${pageNum} with 50 nouns...`);
      const result = await getNounsPaginated(pageNum, 50);
      
      console.log('📊 Page result:', {
        page: pageNum,
        nounsCount: result.nouns?.length || 0,
        hasMore: result.hasMore,
        firstNoun: result.nouns?.[0]?.id || 'none',
        lastNoun: result.nouns?.[result.nouns.length - 1]?.id || 'none'
      });

      if (reset) {
        setNouns(result.nouns);
      } else {
        setNouns(prev => [...prev, ...result.nouns]);
      }
      
      setHasMore(result.hasMore);
      setError(null);
    } catch (err) {
      console.error('❌ Error loading nouns:', err);
      setError(err instanceof Error ? err.message : 'Failed to load nouns');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Load initial page
  useEffect(() => {
    loadNouns(0, true);
  }, [loadNouns]);

  // Infinite scroll handler
  useEffect(() => {
    const handleScroll = () => {
      if (
        window.innerHeight + document.documentElement.scrollTop + 1000 >= 
        document.documentElement.offsetHeight &&
        !loadingMore &&
        hasMore
      ) {
        const nextPage = page + 1;
        setPage(nextPage);
        loadNouns(nextPage);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadNouns, loadingMore, hasMore, page]);

  if (loading) {
    return (
      <div className="w-full">
        <AnimationGird
          items={Array(40)
            .fill(0)
            .map((_, i) => ({
              element: (
                <Skeleton className="relative flex aspect-square h-full w-full rounded-2xl bg-background-secondary" />
              ),
              id: i,
            }))}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <h4 className="mb-2">Error loading nouns</h4>
        <p className="text-gray-600 mb-4">{error}</p>
        <button 
          onClick={() => {
            setPage(0);
            loadNouns(0, true);
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div>
      <NounExplorer nouns={nouns} />
      
      {/* Loading more indicator */}
      {loadingMore && (
        <div className="flex justify-center py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 max-w-6xl">
            {Array(12).fill(0).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-2xl bg-background-secondary" />
            ))}
          </div>
        </div>
      )}
      
      {/* End of results */}
      {!hasMore && nouns.length > 0 && (
        <div className="flex justify-center py-8">
          <p className="text-gray-600">No more nouns to load</p>
        </div>
      )}
    </div>
  );
}