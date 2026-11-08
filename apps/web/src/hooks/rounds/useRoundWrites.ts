"use client";
import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAccount, useSignTypedData } from "wagmi";
import { CHAIN_CONFIG } from "@/config";
import {
  PROPOSAL_TYPES,
  ROUND_TYPES,
  VOTE_TYPES,
  encodeAwards,
  encodeBallot,
  hashText,
  issuedNow,
  roundsDomain,
  roundsNonce,
} from "@/data/rounds/eip712";
import {
  castRoundVotes,
  createRound,
  createRoundProposal,
  updateRoundProposal,
} from "@/data/rounds/client";
import { BallotAllocation, RoundAwardInput, Round } from "@/data/rounds/types";

/**
 * Writes are one wallet signature each: nothing is sent until the wallet has
 * signed the exact fields the service will check, and the queries a write
 * affects are invalidated once it lands.
 */
function useRoundsSigner() {
  const { address } = useAccount();
  const { signTypedDataAsync } = useSignTypedData();
  const domain = roundsDomain(CHAIN_CONFIG.chain.id);

  const requireAddress = useCallback(() => {
    if (!address) throw new Error("Connect a wallet first.");
    return address;
  }, [address]);

  return { address, domain, signTypedDataAsync, requireAddress };
}

export interface CreateRoundInput {
  handle: string;
  name: string;
  description: string;
  content: string;
  image?: string | null;
  startAt: Date;
  votingStartAt: Date;
  endAt: Date;
  awards: RoundAwardInput[];
  proposeStrategy?: Round["proposeStrategy"];
  voteStrategy?: Round["voteStrategy"];
}

export function useCreateRound() {
  const queryClient = useQueryClient();
  const { domain, signTypedDataAsync, requireAddress } = useRoundsSigner();

  return useMutation({
    mutationFn: async (input: CreateRoundInput) => {
      const creator = requireAddress();
      const issued = issuedNow();
      const nonce = roundsNonce();
      const message = {
        handle: input.handle,
        name: input.name.trim(),
        description: input.description.trim(),
        contentHash: hashText(input.content.trim()),
        awardsHash: hashText(encodeAwards(input.awards)),
        startAt: BigInt(Math.floor(input.startAt.getTime() / 1000)),
        votingStartAt: BigInt(Math.floor(input.votingStartAt.getTime() / 1000)),
        endAt: BigInt(Math.floor(input.endAt.getTime() / 1000)),
        creator,
        issued: BigInt(issued),
        nonce,
      } as const;

      const signature = await signTypedDataAsync({
        domain,
        types: ROUND_TYPES,
        primaryType: "Round",
        message,
      });

      return createRound({
        handle: input.handle,
        name: message.name,
        description: message.description,
        content: input.content.trim(),
        image: input.image ?? null,
        startAt: input.startAt.toISOString(),
        votingStartAt: input.votingStartAt.toISOString(),
        endAt: input.endAt.toISOString(),
        awards: input.awards,
        proposeStrategy: input.proposeStrategy,
        voteStrategy: input.voteStrategy,
        signer: creator,
        signature,
        issued,
        nonce,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rounds"] });
      queryClient.invalidateQueries({ queryKey: ["round-house"] });
    },
  });
}

export interface RoundProposalInput {
  handle: string;
  title: string;
  tldr: string;
  content: string;
  /** Set to edit an existing proposal instead of adding one. */
  proposalId?: number;
}

export function useSubmitRoundProposal() {
  const queryClient = useQueryClient();
  const { domain, signTypedDataAsync, requireAddress } = useRoundsSigner();

  return useMutation({
    mutationFn: async (input: RoundProposalInput) => {
      const author = requireAddress();
      const issued = issuedNow();
      const nonce = roundsNonce();
      const title = input.title.trim();
      const tldr = input.tldr.trim();
      const content = input.content.trim();

      const signature = await signTypedDataAsync({
        domain,
        types: PROPOSAL_TYPES,
        primaryType: "Proposal",
        message: {
          round: input.handle,
          title,
          tldr,
          contentHash: hashText(content),
          author,
          issued: BigInt(issued),
          nonce,
        },
      });

      const body = { title, tldr, content, signer: author, signature, issued, nonce };
      return input.proposalId
        ? updateRoundProposal(input.proposalId, body)
        : createRoundProposal(input.handle, body);
    },
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: ["round", input.handle] });
      queryClient.invalidateQueries({ queryKey: ["round-activity", input.handle] });
      queryClient.invalidateQueries({ queryKey: ["round-power", input.handle] });
    },
  });
}

export interface CastVotesInput {
  handle: string;
  votes: BallotAllocation[];
}

export function useCastRoundVotes() {
  const queryClient = useQueryClient();
  const { domain, signTypedDataAsync, requireAddress } = useRoundsSigner();

  return useMutation({
    mutationFn: async (input: CastVotesInput) => {
      const voter = requireAddress();
      const issued = issuedNow();
      const nonce = roundsNonce();
      // One signature covers the whole ballot, so spreading votes over several
      // proposals is still a single wallet prompt.
      const signature = await signTypedDataAsync({
        domain,
        types: VOTE_TYPES,
        primaryType: "Vote",
        message: {
          round: input.handle,
          votes: encodeBallot(input.votes),
          voter,
          issued: BigInt(issued),
          nonce,
        },
      });

      return castRoundVotes(input.handle, {
        votes: input.votes,
        signer: voter,
        signature,
        issued,
        nonce,
      });
    },
    onSuccess: (_result, input) => {
      queryClient.invalidateQueries({ queryKey: ["round", input.handle] });
      queryClient.invalidateQueries({ queryKey: ["round-activity", input.handle] });
      queryClient.invalidateQueries({ queryKey: ["round-power", input.handle] });
    },
  });
}
