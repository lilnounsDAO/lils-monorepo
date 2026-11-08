/**
 * The typed data a wallet signs to open a round, propose or vote.
 *
 * Must match services/rounds-api/src/eip712.mjs. Long text is committed to by
 * its keccak hash rather than inlined, so the wallet prompt stays readable while
 * the exact bytes are still pinned: editing a proposal body after signing fails
 * the service's check.
 */
import { keccak256, stringToBytes, Hex } from "viem";
import { BallotAllocation, RoundAwardInput } from "./types";

export const ROUNDS_DOMAIN_NAME = "Lil Nouns Rounds";
export const ROUNDS_DOMAIN_VERSION = "1";

export function roundsDomain(chainId: number) {
  return { name: ROUNDS_DOMAIN_NAME, version: ROUNDS_DOMAIN_VERSION, chainId } as const;
}

export const ROUND_TYPES = {
  Round: [
    { name: "handle", type: "string" },
    { name: "name", type: "string" },
    { name: "description", type: "string" },
    { name: "contentHash", type: "bytes32" },
    { name: "awardsHash", type: "bytes32" },
    { name: "startAt", type: "uint64" },
    { name: "votingStartAt", type: "uint64" },
    { name: "endAt", type: "uint64" },
    { name: "creator", type: "address" },
    { name: "issued", type: "uint64" },
    { name: "nonce", type: "string" },
  ],
} as const;

export const PROPOSAL_TYPES = {
  Proposal: [
    { name: "round", type: "string" },
    { name: "title", type: "string" },
    { name: "tldr", type: "string" },
    { name: "contentHash", type: "bytes32" },
    { name: "author", type: "address" },
    { name: "issued", type: "uint64" },
    { name: "nonce", type: "string" },
  ],
} as const;

export const VOTE_TYPES = {
  Vote: [
    { name: "round", type: "string" },
    { name: "votes", type: "string" },
    { name: "voter", type: "address" },
    { name: "issued", type: "uint64" },
    { name: "nonce", type: "string" },
  ],
} as const;

export function hashText(text: string | undefined): Hex {
  return keccak256(stringToBytes(text ?? ""));
}

/** `proposalId:weight` pairs, sorted by id so the order the UI collected them in doesn't matter. */
export function encodeBallot(allocations: BallotAllocation[]): string {
  return [...allocations]
    .map(({ proposal, votes }) => [Number(proposal), BigInt(votes)] as const)
    .sort((a, b) => a[0] - b[0])
    .map(([proposal, votes]) => `${proposal}:${votes}`)
    .join(",");
}

/** Awards are committed to as a whole, so the prizes can't change after signing. */
export function encodeAwards(awards: RoundAwardInput[]): string {
  return JSON.stringify(
    [...awards]
      .sort((a, b) => a.place - b.place)
      .map((award) => ({
        place: Number(award.place),
        value: String(award.value),
        asset: {
          name: award.asset.name,
          decimals: Number(award.asset.decimals),
          chainId: Number(award.asset.chainId),
          address: String(award.asset.address).toLowerCase(),
          tokenId: award.asset.tokenId == null ? null : String(award.asset.tokenId),
        },
      })),
  );
}

/** A nonce the service will refuse a second time. */
export function roundsNonce(): string {
  return crypto.randomUUID();
}

export function issuedNow(): number {
  return Math.floor(Date.now() / 1000);
}
