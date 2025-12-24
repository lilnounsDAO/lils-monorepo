/**
 * Utilities for converting between trait names and URL-friendly slugs
 * Used for cleaner URLs: explore?head=cat instead of explore?head[]=36
 */

import { NounTraitType, NounTrait } from "@/data/noun/types";
import { stringUtils } from "./common";
import {
  ACCESSORY_TRAITS,
  BACKGROUND_TRAITS,
  BODY_TRAITS,
  GLASSES_TRAITS,
  HEAD_TRAITS,
} from "@/components/NounExplorer/NounFilter";

// Get all traits for a given trait type
function getTraitsForType(traitType: NounTraitType): NounTrait[] {
  switch (traitType) {
    case "background":
      return BACKGROUND_TRAITS;
    case "head":
      return HEAD_TRAITS;
    case "glasses":
      return GLASSES_TRAITS;
    case "body":
      return BODY_TRAITS;
    case "accessory":
      return ACCESSORY_TRAITS;
  }
}

/**
 * Convert trait name to URL-friendly slug
 * Example: "Cool Cat" -> "cool-cat"
 */
export function traitNameToSlug(name: string): string {
  return stringUtils.slugify(name);
}

/**
 * Convert URL slug back to trait name
 * Example: "cool-cat" -> "Cool Cat"
 */
export function slugToTraitName(slug: string, traitType: NounTraitType): string | null {
  const traits = getTraitsForType(traitType);
  const normalizedSlug = slug.toLowerCase();
  
  // Find trait by matching slugified name
  const trait = traits.find((t) => traitNameToSlug(t.name).toLowerCase() === normalizedSlug);
  return trait?.name || null;
}

/**
 * Convert trait seed value to URL slug
 * Example: seed 36 for "head" -> "cool-cat" (or whatever trait name corresponds to seed 36)
 */
export function seedToSlug(seed: number, traitType: NounTraitType): string | null {
  const traits = getTraitsForType(traitType);
  const trait = traits.find((t) => t.seed === seed);
  return trait ? traitNameToSlug(trait.name) : null;
}

/**
 * Convert URL slug to trait seed value
 * Example: "cool-cat" for "head" -> 36 (or whatever seed corresponds to "Cool Cat")
 */
export function slugToSeed(slug: string, traitType: NounTraitType): number | null {
  const traits = getTraitsForType(traitType);
  const normalizedSlug = slug.toLowerCase();
  
  const trait = traits.find((t) => traitNameToSlug(t.name).toLowerCase() === normalizedSlug);
  return trait?.seed ?? null;
}

/**
 * Convert array of seed values to array of slugs
 */
export function seedsToSlugs(seeds: number[], traitType: NounTraitType): string[] {
  return seeds
    .map((seed) => seedToSlug(seed, traitType))
    .filter((slug): slug is string => slug !== null);
}

/**
 * Convert array of slugs to array of seed values
 */
export function slugsToSeeds(slugs: string[], traitType: NounTraitType): number[] {
  return slugs
    .map((slug) => slugToSeed(slug, traitType))
    .filter((seed): seed is number => seed !== null);
}
