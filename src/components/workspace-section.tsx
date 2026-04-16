"use client";

import * as React from "react";
import { ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
  onAdd?: () => void;
};

/**
 * Notion-style collapsible workspace section for the sidebar.
 */
export function WorkspaceSection({
  title,
  count,
  defaultOpen = true,
  children,
  onAdd,
}: Props) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="group/ws">
      <div className="flex items-center h-7 px-1 rounded-[6px] hover:bg-white/70 transition-colors">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex-1 flex items-center gap-1.5 text-left cursor-pointer min-w-0"
        >
          <ChevronRight
            size={13}
            className={cn(
              "text-[#191919]/55 transition-transform shrink-0",
              open && "rotate-90",
            )}
          />
          <span className="text-[14px] font-semibold text-[#191919]/85 truncate">
            {title}
          </span>
          {typeof count === "number" && (
            <span className="ml-auto text-[14px] text-[#6a7580] tabular-nums px-1">
              {count}
            </span>
          )}
        </button>
        {onAdd && (
          <button
            onClick={onAdd}
            className="opacity-0 group-hover/ws:opacity-100 transition-opacity w-5 h-5 rounded-[6px] hover:bg-black/[0.06] flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Add"
          >
            <Plus size={13} className="text-[#191919]/70" />
          </button>
        )}
      </div>
      {open && <div className="pl-4 mt-1 space-y-0.5">{children}</div>}
    </div>
  );
}
