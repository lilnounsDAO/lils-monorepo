import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "react-router-dom";
import PostOverview from "@/components/PostOverview";
import { getPostOverviews } from "@/data/cms/getPostOverviews";
import { useQuery } from "@tanstack/react-query";

export default function LearnAboutNounsDao() {
  return (
    <section className="flex w-full max-w-[1680px] flex-col items-center justify-center gap-8 px-6 md:gap-16 md:px-10">
      <div className="flex flex-col items-center justify-center gap-2 px-6 text-center md:px-10">
        <h2>Learn about Lil Nouns</h2>
        <div className="max-w-[660px] paragraph-lg">
          All the latest guides, tutorials, and explainers.
        </div>
      </div>
      <div className="flex w-full flex-col items-center justify-center gap-6 md:flex-row md:gap-10">
        <PostWrapper />
      </div>
      <Link to="/learn">
        <Button className="rounded-full">See all posts</Button>
      </Link>
    </section>
  );
}

function PostWrapper() {
  const { data: posts, isPending } = useQuery({
    queryKey: ['post-overviews'],
    queryFn: getPostOverviews,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    placeholderData: (previousData) => previousData, // Keep showing old data while refetching
  });

  // Only show skeleton on initial load, not on refetch
  if (isPending && !posts) {
    return (
      <>
        {Array(3)
          .fill(0)
          .map((_, i) => (
            <Skeleton
              className="h-[340px] w-full flex-1 rounded-[32px]"
              key={i}
            />
          ))}
      </>
    );
  }

  const top3 = (posts ?? []).slice(0, 3);

  return (
    <>
      {top3.map((overview: any, i: number) => (
        <PostOverview data={overview} key={(overview && overview.id) ?? i} />
      ))}
    </>
  );
}
