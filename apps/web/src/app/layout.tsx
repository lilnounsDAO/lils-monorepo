import { Helmet } from "react-helmet-async";
import Providers from "@/providers/providers";
import ToastContainer from "@/components/ToastContainer";
import TestnetBanner from "@/components/TestnetBanner";
import Analytics from "@/components/Analytics";

import "@rainbow-me/rainbowkit/styles.css";
import "@/theme/globals.css";
import { WithContext, WebSite } from "schema-dts";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd: WithContext<WebSite> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Lilnouns.wtf",
    url: "https://www.lilnouns.wtf",
    description:
      "Lilnouns.wtf is a platform for buying, and governing in Lil Nouns DAO.",
    publisher: {
      "@type": "Organization",
      name: "Lilnouns.wtf",
      url: "https://www.lilnouns.wtf",
      logo: "https://www.lilnouns.wtf/app-icon.jpeg",
    },
  };

  return (
    <>
      <Helmet>
        <title>Lilnouns.wtf | Lil Nouns DAO Governance Hub</title>
        <meta name="description" content="Discover, buy and govern Lil Nouns NFTs. Learn how Lil Nouns DAO funds ideas through community governance." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#ffffff" />
        <meta name="application-name" content="Lilnouns.wtf" />
        
        {/* Open Graph */}
        <meta property="og:url" content="https://www.lilnouns.wtf" />
        <meta property="og:site_name" content="Lilnouns.wtf - Discover, Buy, and govern in Lil Nouns DAO" />
        <meta property="og:type" content="website" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:title" content="Lilnouns.wtf – Lil Nouns DAO Governance Hub" />
        <meta property="og:description" content="The place for all things Lil Nouns DAO. Bid, and vote with Lil Nouns NFTs in Lil Nouns DAO." />
        
        {/* Robots */}
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow" />
        
        {/* Apple Web App */}
        <meta name="apple-mobile-web-app-title" content="Lilnouns.wtf – Lil Nouns DAO Governance Hub" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        
        {/* Keywords */}
        <meta name="keywords" content="Lil Nouns,Lils,Lil Nouns DAO,Lil Nouns NFTs, Lil Nouns Marketplace,Nouns,Nouns DAO,Nouns NFTs,NFT,NFT Auction,Nouns Marketplace,Governance,Metagovernance,Ethereum,NFT Marketplace,Blockchain,Decentralized Exchange,Buy Nouns,Swap Nouns,Web3,Crypto" />
        
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      </Helmet>
      
      <Providers>
        {/* CRITICAL: No overflow constraints - viewport must be scrolling container for sticky to work */}
        <div className="flex min-h-screen flex-col justify-between border-border-primary">
          <TestnetBanner />
          {children}
        </div>
        <ToastContainer />
      </Providers>
      <Analytics />
    </>
  );
}