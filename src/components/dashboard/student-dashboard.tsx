"use client";

import * as React from "react";
import { JourneyStrip } from "@/components/dashboard/next-conversation-card";
import { GreetingHero } from "@/components/dashboard/greeting-hero";
import { VocabPills } from "@/components/dashboard/vocab-pills";
import { WrappedHero } from "@/components/dashboard/wrapped-hero";
import { HorizontalRow } from "@/components/dashboard/horizontal-row";
import { TopicCard } from "@/components/dashboard/topic-card";
import { SessionCard } from "@/components/dashboard/session-card";
import { BookNextCard } from "@/components/dashboard/book-next-card";
import { GhostCard } from "@/components/dashboard/ghost-card";
import { WrappedModal } from "@/components/dashboard/wrapped-modal";
import { ChevronDown } from "lucide-react";
import {
  NEXT_SESSION,
  SESSION_DETAILS,
  TOPICS,
  daysUntil,
  type SessionDetail,
  type StudentProgress,
} from "@/lib/metrics";

const SUGGESTED_TOPICS = [
  { label: "Hypotheticals", hint: "Stretch your conditionals" },
  { label: "Opinions", hint: "Agree and disagree" },
  { label: "Storytelling", hint: "Longer narratives" },
  { label: "Culture", hint: "Local customs and humor" },
];

type SessionLike = {
  lesson?: number;
  topTopicId?: string;
  tutor?: string;
  language?: string;
  [key: string]: unknown;
};

export function StudentDashboard({ student }: { student: StudentProgress }) {
  const topics = TOPICS[student.id] ?? [];
  const sessions = [...(SESSION_DETAILS[student.id] ?? [])].reverse();
  const latest = sessions[0];
  const latestTopic = topics.find((t) => t.id === latest?.topTopicId);
  const nextSession = NEXT_SESSION[student.id];

  const soonDays = nextSession ? daysUntil(nextSession.scheduledAt) : null;
  const hasSoonSession =
    soonDays !== null && soonDays >= 0 && soonDays <= 7;

  // Session filter state + options derived from the data (falls back to fixed
  // demo values so the UI always has something).
  const [tutorFilter, setTutorFilter] = React.useState<string>("all");
  const [langFilter, setLangFilter] = React.useState<string>("all");
  const [wrappedSession, setWrappedSession] = React.useState<SessionDetail | null>(null);
  const wrappedTopic = wrappedSession
    ? topics.find((t) => t.id === wrappedSession.topTopicId)
    : undefined;
  const tutorsInSessions = Array.from(
    new Set((sessions as SessionLike[]).map((s) => s.tutor).filter(Boolean)),
  ) as string[];
  const langsInSessions = Array.from(
    new Set((sessions as SessionLike[]).map((s) => s.language).filter(Boolean)),
  ) as string[];
  const tutorOptions = tutorsInSessions.length ? tutorsInSessions : [student.tutor];
  const langOptions = langsInSessions.length ? langsInSessions : ["English"];
  const filteredSessions = (sessions as SessionLike[]).filter((s) => {
    if (tutorFilter !== "all" && s.tutor && s.tutor !== tutorFilter) return false;
    if (langFilter !== "all" && s.language && s.language !== langFilter) return false;
    return true;
  });

  return (
    <div className="w-full max-w-6xl mx-auto pt-5 pb-16 px-6">
      <div className="flex items-end gap-6">
        <div className="flex-1 min-w-0">
          <GreetingHero name={student.name} studentKey={student.id} />
        </div>
        <div className="hidden md:block w-[320px] lg:w-[400px] shrink-0 mb-1">
          <VocabPills studentKey={student.id} />
        </div>
      </div>

      <div className="mt-6" />

      {latest && (
        <WrappedHero
          session={latest}
          topic={latestTopic}
          topics={topics}
          student={student}
          onOpenDetail={() => setWrappedSession(latest)}
        />
      )}

      <div className="mt-20" />

      <JourneyStrip personaStudentKey={student.id} />

      <div className="mt-20" />

      <HorizontalRow
        title="Recent sessions"
      >
        <GhostCard
          kind="session"
          label="Book new session"
        />
        <div className="group shrink-0 w-[220px] text-left cursor-pointer">
          <div className="relative aspect-square w-full rounded-[6px] overflow-hidden p-3 flex flex-col border border-black/[0.06]" style={{ background: "#FFF4E0" }}>
            <div className="text-[14px] font-semibold text-[#191919]/60">
              upcoming
            </div>
            <div className="font-display text-[64px] leading-none text-[#191919] mt-[-4px]">
              04
            </div>
            <div className="mt-auto flex items-center gap-2">
              <img src="/tutor-avatar.jpg" alt="Tutor" className="w-9 h-9 rounded-[4px] object-cover border border-white/40 shrink-0" />
              <div>
                <div className="text-[12px] font-semibold text-[#191919]/80">Sarah W.</div>
                <div className="text-[11px] text-[#191919]/50">Thu 17 Apr · 18:30</div>
              </div>
            </div>
          </div>
          <div className="pt-2 px-0.5">
            <div className="text-[13px] text-[#191919] line-clamp-1">Next lesson booked</div>
          </div>
        </div>
        {filteredSessions.map((s) => {
          const session = s as unknown as Parameters<typeof SessionCard>[0]["session"];
          const t = topics.find((x) => x.id === (s.topTopicId as string));
          return (
            <SessionCard
              key={s.lesson as number}
              session={session}
              topic={t}
              onClick={() => setWrappedSession(session)}
            />
          );
        })}
      </HorizontalRow>

      {!hasSoonSession && <BookNextCard student={student} />}

      <WrappedModal
        open={wrappedSession !== null}
        onClose={() => setWrappedSession(null)}
        session={wrappedSession}
        student={student}
        topic={wrappedTopic}
        personaStudentKey={student.id}
      />
    </div>
  );
}

function FilterChip({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  const current = options.find((o) => o.value === value) ?? options[0];
  return (
    <label className="relative inline-flex items-center gap-1.5 text-[14px] text-[#6a7580] rounded-[6px] border border-black/[0.08] bg-white px-2.5 py-1 cursor-pointer hover:bg-[#FAFAFA] hover:border-black/[0.18] transition-colors">
      <span>{label}</span>
      <span className="text-[#191919] font-medium">{current?.label}</span>
      <ChevronDown size={14} className="text-[#6a7580]" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
