"use client";
import { useAvailableNouns } from '@/hooks/useAvailableNouns';
import { VRGDABuyButton } from './VRGDABuyButton';
import { formatEther } from 'viem';

export const VRGDANounPool = () => {
  // Fetch latest 10 previous blocks + 1 next block VRGDA nouns (total 11)
  // Shows more minting options for users
  const { nextNoun, previousNouns, isLoading } = useAvailableNouns();
  
  if (isLoading) return <div>Loading available nouns...</div>;
  
  return (
    <section className="vrgda-noun-pool mt-8">
      <h2 className="text-2xl font-bold mb-2">Available Lil Nouns</h2>
      <p className="text-gray-600 mb-6">
        You may also want to mint one of {previousNouns.length} Lil Nouns generated in previous blocks.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {previousNouns.map(noun => (
          <div key={noun.id} className="available-noun border rounded-lg p-4">
            <img 
              src={noun.image ?? "/noun-loading-skull.gif"} 
              alt={`Lil Noun ${noun.id}`}
              className="w-full aspect-square object-contain mb-4"
            />
            <div className="noun-info mb-4">
              <h3 className="font-semibold">Lil Noun {noun.id}</h3>
              <p className="text-gray-600">
                Price: {parseFloat(formatEther(BigInt(noun.price))).toFixed(4)} ETH
              </p>
              <p className="text-sm text-gray-500">
                Block: {noun.blockNumber}
              </p>
            </div>
            <VRGDABuyButton 
              expectedBlockNumber={noun.blockNumber}
              expectedNounId={parseInt(noun.id)}
              currentPrice={BigInt(noun.price)}
            />
          </div>
        ))}
      </div>
    </section>
  );
};