import { Noun, NounTraitType } from "@/data/noun/types";
import { buildSVG } from "@nouns/sdk";
import { imageData } from "./imageData";

const { palette, bgcolors } = imageData;
const { bodies, accessories, heads, glasses } = imageData.images;

// NEW: Memoization cache for SVG generation
interface SeedKey {
  background: number;
  body: number;
  accessory: number;
  head: number;
  glasses: number;
}

const svgCache = new Map<string, string>();

function getSeedKey(seed: SeedKey): string {
  return `${seed.background}-${seed.body}-${seed.accessory}-${seed.head}-${seed.glasses}`;
}

function getCachedSvg(seed: SeedKey, imageType: NounImageType): string | undefined {
  const key = `${getSeedKey(seed)}-${imageType}`;
  return svgCache.get(key);
}

function setCachedSvg(seed: SeedKey, imageType: NounImageType, svg: string): void {
  const key = `${getSeedKey(seed)}-${imageType}`;
  svgCache.set(key, svg);

  // Limit cache size to prevent memory leaks (max 1000 entries)
  if (svgCache.size > 1000) {
    const firstKey = svgCache.keys().next().value;
    if (firstKey) {
      svgCache.delete(firstKey);
    }
  }
}

export type NounImageType = "full" | NounTraitType;

export function buildBase64Image(
  parts: {
    data: string;
  }[],
  bgColor?: string,
  cropViewBox?: string,
) {
  let svg = buildSVG(parts, palette, bgColor);

  if (cropViewBox) {
    svg = svg.replace(`viewBox="0 0 320 320"`, `viewBox="${cropViewBox}"`);
  }

  const svgBase64 = btoa(svg);

  return "data:image/svg+xml;base64," + svgBase64;
}

export function getNounData(seed: {
  background: number;
  body: number;
  accessory: number;
  head: number;
  glasses: number;
}) {
  return {
    parts: [
      bodies[seed.body],
      accessories[seed.accessory],
      heads[seed.head],
      glasses[seed.glasses],
    ],
    background: bgcolors[seed.background],
  };
}

export function buildNounImage(
  traits: Noun["traits"],
  imageType: NounImageType,
): string {
  const seed = {
    background: traits.background.seed,
    body: traits.body.seed,
    accessory: traits.accessory.seed,
    head: traits.head.seed,
    glasses: traits.glasses.seed,
  };

  // Check cache first
  const cachedSvg = getCachedSvg(seed, imageType);
  if (cachedSvg) {
    // Silently return cached SVG (remove logging for performance)
    return cachedSvg;
  }

  const { parts, background } = getNounData(seed);
  const [bodyPart, accessoryPart, headPart, glassesPart] = parts;

  let result: string;

  switch (imageType) {
    case "full":
      result = buildBase64Image(parts, background);
      break;
    case "body":
      result = buildBase64Image([bodyPart], background);
      break;
    case "accessory":
      result = buildBase64Image([accessoryPart], background);
      break;
    case "head":
      result = buildBase64Image([headPart], background);
      break;
    case "glasses":
      result = buildBase64Image([glassesPart], background);
      break;
    case "background":
      result = buildBase64Image([{ data: "0x0" }], background);
      break;
    default:
      result = "";
  }

  // Cache the result
  setCachedSvg(seed, imageType, result);

  return result;
}

const TRAIT_TYPE_VIEW_BOX: Record<NounTraitType, string> = {
  head: "10 -20 300 300",
  glasses: "70 60 160 160",
  body: "90 195 140 140",
  accessory: "90 195 140 140",
  background: "0 0 320 320",
};

export function buildNounTraitImage(
  traitType: NounTraitType,
  seed: number,
): string {
  const data = getPartData(traitType, seed);
  let viewBox = TRAIT_TYPE_VIEW_BOX[traitType];

  return buildBase64Image(
    [{ data }],
    traitType == "background" ? bgcolors[seed] : undefined,
    viewBox,
  );
}

function getPartData(traitType: NounTraitType, seed: number) {
  switch (traitType) {
    case "head":
      return heads[seed].data;
    case "glasses":
      return glasses[seed].data;
    case "body":
      return bodies[seed].data;
    case "accessory":
      return accessories[seed].data;
    case "background":
      return ""; // TODO
  }
}
