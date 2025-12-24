"use client";
import { useState, useEffect } from 'react';
import { getTokenPrices } from '@/data/tokens/getTokenPrices';

interface TokenPrices {
  eth: number;
  weth: number;
  steth: number;
  lido: number;
  reth: number;
  oeth: number;
  usdc: number;
}

export function useTokenPrices() {
  const [prices, setPrices] = useState<TokenPrices | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrices() {
      try {
        setIsLoading(true);
        setError(null);
        const tokenPrices = await getTokenPrices();
        setPrices(tokenPrices);
      } catch (err) {
        console.error('Error fetching token prices:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch prices');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrices();
    
    // Refresh prices every 5 minutes
    const interval = setInterval(fetchPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  return { prices, isLoading, error };
}

// Helper function to format USD conversion
export function formatUsdConversion(
  amount: string,
  currency: string,
  prices: TokenPrices | null
): string | null {
  if (!amount || !prices || !currency) return null;
  
  const numAmount = parseFloat(amount);
  if (isNaN(numAmount) || numAmount <= 0) return null;

  const price = prices[currency as keyof TokenPrices];
  if (!price) return null;

  const usdValue = numAmount * price;
  
  // Format based on currency type
  if (currency === 'usdc') {
    // For USDC, show ETH equivalent
    const ethPrice = prices.eth;
    const ethValue = usdValue / ethPrice;
    return `≈ ${ethValue.toFixed(4)} ETH`;
  } else {
    // For ETH/WETH/stETH/LIDO/rETH/OETH, show USD equivalent
    return `≈ $${usdValue.toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }
}
