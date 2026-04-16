"use client";

import * as React from "react";
import { Volume2, Pause, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  getCurrentNextConversation,
  getJourneyOnTheme,
  type NextConversation,
  type DialogueLine,
  type Blocker,
  type JourneyOnTheme,
} from "@/lib/db";

const TTS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tts`;

// Single surface color. White cards everywhere.
const CARD_BG = "#FFFFFF";
const CARD_BORDER = "rgba(25,25,25,0.08)";

// Glassy inner panel style (inside white cards).
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

// ------------------------------------------------------------
// Theme chips per student. Text on the right = the embedding query.
// ------------------------------------------------------------
type Theme = { id: string; label: string; query: string };

const THEMES: Record<string, Theme[]> = {
  marta: [
    { id: "disagree", label: "Disagreeing", query: "times I disagreed or pushed back politely" },
    { id: "feelings", label: "Feelings", query: "describing how I felt or what I was feeling" },
    { id: "opinions", label: "Opinions", query: "expressing my personal opinion or view" },
    { id: "family", label: "Family", query: "talking about my family and parents" },
    { id: "philosophy", label: "Big ideas", query: "philosophical or abstract reflections" },
  ],
  tomas: [
    { id: "humour", label: "Humour", query: "making a joke or being playful" },
    { id: "past", label: "Past stories", query: "telling stories about past experiences" },
    { id: "hobbies", label: "Hobbies", query: "talking about hobbies and interests" },
  ],
};

// ============================================================
// TTS hook
// ============================================================
function useTTS() {
  const [playingId, setPlayingId] = React.useState<string | null>(null);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const currentIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const play = React.useCallback(
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
        const contentType = resp.headers.get("content-type") ?? "";
        let src: string;
        let cleanup: (() => void) | null = null;
        if (contentType.includes("application/json")) {
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
        audio.playbackRate = 1.1;
        audioRef.current = audio;
        currentIdRef.current = id;
        audio.addEventListener("ended", () => {
          setPlayingId(null);
          currentIdRef.current = null;
          audioRef.current = null;
          cleanup?.();
        });
        audio.addEventListener("error", () => {
          setPlayingId(null);
          currentIdRef.current = null;
          audioRef.current = null;
          cleanup?.();
        });
        await audio.play();
      } catch (err) {
        console.error("tts error", err);
        setPlayingId(null);
        currentIdRef.current = null;
      }
    },
    [],
  );
  return { playingId, play };
}

// ============================================================
// Shared data hook
// ============================================================
function useNextConversation(personaStudentKey: string | undefined) {
  const [card, setCard] = React.useState<NextConversation | null>(null);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    let alive = true;
    setLoading(true);
    getCurrentNextConversation(personaStudentKey).then((c) => {
      if (!alive) return;
      setCard(c);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [personaStudentKey]);
  return { card, loading };
}

// ============================================================
// SpeakerButton
// ============================================================
function SpeakerButton({
  id,
  text,
  speaker,
  playingId,
  onPlay,
  disabled,
}: {
  id: string;
  text: string;
  speaker: "student" | "other";
  playingId: string | null;
  onPlay: (id: string, text: string, speaker: "student" | "other") => void;
  disabled?: boolean;
}) {
  const active = playingId === id;
  return (
    <button
      type="button"
      onClick={() => !disabled && onPlay(id, text, speaker)}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center w-7 h-7 rounded-[6px] transition-colors shrink-0",
        "border border-[rgba(25,25,25,0.08)] bg-white hover:bg-[#FAFAFA] text-[#191919]",
        active && "bg-[#191919] text-white border-[#191919] hover:bg-[#191919]",
        disabled && "opacity-40 cursor-not-allowed",
      )}
      aria-label={active ? "Pause" : "Play"}
    >
      {active ? <Pause size={13} /> : <Volume2 size={13} />}
    </button>
  );
}

// ============================================================
// Helpers
// ============================================================
function formatDateShort(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}
function daysUntilLabel(iso: string | null): string {
  if (!iso) return "";
  const then = new Date(iso).getTime();
  const now = Date.now();
  const days = Math.round((then - now) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "ready now";
  if (days <= 7) return `in ${days}d`;
  const weeks = Math.round(days / 7);
  return `in ${weeks}w`;
}
function prettyDelta(days: number | null): string {
  if (days === null) return "";
  if (days < 1) return "same day";
  if (days < 7) return `${days} day${days === 1 ? "" : "s"}`;
  if (days < 60) {
    const weeks = Math.round(days / 7);
    return `${weeks} week${weeks === 1 ? "" : "s"}`;
  }
  const months = Math.round(days / 30);
  return `${months} month${months === 1 ? "" : "s"}`;
}

// ============================================================
// JourneyStrip — theme chips + big delta + Past/Now/Next glass panels.
// ============================================================
export function JourneyStrip({
  personaStudentKey,
}: {
  personaStudentKey: string | undefined;
}) {
  const { card } = useNextConversation(personaStudentKey);
  const { playingId, play } = useTTS();
  const [modalOpen, setModalOpen] = React.useState(false);

  const themes = (personaStudentKey && THEMES[personaStudentKey]) || THEMES.marta;
  const [themeId, setThemeId] = React.useState<string>(themes[0]?.id ?? "");
  const activeTheme = themes.find((t) => t.id === themeId) ?? themes[0];

  const [journey, setJourney] = React.useState<JourneyOnTheme | null>(null);
  const [journeyLoading, setJourneyLoading] = React.useState(false);

  React.useEffect(() => {
    if (!activeTheme) return;
    let alive = true;
    setJourneyLoading(true);
    getJourneyOnTheme(personaStudentKey, activeTheme.query).then((d) => {
      if (!alive) return;
      setJourney(d);
      setJourneyLoading(false);
    });
    return () => {
      alive = false;
    };
  }, [personaStudentKey, activeTheme]);

  const dialogue: DialogueLine[] = card && Array.isArray(card.dialogue)
    ? card.dialogue
    : [];
  const nextYouLine = dialogue.find((l) => l.speaker === "you")?.text ?? "";

  // Prefer journey-theme matches; fall back to card's generic quotes.
  const pastQuote = journey?.past?.text ?? card?.journey_from_quote ?? "";
  const pastDate = journey?.past?.happened_at ?? card?.journey_from_date ?? null;
  const nowQuote = journey?.now?.text ?? card?.journey_to_quote ?? "";
  const nowDate = journey?.now?.happened_at ?? card?.journey_to_date ?? null;

  // Prefer server delta; fall back to a client-side compute if we still have
  // both dates (covers the NextConversation fallback path too).
  const deltaDays = (() => {
    if (journey?.delta_days !== null && journey?.delta_days !== undefined) {
      return journey.delta_days;
    }
    if (pastDate && nowDate) {
      return Math.max(
        0,
        Math.round(
          (new Date(nowDate).getTime() - new Date(pastDate).getTime()) /
            86400000,
        ),
      );
    }
    return null;
  })();

  return (
    <section
      className="rounded-[6px] border p-4 md:p-5"
      style={{ background: CARD_BG, borderColor: CARD_BORDER }}
    >
      {/* Header row: title + inline delta on the left, chips on the right */}
      <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
        <div className="flex items-baseline gap-3 min-w-0">
          <h2
            className="font-display text-[18px] text-[#191919] leading-none px-0.5"
            style={{ fontWeight: 500 }}
          >
            Your speaking journey
          </h2>
          <span className="text-[13px] text-[#64748b]">
            {journeyLoading
              ? "…"
              : deltaDays !== null
                ? `${prettyDelta(deltaDays)} of progress`
                : "\u00A0"}
          </span>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {themes.map((t) => {
            const active = t.id === themeId;
            return (
              <button
                key={t.id}
                onClick={() => setThemeId(t.id)}
                className={cn(
                  "text-[13px] px-3 py-1.5 rounded-full border transition-colors cursor-pointer",
                  active
                    ? "bg-[#191919] text-white border-[#191919]"
                    : "bg-white text-[#191919] border-[rgba(25,25,25,0.12)] hover:border-[rgba(25,25,25,0.3)]",
                )}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {/* Past */}
        <Panel
          id="past"
          label="Past"
          meta={pastDate ? formatDateShort(pastDate) : ""}
          quote={pastQuote}
          playingId={playingId}
          onPlay={play}
        />

        {/* Now */}
        <Panel
          id="now"
          label="Now"
          meta={nowDate ? formatDateShort(nowDate) : ""}
          quote={nowQuote}
          playingId={playingId}
          onPlay={play}
        />

        {/* Next */}
        <div
          className="rounded-[6px] p-4 flex flex-col gap-3 min-h-[180px] backdrop-blur-[16px] text-left"
          style={GLASS_STYLE}
        >
          <div className="flex items-start justify-between gap-2">
            <h3
              className="font-display text-[24px] leading-none text-[#191919]"
              style={{ fontWeight: 500 }}
            >
              Next
            </h3>
            <SpeakerButton
              id="next"
              text={nextYouLine}
              speaker="student"
              playingId={playingId}
              onPlay={play}
              disabled={!nextYouLine}
            />
          </div>
          <p
            className="text-[15px] leading-snug italic text-left line-clamp-4"
            style={GLASS_TEXT}
          >
            {nextYouLine ? <>&ldquo;{nextYouLine}&rdquo;</> : "\u00A0"}
          </p>
          <div className="mt-auto pt-2 flex items-end justify-between gap-3">
            <span className="text-[12px] text-[#64748b] min-h-[1em]">
              {card?.projected_ready_date
                ? `${daysUntilLabel(card.projected_ready_date)} · ${formatDateShort(card.projected_ready_date)}`
                : ""}
            </span>
            <Button
              variant="primary"
              size="default"
              onClick={() => setModalOpen(true)}
              disabled={!card}
              className="px-6"
            >
              Learn
            </Button>
          </div>
        </div>
      </div>

      <NextConversationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        personaStudentKey={personaStudentKey}
      />
    </section>
  );
}

function Panel({
  id,
  label,
  meta,
  quote,
  playingId,
  onPlay,
}: {
  id: string;
  label: string;
  meta: string;
  quote: string;
  playingId: string | null;
  onPlay: (id: string, text: string, speaker: "student" | "other") => void;
}) {
  return (
    <div
      className="rounded-[6px] p-4 flex flex-col gap-3 min-h-[180px] backdrop-blur-[16px] text-left"
      style={GLASS_STYLE}
    >
      <div className="flex items-start justify-between gap-2">
        <h3
          className="font-display text-[24px] leading-none text-[#191919]"
          style={{ fontWeight: 500 }}
        >
          {label}
        </h3>
        <SpeakerButton
          id={id}
          text={quote}
          speaker="student"
          playingId={playingId}
          onPlay={onPlay}
          disabled={!quote}
        />
      </div>
      <p
        className="text-[15px] leading-snug italic text-left line-clamp-4"
        style={GLASS_TEXT}
      >
        {quote ? <>&ldquo;{quote}&rdquo;</> : "\u00A0"}
      </p>
      <div className="mt-auto pt-2 flex items-end justify-between gap-3">
        <span className="text-[12px] text-[#64748b] min-h-[1em]">{meta}</span>
      </div>
    </div>
  );
}

// ============================================================
// NextConversationModal — opens on Learn click. Clean, roomy, focused.
// ============================================================
function NextConversationModal({
  open,
  onClose,
  personaStudentKey,
}: {
  open: boolean;
  onClose: () => void;
  personaStudentKey: string | undefined;
}) {
  const { card } = useNextConversation(personaStudentKey);
  const { playingId, play } = useTTS();

  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open || !card) return null;

  const blockers: Blocker[] = Array.isArray(card.blockers) ? card.blockers : [];
  const dialogue: DialogueLine[] = Array.isArray(card.dialogue)
    ? card.dialogue
    : [];
  const lessonsSoFar = card.journey_to_lesson ?? 3;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-[8px] bg-white border p-6 md:p-8"
        style={{ borderColor: CARD_BORDER }}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 inline-flex items-center justify-center rounded-[6px] border text-[#64748b] hover:text-[#191919] hover:bg-[#FAFAFA] cursor-pointer"
          style={{ borderColor: CARD_BORDER }}
        >
          <X size={16} />
        </button>

        <header className="pr-10 mb-5">
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#FF7AAC] mb-3">
            Your next conversation
          </div>

          <div className="mb-2">
            <span
              className="font-display text-[22px] text-[#191919] leading-tight"
              style={{ fontWeight: 700 }}
            >
              {card.title}
            </span>
          </div>

          <div className="flex items-center gap-3 text-[12px] text-[#64748b]">
            <span>
              <span className="font-display text-[#191919] text-[18px] mr-1">
                {Math.round(card.coverage_pct)}%
              </span>
              ready
            </span>
            <span className="text-[#cbd5e1]">·</span>
            <span>
              {card.projected_lessons_needed ?? "a few"} lessons to go
            </span>
            <span className="text-[#cbd5e1]">·</span>
            <span>built from your last {lessonsSoFar} lessons</span>
          </div>
        </header>

        <div
          className="rounded-[6px] border p-4 mb-5"
          style={{ borderColor: CARD_BORDER, background: "#FAFAFA" }}
        >
          <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748b] mb-1.5">
            The scenario
          </div>
          <p className="text-[15px] text-[#191919] leading-relaxed">
            {card.scenario}
          </p>
        </div>

        {blockers.length > 0 && (
          <div className="mb-6">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748b] mb-2">
              What&apos;s in the way
            </div>
            <div className="flex flex-wrap gap-2">
              {blockers.map((b, i) => (
                <span
                  key={i}
                  className="text-[13px] font-medium text-[#191919] bg-white border rounded-[6px] px-3 py-1.5"
                  style={{ borderColor: CARD_BORDER }}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {dialogue.length > 0 && (
          <div className="mb-6">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-[#64748b] mb-3">
              The conversation · {dialogue.length} lines
            </div>
            <div className="space-y-3">
              {dialogue.map((line, i) =>
                line.speaker === "you" ? (
                  <UserGlassBubble
                    key={i}
                    id={`m${i}`}
                    text={line.text}
                    playingId={playingId}
                    onPlay={play}
                  />
                ) : (
                  <TutorRow
                    key={i}
                    id={`m${i}`}
                    text={line.text}
                    playingId={playingId}
                    onPlay={play}
                  />
                ),
              )}
            </div>
          </div>
        )}

        <div className="sticky bottom-0 -mx-6 md:-mx-8 px-6 md:px-8 pt-4 pb-1 bg-gradient-to-t from-white via-white to-transparent">
          <Button variant="primary" size="default">
            Book next lesson
          </Button>
        </div>
      </div>
    </div>
  );
}

function TutorRow({
  id,
  text,
  playingId,
  onPlay,
}: {
  id: string;
  text: string;
  playingId: string | null;
  onPlay: (id: string, text: string, speaker: "student" | "other") => void;
}) {
  return (
    <div className="flex items-start gap-2.5">
      <SpeakerButton
        id={id}
        text={text}
        speaker="other"
        playingId={playingId}
        onPlay={onPlay}
      />
      <p className="text-[14px] text-[#191919] leading-relaxed flex-1 pt-0.5">
        {text}
      </p>
    </div>
  );
}

function UserGlassBubble({
  id,
  text,
  playingId,
  onPlay,
}: {
  id: string;
  text: string;
  playingId: string | null;
  onPlay: (id: string, text: string, speaker: "student" | "other") => void;
}) {
  return (
    <div className="flex justify-end">
      <div className="flex items-center gap-2 max-w-[85%]">
        <div
          className="relative rounded-[6px] px-4 py-2 text-[14px] leading-snug backdrop-blur-[16px]"
          style={GLASS_STYLE}
        >
          <span style={GLASS_TEXT}>{text}</span>
        </div>
        <SpeakerButton
          id={id}
          text={text}
          speaker="student"
          playingId={playingId}
          onPlay={onPlay}
        />
      </div>
    </div>
  );
}
