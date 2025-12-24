import { CHAIN_SPECIFIC_CONFIGS } from "@/config";
import { lilVRGDAConfig } from "@/config/lilVRGDAConfig";
import { readContract } from "viem/actions";
import { detectChainFromHostname } from "@/utils/networkDetection";
import { mainnet, sepolia } from "viem/chains";

export interface VRGDAConfig {
  reservePrice: bigint;
  targetPrice: bigint; 
  updateInterval: number;
  poolSize: number;
  nextNounId: number;
}

export async function getVRGDAConfig(): Promise<VRGDAConfig | null> {
  try {
    // Get the correct chain config dynamically
    const chainId = detectChainFromHostname();
    const config = CHAIN_SPECIFIC_CONFIGS[chainId];
    
    if (!config) {
      console.error('No chain config found for chain ID:', chainId);
      return null;
    }
    
    console.log('getVRGDAConfig - Using config:', {
      chainId,
      chainName: config.chain.name,
      contractAddress: config.addresses.lilVRGDAProxy,
      rpcUrl: config.rpcUrl.primary
    });
    
    const [reservePrice, updateInterval, poolSize, nextNounId] = await Promise.all([
      readContract(config.publicClient, {
        address: config.addresses.lilVRGDAProxy,
        abi: lilVRGDAConfig.abi,
        functionName: "reservePrice",
      }),
      readContract(config.publicClient, {
        address: config.addresses.lilVRGDAProxy,
        abi: lilVRGDAConfig.abi,
        functionName: "updateInterval",
      }),
      readContract(config.publicClient, {
        address: config.addresses.lilVRGDAProxy,
        abi: lilVRGDAConfig.abi,
        functionName: "poolSize",
      }),
      readContract(config.publicClient, {
        address: config.addresses.lilVRGDAProxy,
        abi: lilVRGDAConfig.abi,
        functionName: "nextNounId",
      }),
    ]);
    
    return {
      reservePrice,
      targetPrice: reservePrice * BigInt(2), // Estimate, could be adjusted
      updateInterval: Number(updateInterval),
      poolSize: Number(poolSize),
      nextNounId: Number(nextNounId),
    };
  } catch (error) {
    console.error('Error fetching VRGDA config:', error);
    return null;
  }
}