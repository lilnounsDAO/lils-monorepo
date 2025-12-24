import { Suspense } from "react";
import ByTheNumbersData from "./ByTheNumbersData";
import { getCurrentAuctionNounId } from "@/data/auction/getCurrentAuctionNounId";
import { getTreasurySummary } from "@/data/ponder/financial/getTreasurySummary";
import { getExecutedProposals } from "@/data/goldsky/governance/getExecutedProposals";
import { getUniqueNounOwnersCount } from "@/data/ponder/nouns/getUniqueNounOwnersCount";
import { useQuery } from "@tanstack/react-query";
import { ProposalDigestCard } from "./ProposalDigestCard";
import { TreasuryDigestCard } from "./TreasuryDigestCard";
import { ProliferationDigestCard } from "./ProliferationDigestCard";
import { AuctionDigestCardWrapper } from "./AuctionDigestCard";

enum TreasuryCardVariant {
  ByTheNumbers = "byTheNumbers",
  Digest = "digest",
}

export default function ByTheNumbers() {
  return (
    <div className="flex flex-col gap-16">
      <section className="flex w-full min-w-0 max-w-[1680px] flex-col items-center justify-center gap-8 px-6 md:gap-16 md:px-10">
        <div className="flex flex-col items-center justify-center gap-2 px-6 text-center md:px-10">
          <h2>How it works</h2>
          <div className="max-w-[480px] paragraph-lg">
            Lil Nouns empower creativity and subcultures, with millions in funding
            distributed to hundreds of ideas, all governed by Lil Noun holders.
          </div>
        </div>
        <Suspense
          fallback={
            <div className="flex items-center justify-center w-full h-32">
              <div className="text-content-secondary">Loading data...</div>
            </div>
          }
        >
          <TreasuryDataWrapper variant={TreasuryCardVariant.ByTheNumbers} />
        </Suspense>
      </section>
      
      {/* bento card */}
      <div
        className="
      grid
      w-full
      max-w-[1680px]
      gap-4
      justify-center
      grid-cols-1
      md:[grid-template-columns:320px_400px_800px]
      md:[grid-template-rows:280px_280px_440px]
      xl:[grid-template-columns:360px_440px_880px]
      xl:[grid-template-rows:300px_300px_460px]
      2xl:[grid-template-columns:400px_480px_960px]
      2xl:[grid-template-rows:320px_320px_480px]
      mt-2
      px-6
      md:px-10

    "
        style={{
          width: "100%",
        }}
      >
        {/* Left: tall card spanning three rows */}
        <div className="col-span-1 md:row-span-3 h-[500px] md:h-full">
          <AuctionDigestCardWrapper className="h-full" />
        </div>

        {/* Center top: treasury card */}
        <div className="col-span-1 md:col-span-1 md:row-span-1">
          <TreasuryDataWrapper variant={TreasuryCardVariant.Digest} />
        </div>

        {/* Right top: proposals digest spanning two rows */}
        <div className="col-span-1 md:col-start-3 md:col-span-1 md:row-start-1 md:row-span-2 h-[400px] md:h-full">
          <ProposalDigestCard className="h-full !mb-0" />
        </div>

        {/* Center middle: CC0 card */}
        <div className="col-span-1 md:col-span-1 md:col-start-2 md:row-start-2 pb-0 mb-0">
          <CC0OpenSourceCard />
        </div>

        {/* Bottom: wide card spanning columns 2-3 */}
        <div className="col-span-1 md:col-span-2 md:col-start-2 md:row-start-3">
          <ProliferationDigestCard className="h-full" />
        </div>

      </div>
    </div>
  );
}

function TreasuryDataWrapper({ variant }: { variant: TreasuryCardVariant }) {
  const { data: currentAuctionId } = useQuery({
    queryKey: ["current-auction-id"],
    queryFn: getCurrentAuctionNounId,
  });

  const { data: treasurySummary } = useQuery({
    queryKey: ["treasury-summary"],
    queryFn: getTreasurySummary,
  });
  

  const { data: executedProposals } = useQuery({
    queryKey: ["executed-proposals"],
    queryFn: getExecutedProposals,
  });

  const { data: uniqueNounOwners } = useQuery({
    queryKey: ["unique-noun-owners-count"],
    queryFn: getUniqueNounOwnersCount,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Show loading state while any data is loading
  if (!currentAuctionId || !treasurySummary || !executedProposals || uniqueNounOwners === undefined) {
    return (
      <div className="flex items-center justify-center w-full h-32">
        <div className="text-content-secondary">Loading data...</div>
      </div>
    );
  }

  const ideasFunded = executedProposals.length;

  // Use actual unique noun owners count from VPS, excluding burn address
  const nounOwners = uniqueNounOwners;

  if (variant === TreasuryCardVariant.Digest) {
    return (
      <TreasuryDigestCard
        className={"h-full"}
        treasuryDeployedUsd={treasurySummary.propSpendInUsd}
        treasuryBalanceInUsd={treasurySummary.treasuryBalanceInUsd}
      />
    );
  }

  return (
    <ByTheNumbersData
      nounsCreated={Number(currentAuctionId) + 1}
      nounOwners={nounOwners}
      ideasFunded={ideasFunded}
      treasuryDeployedUsd={treasurySummary.propSpendInUsd}
    />
  );
}

function CC0OpenSourceCard() {
  return (
    <div className="w-full h-full rounded-[16px] bg-[#F1F4F9] overflow-hidden pl-6 pr-6 pt-5 pb-0 mb-0 flex flex-col ">
      <div className="">
        <h3 className="font-bold text-[22px] leading-tight text-[#1F2937] mb-1">
          {"CC0 Open Source"}
        </h3>
        <p className="text-[16px] leading-[1.6] text-[#68778D] mt-0">
          Every Lil Noun is CC0—public domain with zero restrictions. Take the
          art, remix it, build with it. No permissions needed.
        </p>
      </div>

      <div className="flex justify-center items-center mt-2 mb-2 gap-2">
        <img
          src="/cc-zero.svg"
          alt="ETH Pixelated"
          className="w-[150px] h-[120px] object-contain"
          style={{ imageRendering: "pixelated" }}
        />
        <img
          src="/lilanarchy.gif"
          alt="ETH Pixelated"
          className="w-[150px] h-[120px] object-contain"
          style={{ imageRendering: "pixelated" }}
        />
      </div>
    </div>
  );
}
