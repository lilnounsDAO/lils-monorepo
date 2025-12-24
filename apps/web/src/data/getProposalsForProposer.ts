
import { ProposalState } from "../utils/types";
import { Address } from "viem";
import { CHAIN_CONFIG } from "../config";
import { ProposalStatus } from "./generated/gql/graphql";
import { graphQLFetch, graphQLFetchWithFallback } from "./utils/graphQLFetch";
import { getBlockNumber } from "viem/actions";

export type ProposerProposal = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  state: ProposalState;
  kind: "proposal" | "candidate";
  url?: string;
};

const query = `
  query ProposalsForProposer($proposerAsString: String!) {
    proposals(
      where: { proposer: $proposerAsString}
      first: 1000
      orderBy: id
      orderDirection: desc
    ) {
      id
      title
      description
      status
      quorumVotes
      forVotes
      againstVotes
      endBlock
      startBlock
    }
  }
`;

const candidateQuery = `
  query ProposalCandidatesForProposer($proposer: String!, $first: Int = 1000) {
    proposalCandidates(
      where: { proposer: $proposer }
      first: $first
      orderBy: createdTimestamp
      orderDirection: desc
    ) {
      id
      slug
      proposer
      createdTimestamp
      latestVersion {
        content {
          title
          description
        }
      }
    }
  }
`;

type ProposalQueryResult = {
  proposals: Array<{
    id: string;
    title: string;
    description?: string | null;
    status: ProposalStatus;
    quorumVotes?: string | null;
    forVotes: string;
    againstVotes: string;
    endBlock: string;
    startBlock: string;
  }>;
};

type ProposalQueryVariables = {
  proposerAsString: string;
};

type CandidateQueryResult = {
  proposalCandidates: Array<{
    id: string;
    slug?: string | null;
    proposer: string;
    createdTimestamp: string;
    latestVersion?: {
      content?: {
        title?: string | null;
        description?: string | null;
      } | null;
    } | null;
  }>;
};

function computeProposalState(
  proposal: ProposalQueryResult["proposals"][number],
  currentBlock: bigint
): ProposalState {
  const forVotes = BigInt(proposal.forVotes);
  const againstVotes = BigInt(proposal.againstVotes);
  const quorumVotes = proposal.quorumVotes ? BigInt(proposal.quorumVotes) : 0n;
  const started = currentBlock > BigInt(proposal.startBlock);
  const ended = currentBlock > BigInt(proposal.endBlock);
  const passing = forVotes >= quorumVotes && forVotes > againstVotes;

  switch (proposal.status) {
    case ProposalStatus.Cancelled:
      return ProposalState.Cancelled;
    case ProposalStatus.Executed:
      return ProposalState.Executed;
    case ProposalStatus.Queued:
      return ProposalState.Queued;
    case ProposalStatus.Vetoed:
      return ProposalState.Vetoed;
    case ProposalStatus.Active:
      if (ended) {
        return passing ? ProposalState.Succeeded : ProposalState.Defeated;
      }
      return ProposalState.Active;
    case ProposalStatus.Pending:
      if (ended) {
        return ProposalState.Defeated;
      }
      if (started) {
        return ProposalState.Active;
      }
      return ProposalState.Pending;
    default:
      return ProposalState.Cancelled;
  }
}

export async function getProposalsForProposer(address: Address): Promise<ProposerProposal[]> {
  const proposer = address.toString().toLowerCase();

  const [currentBlock, queryResult, candidateResult] = await Promise.all([
    getBlockNumber(CHAIN_CONFIG.publicClient),
    graphQLFetchWithFallback<ProposalQueryResult, ProposalQueryVariables>(
      CHAIN_CONFIG.subgraphUrl,
      query as any,
      { proposerAsString: proposer },
      { next: { revalidate: 0 } }
    ) as Promise<ProposalQueryResult | null>,
    graphQLFetch<CandidateQueryResult, { proposer: string }>(
      CHAIN_CONFIG.goldskyUrl.primary,
      candidateQuery as any,
      { proposer },
      { cache: "no-cache" }
    ),
  ]);

  if (!queryResult && !candidateResult) {
    console.log(`getProposalsForProposer: no proposals or candidates found - ${address}`);
    return [];
  }

  const onchainProposals: ProposerProposal[] =
    queryResult?.proposals.map((proposal) => ({
      id: Number(proposal.id),
      title: proposal.title,
      description: proposal.description ?? null,
      state: computeProposalState(proposal, currentBlock),
      kind: "proposal" as const,
      url: `/vote/${proposal.id}`,
    })) ?? [];

  const candidateProposals: ProposerProposal[] =
    candidateResult?.proposalCandidates.map((candidate) => ({
      id: candidate.id,
      title: candidate.latestVersion?.content?.title ?? "Candidate draft",
      description: candidate.latestVersion?.content?.description ?? null,
      state: ProposalState.Candidate,
      kind: "candidate" as const,
      url: candidate.slug ? `/candidates/${candidate.slug}` : undefined,
    })) ?? [];

  return [...candidateProposals, ...onchainProposals];
}
