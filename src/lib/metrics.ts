// Frontend mock data. No database yet.
// When Supabase + real transcripts wire in, these get replaced by queries.

export type LessonMetrics = {
  lesson: number;
  durationMin: number;
  talkRatioPct: number; // student share of total words
  wpm: number; // student words per minute
  clarity: number; // 0-1, avg recognition confidence
  fillerPct: number; // filler words / student words
  vocab: number; // unique student words
  latencySec: number; // median student-after-tutor gap
  note: string; // short AI-ready summary of the lesson
};

export type StudentProgress = {
  id: string;
  name: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  tutor: string;
  streak: string;
  trajectory: "climbing" | "flat" | "cooling";
  lessons: LessonMetrics[];
  headline: string;
  action: string;
};

export const MARTA: StudentProgress = {
  id: "marta",
  name: "Borys",
  level: "B2",
  tutor: "Sarah W.",
  streak: "3 lessons in 3 weeks",
  trajectory: "climbing",
  headline:
    "You spoke 71 words a minute last lesson, up 29 from your first. You're warming up.",
  action:
    "Before lesson 4, rehearse 5 open-ended answers aloud. Ask Sarah for open-question drills in the first 10 minutes.",
  lessons: [
    {
      lesson: 1,
      durationMin: 45.0,
      talkRatioPct: 60.5,
      wpm: 41.3,
      clarity: 0.893,
      fillerPct: 5.8,
      vocab: 434,
      latencySec: 3.21,
      note: "Steady first lesson. A bit tentative but engaged.",
    },
    {
      lesson: 2,
      durationMin: 43.1,
      talkRatioPct: 35.8,
      wpm: 48.6,
      clarity: 0.942,
      fillerPct: 11.8,
      vocab: 262,
      latencySec: 3.73,
      note: "Quieter lesson. Tutor led. Fillers doubled when you did speak.",
    },
    {
      lesson: 3,
      durationMin: 55.5,
      talkRatioPct: 69.0,
      wpm: 70.8,
      clarity: 0.937,
      fillerPct: 5.1,
      vocab: 639,
      latencySec: 3.06,
      note: "Breakout. You led 69% of talk, WPM jumped 22, vocab up 205 words.",
    },
  ],
};

export const TOMAS: StudentProgress = {
  id: "tomas",
  name: "Tomás",
  level: "B1",
  tutor: "Sarah W.",
  streak: "2 lessons in 10 days",
  trajectory: "cooling",
  headline:
    "Started strong but cooling. Every signal moved the wrong way between your first two lessons.",
  action:
    "Don't grind harder. Book lessons closer together. Ask for a shorter, higher-frequency schedule for two weeks.",
  lessons: [
    {
      lesson: 1,
      durationMin: 55.0,
      talkRatioPct: 71.1,
      wpm: 86.8,
      clarity: 0.91,
      fillerPct: 4.6,
      vocab: 778,
      latencySec: 1.47,
      note: "Confident opener. Led the conversation with quick responses.",
    },
    {
      lesson: 2,
      durationMin: 61.0,
      talkRatioPct: 62.6,
      wpm: 79.2,
      clarity: 0.931,
      fillerPct: 5.6,
      vocab: 663,
      latencySec: 2.15,
      note: "Cooled across the board. Longer pauses, less variety.",
    },
  ],
};

export const ROSTER: StudentProgress[] = [
  MARTA,
  TOMAS,
  {
    id: "marcus",
    name: "Marcus",
    level: "B1",
    tutor: "Sarah W.",
    streak: "3 lessons",
    trajectory: "cooling",
    headline:
      "Cooling for 3 lessons running. Talk ratio down 18%, latency up 1.8s.",
    action: "Schedule a check-in call. Change the lesson format.",
    lessons: [
      { lesson: 1, durationMin: 60, talkRatioPct: 64, wpm: 58, clarity: 0.92, fillerPct: 5.2, vocab: 510, latencySec: 2.1, note: "Baseline." },
      { lesson: 2, durationMin: 60, talkRatioPct: 55, wpm: 52, clarity: 0.91, fillerPct: 7.1, vocab: 420, latencySec: 2.9, note: "Slowing." },
      { lesson: 3, durationMin: 60, talkRatioPct: 46, wpm: 49, clarity: 0.90, fillerPct: 8.3, vocab: 360, latencySec: 3.9, note: "Further drop." },
    ],
  },
  {
    id: "yuki",
    name: "Yuki",
    level: "A2",
    tutor: "Sarah W.",
    streak: "Last lesson 10 days ago",
    trajectory: "flat",
    headline: "Momentum at risk. 10 days since last lesson.",
    action: "Gentle nudge: propose 2 short 30-min lessons this week.",
    lessons: [
      { lesson: 1, durationMin: 30, talkRatioPct: 48, wpm: 34, clarity: 0.87, fillerPct: 4.8, vocab: 210, latencySec: 4.1, note: "Shy start." },
      { lesson: 2, durationMin: 30, talkRatioPct: 51, wpm: 36, clarity: 0.88, fillerPct: 4.5, vocab: 225, latencySec: 3.9, note: "Slight gain." },
    ],
  },
  {
    id: "alex",
    name: "Alex",
    level: "C1",
    tutor: "Sarah W.",
    streak: "4 lessons in 4 weeks",
    trajectory: "climbing",
    headline: "Consistent climber. Vocab breadth growing weekly.",
    action: "Introduce idiomatic phrasing drills. Push the C1 to C2 boundary.",
    lessons: [
      { lesson: 1, durationMin: 60, talkRatioPct: 70, wpm: 102, clarity: 0.94, fillerPct: 3.1, vocab: 920, latencySec: 1.2, note: "Strong baseline." },
      { lesson: 2, durationMin: 60, talkRatioPct: 72, wpm: 108, clarity: 0.95, fillerPct: 2.9, vocab: 960, latencySec: 1.1, note: "Up." },
      { lesson: 3, durationMin: 60, talkRatioPct: 74, wpm: 112, clarity: 0.95, fillerPct: 2.7, vocab: 1010, latencySec: 1.0, note: "Up." },
      { lesson: 4, durationMin: 60, talkRatioPct: 75, wpm: 115, clarity: 0.96, fillerPct: 2.5, vocab: 1050, latencySec: 0.9, note: "Up again." },
    ],
  },
];

