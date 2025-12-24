
import { CHAIN_CONFIG } from "@/config";
import { graphql } from "../generated/gql";
import { graphQLFetchWithFallback } from "../utils/graphQLFetch";
import { Noun } from "./types";
import { AllNounsQuery } from "../generated/gql/graphql";
import { revalidateTag, unstable_cache } from "@/utils/viteCache";
import { transformQueryNounToNoun, transformVpsNounToNoun } from "./helpers";
// Reservoir integration removed - secondary listings no longer fetched

// Import VPS-specific GraphQL queries
import {
  GetNounsPaginatedDocument,
  OrderDirection
} from "../generated/ponder/clean-graphql";

// NEW: Compact noun type for grid display only
export interface CompactNoun {
  id: string;
  seed: [number, number, number, number, number]; // [background, body, accessory, head, glasses]
  createdAt: string;
}

const BATCH_SIZE = 1000;

const query = graphql(/* GraphQL */ `
  query AllNouns($batchSize: Int!, $skip: Int!) {
    nouns(first: $batchSize, skip: $skip) {
      id
      owner {
        id
      }
      seed {
        background
        body
        accessory
        head
        glasses
      }
    }
  }
`);

// Note: VPS queries removed - using direct fetch instead due to schema differences

async function runPaginatedNounsQueryUncached() {
  let queryNouns: AllNounsQuery["nouns"] = [];
  let skip = 0;

  while (true) {
    const response = await graphQLFetchWithFallback(
      CHAIN_CONFIG.goldskyUrl,
      query,
      { batchSize: BATCH_SIZE, skip },
      { next: { revalidate: 0 } },
    );
    const responseNouns = response?.nouns;
    if (!responseNouns) {
      break;
    }

    queryNouns = queryNouns.concat(responseNouns);

    if (responseNouns.length === BATCH_SIZE) {
      skip += BATCH_SIZE;
    } else {
      break;
    }
  }

  return queryNouns;
}

const runPaginatedNounsQuery = unstable_cache(
  runPaginatedNounsQueryUncached,
  ["run-paginated-nouns-query", CHAIN_CONFIG.chain.id.toString()],
  {
    revalidate: 5 * 60, // 5min
    tags: [`paginated-nouns-query-${CHAIN_CONFIG.chain.id.toString()}`],
  },
);

export async function getAllNounsUncached(): Promise<Noun[]> {
  const queryResponse = await runPaginatedNounsQueryUncached();
  let nouns = queryResponse.map(transformQueryNounToNoun);

  // Sort by id, descending (newest first)
  nouns.sort((a, b) => (BigInt(b.id) > BigInt(a.id) ? 1 : -1));

  const fullNouns = nouns.map((noun) => ({
    ...noun,
    secondaryListing: null, // Reservoir integration removed
  })) as Noun[];

  return fullNouns;
}

// Memory-optimized version that fetches only recent Nouns for initial load
export async function getRecentNouns(limit: number = 200): Promise<Noun[]> {
  try {
    const response = await fetch(CHAIN_CONFIG.indexerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GetNounsPaginatedDocument,
        variables: {
          limit,
          offset: 0,
          orderBy: "id",
          orderDirection: OrderDirection.Desc,
        },
      }),
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const vpsResponse = result.data;

    if (!vpsResponse?.nouns?.items) {
      return [];
    }

    const [queryResponse, secondaryNounListings] = await Promise.all([
      Promise.resolve(vpsResponse.nouns.items),
      // Temporarily disable secondary listings to avoid extra latency here
      Promise.resolve([] as any[]),
    ]);

    let nouns = queryResponse.map((noun: any) => transformVpsNounToNoun(noun));

    // Remove duplicates by ID (in case VPS returns duplicates)
    const seenIds = new Set<string>();
    nouns = nouns.filter((noun: Noun) => {
      if (seenIds.has(noun.id)) {
        console.warn(`⚠️ Duplicate noun ID found: ${noun.id}`);
        return false;
      }
      seenIds.add(noun.id);
      return true;
    });

    // Ensure newest first
    nouns.sort((a: Noun, b: Noun) => (BigInt(b.id) > BigInt(a.id) ? 1 : -1));

    const fullNouns = nouns.map((noun: any) => ({
      ...noun,
      secondaryListing:
        secondaryNounListings.find((listing: any) => listing.nounId === noun.id) || null,
    })) as Noun[];

    return fullNouns;
  } catch (error) {
    console.error('❌ Error in getRecentNouns:', error);
    return [];
  }
}

