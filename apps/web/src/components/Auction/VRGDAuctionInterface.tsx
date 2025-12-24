"use client";
import { VRGDAPriceIndicator } from './VRGDAPriceIndicator';
import { VRGDATimer } from './VRGDATimer';
import { VRGDABuyButton } from './VRGDABuyButton';
import { useVRGDAData } from '@/hooks/useVRGDAData';
import { formatEther } from 'viem';
import { formatNumber } from '@/utils/format';
import { AuctionDetailTemplate } from './AuctionDetailsTemplate';
import { Skeleton } from '../ui/skeleton';
import { useVrgdaRealtimePool } from '@/data/ponder/hooks/useVrgdaRealtimePool';
import { useQuery } from '@tanstack/react-query';
import { CHAIN_CONFIG } from '@/config';
import { isSepoliaNetwork } from '@/utils/networkDetection';
import { useState } from 'react';
import PurchaseSuccessDialog from '../dialog/PurchaseSuccessDialog';

interface VRGDAuctionInterfaceProps {
  auction: {
    nounId: { toNumber: () => number };
    blockNumber?: number;
    isPaused?: boolean;
  };
}

export const VRGDAuctionInterface = ({ auction }: VRGDAuctionInterfaceProps) => {
  const { config, currentPrice, timeToNextDrop, isLoading, reservePrice } = useVRGDAData();
  const isSepolia = isSepoliaNetwork();
  // Only use VPS hook on mainnet - on Sepolia, get block directly from chain
  const { latestBlock } = useVrgdaRealtimePool({ enabled: !isSepolia });
  
  // Dialog state for purchase success
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [purchaseTxHash, setPurchaseTxHash] = useState<string>("");
  const [purchasedNounId, setPurchasedNounId] = useState<string>("");

  // Get block number: fetch directly from chain on Sepolia
  const { data: chainBlockNumber } = useQuery({
    queryKey: ["current-block-number-auction"],
    queryFn: async () => {
      const currentBlock = await CHAIN_CONFIG.publicClient.getBlockNumber();
      return Number(currentBlock) - 1; // Use previous block for stability
    },
    enabled: isSepolia, // Only fetch on Sepolia
    staleTime: 12000, // 12 seconds
    refetchInterval: 12000,
  });

  // Use VPS block on mainnet, chain block on Sepolia, or fallback to auction.blockNumber
  const blockNumber = latestBlock?.blockNumber 
    ? Number(latestBlock.blockNumber) - 1 
    : chainBlockNumber ?? auction.blockNumber ?? 0;
  
  if (isLoading || !config) {
    return <div>Loading VRGDA auction...</div>;
  }


  return (
    <>
      <div className="flex w-full flex-col gap-2 md:w-fit">
        <AuctionDetailTemplate
          item1={{
            title: "Current price",
            value: formatNumber({
              input: Number(formatEther(currentPrice)),
              unit: "ETH",
            }),
          }}
          item2={
            
            !auction.isPaused ? {
            title: currentPrice <= reservePrice ? "" : "Drops in",
            value: (
              <>
                {timeToNextDrop !== undefined && currentPrice > reservePrice ? (
                  <VRGDATimer timeToNextDrop={timeToNextDrop} />
                ) : currentPrice <= reservePrice ? (
                  // <span className="text-sm text-gray-600">At reserve</span>
                  <></>
                ) : (
                  <Skeleton className="w-[100px] whitespace-pre-wrap"> </Skeleton>
                )}
              </>
            ),
          } : {
            title: "Drops in",
            value: "Paused",
          }}
        />
      </div>
      
      {/* Visual price indicator */}
      <VRGDAPriceIndicator 
        currentPrice={currentPrice}
        reservePrice={config.reservePrice}
        targetPrice={config.targetPrice}
      />
      
      {/* Buy now button */}
      <div className="flex flex-col gap-2">
        <VRGDABuyButton 
          expectedBlockNumber={blockNumber}
          expectedNounId={auction.nounId.toNumber()}
          currentPrice={currentPrice}
          onSuccess={(hash) => {
            if (hash) {
              setPurchaseTxHash(hash);
              setPurchasedNounId(auction.nounId.toNumber().toString());
              setShowSuccessDialog(true);
            }
          }}
        />
      </div>
      
      {/* Purchase Success Dialog */}
      <PurchaseSuccessDialog
        nounId={purchasedNounId}
        txHash={purchaseTxHash}
        open={showSuccessDialog}
        onOpenChange={setShowSuccessDialog}
      />
    </>
  );
};