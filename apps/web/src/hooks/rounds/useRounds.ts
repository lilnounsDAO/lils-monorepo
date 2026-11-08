"use client";
import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import {
  RoundsQuery,
  getRound,
  getRoundActivity,
  getRoundHouse,
  getRoundPower,
  getRoundProposal,
  getRounds,
  hasRoundsApi,
} from "@/data/rounds/client";

/** A live round changes under the reader, so open rounds poll. */
const LIVE_POLL_MS = 30_000;

export function useRoundsList(query: RoundsQuery = {}) {
  return useQuery({
    queryKey: ["rounds", query],
    queryFn: () => getRounds(query),
    enabled: hasRoundsApi(),
    staleTime: 20_000,
    gcTime: 10 * 60_000,
  });
}

export function useRound(handle: string | undefined) {
  return useQuery({
    queryKey: ["round", handle],
    queryFn: () => getRound(handle!),
    enabled: hasRoundsApi() && Boolean(handle),
    staleTime: 10_000,
    refetchInterval: (query) =>
      query.state.data?.round.state === "proposing" || query.state.data?.round.state === "voting"
        ? LIVE_POLL_MS
        : false,
  });
}

export function useRoundActivity(handle: string | undefined, limit = 50) {
  return useQuery({
    queryKey: ["round-activity", handle, limit],
    queryFn: () => getRoundActivity(handle!, limit),
    enabled: hasRoundsApi() && Boolean(handle),
    staleTime: 10_000,
  });
}

/** What the connected wallet may do in this round. Refetched after every write. */
export function useRoundPower(handle: string | undefined) {
  const { address } = useAccount();
  return useQuery({
    queryKey: ["round-power", handle, address],
    queryFn: () => getRoundPower(handle!, address!),
    enabled: hasRoundsApi() && Boolean(handle) && Boolean(address),
    staleTime: 10_000,
  });
}

export function useRoundProposal(id: number | undefined) {
  return useQuery({
    queryKey: ["round-proposal", id],
    queryFn: () => getRoundProposal(id!),
    enabled: hasRoundsApi() && Boolean(id),
    staleTime: 10_000,
  });
}

export function useRoundHouse() {
  return useQuery({
    queryKey: ["round-house"],
    queryFn: getRoundHouse,
    enabled: hasRoundsApi(),
    staleTime: 5 * 60_000,
  });
}
