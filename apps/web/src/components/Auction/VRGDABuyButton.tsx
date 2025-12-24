"use client";
import { motion } from 'framer-motion';
import { useBuyNounVRGDA } from '@/hooks/transactions/useBuyNounVRGDA';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useReadContract } from 'wagmi';
import { CHAIN_CONFIG } from '@/config';

interface VRGDABuyButtonProps {
  expectedBlockNumber: number;
  expectedNounId: number;
  currentPrice: bigint;
  disabled?: boolean;
  onHover?: (isHovering: boolean) => void;
  onSuccess?: (hash?: string, receipt?: any) => void;
}

export const VRGDABuyButton = ({ 
  expectedBlockNumber, 
  expectedNounId, 
  currentPrice,
  disabled = false,
  onHover,
  onSuccess
}: VRGDABuyButtonProps) => {
  const { buyNoun, state, error, hash, receipt } = useBuyNounVRGDA();
  const queryClient = useQueryClient();
  
  // Check if contract is paused
  const { data: isPaused } = useReadContract({
    address: CHAIN_CONFIG.addresses.lilVRGDAProxy,
    abi: [
      {
        type: 'function',
        inputs: [],
        name: 'paused',
        outputs: [{ name: '', type: 'bool' }],
        stateMutability: 'view',
      },
    ],
    functionName: 'paused',
  });
  
  const handleBuyNow = () => {
    buyNoun(
      BigInt(expectedBlockNumber), 
      BigInt(expectedNounId),
      currentPrice // Optional max price protection
    );
  };
  
  const isLoading = state === "pending-signature" || state === "pending-txn";
  const isSuccess = state === "success";
  
  // When purchase succeeds, invalidate queries to refresh block and noun data
  useEffect(() => {
    if (isSuccess) {
      // Invalidate all VRGDA-related queries to refresh the UI
      queryClient.invalidateQueries({ queryKey: ["vrgda-next-noun-id"] });
      queryClient.invalidateQueries({ queryKey: ["vrgda-noun-data"] });
      queryClient.invalidateQueries({ queryKey: ["current-block-number"] });
      queryClient.invalidateQueries({ queryKey: ["vrgda-current-noun"] });
      queryClient.invalidateQueries({ queryKey: ["current-auction-id"] });
      
      // Call onSuccess callback if provided with hash and receipt
      onSuccess?.(hash, receipt);
      
      // Also refresh after a short delay to ensure chain state has updated
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["vrgda-next-noun-id"] });
        queryClient.invalidateQueries({ queryKey: ["vrgda-noun-data"] });
        queryClient.invalidateQueries({ queryKey: ["current-block-number"] });
      }, 2000);
    }
  }, [isSuccess, queryClient, onSuccess]);
  
  if (isSuccess) {
    return (
      <div>
        <button 
          className="w-full py-3 px-6 bg-green-500 text-white rounded-lg font-semibold" 
          disabled
        >
          ✅ Purchased!
        </button>
      </div>
    );
  }
  
  const isDisabled = disabled || isLoading || isPaused;
  
  return (
    <div>
      <motion.button 
        onClick={handleBuyNow}
        disabled={isDisabled}
        className="w-full py-3 px-6 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-semibold transition-colors"
        onHoverStart={() => onHover?.(true)}
        onHoverEnd={() => onHover?.(false)}
        whileHover={!isDisabled ? { 
          scale: 1.05,
          transition: { type: 'spring', stiffness: 400, damping: 20 }
        } : {}}
        whileTap={!isDisabled ? { 
          scale: 0.95,
          transition: { type: 'spring', stiffness: 400, damping: 20 }
        } : {}}
      >
        {isPaused && "Auctions Paused"}
        {!isPaused && state === "pending-signature" && "Confirm in Wallet..."}
        {!isPaused && state === "pending-txn" && "Processing..."}
        {!isPaused && state === "idle" && "Buy Now"}
        {!isPaused && state === "failed" && "Retry Purchase"}
      </motion.button>
      
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error.message}
        </div>
      )}
    </div>
  );
};