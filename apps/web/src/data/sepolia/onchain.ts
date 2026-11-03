import { Address, zeroAddress } from "viem";
import { CHAIN_CONFIG } from "@/config";
import { isSepoliaNetwork } from "@/utils/networkDetection";
import { isConfiguredAddress } from "@/data/auction/getOnchainAuction";
import { transformVpsNounToNoun } from "@/data/noun/helpers";
import { Noun } from "@/data/noun/types";
import { Auction } from "@/data/auction/types";
import { BigIntString } from "@/utils/types";

export type MinterMode = "auction-house" | "vrgda";

const tokenAbi = [
  {
    type: "function",
    name: "minter",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "totalSupply",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "seeds",
    stateMutability: "view",
    inputs: [{ name: "", type: "uint256" }],
    outputs: [
      { name: "background", type: "uint48" },
      { name: "body", type: "uint48" },
      { name: "accessory", type: "uint48" },
      { name: "head", type: "uint48" },
      { name: "glasses", type: "uint48" },
    ],
  },
] as const;

let minterModeCache: { mode: MinterMode; at: number } | null = null;
let nounsCache: { nouns: Noun[]; at: number } | null = null;
const CACHE_MS = 15_000;

export function usesOnchainData(): boolean {
  // Rehearsal has no VPS indexer. Goldsky is for auctions/votes, not noun images.
  return isSepoliaNetwork() && !CHAIN_CONFIG.indexerUrl;
}

export function getCachedMinterMode(): MinterMode | null {
  if (!minterModeCache) return null;
  if (Date.now() - minterModeCache.at > CACHE_MS) return null;
  return minterModeCache.mode;
}

export function rememberMinterMode(mode: MinterMode) {
  minterModeCache = { mode, at: Date.now() };
}

export async function getMinterMode(): Promise<MinterMode> {
  if (!isSepoliaNetwork()) {
    const mode: MinterMode = isConfiguredAddress(CHAIN_CONFIG.addresses.lilVRGDAProxy)
      ? "vrgda"
      : "auction-house";
    rememberMinterMode(mode);
    return mode;
  }

  const cached = getCachedMinterMode();
  if (cached) return cached;

  const token = CHAIN_CONFIG.addresses.nounsToken;
  const vrgda = CHAIN_CONFIG.addresses.lilVRGDAProxy;
  const auctionHouse = CHAIN_CONFIG.addresses.nounsAuctionHouseProxy;

  try {
    const minter = await CHAIN_CONFIG.publicClient.readContract({
      address: token,
      abi: tokenAbi,
      functionName: "minter",
    });

    const mode: MinterMode =
      isConfiguredAddress(vrgda) && minter.toLowerCase() === vrgda.toLowerCase()
        ? "vrgda"
        : minter.toLowerCase() === auctionHouse.toLowerCase() || !isConfiguredAddress(vrgda)
          ? "auction-house"
          : "auction-house";

    rememberMinterMode(mode);
    return mode;
  } catch (error) {
    console.error("minter mode read failed", error);
    const fallback: MinterMode = isConfiguredAddress(vrgda) ? "vrgda" : "auction-house";
    rememberMinterMode(fallback);
    return fallback;
  }
}

function seedNumbers(seed: {
  background?: bigint | number;
  body?: bigint | number;
  accessory?: bigint | number;
  head?: bigint | number;
  glasses?: bigint | number;
} | readonly (bigint | number)[]) {
  const named = seed as {
    background?: bigint | number;
    body?: bigint | number;
    accessory?: bigint | number;
    head?: bigint | number;
    glasses?: bigint | number;
  };
  const tuple = seed as readonly (bigint | number)[];
  return {
    background: Number(named.background ?? tuple[0] ?? 0),
    body: Number(named.body ?? tuple[1] ?? 0),
    accessory: Number(named.accessory ?? tuple[2] ?? 0),
    head: Number(named.head ?? tuple[3] ?? 0),
    glasses: Number(named.glasses ?? tuple[4] ?? 0),
  };
}

