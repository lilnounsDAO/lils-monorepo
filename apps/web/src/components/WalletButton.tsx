"use client";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Button } from "./ui/button";
import { Address } from "viem";
import { EnsAvatar } from "./EnsAvatar";
import { EnsName } from "./EnsName";
import TreasuryPill from "./TreasuryPill";
import clsx from "clsx";

interface WalletButtonProps {
  disableMobileShrink?: boolean;
}

export default function WalletButton({ disableMobileShrink }: WalletButtonProps) {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal }) => {
        const connected = account && chain;

        return (
          <div className="flex flex-row gap-2">
            <TreasuryPill />
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal} variant="secondary" className="py-[10px]">
                    Connect
                  </Button>
                );
              }

              if (chain.unsupported) {
                return (
                  <Button variant="negative" onClick={openChainModal}>
                    Wrong Network
                  </Button>
                );
              }

              return (
                <Button variant="secondary" onClick={openAccountModal} className="flex flex-row gap-2 px-4 py-[6px]">
                  <EnsAvatar address={account.address as Address} size={32} />
                  <EnsName
                    address={account.address as Address}
                    className={clsx("label-md md:block", !disableMobileShrink && "hidden")}
                  />
                </Button>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
