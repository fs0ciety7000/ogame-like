import { allianceFlightFactor } from "@/game/alliances";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, Rocket } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadarScan } from "@/components/game/RadarScan";
import { OFFENSIVE_UNITS, findUnit } from "@/game/units";
import { COMBAT_RULES, fleetCargoCapacity } from "@/game/combat";
import { distanceBetween, fleetSpeed, travelSeconds } from "@/game/fleets";
import { formatDuration, formatNumber } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { GameActionError, sendFleet } from "@/services/playerService";
import { triggerWarpEffect } from "@/store/warpEffectStore";

/** Envoi d'une flotte d'attaque : le combat aura lieu à son arrivée. */
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

  const selected = Object.fromEntries(Object.entries(fleet).filter(([, v]) => v > 0));
  const hasShips = Object.keys(selected).length > 0;
  const distance = uid && target ? distanceBetween(uid, target.uid) : 0;
  const flight = player && hasShips ? travelSeconds(distance, fleetSpeed(player.units, selected), allianceFlightFactor(player.allianceResearch)) : null;

  const handleConfirm = async () => {
    if (!uid || !player || !target) return;
    if (!hasShips) {
      toast.error("Sélectionne au moins une unité à envoyer.");
      return;
    }
    setSubmitting(true);
    try {
      const sent = await sendFleet(target.uid, selected);
      setFleet({});
      onClose();
      triggerWarpEffect();
      toast.success(`Flotte en route vers ${target.pseudo}`, {
        description: `Impact dans ${formatDuration((sent.arriveAtMs - Date.now()) / 1000)}. Tu peux la rappeler avant l'arrivée.`,
        duration: 6000,
      });
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Envoi impossible.");
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
            Cible : <strong className="text-slate-200">{target.pseudo}</strong> · distance {Math.round(distance)}
          </p>

          {!player || submitting ? (
            <RadarScan label={submitting ? "Décollage de la flotte…" : "Chargement…"} />
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
                      <span className="text-xs text-slate-500">VIT {unit.stats.vitesse * Math.max(1, player.units[unitId]?.level ?? 1)}</span>
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

              <div className="mt-3 space-y-1.5 rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-400">
                <p className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-cyan-glow" />
                  {flight !== null ? (
                    <span>
                      Temps de vol : <strong className="tabular-mono text-slate-200">{formatDuration(flight)}</strong> (arrivée vers{" "}
                      {new Date(Date.now() + flight * 1000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}) — le
                      vaisseau le plus lent fixe l'allure.
                    </span>
                  ) : (
                    <span>Choisis tes vaisseaux pour connaître le temps de vol.</span>
                  )}
                </p>
                <p>
                  📦 Cargaison : <strong className="tabular-mono text-slate-200">{formatNumber(fleetCargoCapacity(player.units, fleet))}</strong>{" "}
                  ressources. En cas de victoire, tu pilles {Math.round(COMBAT_RULES.lootPercentCommon * 100)} % des ressources communes et{" "}
                  {Math.round(COMBAT_RULES.lootPercent * 100)} % des rares, dans la limite de la cargaison des survivants ; le butin
                  arrive au retour de la flotte.
                </p>
                <p className="text-slate-500">
                  Le défenseur voit ta flotte arriver. Ses vaisseaux à quai l'aident à se défendre et son Hangar de défense absorbe
                  une partie de ton attaque.
                </p>
              </div>

              <Button className="mt-4 w-full" variant="danger" disabled={!hasShips} onClick={() => void handleConfirm()}>
                <Rocket className="mr-1.5 h-4 w-4" /> Envoyer la flotte
              </Button>
            </>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
