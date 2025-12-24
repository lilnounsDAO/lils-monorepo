"use client";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import clsx from "clsx";
import Image from "@/components/OptimizedImage";
import { LinkExternal } from "@/components/ui/link";


const PROJECTS: ProjectCard[] = [
  {
    title: "Lil Bev: A Pale Ale powered by Lils",
    imgSrc: "/project/lilbevs.png",
    link: "https://x.com/greenytrades/status/1743604996476895607",
  },
  {
    title: "Skate park renovations in Rio de Janeiro",
    imgSrc: "/project/riopark.png",
    link: "https://x.com/ramonouns/status/1658146344941367296",
  },
  {
    title: "Very Serious Frozen Lasagna Reviews",
    imgSrc: "/project/lil-lasagna.png",
    link: "https://www.youtube.com/shorts/W0coM_-hC1I",
  },
  {
    title: "Lil Bean: Community owned story and merch line",
    imgSrc: "/project/lilbean.png",
    link: "https://gnars.com/",
  },
  {
    title: "Lil Nouns Coffee",
    imgSrc: "/project/lilcoffee.png",
    link: "https://x.com/drewcoffman/status/1544711476820119552?s=20",
  },
  {
    title: "Lil Nouns Esports: Permissionlessly Funded Gaming",
    imgSrc: "/project/lilesports.png",
    link: "https://nouns.gg/",
  },
  {
    title: "Lil Nouns themed ice cream truck",
    imgSrc: "/project/icecreamtruck.png",
    link: "https://instagram.com/nouns_house",
  },
  {
    title: "Lil Bean: Community owned story and merch line",
    imgSrc: "/project/lilbean.png",
    link: "https://www.tiktok.com/@lilbeanbylils",
  },
  {
    title: "Lil Nouns on chain ... literally",
    imgSrc: "/project/lilnounschain.png",
    link: "https://x.com/nounsonchain",
  },
  {
    title: "Lil Nouns Esports: Permissionlessly Funded Gaming",
    imgSrc: "/project/lilesports.png",
    link: "https://nouns.gg/",
  },
];
export default function NounsFundsIdeas() {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-8 md:gap-14">
      <div className="flex flex-col items-center justify-center gap-2 px-6 text-center md:px-10">
        <h2 className="flex items-center justify-center gap-2">
          Money make the world go
          <img
            src="/moneynoggles.gif"
            alt="Lil Nouns Glasses"
            width={60}
            height={38}
            className="inline-block ml-2 h-[37.5px] w-auto object-contain align-middle"
          />
        </h2>
        <div className="max-w-[480px] paragraph-lg">
          Big or small, the lil nouns community bring ideas to life. From sponsoring esports teams to building games across the globe, lil nouns do it all for the love of spreading its meme to every corner of the world.
        </div>
      </div>

      <Carousel
        opts={{
          align: "center",
          skipSnaps: true,
          startIndex: Math.floor(PROJECTS.length / 2),
          loop: true,
        }}
        plugins={[Autoplay({ delay: 5000, stopOnInteraction: true })]}
        className="w-full"
      >
        <CarouselContent className="-ml-4">
          {PROJECTS.map((item, i) => (
            <CarouselItem
              className={clsx("max-w-full shrink-0 basis-auto pl-4")}
              key={i}
            >
              <ProjectCard {...item} />
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </section>
  );
}

interface ProjectCard {
  title: string;
  imgSrc: string;
  link: string;
}

function ProjectCard({ title, imgSrc, link }: ProjectCard) {
  return (
    <LinkExternal
      href={link}
      className="relative flex h-[408px] w-[306px] flex-col justify-end overflow-hidden rounded-[20px]"
    >
      <Image
        src={imgSrc}
        width={306}
        height={408}
        alt={title}
        className="absolute inset-0 select-none"
      />
      <div
        className="z-[1] select-none px-4 pb-6 pt-[28px]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.5) 100%)",
        }}
      >
        <h5 className="text-white">{title}</h5>
      </div>
    </LinkExternal>
  );
}
