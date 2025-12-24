import { CHAIN_CONFIG } from "@/config";

// ERC721 totalSupply function ABI
const TOTAL_SUPPLY_ABI = [
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

/**
 * Get the total number of minted nouns from the token contract
 */
export async function getTotalMintedNouns(): Promise<number> {
  try {
    console.log("🔢 Fetching total minted nouns from contract:", CHAIN_CONFIG.addresses.nounsToken);
    
    const result = await CHAIN_CONFIG.publicClient.readContract({
      address: CHAIN_CONFIG.addresses.nounsToken,
      abi: TOTAL_SUPPLY_ABI,
      functionName: "totalSupply",
    });

    const totalSupply = Number(result);
    console.log("✅ Total minted nouns:", totalSupply);
    
    return totalSupply;
  } catch (error) {
    console.error("❌ Error fetching total supply:", error);
    return 0;
  }
}
