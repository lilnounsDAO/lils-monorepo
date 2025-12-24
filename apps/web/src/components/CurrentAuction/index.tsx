"use client";
import { NounImageBase } from "../NounImage";
import { formatNumber, formatTimeLeft } from "@/utils/format";
import { formatEther } from "viem";
import clsx from "clsx";
import { useAuctionData } from "@/hooks/useAuctionData";
import { useVRGDAData } from "@/hooks/useVRGDAData";
import { useQuery } from '@tanstack/react-query';
import { readContract } from 'viem/actions';
import { CHAIN_CONFIG } from '@/config';
import { lilVRGDAConfig } from '@/config/lilVRGDAConfig';
import { useMemo } from 'react';

export function CurrentAuctionLarge() {
  const { auction, noun, timeRemainingS } = useAuctionData();

  const items: { title: string; value: string }[] = [
    {
      title: "Current bid",
      value: formatNumber({
        input: Number(
          formatEther(
            auction?.bids[0]?.amount
              ? BigInt(auction?.bids[0]?.amount)
              : BigInt(0),
          ),
        ),
        unit: "ETH",
      }),
    },
    { title: "Time left", value: formatTimeLeft(timeRemainingS ?? 0) },
  ];

  return (
    <div
      className={clsx(
        "flex w-full flex-col items-center justify-center",
        noun?.traits.background.seed == 1 ? "bg-nouns-warm" : "bg-nouns-cool",
      )}
    >
      <NounImageBase noun={noun ?? undefined} width={156} height={156} />
      <div className="flex w-full max-w-[336px] gap-2 rounded-[14px] bg-white p-1">
        {items.map((item, i) => (
          <div
            className="flex w-full min-w-0 flex-1 flex-col items-center justify-center rounded-[11px] bg-gray-100 px-4 py-2.5 text-center"
            key={i}
          >
            <span className="text-content-secondary label-sm">
              {item.title}
            </span>
            <span className="heading-6">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CurrentVRGDAAuctionLarge() {
  const { currentPrice, timeToNextDrop, reservePrice } = useVRGDAData();

  // Get the current VRGDA noun from contract
  const { data: vrgdaNoun } = useQuery({
    queryKey: ["vrgda-current-noun"],
    queryFn: async () => {
      // Get current block
      const currentBlock = await CHAIN_CONFIG.publicClient.getBlockNumber();
      const blockNumber = currentBlock - 1n; // Use previous block
      
      const result = await readContract(CHAIN_CONFIG.publicClient, {
        ...lilVRGDAConfig,
        functionName: "fetchNoun",
        args: [BigInt(blockNumber)],
      });
      
      // result is [nounId, seed, svg, price, hash]
      const [nounId, seed, svg, price, hash] = result;
      
      // Parse seed data [background, body, accessory, head, glasses]
      const [background, body, accessory, head, glasses] = seed;
      
      return {
        id: nounId.toString(),
        traits: {
          background: { seed: Number(background) },
          body: { seed: Number(body) },
          accessory: { seed: Number(accessory) },
          head: { seed: Number(head) },
          glasses: { seed: Number(glasses) }
        }
      };
    },
    staleTime: 12000, // 12 seconds (block time)
    refetchInterval: 15000, // 15 seconds
  });

  // Format time to next drop
  const formatTimeToNextDrop = (seconds: number | undefined) => {
    if (!seconds || seconds <= 0) return "Now";
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const items = useMemo(() => {
    const baseItems = [
      {
        title: "Current price",
        value: currentPrice ? `${parseFloat(formatEther(currentPrice)).toFixed(4)} ETH` : "—",
      }
    ];

    // Only show price drop timer if price is above reserve
    if (timeToNextDrop && timeToNextDrop > 0 && currentPrice && reservePrice && currentPrice > reservePrice) {
      baseItems.push({
        title: "Price drops in",
        value: formatTimeToNextDrop(timeToNextDrop),
      });
    }

    return baseItems;
  }, [currentPrice, timeToNextDrop, reservePrice]);

  return (
    <div
      className={clsx(
        "flex w-full flex-col items-center justify-center",
        vrgdaNoun?.traits.background.seed == 1 ? "bg-nouns-warm" : "bg-nouns-cool",
      )}
    >
      <NounImageBase noun={vrgdaNoun ?? undefined} width={156} height={156} />
      <div className="flex w-full max-w-[336px] gap-2 rounded-[14px] bg-white p-1">
        {items.map((item, i) => (
          <div
            className="flex w-full min-w-0 flex-1 flex-col items-center justify-center rounded-[11px] bg-gray-100 px-4 py-2.5 text-center"
            key={i}
          >
            <span className="text-content-secondary label-sm">
              {item.title}
            </span>
            <span className="heading-6">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function CurrentAuctionSmall() {
  const { noun, timeRemainingS } = useAuctionData();

  return (
    <div className="flex items-center gap-2 label-md">
      <div>{timeRemainingS != undefined && formatTimeLeft(timeRemainingS)}</div>
      <NounImageBase
        noun={noun ?? undefined}
        width={32}
        height={32}
        className={clsx(
          "rounded-[6px]",
          noun?.traits.background.seed == 1 ? "bg-nouns-warm" : "bg-nouns-cool",
        )}
      />
    </div>
  );
}
