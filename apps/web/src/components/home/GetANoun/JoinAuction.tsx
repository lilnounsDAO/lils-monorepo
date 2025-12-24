"use client";
import { useAuctionData } from "@/hooks/useAuctionData";
import { CurrentAuctionLarge, CurrentVRGDAAuctionLarge } from "@/components/CurrentAuction";
import clsx from "clsx";
import FeatureHighlightCard from "@/components/FeatureHighlightCard";
import { useVRGDAData } from "@/hooks/useVRGDAData";

export default function JoinAuction() {
  const { noun } = useAuctionData();
  const { isVRGDAActive } = useVRGDAData();

  // Use VRGDA auction component if VRGDA is active
  if (isVRGDAActive) {
    return (
      <FeatureHighlightCard
        href="/vrgda/explore/pool"
        iconSrc="/feature/bid/icon.svg"
        buttonLabel="Buy Now"
        description="Buy today's VRGDA Lil Noun at a dynamic price!"
        className="bg-gradient-to-br from-purple-100 to-blue-100"
      >
        <div className="flex w-full flex-col items-center justify-center gap-4 px-8 pb-8 md:pb-10">
          <CurrentVRGDAAuctionLarge />
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded-full border-2 border-[#A3EFD0] bg-purple-600" />
            <span className="text-purple-600 label-md">VRGDA Active</span>
          </div>
        </div>
      </FeatureHighlightCard>
    );
  }

  return (
    <FeatureHighlightCard
      href=""
      iconSrc="/feature/bid/icon.svg"
      buttonLabel="Bid"
      description="Buy today's VRGDA Lil Noun at a dynamic price!"
      className={clsx(
        noun?.traits.background.seed == 1 ? "bg-nouns-warm" : "bg-nouns-cool",
      )}
    >
      <div className="flex w-full flex-col items-center justify-center gap-4 px-8 pb-8 md:pb-10">
        <CurrentAuctionLarge />
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded-full border-2 border-[#A3EFD0] bg-green-600" />
          <span className="text-green-600 label-md">Live auction</span>
        </div>
      </div>
    </FeatureHighlightCard>
  );
}