export function buildProjection(
  lessons: LessonMetrics[],
  weeks: number = 12,
): { week: number; current: number; plus1: number; plus2: number }[] {
  if (lessons.length === 0) return [];
  const wpm = lessons.map((l) => l.wpm);
  const last = wpm[wpm.length - 1];
  const perLesson =
    wpm.length > 1 ? (wpm[wpm.length - 1] - wpm[0]) / (wpm.length - 1) : 4;
  const rate = Math.max(2, Math.min(12, perLesson));
  const weeklyCurrent = rate * 1;
  const weeklyPlus1 = rate * 2;
  const weeklyPlus2 = rate * 3;
  const project = (baseGain: number, w: number) =>
    last + baseGain * Math.sqrt(w) * 2.2;
  const rows: { week: number; current: number; plus1: number; plus2: number }[] =
    [];
  for (let w = 0; w <= weeks; w++) {
    rows.push({
      week: w,
      current: Math.round(project(weeklyCurrent * 0.3, w) * 10) / 10,
      plus1: Math.round(project(weeklyPlus1 * 0.3, w) * 10) / 10,
      plus2: Math.round(project(weeklyPlus2 * 0.3, w) * 10) / 10,
    });
  }
  return rows;
}

export function levelAt(wpm: number): string {
  if (wpm < 40) return "A2";
  if (wpm < 60) return "B1";
  if (wpm < 80) return "B1+";
  if (wpm < 100) return "B2";
  if (wpm < 120) return "B2+";
  if (wpm < 140) return "C1";
  return "C1+";
}

// ============================================================
// Topic data
// ============================================================

export type Topic = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  sessionsCount: number;
  vocabDeltaPct: number; // +42 means up 42%
  confidenceDelta: number; // 0.03 = +3 pts
  growthLabel: "breakthrough" | "climbing" | "steady" | "new" | "flat";
};

export const TOPICS: Record<string, Topic[]> = {
  marta: [
    { id: "family",     name: "Family & Relationships", emoji: "🏡", color: "#E8DFFF", sessionsCount: 3, vocabDeltaPct: 42, confidenceDelta: 0.04, growthLabel: "breakthrough" },
    { id: "opinions",   name: "Expressing Opinions",    emoji: "💬", color: "#D6ECFF", sessionsCount: 2, vocabDeltaPct: 31, confidenceDelta: 0.03, growthLabel: "climbing" },
    { id: "feelings",   name: "Emotions & Feelings",    emoji: "💛", color: "#FFE5E0", sessionsCount: 2, vocabDeltaPct: 24, confidenceDelta: 0.02, growthLabel: "climbing" },
    { id: "philosophy", name: "Big Ideas & Philosophy",  emoji: "🌀", color: "#D1F5E0", sessionsCount: 2, vocabDeltaPct: 18, confidenceDelta: 0.02, growthLabel: "new" },
  ],
  tomas: [
    { id: "intro",    name: "Intro",    emoji: "👋",  color: "#FF7AAC", sessionsCount: 2, vocabDeltaPct: 6,  confidenceDelta: 0.02, growthLabel: "steady" },
    { id: "family",   name: "Family",   emoji: "🏡",  color: "#3DDABE", sessionsCount: 1, vocabDeltaPct: 8,  confidenceDelta: 0.01, growthLabel: "new" },
    { id: "hobbies",  name: "Hobbies",  emoji: "🎸",  color: "#2885FD", sessionsCount: 2, vocabDeltaPct: -4, confidenceDelta: -0.01, growthLabel: "flat" },
  ],
};

// ============================================================
// Session detail (per-lesson topic breakdown + intra-lesson arc)
// ============================================================

export type TopicSegment = {
  topicId: string;
  startMin: number;
  minutes: number;
};

export type SessionDetail = {
  lesson: number;
  date: string;           // ISO, e.g. 2026-04-03
  scheduledAt: string;    // time, e.g. 18:00
  topTopicId: string;
  segments: TopicSegment[];
  bestMomentMin: number;
  bestMomentLabel: string;
  confidenceArc: number[]; // ~10 points across the lesson
  tutor?: string;
  language?: string;
};

