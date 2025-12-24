import { PonderNoun } from "./types";
import { cleanGraphQLFetch } from "../utils/cleanGraphQLFetch";
import { GetNounsPaginatedDocument, OrderDirection } from "@/data/generated/ponder/clean-graphql";

/**
 * Get all nouns delegated to a specific address
 */
export async function getNounsDelegatedTo(
  address: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ nouns: PonderNoun[]; hasMore: boolean }> {
  try {
    const result = await cleanGraphQLFetch(GetNounsPaginatedDocument, {
      where: {
        delegate: address.toLowerCase()
      },
      orderBy: 'id',
      orderDirection: OrderDirection.Desc,
      limit,
      offset
    });

    const nouns: PonderNoun[] = result.nouns.items.map(noun => ({
      id: noun.id,
      owner: noun.owner,
      delegate: noun.delegate || undefined,
      background: noun.background,
      body: noun.body,
      accessory: noun.accessory,
      head: noun.head,
      glasses: noun.glasses,
      createdAt: noun.createdAt,
      updatedAt: noun.updatedAt,
    }));

    return {
      nouns,
      hasMore: result.nouns.pageInfo.hasNextPage
    };
  } catch (error) {
    console.error('Failed to fetch nouns delegated to address from Ponder:', error);
    return { nouns: [], hasMore: false };
  }
}

