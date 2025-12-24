/**
 * Token Contract Hooks
 * Interact with the governance token (e.g., Nouns NFT contract)
 */

import { useReadContract } from 'wagmi'
import { Address } from 'viem'
import { resolveIdentifier } from '../contracts'

const TOKEN_ABI = [
  {
    name: 'getCurrentVotes',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'account', type: 'address' }],
    outputs: [{ name: '', type: 'uint96' }]
  },
  {
    name: 'totalSupply',
    type: 'function',
    stateMutability: 'view',
    inputs: [],
    outputs: [{ name: '', type: 'uint256' }]
  },
  {
    name: 'ownerOf',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: '', type: 'address' }]
  }
] as const

/**
 * Get current voting power for an address
 */
export const useCurrentVotes = (address: Address | undefined): number => {
  const tokenContract = resolveIdentifier('token')

  const { data } = useReadContract({
    address: tokenContract.address,
    abi: TOKEN_ABI,
    functionName: 'getCurrentVotes',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address
    }
  })

  return data ? Number(data) : 0
}

/**
 * Get total supply of tokens
 */
export const useTotalSupply = (): number | undefined => {
  const tokenContract = resolveIdentifier('token')

  const { data } = useReadContract({
    address: tokenContract.address,
    abi: TOKEN_ABI,
    functionName: 'totalSupply'
  })

  return data ? Number(data) : undefined
}
