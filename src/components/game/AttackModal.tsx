import { allianceFlightFactor } from "@/game/alliances";
import { FormationPicker } from "@/components/game/FormationPicker";
import type { FormationId } from "@/game/formations";
import { useEffect, useMemo, useState } from "react";
import { simulateAgainstReport } from "@/game/simulator";
import { lootFactor } from "@/game/events";
import { SPY_TIER_LABELS } from "@/game/espionage";
import { fetchLatestSpyReport } from "@/services/playerService";
import { ResourceIcon } from "@/components/ui/game-icon";
import { timeAgo, formatCompact } from "@/lib/utils";
import type { SpyReport } from "@/types/game";
import { toast } from "sonner";
import { Bookmark, Clock, Rocket, Snail, X } from "lucide-react";
import { applyPreset, deleteFleetPreset, MAX_PRESETS, saveFleetPreset, useFleetPresets } from "@/lib/fleetPresets";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadarScan } from "@/components/game/RadarScan";
import { OFFENSIVE_UNITS, findUnit } from "@/game/units";
import { COMBAT_RULES, fleetCargoCapacity } from "@/game/combat";
import { attackTravelSeconds, distanceBetween, FLEET_RULES, fleetSpeed, slowestUnits, travelSeconds } from "@/game/fleets";
import { formatDuration, formatNumber } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { GameActionError, sendFleet } from "@/services/playerService";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { GameIcon } from "@/components/ui/game-icon";

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
  const [formation, setFormation] = useState<FormationId>("balanced");
  const presets = useFleetPresets(uid);
  // v3.8 : estimation d'après le dernier rapport d'espionnage sur la cible.
  const [spy, setSpy] = useState<SpyReport | null>(null);
  useEffect(() => {
    setSpy(null);
    if (!uid || !target) return;
    let alive = true;
    fetchLatestSpyReport(uid, target.uid)
      .then((r) => alive && setSpy(r))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [uid, target]);
  const [presetName, setPresetName] = useState("");
  const owned = Object.fromEntries(OFFENSIVE_UNITS.map((id) => [id, player?.units[id]?.count ?? 0]));

  const setQty = (id: string, owned: number, value: number) => {
    const clamped = Math.max(0, Math.min(owned, value));
    setFleet((f) => ({ ...f, [id]: clamped }));
  };

  const selected = Object.fromEntries(Object.entries(fleet).filter(([, v]) => v > 0));
  const hasShips = Object.keys(selected).length > 0;
  const distance = uid && target ? distanceBetween(uid, target.uid) : 0;
  const factor = player ? allianceFlightFactor(player.allianceResearch, player.techLevels) : 1;
  const flight = player && hasShips ? attackTravelSeconds(distance, fleetSpeed(player.units, selected), factor) : null;
  const uncapped = player && hasShips ? travelSeconds(distance, fleetSpeed(player.units, selected), factor) : null;
  // v3.7 : le ou les vaisseaux qui fixent l'allure, et le trajet sans eux.
  const slow = player && hasShips ? slowestUnits(player.units, selected) : null;
  const flightWithout = slow?.speedWithout ? attackTravelSeconds(distance, slow.speedWithout, factor) : null;
  const slowNames = slow ? slow.ids.map((id) => findUnit(id)?.name ?? id).join(", ") : "";
  const estimate = useMemo(
    () => (player && hasShips && spy ? simulateAgainstReport(player, selected, spy, lootFactor(Date.now()), formation) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `selected` dérive de `fleet`
    [player, fleet, spy, formation],
  );

  const handleConfirm = async () => {
    if (!uid || !player || !target) return;
    if (!hasShips) {
      toast.error("Sélectionne au moins une unité à envoyer.");
      return;
    }
    setSubmitting(true);
    try {
      const sent = await sendFleet(target.uid, selected, "attack", { formation });
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
              {/* v3.8 : compositions enregistrées */}
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                <Bookmark className="h-3.5 w-3.5 text-slate-500" aria-hidden />
                {presets.map((p) => (
                  <span key={p.id} className="group inline-flex items-center border border-cyan-glow/25 bg-cyan-glow/5 text-xs">
                    <button type="button" className="px-2 py-1 text-cyan-glow hover:bg-cyan-glow/10" title="Appliquer (dans la limite de tes vaisseaux)" onClick={() => setFleet(applyPreset(p, owned, OFFENSIVE_UNITS))}>
                      {p.name}
                    </button>
                    <button type="button" aria-label={`Supprimer ${p.name}`} className="px-1 py-1 text-slate-500 hover:text-danger-glow" onClick={() => uid && deleteFleetPreset(uid, p.id)}>
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                <button type="button" className="px-2 py-1 text-xs text-slate-400 hover:text-white" onClick={() => setFleet(owned)}>
                  Tout
                </button>
                <button type="button" className="px-2 py-1 text-xs text-slate-400 hover:text-white" onClick={() => setFleet({})}>
                  Vider
                </button>
              </div>

              <div className="mt-3 space-y-2">
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
                      {new Date(Date.now() + flight * 1000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })})
                      {uncapped !== null && uncapped > flight && <> — plafonné à {FLEET_RULES.maxAttackMinutes} min</>}.
                    </span>
                  ) : (
                    <span>Choisis tes vaisseaux pour connaître le temps de vol.</span>
                  )}
                </p>
                {slow && flight !== null && (
                  <p className="flex items-start gap-1.5">
                    <Snail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ember-glow" />
                    <span>
                      Allure fixée par : <strong className="text-ember-glow">{slowNames}</strong> (vitesse {slow.speed}).{" "}
                      {flightWithout !== null ? (
                        flightWithout < flight ? (
                          <>
                            Sans {slow.ids.length > 1 ? "eux" : "lui"} : <strong className="tabular-mono text-slate-200">{formatDuration(flightWithout)}</strong> (vitesse {slow.speedWithout}).
                          </>
                        ) : (
                          <>Les retirer ne raccourcit pas le trajet.</>
                        )
                      ) : (
                        <>Ajoute des vaisseaux plus rapides pour comparer.</>
                      )}
                    </span>
                  </p>
                )}
                <p>
                  <GameIcon name="storage" /> Cargaison : <strong className="tabular-mono text-slate-200">{formatNumber(fleetCargoCapacity(player.units, fleet, player.techLevels))}</strong>{" "}
                  ressources. En cas de victoire, tu pilles {Math.round(COMBAT_RULES.lootPercentCommon * 100)} % des ressources communes et{" "}
                  {Math.round(COMBAT_RULES.lootPercent * 100)} % des rares, dans la limite de la cargaison des survivants ; le butin
                  arrive au retour de la flotte.
                </p>
                <p className="text-slate-500">
                  Le défenseur voit ta flotte arriver. Ses vaisseaux à quai l'aident à se défendre et son Hangar de défense absorbe
                  une partie de ton attaque.
                </p>
              </div>

              {hasShips && uid && (
                <form
                  className="mt-3 flex items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveFleetPreset(uid, presetName || "Composition", selected);
                    setPresetName("");
                    toast.success("Composition enregistrée", { description: `Max ${MAX_PRESETS} ; un même nom remplace l'ancienne.` });
                  }}
                >
                  <Input value={presetName} onChange={(e) => setPresetName(e.target.value)} placeholder="Nom (ex. Raid rapide)" maxLength={24} className="h-8 flex-1 text-xs" />
                  <Button type="submit" variant="outline" size="sm">
                    <Bookmark className="h-3.5 w-3.5" /> Enregistrer
                  </Button>
                </form>
              )}

              <FormationPicker value={formation} onChange={setFormation} className="mt-4" />

              {/* v3.8 : estimation du combat */}
              <div className="mt-3 border border-white/10 bg-black/20 px-3 py-2 text-xs">
                {!spy || (spy.tier ?? 0) < 2 ? (
                  <p className="text-slate-500">
                    {spy ? `Dernier rapport trop sommaire (${SPY_TIER_LABELS[spy.tier ?? 0]}) : ` : "Aucun rapport d'espionnage : "}
                    espionne la cible pour estimer l'issue du combat.
                  </p>
                ) : !estimate ? (
                  <p className="text-slate-500">Choisis tes vaisseaux pour estimer le combat (rapport {timeAgo(spy.timestamp)}).</p>
                ) : (
                  (() => {
                    const c = estimate.combat;
                    const win = c.outcome === "attacker_win";
                    const draw = c.outcome === "draw";
                    const loot = Object.entries(c.loot ?? {}).filter(([, v]) => (v ?? 0) > 0);
                    return (
                      <div className="flex flex-col gap-1">
                        <p className="flex flex-wrap items-baseline gap-x-2">
                          <span className="hud-eyebrow text-[10px] text-slate-500">Estimation</span>
                          <strong className={win ? "text-mint-glow" : draw ? "text-gold-glow" : "text-danger-glow"}>
                            {win ? "Victoire probable" : draw ? "Égalité probable" : "Défaite probable"}
                          </strong>
                          <span className="text-slate-500">· rapport {timeAgo(spy.timestamp)}</span>
                        </p>
                        <p className="text-slate-400">
                          Tes pertes ≈ <strong className="text-slate-200">{Math.round(c.attackerLossPercent * 100)} %</strong> · pertes adverses ≈{" "}
                          <strong className="text-slate-200">{Math.round(c.defenderLossPercent * 100)} %</strong>
                          {!win && Number.isFinite(estimate.winFactor) && estimate.winFactor > 1 && (
                            <> · il te faudrait environ ×{estimate.winFactor.toFixed(1)} de puissance</>
                          )}
                        </p>
                        {win && loot.length > 0 && (
                          <p className="flex flex-wrap items-center gap-x-2 text-mint-glow">
                            Butin ≈
                            {loot.map(([res, n]) => (
                              <span key={res} className="flex items-center gap-0.5">
                                <ResourceIcon id={res} /> {formatCompact(n ?? 0)}
                              </span>
                            ))}
                          </p>
                        )}
                        {estimate.notes.length > 0 && <p className="text-[10px] text-slate-600">{estimate.notes[0]}</p>}
                      </div>
                    );
                  })()
                )}
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
