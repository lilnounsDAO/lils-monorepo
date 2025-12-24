"use client";
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { vrgdaSeedToImage } from '@/data/ponder/vrgda/vrgdaSeedToImage';
import { VrgdaPoolSeed } from '@/data/ponder/vrgda/types';

interface VrgdaSeedItemProps {
  seed: VrgdaPoolSeed;
  isSelected: boolean;
  isNewlyAdded: boolean;
  onSelect: (seedId: string) => void;
  size: number;
  animationDelay: number;
}

export const VrgdaSeedItem: React.FC<VrgdaSeedItemProps> = React.memo(({
  seed,
  isSelected,
  isNewlyAdded,
  onSelect,
  size,
  animationDelay,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [shouldShowFallback, setShouldShowFallback] = useState(false);
  const [fallbackStartTime, setFallbackStartTime] = useState(0);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  
  const minFallbackDuration = 1000; // 1 second minimum
  
  // Intersection observer for lazy loading
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading when 50px away from viewport
        threshold: 0.1,
      }
    );
    
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  
  // Only generate image URL when in view
  const imageUrl = isInView ? vrgdaSeedToImage(seed, { imageType: 'full' }) : null;
  
  // Progressive loading logic
  useEffect(() => {
    if (!isLoaded && !shouldShowFallback) {
      const timer = setTimeout(() => {
        setShouldShowFallback(true);
        setFallbackStartTime(Date.now());
      }, 100); // Show skeleton after 100ms
      return () => clearTimeout(timer);
    } else if (isLoaded && shouldShowFallback) {
      const elapsed = Date.now() - fallbackStartTime;
      if (elapsed >= minFallbackDuration) {
        setShouldShowFallback(false);
      } else {
        setTimeout(() => setShouldShowFallback(false), minFallbackDuration - elapsed);
      }
    }
  }, [isLoaded, shouldShowFallback, fallbackStartTime]);
  
  const handleImageLoad = () => {
    setIsLoaded(true);
  };
  
  const handleImageError = () => {
    setIsLoaded(false);
    setShouldShowFallback(true);
  };

  return (
    <div
      ref={containerRef}
      onClick={() => onSelect(seed.id)}
      data-selected={isSelected}
      data-new={isNewlyAdded}
      className="motion-safe:animate-in motion-safe:fade-in motion-safe:zoom-in group cursor-pointer overflow-clip rounded-2xl shadow-sm transition-all ease-in-out hover:shadow-lg motion-safe:hover:scale-105 motion-safe:data-[selected=true]:scale-105 data-[new=true]:ring-2 data-[new=true]:ring-green-400"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        animationDuration: `${animationDelay}ms`,
      }}
    >
      {/* Loading State / Skeleton */}
      {(!isInView || shouldShowFallback) && !isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-200 animate-pulse">
          <div className="w-8 h-8 bg-gray-300 rounded-lg animate-pulse" />
          <div className="absolute bottom-2 left-2 text-xs text-gray-500">
            #{seed.blockNumber}
          </div>
        </div>
      )}
      
      {/* VRGDA Seed Image - Only render when in view */}
      {isInView && imageUrl && (
        <img
          ref={imgRef}
          src={imageUrl}
          alt={`VRGDA Seed ${seed.blockNumber}`}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            width: `${size}px`,
            height: `${size}px`,
          }}
          onLoad={handleImageLoad}
          onError={handleImageError}
          loading="lazy"
        />
      )}
      
      {/* Selection Border */}
      {isSelected && (
        <div className="border-3 absolute inset-0 rounded-2xl border-black" />
      )}
      
      {/* New Seed Indicator */}
      {isNewlyAdded && (
        <motion.div 
          className="absolute top-1 right-1 w-2 h-2 bg-green-400 rounded-full"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      )}
      
      {/* Block Number Badge */}
      <div className="absolute top-1 left-1 hidden group-hover:block group-data-[selected=true]:block">
        <span className="rounded bg-blue-500 px-1 py-0.5 text-xs font-semibold text-white">
          {seed.blockNumber}
        </span>
      </div>
    </div>
  );
});
