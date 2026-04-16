import * as React from "react";
import type { Topic } from "@/lib/metrics";

export function TopicCard({ topic }: { topic: Topic }) {
  const delta = topic.vocabDeltaPct;
  return (
    <button className="group shrink-0 w-[220px] text-left cursor-pointer">
      <div
        className="relative aspect-square w-full rounded-[6px] overflow-hidden border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-8px_rgba(0,0,0,0.1)] group-hover:border-black/[0.15] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_3px_6px_rgba(0,0,0,0.07),0_14px_24px_-10px_rgba(0,0,0,0.16)] group-hover:-translate-y-0.5 transition-all duration-200"
        style={{ background: "#1a1a1d" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at top left, ${topic.color}3a 0%, transparent 55%)`,
          }}
        />
        <span className="absolute top-3 right-3 text-[16px] opacity-65">
          {topic.emoji}
        </span>
        <div className="absolute bottom-3 left-3 right-3">
          <div className="font-display text-[24px] text-white leading-[1.05]">
            {topic.name}
          </div>
        </div>
      </div>
      <div className="pt-2.5 px-0.5">
        <div className="text-[14px] text-[#191919]/80 truncate">
          {topic.sessionsCount} session{topic.sessionsCount === 1 ? "" : "s"}
          <span className="mx-1.5 text-[#6a7580]">·</span>
          <span
            className={
              delta >= 0 ? "text-[#FF7AAC] font-medium" : "text-[#6a7580]"
            }
          >
            {delta >= 0 ? "+" : ""}
            {delta}% vocab
          </span>
        </div>
      </div>
    </button>
  );
}
