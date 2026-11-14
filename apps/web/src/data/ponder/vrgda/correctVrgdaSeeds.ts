import { Address, parseAbi } from "viem";
import { multicall } from "viem/actions";
import { CHAIN_CONFIG } from "@/config";
import { VrgdaPoolSeed } from "./types";

const vrgdaAbi = parseAbi([
  "function nextNounIdForCaller() view returns (uint256)",
  "function nounsSeeder() view returns (address)",
  "function nounsDescriptor() view returns (address)",
]);

const seederAbi = parseAbi([
  "function generateSeedForBlock(uint256 nounId, address descriptor, uint256 blockNumber) view returns ((uint48 background, uint48 body, uint48 accessory, uint48 head, uint48 glasses))",
]);

/**
 * The indexer's pool seeds, with traits as the auction will actually mint them.
 *
 * A seed picks each trait modulo the descriptor's count for it, and the indexer
 * computes seeds with the counts it was built against. Prop 395 moved the
 * auction and token to a descriptor with one more head and accessory, so every
 * indexed seed showed the wrong head and accessory — the pool previewed nouns
 * no one could buy. These come from the seeder the auction itself calls, for
 * the noun id it will mint next, in a single multicall, so they match
 * `fetchNoun` whatever the descriptor or counter does next.
 *
 * Falls back to the indexer's seeds if the chain can't be reached.
 */
export async function correctVrgdaSeeds<T extends VrgdaPoolSeed>(seeds: T[]): Promise<T[]> {
  if (seeds.length === 0) return seeds;
  const client = CHAIN_CONFIG.publicClient;
  const vrgda = CHAIN_CONFIG.addresses.lilVRGDAProxy as Address;
  try {
    const [nounId, seeder, descriptor] = await multicall(client, {
      contracts: [
        { address: vrgda, abi: vrgdaAbi, functionName: "nextNounIdForCaller" },
        { address: vrgda, abi: vrgdaAbi, functionName: "nounsSeeder" },
        { address: vrgda, abi: vrgdaAbi, functionName: "nounsDescriptor" },
      ],
      allowFailure: false,
    });
    const onChain = await multicall(client, {
      contracts: seeds.map((seed) => ({
        address: seeder,
        abi: seederAbi,
        functionName: "generateSeedForBlock" as const,
        args: [nounId, descriptor, BigInt(seed.blockNumber)] as const,
      })),
    });
    return seeds.map((seed, i) => {
      const result = onChain[i];
      if (result.status !== "success") return seed;
      const { background, body, accessory, head, glasses } = result.result;
      return {
        ...seed,
        nounId: nounId.toString(),
        background,
        body,
        accessory,
        head,
        glasses,
      };
    });
  } catch (error) {
    console.warn("Couldn't correct VRGDA pool seeds from chain, showing indexer seeds:", error);
    return seeds;
  }
}
