import * as React from "react";
import type { Topic } from "@/lib/metrics";

const GRADIENT_MAP: Record<string, string> = {
  "#E8DFFF": "linear-gradient(135deg, #E8DFFF, #C4B0F0)",
  "#D6ECFF": "linear-gradient(135deg, #D6ECFF, #A8D4FF)",
  "#D1F5E0": "linear-gradient(135deg, #D1F5E0, #9FE5BE)",
  "#FFE5E0": "linear-gradient(135deg, #FFE5E0, #FFCDC6)",
  "#D4DEFF": "linear-gradient(135deg, #D4DEFF, #A8BAFF)",
};

function gradientForColor(hex: string): string {
  return GRADIENT_MAP[hex] ?? `linear-gradient(135deg, ${hex}, ${hex}88)`;
}

export function TopicCard({
  topic,
  index = 0,
}: {
  topic: Topic;
  index?: number;
}) {
  void index;
  const delta = topic.vocabDeltaPct;

  return (
    <button className="group shrink-0 w-[220px] text-left cursor-pointer">
      <div
        className="relative aspect-square w-full rounded-[6px] overflow-hidden border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-8px_rgba(0,0,0,0.1)] group-hover:border-black/[0.15] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_3px_6px_rgba(0,0,0,0.07),0_14px_24px_-10px_rgba(0,0,0,0.16)] group-hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-end p-4"
        style={{ background: "#1a1a1d" }}
      >
        <span className="absolute top-3 right-3 text-[28px]">
          {topic.emoji}
        </span>

        <div
          className="font-display text-[30px] leading-[1.1]"
          style={{
            background: gradientForColor(topic.color),
            color: "transparent",
            backgroundClip: "text",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          {topic.name}
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
