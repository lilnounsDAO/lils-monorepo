"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { VrgdaPoolSeed } from '@/data/ponder/vrgda/types';
import { cleanGraphQLFetch, CLEAN_GRAPHQL_ENDPOINT } from '@/data/ponder/utils/cleanGraphQLFetch';
import { isSepoliaNetwork } from '@/utils/networkDetection';

interface LatestBlockData {
  blockNumber: string;
  blockHash: string;
  timestamp: number;
  fetchedAt: number;
}

interface PoolChanges {
  additions: VrgdaPoolSeed[];
  usedSeeds: VrgdaPoolSeed[];
  invalidations: VrgdaPoolSeed[];
  totalNew: number;
  totalUsed: number;
  totalInvalidated: number;
}

interface PoolSyncData {
  changes: PoolChanges;
  currentBlock: {
    number: string;
    hash: string;
    timestamp: number;
  } | null;
  fetchedAt: number;
  since: string;
}

interface UseVrgdaRealtimePoolOptions {
  /**
   * Polling interval for latest block (milliseconds)
   * @default 12000 (12 seconds)
   */
  blockInterval?: number;
  
  /**
   * Polling interval for pool changes (milliseconds)
   * @default 12000 (12 seconds) - aligned with block time since pool only changes on-chain
   */
  poolInterval?: number;
  
  /**
   * Whether to start monitoring immediately
   * @default true
   */
  enabled?: boolean;
  
  /**
   * Callback when new seeds are added
   */
  onNewSeeds?: (seeds: VrgdaPoolSeed[]) => void;
  
  /**
   * Callback when seeds are used in auctions
   */
  onSeedsUsed?: (seeds: VrgdaPoolSeed[]) => void;
  
  /**
   * Callback when seeds are invalidated
   */
  onSeedsInvalidated?: (seeds: VrgdaPoolSeed[]) => void;
  
  /**
   * Callback when latest block changes
   */
  onLatestBlock?: (block: LatestBlockData) => void;
}

