/**
 * Tenderly Simulation Hook
 * React Query integration for simulating proposal transactions
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useChainId } from 'wagmi'
import type { Action } from '@/types/proposal-editor'
import type { SimulationResult } from '@/types/tenderly'
import { resolveActions, getDaoExecutorAddress } from '@/utils/transactions'
import { simulateTransactionBundle } from '@/services/tenderlySimulationService'

export function useTenderlySimulation(actions: Action[]) {
  const chainId = useChainId()

  // Stable key for React Query
  const actionsKey = useMemo(() =>
    JSON.stringify(actions),
    [actions]
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
    queryKey: ['tenderly-simulation', actionsKey, chainId],
    queryFn: async (): Promise<SimulationResult[]> => {
      console.log('[Tenderly Hook] Starting simulation for', actions.length, 'actions')
      
      if (actions.length === 0) {
        return []
      }

      if (!daoExecutor) {
        throw new Error(`Unsupported chain ID: ${chainId}`)
      }

      // Convert actions to transactions
      const transactions = resolveActions(actions)
      console.log('[Tenderly Hook] Resolved to', transactions.length, 'transactions')
      
      // Log each transaction in detail
      transactions.forEach((tx, index) => {
        console.log(`[Tenderly Hook] Transaction ${index + 1}:`, {
          target: tx.target,
          value: tx.value,
          signature: tx.signature,
          calldata: tx.calldata,
          calldataLength: tx.calldata.length
        })
      })

      // Simulate via Tenderly
      const startTime = Date.now()
      const results = await simulateTransactionBundle(
        transactions,
        daoExecutor,
        network
      )
      const duration = Date.now() - startTime
      console.log('[Tenderly Hook] Simulation completed in', duration, 'ms')
      
      return results
    },
    enabled: actions.length > 0 && !!daoExecutor,
    staleTime: 60000, // Cache for 1 minute
    retry: 1,
    refetchOnWindowFocus: false
  })
}

