"use client";

import * as React from "react";
import { VerticalCutReveal } from "@/components/ui/vertical-cut-reveal";

const GREETINGS: Record<string, string> = {
  English: "Hi",
  Spanish: "Hola",
  Portuguese: "Olá",
  French: "Salut",
  German: "Hallo",
  Italian: "Ciao",
  Dutch: "Hoi",
};

const PERSONA_LANGS: Record<string, { learning: string; native: string }> = {
  marta: { learning: "English", native: "Spanish" },
  tomas: { learning: "English", native: "Portuguese" },
};

export function GreetingHero({
  name,
  studentKey,
}: {
  name: string;
  studentKey: string;
}) {
  const langs = PERSONA_LANGS[studentKey] ?? {
    learning: "English",
    native: "English",
  };
  const learning = GREETINGS[langs.learning] ?? "Hi";
  const native = GREETINGS[langs.native] ?? learning;
  const sameLang = langs.learning === langs.native;

  const [hovered, setHovered] = React.useState(false);
  const text = `${hovered && !sameLang ? native : learning} ${name}`;

  return (
    <div className="min-h-[12vh] flex flex-col justify-end px-1">
      {/* h1 is w-fit so hover only activates over the actual glyphs, not the
          whole row of empty whitespace next to them. */}
      <h1
        className="font-display text-[48px] md:text-[60px] leading-[1.02] text-[#191919] tracking-tight select-none cursor-default w-fit"
        style={{ fontWeight: 500 }}
        onMouseEnter={() => !sameLang && setHovered(true)}
        onMouseLeave={() => !sameLang && setHovered(false)}
      >
        <VerticalCutReveal
          key={text /* remount to replay the reveal on swap */}
          splitBy="characters"
          staggerDuration={0.025}
          staggerFrom="first"
          transition={{ type: "spring", stiffness: 200, damping: 21 }}
        >
          {text}
        </VerticalCutReveal>
      </h1>
    </div>
  );
}
