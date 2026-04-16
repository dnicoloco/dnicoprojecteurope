"use client";

import * as React from "react";
import { Gravity, MatterBody, type GravityRef } from "@/components/ui/gravity";

type VocabPill = {
  word: string;
  firstLesson: number;
  firstLessonDate: string;
  context: string;
  totalNew: number;
};

const DATA: Record<string, VocabPill[]> = {
  marta: [
    { word: "disruptions",  firstLesson: 3, firstLessonDate: "8 Apr", context: "…there are a lot of notifications, a lot of disruptions that we can encounter.", totalNew: 639 },
    { word: "conscious",    firstLesson: 3, firstLessonDate: "8 Apr", context: "…it would be great if we were more conscious about it.", totalNew: 639 },
    { word: "eliminate",    firstLesson: 3, firstLessonDate: "8 Apr", context: "If I could eliminate 40% of this type of information, I think it was a great choice.", totalNew: 639 },
    { word: "productivity", firstLesson: 3, firstLessonDate: "8 Apr", context: "Yes, that's all productivity.", totalNew: 639 },
    { word: "unnecessary",  firstLesson: 3, firstLessonDate: "8 Apr", context: "The world creates a lot of information that is unnecessary to our lives.", totalNew: 639 },
    { word: "encounter",    firstLesson: 3, firstLessonDate: "8 Apr", context: "…disruptions that we can encounter.", totalNew: 639 },
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

// Shared box-shadow strings so hover swaps are stable.
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

// Pastel, mainly inside the pill: a soft inset pink bloom with just a hair of
// outer ring + glow.
const HOVER_SHADOW = [
  "0 0 0 0.5px rgba(255,190,215,0.55)",
  "0 0 6px rgba(255,200,220,0.25)",
  "inset 0 0 16px rgba(255,180,210,0.7)",
  "inset 0 0 6px rgba(255,210,225,0.9)",
  "inset 0 1.5px 1px rgba(255,255,255,0.95)",
  "inset 0 -1.5px 1px rgba(255,255,255,0.95)",
  "inset 0 4px 4px -2px rgba(15,23,42,0.04)",
  "inset 0 -3px 4px -2px rgba(15,23,42,0.06)",
].join(", ");

const GLASS_STYLE: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.01)",
  boxShadow: GLASS_SHADOW,
};

