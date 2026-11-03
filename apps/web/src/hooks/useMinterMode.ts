import { useQuery } from "@tanstack/react-query";
import { detectChainFromHostname } from "@/utils/networkDetection";
import { getMinterMode, MinterMode } from "@/data/sepolia/onchain";

export function useMinterMode() {
  const chainId = detectChainFromHostname();
  return useQuery<MinterMode>({
    queryKey: ["minter-mode", chainId],
    queryFn: getMinterMode,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}
