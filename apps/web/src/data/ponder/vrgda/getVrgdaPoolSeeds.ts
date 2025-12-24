
import { VrgdaPoolSeed, VrgdaPoolSeedsResult, VrgdaFilters, VrgdaSortField, SortDirection } from "./types";
import { cleanGraphQLFetch, CLEAN_GRAPHQL_ENDPOINT } from "../utils/cleanGraphQLFetch";
import { GetVrgdaPoolSeedsDocument, OrderDirection, VrgdaPoolSeedWhereInput } from "@/data/generated/ponder/clean-graphql";
import { isSepoliaNetwork } from "@/utils/networkDetection";

export async function getVrgdaPoolSeeds(
  filters: VrgdaFilters = {},
  sortField: VrgdaSortField = 'blockNumber',
  sortDirection: SortDirection = 'desc',
  limit: number = 50,
  offset: number = 0
): Promise<VrgdaPoolSeedsResult> {
  // Disable VRGDA pool queries on Sepolia - VPS not configured for Sepolia yet
  if (isSepoliaNetwork()) {
    console.log('VRGDA pool queries disabled on Sepolia - VPS not configured');
    return { seeds: [], hasMore: false };
  }

  try {
    // Build proper where object from filters
    const where: any = {};
    if (filters.isUsed !== undefined) {
      where.isUsed = filters.isUsed;
    }
    if (filters.blockNumberGt) {
      where.blockNumber_gt = filters.blockNumberGt;
    }
    if (filters.blockNumberGte) {
      where.blockNumber_gte = filters.blockNumberGte;
    }
    if (filters.blockNumberLt) {
      where.blockNumber_lt = filters.blockNumberLt;
    }
    if (filters.blockNumberLte) {
      where.blockNumber_lte = filters.blockNumberLte;
    }
    if (filters.blockNumbers && filters.blockNumbers.length > 0) {
      where.blockNumber_in = filters.blockNumbers;
    }
    if (filters.background !== undefined) {
      where.background = filters.background;
    }
    if (filters.backgrounds && filters.backgrounds.length > 0) {
      where.background_in = filters.backgrounds;
    }
    if (filters.body !== undefined) {
      where.body = filters.body;
    }
    if (filters.bodies && filters.bodies.length > 0) {
      where.body_in = filters.bodies;
    }
    if (filters.accessory !== undefined) {
      where.accessory = filters.accessory;
    }
    if (filters.accessories && filters.accessories.length > 0) {
      where.accessory_in = filters.accessories;
    }
    if (filters.head !== undefined) {
      where.head = filters.head;
    }
    if (filters.heads && filters.heads.length > 0) {
      where.head_in = filters.heads;
    }
    if (filters.glasses !== undefined) {
      where.glasses = filters.glasses;
    }
    if (filters.glassesOptions && filters.glassesOptions.length > 0) {
      where.glasses_in = filters.glassesOptions;
    }

    // Build variables for filters/sorting/pagination
    const variables: any = {
      limit,
      offset,
    };
    
    // Only include optional parameters if they have values
    if (sortField) {
      variables.orderBy = sortField;
    }
    if (sortDirection) {
      variables.orderDirection = sortDirection;
    }
    
    // Only include where if it has any filters
    if (Object.keys(where).length > 0) {
      variables.where = where;
    }

    console.log('getVrgdaPoolSeeds - Endpoint:', CLEAN_GRAPHQL_ENDPOINT);
    console.log('getVrgdaPoolSeeds - Variables:', variables);

    const response = await fetch(CLEAN_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          query GetVrgdaPoolSeeds($limit: Int!, $offset: Int!, $orderBy: String, $orderDirection: OrderDirection, $where: VrgdaPoolSeedWhereInput) {
            vrgdaPoolSeeds(
              orderBy: $orderBy
              orderDirection: $orderDirection
              limit: $limit
              offset: $offset
              where: $where
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
          }
        `,
        variables,
      }),
    });

    if (!response.ok) {
      throw new Error(`GraphQL request failed with status ${response.status}`);
    }

    const result = await response.json();
    console.log('getVrgdaPoolSeeds - GraphQL result:', result);
    console.log('getVrgdaPoolSeeds - result.data:', result.data);

    if (result.errors) {
      console.error('getVrgdaPoolSeeds - GraphQL errors:', result.errors);
      throw new Error(`GraphQL errors: ${result.errors.map((e: any) => e.message).join(', ')}`);
    }

    if (!result.data) {
      console.error('getVrgdaPoolSeeds - No data in response');
      throw new Error('No data returned from GraphQL query');
    }

    if (!result.data.vrgdaPoolSeeds) {
      console.error('getVrgdaPoolSeeds - No vrgdaPoolSeeds in data:', result.data);
      throw new Error('No vrgdaPoolSeeds in GraphQL response');
    }

    console.log('getVrgdaPoolSeeds - result.data.vrgdaPoolSeeds:', result.data.vrgdaPoolSeeds);
    console.log('getVrgdaPoolSeeds - result.data.vrgdaPoolSeeds.items:', result.data.vrgdaPoolSeeds.items);

    const seeds: VrgdaPoolSeed[] = result.data.vrgdaPoolSeeds.items.map(seed => ({
      id: seed.id,
      nounId: seed.nounId, // ✅ nounId field now exists in GraphQL schema
      blockNumber: seed.blockNumber,
      background: seed.background,
      body: seed.body,
      accessory: seed.accessory,
      head: seed.head,
      glasses: seed.glasses,
      isUsed: seed.isUsed,
      generatedAt: seed.generatedAt,
    }));

    

    console.log('getVrgdaPoolSeeds - mapped seeds:', seeds);

    return {
      seeds,
      hasMore: false, // For now, simplified
    };
  } catch (error) {
    console.error('Failed to fetch VRGDA pool seeds from Ponder:', error);
    return { seeds: [], hasMore: false };
  }
}

// Helper function to get only available (unused) seeds
export async function getAvailableVrgdaSeeds(
  limit: number = 50,
  offset: number = 0
): Promise<VrgdaPoolSeedsResult> {
  return getVrgdaPoolSeeds(
    { isUsed: false },
    'blockNumber',
    'desc',
    limit,
    offset
  );
}

// Helper function to get the latest N seeds
export async function getLatestVrgdaSeeds(
  limit: number = 10
): Promise<VrgdaPoolSeed[]> {
  const result = await getVrgdaPoolSeeds(
    {},
    'blockNumber',
    'desc',
    limit,
    0
  );
  return result.seeds;
}
