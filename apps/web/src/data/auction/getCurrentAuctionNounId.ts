import { BigIntString } from "@/utils/types";
import { CHAIN_CONFIG, CHAIN_SPECIFIC_CONFIGS } from "@/config";
import { graphql } from "../generated/gql";
import { graphQLFetchWithFallback } from "../utils/graphQLFetch";
import { FIRST_VRGDA_NOUN_ID, hasLilVrgda } from "@/utils/vrgdaUtils";
import { getCurrentVRGDANounId } from "../vrgda/getCurrentVRGDANounId";
import { detectChainFromHostname, isSepoliaNetwork } from "@/utils/networkDetection";
import { getOnchainAuctionHouseAuction } from "./getOnchainAuction";
import { getLatestOnchainNounId, getMinterMode } from "@/data/sepolia/onchain";

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

    if (isSepoliaNetwork()) {
      const mode = await getMinterMode();
      if (mode === "vrgda" && hasLilVrgda()) {
        return await getCurrentVRGDANounId();
      }
      const onchain = await getOnchainAuctionHouseAuction();
      if (onchain) return onchain.nounId;
      return (await getLatestOnchainNounId()) ?? "0";
    }

    if (hasLilVrgda()) {
      const currentVRGDAId = await getCurrentVRGDANounId();
      const vrgdaIdNum = parseInt(currentVRGDAId);
      if (vrgdaIdNum >= FIRST_VRGDA_NOUN_ID) {
        return currentVRGDAId;
      }
    } else {
      const onchain = await getOnchainAuctionHouseAuction();
      if (onchain) return onchain.nounId;
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
    if (isSepoliaNetwork()) {
      return (await getLatestOnchainNounId()) ?? "0";
    }
    try {
      return await getCurrentVRGDANounId();
    } catch (vrgdaError) {
      console.error('VRGDA fallback failed:', vrgdaError);
      return "7983";
    }
  }
}
