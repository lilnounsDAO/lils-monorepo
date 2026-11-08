/**
 * EIP-712 payloads for round writes.
 *
 * Must match apps/web/src/data/rounds/eip712.ts. Every field a signer sees is in
 * the typed data, so the service can only store what the wallet actually agreed
 * to: long text is committed to by its keccak hash rather than inlined, which
 * keeps wallet prompts readable while still pinning the exact bytes.
 */
import { keccak256, stringToBytes } from "viem";

export const DOMAIN_NAME = "Lil Nouns Rounds";
export const DOMAIN_VERSION = "1";

export function domain(chainId) {
  return { name: DOMAIN_NAME, version: DOMAIN_VERSION, chainId };
}

export const TYPES = {
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
  Proposal: [
    { name: "round", type: "string" },
    { name: "title", type: "string" },
    { name: "tldr", type: "string" },
    { name: "contentHash", type: "bytes32" },
    { name: "author", type: "address" },
    { name: "issued", type: "uint64" },
    { name: "nonce", type: "string" },
  ],
  Vote: [
    { name: "round", type: "string" },
    { name: "votes", type: "string" },
    { name: "voter", type: "address" },
    { name: "issued", type: "uint64" },
    { name: "nonce", type: "string" },
  ],
};

export function hashText(text) {
  return keccak256(stringToBytes(text ?? ""));
}

/**
 * The ballot a voter signs: `proposalId:weight` pairs, sorted by id so the
 * string is the same whatever order the UI collected them in.
 */
export function encodeBallot(allocations) {
  return [...allocations]
    .map(({ proposal, votes }) => [Number(proposal), BigInt(votes)])
    .sort((a, b) => a[0] - b[0])
    .map(([proposal, votes]) => `${proposal}:${votes}`)
    .join(",");
}

/** Awards are committed to as a whole, so prizes can't be edited after signing. */
export function encodeAwards(awards) {
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
