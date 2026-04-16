import * as React from "react";
import { InnerCard } from "./card";
import type { TutorPulse } from "@/lib/metrics";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

export function PulseHero({
  pulse,
  tutorName,
}: {
  pulse: TutorPulse;
  tutorName: string;
}) {
  const maxBar = Math.max(...pulse.weeklyBars, 1);
  return (
    <InnerCard className="p-6">
      <div className="flex items-start justify-between gap-6 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <div className="text-sm font-medium text-[#6a7580]">
            This week — {tutorName}
          </div>
          <h1 className="font-display text-[28px] text-[#191919] leading-[1.1] mt-2 max-w-xl">
            {pulse.sessionsThisWeek} sessions ·{" "}
            <span className="text-[#FF7AAC]">
              +{pulse.studentDeltaPct}% avg student growth
            </span>{" "}
            · your talk-time {pulse.tutorTalkTimePct}%
          </h1>
          <div className="text-sm text-[#6a7580] mt-3">
            Triage below, roster underneath, your own practice at the bottom.
          </div>
        </div>
        <div className="flex items-end gap-1.5 h-20">
          {pulse.weeklyBars.map((v, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div
                className="w-5 rounded-sm bg-gradient-to-t from-[#FF7AAC] to-[#FFB4D0]"
                style={{ height: `${(v / maxBar) * 60 + 4}px` }}
              />
              <span className="text-[14px] text-[#6a7580]">{DAYS[i]}</span>
            </div>
          ))}
        </div>
      </div>
    </InnerCard>
  );
}