// Fetch ALL nouns until total minted amount (no limit)
export async function getAllNounsComplete(
  sortOrder: "newest" | "oldest" = "newest"
): Promise<{ nouns: Noun[], totalCount: number }> {
  console.log('🔍 PERFORMANCE TEST: Fetching ALL nouns (no limit)...');
  const overallStart = performance.now();
  
  try {
    const orderDirection = sortOrder === "newest" ? OrderDirection.Desc : OrderDirection.Asc;
    let allNouns: any[] = [];
    let offset = 0;
    const batchSize = 1000; // Fetch in batches of 1000
    let hasMore = true;
    
    console.log(`📊 Sort order: ${sortOrder} (${orderDirection})`);
    
    while (hasMore) {
      const batchStart = performance.now();
      
      const response = await fetch(CHAIN_CONFIG.indexerUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: GetNounsPaginatedDocument,
          variables: { 
            limit: batchSize, 
            offset, 
            orderBy: "id", 
            orderDirection 
          }
        }),
        next: { revalidate: 300 } // Cache for 5 minutes
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const vpsResponse = result.data;
      const batchEnd = performance.now();
      
      if (!vpsResponse?.nouns?.items || vpsResponse.nouns.items.length === 0) {
        console.log(`✅ No more nouns found at offset ${offset}`);
        hasMore = false;
        break;
      }
      
      const batchNouns = vpsResponse.nouns.items;
      allNouns = allNouns.concat(batchNouns);
      
      console.log(`📦 Batch ${Math.floor(offset / batchSize) + 1}: ${batchNouns.length} nouns (${Math.round(batchEnd - batchStart)}ms)`);
      
      // Check if we got fewer nouns than requested (end of data)
      if (batchNouns.length < batchSize) {
        console.log(`✅ Reached end of data (got ${batchNouns.length} < ${batchSize})`);
        hasMore = false;
      } else {
        offset += batchSize;
      }
    }
    
    const fetchEnd = performance.now();
    console.log('📡 COMPLETE FETCH PERFORMANCE:', {
      totalBatches: Math.ceil(allNouns.length / batchSize),
      totalNouns: allNouns.length,
      fetchTimeMs: Math.round(fetchEnd - overallStart),
      avgNounsPerSecond: Math.round(allNouns.length / ((fetchEnd - overallStart) / 1000))
    });

    // Process all nouns
    const [queryResponse, secondaryNounListings] = await Promise.all([
      Promise.resolve(allNouns),
      // Temporarily disable secondary listings to fix hanging issue
      Promise.resolve([]),
    ]);
    
    let nouns = queryResponse.map((noun: any) => transformVpsNounToNoun(noun));

    const fullNouns = nouns.map((noun: any) => ({
      ...noun,
      secondaryListing: secondaryNounListings.find(
        (listing: any) => listing.nounId === noun.id,
      ) || null,
    })) as Noun[];

    const overallEnd = performance.now();
    const processingTime = overallEnd - fetchEnd;
    const totalTime = overallEnd - overallStart;
    
    console.log('✨ COMPLETE PROCESSING PERFORMANCE:', { 
      finalCount: fullNouns.length,
      processingTimeMs: Math.round(processingTime),
      totalTimeMs: Math.round(totalTime),
      nounsPerSecond: Math.round(fullNouns.length / (totalTime / 1000)),
      newestNounId: fullNouns[0]?.id,
      oldestNounId: fullNouns[fullNouns.length - 1]?.id,
      sortOrder,
      orderDirection
    });

    return { nouns: fullNouns, totalCount: fullNouns.length };
  } catch (error) {
    console.error('❌ Error fetching all nouns complete:', error);
    return { nouns: [], totalCount: 0 };
  }
}

