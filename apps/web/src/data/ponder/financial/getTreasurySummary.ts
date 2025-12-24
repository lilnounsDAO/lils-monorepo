import { unstable_cache } from "@/utils/viteCache";
import { graphQLFetch } from "@/data/utils/graphQLFetch";
import { CHAIN_CONFIG } from "@/config";
import { SECONDS_PER_DAY } from "@/utils/constants";
import {
  shouldUseDummyFinancialData,
  generateDummyTreasurySummary,
  logDummyDataWarning,
} from "@/data/utils/dummyFinancialData";

interface TreasurySummary {
  treasuryBalanceInUsd: number;
  treasuryBalanceInEth: number;

  auctionRevenueInUsd: number;
  auctionRevenueInEth: number;

  propSpendInUsd: number;
  propSpendInEth: number;
}

type TreasurySummaryQuery = {
  treasurySummary: {
    timestamp: string;
    treasuryBalanceInUsd: string;
    treasuryBalanceInEth: string;
    auctionRevenueInUsd: string;
    auctionRevenueInEth: string;
    propSpendInUsd: string;
    propSpendInEth: string;
  } | null;
};

const treasurySummaryDocument = {
  toString: () => `
    query TreasurySummary {
      treasurySummary {
        timestamp
        treasuryBalanceInUsd
        treasuryBalanceInEth
        auctionRevenueInUsd
        auctionRevenueInEth
        propSpendInUsd
        propSpendInEth
      }
    }
  `,
};

async function getTreasurySummaryUncached(): Promise<TreasurySummary> {
  // Use dummy data if indexer is not available
  if (shouldUseDummyFinancialData()) {
    logDummyDataWarning('treasury summary');
    const dummyData = generateDummyTreasurySummary();
    
    return {
      treasuryBalanceInEth: parseFloat(dummyData.treasuryBalanceInEth),
      treasuryBalanceInUsd: parseFloat(dummyData.treasuryBalanceInUsd),
      auctionRevenueInEth: parseFloat(dummyData.totalRevenueInEth),
      auctionRevenueInUsd: parseFloat(dummyData.totalRevenueInUsd),
      propSpendInEth: parseFloat(dummyData.propSpendInEth),
      propSpendInUsd: parseFloat(dummyData.propSpendInUsd),
    };
  }

  try {
    const data = await graphQLFetch<TreasurySummaryQuery, Record<string, never>>(
      CHAIN_CONFIG.indexerUrl,
      treasurySummaryDocument as any,
      undefined,
      { next: { revalidate: 0 } },
    );

    // Treasury summary returns null by design - use dummy data
    if (!data || !data.treasurySummary) {
      console.log('Treasury summary is null (expected) - using dummy data');
      logDummyDataWarning('treasury summary');
      const dummyData = generateDummyTreasurySummary();
      
      return {
        treasuryBalanceInEth: parseFloat(dummyData.treasuryBalanceInEth),
        treasuryBalanceInUsd: parseFloat(dummyData.treasuryBalanceInUsd),
        auctionRevenueInEth: parseFloat(dummyData.totalRevenueInEth),
        auctionRevenueInUsd: parseFloat(dummyData.totalRevenueInUsd),
        propSpendInEth: parseFloat(dummyData.propSpendInEth),
        propSpendInUsd: parseFloat(dummyData.propSpendInUsd),
      };
    }

    const summary = data.treasurySummary;

    return {
      treasuryBalanceInEth: parseFloat(summary.treasuryBalanceInEth),
      treasuryBalanceInUsd: parseFloat(summary.treasuryBalanceInUsd),
      auctionRevenueInEth: parseFloat(summary.auctionRevenueInEth),
      auctionRevenueInUsd: parseFloat(summary.auctionRevenueInUsd),
      propSpendInEth: parseFloat(summary.propSpendInEth),
      propSpendInUsd: parseFloat(summary.propSpendInUsd),
    };
  } catch (error) {
    console.error('Failed to fetch treasury summary, falling back to dummy data:', error);
    logDummyDataWarning('treasury summary (fallback)');
    const dummyData = generateDummyTreasurySummary();
    
    return {
      treasuryBalanceInEth: parseFloat(dummyData.treasuryBalanceInEth),
      treasuryBalanceInUsd: parseFloat(dummyData.treasuryBalanceInUsd),
      auctionRevenueInEth: parseFloat(dummyData.totalRevenueInEth),
      auctionRevenueInUsd: parseFloat(dummyData.totalRevenueInUsd),
      propSpendInEth: parseFloat(dummyData.propSpendInEth),
      propSpendInUsd: parseFloat(dummyData.propSpendInUsd),
    };
  }
}

export const getTreasurySummary = unstable_cache(
  getTreasurySummaryUncached,
  ["get-treasury-summary"],
  { revalidate: SECONDS_PER_DAY / 2 },
);
