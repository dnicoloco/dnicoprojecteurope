import * as React from "react";
import type { StudentProgress } from "@/lib/metrics";

export function RosterCard({ student }: { student: StudentProgress }) {
  const initial = student.name[0].toUpperCase();
  const glow =
    student.trajectory === "climbing"
      ? "rgba(255,122,172,0.28)"
      : "rgba(255,255,255,0.04)";
  return (
    <div className="shrink-0 w-[200px] bg-white rounded-[6px] border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-8px_rgba(0,0,0,0.1)] overflow-hidden">
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{ background: "#1a1a1d" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at top left, ${glow} 0%, transparent 55%)`,
          }}
        />
        <div className="absolute top-3 left-3 text-[14px] font-medium text-white/50">
          student
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[72px] leading-none text-white/90">
            {initial}
          </span>
        </div>
        <span className="absolute bottom-3 right-3 text-[14px] text-white/60 px-1.5 py-0.5 bg-white/10 rounded-[6px]">
          {student.level}
        </span>
        <span className="absolute bottom-3 left-3 text-[14px] font-medium text-white/70">
          {student.trajectory}
        </span>
      </div>
      <div className="p-3">
        <div className="text-[14px] font-semibold text-[#191919] leading-snug truncate">
          {student.name}
        </div>
        <div className="text-[14px] text-[#6a7580] mt-0.5 truncate">
          {student.streak}
        </div>
      </div>
    </div>
  );
}
