"use client";
import { cn } from "@/utils/shadcn";
import { EnsAvatar } from "./EnsAvatar";
import { EnsName } from "./EnsName";
import { HTMLAttributes } from "react";
import { Address } from "viem";

interface IdentityProps extends HTMLAttributes<HTMLDivElement> {
  address: Address;
  avatarSize: number;
}

export default function Identity({ address, avatarSize, className, ...props }: IdentityProps) {
  return (
    <div className={cn("flex items-center gap-1 font-bold", className)} {...props}>
      <EnsAvatar address={address} size={avatarSize} />
      <EnsName address={address} />
    </div>
  );
}
