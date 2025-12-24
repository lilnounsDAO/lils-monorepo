"use client";
import { CHAIN_CONFIG } from "@/config";
import { Noun } from "@/data/noun/types";
import { useNounFilters } from "@/hooks/useNounFilters";
import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { isAddressEqual } from "viem";
import { motion } from "framer-motion";
import NounGrid from "./NounGrid/NounGrid";
import NounFilter from "./NounFilter";
import { ActiveFilters, SortOrder } from "./NounFilter/ActiveFilters";
import { useFilterEngine } from "@/contexts/FilterEngineContext";

interface NounExplorerProps {
  nouns: Noun[];
  onSortChange?: (sortOrder: SortOrder) => void;
}

export default function NounExplorer({
  nouns,
  onSortChange
}: NounExplorerProps) {
  const filters = useNounFilters();
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const { filteredNounCount } = useFilterEngine();

  const handleSortChange = (newSortOrder: SortOrder) => {
    setSortOrder(newSortOrder);
    onSortChange?.(newSortOrder);
  };

  // Simple client-side sorting (no filtering - worker handles that)
  const sortedNouns = useMemo(() => {
    const filtered = nouns.filter((noun) => {
      const backgroundMatch =
        filters.background.length === 0 ||
        filters.background.includes(noun.traits.background.seed.toString());
      const headMatch =
        filters.head.length === 0 ||
        filters.head.includes(noun.traits.head.seed.toString());
      const glassesMatch =
        filters.glasses.length === 0 ||
        filters.glasses.includes(noun.traits.glasses.seed.toString());
      const bodyMatch =
        filters.body.length === 0 ||
        filters.body.includes(noun.traits.body.seed.toString());
      const accessoryMatch =
        filters.accessory.length === 0 ||
        filters.accessory.includes(noun.traits.accessory.seed.toString());
      const treasuryNounMatch =
        !filters.heldByTreasury ||
        isAddressEqual(noun.owner, CHAIN_CONFIG.addresses.nounsTreasury);
      const buyNowMatch = !filters.buyNow || noun.secondaryListing !== undefined;

      return (
        backgroundMatch &&
        headMatch &&
        glassesMatch &&
        bodyMatch &&
        accessoryMatch &&
        treasuryNounMatch &&
        buyNowMatch
      );
    });

    // Sort the filtered nouns
    return filtered.sort((a, b) => {
      const aId = BigInt(a.id);
      const bId = BigInt(b.id);
      
      if (sortOrder === "newest") {
        return bId > aId ? 1 : -1; // Descending (newest first)
      } else {
        return aId > bId ? 1 : -1; // Ascending (oldest first)
      }
    });
  }, [filters, nouns, sortOrder]);

  // Throttled loadMore function to prevent multiple rapid calls
  const throttledLoadMore = useCallback(() => {
    if (loadMoreThrottleRef.current || isFetchingNextPage || !hasNextPage || !loadMore) {
      return;
    }

    loadMoreThrottleRef.current = true;

    loadMore();

    // Reset throttle after a longer delay to prevent rapid firing
    setTimeout(() => {
      loadMoreThrottleRef.current = false;
    }, 2000); // Increased from 1000ms to 2000ms
  }, [loadMore, isFetchingNextPage, hasNextPage]);

  // Infinite scroll implementation with debouncing
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage || !loadMoreTriggerRef.current) {
      return;
    }

    // Ensure we have enough items before enabling infinite scroll
    if (filteredAndSortedNouns.length < 20) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        // Only trigger if truly intersecting and not already loading
        if (entry.isIntersecting && entry.intersectionRatio > 0 && hasNextPage && !isFetchingNextPage && !loadMoreThrottleRef.current) {
          console.log('🔄 Infinite scroll triggered in NounExplorer');
          throttledLoadMore();
        }
      },
      {
        root: null, // Use viewport instead of container
        rootMargin: '100px', // Reduced from 400px - trigger when 100px from bottom
        threshold: 0.01
      }
    );

    const currentTrigger = loadMoreTriggerRef.current;
    observer.observe(currentTrigger);

    return () => {
      if (currentTrigger) {
        observer.unobserve(currentTrigger);
      }
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, throttledLoadMore, filteredAndSortedNouns.length]);

  return (
    <motion.div
      layout
      className="flex w-full flex-col md:flex-row md:gap-8"
      id="explore-section"
    >
      {/* Filter Sidebar with layout animation */}
      <motion.div layout className="shrink-0">
        <NounFilter />
      </motion.div>
      
      {/* Main Content Area - Flexible width with layout animation */}
      <motion.div layout className="flex min-w-0 flex-[2] flex-col">
        <motion.div layout className="sticky top-[63px] z-[8]">
          <ActiveFilters 
            numNouns={filteredNounCount > 0 ? filteredNounCount : filteredAndSortedNouns.length} 
            onSortChange={handleSortChange} 
          />
        </motion.div>
        <div
          ref={scrollContainerRef}
          className="min-h-[calc(100dvh-108px)] overflow-y-auto md:min-h-[calc(100vh-64px)]"
          onScroll={handleScroll ? (e: React.UIEvent<HTMLDivElement>) => handleScroll(e.currentTarget) : undefined}
        >
          <NounGrid
            nouns={filteredAndSortedNouns}
          />

          {/* Infinite Scroll Trigger */}
          {hasNextPage && (
            <div
              ref={loadMoreTriggerRef}
              className="flex justify-center items-center py-8 h-20"
            >
              {isFetchingNextPage ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                  <span className="text-gray-600">Loading more nouns...</span>
                </div>
              ) : (
                <div className="text-gray-500 text-sm">
                  Scroll for more nouns
                </div>
              )}
            </div>
          )}
          
          {/* End of Results */}
          {!hasNextPage && filteredAndSortedNouns.length > 0 && (
            <div 
              className="flex justify-center items-center py-8 text-gray-500"
            >
              <span>You've reached the end! Total nouns: {filteredAndSortedNouns.length}</span>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
