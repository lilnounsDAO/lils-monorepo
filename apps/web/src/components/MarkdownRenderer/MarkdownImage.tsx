import { useEffect, useState } from "react";
import { getImageSize } from "@/data/image/getImageSize";
import { Skeleton } from "../ui/skeleton";

export default function MarkdownImage({
  src,
  title,
}: {
  src?: string;
  title?: string;
}) {
  const [dimensions, setDimensions] = useState<{ width?: number; height?: number }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!src) {
      setLoading(false);
      return;
    }

    getImageSize(src).then((size) => {
      setDimensions(size);
      setLoading(false);
    });
  }, [src]);

  if (!src) {
    return null;
  }

  if (loading) {
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