export const SESSION_DETAILS: Record<string, SessionDetail[]> = {
  marta: [
    {
      lesson: 1,
      date: "2026-03-20",
      scheduledAt: "18:30",
      topTopicId: "family",
      segments: [
        { topicId: "family",     startMin: 0,  minutes: 15 },
        { topicId: "feelings",   startMin: 15, minutes: 20 },
        { topicId: "opinions",   startMin: 35, minutes: 10 },
      ],
      bestMomentMin: 31,
      bestMomentLabel: "Described your sister in three full sentences",
      confidenceArc: [0.82, 0.85, 0.88, 0.87, 0.86, 0.89, 0.91, 0.90, 0.88, 0.89],
      tutor: "Sarah W.",
      language: "Italian",
    },
    {
      lesson: 2,
      date: "2026-03-27",
      scheduledAt: "19:00",
      topTopicId: "opinions",
      segments: [
        { topicId: "opinions",   startMin: 0,  minutes: 5 },
        { topicId: "feelings",   startMin: 5,  minutes: 20 },
        { topicId: "philosophy", startMin: 25, minutes: 18 },
      ],
      bestMomentMin: 8,
      bestMomentLabel: "Ordered coffee cleanly, zero fillers",
      confidenceArc: [0.90, 0.92, 0.94, 0.93, 0.92, 0.91, 0.90, 0.89, 0.91, 0.94],
      tutor: "Luis M.",
      language: "Italian",
    },
    {
      lesson: 3,
      date: "2026-04-03",
      scheduledAt: "18:30",
      topTopicId: "family",
      segments: [
        { topicId: "family",     startMin: 0,  minutes: 25 },
        { topicId: "opinions",   startMin: 25, minutes: 20 },
        { topicId: "feelings",   startMin: 45, minutes: 10 },
      ],
      bestMomentMin: 22,
      bestMomentLabel: "Told your Italy story unprompted for 90 seconds",
      confidenceArc: [0.88, 0.90, 0.92, 0.94, 0.93, 0.95, 0.94, 0.93, 0.94, 0.95],
      tutor: "Sarah W.",
      language: "Italian",
    },
  ],
  tomas: [
    {
      lesson: 1,
      date: "2026-04-05",
      scheduledAt: "20:00",
      topTopicId: "intro",
      segments: [
        { topicId: "intro",   startMin: 0,  minutes: 30 },
        { topicId: "family",  startMin: 30, minutes: 15 },
        { topicId: "hobbies", startMin: 45, minutes: 10 },
      ],
      bestMomentMin: 12,
      bestMomentLabel: "Explained your job without pausing",
      confidenceArc: [0.88, 0.92, 0.93, 0.91, 0.92, 0.90, 0.91, 0.89, 0.90, 0.91],
      tutor: "Sarah W.",
      language: "English",
    },
    {
      lesson: 2,
      date: "2026-04-12",
      scheduledAt: "20:00",
      topTopicId: "family",
      segments: [
        { topicId: "family",  startMin: 0,  minutes: 20 },
        { topicId: "intro",   startMin: 20, minutes: 25 },
        { topicId: "hobbies", startMin: 45, minutes: 16 },
      ],
      bestMomentMin: 5,
      bestMomentLabel: "Steady warm-up, no fillers first 5 minutes",
      confidenceArc: [0.93, 0.94, 0.93, 0.92, 0.91, 0.89, 0.88, 0.90, 0.92, 0.93],
      tutor: "Sarah W.",
      language: "English",
    },
  ],
};

// ============================================================
// Cohort insight (research-backed, labelled as projection)
// ============================================================

export type CohortInsight = {
  headlinePath: string;
  boostPath: string;
  note: string;
  source: string;
};

export const COHORT: Record<string, CohortInsight> = {
  marta: {
    headlinePath: "At your cadence, B2 → C1 in ~11 months",
    boostPath:    "+1 session/week → ~7 months",
    note: "Learners who speak at your rate reach C1 in roughly a year. Adding one session a week pulls that in by 4 months.",
    source: "Projected from FSI hours-to-proficiency estimates and DeKeyser (2007) on input-rate effects.",
  },
  tomas: {
    headlinePath: "At your current pace, progress slows before B2",
    boostPath:    "+1 session/week → back on track in ~5 months",
    note: "Learners who let cadence slip to <1/week tend to plateau. Closer lessons restore momentum fast.",
    source: "Projected from FSI hours-to-proficiency estimates and DeKeyser (2007) on input-rate effects.",
  },
};

// ============================================================
// Up next (pre-lesson prep)
// ============================================================

export type UpNextHint = {
  beforeLabel: string;   // "Before Tuesday"
  prepItems: string[];
  focusWords: string[];
};

export const UP_NEXT: Record<string, UpNextHint> = {
  marta: {
    beforeLabel: "Before your next lesson",
    prepItems: [
      "Rehearse 5 open-ended answers about your weekend",
      "Skim a travel article in your target language (10 min)",
      "Revisit 5 words you hesitated on last time",
    ],
    focusWords: ["although", "despite", "meanwhile", "whereas", "nevertheless"],
  },
  tomas: {
    beforeLabel: "Before your next lesson",
    prepItems: [
      "Book a second lesson this week while momentum is fresh",
      "Re-read your last lesson's summary (2 min)",
      "Revisit the 3 words that tripped you up",
    ],
    focusWords: ["because", "since", "while"],
  },
};

