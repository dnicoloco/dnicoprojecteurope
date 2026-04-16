"use client";

import * as React from "react";
import { GlobeStickers } from "@/components/ui/cobe-globe-stickers";
import {
  LANGUAGE_COUNTRIES,
  STUDENT_LANGUAGES,
  coverageFor,
  type StudentLanguage,
  type StudentProgress,
} from "@/lib/metrics";

function LanguageRow({ lang }: { lang: StudentLanguage }) {
  const { coverage, blurb } = coverageFor(lang.vocabKnown);
  return (
    <div>
      <div className="text-[16px] text-[#191919]">
        {lang.name}
        <span className="mx-1.5 text-[#6a7580]">·</span>
        <span className="font-semibold">
          {lang.vocabKnown.toLocaleString()}
        </span>{" "}
        words
      </div>
      <div className="text-[14px] text-[#6a7580] leading-snug mt-1">
        You recognise about{" "}
        <span className="font-semibold text-[#191919]">{coverage}%</span> of
        everyday talk, {blurb}.
      </div>
    </div>
  );
}

export function LanguageGlobe({ student }: { student: StudentProgress }) {
  const languages = STUDENT_LANGUAGES[student.id] ?? [];

  const allMarkers = React.useMemo(() => {
    return languages.flatMap((lang) => {
      const countries = LANGUAGE_COUNTRIES[lang.name] ?? [];
      return countries.map((c) => ({
        id: `${lang.code}-${c.id}`,
        location: c.location,
        sticker: c.flag,
      }));
    });
  }, [languages]);

  if (languages.length === 0) return null;

  const totalVocab = languages.reduce((s, l) => s + l.vocabKnown, 0);
  const countryCount = allMarkers.length;

  return (
    <div className="rounded-[6px] bg-white border border-black/[0.08] p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <div className="flex justify-center">
          <div className="w-full max-w-[360px] aspect-square">
            <GlobeStickers markers={allMarkers} />
          </div>
        </div>

        <div className="flex flex-col min-w-0">
          <div className="text-[14px] font-medium tracking-[0.02em] text-[#FF7AAC]">
            Your vocabulary in the world
          </div>
          <h2 className="font-display text-[26px] text-[#191919] leading-tight mt-1">
            {totalVocab.toLocaleString()} words
            <span className="mx-1.5 text-[#6a7580]">·</span>
            {languages.length} language{languages.length === 1 ? "" : "s"}
          </h2>

          <div className="flex flex-col gap-5 mt-6">
            {languages.map((lang) => (
              <LanguageRow key={lang.code} lang={lang} />
            ))}
          </div>

          <div className="text-[14px] text-[#6a7580] leading-snug mt-6 max-w-prose">
            Your globe lights up in {countryCount} countries where these words
            could help. Vocabulary is one piece. Speaking time and listening
            practice get you the rest.
          </div>
        </div>
      </div>
    </div>
  );
}