export function useVrgdaRealtimePool({
  blockInterval = 12000,
  poolInterval = 12000, // Aligned with block time - pool state only changes on-chain
  enabled = true,
  onNewSeeds,
  onSeedsUsed,
  onSeedsInvalidated,
  onLatestBlock
}: UseVrgdaRealtimePoolOptions = {}) {
  const queryClient = useQueryClient();
  
  // Disable VRGDA pool on Sepolia - not indexed in Ponder yet
  const isSepolia = isSepoliaNetwork();
  const actuallyEnabled = enabled && !isSepolia;
  const [isActive, setIsActive] = useState(false);
  const [latestBlock, setLatestBlock] = useState<LatestBlockData | null>(null);
  const [lastPoolSync, setLastPoolSync] = useState<number>(Date.now());
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const blockIntervalRef = useRef<NodeJS.Timeout>();
  const poolIntervalRef = useRef<NodeJS.Timeout>();
  const seenSeedIdsRef = useRef<Set<string>>(new Set());
  // Track recently processed seeds to prevent duplicate processing within a short time window
  const recentlyProcessedRef = useRef<Map<string, number>>(new Map());
  
  // Fetch latest block data
  const fetchLatestBlock = useCallback(async () => {
    try {
      const response = await fetch(CLEAN_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetLatestBlock {
              _meta {
                block {
                  number
                  timestamp
                }
              }
            }
          `,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`GraphQL request failed with status ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (!result.data?._meta?.block) {
        throw new Error('Unable to fetch latest block data');
      }

      const { number, timestamp } = result.data._meta.block;
      const blockData: LatestBlockData = {
        blockNumber: number,
        blockHash: `block-${number}`, // Generate a hash since not available
        timestamp: parseInt(timestamp) * 1000,
        fetchedAt: Date.now()
      };
      
      // Only update if block number actually changed
      if (!latestBlock || blockData.blockNumber !== latestBlock.blockNumber) {
        setLatestBlock(blockData);
        onLatestBlock?.(blockData);
        
        // Invalidate relevant queries when block changes
        queryClient.invalidateQueries({ queryKey: ['vrgdaPoolStatus'] });
      }
      
      setError(null);
      return blockData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch latest block';
      setError(errorMessage);
      console.error('Error fetching latest block:', err);
      return null;
    }
  }, [latestBlock, onLatestBlock, queryClient]);
  
  // Fetch pool changes since last sync
  const fetchPoolChanges = useCallback(async () => {
    try {
      // Simplified query without variables to avoid JSON parsing issues
      const response = await fetch(CLEAN_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: `
            query GetPoolChanges {
              vrgdaPoolSeeds(
                orderBy: "blockNumber"
                orderDirection: desc
                limit: 10
              ) {
                items {
                  id
                  blockNumber
                  nounId
                  background
                  body
                  accessory
                  head
                  glasses
                  isUsed
                  generatedAt
                }
              }
              
              _meta {
                block {
                  number
                  timestamp
                }
              }
            }
          `,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`GraphQL request failed with status ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.errors) {
        throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
      }

      if (!result.data) {
        throw new Error('No data returned from GraphQL query');
      }

      const allSeeds = result.data.vrgdaPoolSeeds?.items || [];
      const currentBlock = result.data._meta?.block;

      // Filter out seeds we've already seen
      const availableSeeds = allSeeds.filter((seed: any) => !seed.isUsed);
      const usedSeeds = allSeeds.filter((seed: any) => seed.isUsed);

      // Identify truly NEW seeds (not seen before)
      // IMPORTANT: Check and mark as seen IMMEDIATELY to prevent duplicate detection
      const newSeeds: VrgdaPoolSeed[] = [];
      const now = Date.now();
      const PROCESSING_COOLDOWN = 5000; // 5 seconds cooldown to prevent duplicate processing
      
      availableSeeds.forEach((seed: any) => {
        const seedId = seed.id;
        const lastProcessed = recentlyProcessedRef.current.get(seedId);
        const isInCooldown = lastProcessed && (now - lastProcessed) < PROCESSING_COOLDOWN;
        
        // Only process if: not seen before AND not in cooldown period
        if (!seenSeedIdsRef.current.has(seedId) && !isInCooldown) {
          // Mark as seen IMMEDIATELY to prevent duplicate detection in next poll
          seenSeedIdsRef.current.add(seedId);
          // Track when we processed this seed
          recentlyProcessedRef.current.set(seedId, now);
          
          newSeeds.push({
            id: seedId,
            nounId: seed.nounId,
            blockNumber: seed.blockNumber,
            background: seed.background,
            body: seed.body,
            accessory: seed.accessory,
            head: seed.head,
            glasses: seed.glasses,
            isUsed: seed.isUsed,
            generatedAt: seed.generatedAt,
          });
        } else {
          // Already seen, ensure it's still marked (redundant but safe)
          seenSeedIdsRef.current.add(seedId);
        }
      });
      
      // Clean up old entries from recentlyProcessedRef (older than cooldown period)
      recentlyProcessedRef.current.forEach((timestamp, seedId) => {
        if (now - timestamp > PROCESSING_COOLDOWN * 2) {
          recentlyProcessedRef.current.delete(seedId);
        }
      });

      // Identify newly USED seeds (were available, now used)
      const newlyUsedSeeds = usedSeeds.filter((seed: any) => {
        const wasSeen = seenSeedIdsRef.current.has(seed.id);
        // Mark used seeds as seen too to prevent re-detection
        if (wasSeen) {
          seenSeedIdsRef.current.add(seed.id);
        }
        return wasSeen; // Only count as "newly used" if we've seen it before as available
      });

      // Also mark all used seeds as seen to prevent them from being detected as new if they become available again
      usedSeeds.forEach((seed: any) => seenSeedIdsRef.current.add(seed.id));

      const syncData: PoolSyncData = {
        changes: {
          additions: newSeeds, // Only truly new seeds
          usedSeeds: newlyUsedSeeds, // Only newly used seeds
          invalidations: [],
          totalNew: newSeeds.length,
          totalUsed: newlyUsedSeeds.length,
          totalInvalidated: 0
        },
        currentBlock: currentBlock ? {
          number: currentBlock.number,
          hash: `block-${currentBlock.number}`,
          timestamp: parseInt(currentBlock.timestamp) * 1000
        } : null,
        fetchedAt: Date.now(),
        since: lastPoolSync.toString()
      };

      const { changes } = syncData;

      // Process changes and trigger callbacks ONLY if there are actual new changes
      // IMPORTANT: Only process if we have genuinely new changes to prevent infinite loops
      const hasRealChanges = changes.totalNew > 0 || changes.totalUsed > 0 || changes.totalInvalidated > 0;
      
      if (hasRealChanges) {
        if (changes.totalNew > 0 && onNewSeeds) {
          console.log('[useVrgdaRealtimePool] New seeds detected:', changes.totalNew);
          onNewSeeds(changes.additions);
        }

        if (changes.totalUsed > 0 && onSeedsUsed) {
          console.log('[useVrgdaRealtimePool] Seeds used:', changes.totalUsed);
          onSeedsUsed(changes.usedSeeds);
        }

        if (changes.totalInvalidated > 0 && onSeedsInvalidated) {
          onSeedsInvalidated(changes.invalidations);
        }

        // Update last sync time
        setLastPoolSync(syncData.fetchedAt);

        // Update cache and invalidate queries ONLY if we have actual changes
        console.log('[useVrgdaRealtimePool] Invalidating queries due to changes');

        // For new seeds, try to update cache directly instead of full refetch
        // This prevents triggering a refetch that might cause the same seed to be detected again
        if (changes.totalNew > 0) {
          // Update the cache for vrgda-pool-seeds queries
          queryClient.setQueriesData(
            { queryKey: ['vrgda-pool-seeds'], exact: false },
            (oldData: any) => {
              if (!oldData?.seeds) return oldData;

              // Prepend new seeds and remove duplicates
              const existingIds = new Set(oldData.seeds.map((s: any) => s.id));
              const uniqueNewSeeds = changes.additions.filter(s => !existingIds.has(s.id));

              // Only update if we have genuinely new seeds
              if (uniqueNewSeeds.length === 0) {
                return oldData;
              }

              return {
                ...oldData,
                seeds: [...uniqueNewSeeds, ...oldData.seeds].slice(0, oldData.seeds.length),
                total: oldData.total + uniqueNewSeeds.length
              };
            }
          );
          
          // Invalidate status query (but don't invalidate the main seeds query to avoid refetch loop)
          queryClient.invalidateQueries({ queryKey: ['vrgdaPoolStatus'] });
        }

        // For used seeds, invalidate to ensure clean removal
        if (changes.totalUsed > 0) {
          queryClient.invalidateQueries({ queryKey: ['vrgdaPoolSeeds'] });
          queryClient.invalidateQueries({ queryKey: ['upcomingAuctionSeeds'] });
          queryClient.invalidateQueries({ queryKey: ['vrgdaPoolStatus'] });
        }

        // Only invalidate status if we have invalidations
        if (changes.totalInvalidated > 0) {
          queryClient.invalidateQueries({ queryKey: ['vrgdaPoolStatus'] });
        }
      } else {
        // No real changes, just update sync time silently
        setLastPoolSync(syncData.fetchedAt);
      }
      
      setError(null);
      return syncData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch pool changes';
      setError(errorMessage);
      console.error('Error fetching pool changes:', err);
      return null;
    }
  }, [lastPoolSync, onNewSeeds, onSeedsUsed, onSeedsInvalidated, queryClient]);
  
  // Start monitoring
  const startMonitoring = useCallback(() => {
    if (isActive) return;

    setIsActive(true);
    setConnectionStatus('connecting');

    // DON'T clear seen seeds on start - this causes seeds to be re-detected
    // Instead, let the initial fetch populate seenSeedIdsRef naturally
    // Only clear if we're truly restarting from scratch (component remount)
    // seenSeedIdsRef.current.clear(); // REMOVED - causes duplicate detection

    // Initial fetch
    Promise.all([
      fetchLatestBlock(),
      fetchPoolChanges()
    ]).then(() => {
      setConnectionStatus('connected');
    }).catch(() => {
      setConnectionStatus('disconnected');
    });

    // Set up intervals
    blockIntervalRef.current = setInterval(fetchLatestBlock, blockInterval);
    poolIntervalRef.current = setInterval(fetchPoolChanges, poolInterval);
  }, [isActive, fetchLatestBlock, fetchPoolChanges, blockInterval, poolInterval]);
  
  // Stop monitoring
  const stopMonitoring = useCallback(() => {
    setIsActive(false);
    setConnectionStatus('disconnected');
    
    if (blockIntervalRef.current) {
      clearInterval(blockIntervalRef.current);
      blockIntervalRef.current = undefined;
    }
    
    if (poolIntervalRef.current) {
      clearInterval(poolIntervalRef.current);
      poolIntervalRef.current = undefined;
    }
  }, []);
  
  // Force refresh
  const refresh = useCallback(async () => {
    if (!isActive) return;
    
    setConnectionStatus('connecting');
    
    try {
      await Promise.all([
        fetchLatestBlock(),
        fetchPoolChanges()
      ]);
      setConnectionStatus('connected');
    } catch {
      setConnectionStatus('disconnected');
    }
  }, [isActive, fetchLatestBlock, fetchPoolChanges]);
  
  // Invalidate all VRGDA-related queries
  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['vrgdaPoolSeeds'] });
    queryClient.invalidateQueries({ queryKey: ['vrgdaPoolStatus'] });
    queryClient.invalidateQueries({ queryKey: ['upcomingAuctionSeeds'] });
    queryClient.invalidateQueries({ queryKey: ['vrgdaSeedByBlock'] });
  }, [queryClient]);
  
  // Auto-start/stop based on enabled prop
  useEffect(() => {
    if (actuallyEnabled && !isActive) {
      startMonitoring();
    } else if (!actuallyEnabled && isActive) {
      stopMonitoring();
    }
  }, [actuallyEnabled, isActive, startMonitoring, stopMonitoring]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);
  
  return {
    // State
    isActive,
    latestBlock,
    error,
    connectionStatus,
    
    // Actions
    startMonitoring,
    stopMonitoring,
    refresh,
    invalidateAll,
    
    // Utils
    fetchLatestBlock,
    fetchPoolChanges
  };
}
