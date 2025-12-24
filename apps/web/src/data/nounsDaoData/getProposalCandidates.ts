import { getLogs } from 'viem/actions'
import { CHAIN_CONFIG } from '@/config'
import { nounsDaoDataConfig } from '../nounsDaoDataContract'
import { ProposalIdea, IdeaVersion, SponsorSignature } from '../goldsky/governance/ideaTypes'
import { decodeEventLog } from 'viem'

// Query ProposalCandidateCreated events to get all candidates
export async function getProposalCandidates(): Promise<ProposalIdea[]> {
  try {
    const logs = await getLogs(CHAIN_CONFIG.publicClient, {
      address: nounsDaoDataConfig.address,
      event: {
        type: 'event',
        name: 'ProposalCandidateCreated',
        inputs: [
          { name: 'proposer', type: 'address', indexed: true },
          { name: 'slug', type: 'string', indexed: false },
          { name: 'proposal', type: 'tuple', components: [
            { name: 'title', type: 'string' },
            { name: 'description', type: 'string' },
            { name: 'targets', type: 'address[]' },
            { name: 'values', type: 'uint256[]' },
            { name: 'signatures', type: 'string[]' },
            { name: 'calldatas', type: 'bytes[]' },
          ]},
        ],
      },
      fromBlock: 'earliest',
      toBlock: 'latest',
    })

    // Convert logs to ideas
    const ideas: ProposalIdea[] = await Promise.all(
      logs.map(async (log) => {
        const decoded = decodeEventLog({
          abi: nounsDaoDataConfig.abi,
          data: log.data,
          topics: log.topics,
        })

        const args = decoded.args as any
        const proposer = args.proposer
        const slug = args.slug
        
        // Create ID in the format: proposer-slug
        const id = `${proposer.toLowerCase()}-${slug}`

        // Fetch latest version and signatures
        const latestVersion = await getCandidateLatestVersion(proposer, slug)
        
        // Fetch feedback/comments
        const feedbackPosts = await getCandidateFeedback(proposer, slug)

        return {
          id,
          proposerAddress: proposer,
          slug,
          createdTimestamp: Number(log.blockNumber) * 12, // Approximate timestamp (12 seconds per block)
          canceledTimestamp: null, // TODO: Check canceled events
          lastUpdatedTimestamp: Number(log.blockNumber) * 12,
          latestVersion,
          versions: [{
            id: latestVersion.id,
            createdTimestamp: Number(log.blockNumber) * 12,
          }],
          feedbackPosts,
          sponsors: latestVersion.contentSignatures || [],
        }
      })
    )

    return ideas
  } catch (error) {
    console.error('Failed to fetch proposal candidates:', error)
    return []
  }
}

// Get the latest version of a candidate
async function getCandidateLatestVersion(
  proposer: string,
  slug: string
): Promise<IdeaVersion> {
  try {
    const result = await CHAIN_CONFIG.publicClient.readContract({
      ...nounsDaoDataConfig,
      functionName: 'getProposalCandidate',
      args: [proposer as `0x${string}`, slug],
    })

    const [updateMessage, content, version, contentSignatures] = result as any

    // Convert signatures to our format
    const sponsors: SponsorSignature[] = (contentSignatures || []).map((sig: any) => ({
      sig: sig.sig,
      signer: {
        id: sig.signer,
        nounsRepresented: [], // TODO: Fetch actual nouns represented
      },
      expirationTimestamp: Number(sig.expirationTimestamp),
      canceled: sig.canceled,
      status: sig.canceled ? 'canceled' : 
               Number(sig.expirationTimestamp) * 1000 < Date.now() ? 'expired' : 
               'valid',
    }))

    return {
      id: `${version}`,
      createdTimestamp: Date.now() / 1000, // Approximate
      updateMessage: updateMessage || undefined,
      content: {
        title: content.title,
        description: content.description,
        targets: content.targets,
        values: content.values.map((v: bigint) => v.toString()),
        signatures: content.signatures,
        calldatas: content.calldatas.map((c: `0x${string}`) => c),
      },
      targetProposalId: null,
      proposalId: null,
      contentSignatures: sponsors,
    }
  } catch (error) {
    console.error('Failed to fetch candidate version:', error)
    // Return empty version
    return {
      id: '0',
      createdTimestamp: Date.now() / 1000,
      content: {
        title: '',
        description: '',
        targets: [],
        values: [],
        signatures: [],
        calldatas: [],
      },
      targetProposalId: null,
      proposalId: null,
    }
  }
}

// Get feedback for a candidate
async function getCandidateFeedback(
  proposer: string,
  slug: string
): Promise<any[]> {
  try {
    const logs = await getLogs(CHAIN_CONFIG.publicClient, {
      address: nounsDaoDataConfig.address,
      event: {
        type: 'event',
        name: 'ProposalCandidateFeedback',
        inputs: [
          { name: 'proposer', type: 'address', indexed: true },
          { name: 'slug', type: 'string', indexed: false },
          { name: 'msgSender', type: 'address', indexed: true },
          { name: 'support', type: 'uint8', indexed: false },
          { name: 'reason', type: 'string', indexed: false },
        ],
      },
      args: {
        proposer: proposer as `0x${string}`,
      },
      fromBlock: 'earliest',
      toBlock: 'latest',
    })

    // Filter logs by slug and convert to feedback format
    const feedback = logs
      .map((log) => {
        try {
          const decoded = decodeEventLog({
            abi: nounsDaoDataConfig.abi,
            data: log.data,
            topics: log.topics,
          })
          const args = decoded.args as any
          
          // Check if this log is for the right slug
          if (args.slug !== slug) return null

          return {
            id: log.transactionHash,
            voterAddress: args.msgSender,
            support: Number(args.support),
            reason: args.reason,
            votes: 0, // TODO: Fetch actual voting power
            createdTimestamp: Number(log.blockNumber) * 12,
          }
        } catch (error) {
          return null
        }
      })
      .filter(Boolean)

    return feedback
  } catch (error) {
    console.error('Failed to fetch candidate feedback:', error)
    return []
  }
}

