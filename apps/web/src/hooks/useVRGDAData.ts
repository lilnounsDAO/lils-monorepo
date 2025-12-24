"use client";
import { useState, useEffect } from 'react';
import { getVRGDAConfig, VRGDAConfig } from '../data/vrgda/getVRGDAConfig';
import { getCurrentVRGDAPrice } from '../data/vrgda/getVRGDAPrice';

export function useVRGDAData() {
  const [config, setConfig] = useState<VRGDAConfig | null>(null);
  const [currentPrice, setCurrentPrice] = useState<bigint>(BigInt(0));
  const [timeToNextDrop, setTimeToNextDrop] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchVRGDAData() {
      try {
        // First fetch config to check if contract is properly initialized
        const configData = await getVRGDAConfig();
        
        if (configData) {
          setConfig(configData);
          
          // Only fetch price if updateInterval is valid (not zero)
          // A zero updateInterval means the contract isn't initialized or has a division by zero issue
          if (configData.updateInterval > 0) {
            try {
              const price = await getCurrentVRGDAPrice();
              setCurrentPrice(price);
              
              // Calculate time to next price drop
              const now = Math.floor(Date.now() / 1000);
              const elapsed = now % configData.updateInterval;
              setTimeToNextDrop(configData.updateInterval - elapsed);
            } catch (priceError) {
              console.error('Error fetching VRGDA price:', priceError);
              // Set price to reserve price as fallback
              setCurrentPrice(configData.reservePrice);
            }
          } else {
            // Contract not initialized properly, use reserve price
            console.warn('VRGDA contract updateInterval is zero, contract may not be initialized');
            setCurrentPrice(configData.reservePrice);
            setTimeToNextDrop(0);
          }
        }
      } catch (error) {
        console.error('Error fetching VRGDA data:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchVRGDAData();
    
    // Update every 30 seconds
    const interval = setInterval(fetchVRGDAData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Update countdown timer every second
  useEffect(() => {
    if (timeToNextDrop <= 0 || !config || config.updateInterval === 0) return;

    const timer = setInterval(() => {
      setTimeToNextDrop(prev => {
        if (prev <= 1) {
          // Price drop occurred, refetch data
          getCurrentVRGDAPrice()
            .then(setCurrentPrice)
            .catch((error) => {
              console.error('Error fetching VRGDA price in timer:', error);
              // Fallback to reserve price on error
              if (config?.reservePrice) {
                setCurrentPrice(config.reservePrice);
              }
            });
          return config.updateInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeToNextDrop, config]);
  
  return { 
    config, 
    currentPrice, 
    timeToNextDrop, 
    isLoading,
    reservePrice: config?.reservePrice || BigInt(0)
  };
}