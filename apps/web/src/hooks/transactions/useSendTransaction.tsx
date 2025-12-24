"use client";
import { useCallback, useContext, useMemo, useState } from "react";
import {
  BaseError,
  Hash,
  InsufficientFundsError,
  TransactionReceipt,
  UserRejectedRequestError,
} from "viem";
import {
  useAccount,
  useBalance,
  useSendTransaction as useSendTransactionWagmi,
  useWaitForTransactionReceipt,
} from "wagmi";
import {
  SendTransactionErrorType,
  WaitForTransactionReceiptErrorType,
} from "wagmi/actions";
import {
  CustomTransactionValidationError,
  MinimalTransactionRequest,
  TransactionState,
  TransactionType,
} from "./types";
import { CHAIN_CONFIG } from "@/config";
import { TransactionListenerContext } from "@/providers/TransactionListener";
import { estimateGas, getGasPrice, getBytecode } from "viem/actions";
// Note: simulateCalls may not be available in this viem version
// import { simulateCalls } from "viem/actions";
import { useSwitchChainCustom } from "../useSwitchChainCustom";
import { useConnectModal } from "@rainbow-me/rainbowkit";

const GAS_BUFFER = 0.35; // Gives buffer on gas estimate to help prevent out of gas error

export type CustomSendTransactionErrorType =
  | CustomTransactionValidationError
  | SendTransactionErrorType
  | WaitForTransactionReceiptErrorType;

export interface UseSendTransactionReturnType {
  state: TransactionState;
  error: { raw: CustomSendTransactionErrorType; message: string } | null;

  hash?: Hash;
  receipt?: TransactionReceipt;

  sendTransaction: (
    request: MinimalTransactionRequest,
    logging: { type: TransactionType; description: string },
    validationFn?: () => Promise<CustomTransactionValidationError | null>,
  ) => void;
  reset: () => void;
}

