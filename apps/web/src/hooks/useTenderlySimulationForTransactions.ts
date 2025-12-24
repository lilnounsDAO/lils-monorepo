/**
 * Tenderly Simulation Hook for ProposalTransactions
 * React Query integration for simulating proposal transactions from existing proposals
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useChainId } from 'wagmi'
import type { ProposalTransaction } from '@/data/goldsky/governance/common'
import type { SimulationResult } from '@/types/tenderly'
import { simulateTransactionBundle } from '@/services/tenderlySimulationService'
import { getDaoExecutorAddress } from '@/utils/transactions'
import type { Transaction } from '@/utils/transactions'

/**
 * Convert ProposalTransaction to Transaction format for simulation
 */
function convertToTransaction(ptx: ProposalTransaction): Transaction {
  return {
    target: ptx.to,
    value: ptx.value.toString(),
    signature: ptx.signature,
    calldata: ptx.calldata
  }
}

export function useTenderlySimulationForTransactions(
  transactions: ProposalTransaction[],
  enabled: boolean = true
) {
  const chainId = useChainId()

  // Stable key for React Query
  const transactionsKey = useMemo(() =>
    JSON.stringify(transactions.map(tx => ({
      to: tx.to,
      signature: tx.signature,
      value: tx.value.toString(),
      calldata: tx.calldata
    }))),
    [transactions]
  )

  const network = chainId === 1 ? 'mainnet' : 'sepolia'
  
  // Get DAO executor address for current chain
  const daoExecutor = useMemo(() => {
    try {
      return getDaoExecutorAddress(chainId)
    } catch (error) {
      // Return undefined if chain not supported
      return undefined
    }
  }, [chainId])

  return useQuery({
    queryKey: ['tenderly-simulation-transactions', transactionsKey, chainId],
    queryFn: async (): Promise<SimulationResult[]> => {
      if (transactions.length === 0) {
        return []
      }

      if (!daoExecutor) {
        throw new Error(`Unsupported chain ID: ${chainId}`)
      }

      // Convert ProposalTransactions to Transactions
      const convertedTransactions = transactions.map(convertToTransaction)

      // Simulate via Tenderly
      return simulateTransactionBundle(
        convertedTransactions,
        daoExecutor,
        network
      )
    },
    enabled: enabled && transactions.length > 0 && !!daoExecutor,
    staleTime: 60000, // Cache for 1 minute
    retry: 1,
    refetchOnWindowFocus: false
  })
}

