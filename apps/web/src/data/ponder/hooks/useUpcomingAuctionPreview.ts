"use client";
import { useUpcomingAuctionSeeds } from './useVrgdaQueries';
import { vrgdaSeedToImage } from '../vrgda/vrgdaSeedToImage';
import { VrgdaPoolSeed } from '../vrgda/types';

export interface UpcomingAuctionPreview {
  /** The VRGDA seed for this preview */
  seed: VrgdaPoolSeed;
  /** Full-size Noun image */
  image: string;
  /** Block number this seed represents */
  blockNumber: string;
  /** Whether this is the very next auction */
  isNext: boolean;
  /** Estimated auction start time (if known) */
  estimatedStartTime?: Date;
}

/**
 * Hook to get upcoming auction previews with generated Noun images
 */
export function useUpcomingAuctionPreview(count: number = 5) {
  const { data: seeds, isLoading, error, refetch } = useUpcomingAuctionSeeds(count);
  
  const previews: UpcomingAuctionPreview[] = seeds?.map((seed, index) => ({
    seed,
    image: vrgdaSeedToImage(seed, { imageType: 'full' }),
    blockNumber: seed.blockNumber,
    isNext: index === 0,
    // You could add auction timing logic here if needed
    estimatedStartTime: undefined
  })) || [];

  return {
    previews,
    isLoading,
    error,
    refetch,
    /** Get just the next auction preview */
    nextAuction: previews[0] || null,
    /** Check if there are enough seeds for upcoming auctions */
    hasEnoughSeeds: previews.length >= count
  };
}

/**
 * Hook specifically for the next auction preview
 */
export function useNextAuctionPreview() {
  const { nextAuction, isLoading, error, refetch } = useUpcomingAuctionPreview(1);
  
  return {
    preview: nextAuction,
    isLoading,
    error,
    refetch
  };
}
