// Supabase Edge Function: tts
// Caches ElevenLabs v3 output in a public Storage bucket so repeat plays are free.
// POST /functions/v1/tts  { "text": "...", "speaker": "student" | "other" }
// Returns JSON { url } pointing at the cached MP3.
// deno-lint-ignore-file

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const VOICES: Record<string, string> = {
  student: "Z3R5wn05IrDiVCyEkUrK",
  other: "BIvP0GN1cAtSRTxNHnWS",
};

const BUCKET = "tts_cache";

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

async function sha1Hex(s: string): Promise<string> {
  const bytes = new TextEncoder().encode(s);
  const digest = await crypto.subtle.digest("SHA-1", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    const { text, speaker = "student" } = await req.json();
    if (!text || typeof text !== "string") {
      return json({ error: "text required" }, 400);
    }
    const voiceId = VOICES[speaker] ?? VOICES.student;

    // Supabase env
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Read the ElevenLabs key from either casing.
    const elevenKey =
      Deno.env.get("ELEVENLABS_API_KEY") ??
      Deno.env.get("elevenlabs_api_key");
    if (!elevenKey) {
      return json({ error: "elevenlabs_api_key missing" }, 500);
    }

    // Cache key: hash of (voice, text). Stable across reruns of the same text.
    const hash = await sha1Hex(`${voiceId}::${text}`);
    const path = `${hash}.mp3`;
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`;

    // Check cache
    const head = await fetch(publicUrl, { method: "HEAD" });
    if (head.ok) {
      return json({ url: publicUrl, cached: true });
    }

    // Miss: generate
    const elevenResp = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": elevenKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_v3",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0,
            use_speaker_boost: true,
          },
        }),
      },
    );

    if (!elevenResp.ok) {
      const err = await elevenResp.text();
      return json(
        { error: `ElevenLabs ${elevenResp.status}: ${err}` },
        500,
      );
    }

    const audioBytes = new Uint8Array(await elevenResp.arrayBuffer());

    // Upload to storage (service-role, upserts on same path).
    const uploadResp = await fetch(
      `${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "audio/mpeg",
          "x-upsert": "true",
          "Cache-Control": "public, max-age=31536000, immutable",
        },
        body: audioBytes,
      },
    );

    if (!uploadResp.ok) {
      // If the upload failed, still return the audio inline so the UI works.
      return new Response(audioBytes, {
        status: 200,
        headers: {
          ...CORS,
          "Content-Type": "audio/mpeg",
          "X-TTS-Cache": "bypass",
        },
      });
    }

    return json({ url: publicUrl, cached: false });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
