import { Address, getAddress, zeroAddress } from "viem";
import { CHAIN_CONFIG } from "@/config";

export interface AddressOverride {
  name: string;
  avatar?: string;
}

/**
 * Address overrides for special addresses (contracts, treasury, etc.)
 * These take precedence over ENS resolution
 */
let ADDRESS_OVERRIDES: Record<string, AddressOverride> | null = null;

/**
 * Initialize address overrides from config
 * This is called lazily on first access
 */
function initializeAddressOverrides() {
  if (ADDRESS_OVERRIDES !== null) return;
  
  try {
    const treasury = getAddress(CHAIN_CONFIG.addresses.nounsTreasury);
    const auctionHouse = getAddress(CHAIN_CONFIG.addresses.lilVRGDAProxy);
    const nounsToken = getAddress(CHAIN_CONFIG.addresses.nounsToken);
    const lilNounsPayer = getAddress(CHAIN_CONFIG.addresses.lilNounsPayer);
    const nounsDaoPayer = getAddress(CHAIN_CONFIG.addresses.nounsDaoPayer);

    ADDRESS_OVERRIDES = {
      [treasury.toLowerCase()]: {
        name: "Lil Nouns Treasury",
        avatar: "/nouns-treasury.png",
      },
      [auctionHouse.toLowerCase()]: {
        name: "Nouns Auction House",
        avatar: "/auction-house.png",
      },
      [nounsToken.toLowerCase()]: {
        name: "Nouns NFT",
        avatar: "/nouns-treasury.png",
      },
      [lilNounsPayer.toLowerCase()]: {
        name: "Lil Nouns Payer",
        avatar: "/nouns-treasury.png",
      },
      [nounsDaoPayer.toLowerCase()]: {
        name: "Nouns DAO Payer",
        avatar: "/nouns-treasury.png",
      },
    };
    // Payer slots are zero on chains without a deployment
    delete ADDRESS_OVERRIDES[zeroAddress];
  } catch (error) {
    // If CHAIN_CONFIG is not available yet, initialize empty
    ADDRESS_OVERRIDES = {};
  }
}

/**
 * Get address override if it exists
 */
export function getAddressOverrides(address: Address): AddressOverride | undefined {
  if (typeof window === "undefined") return undefined;
  
  initializeAddressOverrides();
  return ADDRESS_OVERRIDES?.[address.toLowerCase()];
}

