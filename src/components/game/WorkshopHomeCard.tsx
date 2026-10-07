import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { HUD_TONE, HudChip, HudMeter } from "@/components/ui/hud";
import { findUnit } from "@/game/units";
import { workshopView } from "@/game/workshop";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { formatDuration, formatNumber } from "@/lib/utils";

/* 5.21 : l'Atelier de réparation d'un coup d'œil sur l'accueil (masqué quand tout est réparé). */

export function WorkshopHomeCard() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  if (!player) return null;
  const now = Date.now();
  const view = workshopView(player, now);
  // 5.28 : vaisseaux prêts en Cale sèche = action à mener (accent).
  const ready = Object.values(view.dock.ready).reduce((a, b) => a + b, 0);
  if (view.jobs.length === 0 && view.hulls.length === 0 && ready === 0) return null;
  const next = view.jobs[0];
  const immobilized = view.jobs.reduce((s, j) => s + j.job.count, 0);
  const worst = view.hulls[0];
  const left = (ms: number | null) => (ms ? formatDuration(Math.max(0, Math.ceil((ms - now) / 1000))) : "—");
  const tone = worst && worst.percent < 0.4 ? "danger" : "ember";
  return (
    <Card className="p-4">
      <div className="mb-3 flex items-center gap-2">
        <motion.span animate={{ rotate: [0, -18, 0, 12, 0] }} transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 1.2 }} className="inline-flex">
          <Wrench className="h-4 w-4 text-ember-glow" />
        </motion.span>
        <h2 className="hud-title text-sm">Atelier de réparation</h2>
        {(view.jobs.length > 0 || view.hulls.length > 0) && (
          <HudChip tone="ember" size="sm" alert>
            En réparation
          </HudChip>
        )}
        {ready > 0 && (
          <HudChip asChild tone="accent" size="sm">
            <Link to="/game/batiments?onglet=atelier">Prêts : {formatNumber(ready)}</Link>
          </HudChip>
        )}
        <Link to="/game/batiments?onglet=atelier" className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-cyan-glow hover:underline">
          Atelier →
        </Link>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {next ? (
          <div className="hud-cut-sm border border-white/[0.07] bg-white/[0.02] p-3">
            <p className="text-xs text-slate-400">
              <span className="font-mono text-slate-100">{formatNumber(immobilized)}</span> unité{immobilized > 1 ? "s" : ""} immobilisée{immobilized > 1 ? "s" : ""}
            </p>
            <p className="mt-1 text-sm text-slate-200">
              {formatNumber(next.job.count)} × {findUnit(next.job.unitId)?.name ?? next.job.unitId}
            </p>
            <HudMeter percent={next.progress * 100} className="mt-2 h-1.5" />
            <p className="mt-1 font-mono text-[11px] text-slate-500">prêtes dans {left(next.endsAtMs)}</p>
          </div>
        ) : null}
        {worst ? (
          <div className="hud-cut-sm border border-white/[0.07] bg-white/[0.02] p-3">
            <p className="text-xs text-slate-400">Coques abîmées · {view.hulls.length} type{view.hulls.length > 1 ? "s" : ""}</p>
            <p className="mt-1 flex items-baseline justify-between text-sm text-slate-200">
              {findUnit(worst.unitId)?.name ?? worst.unitId}
              <span className="font-mono text-xs" style={{ color: HUD_TONE[tone] }}>
                {Math.round(worst.percent * 100)} %
              </span>
            </p>
            <HudMeter percent={worst.percent * 100} tone={HUD_TONE[tone]} className="mt-2 h-1.5" />
            <p className="mt-1 font-mono text-[11px] text-slate-500">tout réparé dans {left(view.doneAtMs)}</p>
          </div>
        ) : null}
      </div>
    </Card>
  );
}
