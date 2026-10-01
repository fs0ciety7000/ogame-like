import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-10 w-full border border-cyan-glow/15 bg-space-900/80 px-3 text-sm text-slate-100 placeholder:text-slate-500",
        "outline-none transition focus:border-cyan-glow/60 focus:ring-2 focus:ring-cyan-glow/20",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";
