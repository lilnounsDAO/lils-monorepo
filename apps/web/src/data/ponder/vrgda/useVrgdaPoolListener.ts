"use client";
import { useEffect, useRef, useCallback } from 'react';
import { VrgdaPoolUpdate, VrgdaSubscriptionOptions, VrgdaPoolSeed } from './types';
import { getLatestVrgdaSeeds } from './getVrgdaPoolSeeds';

export function useVrgdaPoolListener(options: VrgdaSubscriptionOptions) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastKnownBlockRef = useRef<string>('0');
  const isActiveRef = useRef(true);
  
  const { 
    onUpdate, 
    onError, 
    pollInterval = 12000, // 12 seconds (close to block time)
    includeUsedSeeds = false 
  } = options;

  const pollForUpdates = useCallback(async () => {
    if (!isActiveRef.current) return;

    try {
      // Get latest seeds
      const latestSeeds = await getLatestVrgdaSeeds(10);
      
      if (latestSeeds.length === 0) return;

      const newestBlock = latestSeeds[0].blockNumber;
      
      // Check if we have new seeds
      if (newestBlock !== lastKnownBlockRef.current) {
        const previousBlock = lastKnownBlockRef.current;
        lastKnownBlockRef.current = newestBlock;

        if (previousBlock === '0') {
          // First load - don't treat as update
          return;
        }

        // Find new seeds since last known block
        const newSeeds = latestSeeds.filter(seed => {
          const seedBlock = parseInt(seed.blockNumber);
          const lastBlock = parseInt(previousBlock);
          return seedBlock > lastBlock && (!seed.isUsed || includeUsedSeeds);
        });

        if (newSeeds.length > 0) {
          // Multiple new seeds - pool refreshed
          if (newSeeds.length > 5) {
            onUpdate({
              type: 'POOL_REFRESHED',
              seeds: newSeeds,
              timestamp: new Date().toISOString()
            });
          } else {
            // Individual seed updates
            newSeeds.forEach(seed => {
              onUpdate({
                type: seed.isUsed ? 'SEED_USED' : 'SEED_ADDED',
                seed,
                timestamp: new Date().toISOString()
              });
            });
          }
        }
      }
    } catch (error) {
      console.error('Error polling VRGDA pool updates:', error);
      onError?.(error as Error);
    }
  }, [onUpdate, onError, includeUsedSeeds]);

  // Initialize polling
  useEffect(() => {
    isActiveRef.current = true;
    
    // Initial load to set baseline
    pollForUpdates();
    
    // Set up polling interval
    intervalRef.current = setInterval(pollForUpdates, pollInterval);

    return () => {
      isActiveRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [pollForUpdates, pollInterval]);

  // Manual refresh function
  const refresh = useCallback(() => {
    pollForUpdates();
  }, [pollForUpdates]);

  // Cleanup function
  const disconnect = useCallback(() => {
    isActiveRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return {
    refresh,
    disconnect,
    isActive: isActiveRef.current
  };
}

// Hook for simple VRGDA pool monitoring
export function useVrgdaPoolMonitor(
  onNewSeeds?: (seeds: VrgdaPoolSeed[]) => void,
  onSeedUsed?: (seed: VrgdaPoolSeed) => void,
  pollInterval?: number
) {
  return useVrgdaPoolListener({
    onUpdate: (update) => {
      switch (update.type) {
        case 'SEED_ADDED':
          if (update.seed && onNewSeeds) {
            onNewSeeds([update.seed]);
          }
          break;
        case 'SEED_USED':
          if (update.seed && onSeedUsed) {
            onSeedUsed(update.seed);
          }
          break;
        case 'POOL_REFRESHED':
          if (update.seeds && onNewSeeds) {
            onNewSeeds(update.seeds);
          }
          break;
      }
    },
    onError: (error) => {
      console.error('VRGDA pool monitoring error:', error);
    },
    pollInterval,
    includeUsedSeeds: false
  });
}
