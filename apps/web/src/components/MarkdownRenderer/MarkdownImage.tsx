import { useEffect, useState } from "react";
import { getImageSize } from "@/data/image/getImageSize";
import { Skeleton } from "../ui/skeleton";
import { resolveImageSrc } from "@/utils/localImages";

export default function MarkdownImage({
  src: rawSrc,
  title,
}: {
  src?: string;
  title?: string;
}) {
  const [src, setSrc] = useState<string | undefined>(() =>
    rawSrc?.startsWith("local-image:") ? undefined : rawSrc,
  );
  const [resolving, setResolving] = useState(Boolean(rawSrc?.startsWith("local-image:")));

  useEffect(() => {
    let cancelled = false;
    if (!rawSrc) {
      setSrc(undefined);
      setResolving(false);
      return;
    }
    setResolving(true);
    resolveImageSrc(rawSrc).then((next) => {
      if (cancelled) return;
      setSrc(next);
      setResolving(false);
    });
    return () => {
      cancelled = true;
    };
  }, [rawSrc]);

  const [dimensions, setDimensions] = useState<{ width?: number; height?: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (resolving) return;
    if (!src) {
      setLoading(false);
      return;
    }

    getImageSize(src).then((size) => {
      setDimensions(size);
      setLoading(false);
    });
  }, [src, resolving]);

  if (!src && !resolving) {
    return null;
  }

  if (loading || resolving) {
    return <span className="block h-[300px] w-full animate-pulse rounded-md bg-background-secondary" />;
  }

  let clampedWidth = 800;
  let clampedHeight = 0;
  
  if (dimensions.width && dimensions.height) {
    const aspect = dimensions.width / dimensions.height;
    clampedWidth = Math.min(800, dimensions.width);
    clampedHeight = Math.min(dimensions.height, dimensions.width / aspect);
  }

  return (
    <div className="flex flex-col gap-1">
      <img
        src={src}
        width={clampedWidth}
        height={clampedHeight}
        alt={title ?? ""}
        className="max-w-full rounded-md"
        loading="lazy"
      />
      <span className="text-content-secondary label-sm">{title}</span>
    </div>
  );
}
