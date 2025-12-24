"use client";
import { VrgdaExploreViewer } from './components/VrgdaExploreViewer';

export default function VrgdaExplorePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">VRGDA Explore</h1>
        <p className="text-gray-600">
          Browse and purchase from 256 latest VRGDA Nouns with real-time pool updates
        </p>
      </div>
      
      <VrgdaExploreViewer />
    </div>
  );
}
