// Edge function: search-utterances
// POST /functions/v1/search-utterances
//   { "query": "times I disagreed", "student_id": "<uuid>", "top"?: 10 }
// Embeds the query with OpenAI, runs match_utterances (blended vector + tsvector)
// and returns enriched results with lesson metadata.
// deno-lint-ignore-file

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const MODEL = "text-embedding-3-small";

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

async function embed(text: string, apiKey: string): Promise<number[]> {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: MODEL, input: text }),
  });
  if (!resp.ok) throw new Error(`OpenAI ${resp.status}: ${await resp.text()}`);
  const data = await resp.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  try {
    const { query, student_id, top } = await req.json();
    if (!query || typeof query !== "string")
      return json({ error: "query required" }, 400);
    if (!student_id || typeof student_id !== "string")
      return json({ error: "student_id required" }, 400);

    const apiKey = Deno.env.get("OPENAI_API_KEY");
    if (!apiKey) return json({ error: "OPENAI_API_KEY not set" }, 500);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );

    const vector = await embed(query, apiKey);
    const embeddingLiteral = `[${vector.join(",")}]`;

    const { data: matches, error } = await supabase.rpc("match_utterances", {
      p_student_id: student_id,
      p_query_text: query,
      p_query_embedding: embeddingLiteral,
      p_top: Math.min(Math.max(Number(top ?? 10), 1), 50),
      p_min_word_count: 4,
    });
    if (error) throw error;

    return json({ query, count: matches?.length ?? 0, results: matches ?? [] });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
