import { useQuery } from "@tanstack/react-query";
import { useChainId } from "wagmi";
import { getTreasuryData, TreasuryData } from "@/data/treasury/treasuryDataFetcher";

export function useTreasuryData() {
  const chainId = useChainId();

  return useQuery<TreasuryData>({
    queryKey: ["treasury-data", chainId],
    queryFn: () => getTreasuryData(chainId),
    staleTime: 60000, // 1 minute
    refetchInterval: 300000, // 5 minutes
    retry: 2,
  });
}

