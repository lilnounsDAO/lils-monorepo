import { ProposalTransaction, ProposalState } from "@/data/goldsky/governance/common";
import {
  DrawerDialog,
  DrawerDialogContent,
  DrawerDialogContentInner,
  DrawerDialogTitle,
  DrawerDialogTrigger,
} from "../ui/DrawerDialog";
import {
  decodeAbiParameters,
  parseAbi,
  AbiFunction,
  Address,
  getAddress,
  isAddressEqual,
} from "viem";
import { LinkExternal } from "../ui/link";
import { CHAIN_CONFIG } from "@/config";
import { getExplorerLink } from "@/utils/blockExplorer";
import { EnsName } from "../EnsName";
import { formatTokenAmount } from "@/utils/utils";
import { useTenderlySimulationForTransactions } from "@/hooks/useTenderlySimulationForTransactions";
import { ContractNameDisplay } from "./ContractNameDisplay";
import { Button } from "../ui/button";
import { Copy, Check } from "lucide-react";
import { useState } from "react";

interface ProposalTransactionSummaryProps {
  transactions: ProposalTransaction[];
  proposalState?: ProposalState;
}

/**
 * Check if proposal state allows simulation
 * Only simulate for proposals that can still execute: pending, active, or queued
 */
function shouldSimulate(state?: ProposalState): boolean {
  if (!state) return false;
  const normalizedState = state.toLowerCase();
  return normalizedState === "pending" || normalizedState === "active" || normalizedState === "queued";
}

