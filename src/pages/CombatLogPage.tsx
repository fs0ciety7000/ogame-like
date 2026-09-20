import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sword, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { subscribeBattleLog } from "@/services/playerService";
import { useAuthStore } from "@/store/authStore";
import { combatDisplayFromReportForViewer, showCombatResult } from "@/store/combatModalStore";
import { firestoreMillis, formatNumber, timeAgo } from "@/lib/utils";
import type { BattleReport, CombatOutcome } from "@/types/game";

const OUTCOME_STYLE: Record<"victory" | "defeat" | "draw", { label: string; className: string }> = {
  victory: { label: "Victoire", className: "text-mint-glow" },
  defeat: { label: "Défaite", className: "text-danger-glow" },
  draw: { label: "Match nul", className: "text-gold-glow" },
};

function outcomeForViewer(outcome: CombatOutcome, isAttacker: boolean): "victory" | "defeat" | "draw" {
  if (outcome === "draw") return "draw";
  const won = isAttacker ? outcome === "attacker_win" : outcome === "defender_win";
  return won ? "victory" : "defeat";
}

export function CombatLogPage() {
  const uid = useAuthStore((s) => s.user?.uid);
  const [reports, setReports] = useState<BattleReport[]>([]);

  useEffect(() => {
    if (!uid) return;
    return subscribeBattleLog(uid, setReports);
  }, [uid]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl text-white glow-text">Journal de combat</h1>

      <Card className="divide-y divide-white/5">
        {reports.length === 0 && (
          <p className="p-4 text-sm text-slate-500">Aucun combat pour l'instant. Tes attaques lancées et reçues apparaîtront ici.</p>
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
                  <span className={`shrink-0 text-xs font-medium ${OUTCOME_STYLE[result].className}`}>
                    {OUTCOME_STYLE[result].label}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Puissance {formatNumber(myPower)} contre {formatNumber(opponentPower)}
                </p>
              </div>

              <span className="shrink-0 text-xs text-slate-500">{timeAgo(firestoreMillis(report.timestamp))}</span>
            </motion.button>
          );
        })}
      </Card>
    </div>
  );
}
