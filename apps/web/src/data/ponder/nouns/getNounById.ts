
import { PonderNoun } from "./types";
import { cleanGraphQLFetch } from "../utils/cleanGraphQLFetch";
import { GetNounByIdDocument } from "@/data/generated/ponder/clean-graphql";

export async function getNounById(id: string): Promise<PonderNoun | null> {
  try {
    const result = await cleanGraphQLFetch(GetNounByIdDocument, { id });
    
    if (!result.noun) {
      return null;
    }

    return {
      id: result.noun.id,
      owner: result.noun.owner,
      delegate: result.noun.delegate || undefined,
      background: result.noun.background,
      body: result.noun.body,
      accessory: result.noun.accessory,
      head: result.noun.head,
      glasses: result.noun.glasses,
      createdAt: result.noun.createdAt,
      updatedAt: result.noun.updatedAt,
    };
  } catch (error) {
    console.error('Failed to fetch noun by ID from Ponder:', error);
    return null;
  }
}