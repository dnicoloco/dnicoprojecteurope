// Typed Supabase query helpers the UI can consume.
// Each returns the row(s) already typed. Frontend components stay clean.

import { createClient } from "@/lib/supabase/client";

// Persona studentId (string slug) -> DB uuid.
export const DB_STUDENT_IDS: Record<string, string> = {
  marta: "22222222-2222-2222-2222-222222222222",
  tomas: "33333333-3333-3333-3333-333333333333",
};

// Persona key -> lesson number -> DB lesson uuid.
export const LESSON_DB_IDS: Record<string, Record<number, string>> = {
  marta: {
    1: "a0000001-0000-0000-0000-000000000001",
    2: "a0000001-0000-0000-0000-000000000002",
    3: "a0000001-0000-0000-0000-000000000003",
  },
  tomas: {
    1: "b0000002-0000-0000-0000-000000000001",
    2: "b0000002-0000-0000-0000-000000000002",
  },
};

export type DialogueLine = { speaker: "them" | "you"; text: string };
export type Blocker = { kind: "skill" | "word" | "register"; label: string; why: string };

export type NextConversation = {
  id: string;
  student_id: string;
  target_topic_id: string | null;
  title: string;
  scenario: string;
  dialogue: DialogueLine[];
  target_skill_ids: string[];
  target_topic_ids: string[];
  blockers: Blocker[];
  coverage_pct: number;
  journey_from_quote: string | null;
  journey_from_lesson: number | null;
  journey_from_date: string | null;
  journey_to_quote: string | null;
  journey_to_lesson: number | null;
  journey_to_date: string | null;
  projected_ready_date: string | null;
  projected_lessons_needed: number | null;
  tutor_briefing: Record<string, unknown> | null;
  status: "current" | "achieved" | "superseded";
  generated_at: string;
};

// In-memory cache so the journey strip + detail card fetch once per session.
const _cardCache = new Map<string, Promise<NextConversation | null>>();

async function _fetchCurrentNextConversation(
  uuid: string,
): Promise<NextConversation | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("next_conversations")
    .select("*")
    .eq("student_id", uuid)
    .eq("status", "current")
    .order("generated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) {
    console.error("getCurrentNextConversation error", error);
    return null;
  }
  return data as NextConversation | null;
}

export async function getCurrentNextConversation(
  personaStudentKey: string | undefined,
): Promise<NextConversation | null> {
  if (!personaStudentKey) return null;
  const uuid = DB_STUDENT_IDS[personaStudentKey];
  if (!uuid) return null;
  if (!_cardCache.has(personaStudentKey)) {
    _cardCache.set(personaStudentKey, _fetchCurrentNextConversation(uuid));
  }
  return _cardCache.get(personaStudentKey)!;
}

export type ConversationFirst = {
  id: string;
  student_id: string;
  kind: string;
  payload: Record<string, unknown> & { headline?: string; evidence?: string };
  achieved_at: string;
};

// ------------------------------------------------------------
// journey-theme: embed a theme and return past/now student utterances.
// ------------------------------------------------------------
export type JourneyEntry = {
  slot: "past" | "now";
  utterance_id: string;
  lesson_id: string;
  segment_id: string;
  happened_at: string;
  start_sec: number;
  end_sec: number;
  text: string;
  similarity: number;
};

export type JourneyOnTheme = {
  theme: string;
  past: JourneyEntry | null;
  now: JourneyEntry | null;
  delta_days: number | null;
};

const _journeyCache = new Map<string, Promise<JourneyOnTheme | null>>();

async function _fetchJourneyOnTheme(
  uuid: string,
  theme: string,
): Promise<JourneyOnTheme | null> {
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("journey-theme", {
    body: { student_id: uuid, theme },
  });
  if (error) {
    console.error("journey-theme error", error);
    return null;
  }
  return data as JourneyOnTheme;
}

export async function getJourneyOnTheme(
  personaStudentKey: string | undefined,
  theme: string,
): Promise<JourneyOnTheme | null> {
  if (!personaStudentKey) return null;
  const uuid = DB_STUDENT_IDS[personaStudentKey];
  if (!uuid) return null;
  const key = `${personaStudentKey}::${theme}`;
  if (!_journeyCache.has(key)) {
    _journeyCache.set(key, _fetchJourneyOnTheme(uuid, theme));
  }
  return _journeyCache.get(key)!;
}

// ------------------------------------------------------------
// Lesson transcript: all utterances (both speakers) in time order.
// ------------------------------------------------------------
export type LessonUtterance = {
  id: string;
  lesson_id: string;
  speaker: "student" | "tutor";
  text: string;
  start_sec: number;
  end_sec: number;
  paragraph_index: number | null;
  sentence_index: number | null;
};

const _transcriptCache = new Map<string, Promise<LessonUtterance[]>>();

async function _fetchLessonTranscript(lessonId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lesson_utterances")
    .select(
      "id, lesson_id, speaker, text, start_sec, end_sec, paragraph_index, sentence_index",
    )
    .eq("lesson_id", lessonId)
    .order("start_sec", { ascending: true });
  if (error) {
    console.error("getLessonTranscript error", error);
    return [];
  }
  return (data ?? []) as LessonUtterance[];
}

export async function getLessonTranscript(
  personaStudentKey: string | undefined,
  lessonNumber: number,
): Promise<LessonUtterance[]> {
  if (!personaStudentKey) return [];
  const lessonId = LESSON_DB_IDS[personaStudentKey]?.[lessonNumber];
  if (!lessonId) return [];
  if (!_transcriptCache.has(lessonId)) {
    _transcriptCache.set(lessonId, _fetchLessonTranscript(lessonId));
  }
  return _transcriptCache.get(lessonId)!;
}

// ------------------------------------------------------------
// Semantic search (reuses search-utterances edge function).
// ------------------------------------------------------------
export type SearchHit = {
  utterance_id: string;
  lesson_id: string;
  segment_id: string;
  speaker: string;
  start_sec: number;
  end_sec: number;
  text: string;
  lesson_happened_at: string;
  score: number;
};

export async function searchUtterances(
  personaStudentKey: string | undefined,
  query: string,
  top = 10,
): Promise<SearchHit[]> {
  if (!personaStudentKey) return [];
  const uuid = DB_STUDENT_IDS[personaStudentKey];
  if (!uuid) return [];
  const supabase = createClient();
  const { data, error } = await supabase.functions.invoke("search-utterances", {
    body: { student_id: uuid, query, top },
  });
  if (error) {
    console.error("searchUtterances error", error);
    return [];
  }
  return ((data as { results?: SearchHit[] } | null)?.results ?? []) as SearchHit[];
}

export async function getConversationFirsts(
  personaStudentKey: string | undefined,
): Promise<ConversationFirst[]> {
  if (!personaStudentKey) return [];
  const uuid = DB_STUDENT_IDS[personaStudentKey];
  if (!uuid) return [];
  const supabase = createClient();
  const { data, error } = await supabase
    .from("conversation_firsts")
    .select("*")
    .eq("student_id", uuid)
    .order("achieved_at", { ascending: false })
    .limit(10);
  if (error) return [];
  return (data ?? []) as ConversationFirst[];
}
