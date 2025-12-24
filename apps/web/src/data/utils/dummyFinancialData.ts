/**
 * Dummy financial data generator for development and dogfooding
 * Used when INDEXER_URL is not available or accessible
 */

export interface DummyDailyFinancialSnapshot {
  timestamp: string;
  treasuryBalanceInUsd: string;
  treasuryBalanceInEth: string;
  auctionRevenueInUsd: string;
  auctionRevenueInEth: string;
  propSpendInUsd: string;
  propSpendInEth: string;
}

export interface DummyTreasurySummary {
  treasuryBalanceInUsd: string;
  treasuryBalanceInEth: string;
  propSpendInUsd: string;
  propSpendInEth: string;
  totalRevenueInUsd: string;
  totalRevenueInEth: string;
}

/**
 * Generate realistic dummy financial snapshots for the last N days
 */
export function generateDummyFinancialSnapshots(days: number = 30): DummyDailyFinancialSnapshot[] {
  const snapshots: DummyDailyFinancialSnapshot[] = [];
  const now = Date.now();
  const oneDayMs = 24 * 60 * 60 * 1000;
  
  // Starting values (roughly realistic for a DAO treasury)
  let treasuryEth = 15000; // Starting treasury balance in ETH
  let treasuryUsd = treasuryEth * 2500; // ETH price around $2500
  let totalSpentUsd = 0;
  let totalSpentEth = 0;
  let totalRevenueUsd = 0;
  let totalRevenueEth = 0;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now - (i * oneDayMs));
    const timestamp = Math.floor(date.getTime() / 1000).toString();
    
    // Generate realistic daily auction revenue (1-3 ETH per day average)
    const dailyAuctionEth = Math.random() * 2 + 1; // 1-3 ETH
    const ethPrice = 2400 + (Math.random() - 0.5) * 200; // ETH price between $2300-$2700
    const dailyAuctionUsd = dailyAuctionEth * ethPrice;
    
    // Generate occasional proposal spending (some days 0, some days significant)
    let dailySpendEth = 0;
    let dailySpendUsd = 0;
    
    if (Math.random() < 0.15) { // 15% chance of spending on any given day
      dailySpendEth = Math.random() * 100 + 10; // 10-110 ETH spending
      dailySpendUsd = dailySpendEth * ethPrice;
    }
    
    // Update running totals
    treasuryEth += dailyAuctionEth - dailySpendEth;
    treasuryUsd = treasuryEth * ethPrice;
    totalSpentEth += dailySpendEth;
    totalSpentUsd += dailySpendUsd;
    totalRevenueEth += dailyAuctionEth;
    totalRevenueUsd += dailyAuctionUsd;
    
    snapshots.push({
      timestamp,
      treasuryBalanceInUsd: treasuryUsd.toFixed(2),
      treasuryBalanceInEth: treasuryEth.toFixed(4),
      auctionRevenueInUsd: dailyAuctionUsd.toFixed(2),
      auctionRevenueInEth: dailyAuctionEth.toFixed(4),
      propSpendInUsd: dailySpendUsd.toFixed(2),
      propSpendInEth: dailySpendEth.toFixed(4),
    });
  }
  
  return snapshots;
}

/**
 * Generate dummy treasury summary based on financial snapshots
 */
export function generateDummyTreasurySummary(): DummyTreasurySummary {
  const snapshots = generateDummyFinancialSnapshots(365); // Last year
  const latestSnapshot = snapshots[snapshots.length - 1];
  
  // Calculate totals from all snapshots
  const totalSpendUsd = snapshots.reduce((sum, snapshot) => 
    sum + parseFloat(snapshot.propSpendInUsd), 0);
  const totalSpendEth = snapshots.reduce((sum, snapshot) => 
    sum + parseFloat(snapshot.propSpendInEth), 0);
  const totalRevenueUsd = snapshots.reduce((sum, snapshot) => 
    sum + parseFloat(snapshot.auctionRevenueInUsd), 0);
  const totalRevenueEth = snapshots.reduce((sum, snapshot) => 
    sum + parseFloat(snapshot.auctionRevenueInEth), 0);
  
  return {
    treasuryBalanceInUsd: latestSnapshot.treasuryBalanceInUsd,
    treasuryBalanceInEth: latestSnapshot.treasuryBalanceInEth,
    propSpendInUsd: totalSpendUsd.toFixed(2),
    propSpendInEth: totalSpendEth.toFixed(4),
    totalRevenueInUsd: totalRevenueUsd.toFixed(2),
    totalRevenueInEth: totalRevenueEth.toFixed(4),
  };
}

/**
 * Generate dummy executed proposals count
 */
export function generateDummyExecutedProposalsCount(): number {
  // Simulate a DAO that has been running for a while with reasonable proposal activity
  return Math.floor(Math.random() * 50) + 100; // 100-150 executed proposals
}

/**
 * Check if we should use dummy data (when indexer is not available)
 */
export function shouldUseDummyFinancialData(): boolean {
  const indexerUrl =
    import.meta.env.VITE_INDEXER_URL ||
    // legacy fallback if defined in Node env
    (typeof process !== "undefined" ? process.env.INDEXER_URL : undefined);
  
  // Use dummy data if:
  // 1. No indexer URL is configured
  // 2. Indexer URL is set to demo/placeholder values
  // 3. Explicitly enabled for development
  return (
    !indexerUrl ||
    indexerUrl === "demo" ||
    indexerUrl.includes("demo") ||
    indexerUrl.includes("placeholder") ||
    indexerUrl === "https://indexer.nouns.wtf" || // Default placeholder
    import.meta.env.VITE_USE_DUMMY_FINANCIAL_DATA === "true"
  );
}

/**
 * Log dummy data usage warning
 */
export function logDummyDataWarning(dataType: string): void {
  if (process.env.NODE_ENV === 'development') {
    console.warn(`🚧 Using dummy ${dataType} data - INDEXER_URL not configured or accessible`);
  }
}