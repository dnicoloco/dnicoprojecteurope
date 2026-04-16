"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  seeAllHref?: string;
  seeAllOnClick?: () => void;
  rightSlot?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

export function HorizontalRow({
  title,
  seeAllHref,
  seeAllOnClick,
  rightSlot,
  children,
  className,
}: Props) {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);

  const update = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    update();
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = Math.round(el.clientWidth * 0.8);
    el.scrollBy({ left: dir * amount, behavior: "smooth" });
  };

  return (
    <section className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between px-1 gap-3 flex-wrap">
        <h2 className="font-display text-[18px] text-[#191919] leading-none">
          {title}
        </h2>
        <div className="flex items-center gap-3">
          {rightSlot}
          {(seeAllHref || seeAllOnClick) && (
            <button
              onClick={seeAllOnClick}
              className="text-sm font-medium text-[#6a7580] hover:text-[#191919] transition-colors cursor-pointer"
            >
              See all ›
            </button>
          )}
        </div>
      </div>

      <div className="relative group/row">
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scroll-smooth no-scrollbar"
        >
          {children}
        </div>

        {canLeft && (
          <button
            onClick={() => scrollBy(-1)}
            aria-label="Scroll left"
            className="absolute left-2 top-[110px] -translate-y-1/2 w-10 h-10 rounded-full bg-[#191919] text-white shadow-[0_6px_16px_rgba(0,0,0,0.25)] flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-[opacity,transform] hover:scale-105 cursor-pointer"
          >
            <ChevronLeft size={20} strokeWidth={2.5} />
          </button>
        )}

        {canRight && (
          <button
            onClick={() => scrollBy(1)}
            aria-label="Scroll right"
            className="absolute right-2 top-[110px] -translate-y-1/2 w-10 h-10 rounded-full bg-[#191919] text-white shadow-[0_6px_16px_rgba(0,0,0,0.25)] flex items-center justify-center opacity-0 group-hover/row:opacity-100 transition-[opacity,transform] hover:scale-105 cursor-pointer"
          >
            <ChevronRight size={20} strokeWidth={2.5} />
          </button>
        )}
      </div>
    </section>
  );
}
