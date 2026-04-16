import * as React from "react";
import type { Topic } from "@/lib/metrics";
import { Grainient } from "@/components/ui/grainient";

/**
 * Derive three Grainient colours from the topic's single brand colour.
 * We keep the base colour as color1, lighten it for color2, and darken
 * it slightly for color3 -- giving each card a cohesive gradient feel.
 */
function deriveGradientColors(hex: string): [string, string, string] {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const lighten = (v: number, pct: number) =>
    Math.min(255, Math.round(v + (255 - v) * pct));
  const darken = (v: number, pct: number) =>
    Math.max(0, Math.round(v * (1 - pct)));

  const toHex = (rv: number, gv: number, bv: number) =>
    `#${[rv, gv, bv].map((c) => c.toString(16).padStart(2, "0")).join("")}`;

  const color1 = hex;
  const color2 = toHex(lighten(r, 0.35), lighten(g, 0.35), lighten(b, 0.35));
  const color3 = toHex(darken(r, 0.25), darken(g, 0.25), darken(b, 0.25));

  return [color1, color2, color3];
}

export function TopicCard({
  topic,
  index = 0,
}: {
  topic: Topic;
  index?: number;
}) {
  const delta = topic.vocabDeltaPct;
  const [c1, c2, c3] = deriveGradientColors(topic.color);

  // Vary warpFrequency per card so each Grainient looks unique
  const warpFrequency = 3.5 + index * 1.8;

  return (
    <button className="group shrink-0 w-[220px] text-left cursor-pointer">
      <div
        className="relative aspect-square w-full rounded-[6px] overflow-hidden border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-8px_rgba(0,0,0,0.1)] group-hover:border-black/[0.15] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_3px_6px_rgba(0,0,0,0.07),0_14px_24px_-10px_rgba(0,0,0,0.16)] group-hover:-translate-y-0.5 transition-all duration-200"
        style={{ background: "#1a1a1d" }}
      >
        {/* Grainient fills the entire card */}
        <div className="absolute inset-0">
          <Grainient
            color1={c1}
            color2={c2}
            color3={c3}
            warpFrequency={warpFrequency}
            warpAmplitude={40}
            timeSpeed={0.15}
            grainAmount={0.08}
            contrast={1.3}
            saturation={1.1}
            className="w-full h-full"
          />
        </div>

        <span className="absolute top-3 right-3 text-[28px] z-[1]">
          {topic.emoji}
        </span>
        {/* Dark scrim behind text — minimal height */}
        <div
          className="absolute bottom-0 left-0 right-0 z-[1] px-3 pb-3 pt-8"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
          }}
        >
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
