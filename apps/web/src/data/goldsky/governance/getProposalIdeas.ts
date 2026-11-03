import { graphQLFetch } from "@/data/utils/graphQLFetch";
import { CHAIN_CONFIG } from "@/config";
import { ProposalIdea } from "./ideaTypes";
import { getAddress } from "viem";
import { isSepoliaNetwork } from "@/utils/networkDetection";
import { attachEncodedReplies } from "./parseEncodedFeedback";

// Use dynamic Goldsky URL based on current network (mainnet or sepolia)
const getGoldskyUrl = () => CHAIN_CONFIG.goldskyUrl.primary;

const SPONSOR_SIG_FIELDS = `
  id
  sig
  signer {
    id
    nounsRepresented {
      id
    }
  }
  expirationTimestamp
  canceled
  reason
  createdTimestamp
`;

const REHEARSAL_SPONSOR_SIG_FIELDS = `
  id
  sig
  signer {
    id
    nouns {
      id
    }
  }
  expirationTimestamp
  canceled
  reason
  createdTimestamp
`;

const query = `
  query GetProposalCandidates($first: Int = 1000) {
    proposalCandidates(
      first: $first
      orderBy: createdTimestamp
      orderDirection: desc
    ) {
      id
      proposer
      slug
      createdTimestamp
      canceledTimestamp
      lastUpdatedTimestamp
      canceled
      latestVersion {
        id
        createdTimestamp
        updateMessage
        content {
          id
          title
          description
          targets
          values
          signatures
          calldatas
          proposalIdToUpdate
          matchingProposalIds
          contentSignatures(where: { canceled: false }) {
            ${SPONSOR_SIG_FIELDS}
          }
        }
      }
      versions {
        id
        createdTimestamp
      }
    }
  }
`;

// Rehearsal 0.1.4: tx sigs are functionSignatures; sponsor sigs are content.signatures
const rehearsalQuery = `
  query GetProposalCandidates($first: Int = 1000) {
    proposalCandidates(
      first: $first
      orderBy: createdTimestamp
      orderDirection: desc
    ) {
      id
      proposer
      slug
      createdTimestamp
      canceledTimestamp
      lastUpdatedTimestamp
      canceled
      latestVersion {
        id
        createdTimestamp
        updateMessage
        content {
          id
          title
          description
          targets
          values
          functionSignatures
          calldatas
          proposalIdToUpdate
          matchingProposalIds
          signatures(where: { canceled: false }) {
            ${REHEARSAL_SPONSOR_SIG_FIELDS}
          }
        }
      }
      versions {
        id
        createdTimestamp
      }
    }
  }
`;

const batchFeedbackQuery = `
  query GetBatchCandidateFeedback($candidateIds: [ID!]!) {
    candidateFeedbacks(
      where: {
        candidate_in: $candidateIds
      }
      orderBy: createdTimestamp
      orderDirection: desc
    ) {
      id
      candidate {
        id
      }
      voter {
        id
      }
      supportDetailed
      reason
      voteReplies {
        reply
        quotedReason
        replyVote {
          id
          voter { id }
          supportDetailed
          reason
        }
      }
      createdTimestamp
    }
  }
`;

const rehearsalBatchFeedbackQuery = `
  query GetBatchCandidateFeedback($candidateIds: [ID!]!) {
    candidateFeedbacks(
      where: {
        candidate_in: $candidateIds
      }
      orderBy: createdTimestamp
      orderDirection: desc
    ) {
      id
      candidate {
        id
      }
      voter {
        id
      }
      support
      reason
      createdTimestamp
    }
  }
`;

const feedbackQuery = `
  query GetCandidateFeedback($candidateId: ID!) {
    candidateFeedbacks(
      where: {
        candidate: $candidateId
      }
      orderBy: createdTimestamp
      orderDirection: desc
    ) {
      id
      voter {
        id
      }
      supportDetailed
      reason
      createdTimestamp
    }
  }
`;

