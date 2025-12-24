"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useBuyNounVRGDA } from '@/hooks/transactions/useBuyNounVRGDA';
import { vrgdaSeedToImage } from '@/data/ponder/vrgda/vrgdaSeedToImage';
import { VrgdaPoolSeed } from '@/data/ponder/vrgda/types';
import { Button } from '@/components/ui/button';
import { imageData } from '@/utils/nounImages/imageData';
import { useVrgdaBookmarks } from '@/hooks/useVrgdaBookmarks';
import { formatEther } from 'viem';
import { buildNounTraitImage } from '@/utils/nounImages/nounImage';
import { NounTraitType } from '@/data/noun/types';
import { getPartNameForTrait } from '@/utils/nounImages/traitNames';
import { useReadContract } from 'wagmi';
import { CHAIN_CONFIG } from '@/config';

interface VrgdaDetailsPanelProps {
  seed?: VrgdaPoolSeed;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  allSeeds?: VrgdaPoolSeed[];
  vrgdaPrice?: bigint;
  isCompact?: boolean;
  onClose?: () => void;
}

export const VrgdaDetailsPanel: React.FC<VrgdaDetailsPanelProps> = ({
  seed,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  allSeeds,
  vrgdaPrice,
  isCompact = false,
  onClose
}) => {
  const { buyNoun, isLoading: isBuying, error: buyError } = useBuyNounVRGDA();
  const { toggleBookmark, isBookmarkInCurrentPool } = useVrgdaBookmarks(allSeeds);
  const [isCurrentSeedBookmarked, setIsCurrentSeedBookmarked] = useState(false);
  
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

  // Check if current seed's blockNumber is in current pool
  const currentPoolBlockNumbers = allSeeds ? allSeeds.map(s => s.blockNumber) : [];
  const isAvailableForPurchase = seed ? currentPoolBlockNumbers.includes(seed.blockNumber) : false;

  // Check bookmark status by filtering localStorage directly
  useEffect(() => {
    if (!seed) {
      setIsCurrentSeedBookmarked(false);
      return;
    }

    try {
      const stored = localStorage.getItem('vrgda-bookmarks');
      if (stored) {
        const data = JSON.parse(stored);
        const bookmarks = data.seeds || [];
        
        // Filter by both nounId and blockNumber to ensure exact match
        const isBookmarked = bookmarks.some((bookmark: any) => 
          bookmark.nounId === seed.nounId && bookmark.blockNumber === seed.blockNumber
        );
        
        setIsCurrentSeedBookmarked(isBookmarked);
      } else {
        setIsCurrentSeedBookmarked(false);
      }
    } catch (error) {
      console.error('Failed to check bookmark status:', error);
      setIsCurrentSeedBookmarked(false);
    }
  }, [seed]);

  if (!seed) return null;

  const handleBuyNow = async () => {
    if (!seed || !isAvailableForPurchase) return;
    
    try {
      await buyNoun(
        BigInt(seed.blockNumber),
        BigInt(seed.nounId),
        vrgdaPrice
      );
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const fullImageUrl = vrgdaSeedToImage(seed, { imageType: 'full' });
  
  // Get isolated trait images using the same function as filter sidebar
  const traitImages = {
    background: buildNounTraitImage('background' as NounTraitType, seed.background),
    body: buildNounTraitImage('body' as NounTraitType, seed.body),
    accessory: buildNounTraitImage('accessory' as NounTraitType, seed.accessory),
    head: buildNounTraitImage('head' as NounTraitType, seed.head),
    glasses: buildNounTraitImage('glasses' as NounTraitType, seed.glasses)
  };

  // Get background color from noun's background trait
  const backgroundColorHex = imageData.bgcolors[seed.background] || imageData.bgcolors[0];
  const backgroundStyle = { backgroundColor: `#${backgroundColorHex}` };

  return (
    <motion.div layout className="border-border flex h-full w-full flex-col border-l overflow-hidden">
      <div className="flex h-full flex-col transition-colors duration-300 overflow-y-auto pb-4" style={backgroundStyle}>
        {/* Responsive VRGDA Noun Image */}
        <div className="relative">
          <img
            src={fullImageUrl ?? "/noun-loading-skull.gif"}
            alt={`VRGDA Noun ${seed.blockNumber}`}
            className={`mx-auto object-cover ${
              isCompact ? 'size-[200px]' : 'size-[288px]'
            }`}
          />
          

          {/* Heart Save Button */}
          <div className="absolute top-2 right-2">
            <motion.button
              onClick={() => {
                toggleBookmark(seed);
                // Immediately update state for instant feedback
                setIsCurrentSeedBookmarked(!isCurrentSeedBookmarked);
              }}
              className={`p-2 rounded-full shadow-lg transition-colors ${
                isCurrentSeedBookmarked
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-red-500'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              title={isCurrentSeedBookmarked ? 'Remove from saved' : 'Save noun'}
            >
              <svg 
                className="w-5 h-5" 
                fill={isCurrentSeedBookmarked ? "currentColor" : "none"} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                strokeWidth={isCurrentSeedBookmarked ? 0 : 2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </motion.button>
          </div>
        </div>

        {/* Navigation Header - Responsive */}
        <div className={`mx-2 flex items-center justify-between rounded-t-2xl shadow-sm bg-black/10 ${
          isCompact ? 'px-2 py-1' : 'px-3 py-2'
        }`}>
          <button
            onClick={onPrevious}
            disabled={!canGoPrevious}
            className={`rounded-full bg-white shadow disabled:opacity-50 hover:bg-gray-50 ${
              isCompact ? 'size-5 text-xs' : 'size-6'
            }`}
          >
            ←
          </button>
          <div className="flex flex-col items-center">
            <h2 className={`font-bold ${isCompact ? 'text-sm' : 'text-lg'}`}>
              VRGDA Lil Noun
            </h2>
            <span className={`text-gray-600 ${isCompact ? 'text-xs' : 'text-xs'}`}>
              Block {seed.blockNumber}
            </span>
          </div>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className={`rounded-full bg-white shadow disabled:opacity-50 hover:bg-gray-50 ${
              isCompact ? 'size-5 text-xs' : 'size-6'
            }`}
          >
            →
          </button>
        </div>

        {/* VRGDA Information Section - Responsive */}
        <div className={`mx-2 bg-white/20 backdrop-blur-sm rounded-t-none rounded-b-2xl ${
          isCompact ? 'p-2' : 'p-3'
        }`}>
          <div className={`grid grid-cols-2 gap-2 ${isCompact ? 'text-xs' : 'text-sm'}`}>
            <div>
              <span className="text-gray-600">Lil Noun ID</span>
              <p className="font-semibold">#{seed.nounId}</p>
            </div>
            <div>
              <span className="text-gray-600">Block Number</span>
              <p className="font-semibold">{seed.blockNumber}</p>
            </div>
            <div>
              <span className="text-gray-600">Block Hash</span>
              <p className="font-mono text-xs">{seed.blockHash ? seed.blockHash.slice(0, 10) + '...' : 'N/A'}</p>
            </div>
            <div>
              <span className="text-gray-600">Generated</span>
              <p className="text-xs">{new Date(Number(seed.generatedAt) * 1000).toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Buy Now Section - Responsive */}
        <div className={`mx-2 mt-2 bg-white/30 backdrop-blur-sm rounded-2xl shadow-sm ${
          isCompact ? 'p-2' : 'p-3'
        }`}>
          <div className={`flex items-center justify-between ${isCompact ? 'mb-1' : 'mb-2'}`}>
            <span className={`font-bold ${isCompact ? 'text-base' : 'text-lg'}`}>
              {vrgdaPrice ? parseFloat(formatEther(vrgdaPrice)).toFixed(4) : '—'} ETH
            </span>
            <span className={`text-gray-600 ${isCompact ? 'text-xs' : 'text-sm'}`}>VRGDA Price</span>
          </div>
          <Button 
            onClick={handleBuyNow}
            disabled={isBuying || !isAvailableForPurchase || isPaused}
            className={`w-full ${
              !isAvailableForPurchase || isPaused
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            } ${isCompact ? 'text-sm py-1' : ''}`}
          >
            {isPaused ? 'Auctions Paused' : isBuying ? 'Processing...' : !isAvailableForPurchase ? 'Not in Current Pool' : 'Buy Now'}
          </Button>
          {buyError && (
            <p className="text-xs text-red-600 mt-1">{buyError.message}</p>
          )}
        </div>

        {/* Traits List - Responsive */}
        <div className={`flex-grow border-t bg-white/30 backdrop-blur-sm mt-2 mx-2 rounded-t-2xl ${
          isCompact ? 'p-1' : 'p-2'
        }`}>
          <h3 className={`font-semibold mb-2 ${isCompact ? 'text-xs' : 'text-sm'}`}>Traits</h3>
          <ul className={`${isCompact ? 'space-y-0.5' : 'space-y-1'}`}>
            {[
              { category: 'Background', value: seed.background, image: traitImages.background, name: getPartNameForTrait('background', seed.background) },
              { category: 'Body', value: seed.body, image: traitImages.body, name: getPartNameForTrait('body', seed.body) },
              { category: 'Accessory', value: seed.accessory, image: traitImages.accessory, name: getPartNameForTrait('accessory', seed.accessory) },
              { category: 'Head', value: seed.head, image: traitImages.head, name: getPartNameForTrait('head', seed.head) },
              { category: 'Glasses', value: seed.glasses, image: traitImages.glasses, name: getPartNameForTrait('glasses', seed.glasses) }
            ].map((trait, index) => (
              <li
                key={index}
                className={`flex w-full items-center border-b border-gray-200 last:border-b-0 ${
                  isCompact ? 'gap-1 pb-0.5 last:pb-0' : 'gap-2 pb-1 last:pb-0'
                }`}
              >
                <div className={`flex-shrink-0 rounded-md bg-gray-100 flex items-center justify-center ${
                  isCompact 
                    ? (trait.category === 'Glasses' ? 'w-12 h-8' : 'w-8 h-8')
                    : (trait.category === 'Glasses' ? 'w-16 h-12' : 'w-12 h-12')
                }`}>
                  <img
                    src={trait.image}
                    alt={`${trait.category} ${trait.value}`}
                    className="object-contain w-full h-full"
                  />
                </div>
                <div className="flex w-full flex-col">
                  <span className={`text-muted-foreground font-bold uppercase tracking-wide ${
                    isCompact ? 'text-xs' : 'text-xs'
                  }`}>
                    {trait.category}
                  </span>
                  <span className={`font-semibold ${isCompact ? 'text-xs' : 'text-sm'}`}>
                    {trait.name}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
};
