import { Address, getAddress } from 'viem'
import { getProposalOverviews } from './getProposalOverviewsVersioned'
import { ProposalOverview } from './common'
import { getProposalIdeas } from './getProposalIdeas'
import { ProposalIdea } from './ideaTypes'
import { getTopics } from './getTopics'
import { Topic } from './getTopics'
import { DaoType } from './getProposalOverviews'
import { isDaoVersion5 } from '@/utils/daoVersion'

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

