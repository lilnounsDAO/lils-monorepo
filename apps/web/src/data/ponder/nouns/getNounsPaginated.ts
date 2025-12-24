
import { PonderNoun, NounsPaginatedResult, NounFilters, NounSortField, SortDirection } from "./types";
import { cleanGraphQLFetch } from "../utils/cleanGraphQLFetch";
import { GetNounsPaginatedDocument, OrderDirection, NounWhereInput } from "@/data/generated/ponder/clean-graphql";

export async function getNounsPaginated(
  filters: NounFilters = {},
  sortField: NounSortField = 'id',
  sortDirection: SortDirection = 'desc',
  limit: number = 50,
  offset: number = 0
): Promise<NounsPaginatedResult> {
  try {
    // Build where clause from filters
    const where: NounWhereInput = {};
    
    if (filters.owner) {
      where.owner = filters.owner.toLowerCase();
    }
    if (filters.owners && filters.owners.length > 0) {
      where.owner_in = filters.owners.map(addr => addr.toLowerCase());
    }
    if (filters.delegate) {
      where.delegate = filters.delegate.toLowerCase();
    }
    if (filters.delegates && filters.delegates.length > 0) {
      where.delegate_in = filters.delegates.map(addr => addr.toLowerCase());
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

    const result = await cleanGraphQLFetch(GetNounsPaginatedDocument, {
      where,
      orderBy: sortField,
      orderDirection: sortDirection === 'desc' ? OrderDirection.Desc : OrderDirection.Asc,
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
      hasMore: result.nouns.pageInfo.hasNextPage,
      // Note: Total count would require a separate query or schema enhancement
    };
  } catch (error) {
    console.error('Failed to fetch paginated nouns from Ponder:', error);
    return { nouns: [], hasMore: false };
  }
}