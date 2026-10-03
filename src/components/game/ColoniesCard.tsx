import { Link } from "react-router-dom";
import { Globe2, Hammer, Shield, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { advanceColonies, colonyHourlyRates, colonyStorage, COLONY_RULES } from "@/game/colonies";
import { findBuilding } from "@/game/buildings";
import { findUnit } from "@/game/units";
import { RESOURCE_LIST } from "@/game/resources";
import { usePlayerStore } from "@/store/playerStore";
import { cn, formatCompact, formatDuration, formatPerSecond } from "@/lib/utils";

/* v4.9.3 : les colonies d'un coup d'œil sur l'accueil — production, chantier, stock le plus rempli. */

export function ColoniesCard() {
  const raw = usePlayerStore((s) => s.player);
  if (!raw || ((raw.colonies?.length ?? 0) === 0 && !raw.colonizing)) return null;
  const now = Date.now();
  const player = structuredClone(raw);
  advanceColonies(player, now);
  const colonies = [...(player.colonies ?? [])].sort((a, b) => a.slot - b.slot);

  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <Globe2 className="h-4 w-4 text-violet-glow" />
        <h2 className="hud-title text-sm">Colonies</h2>
        <Link to="/game/colonies" className="ml-auto font-mono text-[10px] uppercase tracking-[0.14em] text-cyan-glow hover:underline">
          Gérer →
        </Link>
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        {colonies.map((c) => {
          const rates = colonyHourlyRates(c, player);
          const hourly = Object.values(rates).reduce((a: number, b) => a + (b ?? 0), 0);
          const storage = colonyStorage(c, player);
          const fullest = RESOURCE_LIST.filter((r) => r.rarity === "common")
            .map((r) => ({ r, pct: storage > 0 ? ((c.resources[r.id] ?? 0) / storage) * 100 : 0 }))
            .sort((a, b) => b.pct - a.pct)[0];
          const job = c.building;
          return (
            <Link key={c.id} to="/game/colonies" className="hud-cut-sm flex flex-col gap-1.5 border border-white/[0.07] bg-white/[0.02] p-3 transition-colors hover:border-violet-glow/40">
              <div className="flex items-baseline gap-2">
                <span className="truncate font-display text-sm font-semibold text-white">{c.name}</span>
                <span className="ml-auto inline-flex items-center gap-1 font-mono text-[11px] text-mint-glow">
                  <TrendingUp className="h-3 w-3" /> +{formatPerSecond(hourly)}
                </span>
              </div>
              {job ? (
                <p className="flex items-center gap-1.5 text-[11px] text-cyan-glow">
                  <Hammer className="h-3 w-3" /> {findBuilding(job.id)?.name} niv. {job.level}
                  <span className="ml-auto font-mono">{formatDuration(Math.max(0, Math.floor((job.endTime - now) / 1000)))}</span>
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-[11px] text-ember-glow">
                  <Hammer className="h-3 w-3" /> Aucun chantier
                </p>
              )}
              {c.defenseJob && (
                <p className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <Shield className="h-3 w-3" /> {formatCompact(c.defenseJob.qty)} {findUnit(c.defenseJob.unitId)?.name}
                  <span className="ml-auto font-mono">{formatDuration(Math.max(0, Math.floor((c.defenseJob.endTime - now) / 1000)))}</span>
                </p>
              )}
              {fullest && (
                <div>
                  <div className="flex justify-between font-mono text-[10px] text-slate-500">
                    <span>Entrepôt ({fullest.r.name.toLowerCase()})</span>
                    <span className={cn(fullest.pct >= 100 ? "text-ember-glow" : fullest.pct >= 85 ? "text-gold-glow" : "")}>{Math.min(100, Math.round(fullest.pct))} %</span>
                  </div>
                  <div className="mt-0.5 h-1 bg-white/[0.06]">
                    <div className={cn("h-full", fullest.pct >= 100 ? "bg-ember-glow" : fullest.pct >= 85 ? "bg-gold-glow" : "bg-mint-glow/80")} style={{ width: `${Math.min(100, fullest.pct)}%` }} />
                  </div>
                </div>
              )}
            </Link>
          );
        })}
        {raw.colonizing && (
          <Link to="/game/colonies" className="hud-cut-sm flex flex-col gap-1.5 border border-cyan-glow/25 bg-cyan-glow/[0.04] p-3">
            <span className="font-display text-sm font-semibold text-cyan-glow">Vaisseau colonial → {raw.colonizing.name}</span>
            <Progress value={100 - ((raw.colonizing.endTime - now) / (COLONY_RULES.foundHours * 3600_000)) * 100} />
            <span className="font-mono text-[11px] text-cyan-glow">arrivée dans {formatDuration(Math.max(0, Math.floor((raw.colonizing.endTime - now) / 1000)))}</span>
          </Link>
        )}
      </div>
    </Card>
  );
}
