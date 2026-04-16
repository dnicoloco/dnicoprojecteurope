import * as React from "react";
import Image from "next/image";
import type { Topic } from "@/lib/metrics";

const TOPIC_IMAGES: Record<string, string> = {
  family: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=440&h=440&fit=crop&q=80",
  opinions: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=440&h=440&fit=crop&q=80",
  feelings: "https://images.unsplash.com/photo-1493612276216-ee3925520721?w=440&h=440&fit=crop&q=80",
  philosophy: "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?w=440&h=440&fit=crop&q=80",
};

const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=440&h=440&fit=crop&q=80";

export function TopicCard({
  topic,
  index = 0,
}: {
  topic: Topic;
  index?: number;
}) {
  void index;
  const delta = topic.vocabDeltaPct;
  const imgSrc = TOPIC_IMAGES[topic.id] ?? FALLBACK_IMAGE;

  return (
    <button className="group shrink-0 w-[220px] text-left cursor-pointer">
      <div
        className="relative aspect-square w-full rounded-[6px] overflow-hidden border border-black/[0.06] shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_1px_2px_rgba(0,0,0,0.04),0_6px_14px_-8px_rgba(0,0,0,0.1)] group-hover:border-black/[0.15] group-hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.09),0_3px_6px_rgba(0,0,0,0.07),0_14px_24px_-10px_rgba(0,0,0,0.16)] group-hover:-translate-y-0.5 transition-all duration-200"
        style={{ background: "#1a1a1d" }}
      >
        {/* Editorial blurred photo */}
        <div className="absolute top-0 left-0 right-0 h-[65%] overflow-hidden">
          <Image
            src={imgSrc}
            alt=""
            width={440}
            height={440}
            className="w-full h-full object-cover blur-[4px] brightness-105 saturate-[1.1] scale-110"
            unoptimized
          />
        </div>

        <span className="absolute top-3 right-3 text-[28px] z-[1]">
          {topic.emoji}
        </span>

        {/* Dark bottom with topic name */}
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-3 pt-4 z-[1]">
          <div className="font-display text-[24px] text-white leading-[1.05]">
            {topic.name}
          </div>
        </div>
      </div>
      <div className="pt-2.5 px-0.5">
        <div className="text-[14px] text-[#191919]/80 truncate">
          {topic.sessionsCount} session{topic.sessionsCount === 1 ? "" : "s"}
          <span className="mx-1.5 text-[#6a7580]">·</span>
          <span
            className={
              delta >= 0 ? "text-[#FF7AAC] font-medium" : "text-[#6a7580]"
            }
          >
            {delta >= 0 ? "+" : ""}
            {delta}% vocab
          </span>
        </div>
      </div>
    </button>
  );
}
