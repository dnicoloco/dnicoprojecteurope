import * as React from "react";
import { Sparkline } from "./sparkline";
import type { SessionDetail, Topic } from "@/lib/metrics";

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
  const color = topic?.color ?? "#FF7AAC";
  const padded = String(session.lesson).padStart(2, "0");

  return (
    <button
      onClick={onClick}
      className="group shrink-0 w-[220px] text-left cursor-pointer"
    >
      <div
        className="relative aspect-square w-full rounded-[6px] overflow-hidden border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-8px_rgba(0,0,0,0.1)] group-hover:border-black/[0.15] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_3px_6px_rgba(0,0,0,0.07),0_14px_24px_-10px_rgba(0,0,0,0.16)] group-hover:-translate-y-0.5 transition-all duration-200"
        style={{ background: "#1a1a1d" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at top left, ${color}55 0%, transparent 55%)`,
          }}
        />
        <div className="absolute top-3 left-3 text-[14px] font-medium text-white/55">
          lesson
        </div>
        <div className="absolute top-9 left-3 font-display text-[64px] leading-none text-white">
          {padded}
        </div>
        <div className="absolute bottom-2 left-0 right-0 px-2 opacity-70">
          <Sparkline
            values={session.confidenceArc}
            stroke="rgba(255,255,255,0.85)"
            fill="rgba(255,255,255,0.06)"
            width={204}
            height={36}
            className="w-full"
          />
        </div>
      </div>
      <div className="pt-2.5 px-0.5">
        <div className="text-[14px] font-medium text-[#191919] truncate">
          {fmtDate(session.date)}
        </div>
        <div className="text-[14px] text-[#6a7580] mt-0.5 line-clamp-1">
          {session.bestMomentLabel}
        </div>
      </div>
    </button>
  );
}
