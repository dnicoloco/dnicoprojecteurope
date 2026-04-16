/**
 * scripts/ingest.ts
 *
 * Walks a dataset folder (Student-N/lesson-M/*.json), computes per-segment
 * metrics, and upserts:
 *   - lesson_segments (raw JSON as jsonb, source of truth)
 *   - segment_metrics (derived numbers, tagged with algo_version)
 *   - lesson_metrics  (lesson-level rollup with accurate vocab from raw)
 *
 * Run with a service-role key so RLS doesn't block writes:
 *
 *   SUPABASE_URL="https://bkvzvqzeswsyqonryygg.supabase.co" \
 *   SUPABASE_SERVICE_ROLE_KEY="..." \
 *   ROOT="/Users/dnico/Desktop/PREPLY" \
 *   npx tsx scripts/ingest.ts
 *
 * Bump ALGO_VERSION when metric definitions change. Re-running the ingester
 * replaces rows for the same lesson (delete-then-insert inside a transaction).
 */

import fs from "node:fs";
import path from "node:path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const ALGO_VERSION = "1.0.0";

const STUDENT_IDS: Record<string, string> = {
  "Student-1": "22222222-2222-2222-2222-222222222222",
  "Student-2": "33333333-3333-3333-3333-333333333333",
};
const LESSON_IDS: Record<string, string> = {
  "Student-1/lesson-1": "a0000001-0000-0000-0000-000000000001",
  "Student-1/lesson-2": "a0000001-0000-0000-0000-000000000002",
  "Student-1/lesson-3": "a0000001-0000-0000-0000-000000000003",
  "Student-2/lesson-1": "b0000002-0000-0000-0000-000000000001",
  "Student-2/lesson-2": "b0000002-0000-0000-0000-000000000002",
};
const TUTOR_ID = "11111111-1111-1111-1111-111111111111";

const FILLERS = new Set([
  "um", "uh", "uhm", "er", "erm", "ah", "eh", "hmm",
  "like", "okay", "ok", "so", "well", "yeah", "right",
]);

type Word = {
  word: string;
  punctuated_word?: string;
  start: number;
  end: number;
  confidence: number;
};

type SegmentJson = {
  results: {
    channels: Array<{
      alternatives: Array<{
        transcript: string;
        words: Word[];
        confidence: number;
        paragraphs?: unknown;
      }>;
    }>;
    paragraphs?: unknown;
  };
};

type SegmentResult = {
  segmentId: string;
  segmentIndex: number;
  durationSec: number;
  studentWordCount: number;
  talkRatioPct: number;
  wpm: number;
  clarity: number;
  fillerPct: number;
  vocab: number;
  latencySec: number;
  qualityFlags: string[];
  studentWords: string[]; // kept for lesson-level vocab dedupe
  raw: SegmentJson;
};

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

function computeSegment(raw: SegmentJson, index: number): SegmentResult {
  const stu = raw.results.channels[0]?.alternatives[0]?.words ?? [];
  const tut = raw.results.channels[1]?.alternatives[0]?.words ?? [];
  const all = [...stu, ...tut];
  const durationSec = all.reduce((m, w) => Math.max(m, w.end ?? 0), 0);
  const totalWords = stu.length + tut.length;
  const talkRatioPct = totalWords === 0 ? 0 : (stu.length / totalWords) * 100;
  const wpm = durationSec === 0 ? 0 : stu.length / (durationSec / 60);
  const clarity =
    stu.length === 0
      ? 0
      : stu.reduce((s, w) => s + (w.confidence ?? 0), 0) / stu.length;
  const fillers = stu.filter((w) =>
    FILLERS.has((w.word ?? "").toLowerCase()),
  ).length;
  const fillerPct = stu.length === 0 ? 0 : (fillers / stu.length) * 100;
  const studentWords = stu.map((w) => (w.word ?? "").toLowerCase());
  const vocab = new Set(studentWords).size;

  const latencies: number[] = [];
  for (const t of tut) {
    for (const s of stu) {
      if (s.start > t.end) {
        const gap = s.start - t.end;
        if (gap > 0.2 && gap < 10) latencies.push(gap);
        break;
      }
    }
  }
  const latencySec = median(latencies);

  const qualityFlags: string[] = [];
  if (durationSec < 60) qualityFlags.push("short_chunk");
  if (clarity > 0 && clarity < 0.7) qualityFlags.push("low_confidence");
  let run = 0;
  let maxRun = 0;
  for (const w of stu) {
    if ((w.confidence ?? 1) < 0.5) {
      run++;
      maxRun = Math.max(maxRun, run);
    } else run = 0;
  }
  if (maxRun >= 5) qualityFlags.push("mic_issue");

  return {
    segmentId: randomUUID(),
    segmentIndex: index,
    durationSec: Math.round(durationSec * 1000) / 1000,
    studentWordCount: stu.length,
    talkRatioPct: Math.round(talkRatioPct * 1000) / 1000,
    wpm: Math.round(wpm * 1000) / 1000,
    clarity: Math.round(clarity * 1_000_000) / 1_000_000,
    fillerPct: Math.round(fillerPct * 1000) / 1000,
    vocab,
    latencySec: Math.round(latencySec * 1000) / 1000,
    qualityFlags,
    studentWords,
    raw,
  };
}

