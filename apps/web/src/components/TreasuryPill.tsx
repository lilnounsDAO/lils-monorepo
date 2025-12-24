"use client";
import { useTreasuryData } from "@/hooks/useTreasuryData";
import NumberFlow from "@number-flow/react";
import { Button } from "./ui/button";
import { useChainId } from "wagmi";
import { CHAIN_SPECIFIC_CONFIGS } from "@/config";
import { useMemo } from "react";

export default function TreasuryPill() {
  const { data, isLoading, error } = useTreasuryData();
  const chainId = useChainId();

  const executorAddress = useMemo(() => {
    const config = CHAIN_SPECIFIC_CONFIGS[chainId];
    return config?.addresses.nounsTreasury || null;
  }, [chainId]);

  const getEtherscanUrl = () => {
    if (!executorAddress) return "#";
    
    const address = executorAddress.toLowerCase();
    if (chainId === 1) {
      return `https://etherscan.io/address/${address}#tokentxns`;
    } else if (chainId === 11155111) {
      return `https://sepolia.etherscan.io/address/${address}#tokentxns`;
    }
    return `https://etherscan.io/address/${address}#tokentxns`; // Default to mainnet
  };

  const handleClick = () => {
    window.open(getEtherscanUrl(), "_blank", "noopener,noreferrer");
  };

  if (isLoading) {
    return (
      <Button variant="secondary" className="flex flex-row gap-2 px-4 py-[6px]">
        <span className="label-md">Treasury</span>
        <span className="label-md">...</span>
      </Button>
    );
  }

  if (error || !data) {
    return null; // Don't show anything on error
  }

  return (
    <Button
      variant="secondary"
      className="flex flex-row gap-2 px-4 py-[6px] group relative"
      title={`Treasury: ${data.totalEth.toFixed(4)} ETH ($${data.totalUsd.toLocaleString()}) | ${data.totalNouns} Nouns`}
      onClick={handleClick}
    >
      <span className="label-md">Treasury</span>
      <span className="label-md flex items-center">
        Ξ
        <NumberFlow
          value={data.totalEth}
          format={{
            notation:
              data.totalEth > 9999 || data.totalEth < -9999
                ? "compact"
                : "standard",
          }}
        />
      </span>
      <span className="label-md">
        +{data.totalNouns} Nouns
      </span>
      {/* USD value on hover */}
      <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
        $
        <NumberFlow
          value={data.totalUsd}
          format={{
            notation:
              data.totalUsd > 9999 || data.totalUsd < -9999
                ? "compact"
                : "standard",
          }}
        />{" "}
        USD
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 -mb-1 border-4 border-transparent border-b-gray-900"></div>
      </div>
    </Button>
  );
}

