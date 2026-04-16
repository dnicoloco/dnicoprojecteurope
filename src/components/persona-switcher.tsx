"use client";

import * as React from "react";
import Image from "next/image";
import { ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PERSONAS, usePersona } from "@/lib/persona";

export function PersonaSwitcher({
  compact,
  direction = "up",
}: {
  compact?: boolean;
  direction?: "up" | "down";
}) {
  const { persona, setPersonaId } = usePersona();
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const canSwitch = PERSONAS.length > 1;

  React.useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => canSwitch && setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-2 p-1 rounded-full transition-colors text-left",
          canSwitch && "hover:bg-black/5 cursor-pointer",
        )}
      >
        <Avatar persona={persona} />
        {!compact && (
          <>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-[#191919] truncate">
                {persona.name}
              </div>
              <div className="text-sm text-[#6a7580] truncate">
                {persona.subtitle}
              </div>
            </div>
            {canSwitch && (
              <ChevronsUpDown size={14} className="text-[#6a7580] shrink-0" />
            )}
          </>
        )}
      </button>

      {open && canSwitch && (
        <div
          className={cn(
            "absolute rounded-[6px] bg-white border border-[rgba(25,25,25,0.08)] shadow-[0_8px_28px_rgba(25,25,25,0.12)] overflow-hidden z-30 min-w-[240px]",
            direction === "up"
              ? "bottom-full left-0 right-0 mb-2"
              : "top-full right-0 mt-2",
          )}
        >
          <div className="p-1">
            <div className="px-3 py-2 text-sm text-[#6a7580]">Switch account</div>
            {PERSONAS.map((p) => {
              const active = p.id === persona.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setPersonaId(p.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-2 py-2 rounded-[6px] transition-colors text-left cursor-pointer",
                    "hover:bg-[#FAF9F5]",
                  )}
                >
                  <Avatar persona={p} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[#191919] truncate">
                      {p.name}
                    </div>
                    <div className="text-sm text-[#6a7580] truncate">
                      {p.subtitle}
                    </div>
                  </div>
                  {active && <Check size={16} className="text-[#FF7AAC]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Avatar({ persona }: { persona: (typeof PERSONAS)[number] }) {
  if (persona.avatarSrc) {
    return (
      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-[#F4F4F4]">
        <Image
          src={persona.avatarSrc}
          alt={persona.name}
          width={64}
          height={64}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className="w-8 h-8 rounded-[6px] flex items-center justify-center text-white font-semibold shrink-0"
      style={{ background: persona.color }}
    >
      {persona.initial}
    </div>
  );
}
