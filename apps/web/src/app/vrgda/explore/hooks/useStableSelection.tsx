"use client";
import { useState, useEffect, useCallback } from 'react';
import { VrgdaPoolSeed } from '@/data/ponder/vrgda/types';

export function useStableSelection(seeds: VrgdaPoolSeed[]) {
  const [selectedSeedId, setSelectedSeedId] = useState<string | undefined>();
  const [selectedSeed, setSelectedSeed] = useState<VrgdaPoolSeed | undefined>();

  // Maintain selected seed even when list updates
  useEffect(() => {
    if (selectedSeedId) {
      const currentSeed = seeds.find(seed => seed.id === selectedSeedId);
      if (currentSeed) {
        setSelectedSeed(currentSeed);
      } else {
        // Seed no longer available (possibly purchased)
        setSelectedSeedId(undefined);
        setSelectedSeed(undefined);
      }
    }
  }, [seeds, selectedSeedId]);

  const selectSeed = useCallback((seedId: string) => {
    const seed = seeds.find(s => s.id === seedId);
    if (seed) {
      setSelectedSeedId(seedId);
      setSelectedSeed(seed);
    }
  }, [seeds]);

  const clearSelection = useCallback(() => {
    setSelectedSeedId(undefined);
    setSelectedSeed(undefined);
  }, []);

  // Keyboard navigation
  const navigateSelection = useCallback((direction: 'next' | 'previous') => {
    if (!selectedSeedId || seeds.length === 0) return;

    const currentIndex = seeds.findIndex(seed => seed.id === selectedSeedId);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'next') {
      newIndex = currentIndex + 1 < seeds.length ? currentIndex + 1 : 0;
    } else {
      newIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : seeds.length - 1;
    }

    selectSeed(seeds[newIndex].id);
  }, [selectedSeedId, seeds, selectSeed]);

  return {
    selectedSeedId,
    selectedSeed,
    selectSeed,
    clearSelection,
    navigateSelection
  };
}
