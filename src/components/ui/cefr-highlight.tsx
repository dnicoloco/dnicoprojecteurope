"use client";

import * as React from "react";
import { lookupCefr } from "@/lib/cefr-words";

const CEFR_BG: Record<string, string> = {
  A1: "rgba(148,163,184,0.12)",
  A2: "rgba(40,133,253,0.12)",
  B1: "rgba(255,122,172,0.15)",
  B2: "rgba(255,122,172,0.28)",
  C1: "rgba(61,218,190,0.2)",
  C2: "rgba(61,218,190,0.35)",
};
const CEFR_TEXT: Record<string, string> = {
  A1: "#64748b",
  A2: "#2885FD",
  B1: "#e8649a",
  B2: "#d4447a",
  C1: "#2DA88F",
  C2: "#1a8a72",
};

export type CefrSpan = {
  start: number;
  end: number;
  text: string;
  level: string;
  label: string;
};

// Word-level fallback (dictionary lookup)
export function CefrHighlightedText({ text }: { text: string }) {
  const words = text.split(/(\s+)/);
  return (
    <span>
      {words.map((token, i) => {
        if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
        const level = lookupCefr(token);
        if (!level || !CEFR_BG[level]) return <span key={i}>{token}</span>;
        return (
          <span
            key={i}
            className="group/word relative cursor-default rounded-[3px] px-0.5 -mx-0.5"
            style={{ backgroundColor: CEFR_BG[level], color: CEFR_TEXT[level] }}
          >
            {token}
            <span
              className="absolute -top-6 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-medium text-white bg-[#191919] opacity-0 group-hover/word:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 select-none"
              aria-hidden="true"
            >
              {level}
            </span>
          </span>
        );
      })}
    </span>
  );
}

export type GrammarError = {
  start: number;
  end: number;
  text: string;
  suggestion: string | null;
  message: string;
};

/**
 * Apply red dotted underlines to error spans within a text fragment.
 * `offsetInFull` is the character offset of `fragment` within the full utterance text,
 * so we can match error positions correctly.
 */
function applyErrors(
  fragment: string,
  errors: GrammarError[],
  offsetInFull = 0,
): React.ReactNode[] {
  // Find errors that overlap this fragment
  const fragEnd = offsetInFull + fragment.length;
  const relevant = errors
    .filter((e) => e.end > offsetInFull && e.start < fragEnd)
    .map((e) => ({
      // Clamp to fragment bounds
      localStart: Math.max(0, e.start - offsetInFull),
      localEnd: Math.min(fragment.length, e.end - offsetInFull),
      suggestion: e.suggestion,
      message: e.message,
    }))
    .sort((a, b) => a.localStart - b.localStart);

  if (relevant.length === 0) return [fragment];

  const nodes: React.ReactNode[] = [];
  let cur = 0;
  for (let i = 0; i < relevant.length; i++) {
    const r = relevant[i];
    if (r.localStart > cur) {
      nodes.push(fragment.slice(cur, r.localStart));
    }
    const errText = fragment.slice(r.localStart, r.localEnd);
    const tip = r.suggestion ?? r.message;
    nodes.push(
      <span
        key={`err-${i}`}
        className="group/err relative border-b-2 border-dotted border-red-400 cursor-default"
      >
        {errText}
        {tip && (
          <span
            className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-medium text-white bg-red-500 opacity-0 group-hover/err:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 select-none"
            aria-hidden="true"
          >
            {tip}
          </span>
        )}
      </span>,
    );
    cur = r.localEnd;
  }
  if (cur < fragment.length) {
    nodes.push(fragment.slice(cur));
  }
  return nodes;
}

// Phrase-level Opus spans — preferred when available
export function CefrSpanHighlightedText({
  text,
  spans,
  errors,
}: {
  text: string;
  spans: CefrSpan[];
  errors?: GrammarError[];
}) {
  if (!spans || spans.length === 0) {
    // No CEFR spans — render plain text (with error underlines if any)
    if (errors && errors.length > 0) {
      return <span>{applyErrors(text, errors)}</span>;
    }
    return <span>{text}</span>;
  }

  // Substring matching — find each span's text in the utterance by indexOf.
  // Robust against offset drift from whitespace/punctuation differences.
  const matches: Array<{ start: number; end: number; span: CefrSpan }> = [];
  const usedRanges: Array<[number, number]> = [];

  for (const s of spans) {
    if (!s.text || !CEFR_BG[s.level]) continue;
    // Skip spans longer than 8 words
    if (s.text.split(/\s+/).length > 8) continue;
    const idx = text.indexOf(s.text);
    if (idx === -1) continue;
    // Check for overlap with already-matched ranges
    const overlaps = usedRanges.some(([a, b]) => idx < b && idx + s.text.length > a);
    if (overlaps) continue;
    matches.push({ start: idx, end: idx + s.text.length, span: s });
    usedRanges.push([idx, idx + s.text.length]);
  }

  matches.sort((a, b) => a.start - b.start);

  const parts: Array<{ text: string; span?: CefrSpan }> = [];
  let cursor = 0;

  for (const m of matches) {
    if (m.start > cursor) {
      parts.push({ text: text.slice(cursor, m.start) });
    }
    parts.push({ text: text.slice(m.start, m.end), span: m.span });
    cursor = m.end;
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor) });
  }

  // Pre-compute character offsets for each part
  const partOffsets: number[] = [];
  {
    let off = 0;
    for (const p of parts) {
      partOffsets.push(off);
      off += p.text.length;
    }
  }

  return (
    <span>
      {parts.map((p, i) => {
        if (!p.span) {
          // Plain text part — apply error underlines if any
          if (errors && errors.length > 0) {
            return <span key={i}>{applyErrors(p.text, errors, partOffsets[i])}</span>;
          }
          return <span key={i}>{p.text}</span>;
        }
        const bg = CEFR_BG[p.span.level];
        const color = CEFR_TEXT[p.span.level];
        return (
          <span
            key={i}
            className="group/phrase relative cursor-default rounded-[3px] px-0.5 -mx-0.5"
            style={{ backgroundColor: bg, color }}
          >
            {p.text}
            <span
              className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-medium text-white bg-[#191919] opacity-0 group-hover/phrase:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-[99999] select-none"
              aria-hidden="true"
            >
              {p.span.level}{p.span.label ? ` · ${p.span.label}` : ""}
            </span>
          </span>
        );
      })}
    </span>
  );
}
