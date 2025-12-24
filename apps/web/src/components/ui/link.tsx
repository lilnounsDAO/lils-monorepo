"use client";
import { Link, useSearchParams } from "react-router-dom";
import { AnchorHTMLAttributes, ComponentProps } from "react";
import { twMerge } from "tailwind-merge";
import { Button } from "./button";

export function LinkExternal({
  includeReferrer,
  ...props
}: { includeReferrer?: boolean } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      {...props}
      target="_blank"
      rel={`noopener ${includeReferrer ? "" : "noreferrer"}`}
      className={twMerge("transition-all hover:brightness-75", props.className)}
    />
  );
}

export function LinkRetainSearchParams(
  props: React.ComponentProps<typeof Link>,
) {
  const [searchParams] = useSearchParams();
  return <Link {...props} to={`${props.to}?${searchParams.toString()}`} />;
}

interface LinkShallowProps extends ComponentProps<typeof Button> {
  searchParam: { name: string; value: string | null };
}

export function LinkShallow({
  searchParam,
  children,
  variant,
  size,
  className,
  ...props
}: LinkShallowProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  return (
    <Button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log("LinkShallow clicked - searchParam:", searchParam);
        
        const params = new URLSearchParams(searchParams.toString());
        if (searchParam.value === null) {
          params.delete(searchParam.name);
        } else {
          params.set(searchParam.name, searchParam.value);
        }
        
        console.log("LinkShallow - setting params:", params.toString());
        
        // Use React Router's setSearchParams instead of manual history manipulation
        setSearchParams(params, { replace: false });
      }}
      className={className}
      variant={variant ?? "unstyled"}
      size={size ?? "fit"}
      {...props}
    >
      {children}
    </Button>
  );
}
