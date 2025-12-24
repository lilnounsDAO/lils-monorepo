import { detectChainFromHostname } from "./networkDetection";
import { sepolia } from "viem/chains";

export const FIRST_VRGDA_NOUN_ID = 7983;
export const FIRST_VRGDA_NOUN_ID_SEPOLIA = 0; // On Sepolia, VRGDA starts at noun 1

export function isVRGDANoun(nounId: number): boolean {
  // On Sepolia, all nouns are VRGDA nouns (starting from 1)
  // On Mainnet, VRGDA starts at 7983
  const chainId = detectChainFromHostname();
  const isSepolia = chainId === sepolia.id;
  
  if (isSepolia) {
    return nounId >= FIRST_VRGDA_NOUN_ID_SEPOLIA;
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