"use client";
import { getAddress } from "viem";
import { cn } from "@/utils/shadcn";
import { EnsAvatar } from "../EnsAvatar";
import { EnsName } from "../EnsName";
import RoundImage from "./RoundImage";
import { RoundActor } from "./utils";

/**
 * A round participant. Wallets resolve through ENS like everywhere else on the
 * site; imported participants who never had a wallet show the name and avatar
 * the old platform had for them.
 */
export default function RoundIdentity({
  actor,
  avatarSize = 20,
  className,
}: {
  actor: RoundActor;
  avatarSize?: number;
  className?: string;
}) {
  // A name the old platform had for someone reads better than a shortened
  // address, so it wins when there is one; wallets without one go through ENS.
  if (actor.address && !actor.name) {
    return (
      <span className={cn("flex items-center gap-1 font-bold", className)}>
        <EnsAvatar address={getAddress(actor.address)} size={avatarSize} />
        <EnsName address={getAddress(actor.address)} />
      </span>
    );
  }

  if (actor.address && !actor.image) {
    return (
      <span className={cn("flex items-center gap-1 font-bold", className)} title={actor.address}>
        <EnsAvatar address={getAddress(actor.address)} size={avatarSize} />
        <span className="truncate">{actor.name}</span>
      </span>
    );
  }

  return (
    <span className={cn("flex items-center gap-1 font-bold", className)} title={actor.address}>
      <RoundImage
        src={actor.image}
        width={avatarSize}
        height={avatarSize}
        className="rounded-full object-cover"
        style={{ width: avatarSize, height: avatarSize }}
        fallback={
          <span
            className="rounded-full bg-background-secondary"
            style={{ width: avatarSize, height: avatarSize }}
          />
        }
      />
      <span className="truncate">{actor.name ?? "Anonymous"}</span>
    </span>
  );
}
