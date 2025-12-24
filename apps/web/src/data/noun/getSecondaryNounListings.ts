import { SecondaryNounListing, SecondaryNounOffer } from "./types";
import { revalidateTag, unstable_cache } from "@/utils/viteCache";

export async function getSecondaryNounListingsUncached(): Promise<
  SecondaryNounListing[]
> {
  // Reservoir integration removed - return empty array
  return [];
}

export const getSecondaryNounListings = unstable_cache(
  getSecondaryNounListingsUncached,
  ["get-secondary-noun-listings"],
  {
    tags: ["get-secondary-noun-listings"],
    revalidate: 60 * 1, // 1 min
  },
);

export async function getSecondaryListingForNoun(
  id: string,
): Promise<SecondaryNounListing | null> {
  const listings = await getSecondaryNounListings();
  return listings.find((listing) => listing.nounId === id) ?? null;
}

export async function getSecondaryFloorListing(): Promise<SecondaryNounListing | null> {
  const listings = await getSecondaryNounListings();
  return listings.length == 0
    ? null
    : listings.reduce((prev, curr) =>
        BigInt(curr.priceRaw) < BigInt(prev.priceRaw) ? curr : prev,
      );
}

export async function getSecondaryTopOffer(): Promise<SecondaryNounOffer | null> {
  // Reservoir integration removed - return null
  return null;
}

export async function revalidateSecondaryNounListings() {
  revalidateTag("get-secondary-noun-listings");
}
