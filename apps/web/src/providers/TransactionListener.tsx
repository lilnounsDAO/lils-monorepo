"use client";
import { CHAIN_CONFIG } from "@/config";
import { createContext, useCallback, useContext, useState } from "react";
import { Hex, TransactionType } from "viem";
import { waitForTransactionReceipt } from "viem/actions";
import { ToastContext, ToastType } from "./toast";
import { LinkExternal } from "@/components/ui/link";
import { useAddRecentTransaction } from "@rainbow-me/rainbowkit";
import { trackEvent } from "@/data/analytics/trackEvent";

const RECEIPT_TIMEOUT_MS = 1000 * 60 * 5; // Matches useSendTransaction

export interface Transaction {
  hash: Hex;
  status: "pending" | "success" | "reverted" | "dropped";
}

interface TransactionListenerContextType {
  transactions: Transaction[];
  addTransaction?: (
    hash: Hex,
    logging: { type: TransactionType; description: string },
    completionCallback?: (status: "success" | "reverted") => void,
  ) => void;
}

export const TransactionListenerContext =
  createContext<TransactionListenerContextType>({
    transactions: [],
    addTransaction: undefined,
  });

export function TransactionListenerProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const { addToast, removeToast } = useContext(ToastContext);
  const addRecentTransaction = useAddRecentTransaction();

  const addTransaction = useCallback(
    async (
      hash: Hex,
      logging: { type: TransactionType; description: string },
      completionCallback?: (status: "success" | "reverted") => void,
    ) => {
      setTransactions((transactions) => [
        ...transactions,
        { hash, status: "pending" },
      ]);
      const url =
        CHAIN_CONFIG.publicClient.chain?.blockExplorers?.default.url +
        "/tx/" +
        hash.toString();
      const pendingToastId = addToast?.({
        content: (
          <div className="flex w-full justify-between">
            <span>{logging.description}</span>
            <LinkExternal href={url}>View</LinkExternal>
          </div>
        ),
        type: ToastType.Pending,
      });
      trackEvent(`${logging.type}-txn-pending`, { hash: hash.toString() });

      addRecentTransaction({ hash, description: logging.description });

      let receipt;
      try {
        receipt = await waitForTransactionReceipt(CHAIN_CONFIG.publicClient, {
          hash,
          timeout: RECEIPT_TIMEOUT_MS,
        });
      } catch (e) {
        // Never mined (e.g. dropped by MetaMask Smart Transactions relay)
        console.error("Transaction not included", hash, e);
        if (pendingToastId != undefined) {
          removeToast?.(pendingToastId);
        }
        setTransactions((transactions) => [
          ...transactions.filter((txn) => txn.hash != hash),
          { hash, status: "dropped" },
        ]);
        addToast?.({
          content: (
            <span>
              {logging.description} wasn&apos;t included in a block. If you use
              MetaMask Smart Transactions, turn it off in Settings &gt; Advanced
              and try again.
            </span>
          ),
          type: ToastType.Failure,
        });
        trackEvent(`${logging.type}-txn-dropped`, { hash: hash.toString() });
        return;
      }
      if (pendingToastId != undefined) {
        removeToast?.(pendingToastId);
      }

      completionCallback?.(receipt.status);

      const status = receipt.status;
      setTransactions((transactions) => {
        return [
          ...transactions.filter((txn) => txn.hash != hash),
          { hash, status: status },
        ];
      });

      addToast?.({
        content: (
          <div className="flex w-full justify-between">
            <span>{logging.description}</span>
            <LinkExternal href={url}>View</LinkExternal>
          </div>
        ),
        type: status == "success" ? ToastType.Success : ToastType.Failure,
      });

      trackEvent(`${logging.type}-txn-${status}`, { hash: hash.toString() });
    },
    [setTransactions, addToast, removeToast, addRecentTransaction],
  );

  return (
    <TransactionListenerContext.Provider
      value={{ transactions, addTransaction }}
    >
      {children}
    </TransactionListenerContext.Provider>
  );
}
