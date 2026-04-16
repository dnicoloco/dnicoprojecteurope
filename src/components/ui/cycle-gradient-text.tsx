"use client";

import React from "react";
import { cn } from "@/lib/utils";

// A three-slot cycling gradient text animation. Words rotate through vibrant
// neon gradients on an 8s loop, styled with our display font.
export function CycleGradientText({
  words,
  className,
}: {
  words: [string, string, string];
  className?: string;
}) {
  return (
    <h1
      className={cn(
        "font-display select-none px-3 py-2 flex flex-col md:flex-row text-center leading-none tracking-tighter",
        className,
      )}
      style={{ fontWeight: 500 }}
    >
      <span
        data-content={words[0]}
        className="before:animate-gradient-background-1 relative before:absolute before:bottom-4 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)]"
      >
        <span className="from-gradient-1-start to-gradient-1-end animate-gradient-foreground-1 bg-gradient-to-r bg-clip-text px-2 text-transparent sm:px-5">
          {words[0]}
        </span>
      </span>
      <span
        data-content={words[1]}
        className="before:animate-gradient-background-2 relative before:absolute before:bottom-0 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)]"
      >
        <span className="from-gradient-2-start to-gradient-2-end animate-gradient-foreground-2 bg-gradient-to-r bg-clip-text px-2 text-transparent sm:px-5">
          {words[1]}
        </span>
      </span>
      <span
        data-content={words[2]}
        className="before:animate-gradient-background-3 relative before:absolute before:bottom-1 before:left-0 before:top-0 before:z-0 before:w-full before:px-2 before:content-[attr(data-content)]"
      >
        <span className="from-gradient-3-start to-gradient-3-end animate-gradient-foreground-3 bg-gradient-to-r bg-clip-text px-2 text-transparent sm:px-5">
          {words[2]}
        </span>
      </span>
    </h1>
  );
}
