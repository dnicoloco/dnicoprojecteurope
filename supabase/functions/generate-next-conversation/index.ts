// Supabase Edge Function: generate-next-conversation
// POST /functions/v1/generate-next-conversation  { "student_id": "<uuid>" }
//
// Reads the student's topic + skill coverage, their most recent lesson transcript for
// tone and two journey quotes (early lesson + recent lesson), asks Claude Opus 4.6 to
// produce the Next Conversation card, writes a row into next_conversations.
// deno-lint-ignore-file

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MODEL = "claude-opus-4-6";
const ALGO_VERSION = "2.0.0";
const PROMPT_VERSION = "next.1";

const SYSTEM_PROMPT = `You are a Preply coach designing the ONE conversation a student is almost ready to have but cannot have today.

You get:
- the student's profile (name, level, interests)
- their topic coverage (which topics they've talked about, how often, who led)
- their skill coverage (which skills they use naturally, attempt, or avoid)
- a catalogue of valid topic_ids and skill_ids
- two real quotes, one from an early lesson and one from a recent lesson

Return ONLY JSON with this shape:
{
  "title": "<short, specific, emotionally concrete>",
  "scenario": "<1-2 sentence real-world setup>",
  "dialogue": [ { "speaker": "them", "text": "..." }, { "speaker": "you", "text": "..." } ],   // 6 exchanges
  "target_skill_ids": [ "<catalogue ids>" ],
  "target_topic_ids": [ "<catalogue ids>" ],
  "blockers": [
    { "kind": "skill"|"word"|"register", "label": "<short>", "why": "<grounded in their data>" }
  ],
  "coverage_pct": <0-100 integer, reflecting how much of target_skill_ids they already use naturally>,
  "projected_lessons_needed": <integer 1-8>,
  "tutor_briefing": {
    "top_blocker": "...",
    "avoided_topics": [ "<topic_ids>" ],
    "prompt_to_elicit": "<exact line the tutor should say>",
    "phrase_to_introduce": "<new phrase or construction>",
    "morale_line": "<praise grounded in their real recent lesson>"
  }
}
Rules:
- Do not invent topic_ids or skill_ids. Use only catalogue values.
- The dialogue must reflect their REAL interests and likely situation.
- Exactly 3 blockers, grounded in the coverage data.
- No em dashes anywhere.`;

async function callClaude(user: string) {
  const apiKey = Deno.env.get("CLAUDE_API_KEY");
  if (!apiKey) throw new Error("CLAUDE_API_KEY is not set");
  const resp = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: user }],
    }),
  });
  if (!resp.ok) throw new Error(`Claude API ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  const textBlock = data.content?.find((c: any) => c.type === "text");
  const raw = String(textBlock.text).trim().replace(/^```json|```$/g, "").trim();
  return { parsed: JSON.parse(raw), usage: data.usage };
}

function projectedReadyDate(lessons: number): string {
  // Estimate one lesson per week by default.
  const d = new Date();
  d.setDate(d.getDate() + lessons * 7);
  return d.toISOString().slice(0, 10);
}

serve(async (req) => {
  try {
    const { student_id } = await req.json();
    if (!student_id) return new Response("student_id required", { status: 400 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const { data: student } = await supabase
      .from("students")
      .select("id, name, level, interests, tutor_id, native_lang, learning_lang")
      .eq("id", student_id)
      .single();
    if (!student) return new Response("student not found", { status: 404 });

    const { data: lessons } = await supabase
      .from("lessons")
      .select("id, happened_at")
      .eq("student_id", student_id)
      .order("happened_at");
    if (!lessons?.length) return new Response("no lessons yet", { status: 400 });

    const firstLesson = lessons[0];
    const lastLesson = lessons[lessons.length - 1];

    const pickQuote = async (lessonId: string) => {
      const { data } = await supabase
        .from("skill_events")
        .select("evidence_quote, created_at")
        .eq("lesson_id", lessonId)
        .not("evidence_quote", "is", null)
        .order("confidence", { ascending: false })
        .limit(1);
      return data?.[0]?.evidence_quote ?? null;
    };
    const journeyFrom = await pickQuote(firstLesson.id);
    const journeyTo = await pickQuote(lastLesson.id);

    const { data: topicCoverage } = await supabase
      .from("student_topic_coverage")
      .select("*")
      .eq("student_id", student_id);
    const { data: skillCoverage } = await supabase
      .from("student_skill_coverage")
      .select("*")
      .eq("student_id", student_id);
    const { data: topics } = await supabase.from("topics").select("id, name, min_level");
    const { data: skills } = await supabase.from("skills").select("id, name, min_level");

    const { data: run, error: runErr } = await supabase
      .from("generation_runs")
      .insert({
        student_id,
        run_kind: "next_conversation",
        model: MODEL,
        prompt_version: PROMPT_VERSION,
        algo_version: ALGO_VERSION,
        status: "pending",
      })
      .select("id")
      .single();
    if (runErr || !run) throw runErr ?? new Error("failed to create run");

    try {
      const user = JSON.stringify({
        student,
        topic_coverage: topicCoverage,
        skill_coverage: skillCoverage,
        topic_catalogue: topics,
        skill_catalogue: skills,
        journey_from_quote: journeyFrom,
        journey_to_quote: journeyTo,
      });
      const { parsed, usage } = await callClaude(user);

      // Supersede previous current card.
      await supabase
        .from("next_conversations")
        .update({ status: "superseded" })
        .eq("student_id", student_id)
        .eq("status", "current");

      const lessonsNeeded = Number(parsed.projected_lessons_needed ?? 3);

      const { error: insErr } = await supabase.from("next_conversations").insert({
        student_id,
        target_topic_id: parsed.target_topic_ids?.[0] ?? null,
        title: parsed.title,
        scenario: parsed.scenario,
        dialogue: parsed.dialogue,
        target_skill_ids: parsed.target_skill_ids ?? [],
        target_topic_ids: parsed.target_topic_ids ?? [],
        blockers: parsed.blockers ?? [],
        coverage_pct: Math.max(0, Math.min(100, Number(parsed.coverage_pct ?? 50))),
        journey_from_quote: journeyFrom,
        journey_from_lesson: 1,
        journey_from_date: firstLesson.happened_at,
        journey_to_quote: journeyTo,
        journey_to_lesson: lessons.length,
        journey_to_date: lastLesson.happened_at,
        projected_ready_date: projectedReadyDate(lessonsNeeded),
        projected_lessons_needed: lessonsNeeded,
        tutor_briefing: parsed.tutor_briefing ?? null,
        run_id: run.id,
        status: "current",
      });
      if (insErr) throw insErr;

      await supabase
        .from("generation_runs")
        .update({
          status: "ok",
          completed_at: new Date().toISOString(),
          token_usage: usage,
        })
        .eq("id", run.id);

      return Response.json({ run_id: run.id });
    } catch (err) {
      await supabase
        .from("generation_runs")
        .update({
          status: "error",
          completed_at: new Date().toISOString(),
          error: String(err),
        })
        .eq("id", run.id);
      throw err;
    }
  } catch (err) {
    return new Response(String(err), { status: 500 });
  }
});
