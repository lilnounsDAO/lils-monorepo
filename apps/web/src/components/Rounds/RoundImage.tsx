import { useEffect, useState } from "react";

/**
 * An image from an imported round. The platforms these came from are gone and
 * their CIDs now travel through public IPFS gateways that rate limit, so a load
 * can simply fail. When it does the image switches to `fallbackSrc`, and if
 * there is none it takes itself off the page so the caller's placeholder shows
 * rather than a broken-image icon.
 */
export default function RoundImage({
  src,
  fallbackSrc,
  fallback = null,
  className,
  alt = "",
  width,
  height,
  style,
}: {
  src: string | null | undefined;
  /** Shown instead when `src` will not load. */
  fallbackSrc?: string | null;
  fallback?: React.ReactNode;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
  style?: React.CSSProperties;
}) {
  // How many sources have failed: 0 none, 1 the image, 2 the fallback as well.
  const [failures, setFailures] = useState(0);

  // A new round or author means a new source, so give it a fresh chance.
  useEffect(() => setFailures(0), [src, fallbackSrc]);

  const first = src ?? fallbackSrc;
  // One retry, and only when the fallback is a different picture.
  const second = fallbackSrc && fallbackSrc !== first ? fallbackSrc : null;
  const showing = failures === 0 ? first : failures === 1 ? second : null;
  if (!showing) return <>{fallback}</>;

  return (
    <img
      src={showing}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      className={className}
      style={style}
      key={showing}
      // Only the first source gets a second chance; the fallback failing too
      // means there is nothing left to show.
      onError={() => setFailures((count) => count + 1)}
    />
  );
}
