import { useCallback } from 'react'
import { getAddress, isAddress } from 'viem'
import { CHAIN_CONFIG } from '@/config'

/**
 * Hook for resolving ENS names to addresses
 */
export function useEnsResolution() {
  const resolveEnsAddress = useCallback(async (input: string): Promise<string> => {
    // If it's already a valid address, return it checksummed
    if (isAddress(input)) {
      return getAddress(input)
    }
    
    // Try to resolve ENS name
    try {
      const resolvedAddress = await CHAIN_CONFIG.publicClient.getEnsAddress({
        name: input,
      })
      
      if (resolvedAddress) {
        return getAddress(resolvedAddress)
      }
    } catch (error) {
      console.warn(`Failed to resolve ENS name: ${input}`, error)
    }
    
    throw new Error(`Invalid address or unresolvable ENS name: ${input}`)
  }, [])

  const resolveEnsAddresses = useCallback(async (inputs: string[]): Promise<string[]> => {
    return Promise.all(inputs.map(resolveEnsAddress))
  }, [resolveEnsAddress])

  return {
    resolveEnsAddress,
    resolveEnsAddresses,
  }
}
