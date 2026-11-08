/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ALCHEMY_API_KEY: string
  readonly VITE_INFURA_API_KEY: string
  readonly VITE_DECENTRALIZED_SUBGRAPH_API_KEY: string
  readonly VITE_INDEXER_URL: string
  readonly VITE_DIGEST_API_URL?: string
  /** Rounds service (services/rounds-api); rounds are hidden when unset. */
  readonly VITE_ROUNDS_API_URL?: string
  /** Goldsky URL for the Sepolia carbon-copy rehearsal subgraph. Empty = read contracts. */
  readonly VITE_SEPOLIA_SUBGRAPH_URL?: string
  readonly VITE_CHAIN_ID: string
  readonly VITE_URL: string
  readonly VITE_CMS_URL: string
  readonly VITE_WALLETCONNECT_PROJECT_ID: string
  readonly VITE_WHISK_API_KEY: string
  /** Optional JSON-RPC proxy URL (e.g. Cloudflare Worker) so Goldsky secret stays off the client; omit to use Alchemy → Infura only. */
  readonly VITE_RPC_PROXY_URL?: string
  readonly VITE_SAVED_PROPOSALS_URL?: string
  // Tenderly Configuration
  readonly VITE_TENDERLY_ACCESS_KEY?: string
  readonly VITE_TENDERLY_USERNAME?: string
  readonly VITE_TENDERLY_PROJECT?: string
  // Discord Configuration
  // Note: DISCORD_BOT_TOKEN should be set as a server-side env var (not VITE_ prefix)
  readonly VITE_DISCORD_GUILD_ID?: string
  // Add other env variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}