import Image from "@/components/OptimizedImage";
import JoinAuction from "./JoinAuction";
import { CurrentAuctionPrefetchWrapper } from "@/components/CurrentAuction/CurrentAuctionPrefetchWrapper";
import FeatureHighlightCard from "@/components/FeatureHighlightCard";

export default function GetANoun() {
  return (
    <section className="flex w-full min-w-0 flex-col items-center justify-center gap-8 px-6 md:gap-16 md:px-10">
      <div className="flex max-w-[1600px] flex-col items-center justify-center gap-2 px-6 text-center md:px-10">
        <h2>Get a Lil Noun!</h2>
        <div className="max-w-[480px] paragraph-lg">
          Bid, buy, or explore fractional ownership—choose the best way to make
          a Lil Noun yours.
        </div>
      </div>

      <div className="flex w-full min-w-0 max-w-[1600px] flex-col gap-6 md:flex-row md:gap-10">
        {/* <CurrentAuctionPrefetchWrapper>
          <JoinAuction />
        </CurrentAuctionPrefetchWrapper> */}
        <FeatureHighlightCard
          href="/explore?buyNow=1"
          iconSrc="/feature/shop/icon.svg"
          buttonLabel="Shop"
          description="Buy a Lil Noun! Shop all major marketplaces in one place."
          className="bg-background-secondary"
        >
          <Image
            src="/feature/shop/main.png"
            width={400}
            height={332}
            alt="Buy Secondary Lil Nouns"
            className="h-[332px] w-[400px] object-cover"
          />
        </FeatureHighlightCard>
        <FeatureHighlightCard
          href="/proposals"
          iconSrc="/feature/proposals/icon.svg"
          buttonLabel="Learn"
          description="Read and learn about Lil Nouns DAO proposals, governance, and how you can participate."
          className="gap-4 bg-blue-400 pb-8 text-white md:pb-10"
        >
          <Image
            src="/feature/proposals/main.png"
            width={169}
            height={212}
            alt="Lil Nouns DAO Proposals"
            className="h-[212px] w-[169px] object-cover"
          />
          <p className="label-sm">Explore proposals and governance</p>
        </FeatureHighlightCard>
      </div>
    </section>
  );
}
