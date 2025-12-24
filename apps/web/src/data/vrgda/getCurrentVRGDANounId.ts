import { readContract } from "viem/actions";
import { CHAIN_SPECIFIC_CONFIGS } from "@/config";
import { lilVRGDAConfig } from "@/config/lilVRGDAConfig";
import { BigIntString } from "@/utils/types";
import { detectChainFromHostname } from "@/utils/networkDetection";
import { mainnet, sepolia } from "viem/chains";

export async function getCurrentVRGDANounId(): Promise<BigIntString> {
  try {
    // Get the correct chain config dynamically
    const chainId = detectChainFromHostname();
    const config = CHAIN_SPECIFIC_CONFIGS[chainId];
    
    if (!config) {
      console.error('No chain config found for chainId:', chainId);
      // Chain-specific fallback
      return chainId === sepolia.id ? "1" : "7983";
    }
    
    const nextNounId = await readContract(config.publicClient, {
      address: config.addresses.lilVRGDAProxy,
      abi: lilVRGDAConfig.abi,
      functionName: "nextNounId",
    });
    return nextNounId.toString();
  } catch (error) {
    console.error('Error fetching current VRGDA noun ID:', error);
    // Chain-specific fallback
    const chainId = detectChainFromHostname();
    return chainId === sepolia.id ? "1" : "7983";
  }
}