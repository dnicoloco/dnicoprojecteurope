import * as React from "react";
import { InnerCard } from "./card";
import { Sparkline } from "./sparkline";
import { cn } from "@/lib/utils";

export type Trend = "up" | "down" | "flat";

type Props = {
  label: string;
  value: string;
  unit?: string;
  values: number[];
  trend: Trend;
  delta?: string;
  sparkColor?: string;
  sparkFill?: string;
};

export function StatTile({
  label,
  value,
  unit,
  values,
  trend,
  delta,
  sparkColor,
  sparkFill,
}: Props) {
  const arrow = trend === "up" ? "▲" : trend === "down" ? "▼" : "→";
  const trendColor =
    trend === "up"
      ? "text-[#3DDABE]"
      : trend === "down"
        ? "text-[#ff7aac]"
        : "text-[#6a7580]";
  return (
    <InnerCard className="p-5 flex flex-col gap-3">
      <div className="text-sm font-medium text-[#6a7580]">{label}</div>
      <div className="flex items-end gap-1.5">
        <span className="font-display text-4xl text-[#191919] leading-none">
          {value}
        </span>
        {unit && (
          <span className="text-base text-[#6a7580] mb-1">{unit}</span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <Sparkline
          values={values}
          stroke={sparkColor || "#FF7AAC"}
          fill={sparkFill || "rgba(255,122,172,0.14)"}
          width={110}
          height={32}
        />
        {delta && (
          <span className={cn("text-sm font-medium", trendColor)}>
            {arrow} {delta}
          </span>
        )}
      </div>
    </InnerCard>
  );
}
