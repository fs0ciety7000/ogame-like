import { EmojiIcon } from "@/components/ui/game-icon";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NumberInput } from "@/components/ui/number-input";

/* Briques visuelles du HUD (v2.4) : étiquette, jauge segmentée, pastille de
   coût, barre de niveau à crans, sélecteur de quantité. */

export function HudTag({ children, tone = "accent", className }: { children: ReactNode; tone?: "accent" | "ember" | "gold" | "mint" | "danger"; className?: string }) {
  const tones = {
    accent: "border-cyan-glow/35 bg-cyan-glow/[0.07] text-cyan-glow",
    ember: "border-ember-glow/40 bg-ember-glow/[0.07] text-ember-glow",
    gold: "border-gold-glow/40 bg-gold-glow/[0.07] text-gold-glow",
    mint: "border-mint-glow/40 bg-mint-glow/[0.07] text-mint-glow",
    danger: "border-danger-glow/45 bg-danger-glow/[0.08] text-danger-glow",
  }[tone];
  return <span className={cn("hud-cut-sm inline-flex items-center gap-1 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.18em]", tones, className)}>{children}</span>;
}

/** Statistique avec jauge à 12 segments (`value` rapporté à `max`). */
export function StatBar({ label, value, max, color, display }: { label: string; value: number; max: number; color: string; display?: ReactNode }) {
  const on = max > 0 ? Math.max(value > 0 ? 1 : 0, Math.round((Math.min(value, max) / max) * 12)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between font-mono text-[10px] tracking-[0.2em] text-slate-400">
        {label}
        <b className="text-xs tracking-normal text-slate-100">{display ?? value}</b>
      </div>
      <div className="hud-seg mt-1" style={{ ["--seg" as string]: color }}>
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i} className={i < on ? "on" : undefined} />
        ))}
      </div>
    </div>
  );
}

/** Pastille de coût / durée ; `missing` la passe en rouge avec le manque. */
export function CostPill({ children, missing, ok, className }: { children: ReactNode; missing?: ReactNode; ok?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-xs tabular-nums",
        missing ? "border-ember-glow/55 bg-ember-glow/[0.08] text-ember-glow" : ok ? "border-mint-glow/30 bg-white/[0.03] text-slate-200" : "border-cyan-glow/15 bg-white/[0.03] text-slate-300",
        className,
      )}
    >
      {children}
      {missing && <em className="text-[10px] not-italic opacity-75">{missing}</em>}
    </span>
  );
}

/** Barre de niveau : un cran par niveau, le suivant clignote. */
export function LevelTicks({ level, max, next = true, className }: { level: number; max: number; next?: boolean; className?: string }) {
  return (
    <div className={cn("hud-ticks", className)} style={{ gridTemplateColumns: `repeat(${Math.max(1, max)}, 1fr)` }}>
      {Array.from({ length: max }, (_, i) => (
        <i key={i} className={i < level ? "on" : next && i === level ? "next" : undefined} />
      ))}
    </div>
  );
}

/** Quantité : − / valeur / + et raccourcis (v5.6 : champ numérique commun). */
export function QtyStepper({ value, onChange, max, presets = [1, 10, 100] }: { value: number; onChange: (v: number) => void; max?: number; presets?: number[] }) {
  return <NumberInput value={value} onChange={onChange} min={1} max={max !== undefined ? Math.max(1, max) : undefined} presets={presets} aria-label="Quantité" className="w-full max-w-[260px]" />;
}

/** Jauge de remplissage fine avec reflet. */
export function HudMeter({ percent, className, tone }: { percent: number; className?: string; tone?: string }) {
  return (
    <div className={cn("relative h-1 overflow-hidden bg-white/[0.06]", className)}>
      <i
        className="hud-sheen absolute inset-y-0 left-0 block"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%`, background: tone ?? "linear-gradient(90deg, var(--color-cyan-glow), var(--color-mint-glow))" }}
      />
    </div>
  );
}

/** État vide : icône encadrée + message. */
export function EmptyState({ icon, title, children, className }: { icon: ReactNode; title?: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cn("flex items-center gap-4 p-5", className)}>
      <div className="hud-cut grid h-12 w-12 shrink-0 place-items-center border border-cyan-glow/25 bg-cyan-glow/[0.06] text-xl text-cyan-glow">
        {typeof icon === "string" ? <EmojiIcon emoji={icon} className="h-9 w-9" /> : icon}
      </div>
      <div>
        {title && <p className="hud-title text-sm text-slate-200">{title}</p>}
        {children && <p className="mt-0.5 text-sm text-slate-500">{children}</p>}
      </div>
    </div>
  );
}

/** Tuile de chiffre clé : libellé, grande valeur, liseré coloré. */
export function StatTile({ label, value, sub, tone = "var(--color-cyan-glow)", icon }: { label: string; value: ReactNode; sub?: ReactNode; tone?: string; icon?: ReactNode }) {
  return (
    <div className="glass-panel relative overflow-hidden p-4">
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: tone, boxShadow: `0 0 12px ${tone}` }} />
      <div className="relative flex items-start justify-between gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-500">{label}</p>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <p className="hud-title relative mt-1.5 text-3xl normal-case tabular-nums" style={{ color: tone }}>
        {value}
      </p>
      {sub && <p className="relative mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}
