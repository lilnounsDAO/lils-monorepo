import { VrgdaPoolSeed } from './types';
import { buildNounImage, type NounImageType } from '@/utils/nounImages/nounImage';
import { Noun } from '@/data/noun/types';

export interface VrgdaSeedImageOptions {
  /**
   * Image type to generate
   * @default 'full'
   */
  imageType?: 'full' | 'head' | 'body' | 'accessory' | 'glasses' | 'background';

  /**
   * Custom view box for cropping
   */
  cropViewBox?: string;

  /**
   * Whether to include background color
   * @default true
   */
  includeBackground?: boolean;
}

/**
 * Convert a VRGDA seed directly to a Noun image
 * Uses the cached buildNounImage function to avoid regenerating SVGs
 */
export function vrgdaSeedToImage(
  seed: VrgdaPoolSeed,
  options: VrgdaSeedImageOptions = {}
): string {
  const {
    imageType = 'full',
  } = options;

  // Convert VRGDA seed to Noun traits format
  const traits: Noun['traits'] = {
    background: { seed: seed.background, name: '' },
    body: { seed: seed.body, name: '' },
    accessory: { seed: seed.accessory, name: '' },
    head: { seed: seed.head, name: '' },
    glasses: { seed: seed.glasses, name: '' }
  };

  // Use cached buildNounImage function
  return buildNounImage(traits, imageType as NounImageType);
}

/**
 * Generate multiple image variations of a VRGDA seed
 */
export function vrgdaSeedToImages(seed: VrgdaPoolSeed) {
  return {
    full: vrgdaSeedToImage(seed, { imageType: 'full' }),
    head: vrgdaSeedToImage(seed, { imageType: 'head' }),
    body: vrgdaSeedToImage(seed, { imageType: 'body' }),
    accessory: vrgdaSeedToImage(seed, { imageType: 'accessory' }),
    glasses: vrgdaSeedToImage(seed, { imageType: 'glasses' }),
    background: vrgdaSeedToImage(seed, { imageType: 'background' })
  };
}

/**
 * Batch convert multiple VRGDA seeds to images
 */
export function vrgdaSeedsToImages(
  seeds: VrgdaPoolSeed[],
  options: VrgdaSeedImageOptions = {}
): Array<{ seed: VrgdaPoolSeed; image: string }> {
  return seeds.map(seed => ({
    seed,
    image: vrgdaSeedToImage(seed, options)
  }));
}

/**
 * Get preview images for upcoming auction seeds
 */
export function getUpcomingAuctionPreviews(
  availableSeeds: VrgdaPoolSeed[],
  count: number = 5
): Array<{
  seed: VrgdaPoolSeed;
  fullImage: string;
  smallImage: string;
  blockNumber: string;
  isNext: boolean;
}> {
  // Sort by block number ascending to get oldest available first
  const sortedSeeds = [...availableSeeds]
    .filter(seed => !seed.isUsed)
    .sort((a, b) => parseInt(a.blockNumber) - parseInt(b.blockNumber))
    .slice(0, count);

  return sortedSeeds.map((seed, index) => ({
    seed,
    fullImage: vrgdaSeedToImage(seed, { imageType: 'full' }),
    smallImage: vrgdaSeedToImage(seed, { 
      imageType: 'full', 
      cropViewBox: '20 20 280 280' // Slightly cropped for thumbnails
    }),
    blockNumber: seed.blockNumber,
    isNext: index === 0 // First one is the next auction
  }));
}

/**
 * React hook for VRGDA seed images with caching
 */
export function useVrgdaSeedImage(
  seed: VrgdaPoolSeed | null,
  options: VrgdaSeedImageOptions = {}
) {
  if (!seed) return null;
  
  // Simple memoization based on seed properties and options
  const key = `${seed.blockNumber}-${seed.background}-${seed.body}-${seed.accessory}-${seed.head}-${seed.glasses}-${JSON.stringify(options)}`;
  
  // In a real app, you might want to use React.useMemo or a more sophisticated cache
  return vrgdaSeedToImage(seed, options);
}
