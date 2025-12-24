// Note: This is handled by Vite plugins in development
import { CLEAN_GRAPHQL_ENDPOINT } from '@/data/ponder/utils/cleanGraphQLFetch';

const GET_POOL_CHANGES_QUERY = `
  query GetPoolChanges($since: BigInt) {
    vrgdaPoolSeeds(
      where: { generatedAt_gt: $since }
      orderBy: "blockNumber"
      orderDirection: "asc"
      limit: 50
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
        blockHash
        isUsed
        isValid
        generatedAt
        invalidatedAt
      }
    }
    
    # Also get recently used seeds
    recentlyUsedSeeds: vrgdaPoolSeeds(
      where: { 
        isUsed: true
        generatedAt_gt: $since
      }
      orderBy: "blockNumber"
      orderDirection: "desc"
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
        blockHash
        isUsed
        isValid
        generatedAt
        invalidatedAt
      }
    }
    
    # Get current pool status
    _meta {
      block {
        number
        hash
        timestamp
      }
    }
  }
`;

interface PoolChangesResponse {
  vrgdaPoolSeeds: {
    items: Array<{
      id: string;
      blockNumber: string;
      nounId: string;
      background: number;
      body: number;
      accessory: number;
      head: number;
      glasses: number;
      blockHash: string;
      isUsed: boolean;
      isValid: boolean;
      generatedAt: string;
      invalidatedAt: string | null;
    }>;
  };
  recentlyUsedSeeds: {
    items: Array<{
      id: string;
      blockNumber: string;
      nounId: string;
      background: number;
      body: number;
      accessory: number;
      head: number;
      glasses: number;
      blockHash: string;
      isUsed: boolean;
      isValid: boolean;
      generatedAt: string;
      invalidatedAt: string | null;
    }>;
  };
  _meta: {
    block: {
      number: string;
      hash: string;
      timestamp: string;
    };
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const since = searchParams.get('since') || '0';
    
    const response = await fetch(CLEAN_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_POOL_CHANGES_QUERY,
        variables: { since },
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

    const data: PoolChangesResponse = result.data;

    const newSeeds = data.vrgdaPoolSeeds?.items || [];
    const usedSeeds = data.recentlyUsedSeeds?.items || [];
    const currentBlock = data._meta?.block;

    // Separate additions and removals
    const additions = newSeeds.filter(seed => seed.isValid && !seed.isUsed);
    const invalidations = newSeeds.filter(seed => !seed.isValid || seed.invalidatedAt);
    
    return Response.json({
      changes: {
        additions,
        usedSeeds,
        invalidations,
        totalNew: additions.length,
        totalUsed: usedSeeds.length,
        totalInvalidated: invalidations.length
      },
      currentBlock: currentBlock ? {
        number: currentBlock.number,
        hash: currentBlock.hash,
        timestamp: parseInt(currentBlock.timestamp) * 1000
      } : null,
      fetchedAt: Date.now(),
      since: since
    });
  } catch (error) {
    console.error('Error fetching pool changes:', error);
    return Response.json(
      { error: 'Failed to fetch pool changes' },
      { status: 500 }
    );
  }
}

export const revalidate = 0; // Disable caching for real-time data
