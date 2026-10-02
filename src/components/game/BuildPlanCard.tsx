import { useState } from "react";
import { toast } from "sonner";
import { CalendarClock, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { BUILD_PLAN_RULES, buildPlan, planSlots } from "@/game/buildPlan";
import { findBuilding } from "@/game/buildings";
import { GameActionError, unplanBuilding } from "@/services/playerService";
import { formatDuration } from "@/lib/utils";
import type { PlayerState, QueuesState } from "@/types/game";

/* v4.9 : file planifiée des bâtiments (encart en haut de la page Bâtiments). */

export function BuildPlanCard({ player, queues, now }: { player: PlayerState; queues: QueuesState; now: number }) {
  const [busy, setBusy] = useState(false);
  const plan = buildPlan(queues);
  const slots = planSlots(player);
  const nextSlot = BUILD_PLAN_RULES.slotLevels[slots];

  const remove = async (index: number) => {
    setBusy(true);
    try {
      await unplanBuilding(index);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Action impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-2 p-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="hud-title flex items-center gap-2 text-sm text-white">
          <CalendarClock className="h-4 w-4 text-cyan-glow" /> File planifiée
        </h2>
        <span className="font-mono text-xs text-slate-400">
          {plan.length} / {slots}
        </span>
        <span className="ml-auto text-[11px] text-slate-500">
          {nextSlot !== undefined ? `Emplacement suivant : Fonderie quantique niveau ${nextSlot}.` : "Tous les emplacements sont ouverts."}
        </span>
      </div>
      {plan.length === 0 ? (
        <p className="text-xs text-slate-500">
          « Programmer » sur un bâtiment : l'amélioration démarre seule dès que son chantier est libre et que tu as les ressources, même hors ligne. Payée au lancement, retirée après {BUILD_PLAN_RULES.maxWaitHours} h sans ressources.
        </p>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {plan.map((p, i) => {
            const def = findBuilding(p.buildingId);
            const upgrading = !!queues.buildingUpgrades[p.buildingId as keyof typeof queues.buildingUpgrades];
            const status = p.waitingSinceMs
              ? `ressources insuffisantes · retiré dans ${formatDuration(Math.max(0, p.waitingSinceMs + BUILD_PLAN_RULES.maxWaitHours * 3600_000 - now) / 1000)}`
              : upgrading
                ? "après le chantier en cours"
                : p.level > (player.buildings[p.buildingId]?.level ?? 0) + 1
                  ? "en attente du niveau précédent"
                  : "lancement dès que possible";
            return (
              <li key={`${p.buildingId}-${p.level}`} className="flex items-center gap-2 border border-white/5 bg-white/[0.02] px-2 py-1.5 text-xs">
                <span className="font-mono text-slate-500">{i + 1}.</span>
                <span className="text-slate-200">
                  {def?.name ?? p.buildingId} <span className="text-gold-glow">→ niv. {p.level}</span>
                </span>
                <span className={p.waitingSinceMs ? "text-ember-glow" : "text-slate-500"}>{status}</span>
                <button type="button" disabled={busy} onClick={() => void remove(i)} title="Retirer (gratuit)" className="ml-auto p-1 text-slate-500 hover:text-danger-glow">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            );
          })}
        </ol>
      )}
    </Card>
  );
}
