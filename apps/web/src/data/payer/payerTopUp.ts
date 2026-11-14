import { formatUnits, parseEther } from "viem";
import type { Action, PayerTopUpAction } from "@/types/proposal-editor";
import { PayerStatus } from "./getPayerStatus";

/** Round a wei amount up to 4 decimals, so a top-up never comes in just short. */
export const roundUpEther = (wei: bigint) => {
  const step = 10n ** 14n;
  return formatUnits(((wei + step - 1n) / step) * step, 18);
};

const toWei = (amount: string) => {
  try {
    return parseEther(amount || "0");
  } catch {
    return 0n;
  }
};

export type TopUpPlan =
  /** The Payer can pay, or the TokenBuyer or the proposal's top-ups already cover the debt */
  | { kind: "covered" }
  /** Add `topUp`, or raise the proposal's top-up at `index` to it */
  | { kind: "add"; topUp: PayerTopUpAction; index?: number; previous?: PayerTopUpAction }
  /** The debt needs funding, but the TokenBuyer's price feed for every usable asset is down */
  | { kind: "unpriced" };

/**
 * What the proposal's top-ups need to be for the TokenBuyer to pay off the debt
 * its USDC asks create (`status` must be read with those asks as the additional
 * USDC). Top-ups already in `actions` count, summed per currency; a shortfall is
 * met by raising the first top-up of the currency in use, stETH by default as
 * the treasury mostly holds stETH, falling back to ETH if stETH can't be priced.
 *
 * It sizes only the debt: refilling the Payer's standing target is left to the
 * TokenBuyer's own funding (Fill on a top-up action covers that on purpose).
 */
export function planTopUp(status: PayerStatus, actions: Action[]): TopUpPlan {
  if (status.askShortfall === 0n) return { kind: "covered" };
  const topUps = actions
    .map((action, index) => ({ action, index }))
    .filter((t): t is { action: PayerTopUpAction; index: number } => t.action.type === "payer-top-up");
  const existingCurrency = topUps.find((t) => t.action.currency === "steth")?.action.currency ?? topUps[0]?.action.currency;

  const preference: ("steth" | "eth")[] = existingCurrency === "eth" ? ["eth", "steth"] : ["steth", "eth"];
  for (const currency of preference) {
    const needed = currency === "eth" ? status.ethToCoverAsk : status.stethToCoverAsk;
    if (needed === null) continue; // this side's price feed is down
    if (needed === 0n) return { kind: "covered" };
    const sameCurrency = topUps.filter((t) => t.action.currency === currency);
    const have = sameCurrency.reduce((sum, t) => sum + toWei(t.action.amount), 0n);
    if (have >= needed) return { kind: "covered" };
    // Raise the first top-up of this currency so all of them together reach `needed`
    const first = sameCurrency[0];
    const othersHave = have - (first ? toWei(first.action.amount) : 0n);
    const amount = roundUpEther(needed - othersHave);
    return {
      kind: "add",
      topUp: { type: "payer-top-up", amount, currency },
      index: first?.index,
      previous: first?.action,
    };
  }
  return { kind: "unpriced" };
}

/** The actions with `plan` applied: the top-up raised in place, or added last. */
export function applyTopUp(actions: Action[], plan: TopUpPlan): Action[] {
  if (plan.kind !== "add") return actions;
  const next = [...actions];
  if (plan.index !== undefined) next[plan.index] = plan.topUp;
  else next.push(plan.topUp);
  return next;
}
