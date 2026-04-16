import * as React from "react";
import { InnerCard } from "./card";
import type { CohortInsight } from "@/lib/metrics";

export function CohortCard({ insight }: { insight: CohortInsight }) {
  return (
    <InnerCard className="p-5">
      <div className="text-[14px] font-medium tracking-[0.04em] text-[#6a7580]">
        Cohort insight
      </div>
      <div className="font-display text-[20px] text-[#191919] leading-tight mt-1">
        {insight.headlinePath}
      </div>
      <div className="text-[14px] text-[#FF7AAC] font-medium mt-1">
        {insight.boostPath}
      </div>
      <div className="text-[14px] text-[#6a7580]/80 mt-3 italic">
        {insight.source}
      </div>
    </InnerCard>
  );
}
