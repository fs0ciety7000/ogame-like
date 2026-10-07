import { Clock, Info } from "lucide-react";
import { CostPill } from "@/components/ui/hud";
import { Tooltip, TooltipCard, TooltipContent, TooltipTrigger, type TooltipRow } from "@/components/ui/tooltip";
import { ResourceIcon } from "@/components/ui/game-icon";
import { cn, formatCompact, formatDuration } from "@/lib/utils";
import type { ResourceId } from "@/types/game";

/* v4.9.3 : coûts et blocages présentés partout comme sur les colonies — pastille
   orange pour ce qui manque, raison claire quand une action est impossible, et
   estimation du temps avant de pouvoir payer à production constante. */

type Amounts = Partial<Record<ResourceId, number>>;

/** Secondes avant que les stocks couvrent le coût (0 : déjà possible, Infinity : jamais à ce rythme). */
export function secondsToAfford(cost: Amounts, stock: Amounts, ratesPerSecond: Amounts): number {
  let worst = 0;
  for (const [r, n] of Object.entries(cost) as [ResourceId, number][]) {
    const lack = (n ?? 0) - (stock[r] ?? 0);
    if (lack <= 0) continue;
    const rate = ratesPerSecond[r] ?? 0;
    if (rate <= 0) return Infinity;
    worst = Math.max(worst, lack / rate);
  }
  return worst;
}

export function canAfford(cost: Amounts, stock: Amounts): boolean {
  return (Object.entries(cost) as [ResourceId, number][]).every(([r, n]) => (stock[r] ?? 0) >= (n ?? 0));
}

/** 5.31 : un multiplicateur et son origine (« d'où vient ce chiffre »). */
export type FactorLine = { label: string; factor: number };

/** « −20 % », « +10 % » : par défaut (durées), une réduction en mint et une hausse en ember ; `upIsGood` inverse (production, puissance). */
export function factorRows(lines: FactorLine[], upIsGood = false): TooltipRow[] {
  return lines.map((l) => {
    const pct = Math.round((l.factor - 1) * 1000) / 10;
    const good = upIsGood ? pct > 0 : pct < 0;
    return { label: l.label, value: `${pct > 0 ? "+" : pct < 0 ? "−" : ""}${Math.abs(pct)} %`, tone: pct === 0 ? undefined : good ? "mint" : "ember" };
  });
}

/** Pastilles de coût : manque affiché en orange, durée éventuelle en fin de ligne. `timeFactors` : détail de la durée en infobulle. */
export function CostPills({ cost, stock, seconds, perUnit, timeFactors, className }: { cost: Amounts; stock: Amounts; seconds?: number; perUnit?: boolean; timeFactors?: FactorLine[]; className?: string }) {
  const time =
    seconds !== undefined ? (
      <CostPill>
        <Clock className="h-3 w-3" /> {formatDuration(seconds)}
        {perUnit && <em className="text-[11px] not-italic opacity-60">/ unité</em>}
      </CostPill>
    ) : null;
  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {(Object.entries(cost) as [ResourceId, number][])
        .filter(([, n]) => (n ?? 0) > 0)
        .map(([r, n]) => {
          const lack = (n ?? 0) - (stock[r] ?? 0);
          return (
            <CostPill key={r} ok={lack <= 0} missing={lack > 0 ? `manque ${formatCompact(lack)}` : undefined}>
              <ResourceIcon id={r} /> {formatCompact(n ?? 0)}
            </CostPill>
          );
        })}
      {time && timeFactors ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="cursor-help" aria-label={`Durée : ${formatDuration(seconds ?? 0)}, voir le détail`}>
              {time}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <TooltipCard
              title="D'où vient ce temps"
              icon={<Clock />}
              rows={timeFactors.length ? factorRows(timeFactors) : [{ label: "Aucun bonus", value: "temps de base" }]}
              note="Les bonus se multiplient entre eux."
            />
          </TooltipContent>
        </Tooltip>
      ) : (
        time
      )}
    </div>
  );
}

/** Raison d'un bouton grisé. `tone` : warn (en attente de ressources) ou block (impossible pour l'instant). */
export function BlockedReason({ children, tone = "warn", className }: { children: React.ReactNode; tone?: "warn" | "block"; className?: string }) {
  return (
    <p className={cn("mt-1.5 flex items-start gap-1.5 text-[11px] leading-snug", tone === "warn" ? "text-ember-glow" : "text-slate-400", className)}>
      <Info className="mt-px h-3 w-3 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** Texte « ressources insuffisantes » avec l'estimation d'attente. */
export function affordText(seconds: number): string {
  if (seconds <= 0) return "";
  // 6.11.13 (P1) : une ligne ; la pastille de coût dit déjà ce qui manque (« manque 20 k »).
  if (!Number.isFinite(seconds)) return "Ta production n'y suffira pas : passe par le marché.";
  return `Disponible dans ~${formatDuration(Math.ceil(seconds))} à production constante.`;
}
