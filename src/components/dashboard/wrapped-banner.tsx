import * as React from "react";
import { Play } from "lucide-react";
import type { SessionDetail, Topic } from "@/lib/metrics";

export function WrappedBanner({
  session,
  topic,
}: {
  session: SessionDetail;
  topic: Topic | undefined;
}) {
  const color = topic?.color ?? "#FF7AAC";
  return (
    <button
      className="group w-full text-left rounded-[6px] overflow-hidden relative cursor-pointer transition-transform hover:-translate-y-0.5"
      style={{
        background: `linear-gradient(100deg, ${color}30 0%, #191919 55%, #191919 100%)`,
      }}
    >
      <div className="flex items-center gap-4 p-4">
        <div
          className="w-14 h-14 rounded-[6px] flex items-center justify-center shrink-0"
          style={{ background: `${color}33` }}
        >
          <div
            className="w-6 h-6 rounded-full"
            style={{ background: color }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium text-white/60">
            Your wrapped · Lesson {session.lesson}
          </div>
          <div className="font-display text-[20px] text-white leading-tight mt-0.5">
            {session.bestMomentLabel}
          </div>
          <div className="text-[14px] text-white/70 mt-0.5">
            Tap to replay the highlights
          </div>
        </div>
        <div className="shrink-0 w-10 h-10 rounded-full bg-white text-[#191919] flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
          <Play size={16} className="fill-[#191919] ml-0.5" />
        </div>
      </div>
    </button>
  );
}
