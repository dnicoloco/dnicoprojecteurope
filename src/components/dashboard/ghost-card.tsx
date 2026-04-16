import * as React from "react";
import { Plus } from "lucide-react";

type Props = {
  kind?: "topic" | "session" | "resource";
  label: string;
  hint?: string;
  icon?: React.ReactNode;
};

export function GhostCard({ label, hint, icon }: Props) {
  return (
    <div className="group shrink-0 w-[220px] text-left cursor-pointer">
      <div
        className="relative aspect-square w-full rounded-[6px] overflow-hidden border border-dashed border-black/[0.1] group-hover:border-black/[0.2] group-hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center"
        style={{ background: "#FAFAFA" }}
      >
        {icon ?? (
          <Plus size={32} className="text-[#FF7AAC]" strokeWidth={1.8} />
        )}
      </div>
      <div className="pt-2.5 px-0.5">
        <div className="text-[14px] font-medium text-[#191919]/80 truncate">
          {label}
        </div>
        {hint && (
          <div className="text-[14px] text-[#6a7580] mt-0.5 line-clamp-1">
            {hint}
          </div>
        )}
      </div>
    </div>
  );
}