export default function ProposalTransactionSummary({
  transactions,
  proposalState,
}: ProposalTransactionSummaryProps) {
  const [copied, setCopied] = useState(false);

  // Handle undefined or empty transactions
  if (!transactions || transactions.length === 0) {
    return null;
  }

  // Only simulate if proposal is in a state where it can still execute
  const enableSimulation = shouldSimulate(proposalState);

  // Tenderly simulation hook (only enabled for pending/active/queued proposals)
  const {
    data: simulationResults,
    isLoading: isSimulating
  } = useTenderlySimulationForTransactions(transactions, enableSimulation)

  const decodedTransactions = transactions.map(decodeTransaction);
  const summary = parseDecodedTransactionsSummary(decodedTransactions);

  const handleCopyActions = async () => {
    try {
      // Convert transactions to JSON format
      const actionsJson = JSON.stringify(
        transactions.map((tx) => ({
          to: tx.to,
          value: tx.value.toString(),
          signature: tx.signature,
          calldata: tx.calldata,
        })),
        null,
        2
      );
      
      await navigator.clipboard.writeText(actionsJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy actions:", error);
    }
  };

  // Helper to get simulation status for a transaction
  const getSimulationStatus = (index: number): 'idle' | 'simulating' | 'success' | 'error' => {
    // Don't show simulation status if simulation is disabled
    if (!enableSimulation) {
      return 'idle'
    }

    if (!simulationResults || isSimulating) {
      return 'simulating'
    }

    const result = simulationResults[index]
    if (!result) return 'idle'
    if (result.success) return 'success'
    return 'error'
  }

  // Helper to get error message for a transaction
  const getSimulationError = (index: number): string | undefined => {
    if (!simulationResults) return undefined
    const result = simulationResults[index]
    if (result && !result.success && result.error) {
      return result.error
    }
    return undefined
  }

  return (
    <DrawerDialog>
      <DrawerDialogTrigger className="flex items-center justify-between gap-3 rounded-[12px] bg-gray-100 px-6 py-4 transition-colors hover:brightness-95">
        <span className="whitespace-normal text-start">
          {summary != undefined ? (
            <>
              Requesting <b>{summary}</b>
            </>
          ) : (
            `${decodedTransactions.length} transaction${decodedTransactions.length > 1 ? "s" : ""}`
          )}
        </span>
        <span className="underline label-md">Details</span>
      </DrawerDialogTrigger>
      <DrawerDialogContent className="gap-0 md:max-w-[min(720px,95%)]">
        <div className="flex items-center justify-between w-full p-6 pb-2 border-b border-content-tertiary pr-20">
          <DrawerDialogTitle className="heading-4">
          Transactions
        </DrawerDialogTitle>
          <Button
            variant="ghost"
            size="fit"
            onClick={handleCopyActions}
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-md shadow-sm"
          >
            {copied ? (
              <>
                <Check size={16} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Actions
              </>
            )}
          </Button>
        </div>
        <DrawerDialogContentInner className="gap-6 overflow-y-auto">
          <div className="flex w-full min-w-0 flex-col gap-6">
            {decodedTransactions.map((tx, i) => {
              const simulationStatus = getSimulationStatus(i)
              const simulationError = getSimulationError(i)
              
              return (
                <div
                  key={i}
                  className="flex min-h-fit w-full min-w-0 flex-col gap-2 overflow-x-auto rounded-[12px] border bg-gray-100 px-6 py-4"
                >
                  <div className="flex gap-2 relative">
                    <div>{i}.</div>
                    <div className="flex whitespace-pre-wrap flex-1">
                      <DecodedTransactionRenderer {...tx} />
                    </div>
                    
                    {/* Simulation Status Indicator */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {simulationStatus === 'simulating' && (
                        <div className="w-4 h-4 text-gray-400 animate-spin">
                          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full">
                            <circle
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                              strokeDasharray="32"
                              strokeDashoffset="8"
                            />
                          </svg>
                        </div>
                      )}
                      
                      {simulationStatus === 'success' && (
                        <div className="w-4 h-4 text-green-500">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                      
                      {simulationStatus === 'error' && (
                        <div className="w-4 h-4 text-red-500">
                          <svg fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Simulation Error Message */}
                  {simulationError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                      <strong>Simulation failed:</strong> {simulationError}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </DrawerDialogContentInner>
      </DrawerDialogContent>
    </DrawerDialog>
  );
}

interface DecodedTransaction {
  to: Address;
  functionName: string;
  args: {
    type: "address" | "uint256" | string;
    value: string | Address | bigint | number;
  }[];
  value: bigint;
}

function decodeTransaction(
  transaction: ProposalTransaction,
): DecodedTransaction {
  let functionName: string;
  let args: DecodedTransaction["args"];

  if (transaction.signature == "") {
    // ETH transfer
    functionName = "transfer";
    args = [{ type: "uint256", value: transaction.value }];
  } else {
    functionName = transaction.signature.split("(")[0];
    const functionSignature = `function ${transaction.signature}`;
    const abi = parseAbi([functionSignature])[0] as AbiFunction;

    let decoded: (string | Address | bigint | number)[];
    try {
      decoded = decodeAbiParameters(abi.inputs, transaction.calldata) as (
        | string
        | Address
        | bigint
        | number
      )[];
    } catch (e) {
      decoded = Array(abi.inputs.length).fill("decodeError");
    }

    args = decoded.map((value, i) => ({
      type: abi.inputs[i].type,
      value,
    }));
  }

  return { to: transaction.to, functionName, args, value: transaction.value };
}

function DecodedTransactionRenderer({
  to,
  functionName,
  args,
  value,
}: DecodedTransaction) {
  return (
    <div>
      <div className="flex">
        <ContractNameDisplay address={to} />
        .{functionName}({args.length == 0 && ")"}
      </div>
      {args.map((param, i) => (
        <div className="flex pl-4" key={i}>
          <FunctionArgumentRenderer {...param} />
          {i != args.length - 1 && ","}
        </div>
      ))}
      {args.length > 0 && <div>)</div>}
    </div>
  );
}

function FunctionArgumentRenderer({
  type,
  value,
}: DecodedTransaction["args"][0]) {
  switch (type) {
    case "address":
      return (
        <LinkExternal
          href={getExplorerLink(value as Address)}
          className="underline transition-colors hover:text-content-secondary"
        >
          <EnsName address={getAddress(value as string)} />
        </LinkExternal>
      );
    default:
      return <>{value.toString()}</>;
  }
}

function parseErc20Amount(
  tx: DecodedTransaction,
  erc20Address: Address,
): bigint {
  if (!isAddressEqual(tx.to, erc20Address)) {
    return BigInt(0);
  } else if (tx.functionName == "transfer") {
    return tx.args[1].value as bigint;
  } else if (
    tx.functionName == "transferFrom" &&
    tx.args[0]?.type == "address" &&
    isAddressEqual(
      getAddress(tx.args[0]!.value as string),
      CHAIN_CONFIG.addresses.nounsTreasury,
    )
  ) {
    return tx.args[1].value as bigint;
  } else {
    return BigInt(0);
  }
}

function parseDecodedTransactionsSummary(
  transactions: DecodedTransaction[],
): string | undefined {
  const items: string[] = [];

  let totalEth: bigint = BigInt(0);
  let totalUsdc: bigint = BigInt(0);
  let totalWeth: bigint = BigInt(0);
  let totalStEth: bigint = BigInt(0);
  const nounIds: number[] = [];

  try {
    for (const tx of transactions) {
      if (tx.functionName == "transfer") {
        totalEth += tx.value;
      }

      totalUsdc += parseErc20Amount(tx, CHAIN_CONFIG.addresses.usdc);
      totalWeth += parseErc20Amount(
        tx,
        CHAIN_CONFIG.addresses.wrappedNativeToken,
      );
      totalStEth += parseErc20Amount(tx, CHAIN_CONFIG.addresses.stEth);

      if (
        isAddressEqual(tx.to, CHAIN_CONFIG.addresses.nounsPayer) &&
        tx.functionName == "sendOrRegisterDebt"
      ) {
        totalUsdc += tx.args[1].value as bigint;
      } else if (
        isAddressEqual(tx.to, CHAIN_CONFIG.addresses.nounsToken) &&
        (tx.functionName == "safeTransferFrom" ||
          tx.functionName == "transferFrom") &&
        tx.args[0]?.type == "address" &&
        isAddressEqual(
          getAddress(tx.args[0]!.value as string),
          CHAIN_CONFIG.addresses.nounsTreasury,
        )
      ) {
        nounIds.push(Number(tx.args[2].value));
      }
    }
  } catch (e) {
    console.log("Error parsing tx summary", e);
  }

  if (totalEth > BigInt(0)) {
    items.push(`${formatTokenAmount(totalEth, 18)} ETH`);
  }

  if (totalWeth > BigInt(0)) {
    items.push(`${formatTokenAmount(totalWeth, 18)} WETH`);
  }

  if (totalStEth > BigInt(0)) {
    items.push(`${formatTokenAmount(totalStEth, 18)} stETH`);
  }

  if (totalUsdc > BigInt(0)) {
    items.push(`${formatTokenAmount(totalUsdc, 6)} USDC`);
  }

  if (nounIds.length > 0) {
    items.push(
      nounIds.length == 1 ? `Nouns ${nounIds[0]}` : `${nounIds.length} Nouns`,
    );
  }

  return items.length == 0 ? undefined : items.join(" + ");
}
