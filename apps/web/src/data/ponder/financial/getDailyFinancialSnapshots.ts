
import { graphql } from "@/data/generated/ponder";
import { graphQLFetch } from "@/data/utils/graphQLFetch";
import { DailyFinancialSnapshotsQuery } from "@/data/generated/ponder/graphql";
import { CHAIN_CONFIG } from "@/config";
import { 
  shouldUseDummyFinancialData, 
  generateDummyFinancialSnapshots,
  logDummyDataWarning,
  type DummyDailyFinancialSnapshot
} from "@/data/utils/dummyFinancialData";

const query = graphql(/* GraphQL */ `
  query DailyFinancialSnapshots($cursor: String) {
    dailyFinancialSnapshots(
      limit: 1000
      orderBy: "timestamp"
      orderDirection: "asc"
      after: $cursor
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      items {
        timestamp

        treasuryBalanceInUsd
        treasuryBalanceInEth

        auctionRevenueInUsd
        auctionRevenueInEth

        propSpendInUsd
        propSpendInEth
      }
    }
  }
`);

async function runPaginatedQuery() {
  let cursor: string | undefined | null = undefined;
  let items: DailyFinancialSnapshotsQuery["dailyFinancialSnapshots"]["items"] =
    [];
  while (true) {
    const data: DailyFinancialSnapshotsQuery | null = await graphQLFetch(
      CHAIN_CONFIG.indexerUrl,
      query,
      { cursor },
      {
        next: { revalidate: 0 },
      },
    );
    if (!data) {
      break;
    }
    items = items.concat(data.dailyFinancialSnapshots.items);

    if (
      data.dailyFinancialSnapshots.pageInfo.hasNextPage &&
      data.dailyFinancialSnapshots.pageInfo.endCursor
    ) {
      cursor = data.dailyFinancialSnapshots.pageInfo.endCursor;
    } else {
      break;
    }
  }

  return items;
}

export async function getDailyFinancialSnapshots(): Promise<DailyFinancialSnapshotsQuery["dailyFinancialSnapshots"]["items"] | DummyDailyFinancialSnapshot[]> {
  // Use dummy data if indexer is not available
  if (shouldUseDummyFinancialData()) {
    logDummyDataWarning('financial snapshots');
    return generateDummyFinancialSnapshots(90); // Last 90 days
  }

  try {
    const data = await runPaginatedQuery();
    return data;
  } catch (error) {
    console.error('Failed to fetch financial snapshots from indexer, falling back to dummy data:', error);
    logDummyDataWarning('financial snapshots (fallback)');
    return generateDummyFinancialSnapshots(90);
  }
}
