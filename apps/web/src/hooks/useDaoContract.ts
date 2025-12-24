/**
 * DAO Contract Hooks
 * Interact with the DAO governance contract
 */

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { Address } from 'viem'
import { resolveIdentifier } from '../contracts'
import type { Transaction } from '../types'

/**
 * DAO Contract ABI (minimal - add more functions as needed)
 */
const DAO_ABI = [
  {
    name: 'propose',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'signatures', type: 'string[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'description', type: 'string' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'proposeBySigs',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'proposerSignatures', type: 'tuple[]',
        components: [
          { name: 'sig', type: 'bytes' },
          { name: 'signer', type: 'address' },
          { name: 'expirationTimestamp', type: 'uint256' }
        ]
      },
      { name: 'targets', type: 'address[]' },
      { name: 'values', type: 'uint256[]' },
      { name: 'signatures', type: 'string[]' },
      { name: 'calldatas', type: 'bytes[]' },
      { name: 'description', type: 'string' }
    ],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'proposalThreshold',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'latestProposalIds',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'state',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'proposalId', type: 'uint256' }],
    outputs: [{ name: '', type: 'uint8' }]
  }
] as const

/**
 * Hook to create a proposal
 */
export const useCreateProposal = () => {
  const { writeContractAsync } = useWriteContract()
  const daoContract = resolveIdentifier('dao')

  return async ({
    description,
    transactions
  }: {
    description: string
    transactions: Transaction[]
  }) => {
    const targets = transactions.map((tx) => tx.target)
    const values = transactions.map((tx) => tx.value)
    const signatures = transactions.map((tx) => tx.signature || '')
    const calldatas = transactions.map((tx) => tx.calldata)

    const hash = await writeContractAsync({
      address: daoContract.address,
      abi: DAO_ABI,
      functionName: 'propose',
      args: [targets, values, signatures, calldatas, description]
    })

    // In production, you'd wait for the transaction and extract the proposal ID
    // For now, return a mock ID
    return { id: '1', hash }
  }
}

/**
 * Hook to create a proposal with signatures
 */
export const useCreateProposalWithSignatures = () => {
  const { writeContractAsync } = useWriteContract()
  const daoContract = resolveIdentifier('dao')

  return async ({
    description,
    transactions,
    proposerSignatures
  }: {
    description: string
    transactions: Transaction[]
    proposerSignatures: Array<{
      sig: string
      signer: Address
      expirationTimestamp: number
    }>
  }) => {
    const targets = transactions.map((tx) => tx.target)
    const values = transactions.map((tx) => tx.value)
    const signatures = transactions.map((tx) => tx.signature || '')
    const calldatas = transactions.map((tx) => tx.calldata)

    const hash = await writeContractAsync({
      address: daoContract.address,
      abi: DAO_ABI,
      functionName: 'proposeBySigs',
      args: [proposerSignatures, targets, values, signatures, calldatas, description]
    })

    return { id: '1', hash }
  }
}

/**
 * Hook to get the proposal threshold
 */
export const useProposalThreshold = (): number | undefined => {
  const daoContract = resolveIdentifier('dao')

  const { data } = useReadContract({
    address: daoContract.address,
    abi: DAO_ABI,
    functionName: 'proposalThreshold'
  })

  return data ? Number(data) : undefined
}

/**
 * Hook to get the active proposal ID for an account
 */
export const useActiveProposalId = (address: Address | undefined): string | null | undefined => {
  const daoContract = resolveIdentifier('dao')

  const { data: latestProposalId } = useReadContract({
    address: daoContract.address,
    abi: DAO_ABI,
    functionName: 'latestProposalIds',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  })

  const { data: proposalState } = useReadContract({
    address: daoContract.address,
    abi: DAO_ABI,
    functionName: 'state',
    args: latestProposalId ? [latestProposalId] : undefined,
    query: {
      enabled: !!latestProposalId && latestProposalId > 0n
    }
  })

  // proposalState: 0=Pending, 1=Active, 2=Canceled, 3=Defeated, 4=Succeeded, 5=Queued, 6=Expired, 7=Executed
  const isActive = proposalState === 0 || proposalState === 1

  if (latestProposalId === undefined || proposalState === undefined) {
    return undefined
  }

  if (!latestProposalId || latestProposalId === 0n || !isActive) {
    return null
  }

  return String(latestProposalId)
}
