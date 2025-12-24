import { formatEther } from 'viem';

interface VRGDAPriceIndicatorProps {
  currentPrice: bigint;
  reservePrice: bigint;
  targetPrice: bigint;
}

export const VRGDAPriceIndicator = ({ 
  currentPrice, 
  reservePrice, 
  targetPrice 
}: VRGDAPriceIndicatorProps) => {
  const maxPrice = targetPrice * BigInt(2);
  const priceRange = maxPrice - reservePrice;
  
  let percentage = 0;
  if (priceRange > 0) {
    const currentPosition = currentPrice - reservePrice;
    percentage = Number(currentPosition * BigInt(100) / priceRange);
  }
  
  // Color blocks representing price ranges (high to low)
  const blockColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
  const activeIndex = Math.floor(Math.max(0, Math.min(99, percentage)) / 20);
  
  return (
    <div className="vrgda-price-indicator mb-4">
      <div className="flex gap-1 mb-2">
        {blockColors.map((color, index) => (
          <div
            key={index}
            className={`flex-1 h-6 w-12 rounded ${index === activeIndex ? 'ring-2 ring-blue-500' : ''}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      
      <div className="flex justify-between text-xs text-gray-600">
        <span className="flex items-center gap-1">
          {parseFloat(formatEther(reservePrice)).toFixed(4)}
          <svg className="w-3 h-3" viewBox="0 0 256 417" fill="currentColor">
            <path d="m127.961 0-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/>
            <path d="m127.962 0-127.962 212.32 127.962 75.639v-288z"/>
            <path d="m127.961 312.187-1.575 1.92v98.199l1.575 4.6 128.038-180.32z"/>
            <path d="m127.962 416.905v-104.718l-127.962-75.6z"/>
            <path d="m127.961 287.958 127.96-75.637-127.96-58.162z"/>
            <path d="m.001 212.321 127.96 75.637v-133.799z"/>
          </svg>
        </span>
        <span className="flex items-center gap-1">
          {parseFloat(formatEther(targetPrice)).toFixed(4)}
          <svg className="w-3 h-3" viewBox="0 0 256 417" fill="currentColor">
            <path d="m127.961 0-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/>
            <path d="m127.962 0-127.962 212.32 127.962 75.639v-288z"/>
            <path d="m127.961 312.187-1.575 1.92v98.199l1.575 4.6 128.038-180.32z"/>
            <path d="m127.962 416.905v-104.718l-127.962-75.6z"/>
            <path d="m127.961 287.958 127.96-75.637-127.96-58.162z"/>
            <path d="m.001 212.321 127.96 75.637v-133.799z"/>
          </svg>
        </span>
        <span className="flex items-center gap-1">
          {parseFloat(formatEther(maxPrice)).toFixed(4)}
          <svg className="w-3 h-3" viewBox="0 0 256 417" fill="currentColor">
            <path d="m127.961 0-2.795 9.5v275.668l2.795 2.79 127.962-75.638z"/>
            <path d="m127.962 0-127.962 212.32 127.962 75.639v-288z"/>
            <path d="m127.961 312.187-1.575 1.92v98.199l1.575 4.6 128.038-180.32z"/>
            <path d="m127.962 416.905v-104.718l-127.962-75.6z"/>
            <path d="m127.961 287.958 127.96-75.637-127.96-58.162z"/>
            <path d="m.001 212.321 127.96 75.637v-133.799z"/>
          </svg>
        </span>
      </div>
    </div>
  );
};