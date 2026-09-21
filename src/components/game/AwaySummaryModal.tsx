import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { closeAwaySummary, useAwaySummaryStore } from "@/store/awaySummaryStore";
import { RESOURCE_LIST, resourceEmoji } from "@/game/resources";
import { formatDuration, formatNumber } from "@/lib/utils";
import type { ResourceId } from "@/types/game";
import type { NotificationKind } from "@/types/game";

const KIND_LABEL: Record<NotificationKind, string> = {
  building: "Construction terminée",
  research: "Recherche terminée",
  unit: "Unité produite",
  mission: "Mission accomplie",
  "combat-attacker": "Rapport de combat",
  "combat-defender": "Attaque subie",
  achievement: "Succès débloqué",
  "spy-detected": "Tentative d'espionnage détectée",
  gift: "Don reçu",
  system: "Évènement",
};

export function AwaySummaryModal() {
  const current = useAwaySummaryStore((s) => s.current);

  return (
    <Dialog open={current !== null} onOpenChange={(open) => !open && closeAwaySummary()}>
      {current && (
        <DialogContent>
          <DialogTitle>Pendant ton absence</DialogTitle>
          <p className="text-sm text-slate-400">Tu étais parti {formatDuration(current.elapsedMs / 1000)}.</p>

          {Object.keys(current.resourceGains).length > 0 && (
            <div className="mt-4">
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Production accumulée</h4>
              <div className="flex flex-wrap gap-2">
                {RESOURCE_LIST.filter((r) => (current.resourceGains[r.id as ResourceId] ?? 0) > 0).map((r) => (
                  <span key={r.id} className="rounded bg-space-800 px-2 py-1 text-sm text-mint-glow">
                    {resourceEmoji(r.id)} +{formatNumber(current.resourceGains[r.id as ResourceId] ?? 0)}
                  </span>
                ))}
              </div>
            </div>
          )}

          {current.notifications.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Évènements</h4>
              <ul className="space-y-1.5 text-sm text-slate-300">
                {current.notifications.map((n, i) => (
                  <li key={i} className="flex items-start justify-between gap-3">
                    <span className="text-xs text-slate-500">{KIND_LABEL[n.kind]}</span>
                    <span className="text-right">{n.message}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {Object.keys(current.resourceGains).length === 0 && current.notifications.length === 0 && (
            <p className="mt-4 text-sm text-slate-500">Rien de notable ne s'est passé.</p>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
