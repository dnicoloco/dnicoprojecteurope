"use client";

import * as React from "react";
import {
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Grainient } from "@/components/ui/grainient";
import { SparklesText } from "@/components/ui/sparkles-text";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";
import { AnimatedUnderlineText } from "@/components/ui/animated-underline-text";
import { CycleGradientText } from "@/components/ui/cycle-gradient-text";
import { LessonFullView } from "@/components/dashboard/lesson-full-view";
import type { SessionDetail, StudentProgress, Topic } from "@/lib/metrics";

const GLASS_STYLE: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.01)",
  boxShadow: [
    "0 0 0 0.5px rgba(15,23,42,0.12)",
    "0 1px 1px -0.5px rgba(15,23,42,0.06)",
    "0 2px 2px -1px rgba(15,23,42,0.06)",
    "0 4px 4px -2px rgba(15,23,42,0.06)",
    "inset 0 1.5px 1px rgba(255,255,255,0.9)",
    "inset 0 -1.5px 1px rgba(255,255,255,0.9)",
    "inset 0 6px 6px -3px rgba(15,23,42,0.08)",
    "inset 0 -4px 4px -2px rgba(15,23,42,0.1)",
  ].join(", "),
};


// Pastel-toned Grainient palettes per slide. Emotion-mapped: positive = mint/sky,
// neutral = lavender/periwinkle, moment = blush.
const GRAIN_PALETTES: Record<string, [string, string, string]> = {
  lavender: ["#E8DFFF", "#C4B0F0", "#A78BDB"],
  sky: ["#D6ECFF", "#A8D4FF", "#7AB8F0"],
  mint: ["#D1F5E0", "#9FE5BE", "#6DCFA0"],
  blush: ["#FFE5E0", "#FFCDC6", "#F0AEA5"],
  periwinkle: ["#D4DEFF", "#A8BAFF", "#8099F0"],
};

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}
function pctChange(first: number, last: number): number {
  if (!first) return 0;
  return Math.round(((last - first) / first) * 100);
}

// ------------------------------------------------------------
// Grainient background layer — absolutely positioned, subtle.
// ------------------------------------------------------------
function GrainientBackdrop({
  palette,
  opacity = 0.7,
  variant = 0,
}: {
  palette: keyof typeof GRAIN_PALETTES;
  opacity?: number;
  variant?: number;
}) {
  const [c1, c2, c3] = GRAIN_PALETTES[palette];
  // Vary warp/zoom/angle per slide so each feels distinct
  const variants = [
    { warpStrength: 1.2, warpFrequency: 4.0, warpAmplitude: 60, blendAngle: 0, rotationAmount: 200, zoom: 0.95 },
    { warpStrength: 1.6, warpFrequency: 3.2, warpAmplitude: 80, blendAngle: 35, rotationAmount: 320, zoom: 1.05 },
    { warpStrength: 0.9, warpFrequency: 5.5, warpAmplitude: 50, blendAngle: -20, rotationAmount: 140, zoom: 1.15 },
    { warpStrength: 1.8, warpFrequency: 2.5, warpAmplitude: 95, blendAngle: 60, rotationAmount: 420, zoom: 0.9 },
    { warpStrength: 1.1, warpFrequency: 4.5, warpAmplitude: 70, blendAngle: -45, rotationAmount: 260, zoom: 1.1 },
  ];
  const v = variants[variant % variants.length];
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      aria-hidden
      style={{ opacity }}
    >
      <Grainient
        color1={c1}
        color2={c2}
        color3={c3}
        timeSpeed={0.22}
        warpStrength={v.warpStrength}
        warpFrequency={v.warpFrequency}
        warpSpeed={1.6}
        warpAmplitude={v.warpAmplitude}
        blendAngle={v.blendAngle}
        blendSoftness={0.12}
        rotationAmount={v.rotationAmount}
        noiseScale={1.8}
        grainAmount={0.18}
        grainScale={1.8}
        grainAnimated
        contrast={1.25}
        saturation={1.15}
        zoom={v.zoom}
      />
    </div>
  );
}

