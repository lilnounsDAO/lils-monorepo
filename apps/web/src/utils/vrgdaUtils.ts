import { isSepoliaNetwork } from "./networkDetection";
import { CHAIN_CONFIG } from "@/config";
import { isConfiguredAddress } from "@/data/auction/getOnchainAuction";
import { getCachedMinterMode } from "@/data/sepolia/onchain";

export const FIRST_VRGDA_NOUN_ID = 7983;
export const FIRST_VRGDA_NOUN_ID_SEPOLIA = 0;

export function hasLilVrgda(): boolean {
  return isConfiguredAddress(CHAIN_CONFIG.addresses.lilVRGDAProxy);
}

export function isSepoliaVrgdaMode(): boolean {
  if (!isSepoliaNetwork()) return false;
  const mode = getCachedMinterMode();
  if (mode) return mode === "vrgda";
  return hasLilVrgda();
}

export function isVRGDANoun(nounId: number): boolean {
  if (isSepoliaNetwork()) {
    // Sepolia sale UI is chosen from token.minter() (AH vs VRGDA), not noun id.
    return false;
  }

  return nounId >= FIRST_VRGDA_NOUN_ID;
}

export function isVRGDAAuction(auction: { isVrgda?: boolean }): boolean {
  return auction.isVrgda === true;
}

// Update founder detection for Lil Nouns (every 10th AND 11th)
export function isLilNounderNoun(nounId: number): boolean {
  return nounId % 10 === 0  // Every 10th 
}

export function isNounsDAONoun(nounId: number): boolean {
  // This might need adjustment based on Lil Nouns DAO reward schedule
  return nounId % 10 === 1; // Every 11th
}