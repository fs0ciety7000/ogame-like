import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { closeCombatResult, useCombatModalStore } from "@/store/combatModalStore";
import { findUnit } from "@/game/units";
import { RESOURCE_LIST, resourceEmoji } from "@/game/resources";
import { formatNumber } from "@/lib/utils";
import type { CombatOutcome } from "@/types/game";

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

  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && closeCombatResult()}>
      {current && (
        <DialogContent>
          <DialogTitle className={OUTCOME_STYLE[current.outcome].color}>
            {current.perspective === "attacker" ? OUTCOME_STYLE[current.outcome].attacker : OUTCOME_STYLE[current.outcome].defender}
          </DialogTitle>
          <p className="mt-1 text-sm text-slate-400">
            {current.perspective === "attacker" ? "Contre" : "Attaque de"} <strong className="text-slate-200">{current.opponentPseudo}</strong>
          </p>
          <p className="text-xs text-slate-500">
            Ta puissance : {formatNumber(current.myPower)} — Puissance adverse : {formatNumber(current.opponentPower)}
          </p>

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
