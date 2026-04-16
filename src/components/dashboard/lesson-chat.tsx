"use client";

import * as React from "react";
import { ArrowUp, Volume2, Pause, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { searchUtterances, type SearchHit } from "@/lib/db";

const TTS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tts`;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  snippets?: Array<{
    text: string;
    timestamp: string;
    lessonDate: string;
  }>;
};

function fmtMMSS(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ============================================================
// Inline audio snippet — play button + text + timestamp
// ============================================================
function AudioSnippet({
  text,
  timestamp,
  lessonDate,
}: {
  text: string;
  timestamp: string;
  lessonDate: string;
}) {
  const [playing, setPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  const play = async () => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    try {
      const resp = await fetch(TTS_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, speaker: "student" }),
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
        setPlaying(false);
        audioRef.current = null;
      });
      await audio.play();
    } catch {
      setPlaying(false);
    }
  };

  return (
    <div className="flex items-start gap-2 my-2 p-2.5 rounded-[10px] bg-[#F8F8F8] border border-black/[0.04]">
      <button
        type="button"
        onClick={play}
        className={cn(
          "w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-full transition-colors cursor-pointer",
          playing ? "bg-[#191919] text-white" : "bg-[#FF7AAC] text-white hover:bg-[#f0699d]",
        )}
      >
        {playing ? <Pause size={13} /> : <Volume2 size={13} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] text-[#191919] leading-snug line-clamp-2">
          &ldquo;{text}&rdquo;
        </p>
        <span className="text-[11px] text-[#191919]/40 mt-0.5 block">
          {timestamp} · {lessonDate}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// LessonChat — side panel chat for lesson exploration
// ============================================================
export function LessonChat({
  personaStudentKey,
  onClose,
}: {
  personaStudentKey: string | undefined;
  onClose: () => void;
}) {
  const [messages, setMessages] = React.useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Ask me anything about your lessons. I can find specific moments, compare how you spoke across sessions, or explain your progress.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: q };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const hits = await searchUtterances(personaStudentKey, q, 5);
      const snippets = hits.map((h: SearchHit) => ({
        text: h.text,
        timestamp: fmtMMSS(h.start_sec),
        lessonDate: new Date(h.lesson_happened_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      }));

      const assistantMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: snippets.length > 0
          ? `I found ${snippets.length} moment${snippets.length === 1 ? "" : "s"} matching "${q}". Here they are — tap play to listen:`
          : `I couldn't find any strong matches for "${q}" in your lessons. Try searching for a topic you discussed, like "notifications" or "discipline".`,
        snippets: snippets.length > 0 ? snippets : undefined,
      };
      setMessages((m) => [...m, assistantMsg]);
    } catch {
      setMessages((m) => [
        ...m,
        { id: `e-${Date.now()}`, role: "assistant", content: "Something went wrong. Try again." },
      ]);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="shrink-0 px-4 py-3 flex items-center justify-between border-b border-black/[0.04]">
        <span className="font-display text-[16px] text-[#191919]" style={{ fontWeight: 500 }}>
          Ask about your lessons
        </span>
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 inline-flex items-center justify-center rounded-full text-[#191919]/50 hover:text-[#191919] hover:bg-black/5 cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
            <div className={cn("max-w-[85%]", msg.role === "user" ? "text-right" : "text-left")}>
              <div
                className={cn(
                  "inline-block px-4 py-2.5 rounded-[14px] text-[14px] leading-relaxed",
                  msg.role === "user"
                    ? "bg-[#EDEDEB] text-[#191919] rounded-br-[6px]"
                    : "text-[#191919]",
                )}
              >
                {msg.content}
              </div>
              {msg.snippets && (
                <div className="mt-2 space-y-1.5">
                  {msg.snippets.map((s, i) => (
                    <AudioSnippet key={i} text={s.text} timestamp={s.timestamp} lessonDate={s.lessonDate} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="flex gap-1 px-4 py-3">
              <div className="w-2 h-2 rounded-full bg-[#191919]/20 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-[#191919]/20 animate-pulse [animation-delay:150ms]" />
              <div className="w-2 h-2 rounded-full bg-[#191919]/20 animate-pulse [animation-delay:300ms]" />
            </div>
          </div>
        )}
      </div>

      {/* Input — Limbo style */}
      <div className="shrink-0 px-4 pb-4 pt-2">
        <div
          className="relative flex items-end rounded-[20px] border border-black/[0.06] shadow-[0_1px_3px_rgba(0,0,0,0.06)] px-4 py-3 gap-2"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.75)", backdropFilter: "blur(20px)" }}
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Search your lessons..."
            rows={1}
            className="flex-1 resize-none outline-none bg-transparent text-[15px] text-[#191919] placeholder:text-[#191919]/30 max-h-[120px] leading-relaxed"
            style={{ fontFamily: "var(--font-inter), system-ui, sans-serif" }}
          />
          <button
            type="button"
            onClick={send}
            disabled={!input.trim() || loading}
            className={cn(
              "w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-full transition-colors cursor-pointer",
              input.trim() && !loading
                ? "bg-[#191919] text-white"
                : "bg-[#191919]/10 text-[#191919]/30",
            )}
          >
            <ArrowUp size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
}
