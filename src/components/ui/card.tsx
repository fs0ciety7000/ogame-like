import * as React from "react";
import { cn } from "@/lib/utils";

/** Panneau HUD : coins biseautés, liseré dégradé, trame fine (voir .glass-panel). */
export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("glass-panel", className)} {...props} />;
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative p-4 pb-2", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn("hud-title text-base text-slate-100", className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("relative p-4 pt-2", className)} {...props} />;
}

/** Repères d'angle décoratifs (en haut à droite, en bas à gauche). */
export function HudBrackets({ className }: { className?: string }) {
  return (
    <>
      <span aria-hidden className={cn("pointer-events-none absolute right-2 top-2 z-[2] h-3 w-3 border-r-[1.5px] border-t-[1.5px] border-cyan-glow/70", className)} />
      <span aria-hidden className={cn("pointer-events-none absolute bottom-2 left-2 z-[2] h-3 w-3 border-b-[1.5px] border-l-[1.5px] border-cyan-glow/70", className)} />
    </>
  );
}