// ============================================================
// Cultural row
// ============================================================

export type CulturalItem = {
  kind: "menu" | "event" | "read" | "show" | "listen";
  title: string;
  blurb: string;
  emoji: string;
  color: string;
};

export const CULTURAL: Record<string, CulturalItem[]> = {
  marta: [
    { kind: "menu",   title: "Barcelona tapas menu", blurb: "Practice ordering , 14 dishes",        emoji: "🍽️", color: "#FFB347" },
    { kind: "event",  title: "Language exchange",   blurb: "Tuesday 7pm, El Raval",                  emoji: "🫂", color: "#3DDABE" },
    { kind: "read",   title: "BBC Travel: Rome",    blurb: "Short article, ~6 min read",             emoji: "📖", color: "#2885FD" },
    { kind: "listen", title: "Easy Spanish pod",    blurb: "15-min episode on weekend plans",        emoji: "🎧", color: "#FF7AAC" },
  ],
  tomas: [
    { kind: "read",   title: "Short stories A2+",   blurb: "5-min reading, your level",              emoji: "📖", color: "#2885FD" },
    { kind: "listen", title: "Daily 5-min podcast", blurb: "Keep it in your ear between lessons",    emoji: "🎧", color: "#FF7AAC" },
    { kind: "event",  title: "Barcelona meetup",    blurb: "Thursday 6pm, beginner-friendly",        emoji: "🫂", color: "#3DDABE" },
  ],
};

// ============================================================
// Tutor data
// ============================================================

export type TutorPulse = {
  sessionsThisWeek: number;
  studentDeltaPct: number; // +6 means +6%
  tutorTalkTimePct: number;
  weeklyBars: number[];    // 7 values, one per day
};

export type AttentionItem = {
  studentId: string;
  tag: "cooling" | "flat" | "new" | "latency";
  short: string;    // "cad -30%"
  headline: string; // "Cadence dropped 30% this week"
};

export type BreakthroughItem = {
  studentId: string;
  short: string;    // "vocab +28%"
  headline: string; // "Broke through on conditionals"
};

export type TopicForTutor = {
  topicId: string;
  name: string;
  emoji: string;
  color: string;
  studentCount: number;
  avgGrowthPct: number;
};

export type PracticeMetrics = {
  talkTimePct: number;
  talkTimeDelta: number;          // -3 means down 3 pts wk/wk
  openQuestionsPerLesson: number;
  openQuestionsDelta: number;
  interruptsPerLesson: number;
  interruptsDelta: number;
};

export type TutorData = {
  pulse: TutorPulse;
  attention: AttentionItem[];
  breakthroughs: BreakthroughItem[];
  topicsYouAreStrongAt: TopicForTutor[];
  practice: PracticeMetrics;
};

export const TUTOR_DATA: TutorData = {
  pulse: {
    sessionsThisWeek: 14,
    studentDeltaPct: 6,
    tutorTalkTimePct: 38,
    weeklyBars: [2, 3, 5, 6, 7, 8, 7],
  },
  attention: [
    { studentId: "tomas",  tag: "cooling",  short: "cad ↓30%",  headline: "Cadence dropped 30% this week" },
    { studentId: "marcus", tag: "cooling",  short: "vocab flat", headline: "Vocab flat for 3 lessons" },
    { studentId: "yuki",   tag: "flat",     short: "10d idle",   headline: "10 days since last lesson" },
  ],
  breakthroughs: [
    { studentId: "marta", short: "family ↑", headline: "Led 69% of talk in lesson 3" },
    { studentId: "alex",  short: "vocab 1k+", headline: "Crossed 1,000 unique words" },
  ],
  topicsYouAreStrongAt: [
    { topicId: "family",     name: "Family & Relationships", emoji: "🏡", color: "#E8DFFF", studentCount: 3, avgGrowthPct: 34 },
    { topicId: "opinions",   name: "Expressing Opinions",    emoji: "💬", color: "#D6ECFF", studentCount: 4, avgGrowthPct: 28 },
    { topicId: "feelings",   name: "Emotions & Feelings",    emoji: "💛", color: "#FFE5E0", studentCount: 2, avgGrowthPct: 22 },
    { topicId: "philosophy", name: "Big Ideas & Philosophy",  emoji: "🌀", color: "#D1F5E0", studentCount: 2, avgGrowthPct: 18 },
  ],
  practice: {
    talkTimePct: 38,
    talkTimeDelta: -3,
    openQuestionsPerLesson: 14,
    openQuestionsDelta: 2,
    interruptsPerLesson: 4,
    interruptsDelta: -1,
  },
};

// ============================================================
// Per-student tutor lens
// ============================================================

export type TutorStudentLens = {
  topicAffinity: { topicId: string; affinity: "star" | "works" | "flat" }[];
  nextFocus: string;
  nextTip: string;
  cohortNote: string;
  resources: { title: string; kind: string; emoji: string }[];
};

