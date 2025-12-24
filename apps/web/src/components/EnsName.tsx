"use client";
import { useEnsName } from "wagmi";
import { Address, getAddress } from "viem";
import { HTMLAttributes } from "react";
import { cn } from "@/utils/shadcn";
import { getAddressOverrides } from "@/utils/addressOverrides";

interface EnsNameProps extends HTMLAttributes<HTMLSpanElement> {
  address: Address;
}

/**
 * Truncate an address for display
 */
function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Name component using wagmi's ENS name with caching
 * Falls back to truncated address if ENS name is not available
 */
export function EnsName({
  address,
  className,
  ...props
}: EnsNameProps) {
  const normalizedAddress = getAddress(address);
  
  // Check for address overrides first
  const override = getAddressOverrides(normalizedAddress);
  const overrideName = override?.name;

  // Get ENS name (wagmi caches this automatically via react-query)
  const { data: ensName } = useEnsName({
    address: normalizedAddress,
    chainId: 1, // ENS is on mainnet
    query: {
      enabled: !overrideName, // Skip if we have an override
    },
  });

  const displayName = overrideName || ensName || truncateAddress(normalizedAddress);

  return (
    <span className={className} {...props}>
      {displayName}
    </span>
  );
}

