import { CHAIN_CONFIG } from "@/config";
import { multicall } from "viem/actions";
import { nounsAuctionHouseConfig, nounsDaoLogicConfig } from "../generated/wagmi";
import { unstable_cache } from "@/utils/viteCache";
import { SECONDS_PER_DAY } from "@/utils/constants";
import { BigIntString } from "@/utils/types";

interface ProtocolParams {
  reservePrice: BigIntString;
  minBidIncrementPercentage: number;
  proposalThreshold: BigIntString;
}

async function getProtocolParamsUncached(): Promise<ProtocolParams> {
  const [reservePrice, minBidIncrementPercentage, proposalThreshold] = await multicall(CHAIN_CONFIG.publicClient, {
    contracts: [
      { address: CHAIN_CONFIG.addresses.nounsAuctionHouseProxy, abi: nounsAuctionHouseConfig.abi, functionName: "reservePrice" },
      { address: CHAIN_CONFIG.addresses.nounsAuctionHouseProxy, abi: nounsAuctionHouseConfig.abi, functionName: "minBidIncrementPercentage" },
      { address: CHAIN_CONFIG.addresses.nounsDaoProxy, abi: nounsDaoLogicConfig.abi, functionName: "proposalThreshold" },
    ],
    allowFailure: false,
  });

  return {
    reservePrice: reservePrice.toString(),
    minBidIncrementPercentage,
    proposalThreshold: proposalThreshold.toString(),
  };
}

export const getProtocolParams = unstable_cache(
  getProtocolParamsUncached,
  ["get-protocol-params", CHAIN_CONFIG.chain.id.toString()],
  {
    revalidate: SECONDS_PER_DAY,
  }
);
