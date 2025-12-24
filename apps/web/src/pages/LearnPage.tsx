import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { getPostOverviews } from "@/data/cms/getPostOverviews";
import { getPostBySlug } from "@/data/cms/getPostBySlug";
import { normalizeCmsMediaUrl } from "@/utils/cmsUrl";

interface PostOverview {
  id: string;
  slug: string;
  title: string;
  description?: string;
  heroImage?: {
    id: string;
    filename: string;
    alt?: string;
    url?: string;
    rawUrl?: string; // Original URL from CMS before normalization
  };
}

// Component to handle image loading with fallback URLs
// Memoized to prevent re-renders when parent re-renders
const HeroImageWithFallback = React.memo(function HeroImageWithFallback({ 
  src, 
  alt, 
  filename,
  rawUrl,
  className 
}: { 
  src: string; 
  alt: string; 
  filename?: string;
  rawUrl?: string; // Original URL from CMS
  className?: string;
}) {
  const [currentSrc, setCurrentSrc] = useState<string>(src);
  const [errorCount, setErrorCount] = useState(0);
  
  const getFallbackUrls = useCallback((normalizedUrl: string, rawUrl?: string, filename?: string): string[] => {
    const urls: string[] = [];
    
    // Try raw URL from CMS first if it exists and is different
    if (rawUrl && rawUrl !== normalizedUrl) {
      urls.push(rawUrl);
      console.log('[HeroImageWithFallback] Raw URL from CMS:', rawUrl);
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
  
  // Log URLs on mount for debugging
  useEffect(() => {
    console.log('[HeroImageWithFallback] Initial URLs:', {
      normalized: src,
      raw: rawUrl,
      filename,
      allFallbacks: fallbackUrls,
    });
  }, [src, rawUrl, filename, fallbackUrls]);
  
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
    return (
      <div className={`${className} bg-background-secondary flex items-center justify-center`}>
        <p className="text-content-secondary text-sm">Image not available</p>
      </div>
    );
  }
  
  return (
    <img
      src={currentSrc}
      alt={alt}
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

const PostOverviewCard = React.memo(function PostOverviewCard({ data }: { data: PostOverview }) {
  return (
    <a
      href={`/learn/${data.slug}`}
      className="group flex flex-col gap-4 rounded-[32px] bg-background-secondary p-6 transition-all hover:bg-background-tertiary"
    >
      {data.heroImage?.url && (
        <div className="aspect-video w-full overflow-hidden rounded-2xl">
          <HeroImageWithFallback
            src={data.heroImage.url}
            alt={data.heroImage?.alt || data.title}
            filename={data.heroImage?.filename}
            rawUrl={data.heroImage?.rawUrl}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold">{data.title}</h3>
        {data.description && (
          <p className="text-content-secondary line-clamp-3">{data.description}</p>
        )}
      </div>
    </a>
  );
});

// Preload images for the first N posts to prevent flashing
function usePreloadImages(imageUrls: string[], count: number = 5) {
  useEffect(() => {
    const urlsToPreload = imageUrls.slice(0, count).filter(Boolean);
    urlsToPreload.forEach((url) => {
      const img = new Image();
      img.src = url;
    });
  }, [imageUrls, count]);
}

function LearnPostGrid() {
  const { data: posts = [], isLoading: loading } = useQuery({
    queryKey: ['post-overviews'],
    queryFn: getPostOverviews,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Preload images for first 5 posts
  const imageUrls = useMemo(
    () => posts.slice(0, 5).map((post: PostOverview) => post.heroImage?.url).filter(Boolean) as string[],
    [posts]
  );
  usePreloadImages(imageUrls, 5);

  if (loading) {
    return (
      <>
        {Array(6)
          .fill(0)
          .map((_, i) => (
            <Skeleton className="h-[340px] w-full rounded-[32px]" key={i} />
          ))}
      </>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="col-span-full text-center py-12">
        <p className="text-content-secondary">No posts available yet.</p>
      </div>
    );
  }

  return (
    <>
      {posts.map((overview: PostOverview) => (
        <PostOverviewCard data={overview} key={overview.id} />
      ))}
    </>
  );
}

export default function LearnPage() {
  const { slug } = useParams();

  if (slug) {
    return <LearnPostDetail slug={slug} />;
  }

  return (
    <div className="flex w-full max-w-[800px] flex-col justify-center gap-[72px] p-6 pb-24 md:p-10 md:pb-24 mx-auto">
      <section className="relative flex flex-col items-center justify-center gap-4">
        <div className="flex flex-col gap-3 text-center">
          <h1 className="text-4xl font-bold">Learn about Lil Nouns DAO</h1>
          <p className="text-content-secondary text-lg">
            Build your Lil Nouns knowledge with these guides, tutorials, and
            explainers.
          </p>
        </div>
      </section>

      <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
        <LearnPostGrid />
      </div>
    </div>
  );
}

// Rich text renderer for Payload CMS content
function RichTextRenderer({ content }: { content: any }) {
  if (!content?.root?.children) {
    return <div className="text-content-secondary">Content not available</div>;
  }

  // Debug: Log the content structure to understand the format
  console.log('RichTextRenderer content:', content);

  const renderNode = (node: any, index: number = 0): React.ReactNode => {
    if (!node) return null;

    switch (node.type) {
      case 'paragraph':
        return (
          <p key={`para-${index}`} className="mb-4 text-content-secondary leading-relaxed">
            {node.children?.map((child: any, childIndex: number) => renderNode(child, childIndex))}
          </p>
        );

      case 'heading':
        const HeadingTag = `h${node.tag || 2}` as keyof JSX.IntrinsicElements;
        return (
          <HeadingTag key={`heading-${index}`} className="text-content-primary font-bold mb-3 mt-6">
            {node.children?.map((child: any, childIndex: number) => renderNode(child, childIndex))}
          </HeadingTag>
        );

      case 'text':
        let textElement = node.text || '';

        // Handle text formatting
        if (node.format & 1) { // Bold
          textElement = <strong key={`text-${index}`}>{textElement}</strong>;
        }
        if (node.format & 2) { // Italic
          textElement = <em key={`text-${index}`}>{textElement}</em>;
        }

        return textElement;

      case 'link':
        // Handle PayloadCMS Lexical link structure
        const url = node.fields?.url || node.url || '#';
        const newTab = node.fields?.newTab !== false; // Default to opening in new tab
        const linkContent = node.children?.map((child: any, childIndex: number) => renderNode(child, childIndex)) || 'Link';
        
        return (
          <a
            key={`link-${index}`}
            href={url}
            className="text-black hover:text-blue-600 underline transition-colors"
            target={newTab ? "_blank" : "_self"}
            rel={newTab ? "noopener noreferrer" : undefined}
          >
            {linkContent}
          </a>
        );

      case 'list':
        const ListTag = node.tag === 'ol' ? 'ol' : 'ul';
        return (
          <ListTag key={`list-${index}`} className="mb-4 ml-6 list-disc">
            {node.children?.map((child: any, childIndex: number) => renderNode(child, childIndex))}
          </ListTag>
        );

      case 'listitem':
        return (
          <li key={`listitem-${index}`} className="mb-1">
            {node.children?.map((child: any, childIndex: number) => renderNode(child, childIndex))}
          </li>
        );

      case 'image':
        const finalImageUrl = normalizeCmsMediaUrl(node?.url ?? node?.src, node?.filename);

        return finalImageUrl ? (
          <div key={`image-${index}`} className="mb-6">
            <img
              src={finalImageUrl}
              alt={node.alt || 'Image'}
              className="w-full h-auto rounded-lg"
            />
          </div>
        ) : null;

      case 'upload':
        const uploadUrl = normalizeCmsMediaUrl(node?.value?.url, node?.value?.filename);

        return uploadUrl ? (
          <div key={`upload-${index}`} className="mb-6">
            <img
              src={uploadUrl}
              alt={node?.value?.alt || 'Image'}
              className="w-full h-auto rounded-lg"
            />
          </div>
        ) : null;

      case 'root':
        return (
          <div key={`root-${index}`}>
            {node.children?.map((child: any, childIndex: number) => renderNode(child, childIndex))}
          </div>
        );

      default:
        console.log('Unknown node type:', node.type, node);
        return null;
    }
  };

  return <div className="prose prose-lg max-w-none">{renderNode(content.root)}</div>;
}

function LearnPostDetail({ slug }: { slug: string }) {
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [heroImgSrc, setHeroImgSrc] = useState<string | undefined>(undefined);

  useEffect(() => {
    getPostBySlug(slug)
      .then((data) => {
        console.log("Post data received:", data);
        console.log("Hero image data:", data?.heroImage);
        console.log("Hero image normalized URL:", data?.heroImage?.url);
        console.log("Hero image raw URL:", data?.heroImage?.rawUrl);
        console.log("Hero image filename:", data?.heroImage?.filename);
        setPost(data);
        setHeroImgSrc(data?.heroImage?.url);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load post:", err);
        setLoading(false);
      });
  }, [slug]);


  if (loading) {
    return (
      <div className="flex w-full max-w-[720px] flex-col justify-center gap-4 px-6 pb-24 pt-[72px] md:px-10 mx-auto">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="aspect-video w-full rounded-[12px] md:rounded-[24px]" />
        {Array(5)
          .fill(0)
          .map((_, i) => (
            <Skeleton className="h-4 w-full" key={i} />
          ))}
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex w-full max-w-[720px] flex-col justify-center gap-8 p-6 pb-24 md:p-10 md:pb-24 mx-auto">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <p className="text-content-secondary">
            The post you're looking for doesn't exist or has been removed.
          </p>
        </div>
      </div>
    );
  }

  const postUrl = `${window.location.origin}/learn/${slug}`;

  return (
    <div className="flex w-full max-w-[720px] flex-col justify-center gap-4 px-6 pb-24 pt-[72px] md:px-10 mx-auto">
      <a
        href="/learn"
        className="font-bold text-content-secondary label-lg hover:text-content-primary transition-colors"
      >
        Learn
      </a>

      <div className="flex min-w-0 flex-col gap-12">
        <h1>{post.title}</h1>
        {heroImgSrc ? (
          <HeroImageWithFallback
            src={heroImgSrc}
            alt={post.heroImage?.alt || post.title}
            filename={post?.heroImage?.filename}
            rawUrl={post?.heroImage?.rawUrl}
            className="aspect-video rounded-[12px] object-cover md:rounded-[24px]"
          />
        ) : (
          post?.heroImage && (
            <div className="aspect-video rounded-[12px] bg-background-secondary flex items-center justify-center md:rounded-[24px]">
              <p className="text-content-secondary text-sm">Image not available</p>
            </div>
          )
        )}

        {/* Render the actual rich text content */}
        {post.content && <RichTextRenderer content={post.content} />}
      </div>

      <div className="my-8 h-[1px] w-full bg-background-secondary" />

      <div className="flex flex-col gap-11">
        <div className="flex flex-col gap-4">
          <div className="font-bold text-content-secondary label-sm">
            Share post
          </div>
          <div className="flex items-center gap-6">
            <a
              href={`https://warpcast.com/~/compose?text=${encodeURIComponent(postUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="fill-content-primary hover:opacity-70 transition-opacity"
              aria-label="Share on Farcaster"
            >
              <svg width="20" height="20" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
                <path d="M257.778 155.556H742.222V844.444H671.111V528.889H670.414C662.554 441.677 589.258 373.333 500 373.333C410.742 373.333 337.446 441.677 329.586 528.889H328.889V844.444H257.778V155.556Z"/>
                <path d="M128.889 253.333L157.778 351.111H182.222V746.667C169.949 746.667 160 756.616 160 768.889V795.556H155.556C143.283 795.556 133.333 805.505 133.333 817.778V844.444H382.222V817.778C382.222 805.505 372.273 795.556 360 795.556H355.556V768.889C355.556 756.616 345.606 746.667 333.333 746.667H306.667V253.333H128.889Z"/>
                <path d="M871.111 253.333L842.222 351.111H817.778V746.667C830.051 746.667 840 756.616 840 768.889V795.556H844.444C856.717 795.556 866.667 805.505 866.667 817.778V844.444H617.778V817.778C617.778 805.505 627.727 795.556 640 795.556H644.444V768.889C644.444 756.616 654.394 746.667 666.667 746.667H693.333V253.333H871.111Z"/>
              </svg>
            </a>
            <a
              href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="fill-content-primary hover:opacity-70 transition-opacity"
              aria-label="Share on X"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(postUrl);
              }}
              className="fill-content-primary hover:opacity-70 transition-opacity"
              aria-label="Copy link"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="text-content-secondary paragraph-sm">
          The content on this site is produced by some Lil Nouns DAO contributors and is
          for informational purposes only. The content is not intended to be
          investment advice or any other kind of professional advice. Before
          taking any action based on this content you should do you own
          research. We do not endorse any third parties referenced on this
          site. When you invest, your funds are at risk and it is possible
          that you may lose some or all of your investment. Past performance
          is not a guarantee of future results.
        </div>
      </div>
    </div>
  );
}
