"use client";
import { ComponentProps, useState, forwardRef } from "react";
import { Textarea } from "./ui/textarea";
import { cn } from "@/utils/shadcn";

const AutoresizingTextArea = forwardRef<HTMLTextAreaElement, ComponentProps<typeof Textarea>>(
  ({ className, onChange, value, ...props }, ref) => {
    const [replicatedValue, setReplicatedValue] = useState<string>(
      typeof value == "string" ? value : "",
    );

    return (
      <div
        className={cn("grow-wrap", className, "p-0")}
        data-replicated-value={replicatedValue}
      >
        <Textarea
          ref={ref}
          className={cn(
            "h-full min-h-[24px] min-w-0 resize-none overflow-hidden border-none bg-transparent p-0 paragraph-md focus-visible:border-none focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-offset-0",
            className,
          )}
          onChange={(e) => {
            setReplicatedValue(e.target.value);
            onChange?.(e);
          }}
          value={value ?? replicatedValue}
          rows={1}
          {...props}
        />
      </div>
    );
  }
);

AutoresizingTextArea.displayName = "AutoresizingTextArea";

export default AutoresizingTextArea;
