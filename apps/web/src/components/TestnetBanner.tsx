import { twMerge } from "tailwind-merge";
import { CHAIN_CONFIG } from "@/config";
import { getNetworkName } from "@/utils/networkDetection";

export default function TestnetBanner() {
  const networkName = getNetworkName();
  const isTestnet = CHAIN_CONFIG.chain.testnet;

  return (
    <div
      className={twMerge(
        "w-full bg-semantic-warning-light p-2 text-center text-sm font-medium",
        !isTestnet && "hidden"
      )}
    >
      <span className="inline-flex items-center gap-2">
        <span className="inline-block w-2 h-2 bg-yellow-600 rounded-full animate-pulse" />
        You are on {networkName} Testnet
      </span>
    </div>
  );
}
