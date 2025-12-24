import { CHAIN_CONFIG } from "@/config";
import { lilVRGDAConfig } from "@/config/lilVRGDAConfig";
import { readContract } from "viem/actions";

export interface AvailableNoun {
  id: string;
  blockNumber: number;
  image: string;
  price: string;
  svg: string;
}

/**
 * Fetches only the latest VRGDA nouns to prevent memory bloat
 * @param previousCount Number of previous block nouns to fetch (default: 3)
 * @returns Object containing next noun + specified number of previous nouns
 */
export async function getAvailableNouns(previousCount: number = 3): Promise<{
  nextNoun: AvailableNoun | null;
  previousNouns: AvailableNoun[];
}> {
  try {
    // Get next noun data
    const nextNounData = await readContract(CHAIN_CONFIG.publicClient, {
      ...lilVRGDAConfig,
      functionName: "fetchNextNoun",
    });
    
    const nextNoun: AvailableNoun = {
      id: nextNounData[0].toString(),
      blockNumber: Number(nextNounData[4]), // hash/blockNumber
      image: `data:image/svg+xml;base64,${btoa(nextNounData[2])}`, // svg
      price: nextNounData[3].toString(), // price
      svg: nextNounData[2], // raw svg
    };
    
    // Get previous nouns from pool
    const previousNouns: AvailableNoun[] = [];
    const currentBlock = await CHAIN_CONFIG.publicClient.getBlockNumber();
    
    for (let i = 1; i <= previousCount; i++) {
      try {
        const blockNumber = currentBlock - BigInt(i);
        const nounData = await readContract(CHAIN_CONFIG.publicClient, {
          ...lilVRGDAConfig,
          functionName: "fetchNoun",
          args: [blockNumber],
        });
        
        previousNouns.push({
          id: nounData[0].toString(),
          blockNumber: Number(blockNumber),
          image: `data:image/svg+xml;base64,${btoa(nounData[2])}`,
          price: nounData[3].toString(),
          svg: nounData[2],
        });
      } catch (error) {
        console.warn(`Failed to fetch noun for block ${currentBlock - BigInt(i)}:`, error);
      }
    }
    
    return { nextNoun, previousNouns };
  } catch (error) {
    console.error('Error fetching available nouns:', error);
    return { nextNoun: null, previousNouns: [] };
  }
}