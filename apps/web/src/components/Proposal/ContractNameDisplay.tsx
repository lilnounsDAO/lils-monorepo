/**
 * ContractNameDisplay Component
 * Displays contract names instead of addresses for known contracts
 * Falls back to ENS name or truncated address
 */

import { Address, getAddress } from "viem";
import { LinkExternal } from "../ui/link";
import { getExplorerLink } from "@/utils/blockExplorer";
import { EnsName } from "../EnsName";
import { useContractName } from "@/hooks/useContract";
import { useChainId } from "wagmi";
import { CHAIN_CONFIG } from "@/config";

interface ContractNameDisplayProps {
  address: Address | string;
  chainId?: number;
  showAddress?: boolean; // Show full address in tooltip/title
  className?: string;
  linkToExplorer?: boolean; // Link to block explorer (default: true)
}

/**
 * Truncate an address for display
 */
function truncateAddress(address: string): string {
  if (address.length <= 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Display contract name with fallback to ENS or truncated address
 */
export function ContractNameDisplay({
  address,
  chainId,
  showAddress = false,
  className = "",
  linkToExplorer = true,
}: ContractNameDisplayProps) {
  const effectiveChainId = chainId || useChainId() || CHAIN_CONFIG.chain.id;
  const contractName = useContractName(address);

  // Normalize address
  const normalizedAddress = getAddress(address);

  // Determine display name (priority: contract name > ENS > truncated address)
  const displayName = contractName || null;

  // Content to render
  const content = (
    <span className={className}>
      {displayName || <EnsName address={normalizedAddress} />}
      {showAddress && displayName && (
        <span className="text-xs text-gray-500 ml-2">
          ({truncateAddress(normalizedAddress)})
        </span>
      )}
    </span>
  );

  // If linking to explorer, wrap in LinkExternal
  if (linkToExplorer) {
    return (
      <LinkExternal
        href={getExplorerLink(normalizedAddress)}
        className={`underline transition-colors hover:text-content-secondary ${className}`}
        title={showAddress ? normalizedAddress : undefined}
      >
        {content}
      </LinkExternal>
    );
  }

  return content;
}

/**
 * Display contract name with tooltip showing full address
 */
export function ContractNameWithTooltip({
  address,
  chainId,
  className = "",
}: Omit<ContractNameDisplayProps, "showAddress" | "linkToExplorer">) {
  const effectiveChainId = chainId || useChainId() || CHAIN_CONFIG.chain.id;
  const contractName = useContractName(address);
  const normalizedAddress = getAddress(address);

  return (
    <LinkExternal
      href={getExplorerLink(normalizedAddress)}
      className={`underline transition-colors hover:text-content-secondary ${className}`}
      title={normalizedAddress}
    >
      {contractName || <EnsName address={normalizedAddress} />}
    </LinkExternal>
  );
}

