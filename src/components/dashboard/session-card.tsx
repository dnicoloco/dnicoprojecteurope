"use client";

import * as React from "react";
import { Grainient } from "@/components/ui/grainient";
import type { SessionDetail, Topic } from "@/lib/metrics";

const CARD_PALETTES: Array<[string, string, string]> = [
  ["#FFD6E0", "#FFBDCC", "#FFA3B8"], // pastel pink
  ["#D0E8FF", "#B0D4FF", "#8EBFFF"], // pastel blue
  ["#FFDDC1", "#FFCBA4", "#FFB88A"], // warm peach/orange
  ["#C8F0D4", "#A8E4BC", "#88D8A4"], // soft green
  ["#FFD6E0", "#E8C4D4", "#D0E8FF"], // pink into blue
];

function fmtDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function SessionCard({
  session,
  topic,
  onClick,
}: {
  session: SessionDetail;
  topic: Topic | undefined;
  onClick?: () => void;
}) {
  const padded = String(session.lesson).padStart(2, "0");
  const palette = CARD_PALETTES[session.lesson % CARD_PALETTES.length];

  return (
    <button
      onClick={onClick}
      className="group shrink-0 w-[220px] text-left cursor-pointer"
    >
      <div
        className="relative aspect-square w-full rounded-[6px] overflow-hidden border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-8px_rgba(0,0,0,0.1)] group-hover:border-black/[0.15] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_3px_6px_rgba(0,0,0,0.07),0_14px_24px_-10px_rgba(0,0,0,0.16)] group-hover:-translate-y-0.5 transition-all duration-200"
      >
        <Grainient
          className="absolute inset-0"
          color1={palette[0]}
          color2={palette[1]}
          color3={palette[2]}
          timeSpeed={0.15}
          warpStrength={1.0}
          warpFrequency={3.5}
          warpAmplitude={55}
          grainAmount={0.12}
          grainScale={2.0}
          grainAnimated={true}
          contrast={1.1}
          saturation={1.0}
          zoom={1.1}
        />
        <div className="absolute z-10 top-3 left-3 text-[14px] font-semibold text-[#191919]">
          lesson
        </div>
        <div className="absolute z-10 top-9 left-3 font-display text-[64px] leading-none text-[#191919]">
          {padded}
        </div>
        <div className="absolute z-20 bottom-3 left-3 right-3 flex items-center gap-2">
          <img
            src="/tutor-avatar.jpg"
            alt="Tutor"
            className="w-9 h-9 rounded-[4px] object-cover border border-white/40 shrink-0"
          />
          <div>
            <div className="text-[12px] font-semibold text-[#191919]/80">Sarah W.</div>
            <div className="text-[11px] text-[#191919]/55">{fmtDate(session.date)}</div>
          </div>
        </div>
      </div>
      <div className="pt-2 px-0.5">
        <div className="text-[13px] text-[#191919] line-clamp-1">
          {session.bestMomentLabel}
        </div>
      </div>
    </button>
  );
}
