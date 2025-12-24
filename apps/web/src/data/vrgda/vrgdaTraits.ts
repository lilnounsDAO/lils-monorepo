/**
 * VRGDA trait data structure matching the NounTrait format
 */
import { imageData } from '@/utils/nounImages/imageData';
import { capitalizeFirstLetterOfEveryWord } from '@/utils/format';

export interface VrgdaTrait {
  name: string;
  seed: number;
}

export type VrgdaTraitType = 'background' | 'body' | 'accessory' | 'head' | 'glasses';

// Background traits (2 options based on bgcolors)
export const VRGDA_BACKGROUND_TRAITS: VrgdaTrait[] = [
  { name: "Cool", seed: 0 },
  { name: "Warm", seed: 1 },
];

// Body traits from imageData
export const VRGDA_BODY_TRAITS: VrgdaTrait[] = imageData.images.bodies.map(
  (item, i) => ({
    name: capitalizeFirstLetterOfEveryWord(
      item.filename
        .substring(item.filename.indexOf("-") + 1)
        .split("-")
        .join(" "),
    ),
    seed: i,
  }),
);

// Accessory traits from imageData
export const VRGDA_ACCESSORY_TRAITS: VrgdaTrait[] = imageData.images.accessories.map(
  (item, i) => ({
    name: capitalizeFirstLetterOfEveryWord(
      item.filename
        .substring(item.filename.indexOf("-") + 1)
        .split("-")
        .join(" "),
    ),
    seed: i,
  }),
);

// Head traits from imageData
export const VRGDA_HEAD_TRAITS: VrgdaTrait[] = imageData.images.heads.map(
  (item, i) => ({
    name: capitalizeFirstLetterOfEveryWord(
      item.filename
        .substring(item.filename.indexOf("-") + 1)
        .split("-")
        .join(" "),
    ),
    seed: i,
  }),
);

// Glasses traits from imageData
export const VRGDA_GLASSES_TRAITS: VrgdaTrait[] = imageData.images.glasses.map(
  (item, i) => ({
    name: capitalizeFirstLetterOfEveryWord(
      item.filename
        .substring(item.filename.indexOf("-") + 1)
        .split("-")
        .join(" "),
    ),
    seed: i,
  }),
);

// All traits organized by type
export const VRGDA_TRAITS_BY_TYPE = {
  background: VRGDA_BACKGROUND_TRAITS,
  body: VRGDA_BODY_TRAITS,
  accessory: VRGDA_ACCESSORY_TRAITS,
  head: VRGDA_HEAD_TRAITS,
  glasses: VRGDA_GLASSES_TRAITS,
} as const;