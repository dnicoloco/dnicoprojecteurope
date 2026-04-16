"use client";

import * as React from "react";
import { ArrowUp, Volume2, Pause, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { DB_STUDENT_IDS } from "@/lib/db";

const CHAT_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/lesson-chat`;
const TTS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tts`;

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

type Snippet = { text: string; timestamp: string; lesson_date: string; speaker?: string };
type QuizQuestion = { question: string; options: string[]; correct: number; explanation: string };
type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  snippets?: Snippet[];
  quiz?: { questions: QuizQuestion[] };
};

// ============================================================
// Audio snippet — glass card with waveform
// ============================================================
function AudioSnippet({ text, timestamp, lesson_date }: Snippet) {
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
      audio.addEventListener("ended", () => { cleanup?.(); setPlaying(false); audioRef.current = null; });
      await audio.play();
    } catch { setPlaying(false); }
  };

  return (
    <div
      className="flex items-start gap-2.5 my-2 p-3 rounded-[12px] backdrop-blur-[16px]"
      style={{ boxShadow: GLASS_SHADOW, background: "rgba(15, 23, 42, 0.01)" }}
    >
      <button
        type="button"
        onClick={play}
        className={cn(
          "w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-full transition-colors cursor-pointer",
          playing ? "bg-[#191919] text-white" : "bg-[#FF7AAC] text-white hover:bg-[#f0699d]",
        )}
      >
        {playing ? <Pause size={12} /> : <Volume2 size={12} />}
      </button>
      <div className="flex-1 min-w-0">
        {/* Waveform bars when playing */}
        {playing && (
          <div className="flex items-center gap-[2px] h-4 mb-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-[3px] rounded-full bg-[#FF7AAC]"
                style={{
                  height: `${Math.random() * 12 + 4}px`,
                  animation: `pulse 0.4s ease-in-out ${i * 0.05}s infinite alternate`,
                }}
              />
            ))}
          </div>
        )}
        <p className="text-[13px] text-[#191919] leading-snug line-clamp-2">
          &ldquo;{text}&rdquo;
        </p>
        <span className="text-[11px] text-[#191919]/35 mt-0.5 block">
          {timestamp} · {lesson_date}
        </span>
      </div>
    </div>
  );
}

// ============================================================
// Quiz question card
// ============================================================
function QuizCard({ q }: { q: QuizQuestion }) {
  const [selected, setSelected] = React.useState<number | null>(null);
  const answered = selected !== null;

  return (
    <div className="my-2 p-3 rounded-[12px] border border-black/[0.06] bg-[#FAFAFA]">
      <p className="text-[13px] font-medium text-[#191919] mb-2">{q.question}</p>
      <div className="space-y-1.5">
        {q.options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => !answered && setSelected(i)}
            disabled={answered}
            className={cn(
              "w-full text-left px-3 py-2 rounded-[8px] text-[13px] transition-colors cursor-pointer",
              answered && i === q.correct && "bg-[#D1F5E0] text-[#191919]",
              answered && i === selected && i !== q.correct && "bg-[#FFE5E0] text-[#191919]",
              !answered && "bg-white border border-black/[0.06] hover:bg-black/[0.02]",
              answered && i !== q.correct && i !== selected && "bg-white/50 text-[#191919]/40",
            )}
          >
            {opt}
          </button>
        ))}
      </div>
      {answered && (
        <p className="text-[12px] text-[#191919]/60 mt-2 italic">{q.explanation}</p>
      )}
    </div>
  );
}

// ============================================================
// LessonChat — AI-powered side panel
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
      content: "Hey! Ask me anything about your lessons. I can find specific moments, compare how you spoke, quiz you on errors, or explain your progress.",
    },
  ]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  React.useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }, [input]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: q };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const studentId = DB_STUDENT_IDS[personaStudentKey ?? ""] ?? "";
      const chatHistory = [...messages.filter((m) => m.id !== "welcome"), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, messages: chatHistory }),
      });

      if (!resp.ok) throw new Error(`Chat ${resp.status}`);
      const data = await resp.json();

      const fullContent = data.content ?? "I couldn't process that. Try again.";
      const snippets = data.snippets ?? undefined;
      const quiz = data.quiz ?? undefined;
      const msgId = `a-${Date.now()}`;

      // Stream text in character by character
      setMessages((m) => [...m, { id: msgId, role: "assistant", content: "" }]);
      setLoading(false);

      const chars = [...fullContent];
      let shown = 0;
      const tick = () => {
        const chunk = Math.floor(Math.random() * 3) + 1;
        shown = Math.min(shown + chunk, chars.length);
        const partial = chars.slice(0, shown).join("");
        setMessages((m) =>
          m.map((msg) =>
            msg.id === msgId
              ? { ...msg, content: partial, snippets: shown >= chars.length ? snippets : undefined, quiz: shown >= chars.length ? quiz : undefined }
              : msg,
          ),
        );
        if (shown < chars.length) {
          setTimeout(tick, 12 + Math.random() * 18);
        }
      };
      tick();
      return;
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
            <div className={cn("max-w-[88%]", msg.role === "user" ? "text-right" : "text-left")}>
              <div
                className={cn(
                  "inline-block px-4 py-2.5 rounded-[14px] text-[14px] leading-relaxed",
                  msg.role === "user"
                    ? "bg-[#191919] text-white rounded-br-[6px]"
                    : "text-[#191919]",
                )}
              >
                {msg.role === "assistant"
                  ? msg.content.split("\n\n").map((para, i) => (
                      <p key={i} className={i > 0 ? "mt-2.5" : ""}>{para}</p>
                    ))
                  : msg.content}
              </div>
              {msg.snippets && msg.snippets.length > 0 && (
                <div className="mt-2 space-y-1.5 text-left">
                  {msg.snippets.map((s, i) => (
                    <AudioSnippet key={i} {...s} />
                  ))}
                </div>
              )}
              {msg.quiz && msg.quiz.questions && (
                <div className="mt-2 space-y-2 text-left">
                  {msg.quiz.questions.map((q, i) => (
                    <QuizCard key={i} q={q} />
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
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Ask about your lessons..."
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

      {/* Waveform animation keyframes */}
      <style jsx>{`
        @keyframes pulse {
          from { height: 4px; }
          to { height: 16px; }
        }
      `}</style>
    </div>
  );
}
