import { buildSVG } from "@nouns/sdk";
import { imageData } from "./nounImages/imageData";
import { NounTraitType } from "@/data/noun/types";

const { palette, bgcolors } = imageData;
const { bodies, accessories, heads, glasses } = imageData.images;

const TRAIT_TYPE_VIEW_BOX: Record<NounTraitType, string> = {
  head: "10 -20 300 300",
  glasses: "70 60 160 160",
  body: "90 195 140 140",
  accessory: "90 195 140 140",
  background: "0 0 320 320",
};

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
      return "";
  }
}

/**
 * Get raw SVG string for a trait
 */
export function getTraitSVGString(traitType: NounTraitType, seed: number): string {
  const data = getPartData(traitType, seed);
  const viewBox = TRAIT_TYPE_VIEW_BOX[traitType];
  const bgColor = traitType === "background" ? bgcolors[seed] : undefined;
  
  let svg = buildSVG([{ data }], palette, bgColor);
  
  if (viewBox) {
    svg = svg.replace(`viewBox="0 0 320 320"`, `viewBox="${viewBox}"`);
  }
  
  return svg;
}

/**
 * Convert SVG string to PNG blob
 */
export async function svgToPng(svgString: string, width: number = 320, height: number = 320): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }
      
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert canvas to blob"));
        }
      }, "image/png");
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load SVG image"));
    };
    
    img.src = url;
  });
}

/**
 * Download a blob as a file
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Download trait as SVG
 */
export function downloadTraitAsSVG(traitType: NounTraitType, seed: number, name: string) {
  const svgString = getTraitSVGString(traitType, seed);
  const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const filename = `${traitType}-${name.replace(/\s+/g, "-").toLowerCase()}.svg`;
  downloadBlob(blob, filename);
}

/**
 * Download trait as PNG
 */
export async function downloadTraitAsPNG(traitType: NounTraitType, seed: number, name: string) {
  const svgString = getTraitSVGString(traitType, seed);
  const blob = await svgToPng(svgString);
  const filename = `${traitType}-${name.replace(/\s+/g, "-").toLowerCase()}.png`;
  downloadBlob(blob, filename);
}