const rehearsalFeedbackQuery = `
  query GetCandidateFeedback($candidateId: ID!) {
    candidateFeedbacks(
      where: {
        candidate: $candidateId
      }
      orderBy: createdTimestamp
      orderDirection: desc
    ) {
      id
      voter {
        id
      }
      support
      reason
      createdTimestamp
    }
  }
`;

interface ProposalCandidatesResponse {
  proposalCandidates: Array<{
    id: string;
    proposer: string;
    slug: string;
    createdTimestamp: string;
    canceledTimestamp: string | null;
    lastUpdatedTimestamp: string;
    canceled: boolean;
    latestVersion: {
      id: string;
      createdTimestamp: string;
      updateMessage: string;
      content: {
        id: string;
        title: string;
        description: string;
        targets: string[];
        values: string[];
        signatures?: string[] | Array<{
          id: string;
          sig: string;
          signer: {
            id: string;
            nounsRepresented?: Array<{ id: string }>;
            nouns?: Array<{ id: string }>;
          };
          expirationTimestamp: string;
          canceled: boolean;
          reason: string;
          createdTimestamp: string;
        }>;
        functionSignatures?: string[];
        calldatas: string[];
        proposalIdToUpdate: string;
        matchingProposalIds: string[];
        contentSignatures?: Array<{
          id: string;
          sig: string;
          signer: {
            id: string;
              nounsRepresented?: Array<{ id: string }>;
              nouns?: Array<{ id: string }>;
          };
          expirationTimestamp: string;
          canceled: boolean;
          reason: string;
          createdTimestamp: string;
        }>;
      };
    };
    versions: Array<{
      id: string;
      createdTimestamp: string;
    }>;
  }>;
}

interface CandidateFeedbackResponse {
  candidateFeedbacks: Array<{
    id: string;
    candidate?: {
      id: string;
    };
    voter: {
      id: string;
    };
    supportDetailed?: number;
    support?: number;
    reason: string | null;
    voteReplies?: Array<{
      reply: string;
      quotedReason?: string | null;
      replyVote: {
        id: string;
        voter: { id: string };
        supportDetailed?: number | null;
        reason?: string | null;
      };
    }>;
    createdTimestamp: string;
  }>;
}

type SponsorSigRaw = NonNullable<
  ProposalCandidatesResponse["proposalCandidates"][0]["latestVersion"]["content"]["contentSignatures"]
>[number];

function isRehearsalSchema() {
  return isSepoliaNetwork();
}

function mapSponsorSignatures(content: ProposalCandidatesResponse["proposalCandidates"][0]["latestVersion"]["content"]) {
  const raw: SponsorSigRaw[] = content.contentSignatures
    || (Array.isArray(content.signatures) && typeof content.signatures[0] === "object"
      ? content.signatures as SponsorSigRaw[]
      : []);

  return raw.map((sig) => ({
    sig: sig.sig,
    signer: {
      id: sig.signer.id,
      nounsRepresented: (sig.signer.nounsRepresented || sig.signer.nouns || []).map((n) => ({ id: n.id })),
    },
    expirationTimestamp: parseInt(sig.expirationTimestamp),
    canceled: sig.canceled,
    status: sig.canceled ? "canceled" as const :
      parseInt(sig.expirationTimestamp) * 1000 < Date.now() ? "expired" as const :
      "valid" as const,
  }));
}

function txSignatures(content: ProposalCandidatesResponse["proposalCandidates"][0]["latestVersion"]["content"]) {
  if (content.functionSignatures) return content.functionSignatures;
  if (Array.isArray(content.signatures) && typeof content.signatures[0] === "string") {
    return content.signatures as string[];
  }
  return [];
}

function feedbackSupport(fb: { supportDetailed?: number; support?: number }) {
  return fb.supportDetailed ?? fb.support ?? 0;
}

