"use client";
import { motion } from 'framer-motion';

interface SlideButtonProps {
  activeCard: number;
  onCardChange: (card: number) => void;
  onHover: (hovering: boolean) => void;
  className?: string;
}

// Toggle Slider Component
const ToggleSlider = ({ isPro, className }: { isPro: boolean; className?: string }) => (
  <div className={`flex items-center gap-3 ${className}`}>
    {/* Live label */}
    <span className={`text-sm font-medium transition-colors duration-200 ${
      !isPro ? 'text-gray-900 font-bold' : 'text-gray-400'
    }`}>
      Live
    </span>
    
    {/* Toggle track */}
    <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 ${
      isPro ? 'bg-orange-400' : 'bg-gray-300'
    }`}>
      {/* Sliding knob */}
      <motion.div
        className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm"
        animate={{
          x: isPro ? 26 : 2,
          transition: { type: 'spring', stiffness: 500, damping: 30 }
        }}
      />
    </div>
    
    {/* Pool label */}
    <span className={`text-sm font-medium transition-colors duration-200 ${
      isPro ? 'text-orange-500 font-bold' : 'text-gray-400'
    }`}>
      Pool
    </span>
  </div>
);

export const SlideButton = ({ activeCard, onCardChange, onHover, className }: SlideButtonProps) => {
  const isPro = activeCard === 0; // VRGDA Pool is "Pool Mode", Auction is "Live"
  
  return (
    <button
      className={`absolute -bottom-12 left-0 z-20 bg-transparent flex items-center justify-center p-2 ${className}`}
      onClick={() => onCardChange(activeCard === 0 ? 1 : 0)}
      aria-label={isPro ? 'Switch to normal mode' : 'Switch to pro mode'}
    >
      <ToggleSlider isPro={isPro} />
    </button>
  );
};