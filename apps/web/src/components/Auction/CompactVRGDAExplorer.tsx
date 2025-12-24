"use client";
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion, AnimatePresence } from 'framer-motion';
import { formatEther } from 'viem';

// Components
import { VrgdaSeedItem } from '../../app/vrgda/explore/components/VrgdaSeedItem';
import { VrgdaFilterSidebarNew } from '../../app/vrgda/explore/components/VrgdaFilterSidebarNew';
import { VrgdaDetailsPanel } from '../../app/vrgda/explore/components/VrgdaDetailsPanel';

// Hooks
import { useVrgdaSeeds } from '../../app/vrgda/explore/hooks/useVrgdaSeeds';
import { useVrgdaFiltering } from '../../app/vrgda/explore/hooks/useVrgdaFiltering';
import { useStableSelection } from '../../app/vrgda/explore/hooks/useStableSelection';
import { useVRGDAData } from '@/hooks/useVRGDAData';
import { useVrgdaBookmarks } from '@/hooks/useVrgdaBookmarks';
import { useQuery } from '@tanstack/react-query';
import { readContract } from 'viem/actions';
import { CHAIN_CONFIG } from '@/config';
import { lilVRGDAConfig } from '@/config/lilVRGDAConfig';

// Simple breakpoint hook
function useBreakpointValues<T>(values: Record<string, T>): T | undefined {
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1280);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (windowWidth >= 1024) return values.lg;
  if (windowWidth >= 768) return values.md;
  return values.sm;
}

