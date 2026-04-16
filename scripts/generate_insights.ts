/**
 * scripts/generate_insights.ts
 *
 * Reads lesson_metrics + prior segment metrics from Supabase, feeds them to
 * Claude with a coaching-style prompt, writes one row per lesson to
 * lesson_insights.
 *
 * Run with service-role access so RLS doesn't block the insert:
 *
 *   SUPABASE_URL="https://bkvzvqzeswsyqonryygg.supabase.co" \
 *   SUPABASE_SERVICE_ROLE_KEY="..." \
 *   ANTHROPIC_API_KEY="..." \
 *   npx tsx scripts/generate_insights.ts
 *
 * The prompt + model + version are stored on every row so you can audit or
 * regenerate.
 */

import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-opus-4-6";
const PROMPT_VERSION = "1.0.0";

const SYSTEM_PROMPT = `You are a Preply coaching assistant. Given a student's lesson metrics and the change since their previous lesson, write a short, honest coaching note. Structure: one plain sentence of what happened, one likely reason grounded in the numbers, and one concrete action to take before the next lesson. No em dashes. No jargon. Max 3 short sentences.`;

type LessonMetric = {
  lesson_id: string;
  student_id: string;
  happened_at: string;
  duration_min: number;
  student_word_count: number;
  talk_ratio_pct: number;
  wpm: number;
  clarity: number;
  filler_pct: number;
  vocab: number;
  latency_sec: number;
  quality_flags: string[];
};

function formatDelta(curr: number, prev: number | null, unit = "") {
  if (prev === null) return `${curr}${unit}`;
  const delta = curr - prev;
  const sign = delta >= 0 ? "+" : "";
  return `${curr}${unit} (${sign}${delta.toFixed(1)}${unit} vs previous)`;
}

function buildUserMessage(curr: LessonMetric, prev: LessonMetric | null) {
  const lines = [
    `Lesson date: ${curr.happened_at.slice(0, 10)}`,
    `Duration: ${curr.duration_min.toFixed(1)} min`,
    `Talk ratio: ${formatDelta(curr.talk_ratio_pct, prev?.talk_ratio_pct ?? null, "%")}`,
    `WPM: ${formatDelta(curr.wpm, prev?.wpm ?? null)}`,
    `Clarity: ${formatDelta(curr.clarity, prev?.clarity ?? null)}`,
    `Filler rate: ${formatDelta(curr.filler_pct, prev?.filler_pct ?? null, "%")}`,
    `Unique vocab: ${formatDelta(curr.vocab, prev?.vocab ?? null)}`,
    `Response latency: ${formatDelta(curr.latency_sec, prev?.latency_sec ?? null, "s")}`,
    `Quality flags: ${curr.quality_flags.join(", ") || "none"}`,
  ];
  if (!prev) lines.unshift("(No previous lesson to compare.)");
  return lines.join("\n");
}

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  if (!url || !key || !anthropicKey) {
    console.error(
      "Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and ANTHROPIC_API_KEY.",
    );
    process.exit(1);
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false },
  });
  const anthropic = new Anthropic({ apiKey: anthropicKey });

  const { data: lessons, error } = await supabase
    .from("lesson_metrics")
    .select(
      "lesson_id, student_id, happened_at, duration_min, student_word_count, talk_ratio_pct, wpm, clarity, filler_pct, vocab, latency_sec, quality_flags",
    )
    .order("student_id")
    .order("happened_at");
  if (error) throw error;
  if (!lessons) return;

  const byStudent = new Map<string, LessonMetric[]>();
  for (const l of lessons as LessonMetric[]) {
    if (!byStudent.has(l.student_id)) byStudent.set(l.student_id, []);
    byStudent.get(l.student_id)!.push(l);
  }

  for (const [, series] of byStudent) {
    for (let i = 0; i < series.length; i++) {
      const curr = series[i];
      const prev = i > 0 ? series[i - 1] : null;
      const userMessage = buildUserMessage(curr, prev);

      const resp = await anthropic.messages.create({
        model: MODEL,
        max_tokens: 300,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      });
      const content = resp.content
        .filter((c) => c.type === "text")
        .map((c) => ("text" in c ? c.text : ""))
        .join("\n")
        .trim();

      await supabase
        .from("lesson_insights")
        .delete()
        .eq("lesson_id", curr.lesson_id);
      const { error: insErr } = await supabase.from("lesson_insights").insert({
        lesson_id: curr.lesson_id,
        model: MODEL,
        prompt_version: PROMPT_VERSION,
        content,
      });
      if (insErr) throw insErr;
      console.log(`insight written for ${curr.lesson_id}`);
    }
  }
  console.log("done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
