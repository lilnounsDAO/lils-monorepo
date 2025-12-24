import { getNounById } from "@/data/noun/getNounById";
import { Noun } from "@/data/noun/types";
import { buildNounImage } from "@/utils/nounImages/nounImage";
import { cn } from "@/utils/shadcn";
import Image from "./OptimizedImage";
import { ComponentProps, Suspense } from "react";
import type { ImageProps } from "./OptimizedImage";
import { useQuery } from "@tanstack/react-query";

interface NounImageProps extends Omit<ImageProps, "src" | "alt"> {
  nounId: string;
}

export function NounImage({ nounId, ...props }: NounImageProps) {
  return (
    <Suspense fallback={<NounImageBase noun={undefined} {...props} />}>
      <NounImageWrapper nounId={nounId} {...props} />
    </Suspense>
  );
}

function NounImageWrapper({ nounId, ...props }: NounImageProps) {
  const { data: noun, error } = useQuery({
    queryKey: ['noun', nounId],
    queryFn: () => getNounById(nounId),
  });

  if (error) {
    console.error(`NounImageInternal - no Noun found - ${nounId}`, error);
  }

  return <NounImageBase noun={noun} {...props} />;
}

export function NounImageBase({
  noun,
  className,
  ...props
}: { noun?: Noun } & Omit<ImageProps, "src" | "alt">) {
  const imageSrc = noun ? buildNounImage(noun.traits, "full") : undefined;
  return (
    <Image
      src={imageSrc ?? "/noun-loading-skull.gif"}
      unoptimized={imageSrc == undefined}
      alt="Noun"
      className={cn("pointer-events-none select-none object-cover", className)}
      {...props}
    />
  );
}
