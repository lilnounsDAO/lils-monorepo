"use client";
import { useQueryClient } from '@tanstack/react-query';
import { useVrgdaPoolMonitor } from '../vrgda/useVrgdaPoolListener';
import { VrgdaPoolSeed } from '../vrgda/types';

export interface VrgdaRealtimeSyncOptions {
  /**
   * Whether to invalidate auction-related queries when seeds change
   * @default true
   */
  invalidateAuctionQueries?: boolean;
  
  /**
   * Whether to invalidate VRGDA pool queries when seeds change
   * @default true
   */
  invalidateVrgdaQueries?: boolean;
  
  /**
   * Whether to invalidate noun queries when seeds are used
   * @default true
   */
  invalidateNounQueries?: boolean;
  
  /**
   * Custom callback for when new seeds are available
   */
  onNewSeeds?: (seeds: VrgdaPoolSeed[]) => void;
  
  /**
   * Custom callback for when a seed is used (auction settled)
   */
  onSeedUsed?: (seed: VrgdaPoolSeed) => void;
  
  /**
   * Polling interval in milliseconds
   * @default 12000 (12 seconds)
   */
  pollInterval?: number;
}

/**
 * Enhanced real-time VRGDA monitoring that automatically invalidates
 * relevant React Query caches and keeps your frontend in sync
 */
export function useVrgdaRealtimeSync(options: VrgdaRealtimeSyncOptions = {}) {
  const {
    invalidateAuctionQueries = true,
    invalidateVrgdaQueries = true,
    invalidateNounQueries = true,
    onNewSeeds,
    onSeedUsed,
    pollInterval = 12000
  } = options;

  const queryClient = useQueryClient();

  const { refresh, disconnect, isActive } = useVrgdaPoolMonitor(
    // Handle new seeds
    (newSeeds) => {
      console.log('🎱 VRGDA: New seeds detected:', newSeeds.length);
      
      // Call custom callback
      onNewSeeds?.(newSeeds);
      
      if (invalidateVrgdaQueries) {
        // Invalidate VRGDA pool queries
        queryClient.invalidateQueries({ queryKey: ['vrgda-pool-status'] });
        queryClient.invalidateQueries({ queryKey: ['latest-vrgda-seeds'] });
        queryClient.invalidateQueries({ queryKey: ['available-vrgda-seeds'] });
        queryClient.invalidateQueries({ queryKey: ['upcoming-auction-seeds'] });
        queryClient.invalidateQueries({ queryKey: ['vrgda-pool-seeds'] });
      }
      
      if (invalidateAuctionQueries) {
        // Invalidate auction preview queries since new seeds are available
        queryClient.invalidateQueries({ queryKey: ['current-auction-id'] });
        queryClient.invalidateQueries({ queryKey: ['auction'] });
      }
    },
    
    // Handle seed used (auction settled)
    (usedSeed) => {
      console.log('✅ VRGDA: Seed used for auction:', usedSeed.blockNumber);
      
      // Call custom callback
      onSeedUsed?.(usedSeed);
      
      if (invalidateVrgdaQueries) {
        // Invalidate VRGDA queries to reflect updated usage
        queryClient.invalidateQueries({ queryKey: ['vrgda-pool-status'] });
        queryClient.invalidateQueries({ queryKey: ['available-vrgda-seeds'] });
        queryClient.invalidateQueries({ queryKey: ['upcoming-auction-seeds'] });
        queryClient.invalidateQueries({ queryKey: ['vrgda-pool-seeds'] });
      }
      
      if (invalidateAuctionQueries) {
        // Invalidate auction queries since an auction likely settled
        queryClient.invalidateQueries({ queryKey: ['current-auction-id'] });
        queryClient.invalidateQueries({ queryKey: ['auction'] });
      }
      
      if (invalidateNounQueries) {
        // A new noun was likely minted, invalidate noun queries
        queryClient.invalidateQueries({ queryKey: ['noun'] });
        queryClient.invalidateQueries({ queryKey: ['ponder-noun'] });
        queryClient.invalidateQueries({ queryKey: ['nouns-paginated'] });
        queryClient.invalidateQueries({ queryKey: ['nouns-infinite'] });
      }
    },
    
    pollInterval
  );

  return {
    /**
     * Manually refresh the VRGDA pool data
     */
    refresh,
    
    /**
     * Stop real-time monitoring
     */
    disconnect,
    
    /**
     * Whether monitoring is currently active
     */
    isActive,
    
    /**
     * Force invalidate all related queries
     */
    invalidateAll: () => {
      queryClient.invalidateQueries({ queryKey: ['vrgda'] });
      queryClient.invalidateQueries({ queryKey: ['auction'] });
      queryClient.invalidateQueries({ queryKey: ['noun'] });
    }
  };
}
