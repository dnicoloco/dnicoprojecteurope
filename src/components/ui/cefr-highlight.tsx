"use client";

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

// Phrase-level Opus spans — preferred when available
export function CefrSpanHighlightedText({
  text,
  spans,
}: {
  text: string;
  spans: CefrSpan[];
}) {
  if (!spans || spans.length === 0) {
    return <CefrHighlightedText text={text} />;
  }

  // Sort spans by start offset
  const sorted = [...spans]
    .filter((s) => s.start >= 0 && s.end <= text.length && CEFR_BG[s.level])
    .sort((a, b) => a.start - b.start);

  const parts: Array<{ text: string; span?: CefrSpan }> = [];
  let cursor = 0;

  for (const s of sorted) {
    if (s.start < cursor) continue; // overlapping, skip
    if (s.start > cursor) {
      parts.push({ text: text.slice(cursor, s.start) });
    }
    parts.push({ text: text.slice(s.start, s.end), span: s });
    cursor = s.end;
  }
  if (cursor < text.length) {
    parts.push({ text: text.slice(cursor) });
  }

  return (
    <span>
      {parts.map((p, i) => {
        if (!p.span) return <span key={i}>{p.text}</span>;
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
              className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-medium text-white bg-[#191919] opacity-0 group-hover/phrase:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 select-none"
              aria-hidden="true"
            >
              {p.span.level} · {p.span.label}
            </span>
          </span>
        );
      })}
    </span>
  );
}
