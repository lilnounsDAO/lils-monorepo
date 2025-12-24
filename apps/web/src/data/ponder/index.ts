// Nouns
export type { 
  PonderNoun, 
  NounsPaginatedResult, 
  NounFilters, 
  NounSortField, 
  SortDirection as NounSortDirection 
} from './nouns/types';

export { getNounById } from './nouns/getNounById';
export { getNounsForAddress } from './nouns/getNounsForAddress';
export { getNounsPaginated } from './nouns/getNounsPaginated';

// VRGDA
export type {
  VrgdaPoolSeed,
  VrgdaPoolSeedsResult,
  VrgdaPoolStatus,
  VrgdaFilters,
  VrgdaSortField,
  SortDirection as VrgdaSortDirection,
  VrgdaPoolUpdate,
  VrgdaSubscriptionOptions
} from './vrgda/types';

export { 
  getVrgdaPoolSeeds, 
  getAvailableVrgdaSeeds, 
  getLatestVrgdaSeeds 
} from './vrgda/getVrgdaPoolSeeds';

export { 
  getVrgdaSeedByBlock, 
  getVrgdaSeedsByBlocks 
} from './vrgda/getVrgdaSeedByBlock';

export { 
  getVrgdaPoolStatus, 
  shouldRefreshVrgdaPool 
} from './vrgda/getVrgdaPoolStatus';

// VRGDA Image Generation
export type { VrgdaSeedImageOptions } from './vrgda/vrgdaSeedToImage';
export { 
  vrgdaSeedToImage,
  vrgdaSeedToImages,
  vrgdaSeedsToImages,
  getUpcomingAuctionPreviews,
  useVrgdaSeedImage
} from './vrgda/vrgdaSeedToImage';

// Client-side hooks (only import on client)
export { 
  useVrgdaPoolListener, 
  useVrgdaPoolMonitor 
} from './vrgda/useVrgdaPoolListener';

// Enhanced real-time sync
export type { VrgdaRealtimeSyncOptions } from './hooks/useVrgdaRealtimeSync';
export { useVrgdaRealtimeSync } from './hooks/useVrgdaRealtimeSync';

// React Query hooks
export {
  useVrgdaPoolStatus,
  useLatestVrgdaSeeds,
  useVrgdaSeedByBlock,
  useVrgdaPoolSeeds,
  useInfiniteVrgdaPoolSeeds,
  useAvailableVrgdaSeeds,
  useUpcomingAuctionSeeds
} from './hooks/useVrgdaQueries';

export {
  useNounById,
  useNounsForAddress,
  useNounsPaginated,
  useInfiniteNouns,
  useNounsByTrait,
  useNounsByTraits,
  useRecentNouns
} from './hooks/useNounQueries';

// Auction preview hooks
export type { UpcomingAuctionPreview } from './hooks/useUpcomingAuctionPreview';
export { 
  useUpcomingAuctionPreview, 
  useNextAuctionPreview 
} from './hooks/useUpcomingAuctionPreview';

// GraphQL utilities
export { cleanGraphQLFetch, CLEAN_GRAPHQL_ENDPOINT } from './utils/cleanGraphQLFetch';