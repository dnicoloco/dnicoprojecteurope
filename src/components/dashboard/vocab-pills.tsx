"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type VocabPill = {
  word: string;
  firstLesson: number;
  firstLessonDate: string;
  context: string;
  totalNew: number;
};

const DATA: Record<string, VocabPill[]> = {
  marta: [
    { word: "disruptions",  firstLesson: 3, firstLessonDate: "8 Apr", context: "...there are a lot of notifications, a lot of disruptions that we can encounter.", totalNew: 639 },
    { word: "conscious",    firstLesson: 3, firstLessonDate: "8 Apr", context: "...it would be great if we were more conscious about it.", totalNew: 639 },
    { word: "eliminate",    firstLesson: 3, firstLessonDate: "8 Apr", context: "If I could eliminate 40% of this type of information, I think it was a great choice.", totalNew: 639 },
    { word: "productivity", firstLesson: 3, firstLessonDate: "8 Apr", context: "Yes, that's all productivity.", totalNew: 639 },
    { word: "unnecessary",  firstLesson: 3, firstLessonDate: "8 Apr", context: "The world creates a lot of information that is unnecessary to our lives.", totalNew: 639 },
    { word: "encounter",    firstLesson: 3, firstLessonDate: "8 Apr", context: "...disruptions that we can encounter.", totalNew: 639 },
  ],
  tomas: [
    { word: "demanding",  firstLesson: 1, firstLessonDate: "5 Apr",  context: "We were not beaten but it was very, very demanding work.", totalNew: 778 },
    { word: "balance",    firstLesson: 2, firstLessonDate: "14 Apr", context: "A little amount of power just to balance the power on a kite.", totalNew: 663 },
    { word: "difficulty", firstLesson: 2, firstLessonDate: "14 Apr", context: "The only difficulty is that if you're doing too much speed you can't stop.", totalNew: 663 },
    { word: "engaged",    firstLesson: 1, firstLessonDate: "5 Apr",  context: "Poland was engaged in the Turkish war far east.", totalNew: 778 },
    { word: "positive",   firstLesson: 2, firstLessonDate: "14 Apr", context: "I'm not, like, positive whether this is the thing.", totalNew: 663 },
    { word: "rescue",     firstLesson: 1, firstLessonDate: "5 Apr",  context: "I had to call to rescue. No, it's a joke.", totalNew: 778 },
  ],
};

const GLASS_SHADOW = [
  "0 0 0 0.5px rgba(15,23,42,0.12)",
  "0 1px 1px -0.5px rgba(15,23,42,0.06)",
  "0 2px 2px -1px rgba(15,23,42,0.06)",
  "0 4px 4px -2px rgba(15,23,42,0.06)",
  "inset 0 1.5px 1px rgba(255,255,255,0.9)",
  "inset 0 -1.5px 1px rgba(255,255,255,0.9)",
  "inset 0 6px 6px -3px rgba(15,23,42,0.08)",
  "inset 0 -4px 4px -2px rgba(15,23,42,0.1)",
].join(", ");

const GLASS_TEXT: React.CSSProperties = {
  background: "linear-gradient(#020617, #64748b)",
  color: "transparent",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

export function VocabPills({ studentKey }: { studentKey: string }) {
  const pills = DATA[studentKey] ?? [];
  const [hovered, setHovered] = React.useState<VocabPill | null>(null);

  return (
    <div className="relative w-full rounded-[6px] pb-2 mt-6">
      <div className="text-[13px] font-medium text-[#6a7580] text-center mb-2">Recent new words</div>
      <div className="relative flex gap-2 justify-center">
        {/* Hover tooltip — floats above pills */}
        {hovered && (
          <div
            className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-[320px] rounded-[8px] p-3 backdrop-blur-[16px] text-[13px]"
            style={{ boxShadow: GLASS_SHADOW, background: "rgba(255,255,255,0.95)", zIndex: 99999, position: "absolute" }}
          >
            <div className="font-medium text-[#191919] mb-0.5">
              {hovered.word}
              <span className="text-[#6a7580] font-normal ml-2">
                first used lesson {hovered.firstLesson}
              </span>
            </div>
            <div className="text-[#6a7580] italic line-clamp-2">
              {hovered.context.split(hovered.word).map((part, i, arr) =>
                i < arr.length - 1 ? (
                  <React.Fragment key={i}>{part}<span className="text-[#FF7AAC] not-italic font-medium">{hovered.word}</span></React.Fragment>
                ) : (
                  <React.Fragment key={i}>{part}</React.Fragment>
                )
              )}
            </div>
          </div>
        )}
        {pills.slice(0, 3).map((p) => (
          <button
            key={p.word}
            onMouseEnter={() => setHovered(p)}
            onMouseLeave={() => setHovered(null)}
            className="px-4 py-2 rounded-full text-[15px] font-medium backdrop-blur-[16px] transition-shadow cursor-pointer"
            style={{
              boxShadow: GLASS_SHADOW,
              background: "rgba(15, 23, 42, 0.01)",
            }}
          >
            <span style={GLASS_TEXT}>{p.word}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
