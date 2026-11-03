import { graphql } from "../generated/gql";
import { graphQLFetchWithFallback } from "../utils/graphQLFetch";
import { CHAIN_CONFIG } from "@/config";
import { BigIntString } from "@/utils/types";
import { Auction, Bid } from "./types";
import { Hex, getAddress } from "viem";
import { getProtocolParams } from "../protocol/getProtocolParams";
import { bigIntMax } from "@/utils/bigint";
import { revalidateTag, unstable_cache } from "@/utils/viteCache";
import { FIRST_VRGDA_NOUN_ID, isVRGDANoun } from "@/utils/vrgdaUtils";
import { getOnchainAuctionHouseAuction } from "./getOnchainAuction";
import { isSepoliaNetwork } from "@/utils/networkDetection";
import { auctionFromMintedNoun, getOnchainNounById, getMinterMode, usesOnchainData } from "@/data/sepolia/onchain";

const NOUNDER_AUCTION_CUTOFF = BigInt(175300);
const NOUNSDAO_AUCTION_CUTOFF = BigInt(175301);
const VRGDA_AUCTION_CUTOFF = BigInt(FIRST_VRGDA_NOUN_ID); // Use the correct VRGDA cutoff

function auctionFromSubgraph(auction: any, params: { reservePrice: string; minBidIncrementPercentage: string }): Auction {
  const bids: Bid[] = auction.bids.map((bid: any) => ({
    transactionHash: bid.id as Hex,
    bidderAddress: getAddress(bid.bidder.id),
    amount: bid.amount,
    timestamp: bid.blockTimestamp,
    clientId: undefined,
  }));

  bids.sort((a, b) => (BigInt(b.amount) > BigInt(a.amount) ? 1 : -1));

  const highestBidAmount =
    auction.bids.length > 0 ? BigInt(bids[0].amount) : BigInt(0);
  const nextMinBid = bigIntMax(
    BigInt(params.reservePrice),
    highestBidAmount +
      (highestBidAmount * BigInt(params.minBidIncrementPercentage)) /
        BigInt(100),
  );

  const nowS = Date.now() / 1000;
  const ended = nowS > Number(auction.endTime);

  return {
    nounId: auction.noun.id,
    startTime: auction.startTime,
    endTime: auction.endTime,
    nextMinBid: nextMinBid.toString(),
    state: ended
      ? auction.settled
        ? "ended-settled"
        : "ended-unsettled"
      : "live",
    bids,
    nounderAuction: false,
    nounsdaoAuction: false,
    isVRGDAAuction: Boolean(auction.isVrgda),
  };
}

const query = graphql(/* GraphQL */ `
  query Auction($id: ID!) {
    auction(id: $id) {
      id
      noun {
        id
      }
      amount
      startTime
      endTime
      bidder {
        id
      }
      settled
      isVrgda
      bids {
        id
        bidder {
          id
        }
        amount
        blockTimestamp
      }
    }
  }
`);

async function getAuctionByIdUncached(
  id: BigIntString,
): Promise<Auction | undefined> {

  if (isSepoliaNetwork()) {
    if (!usesOnchainData() && CHAIN_CONFIG.subgraphUrl.primary) {
      try {
        const result = await graphQLFetchWithFallback(
          CHAIN_CONFIG.subgraphUrl,
          query,
          { id },
          { next: { revalidate: 0 } },
        );
        if (result?.auction) {
          const params = await getProtocolParams();
          return auctionFromSubgraph(result.auction, params);
        }
      } catch (error) {
        console.error("sepolia goldsky auction read failed, using contracts", error);
      }
    }
    const onchain = await getOnchainAuctionHouseAuction();
    if (onchain && onchain.nounId === id) return onchain;
    const noun = await getOnchainNounById(id);
    if (noun) {
      const mode = await getMinterMode();
      return auctionFromMintedNoun(id, mode === "vrgda");
    }
    return undefined;
  }

  const isNounderNoun = BigInt(id) % BigInt(10) == BigInt(0)
  const isNounsDAONoun = BigInt(id) % BigInt(10) == BigInt(1)
  const isVRGDANounId = isVRGDANoun(Number(id));

  // Create mock auctions for Nounder/NounsDAO nouns or any VRGDA noun
  if (
    (BigInt(id) <= NOUNDER_AUCTION_CUTOFF && isNounderNoun) ||
    (BigInt(id) <= NOUNSDAO_AUCTION_CUTOFF && isNounsDAONoun) ||
    isVRGDANounId
  ) {
    const nextNoun = await getAuctionByIdUncached(
      (BigInt(id) + BigInt(1)).toString(),
    );

    // isVRGDANoun already defined above
    
    const auction: Auction = {
      nounId: id,

      startTime: nextNoun?.startTime ?? "0",
      endTime: nextNoun?.startTime ?? "0",

      nextMinBid: "0",

      // VRGDA auctions are always "live" since they can be purchased anytime
      state: isVRGDANounId ? "live" : "ended-settled",

      bids: [],

      isVRGDAAuction: isVRGDANounId,
      nounderAuction: false,
      nounsdaoAuction: false
    };

    if (isNounderNoun) {
      auction.nounderAuction = true;
    } else {
      auction.nounderAuction = false;
    }

    if (isNounsDAONoun) {
      auction.nounsdaoAuction = true;
    } else {
      auction.nounsdaoAuction = false;
    }

    return auction;
  }

  try {
  const [result, params] = await Promise.all([
    graphQLFetchWithFallback(
      CHAIN_CONFIG.subgraphUrl,
      query,
      { id },
      { next: { revalidate: 0 } },
    ),
    getProtocolParams(),
  ]);

  const auction = result?.auction;
  if (!auction) {
    const onchain = await getOnchainAuctionHouseAuction();
    if (onchain && onchain.nounId === id) return onchain;
    console.error("getAuctionByIdUncached - no auction found", id);
    return undefined;
  }

  return auctionFromSubgraph(auction, params);
  } catch (error) {
    const onchain = await getOnchainAuctionHouseAuction();
    if (onchain && onchain.nounId === id) return onchain;
    console.error("getAuctionByIdUncached - no auction found", id, error);
    return undefined;
  }
}

const getAuctionByIdCached = unstable_cache(
  getAuctionByIdUncached,
  ["get-auction-by-id"],
  {
    tags: ["get-auction-by-id"],
  },
);

export async function getAuctionById(id: BigIntString) {
  const cachedAuction = await getAuctionByIdCached(id);

  if (cachedAuction?.state != "ended-settled") {
    revalidateTag("get-auction-by-id");
    return await getAuctionByIdCached(id);
  }

  return cachedAuction;
}
