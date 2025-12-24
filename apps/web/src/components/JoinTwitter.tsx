import Image from "@/components/OptimizedImage";
import { LinkExternal } from "./ui/link";
import { Button } from "./ui/button";
import Icon from "./ui/Icon";

export default function JoinTwitter() {
  return (
    <LinkExternal
      href="https://x.com/lilnounsdao"
      className="flex w-full flex-1 flex-col items-center justify-start gap-6 overflow-hidden rounded-3xl bg-[#111111] p-6 text-center text-white md:p-12"
    >
      <Image
        src="/socials/x.svg"
        width={48}
        height={48}
        alt="X (Twitter)"
      />
      <div className="flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-center text-white">Follow Lil Nouns DAO on X</h2>
        <div className="max-w-[640px] text-center text-gray-200 paragraph-lg">
          Stay in the loop with Lil Nouns DAO. Join the conversation, catch live Spaces, and get updates from the Lil Nouns community.
        </div>
      </div>
      <Button
        variant="secondary"
        className="flex gap-2.5 rounded-full border-none label-lg"
      >
        <span>Follow Lil Nouns DAO on X</span>
        <Icon icon="arrowUpRight" size={24} className="fill-content-primary" />
      </Button>
     

    </LinkExternal>
  );
}
