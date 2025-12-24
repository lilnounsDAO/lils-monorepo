/**
 * Utility to get trait part names from imageData
 */
import { imageData } from './imageData';

// Extract part names from filename by removing the category prefix
const extractPartName = (filename: string, category: string): string => {
  const prefix = `${category}-`;
  if (filename.startsWith(prefix)) {
    return filename.substring(prefix.length);
  }
  return filename;
};

export const getTraitPartNames = () => {
  const traitNames = {
    backgrounds: [] as string[],
    bodies: [] as string[],
    accessories: [] as string[],
    heads: [] as string[],
    glasses: [] as string[]
  };

  // Extract backgrounds (these don't have prefixes, just use index)
  traitNames.backgrounds = ['Cool', 'Warm']; // Based on the two background colors in bgcolors

  // Extract bodies
  if (imageData.images?.bodies) {
    traitNames.bodies = imageData.images.bodies.map((item: any) => 
      extractPartName(item.filename, 'body')
    );
  }

  // Extract accessories  
  if (imageData.images?.accessories) {
    traitNames.accessories = imageData.images.accessories.map((item: any) => 
      extractPartName(item.filename, 'accessory')
    );
  }

  // Extract heads
  if (imageData.images?.heads) {
    traitNames.heads = imageData.images.heads.map((item: any) => 
      extractPartName(item.filename, 'head')
    );
  }

  // Extract glasses
  if (imageData.images?.glasses) {
    traitNames.glasses = imageData.images.glasses.map((item: any) => 
      extractPartName(item.filename, 'glasses')
    );
  }

  return traitNames;
};

export const getPartNameForTrait = (category: string, index: number): string => {
  const traitNames = getTraitPartNames();
  
  switch (category) {
    case 'background':
      return traitNames.backgrounds[index] || `Background ${index}`;
    case 'body':
      return traitNames.bodies[index] || `Body ${index}`;
    case 'accessory':
      return traitNames.accessories[index] || `Accessory ${index}`;
    case 'head':
      return traitNames.heads[index] || `Head ${index}`;
    case 'glasses':
      return traitNames.glasses[index] || `Glasses ${index}`;
    default:
      return `${category} ${index}`;
  }
};