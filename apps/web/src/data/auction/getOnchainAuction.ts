import { Address, zeroAddress } from "viem";
import { CHAIN_CONFIG } from "@/config";
import { Auction } from "./types";
import { BigIntString } from "@/utils/types";

const auctionHouseV1Abi = [
  {
    type: "function",
    name: "auction",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "nounId", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "startTime", type: "uint256" },
          { name: "endTime", type: "uint256" },
          { name: "bidder", type: "address" },
          { name: "settled", type: "bool" },
        ],
      },
    ],
  },
  {
    type: "function",
    name: "reservePrice",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "minBidIncrementPercentage",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
  },
] as const;

export function isConfiguredAddress(address?: Address): boolean {
  return !!address && address.toLowerCase() !== zeroAddress;
}

export async function getOnchainAuctionHouseAuction(): Promise<Auction | undefined> {
  const address = CHAIN_CONFIG.addresses.nounsAuctionHouseProxy;
  if (!isConfiguredAddress(address)) return undefined;

  try {
    const [auction, reservePrice, minBidIncrementPercentage] = await Promise.all([
      CHAIN_CONFIG.publicClient.readContract({
        address,
        abi: auctionHouseV1Abi,
        functionName: "auction",
      }),
      CHAIN_CONFIG.publicClient.readContract({
        address,
        abi: auctionHouseV1Abi,
        functionName: "reservePrice",
      }),
      CHAIN_CONFIG.publicClient.readContract({
        address,
        abi: auctionHouseV1Abi,
        functionName: "minBidIncrementPercentage",
      }),
    ]);

    if (auction.nounId === 0n && auction.startTime === 0n) return undefined;

    const highestBidAmount = auction.amount;
    const nextMinBid =
      highestBidAmount === 0n
        ? reservePrice
        : highestBidAmount + (highestBidAmount * BigInt(minBidIncrementPercentage)) / 100n;

    const nowS = Date.now() / 1000;
    const ended = nowS > Number(auction.endTime);

    return {
      nounId: auction.nounId.toString() as BigIntString,
      isVRGDAAuction: false,
      startTime: auction.startTime.toString() as BigIntString,
      endTime: auction.endTime.toString() as BigIntString,
      nextMinBid: nextMinBid.toString() as BigIntString,
      state: ended ? (auction.settled ? "ended-settled" : "ended-unsettled") : "live",
      bids:
        auction.amount > 0n && auction.bidder !== zeroAddress
          ? [
              {
                transactionHash: "0x",
                bidderAddress: auction.bidder,
                amount: auction.amount.toString() as BigIntString,
                timestamp: auction.startTime.toString() as BigIntString,
              },
            ]
          : [],
      nounderAuction: false,
      nounsdaoAuction: false,
    };
  } catch (error) {
    console.error("on-chain auction house read failed", error);
    return undefined;
  }
}
