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
