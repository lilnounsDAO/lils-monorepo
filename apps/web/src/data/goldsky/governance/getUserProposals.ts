import { Address, getAddress } from 'viem'
import { getProposalOverviews } from './getProposalOverviewsVersioned'
import { ProposalOverview } from './common'
import { getProposalIdeas } from './getProposalIdeas'
import { ProposalIdea } from './ideaTypes'
import { getTopics } from './getTopics'
import { Topic } from './getTopics'
import { DaoType } from './getProposalOverviews'
import { isDaoVersion5 } from '@/utils/daoVersion'
import { graphQLFetch } from '@/data/utils/graphQLFetch'
import { CHAIN_CONFIG, NOUNS_DAO_GOLDSKY_URL } from '@/config'
import type { DigestQuote } from './getDigestFeed'

export interface ProfileVote {
  // 0 = against, 1 = for, 2 = abstain
  support: 0 | 1 | 2
  votes: number
  /** The voter's own words, with camp-style replies and revotes split out */
  reason: string | null
  replies: DigestQuote[]
  revotes: DigestQuote[]
}

const votesForVoterQuery = `
  query VotesForVoter($voter: String!) {
    votes(first: 1000, orderBy: blockTimestamp, orderDirection: desc, where: { voter: $voter }) {
      proposal {
        id
      }
      supportDetailed
      votes
      reason
    }
  }
`

const proposalVotesQuery = `
  query ProposalVotes($proposals: [String!]!) {
    votes(first: 1000, where: { proposal_in: $proposals }) {
      voter {
        id
      }
      proposal {
        id
      }
      supportDetailed
      reason
    }
  }
`

// Camp encodes replies as "@0xaddr\n\nreply\n> quoted" and revotes as "+1\n\n> quoted"
const REPLY_BLOCK = /(?:^|\n\n)@(0x[a-fA-F0-9]{40}|0x[a-fA-F0-9]{4}\.\.\.[a-fA-F0-9]{4})\n\n([\s\S]*?)\n((?:>[^\n]*(?:\n|$))+)/g
const REVOTE_BLOCK = /(?:^|\n\n)\+1\n\n((?:>[^\n]*(?:\n|$))+)/g

function unquote(quoted: string) {
  return quoted
    .split('\n')
    .map((line) => line.replace(/^> ?/, ''))
    .join('\n')
    .trim()
}

const normalize = (text: string) => text.replace(/\s+/g, ' ').trim()

function parseReason(raw: string | null) {
  const replies: (DigestQuote & { mention: string })[] = []
  const revotes: DigestQuote[] = []
  let leftover = raw ?? ''
  leftover = leftover.replace(REPLY_BLOCK, (_all, mention: string, body: string, quoted: string) => {
    replies.push({ mention, body: body.trim() || undefined, quote: unquote(quoted) })
    return ''
  })
  leftover = leftover.replace(REVOTE_BLOCK, (_all, quoted: string) => {
    revotes.push({ quote: unquote(quoted) })
    return ''
  })
  return { reason: leftover.trim() || null, replies, revotes }
}

/**
 * Every proposal a specific address voted on, plus how they voted on each (keyed by proposal id)
 */
