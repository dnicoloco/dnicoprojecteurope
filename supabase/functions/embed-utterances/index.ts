// Edge function: embed-utterances
// POST /functions/v1/embed-utterances  { "batch_size"?: 50, "student_id"?: "<uuid>" }
// Finds utterances without embeddings, sends to OpenAI text-embedding-3-small,
// upserts into utterance_embeddings. Set OPENAI_API_KEY as a Supabase secret.
// deno-lint-ignore-file

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MODEL = "text-embedding-3-small";
const DIM = 1536;
const PROMPT_VERSION = "v1";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

async function embed(texts: string[], apiKey: string): Promise<number[][]> {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODEL, input: texts }),
  });
  if (!resp.ok) {
    throw new Error(`OpenAI ${resp.status}: ${await resp.text()}`);
  }
  const data = await resp.json();
  return data.data.map((d: { embedding: number[] }) => d.embedding);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  try {
    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "OPENAI_API_KEY not set" }, 500);

    const body = await req.json().catch(() => ({} as Record<string, unknown>));
    const batchSize = Math.min(
      Math.max(Number(body.batch_size ?? 50), 1),
      100,
    );
    const studentId = typeof body.student_id === "string" ? body.student_id : null;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    // Pull utterances with no embedding yet, capped at batchSize.
    let q = supabase
      .from("lesson_utterances")
      .select("id,text")
      .not("id", "in", `(select utterance_id from utterance_embeddings)`)
      .limit(batchSize);
    if (studentId) q = q.eq("student_id", studentId);
    // NOTE: using a not-in subquery via PostgREST is tricky; we'll use an RPC fallback.
    const { data: pending, error } = await supabase.rpc("pending_utterance_embeddings", {
      p_limit: batchSize,
      p_student_id: studentId,
    });
    if (error) throw error;
    if (!pending || pending.length === 0) {
      return json({ embedded: 0, remaining: 0, note: "nothing pending" });
    }

    const texts = (pending as { id: string; text: string }[]).map((r) => r.text);
    const vectors = await embed(texts, apiKey);
    if (vectors.length !== pending.length) {
      throw new Error(
        `embedding count mismatch: got ${vectors.length} for ${pending.length} inputs`,
      );
    }

    const rows = (pending as { id: string; text: string }[]).map((p, i) => ({
      utterance_id: p.id,
      // pgvector expects a string literal like "[0.1,0.2,...]"
      embedding: `[${vectors[i].join(",")}]`,
      model: MODEL,
      prompt_version: PROMPT_VERSION,
      token_count: null,
    }));

    const { error: upErr } = await supabase
      .from("utterance_embeddings")
      .upsert(rows, { onConflict: "utterance_id" });
    if (upErr) throw upErr;

    // How many left?
    const { count } = await supabase
      .from("lesson_utterances")
      .select("id", { count: "exact", head: true });
    const { count: done } = await supabase
      .from("utterance_embeddings")
      .select("utterance_id", { count: "exact", head: true });
    return json({
      embedded: rows.length,
      dim: DIM,
      remaining: Math.max(0, (count ?? 0) - (done ?? 0)),
    });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