export const TUTOR_STUDENT_LENS: Record<string, TutorStudentLens> = {
  marta: {
    topicAffinity: [
      { topicId: "family",     affinity: "star" },
      { topicId: "opinions",   affinity: "works" },
      { topicId: "feelings",   affinity: "works" },
      { topicId: "philosophy", affinity: "flat" },
    ],
    nextFocus: "Keep her on family and opinions, she broke out there. Stretch: conditionals in an emotional scenario.",
    nextTip: "She responds best when you frame grammar inside a concrete scene. Avoid abstract drills.",
    cohortNote: "Students at Borys's stage who kept topic variety reached C1 ~3 months faster.",
    resources: [
      { title: "Restaurant roleplay deck",   kind: "roleplay", emoji: "🍽️" },
      { title: "Conditionals in context",    kind: "drill",    emoji: "📝" },
      { title: "B2→C1 vocab stretch list",   kind: "vocab",    emoji: "📚" },
    ],
  },
  tomas: {
    topicAffinity: [
      { topicId: "intro",   affinity: "works" },
      { topicId: "family",  affinity: "works" },
      { topicId: "hobbies", affinity: "flat" },
    ],
    nextFocus: "Reignite momentum. Short, frequent sessions beat long ones right now.",
    nextTip: "He thrived on intro topics. Start the next lesson with something familiar before stretching.",
    cohortNote: "Students at his stage who boosted cadence within 2 weeks recovered. Those who didn't drifted off.",
    resources: [
      { title: "Warm-up prompts (5 min)",   kind: "warmup", emoji: "☕" },
      { title: "Low-stakes hobby drill",    kind: "drill",  emoji: "🎸" },
      { title: "Frequency nudge template",  kind: "note",   emoji: "✉️" },
    ],
  },
  marcus: { topicAffinity: [], nextFocus: "Change lesson format , try a walk-and-talk framing.", nextTip: "He's bored. Lean into topics outside curriculum.", cohortNote: "Cooling students recover when format changes.", resources: [] },
  yuki:   { topicAffinity: [], nextFocus: "Re-engage gently. Propose two short sessions this week.", nextTip: "Don't push volume. Push consistency.", cohortNote: "A2 learners who lapse >2 weeks usually lapse again.", resources: [] },
  alex:   { topicAffinity: [], nextFocus: "Push to C2 boundary. Introduce idiomatic phrasing.", nextTip: "He's ready for abstract discussion , debates, hypotheticals.", cohortNote: "C1 climbers benefit most from unfamiliar topic stretches.", resources: [] },
};

export function getStudentById(id: string): StudentProgress | undefined {
  return ROSTER.find((s) => s.id === id);
}

// ============================================================
// Next session (drives adaptive Up Next positioning)
// ============================================================

export const DEMO_TODAY = new Date("2026-04-15T09:00:00Z");

export type NextSession = {
  scheduledAt: string; // ISO
  tutor: string;
};

export const NEXT_SESSION: Record<string, NextSession | null> = {
  marta: { scheduledAt: "2026-04-17T18:30:00Z", tutor: "Sarah W." },
  tomas: null,
};

export function daysUntil(iso: string): number {
  const target = new Date(iso);
  const ms = target.getTime() - DEMO_TODAY.getTime();
  return Math.round(ms / 86_400_000);
}

// ============================================================
// Pace chart paths (merges trajectory + cohort into one viz)
// ============================================================

export type PacePath = {
  label: string;
  months: number;
  recommended?: boolean;
};

export const PACE_PATHS: Record<string, PacePath[]> = {
  marta: [
    { label: "At your pace",          months: 11 },
    { label: "+1 session a week",     months: 7, recommended: true },
    { label: "+2 sessions a week",    months: 5 },
  ],
  tomas: [
    { label: "At your current pace",  months: 18 },
    { label: "+1 session a week",     months: 9, recommended: true },
    { label: "+2 sessions a week",    months: 6 },
  ],
};

export const PACE_SOURCE =
  "Estimates based on Cambridge Assessment's CEFR guided-learning-hours table.";

export type CefrLevel = {
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  cumulativeLessons: number;
  description: string;
};

// Estimates converted from Cambridge Assessment's guided-learning-hours table
// (A1 ≈ 95h, A2 ≈ 190h, B1 ≈ 375h, B2 ≈ 550h, C1 ≈ 750h, C2 ≈ 1100h),
// using ≈ 5 hours of total learning per Preply lesson (tutor + practice).
export const CEFR_LEVELS: CefrLevel[] = [
  { level: "A1", cumulativeLessons: 20,  description: "Familiar everyday expressions" },
  { level: "A2", cumulativeLessons: 38,  description: "Simple routine tasks" },
  { level: "B1", cumulativeLessons: 75,  description: "Main points of clear standard input" },
  { level: "B2", cumulativeLessons: 110, description: "Main ideas of complex text" },
  { level: "C1", cumulativeLessons: 150, description: "Demanding longer texts, flexible use" },
  { level: "C2", cumulativeLessons: 220, description: "Virtually everything with ease" },
];

export const STUDENT_CEFR: Record<string, { current: string; goal: string }> = {
  marta: { current: "B2", goal: "C1" },
  tomas: { current: "B1", goal: "B2" },
};

