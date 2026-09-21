import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadarScan } from "@/components/game/RadarScan";
import { OFFENSIVE_UNITS, findUnit } from "@/game/units";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { GameActionError, initiateAttack } from "@/services/playerService";
import { combatDisplayFromAttackerResult, showCombatResult } from "@/store/combatModalStore";

export function AttackModal({
  target,
  onClose,
}: {
  target: { uid: string; pseudo: string } | null;
  onClose: () => void;
}) {
  const player = usePlayerStore((s) => s.player);
  const uid = useAuthStore((s) => s.user?.uid);
  const [fleet, setFleet] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const setQty = (id: string, owned: number, value: number) => {
    const clamped = Math.max(0, Math.min(owned, value));
    setFleet((f) => ({ ...f, [id]: clamped }));
  };

  const handleConfirm = async () => {
    if (!uid || !player || !target) return;
    const selected = Object.fromEntries(Object.entries(fleet).filter(([, v]) => v > 0));
    if (Object.keys(selected).length === 0) {
      toast.error("Sélectionne au moins une unité à envoyer.");
      return;
    }

    setSubmitting(true);
    try {
      const combat = await initiateAttack({
        attackerUid: uid,
        attackerPseudo: player.pseudo,
        targetUid: target.uid,
        targetPseudo: target.pseudo,
        fleet: selected,
      });
      setFleet({});
      onClose();
      showCombatResult(combatDisplayFromAttackerResult(target.pseudo, combat));
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Attaque impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      {target && (
        <DialogContent>
          <DialogTitle>Envoyer une flotte</DialogTitle>
          <p className="text-sm text-slate-400">
            Cible : <strong className="text-slate-200">{target.pseudo}</strong>
          </p>

          {!player || submitting ? (
            <RadarScan label={submitting ? "Transmission de la flotte…" : "Chargement…"} />
          ) : (
            <>
              <div className="mt-4 space-y-2">
                {OFFENSIVE_UNITS.map((unitId) => {
                  const unit = findUnit(unitId);
                  const owned = player.units[unitId]?.count ?? 0;
                  if (!unit) return null;
                  return (
                    <div key={unitId} className="flex items-center gap-3 text-sm">
                      <span className="flex-1 text-slate-200">{unit.name}</span>
                      <span className="text-xs text-slate-500">Possédés : {owned}</span>
                      <Input
                        type="number"
                        min={0}
                        max={owned}
                        disabled={owned === 0}
                        value={fleet[unitId] ?? 0}
                        onChange={(e) => setQty(unitId, owned, parseInt(e.target.value) || 0)}
                        className="w-20"
                      />
                    </div>
                  );
                })}
              </div>

              <Button className="mt-4 w-full" variant="danger" onClick={() => void handleConfirm()}>
                Lancer l'attaque
              </Button>
            </>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
