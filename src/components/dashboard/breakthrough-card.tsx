import * as React from "react";
import type { BreakthroughItem } from "@/lib/metrics";
import { getStudentById } from "@/lib/metrics";

export function BreakthroughCard({
  item,
  onClick,
}: {
  item: BreakthroughItem;
  onClick?: (studentId: string) => void;
}) {
  const student = getStudentById(item.studentId);
  const initial = (student?.name ?? item.studentId)[0].toUpperCase();

  return (
    <button
      onClick={() => onClick?.(item.studentId)}
      className="group shrink-0 w-[200px] text-left bg-white rounded-[6px] border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-8px_rgba(0,0,0,0.1)] hover:border-black/[0.15] hover:shadow-[0_3px_6px_rgba(0,0,0,0.07),0_14px_24px_-10px_rgba(0,0,0,0.16)] hover:-translate-y-0.5 duration-200 cursor-pointer overflow-hidden"
    >
      <div
        className="relative aspect-square w-full overflow-hidden"
        style={{ background: "#1a1a1d" }}
      >
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at top left, rgba(255,122,172,0.45) 0%, transparent 55%)",
          }}
        />
        <div className="absolute top-3 left-3 text-[14px] font-medium text-white/55">
          breakthrough
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-[72px] leading-none text-white">
            {initial}
          </span>
        </div>
        {student && (
          <span className="absolute bottom-3 right-3 text-[14px] text-white/70 px-1.5 py-0.5 bg-white/10 rounded-[6px]">
            {student.level}
          </span>
        )}
        <span className="absolute bottom-3 left-3 text-[14px] font-medium text-white/80">
          {item.short}
        </span>
      </div>
      <div className="p-3">
        <div className="text-[14px] font-semibold text-[#191919] leading-snug line-clamp-1">
          {student?.name ?? item.studentId}
        </div>
        <div className="text-[14px] text-[#6a7580] mt-0.5 line-clamp-1">
          {item.headline}
        </div>
      </div>
    </button>
  );
}
