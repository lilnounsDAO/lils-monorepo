import { BigIntString } from "@/utils/types";
import { CHAIN_CONFIG, CHAIN_SPECIFIC_CONFIGS } from "@/config";
import { graphql } from "../generated/gql";
import { graphQLFetchWithFallback } from "../utils/graphQLFetch";
import { FIRST_VRGDA_NOUN_ID } from "@/utils/vrgdaUtils";
import { getCurrentVRGDANounId } from "../vrgda/getCurrentVRGDANounId";
import { detectChainFromHostname } from "@/utils/networkDetection";
import { sepolia } from "viem/chains";

const query = graphql(/* GraphQL */ `
  query CurrentAuctionId {
    auctions(orderBy: startTime, orderDirection: desc, first: 1) {
      id
    }
  }
`);

export async function getCurrentAuctionNounId(): Promise<BigIntString> {
  try {
    // Get the correct chain config dynamically
    const chainId = detectChainFromHostname();
    const config = CHAIN_SPECIFIC_CONFIGS[chainId];
    
    // First, get the current VRGDA noun ID
    const currentVRGDAId = await getCurrentVRGDANounId();
    const vrgdaIdNum = parseInt(currentVRGDAId);
    
    // If we're in VRGDA territory (>= 7983 on mainnet, or any VRGDA on Sepolia), return VRGDA ID
    // On Sepolia, VRGDA starts at noun 1, so we check differently
    const isSepolia = chainId === sepolia.id;
    if (isSepolia || vrgdaIdNum >= FIRST_VRGDA_NOUN_ID) {
      return currentVRGDAId;
    }
    
    // Otherwise, fall back to traditional auction logic
    const result = await graphQLFetchWithFallback(
      config.subgraphUrl.primary,
      query,
      {},
      { next: { revalidate: 2 } },
    );
    const currentAuction = result?.auctions?.[0] ?? null;
    return currentAuction?.id ?? "1";
  } catch (error) {
    console.error('Error in getCurrentAuctionNounId:', error);
    // Try VRGDA first as fallback
    try {
      return await getCurrentVRGDANounId();
    } catch (vrgdaError) {
      console.error('VRGDA fallback failed:', vrgdaError);
      // Chain-specific fallback
      const chainId = detectChainFromHostname();
      return chainId === sepolia.id ? "1" : "7983";
    }
  }
}
