"use client";
import { useVRGDAData } from "@/hooks/useVRGDAData";
import { useVrgdaRealtimePool } from "@/data/ponder/hooks/useVrgdaRealtimePool";
import { useAvailableNouns } from "@/hooks/useAvailableNouns";
import { formatEther } from "viem";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { isSepoliaNetwork } from "@/utils/networkDetection";

export const VRGDAPoolCard = () => {
  const { currentPrice, timeToNextDrop, isLoading, reservePrice } = useVRGDAData();
  const isSepolia = isSepoliaNetwork();
  const { latestBlock } = useVrgdaRealtimePool({ enabled: !isSepolia }); // Disable on Sepolia - not indexed in Ponder yet
  const { nextNoun, previousNouns, isLoading: nounsLoading } = useAvailableNouns();
  const navigate = useNavigate();

  // Format time to next drop
  const formatTimeToNextDrop = (seconds: number | undefined) => {
    if (!seconds || seconds <= 0) return "Now";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const currentPriceEth = currentPrice ? parseFloat(formatEther(currentPrice)).toFixed(4) : "—";
  const timeDisplay = formatTimeToNextDrop(timeToNextDrop);

  // Handle noun click with selection animation
  const handleNounClick = (nounId: string) => {
    // Navigate to explore page with pre-selected noun
    navigate(`/vrgda/explore?noun=${nounId}`);
  };

  // Get display nouns (next + previous 3)
  const displayNouns = [
    ...(nextNoun ? [nextNoun] : []),
    ...previousNouns.slice(0, 3)
  ];

  if (isLoading) {
    return (
      <div className="relative flex h-full min-h-[593px] w-full flex-col justify-center overflow-hidden rounded-2xl border-2 bg-gray-50 md:h-[477px] md:min-h-fit">
        <div className="flex items-center justify-center w-full h-full">
          <div className="text-content-secondary">Loading pool data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-[593px] w-full flex-col justify-center overflow-hidden rounded-2xl border-2 bg-gray-50 md:h-[477px] md:min-h-[477px]">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-gray-100" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full p-6 md:p-8 pt-8 md:pt-12">
        {/* Top row - Title and Price Info */}
        <div className="flex items-start justify-between mb-8">
          {/* Left side - The Pool title */}
          <div className="flex-shrink-0">
            <h2 className="heading-1 text-gray-900">
              The Pool
            </h2>
          </div>

          {/* Right side - Price info in two columns */}
          <div className="flex items-start gap-8 md:gap-12">
            {/* Current Price */}
            <div className="text-right">
              <div className="label-md text-gray-600 mb-1">
                Current price
              </div>
              <div className="heading-2 text-gray-900">
                {currentPriceEth} ETH
              </div>
            </div>

            {/* Price drops in - Hide when at reserve price */}
            {currentPrice && reservePrice && currentPrice > reservePrice && (
              <div className="text-right">
                <div className="label-md text-gray-600 mb-1">
                  Price drops in
                </div>
                <div className="heading-2 text-gray-900 font-mono">
                  {timeDisplay}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Noun Preview Grid */}
        {!nounsLoading && displayNouns.length > 0 && (
          <div className="flex-1 flex flex-col">
            <div className="label-md text-gray-600 mb-3">
              Available Nouns
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {displayNouns.map((noun, index) => (
                <motion.div
                  key={noun.id}
                  className="group relative overflow-clip rounded-lg shadow-sm hover:shadow-lg transition-all duration-200"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    transition: { delay: index * 0.1, duration: 0.3 }
                  }}
                >
                  <HoldToBuyNoun
                    noun={{
                      id: noun.id,
                      image: noun.image,
                      blockNumber: latestBlock?.blockNumber
                    }}
                    currentPrice={currentPrice}
                    onQuickClick={() => handleNounClick(noun.id)}
                  >
                    <div className="relative cursor-pointer">
                      {/* Noun Image */}
                      <img
                        src={noun.image ?? "/noun-loading-skull.gif"}
                        alt={`Noun ${noun.id}`}
                        className="w-full aspect-square object-contain bg-gray-100 rounded-lg pointer-events-none"
                        draggable={false}
                        onDragStart={(e) => e.preventDefault()}
                        style={{
                          userSelect: 'none',
                          WebkitUserSelect: 'none',
                          MozUserSelect: 'none',
                          msUserSelect: 'none',
                          WebkitUserDrag: 'none',
                          KhtmlUserDrag: 'none',
                          MozUserDrag: 'none',
                          OUserDrag: 'none',
                          userDrag: 'none',
                          pointerEvents: 'none'
                        }}
                      />
                      
                      {/* Noun ID Overlay */}
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="bg-black text-white text-xs font-semibold px-2 py-1 rounded-sm">
                          #{noun.id}
                        </span>
                      </div>
                    </div>
                  </HoldToBuyNoun>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Explore All Link */}
        <div className="mt-6">
          <Link 
            to="/vrgda/explore"
            className="inline-flex items-center justify-center w-full px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors label-md font-medium"
          >
            Explore All Nouns
          </Link>
        </div>
      </div>
    </div>
  );
};