export async function getProposalIdeas(limit: number = 1000): Promise<ProposalIdea[]> {
  try {
    const goldskyUrl = getGoldskyUrl();
    if (!goldskyUrl) return [];
    console.log('[getProposalIdeas] Fetching candidates from Goldsky:', goldskyUrl);
    
    // Fetch candidates from Nouns DAO Goldsky subgraph
    const data = await graphQLFetch(
      goldskyUrl,
      isRehearsalSchema() ? rehearsalQuery : query,
      { first: limit },
      { cache: "no-cache" }
    ) as ProposalCandidatesResponse;

    console.log('[getProposalIdeas] Received candidates:', data?.proposalCandidates?.length || 0);
    console.log('[getProposalIdeas] Raw candidates data:', data?.proposalCandidates?.map(c => ({
      id: c.id,
      canceled: c.canceled,
      canceledTimestamp: c.canceledTimestamp,
      proposalIdToUpdate: c.latestVersion?.content?.proposalIdToUpdate
    })));

    if (!data?.proposalCandidates) {
      console.warn('[getProposalIdeas] No proposal candidates found in response');
      return [];
    }

    // Fetch all feedback in one batch query (much faster than N+1 queries)
    const candidateIds = data.proposalCandidates.map(c => c.id);
    let allFeedback: Record<string, any[]> = {};
    
    try {
      const feedbackData = await graphQLFetch(
        getGoldskyUrl(),
        isRehearsalSchema() ? rehearsalBatchFeedbackQuery : batchFeedbackQuery,
        { candidateIds },
        { cache: "no-cache" }
      ) as CandidateFeedbackResponse;
      
      // Group feedback by candidate ID
      (feedbackData?.candidateFeedbacks || []).forEach(fb => {
        if (!fb.candidate?.id) {
          console.warn('[getProposalIdeas] Feedback missing candidate ID:', fb.id);
          return;
        }
        if (!allFeedback[fb.candidate.id]) {
          allFeedback[fb.candidate.id] = [];
        }
        allFeedback[fb.candidate.id].push({
          id: fb.id,
          voterAddress: fb.voter.id,
          support: feedbackSupport(fb),
          reason: fb.reason || '',
          voteReplies: fb.voteReplies?.map((vr) => ({
            reply: vr.reply,
            quotedReason: vr.quotedReason ?? undefined,
            replyVote: {
              id: vr.replyVote.id,
              voter: { id: vr.replyVote.voter.id },
              support: vr.replyVote.supportDetailed ?? feedbackSupport(fb),
              reason: vr.replyVote.reason ?? '',
            },
          })) || [],
          votes: 0, // Votes not available in schema
          createdTimestamp: parseInt(fb.createdTimestamp),
        });
      });
    } catch (error) {
      console.error('Failed to fetch batch feedback:', error);
    }

    // Convert candidates to ideas format
    const ideas = data.proposalCandidates.map((candidate) => {
        // Get feedback for this candidate from the batch result
        const feedbackPosts = attachEncodedReplies(allFeedback[candidate.id] || []);

        const contentSignatures = mapSponsorSignatures(candidate.latestVersion.content);

        const proposerAddress = candidate.proposer || candidate.id.split("-")[0];

        return {
          id: candidate.id,
          proposerAddress: getAddress(proposerAddress),
          slug: candidate.slug,
          createdTimestamp: parseInt(candidate.createdTimestamp),
          canceledTimestamp: candidate.canceled ? parseInt(candidate.canceledTimestamp || candidate.createdTimestamp) : null,
          lastUpdatedTimestamp: parseInt(candidate.lastUpdatedTimestamp),
          latestVersion: {
            id: candidate.latestVersion.id,
            createdTimestamp: parseInt(candidate.latestVersion.createdTimestamp),
            updateMessage: candidate.latestVersion.updateMessage || undefined,
            content: {
              title: candidate.latestVersion.content.title,
              description: candidate.latestVersion.content.description,
              targets: candidate.latestVersion.content.targets,
              values: candidate.latestVersion.content.values.map(v => v.toString()),
              signatures: txSignatures(candidate.latestVersion.content),
              calldatas: candidate.latestVersion.content.calldatas,
            },
            targetProposalId: candidate.latestVersion.content.proposalIdToUpdate && 
                               candidate.latestVersion.content.proposalIdToUpdate !== "0" 
                               ? parseInt(candidate.latestVersion.content.proposalIdToUpdate) 
                               : null,
            proposalId: candidate.latestVersion.content.matchingProposalIds && 
                        candidate.latestVersion.content.matchingProposalIds.length > 0
                        ? parseInt(candidate.latestVersion.content.matchingProposalIds[0])
                        : null,
            contentSignatures,
          },
          versions: candidate.versions.map(v => ({
            id: v.id,
            createdTimestamp: parseInt(v.createdTimestamp),
          })),
          feedbackPosts,
          sponsors: contentSignatures,
        };
      });

    console.log('[getProposalIdeas] Converted to ideas:', ideas.length);
    console.log('[getProposalIdeas] Ideas details:', ideas.map(i => ({
      id: i.id,
      canceledTimestamp: i.canceledTimestamp,
      targetProposalId: i.latestVersion.targetProposalId,
      proposalId: i.latestVersion.proposalId
    })));
    return ideas;
  } catch (error) {
    console.error('[getProposalIdeas] Failed to fetch proposal ideas:', error);
    console.error('[getProposalIdeas] Goldsky URL:', getGoldskyUrl());
    return [];
  }
}

