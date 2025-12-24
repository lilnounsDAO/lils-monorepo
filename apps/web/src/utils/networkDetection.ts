import { mainnet, sepolia } from 'viem/chains';

/**
 * Detects the chain ID based on the current hostname
 *
 * Rules:
 * - sepolia.localhost:3000 or sepolia.lilnouns.wtf -> Sepolia (11155111)
 * - localhost:3000 or lilnouns.wtf -> Mainnet (1)
 *
 * Fallback: Uses VITE_CHAIN_ID env var or defaults to mainnet
 */
export function detectChainFromHostname(): number {
  // Only run in browser
  if (typeof window === 'undefined') {
    // SSR fallback - use env var or default to mainnet
    const envChainId = import.meta.env.VITE_CHAIN_ID;
    return envChainId ? Number(envChainId) : mainnet.id;
  }

  const hostname = window.location.hostname;

  // Check for sepolia subdomain
  if (hostname.startsWith('sepolia.')) {
    return sepolia.id;
  }

  // Check for explicit env override (useful for local development)
  const envChainId = import.meta.env.VITE_CHAIN_ID;
  if (envChainId) {
    return Number(envChainId);
  }

  // Default to mainnet
  return mainnet.id;
}

/**
 * Returns true if the current environment is running on Sepolia testnet
 */
export function isSepoliaNetwork(): boolean {
  return detectChainFromHostname() === sepolia.id;
}

/**
 * Returns true if the current environment is running on mainnet
 */
export function isMainnetNetwork(): boolean {
  return detectChainFromHostname() === mainnet.id;
}

/**
 * Returns the network name as a string for display purposes
 */
export function getNetworkName(): string {
  const chainId = detectChainFromHostname();
  switch (chainId) {
    case mainnet.id:
      return 'Mainnet';
    case sepolia.id:
      return 'Sepolia';
    default:
      return `Unknown (Chain ID: ${chainId})`;
  }
}
