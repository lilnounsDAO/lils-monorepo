"use client";
import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay, DialogPortal } from '@/components/ui/dialogBase';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { vrgdaSeedToImage } from '@/data/ponder/vrgda/vrgdaSeedToImage';

interface TraitCombo {
  background?: number;
  body?: number;
  accessory?: number;
  head?: number;
  glasses?: number;
}

interface BuildNounModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableTraits: {
    background: number[];
    body: number[];
    accessory: number[];
    head: number[];
    glasses: number[];
  };
  onApplyCombo: (combo: TraitCombo) => void;
}

export const BuildNounModal: React.FC<BuildNounModalProps> = ({
  isOpen,
  onClose,
  availableTraits,
  onApplyCombo
}) => {
  const [selectedTraits, setSelectedTraits] = useState<TraitCombo>({});

  // Generate preview image
  const previewSeed = useMemo(() => {
    return {
      id: 'preview',
      blockNumber: '0',
      nounId: '0',
      background: selectedTraits.background || 0,
      body: selectedTraits.body || 0,
      accessory: selectedTraits.accessory || 0,
      head: selectedTraits.head || 0,
      glasses: selectedTraits.glasses || 0,
      blockHash: '0x0',
      isUsed: false,
      isValid: true,
      generatedAt: '0',
      invalidatedAt: null
    };
  }, [selectedTraits]);

  const previewImage = vrgdaSeedToImage(previewSeed, { imageType: 'full' });

  const handleTraitChange = (trait: keyof TraitCombo, value: string) => {
    setSelectedTraits(prev => ({
      ...prev,
      [trait]: value === 'any' ? undefined : parseInt(value)
    }));
  };

  const handleApply = () => {
    onApplyCombo(selectedTraits);
    onClose();
  };

  const handleClear = () => {
    setSelectedTraits({});
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogPortal>
        <DialogOverlay />
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Build a Noun</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Trait Selectors */}
            <div className="space-y-4">
              <h3 className="font-semibold">Select Traits</h3>
              
              {Object.entries(availableTraits).map(([category, values]) => (
                <div key={category}>
                  <label className="block text-sm font-medium mb-1 capitalize">
                    {category}
                  </label>
                  <select
                    value={selectedTraits[category as keyof TraitCombo]?.toString() || 'any'}
                    onChange={(e) => handleTraitChange(category as keyof TraitCombo, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="any">Any {category}</option>
                    {values.map(value => (
                      <option key={value} value={value.toString()}>
                        {category} {value}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            {/* Preview */}
            <div className="flex flex-col items-center">
              <h3 className="font-semibold mb-4">Preview</h3>
              <div className="w-48 h-48 border-2 border-gray-200 rounded-lg overflow-hidden bg-gray-100">
                {Object.keys(selectedTraits).length > 0 ? (
                  <img
                    src={previewImage}
                    alt="Noun Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">
                    Select traits to preview
                  </div>
                )}
              </div>
              
              {/* Selected Traits Summary */}
              <div className="mt-4 text-sm text-center">
                {Object.entries(selectedTraits).length > 0 ? (
                  <div>
                    <p className="font-medium">Selected Traits:</p>
                    {Object.entries(selectedTraits).map(([trait, value]) => (
                      <p key={trait} className="text-gray-600">
                        {trait}: {value}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No traits selected</p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4">
            <Button onClick={handleClear} variant="outline">
              Clear All
            </Button>
            <div className="space-x-2">
              <Button onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleApply} disabled={Object.keys(selectedTraits).length === 0}>
                Find Matches
              </Button>
            </div>
          </div>
        </DialogContent>
      </DialogPortal>
    </Dialog>
  );
};
