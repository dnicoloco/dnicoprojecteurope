"use client";

import * as React from "react";
import { ArrowUp, ArrowDown, Play, Volume2, Pause } from "lucide-react";
import { Sparkline } from "./sparkline";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SessionDetail, StudentProgress, Topic } from "@/lib/metrics";

const TTS_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/tts`;

function useWrappedTTS() {
  const [playing, setPlaying] = React.useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  React.useEffect(() => {
    return () => {
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, []);

  const play = React.useCallback(async (text: string) => {
    if (audioRef.current && !audioRef.current.paused) {
      audioRef.current.pause();
      setPlaying(false);
      return;
    }
    if (audioRef.current && audioRef.current.paused) {
      await audioRef.current.play();
      setPlaying(true);
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
      audio.addEventListener("ended", () => {
        setPlaying(false);
        audioRef.current = null;
        cleanup?.();
      });
      audio.addEventListener("error", () => {
        setPlaying(false);
        audioRef.current = null;
        cleanup?.();
      });
      await audio.play();
    } catch (err) {
      console.error("wrapped tts", err);
      setPlaying(false);
    }
  }, []);

  return { playing, play };
}

function MetricTile({
  label,
  value,
  unit,
  values,
  positiveIsGood = true,
}: {
  label: string;
  value: string;
  unit?: string;
  values: number[];
  positiveIsGood?: boolean;
}) {
  const first = values[0];
  const last = values[values.length - 1];
  const pct = !first ? 0 : Math.round(((last - first) / first) * 100);
  const good = positiveIsGood ? pct >= 0 : pct <= 0;
  const color = good ? "text-[#FF7AAC]" : "text-[#6a7580]";
  const Arrow = pct >= 0 ? ArrowUp : ArrowDown;

  return (
    <div className="rounded-[8px] p-3 bg-[#FAFAFA] border border-black/[0.04]">
      <div className="text-[11px] uppercase tracking-[0.08em] text-[#6a7580] font-medium">
        {label}
      </div>
      <div className="flex items-baseline gap-1.5 mt-2">
        <span className="font-display text-[26px] text-[#191919] leading-none">
          {value}
          {unit && (
            <span className="text-[13px] text-[#6a7580] font-normal ml-0.5">
              {unit}
            </span>
          )}
        </span>
        {pct !== 0 && (
          <span className={cn("inline-flex items-center text-[11px] font-medium", color)}>
            <Arrow size={11} strokeWidth={2.5} />
            {Math.abs(pct)}%
          </span>
        )}
      </div>
    </div>
  );
}

function fmtSessionDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function WrappedHero({
  session,
  topic,
  topics,
  student,
  onOpenDetail,
}: {
  session: SessionDetail;
  topic: Topic | undefined;
  topics: Topic[];
  student: StudentProgress;
  onOpenDetail?: () => void;
}) {
  const color = topic?.color ?? "#FF7AAC";
  const padded = String(session.lesson).padStart(2, "0");
  const last = student.lessons[student.lessons.length - 1];
  const talkValues = student.lessons.map((l) => l.talkRatioPct);
  const wpmValues = student.lessons.map((l) => l.wpm);
  const vocabValues = student.lessons.map((l) => l.vocab);
  const segmentsWithTopic = session.segments
    .map((s) => ({ seg: s, topic: topics.find((t) => t.id === s.topicId) }))
    .filter((x) => x.topic);

  const { playing: ttsPlaying, play: ttsPlay } = useWrappedTTS();
  const narration = `In lesson ${session.lesson}, you spoke ${Math.round(last.talkRatioPct)} percent of the time at ${Math.round(last.wpm)} words a minute, using ${last.vocab} unique words. ${session.bestMomentLabel}. Keep going, ${student.name}.`;

  return (
    <div className="rounded-[6px] bg-white border border-black/[0.08] p-5">
      <div className="flex gap-5 flex-wrap md:flex-nowrap">
        <div
          className="relative w-[200px] h-[200px] shrink-0 rounded-[6px] overflow-hidden shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_6px_rgba(0,0,0,0.15)]"
          style={{ background: "#1a1a1d" }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: `radial-gradient(ellipse at top left, ${color}55 0%, transparent 55%)`,
            }}
          />
          <div className="absolute top-3 left-3 text-[14px] font-medium text-white/55">
            lesson
          </div>
          <div className="absolute top-10 left-3 font-display text-[64px] leading-none text-white">
            {padded}
          </div>
          <div className="absolute bottom-2 left-0 right-0 px-2 opacity-70">
            <Sparkline
              values={session.confidenceArc}
              stroke="rgba(255,255,255,0.85)"
              fill="rgba(255,255,255,0.06)"
              width={184}
              height={32}
              className="w-full"
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col min-w-0 gap-4">
          <h2 className="font-display text-[26px] text-[#191919] leading-tight line-clamp-2">
            {session.bestMomentLabel}
          </h2>

          <div className="grid grid-cols-3 gap-2.5">
            <MetricTile
              label="talk"
              value={`${Math.round(last.talkRatioPct)}`}
              unit="%"
              values={talkValues}
            />
            <MetricTile
              label="wpm"
              value={`${Math.round(last.wpm)}`}
              values={wpmValues}
            />
            <MetricTile
              label="vocab"
              value={`${last.vocab}`}
              values={vocabValues}
            />
          </div>

          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div className="text-[13px] text-[#6a7580]">
              {fmtSessionDate(session.date)}
              <span className="mx-1.5">·</span>
              {Math.round(last.durationMin)} min
              <span className="mx-1.5">·</span>
              with {student.tutor}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => ttsPlay(narration)}
                className={cn(
                  "inline-flex items-center justify-center w-10 h-10 rounded-[6px] transition-colors cursor-pointer",
                  "border border-[rgba(25,25,25,0.08)] bg-white text-[#191919] hover:bg-[#FAFAFA]",
                  ttsPlaying &&
                    "bg-[#191919] text-white border-[#191919] hover:bg-[#191919]",
                )}
                aria-label={ttsPlaying ? "Pause narration" : "Hear your wrap"}
                title={ttsPlaying ? "Pause narration" : "Hear your wrap"}
              >
                {ttsPlaying ? <Pause size={16} /> : <Volume2 size={16} />}
              </button>
              <Button
                variant="primary"
                size="default"
                onClick={onOpenDetail}
              >
                <Play size={14} className="fill-white" />
                Replay wrapped
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
