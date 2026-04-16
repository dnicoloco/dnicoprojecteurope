"use client";

import { PulseHero } from "@/components/dashboard/pulse-hero";
import { HorizontalRow } from "@/components/dashboard/horizontal-row";
import { AttentionCard } from "@/components/dashboard/attention-card";
import { BreakthroughCard } from "@/components/dashboard/breakthrough-card";
import { TopicForTutorCard } from "@/components/dashboard/topic-for-tutor-card";
import { RosterCard } from "@/components/dashboard/roster-card";
import { PracticeMetricsCard } from "@/components/dashboard/practice-metrics-card";
import { GhostCard } from "@/components/dashboard/ghost-card";
import { ROSTER, TUTOR_DATA } from "@/lib/metrics";

export function TutorDashboard({
  onOpenStudent,
  tutorName = "Sarah W.",
}: {
  onOpenStudent?: (id: string) => void;
  tutorName?: string;
}) {
  const data = TUTOR_DATA;

  return (
    <div className="w-full max-w-6xl mx-auto pt-14 pb-16 px-6 space-y-7">
      <PulseHero pulse={data.pulse} tutorName={tutorName} />

      <HorizontalRow title="Attention needed" seeAllOnClick={() => {}}>
        {data.attention.map((a) => (
          <AttentionCard key={a.studentId} item={a} onClick={onOpenStudent} />
        ))}
        <GhostCard
          kind="topic"
          label="Everyone else is on track"
          hint="Check back after this week's lessons"
        />
      </HorizontalRow>

      <HorizontalRow title="Breakthroughs this week" seeAllOnClick={() => {}}>
        {data.breakthroughs.map((b) => (
          <BreakthroughCard
            key={b.studentId}
            item={b}
            onClick={onOpenStudent}
          />
        ))}
        <GhostCard
          kind="topic"
          label="More to come"
          hint="Breakthroughs appear as students cross thresholds"
        />
      </HorizontalRow>

      <HorizontalRow title="Your students">
        {ROSTER.map((s) => (
          <button
            key={s.id}
            onClick={() => onOpenStudent?.(s.id)}
            className="shrink-0 text-left cursor-pointer"
          >
            <RosterCard student={s} />
          </button>
        ))}
        <GhostCard
          kind="topic"
          label="Invite a new student"
          hint="Share your tutor link"
        />
      </HorizontalRow>

      <HorizontalRow title="Topics where your students grow fastest">
        {data.topicsYouAreStrongAt.map((t) => (
          <TopicForTutorCard key={t.topicId} topic={t} />
        ))}
        <GhostCard
          kind="topic"
          label="More topics"
          hint="Appear as students diversify"
        />
      </HorizontalRow>

      <PracticeMetricsCard practice={data.practice} />
    </div>
  );
}
