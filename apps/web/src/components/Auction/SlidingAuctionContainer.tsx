"use client";
import { motion, MotionConfig } from 'framer-motion';
import { useState } from 'react';
import { SlideButton } from './SlideButton';
import { CompactVRGDAExplorer } from './CompactVRGDAExplorer';
import { useQuery } from "@tanstack/react-query";
import { currentAuctionIdQuery } from "@/data/tanstackQueries";
import { isVRGDANoun } from "@/utils/vrgdaUtils";
import AuctionClient from "./AuctionClient";
import VRGDAClient from "./VRGDAClient";
import { Suspense } from "react";

interface SlidingAuctionContainerProps {
  initialAuctionId?: string;
}

export const SlidingAuctionContainer = ({ initialAuctionId }: SlidingAuctionContainerProps) => {
  const [activeCard, setActiveCard] = useState(1); // 0 = VRGDA, 1 = Auction
  const [isPeeking, setIsPeeking] = useState(false);

  // Get current auction data
  const { data: currentAuctionId } = useQuery({
    ...currentAuctionIdQuery(),
    enabled: !initialAuctionId,
  });

  const auctionId = initialAuctionId || currentAuctionId;
  const auctionIdNum = auctionId ? parseInt(auctionId) : undefined;
  const isVRGDA = auctionIdNum ? isVRGDANoun(auctionIdNum) : false;

  // Custom easing for smooth, polished transitions
  const customEasing = [0.25, 0.1, 0.25, 1];

  // Animation variants for nested card system
  const cardVariants = {
    // Primary card (always on top, fully visible)
    primaryVisible: {
      y: 0,
      opacity: 1,
      scale: 1,
      zIndex: 10,
      transition: { 
        ease: customEasing, 
        duration: 0.5, 
        type: 'tween'
      }
    },
    
    // Secondary card states (beneath primary)
    secondaryHidden: {
      y: '100%', // Completely hidden beneath
      opacity: 0.7,
      scale: 0.95,
      zIndex: 1,
      transition: { 
        ease: customEasing, 
        duration: 0.5, 
        type: 'tween'
      }
    },
    secondaryPeeking: {
      y: '70%', // Partially revealed on hover
      opacity: 0.8,
      scale: 0.98,
      zIndex: 1,
      transition: { 
        ease: customEasing, 
        duration: 0.3, 
        type: 'tween'
      }
    },
    secondaryRevealed: {
      y: '20%', // More revealed when swapping
      opacity: 0.9,
      scale: 0.99,
      zIndex: 1,
      transition: { 
        ease: customEasing, 
        duration: 0.5, 
        type: 'tween'
      }
    },
    
    // When secondary becomes primary (slides up to full view)
    becomingPrimary: {
      y: 0,
      opacity: 1,
      scale: 1,
      zIndex: 10,
      transition: { 
        ease: customEasing, 
        duration: 0.6, 
        type: 'tween'
      }
    },
    
    // When primary becomes secondary (slides down beneath)
    becomingSecondary: {
      y: '100%',
      opacity: 0.7,
      scale: 0.95,
      zIndex: 1,
      transition: { 
        ease: customEasing, 
        duration: 0.6, 
        type: 'tween'
      }
    }
  };

  // Get VRGDA card animation state
  const getVrgdaVariant = () => {
    if (activeCard === 0) return 'primaryVisible'; // VRGDA is primary
    if (isPeeking) return 'secondaryPeeking'; // Show peek on hover
    return 'secondaryHidden'; // Hidden beneath auction card
  };

  // Get Auction card animation state
  const getAuctionVariant = () => {
    if (activeCard === 1) return 'primaryVisible'; // Auction is primary
    if (isPeeking) return 'secondaryPeeking'; // Show peek on hover
    return 'secondaryHidden'; // Hidden beneath VRGDA card
  };

  // Handle card transitions
  const handleCardChange = (newCard: number) => {
    setActiveCard(newCard);
  };

  const handleButtonHover = (hovering: boolean) => {
    setIsPeeking(hovering);
  };

  // Loading fallback
  const LoadingCard = () => (
    <div className="relative flex h-full min-h-[593px] w-full flex-col justify-center overflow-hidden rounded-2xl border-2 bg-nouns-cool md:h-[477px] md:min-h-fit">
      <div className="flex items-center justify-center w-full h-full">
        <div className="text-content-secondary">Loading auction...</div>
      </div>
    </div>
  );

  return (
    <MotionConfig transition={{ ease: customEasing }}>
      <div className="relative w-full">
        {/* Outer container with fixed padding for white space framing */}
        <div className="px-6 md:px-8">
          {/* Card container viewport - clips overflow to create nested effect - taller for VRGDA */}
          <div className={`relative overflow-hidden rounded-2xl ${
            activeCard === 0 ? 'min-h-[700px] md:min-h-[650px]' : 'min-h-[593px] md:min-h-[477px]'
          }`}>
            
            {/* VRGDA Pool Card - Can be primary or nested beneath */}
            <motion.div
              className="absolute top-0 left-0 w-full h-full"
              variants={cardVariants}
              animate={getVrgdaVariant()}
            >
              <CompactVRGDAExplorer />
            </motion.div>

            {/* Auction Card - Can be primary or nested beneath */}
            <motion.div
              className="absolute top-0 left-0 w-full h-full"
              variants={cardVariants}
              animate={getAuctionVariant()}
            >
              <div className="relative flex h-full min-h-[593px] w-full flex-col justify-center overflow-hidden rounded-2xl border-2 bg-nouns-cool md:h-[477px] md:min-h-fit md:flex-row md:border-none md:px-4">
                <Suspense fallback={<LoadingCard />}>
                  {isVRGDA ? (
                    <VRGDAClient initialNounId={auctionId} />
                  ) : (
                    <AuctionClient />
                  )}
                </Suspense>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Slide Button - positioned to trigger card transitions */}
        <SlideButton 
          activeCard={activeCard}
          onCardChange={handleCardChange}
          onHover={handleButtonHover}
        />
      </div>
    </MotionConfig>
  );
};