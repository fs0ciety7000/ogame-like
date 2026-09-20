import * as React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "success" | "danger" | "warning" }) {
  const styles = {
    default: "bg-cyan-glow/10 text-cyan-glow border-cyan-glow/30",
    success: "bg-mint-glow/10 text-mint-glow border-mint-glow/30",
    danger: "bg-danger-glow/10 text-danger-glow border-danger-glow/30",
    warning: "bg-gold-glow/10 text-gold-glow border-gold-glow/30",
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium",
        styles,
        className,
      )}
      {...props}
    />
  );
}
