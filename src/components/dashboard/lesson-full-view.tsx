"use client";

import * as React from "react";
import { ArrowLeft, Volume2, Pause, ChevronDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getLessonTranscript,
  getLessonGrammarMap,
  type LessonUtterance,
  type UtteranceGrammar,
} from "@/lib/db";
import type { StudentProgress } from "@/lib/metrics";

const TTS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tts`;

// CEFR highlight colors — A1 grey, A2 faint blue, B1 weak pink, B2 Preply pink, C1/C2 green.
const CEFR_BG: Record<string, string> = {
  A1: "rgba(148,163,184,0.12)",
  A2: "rgba(40,133,253,0.12)",
  B1: "rgba(255,122,172,0.15)",
  B2: "rgba(255,122,172,0.28)",
  C1: "rgba(61,218,190,0.2)",
  C2: "rgba(61,218,190,0.35)",
};
const CEFR_TEXT: Record<string, string> = {
  A1: "#64748b",
  A2: "#2885FD",
  B1: "#e8649a",
  B2: "#d4447a",
  C1: "#2DA88F",
  C2: "#1a8a72",
};

// ============================================================
// Stutter cleanup — collapses repeated words for cleaner display.
// Tutor gets aggressive cleanup, student gets light cleanup.
// ============================================================
function cleanText(text: string, aggressive: boolean): string {
  let t = text;
  // Collapse 2+ consecutive identical words: "I I I" → "I"
  t = t.replace(/\b(\w+)(?:\s+\1){1,}/gi, "$1");
  // Collapse partial repeats: "it can it can" → "it can"
  t = t.replace(/\b((?:\w+\s+){1,3})(?:\1){1,}/gi, "$1");
  if (aggressive) {
    // Remove filler hedges: "like, you know,"
    t = t.replace(/,?\s*you know,?\s*/gi, " ");
    // Remove "like" as filler (not after verbs)
    t = t.replace(/,?\s*like,\s*/gi, ", ");
    // Clean up "mhmm", "uh", "um" standalone
    t = t.replace(/\b(?:mhmm|uh|um|hmm)\b[.,]?\s*/gi, "");
  }
  // Clean up double spaces and trim
  t = t.replace(/\s{2,}/g, " ").trim();
  return t;
}


// ============================================================
// Types
// ============================================================
type ConversationTurn = {
  speaker: "student" | "tutor";
  utterances: LessonUtterance[];
  startSec: number;
  endSec: number;
  combinedText: string;
};

type CefrLevel = "B1" | "B2" | "C1" | "C2";

// ============================================================
// Turn chunking — group consecutive same-speaker utterances
// ============================================================
function chunkIntoTurns(utterances: LessonUtterance[]): ConversationTurn[] {
  if (utterances.length === 0) return [];
  const sorted = [...utterances].sort(
    (a, b) => Number(a.start_sec) - Number(b.start_sec),
  );
  const turns: ConversationTurn[] = [];
  let current: ConversationTurn = {
    speaker: sorted[0].speaker as "student" | "tutor",
    utterances: [sorted[0]],
    startSec: Number(sorted[0].start_sec),
    endSec: Number(sorted[0].end_sec),
    combinedText: sorted[0].text,
  };
  const MAX_SENTENCES_PER_TURN = 3;
  for (let i = 1; i < sorted.length; i++) {
    const u = sorted[i];
    const gap = Number(u.start_sec) - current.endSec;
    const tooLong = current.utterances.length >= MAX_SENTENCES_PER_TURN;
    // Break on: speaker change, >1.5s pause, or 3+ sentences in one bubble.
    if (u.speaker === current.speaker && gap < 1.5 && !tooLong) {
      current.utterances.push(u);
      current.endSec = Number(u.end_sec);
      current.combinedText += " " + u.text;
    } else {
      turns.push(current);
      current = {
        speaker: u.speaker as "student" | "tutor",
        utterances: [u],
        startSec: Number(u.start_sec),
        endSec: Number(u.end_sec),
        combinedText: u.text,
      };
    }
  }
  turns.push(current);
  return turns;
}

// ============================================================
// Inline CEFR word lookup (small set — extended by agent-created file)
// ============================================================
let _cefrWords: Record<string, CefrLevel> | null = null;

function getCefrWords(): Record<string, CefrLevel> {
  if (_cefrWords) return _cefrWords;
  try {
    // Dynamic import from the agent-created file
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@/lib/cefr-words");
    _cefrWords = mod.CEFR_WORDS ?? {};
  } catch {
    _cefrWords = {};
  }
  return _cefrWords!;
}

function lookupCefr(word: string): CefrLevel | null {
  const w = word.toLowerCase().replace(/[^a-z'-]/g, "");
  if (!w || w.length < 3) return null;
  const dict = getCefrWords();
  return (dict[w] as CefrLevel) ?? null;
}

// ============================================================
// TTS hook (simplified single-clip)
// ============================================================
function useTTS() {
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const play = React.useCallback(
    async (id: string, text: string, speaker: "student" | "other") => {
      if (playingId === id && audioRef.current) {
        if (audioRef.current.paused) {
          await audioRef.current.play();
          setPlayingId(id);
        } else {
          audioRef.current.pause();
          setPlayingId(null);
        }
        return;
      }
      audioRef.current?.pause();
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
          const body = (await resp.json()) as { url?: string };
          src = body.url ?? "";
        } else {
          const blob = await resp.blob();
          src = URL.createObjectURL(blob);
          cleanup = () => URL.revokeObjectURL(src);
        }
        const audio = new Audio(src);
        audio.playbackRate = 1.05;
        audioRef.current = audio;
        audio.addEventListener("ended", () => {
          cleanup?.();
          setPlayingId(null);
          audioRef.current = null;
        });
        audio.addEventListener("error", () => {
          cleanup?.();
          setPlayingId(null);
          audioRef.current = null;
        });
        await audio.play();
      } catch {
        setPlayingId(null);
      }
    },
    [playingId],
  );

  React.useEffect(() => {
    return () => {
      audioRef.current?.pause();
    };
  }, []);

  return { playingId, play };
}

// ============================================================
// Helpers
// ============================================================
function fmtMMSS(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ============================================================
// LessonFullView — full-screen transcript with CEFR highlights
// ============================================================
export function LessonFullView({
  lessonNumber,
  student,
  personaStudentKey,
  onBack,
}: {
  lessonNumber: number;
  student: StudentProgress;
  personaStudentKey: string | undefined;
  onBack: () => void;
}) {
  const [transcript, setTranscript] = React.useState<LessonUtterance[]>([]);
  const [grammarMap, setGrammarMap] = React.useState<Map<string, UtteranceGrammar>>(new Map());
  const [loading, setLoading] = React.useState(true);
  const [showBars, setShowBars] = React.useState(false);
  const { playingId, play } = useTTS();

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      getLessonTranscript(personaStudentKey, lessonNumber),
      getLessonGrammarMap(personaStudentKey, lessonNumber),
    ]).then(([tr, gm]) => {
      if (alive) {
        setTranscript(tr);
        setGrammarMap(gm);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [personaStudentKey, lessonNumber]);

  const turns = React.useMemo(() => chunkIntoTurns(transcript), [transcript]);

  // Scroll ref for the Notion-style section markers
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Compute section boundaries from turns (group every ~8 turns into a section)
  const sections = React.useMemo(() => {
    if (turns.length === 0) return [];
    const secs: Array<{ label: string; turnIdx: number; pct: number }> = [];
    const chunkSize = Math.max(6, Math.floor(turns.length / 10));
    for (let i = 0; i < turns.length; i += chunkSize) {
      const t = turns[i];
      const label = `${fmtMMSS(t.startSec)}`;
      secs.push({ label, turnIdx: i, pct: (i / turns.length) * 100 });
    }
    return secs;
  }, [turns]);

  return (
    <div className="h-full flex flex-col relative">
      {/* Header — outside scroll, never fades */}
      <div className="shrink-0 px-6 py-3 flex items-center gap-4 bg-white border-b border-black/[0.04]">
            <button
              type="button"
              onClick={onBack}
              className="w-9 h-9 inline-flex items-center justify-center rounded-[6px] border border-black/[0.08] text-[#191919] hover:bg-black/5 cursor-pointer shrink-0"
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex-1 min-w-0">
              <div className="font-display text-[22px] text-[#191919] leading-tight" style={{ fontWeight: 500 }}>
                Lesson {lessonNumber}
              </div>
              <div className="text-[13px] text-[#6a7580] mt-0.5">
                with {student.tutor}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBars((b) => !b)}
              className={cn(
                "inline-flex items-center justify-center w-9 h-9 rounded-[6px] border border-black/[0.08] cursor-pointer shrink-0 transition-colors",
                showBars ? "bg-[#191919] text-white border-[#191919]" : "bg-white text-[#191919] hover:bg-black/5",
              )}
              title={showBars ? "Hide metrics" : "Show metrics: Accuracy · Word range · Confidence"}
            >
              <BarChart3 size={15} />
            </button>
            <button
              type="button"
              onClick={() => {
                const allText = turns.map((t) => t.combinedText).join(" ");
                play("play-all", allText, "student");
              }}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-[6px] text-[13px] font-medium border border-black/[0.08] cursor-pointer shrink-0 transition-colors",
                playingId === "play-all"
                  ? "bg-[#191919] text-white border-[#191919]"
                  : "bg-white text-[#191919] hover:bg-black/5",
              )}
            >
              {playingId === "play-all" ? <Pause size={14} /> : <Volume2 size={14} />}
              {playingId === "play-all" ? "Stop" : "Play lesson"}
            </button>
      </div>

      {/* Notion-style section markers */}
      {sections.length > 1 && (
        <div className="absolute right-3 top-16 bottom-8 z-[6] flex flex-col justify-between">
          {sections.map((s, i) => (
            <button
              key={i}
              type="button"
              title={s.label}
              onClick={() => {
                const el = scrollRef.current;
                if (!el) return;
                const target = el.scrollHeight * (s.pct / 100);
                el.scrollTo({ top: target, behavior: "smooth" });
              }}
              className="group flex items-center justify-end cursor-pointer py-0.5"
            >
              <div className="w-[10px] h-[2px] rounded-[1px] bg-[#191919]/12 group-hover:bg-[#191919]/40 group-hover:w-[14px] transition-all" />
            </button>
          ))}
        </div>
      )}

      {/* Scrollable content with mask fade at top + bottom */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto"
        style={{
          maskImage: "linear-gradient(to bottom, black 0%, black calc(100% - 48px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to bottom, black 0%, black calc(100% - 48px), transparent 100%)",
        }}
      >
      {loading ? (
        <div className="flex items-center justify-center h-64 text-[13px] text-[#6a7580]">
          Loading transcript…
        </div>
      ) : turns.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-[13px] text-[#6a7580]">
              No transcript available for this lesson.
            </div>
          ) : (
            <div className="max-w-4xl mx-auto px-6 py-6 space-y-5">
              {turns.map((turn, ti) => (
                <TurnBlock
                  key={ti}
                  turn={turn}
                  student={student}
                  playingId={playingId}
                  onPlay={play}
                  grammarMap={grammarMap}
                  showBars={showBars}
                />
              ))}
            </div>
          )}
      </div>
    </div>
  );
}

// ============================================================
// TurnBlock — one speaker's consecutive utterances grouped
// ============================================================
// Glassy panel style for student bubbles.
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

const DIM_COLORS: Record<string, string> = { A: "#7AB8F0", B: "#FF7AAC", C: "#6DCFA0", D: "#A78BDB" };
const DIM_SHORT: Record<string, string> = { A: "Sentence", B: "Tense", C: "Nominal", D: "Modal" };

const CEFR_PCT: Record<string, number> = { A1: 15, A2: 30, B1: 50, B2: 70, C1: 85, C2: 100 };

function TurnBlock({
  turn,
  student,
  playingId,
  onPlay,
  grammarMap,
  showBars,
}: {
  turn: ConversationTurn;
  student: StudentProgress;
  playingId: string | null;
  onPlay: (id: string, text: string, speaker: "student" | "other") => void;
  grammarMap: Map<string, UtteranceGrammar>;
  showBars: boolean;
}) {
  const isStudent = turn.speaker === "student";
  const pid = `turn-${turn.startSec}`;
  const active = playingId === pid;

  const displayText = cleanText(turn.combinedText, !isStudent);

  const turnDims = isStudent ? (() => {
    const d = { A: 0, B: 0, C: 0, D: 0 };
    for (const u of turn.utterances) {
      const g = grammarMap.get(u.id);
      if (!g) continue;
      d.A += g.dimension_counts?.A ?? 0;
      d.B += g.dimension_counts?.B ?? 0;
      d.C += g.dimension_counts?.C ?? 0;
      d.D += g.dimension_counts?.D ?? 0;
    }
    return d;
  })() : null;
  const hasErrors = turnDims && (turnDims.A + turnDims.B + turnDims.C + turnDims.D > 0);
  const maxDim = hasErrors ? Math.max(1, turnDims.A, turnDims.B, turnDims.C, turnDims.D) : 1;

  // Compute per-turn metrics for student bubbles
  const turnMetrics = isStudent ? (() => {
    let accSum = 0, count = 0;
    const cefrs: string[] = [];
    for (const u of turn.utterances) {
      const g = grammarMap.get(u.id);
      if (!g) continue;
      accSum += g.accuracy_pct;
      count++;
      cefrs.push(g.cefr_estimate);
    }
    if (count === 0) return null;
    const acc = Math.round(accSum / count);
    const topCefr = cefrs.sort().reverse()[0] ?? "A2";
    const wordRange = CEFR_PCT[topCefr] ?? 50;
    return { accuracy: acc, wordRange, confidence: Math.min(100, acc + 8) };
  })() : null;

  if (isStudent) {
    return (
      <div className="flex w-full justify-end group/turn">
        <div className="flex flex-col items-end max-w-[75%]">
          <div className="flex items-baseline gap-2 mb-1 pr-1 text-[11px] flex-row-reverse">
            <span className="text-[#94a3b8] tabular-nums">{fmtMMSS(turn.startSec)}</span>
            <button
              type="button"
              onClick={() => onPlay(pid, turn.combinedText, "student")}
              className={cn(
                "inline-flex items-center justify-center w-5 h-5 rounded-[3px] transition-colors",
                "text-[#94a3b8] hover:text-[#191919]",
                active && "text-[#191919]",
              )}
            >
              {active ? <Pause size={10} /> : <Volume2 size={10} />}
            </button>
          </div>
          <div
            className="rounded-[14px] rounded-br-[6px] px-4 py-2.5 text-[17px] leading-relaxed backdrop-blur-[16px] text-[#191919]"
            style={GLASS_STYLE}
          >
            <CefrHighlightedText text={displayText} />
          </div>
          {/* Accuracy bars — visible on hover or when toggled */}
          {turnMetrics && (
            <div
              className={cn(
                "flex gap-2 mt-1.5 pr-1 transition-opacity duration-200",
                showBars ? "opacity-100" : "opacity-0 group-hover/turn:opacity-100",
              )}
            >
              {[
                { label: "Accuracy", value: turnMetrics.accuracy, from: "#4ade80", to: "#6DCFA0" },
                { label: "Word range", value: turnMetrics.wordRange, from: "#60a5fa", to: "#7AB8F0" },
                { label: "Confidence", value: turnMetrics.confidence, from: "#f472b6", to: "#FF7AAC" },
              ].map((b) => (
                <div key={b.label} className="flex items-center gap-1.5">
                  <span className="text-[11px] text-[#94a3b8]">{b.label}</span>
                  <div className="w-[44px] h-[6px] rounded-[3px] bg-black/[0.05] overflow-hidden">
                    <div
                      className="h-full rounded-[3px]"
                      style={{ width: `${b.value}%`, background: `linear-gradient(90deg, ${b.from}, ${b.to})` }}
                    />
                  </div>
                  <span className="text-[11px] text-[#94a3b8] tabular-nums">{b.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex w-full justify-start">
      <div className="flex flex-col items-start max-w-[75%]">
        <div className="flex items-baseline gap-2 mb-1 pl-1 text-[11px]">
          <span className="font-medium text-[#6a7580]">{student.tutor ?? "Tutor"}</span>
          <span className="text-[#94a3b8] tabular-nums">{fmtMMSS(turn.startSec)}</span>
          <button
            type="button"
            onClick={() => onPlay(pid, turn.combinedText, "other")}
            className={cn(
              "inline-flex items-center justify-center w-5 h-5 rounded-[3px] transition-colors",
              "text-[#94a3b8] hover:text-[#191919]",
              active && "text-[#191919]",
            )}
          >
            {active ? <Pause size={10} /> : <Volume2 size={10} />}
          </button>
        </div>
        <p className="text-[17px] text-[#191919] leading-relaxed pl-1">
          {displayText}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// CEFR word-level highlighting
// ============================================================
function CefrHighlightedText({ text }: { text: string }) {
  const words = text.split(/(\s+)/);

  return (
    <span>
      {words.map((token, i) => {
        if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
        const level = lookupCefr(token);
        if (!level || !CEFR_BG[level]) return <span key={i}>{token}</span>;
        return (
          <span
            key={i}
            className="group/word relative cursor-default rounded-[3px] px-0.5 -mx-0.5"
            style={{ backgroundColor: CEFR_BG[level], color: CEFR_TEXT[level] }}
          >
            {token}
            <span
              className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-medium text-white bg-[#191919] opacity-0 group-hover/word:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 select-none"
              aria-hidden="true"
            >
              {level}
            </span>
          </span>
        );
      })}
    </span>
  );
}
