import { useEffect, useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useEnsName } from 'wagmi'
import LoadingSkeletons from '@/components/LoadingSkeletons'
import SearchProvider, { SearchInput, useSearchContext } from '@/components/Search'
import { getAllVoters, VoterProfile } from '@/data/goldsky/governance/getAllVoters'
import { getNounsForAddress, getNounsDelegatedTo } from '@/data/ponder/nouns'
import { getNounSeedFromAddress } from '@/utils/nounSeedFromAddress'
import { buildNounImage } from '@/utils/nounImages/nounImage'
import { EnsName } from '@/components/EnsName'

interface VoterProfileWithTokens extends VoterProfile {
  tokensOwned: number
  tokensDelegated: number
  isLoadingTokens: boolean
}

function VoterCard({ voter }: { voter: VoterProfileWithTokens }) {
  const seed = getNounSeedFromAddress(voter.address as `0x${string}`)
  const fullNounImage = buildNounImage(
    {
      background: { seed: seed.background, name: '' },
      body: { seed: seed.body, name: '' },
      accessory: { seed: seed.accessory, name: '' },
      head: { seed: seed.head, name: '' },
      glasses: { seed: seed.glasses, name: '' },
    },
    'full'
  )

  const { data: ensName } = useEnsName({
    address: voter.address,
    chainId: 1,
  })

  const totalTokens = voter.tokensOwned + voter.tokensDelegated

  return (
    <Link
      to={`/profile/${voter.address}`}
      className="flex w-full items-center gap-4 rounded-[16px] border bg-white p-4 transition-colors hover:bg-background-ternary group"
    >
      <div className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden border-2 border-content-primary">
        <img 
          src={fullNounImage} 
          alt="Noun" 
          className="w-full h-full object-cover"
        />
      </div>
      
      <div className="flex flex-1 min-w-0 flex-col gap-2">
        <div className="flex items-center gap-2">
          {ensName ? (
            <EnsName address={voter.address} className="text-lg font-semibold text-content-primary" />
          ) : (
            <span className="text-lg font-semibold text-content-primary">
              {voter.address.slice(0, 6)}...{voter.address.slice(-4)}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-4 text-sm text-content-secondary">
          <div className="flex items-center gap-1">
            <span className="font-medium">{totalTokens}</span>
            <span>token{totalTokens !== 1 ? 's' : ''}</span>
          </div>
          <span>•</span>
          <div className="flex items-center gap-1">
            <span className="font-medium">{voter.proposalsVotedCount}</span>
            <span>proposal{voter.proposalsVotedCount !== 1 ? 's' : ''} voted</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

function FilteredVoters({ voters }: { voters: VoterProfileWithTokens[] }) {
  const { debouncedSearchValue } = useSearchContext()
  
  const filteredVoters = useMemo(() => {
    if (!debouncedSearchValue) return voters
    
    const searchLower = debouncedSearchValue.toLowerCase()
    return voters.filter((voter) => {
      const addressMatch = voter.address.toLowerCase().includes(searchLower)
      return addressMatch
    })
  }, [voters, debouncedSearchValue])
  
  if (filteredVoters.length === 0) {
    return (
      <div className="flex h-[85px] w-full items-center justify-center rounded-[16px] border bg-gray-100 p-4 text-center">
        {debouncedSearchValue 
          ? 'No voters matching the search filter'
          : 'No voters found'}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredVoters.map((voter) => (
        <VoterCard key={voter.address} voter={voter} />
      ))}
    </div>
  )
}

export default function ProfilesPage() {
  const { data: voters = [], isLoading: isLoadingVoters } = useQuery({
    queryKey: ['all-voters'],
    queryFn: () => getAllVoters(5000), // Get up to 5000 voters
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  // Fetch token counts for voters (in batches to avoid overwhelming the API)
  const [tokenCounts, setTokenCounts] = useState<Map<string, { owned: number; delegated: number }>>(new Map())

  useEffect(() => {
    // Fetch token counts for first 100 voters
    const votersToFetch = voters.slice(0, 100)
    
    const fetchTokenCounts = async () => {
      const counts = new Map<string, { owned: number; delegated: number }>()
      
      // Fetch in batches of 10 to avoid overwhelming the API
      const batchSize = 10
      for (let i = 0; i < votersToFetch.length; i += batchSize) {
        const batch = votersToFetch.slice(i, i + batchSize)
        
        await Promise.all(
          batch.map(async (voter) => {
            try {
              const [ownedResult, delegatedResult] = await Promise.all([
                getNounsForAddress(voter.address, 100, 0),
                getNounsDelegatedTo(voter.address, 100, 0),
              ])
              
              counts.set(voter.address.toLowerCase(), {
                owned: ownedResult.nouns.length,
                delegated: delegatedResult.nouns.length,
              })
            } catch (error) {
              console.error(`Failed to fetch tokens for ${voter.address}:`, error)
              counts.set(voter.address.toLowerCase(), {
                owned: 0,
                delegated: 0,
              })
            }
          })
        )
        
        // Update state after each batch to show progress
        setTokenCounts(new Map(counts))
      }
    }
    
    if (voters.length > 0) {
      fetchTokenCounts()
    }
  }, [voters])

  const votersWithTokenData: VoterProfileWithTokens[] = useMemo(() => {
    return voters.map(voter => {
      const counts = tokenCounts.get(voter.address.toLowerCase())
      return {
        ...voter,
        tokensOwned: counts?.owned ?? 0,
        tokensDelegated: counts?.delegated ?? 0,
        isLoadingTokens: !counts,
      }
    })
  }, [voters, tokenCounts])

  return (
    <>
      <Helmet>
        <title>Voters | Lil Nouns DAO</title>
        <meta name="description" content="Explore all voters in Lil Nouns DAO and see their voting activity and token holdings." />
        <link rel="canonical" href="https://www.lilnouns.wtf/profiles" />

        {/* OpenGraph */}
        <meta property="og:title" content="Voters | Lil Nouns DAO" />
        <meta property="og:description" content="Explore all voters in Lil Nouns DAO and see their voting activity and token holdings." />
      </Helmet>

      <SearchProvider>
        <div className="flex w-full max-w-[1400px] gap-12 p-6 pb-20 md:p-10 md:pb-20">
          {/* Main Content */}
          <div className="flex flex-1 flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div>
                <h1 className="heading-2">Voters</h1>
                <p className="text-content-secondary">
                  Explore all voters in Lil Nouns DAO. See their voting activity, token holdings, and profiles.
                </p>
              </div>
              
              <div className="flex w-full items-center justify-between gap-3">
                <SearchInput
                  placeholder="Search by address..."
                  className="max-w-[500px]"
                />
              </div>
            </div>
            
            {isLoadingVoters ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <LoadingSkeletons
                    key={i}
                    count={1}
                    className="h-[100px] w-full rounded-[16px]"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="heading-6">
                    {votersWithTokenData.length} Voter{votersWithTokenData.length !== 1 ? 's' : ''}
                  </h2>
                </div>
                <FilteredVoters voters={votersWithTokenData} />
              </div>
            )}
          </div>
        </div>
      </SearchProvider>
    </>
  )
}

