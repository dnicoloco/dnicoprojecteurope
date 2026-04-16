import * as React from "react";
import { Button } from "@/components/ui/button";
import type { StudentProgress } from "@/lib/metrics";

export function BookNextCard({ student }: { student: StudentProgress }) {
  const cooling = student.trajectory === "cooling";
  const headline = cooling
    ? "Your momentum is slipping — book one now to keep your pace."
    : "Keep the streak going. Find a slot this week.";
  const body = cooling
    ? "Students who let cadence slip tend to plateau. A quick 30-minute session resets the clock."
    : "Regular cadence is the single biggest predictor of fluency gains. Short and frequent beats long and sparse.";

  return (
    <div className="rounded-[6px] bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-10px_rgba(0,0,0,0.1)] p-5">
      <div className="text-[14px] font-medium tracking-[0.04em] text-[#FF7AAC]">
        Book your next lesson
      </div>
      <h3 className="font-display text-[22px] text-[#191919] leading-tight mt-1 max-w-xl">
        {headline}
      </h3>
      <p className="text-[14px] text-[#191919]/80 mt-2 leading-relaxed max-w-xl">
        {body}
      </p>
      <div className="flex flex-wrap gap-2 mt-5">
        <Button variant="primary" size="sm">
          Find a slot with {student.tutor}
        </Button>
        <Button variant="ghost" size="sm">
          Try another tutor
        </Button>
      </div>
    </div>
  );
}
