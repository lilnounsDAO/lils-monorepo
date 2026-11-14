import { Address, parseAbi, zeroAddress } from "viem";
import { multicall } from "viem/actions";
import { CHAIN_CONFIG } from "@/config";

const erc20Abi = parseAbi(["function balanceOf(address) view returns (uint256)"]);
const payerAbi = parseAbi(["function totalDebt() view returns (uint256)"]);
const tokenBuyerAbi = parseAbi([
  "function tokenAmountNeeded() view returns (uint256)",
  "function baselinePaymentTokenAmount() view returns (uint256)",
  "function ethNeeded(uint256 additionalTokens, uint256 bufferBPs) view returns (uint256)",
  "function stethNeeded(uint256 additionalTokens, uint256 bufferBPs) view returns (uint256)",
  "function paused() view returns (bool)",
  "function ethAmountPerTokenAmount(uint256 tokenAmount) view returns (uint256)",
  "function stethAmountPerTokenAmount(uint256 tokenAmount) view returns (uint256)",
  "function tokenAmountPerEthAmount(uint256 ethAmount) view returns (uint256)",
  "function tokenAmountPerStethAmount(uint256 stethAmount) view returns (uint256)",
]);

/** Whether this chain has a Payer and TokenBuyer to fund USDC payments through. */
export const payerFundingAvailable = () =>
  CHAIN_CONFIG.addresses.lilNounsTokenBuyer !== zeroAddress && CHAIN_CONFIG.addresses.lilNounsPayer !== zeroAddress;

export interface PayerStatus {
  /** USDC the Payer holds, 6 decimals */
  payerUsdc: bigint;
  /** USDC the Payer already owes, paid in order as it's topped up */
  payerDebt: bigint;
  /** USDC the TokenBuyer aims to keep in the Payer on top of its debt */
  baseline: bigint;
  /** USDC the TokenBuyer still wants to buy, before `additionalUsdc` */
  usdcNeeded: bigint;
  /** ETH and stETH the TokenBuyer holds to sell */
  tokenBuyerEth: bigint;
  tokenBuyerSteth: bigint;
  tokenBuyerPaused: boolean;
  /** USDC of `additionalUsdc` the Payer can't pay now, so registers as debt */
  askShortfall: bigint;
  /*
   * The rest depend on a Chainlink price the TokenBuyer reads. Each is null when
   * its feed can't be read, so one feed being down leaves the other side usable,
   * the way TokenBuyerV2 itself keeps selling one asset when the other's feed is
   * stale.
   */
  /**
   * ETH or stETH to send the TokenBuyer so it refills the Payer to its target and
   * covers `additionalUsdc` too, with the buffer applied. Each assumes the other
   * asset isn't topped up; the TokenBuyer counts what it already holds first.
   */
  ethToFill: bigint | null;
  stethToFill: bigint | null;
  /** USDC the TokenBuyer's ETH and stETH buy beyond what it already needs */
  tokenBuyerSpareUsdc: bigint;
  /**
   * ETH or stETH to send the TokenBuyer so it can pay off just the debt
   * `additionalUsdc` creates, after its spare holdings, with the buffer applied.
   * Refilling the Payer's target is left to the standing TokenBuyer funding.
   */
  ethToCoverAsk: bigint | null;
  stethToCoverAsk: bigint | null;
  /** What the treasury can send */
  treasuryEth: bigint;
  treasurySteth: bigint;
}

const orNull = (r: { status: "success"; result: bigint } | { status: "failure" }): bigint | null =>
  r.status === "success" ? r.result : null;

/**
 * The Payer's USDC position and what TokenBuyerV2 needs to restore it.
 *
 * `additionalUsdc` is USDC a proposal is about to ask the Payer for, so the fill
 * amounts cover it too; `bufferBPs` pads them for price moves before execution.
 */
