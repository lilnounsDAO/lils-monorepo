import { graphQLFetch } from "@/data/utils/graphQLFetch";
import { CHAIN_CONFIG } from "@/config";

export interface Delegate {
  id: string;
  nounsRepresented: Array<{ id: string }>;
}

const delegatesQuery = `
  query GetDelegates {
    delegates {
      id
      nounsRepresented {
        id
      }
    }
  }
`;

interface DelegatesResponse {
  delegates: Delegate[];
}

export async function getDelegates(): Promise<Delegate[]> {
  try {
    const data = await graphQLFetch(
      CHAIN_CONFIG.goldskyUrl.primary,
      delegatesQuery,
      {},
      {
        next: { revalidate: 60 }, // Cache for 1 minute
      },
    ) as DelegatesResponse;

    return data?.delegates || [];
  } catch (error) {
    console.error('Failed to fetch delegates:', error);
    return [];
  }
}

