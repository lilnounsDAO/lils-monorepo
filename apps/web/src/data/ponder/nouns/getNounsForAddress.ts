
import { PonderNoun } from "./types";
import { cleanGraphQLFetch } from "../utils/cleanGraphQLFetch";
import { GetNounsPaginatedDocument, OrderDirection } from "@/data/generated/ponder/clean-graphql";
import { getOnchainNounsForAddress, usesOnchainData } from "@/data/sepolia/onchain";
import { getAddress } from "viem";

export async function getNounsForAddress(
  address: string,
  limit: number = 50,
  offset: number = 0
): Promise<{ nouns: PonderNoun[]; hasMore: boolean }> {
  if (usesOnchainData()) {
    const all = await getOnchainNounsForAddress(getAddress(address));
    const slice = all.slice(offset, offset + limit);
    return {
      nouns: slice.map((noun) => ({
        id: noun.id,
        owner: noun.owner,
        background: noun.traits.background.seed,
        body: noun.traits.body.seed,
        accessory: noun.traits.accessory.seed,
        head: noun.traits.head.seed,
        glasses: noun.traits.glasses.seed,
        createdAt: "0",
        updatedAt: "0",
      })),
      hasMore: offset + limit < all.length,
    };
  }

  try {
    const result = await cleanGraphQLFetch(GetNounsPaginatedDocument, {
      where: {
        owner: address.toLowerCase()
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
    console.error('Failed to fetch nouns for address from Ponder:', error);
    return { nouns: [], hasMore: false };
  }
}