export async function getPayerStatus(additionalUsdc: bigint = 0n, bufferBPs: bigint = 500n): Promise<PayerStatus> {
  const { publicClient, addresses } = CHAIN_CONFIG;
  const payer = addresses.lilNounsPayer as Address;
  const tokenBuyer = addresses.lilNounsTokenBuyer as Address;
  const treasury = addresses.nounsTreasury as Address;
  const usdc = addresses.usdc as Address;
  const stEth = addresses.stEth as Address;

  // Balances, debt and need don't depend on prices; they must all succeed
  const [payerUsdc, payerDebt, baseline, usdcNeeded, tokenBuyerSteth, tokenBuyerPaused, treasurySteth] =
    await multicall(publicClient, {
      contracts: [
        { address: usdc, abi: erc20Abi, functionName: "balanceOf", args: [payer] },
        { address: payer, abi: payerAbi, functionName: "totalDebt" },
        { address: tokenBuyer, abi: tokenBuyerAbi, functionName: "baselinePaymentTokenAmount" },
        { address: tokenBuyer, abi: tokenBuyerAbi, functionName: "tokenAmountNeeded" },
        { address: stEth, abi: erc20Abi, functionName: "balanceOf", args: [tokenBuyer] },
        { address: tokenBuyer, abi: tokenBuyerAbi, functionName: "paused" },
        { address: stEth, abi: erc20Abi, functionName: "balanceOf", args: [treasury] },
      ],
      allowFailure: false,
    });
  const [tokenBuyerEth, treasuryEth] = await Promise.all([
    publicClient.getBalance({ address: tokenBuyer }),
    publicClient.getBalance({ address: treasury }),
  ]);

  // The proposal's USDC is paid first from what the Payer holds beyond its
  // debts; the rest becomes debt the TokenBuyer has to buy USDC for
  const payable = payerUsdc > payerDebt ? payerUsdc - payerDebt : 0n;
  const askShortfall = additionalUsdc > payable ? additionalUsdc - payable : 0n;

  const [ethToFill, stethToFill, ethCapacity, stethCapacity] = await multicall(publicClient, {
    contracts: [
      { address: tokenBuyer, abi: tokenBuyerAbi, functionName: "ethNeeded", args: [additionalUsdc, bufferBPs] },
      { address: tokenBuyer, abi: tokenBuyerAbi, functionName: "stethNeeded", args: [additionalUsdc, bufferBPs] },
      { address: tokenBuyer, abi: tokenBuyerAbi, functionName: "tokenAmountPerEthAmount", args: [tokenBuyerEth] },
      { address: tokenBuyer, abi: tokenBuyerAbi, functionName: "tokenAmountPerStethAmount", args: [tokenBuyerSteth] },
    ],
    allowFailure: true,
  });
  // Holdings priced by a feed that's down can't be counted on to sell
  const capacity = (orNull(ethCapacity) ?? 0n) + (orNull(stethCapacity) ?? 0n);
  const tokenBuyerSpareUsdc = capacity > usdcNeeded ? capacity - usdcNeeded : 0n;
  const uncovered = askShortfall > tokenBuyerSpareUsdc ? askShortfall - tokenBuyerSpareUsdc : 0n;

  let ethToCoverAsk: bigint | null = 0n;
  let stethToCoverAsk: bigint | null = 0n;
  if (uncovered > 0n) {
    const [eth, steth] = await multicall(publicClient, {
      contracts: [
        { address: tokenBuyer, abi: tokenBuyerAbi, functionName: "ethAmountPerTokenAmount", args: [uncovered] },
        { address: tokenBuyer, abi: tokenBuyerAbi, functionName: "stethAmountPerTokenAmount", args: [uncovered] },
      ],
      allowFailure: true,
    });
    const withBuffer = (amount: bigint | null) => (amount === null ? null : (amount * (10_000n + bufferBPs)) / 10_000n);
    ethToCoverAsk = withBuffer(orNull(eth));
    stethToCoverAsk = withBuffer(orNull(steth));
  }

  return {
    payerUsdc,
    payerDebt,
    baseline,
    usdcNeeded,
    tokenBuyerEth,
    tokenBuyerSteth,
    tokenBuyerPaused,
    askShortfall,
    ethToFill: orNull(ethToFill),
    stethToFill: orNull(stethToFill),
    tokenBuyerSpareUsdc,
    ethToCoverAsk,
    stethToCoverAsk,
    treasuryEth,
    treasurySteth,
  };
}