export const BASELINE_LESSONS_PER_MONTH: Record<string, number> = {
  marta: 4,
  tomas: 6,
};

// ============================================================
// Language globe , stickers unlock from lesson data
// ============================================================

export type TargetLanguage = {
  name: string;
  speakers: string;
  countries: number;
};

export const TARGET_LANGUAGE: Record<string, TargetLanguage> = {
  marta: { name: "English", speakers: "1.5 billion", countries: 67 },
  tomas: { name: "English", speakers: "1.5 billion", countries: 67 },
};

export type StickerDef = {
  id: string;
  city: string;
  country?: string;
  emoji: string;
  location: [number, number]; // [lat, lon]
  color?: string;              // pill + marker accent
  hook: string;               // what happened here that shaped the language
  loanWords?: string[];        // words the language picked up here
  unlockVocab?: number;        // unlocks once student's peak vocab hits this
  capability: string;         // what your vocab lets you do here now
  themeTopicId?: string;
  minLevel?: string;
};

export type ResolvedSticker = StickerDef & {
  unlocked: boolean;
  achievement?: string;
  unlockHint?: string;
  themeColor?: string;
};

export const LANGUAGE_STICKERS: Record<string, StickerDef[]> = {
  English: [
    {
      id: "mumbai",
      city: "Mumbai",
      country: "India",
      emoji: "🫖",
      location: [19.07, 72.88],
      color: "#FFB347",
      hook: "17th-century East India Company trading tea and cotton.",
      loanWords: ["bungalow", "pyjamas", "shampoo", "verandah"],
      unlockVocab: 100,
      capability: "small-talk at a chai stall",
    },
    {
      id: "athens",
      city: "Athens",
      country: "Greece",
      emoji: "🏛️",
      location: [37.98, 23.72],
      color: "#8B6FD6",
      hook: "Greek roots shaped most of English's academic vocabulary.",
      loanWords: ["philosophy", "democracy", "biology", "theatre"],
      unlockVocab: 200,
      capability: "follow a museum guide",
    },
    {
      id: "kingston",
      city: "Kingston",
      country: "Jamaica",
      emoji: "🌴",
      location: [17.97, -76.79],
      color: "#FF7AAC",
      hook: "Jamaican Patois fused English with West African rhythms.",
      loanWords: ["reggae", "jerk", "irie"],
      unlockVocab: 300,
      capability: "catch the beat at a beach bar",
    },
    {
      id: "boston",
      city: "Boston",
      country: "USA",
      emoji: "⚓",
      location: [42.36, -71.06],
      color: "#2885FD",
      hook: "Puritan English crossed on the Mayflower in 1620.",
      loanWords: ["cookie", "fall", "truck"],
      unlockVocab: 400,
      capability: "order at a Cape Cod diner",
    },
    {
      id: "sydney",
      city: "Sydney",
      country: "Australia",
      emoji: "🐨",
      location: [-33.87, 151.21],
      color: "#FF7AAC",
      hook: "Convict English adapted to the bush and birthed Aussie slang.",
      loanWords: ["outback", "barbie", "arvo"],
      unlockVocab: 500,
      capability: "chat at a surf school",
    },
    {
      id: "dublin",
      city: "Dublin",
      country: "Ireland",
      emoji: "🥃",
      location: [53.35, -6.26],
      color: "#8B6FD6",
      hook: "Irish Gaelic gave English much of its pub vocabulary.",
      loanWords: ["whiskey", "galore", "slew"],
      unlockVocab: 600,
      capability: "hold a conversation in a pub",
    },
    {
      id: "singapore",
      city: "Singapore",
      country: "Singapore",
      emoji: "🐟",
      location: [1.35, 103.82],
      color: "#FFB347",
      hook: "British trading post since 1819. Singlish mixes four languages.",
      loanWords: ["lah", "kiasu", "shiok"],
      unlockVocab: 800,
      capability: "order at a hawker centre",
    },
    {
      id: "jakarta",
      city: "Jakarta",
      country: "Indonesia",
      emoji: "🌶️",
      location: [-6.21, 106.85],
      color: "#3DDABE",
      hook: "16th-century spice trade carried Malay words into English.",
      loanWords: ["ketchup (kecap)", "rattan", "amok"],
      unlockVocab: 1000,
      capability: "haggle in a night market",
    },
    {
      id: "edinburgh",
      city: "Edinburgh",
      country: "Scotland",
      emoji: "🎓",
      location: [55.95, -3.19],
      color: "#8B6FD6",
      hook: "Scottish contributions run through modern English.",
      loanWords: ["weekend", "uncanny", "gumption"],
      unlockVocab: 1250,
      capability: "debate at a Scots poetry night",
    },
    {
      id: "manila",
      city: "Manila",
      country: "Philippines",
      emoji: "🚢",
      location: [14.6, 120.98],
      color: "#FFB347",
      hook: "The Manila galleon linked Spanish and English across the Pacific.",
      loanWords: ["boondocks", "yo-yo"],
      unlockVocab: 1500,
      capability: "navigate the port's mixed English",
    },
  ],
  Italian: [
    {
      id: "rome",
      city: "Rome",
      emoji: "🏛️",
      location: [41.9, 12.5],
      hook: "In Rome they queue for cacio e pepe.",
      themeTopicId: "family",
      capability: "hold your own at a trattoria counter",
    },
    {
      id: "naples",
      city: "Naples",
      emoji: "🍕",
      location: [40.85, 14.27],
      hook: "Naples invented pizza.",
      themeTopicId: "opinions",
      capability: "navigate a pizzeria menu",
    },
    {
      id: "florence",
      city: "Florence",
      emoji: "🎨",
      location: [43.77, 11.25],
      hook: "Florence is the Renaissance capital.",
      themeTopicId: "philosophy",
      capability: "read gallery captions",
    },
    {
      id: "milan",
      city: "Milan",
      emoji: "👗",
      location: [45.46, 9.19],
      hook: "Milan is Italy's fashion capital.",
      themeTopicId: "feelings",
      capability: "make small talk with a barista",
    },
    {
      id: "bologna",
      city: "Bologna",
      emoji: "🍝",
      location: [44.49, 11.34],
      hook: "Bologna gave the world tagliatelle al ragù.",
      themeTopicId: "opinions",
      capability: "chat with a nonna at the mercato",
    },
    {
      id: "turin",
      city: "Turin",
      emoji: "🏔️",
      location: [45.07, 7.68],
      hook: "Turin is the gateway to the Italian Alps.",
      themeTopicId: "family",
      capability: "order in a mountain rifugio",
    },
    {
      id: "venice",
      city: "Venice",
      emoji: "🎭",
      location: [45.44, 12.32],
      hook: "Venice has 118 islands and its own dialect.",
      minLevel: "C1",
      capability: "hold a 5-minute gondolier chat",
    },
    {
      id: "verona",
      city: "Verona",
      emoji: "💕",
      location: [45.44, 10.99],
      hook: "Verona is Shakespeare's Romeo and Juliet setting.",
      minLevel: "C1",
      capability: "follow an open-air opera plot",
    },
    {
      id: "genoa",
      city: "Genoa",
      emoji: "🚢",
      location: [44.41, 8.93],
      hook: "Genoa's port shaped Italian trade for a millennium.",
      minLevel: "C1",
      capability: "small talk with a fisherman at the docks",
    },
    {
      id: "palermo",
      city: "Palermo",
      emoji: "☀️",
      location: [38.12, 13.36],
      hook: "Palermo mixes Arab and Norman flavours.",
      minLevel: "C1",
      capability: "follow regional Sicilian dialect",
    },
  ],
};

