import { CHAIN_SPECIFIC_CONFIGS } from "@/config";
import { lilVRGDAConfig } from "@/config/lilVRGDAConfig";
import { readContract } from "viem/actions";
import { detectChainFromHostname } from "@/utils/networkDetection";

export async function getCurrentVRGDAPrice(): Promise<bigint> {
  try {
    // Get the correct chain config dynamically
    const chainId = detectChainFromHostname();
    const config = CHAIN_SPECIFIC_CONFIGS[chainId];
    
    if (!config) {
      console.error('No chain config found for chain ID:', chainId);
      return BigInt(0);
    }
    
    const price = await readContract(config.publicClient, {
      address: config.addresses.lilVRGDAProxy,
      abi: lilVRGDAConfig.abi,
      functionName: "getCurrentVRGDAPrice",
    });
    return price;
  } catch (error) {
    console.error('Error fetching VRGDA price:', error);
    return BigInt(0);
  }
}