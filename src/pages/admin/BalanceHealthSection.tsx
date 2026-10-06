import { HudChip, StatTile } from "@/components/ui/hud";
import type { BalanceHealth } from "@/game/balance/health";
import { formatCompact } from "@/lib/utils";

/* 6.0.1 (lot K) : santé de l'équilibre. Les relevés de la feuille de route (abri, butin, chantiers,
   flottes, alliances, routes, classes), lus sans accès direct aux données des joueurs. */

const h = (x: number) => `${String(x).replace(".", ",")} h`;

export function BalanceHealthSection({ health }: { health: BalanceHealth }) {
  const e = health.exposure;
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <StatTile size="sm" tone="accent" label="Stock (médiane)" value={h(e.stockHours)} sub="de production" />
        <StatTile size="sm" tone="mint" label="Part à l'abri (médiane)" value={h(e.protectedHours)} sub="de production" />
        <StatTile size="sm" tone="ember" label="Pillable (médiane)" value={h(e.pillableHours)} sub={`${e.pillablePlayersPct} % des joueurs exposés`} />
        <StatTile size="sm" tone="danger" label="Butin moyen" value={formatCompact(health.pvp.avgLoot)} sub={`${String(health.pvp.battlesPerDay).replace(".", ",")} combats JcJ / jour (${health.pvp.windowDays} j)`} />
        <StatTile size="sm" tone="violet" label="Sauvetage" value={`${health.salvage.avgPct} %`} sub={`max ${health.salvage.maxPct} %`} />
        <StatTile size="sm" tone="gold" label="Chantiers en parallèle" value={`${health.parallel.buildsMedian}`} sub={`médiane · max ${health.parallel.buildsMax}`} />
        <StatTile size="sm" tone="accent" label="Flottes en vol" value={`${health.parallel.fleetsMedian}`} sub={`médiane · max ${health.parallel.fleetsMax} · ${health.parallel.fullSlotsPct ?? 0} % à court d'emplacements`} />
        <StatTile size="sm" tone="mint" label="Routes de colonies" value={`${health.colonies.withRoute} / ${health.colonies.colonies}`} sub={`dont ${health.colonies.supply ?? 0} en ravitaillement · ${health.colonies.queued ?? 0} files de défense`} />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>Alliances ({health.alliances.count}) :</span>
        {health.alliances.sizes.length ? (
          health.alliances.sizes.map((n, i) => (
            <HudChip key={i} size="sm" tone="neutral">
              <span className="font-mono tabular-nums">{n}</span>&nbsp;membres
            </HudChip>
          ))
        ) : (
          <span className="text-slate-500">aucune</span>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
        <span>Classes :</span>
        {health.classes.rows.map((r) => (
          <HudChip key={r.id} size="sm" tone="gold" title={`Production médiane : ${formatCompact(r.medianProduction)} / h`}>
            {r.name} <span className="ml-1 font-mono tabular-nums">{r.players}</span> ({r.sharePct} %)
          </HudChip>
        ))}
        <HudChip size="sm" tone="neutral">
          sans classe <span className="ml-1 font-mono tabular-nums">{health.classes.none}</span>
        </HudChip>
      </div>
      {/* 6.5.1 (lot U) : unités possédées par type (relevés de 6.3.1 et 6.5). */}
      <UnitRows label="Défenses construites" tone="accent" rows={health.defenses ?? []} />
      <UnitRows label="Vaisseaux de classe" tone="violet" rows={health.classUnits ?? []} />
    </div>
  );
}

function UnitRows({ label, tone, rows }: { label: string; tone: "accent" | "violet"; rows: { id: string; name: string; total: number; owners: number }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
      <span>{label} :</span>
      {rows.some((r) => r.total > 0) ? (
        rows
          .filter((r) => r.total > 0)
          .map((r) => (
            <HudChip key={r.id} size="sm" tone={tone} title={`${r.owners} joueur${r.owners > 1 ? "s" : ""}`}>
              {r.name} <span className="ml-1 font-mono tabular-nums">{formatCompact(r.total)}</span>
            </HudChip>
          ))
      ) : (
        <span className="text-slate-500">aucun</span>
      )}
    </div>
  );
}
