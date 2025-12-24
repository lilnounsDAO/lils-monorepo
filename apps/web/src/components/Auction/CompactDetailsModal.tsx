"use client";
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useBuyNounVRGDA } from '@/hooks/transactions/useBuyNounVRGDA';
import { vrgdaSeedToImage } from '@/data/ponder/vrgda/vrgdaSeedToImage';
import { VrgdaPoolSeed } from '@/data/ponder/vrgda/types';
import { Button } from '@/components/ui/button';
import { imageData } from '@/utils/nounImages/imageData';
import { useVrgdaBookmarks } from '@/hooks/useVrgdaBookmarks';
import { formatEther } from 'viem';
import { buildNounTraitImage } from '@/utils/nounImages/nounImage';
import { NounTraitType } from '@/data/noun/types';
import { VRGDA_TRAITS_BY_TYPE } from '@/data/vrgda/vrgdaTraits';
import { useReadContract } from 'wagmi';
import { CHAIN_CONFIG } from '@/config';

interface CompactDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  seed?: VrgdaPoolSeed;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious: boolean;
  canGoNext: boolean;
  allSeeds?: VrgdaPoolSeed[];
  vrgdaPrice?: bigint;
}

// Helper function to get trait name from seed value
const getTraitName = (category: string, seedValue: number): string => {
  const traitType = category.toLowerCase() as keyof typeof VRGDA_TRAITS_BY_TYPE;
  const traits = VRGDA_TRAITS_BY_TYPE[traitType];
  const trait = traits.find(t => t.seed === seedValue);
  return trait?.name || `${category} ${seedValue}`;
};

export const CompactDetailsModal: React.FC<CompactDetailsModalProps> = ({
  isOpen,
  onClose,
  seed,
  onPrevious,
  onNext,
  canGoPrevious,
  canGoNext,
  allSeeds,
  vrgdaPrice
}) => {
  const { buyNoun, isLoading: isBuying, error: buyError } = useBuyNounVRGDA();
  const { bookmarkedSeeds, toggleBookmark } = useVrgdaBookmarks(allSeeds);
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

  // Update bookmark status when seed changes or bookmarks change
  useEffect(() => {
    if (seed) {
      const isBookmarked = bookmarkedSeeds.some(bookmark => bookmark.nounId === seed.nounId);
      setIsCurrentSeedBookmarked(isBookmarked);
    }
  }, [seed, bookmarkedSeeds]);

  const handleBuyNow = async () => {
    if (!seed) return;
    
    try {
      await buyNoun(
        BigInt(seed.blockNumber), 
        BigInt(seed.nounId),
        vrgdaPrice // maxPrice protection
      );
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  if (!seed) return null;

  const fullImageUrl = vrgdaSeedToImage(seed, { imageType: 'full' });
  
  // Get isolated trait images
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
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={backgroundStyle}
          >
            {/* Header with close and navigation */}
            <div className="flex items-center justify-between p-4 bg-black/10 backdrop-blur-sm">
              <button
                onClick={onPrevious}
                disabled={!canGoPrevious}
                className="p-2 rounded-full bg-white shadow disabled:opacity-50 hover:bg-gray-50"
              >
                ←
              </button>
              
              <div className="text-center">
                <h2 className="text-lg font-bold text-gray-900">
                  VRGDA Lil Noun #{seed.nounId}
                </h2>
                <span className="text-sm text-gray-700">
                  Block {seed.blockNumber}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={onNext}
                  disabled={!canGoNext}
                  className="p-2 rounded-full bg-white shadow disabled:opacity-50 hover:bg-gray-50"
                >
                  →
                </button>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full bg-white shadow hover:bg-gray-50"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* Large Noun Image with Save Button */}
              <div className="relative">
                <img
                  src={fullImageUrl ?? "/noun-loading-skull.gif"}
                  alt={`VRGDA Noun ${seed.nounId}`}
                  className="w-full aspect-square object-cover rounded-xl"
                />
                
                {/* Heart Save Button */}
                <div className="absolute top-3 right-3">
                  <motion.button
                    onClick={() => toggleBookmark(seed)}
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

              {/* Noun Info */}
              <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 block">Block Number</span>
                    <p className="font-semibold">{seed.blockNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 block">Noun ID</span>
                    <p className="font-semibold">{seed.nounId}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600 block">Block Hash</span>
                    <p className="font-mono text-xs">{seed.blockHash ? seed.blockHash.slice(0, 10) + '...' : 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Purchase Section */}
              <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold">
                    {vrgdaPrice ? parseFloat(formatEther(vrgdaPrice)).toFixed(4) : '—'} ETH
                  </span>
                  <span className="text-sm text-gray-600">VRGDA Price</span>
                </div>
                <Button 
                  onClick={handleBuyNow}
                  disabled={isBuying || isPaused}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {isPaused ? 'Auctions Paused' : isBuying ? 'Processing...' : 'Buy Now'}
                </Button>
                {buyError && (
                  <p className="text-xs text-red-600 mt-2">{buyError.message}</p>
                )}
              </div>

              {/* Traits */}
              <div className="bg-white/30 backdrop-blur-sm rounded-xl p-4">
                <h3 className="font-semibold mb-3 text-sm">Traits</h3>
                <div className="space-y-2">
                  {[
                    { category: 'Background', value: seed.background, image: traitImages.background },
                    { category: 'Body', value: seed.body, image: traitImages.body },
                    { category: 'Accessory', value: seed.accessory, image: traitImages.accessory },
                    { category: 'Head', value: seed.head, image: traitImages.head },
                    { category: 'Glasses', value: seed.glasses, image: traitImages.glasses }
                  ].map((trait, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 bg-white/20 rounded-lg"
                    >
                      <img
                        src={trait.image}
                        alt={`${trait.category} ${trait.value}`}
                        className={`rounded object-cover bg-gray-100 ${
                          trait.category === 'Glasses' ? 'w-12 h-8' : 'w-10 h-10'
                        }`}
                      />
                      <div className="flex-1">
                        <span className="text-xs font-bold uppercase tracking-wide text-gray-600">
                          {trait.category}
                        </span>
                        <p className="text-sm font-semibold">
                          {getTraitName(trait.category, trait.value)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};