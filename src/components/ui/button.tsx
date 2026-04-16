"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "limbo-button inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-sm font-semibold transition-[transform,background,border,box-shadow,color] duration-100 ease-[cubic-bezier(0.32,0.72,0,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7aac] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-40 [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden select-none cursor-pointer",
  {
    variants: {
      variant: {
        primary:
          "limbo-button-primary hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        secondary:
          "limbo-button-secondary hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98]",
        ghost:
          "text-[#191919] hover:bg-black/5 active:bg-black/10 transition-colors",
      },
      size: {
        default: "h-10 px-6 py-3",
        sm: "h-9 px-4 py-2",
        lg: "h-12 px-8 py-3",
        icon: "h-10 w-10 p-3",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          buttonVariants({ variant, size, className }),
          loading && "loading pointer-events-none",
        )}
        {...props}
      >
        <span className="button-content flex items-center gap-2 relative z-[2]">
          {loading && <Loader2 className="animate-spin" />}
          {children}
        </span>
      </button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