// ============================================================
// Student languages + countries , vocabulary reaches the world
// ============================================================

export type StudentLanguage = {
  name: string;
  code: string;
  color: string;
  vocabKnown: number;
  speakersMillions: number;
};

export type VocabTier = {
  floor: number;
  label: string;
  capability: string;
};

// Thresholds calibrated from Nation (2006) coverage data + CEFR vocab estimates.
// English specifically, but applies cleanly to Romance languages too.
export const VOCAB_TIERS: VocabTier[] = [
  { floor: 0,     label: "Pre-survival",   capability: "handle greetings and basic phrases" },
  { floor: 250,   label: "Survival",       capability: "order food and ask for directions" },
  { floor: 1000,  label: "Tourist",        capability: "navigate a week abroad" },
  { floor: 2500,  label: "Conversational", capability: "hold a 10-minute chat over a coffee" },
  { floor: 5000,  label: "Fluent",         capability: "work and make friends in the language" },
  { floor: 10000, label: "Advanced",       capability: "argue about politics at dinner" },
  { floor: 20000, label: "Near-native",    capability: "follow anything native speakers follow" },
];

export function tierFor(vocab: number): {
  current: VocabTier;
  next: VocabTier | null;
  gap: number;
} {
  let idx = 0;
  for (let i = 0; i < VOCAB_TIERS.length; i++) {
    const floor = VOCAB_TIERS[i].floor;
    const nextFloor = VOCAB_TIERS[i + 1]?.floor ?? Infinity;
    if (vocab >= floor && vocab < nextFloor) {
      idx = i;
      break;
    }
  }
  const current = VOCAB_TIERS[idx];
  const next = VOCAB_TIERS[idx + 1] ?? null;
  const gap = next ? Math.max(0, next.floor - vocab) : 0;
  return { current, next, gap };
}

// Coverage % of everyday speech per vocab size (Nation 2006, Hu & Nation 2000,
// BNC frequency data). Interpolated linearly between these anchors.
export const COVERAGE_POINTS: {
  vocab: number;
  coverage: number;
  blurb: string;
}[] = [
  { vocab: 0,     coverage: 0,  blurb: "just getting started" },
  { vocab: 250,   coverage: 40, blurb: "mostly greetings and basics" },
  { vocab: 500,   coverage: 60, blurb: "enough for menus and directions" },
  { vocab: 1000,  coverage: 75, blurb: "enough to follow most daily chat" },
  { vocab: 2000,  coverage: 85, blurb: "most topics with some guessing" },
  { vocab: 5000,  coverage: 95, blurb: "very little left unfamiliar" },
  { vocab: 10000, coverage: 98, blurb: "almost nothing unfamiliar" },
];

