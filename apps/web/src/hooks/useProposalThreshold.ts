import { useReadContract } from "wagmi";
import { nounsDaoLogicConfig } from "@/data/generated/wagmi";
import { CHAIN_CONFIG } from "@/config";

export function useProposalThreshold(): number | undefined {
  const { data } = useReadContract({
    address: CHAIN_CONFIG.addresses.nounsDaoProxy,
    abi: nounsDaoLogicConfig.abi,
    functionName: "proposalThreshold",
  });

  return data !== undefined ? Number(data) : undefined;
}

