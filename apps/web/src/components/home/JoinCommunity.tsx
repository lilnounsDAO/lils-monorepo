import JoinTwitter from "@/components/JoinTwitter";
import { Button } from "@/components/ui/button";
import Icon from "@/components/ui/Icon";
import { Link } from "react-router-dom";
import JoinDiscordCommunity from "@/components/JoinDiscordCommunity";
import JoinFarcasterCommunity from "@/components/JoinFarcasterCommunity";

export default function JoinCommunity() {
  return (
    <section className="flex w-full max-w-[1680px] flex-col items-center justify-center gap-8 px-6 md:gap-16 md:px-10">
      <div className="flex flex-col items-center justify-center gap-2 px-6 text-center md:px-10">
        <h2>Stay Connected</h2>
        <div className="max-w-[660px] paragraph-lg">
          Whether you're an artist, technologist, scientist, athlete, or someone
          with big ideas, there's a place for you in the Nouns community.
        </div>
      </div>
      <div className="flex w-full max-w-[1600px] flex-col gap-6 md:flex-row md:gap-10">
        <JoinDiscordCommunity />
        <JoinTwitter />
      </div>
    </section>
  );
}
