"use client";
import React, { useState } from 'react';
import { useVrgdaRealtimePool } from '@/data/ponder/hooks/useVrgdaRealtimePool';
import { useVrgdaPoolStatus, useUpcomingAuctionSeeds } from '@/data/ponder/hooks/useVrgdaQueries';
import { vrgdaSeedToImage, getUpcomingAuctionPreviews } from '@/data/ponder/vrgda/vrgdaSeedToImage';
import { VrgdaPoolSeed } from '@/data/ponder/vrgda/types';
import { isSepoliaNetwork } from '@/utils/networkDetection';

interface VrgdaPoolMonitorProps {
  /**
   * Whether to show real-time updates in the UI
   * @default true
   */
  showRealtimeUpdates?: boolean;
  
  /**
   * Number of upcoming seeds to preview
   * @default 5
   */
  previewCount?: number;
  
  /**
   * Whether to show detailed pool status
   * @default true
   */
  showPoolStatus?: boolean;
  
  /**
   * Whether to show latest block information
   * @default true
   */
  showLatestBlock?: boolean;
  
  /**
   * Custom callback for new seeds
   */
  onNewSeeds?: (seeds: VrgdaPoolSeed[]) => void;
  
  /**
   * Custom callback for used seeds
   */
  onSeedsUsed?: (seeds: VrgdaPoolSeed[]) => void;
  
  /**
   * Custom callback for invalidated seeds
   */
  onSeedsInvalidated?: (seeds: VrgdaPoolSeed[]) => void;
}