function toNoun(id: string, owner: Address, seed: {
  background?: bigint | number;
  body?: bigint | number;
  accessory?: bigint | number;
  head?: bigint | number;
  glasses?: bigint | number;
} | readonly (bigint | number)[]): Noun {
  return {
    ...transformVpsNounToNoun({
      id,
      owner,
      ...seedNumbers(seed),
    }),
    secondaryListing: null,
  };
}

export async function getOnchainTotalSupply(): Promise<number> {
  const supply = await CHAIN_CONFIG.publicClient.readContract({
    address: CHAIN_CONFIG.addresses.nounsToken,
    abi: tokenAbi,
    functionName: "totalSupply",
  });
  return Number(supply);
}

export async function getOnchainNounById(id: string): Promise<Noun | undefined> {
  const token = CHAIN_CONFIG.addresses.nounsToken;
  const tokenId = BigInt(id);

  try {
    const [seed, owner] = await Promise.all([
      CHAIN_CONFIG.publicClient.readContract({
        address: token,
        abi: tokenAbi,
        functionName: "seeds",
        args: [tokenId],
      }),
      CHAIN_CONFIG.publicClient.readContract({
        address: token,
        abi: tokenAbi,
        functionName: "ownerOf",
        args: [tokenId],
      }),
    ]);

    if (!owner || owner === zeroAddress) return undefined;
    return toNoun(id, owner, seed);
  } catch (error) {
    console.error("on-chain noun read failed", id, error);
    return undefined;
  }
}

export async function getOnchainNouns(): Promise<Noun[]> {
  if (nounsCache && Date.now() - nounsCache.at < CACHE_MS) {
    return nounsCache.nouns;
  }

  const token = CHAIN_CONFIG.addresses.nounsToken;
  const supply = await getOnchainTotalSupply();
  if (supply === 0) {
    nounsCache = { nouns: [], at: Date.now() };
    return [];
  }

  const ids = Array.from({ length: supply }, (_, i) => BigInt(i));
  const contracts = ids.flatMap((tokenId) => [
    { address: token, abi: tokenAbi, functionName: "seeds" as const, args: [tokenId] },
    { address: token, abi: tokenAbi, functionName: "ownerOf" as const, args: [tokenId] },
  ]);

  const results = await CHAIN_CONFIG.publicClient.multicall({ contracts, allowFailure: true });
  const nouns: Noun[] = [];

  for (let i = 0; i < supply; i++) {
    const seedResult = results[i * 2];
    const ownerResult = results[i * 2 + 1];
    if (seedResult.status !== "success" || ownerResult.status !== "success") continue;
    nouns.push(toNoun(i.toString(), ownerResult.result as Address, seedResult.result as {
      background: bigint;
      body: bigint;
      accessory: bigint;
      head: bigint;
      glasses: bigint;
    }));
  }

  nouns.sort((a, b) => (BigInt(b.id) > BigInt(a.id) ? 1 : -1));
  nounsCache = { nouns, at: Date.now() };
  return nouns;
}

export async function getOnchainNounsByIds(ids: string[]): Promise<Noun[]> {
  const all = await getOnchainNouns();
  const wanted = new Set(ids);
  return all.filter((noun) => wanted.has(noun.id));
}

export async function getOnchainNounsForAddress(owner: Address): Promise<Noun[]> {
  const all = await getOnchainNouns();
  return all.filter((noun) => noun.owner.toLowerCase() === owner.toLowerCase());
}

export async function getLatestOnchainNounId(): Promise<BigIntString | undefined> {
  const supply = await getOnchainTotalSupply();
  if (supply === 0) return undefined;
  return (supply - 1).toString() as BigIntString;
}

export function auctionFromMintedNoun(id: string, isVRGDAAuction = false): Auction {
  const nounId = BigInt(id);
  return {
    nounId: id as BigIntString,
    isVRGDAAuction,
    startTime: "0" as BigIntString,
    endTime: "0" as BigIntString,
    nextMinBid: "0" as BigIntString,
    state: "ended-settled",
    bids: [],
    nounderAuction: nounId % 10n === 0n,
    nounsdaoAuction: nounId % 10n === 1n,
  };
}