const singleCandidateQuery = `
  query GetProposalCandidate($id: ID!) {
    proposalCandidate(id: $id) {
      id
      proposer
      slug
      createdTimestamp
      canceledTimestamp
      lastUpdatedTimestamp
      canceled
      latestVersion {
        id
        createdTimestamp
        updateMessage
        content {
          id
          title
          description
          targets
          values
          signatures
          calldatas
          proposalIdToUpdate
          matchingProposalIds
          contentSignatures(where: { canceled: false }) {
            ${SPONSOR_SIG_FIELDS}
          }
        }
      }
      versions {
        id
        createdTimestamp
      }
    }
  }
`;

const rehearsalSingleCandidateQuery = `
  query GetProposalCandidate($id: ID!) {
    proposalCandidate(id: $id) {
      id
      proposer
      slug
      createdTimestamp
      canceledTimestamp
      lastUpdatedTimestamp
      canceled
      latestVersion {
        id
        createdTimestamp
        updateMessage
        content {
          id
          title
          description
          targets
          values
          functionSignatures
          calldatas
          proposalIdToUpdate
          matchingProposalIds
          signatures(where: { canceled: false }) {
            ${REHEARSAL_SPONSOR_SIG_FIELDS}
          }
        }
      }
      versions {
        id
        createdTimestamp
      }
    }
  }
`;

