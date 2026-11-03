import { CHAIN_CONFIG } from "@/config";
import { isConfiguredAddress } from "@/data/auction/getOnchainAuction";
import { VrgdaPoolSeed, VrgdaPoolSeedsResult } from "@/data/ponder/vrgda/types";

const vrgdaAbi = [
  {
    type: "function",
    name: "nextNounId",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "poolSize",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "usedBlockNumbers",
    stateMutability: "view",
    inputs: [{ type: "uint256" }],
    outputs: [{ type: "bool" }],
  },
] as const;

const tokenAbi = [
  {
    type: "function",
    name: "seeder",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "descriptor",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
] as const;

const seederAbi = [
  {
    type: "function",
    name: "generateSeedForBlock",
    stateMutability: "view",
    inputs: [
      { type: "uint256" },
      { type: "address" },
      { type: "uint256" },
    ],
    outputs: [
      {
        type: "tuple",
        components: [
          { name: "background", type: "uint48" },
          { name: "body", type: "uint48" },
          { name: "accessory", type: "uint48" },
          { name: "head", type: "uint48" },
          { name: "glasses", type: "uint48" },
        ],
      },
    ],
  },
] as const;

const MAX_ONCHAIN_SEEDS = 64;

export async function getOnchainVrgdaPoolSeeds(limit = 48): Promise<VrgdaPoolSeedsResult> {
  const vrgda = CHAIN_CONFIG.addresses.lilVRGDAProxy;
  const token = CHAIN_CONFIG.addresses.nounsToken;
  if (!isConfiguredAddress(vrgda) || !isConfiguredAddress(token)) {
    return { seeds: [], hasMore: false, total: 0 };
  }

  const client = CHAIN_CONFIG.publicClient;
  const [nextNounId, poolSize, currentBlock, seeder, descriptor] = await Promise.all([
    client.readContract({ address: vrgda, abi: vrgdaAbi, functionName: "nextNounId" }),
    client.readContract({ address: vrgda, abi: vrgdaAbi, functionName: "poolSize" }),
    client.getBlockNumber(),
    client.readContract({ address: token, abi: tokenAbi, functionName: "seeder" }),
    client.readContract({ address: token, abi: tokenAbi, functionName: "descriptor" }),
  ]);

  const window = Math.min(Number(poolSize), Math.max(1, limit), MAX_ONCHAIN_SEEDS);
  const newest = currentBlock - 1n;
  if (newest === 0n) return { seeds: [], hasMore: false, total: 0 };

  const blocks: bigint[] = [];
  for (let i = 0; i < window; i++) {
    const block = newest - BigInt(i);
    if (block === 0n) break;
    blocks.push(block);
  }

  const used = await client.multicall({
    allowFailure: false,
    contracts: blocks.map((blockNumber) => ({
      address: vrgda,
      abi: vrgdaAbi,
      functionName: "usedBlockNumbers" as const,
      args: [blockNumber],
    })),
  });

  const unusedBlocks = blocks.filter((_, i) => used[i] !== true);
  const seedsRaw = unusedBlocks.length
    ? await client.multicall({
        allowFailure: true,
        contracts: unusedBlocks.map((blockNumber) => ({
          address: seeder,
          abi: seederAbi,
          functionName: "generateSeedForBlock" as const,
          args: [nextNounId, descriptor, blockNumber],
        })),
      })
    : [];

  const seeds: VrgdaPoolSeed[] = [];
  unusedBlocks.forEach((blockNumber, i) => {
    const result = seedsRaw[i];
    if (!result || result.status !== "success") return;
    const seed = result.result;
    seeds.push({
      id: blockNumber.toString(),
      nounId: nextNounId.toString(),
      blockNumber: blockNumber.toString(),
      background: Number(seed.background),
      body: Number(seed.body),
      accessory: Number(seed.accessory),
      head: Number(seed.head),
      glasses: Number(seed.glasses),
      isUsed: false,
      generatedAt: blockNumber.toString(),
    });
  });

  return {
    seeds,
    hasMore: Number(poolSize) > window,
    total: Number(poolSize),
  };
}
