import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/hud";
import { motion } from "framer-motion";
import { Eye, Sword, Shield, ShieldAlert } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/PageHeader";
import { subscribeBattleLog, subscribeSpyLog } from "@/services/playerService";
import { SpyReportView } from "@/components/game/SpyModal";
import { SPY_TIER_LABELS } from "@/game/espionage";
import { useAuthStore } from "@/store/authStore";
import { combatDisplayFromReportForViewer, showCombatResult } from "@/store/combatModalStore";
import { toMillis, formatNumber, timeAgo } from "@/lib/utils";
import type { BattleReport, CombatOutcome, SpyReport } from "@/types/game";

const OUTCOME_STYLE: Record<"victory" | "defeat" | "draw", { label: string; variant: "success" | "danger" | "warning" }> = {
  victory: { label: "Victoire", variant: "success" },
  defeat: { label: "Défaite", variant: "danger" },
  draw: { label: "Match nul", variant: "warning" },
};

function outcomeForViewer(outcome: CombatOutcome, isAttacker: boolean): "victory" | "defeat" | "draw" {
  if (outcome === "draw") return "draw";
  const won = isAttacker ? outcome === "attacker_win" : outcome === "defender_win";
  return won ? "victory" : "defeat";
}

export function CombatLogPage() {
  const uid = useAuthStore((s) => s.user?.uid);
  const [reports, setReports] = useState<BattleReport[]>([]);
  const [spyReports, setSpyReports] = useState<SpyReport[]>([]);
  const [openSpy, setOpenSpy] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) return;
    return subscribeBattleLog(uid, setReports);
  }, [uid]);
  useEffect(() => {
    if (!uid) return;
    return subscribeSpyLog(uid, setSpyReports);
  }, [uid]);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Archives" title="Journal de combat" description="Historique des attaques lancées et reçues." />

      <Card className="divide-y divide-white/5">
        {reports.length === 0 && (
          <EmptyState icon="⚔️" title="Aucun combat">Tes attaques lancées et reçues apparaîtront ici.</EmptyState>
        )}
        {reports.map((report, index) => {
          if (!uid) return null;
          const isAttacker = report.attackerUid === uid;
          const opponent = isAttacker ? report.defenderPseudo : report.attackerPseudo;
          const result = outcomeForViewer(report.outcome, isAttacker);
          const myPower = isAttacker ? report.attackerPower : report.defenderPower;
          const opponentPower = isAttacker ? report.defenderPower : report.attackerPower;

          return (
            <motion.button
              key={report.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: Math.min(index, 10) * 0.02 }}
              onClick={() => showCombatResult(combatDisplayFromReportForViewer(report, uid))}
              className="flex w-full items-center gap-3 p-3 text-left transition hover:bg-white/5"
            >
              {isAttacker ? (
                <Sword className="h-4 w-4 shrink-0 text-cyan-glow" />
              ) : (
                <Shield className="h-4 w-4 shrink-0 text-gold-glow" />
              )}

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-slate-100">
                    {isAttacker ? "Toi" : opponent} <span className="text-slate-500">vs</span>{" "}
                    {isAttacker ? opponent : "Toi"}
                  </span>
                  <Badge variant={OUTCOME_STYLE[result].variant} className="shrink-0">
                    {OUTCOME_STYLE[result].label}
                  </Badge>
                </div>
                <p className="tabular-mono text-xs text-slate-500">
                  Puissance {formatNumber(myPower)} contre {formatNumber(opponentPower)}
                  {(() => {
                    const xp = isAttacker ? report.attackerXpDelta : report.defenderXpDelta;
                    if (xp === undefined || xp === 0) return null;
                    return (
                      <span className={xp > 0 ? "ml-2 text-mint-glow" : "ml-2 text-danger-glow"}>
                        {xp > 0 ? "+" : ""}
                        {xp} XP
                      </span>
                    );
                  })()}
                </p>
              </div>

              <span className="tabular-mono shrink-0 text-xs text-slate-500">{timeAgo(toMillis(report.timestamp))}</span>
            </motion.button>
          );
        })}
      </Card>

      <h2 className="hud-title mt-2 flex items-center gap-2 text-base text-white">
        <Eye className="h-4 w-4 text-cyan-glow" /> Espionnage
      </h2>
      <Card className="divide-y divide-white/5">
        {spyReports.length === 0 && <EmptyState icon="🛰️" title="Aucun rapport">Envoie des sondes depuis la carte ou la liste des joueurs.</EmptyState>}
        {spyReports.map((r) => {
          const mine = r.spyUid === uid;
          return (
            <div key={r.id} className="p-3">
              {mine ? (
                <button type="button" className="flex w-full items-center gap-3 text-left" onClick={() => setOpenSpy(openSpy === r.id ? null : r.id)}>
                  <Eye className="h-4 w-4 shrink-0 text-cyan-glow" />
                  <span className="flex-1 text-sm text-slate-200">
                    {r.targetPseudo ?? "?"} <span className="text-xs text-slate-500">· {SPY_TIER_LABELS[r.tier ?? 0]}</span>
                  </span>
                  <span className="tabular-mono text-xs text-slate-500">{timeAgo(r.timestamp)}</span>
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <ShieldAlert className="h-4 w-4 shrink-0 text-danger-glow" />
                  <span className="flex-1 text-sm text-slate-300">
                    {r.spyPseudo} t'a espionné ({r.probes ?? 0} sonde{(r.probes ?? 0) > 1 ? "s" : ""} abattue{(r.probes ?? 0) > 1 ? "s" : ""})
                  </span>
                  <span className="tabular-mono text-xs text-slate-500">{timeAgo(r.timestamp)}</span>
                </div>
              )}
              {mine && openSpy === r.id && (
                <div className="mt-3">
                  <SpyReportView report={r} />
                </div>
              )}
            </div>
          );
        })}
      </Card>
    </div>
  );
}
