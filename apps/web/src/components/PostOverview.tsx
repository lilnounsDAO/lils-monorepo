import React, { useState, useCallback, useMemo } from "react";
import { getPostOverviews } from "@/data/cms/getPostOverviews";
import Image from "@/components/OptimizedImage";
import { Link } from "react-router-dom";

// interface PostOverviewProps {
//   data: NonNullable<Awaited<ReturnType<typeof getPostOverviews>>>[number];
// }

// export default function PostOverview({ data }: PostOverviewProps) {
//   // URL already normalized in fetch layer
//   const [imgSrc, setImgSrc] = React.useState<string | undefined>(data.heroImage?.url);
//   const handleImgError = React.useCallback(() => {
//     setImgSrc(undefined);
//   }, []);
//   return (
//     <Link
//       to={`/learn/${data.slug}`}
//       className="flex h-[368px] w-full max-w-[750px] flex-col overflow-hidden rounded-[32px] transition-all clickable-active hover:brightness-90"
//       key={data.id}
//     >
//       {imgSrc && (
//         <Image
//           src={imgSrc}
//           width={400}
//           height={225}
//           className="aspect-video h-[212px] w-full object-cover"
//           alt={data.heroImage?.alt || data.title}
//           onError={handleImgError}
//         />
//       )}
//       <div className="grow bg-background-secondary p-6">
//         <h2 className="heading-4">{data.title}</h2>
//       </div>
//     </Link>
//   );
// }



interface PostOverviewProps {
  data: NonNullable<Awaited<ReturnType<typeof getPostOverviews>>>[number];
}

// Component to handle image loading with fallback URLs
// Memoized to prevent re-renders when parent re-renders
const HeroImageWithFallback = React.memo(function HeroImageWithFallback({ 
  src, 
  alt, 
  filename,
  rawUrl,
  className,
  width,
  height,
}: { 
  src: string; 
  alt: string; 
  filename?: string;
  rawUrl?: string; // Original URL from CMS
  className?: string;
  width?: number;
  height?: number;
}) {
  const [currentSrc, setCurrentSrc] = useState<string>(src);
  const [errorCount, setErrorCount] = useState(0);
  
  const getFallbackUrls = useCallback((normalizedUrl: string, rawUrl?: string, filename?: string): string[] => {
    const urls: string[] = [];
    
    // Try raw URL from CMS first if it exists and is different
    if (rawUrl && rawUrl !== normalizedUrl) {
      urls.push(rawUrl);
    }
    
    // Then try normalized URL
    urls.push(normalizedUrl);
    
    if (filename) {
      try {
        const url = new URL(normalizedUrl);
        const origin = `${url.protocol}//${url.host}`;
        
        // Payload CMS uses /api/media/file/{filename} for media files
        urls.push(`${origin}/api/media/file/${filename}`);
        
        // Try different path variations as fallbacks
        urls.push(`${origin}/media/${filename}`);
        urls.push(`${origin}/uploads/${filename}`);
        
        // If normalized is /media/, try /api/media/file/
        if (normalizedUrl.includes('/media/') && !normalizedUrl.includes('/api/media/file/')) {
          urls.push(normalizedUrl.replace('/media/', '/api/media/file/'));
        }
        // If normalized is /uploads/, try /api/media/file/
        if (normalizedUrl.includes('/uploads/')) {
          urls.push(normalizedUrl.replace('/uploads/', '/api/media/file/'));
        }
      } catch (e) {
        // If URL parsing fails, just use original
      }
    }
    
    // Remove duplicates while preserving order
    const seen = new Set<string>();
    return urls.filter(url => {
      if (seen.has(url)) return false;
      seen.add(url);
      return true;
    });
  }, []);
  
  const fallbackUrls = useMemo(() => getFallbackUrls(src, rawUrl, filename), [src, rawUrl, filename, getFallbackUrls]);
  
  const handleError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.target as HTMLImageElement;
    const attemptedUrl = target.src;
    
    console.error(`Failed to load image (attempt ${errorCount + 1}):`, {
      attemptedUrl,
      normalizedUrl: src,
      rawUrl,
      filename,
      availableFallbacks: fallbackUrls.length - errorCount - 1,
    });
    
    // Prevent infinite loop - if we've tried all URLs, stop
    if (errorCount >= fallbackUrls.length - 1) {
      console.error("All image URLs failed to load. Giving up.");
      setCurrentSrc('');
      return;
    }
    
    // Try next fallback URL
    const nextUrl = fallbackUrls[errorCount + 1];
    console.log(`Trying fallback URL (${errorCount + 2}/${fallbackUrls.length}):`, nextUrl);
    setCurrentSrc(nextUrl);
    setErrorCount(prev => prev + 1);
  }, [errorCount, fallbackUrls, src, rawUrl, filename]);
  
  if (!currentSrc) {
    return null;
  }
  
  return (
    <img
      src={currentSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      loading="lazy"
      onError={handleError}
      onLoad={() => {
        if (errorCount > 0) {
          console.log(`Successfully loaded image from fallback URL:`, currentSrc);
        }
      }}
    />
  );
});

// Memoize component to prevent unnecessary re-renders
const PostOverview = React.memo(function PostOverview({ data }: PostOverviewProps) {
  return (
    <Link
      to={`/learn/${data.slug}`}
      className="flex h-[368px] w-full max-w-[750px] flex-col overflow-hidden rounded-[32px] transition-all clickable-active hover:brightness-90"
      key={data.id}
    >
      {data.heroImage?.url && (
        <HeroImageWithFallback
          src={data.heroImage.url}
          alt={data.heroImage?.alt || data.title}
          filename={data.heroImage?.filename}
          rawUrl={data.heroImage?.rawUrl}
          width={400}
          height={225}
          className="aspect-video h-[212px] w-full object-cover"
        />
      )}
      <div className="grow bg-background-secondary p-6">
        <h2 className="heading-4">{data.title}</h2>
      </div>
    </Link>
  );
});

export default PostOverview;
