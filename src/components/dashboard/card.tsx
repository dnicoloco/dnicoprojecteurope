import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Outer card , the "section" container (#FAF9F5 on white page).
 * Holds one or more InnerCards.
 */
export function OuterCard({
  children,
  className,
  label,
  action,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
  action?: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[6px] bg-[#FAF9F5] border border-black/[0.06] p-4",
        className,
      )}
    >
      {(label || action) && (
        <header className="flex items-center justify-between px-1 pb-3">
          {label && (
            <span className="text-sm font-medium text-[#6a7580]">
              {label}
            </span>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

/**
 * Inner card , the elevated surface inside an OuterCard (#FFFFFF).
 */
export function InnerCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[6px] bg-white border border-black/[0.04] shadow-[0_1px_2px_rgba(25,25,25,0.03),0_2px_8px_-4px_rgba(25,25,25,0.04)]",
        className,
      )}
    >
      {children}
    </div>
  );
}
