import * as React from "react";
import type { CulturalItem } from "@/lib/metrics";

export function CulturalCard({ item }: { item: CulturalItem }) {
  return (
    <button className="group shrink-0 w-[220px] text-left cursor-pointer">
      <div
        className="relative aspect-square w-full rounded-[6px] overflow-hidden border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-8px_rgba(0,0,0,0.1)] group-hover:border-black/[0.15] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_3px_6px_rgba(0,0,0,0.07),0_14px_24px_-10px_rgba(0,0,0,0.16)] group-hover:-translate-y-0.5 transition-all duration-200"
        style={{ background: "#1a1a1d" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at top left, ${item.color}3a 0%, transparent 55%)`,
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-[60px] opacity-80">
          {item.emoji}
        </span>
      </div>
      <div className="pt-2.5 px-0.5">
        <div className="text-[14px] font-medium text-[#191919] line-clamp-1">
          {item.title}
        </div>
        <div className="text-[14px] text-[#6a7580] mt-0.5 line-clamp-1">
          {item.blurb}
        </div>
      </div>
    </button>
  );
}
