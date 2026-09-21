import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ParticleBurst } from "@/components/ui/particle-burst";
import { closeCombatResult, useCombatModalStore } from "@/store/combatModalStore";
import { findUnit } from "@/game/units";
import { RESOURCE_LIST, resourceEmoji } from "@/game/resources";
import { formatNumber } from "@/lib/utils";
import type { CombatOutcome } from "@/types/game";

/** Réplique animée du choc des deux flottes : deux barres de puissance
 *  grandissent l'une vers l'autre depuis les bords, se rencontrent au
 *  point proportionnel à leur rapport de force, puis un flash marque
 *  l'impact — plus parlant que les seuls chiffres qui suivent. */
function CombatClash({ myPower, opponentPower }: { myPower: number; opponentPower: number }) {
  const total = Math.max(myPower + opponentPower, 1);
  const myPct = (myPower / total) * 100;
  const oppPct = 100 - myPct;

  return (
    <div className="relative mt-3 h-9 overflow-hidden rounded-lg bg-space-800/80">
      <motion.div
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-glow/80 to-cyan-glow/40"
        initial={{ width: "0%" }}
        animate={{ width: `${myPct}%` }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-y-0 right-0 bg-gradient-to-l from-danger-glow/80 to-danger-glow/40"
        initial={{ width: "0%" }}
        animate={{ width: `${oppPct}%` }}
        transition={{ duration: 0.65, ease: "easeOut" }}
      />
      <motion.div
        className="absolute inset-0 bg-white"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0] }}
        transition={{ delay: 0.6, duration: 0.35, ease: "easeOut" }}
      />
      <div className="absolute inset-0 flex items-center justify-between px-2.5 text-[11px] font-medium tabular-mono text-white/90">
        <span>{formatNumber(myPower)}</span>
        <span>{formatNumber(opponentPower)}</span>
      </div>
    </div>
  );
}

const OUTCOME_STYLE: Record<CombatOutcome, { attacker: string; defender: string; color: string }> = {
  attacker_win: { attacker: "Victoire !", defender: "Tu as perdu ce combat…", color: "text-mint-glow" },
  defender_win: { attacker: "Défaite…", defender: "Attaque repoussée !", color: "text-danger-glow" },
  draw: { attacker: "Match nul", defender: "Match nul", color: "text-gold-glow" },
};

function LossList({ losses, recovered }: { losses: Record<string, number>; recovered: Record<string, number> }) {
  const entries = Object.entries(losses).filter(([, v]) => v > 0);
  if (entries.length === 0) return <p className="text-sm text-slate-500">Aucune perte</p>;

  return (
    <ul className="space-y-1 text-sm">
      {entries.map(([id, count]) => {
        const rec = recovered[id] ?? 0;
        const name = findUnit(id)?.name ?? id;
        return (
          <li key={id} className="flex items-center justify-between gap-2 text-slate-300">
            <span>{name}</span>
            <span className="text-danger-glow">
              -{count + rec} {rec > 0 && <span className="text-slate-500">(dont {rec} réparées)</span>}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export function CombatResultModal() {
  const current = useCombatModalStore((s) => s.current);
  const isVictory =
    !!current &&
    ((current.perspective === "attacker" && current.outcome === "attacker_win") ||
      (current.perspective === "defender" && current.outcome === "defender_win"));

  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && closeCombatResult()}>
      {current && (
        <DialogContent className="relative overflow-visible">
          {isVictory && <ParticleBurst />}
          <DialogTitle className={OUTCOME_STYLE[current.outcome].color}>
            {current.perspective === "attacker" ? OUTCOME_STYLE[current.outcome].attacker : OUTCOME_STYLE[current.outcome].defender}
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-400">
            {current.perspective === "attacker" ? "Contre" : "Attaque de"} <strong className="text-slate-200">{current.opponentPseudo}</strong>
          </p>
          <p className="text-xs text-slate-500">
            Ta puissance : {formatNumber(current.myPower)} — Puissance adverse : {formatNumber(current.opponentPower)}
          </p>

          <CombatClash myPower={current.myPower} opponentPower={current.opponentPower} />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Tes pertes</h4>
              <LossList losses={current.myLosses} recovered={current.myRecovered} />
            </div>
            <div>
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Pertes adverses</h4>
              <LossList losses={current.opponentLosses} recovered={current.opponentRecovered} />
            </div>
          </div>

          <div className="mt-4">
            <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {current.perspective === "attacker" ? "Butin" : "Ressources perdues"}
            </h4>
            {current.loot && Object.values(current.loot).some((v) => v && v > 0) ? (
              <ul className="space-y-1 text-sm">
                {Object.entries(current.loot)
                  .filter(([, v]) => v && v > 0)
                  .map(([res, v]) => (
                    <li key={res} className="flex items-center justify-between text-slate-300">
                      <span>
                        {resourceEmoji(res)} {RESOURCE_LIST.find((r) => r.id === res)?.name ?? res}
                      </span>
                      <span className={current.perspective === "attacker" ? "text-mint-glow" : "text-danger-glow"}>
                        {current.perspective === "attacker" ? "+" : "-"}
                        {formatNumber(v ?? 0)}
                      </span>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-sm text-slate-500">Aucune ressource concernée</p>
            )}
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}