export function coverageFor(vocab: number): {
  coverage: number;
  blurb: string;
} {
  const first = COVERAGE_POINTS[0];
  const last = COVERAGE_POINTS[COVERAGE_POINTS.length - 1];
  if (vocab <= first.vocab)
    return { coverage: first.coverage, blurb: first.blurb };
  if (vocab >= last.vocab)
    return { coverage: last.coverage, blurb: last.blurb };
  for (let i = 0; i < COVERAGE_POINTS.length - 1; i++) {
    const a = COVERAGE_POINTS[i];
    const b = COVERAGE_POINTS[i + 1];
    if (vocab >= a.vocab && vocab <= b.vocab) {
      const t = (vocab - a.vocab) / (b.vocab - a.vocab);
      const coverage = Math.round(a.coverage + t * (b.coverage - a.coverage));
      const blurb = t < 0.5 ? a.blurb : b.blurb;
      return { coverage, blurb };
    }
  }
  return { coverage: last.coverage, blurb: last.blurb };
}

export const STUDENT_LANGUAGES: Record<string, StudentLanguage[]> = {
  marta: [
    { name: "English", code: "en", color: "#FF7AAC", vocabKnown: 639, speakersMillions: 1500 },
    { name: "Italian", code: "it", color: "#3DDABE", vocabKnown: 180, speakersMillions: 85 },
  ],
  tomas: [
    { name: "English", code: "en", color: "#FF7AAC", vocabKnown: 778, speakersMillions: 1500 },
  ],
};

export type LanguageCountry = {
  id: string;
  country: string;
  flag: string;
  location: [number, number];
};

export const LANGUAGE_COUNTRIES: Record<string, LanguageCountry[]> = {
  English: [
    { id: "uk", country: "United Kingdom", flag: "🇬🇧", location: [51.51, -0.13] },
    { id: "usa", country: "United States", flag: "🇺🇸", location: [38.89, -77.03] },
    { id: "canada", country: "Canada", flag: "🇨🇦", location: [45.42, -75.69] },
    { id: "australia", country: "Australia", flag: "🇦🇺", location: [-35.28, 149.13] },
    { id: "india", country: "India", flag: "🇮🇳", location: [28.61, 77.21] },
    { id: "ireland", country: "Ireland", flag: "🇮🇪", location: [53.35, -6.26] },
    { id: "nigeria", country: "Nigeria", flag: "🇳🇬", location: [9.08, 7.5] },
    { id: "south-africa", country: "South Africa", flag: "🇿🇦", location: [-25.75, 28.19] },
    { id: "philippines", country: "Philippines", flag: "🇵🇭", location: [14.6, 120.98] },
    { id: "new-zealand", country: "New Zealand", flag: "🇳🇿", location: [-41.29, 174.78] },
    { id: "singapore", country: "Singapore", flag: "🇸🇬", location: [1.35, 103.82] },
    { id: "jamaica", country: "Jamaica", flag: "🇯🇲", location: [17.97, -76.79] },
  ],
  Italian: [
    { id: "italy", country: "Italy", flag: "🇮🇹", location: [41.9, 12.5] },
    { id: "switzerland", country: "Switzerland", flag: "🇨🇭", location: [46.95, 7.45] },
    { id: "argentina", country: "Argentina", flag: "🇦🇷", location: [-34.6, -58.38] },
    { id: "san-marino", country: "San Marino", flag: "🇸🇲", location: [43.94, 12.45] },
  ],
};

const CEFR_ORDER: CefrLevel["level"][] = ["A1", "A2", "B1", "B2", "C1", "C2"];

function levelAtLeast(
  current: string | undefined,
  required: CefrLevel["level"] | undefined,
): boolean {
  if (!required) return true;
  if (!current) return false;
  const curIdx = CEFR_ORDER.indexOf(current as CefrLevel["level"]);
  const reqIdx = CEFR_ORDER.indexOf(required);
  if (curIdx < 0 || reqIdx < 0) return false;
  return curIdx >= reqIdx;
}

export function resolveStickers(
  defs: StickerDef[],
  student: StudentProgress,
): ResolvedSticker[] {
  const peakVocab = Math.max(...student.lessons.map((l) => l.vocab), 0);
  return defs.map((def) => {
    const unlocked = peakVocab >= (def.unlockVocab ?? 0);
    return {
      ...def,
      unlocked,
      themeColor: def.color,
      achievement: unlocked
        ? (def.loanWords ?? []).slice(0, 3).join(" · ")
        : undefined,
      unlockHint: unlocked
        ? undefined
        : `${(def.unlockVocab ?? 0) - peakVocab} more words to unlock`,
    };
  });
}

export function weeklyPastLessons(
  sessions: SessionDetail[],
  weekCount: number = 4,
): number[] {
  const weeks = new Array(weekCount).fill(0);
  for (const s of sessions) {
    const d = new Date(s.date);
    const daysAgo = Math.floor(
      (DEMO_TODAY.getTime() - d.getTime()) / 86_400_000,
    );
    const weekIdx = weekCount - 1 - Math.floor(daysAgo / 7);
    if (weekIdx >= 0 && weekIdx < weekCount) {
      weeks[weekIdx]++;
    }
  }
  return weeks;
}
