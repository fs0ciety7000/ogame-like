import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/60 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "bg-gradient-to-b from-cyan-glow/90 to-cyan-glow/70 text-space-950 font-semibold shadow-[0_0_18px_-4px_var(--color-cyan-glow)] hover:shadow-[0_0_24px_-2px_var(--color-cyan-glow)] hover:brightness-110 active:brightness-95",
        secondary:
          "bg-space-700/80 text-slate-100 border border-cyan-glow/20 hover:border-cyan-glow/50 hover:bg-space-600/80",
        ghost: "text-slate-300 hover:text-white hover:bg-white/5",
        danger: "bg-danger-glow/90 text-space-950 font-semibold hover:brightness-110",
        outline: "border border-white/15 text-slate-200 hover:border-cyan-glow/50 hover:text-white",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9 shrink-0",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
