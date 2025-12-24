import Image from "@/components/OptimizedImage";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export default function GovernedByYou() {
  return (
    <section className="flex w-full items-center justify-center px-6 md:px-10">
      <div className="relative flex h-[430px] w-full max-w-[1600px] justify-center overflow-hidden rounded-3xl bg-black p-6 md:p-12">
        <div className="z-[1] flex h-fit w-full max-w-[590px] flex-col items-center gap-4">
          <div className="flex flex-col items-center justify-center gap-2 text-center">
            <h2 className="whitespace-pre-wrap text-center text-white">
              Governed by You & <span className="text-blue-300">Others</span>
            </h2>
            <div className="max-w-[580px] text-center text-gray-500 paragraph-lg">
              Lil Noun holders collectively decide which ideas to fund and shape the
              future direction of the community.
            </div>
          </div>
          <div className="flex h-12 items-center justify-center rounded-full border-2 border-white px-6 text-white label-md">
            One Lil Noun = One Vote
          </div>
        </div>

        <Image
          src="/governed-by-you-background.png"
          width={1600}
          height={430}
          className="absolute bottom-0 min-w-[1600px] max-w-[1600px] origin-bottom scale-50 md:scale-100"
          alt="Lil Nouns DAO Governance"
        />
      </div>
    </section>
  );
}

