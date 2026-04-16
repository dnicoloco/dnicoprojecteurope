import * as React from "react";
import type { TopicForTutor } from "@/lib/metrics";

export function TopicForTutorCard({ topic }: { topic: TopicForTutor }) {
  return (
    <div className="shrink-0 w-[200px] bg-white rounded-[6px] border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-8px_rgba(0,0,0,0.1)] overflow-hidden">
      <div
        className="relative aspect-square w-full overflow-hidden"
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
          <div className="font-display text-[22px] text-white leading-[1.05]">
            {topic.name}
          </div>
        </div>
      </div>
      <div className="p-3">
        <div className="text-[14px] text-[#6a7580] truncate">
          n = {topic.studentCount}
          <span className="mx-1.5">·</span>
          <span className="text-[#FF7AAC] font-medium">
            +{topic.avgGrowthPct}%
          </span>
        </div>
      </div>
    </div>
  );
}
