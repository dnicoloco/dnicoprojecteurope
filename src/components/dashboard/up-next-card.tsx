import * as React from "react";
import { Button } from "@/components/ui/button";
import type { NextSession, UpNextHint } from "@/lib/metrics";
import { daysUntil } from "@/lib/metrics";

export function UpNextCard({
  hint,
  nextSession,
}: {
  hint: UpNextHint;
  nextSession: NextSession;
}) {
  const date = new Date(nextSession.scheduledAt);
  const weekday = date.toLocaleDateString("en-GB", { weekday: "short" });
  const day = date.getDate();
  const month = date.toLocaleDateString("en-GB", { month: "short" });
  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const days = daysUntil(nextSession.scheduledAt);
  const daysText =
    days === 0 ? "today" : days === 1 ? "tomorrow" : `in ${days} days`;
  const blurb =
    hint.prepItems.length > 0
      ? "A quick warm-up on the words and topics your tutor flagged last time keeps your momentum through the week."
      : "Keep momentum with a short warm-up before your next lesson.";

  return (
    <div className="rounded-[6px] bg-white border border-black/[0.06] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_20px_-10px_rgba(0,0,0,0.1)] p-5">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_320px] gap-6">
        {/* Left: simple copy + practice */}
        <div className="flex flex-col">
          <div className="text-[14px] font-medium tracking-[0.04em] text-[#FF7AAC]">
            Up next
          </div>
          <div className="font-display text-[22px] text-[#191919] leading-tight mt-1">
            Before your next lesson
          </div>
          <p className="text-[14px] text-[#191919]/80 mt-2 leading-relaxed max-w-md">
            {blurb}
          </p>
          <div className="mt-auto pt-5">
            <Button variant="primary" size="default">
              Start practice
            </Button>
          </div>
        </div>

        {/* Right: session tile + join/reschedule */}
        <div className="flex flex-col rounded-[6px] bg-[#FAF9F5] border border-black/[0.06] p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-[6px] bg-white border border-black/[0.08] flex flex-col items-center justify-center shrink-0">
              <div className="text-[14px] text-[#FF7AAC] font-semibold leading-none">
                {weekday.toLowerCase()}
              </div>
              <div className="font-display text-[22px] text-[#191919] leading-none mt-1">
                {day}
              </div>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="font-display text-[18px] text-[#191919] leading-none">
                {time}
              </div>
              <div className="text-[14px] text-[#6a7580] mt-1">
                {month} · {daysText}
              </div>
              <div className="text-[14px] text-[#6a7580] truncate">
                with {nextSession.tutor}
              </div>
            </div>
          </div>
          <div className="border-t border-black/[0.06] mt-4 pt-3 flex gap-2 justify-end">
            <Button variant="secondary" size="sm">
              Join
            </Button>
            <Button variant="secondary" size="sm">
              Reschedule
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
