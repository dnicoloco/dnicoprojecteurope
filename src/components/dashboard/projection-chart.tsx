"use client";

import * as React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import { InnerCard } from "./card";
import { buildProjection, levelAt } from "@/lib/metrics";
import type { LessonMetrics } from "@/lib/metrics";

type Props = {
  lessons: LessonMetrics[];
  weeks?: number;
};

export function ProjectionChart({ lessons, weeks = 12 }: Props) {
  const data = React.useMemo(
    () => buildProjection(lessons, weeks),
    [lessons, weeks],
  );
  const endRow = data[data.length - 1];
  const startRow = data[0];

  return (
    <InnerCard className="p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="font-display text-xl text-[#191919]">
            Projected fluency over {weeks} weeks
          </div>
          <div className="text-sm text-[#6a7580] mt-1 max-w-md">
            Based on your lesson-by-lesson speed. More lessons, faster climb.
          </div>
        </div>
        <div className="flex flex-col items-end text-right">
          <span className="text-sm text-[#6a7580]">Starting today</span>
          <span className="font-display text-lg text-[#191919]">
            {startRow?.current} WPM · {levelAt(startRow?.current || 0)}
          </span>
        </div>
      </div>

      <div className="h-72 -ml-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <defs>
              <linearGradient id="gradCurrent" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#6a7580" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#6a7580" stopOpacity={0.9} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(25,25,25,0.06)" strokeDasharray="3 3" vertical={false} />
            <XAxis
              dataKey="week"
              tick={{ fill: "#6a7580", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(25,25,25,0.1)" }}
              tickFormatter={(v) => `wk ${v}`}
            />
            <YAxis
              tick={{ fill: "#6a7580", fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(25,25,25,0.1)" }}
              tickFormatter={(v) => `${v}`}
              domain={["dataMin - 5", "dataMax + 5"]}
              label={{
                value: "WPM",
                angle: -90,
                position: "insideLeft",
                style: { fill: "#6a7580", fontSize: 11 },
                offset: 12,
              }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: 10,
                border: "1px solid rgba(25,25,25,0.08)",
                boxShadow: "0 8px 24px rgba(25,25,25,0.08)",
                fontFamily: "var(--font-platform), system-ui, sans-serif",
                fontSize: 12,
              }}
              labelFormatter={(v) => `Week ${v}`}
              formatter={(value, name) => [
                `${Number(value)} WPM · ${levelAt(Number(value))}`,
                name,
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={28}
              iconType="plainline"
              wrapperStyle={{ fontSize: 12, color: "#6a7580" }}
            />
            <ReferenceLine
              x={0}
              stroke="rgba(25,25,25,0.2)"
              strokeDasharray="2 3"
              label={{ value: "today", fontSize: 10, fill: "#6a7580", position: "top" }}
            />
            <Line
              type="monotone"
              dataKey="current"
              name="Current pace (1 a week)"
              stroke="#6a7580"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="plus1"
              name="+1 lesson a week (recommended)"
              stroke="#FF7AAC"
              strokeWidth={3}
              dot={false}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="plus2"
              name="+2 lessons a week"
              stroke="#191919"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-[6px] bg-[#FAF9F5] p-4 border border-[rgba(25,25,25,0.04)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-3 h-0.5 bg-[#6a7580]" />
            <span className="text-sm text-[#6a7580] font-medium">Current pace</span>
          </div>
          <div className="font-display text-lg text-[#191919]">
            {endRow?.current} WPM, {levelAt(endRow?.current || 0)}
          </div>
        </div>
        <div className="rounded-[6px] bg-[#FFF0F6] p-4 border border-[#FF7AAC]/25">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-3 h-0.5 bg-[#FF7AAC]" />
            <span className="text-sm text-[#FF7AAC] font-medium">+1 lesson a week</span>
          </div>
          <div className="font-display text-lg text-[#191919]">
            {endRow?.plus1} WPM, {levelAt(endRow?.plus1 || 0)}
          </div>
          <div className="text-sm text-[#6a7580] mt-1">Recommended</div>
        </div>
        <div className="rounded-[6px] bg-[#FAF9F5] p-4 border border-[rgba(25,25,25,0.04)]">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-3 h-0.5 bg-[#191919]" />
            <span className="text-sm text-[#191919] font-medium">+2 lessons a week</span>
          </div>
          <div className="font-display text-lg text-[#191919]">
            {endRow?.plus2} WPM, {levelAt(endRow?.plus2 || 0)}
          </div>
        </div>
      </div>
    </InnerCard>
  );
}
