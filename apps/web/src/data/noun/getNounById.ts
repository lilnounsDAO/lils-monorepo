import { Noun } from "./types";
import { checkForAllNounRevalidation } from "./getAllNouns";
import { CHAIN_CONFIG } from "@/config";
import { transformVpsNounToNoun } from "./helpers";
import { unstable_cache } from "@/utils/viteCache";
import { SECONDS_PER_HOUR } from "@/utils/constants";

// Import VPS-specific GraphQL query
import { GetNounByIdDocument } from "../generated/ponder/clean-graphql";

export async function getNounByIdUncached(id: string): Promise<Noun | undefined> {
  console.log("getNounByIdUncached - using VPS indexer for ID:", id);
  console.log("VPS Indexer URL:", CHAIN_CONFIG.indexerUrl);
  
  // Direct VPS GraphQL fetch
  const response = await fetch(CHAIN_CONFIG.indexerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query: GetNounByIdDocument,
      variables: { id }
    }),
    next: { revalidate: 0 }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  const vpsResponse = result.data;
  const noun = vpsResponse?.noun ? transformVpsNounToNoun(vpsResponse.noun as any) : undefined;

  if (noun) {
    checkForAllNounRevalidation(id);
    const fullNoun: Noun = { ...noun, secondaryListing: null };
    return fullNoun;
  } else {
    return undefined;
  }
}

const getNounByIdCached = unstable_cache(getNounByIdUncached, ["get-noun-by-id"], { revalidate: SECONDS_PER_HOUR });

export async function getNounById(id: string): Promise<Noun | undefined> {
  const [noun] = await Promise.all([getNounByIdCached(id)]);

  // Kickoff a check to revalidate all in grid (when its a new Noun)
  checkForAllNounRevalidation(id);

  return noun;
}
