"use client";
import React from 'react';
import { Button } from '@/components/ui/button';

interface VrgdaConnectionStatusProps {
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  isConnected: boolean;
  error?: string | null;
  onRefresh: () => void;
}

export const VrgdaConnectionStatus: React.FC<VrgdaConnectionStatusProps> = ({
  connectionStatus,
  isConnected,
  error,
  onRefresh
}) => {
  const getStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'disconnected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Live Pool Connected';
      case 'connecting': return 'Connecting to Pool';
      case 'disconnected': return 'Pool Disconnected';
      default: return 'Unknown Status';
    }
  };

  return (
    <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${getStatusColor()}`}></div>
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>
      
      {error && (
        <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
          Error: {error}
        </span>
      )}
      
      <Button 
        onClick={onRefresh} 
        size="sm" 
        variant="outline"
        disabled={connectionStatus === 'connecting'}
      >
        {connectionStatus === 'connecting' ? 'Refreshing...' : 'Refresh'}
      </Button>
    </div>
  );
};
