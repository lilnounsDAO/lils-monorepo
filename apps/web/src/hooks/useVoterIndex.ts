import { useQuery } from '@tanstack/react-query'
import { Address, getAddress, isAddress, parseAbi } from 'viem'
import { normalize } from 'viem/ens'
import { CHAIN_CONFIG } from '@/config'
import { getAddressOverrides } from '@/utils/addressOverrides'
import { getVoterIndex, VoterStats } from '@/data/goldsky/governance/getVoterIndex'

/**
 * Cache policy for the voter index.
 *
 * The index (every voter, delegate and holder, with names) is a few hundred KB
 * and takes ~6s to rebuild, so the last good copy lives in localStorage:
 * - It hydrates the query immediately, so the list and autocomplete work the
 *   moment the editor opens, even offline.
 * - Within FRESH_FOR it's used as is. After that it's still shown, and a
 *   rebuild runs in the background and swaps in when done.
 * - Votes only change while a proposal is voting and delegations rarely, so a
 *   few minutes stale is harmless; the one figure that must be exact for a
 *   specific person comes from `useAddressLookup`, which reads the chain.
 */
const CACHE_KEY = 'lilnouns:voter-index:v1'
const FRESH_FOR = 5 * 60 * 1000

interface CachedIndex {
  savedAt: number
  chainId: number
  recentProposalCount: number
  voters: VoterStats[]
}

function readCache(recentProposalCount: number): CachedIndex | undefined {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return undefined
    const cached = JSON.parse(raw) as CachedIndex
    if (
      cached.chainId !== CHAIN_CONFIG.chain.id ||
      cached.recentProposalCount !== recentProposalCount ||
      !Array.isArray(cached.voters)
    ) {
      return undefined
    }
    return cached
  } catch {
    return undefined
  }
}

function writeCache(recentProposalCount: number, voters: VoterStats[]) {
  try {
    const entry: CachedIndex = {
      savedAt: Date.now(),
      chainId: CHAIN_CONFIG.chain.id,
      recentProposalCount,
      voters,
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(entry))
  } catch {
    // Storage full or blocked: the index still works for this session
  }
}

export function useVoterIndex(recentProposalCount: number) {
  return useQuery({
    queryKey: ['voter-index', CHAIN_CONFIG.chain.id, recentProposalCount],
    queryFn: async () => {
      const voters = await getVoterIndex(recentProposalCount)
      writeCache(recentProposalCount, voters)
      return voters
    },
    initialData: () => readCache(recentProposalCount)?.voters,
    initialDataUpdatedAt: () => readCache(recentProposalCount)?.savedAt,
    staleTime: FRESH_FOR,
    gcTime: Infinity,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}

/** What a person is called in the UI: an override (treasury etc.), else their ENS name. */
export function displayName(voter: Pick<VoterStats, 'address' | 'ensName'>): string | null {
  return getAddressOverrides(voter.address)?.name ?? voter.ensName
}

/**
 * Rank of `voter` for what's been typed, lower is better, or null for no match.
 * Names win over addresses, and prefixes over anything found mid-string, so
 * "nou" puts nounish.eth above a.nouns.eth above an address containing "nou".
 */
export function matchRank(voter: VoterStats, query: string): number | null {
  const q = query.trim().toLowerCase()
  if (!q) return 0
  const name = displayName(voter)?.toLowerCase()
  if (name) {
    if (name.startsWith(q)) return 0
    if (name.split(/[.\-_\s]/).some((part) => part.startsWith(q))) return 1
    if (name.includes(q)) return 2
  }
  const address = voter.address.toLowerCase()
  const hex = q.startsWith('0x') ? q.slice(2) : q
  if (!hex || !/^[0-9a-f]+$/.test(hex)) return null
  if (address.slice(2).startsWith(hex)) return 3
  if (address.includes(hex)) return 4
  return null
}

/** True when the text is something to look up directly: a full address or an ENS name. */
export function isLookupQuery(query: string): boolean {
  const q = query.trim()
  return isAddress(q) || /^[^\s.]+(\.[^\s.]+)+$/.test(q)
}

const tokenAbi = parseAbi([
  'function getCurrentVotes(address account) view returns (uint96)',
  'function balanceOf(address owner) view returns (uint256)',
  'function delegates(address delegator) view returns (address)',
])

export interface LookupResult {
  address: Address
  ensName: string | null
  currentVotes: number
  tokenBalance: number
  /** Who their votes go to, when it isn't themselves */
  delegate: Address | null
}

/**
 * A pasted address or ENS name, checked against the token contract right now.
 * Resolves to null when it can't be resolved or holds no Lil Nouns and no
 * delegated votes, since such an address has nothing to bring to a vote.
 */
export function useAddressLookup(query: string) {
  const q = query.trim()
  return useQuery({
    queryKey: ['voter-lookup', CHAIN_CONFIG.chain.id, q.toLowerCase()],
    enabled: isLookupQuery(q),
    staleTime: 60 * 1000,
    retry: false,
    queryFn: async (): Promise<LookupResult | null> => {
      const client = CHAIN_CONFIG.publicClient
      let address: Address
      let ensName: string | null = null
      if (isAddress(q)) {
        address = getAddress(q)
      } else {
        let name: string
        try {
          name = normalize(q)
        } catch {
          return null
        }
        const resolved = await client.getEnsAddress({ name }).catch(() => null)
        if (!resolved) return null
        address = getAddress(resolved)
        ensName = name
      }

      const token = CHAIN_CONFIG.addresses.nounsToken
      const [votes, balance, delegate] = await Promise.all([
        client.readContract({ address: token, abi: tokenAbi, functionName: 'getCurrentVotes', args: [address] }),
        client.readContract({ address: token, abi: tokenAbi, functionName: 'balanceOf', args: [address] }),
        client.readContract({ address: token, abi: tokenAbi, functionName: 'delegates', args: [address] }),
      ])
      if (votes === 0n && balance === 0n) return null

      if (!ensName) ensName = await client.getEnsName({ address }).catch(() => null)
      const delegateAddress = getAddress(delegate)
      return {
        address,
        ensName,
        currentVotes: Number(votes),
        tokenBalance: Number(balance),
        delegate: balance > 0n && delegateAddress !== address ? delegateAddress : null,
      }
    },
  })
}
