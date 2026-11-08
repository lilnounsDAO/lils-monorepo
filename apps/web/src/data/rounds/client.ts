/**
 * Client for the rounds service (services/rounds-api).
 *
 * Reads are plain GETs. Writes carry an EIP-712 signature over the same fields,
 * so the service needs no session of its own — see eip712.ts.
 */
import { Address } from "viem";
import {
  BallotAllocation,
  ProposalVotes,
  Round,
  RoundActivityEvent,
  RoundAwardInput,
  RoundHouse,
  RoundHouseTotals,
  RoundPower,
  RoundProposal,
  RoundState,
} from "./types";

const BASE = (import.meta.env.VITE_ROUNDS_API_URL ?? "").replace(/\/$/, "");

/** False when no rounds service is configured; the pages say so instead of showing nothing. */
export function hasRoundsApi(): boolean {
  return BASE.length > 0;
}

export class RoundsApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "RoundsApiError";
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!hasRoundsApi()) {
    throw new RoundsApiError(503, "Rounds are not available in this environment.");
  }
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...(init?.body ? { "content-type": "application/json" } : {}), ...init?.headers },
  });
  const body = await response.json().catch(() => ({}) as Record<string, unknown>);
  if (!response.ok) {
    throw new RoundsApiError(
      response.status,
      typeof body.error === "string" ? body.error : "Something went wrong. Try again.",
    );
  }
  return body as T;
}

// ---------------------------------------------------------------------------
// Reads

export interface RoundsQuery {
  /** `open` covers both proposing and voting. */
  state?: RoundState | "open";
  house?: string;
  search?: string;
  limit?: number;
  cursor?: string | null;
}

export interface RoundsPage {
  rounds: Round[];
  nextCursor: string | null;
}

export function getRounds(query: RoundsQuery = {}): Promise<RoundsPage> {
  const params = new URLSearchParams();
  if (query.state) params.set("state", query.state);
  if (query.house) params.set("house", query.house);
  if (query.search) params.set("q", query.search);
  if (query.limit) params.set("limit", String(query.limit));
  if (query.cursor) params.set("cursor", query.cursor);
  const search = params.toString();
  return request<RoundsPage>(`/rounds${search ? `?${search}` : ""}`);
}

export function getRound(handle: string): Promise<{ round: Round; proposals: RoundProposal[] }> {
  return request(`/rounds/${encodeURIComponent(handle)}`);
}

export function getRoundActivity(
  handle: string,
  limit = 50,
): Promise<{ events: RoundActivityEvent[] }> {
  return request(`/rounds/${encodeURIComponent(handle)}/activity?limit=${limit}`);
}

export function getRoundPower(handle: string, address: Address): Promise<RoundPower> {
  return request(`/rounds/${encodeURIComponent(handle)}/power/${address}`);
}

export function getRoundProposal(id: number): Promise<{ proposal: RoundProposal }> {
  return request(`/proposals/${id}`);
}

export function getRoundHouse(): Promise<{ house: RoundHouse; totals: RoundHouseTotals }> {
  return request("/house");
}

// ---------------------------------------------------------------------------
// Writes

interface SignedRequest {
  signer: Address;
  signature: string;
  issued: number;
  nonce: string;
}

export interface CreateRoundRequest extends SignedRequest {
  handle: string;
  name: string;
  description: string;
  content: string;
  image?: string | null;
  startAt: string;
  votingStartAt: string;
  endAt: string;
  awards: RoundAwardInput[];
  proposeStrategy?: Round["proposeStrategy"];
  voteStrategy?: Round["voteStrategy"];
}

export function createRound(body: CreateRoundRequest): Promise<{ handle: string }> {
  return request("/rounds", { method: "POST", body: JSON.stringify(body) });
}

export interface RoundProposalRequest extends SignedRequest {
  title: string;
  tldr: string;
  content: string;
}

export function createRoundProposal(
  handle: string,
  body: RoundProposalRequest,
): Promise<{ id: number }> {
  return request(`/rounds/${encodeURIComponent(handle)}/proposals`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateRoundProposal(
  id: number,
  body: RoundProposalRequest,
): Promise<{ id: number }> {
  return request(`/proposals/${id}`, { method: "PUT", body: JSON.stringify(body) });
}

export interface CastVotesRequest extends SignedRequest {
  votes: BallotAllocation[];
}

export function castRoundVotes(
  handle: string,
  body: CastVotesRequest,
): Promise<{ votesRemaining: string }> {
  return request(`/rounds/${encodeURIComponent(handle)}/votes`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getRoundProposalVotes(id: number, limit = 200): Promise<ProposalVotes> {
  return request(`/proposals/${id}/votes?limit=${limit}`);
}
