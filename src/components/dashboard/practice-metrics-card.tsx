import * as React from "react";
import { InnerCard } from "./card";
import type { PracticeMetrics } from "@/lib/metrics";

function Metric({
  label,
  value,
  unit,
  delta,
  invertGood = false,
}: {
  label: string;
  value: string;
  unit?: string;
  delta: number;
  invertGood?: boolean;
}) {
  const isGood = invertGood ? delta < 0 : delta > 0;
  const color = isGood ? "text-[#FF7AAC]" : "text-[#6a7580]";
  const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "→";
  return (
    <div className="flex-1 min-w-[160px]">
      <div className="text-sm text-[#6a7580] font-medium">{label}</div>
      <div className="flex items-end gap-1.5 mt-1">
        <span className="font-display text-[26px] text-[#191919] leading-none">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-[#6a7580] mb-0.5">{unit}</span>
        )}
      </div>
      <div className={`text-sm font-semibold mt-1 ${color}`}>
        {arrow} {delta > 0 ? "+" : ""}
        {delta} wk/wk
      </div>
    </div>
  );
}

export function PracticeMetricsCard({ practice }: { practice: PracticeMetrics }) {
  return (
    <InnerCard className="p-5">
      <div className="text-[14px] font-medium tracking-[0.04em] text-[#6a7580] mb-4">
        Your practice metrics
      </div>
      <div className="flex flex-wrap gap-6">
        <Metric
          label="Your talk-time"
          value={`${practice.talkTimePct}%`}
          delta={practice.talkTimeDelta}
          invertGood
        />
        <Metric
          label="Open questions"
          value={`${practice.openQuestionsPerLesson}`}
          unit="/ lesson"
          delta={practice.openQuestionsDelta}
        />
        <Metric
          label="Interruptions"
          value={`${practice.interruptsPerLesson}`}
          unit="/ lesson"
          delta={practice.interruptsDelta}
          invertGood
        />
      </div>
      <p className="text-[14px] text-[#6a7580] mt-4 leading-relaxed max-w-xl">
        Lower talk-time + more open questions generally correlates with faster student progress.
      </p>
    </InnerCard>
  );
}
