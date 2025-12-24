import Image from "@/components/OptimizedImage";
import AlreadyOwnANounCard from "./AlreadyOwnANounCard";

export default function AlreadyOwnANoun() {
  return (
    <section className="flex w-full min-w-0 flex-col items-center justify-center gap-8 px-6 md:gap-16 md:px-10">
      <div className="flex max-w-[1600px] flex-col items-center justify-center gap-2 px-6 text-center md:px-10">
        <h2>Already own a Lil Noun?</h2>
        <div className="max-w-[480px] paragraph-lg">
          Join the governance, read or vote on proposals, explore candidates and topics, and participate in rounds.
        </div>
      </div>

      <div className="flex w-full min-w-0 max-w-[1600px] flex-col gap-6 md:flex-row md:gap-10">
        <AlreadyOwnANounCard
          href="/explore?onlyTreasuryNouns=1"
          iconSrc="/swap-icon.svg"
          buttonLabel="Trade"
          description="Offer to trade your Noun with one in the Treasury."
          cta="Treasury Lil Nouns Available"
          className="bg-background-secondary"
        >
          <Image
            src="/swap-icon.png"
            width={160}
            height={280}
            alt="Swap Noun with Treasury"
            className="hidden self-end object-cover object-left lg:block"
          />
        </AlreadyOwnANounCard>
        <AlreadyOwnANounCard
          href="/explore?onlyTreasuryNouns=1"
          iconSrc="/swap-icon.svg"
          buttonLabel="Trade"
          description="Offer to trade your Noun with one in the Treasury."
          cta="Treasury Lil Nouns Available"
          className="bg-background-secondary"
        >
          <Image
            src="/swap-icon.png"
            width={160}
            height={280}
            alt="Swap Noun with Treasury"
            className="hidden self-end object-cover object-left lg:block"
          />
        </AlreadyOwnANounCard>
        <AlreadyOwnANounCard
          href="/explore?onlyTreasuryNouns=1"
          iconSrc="/swap-icon.svg"
          buttonLabel="Trade"
          description="Offer to trade your Noun with one in the Treasury."
          cta="Treasury Lil Nouns Available"
          className="bg-background-secondary"
        >
          <Image
            src="/swap-icon.png"
            width={160}
            height={280}
            alt="Swap Noun with Treasury"
            className="hidden self-end object-cover object-left lg:block"
          />
        </AlreadyOwnANounCard>
      </div>
    </section>
  );
}



