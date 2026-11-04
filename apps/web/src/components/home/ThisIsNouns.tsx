import { Suspense } from "react";
import AnimateIn from "@/components/AnimateIn";
import ExplainerStories from "@/components/home/ExplainerStories";
import { FloatingNounsBackground } from "@/components/FloatingNounsBackground";
import { useQuery } from "@tanstack/react-query";
import { getTotalMintedNouns } from "@/data/contracts/nounsToken";
import { getNounById } from "@/data/noun/getNounById";
import { Noun } from "@/data/noun/types";

export default function ThisIsNouns() {
  return (
    <section className="relative flex h-fit w-full max-w-[1600px] flex-col items-center justify-center py-10 md:min-h-[484px] md:py-16">
      <Suspense fallback={null}>
        <BackgroundWrapper />
      </Suspense>

      <div className="z-[1] flex w-full flex-col items-center justify-center gap-4 px-6 text-center md:gap-8">
        <div className="flex w-full max-w-[480px] flex-col gap-2">
          <AnimateIn delayS={0}>
            <h1 className="hero">Meet the Lils</h1>
          </AnimateIn>
          <AnimateIn delayS={0.2} className="paragraph-lg">
            Lil Nouns are unique digital art pieces that hold special powers.
            They work and play together to fund ideas, build cool stuff, and
            form a community around a common meme.
          </AnimateIn>
        </div>

        <AnimateIn delayS={0.4} className="flex w-full justify-center">
          <ExplainerStories />
        </AnimateIn>
      </div>
    </section>
  );
}

/**
 * Generate 22 unique random numbers from 0 to max (inclusive)
 * Uses Fisher-Yates shuffle algorithm for efficient selection
 */
function generateRandomUniqueNumbers(count: number, max: number): number[] {
  if (count > max + 1) {
    // If we need more numbers than available, return all numbers
    return Array.from({ length: max + 1 }, (_, i) => i);
  }

  // Create array of all possible numbers
  const numbers = Array.from({ length: max + 1 }, (_, i) => i);
  
  // Fisher-Yates shuffle to get random selection
  const selected: number[] = [];
  for (let i = 0; i < count; i++) {
    const randomIndex = Math.floor(Math.random() * (numbers.length - i));
    selected.push(numbers[randomIndex]);
    // Swap selected number to end and reduce range
    [numbers[randomIndex], numbers[numbers.length - 1 - i]] = 
      [numbers[numbers.length - 1 - i], numbers[randomIndex]];
  }
  
  return selected;
}

function BackgroundWrapper() {
  const { data: totalSupply } = useQuery({
    queryKey: ["total-noun-supply"],
    queryFn: () => getTotalMintedNouns(),
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const { data: randomNouns } = useQuery({
    queryKey: ["random-nouns-background", totalSupply],
    queryFn: async () => {
      if (!totalSupply || totalSupply === 0) {
        return [];
      }

      const targetCount = 22;
      const maxAttempts = Math.min(totalSupply, targetCount + 10); // Fetch a few extra in case some fail
      const randomIds = generateRandomUniqueNumbers(maxAttempts, totalSupply - 1);
      
      // Fetch all nouns in parallel
      const nounPromises = randomIds.map((id) => getNounById(String(id)));
      const results = await Promise.all(nounPromises);
      
      // Filter out any failed fetches (undefined/null) and take first 22
      const validNouns = results.filter((noun): noun is Noun => noun !== undefined && noun !== null);
      
      // Return exactly 22 nouns (or fewer if we don't have enough)
      return validNouns.slice(0, targetCount);
    },
    enabled: !!totalSupply && totalSupply > 0,
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
  });

  if (!randomNouns || randomNouns.length === 0) {
    return null; // Return null while loading
  }

  return <FloatingNounsBackground nouns={randomNouns} />;
}