export async function getVotedProposalsForAddress(
  address: Address,
  daoType: DaoType = 'lilnouns'
): Promise<{ proposals: ProposalOverview[]; votes: Record<string, ProfileVote> }> {
  const url = daoType === 'nouns' ? NOUNS_DAO_GOLDSKY_URL : CHAIN_CONFIG.goldskyUrl.primary
  const voter = getAddress(address).toLowerCase()
  const [data, allProposals] = await Promise.all([
    graphQLFetch(url, votesForVoterQuery, { voter }, { cache: 'no-cache' }) as Promise<{
      votes: Array<{ proposal: { id: string }; supportDetailed: number; votes: string; reason: string | null }>
    } | null>,
    getProposalOverviews(1000, daoType),
  ])

  const parsed = new Map<string, ReturnType<typeof parseReason>>()
  const raw = new Map<string, { support: number; votes: number }>()
  for (const vote of data?.votes ?? []) {
    raw.set(vote.proposal.id, { support: vote.supportDetailed, votes: Number(vote.votes) })
    parsed.set(vote.proposal.id, parseReason(vote.reason))
  }

  // Quotes don't say whose vote they quote (or only a short address), so look it up
  // among the other votes on the same proposal
  const needsLookup = Array.from(parsed.entries())
    .filter(([, p]) => p.revotes.length > 0 || p.replies.length > 0)
    .map(([id]) => id)
  const others = new Map<string, Array<{ voter: string; support: number; reason: string }>>()
  for (let i = 0; i < needsLookup.length; i += 50) {
    const res = (await graphQLFetch(url, proposalVotesQuery, { proposals: needsLookup.slice(i, i + 50) }, { cache: 'no-cache' }).catch(
      () => null
    )) as { votes: Array<{ voter: { id: string }; proposal: { id: string }; supportDetailed: number; reason: string | null }> } | null
    for (const v of res?.votes ?? []) {
      if (!v.reason || v.voter.id.toLowerCase() === voter) continue
      const list = others.get(v.proposal.id) ?? []
      list.push({ voter: v.voter.id, support: v.supportDetailed, reason: normalize(v.reason) })
      others.set(v.proposal.id, list)
    }
  }

  const resolve = (proposalId: string, item: DigestQuote, mention?: string): DigestQuote => {
    const quote = normalize(item.quote)
    const candidates = (others.get(proposalId) ?? []).filter((o) => {
      if (!mention) return true
      const m = mention.toLowerCase()
      if (m.length === 42) return o.voter.toLowerCase() === m
      const [prefix, suffix] = m.split('...')
      return o.voter.toLowerCase().startsWith(prefix) && o.voter.toLowerCase().endsWith(suffix)
    })
    const match =
      candidates.find((o) => o.reason === quote) ?? candidates.find((o) => o.reason.includes(quote) || quote.includes(o.reason))
    const target = match?.voter ?? (mention?.length === 42 ? mention : undefined)
    return {
      ...item,
      target: target ? getAddress(target) : undefined,
      targetSupport: match?.support,
      handle: target ? undefined : mention,
    }
  }

  const votes: Record<string, ProfileVote> = {}
  for (const [id, p] of parsed) {
    const { support, votes: weight } = raw.get(id)!
    votes[id] = {
      support: support as ProfileVote['support'],
      votes: weight,
      reason: p.reason,
      replies: p.replies.map(({ mention, ...item }) => resolve(id, item, mention)),
      revotes: p.revotes.map((item) => resolve(id, item)),
    }
  }
  return { proposals: allProposals.filter((p) => votes[p.id]), votes }
}

/**
 * Get all proposals created by a specific address
 */
export async function getProposalsForAddress(
  address: Address,
  daoType: DaoType = 'lilnouns'
): Promise<ProposalOverview[]> {
  const normalizedAddress = getAddress(address).toLowerCase()
  const allProposals = await getProposalOverviews(1000, daoType)
  
  return allProposals.filter(
    (proposal) => proposal.proposerAddress.toLowerCase() === normalizedAddress
  )
}

/**
 * Get all candidates created by a specific address
 * Only works for DAO version 5+
 */
export async function getCandidatesForAddress(
  address: Address
): Promise<ProposalIdea[]> {
  if (!isDaoVersion5()) {
    return [] // Candidates not available in v2
  }
  
  const normalizedAddress = getAddress(address).toLowerCase()
  const allCandidates = await getProposalIdeas(1000)
  
  return allCandidates.filter(
    (candidate) => candidate.proposerAddress.toLowerCase() === normalizedAddress
  )
}

/**
 * Get all topics created by a specific address
 * Only works for DAO version 5+
 */
export async function getTopicsForAddress(
  address: Address
): Promise<Topic[]> {
  if (!isDaoVersion5()) {
    return [] // Topics not available in v2
  }
  
  const normalizedAddress = getAddress(address).toLowerCase()
  const allTopics = await getTopics(1000)
  
  return allTopics.filter(
    (topic) => topic.creator.toLowerCase() === normalizedAddress
  )
}

/**
 * Get all proposals and candidates sponsored by a specific address
 * (where the address appears as a signer/sponsor)
 * Only works for DAO version 5+ (candidates)
 */
export async function getSponsoredProposalsForAddress(
  address: Address,
  daoType: DaoType = 'lilnouns'
): Promise<{
  proposals: ProposalOverview[]
  candidates: ProposalIdea[]
}> {
  const normalizedAddress = getAddress(address).toLowerCase()
  
  // Get all proposals
  const allProposals = await getProposalOverviews(1000, daoType)
  
  // Only fetch candidates if DAO version is 5+
  let allCandidates: ProposalIdea[] = []
  if (isDaoVersion5()) {
    allCandidates = await getProposalIdeas(1000)
  }
  
  // Filter proposals that have the address as a signer
  // Note: This requires checking the proposal's signers array if available
  // For now, we'll focus on candidates which have sponsors
  const sponsoredCandidates = allCandidates.filter((candidate) => {
    const sponsors = candidate.latestVersion.contentSignatures || candidate.sponsors || []
    return sponsors.some(
      (sponsor) => sponsor.signer.id.toLowerCase() === normalizedAddress
    )
  })
  
  // For proposals, we'd need to check signers if available
  // For now, return empty array as proposals don't have sponsors in the same way
  const sponsoredProposals: ProposalOverview[] = []
  
  return {
    proposals: sponsoredProposals,
    candidates: sponsoredCandidates,
  }
}

