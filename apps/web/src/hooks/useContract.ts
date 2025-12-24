/**
 * Hook to resolve contract information by address or identifier
 */

import { useMemo } from "react";
import { Address } from "viem";
import { useChainId } from "wagmi";
import {
  resolveContractAddress,
  resolveContractIdentifier,
  type ContractMetadata,
} from "@/lib/contract-registry";
import { CHAIN_CONFIG } from "@/config";

/**
 * Hook to resolve contract metadata by address
 */
export function useContract(address?: Address | string) {
  const chainId = useChainId();
  const effectiveChainId = chainId || CHAIN_CONFIG.chain.id;

  return useMemo(() => {
    if (!address) {
      return null;
    }

    return resolveContractAddress(address, effectiveChainId);
  }, [address, effectiveChainId]);
}

/**
 * Hook to resolve contract address and metadata by identifier
 */
export function useContractByIdentifier(identifier?: string) {
  const chainId = useChainId();
  const effectiveChainId = chainId || CHAIN_CONFIG.chain.id;

  return useMemo(() => {
    if (!identifier) {
      return null;
    }

    return resolveContractIdentifier(identifier, effectiveChainId);
  }, [identifier, effectiveChainId]);
}

/**
 * Hook to get contract name for display
 */
export function useContractName(address?: Address | string): string | null {
  const contract = useContract(address);
  return contract?.name || null;
}