export function useSendTransaction(): UseSendTransactionReturnType {
  const { address: accountAddress, connector } = useAccount();
  const { addTransaction } = useContext(TransactionListenerContext);
  const { switchChain } = useSwitchChainCustom();
  const { openConnectModal } = useConnectModal();
  const { data: balanceData } = useBalance({ address: accountAddress });

  const [validationError, setValidationError] =
    useState<CustomTransactionValidationError | null>(null);

  const {
    data: hash,
    sendTransactionAsync: sendTransactionWagmi,
    reset: resetSendTransaction,
    error: sendTransactionError,
    isPending: pendingSignature,
  } = useSendTransactionWagmi();

  const {
    data: receipt,
    isLoading: txnPending,
    isSuccess: txnSuccess,
    isError: txnFailed,
    error: waitForReceiptError,
  } = useWaitForTransactionReceipt({
    hash,
    timeout: 1000 * 60 * 5, // 5min...
  });

  const sendTransaction = useCallback(
    async (
      request: MinimalTransactionRequest,
      logging: { type: TransactionType; description: string },
      validationFn?: () => Promise<CustomTransactionValidationError | null>,
    ) => {
      if (!accountAddress || !balanceData) {
        openConnectModal?.();
      } else {
        // Call all the time
        const correctChain = await switchChain({
          chainId: CHAIN_CONFIG.chain.id,
        });
        if (!correctChain) return;

        const validationError = await validationFn?.();
        setValidationError(validationError ?? null);

        if (!validationError) {
          let gasEstimateWithBuffer;
          try {
            const gasEstimate = await estimateGas(CHAIN_CONFIG.publicClient, {
              ...request,
              account: accountAddress,
            });
            gasEstimateWithBuffer =
              (gasEstimate * BigInt((1 + GAS_BUFFER) * 1000)) / BigInt(1000);
          } catch (e) {
            console.error("Error estimating gas, using default", e);
            gasEstimateWithBuffer = request.gasFallback; // Use fallback when gas estimation fails
          }
          console.log("GAS LIMIT", gasEstimateWithBuffer);

          // Run transaction simulation - some RPC's won't support
          // Note: Temporarily disabled due to viem version compatibility
          try {
            // const { results } = await simulateCalls(CHAIN_CONFIG.publicClient, {
            //   account: accountAddress,
            //   calls: [
            //     {
            //       ...request,
            //     },
            //   ],
            // });
            // const simResult = results[0];
            // if (simResult && simResult.status === "failure") {
            //   console.warn("Simulation error", simResult.error);
            //   setValidationError(
            //     new CustomTransactionValidationError(
            //       "SIMULATION_FAILURE",
            //       "Transaction simulation failed for unknown reason.",
            //     ),
            //   );
            //   return;
            // }
            console.log("Transaction simulation temporarily disabled");
          } catch (e) {
            console.warn(
              "Simulation transaction error occured, results inconclusive",
              e,
            );
          }

          // Check if the connected address is a contract (e.g., Gnosis Safe)
          // For contract wallets, skip balance check as gas is paid by the contract
          const bytecode = await getBytecode(CHAIN_CONFIG.publicClient, {
            address: accountAddress,
          });
          const isContractWallet = bytecode && bytecode !== "0x";
          
          // Check if connected via WalletConnect (often used with Safe wallets)
          const isWalletConnect = connector?.id === "walletConnect" || connector?.id === "safe";

          const gasPrice = await getGasPrice(CHAIN_CONFIG.publicClient);
          const txCost = gasEstimateWithBuffer * gasPrice + request.value;
          
          // Skip balance check for:
          // 1. Contract wallets (e.g., Gnosis Safe) - gas is paid by the contract
          // 2. WalletConnect connections - WalletConnect handles gas differently
          if (!isContractWallet && !isWalletConnect && balanceData.value < txCost) {
            setValidationError(
              new CustomTransactionValidationError(
                "INSUFFICIENT_FUNDS",
                "Insufficient balance.",
              ),
            );
            return;
          }

          try {
            const hash = await sendTransactionWagmi({
              ...request,
              chainId: CHAIN_CONFIG.chain.id,
              gas: gasEstimateWithBuffer,
              account: accountAddress,
            });
            addTransaction?.(hash, logging);
          } catch (e) {
            // Ignore, we handle this below
          }
        }
      }
    },
    [
      accountAddress,
      connector,
      sendTransactionWagmi,
      setValidationError,
      openConnectModal,
      switchChain,
      addTransaction,
      balanceData,
    ],
  );

  function reset() {
    setValidationError(null);
    resetSendTransaction();
  }

  const error = useMemo(
    () =>
      parseError(validationError, sendTransactionError, waitForReceiptError),
    [validationError, sendTransactionError, waitForReceiptError],
  );

  const state = useMemo(() => {
    if (pendingSignature) {
      return "pending-signature";
    } else if (txnPending) {
      return "pending-txn";
    } else if (txnFailed) {
      return "failed";
    } else if (txnSuccess) {
      return "success";
    } else {
      return "idle";
    }
  }, [pendingSignature, txnPending, txnFailed, txnSuccess]);

  return { state, error, hash, receipt, sendTransaction, reset };
}

function parseError(
  validationError: CustomTransactionValidationError | null,
  sendTransactionError: SendTransactionErrorType | null,
  waitForReceiptError: WaitForTransactionReceiptErrorType | null,
) {
  if (validationError) {
    return {
      raw: validationError,
      message: validationError.message,
    };
  } else if (sendTransactionError) {
    if (sendTransactionError instanceof BaseError) {
      if (
        sendTransactionError.walk((e) => e instanceof InsufficientFundsError)
      ) {
        return {
          raw: sendTransactionError,
          message: "Wallet has insufficient balance.",
        };
      } else if (
        sendTransactionError.walk(
          (e) => e instanceof UserRejectedRequestError,
        ) ||
        sendTransactionError.details?.includes("User rejected")
      ) {
        return {
          raw: sendTransactionError,
          message: "User rejected transaction request.",
        };
      } else {
        console.log(
          `Unknown send txn error: ${sendTransactionError.name} -  ${sendTransactionError.shortMessage} - ${sendTransactionError.message} - ${sendTransactionError.cause}`,
        );
        return {
          raw: sendTransactionError,
          message: "Unknown error occurred, try again.",
        };
      }
    } else {
      console.log(
        `Unknown send txn error: ${sendTransactionError.name} - ${sendTransactionError.message} - ${sendTransactionError.cause}`,
      );
      return {
        raw: sendTransactionError,
        message: "Unknown error occurred, try again..",
      };
    }
  } else if (waitForReceiptError) {
    return {
      raw: waitForReceiptError,
      message: "Error waiting for transaction receipt.",
    };
  } else {
    return null;
  }
}
