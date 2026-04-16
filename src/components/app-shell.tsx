"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { PersonaSwitcher } from "@/components/persona-switcher";

type Tab = { label: string; href: string; active?: boolean };
const TABS: Tab[] = [
  { label: "Home", href: "/", active: true },
  { label: "Messages", href: "#" },
  { label: "My lessons", href: "#" },
  { label: "Learn", href: "#" },
  { label: "Settings", href: "#" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 flex flex-col bg-white">
      <header className="shrink-0 border-b border-[rgba(25,25,25,0.08)] bg-white">
        {/* Brand row */}
        <div className="flex items-center justify-between h-14 px-6">
          <div className="flex items-center gap-2">
            <Image
              src="/logo/preply-mark.png"
              alt=""
              width={512}
              height={512}
              priority
              className="h-7 w-7 rounded-[6px] shrink-0"
            />
            <span className="font-display text-[20px] text-[#191919] leading-none">
              Preply
            </span>
          </div>
          <PersonaSwitcher compact direction="down" />
        </div>

        {/* Tabs row */}
        <nav className="flex items-center gap-8 px-6 h-12">
          {TABS.map((t) => (
            <a
              key={t.label}
              href={t.href}
              className={cn(
                "relative h-full flex items-center text-[15px] transition-colors",
                t.active
                  ? "text-[#191919] font-semibold"
                  : "text-[#6a7580] hover:text-[#191919]",
              )}
            >
              {t.label}
              {t.active && (
                <span className="absolute left-0 right-0 bottom-0 h-[3px] bg-[#FF7AAC] rounded-t-full" />
              )}
            </a>
          ))}
        </nav>
      </header>

      <main className="flex-1 overflow-y-auto bg-white">{children}</main>
    </div>
  );
}
