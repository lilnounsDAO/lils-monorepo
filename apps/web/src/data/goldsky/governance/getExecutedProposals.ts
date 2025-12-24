
import { graphQLFetch } from "@/data/utils/graphQLFetch";
import { CHAIN_CONFIG } from "@/config";
import { Proposal } from "@/data/generated/goldsky/graphql";
import { ProposalState } from "@/utils/types";
import { getBlockNumber } from "viem/actions";
import { getProposalState } from "./proposalStateParser";
import { mapGoldskyProposalToOverview } from "./common";

const query = `
  query GetExecutedProposals {
    proposals(
      first: 1000
      orderBy: id
      orderDirection: desc
      where: { status: "EXECUTED" }
    ) {
      id
      title
      proposer {
        id
      }
      quorumVotes
      forVotes
      againstVotes
      abstainVotes
      status
      createdBlock
      startBlock
      endBlock
      executionETA
      createdTimestamp
    }
  }
`;

interface ExecutedProposalsResponse {
  proposals: Proposal[];
}

export interface ExecutedProposal {
  id: string;
  title: string;
  proposerAddress: string;
  forVotes: string;
  againstVotes: string;
  abstainVotes: string;
  quorumVotes: string;
  status: string;
  creationBlock: string;
  votingStartBlock: string;
  votingEndBlock: string;
  executionEtaTimestamp?: string;
  state: ProposalState;
}


export async function getExecutedProposals(): Promise<ExecutedProposal[]> {
  try {
    const blockNumber = Number(await getBlockNumber(CHAIN_CONFIG.publicClient));
    const blockTimestamp = new Date();
    
    const data = await graphQLFetch(
      CHAIN_CONFIG.goldskyUrl.primary,
      query,
      {},
      {
        cache: "no-cache",
      },
    ) as ExecutedProposalsResponse;

    if (!data?.proposals) {
      return [];
    }

    return data.proposals.map((proposal) => {
      const state = getProposalState(blockNumber, blockTimestamp, {
        status: proposal.status,
        startBlock: proposal.startBlock,
        endBlock: proposal.endBlock,
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        quorumVotes: proposal.quorumVotes,
        executionETA: proposal.executionETA,
      });
      
      return {
        id: proposal.id,
        title: proposal.title,
        proposerAddress: proposal.proposer.id,
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        abstainVotes: proposal.abstainVotes,
        quorumVotes: proposal.quorumVotes,
        status: proposal.status,
        creationBlock: proposal.createdBlock,
        votingStartBlock: proposal.startBlock,
        votingEndBlock: proposal.endBlock,
        executionEtaTimestamp: proposal.executionETA,
        state,
      };
    });
  } catch (error) {
    console.error('Failed to fetch executed proposals from Goldsky:', error);
    throw error;
  }
}