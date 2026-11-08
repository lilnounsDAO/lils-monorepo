"use client";
import { useConnectModal } from "@rainbow-me/rainbowkit";
import { Button } from "@/components/ui/button";

/** Rounds need a wallet to sign, not an account, so this is the only sign-in. */
export default function ConnectPrompt({ children }: { children?: React.ReactNode }) {
  const { openConnectModal } = useConnectModal();
  return (
    <Button type="button" onClick={openConnectModal}>
      {children ?? "Connect wallet"}
    </Button>
  );
}
