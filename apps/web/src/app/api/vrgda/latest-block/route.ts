// Note: This is handled by Vite plugins in development
import { cleanGraphQLFetch } from '@/data/ponder/utils/cleanGraphQLFetch';
import { CLEAN_GRAPHQL_ENDPOINT } from '@/data/ponder/utils/cleanGraphQLFetch';

const GET_LATEST_BLOCK_QUERY = `
  query GetLatestBlock {
    _meta {
      block {
        number
        hash
        timestamp
      }
    }
  }
`;

interface LatestBlockResponse {
  _meta: {
    block: {
      number: string;
      hash: string;
      timestamp: string;
    };
  };
}

export async function GET() {
  try {
    const response = await fetch(CLEAN_GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: GET_LATEST_BLOCK_QUERY,
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

    const data: LatestBlockResponse = result.data;

    if (!data._meta?.block) {
      return Response.json(
        { error: 'Unable to fetch latest block data' },
        { status: 500 }
      );
    }

    const { number, hash, timestamp } = data._meta.block;
    
    return Response.json({
      blockNumber: number,
      blockHash: hash,
      timestamp: parseInt(timestamp) * 1000, // Convert to milliseconds
      fetchedAt: Date.now()
    });
  } catch (error) {
    console.error('Error fetching latest block:', error);
    return Response.json(
      { error: 'Failed to fetch latest block' },
      { status: 500 }
    );
  }
}

export const revalidate = 0; // Disable caching for real-time data
