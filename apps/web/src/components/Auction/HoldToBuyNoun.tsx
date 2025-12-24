"use client";
import React, { useState, useRef, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useBuyNounVRGDA } from '@/hooks/transactions/useBuyNounVRGDA';
import { ToastContext, ToastType } from '@/providers/toast';
import styles from './HoldToBuyNoun.module.css';
import { useReadContract } from 'wagmi';
import { CHAIN_CONFIG } from '@/config';

interface HoldToBuyNounProps {
  noun: {
    id: string;
    image: string;
    blockNumber?: number;
  };
  currentPrice?: bigint;
  isDisabled?: boolean;
  onQuickClick?: () => void;
  children: React.ReactNode;
}

export const HoldToBuyNoun: React.FC<HoldToBuyNounProps> = ({
  noun,
  currentPrice,
  isDisabled = false,
  onQuickClick,
  children
}) => {
  const [progress, setProgress] = useState(0);
  const [isHolding, setIsHolding] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const progressRef = useRef<NodeJS.Timeout | null>(null);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const { buyNoun, state, error } = useBuyNounVRGDA();
  const { addToast } = useContext(ToastContext);

  // Calculate shake intensity based on progress
  const getShakeIntensity = (progress: number) => {
    if (progress < 25) return 0.5;
    if (progress < 50) return 1.0;
    if (progress < 75) return 1.5;
    return 2.0;
  };

  const getShakeAnimation = (progress: number) => {
    const intensity = getShakeIntensity(progress);
    return [-intensity, intensity, -intensity, intensity, 0];
  };

  // Calculate progress ring properties
  const circumference = 2 * Math.PI * 46; // radius of 46px for 4px stroke
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Start hold progress with delay to allow for quick clicks
  const startHoldProgress = () => {
    setIsHolding(true);
    setProgress(0);

    progressRef.current = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + (100 / (2000 / 50)); // 2 seconds in 50ms intervals
        
        if (newProgress >= 100) {
          handlePurchase();
          return 100;
        }
        
        return newProgress;
      });
    }, 50);
  };

  // Stop hold and reset
  const stopHold = () => {
    // Clear all timers
    if (progressRef.current) {
      clearInterval(progressRef.current);
      progressRef.current = null;
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    
    setIsHolding(false);
    setProgress(0);
  };

  // Handle purchase when progress completes
  const handlePurchase = async () => {
    if (!noun.blockNumber) {
      addToast?.({
        content: "Invalid noun data for purchase",
        type: ToastType.Failure
      });
      stopHold();
      return;
    }

    stopHold();
    setIsPurchasing(true);

    try {
      await buyNoun(
        BigInt(noun.blockNumber),
        BigInt(noun.id),
        currentPrice
      );
      
      // Success feedback is handled by TransactionListener
      addToast?.({
        content: "Purchase initiated successfully!",
        type: ToastType.Success
      });
    } catch (error) {
      console.error('Purchase failed:', error);
      addToast?.({
        content: "Purchase failed. Please try again.",
        type: ToastType.Failure
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (progressRef.current) {
        clearInterval(progressRef.current);
      }
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
      }
    };
  }, []);

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

  // Mouse/touch event handlers with timing logic
  const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
    console.log('Hold start triggered');
    e.preventDefault();
    e.stopPropagation();
    
    if (isDisabled || isPurchasing || isPaused) return;
    
    // Record start time
    startTimeRef.current = Date.now();
    
    // Start hold timer - begin progress after 300ms
    holdTimerRef.current = setTimeout(() => {
      console.log('Starting hold progress');
      startHoldProgress();
    }, 300);
  };

  const handleEnd = (e: React.MouseEvent | React.TouchEvent) => {
    console.log('Hold end triggered');
    e.preventDefault();
    e.stopPropagation();
    
    const endTime = Date.now();
    const pressDuration = endTime - startTimeRef.current;
    
    // If it was a quick press (< 300ms) and we haven't started holding, treat as click
    if (pressDuration < 300 && !isHolding && onQuickClick) {
      console.log('Quick click detected');
      stopHold(); // Clear any pending timers
      onQuickClick();
    } else {
      console.log('Hold ended');
      // Otherwise just stop the hold
      stopHold();
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    return false;
  };

  return (
    <div 
      className={`relative ${styles.holdToBuyContainer}`}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onDragStart={handleDragStart}
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        touchAction: 'none',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none',
        WebkitTouchCallout: 'none',
        WebkitUserDrag: 'none',
        KhtmlUserDrag: 'none',
        MozUserDrag: 'none',
        OUserDrag: 'none',
        userDrag: 'none'
      }}
    >
      {/* Main noun container with shake animation */}
      <motion.div
        className="relative"
        animate={isHolding ? {
          rotate: getShakeAnimation(progress),
          scale: [1, 1.02, 1],
        } : { 
          rotate: 0, 
          scale: 1 
        }}
        transition={{
          rotate: { 
            duration: 0.1, 
            repeat: isHolding ? Infinity : 0, 
            repeatType: "reverse" 
          },
          scale: { duration: 0.3 }
        }}
      >
        {children}

        {/* Aurora Progress Ring */}
        {isHolding && (
          <div className="absolute inset-0 pointer-events-none">
            <svg className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
              <defs>
                {/* Aurora gradient definition */}
                <linearGradient id={`aurora-gradient-${noun.id}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#ff0080">
                    <animate attributeName="stop-color" 
                      values="#ff0080;#ff8c00;#40e0d0;#da70d6;#98fb98;#f0e68c;#ff69b4;#00bfff;#ff0080" 
                      dur="2s" 
                      repeatCount="indefinite" />
                  </stop>
                  <stop offset="25%" stopColor="#ff8c00">
                    <animate attributeName="stop-color" 
                      values="#ff8c00;#40e0d0;#da70d6;#98fb98;#f0e68c;#ff69b4;#00bfff;#ff0080;#ff8c00" 
                      dur="2s" 
                      repeatCount="indefinite" />
                  </stop>
                  <stop offset="50%" stopColor="#40e0d0">
                    <animate attributeName="stop-color" 
                      values="#40e0d0;#da70d6;#98fb98;#f0e68c;#ff69b4;#00bfff;#ff0080;#ff8c00;#40e0d0" 
                      dur="2s" 
                      repeatCount="indefinite" />
                  </stop>
                  <stop offset="75%" stopColor="#da70d6">
                    <animate attributeName="stop-color" 
                      values="#da70d6;#98fb98;#f0e68c;#ff69b4;#00bfff;#ff0080;#ff8c00;#40e0d0;#da70d6" 
                      dur="2s" 
                      repeatCount="indefinite" />
                  </stop>
                  <stop offset="100%" stopColor="#98fb98">
                    <animate attributeName="stop-color" 
                      values="#98fb98;#f0e68c;#ff69b4;#00bfff;#ff0080;#ff8c00;#40e0d0;#da70d6;#98fb98" 
                      dur="2s" 
                      repeatCount="indefinite" />
                  </stop>
                </linearGradient>
              </defs>
              
              {/* Progress circle */}
              <circle
                cx="50%"
                cy="50%"
                r={46}
                fill="none"
                stroke={`url(#aurora-gradient-${noun.id})`}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: 'stroke-dashoffset 0.05s linear',
                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.5))'
                }}
              />
            </svg>
          </div>
        )}

        {/* Purchase success overlay */}
        {state === 'success' && (
          <motion.div
            className="absolute inset-0 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
          >
            <div className="bg-white rounded-full p-2 shadow-lg">
              <svg className="w-8 h-8 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          </motion.div>
        )}

        {/* Loading overlay during purchase */}
        {isPurchasing && (
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="bg-white rounded-full p-3 shadow-lg">
              <svg className="w-6 h-6 text-gray-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </motion.div>
        )}

        {/* Paused overlay */}
        {isPaused && (
          <motion.div
            className="absolute inset-0 bg-gray-900 bg-opacity-70 rounded-lg flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="bg-white rounded-lg p-4 shadow-lg text-center">
              <div className="text-lg font-semibold text-gray-800 mb-1">Auctions Paused</div>
              <div className="text-sm text-gray-600">Purchases are temporarily disabled</div>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Hold instruction hint */}
      {!isHolding && !isPurchasing && (
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          Hold to buy
        </div>
      )}
    </div>
  );
};