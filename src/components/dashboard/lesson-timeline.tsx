import * as React from "react";
import { InnerCard } from "./card";
import type { LessonMetrics } from "@/lib/metrics";

const TAG: Record<string, { label: string; color: string; bg: string }> = {
  climbing: { label: "climbing", color: "#3DDABE", bg: "rgba(61,218,190,0.12)" },
  breakout: { label: "breakout", color: "#3DDABE", bg: "rgba(61,218,190,0.15)" },
  steady: { label: "steady", color: "#6a7580", bg: "rgba(106,117,128,0.08)" },
  slump: { label: "slump", color: "#FF7AAC", bg: "rgba(255,122,172,0.12)" },
  cooling: { label: "cooling", color: "#FF7AAC", bg: "rgba(255,122,172,0.12)" },
  productive: { label: "productive struggle", color: "#2885FD", bg: "rgba(40,133,253,0.12)" },
};

function classifyLesson(l: LessonMetrics, prev: LessonMetrics | null): keyof typeof TAG {
  if (!prev) return "steady";
  const talkDelta = l.talkRatioPct - prev.talkRatioPct;
  const wpmDelta = l.wpm - prev.wpm;
  const vocabDelta = l.vocab - prev.vocab;
  const fillerDelta = l.fillerPct - prev.fillerPct;
  // Breakout: meaningful gains on multiple signals
  if (wpmDelta > 10 && vocabDelta > 80) return "breakout";
  // Slump: several wrong-way at once
  if (talkDelta < -10 && fillerDelta > 2) return "slump";
  // Cooling: mild but consistent wrong-way
  if (talkDelta < -3 && wpmDelta < 0) return "cooling";
  // Productive struggle: talk down but clarity/speed up
  if (talkDelta < -10 && wpmDelta > 3) return "productive";
  if (wpmDelta > 3) return "climbing";
  return "steady";
}

export function LessonTimeline({ lessons }: { lessons: LessonMetrics[] }) {
  return (
    <InnerCard className="p-5">
      <div className="text-sm font-medium text-[#6a7580] mb-4">
        Lesson by lesson
      </div>
      <ol className="relative">
        {lessons.map((l, i) => {
          const prev = i > 0 ? lessons[i - 1] : null;
          const tagKey = classifyLesson(l, prev);
          const tag = TAG[tagKey];
          return (
            <li
              key={l.lesson}
              className="relative pl-8 pb-5 last:pb-0 border-l border-dashed border-black/10 last:border-transparent ml-3"
            >
              <span
                className="absolute -left-[7px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white"
                style={{ background: tag.color, boxShadow: `0 0 0 2px ${tag.bg}` }}
              />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-display text-base text-[#191919]">
                  Lesson {l.lesson}
                </span>
                <span
                  className="text-sm font-medium px-2 py-0.5 rounded-full"
                  style={{ color: tag.color, background: tag.bg }}
                >
                  {tag.label}
                </span>
                <span className="text-sm text-[#6a7580] ml-auto">
                  {l.durationMin.toFixed(0)} min · {l.talkRatioPct.toFixed(0)}% you · {l.wpm.toFixed(0)} WPM
                </span>
              </div>
              <p className="text-[15px] text-[#191919]/85 mt-2 leading-relaxed">{l.note}</p>
            </li>
          );
        })}
      </ol>
    </InnerCard>
  );
}
