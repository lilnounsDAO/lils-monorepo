"use client";
import NavButton from "@/components/NavButton";
import { cn } from "@/utils/shadcn";
import { Link, useLocation } from "react-router-dom";
import { HTMLAttributes, ReactNode, useRef } from "react";
import { LinkExternal } from "./ui/link";

interface FeatureHighlightCardProps extends HTMLAttributes<HTMLDivElement> {
  href: string;
  iconSrc: string;
  buttonLabel: string;
  description: string;
  children: ReactNode;
}

export default function FeatureHighlightCard({
  href,
  iconSrc,
  buttonLabel,
  description,
  className,
  children,
  ...props
}: FeatureHighlightCardProps) {
  const hoverRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  const handleClick = () => {
    // If clicking a link to the current page (e.g., "/" when already on "/"), scroll to top
    if (href.startsWith("/") && location.pathname === href) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const content = (
    <div
      ref={hoverRef}
      className={cn(
        "relative flex h-full w-full min-w-0 flex-col items-center justify-between gap-4 overflow-hidden rounded-[32px] transition-all hover:brightness-90",
        className,
      )}
      {...props}
    >
      <div className="flex w-full flex-col gap-4 px-8 pt-8 md:px-10 md:pt-10">
        <NavButton
          variant="secondary"
          iconSrc={iconSrc}
          className="w-fit rounded-full border-none stroke-content-primary px-4 label-lg hover:bg-white"
          hoverRef={hoverRef}
        >
          {buttonLabel}
        </NavButton>
        <p className="heading-5">{description}</p>
      </div>
      {children}
    </div>
  );

  return href.startsWith("/") ? (
    <Link to={href} onClick={handleClick} className="w-full flex-1">
      {content}
    </Link>
  ) : (
    <LinkExternal href={href} className="w-full flex-1 hover:brightness-100">
      {content}
    </LinkExternal>
  );
}
