import addresses from "@/addresses.json";

export type ContractNetwork = "1" | "11155111";

export interface CatalogEntry {
  key: string;
  name: string;
  note?: string | Partial<Record<ContractNetwork, string>>;
}

export interface CatalogGroup {
  title: string;
  entries: CatalogEntry[];
}

const ZERO = "0x0000000000000000000000000000000000000000";

export const CONTRACT_GROUPS: CatalogGroup[] = [
  {
    title: "Token & Art",
    entries: [
      { key: "nounsToken", name: "Lil Nouns Token", note: "ERC-721" },
      { key: "nounsSeeder", name: "Seeder" },
      { key: "nounsSeederV2", name: "Seeder V2" },
      { key: "nounsDescriptor", name: "Descriptor" },
      { key: "nftDescriptor", name: "NFT Descriptor library" },
      { key: "nounsArt", name: "Art" },
      { key: "inflator", name: "Inflator" },
      { key: "svgRenderer", name: "SVG Renderer" },
    ],
  },
  {
    title: "Auction",
    entries: [
      { key: "nounsAuctionHouseProxy", name: "Auction House Proxy", note: { "11155111": "Paused · historical" } },
      { key: "nounsAuctionHouse", name: "Auction House impl", note: { "11155111": "V2" } },
      { key: "nounsAuctionHouseV1", name: "Auction House V1 impl" },
      { key: "nounsAuctionHouseProxyAdmin", name: "Auction House Proxy Admin" },
    ],
  },
  {
    title: "Governor",
    entries: [
      { key: "nounsDAOProxy", name: "DAO Proxy", note: { "1": "Governor", "11155111": "Governor · V5" } },
      { key: "nounsDAOLogicV1", name: "DAO Logic V1" },
      { key: "nounsDAOLogicV2", name: "DAO Logic V2" },
      { key: "nounsDAOLogicV5", name: "DAO Logic V5", note: { "11155111": "Live implementation" } },
      { key: "nounsDAOExecutor", name: "Timelock / Executor" },
      { key: "nounsDaoExecutor", name: "Timelock / Executor" },
      { key: "nounsDAODataProxy", name: "DAO Data Proxy", note: { "11155111": "Candidates / topics" } },
      { key: "nounsDAODataLogic", name: "DAO Data logic" },
      { key: "nounsDAODataV2", name: "DAO Data V2" },
      { key: "nounsDAODataV2Logic", name: "DAO Data V2 logic" },
    ],
  },
  {
    title: "VRGDA",
    entries: [
      { key: "lilVRGDAProxy", name: "Lil VRGDA Proxy", note: { "11155111": "Live minter" } },
      { key: "lilVRGDA", name: "Lil VRGDA impl" },
    ],
  },
  {
    title: "Other",
    entries: [
      { key: "noundersMultisig", name: "Nounders / Deployer" },
      { key: "proxyRegistry", name: "Proxy Registry" },
      { key: "wrappedNativeToken", name: "WETH" },
      { key: "usdc", name: "USDC" },
      { key: "stEth", name: "stETH" },
      { key: "lilNounsPayer", name: "Payer" },
      { key: "lilNounsTokenBuyer", name: "Token Buyer" },
      { key: "nounsDaoPayer", name: "Nouns DAO Payer", note: "Nouns DAO's, not Lil Nouns'" },
      { key: "nounsDaoTokenBuyer", name: "Nouns DAO Token Buyer", note: "Nouns DAO's, not Lil Nouns'" },
    ],
  },
];

const NETWORK_META: Record<ContractNetwork, { label: string; explorer: string }> = {
  "1": { label: "Mainnet", explorer: "https://etherscan.io/address" },
  "11155111": { label: "Sepolia", explorer: "https://sepolia.etherscan.io/address" },
};

export function networkLabel(id: ContractNetwork) {
  return NETWORK_META[id].label;
}

export function explorerUrl(id: ContractNetwork, address: string) {
  return `${NETWORK_META[id].explorer}/${address}`;
}

export function isDeployed(address?: string) {
  return !!address && address.toLowerCase() !== ZERO.toLowerCase();
}

export function getCatalogAddress(network: ContractNetwork, key: string): string | undefined {
  const bag = (addresses as Record<string, Record<string, string>>)[network];
  if (!bag) return undefined;
  if (key === "nounsDAOExecutor" && !bag[key]) return bag.nounsDaoExecutor;
  if (key === "nounsDaoExecutor" && !bag[key]) return bag.nounsDAOExecutor;
  return bag[key];
}

