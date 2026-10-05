import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "hud-cut inline-flex items-center justify-center gap-2 whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.14em] transition-[filter,background-color,color,border-color] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-glow/60 disabled:pointer-events-none disabled:opacity-40 disabled:saturate-50",
  {
    variants: {
      variant: {
        primary: "hud-btn-primary hud-sheen bg-gradient-to-b from-[color-mix(in_srgb,var(--th-accent)_70%,white)] to-cyan-glow text-[var(--th-btn-ink)] hover:brightness-110 active:brightness-95",
        secondary: "border border-cyan-glow/30 bg-cyan-glow/10 text-slate-100 hover:border-cyan-glow/60 hover:bg-cyan-glow/15",
        ghost: "text-slate-300 hover:bg-white/5 hover:text-slate-100",
        danger: "hud-sheen bg-gradient-to-b from-[color-mix(in_srgb,var(--th-danger)_70%,white)] to-danger-glow text-space-950 hover:brightness-110",
        outline: "border border-cyan-glow/25 text-slate-200 hover:border-cyan-glow/60 hover:text-slate-100",
        warn: "hud-sheen bg-gradient-to-b from-[color-mix(in_srgb,var(--th-ember)_65%,white)] to-ember-glow text-space-950 hover:brightness-110",
      },
      size: {
        sm: "h-8 px-3 text-[11px]",
        md: "h-10 px-4",
        lg: "h-12 px-6 text-base",
        icon: "h-9 w-9 shrink-0 tracking-normal",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Fusionne les props sur son unique enfant (ex: un <Link>) au lieu de rendre un <button>. */
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />;
  },
);
Button.displayName = "Button";