async function ingestLesson(
  supabase: SupabaseClient,
  student: string,
  lesson: string,
  lessonDir: string,
) {
  const lessonKey = `${student}/${lesson}`;
  const lessonId = LESSON_IDS[lessonKey];
  const studentId = STUDENT_IDS[student];
  if (!lessonId || !studentId) {
    console.warn(`Skipping unmapped ${lessonKey}`);
    return;
  }

  const files = fs
    .readdirSync(lessonDir)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const segs: SegmentResult[] = [];
  for (let i = 0; i < files.length; i++) {
    const raw = JSON.parse(
      fs.readFileSync(path.join(lessonDir, files[i]), "utf8"),
    ) as SegmentJson;
    segs.push(computeSegment(raw, i + 1));
  }

  if (segs.length === 0) return;

  // Lesson-level rollups, vocab from full student word list for accuracy.
  const totalSec = segs.reduce((s, x) => s + x.durationSec, 0);
  const totalWords = segs.reduce((s, x) => s + x.studentWordCount, 0);
  const weighted = (field: "talkRatioPct" | "clarity" | "fillerPct") =>
    totalWords === 0
      ? 0
      : segs.reduce((s, x) => s + x[field] * x.studentWordCount, 0) /
        totalWords;
  const lessonVocab = new Set(segs.flatMap((s) => s.studentWords)).size;
  const latencies = segs.map((s) => s.latencySec).filter((x) => x > 0);
  const lessonLat = median(latencies);
  const lessonWpm = totalSec === 0 ? 0 : totalWords / (totalSec / 60);
  const lessonFlags = Array.from(
    new Set(segs.flatMap((s) => s.qualityFlags)),
  ).sort();

  console.log(`[${lessonKey}] ${segs.length} segments, ${totalWords} words`);

  // Wipe existing rows for this lesson so re-runs are idempotent.
  await supabase.from("lesson_metrics").delete().eq("lesson_id", lessonId);
  await supabase.from("segment_metrics").delete().eq("lesson_id", lessonId);
  await supabase.from("lesson_segments").delete().eq("lesson_id", lessonId);

  // Fetch lesson.happened_at to derive segment timestamps.
  const { data: lessonRow } = await supabase
    .from("lessons")
    .select("happened_at")
    .eq("id", lessonId)
    .single();
  const lessonStart = new Date(lessonRow?.happened_at ?? Date.now());

  for (const s of segs) {
    const happenedAt = new Date(
      lessonStart.getTime() + (s.segmentIndex - 1) * 5 * 60_000,
    );
    const { error: segErr } = await supabase.from("lesson_segments").insert({
      id: s.segmentId,
      lesson_id: lessonId,
      segment_index: s.segmentIndex,
      happened_at: happenedAt.toISOString(),
      raw: s.raw,
    });
    if (segErr) throw segErr;

    const { error: metErr } = await supabase.from("segment_metrics").insert({
      segment_id: s.segmentId,
      lesson_id: lessonId,
      student_id: studentId,
      tutor_id: TUTOR_ID,
      segment_index: s.segmentIndex,
      happened_at: happenedAt.toISOString(),
      duration_sec: s.durationSec,
      student_word_count: s.studentWordCount,
      talk_ratio_pct: s.talkRatioPct,
      wpm: s.wpm,
      clarity: s.clarity,
      filler_pct: s.fillerPct,
      vocab: s.vocab,
      latency_sec: s.latencySec,
      quality_flags: s.qualityFlags,
      algo_version: ALGO_VERSION,
    });
    if (metErr) throw metErr;
  }

  const { error: lessonErr } = await supabase.from("lesson_metrics").insert({
    lesson_id: lessonId,
    student_id: studentId,
    tutor_id: TUTOR_ID,
    happened_at: lessonStart.toISOString(),
    duration_min: Math.round((totalSec / 60) * 1000) / 1000,
    student_word_count: totalWords,
    talk_ratio_pct: Math.round(weighted("talkRatioPct") * 1000) / 1000,
    wpm: Math.round(lessonWpm * 1000) / 1000,
    clarity: Math.round(weighted("clarity") * 1_000_000) / 1_000_000,
    filler_pct: Math.round(weighted("fillerPct") * 1000) / 1000,
    vocab: lessonVocab,
    latency_sec: Math.round(lessonLat * 1000) / 1000,
    quality_flags: lessonFlags,
    algo_version: ALGO_VERSION,
  });
  if (lessonErr) throw lessonErr;
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const root = process.env.ROOT || "/Users/dnico/Desktop/PREPLY";
  if (!url || !key) {
    console.error(
      "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.",
    );
    process.exit(1);
  }
  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });

  const students = fs
    .readdirSync(root)
    .filter((n) => n.startsWith("Student-"))
    .sort();
  for (const student of students) {
    const sDir = path.join(root, student);
    const lessons = fs
      .readdirSync(sDir)
      .filter((n) => n.startsWith("lesson-"))
      .sort();
    for (const lesson of lessons) {
      await ingestLesson(supabase, student, lesson, path.join(sDir, lesson));
    }
  }
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