const GLASS_TEXT: React.CSSProperties = {
  background: "linear-gradient(#020617, #64748b)",
  color: "transparent",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

// Drop positions — scattered near the top so pills fall and bounce in.
const POSITIONS: Array<{ x: string; y: string; angle: number }> = [
  { x: "22%", y: "4%",  angle: -6 },
  { x: "58%", y: "2%",  angle: 8 },
  { x: "38%", y: "14%", angle: -3 },
  { x: "68%", y: "12%", angle: 5 },
  { x: "28%", y: "26%", angle: -10 },
  { x: "62%", y: "24%", angle: 3 },
];

export function VocabPills({ studentKey }: { studentKey: string }) {
  const pills = DATA[studentKey] ?? [];
  const [selected, setSelected] = React.useState<VocabPill | null>(null);
  const gravityRef = React.useRef<GravityRef | null>(null);

  // Tap/double-tap/drag detection + hover glow. All via window listeners so
  // matter-js still gets pointer events for drag (pill wrapper is pointer-
  // events-none).
  React.useEffect(() => {
    let downPos: { x: number; y: number; t: number } | null = null;
    let lastClick: { x: number; y: number; t: number; el: HTMLElement } | null =
      null;
    let singleClickTimer: ReturnType<typeof setTimeout> | null = null;
    const DOUBLE_MS = 280;

    const hitTestPill = (x: number, y: number): HTMLElement | null => {
      const els = document.querySelectorAll<HTMLElement>("[data-vocab-pill]");
      for (const el of els) {
        const textEl = el.querySelector<HTMLElement>("[data-pill-text]");
        const target = textEl ?? el;
        const r = target.getBoundingClientRect();
        if (
          x >= r.left &&
          x <= r.right &&
          y >= r.top &&
          y <= r.bottom
        ) {
          return el;
        }
      }
      return null;
    };

    const onDown = (e: MouseEvent) => {
      downPos = { x: e.clientX, y: e.clientY, t: Date.now() };
    };
    const onUp = (e: MouseEvent) => {
      if (!downPos) return;
      const dx = e.clientX - downPos.x;
      const dy = e.clientY - downPos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const dur = Date.now() - downPos.t;
      downPos = null;
      if (dist > 6 || dur > 400) return; // drag/hold, not a click

      const pillEl = hitTestPill(e.clientX, e.clientY);
      if (!pillEl) {
        lastClick = null;
        if (singleClickTimer) {
          clearTimeout(singleClickTimer);
          singleClickTimer = null;
        }
        return;
      }

      const now = Date.now();
      if (
        lastClick &&
        lastClick.el === pillEl &&
        now - lastClick.t < DOUBLE_MS
      ) {
        // Double click -> straighten this pill, suppress the queued single click.
        if (singleClickTimer) {
          clearTimeout(singleClickTimer);
          singleClickTimer = null;
        }
        lastClick = null;
        gravityRef.current?.resetElementAngle(pillEl);
        return;
      }

      // First click on this pill -> defer modal open so a double click can
      // cancel it.
      lastClick = { x: e.clientX, y: e.clientY, t: now, el: pillEl };
      if (singleClickTimer) clearTimeout(singleClickTimer);
      singleClickTimer = setTimeout(() => {
        singleClickTimer = null;
        const word = pillEl.getAttribute("data-vocab-pill");
        const p = pills.find((x) => x.word === word);
        if (p) setSelected(p);
      }, DOUBLE_MS);
    };
    let hoveredEl: HTMLElement | null = null;
    const onMove = (e: MouseEvent) => {
      const els = document.querySelectorAll<HTMLElement>("[data-vocab-pill]");
      let next: HTMLElement | null = null;
      for (const el of els) {
        // Hit-test the INNER text span, not the whole pill container, so the
        // glow only fires when cursor is over the actual letters.
        const textEl = el.querySelector<HTMLElement>("[data-pill-text]");
        const target = textEl ?? el;
        const r = target.getBoundingClientRect();
        if (
          e.clientX >= r.left &&
          e.clientX <= r.right &&
          e.clientY >= r.top &&
          e.clientY <= r.bottom
        ) {
          next = el;
          break;
        }
      }
      if (next !== hoveredEl) {
        if (hoveredEl) hoveredEl.style.boxShadow = GLASS_SHADOW;
        if (next) next.style.boxShadow = HOVER_SHADOW;
        hoveredEl = next;
      }
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("mousemove", onMove);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("mousemove", onMove);
      if (hoveredEl) hoveredEl.style.boxShadow = GLASS_SHADOW;
      if (singleClickTimer) clearTimeout(singleClickTimer);
    };
  }, [pills]);

  if (pills.length === 0) return null;

  return (
    <>
      <div className="relative w-full h-full overflow-hidden rounded-[6px]">
        <Gravity
          ref={gravityRef}
          gravity={{ x: 0, y: 0.9 }}
          addTopWall
          className="w-full h-full"
        >
          {pills.map((p, i) => {
            const pos = POSITIONS[i % POSITIONS.length];
            return (
              <MatterBody
                key={p.word}
                x={pos.x}
                y={pos.y}
                angle={pos.angle}
                matterBodyOptions={{
                  friction: 0.6,
                  frictionAir: 0.06,
                  restitution: 0.15,
                  density: 0.002,
                  slop: 0.04,
                }}
              >
                <div
                  data-vocab-pill={p.word}
                  className="rounded-full px-5 py-2 backdrop-blur-[16px] text-[15px] font-medium select-none hover:cursor-grab transition-[box-shadow] duration-200"
                  style={GLASS_STYLE}
                >
                  <span data-pill-text style={GLASS_TEXT}>
                    {p.word}
                  </span>
                </div>
              </MatterBody>
            );
          })}
        </Gravity>
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm"
          onClick={() => setSelected(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-md w-full rounded-[6px] bg-white border border-[rgba(25,25,25,0.08)] p-6"
          >
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="absolute top-3 right-3 text-[#6a7580] hover:text-[#191919] text-sm cursor-pointer"
              aria-label="Close"
            >
              ✕
            </button>
            <div className="text-[11px] uppercase tracking-[0.08em] text-[#64748b] font-semibold">
              First said
            </div>
            <div className="font-display text-[32px] text-[#191919] leading-none mt-1">
              {selected.word}
            </div>
            <div className="text-[13px] text-[#64748b] mt-2">
              Lesson {selected.firstLesson} · {selected.firstLessonDate}
            </div>
            <blockquote className="mt-4 text-[14px] text-[#191919] italic leading-relaxed border-l-2 border-[#FF7AAC]/40 pl-3">
              &ldquo;{selected.context}&rdquo;
            </blockquote>
            <div className="mt-5 rounded-[6px] bg-[#FAFAFA] border border-[rgba(25,25,25,0.06)] p-3">
              <div className="text-[11px] uppercase tracking-[0.08em] text-[#64748b] font-semibold">
                Your vocabulary
              </div>
              <div className="font-display text-[20px] text-[#191919] mt-0.5">
                {selected.totalNew} unique words
              </div>
              <div className="text-[12px] text-[#64748b] mt-0.5">
                this many you&apos;ve actually spoken across your lessons.
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
