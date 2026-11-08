import { formatUnits, isAddress } from "viem";
import { formatNumber } from "@/utils/format";
import { Round, RoundAward, RoundState } from "@/data/rounds/types";

export const ROUND_STATE_LABEL: Record<RoundState, string> = {
  pending: "Starting soon",
  proposing: "Accepting proposals",
  voting: "Voting open",
  ended: "Round ended",
};

export function isRoundOpen(round: Round): boolean {
  return round.state === "proposing" || round.state === "voting";
}

/** An imported round is history: it can be read, but not proposed to or voted on. */
export function isArchivedRound(round: Round): boolean {
  return round.source !== "lilnouns";
}

export function ordinal(place: number): string {
  const suffix = ["th", "st", "nd", "rd"][
    place % 100 >= 11 && place % 100 <= 13 ? 0 : Math.min(place % 10, 4) % 4
  ];
  return `${place}${suffix}`;
}

/** "0.33 ETH" from an award's base units and its asset's decimals. */
export function formatAward(award: Pick<RoundAward, "value" | "asset">): string {
  const { value, asset } = award;
  if (asset.tokenId != null) return `${asset.symbol ?? asset.name} #${asset.tokenId}`;
  const amount = Number(formatUnits(BigInt(value), asset.decimals));
  const unit = asset.symbol ?? (asset.name === "Ethereum" ? "ETH" : asset.name);
  return `${formatNumber({ input: amount, maxFractionDigits: amount < 1 ? 3 : 2 })} ${unit}`;
}

/** The total on offer, grouped by asset so mixed prize pools still read correctly. */
export function formatAwardTotal(awards: RoundAward[]): string {
  const totals = new Map<string, { value: bigint; asset: RoundAward["asset"] }>();
  for (const award of awards) {
    const key = `${award.asset.address}-${award.asset.tokenId ?? ""}`;
    const current = totals.get(key);
    totals.set(key, {
      value: (current?.value ?? 0n) + BigInt(award.value),
      asset: award.asset,
    });
  }
  const parts = [...totals.values()].map(({ value, asset }) =>
    asset.tokenId != null
      ? `${awards.length} ${asset.symbol ?? asset.name}`
      : formatAward({ value: String(value), asset }),
  );
  return parts.join(" + ");
}

/** A round's dates as a single line, e.g. "28 Aug – 19 Sep 2025". */
export function formatRoundDates(round: Round): string {
  const start = new Date(round.startAt);
  const end = new Date(round.endAt);
  const sameYear = start.getUTCFullYear() === end.getUTCFullYear();
  const day = (date: Date, withYear: boolean) =>
    Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      year: withYear ? "numeric" : undefined,
      timeZone: "UTC",
    }).format(date);
  return `${day(start, !sameYear)} – ${day(end, true)}`;
}

export interface RoundActor {
  /** Set when the actor is a wallet, so ENS can resolve it. */
  address?: `0x${string}`;
  name: string | null;
  image: string | null;
}

/**
 * Imported rounds carry a `<platform>:<id>` key and a display name where the old
 * platform had no wallet on file, so the UI falls back to that name.
 */
export function toRoundActor(
  key: string | undefined,
  name?: string | null,
  image?: string | null,
): RoundActor {
  if (key && isAddress(key)) return { address: key, name: name ?? null, image: image ?? null };
  return { name: name ?? (key ? key.split(":").slice(1).join(":") : null), image: image ?? null };
}

/**
 * Gold, silver and bronze for the top three places, so a winning proposal reads
 * as one at a glance. Fourth and beyond get the plain treatment: a round can
 * have twenty awards, and twenty highlighted cards highlight nothing.
 */
export const PODIUM = {
  1: {
    card: "border-[#D9A441] bg-[#D9A441]/[0.06]",
    badge: "bg-[#D9A441] text-[#2B1D00]",
  },
  2: {
    card: "border-[#9BA3AC] bg-[#9BA3AC]/[0.06]",
    badge: "bg-[#9BA3AC] text-[#15181C]",
  },
  3: {
    card: "border-[#B4703A] bg-[#B4703A]/[0.06]",
    badge: "bg-[#B4703A] text-[#2B1403]",
  },
} as const;

export function podiumStyle(place: number | null | undefined) {
  return place === 1 || place === 2 || place === 3 ? PODIUM[place] : null;
}