// Fetch all nouns for filtering (limit 1000)
export async function getAllNounsForFiltering(): Promise<{ nouns: Noun[], totalCount: number }> {
  console.log('🔍 PERFORMANCE TEST: Fetching all nouns (limit 1000)...');
  const overallStart = performance.now();
  
  try {
    // Fetch all nouns with a high limit for filtering
    const fetchStart = performance.now();
    const response = await fetch(CHAIN_CONFIG.indexerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GetNounsPaginatedDocument,
        variables: { 
          limit: 1000, 
          offset: 0, 
          orderBy: "id", 
          orderDirection: OrderDirection.Desc 
        }
      }),
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const fetchEnd = performance.now();
    
    console.log('📡 FETCH PERFORMANCE:', {
      fetchTimeMs: Math.round(fetchEnd - fetchStart),
      responseSize: JSON.stringify(result).length,
      url: CHAIN_CONFIG.indexerUrl
    });
    const vpsResponse = result.data;
    
    console.log('📥 All nouns for filtering response:', {
      hasResponse: !!vpsResponse,
      hasNouns: !!vpsResponse?.nouns?.items,
      nounsLength: vpsResponse?.nouns?.items?.length || 0,
    });
    
    if (!vpsResponse?.nouns?.items) {
      console.warn('⚠️ No nouns.items in filtering response');
      return { nouns: [], totalCount: 0 };
    }

    const [queryResponse, secondaryNounListings] = await Promise.all([
      Promise.resolve(vpsResponse.nouns.items),
      // Temporarily disable secondary listings to fix hanging issue
      Promise.resolve([]),
    ]);
    
    let nouns = queryResponse.map((noun: any) => transformVpsNounToNoun(noun));

    const fullNouns = nouns.map((noun: any) => ({
      ...noun,
      secondaryListing: secondaryNounListings.find(
        (listing: any) => listing.nounId === noun.id,
      ) || null,
    })) as Noun[];

    const overallEnd = performance.now();
    const processingTime = overallEnd - fetchEnd;
    const totalTime = overallEnd - overallStart;
    
    console.log('✨ PROCESSING PERFORMANCE:', { 
      finalCount: fullNouns.length,
      processingTimeMs: Math.round(processingTime),
      totalTimeMs: Math.round(totalTime),
      nounsPerSecond: Math.round(fullNouns.length / (totalTime / 1000)),
      newestNounId: fullNouns[0]?.id,
      oldestNounId: fullNouns[fullNouns.length - 1]?.id
    });

    return { nouns: fullNouns, totalCount: fullNouns.length };
  } catch (error) {
    console.error('❌ Error fetching all nouns for filtering:', error);
    return { nouns: [], totalCount: 0 };
  }
}

// NEW: Cursor-based pagination for infinite scrolling (optimized)
export async function getNounsWithCursor(
  first: number = 100,
  after?: string,
  orderDirection: OrderDirection = OrderDirection.Desc
): Promise<{ nouns: Noun[], hasNextPage: boolean, endCursor?: string }> {
  console.log('🔍 getNounsWithCursor called with:', { first, after, orderDirection });

  try {
    const response = await fetch(CHAIN_CONFIG.indexerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GetNounsPaginatedDocument,
        variables: {
          limit: first,
          offset: after ? parseInt(after) : 0,
          orderBy: "id",
          orderDirection: orderDirection
        }
      }),
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const vpsResponse = result.data;

    console.log('📥 VPS response:', {
      hasResponse: !!vpsResponse,
      hasNouns: !!vpsResponse?.nouns?.items,
      nounsLength: vpsResponse?.nouns?.items?.length || 0,
      hasPageInfo: !!vpsResponse?.nouns?.pageInfo,
      pageInfo: vpsResponse?.nouns?.pageInfo,
      fullResponse: JSON.stringify(vpsResponse).substring(0, 500) + '...'
    });

    if (!vpsResponse?.nouns?.items) {
      console.warn('⚠️ No nouns.items in cursor response');
      return { nouns: [], hasNextPage: false };
    }

    const [queryResponse, secondaryNounListings] = await Promise.all([
      Promise.resolve(vpsResponse.nouns.items),
      // Temporarily disable secondary listings to fix hanging issue
      Promise.resolve([]),
    ]);

    let nouns = queryResponse.map((noun: any) => transformVpsNounToNoun(noun));

    const fullNouns = nouns.map((noun: any) => ({
      ...noun,
      secondaryListing: secondaryNounListings.find(
        (listing: any) => listing.nounId === noun.id,
      ) || null,
    })) as Noun[];

    console.log('✨ Cursor nouns processed:', {
      finalCount: fullNouns.length,
      hasNextPage: vpsResponse.nouns.pageInfo?.hasNextPage,
      endCursor: vpsResponse.nouns.pageInfo?.endCursor
    });

    return {
      nouns: fullNouns,
      hasNextPage: vpsResponse.nouns.pageInfo?.hasNextPage || false,
      endCursor: vpsResponse.nouns.pageInfo?.endCursor
    };
  } catch (error) {
    console.error('❌ Error in getNounsWithCursor:', error);
    return { nouns: [], hasNextPage: false };
  }
}