export const CompactVRGDAExplorer: React.FC = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showFilterSidebar, setShowFilterSidebar] = useState(false);
  const [showSavedView, setShowSavedView] = useState(false);
  
  // VRGDA pricing data
  const { currentPrice, timeToNextDrop, reservePrice } = useVRGDAData();

  // Get the current VRGDA noun ID from contract
  const { data: currentNounId } = useQuery({
    queryKey: ["vrgda-next-noun-id"],
    queryFn: async () => {
      const nextNounId = await readContract(CHAIN_CONFIG.publicClient, {
        ...lilVRGDAConfig,
        functionName: "nextNounId",
      });
      return nextNounId.toString();
    },
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // 1 minute
  });

  // Data fetching with real-time updates
  const {
    seeds,
    isLoading,
    error,
    newSeedIds
  } = useVrgdaSeeds({ 
    limit: 256,
    onNewSeeds: (newSeeds) => {
      console.log('New VRGDA seeds detected:', newSeeds.length);
    }
  });

  // Bookmarking system
  const { bookmarkedSeeds, bookmarkCount } = useVrgdaBookmarks(seeds);

  // Filtering and sorting
  const {
    filteredSeeds,
    activeFilters,
    setActiveFilters,
    sortOrder,
    setSortOrder,
    clearFilters
  } = useVrgdaFiltering(seeds);

  // Convert bookmarked seeds to VrgdaPoolSeed format for display
  const savedSeedsAsPoolSeeds = useMemo(() => {
    return bookmarkedSeeds.map(bookmark => ({
      id: bookmark.nounId,
      nounId: bookmark.nounId,
      blockNumber: bookmark.blockNumber,
      blockHash: bookmark.blockHash,
      background: bookmark.seed.background,
      body: bookmark.seed.body,
      accessory: bookmark.seed.accessory,
      head: bookmark.seed.head,
      glasses: bookmark.seed.glasses,
      generatedAt: bookmark.savedAt.toString(),
    }));
  }, [bookmarkedSeeds]);

  // Choose which seeds to display based on view mode
  const displaySeeds = showSavedView ? savedSeedsAsPoolSeeds : filteredSeeds;

  // Stable selection management
  const {
    selectedSeedId,
    selectedSeed,
    selectSeed,
    clearSelection,
    navigateSelection
  } = useStableSelection(displaySeeds);

  // Escape key handler for hiding selected panel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && selectedSeedId) {
        clearSelection();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedSeedId, clearSelection]);

  // Grid configuration - add one more column then adjust size to fit flush
  const GAP_SIZE = 6;

  // Dynamic responsive columns based on panel states
  const getItemsPerRow = () => {
    const baseColumns = useBreakpointValues({
      lg: 16,  // Two more than the original 14 to fit more
      md: 12,  // Tablet 
      sm: 8,   // Mobile card width
    }) ?? 16;

    // Reduce columns when panels are visible (less aggressive reduction to fit more)
    let adjustment = 0;
    if (showFilterSidebar) adjustment += 2; // Remove 2 columns for filter panel
    if (selectedSeed) adjustment += 3; // Remove 3 columns for details panel
    
    return Math.max(baseColumns - adjustment, 4); // Never go below 4 columns
  };

  const itemsPerRow = getItemsPerRow();

  // Calculate item size to fit flush - smaller to accommodate 16 columns
  const ITEM_SIZE = 84; // Reduced from 96 to fit 16 columns instead of 14

  const totalRows = Math.ceil(displaySeeds.length / itemsPerRow);

  // Virtualization setup - with dependencies for dynamic columns
  const rowVirtualizer = useVirtualizer({
    count: totalRows,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ITEM_SIZE + GAP_SIZE,
    overscan: 2,
    measureElement: (element) => element?.getBoundingClientRect().height ?? ITEM_SIZE + GAP_SIZE,
  });

  const columnVirtualizer = useVirtualizer({
    horizontal: true,
    count: itemsPerRow,
    getScrollElement: () => containerRef.current,
    estimateSize: () => ITEM_SIZE + GAP_SIZE,
    overscan: 1,
    measureElement: (element) => element?.getBoundingClientRect().width ?? ITEM_SIZE + GAP_SIZE,
    // Add key dependencies so virtualizer updates when layout changes
    getItemKey: useCallback((index) => `${itemsPerRow}-${index}`, [itemsPerRow]),
  });

  // Get active filter count
  const getActiveFilterCount = () => {
    return Object.values(activeFilters).reduce((count, values) => {
      return count + (values?.length || 0);
    }, 0);
  };

  // Format time to next drop
  const formatTimeToNextDrop = (seconds: number | undefined) => {
    if (!seconds || seconds <= 0) return "Now";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const currentPriceEth = currentPrice ? parseFloat(formatEther(currentPrice)).toFixed(4) : "—";
  const timeDisplay = formatTimeToNextDrop(timeToNextDrop);

  if (isLoading) {
    return (
      <div className="relative flex h-full min-h-[700px] w-full flex-col justify-center overflow-hidden rounded-2xl border-2 bg-gray-50 md:h-[650px] md:min-h-fit">
        <div className="flex items-center justify-center w-full h-full">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex h-full min-h-[700px] w-full flex-col justify-center overflow-hidden rounded-2xl border-2 bg-gray-50 md:h-[650px] md:min-h-fit">
        <div className="flex items-center justify-center w-full h-full text-red-600">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">Connection Error</div>
            <div className="text-sm">Unable to load VRGDA pool</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[700px] w-full overflow-hidden rounded-2xl border border-gray-200 shadow-lg bg-white md:h-[650px] md:min-h-fit">
      {/* Filter Sidebar - Uses layout animation like original */}
      <AnimatePresence>
        {showFilterSidebar && (
          <motion.div
            key="filter-sidebar"
            layout
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-shrink-0 border-r border-gray-200 overflow-hidden"
          >
            <VrgdaFilterSidebarNew
              activeFilters={activeFilters}
              onFiltersChange={setActiveFilters}
              onClearFilters={clearFilters}
              onClose={() => setShowFilterSidebar(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area - Flexible width with layout animation */}
      <motion.div layout className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 px-4 py-3">
          <div className="flex flex-col gap-3">
            {/* Title and count */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <h3 className="text-xl font-bold text-gray-900">
                  VRGDA Pools
                </h3>
                <motion.span 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }}
                  className="text-sm text-gray-600"
                >
                  <strong>{displaySeeds.length}</strong> {showSavedView ? 'saved' : 'available'}
                </motion.span>
              </div>

              {/* Price info - larger */}
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {currentPriceEth} ETH
                </div>
                <div className="text-sm text-gray-500">
                  Lil Noun {currentNounId || '—'}
                </div>
                {timeToNextDrop && timeToNextDrop > 0 && currentPrice && reservePrice && currentPrice > reservePrice && (
                  <div className="text-sm text-gray-600">
                    Price drops in: <strong>{timeDisplay}</strong>
                  </div>
                )}
              </div>
            </div>

            {/* Controls row - larger buttons on same line */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {/* Saved Button */}
                <motion.button
                  onClick={() => {
                    setShowSavedView(!showSavedView);
                    if (!showSavedView) {
                      setShowFilterSidebar(false);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                    showSavedView 
                      ? 'bg-red-50 text-red-700 border-red-200' 
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg className="w-4 h-4" fill={showSavedView ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth={showSavedView ? 0 : 2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                  Saved
                  {bookmarkCount > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {bookmarkCount}
                    </span>
                  )}
                </motion.button>

                {/* Filter Button - Only show when not in saved view */}
                {!showSavedView && (
                  <motion.button
                    onClick={() => setShowFilterSidebar(!showFilterSidebar)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                      showFilterSidebar 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Filters
                    {getActiveFilterCount() > 0 && (
                      <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                        {getActiveFilterCount()}
                      </span>
                    )}
                  </motion.button>
                )}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'latest' | 'oldest')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
              >
                <option value="latest">Latest First</option>
                <option value="oldest">Oldest First</option>
              </select>
            </div>
          </div>
        </div>

        {/* Virtualized Grid */}
        <motion.div
          layout
          ref={containerRef}
          className="flex-1 overflow-y-auto overscroll-contain px-2 py-3"
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: `${columnVirtualizer.getTotalSize()}px`,
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map(virtualRow => (
              <React.Fragment key={virtualRow.key}>
                {columnVirtualizer.getVirtualItems().map(virtualColumn => {
                  const itemIndex = virtualRow.index * itemsPerRow + virtualColumn.index;
                  if (itemIndex >= displaySeeds.length) return null;

                  const seed = displaySeeds[itemIndex];
                  return (
                    <div
                      key={seed.id}
                      className="absolute"
                      style={{
                        left: `${virtualColumn.start}px`,
                        top: `${virtualRow.start}px`,
                        width: `${ITEM_SIZE}px`,
                        height: `${ITEM_SIZE}px`,
                      }}
                    >
                      <VrgdaSeedItem
                        seed={seed}
                        isSelected={selectedSeedId === seed.id}
                        isNewlyAdded={newSeedIds.has(seed.id)}
                        onSelect={selectSeed}
                        size={ITEM_SIZE}
                        animationDelay={Math.min(virtualColumn.index * 50, 500)}
                      />
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </motion.div>

      {/* Details Panel - With layout animation and responsive width */}
      <AnimatePresence>
        {selectedSeed && (
          <motion.div
            layout
            initial={{ width: 0, opacity: 0 }}
            animate={{ 
              width: showFilterSidebar ? 280 : 350, // Smaller when both panels open
              opacity: 1 
            }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="flex-shrink-0 border-l border-gray-200 overflow-hidden"
          >
            <VrgdaDetailsPanel
              seed={selectedSeed}
              onPrevious={() => navigateSelection('previous')}
              onNext={() => navigateSelection('next')}
              canGoPrevious={displaySeeds.findIndex(s => s.id === selectedSeedId) > 0}
              canGoNext={displaySeeds.findIndex(s => s.id === selectedSeedId) < displaySeeds.length - 1}
              allSeeds={seeds}
              vrgdaPrice={currentPrice}
              isCompact={showFilterSidebar} // Pass compact mode when filter is also open
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};