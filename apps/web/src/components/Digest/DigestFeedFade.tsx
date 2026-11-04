import type { CSSProperties } from "react";

// Stacked backdrop blurs, each masked to a lower band, so blur ramps up
// toward the bottom edge instead of starting at a hard line.
const BLUR_LAYERS = [
  { blur: 0.5, start: 0, end: 50 },
  { blur: 1, start: 20, end: 70 },
  { blur: 2, start: 40, end: 90 },
  { blur: 4, start: 60, end: 100 },
];

function layerStyle(blur: number, start: number, end: number): CSSProperties {
  const mask = `linear-gradient(to bottom, transparent ${start}%, black ${end}%)`;
  return {
    backdropFilter: `blur(${blur}px)`,
    WebkitBackdropFilter: `blur(${blur}px)`,
    maskImage: mask,
    WebkitMaskImage: mask,
  };
}

/**
 * Pinned to the bottom of the viewport while more of the feed is below, so
 * rows dissolve into the page as they scroll in.
 */
export default function DigestFeedFade() {
  return (
    <div
      aria-hidden
      className="pointer-events-none sticky bottom-0 -mt-32 h-32 w-full"
    >
      {BLUR_LAYERS.map((layer) => (
        <div
          key={layer.blur}
          className="absolute inset-0"
          style={layerStyle(layer.blur, layer.start, layer.end)}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background-primary/60 to-background-primary" />
    </div>
  );
}