// NEW: Offset-based pagination for infinite scrolling (optimized)
export async function getNounsWithOffset(
  offset: number = 0,
  limit: number = 100,
  orderDirection: OrderDirection = OrderDirection.Desc
): Promise<{ nouns: Noun[], hasNextPage: boolean }> {
  console.log('🔍 getNounsWithOffset called with:', { offset, limit, orderDirection });

  try {
    const response = await fetch(CHAIN_CONFIG.indexerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GetNounsPaginatedDocument,
        variables: {
          limit,
          offset,
          orderBy: "id",
          orderDirection: orderDirection
        }
      }),
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const vpsResponse = result.data;

    console.log('📥 VPS offset response:', {
      hasResponse: !!vpsResponse,
      hasNouns: !!vpsResponse?.nouns?.items,
      nounsLength: vpsResponse?.nouns?.items?.length || 0,
      hasPageInfo: !!vpsResponse?.nouns?.pageInfo,
      pageInfo: vpsResponse?.nouns?.pageInfo,
      requestedOffset: offset,
      requestedLimit: limit
    });

    if (!vpsResponse?.nouns?.items) {
      console.warn('⚠️ No nouns.items in offset response');
      return { nouns: [], hasNextPage: false };
    }

    const [queryResponse, secondaryNounListings] = await Promise.all([
      Promise.resolve(vpsResponse.nouns.items),
      // Temporarily disable secondary listings to fix hanging issue
      Promise.resolve([]),
    ]);

    let nouns = queryResponse.map((noun: any) => transformVpsNounToNoun(noun));

    const fullNouns = nouns.map((noun: any) => ({
      ...noun,
      secondaryListing: secondaryNounListings.find(
        (listing: any) => listing.nounId === noun.id,
      ) || null,
    })) as Noun[];

    // Check if there are more items by comparing requested limit with actual returned items
    const hasNextPage = fullNouns.length === limit;

    console.log('✨ Offset nouns processed:', {
      finalCount: fullNouns.length,
      hasNextPage,
      requestedOffset: offset,
      requestedLimit: limit
    });

    return {
      nouns: fullNouns,
      hasNextPage
    };
  } catch (error) {
    console.error('❌ Error in getNounsWithOffset:', error);
    return { nouns: [], hasNextPage: false };
  }
}

// NEW: Ultra-compact offset pagination for grid display (minimal payload)
export async function getCompactNounsWithOffset(
  offset: number = 0,
  limit: number = 100,
  orderDirection: OrderDirection = OrderDirection.Desc
): Promise<{ nouns: CompactNoun[], hasNextPage: boolean }> {
  console.log('🔍 getCompactNounsWithOffset called with:', { offset, limit, orderDirection });

  try {
    const response = await fetch(CHAIN_CONFIG.indexerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GetNounsPaginatedDocument,
        variables: {
          limit,
          offset,
          orderBy: "id",
          orderDirection: orderDirection
        }
      }),
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const vpsResponse = result.data;

    if (!vpsResponse?.nouns?.items) {
      console.warn('⚠️ No nouns.items in compact offset response');
      return { nouns: [], hasNextPage: false };
    }

    // Transform to compact format - only essential fields for grid
    const compactNouns: CompactNoun[] = vpsResponse.nouns.items.map((noun: any) => ({
      id: noun.id,
      seed: [noun.background, noun.body, noun.accessory, noun.head, noun.glasses],
      createdAt: noun.createdAt
    }));

    // Check if there are more items by comparing requested limit with actual returned items
    const hasNextPage = compactNouns.length === limit;

    console.log('✨ Compact offset nouns processed:', {
      finalCount: compactNouns.length,
      payloadSize: JSON.stringify(compactNouns).length,
      hasNextPage,
      requestedOffset: offset,
      requestedLimit: limit
    });

    return {
      nouns: compactNouns,
      hasNextPage
    };
  } catch (error) {
    console.error('❌ Error in getCompactNounsWithOffset:', error);
    return { nouns: [], hasNextPage: false };
  }
}

