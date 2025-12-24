
import { graphQLFetch } from "@/data/utils/graphQLFetch";
import { CHAIN_CONFIG } from "@/config";

const query = `
  query GetProposalTitle($id: ID!) {
    proposal(id: $id) {
      id
      title
    }
  }
`;

interface ProposalTitleResponse {
  proposal: {
    id: string;
    title: string;
  };
}

export async function getProposalTitle(id: string): Promise<string | null> {
  try {
    const data = await graphQLFetch(
      CHAIN_CONFIG.goldskyUrl.primary,
      query,
      { id },
      {
        next: {
          revalidate: 3600, // 1 hour cache
        },
      },
    ) as ProposalTitleResponse;

    return data?.proposal?.title ?? null;
  } catch (error) {
    console.error('Failed to fetch proposal title from Goldsky:', error);
    throw error;
  }
}