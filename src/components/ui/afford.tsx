import { Clock, Info } from "lucide-react";
import { CostPill } from "@/components/ui/hud";
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

/** Pastilles de coût : manque affiché en orange, durée éventuelle en fin de ligne. */
export function CostPills({ cost, stock, seconds, perUnit, className }: { cost: Amounts; stock: Amounts; seconds?: number; perUnit?: boolean; className?: string }) {
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
      {seconds !== undefined && (
        <CostPill>
          <Clock className="h-3 w-3" /> {formatDuration(seconds)}
          {perUnit && <em className="text-[10px] not-italic opacity-60">/ unité</em>}
        </CostPill>
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
  if (!Number.isFinite(seconds)) return "Ressources insuffisantes, et ta production actuelle ne suffira pas : échange au marché ou augmente la production.";
  return `Ressources insuffisantes : disponible dans ~${formatDuration(Math.ceil(seconds))} à production constante.`;
}
