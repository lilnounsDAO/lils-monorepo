import { getRecentNouns } from "@/data/noun/getAllNouns";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Suspense } from "react";
import { NounsInfiniteScroller } from "@/components/NounsInfiniteScroller";
import { useQuery } from "@tanstack/react-query";

export default function TheseAreNouns() {
  return (
    <section className="flex w-full flex-col items-center justify-center gap-6 md:gap-12">
      <div className="flex flex-col items-center justify-center gap-2 px-6 text-center md:px-10">
        <h2>The Lils that make this possible</h2>
        <div className="max-w-[480px] paragraph-lg">
        Here are some of the characters that currently make up the Lil Nouns community.
        </div>
      </div>
      <Suspense fallback={null}>
        <ScrollerWrapper />
      </Suspense>
      <Link to="/explore">
        <Button className="rounded-full">Explore Lil Nouns</Button>
      </Link>
    </section>
  );
}

function ScrollerWrapper() {
  const { data: recentNouns } = useQuery({
    queryKey: ['recent-nouns-scroller', 1],
    queryFn: () => getRecentNouns(120),
  });

  if (!recentNouns) {
    return (
      <div className="flex items-center justify-center w-full h-32">
        <div className="text-content-secondary">Loading Lil Nouns...</div>
      </div>
    );
  }

  return <NounsInfiniteScroller nouns={recentNouns} />;
}
