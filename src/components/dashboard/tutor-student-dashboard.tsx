"use client";

import { ChevronLeft } from "lucide-react";
import { ProjectionChart } from "@/components/dashboard/projection-chart";
import { WrappedBanner } from "@/components/dashboard/wrapped-banner";
import { HorizontalRow } from "@/components/dashboard/horizontal-row";
import { TopicCard } from "@/components/dashboard/topic-card";
import { SessionCard } from "@/components/dashboard/session-card";
import { InnerCard } from "@/components/dashboard/card";
import { GhostCard } from "@/components/dashboard/ghost-card";
import { Button } from "@/components/ui/button";
import {
  SESSION_DETAILS,
  TOPICS,
  TUTOR_STUDENT_LENS,
  type StudentProgress,
} from "@/lib/metrics";

const AFFINITY_LABEL: Record<"star" | "works" | "flat", { text: string; color: string; bg: string }> = {
  star:  { text: "top",    color: "#FF7AAC", bg: "#FFF0F6" },
  works: { text: "works",  color: "#191919", bg: "#F2F3F5" },
  flat:  { text: "flat",   color: "#6a7580", bg: "#F2F3F5" },
};

export function TutorStudentDashboard({
  student,
  onBack,
}: {
  student: StudentProgress;
  onBack?: () => void;
}) {
  const topics = TOPICS[student.id] ?? [];
  const sessions = [...(SESSION_DETAILS[student.id] ?? [])].reverse();
  const latest = sessions[0];
  const latestTopic = topics.find((t) => t.id === latest?.topTopicId);
  const lens = TUTOR_STUDENT_LENS[student.id];

  return (
    <div className="w-full max-w-6xl mx-auto pt-14 pb-16 px-6 space-y-7">
      {/* Breadcrumb + header */}
      <div className="px-1">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1 text-sm text-[#6a7580] hover:text-[#191919] transition-colors cursor-pointer"
        >
          <ChevronLeft size={16} />
          All students
        </button>
        <h1 className="font-display text-[28px] text-[#191919] leading-[1.1] mt-2">
          {student.name}{" "}
          <span className="text-[#6a7580] font-normal">
            · {student.level} · {student.lessons.length} lessons with you
          </span>
        </h1>
        <div className="text-sm text-[#6a7580] mt-1">
          {student.headline}
        </div>
      </div>

      {/* 1. Trajectory */}
      <ProjectionChart lessons={student.lessons} weeks={12} />

      {/* 2. Last lesson wrapped */}
      {latest && <WrappedBanner session={latest} topic={latestTopic} />}

      {/* 3. Topic mixes with affinity overlay */}
      {topics.length > 0 && (
        <HorizontalRow title={`${student.name}'s topics × your approach`}>
          {topics.map((t) => {
            const aff =
              lens?.topicAffinity.find((a) => a.topicId === t.id)?.affinity ??
              "works";
            const affStyle = AFFINITY_LABEL[aff];
            return (
              <div key={t.id} className="relative shrink-0">
                <TopicCard topic={t} />
                <span
                  className="absolute top-2 left-2 text-[14px] font-medium px-1.5 py-0.5 rounded-[6px]"
                  style={{ background: affStyle.bg, color: affStyle.color }}
                >
                  {affStyle.text}
                </span>
              </div>
            );
          })}
          <GhostCard kind="topic" label="Stretch topic" hint="Try something outside her comfort zone" />
          <GhostCard kind="topic" label="Debate" hint="Good for B2→C1 bridge" />
        </HorizontalRow>
      )}

      {/* 4. Recent sessions */}
      {sessions.length > 0 && (
        <HorizontalRow title={`Recent lessons with ${student.name}`}>
          {sessions.map((s) => {
            const t = topics.find((x) => x.id === s.topTopicId);
            return <SessionCard key={s.lesson} session={s} topic={t} />;
          })}
          <GhostCard kind="session" label="Next lesson" hint="Schedule with student" />
          <GhostCard kind="session" label="Prep plan" hint="Coming automatically" />
        </HorizontalRow>
      )}

      {/* 5. Next lesson */}
      {lens && (
        <InnerCard className="p-5 flex flex-col gap-3">
          <div className="text-[14px] font-medium tracking-[0.04em] text-[#FF7AAC]">
            Next lesson with {student.name}
          </div>
          <div className="font-display text-[18px] text-[#191919] leading-snug">
            {lens.nextFocus}
          </div>
          <p className="text-[14px] text-[#191919]/85 leading-relaxed max-w-2xl">
            {lens.nextTip}
          </p>
          <div className="flex gap-2 pt-1">
            <Button variant="primary" size="sm">
              Draft message
            </Button>
            <Button variant="ghost" size="sm">
              Open lesson plan
            </Button>
          </div>
        </InnerCard>
      )}

      {/* 6. Cohort */}
      {lens?.cohortNote && (
        <InnerCard className="p-5">
          <div className="text-[14px] font-medium tracking-[0.04em] text-[#6a7580]">
            Cohort signal
          </div>
          <p className="text-[15px] text-[#191919] leading-relaxed mt-1 max-w-2xl">
            {lens.cohortNote}
          </p>
        </InnerCard>
      )}

      {/* 7. Resources */}
      {lens && lens.resources.length > 0 && (
        <HorizontalRow title="Lesson-planning resources">
          {lens.resources.map((r, i) => (
            <div
              key={i}
              className="shrink-0 w-[168px] bg-white rounded-[6px] border border-black/[0.06] overflow-hidden cursor-pointer hover:-translate-y-0.5 hover:border-black/[0.12] transition-all"
            >
              <div className="h-[84px] w-full flex items-center justify-center bg-[#FAF9F5]">
                <span className="text-[22px] opacity-80">{r.emoji}</span>
              </div>
              <div className="p-3">
                <div className="text-[14px] font-medium tracking-wide text-[#6a7580]">
                  {r.kind}
                </div>
                <div className="text-[14px] font-semibold text-[#191919] leading-snug mt-0.5 line-clamp-2">
                  {r.title}
                </div>
              </div>
            </div>
          ))}
          <GhostCard kind="resource" label="Browse library" hint="Curated by level" />
          <GhostCard kind="resource" label="Create your own" hint="Save for reuse" />
        </HorizontalRow>
      )}
    </div>
  );
}
