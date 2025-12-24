/**
 * Contract Registry
 * Maps contract addresses to human-readable names and metadata
 * Supports both mainnet and sepolia
 */

import { Address, getAddress } from "viem";
import { mainnet, sepolia } from "viem/chains";
import { CHAIN_CONFIG } from "@/config";
import type { ChainSpecificData } from "@/config";

export interface ContractMetadata {
  name: string;
  description?: string;
  identifier: string;
}

/**
 * Contract metadata by identifier
 * Maps contract identifiers to human-readable names
 */
const CONTRACT_METADATA: Record<string, ContractMetadata> = {
  // Core DAO Contracts
  nounsToken: {
    name: "Nouns Token",
    description: "Nouns NFT contract",
    identifier: "nounsToken",
  },
  nounsTreasury: {
    name: "Treasury",
    description: "DAO Treasury (Timelock/Executor)",
    identifier: "nounsTreasury",
  },
  nounsDaoProxy: {
    name: "DAO Governor",
    description: "Governance contract",
    identifier: "nounsDaoProxy",
  },
  nounsDAODataProxy: {
    name: "DAO Data",
    description: "DAO Data contract",
    identifier: "nounsDAODataProxy",
  },
  nounsAuctionHouseProxy: {
    name: "Auction House",
    description: "Nouns auction contract",
    identifier: "nounsAuctionHouseProxy",
  },
  
  // Token Contracts
  wrappedNativeToken: {
    name: "WETH",
    description: "Wrapped Ether",
    identifier: "wrappedNativeToken",
  },
  usdc: {
    name: "USDC",
    description: "USD Coin",
    identifier: "usdc",
  },
  stEth: {
    name: "stETH",
    description: "Lido Staked Ether",
    identifier: "stEth",
  },
  
  // Other Contracts
  noundersMultisig: {
    name: "Nounders Multisig",
    description: "Nounders multisig wallet",
    identifier: "noundersMultisig",
  },
  nounsPayer: {
    name: "Nouns Payer",
    description: "Nouns Payer contract",
    identifier: "nounsPayer",
  },
  
  // Sepolia-specific contracts
  nounsDAOProxy: {
    name: "DAO Governor",
    description: "Governance contract (V2)",
    identifier: "nounsDAOProxy",
  },
  nounsDAOProxyV3: {
    name: "DAO Governor V3",
    description: "Governance contract (V6)",
    identifier: "nounsDAOProxyV3",
  },
  nounsDAOLogicV2: {
    name: "DAO Logic V2",
    description: "DAO logic implementation (V2)",
    identifier: "nounsDAOLogicV2",
  },
  nounsDAOLogicV6: {
    name: "DAO Logic V6",
    description: "DAO logic implementation (V6)",
    identifier: "nounsDAOLogicV6",
  },
  nounsDAODataLogic: {
    name: "DAO Data Logic",
    description: "DAO Data logic implementation",
    identifier: "nounsDAODataLogic",
  },
  nounsDAODataV2Logic: {
    name: "DAO Data Logic V2",
    description: "DAO Data logic implementation (V2)",
    identifier: "nounsDAODataV2Logic",
  },
  nounsSeeder: {
    name: "Nouns Seeder",
    description: "Nouns seeder contract",
    identifier: "nounsSeeder",
  },
  nounsDescriptor: {
    name: "Nouns Descriptor",
    description: "Nouns descriptor contract",
    identifier: "nounsDescriptor",
  },
  nftDescriptor: {
    name: "NFT Descriptor",
    description: "NFT descriptor contract",
    identifier: "nftDescriptor",
  },
  lilVRGDA: {
    name: "Lil VRGDA",
    description: "Lil Nouns VRGDA contract",
    identifier: "lilVRGDA",
  },
  lilVRGDAProxy: {
    name: "Lil VRGDA Proxy",
    description: "Lil Nouns VRGDA proxy",
    identifier: "lilVRGDAProxy",
  },
  nounsSeederV2: {
    name: "Nouns Seeder V2",
    description: "Nouns seeder contract (V2)",
    identifier: "nounsSeederV2",
  },
  
  // Additional identifiers that may exist in config but don't need special metadata
  // These will fall back to identifier-based naming if not in metadata
};

/**
 * Build reverse mapping: address -> identifier -> metadata
 * For each chain, create a map of lowercase address to identifier
 * Uses CHAIN_CONFIG which is dynamically selected based on hostname
 */