// ------------------------------------------------------------
// Slide types
// ------------------------------------------------------------
type SlideData =
  | {
      kind: "headline";
      lessonNumber: number;
      date: string;
      tutor?: string;
      durationMin: number;
      palette: keyof typeof GRAIN_PALETTES;
    }
  | {
      kind: "stat";
      bigValue: string;
      bigUnit?: string;
      caption: string;
      trend: { pct: number; fromLabel: string };
      palette: keyof typeof GRAIN_PALETTES;
    }
  | {
      kind: "moment";
      label: string;
      palette: keyof typeof GRAIN_PALETTES;
    };

// ============================================================
// WrappedModal
// ============================================================
export function WrappedModal({
  open,
  onClose,
  session,
  student,
  topic,
  personaStudentKey,
}: {
  open: boolean;
  onClose: () => void;
  session: SessionDetail | null;
  student: StudentProgress;
  topic: Topic | undefined;
  personaStudentKey: string | undefined;
}) {
  const [phase, setPhase] = React.useState<"slides" | "fullscreen">("slides");
  const [slideIdx, setSlideIdx] = React.useState(0);
  const [hasSeenBefore, setHasSeenBefore] = React.useState(false);

  // Suppress unused warning on topic prop — reserved for per-topic colour tints.
  void topic;

  // Reset phase/idx when a new session opens + look up "seen before".
  React.useEffect(() => {
    if (!open || !session) return;
    setPhase("slides");
    setSlideIdx(0);
    try {
      const seen = localStorage.getItem(`wrapped:seen:L${session.lesson}`);
      setHasSeenBefore(!!seen);
    } catch {
      setHasSeenBefore(false);
    }
  }, [open, session]);

  // Mark seen once the user reaches the fullscreen phase.
  React.useEffect(() => {
    if (phase !== "fullscreen" || !session) return;
    try {
      localStorage.setItem(`wrapped:seen:L${session.lesson}`, "1");
    } catch {
      // ignore
    }
  }, [phase, session]);

  // Escape + scroll lock + arrow keys
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (phase === "slides") {
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
      }
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase, slideIdx]);

  if (!open || !session) return null;

  const current = student.lessons.find((l) => l.lesson === session.lesson);
  const first = student.lessons[0];

  const slides: SlideData[] = [];
  slides.push({
    kind: "headline",
    lessonNumber: session.lesson,
    date: session.date,
    tutor: student.tutor,
    durationMin: current?.durationMin ?? 0,
    palette: "lavender",
  });
  if (current && first) {
    const talkTrend = pctChange(first.talkRatioPct, current.talkRatioPct);
    slides.push({
      kind: "stat",
      bigValue: `${Math.round(current.talkRatioPct)}`,
      bigUnit: "%",
      caption: `of the lesson was you talking — ${current.talkRatioPct > 55 ? "you drove the conversation" : "your tutor led this one"}`,
      trend: {
        pct: talkTrend,
        fromLabel: `from ${Math.round(first.talkRatioPct)}% in lesson 1`,
      },
      palette: talkTrend >= 0 ? "mint" : "blush",
    });
    const wpmTrend = pctChange(first.wpm, current.wpm);
    slides.push({
      kind: "stat",
      bigValue: `${Math.round(current.wpm)}`,
      caption: `words per minute — ${current.wpm > 60 ? "you're getting into a flow" : current.wpm > 45 ? "steady and building speed" : "taking your time, that's okay"}`,
      trend: {
        pct: wpmTrend,
        fromLabel: `from ${Math.round(first.wpm)} wpm in lesson 1`,
      },
      palette: wpmTrend >= 0 ? "sky" : "blush",
    });
    const vocabTrend = pctChange(first.vocab, current.vocab);
    slides.push({
      kind: "stat",
      bigValue: `${current.vocab}`,
      caption: `different words you used — ${current.vocab > 500 ? "your vocabulary is expanding fast" : current.vocab > 300 ? "a growing word bank" : "every new word counts"}`,
      trend: {
        pct: vocabTrend,
        fromLabel: `from ${first.vocab} words in lesson 1`,
      },
      palette: vocabTrend >= 0 ? "periwinkle" : "blush",
    });
  }
  slides.push({
    kind: "moment",
    label: session.bestMomentLabel,
    palette: "lavender",
  });

  const atLast = slideIdx >= slides.length - 1;

  function next() {
    if (phase === "fullscreen") return;
    if (atLast) {
      setPhase("fullscreen");
      return;
    }
    setSlideIdx((i) => Math.min(i + 1, slides.length - 1));
  }
  function prev() {
    if (phase === "fullscreen") {
      setPhase("slides");
      return;
    }
    setSlideIdx((i) => Math.max(0, i - 1));
  }

  // Container morphs from centered modal (slides) to full-screen (fullscreen lesson).
  const isFullscreen = phase === "fullscreen";

  return (
    <div
      className={cn(
        "fixed z-50 transition-colors duration-500",
        isFullscreen
          ? "inset-0 top-[104px] bg-white"
          : "inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4",
      )}
      onClick={isFullscreen ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className={cn(
          "overflow-hidden flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          isFullscreen
            ? "w-full h-full rounded-none shadow-none bg-white"
            : "relative w-full max-w-[640px] h-[min(92vh,860px)] rounded-[16px] shadow-[0_20px_60px_rgba(0,0,0,0.4)]",
        )}
      >
        {isFullscreen ? (
          <LessonFullView
            lessonNumber={session.lesson}
            student={student}
            personaStudentKey={personaStudentKey}
            onBack={() => setPhase("slides")}
          />
        ) : (
          <>
            {/* Grainient fills the ENTIRE modal — behind dots + content + buttons */}
            <GrainientBackdrop
              palette={slides[slideIdx].palette}
              opacity={0.85}
              variant={slideIdx}
            />

            {/* Dot indicators — small circles at top, on the gradient */}
            <div className="flex items-center justify-center gap-2 pt-5 pb-2 relative z-[2]">
              {slides.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-colors",
                    i === slideIdx ? "bg-white" : "bg-white/30",
                  )}
                />
              ))}
            </div>

            {/* Close button top-right */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="absolute top-4 right-4 z-[3] w-8 h-8 inline-flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 cursor-pointer"
            >
              <X size={16} />
            </button>

            {/* Slide body */}
            <SlideView slide={slides[slideIdx]} studentName={student.name} slideIdx={slideIdx} />

            {/* Back / Next — simple text on gradient, no bar */}
            <div className="flex items-center justify-between px-5 pb-5 pt-2 relative z-[2]">
              <button
                type="button"
                onClick={prev}
                disabled={slideIdx === 0}
                className="inline-flex items-center gap-1 text-[13px] text-white/50 hover:text-white disabled:opacity-0 disabled:pointer-events-none cursor-pointer transition-opacity"
              >
                <ChevronLeft size={14} /> Back
              </button>
              {hasSeenBefore && slideIdx === 0 && (
                <button
                  type="button"
                  onClick={() => setPhase("fullscreen")}
                  className="text-[12px] text-white/40 hover:text-white underline underline-offset-4 decoration-dotted cursor-pointer"
                >
                  Skip to lesson
                </button>
              )}
              <button
                type="button"
                onClick={next}
                className="inline-flex items-center gap-1 text-[13px] text-white/70 hover:text-white cursor-pointer"
              >
                {atLast ? "Read the whole lesson" : "Next"}
                <ChevronRight size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Slide view — each slide uses a different typography component +
// a grainy vibrant Grainient backdrop (variant per slide).
// ============================================================
function SlideView({
  slide,
  studentName,
  slideIdx,
}: {
  slide: SlideData;
  studentName: string;
  slideIdx: number;
}) {
  if (slide.kind === "headline") {
    const padded = String(slide.lessonNumber).padStart(2, "0");
    return (
      <div
        key={`headline-${slideIdx}`}
        className="flex-1 relative flex flex-col items-center justify-center text-center px-8 overflow-hidden"
      >
        <div className="relative z-[1] flex flex-col items-center">
          <div className="text-[12px] uppercase tracking-[0.14em] text-[#6a7580] font-medium">
            <VerticalCutReveal splitBy="characters" staggerDuration={0.02} staggerFrom="first">
              Lesson wrapped
            </VerticalCutReveal>
          </div>

          {/* Big "03" — SparklesText for magic on first impression */}
          <SparklesText
            text={padded}
            className="mt-4 text-[148px] leading-none text-[#191919]"
            colors={{ first: GRAIN_PALETTES[slide.palette][1], second: GRAIN_PALETTES[slide.palette][2] }}
            sparklesCount={18}
          />

          <div className="mt-5 text-[15px] text-[#6a7580]">
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.04}
              staggerFrom="first"
              transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.2 }}
            >
              {`${fmtDate(slide.date)}${slide.durationMin > 0 ? ` · ${Math.round(slide.durationMin)} min` : ""}${slide.tutor ? ` · with ${slide.tutor}` : ""}`}
            </VerticalCutReveal>
          </div>
          <div className="mt-6 text-[16px] text-[#191919] max-w-[340px]">
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.05}
              staggerFrom="first"
              transition={{ type: "spring", stiffness: 190, damping: 22, delay: 0.5 }}
            >
              {`Hey ${studentName}, here's how this one landed.`}
            </VerticalCutReveal>
          </div>
        </div>
      </div>
    );
  }

  if (slide.kind === "stat") {
    const up = slide.trend.pct >= 0;
    const Arrow = up ? ArrowUp : ArrowDown;

    // Alternate two stat-slide layouts
    const isOdd = slideIdx % 2 === 1;

    return (
      <div
        key={`stat-${slideIdx}`}
        className={cn(
          "flex-1 relative flex flex-col items-center px-8 overflow-hidden",
          isOdd ? "justify-center text-center" : "justify-center text-center",
        )}
      >
        <div className="relative z-[1] flex flex-col items-center">
          {/* Caption-first layout (odd slides) uses animated-underline for a different visual rhythm */}
          {isOdd ? (
            <>
              <div className="text-[#191919]">
                <AnimatedUnderlineText
                  text={slide.caption}
                  textClassName="text-[22px] leading-snug max-w-[380px]"
                  underlineClassName="text-[#FF7AAC]"
                />
              </div>
              <div
                className="mt-8 px-10 py-5 rounded-[20px] backdrop-blur-[10px] relative overflow-hidden"
                style={GLASS_STYLE}
              >
                <div className="absolute inset-0 opacity-75 pointer-events-none">
                  <Grainient
                    color1={GRAIN_PALETTES[slide.palette][0]}
                    color2={GRAIN_PALETTES[slide.palette][1]}
                    color3={GRAIN_PALETTES[slide.palette][2]}
                    timeSpeed={0.2}
                    warpStrength={1.4}
                    warpAmplitude={70}
                    grainAmount={0.2}
                    grainScale={1.6}
                    grainAnimated
                    contrast={1.3}
                    saturation={1.2}
                    zoom={1.15}
                  />
                </div>
                <div
                  className="relative font-display text-[118px] leading-none text-[#191919]"
                  style={{ fontWeight: 500 }}
                >
                  <VerticalCutReveal
                    splitBy="characters"
                    staggerDuration={0.04}
                    staggerFrom="center"
                    transition={{ type: "spring", stiffness: 220, damping: 20 }}
                  >
                    {`${slide.bigValue}${slide.bigUnit ?? ""}`}
                  </VerticalCutReveal>
                </div>
              </div>
            </>
          ) : (
            <>
              <div
                className="px-12 py-7 rounded-[22px] backdrop-blur-[10px] relative overflow-hidden"
                style={GLASS_STYLE}
              >
                <div className="absolute inset-0 opacity-80 pointer-events-none">
                  <Grainient
                    color1={GRAIN_PALETTES[slide.palette][0]}
                    color2={GRAIN_PALETTES[slide.palette][1]}
                    color3={GRAIN_PALETTES[slide.palette][2]}
                    timeSpeed={0.25}
                    warpStrength={1.8}
                    warpAmplitude={90}
                    grainAmount={0.22}
                    grainScale={1.5}
                    grainAnimated
                    contrast={1.35}
                    saturation={1.25}
                    zoom={1.1}
                  />
                </div>
                <div
                  className="relative font-display text-[124px] leading-none text-[#191919]"
                  style={{ fontWeight: 500 }}
                >
                  <VerticalCutReveal
                    splitBy="characters"
                    staggerDuration={0.05}
                    staggerFrom="last"
                    transition={{ type: "spring", stiffness: 220, damping: 20 }}
                  >
                    {`${slide.bigValue}${slide.bigUnit ?? ""}`}
                  </VerticalCutReveal>
                </div>
              </div>
              <div className="mt-5 text-[18px] text-[#191919] max-w-[380px]">
                <VerticalCutReveal
                  splitBy="words"
                  staggerDuration={0.04}
                  staggerFrom="first"
                  transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.3 }}
                >
                  {slide.caption}
                </VerticalCutReveal>
              </div>
            </>
          )}

          <div className="mt-6 inline-flex items-center gap-1.5 text-[13px] text-[#191919] bg-white/85 backdrop-blur-sm border border-black/[0.08] rounded-full px-4 py-1.5">
            <Arrow
              size={13}
              strokeWidth={2.5}
              className={up ? "text-[#FF7AAC]" : "text-[#6a7580]"}
            />
            <span className="font-medium">{Math.abs(slide.trend.pct)}%</span>
            <span className="text-[#6a7580]">· {slide.trend.fromLabel}</span>
          </div>
        </div>
      </div>
    );
  }

  // moment — climax slide uses CycleGradientText accent + sparkles
  return (
    <div
      key={`moment-${slideIdx}`}
      className="flex-1 relative flex flex-col items-center justify-center text-center px-8 overflow-hidden"
    >
      <GrainientBackdrop palette={slide.palette} opacity={0.8} variant={slideIdx} />
      <div className="relative z-[1] flex flex-col items-center max-w-[440px]">
        <CycleGradientText
          words={["Moment.", "Of the.", "Lesson."]}
          className="text-[20px] md:text-[22px]"
        />
        <div
          className="mt-4 px-7 py-6 rounded-[20px] backdrop-blur-[10px] relative overflow-hidden"
          style={GLASS_STYLE}
        >
          <div className="absolute inset-0 opacity-75 pointer-events-none">
            <Grainient
              color1={GRAIN_PALETTES[slide.palette][0]}
              color2={GRAIN_PALETTES[slide.palette][1]}
              color3={GRAIN_PALETTES[slide.palette][2]}
              timeSpeed={0.25}
              warpStrength={1.6}
              warpAmplitude={75}
              grainAmount={0.2}
              grainScale={1.7}
              grainAnimated
              contrast={1.3}
              saturation={1.2}
              zoom={1.2}
            />
          </div>
          <p
            className="relative font-display text-[24px] leading-tight text-[#191919]"
            style={{ fontWeight: 500 }}
          >
            <VerticalCutReveal
              splitBy="words"
              staggerDuration={0.04}
              staggerFrom="first"
              transition={{ type: "spring", stiffness: 190, damping: 22 }}
            >
              {`"${slide.label}"`}
            </VerticalCutReveal>
          </p>
        </div>
      </div>
    </div>
  );
}

