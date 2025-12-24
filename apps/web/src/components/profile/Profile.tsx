"use client";
import { useEffect, useState, useMemo } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useAccount, useEnsName } from 'wagmi'
import { getAddress, isAddress } from 'viem'
import LoadingSkeletons from '@/components/LoadingSkeletons'
import SearchProvider, { SearchInput, useSearchContext } from '@/components/Search'
import { ProposalOverview } from '@/data/goldsky/governance/common'
import { ProposalIdea } from '@/data/goldsky/governance/ideaTypes'
import { Topic } from '@/data/goldsky/governance/getTopics'
import { getProposalsForAddress, getCandidatesForAddress, getTopicsForAddress, getSponsoredProposalsForAddress } from '@/data/goldsky/governance/getUserProposals'
import { isDaoVersion5 } from '@/utils/daoVersion'
import { useCollection } from '@/hooks/useDrafts'
import { Draft } from '@/types/proposal-editor'
import { makeUrlId } from '@/data/goldsky/governance/getProposalIdeas'
import { makeTopicUrlId } from '@/data/goldsky/governance/getTopics'
import { getNounSeedFromAddress } from '@/utils/nounSeedFromAddress'
import { buildNounTraitImage, buildNounImage } from '@/utils/nounImages/nounImage'
import { NounTraitType } from '@/data/noun/types'
import { formatTimeLeft } from '@/utils/format'
import { truncate } from 'lodash'
import clsx from 'clsx'
import { Plus, FileText, MessageSquare, Users, Sparkles, UserCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import CreateTypeDialog from '@/components/CreateTypeDialog'
import { ProposalStateBadge } from '@/components/Proposal/ProposalStateBadge'
import Icon from '@/components/ui/Icon'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { EnsName } from '@/components/EnsName'
import { EnsAvatar } from '@/components/EnsAvatar'
import { getNounsForAddress, getNounsDelegatedTo } from '@/data/ponder/nouns'
import { transformPonderNounToNoun } from '@/data/noun/helpers'
import { Noun } from '@/data/noun/types'
import DelegationDialog from '@/components/dialog/DelegationDialog'
import { NounImage } from '@/components/NounImage'
import NounExplorer from '@/components/NounExplorer'
import { FilterEngineProvider } from '@/contexts/FilterEngineContext'
import { useNounFilters } from '@/hooks/useNounFilters'
import { useEnsAddress, useEnsResolver } from 'wagmi'
import WalletButton from '@/components/WalletButton'
import UserTokensExplorer from '@/components/UserTokensExplorer'

interface ProfileProps {
  address?: string
}

type UnifiedItem = 
  | { type: 'proposal'; data: ProposalOverview }
  | { type: 'candidate'; data: ProposalIdea }
  | { type: 'topic'; data: Topic }
  | { type: 'draft'; data: Draft }

function UnifiedItemCard({ item, address }: { item: UnifiedItem; address: string }) {
  const seed = getNounSeedFromAddress(address as `0x${string}`)
  const traitTypes: NounTraitType[] = ['head', 'glasses', 'body', 'accessory', 'background']
  const randomTrait = traitTypes[parseInt(address.slice(-1), 16) % traitTypes.length]
  const traitImage = buildNounTraitImage(randomTrait, seed[randomTrait])
  
  if (item.type === 'proposal') {
    const proposal = item.data
    const nowTimestamp = Math.floor(Date.now() / 1000)
    const endTimeDelta = Math.max(proposal.votingEndTimestamp - nowTimestamp, 0)
    const timeToVotingEndFormatted = formatTimeLeft(endTimeDelta, true)
    
    const voteUrl = `/vote/${proposal.id}`
    
    return (
      <Link
        to={voteUrl}
        className="flex w-full justify-between rounded-[16px] border p-4 transition-colors hover:bg-background-ternary group"
      >
        <div className="flex w-full items-center gap-6">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center self-start rounded-[8px] label-md md:self-auto overflow-hidden">
            <img 
              src={traitImage} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <span className="relative z-10 text-content-primary font-bold">
              {proposal.id}
            </span>
          </div>
          <div className="flex h-full w-full min-w-0 flex-col justify-between gap-3">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-content-tertiary shrink-0 mt-0.5" />
              <div className="overflow-hidden label-lg md:text-ellipsis md:whitespace-nowrap">
                {truncate(proposal.title, { length: 65 })}
              </div>
            </div>
            <div className="flex flex-col justify-between gap-3 text-content-secondary label-sm md:flex-row">
              <div className="flex items-center gap-3">
                <span>For: {proposal.forVotes}</span>
                <span>Against: {proposal.againstVotes}</span>
                <span>Abstain: {proposal.abstainVotes}</span>
              </div>
              <div className="flex items-center gap-1">
                {(proposal.state === 'active' || proposal.state === 'pending') && (
                  <>
                    <Icon icon="clock" size={16} className="fill-content-secondary" />
                    <span>{timeToVotingEndFormatted} left</span>
                  </>
                )}
                <span className="hidden md:block">•</span>
                <ProposalStateBadge state={proposal.state} />
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }
  
  if (item.type === 'candidate') {
    const candidate = item.data
    const candidateUrl = `/candidates/${makeUrlId(candidate.id)}`
    
    return (
      <Link
        to={candidateUrl}
        className="flex w-full justify-between rounded-[16px] border p-4 transition-colors hover:bg-background-ternary group"
      >
        <div className="flex w-full items-center gap-6">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center self-start rounded-[8px] label-md md:self-auto overflow-hidden">
            <img 
              src={traitImage} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <Sparkles className="relative z-10 w-6 h-6 text-semantic-accent" />
          </div>
          <div className="flex h-full w-full min-w-0 flex-col justify-between gap-3">
            <div className="flex items-start gap-2">
              <Users className="w-4 h-4 text-content-tertiary shrink-0 mt-0.5" />
              <div className="overflow-hidden label-lg md:text-ellipsis md:whitespace-nowrap">
                {truncate(candidate.latestVersion.content.title, { length: 65 })}
              </div>
            </div>
            <div className="flex flex-col justify-between gap-3 text-content-secondary label-sm md:flex-row">
              <span className="text-xs">Candidate</span>
              <div className="flex items-center gap-1">
                <span className="text-xs">
                  {candidate.canceledTimestamp ? 'Canceled' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }
  
  if (item.type === 'topic') {
    const topic = item.data
    const topicUrl = `/topics/${makeTopicUrlId(topic.id)}`
    const replyCount = topic.feedback.length
    
    return (
      <Link
        to={topicUrl}
        className="flex w-full justify-between rounded-[16px] border p-4 transition-colors hover:bg-background-ternary group"
      >
        <div className="flex w-full items-center gap-6">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center self-start rounded-[8px] label-md md:self-auto overflow-hidden">
            <img 
              src={traitImage} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-20"
            />
            <MessageSquare className="relative z-10 w-6 h-6 text-semantic-accent" />
          </div>
          <div className="flex h-full w-full min-w-0 flex-col justify-between gap-3">
            <div className="flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-content-tertiary shrink-0 mt-0.5" />
              <div className="overflow-hidden label-lg md:text-ellipsis md:whitespace-nowrap">
                {truncate(topic.title, { length: 65 })}
              </div>
            </div>
            <div className="flex flex-col justify-between gap-3 text-content-secondary label-sm md:flex-row">
              <span className="text-xs">
                {replyCount} {replyCount === 1 ? 'reply' : 'replies'}
              </span>
              <div className="flex items-center gap-1">
                <span className="text-xs">
                  {topic.canceled ? 'Canceled' : 'Active'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }
  
  if (item.type === 'draft') {
    const draft = item.data
    const draftName = draft.name || 'Untitled Draft'
    const draftType = draft.actions === null ? 'topic' : 'proposal'
    const draftUrl = draftType === 'topic' 
      ? `/create/topic?draft=${draft.id}`
      : `/create?draft=${draft.id}`
    
    return (
      <Link
        to={draftUrl}
        className="flex w-full justify-between rounded-[16px] border-2 border-dashed border-content-tertiary p-4 transition-colors hover:bg-background-ternary group"
      >
        <div className="flex w-full items-center gap-6">
          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center self-start rounded-[8px] label-md md:self-auto overflow-hidden bg-background-secondary">
            <img 
              src={traitImage} 
              alt="" 
              className="absolute inset-0 w-full h-full object-cover opacity-10"
            />
            <FileText className="relative z-10 w-6 h-6 text-content-tertiary" />
          </div>
          <div className="flex h-full w-full min-w-0 flex-col justify-between gap-3">
            <div className="flex items-start gap-2">
              <FileText className="w-4 h-4 text-content-tertiary shrink-0 mt-0.5" />
              <div className="overflow-hidden label-lg md:text-ellipsis md:whitespace-nowrap">
                {truncate(draftName, { length: 65 })}
              </div>
            </div>
            <div className="flex flex-col justify-between gap-3 text-content-secondary label-sm md:flex-row">
              <span className="text-xs">Draft • {draftType === 'topic' ? 'Topic' : 'Proposal'}</span>
              <div className="flex items-center gap-1">
                <span className="text-xs">
                  {draft.updatedAt ? new Date(draft.updatedAt).toLocaleDateString() : 'Recently'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    )
  }
  
  return null
}

function FilteredUnifiedItems({ items, address, isOwnProfile }: { items: UnifiedItem[]; address: string; isOwnProfile: boolean }) {
  const { debouncedSearchValue } = useSearchContext()
  
  const filteredItems = useMemo(() => {
    if (!debouncedSearchValue) return items
    
    const searchLower = debouncedSearchValue.toLowerCase()
    return items.filter((item) => {
      if (item.type === 'proposal') {
        return (
          item.data.title.toLowerCase().includes(searchLower) ||
          item.data.proposerAddress.toLowerCase().includes(searchLower)
        )
      }
      if (item.type === 'candidate') {
        return (
          item.data.latestVersion.content.title.toLowerCase().includes(searchLower) ||
          item.data.proposerAddress.toLowerCase().includes(searchLower)
        )
      }
      if (item.type === 'topic') {
        return (
          item.data.title.toLowerCase().includes(searchLower) ||
          item.data.creator.toLowerCase().includes(searchLower)
        )
      }
      if (item.type === 'draft') {
        const draftName = item.data.name || 'Untitled Draft'
        return draftName.toLowerCase().includes(searchLower)
      }
      return false
    })
  }, [items, debouncedSearchValue])
  
  // Check if we have drafts in the items to determine message
  const hasDrafts = items.some(item => item.type === 'draft')
  
  if (filteredItems.length === 0) {
    return (
      <div className="flex h-[85px] w-full items-center justify-center rounded-[16px] border bg-gray-100 p-4 text-center">
        {debouncedSearchValue 
          ? 'No items matching the search filter'
          : hasDrafts && isOwnProfile
            ? 'No proposals, topics, candidates, or drafts found'
            : 'No proposals, topics, or candidates found'}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {filteredItems.map((item, index) => (
        <UnifiedItemCard key={`${item.type}-${index}`} item={item} address={address} />
      ))}
    </div>
  )
}

function TokensCard({ 
  address, 
  ownedNouns, 
  delegatedNouns, 
  isLoading 
}: { 
  address: string
  ownedNouns: Noun[]
  delegatedNouns: Noun[]
  isLoading: boolean
}) {
  const totalOwned = ownedNouns.length
  const totalDelegated = delegatedNouns.length
  
  // Get one featured noun (first owned, or first delegated if no owned)
  const featuredNoun = ownedNouns[0] || delegatedNouns[0]

  return (
    <div className="rounded-[16px] border bg-white p-6">
      <h3 className="heading-6 mb-4">Tokens</h3>
      {isLoading ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-12 h-12 rounded bg-gray-100 shrink-0" />
              <div className="flex-1">
                <div className="h-4 bg-gray-100 rounded mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {featuredNoun && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
              <NounImage nounId={featuredNoun.id} className="w-12 h-12 rounded" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-content-primary">
                  Noun #{featuredNoun.id}
                </p>
                <p className="text-xs text-content-secondary">
                  {ownedNouns.some(n => n.id === featuredNoun.id) ? 'Owned' : 'Delegated to you'}
                </p>
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex flex-col">
              <span className="text-content-secondary">Owned</span>
              <span className="text-lg font-bold text-content-primary">{totalOwned}</span>
            </div>
            <div className="flex flex-col text-right">
              <span className="text-content-secondary">Delegated</span>
              <span className="text-lg font-bold text-content-primary">{totalDelegated}</span>
            </div>
          </div>
          
          {(totalOwned > 0 || totalDelegated > 0) && (
            <Link
              to={`/profile/${address}?owner=${address}`}
              className="text-sm text-semantic-accent hover:text-semantic-accent-dark transition-colors"
            >
              View all tokens →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}

function DelegationButton({ 
  profileAddress, 
  connectedAddress 
}: { 
  profileAddress: string
  connectedAddress?: string
}) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [prefillAddress, setPrefillAddress] = useState<string | null>(null)
  
  // If viewing someone else's profile and wallet is connected, prefill their address
  useEffect(() => {
    if (connectedAddress && connectedAddress.toLowerCase() !== profileAddress.toLowerCase()) {
      setPrefillAddress(profileAddress)
    } else {
      setPrefillAddress(null)
    }
  }, [connectedAddress, profileAddress])
  
  if (!connectedAddress) {
    return (
      <div className="rounded-[16px] border bg-white p-6">
        <h3 className="heading-6 mb-4">Delegate</h3>
        <p className="text-sm text-content-secondary mb-4">
          Connect your wallet to delegate voting power
        </p>
        <ConnectButton.Custom>
          {({ openConnectModal }) => (
            <Button onClick={openConnectModal} variant="primary" className="w-full">
              Connect Wallet
            </Button>
          )}
        </ConnectButton.Custom>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-[16px] border bg-white p-6">
        <h3 className="heading-6 mb-4">Delegate</h3>
        <p className="text-sm text-content-secondary mb-4">
          {connectedAddress.toLowerCase() === profileAddress.toLowerCase()
            ? 'Delegate your voting power to another address'
            : `Delegate your voting power to ${profileAddress.slice(0, 6)}...${profileAddress.slice(-4)}`}
        </p>
        <Button
          onClick={() => setIsDialogOpen(true)}
          variant="primary"
          className="w-full"
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Manage Delegation
        </Button>
      </div>
      <DelegationDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen}
        prefillAddress={prefillAddress || undefined}
      />
    </>
  )
}

export function Profile({ address: addressProp }: ProfileProps) {
  const { address: connectedAddress } = useAccount()
  const params = useParams()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { items: drafts } = useCollection()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [daoType, setDaoType] = useState<'lilnouns' | 'nouns'>('lilnouns')
  
  const handleCloseTokensView = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('owner')
    setSearchParams(params, { replace: true })
  }
  
  // Resolve ENS name from URL param to address
  const addressParam = addressProp || params.address
  const isEnsName = addressParam && !isAddress(addressParam)
  
  const { data: resolvedEnsAddress, isLoading: isLoadingEns } = useEnsAddress({
    name: isEnsName ? addressParam : undefined,
    chainId: 1,
    query: { enabled: !!isEnsName },
  })
  
  // Redirect to address URL if ENS was resolved
  useEffect(() => {
    if (resolvedEnsAddress && params.address && isEnsName) {
      const newParams = new URLSearchParams(searchParams.toString())
      const newUrl = `/profile/${resolvedEnsAddress}${newParams.toString() ? `?${newParams.toString()}` : ''}`
      navigate(newUrl, { replace: true })
    }
  }, [resolvedEnsAddress, params.address, isEnsName, navigate, searchParams])
  
  // Resolve address from prop, params, or connected wallet
  const resolvedAddress = useMemo(() => {
    if (addressProp) {
      // If it's an ENS name, wait for resolution
      if (isEnsName && !resolvedEnsAddress) {
        return null
      }
      try {
        return getAddress(resolvedEnsAddress || addressProp)
      } catch {
        return resolvedEnsAddress || addressProp
      }
    }
    if (params.address) {
      // If it's an ENS name, wait for resolution
      if (isEnsName && !resolvedEnsAddress) {
        return null
      }
      try {
        return getAddress(resolvedEnsAddress || params.address)
      } catch {
        return resolvedEnsAddress || params.address
      }
    }
    return connectedAddress || null
  }, [addressProp, params.address, connectedAddress, resolvedEnsAddress, isEnsName])
  
  // Redirect /profile to /profile/[address] if connected
  useEffect(() => {
    if (!params.address && connectedAddress && !addressProp) {
      navigate(`/profile/${connectedAddress}`, { replace: true })
    }
  }, [params.address, connectedAddress, navigate, addressProp])
  
  // Check if owner query param is present (for tokens view)
  const ownerParam = searchParams.get('owner')
  const showTokensView = !!ownerParam
  
  // Resolve owner address (could be ENS or address)
  // If owner param matches resolvedAddress, use resolvedAddress (already validated)
  // Otherwise, resolve the owner param
  const { data: ownerAddress } = useEnsAddress({
    name: ownerParam && !isAddress(ownerParam) && ownerParam !== resolvedAddress ? ownerParam : undefined,
    chainId: 1,
    query: { enabled: !!ownerParam && !isAddress(ownerParam) && ownerParam !== resolvedAddress },
  })
  
  const resolvedOwnerAddress = useMemo(() => {
    if (!ownerParam) return null
    
    // If owner param matches the profile address, use resolvedAddress (already validated)
    if (resolvedAddress && ownerParam.toLowerCase() === resolvedAddress.toLowerCase()) {
      return resolvedAddress
    }
    
    // Otherwise, resolve the owner param
    if (isAddress(ownerParam)) {
      try {
        return getAddress(ownerParam)
      } catch {
        return ownerParam
      }
    }
    return ownerAddress || null
  }, [ownerParam, ownerAddress, resolvedAddress])
  
  // Resolve ENS name if address is provided
  const { data: ensName } = useEnsName({
    address: resolvedAddress as `0x${string}` | undefined,
    chainId: 1,
    query: { enabled: !!resolvedAddress && isAddress(resolvedAddress) },
  })
  
  // Fetch nouns owned and delegated
  const { data: ownedNounsData, isLoading: isLoadingOwned } = useQuery({
    queryKey: ['nouns-owned', resolvedAddress],
    queryFn: async () => {
      if (!resolvedAddress) return { nouns: [], hasMore: false }
      const result = await getNounsForAddress(resolvedAddress, 100, 0)
      return {
        nouns: result.nouns.map(transformPonderNounToNoun),
        hasMore: result.hasMore
      }
    },
    enabled: !!resolvedAddress,
  })
  
  const { data: delegatedNounsData, isLoading: isLoadingDelegated } = useQuery({
    queryKey: ['nouns-delegated', resolvedAddress],
    queryFn: async () => {
      if (!resolvedAddress) return { nouns: [], hasMore: false }
      const result = await getNounsDelegatedTo(resolvedAddress, 100, 0)
      return {
        nouns: result.nouns.map(transformPonderNounToNoun),
        hasMore: result.hasMore
      }
    },
    enabled: !!resolvedAddress,
  })
  
  const ownedNouns = ownedNounsData?.nouns || []
  const delegatedNouns = delegatedNounsData?.nouns || []
  const isLoadingNouns = isLoadingOwned || isLoadingDelegated
  const totalOwned = ownedNouns.length
  const totalDelegated = delegatedNouns.length
  
  // Fetch all user-related content
  const { data: proposals = [], isLoading: isLoadingProposals } = useQuery({
    queryKey: ['user-proposals', resolvedAddress, daoType],
    queryFn: () => resolvedAddress ? getProposalsForAddress(resolvedAddress as `0x${string}`, daoType) : [],
    enabled: !!resolvedAddress,
  })
  
  const isVersion5 = isDaoVersion5()
  
  const { data: candidates = [], isLoading: isLoadingCandidates } = useQuery({
    queryKey: ['user-candidates', resolvedAddress],
    queryFn: () => resolvedAddress ? getCandidatesForAddress(resolvedAddress as `0x${string}`) : [],
    enabled: !!resolvedAddress && isVersion5, // Only fetch if DAO version is 5
  })
  
  const { data: topics = [], isLoading: isLoadingTopics } = useQuery({
    queryKey: ['user-topics', resolvedAddress],
    queryFn: () => resolvedAddress ? getTopicsForAddress(resolvedAddress as `0x${string}`) : [],
    enabled: !!resolvedAddress && isVersion5, // Only fetch if DAO version is 5
  })
  
  const { data: sponsored = { proposals: [], candidates: [] }, isLoading: isLoadingSponsored } = useQuery({
    queryKey: ['user-sponsored', resolvedAddress, daoType],
    queryFn: () => resolvedAddress ? getSponsoredProposalsForAddress(resolvedAddress as `0x${string}`, daoType) : { proposals: [], candidates: [] },
    enabled: !!resolvedAddress && isVersion5, // Only fetch if DAO version is 5
  })
  
  const isLoading = isLoadingProposals || isLoadingCandidates || isLoadingTopics || isLoadingSponsored
  
  // Combine all items into unified list
  const unifiedItems = useMemo<UnifiedItem[]>(() => {
    const items: UnifiedItem[] = []
    
    // Add proposals
    proposals.forEach(proposal => {
      items.push({ type: 'proposal', data: proposal })
    })
    
    // Add candidates
    candidates.forEach(candidate => {
      items.push({ type: 'candidate', data: candidate })
    })
    
    // Add sponsored candidates (avoid duplicates)
    const candidateIds = new Set(candidates.map(c => c.id))
    sponsored.candidates.forEach(candidate => {
      if (!candidateIds.has(candidate.id)) {
        items.push({ type: 'candidate', data: candidate })
      }
    })
    
    // Add topics
    topics.forEach(topic => {
      items.push({ type: 'topic', data: topic })
    })
    
    // Add drafts only if viewing own profile
    if (connectedAddress && resolvedAddress && connectedAddress.toLowerCase() === resolvedAddress.toLowerCase()) {
      drafts.forEach(draft => {
        items.push({ type: 'draft', data: draft })
      })
    }
    
    // Sort by creation/update time (most recent first)
    return items.sort((a, b) => {
      const getTimestamp = (item: UnifiedItem): number => {
        if (item.type === 'proposal') return item.data.votingStartTimestamp
        if (item.type === 'candidate') return item.data.createdTimestamp
        if (item.type === 'topic') return item.data.createdTimestamp
        if (item.type === 'draft') return item.data.updatedAt || item.data.createdAt || 0
        return 0
      }
      return getTimestamp(b) - getTimestamp(a)
    })
  }, [proposals, candidates, sponsored.candidates, topics, drafts, connectedAddress, resolvedAddress])
  
  // Categorize items
  const { activeItems, draftItems, pastItems } = useMemo(() => {
    const active: UnifiedItem[] = []
    const drafts: UnifiedItem[] = []
    const past: UnifiedItem[] = []
    
    unifiedItems.forEach(item => {
      if (item.type === 'draft') {
        drafts.push(item)
      } else if (item.type === 'proposal') {
        const state = item.data.state
        if (state === 'active' || state === 'pending' || state === 'updatable') {
          active.push(item)
        } else {
          past.push(item)
        }
      } else if (item.type === 'candidate') {
        if (item.data.canceledTimestamp) {
          past.push(item)
        } else {
          active.push(item)
        }
      } else if (item.type === 'topic') {
        if (item.data.canceled) {
          past.push(item)
        } else {
          active.push(item)
        }
      }
    })
    
    return {
      activeItems: active,
      draftItems: drafts,
      pastItems: past,
    }
  }, [unifiedItems])
  
  // Show loading state while resolving ENS
  if (isLoadingEns && isEnsName) {
    return (
      <>
        <Helmet>
          <title>Profile | Lil Nouns DAO</title>
        </Helmet>
        <div className="flex w-full flex-col items-center justify-center gap-6 rounded-3xl border-4 px-4 py-24 text-center">
          <h4 className="text-content-primary">
            Resolving ENS name...
          </h4>
        </div>
      </>
    )
  }
  
  if (!resolvedAddress) {
    return (
      <>
        <Helmet>
          <title>Profile | Lil Nouns DAO</title>
        </Helmet>
        <div className="flex w-full flex-col items-center justify-center gap-6 rounded-3xl border-4 px-4 py-24 text-center">
          <h4 className="text-content-primary">
            {isEnsName ? 'ENS name not found or invalid' : 'Connect your wallet to view your profile'}
          </h4>
          {!isEnsName && <WalletButton />}
        </div>
      </>
    )
  }
  
  const seed = getNounSeedFromAddress(resolvedAddress as `0x${string}`)
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
  
  const isOwnProfile = connectedAddress?.toLowerCase() === resolvedAddress.toLowerCase()
  const displayName = ensName || resolvedAddress.slice(0, 6) + '...' + resolvedAddress.slice(-4)
  
  return (
    <>
      <Helmet>
        <title>{isOwnProfile ? 'My' : displayName + "'s"} Profile | Lil Nouns DAO</title>
        <meta name="description" content={`View all proposals, topics, candidates${isOwnProfile ? ', and drafts' : ''} for ${displayName} on Lil Nouns DAO.`} />
      </Helmet>
      
      <SearchProvider>
        <div className="flex w-full max-w-[1400px] gap-12 p-6 pb-20 md:p-10 md:pb-20">
          {/* Main Content */}
          <div className="flex flex-1 flex-col gap-8">
            <div className="flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-16 shrink-0 rounded-full overflow-hidden border-2 border-content-primary">
                  <img 
                    src={fullNounImage} 
                    alt="Noun" 
                    className="w-full h-full object-cover"
                  />
        </div>
                <div>
                  <h1 className="heading-2">
                    {isOwnProfile ? 'My Profile' : <EnsName address={resolvedAddress as `0x${string}`} />}
                  </h1>
                  <p className="text-content-secondary">
                    {isOwnProfile 
                      ? 'All proposals, topics, candidates, and drafts created or sponsored by your wallet'
                      : `All proposals, topics, and candidates created or sponsored by this wallet`}
                  </p>
                </div>
              </div>
              
              {/* DAO Selection Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDaoType('lilnouns')}
                  className={clsx(
                    "rounded-full px-6 py-2 text-sm font-medium transition-all",
                    daoType === 'lilnouns'
                      ? "border-2 border-blue-500 bg-white text-content-primary font-bold"
                      : "border border-gray-300 bg-white text-content-secondary"
                  )}
                >
                  Lil Nouns DAO
                </button>
                <button
                  onClick={() => setDaoType('nouns')}
                  className={clsx(
                    "rounded-full px-6 py-2 text-sm font-medium transition-all",
                    daoType === 'nouns'
                      ? "border-2 border-blue-500 bg-white text-content-primary font-bold"
                      : "border border-gray-300 bg-white text-content-secondary"
                  )}
                >
                  Nouns DAO
                </button>
              </div>
              
              <div className="flex w-full items-center justify-between gap-3">
                <SearchInput
                  placeholder={isOwnProfile 
                    ? "Search proposals, topics, candidates, drafts..."
                    : "Search proposals, topics, candidates..."}
                  className="max-w-[500px]"
                />
                {isOwnProfile && (
                  <Button
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create
                  </Button>
                )}
              </div>
            </div>
            
            {showTokensView && resolvedOwnerAddress ? (
              // Show tokens explorer when owner param is present
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="heading-6">Tokens</h2>
                  <Button
                    variant="ghost"
                    onClick={handleCloseTokensView}
                    className="flex items-center gap-2 px-4 py-2 text-sm"
                  >
                    <X className="w-4 h-4" />
                    <span>Close</span>
                  </Button>
                </div>
                <FilterEngineProvider>
                  <UserTokensExplorer
                    address={resolvedOwnerAddress as `0x${string}`}
                    showDelegated={totalDelegated > 0}
                  />
                </FilterEngineProvider>
              </div>
            ) : isLoading ? (
              <div className="flex flex-col gap-14">
                <div className="flex flex-col gap-4">
                  <h2 className="heading-6">Active</h2>
                  <LoadingSkeletons
                    count={3}
                    className="h-[85px] w-full rounded-[16px]"
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <h2 className="heading-6">Drafts</h2>
                  <LoadingSkeletons
                    count={2}
                    className="h-[85px] w-full rounded-[16px]"
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <h2 className="heading-6">Past</h2>
                  <LoadingSkeletons
                    count={5}
                    className="h-[85px] w-full rounded-[16px]"
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-14">
                {activeItems.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <h2 className="heading-6">Active</h2>
                    <FilteredUnifiedItems items={activeItems} address={resolvedAddress} isOwnProfile={isOwnProfile} />
                  </div>
                )}
                
                {draftItems.length > 0 && isOwnProfile && (
                  <div className="flex flex-col gap-4">
                    <h2 className="heading-6">Drafts</h2>
                    <FilteredUnifiedItems items={draftItems} address={resolvedAddress} isOwnProfile={isOwnProfile} />
                  </div>
                )}
                
                {pastItems.length > 0 && (
                  <div className="flex flex-col gap-4">
                    <h2 className="heading-6">Past</h2>
                    <FilteredUnifiedItems items={pastItems} address={resolvedAddress} isOwnProfile={isOwnProfile} />
                  </div>
                )}
                
                {unifiedItems.length === 0 && (
                  <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border-4 py-24 text-center">
                    <h4 className="text-content-primary">
                      {isOwnProfile 
                        ? "You don't have any proposals, topics, candidates, or drafts"
                        : "No proposals, topics, or candidates found"}
                    </h4>
                    {isOwnProfile && (
                      <span>
                        You can create one from the{" "}
                        <Link
                          to="/vote"
                          className="inline text-semantic-accent hover:text-semantic-accent-dark"
                        >
                          Vote Page
                        </Link>
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="hidden lg:flex flex-col gap-6 w-[380px] shrink-0 pt-[108px]">
            {/* Tokens Card */}
            <TokensCard 
              address={resolvedAddress}
              ownedNouns={ownedNouns}
              delegatedNouns={delegatedNouns}
              isLoading={isLoadingNouns}
            />

            {/* Delegation Card */}
            <DelegationButton 
              profileAddress={resolvedAddress}
              connectedAddress={connectedAddress || undefined}
            />
          </div>
        </div>
      </SearchProvider>
      
      {/* Create Type Dialog */}
      {isOwnProfile && (
        <CreateTypeDialog
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          daoType={daoType}
        />
      )}
    </>
  )
}

