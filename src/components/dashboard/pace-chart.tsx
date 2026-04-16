"use client";

import * as React from "react";
import { motion } from "framer-motion";
import type { CefrLevel } from "@/lib/metrics";

const SLIDER_MIN = 2;
const SLIDER_MAX = 20;

export function PaceChart({
  levels,
  currentLevel,
  goalLevel,
  baselineRate,
  source,
  current,
}: {
  levels: CefrLevel[];
  currentLevel: string;
  goalLevel: string;
  baselineRate: number;
  source: string;
  current?: string;
}) {
  const [rate, setRate] = React.useState(baselineRate);

  const currentIdx = levels.findIndex((l) => l.level === currentLevel);
  const currentCumulative = levels[currentIdx]?.cumulativeLessons ?? 0;
  const totalCumulative = levels[levels.length - 1].cumulativeLessons;

  const dots = levels.map((l, i) => {
    const lessonsFromNow = Math.max(0, l.cumulativeLessons - currentCumulative);
    const months = lessonsFromNow / rate;
    return {
      ...l,
      isPast: i < currentIdx,
      isCurrent: i === currentIdx,
      isGoal: l.level === goalLevel,
      isFuture: i > currentIdx,
      months,
      x: (l.cumulativeLessons / totalCumulative) * 100,
    };
  });

  const pct = ((rate - SLIDER_MIN) / (SLIDER_MAX - SLIDER_MIN)) * 100;

  return (
    <div className="rounded-[6px] bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-10px_rgba(0,0,0,0.1)] p-5">
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-2">
        <h2 className="font-display text-[20px] text-[#191919] leading-none">
          Where you&apos;re heading
        </h2>
        {current && <div className="text-[14px] text-[#6a7580]">{current}</div>}
      </div>

      {/* Journey track */}
      <div className="relative mt-10 mb-10 px-3" style={{ height: 44 }}>
        <div className="absolute left-3 right-3 top-1/2 h-px bg-black/[0.1] -translate-y-1/2" />

        {dots.map((d) => {
          const size = d.isCurrent || d.isGoal ? 16 : d.isPast ? 8 : 12;
          const color = d.isGoal
            ? "radial-gradient(circle at 30% 30%, #FFC8DC 0%, #FF7AAC 55%, #B03070 100%)"
            : d.isCurrent
              ? "#191919"
              : d.isPast
                ? "rgba(25,25,25,0.25)"
                : "radial-gradient(circle at 30% 30%, #3a3a3d 0%, #191919 100%)";
          const shadow = d.isGoal
            ? "0 0 12px rgba(255,122,172,0.55), 0 0 3px rgba(255,122,172,0.9)"
            : d.isCurrent
              ? "0 0 0 4px rgba(25,25,25,0.08)"
              : d.isPast
                ? "none"
                : "0 2px 4px rgba(0,0,0,0.25)";

          const labelColor = d.isGoal
            ? "#FF7AAC"
            : d.isCurrent
              ? "#191919"
              : d.isPast
                ? "#6a7580"
                : "#191919";

          return (
            <div
              key={d.level}
              className="absolute top-1/2"
              style={{
                left: `calc(${d.x}% + 12px)`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className="absolute bottom-[14px] left-1/2 -translate-x-1/2 text-[14px] whitespace-nowrap"
                style={{
                  color: labelColor,
                  fontWeight: d.isPast ? 400 : 600,
                }}
              >
                {d.level}
                {d.isGoal && " ★"}
              </div>

              <div
                className="rounded-full"
                style={{
                  width: size,
                  height: size,
                  background: color,
                  boxShadow: shadow,
                }}
              />

              {d.isCurrent && (
                <div className="absolute top-[16px] left-1/2 -translate-x-1/2 text-[14px] text-[#191919]/70 whitespace-nowrap">
                  you
                </div>
              )}
              {d.isFuture && (
                <motion.div
                  className="absolute top-[16px] left-1/2 -translate-x-1/2 text-[14px] whitespace-nowrap"
                  style={{ color: d.isGoal ? "#FF7AAC" : "#6a7580" }}
                  initial={false}
                  animate={{ opacity: 1 }}
                  key={Math.round(d.months)}
                >
                  est {Math.round(d.months)} mo
                </motion.div>
              )}
            </div>
          );
        })}
      </div>

      {/* Slider */}
      <div>
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-[14px] text-[#6a7580]">lessons per month</span>
          <span className="text-[14px] font-semibold text-[#191919]">
            {rate}
          </span>
        </div>
        <input
          type="range"
          min={SLIDER_MIN}
          max={SLIDER_MAX}
          step={1}
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
          className="pink-slider"
          style={{
            background: `linear-gradient(to right, #FF7AAC 0%, #FF7AAC ${pct}%, #F2F3F5 ${pct}%, #F2F3F5 100%)`,
          }}
        />
        <div className="flex justify-between text-[14px] text-[#6a7580] mt-1">
          <span>{SLIDER_MIN}</span>
          <span>{SLIDER_MAX}</span>
        </div>
      </div>

      <p className="text-[14px] text-[#6a7580]/70 italic mt-5">{source}</p>
    </div>
  );
}