// DEPRECATED: Legacy offset-based pagination (keep for backward compatibility)
export async function getNounsPaginated(
  page: number = 0,
  pageSize: number = 100
): Promise<{ nouns: Noun[], hasMore: boolean, totalCount?: number }> {
  console.log('🔍 getNounsPaginated called with:', { page, pageSize });
  
  const offset = page * pageSize;
  const limit = pageSize + 1; // Fetch one extra to check if there are more
  
  console.log('📊 VPS GraphQL query params:', { limit, offset, indexerUrl: CHAIN_CONFIG.indexerUrl });
  
  try {
    // Direct VPS GraphQL fetch using the proper document
    const response = await fetch(CHAIN_CONFIG.indexerUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GetNounsPaginatedDocument,
        variables: { 
          limit, 
          offset, 
          orderBy: "id", 
          orderDirection: OrderDirection.Desc 
        }
      }),
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const vpsResponse = result.data;
    
    console.log('📥 VPS GraphQL response:', {
      hasResponse: !!vpsResponse,
      hasNouns: !!vpsResponse?.nouns?.items,
      nounsLength: vpsResponse?.nouns?.items?.length || 0,
      hasPageInfo: !!vpsResponse?.nouns?.pageInfo
    });
    
    if (!vpsResponse?.nouns?.items) {
      console.warn('⚠️ No nouns.items in VPS GraphQL response');
      return { nouns: [], hasMore: false };
    }

    const hasMore = vpsResponse.nouns.items.length > pageSize;
    const nounsToReturn = hasMore ? vpsResponse.nouns.items.slice(0, pageSize) : vpsResponse.nouns.items;

    console.log('🔄 Processing VPS nouns:', { hasMore, nounsToReturnLength: nounsToReturn.length });

    const [queryResponse, secondaryNounListings] = await Promise.all([
      Promise.resolve(nounsToReturn),
      // Temporarily disable secondary listings to fix hanging issue
      Promise.resolve([]),
    ]);
    
    console.log('📋 Secondary listings fetched:', { listingsCount: secondaryNounListings.length });
    
    let nouns = queryResponse.map((noun: any) => transformVpsNounToNoun(noun));

    // No need to sort - already ordered by VPS GraphQL query (orderBy: "id", orderDirection: desc)

    const fullNouns = nouns.map((noun: any) => ({
      ...noun,
      secondaryListing: secondaryNounListings.find(
        (listing: any) => listing.nounId === noun.id,
      ) || null,
    })) as Noun[];

    console.log('✨ Final VPS nouns processed:', { 
      finalCount: fullNouns.length, 
      hasMore,
      newestNounId: fullNouns[0]?.id,
      oldestNounId: fullNouns[fullNouns.length - 1]?.id
    });

    return { nouns: fullNouns, hasMore };
  } catch (error) {
    console.error('❌ Error in getNounsPaginated:', error);
    return { nouns: [], hasMore: false };
  }
}

// Batch fetching for historical scrubbing (auction interface)
export async function getNounsBatch(
  startId: number,
  endId: number
): Promise<Noun[]> {
  // Use existing query for batch fetching with ID range
  const batchSize = Math.min(endId - startId + 1, 1000);
  const skip = Math.max(0, startId);
  
  const response = await graphQLFetchWithFallback(
    CHAIN_CONFIG.goldskyUrl,
    query,
    { batchSize, skip },
    { 
      next: { revalidate: 3600 } // Cache historical data for 1 hour
    }
  );
  
  if (!response?.nouns) {
    return [];
  }

  // Filter to exact ID range requested
  const filteredNouns = response.nouns.filter((noun: any) => {
    const nounId = parseInt(noun.id);
    return nounId >= startId && nounId <= endId;
  });

  let nouns = filteredNouns.map(transformQueryNounToNoun);

  const fullNouns = nouns.map((noun) => ({
    ...noun,
    secondaryListing: null, // Reservoir integration removed
  })) as Noun[];

  return fullNouns;
}

export async function getAllNouns(): Promise<Noun[]> {
  const queryResponse = await runPaginatedNounsQuery();
  let nouns = queryResponse.map(transformQueryNounToNoun);

  // Sort by id, descending (newest first)
  nouns.sort((a, b) => (BigInt(b.id) > BigInt(a.id) ? 1 : -1));

  const fullNouns = nouns.map((noun) => ({
    ...noun,
    secondaryListing: null, // Reservoir integration removed
  })) as Noun[];

  return fullNouns;
}

export async function forceAllNounRevalidation() {
  revalidateTag(`paginated-nouns-query-${CHAIN_CONFIG.chain.id.toString()}`);
}

export async function checkForAllNounRevalidation(nounId: string) {
  const allNouns = await getAllNouns();
  if (allNouns[0]?.id && BigInt(allNouns[0].id) < BigInt(nounId)) {
    forceAllNounRevalidation();
  }
}
