import { chainlinkPriceFeedAbi } from "@/abis/chainlinkPriceFeed";
import { mainnetPublicClient } from "@/config";
import { SECONDS_PER_DAY } from "@/utils/constants";
import { unstable_cache } from "@/utils/viteCache";
import { formatUnits, getAddress } from "viem";
import { readContract } from "viem/actions";

// Chainlink price feed addresses
const ETH_USD_PRICE_FEED_ADDRESS = getAddress(
  "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419",
);

const USDC_USD_PRICE_FEED_ADDRESS = getAddress(
  "0x8fFfFfd4AfB6115b954Bd326cbe7B4BA576818f6",
);

const PRICE_FEED_ANSWER_DECIMALS = 8;

async function getEthPriceUsdUncached() {
  const [, answer] = await readContract(mainnetPublicClient, {
    abi: chainlinkPriceFeedAbi,
    address: ETH_USD_PRICE_FEED_ADDRESS,
    functionName: "latestRoundData",
  });

  return Number(formatUnits(answer, PRICE_FEED_ANSWER_DECIMALS));
}

async function getUsdcPriceUsdUncached() {
  const [, answer] = await readContract(mainnetPublicClient, {
    abi: chainlinkPriceFeedAbi,
    address: USDC_USD_PRICE_FEED_ADDRESS,
    functionName: "latestRoundData",
  });

  return Number(formatUnits(answer, PRICE_FEED_ANSWER_DECIMALS));
}

export const getEthPriceUsd = unstable_cache(
  getEthPriceUsdUncached,
  ["get-eth-price-usd"],
  { revalidate: SECONDS_PER_DAY },
);

export const getUsdcPriceUsd = unstable_cache(
  getUsdcPriceUsdUncached,
  ["get-usdc-price-usd"],
  { revalidate: SECONDS_PER_DAY },
);

// Combined function to get all token prices
export const getTokenPrices = unstable_cache(
  async () => {
    const [ethPrice, usdcPrice] = await Promise.all([
      getEthPriceUsdUncached(),
      getUsdcPriceUsdUncached(),
    ]);

    return {
      eth: ethPrice,
      weth: ethPrice, // WETH tracks ETH price
      steth: ethPrice, // stETH tracks ETH price closely
      lido: ethPrice, // LIDO token tracks ETH price
      reth: ethPrice, // rETH (Rocket Pool) tracks ETH price closely
      oeth: ethPrice, // OETH (Origin ETH) tracks ETH price closely
      usdc: usdcPrice,
    };
  },
  ["get-token-prices"],
  { revalidate: SECONDS_PER_DAY },
);
