"use client";

import * as React from "react";
import Image from "next/image";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PersonaSwitcher } from "@/components/persona-switcher";
import { LessonChat } from "@/components/dashboard/lesson-chat";

type Tab = { label: string; href: string; active?: boolean };
const TABS: Tab[] = [
  { label: "Home", href: "/", active: true },
  { label: "Messages", href: "#" },
  { label: "My lessons", href: "#" },
  { label: "Learn", href: "#" },
  { label: "Settings", href: "#" },
];

// Shared context so child components can close the chat when going fullscreen
export const ChatContext = React.createContext<{
  closeChat: () => void;
}>({ closeChat: () => {} });

export function AppShell({ children }: { children: React.ReactNode }) {
  const [chatOpen, setChatOpen] = React.useState(false);

  const closeChat = React.useCallback(() => setChatOpen(false), []);

  return (
    <ChatContext.Provider value={{ closeChat }}>
      <div className="fixed inset-0 flex flex-col bg-white">
        <header className="shrink-0 border-b border-[rgba(25,25,25,0.08)] bg-white z-[100]">
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

          <nav className="flex items-center h-12 px-6">
            <div className="flex items-center gap-8 flex-1">
              {TABS.map((t) => (
                <a
                  key={t.label}
                  href={t.href}
                  className={cn(
                    "relative h-12 flex items-center text-[15px] transition-colors",
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
            </div>
            <button
              type="button"
              onClick={() => setChatOpen((o) => !o)}
              className={cn(
                "w-9 h-9 inline-flex items-center justify-center rounded-[6px] transition-colors cursor-pointer",
                chatOpen
                  ? "text-[#FF7AAC]"
                  : "text-[#6a7580] hover:text-[#191919] hover:bg-black/5",
              )}
              title="Ask about your lessons"
            >
              <MessageCircle size={18} fill={chatOpen ? "#FF7AAC" : "none"} />
            </button>
          </nav>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 overflow-y-auto bg-white">{children}</main>

          {chatOpen && (
            <aside
              className="shrink-0 border-l border-black/[0.06] bg-white"
              style={{ width: 380 }}
            >
              <LessonChat
                personaStudentKey="marta"
                onClose={closeChat}
              />
            </aside>
          )}
        </div>
      </div>
    </ChatContext.Provider>
  );
}
