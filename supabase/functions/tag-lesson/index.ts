// Supabase Edge Function: tag-lesson
// POST /functions/v1/tag-lesson  { "lesson_id": "<uuid>" }
//
// Reads every segment of a lesson, asks Claude Opus 4.6 to tag topics and skills,
// writes rows to topic_segments + skill_events. Never exposes the API key to the client.
//
// Set secrets on deploy:
//   supabase secrets set CLAUDE_API_KEY=sk-ant-...
//
// Uses the project's service-role key from env automatically.
// deno-lint-ignore-file

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MODEL = "claude-opus-4-6";
const ALGO_VERSION = "2.0.0";
const PROMPT_VERSION = "tag.1";

const SYSTEM_PROMPT = `You are analysing a single 5-minute segment of a live Preply language lesson.
You are given:
- the student channel transcript
- the tutor channel transcript
- a catalogue of valid topic_ids and skill_ids

Return ONLY valid JSON matching this exact shape:
{
  "topics": [
    { "topic_id": "<one of the catalogue>", "confidence": 0-1, "introduced_by": "student"|"tutor", "evidence_quote": "<quote from the student>" }
  ],
  "skills": [
    { "skill_id": "<catalogue>", "topic_id": "<catalogue or null>", "status": "used_naturally"|"attempted_ok"|"attempted_wrong"|"corrected_by_tutor"|"scaffolded_by_tutor"|"avoided_opportunity", "confidence": 0-1, "evidence_quote": "<student sentence>", "tutor_response": "<what the tutor said right after, or empty>" }
  ]
}
Rules:
- Only use topic_id and skill_id values from the catalogue. Never invent new ones.
- Only include items you can directly quote as evidence.
- Status 'avoided_opportunity' is only for when the tutor explicitly invited the skill and the student dodged.
- If the student says almost nothing of note, return empty arrays.
- Do not add explanation text. JSON only.`;

type TopicRow = { id: string };
type SkillRow = { id: string };

async function callClaude(userContent: string) {
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
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userContent }],
    }),
  });
  if (!resp.ok) {
    throw new Error(`Claude API ${resp.status}: ${await resp.text()}`);
  }
  const data = await resp.json();
  const textBlock = data.content?.find((c: any) => c.type === "text");
  if (!textBlock) throw new Error("Claude returned no text block");
  // Strip code fences if present.
  const raw = String(textBlock.text).trim().replace(/^```json|```$/g, "").trim();
  return { parsed: JSON.parse(raw), usage: data.usage };
}

serve(async (req) => {
  try {
    const { lesson_id } = await req.json();
    if (!lesson_id) return new Response("lesson_id required", { status: 400 });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Load the lesson + its segments + catalogues.
    const { data: lesson } = await supabase
      .from("lessons")
      .select("id, student_id, tutor_id")
      .eq("id", lesson_id)
      .single();
    if (!lesson) return new Response("lesson not found", { status: 404 });

    const { data: segments } = await supabase
      .from("lesson_segments")
      .select("id, segment_index, raw")
      .eq("lesson_id", lesson_id)
      .order("segment_index");
    if (!segments?.length) return new Response("no segments", { status: 404 });

    const { data: topics } = await supabase.from("topics").select("id");
    const { data: skills } = await supabase.from("skills").select("id");
    const topicIds = (topics ?? []).map((t: TopicRow) => t.id);
    const skillIds = (skills ?? []).map((s: SkillRow) => s.id);

    // Start a generation run.
    const { data: run, error: runErr } = await supabase
      .from("generation_runs")
      .insert({
        lesson_id,
        student_id: lesson.student_id,
        run_kind: "tag_lesson",
        model: MODEL,
        prompt_version: PROMPT_VERSION,
        algo_version: ALGO_VERSION,
        status: "pending",
      })
      .select("id")
      .single();
    if (runErr || !run) throw runErr ?? new Error("failed to create run");

    const tokenUsage: any = { input: 0, output: 0 };

    try {
      for (const seg of segments) {
        const raw = seg.raw as any;
        // Skip stub rows that haven't been backfilled with real transcripts yet.
        if (raw?.stub === true) continue;
        const stuTranscript =
          raw?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
        const tutTranscript =
          raw?.results?.channels?.[1]?.alternatives?.[0]?.transcript ?? "";

        const userContent = [
          `VALID_TOPIC_IDS: ${topicIds.join(", ")}`,
          `VALID_SKILL_IDS: ${skillIds.join(", ")}`,
          `STUDENT transcript:`,
          stuTranscript,
          `TUTOR transcript:`,
          tutTranscript,
        ].join("\n");

        const { parsed, usage } = await callClaude(userContent);
        tokenUsage.input += usage?.input_tokens ?? 0;
        tokenUsage.output += usage?.output_tokens ?? 0;

        const topicRows = (parsed.topics ?? []).map((t: any) => ({
          segment_id: seg.id,
          lesson_id,
          student_id: lesson.student_id,
          topic_id: topicIds.includes(t.topic_id) ? t.topic_id : null,
          proposed_name: topicIds.includes(t.topic_id) ? null : t.topic_id,
          introduced_by:
            t.introduced_by === "student" || t.introduced_by === "tutor"
              ? t.introduced_by
              : "tutor",
          confidence: t.confidence ?? 0.6,
          evidence_quote: t.evidence_quote ?? null,
          run_id: run.id,
          algo_version: ALGO_VERSION,
        }));
        if (topicRows.length) {
          await supabase.from("topic_segments").insert(topicRows);
        }

        const skillRows = (parsed.skills ?? [])
          .filter((s: any) => skillIds.includes(s.skill_id))
          .map((s: any) => ({
            segment_id: seg.id,
            lesson_id,
            student_id: lesson.student_id,
            tutor_id: lesson.tutor_id,
            skill_id: s.skill_id,
            topic_id: topicIds.includes(s.topic_id) ? s.topic_id : null,
            status: s.status,
            evidence_quote: s.evidence_quote ?? null,
            tutor_response: s.tutor_response ?? null,
            confidence: s.confidence ?? 0.6,
            run_id: run.id,
            algo_version: ALGO_VERSION,
          }));
        if (skillRows.length) {
          await supabase.from("skill_events").insert(skillRows);
        }
      }

      await supabase
        .from("generation_runs")
        .update({
          status: "ok",
          completed_at: new Date().toISOString(),
          token_usage: tokenUsage,
        })
        .eq("id", run.id);
      return Response.json({ run_id: run.id, token_usage: tokenUsage });
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