export function VrgdaPoolMonitor({
  showRealtimeUpdates = true,
  previewCount = 5,
  showPoolStatus = true,
  showLatestBlock = true,
  onNewSeeds,
  onSeedsUsed,
  onSeedsInvalidated
}: VrgdaPoolMonitorProps) {
  const isSepolia = isSepoliaNetwork();
  const [recentUpdates, setRecentUpdates] = useState<Array<{
    type: 'new' | 'used' | 'invalidated' | 'block';
    seed?: VrgdaPoolSeed;
    blockData?: { number: string; hash: string; timestamp: number };
    timestamp: string;
    image?: string;
  }>>([]);

  // Real-time monitoring with the new unified hook
  // Disabled on Sepolia - not indexed in Ponder yet
  const { 
    isActive, 
    latestBlock, 
    error, 
    connectionStatus, 
    refresh, 
    invalidateAll 
  } = useVrgdaRealtimePool({
    enabled: !isSepolia, // Disable on Sepolia - not indexed in Ponder yet
    onNewSeeds: (seeds) => {
      if (showRealtimeUpdates) {
        const updates = seeds.map(seed => ({
          type: 'new' as const,
          seed,
          timestamp: new Date().toISOString(),
          image: vrgdaSeedToImage(seed, { imageType: 'full' })
        }));
        setRecentUpdates(prev => [...updates, ...prev].slice(0, 15));
      }
      onNewSeeds?.(seeds);
    },
    onSeedsUsed: (seeds) => {
      if (showRealtimeUpdates) {
        const updates = seeds.map(seed => ({
          type: 'used' as const,
          seed,
          timestamp: new Date().toISOString(),
          image: vrgdaSeedToImage(seed, { imageType: 'full' })
        }));
        setRecentUpdates(prev => [...updates, ...prev].slice(0, 15));
      }
      onSeedsUsed?.(seeds);
    },
    onSeedsInvalidated: (seeds) => {
      if (showRealtimeUpdates) {
        const updates = seeds.map(seed => ({
          type: 'invalidated' as const,
          seed,
          timestamp: new Date().toISOString(),
          image: vrgdaSeedToImage(seed, { imageType: 'full' })
        }));
        setRecentUpdates(prev => [...updates, ...prev].slice(0, 15));
      }
      onSeedsInvalidated?.(seeds);
    },
    onLatestBlock: (blockData) => {
      if (showRealtimeUpdates) {
        setRecentUpdates(prev => [{
          type: 'block',
          blockData,
          timestamp: new Date().toISOString()
        }, ...prev].slice(0, 15));
      }
    }
  });

  // Pool status
  const { data: poolStatus, isLoading: statusLoading } = useVrgdaPoolStatus();
  
  // Upcoming seeds
  const { data: upcomingSeeds, isLoading: seedsLoading } = useUpcomingAuctionSeeds(previewCount);

  // Generate preview images for upcoming seeds
  const upcomingPreviews = upcomingSeeds ? 
    getUpcomingAuctionPreviews(upcomingSeeds, previewCount) : [];

  // Show message on Sepolia - VRGDA pool not indexed yet
  if (isSepolia) {
    return (
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="text-center text-gray-600">
          <p className="text-sm">VRGDA pool monitoring is not available on Sepolia.</p>
          <p className="text-xs mt-2 text-gray-500">The pool has not been indexed in Ponder yet.</p>
        </div>
      </div>
    );
  }

  if (statusLoading || seedsLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-32 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Pool Status */}
      {showPoolStatus && poolStatus && (
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">VRGDA Pool Status</h3>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-green-500' : 
                  connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="text-sm text-gray-600 capitalize">
                  {connectionStatus}
                </span>
              </div>
              {error && (
                <div className="text-xs text-red-600 max-w-xs truncate" title={error}>
                  Error: {error}
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Pool Size</p>
              <p className="text-2xl font-bold">{poolStatus.poolSize}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Available</p>
              <p className="text-2xl font-bold text-green-600">{poolStatus.availableSeeds}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Used</p>
              <p className="text-2xl font-bold text-blue-600">{poolStatus.usedSeeds}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Latest Block</p>
              <p className="text-lg font-mono">{poolStatus.latestSeedBlock}</p>
            </div>
          </div>
          
          {/* Latest Block Info */}
          {showLatestBlock && latestBlock && (
            <div className="mt-4 p-4 bg-gray-100 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-gray-700">Latest Block</h4>
                <span className="text-xs text-gray-500">
                  {new Date(latestBlock.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Block Number</p>
                  <p className="font-mono font-medium">{latestBlock.blockNumber}</p>
                </div>
                <div>
                  <p className="text-gray-600">Block Hash</p>
                  <p className="font-mono text-xs">{latestBlock.blockHash.slice(0, 20)}...</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex space-x-2">
            <button 
              onClick={refresh}
              disabled={connectionStatus === 'connecting'}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {connectionStatus === 'connecting' ? 'Refreshing...' : 'Refresh Now'}
            </button>
            <button 
              onClick={invalidateAll}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Cache
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Auction Previews */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Upcoming Auction Previews</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {upcomingPreviews.map((preview, index) => (
            <div 
              key={preview.blockNumber}
              className={`border rounded-lg p-4 ${preview.isNext ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}
            >
              <div className="aspect-square mb-2">
                <img 
                  src={preview.smallImage ?? "/noun-loading-skull.gif"} 
                  alt={`Noun preview for block ${preview.blockNumber}`}
                  className="w-full h-full object-contain"
                />
              </div>
              <p className="text-sm font-mono">Block {preview.blockNumber}</p>
              {preview.isNext && (
                <p className="text-xs text-green-600 font-medium">Next Auction</p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Updates */}
      {showRealtimeUpdates && recentUpdates.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4">Recent Updates</h3>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {recentUpdates.map((update, index) => {
              const updateKey = update.type === 'block' 
                ? `block-${update.blockData?.number}-${update.timestamp}`
                : `${update.seed?.blockNumber}-${update.type}-${update.timestamp}`;
              
              return (
                <div 
                  key={updateKey}
                  className={`flex items-center space-x-3 p-3 rounded-lg ${
                    update.type === 'new' ? 'bg-green-100' : 
                    update.type === 'used' ? 'bg-blue-100' :
                    update.type === 'invalidated' ? 'bg-red-100' :
                    'bg-gray-100'
                  }`}
                >
                  {update.type !== 'block' && update.image && (
                    <div className="w-12 h-12 flex-shrink-0">
                      <img 
                        src={update.image ?? "/noun-loading-skull.gif"} 
                        alt={`Noun ${update.seed?.blockNumber}`}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  {update.type === 'block' && (
                    <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center bg-gray-200 rounded">
                      <span className="text-xs font-mono">📦</span>
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {update.type === 'new' && '🎱 New seed available'}
                      {update.type === 'used' && '✅ Seed used in auction'}
                      {update.type === 'invalidated' && '❌ Seed invalidated'}
                      {update.type === 'block' && '📦 New block detected'}
                    </p>
                    <p className="text-xs text-gray-600">
                      {update.type === 'block' 
                        ? `Block ${update.blockData?.number}` 
                        : `Block ${update.seed?.blockNumber}`
                      } • {new Date(update.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
