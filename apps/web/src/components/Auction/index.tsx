"use client";
import { SlidingAuctionContainer } from "./SlidingAuctionContainer";

interface AuctionProps {
  initialAuctionId?: string;
}

export default function Auction({ initialAuctionId }: AuctionProps) {
  return <SlidingAuctionContainer initialAuctionId={initialAuctionId} />;
}