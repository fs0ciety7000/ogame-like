import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import * as React from "react";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        sideOffset={sideOffset}
        className={cn(
          "hud-cut-sm z-50 border border-cyan-glow/30 bg-space-800/90 px-2.5 py-1.5 text-xs text-slate-200 shadow-[0_0_16px_-4px_var(--color-cyan-glow)] backdrop-blur-sm",
          "data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in data-[state=delayed-open]:zoom-in-95",
          "data-[state=delayed-open]:data-[side=top]:slide-in-from-bottom-1",
          "data-[state=delayed-open]:data-[side=bottom]:slide-in-from-top-1",
          "data-[state=delayed-open]:data-[side=left]:slide-in-from-right-1",
          "data-[state=delayed-open]:data-[side=right]:slide-in-from-left-1",
          className,
        )}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

export type TooltipRow = { label: React.ReactNode; value: React.ReactNode; tone?: "mint" | "ember" | "danger" | "gold" | "accent" };

const ROW_TONE: Record<NonNullable<TooltipRow["tone"]>, string> = {
  mint: "text-mint-glow",
  ember: "text-ember-glow",
  danger: "text-danger-glow",
  gold: "text-gold-glow",
  accent: "text-cyan-glow",
};

/** 5.15 : contenu d'infobulle structuré (DESIGN.md) : titre en capitales mono,
 *  lignes libellé / valeur alignées (chiffres en mono tabulaire), sections
 *  séparées par un filet, note finale. À poser dans un `TooltipContent`. */
export function TooltipCard({
  title,
  icon,
  rows = [],
  sections = [],
  note,
  className,
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  rows?: TooltipRow[];
  sections?: { title: React.ReactNode; rows: TooltipRow[]; empty?: React.ReactNode }[];
  note?: React.ReactNode;
  className?: string;
}) {
  const list = (items: TooltipRow[]) =>
    items.map((r, i) => (
      <p key={i} className="flex items-baseline justify-between gap-5 text-[11px] leading-5">
        <span className="text-slate-400">{r.label}</span>
        <span className={cn("font-mono tabular-nums", r.tone ? ROW_TONE[r.tone] : "text-slate-100")}>{r.value}</span>
      </p>
    ));
  return (
    <div className={cn("min-w-48 max-w-72", className)}>
      <p className="mb-1 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.16em] text-cyan-glow">
        {icon}
        {title}
      </p>
      {list(rows)}
      {sections.map((s, i) => (
        <div key={i} className="mt-1.5 border-t border-white/10 pt-1.5">
          <p className="mb-0.5 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">{s.title}</p>
          {s.rows.length ? list(s.rows) : <p className="text-[11px] text-slate-500">{s.empty}</p>}
        </div>
      ))}
      {note && <p className="mt-1.5 border-t border-white/10 pt-1.5 text-[11px] leading-snug text-slate-400">{note}</p>}
    </div>
  );
}
