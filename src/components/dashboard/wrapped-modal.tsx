"use client";

import * as React from "react";
import {
  X,
  Volume2,
  Pause,
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
import {
  getLessonTranscript,
  type LessonUtterance,
} from "@/lib/db";
import type { SessionDetail, StudentProgress, Topic } from "@/lib/metrics";

const TTS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tts`;

// Glassy inner panel style (reused in bubbles + slide accents).
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

const GLASS_TEXT: React.CSSProperties = {
  background: "linear-gradient(#020617, #64748b)",
  color: "transparent",
  backgroundClip: "text",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
};

// Vibrant Grainient palettes per slide tone — richer than pastel, grainier feel.
const GRAIN_PALETTES: Record<string, [string, string, string]> = {
  pink: ["#FFB6D9", "#FF7AAC", "#9E7AFF"],
  peach: ["#FFD0B8", "#FF9570", "#FF6B9D"],
  sky: ["#A8D8FF", "#5FA8FD", "#3D7CC9"],
  mint: ["#9FE5BE", "#3DDABE", "#2DA88F"],
  lilac: ["#D4BFF5", "#9E7AFF", "#5227FF"],
};

// ------------------------------------------------------------
// TTS hook
// ------------------------------------------------------------
function useClipPlayer() {
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const currentIdRef = React.useRef<string | null>(null);

  const stop = React.useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    currentIdRef.current = null;
    setPlayingId(null);
  }, []);

  const playOne = React.useCallback(
    async (id: string, text: string, speaker: "student" | "other") => {
      if (currentIdRef.current === id && audioRef.current) {
        const a = audioRef.current;
        if (a.paused) {
          await a.play();
          setPlayingId(id);
        } else {
          a.pause();
          setPlayingId(null);
        }
        return;
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
        currentIdRef.current = null;
      }
      setPlayingId(id);
      try {
        const resp = await fetch(TTS_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, speaker }),
        });
        if (!resp.ok) throw new Error(`TTS ${resp.status}`);
        const ct = resp.headers.get("content-type") ?? "";
        let src: string;
        let cleanup: (() => void) | null = null;
        if (ct.includes("application/json")) {
          const body = (await resp.json()) as { url?: string; error?: string };
          if (!body.url) throw new Error(body.error ?? "no url");
          src = body.url;
        } else {
          const blob = await resp.blob();
          const objectUrl = URL.createObjectURL(blob);
          src = objectUrl;
          cleanup = () => URL.revokeObjectURL(objectUrl);
        }
        const audio = new Audio(src);
        audio.playbackRate = 1.05;
        audioRef.current = audio;
        currentIdRef.current = id;
        audio.addEventListener("ended", () => {
          cleanup?.();
          setPlayingId(null);
          audioRef.current = null;
          currentIdRef.current = null;
        });
        audio.addEventListener("error", () => {
          cleanup?.();
          setPlayingId(null);
          audioRef.current = null;
          currentIdRef.current = null;
        });
        await audio.play();
      } catch (err) {
        console.error("clip tts", err);
        setPlayingId(null);
        currentIdRef.current = null;
      }
    },
    [],
  );

  React.useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  return { playingId, playOne, stop };
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
function fmtMMSS(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
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
  const { playingId, playOne, stop } = useClipPlayer();
  const [phase, setPhase] = React.useState<"slides" | "transcript">("slides");
  const [slideIdx, setSlideIdx] = React.useState(0);
  const [transcript, setTranscript] = React.useState<LessonUtterance[]>([]);
  const [loading, setLoading] = React.useState(false);
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

  // Mark seen once the user reaches the transcript phase.
  React.useEffect(() => {
    if (phase !== "transcript" || !session) return;
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
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, phase, slideIdx]);

  // Load transcript when modal opens
  React.useEffect(() => {
    if (!open || !session) return;
    let alive = true;
    setLoading(true);
    setTranscript([]);
    getLessonTranscript(personaStudentKey, session.lesson).then((tr) => {
      if (!alive) return;
      setTranscript(tr);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [open, session, personaStudentKey]);

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
    palette: "pink",
  });
  if (current && first) {
    slides.push({
      kind: "stat",
      bigValue: `${Math.round(current.talkRatioPct)}`,
      bigUnit: "%",
      caption: "of the lesson was you",
      trend: {
        pct: pctChange(first.talkRatioPct, current.talkRatioPct),
        fromLabel: `from ${Math.round(first.talkRatioPct)}% in lesson 1`,
      },
      palette: "peach",
    });
    slides.push({
      kind: "stat",
      bigValue: `${Math.round(current.wpm)}`,
      caption: "words a minute — your pace",
      trend: {
        pct: pctChange(first.wpm, current.wpm),
        fromLabel: `from ${Math.round(first.wpm)} in lesson 1`,
      },
      palette: "sky",
    });
    slides.push({
      kind: "stat",
      bigValue: `${current.vocab}`,
      caption: "unique words you used",
      trend: {
        pct: pctChange(first.vocab, current.vocab),
        fromLabel: `from ${first.vocab} in lesson 1`,
      },
      palette: "mint",
    });
  }
  slides.push({
    kind: "moment",
    label: session.bestMomentLabel,
    palette: "lilac",
  });

  const atLast = slideIdx >= slides.length - 1;

  function next() {
    if (phase === "transcript") return;
    if (atLast) {
      setPhase("transcript");
      return;
    }
    setSlideIdx((i) => Math.min(i + 1, slides.length - 1));
  }
  function prev() {
    if (phase === "transcript") {
      setPhase("slides");
      return;
    }
    setSlideIdx((i) => Math.max(0, i - 1));
  }

  // Phase-based width. Slides: tad wider than before. Transcript: roomier for chat.
  const widthClass =
    phase === "slides" ? "max-w-[560px]" : "max-w-[680px]";

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        className={cn(
          "relative w-full h-[min(88vh,780px)] rounded-[16px] bg-white overflow-hidden flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-[max-width] duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
          widthClass,
        )}
      >
        {/* Top: close + progress */}
        <div className="flex items-center gap-2 p-4 relative z-[2]">
          <div className="flex-1 flex items-center gap-1.5">
            {phase === "slides" ? (
              slides.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-colors",
                    i <= slideIdx ? "bg-[#191919]" : "bg-black/10",
                  )}
                />
              ))
            ) : (
              <div className="h-1 flex-1 rounded-full bg-[#191919]" />
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="w-8 h-8 inline-flex items-center justify-center rounded-full text-[#191919] hover:bg-black/5 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        {phase === "slides" ? (
          <SlideView slide={slides[slideIdx]} studentName={student.name} slideIdx={slideIdx} />
        ) : (
          <TranscriptView
            transcript={transcript}
            loading={loading}
            student={student}
            playingId={playingId}
            onPlay={playOne}
          />
        )}

        {/* Footer controls */}
        {phase === "slides" ? (
          <div className="flex items-center justify-between gap-3 p-4 border-t border-black/[0.06] bg-white relative z-[2]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={prev}
                disabled={slideIdx === 0}
                className="inline-flex items-center gap-1 text-[13px] text-[#6a7580] hover:text-[#191919] disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
              >
                <ChevronLeft size={14} /> Back
              </button>
              {hasSeenBefore && (
                <button
                  type="button"
                  onClick={() => setPhase("transcript")}
                  className="text-[12px] text-[#94a3b8] hover:text-[#191919] underline underline-offset-4 decoration-dotted cursor-pointer"
                >
                  Skip to full chat
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={next}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#191919] text-white text-[13px] font-medium hover:-translate-y-0.5 transition-transform cursor-pointer"
            >
              {atLast ? "Read the whole lesson" : "Next"}
              <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 p-4 border-t border-black/[0.06] bg-white relative z-[2]">
            <button
              type="button"
              onClick={prev}
              className="inline-flex items-center gap-1 text-[13px] text-[#6a7580] hover:text-[#191919] cursor-pointer"
            >
              <ChevronLeft size={14} /> Back to wrapped
            </button>
            <span className="text-[12px] text-[#94a3b8]">
              {transcript.length} lines · tap a bubble to play
            </span>
          </div>
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
        <GrainientBackdrop palette={slide.palette} opacity={0.7} variant={slideIdx} />
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
        <GrainientBackdrop palette={slide.palette} opacity={0.75} variant={slideIdx} />
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

// ============================================================
// Transcript view — glass-style bubbles matching the Next Learn dialogue.
// ============================================================
function TranscriptView({
  transcript,
  loading,
  student,
  playingId,
  onPlay,
}: {
  transcript: LessonUtterance[];
  loading: boolean;
  student: StudentProgress;
  playingId: string | null;
  onPlay: (id: string, text: string, speaker: "student" | "other") => void;
}) {
  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-[13px] text-[#6a7580]">
        Loading transcript…
      </div>
    );
  }
  if (transcript.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-[13px] text-[#6a7580]">
        No transcript available for this lesson.
      </div>
    );
  }
  return (
    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
      {transcript.map((u) => {
        const pid = `t-${u.id}`;
        const active = playingId === pid;
        const isStudent = u.speaker === "student";
        const authorName = isStudent ? student.name : student.tutor ?? "Tutor";
        if (isStudent) {
          return (
            <StudentBubble
              key={u.id}
              id={pid}
              text={u.text}
              authorName={authorName}
              tSec={Number(u.start_sec)}
              active={active}
              onPlay={() => onPlay(pid, u.text, "student")}
            />
          );
        }
        return (
          <TutorRow
            key={u.id}
            id={pid}
            text={u.text}
            authorName={authorName}
            tSec={Number(u.start_sec)}
            active={active}
            onPlay={() => onPlay(pid, u.text, "other")}
          />
        );
      })}
    </div>
  );
}

function PlayButton({
  active,
  onClick,
  size = 28,
}: {
  active: boolean;
  onClick: () => void;
  size?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={active ? "Pause" : "Play"}
      className={cn(
        "inline-flex items-center justify-center rounded-[6px] transition-colors shrink-0",
        "border border-[rgba(25,25,25,0.08)] bg-white hover:bg-[#FAFAFA] text-[#191919]",
        active && "bg-[#191919] text-white border-[#191919] hover:bg-[#191919]",
      )}
      style={{ width: size, height: size }}
    >
      {active ? <Pause size={13} /> : <Volume2 size={13} />}
    </button>
  );
}

function StudentBubble({
  id,
  text,
  authorName,
  tSec,
  active,
  onPlay,
}: {
  id: string;
  text: string;
  authorName: string;
  tSec: number;
  active: boolean;
  onPlay: () => void;
}) {
  void id;
  return (
    <div className="flex justify-end">
      <div className="flex flex-col items-end max-w-[85%]">
        <div className="flex items-baseline gap-2 mb-0.5 text-[11px] pr-1 flex-row-reverse">
          <span className="font-medium text-[#191919]">{authorName}</span>
          <span className="text-[#94a3b8] tabular-nums">{fmtMMSS(tSec)}</span>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="relative rounded-[14px] px-4 py-2 text-[14px] leading-snug backdrop-blur-[16px]"
            style={GLASS_STYLE}
          >
            <span style={GLASS_TEXT}>{text}</span>
          </div>
          <PlayButton active={active} onClick={onPlay} />
        </div>
      </div>
    </div>
  );
}

function TutorRow({
  id,
  text,
  authorName,
  tSec,
  active,
  onPlay,
}: {
  id: string;
  text: string;
  authorName: string;
  tSec: number;
  active: boolean;
  onPlay: () => void;
}) {
  void id;
  return (
    <div className="flex justify-start">
      <div className="flex flex-col items-start max-w-[85%]">
        <div className="flex items-baseline gap-2 mb-0.5 text-[11px] pl-1">
          <span className="font-medium text-[#191919]">{authorName}</span>
          <span className="text-[#94a3b8] tabular-nums">{fmtMMSS(tSec)}</span>
        </div>
        <div className="flex items-start gap-2">
          <PlayButton active={active} onClick={onPlay} />
          <p className="text-[14px] text-[#191919] leading-relaxed pt-0.5">
            {text}
          </p>
        </div>
      </div>
    </div>
  );
}
