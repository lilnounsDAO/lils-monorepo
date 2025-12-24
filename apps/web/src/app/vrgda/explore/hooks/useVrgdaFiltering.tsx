"use client";
import { useState, useMemo } from 'react';
import { VrgdaPoolSeed } from '@/data/ponder/vrgda/types';

interface TraitFilter {
  background?: number[];
  body?: number[];
  accessory?: number[];
  head?: number[];
  glasses?: number[];
}

interface TraitCombo {
  background?: number;
  body?: number;
  accessory?: number;
  head?: number;
  glasses?: number;
}

export function useVrgdaFiltering(seeds: VrgdaPoolSeed[]) {
  const [activeFilters, setActiveFilters] = useState<TraitFilter>({});
  const [sortOrder, setSortOrder] = useState<'latest' | 'oldest'>('latest');
  const [searchCombo, setSearchCombo] = useState<TraitCombo | null>(null);

  // Apply trait filters
  const filteredSeeds = useMemo(() => {
    let filtered = seeds;

    // Apply individual trait filters
    if (Object.keys(activeFilters).length > 0) {
      filtered = filtered.filter(seed => {
        return Object.entries(activeFilters).every(([trait, values]) => {
          if (!values || values.length === 0) return true;
          return values.includes(seed[trait as keyof VrgdaPoolSeed] as number);
        });
      });
    }

    // Apply trait combo search (find closest matches)
    if (searchCombo) {
      filtered = filtered.sort((a, b) => {
        const scoreA = calculateTraitMatchScore(a, searchCombo);
        const scoreB = calculateTraitMatchScore(b, searchCombo);
        return scoreB - scoreA; // Higher score first
      });
    }

    // Apply sorting
    if (sortOrder === 'latest') {
      filtered.sort((a, b) => Number(b.generatedAt) - Number(a.generatedAt));
    } else {
      filtered.sort((a, b) => Number(a.generatedAt) - Number(b.generatedAt));
    }

    return filtered;
  }, [seeds, activeFilters, sortOrder, searchCombo]);

  // Calculate trait matching score for combo search
  const calculateTraitMatchScore = (seed: VrgdaPoolSeed, combo: TraitCombo): number => {
    let score = 0;
    let totalTraits = 0;

    Object.entries(combo).forEach(([trait, value]) => {
      if (value !== undefined) {
        totalTraits++;
        if (seed[trait as keyof VrgdaPoolSeed] === value) {
          score++;
        }
      }
    });

    return totalTraits > 0 ? score / totalTraits : 0;
  };

  // Get available trait values for filtering
  const availableTraits = useMemo(() => {
    const traits = {
      background: new Set<number>(),
      body: new Set<number>(),
      accessory: new Set<number>(),
      head: new Set<number>(),
      glasses: new Set<number>()
    };

    seeds.forEach(seed => {
      traits.background.add(seed.background);
      traits.body.add(seed.body);
      traits.accessory.add(seed.accessory);
      traits.head.add(seed.head);
      traits.glasses.add(seed.glasses);
    });

    return {
      background: Array.from(traits.background).sort((a, b) => a - b),
      body: Array.from(traits.body).sort((a, b) => a - b),
      accessory: Array.from(traits.accessory).sort((a, b) => a - b),
      head: Array.from(traits.head).sort((a, b) => a - b),
      glasses: Array.from(traits.glasses).sort((a, b) => a - b)
    };
  }, [seeds]);

  return {
    filteredSeeds,
    activeFilters,
    setActiveFilters,
    sortOrder,
    setSortOrder,
    searchCombo,
    setSearchCombo,
    availableTraits,
    clearFilters: () => {
      setActiveFilters({});
      setSearchCombo(null);
    }
  };
}