export async function getProposalIdea(id: string): Promise<ProposalIdea | null> {
  try {
    console.log('[getProposalIdea] Fetching candidate with ID:', id);
    console.log('[getProposalIdea] Goldsky URL:', getGoldskyUrl());
    
    // Fetch single candidate from Nouns DAO Goldsky subgraph
    const data = await graphQLFetch(
      getGoldskyUrl(),
      isRehearsalSchema() ? rehearsalSingleCandidateQuery : singleCandidateQuery,
      { id },
      { cache: "no-cache" }
    ) as { proposalCandidate: ProposalCandidatesResponse['proposalCandidates'][0] | null };

    console.log('[getProposalIdea] Response:', data);
    console.log('[getProposalIdea] Candidate found:', !!data?.proposalCandidate);

    if (!data?.proposalCandidate) {
      console.warn('[getProposalIdea] No candidate found for ID:', id);
      return null;
    }

    const candidate = data.proposalCandidate;

    // Fetch feedback for this candidate
    let feedbackPosts: any[] = [];
    try {
      const feedbackData = await graphQLFetch(
        getGoldskyUrl(),
        isRehearsalSchema() ? rehearsalFeedbackQuery : feedbackQuery,
        { candidateId: candidate.id },
        { cache: "no-cache" }
      ) as CandidateFeedbackResponse;
      
      feedbackPosts = attachEncodedReplies((feedbackData?.candidateFeedbacks || []).map(fb => ({
        id: fb.id,
        voterAddress: fb.voter.id,
        support: feedbackSupport(fb),
        reason: fb.reason || '',
        votes: 0, // Votes not available in schema
        createdTimestamp: parseInt(fb.createdTimestamp),
      })));
    } catch (error) {
      console.error('Failed to fetch feedback for candidate:', error);
    }

    const contentSignatures = mapSponsorSignatures(candidate.latestVersion.content);

    const proposerAddress = candidate.proposer || candidate.id.split("-")[0];
    
    if (!proposerAddress) {
      console.error('[getProposalIdea] Missing proposer address for candidate:', candidate.id);
      return null;
    }

    return {
      id: candidate.id,
      proposerAddress: getAddress(proposerAddress),
      slug: candidate.slug,
      createdTimestamp: parseInt(candidate.createdTimestamp),
      canceledTimestamp: candidate.canceled ? parseInt(candidate.canceledTimestamp || candidate.createdTimestamp) : null,
      lastUpdatedTimestamp: parseInt(candidate.lastUpdatedTimestamp),
      latestVersion: {
        id: candidate.latestVersion.id,
        createdTimestamp: parseInt(candidate.latestVersion.createdTimestamp),
        updateMessage: candidate.latestVersion.updateMessage || undefined,
        content: {
          title: candidate.latestVersion.content.title,
          description: candidate.latestVersion.content.description,
          targets: candidate.latestVersion.content.targets,
          values: candidate.latestVersion.content.values.map(v => v.toString()),
          signatures: txSignatures(candidate.latestVersion.content),
          calldatas: candidate.latestVersion.content.calldatas,
        },
        targetProposalId: candidate.latestVersion.content.proposalIdToUpdate && 
                           candidate.latestVersion.content.proposalIdToUpdate !== "0" 
                           ? parseInt(candidate.latestVersion.content.proposalIdToUpdate) 
                           : null,
        proposalId: candidate.latestVersion.content.matchingProposalIds && 
                    candidate.latestVersion.content.matchingProposalIds.length > 0
                    ? parseInt(candidate.latestVersion.content.matchingProposalIds[0])
                    : null,
        contentSignatures,
      },
      versions: candidate.versions.map(v => ({
        id: v.id,
        createdTimestamp: parseInt(v.createdTimestamp),
      })),
      feedbackPosts,
      sponsors: contentSignatures,
    };
  } catch (error) {
    console.error('Failed to fetch proposal idea:', error);
    return null;
  }
}

// Helper functions
export function normalizeIdeaId(id: string): string {
  // ID format from URL can be: slug-proposer (without 0x) or proposer-slug (with 0x)
  // Return format should be: proposer-slug (lowercase proposer, with 0x)
  const fullyDecodedId = decodeURIComponent(id);
  const parts = fullyDecodedId.split("-");

  console.log('[normalizeIdeaId] Input ID:', id);
  console.log('[normalizeIdeaId] Decoded ID:', fullyDecodedId);
  console.log('[normalizeIdeaId] Parts:', parts);

  // Check if first part is an address (starts with 0x)
  const proposerFirst = parts[0].startsWith("0x");
  
  let normalizedId: string;
  if (proposerFirst) {
    // Format: 0xabc-some-slug
    const proposerId = parts[0].toLowerCase();
    const slug = parts.slice(1).join("-");
    normalizedId = `${proposerId}-${slug}`;
  } else {
    // Format: some-slug-abc (where abc is the proposer without 0x)
    const proposerId = `0x${parts[parts.length - 1]}`.toLowerCase();
    const slug = parts.slice(0, -1).join("-");
    normalizedId = `${proposerId}-${slug}`;
  }
  
  console.log('[normalizeIdeaId] Normalized ID:', normalizedId);
  return normalizedId;
}

export function extractSlugFromId(ideaId: string): string {
  const slugParts = ideaId.split("-").slice(1);
  return slugParts.join("-");
}

export function makeUrlId(id: string): string {
  const proposerId = id.split("-")[0];
  const slug = extractSlugFromId(id);
  return `${slug}-${proposerId.slice(2)}`;
}

