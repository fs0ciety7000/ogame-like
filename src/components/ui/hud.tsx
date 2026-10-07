import { EmojiIcon } from "@/components/ui/game-icon";
import * as React from "react";
import type { ReactNode } from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import { NumberInput } from "@/components/ui/number-input";

/* Briques visuelles du HUD (v2.4) : étiquette, jauge segmentée, pastille de
   coût, barre de niveau à crans, sélecteur de quantité. */

/** Couleurs sémantiques du HUD : accent = interactif, mint = positif,
 *  ember = attention, danger = danger, gold = prestige, violet = second
 *  accent, neutral = information sans enjeu. */
export type HudTone = "accent" | "mint" | "ember" | "danger" | "gold" | "violet" | "neutral";

export const HUD_TONE: Record<HudTone, string> = {
  accent: "var(--color-cyan-glow)",
  mint: "var(--color-mint-glow)",
  ember: "var(--color-ember-glow)",
  danger: "var(--color-danger-glow)",
  gold: "var(--color-gold-glow)",
  violet: "var(--color-violet-glow)",
  neutral: "var(--color-slate-300)",
};

/** Couleur de faction (ember, gold, cyan, mint, danger) → ton du HUD. */
export function factionTone(color: string): HudTone {
  return color === "cyan" ? "accent" : color in HUD_TONE ? (color as HudTone) : "ember";
}

type ChipProps = React.HTMLAttributes<HTMLElement> & {
  tone?: HudTone;
  /** Alerte en cours : point qui pulse (le mouvement signale un état). */
  alert?: boolean;
  /** « md » : pastille d'en-tête, « sm » : étiquette dans une carte. */
  size?: "sm" | "md";
  /** Rend l'enfant (Link, button) avec le style de la pastille. */
  asChild?: boolean;
};

/** Pastille d'état du HUD : capitales mono, coin coupé, bordure 1px, une
 *  couleur sémantique. Statique (span) ou action (asChild + Link / button). */
export const HudChip = React.forwardRef<HTMLElement, ChipProps>(function HudChip({ tone = "accent", alert, size = "md", asChild, className, style, children, ...rest }, ref) {
  const Comp = (asChild ? Slot : "span") as React.ElementType;
  return (
    <Comp
      ref={ref}
      className={cn("hud-chip", size === "sm" ? "hud-chip-sm" : "hud-chip-md", (asChild || rest.onClick) && "hud-chip-action hud-hit", className)}
      style={{ ["--c" as string]: HUD_TONE[tone], ...style }}
      {...rest}
    >
      {alert && <i aria-hidden className="hud-chip-dot" />}
      {asChild ? <Slottable>{children}</Slottable> : children}
    </Comp>
  );
});

/** Étiquette statique (rétrocompatible) : HudChip en petite taille. */
export function HudTag({ children, tone = "neutral", className }: { children: ReactNode; tone?: HudTone; className?: string }) {
  return (
    <HudChip size="sm" tone={tone} className={className}>
      {children}
    </HudChip>
  );
}

/** Encadré dans un panneau (notice, menace, conseil) : coin coupé, liseré
 *  gauche de la couleur sémantique, fond teinté très léger. */
export function HudCallout({ tone = "accent", alert, className, children, ...rest }: React.HTMLAttributes<HTMLDivElement> & { tone?: HudTone; alert?: boolean }) {
  return (
    <div {...rest} className={cn("hud-callout p-3", alert && "hud-callout-alert", className)} style={{ ["--c" as string]: HUD_TONE[tone], ...rest.style }}>
      {children}
    </div>
  );
}

/** Interrupteur du HUD : rail rectangulaire à coins coupés, curseur carré. */
export function HudSwitch({ checked, onCheckedChange, label, className, ...rest }: Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "onChange"> & { checked: boolean; onCheckedChange: (v: boolean) => void; label: string }) {
  return (
    <button {...rest} type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onCheckedChange(!checked)} className={cn("hud-switch", className)}>
      <i aria-hidden />
    </button>
  );
}

/** Statistique avec jauge à 12 segments (`value` rapporté à `max`). */
export function StatBar({ label, value, max, color, display }: { label: string; value: number; max: number; color: string; display?: ReactNode }) {
  const on = max > 0 ? Math.max(value > 0 ? 1 : 0, Math.round((Math.min(value, max) / max) * 12)) : 0;
  return (
    <div>
      <div className="flex items-baseline justify-between font-mono text-[11px] tracking-[0.2em] text-slate-400">
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
      {missing && <em className="text-[11px] not-italic">{missing}</em>}
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
        className="hud-sheen meter-fill absolute inset-y-0 left-0 block"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%`, background: tone ?? "linear-gradient(90deg, var(--color-cyan-glow), var(--color-mint-glow))" }}
      />
    </div>
  );
}

/** État vide : icône encadrée + message. */
/** État vide : pictogramme, phrase, et (5.15.9) une action pour en sortir. `size="sm"` pour les petites cartes. */
export function EmptyState({ icon, title, children, action, size = "md", className }: { icon: ReactNode; title?: string; children?: ReactNode; action?: ReactNode; size?: "sm" | "md"; className?: string }) {
  const sm = size === "sm";
  return (
    <div className={cn("flex items-center", sm ? "gap-3 p-0" : "gap-4 p-5", className)}>
      <div className={cn("hud-cut grid shrink-0 place-items-center border border-cyan-glow/25 bg-cyan-glow/[0.06] text-cyan-glow", sm ? "h-9 w-9 text-base [&_svg]:h-4 [&_svg]:w-4" : "h-12 w-12 text-xl")}>
        {typeof icon === "string" ? <EmojiIcon emoji={icon} className={sm ? "h-6 w-6" : "h-9 w-9"} /> : icon}
      </div>
      <div className="min-w-0 flex-1">
        {title && <p className={cn("hud-title text-slate-200", sm ? "text-xs" : "text-sm")}>{title}</p>}
        {children && <p className={cn("text-slate-500", sm ? "text-xs" : "mt-0.5 text-sm")}>{children}</p>}
        {action && <div className="mt-2 flex flex-wrap gap-2">{action}</div>}
      </div>
    </div>
  );
}

/** Tuile de chiffre clé : libellé, grande valeur, liseré coloré. */
export function StatTile({ label, value, sub, tone: toneIn = "accent", icon, size = "md", className }: { label: string; value: ReactNode; sub?: ReactNode; tone?: HudTone; icon?: ReactNode; size?: "sm" | "md"; className?: string }) {
  const tone = HUD_TONE[toneIn];
  const sm = size === "sm";
  return (
    <div className={cn("glass-panel relative overflow-hidden", sm ? "px-2.5 py-2" : "p-4", className)}>
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: tone, boxShadow: `0 0 12px ${tone}` }} />
      <div className="relative flex items-start justify-between gap-2">
        <p className={cn("font-mono uppercase text-slate-500", sm ? "text-[11px] tracking-[0.14em]" : "text-[11px] tracking-[0.2em]")}>{label}</p>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      {/* 6.14.82 (UX-9, AD-5) : un chiffre clé en mono tabulaire (les chiffres ne dansent plus d'une tuile à l'autre). */}
      <p className={cn("relative font-mono font-bold tabular-nums [overflow-wrap:anywhere]", sm ? "mt-0.5 text-xl" : "mt-1.5 text-2xl sm:text-3xl")} style={{ color: tone }}>
        {value}
      </p>
      {sub && <div className={cn("relative text-slate-500", sm ? "text-[11px]" : "mt-1 text-xs")}>{sub}</div>}
    </div>
  );
}
