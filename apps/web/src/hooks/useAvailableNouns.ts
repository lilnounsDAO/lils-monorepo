"use client";
import { useState, useEffect } from 'react';
import { getAvailableNouns, AvailableNoun } from '../data/vrgda/getAvailableNouns';

export function useAvailableNouns() {
  const [nextNoun, setNextNoun] = useState<AvailableNoun | null>(null);
  const [previousNouns, setPreviousNouns] = useState<AvailableNoun[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAvailableNouns() {
      try {
        const { nextNoun, previousNouns } = await getAvailableNouns(10);
        setNextNoun(nextNoun);
        setPreviousNouns(previousNouns);
      } catch (error) {
        console.error('Error fetching available nouns:', error);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAvailableNouns();
    
    // Update every minute
    const interval = setInterval(fetchAvailableNouns, 60000);
    return () => clearInterval(interval);
  }, []);
  
  return { nextNoun, previousNouns, isLoading };
}