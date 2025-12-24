import { useAccount } from 'wagmi'
import { useWriteContract } from 'wagmi'
import { nounsDaoDataAbi } from '@/abis/nounsDaoData'
import { CHAIN_CONFIG } from '@/config'
import { TransactionState } from '../transactions/types'

interface UseProposalFeedbackReturn {
  sendFeedback: (
    proposalId: number,
    support: number,
    reason: string
  ) => Promise<void>
  state: TransactionState
  error: Error | null
}

export function useProposalFeedback(): UseProposalFeedbackReturn {
  const { address } = useAccount()
  const { writeContractAsync, isPending, isError, error } = useWriteContract()

  const sendFeedback = async (
    proposalId: number,
    support: number,
    reason: string
  ) => {
    if (!address) {
      throw new Error('Wallet not connected')
    }

    await writeContractAsync({
      address: CHAIN_CONFIG.addresses.nounsDAODataProxy,
      abi: nounsDaoDataAbi,
      functionName: 'sendFeedback',
      args: [BigInt(proposalId), support, reason],
    })
  }

  let state: TransactionState = 'idle'
  if (isPending) state = 'pending-txn'
  if (isError) state = 'failed'

  return {
    sendFeedback,
    state,
    error: error as Error | null,
  }
}

