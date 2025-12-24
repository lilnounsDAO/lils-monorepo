import { cleanGraphQLFetch } from "../utils/cleanGraphQLFetch";
import { GetNounsPaginatedDocument, OrderDirection, NounWhereInput } from "@/data/generated/ponder/clean-graphql";

const BURN_ADDRESS = "0x0000000000000000000000000000000000000000";

/**
 * Get the count of unique noun owners from VPS, excluding burn address
 * This fetches all nouns in batches and counts unique owners
 */
export async function getUniqueNounOwnersCount(): Promise<number> {
  try {
    const uniqueOwners = new Set<string>();
    let offset = 0;
    const limit = 1000; // Fetch in batches of 1000
    let hasMore = true;

    // Build where clause to exclude burn address
    const where: NounWhereInput = {
      owner_not_in: [BURN_ADDRESS.toLowerCase()],
    };

    while (hasMore) {
      const result = await cleanGraphQLFetch(GetNounsPaginatedDocument, {
        where,
        orderBy: "id",
        orderDirection: OrderDirection.Asc,
        limit,
        offset,
      });

      if (!result.nouns.items || result.nouns.items.length === 0) {
        hasMore = false;
        break;
      }

      // Add unique owners to set
      result.nouns.items.forEach((noun) => {
        if (noun.owner && noun.owner.toLowerCase() !== BURN_ADDRESS.toLowerCase()) {
          uniqueOwners.add(noun.owner.toLowerCase());
        }
      });

      // Check if there are more pages
      hasMore = result.nouns.pageInfo.hasNextPage;
      offset += limit;

      // Safety limit to prevent infinite loops
      if (offset > 100000) {
        console.warn("Reached safety limit while fetching unique noun owners");
        break;
      }
    }

    return uniqueOwners.size;
  } catch (error) {
    console.error("Failed to fetch unique noun owners count from VPS:", error);
    // Return 0 on error to avoid breaking the UI
    return 0;
  }
}

