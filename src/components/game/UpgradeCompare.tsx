import type { ReactNode } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { productionPerSecond, repairPercentAt, storageCapacityAt, type BuildingDef } from "@/game/buildings";
import { cn, formatCompact, formatDuration } from "@/lib/utils";

/* 5.16 : comparateur avant / après au survol du bouton « Améliorer » : effet
   du bâtiment au niveau actuel et au suivant, durée, coût total et, pour un
   bâtiment de production, le temps pour rentabiliser l'amélioration. */

interface Row {
  label: string;
  before: string;
  after: string;
  delta?: string;
}

export function buildingCompareRows(b: BuildingDef, level: number, cost: Record<string, number | undefined>, seconds: number): { rows: Row[]; payback: number | null; total: number } {
  const next = level + 1;
  const rows: Row[] = [];
  let payback: number | null = null;
  const total = Object.values(cost).reduce<number>((a, v) => a + (v ?? 0), 0);
  if (b.production) {
    const cur = productionPerSecond(b.id, level) * 3600;
    const nxt = productionPerSecond(b.id, next) * 3600;
    rows.push({ label: "Production / h", before: formatCompact(cur), after: formatCompact(nxt), delta: cur > 0 ? `+${Math.round(((nxt - cur) / cur) * 100)} %` : undefined });
    const gainPerSec = (nxt - cur) / 3600;
    if (gainPerSec > 0 && total > 0) payback = total / gainPerSec;
  }
  if (b.effect?.type === "storage") rows.push({ label: "Entrepôt / ressource", before: formatCompact(storageCapacityAt(b.effect, level)), after: formatCompact(storageCapacityAt(b.effect, next)) });
  if (b.effect?.type === "repair") rows.push({ label: "Réparation", before: `${Math.round(repairPercentAt(b.effect, level) * 100)} %`, after: `${Math.round(repairPercentAt(b.effect, next) * 100)} %` });
  if (b.effect?.type === "hangar") rows.push({ label: "Places de hangar", before: formatCompact(b.effect.perLevel * level), after: formatCompact(b.effect.perLevel * next) });
  rows.push({ label: "Durée du chantier", before: "", after: formatDuration(seconds) });
  return { rows, payback, total };
}

export function UpgradeCompare({ building, level, cost, seconds, children }: { building: BuildingDef; level: number; cost: Record<string, number | undefined>; seconds: number; children: ReactNode }) {
  const { rows, payback, total } = buildingCompareRows(building, level, cost, seconds);
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent className="w-64">
        <p className="mb-1.5 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
          Niv. {level} → niv. {level + 1}
        </p>
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto] gap-x-3 gap-y-1 text-xs">
          {rows.map((r) => (
            <div key={r.label} className="contents">
              <span className="text-slate-400">{r.label}</span>
              <span className="text-right font-mono tabular-nums text-slate-500">{r.before}</span>
              <span className={cn("text-right font-mono tabular-nums", r.before ? "text-mint-glow" : "text-slate-200")}>
                {r.after}
                {r.delta && <span className="ml-1 text-[11px] text-mint-glow/80">{r.delta}</span>}
              </span>
            </div>
          ))}
          <span className="text-slate-400">Coût total</span>
          <span />
          <span className="text-right font-mono tabular-nums text-gold-glow">{formatCompact(total)}</span>
        </div>
        {payback !== null && (
          <p className="mt-1.5 border-t border-white/10 pt-1.5 text-[11px] text-slate-400">
            Le gain de production rembourse le coût total (toutes ressources confondues) en ≈ <b className="font-mono text-slate-200">{formatDuration(payback)}</b>.
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}
