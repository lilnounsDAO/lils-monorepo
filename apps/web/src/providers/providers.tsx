"use client";
import { ToastProvider } from "./toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TransactionListenerProvider } from "./TransactionListener";
import TanstackQueryProvider from "./TanstackQueryProvider";
import { Address, fallback } from "viem";
import { http, WagmiProvider } from "wagmi";
import { CHAIN_CONFIG } from "@/config";
import {
  getDefaultConfig,
  AvatarComponent,
  RainbowKitProvider,
  DisclaimerComponent,
} from "@rainbow-me/rainbowkit";
import { createConfig } from "wagmi";
import { EnsAvatar } from "@/components/EnsAvatar";

export const PROJECT_ID = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID!;

// Create minimal wagmi config without WalletConnect for SSR
const config = typeof window === 'undefined' 
  ? createConfig({
      chains: [CHAIN_CONFIG.chain],
      transports: {
        [CHAIN_CONFIG.publicClient.chain!.id]: fallback([
          http(CHAIN_CONFIG.rpcUrl.primary),
          http(CHAIN_CONFIG.rpcUrl.fallback),
        ]),
      },
      ssr: true,
    })
  : getDefaultConfig({
      chains: [CHAIN_CONFIG.chain],
      transports: {
        [CHAIN_CONFIG.publicClient.chain!.id]: fallback([
          http(CHAIN_CONFIG.rpcUrl.primary),
          http(CHAIN_CONFIG.rpcUrl.fallback),
        ]),
      },
      projectId: PROJECT_ID,
      appName: "Lilnouns.wtf",
      appDescription: "Lil Nouns DAO Governance Hub",
      appUrl: import.meta.env.VITE_URL!,
      appIcon: `${import.meta.env.VITE_URL}/app-icon.jpeg`,
      ssr: true,
    });

export const CustomAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  return <EnsAvatar address={address as Address} size={size} />;
};

const Disclaimer: DisclaimerComponent = ({ Text }) => (
  <Text>
    By connecting your wallet, you agree to use this service responsibly.
  </Text>
);

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <TanstackQueryProvider>
      <WagmiProvider config={config}>
          <RainbowKitProvider
            avatar={CustomAvatar}
            appInfo={{ appName: "Lil Nouns", disclaimer: Disclaimer }}
            showRecentTransactions={true}
          >
            <ToastProvider>
              <TransactionListenerProvider>
                <TooltipProvider>{children}</TooltipProvider>
              </TransactionListenerProvider>
            </ToastProvider>
          </RainbowKitProvider>
      </WagmiProvider>
    </TanstackQueryProvider>
  );
}
