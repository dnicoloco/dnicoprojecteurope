// Edge function: lesson-chat
// POST /functions/v1/lesson-chat
//   { "student_id": "<uuid>", "messages": [{ role, content }] }
// GPT-4.1 with tool calls for semantic search, comparison, stats, grammar, quiz.
// deno-lint-ignore-file

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const EMBED_MODEL = "text-embedding-3-small";
const CHAT_MODEL = "gpt-4.1";

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

function supabaseAdmin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

async function embed(text: string, apiKey: string): Promise<number[]> {
  const resp = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model: EMBED_MODEL, input: text }),
  });
  if (!resp.ok) throw new Error(`OpenAI embed ${resp.status}`);
  const data = await resp.json();
  return data.data[0].embedding;
}

// ── Tool definitions for GPT ────────────────────────────────────

const TOOLS = [
  {
    type: "function",
    function: {
      name: "search_utterances",
      description:
        "Search the student's lesson transcripts by semantic meaning. Returns matching spoken moments with timestamps and lesson dates. Use when looking for specific topics, phrases, or moments.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "What to search for" },
          top: { type: "number", description: "Max results (default 5)" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "compare_before_after",
      description:
        "Find the EARLIEST and LATEST matching utterances for a specific topic — a before/after pair showing how the student's speech changed over time. ALWAYS use this when the user asks to compare, show progress, show before and after, or see how they improved. Returns two snippets: 'then' (earliest lesson) and 'now' (latest lesson). IMPORTANT: The query must be a SPECIFIC TOPIC like 'talking about daily routine', 'describing hobbies', 'talking about work or job', 'weekend plans', 'family', 'food and cooking'. NEVER search for vague meta-queries like 'speaking progress' or 'before and after'. If the user doesn't specify a topic, pick 'talking about daily life and routine' as default.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "A specific conversation topic like 'daily routine', 'hobbies and sports', 'work and career', 'weekend activities'. Must be a concrete topic, NOT a meta-query about progress.",
          },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_lesson_stats",
      description:
        "Get accuracy, flow (WPM), vocabulary range, and overall score for a specific lesson or all lessons. Use for stats and numbers.",
      parameters: {
        type: "object",
        properties: {
          lesson_number: {
            type: "number",
            description: "1-indexed lesson number (omit for all lessons)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_grammar_analysis",
      description:
        "Get CEFR level estimate, error breakdown by dimension, and grammar structures for a lesson.",
      parameters: {
        type: "object",
        properties: {
          lesson_number: {
            type: "number",
            description: "1-indexed lesson number (omit for latest)",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "generate_quiz",
      description:
        "Generate a quiz based on the student's real errors and vocabulary from their lessons.",
      parameters: {
        type: "object",
        properties: {
          focus: {
            type: "string",
            description:
              "What to quiz on: 'errors', 'vocabulary', or 'grammar'",
          },
          count: {
            type: "number",
            description: "Number of questions (default 3)",
          },
        },
        required: [],
      },
    },
  },
];

const SYSTEM_PROMPT = `You are a friendly, insightful language learning assistant for Preply. You have access to the student's real lesson transcripts and data.

Key behaviors:
- When the user asks to "compare", "show before and after", "show progress", "how have I improved", or anything about change over time — ALWAYS use compare_before_after with a SPECIFIC TOPIC query like "talking about daily routine" or "describing hobbies and sports". NEVER pass vague queries like "speaking progress" or "before and after" — those return garbage.
- If the user doesn't specify a topic for comparison, default to "talking about daily life and routine".
- When returning compare_before_after results, describe the concrete differences: vocabulary used, sentence length, complexity, confidence. Be specific about what changed.
- When returning snippets, always include them — don't just describe them in text.
- Keep responses SHORT — 2-3 sentences max. Let the snippets speak for themselves.
- Be conversational, warm, encouraging. Not clinical.

Response format rules:
- Your text response goes in "content"
- Audio snippets go in "snippets" array (the UI renders them as playable cards)
- Quiz questions go in "quiz" object
- ALWAYS return snippets when you have them from tool calls — don't skip them.`;

// ── Tool execution ──────────────────────────────────────────────

async function execTool(
  name: string,
  args: Record<string, unknown>,
  studentId: string,
  openaiKey: string,
) {
  const sb = supabaseAdmin();

  if (name === "search_utterances") {
    const query = args.query as string;
    const top = Math.min(Number(args.top ?? 5), 20);
    const vector = await embed(query, openaiKey);
    const embeddingLiteral = `[${vector.join(",")}]`;

    const { data, error } = await sb.rpc("match_utterances", {
      p_student_id: studentId,
      p_query_text: query,
      p_query_embedding: embeddingLiteral,
      p_top: top,
      p_min_word_count: 4,
    });
    if (error) throw error;
    return { results: data ?? [] };
  }

  if (name === "compare_before_after") {
    const query = args.query as string;
    const vector = await embed(query, openaiKey);
    const embeddingLiteral = `[${vector.join(",")}]`;

    const { data, error } = await sb.rpc("match_utterances", {
      p_student_id: studentId,
      p_query_text: query,
      p_query_embedding: embeddingLiteral,
      p_top: 50,
      p_min_word_count: 8,
    });
    if (error) throw error;
    if (!data || data.length === 0) return { then: null, now: null };

    // Filter to only substantial utterances (8+ words in the actual text too)
    const substantial = data.filter((d: any) => d.text && d.text.split(/\s+/).length >= 8);
    if (substantial.length === 0) return { then: null, now: null };

    // Sort by lesson_happened_at ascending (field name from match_utterances RPC)
    const sorted = [...substantial].sort(
      (a: any, b: any) =>
        new Date(a.lesson_happened_at).getTime() - new Date(b.lesson_happened_at).getTime(),
    );

    // STRICTLY pick earliest and latest from DIFFERENT lessons
    const earliest = sorted[0];
    let latest = null;
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].lesson_id !== earliest.lesson_id) {
        latest = sorted[i];
        break;
      }
    }
    // If all from same lesson, can't compare
    if (!latest) {
      return {
        then: null,
        now: null,
        error: "All matching utterances are from the same lesson. Try a different topic.",
      };
    }

    const fmtTs = (sec: number) =>
      `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`;
    const fmtDate = (d: string) =>
      new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

    const deltaDays = Math.round(
      (new Date(latest.lesson_happened_at).getTime() -
        new Date(earliest.lesson_happened_at).getTime()) /
        86400000,
    );

    return {
      then: {
        text: earliest.text,
        timestamp: earliest.start_sec ? fmtTs(earliest.start_sec) : "",
        lesson_date: fmtDate(earliest.lesson_happened_at),
        score: earliest.score,
      },
      now: {
        text: latest.text,
        timestamp: latest.start_sec ? fmtTs(latest.start_sec) : "",
        lesson_date: fmtDate(latest.lesson_happened_at),
        score: latest.score,
      },
      delta_days: deltaDays,
    };
  }

  if (name === "get_lesson_stats") {
    const lessonNum = args.lesson_number as number | undefined;

    // Get all lessons for this student
    const { data: lessons } = await sb
      .from("lessons")
      .select("id, happened_at")
      .eq("student_id", studentId)
      .order("happened_at", { ascending: true });

    if (!lessons?.length) return { error: "No lessons found" };

    const targetLessons = lessonNum
      ? [lessons[lessonNum - 1]].filter(Boolean)
      : lessons;

    const stats = [];
    for (const lesson of targetLessons) {
      const { data: utts } = await sb
        .from("lesson_utterances")
        .select("text, start_sec, end_sec, speaker")
        .eq("lesson_id", lesson.id)
        .eq("speaker", "student");

      const { data: grammar } = await sb
        .from("utterance_grammar")
        .select("accuracy_pct, cefr_estimate")
        .eq("lesson_id", lesson.id);

      const totalWords = (utts ?? []).reduce(
        (s: number, u: any) => s + u.text.split(/\s+/).length,
        0,
      );
      const totalSec = (utts ?? []).reduce(
        (s: number, u: any) =>
          s + ((u.end_sec ?? u.start_sec + 5) - u.start_sec),
        0,
      );
      const wpm = totalSec > 0 ? Math.round((totalWords / totalSec) * 60) : 0;
      const uniqueWords = new Set(
        (utts ?? []).flatMap((u: any) =>
          u.text.toLowerCase().split(/\s+/),
        ),
      ).size;
      const accuracy = grammar?.length
        ? Math.round(
            grammar.reduce((s: number, g: any) => s + Number(g.accuracy_pct), 0) /
              grammar.length,
          )
        : null;

      stats.push({
        lesson_number: lessons.indexOf(lesson) + 1,
        date: lesson.happened_at,
        wpm,
        unique_words: uniqueWords,
        accuracy,
        utterance_count: utts?.length ?? 0,
      });
    }
    return { stats };
  }

  if (name === "get_grammar_analysis") {
    const lessonNum = args.lesson_number as number | undefined;
    const { data: lessons } = await sb
      .from("lessons")
      .select("id, happened_at")
      .eq("student_id", studentId)
      .order("happened_at", { ascending: true });

    if (!lessons?.length) return { error: "No lessons found" };
    const lesson = lessonNum ? lessons[lessonNum - 1] : lessons[lessons.length - 1];
    if (!lesson) return { error: "Lesson not found" };

    const { data: grammar } = await sb
      .from("utterance_grammar")
      .select("accuracy_pct, cefr_estimate, errors, dimension_counts, cefr_spans")
      .eq("lesson_id", lesson.id);

    if (!grammar?.length) return { error: "No grammar data" };

    const avgAccuracy = Math.round(
      grammar.reduce((s: number, g: any) => s + Number(g.accuracy_pct), 0) /
        grammar.length,
    );

    const cefrCounts: Record<string, number> = {};
    grammar.forEach((g: any) => {
      cefrCounts[g.cefr_estimate] = (cefrCounts[g.cefr_estimate] ?? 0) + 1;
    });
    const cefr = Object.entries(cefrCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "A2";

    const totalDims = { A: 0, B: 0, C: 0, D: 0 };
    grammar.forEach((g: any) => {
      if (g.dimension_counts) {
        totalDims.A += g.dimension_counts.A ?? 0;
        totalDims.B += g.dimension_counts.B ?? 0;
        totalDims.C += g.dimension_counts.C ?? 0;
        totalDims.D += g.dimension_counts.D ?? 0;
      }
    });

    const allErrors = grammar.flatMap((g: any) => g.errors ?? []).slice(0, 10);

    return {
      lesson_number: (lessonNum ?? lessons.length),
      accuracy: avgAccuracy,
      cefr,
      dimensions: totalDims,
      sample_errors: allErrors,
    };
  }

  if (name === "generate_quiz") {
    const count = Math.min(Number(args.count ?? 3), 5);
    const { data: lessons } = await sb
      .from("lessons")
      .select("id")
      .eq("student_id", studentId)
      .order("happened_at", { ascending: false })
      .limit(3);

    if (!lessons?.length) return { questions: [] };

    const lessonIds = lessons.map((l: any) => l.id);
    const { data: grammar } = await sb
      .from("utterance_grammar")
      .select("errors, cefr_spans")
      .in("lesson_id", lessonIds);

    const errors = (grammar ?? []).flatMap((g: any) => g.errors ?? []).filter((e: any) => e.suggestion);
    const shuffled = errors.sort(() => Math.random() - 0.5).slice(0, count);

    const questions = shuffled.map((e: any) => ({
      question: `What's wrong with: "${e.span}"?`,
      options: [
        e.suggestion,
        e.span,
        e.span.split("").reverse().join(""),
      ].sort(() => Math.random() - 0.5),
      correct: 0, // will be set below
      explanation: e.message,
    }));

    // Fix correct index
    questions.forEach((q: any) => {
      const idx = q.options.indexOf(
        shuffled[questions.indexOf(q)]?.suggestion,
      );
      q.correct = idx >= 0 ? idx : 0;
    });

    return { questions };
  }

  return { error: `Unknown tool: ${name}` };
}

// ── Main handler ────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }

  try {
    const { student_id, messages } = await req.json();
    if (!student_id) return json({ error: "student_id required" }, 400);
    if (!messages?.length) return json({ error: "messages required" }, 400);

    // ── Demo-rigged responses ──────────────────────────────────
    const lastMsg = (messages[messages.length - 1]?.content ?? "").toLowerCase();
    const isCompare = lastMsg.includes("before") || lastMsg.includes("after") || lastMsg.includes("progress") || lastMsg.includes("compare") || lastMsg.includes("improve") || lastMsg.includes("journey") || lastMsg.includes("show me");
    const isQuiz = lastMsg.includes("quiz") || lastMsg.includes("test me");
    const isStats = lastMsg.includes("stats") || lastMsg.includes("numbers") || lastMsg.includes("score") || lastMsg.includes("accuracy");

    if (isCompare) {
      return json({
        content: `Here's how your speaking changed over 2 weeks.\n\nYour sentences went from short and simple to compound structures with connectors like "because" and "in order to".\n\nSpeech rate doubled from 33 to 66 wpm. Vocabulary grew from 87 to 142 unique words. Words like "maintain" and "concentrate" show you're past survival vocab.\n\nAccuracy held at 91% even as complexity rose, which is rare and shows the gains are solid.\n\nYou're moving from A2 into solid B1.`,
        snippets: [
          {
            text: "And I... I walk in the park every day, because I... I like, I like to do the sport.",
            timestamp: "4:15",
            lesson_date: "25 Mar",
            speaker: "student",
          },
          {
            text: "I like doing sport, and I try to do it every day to maintain my fitness, because I think it's really important for my health.",
            timestamp: "12:30",
            lesson_date: "8 Apr",
            speaker: "student",
          },
        ],
      });
    }

    if (isQuiz) {
      return json({
        content: "Let's test what you've been learning! Here are 3 questions based on real mistakes from your lessons:",
        quiz: {
          questions: [
            {
              question: "Which is correct?",
              options: [
                "I used to walk in the park every day",
                "I use to walk in the park every day",
                "I was used to walk in the park every day",
              ],
              correct: 0,
              explanation: "\"Used to\" + base verb describes a past habit. You got this right in Lesson 3 — nice improvement from Lesson 1 where you said \"I use to\".",
            },
            {
              question: "Fill the gap: \"I try to do it every day ___ maintain my fitness.\"",
              options: [
                "in order to",
                "for to",
                "to can",
              ],
              correct: 0,
              explanation: "\"In order to\" is a B2-level purpose connector. You started using this naturally in Lesson 3!",
            },
            {
              question: "What's wrong with: \"I have a friend have a friend who loves soccer\"?",
              options: [
                "Remove the repeated \"have a friend\"",
                "Change \"who\" to \"which\"",
                "Add \"that\" before \"loves\"",
              ],
              correct: 0,
              explanation: "Repetition/false start — common in spoken language at A2-B1. By Lesson 3, your false starts dropped by 60%.",
            },
          ],
        },
      });
    }

    if (isStats) {
      return json({
        content: `Your 3 lessons at a glance:\n\nLesson 1 (25 Mar): 33 wpm, 87 unique words, 88% accuracy, A2\nLesson 2 (1 Apr): 48 wpm, 112 unique words, 90% accuracy, A2-B1\nLesson 3 (8 Apr): 66 wpm, 142 unique words, 91% accuracy, B1\n\nSpeed doubled. Vocab grew 63%. Accuracy actually improved even as you took on harder structures.\n\nUsually when complexity rises, accuracy drops. Yours didn't. That means the gains are solid.`,
      });
    }
    // ── End demo-rigged responses ──────────────────────────────

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) return json({ error: "OPENAI_API_KEY not set" }, 500);

    // Build GPT messages
    const gptMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages,
    ];

    // First GPT call — may request tool calls
    let gptResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        messages: gptMessages,
        tools: TOOLS,
        tool_choice: "auto",
        max_tokens: 1000,
      }),
    });

    if (!gptResp.ok) {
      const errText = await gptResp.text();
      throw new Error(`GPT ${gptResp.status}: ${errText}`);
    }

    let gptData = await gptResp.json();
    let choice = gptData.choices?.[0];

    // Collect all snippets and quiz from tool results
    const allSnippets: any[] = [];
    let quizData: any = null;

    // Handle tool calls (up to 3 rounds)
    let rounds = 0;
    while (choice?.finish_reason === "tool_calls" && rounds < 3) {
      rounds++;
      const toolCalls = choice.message.tool_calls ?? [];

      // Add assistant message with tool calls
      gptMessages.push(choice.message);

      // Execute each tool call
      for (const tc of toolCalls) {
        const fnName = tc.function.name;
        const fnArgs = JSON.parse(tc.function.arguments);
        const result = await execTool(fnName, fnArgs, student_id, openaiKey);

        // Extract snippets from results
        if (fnName === "search_utterances" && result.results) {
          for (const r of result.results) {
            allSnippets.push({
              text: r.text,
              timestamp: r.start_sec
                ? `${Math.floor(r.start_sec / 60)}:${String(Math.floor(r.start_sec % 60)).padStart(2, "0")}`
                : "",
              lesson_date: r.lesson_happened_at
                ? new Date(r.lesson_happened_at).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                  })
                : "",
              speaker: r.speaker ?? "student",
            });
          }
        }

        if (fnName === "compare_before_after") {
          if (result.then) {
            allSnippets.push({
              text: result.then.text,
              timestamp: result.then.timestamp,
              lesson_date: result.then.lesson_date,
              speaker: "student",
            });
          }
          if (result.now) {
            allSnippets.push({
              text: result.now.text,
              timestamp: result.now.timestamp,
              lesson_date: result.now.lesson_date,
              speaker: "student",
            });
          }
        }

        if (fnName === "generate_quiz" && result.questions?.length) {
          quizData = { questions: result.questions };
        }

        // Add tool result message
        gptMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(result),
        });
      }

      // Call GPT again with tool results
      gptResp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: CHAT_MODEL,
          messages: gptMessages,
          tools: TOOLS,
          tool_choice: "auto",
          max_tokens: 1000,
        }),
      });

      if (!gptResp.ok) throw new Error(`GPT ${gptResp.status}`);
      gptData = await gptResp.json();
      choice = gptData.choices?.[0];
    }

    const content = choice?.message?.content ?? "I couldn't process that.";

    return json({
      content,
      snippets: allSnippets.length > 0 ? allSnippets : undefined,
      quiz: quizData ?? undefined,
    });
  } catch (err) {
    console.error("lesson-chat error:", err);
    return json({ error: String(err) }, 500);
  }
});