function buildAddressToIdentifierMap(config: ChainSpecificData): Map<string, string> {
  const map = new Map<string, string>();
  
  // Map all addresses to their identifiers
  Object.entries(config.addresses).forEach(([identifier, address]) => {
    if (address) {
      const normalizedAddress = getAddress(address).toLowerCase();
      map.set(normalizedAddress, identifier);
    }
  });
  
  return map;
}

// Cache the map for the current chain (CHAIN_CONFIG)
// This will be rebuilt if the chain changes, but that's rare
let cachedAddressToIdentifierMap: Map<string, string> | null = null;
let cachedChainId: number | null = null;

/**
 * Get the address-to-identifier map for a given chain
 * Uses CHAIN_CONFIG which is dynamically selected based on hostname
 */
function getAddressToIdentifierMap(chainId: number): Map<string, string> {
  // If we have a cached map for this chain, use it
  if (cachedAddressToIdentifierMap && cachedChainId === chainId) {
    return cachedAddressToIdentifierMap;
  }
  
  // Build map from CHAIN_CONFIG (which is already selected for the current chain)
  // Note: This assumes CHAIN_CONFIG matches the requested chainId
  // If they don't match, we'll still use CHAIN_CONFIG (which is the active chain)
  cachedAddressToIdentifierMap = buildAddressToIdentifierMap(CHAIN_CONFIG);
  cachedChainId = CHAIN_CONFIG.chain.id;
  
  return cachedAddressToIdentifierMap;
}

/**
 * Resolve a contract address to its metadata
 * @param address - Contract address (checksummed or lowercase)
 * @param chainId - Chain ID (defaults to current chain from CHAIN_CONFIG)
 * @returns Contract metadata if found, null otherwise
 */
export function resolveContractAddress(
  address: Address | string,
  chainId?: number
): ContractMetadata | null {
  // Use provided chainId or get from CHAIN_CONFIG
  const targetChainId = chainId ?? CHAIN_CONFIG.chain.id;
  
  // Normalize address
  const normalizedAddress = getAddress(address).toLowerCase();
  
  // Get identifier from address
  const addressMap = getAddressToIdentifierMap(targetChainId);
  const identifier = addressMap.get(normalizedAddress);
  
  if (!identifier) {
    return null;
  }
  
  // Get metadata from identifier
  const metadata = CONTRACT_METADATA[identifier];
  if (metadata) {
    return metadata;
  }
  
  // If no metadata exists, generate a friendly name from the identifier
  // Convert camelCase to Title Case (e.g., "nounsToken" -> "Nouns Token")
  const friendlyName = identifier
    .replace(/([A-Z])/g, " $1") // Add space before capital letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
  
  return {
    name: friendlyName,
    description: undefined,
    identifier,
  };
}

/**
 * Resolve a contract identifier to its address and metadata
 * @param identifier - Contract identifier (e.g., "nounsToken", "nounsTreasury")
 * @param chainId - Chain ID (defaults to current chain from CHAIN_CONFIG)
 * @returns Contract address and metadata if found, null otherwise
 */
export function resolveContractIdentifier(
  identifier: string,
  chainId?: number
): { address: Address; metadata: ContractMetadata } | null {
  // Use CHAIN_CONFIG which is dynamically selected based on hostname
  // Note: If chainId is provided and doesn't match CHAIN_CONFIG.chain.id,
  // we'll still use CHAIN_CONFIG (which represents the active chain)
  
  // Get address from identifier
  const address = CHAIN_CONFIG.addresses[identifier as keyof typeof CHAIN_CONFIG.addresses];
  if (!address) {
    return null;
  }
  
  // Get metadata from identifier
  const metadata = CONTRACT_METADATA[identifier];
  if (metadata) {
    return {
      address: getAddress(address),
      metadata,
    };
  }
  
  // If no metadata exists, generate a friendly name from the identifier
  const friendlyName = identifier
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
  
  return {
    address: getAddress(address),
    metadata: {
      name: friendlyName,
      description: undefined,
      identifier,
    },
  };
}

/**
 * Check if an address is a known contract
 */
export function isKnownContract(
  address: Address | string,
  chainId?: number
): boolean {
  return resolveContractAddress(address, chainId) !== null;
}

/**
 * Get contract name for display
 * Returns the friendly name if found, otherwise returns null
 */
export function getContractName(
  address: Address | string,
  chainId?: number
): string | null {
  const resolved = resolveContractAddress(address, chainId);
  return resolved?.name || null;
}

