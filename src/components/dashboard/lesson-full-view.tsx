"use client";

import * as React from "react";
import { ArrowLeft, Volume2, Pause, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getLessonTranscript,
  type LessonUtterance,
} from "@/lib/db";
import type { StudentProgress } from "@/lib/metrics";
import { Grainient } from "@/components/ui/grainient";

const TTS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tts`;

// CEFR highlight colors (matching their colour scheme).
const CEFR_BG: Record<string, string> = {
  B1: "rgba(64,224,208,0.22)",
  B2: "rgba(255,107,157,0.22)",
  C1: "rgba(158,122,255,0.25)",
  C2: "rgba(112,68,212,0.3)",
};
const CEFR_TEXT: Record<string, string> = {
  B1: "#0d9488",
  B2: "#e11d73",
  C1: "#7c3aed",
  C2: "#5b21b6",
};

// Palettes for the lesson header
const PALETTES: Array<[string, string, string]> = [
  ["#FFB6D9", "#FF7AAC", "#E8649A"],
  ["#A8D8FF", "#5FA8FD", "#3D7CC9"],
  ["#9FE5BE", "#3DDABE", "#2DA88F"],
  ["#FFD0B8", "#FF9570", "#E87550"],
  ["#D4BFF5", "#9E7AFF", "#7044D4"],
];

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
  for (let i = 1; i < sorted.length; i++) {
    const u = sorted[i];
    const gap = Number(u.start_sec) - current.endSec;
    // Break turn on speaker change OR a >3s silence gap (keeps single-speaker
    // data from collapsing into one giant block).
    if (u.speaker === current.speaker && gap < 3) {
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
  const [loading, setLoading] = React.useState(true);
  const { playingId, play } = useTTS();

  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    getLessonTranscript(personaStudentKey, lessonNumber).then((tr) => {
      if (alive) {
        setTranscript(tr);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [personaStudentKey, lessonNumber]);

  const turns = React.useMemo(() => chunkIntoTurns(transcript), [transcript]);
  const palette = PALETTES[(lessonNumber - 1) % PALETTES.length];

  return (
    <div className="flex flex-col h-full">
      {/* Header with Grainient accent */}
      <div className="relative shrink-0 overflow-hidden" style={{ minHeight: 64 }}>
        <div className="absolute inset-0 opacity-60 pointer-events-none">
          <Grainient
            color1={palette[0]}
            color2={palette[1]}
            color3={palette[2]}
            timeSpeed={0.12}
            warpStrength={1.0}
            warpAmplitude={60}
            grainAmount={0.14}
            grainAnimated
            contrast={1.1}
            saturation={1.0}
            zoom={1.1}
          />
        </div>
        <div className="relative z-[1] px-6 py-3 flex items-center gap-4">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 inline-flex items-center justify-center rounded-full bg-white/80 backdrop-blur-sm border border-black/[0.08] text-[#191919] hover:bg-white cursor-pointer shrink-0"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="text-[12px] uppercase tracking-[0.1em] text-[#191919]/60 font-medium">
              Lesson {lessonNumber} · Full transcript
            </div>
            <div className="font-display text-[20px] text-[#191919] leading-tight" style={{ fontWeight: 500 }}>
              {student.name} with {student.tutor}
            </div>
          </div>
          <div className="ml-auto text-[13px] text-[#191919]/50">
            {transcript.length} lines · {turns.length} turns
          </div>
        </div>
      </div>

      {/* Transcript body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64 text-[13px] text-[#6a7580]">
            Loading transcript…
          </div>
        ) : turns.length === 0 ? (
          <div className="flex items-center justify-center h-64 text-[13px] text-[#6a7580]">
            No transcript available for this lesson.
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-6 py-8 space-y-5">
            {turns.map((turn, ti) => (
              <TurnBlock
                key={ti}
                turn={turn}
                student={student}
                playingId={playingId}
                onPlay={play}
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
function TurnBlock({
  turn,
  student,
  playingId,
  onPlay,
}: {
  turn: ConversationTurn;
  student: StudentProgress;
  playingId: string | null;
  onPlay: (id: string, text: string, speaker: "student" | "other") => void;
}) {
  const isStudent = turn.speaker === "student";
  const authorName = isStudent ? student.name : student.tutor ?? "Tutor";
  const pid = `turn-${turn.startSec}`;
  const active = playingId === pid;

  return (
    <div className={cn("flex w-full", isStudent ? "justify-end" : "justify-start")}>
      <div className={cn("flex flex-col max-w-[75%]", isStudent ? "items-end" : "items-start")}>
        {/* Speaker label + timestamp */}
        <div
          className={cn(
            "flex items-baseline gap-2 mb-1 text-[11px] px-1",
            isStudent ? "flex-row-reverse" : "",
          )}
        >
          <span className={cn("font-medium", isStudent ? "text-[#FF7AAC]" : "text-[#6a7580]")}>
            {authorName}
          </span>
          <span className="text-[#94a3b8] tabular-nums">{fmtMMSS(turn.startSec)}</span>
          <button
            type="button"
            onClick={() =>
              onPlay(pid, turn.combinedText, isStudent ? "student" : "other")
            }
            className={cn(
              "inline-flex items-center justify-center w-6 h-6 rounded-[4px] transition-colors",
              "text-[#6a7580] hover:text-[#191919] hover:bg-black/5",
              active && "text-[#191919] bg-black/10",
            )}
          >
            {active ? <Pause size={11} /> : <Volume2 size={11} />}
          </button>
        </div>

        {/* Message body */}
        <div
          className={cn(
            "rounded-[16px] px-4 py-3 text-[14px] leading-relaxed",
            isStudent
              ? "bg-white border border-black/[0.06] rounded-br-[6px]"
              : "bg-[#F1F3F5] text-[#191919] rounded-bl-[6px]",
          )}
        >
          {isStudent ? (
            <CefrHighlightedText text={turn.combinedText} />
          ) : (
            <span>{turn.combinedText}</span>
          )}
        </div>

        {/* MetricBar under student turns (placeholder — real data from grammar backfill) */}
        {isStudent && turn.utterances.length > 0 && (
          <div className="flex items-center gap-3 mt-1.5 px-1">
            <span className="text-[10px] text-[#94a3b8]">
              {turn.utterances.length} sentence{turn.utterances.length > 1 ? "s" : ""} · {turn.combinedText.split(/\s+/).length} words
            </span>
          </div>
        )}
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
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-medium text-white bg-[#191919] opacity-0 group-hover/word:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
              {level}
            </span>
          </span>
        );
      })}
    </span>
  );
}
