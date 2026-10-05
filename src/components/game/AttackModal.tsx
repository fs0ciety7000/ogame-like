import { allianceFlightFactor } from "@/game/alliances";
import { HullWarning } from "@/components/game/HullWarning";
import { SkeletonList } from "@/components/ui/skeleton";
import { FormationPicker, TargetPriorityPicker, type TargetPriorityChoice } from "@/components/game/FormationPicker";
import type { FormationId } from "@/game/formations";
import { useEffect, useMemo, useState } from "react";
import { simulateAgainstReport } from "@/game/simulator";
import { playerCombatEffects } from "@/game/effectTargets";
import { isWarlordUid } from "@/game/warlords";
import { loadWarlords, useWarlordsStore } from "@/services/warlordService";
import { DepartureDelayPicker } from "@/components/game/DepartureDelayPicker";
import { lootFactor } from "@/game/events";
import { SPY_TIER_LABELS } from "@/game/espionage";
import { fetchLatestSpyReport } from "@/services/playerService";
import { ResourceIcon } from "@/components/ui/game-icon";
import { timeAgo, formatCompact } from "@/lib/utils";
import type { SpyReport } from "@/types/game";
import { toast } from "sonner";
import { Bookmark, Clock, Rocket, Snail, Swords, X } from "lucide-react";
import { applyPreset, deleteFleetPreset, MAX_PRESETS, saveFleetPreset, useFleetPresets } from "@/lib/fleetPresets";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { RadarScan } from "@/components/game/RadarScan";
import { OFFENSIVE_UNITS as ALL_OFFENSIVE, findUnit, isEliteUnit } from "@/game/units";
import { COMBAT_RULES, computeFleetPower, pveAttackFactor } from "@/game/combat";
import { formationEffects } from "@/game/formations";
import { attackTravelSeconds, distanceBetween, FLEET_RULES, fleetSpeed, slowestUnits, travelSeconds } from "@/game/fleets";
import { formatDuration, formatNumber } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { weakTargetFactor } from "@/game/pvp";
import { HudCallout } from "@/components/ui/hud";
import { GameActionError, sendFleet } from "@/services/playerService";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { GameIcon } from "@/components/ui/game-icon";
import { playerCargoCapacity, playerModifiers } from "@/game/modifiers";
import { CAPSULES, capsulePct, synthesisState } from "@/game/synthesis";
import { FlaskConical } from "lucide-react";

/** Envoi d'une flotte d'attaque : le combat aura lieu à son arrivée. */
export function AttackModal({
  target,
  onClose,
  initialFleet,
}: {
  target: { uid: string; pseudo: string; xp?: number } | null;
  onClose: () => void;
  /** 5.23 : flotte proposée à l'ouverture (réattaquer depuis un rapport), dans la limite du stock. */
  initialFleet?: Record<string, number>;
}) {
  const player = usePlayerStore((s) => s.player);
  const uid = useAuthStore((s) => s.user?.uid);
  const [fleet, setFleet] = useState<Record<string, number>>({});
  // 5.23 : réattaquer avec la même flotte (ramenée aux vaisseaux à quai).
  useEffect(() => {
    if (!target || !initialFleet) return;
    const owned = usePlayerStore.getState().player?.units ?? {};
    setFleet(Object.fromEntries(Object.entries(initialFleet).map(([id, n]) => [id, Math.min(n, owned[id]?.count ?? 0)]).filter(([, n]) => (n as number) > 0)));
  }, [target?.uid, initialFleet]);
  const [submitting, setSubmitting] = useState(false);
  const [formation, setFormation] = useState<FormationId>("balanced");
  const [priority, setPriority] = useState<TargetPriorityChoice>("");
  const [delay, setDelay] = useState(0);
  // v4.0 : capsules du Labo de synthèse (niveau choisi, 0 = aucune).
  const [assault, setAssault] = useState(0);
  const [decoy, setDecoy] = useState(0);
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
  // 5.22 : unités d'élite proposées contre les seigneurs de guerre seulement.
  const OFFENSIVE_UNITS = ALL_OFFENSIVE.filter((id) => !isEliteUnit(id) || isWarlordUid(target?.uid));
  const owned = Object.fromEntries(OFFENSIVE_UNITS.map((id) => [id, player?.units[id]?.count ?? 0]));

  const setQty = (id: string, owned: number, value: number) => {
    const clamped = Math.max(0, Math.min(owned, value));
    setFleet((f) => ({ ...f, [id]: clamped }));
  };

  const selected = Object.fromEntries(Object.entries(fleet).filter(([, v]) => v > 0));
  const hasShips = Object.keys(selected).length > 0;
  const distance = uid && target ? distanceBetween(uid, target.uid) : 0;
  const factor = player ? allianceFlightFactor(player.allianceResearch, player.techLevels, player) : 1;
  const flight = player && hasShips ? attackTravelSeconds(distance, fleetSpeed(player.units, selected), factor) : null;
  const uncapped = player && hasShips ? travelSeconds(distance, fleetSpeed(player.units, selected), factor) : null;
  // v3.7 : le ou les vaisseaux qui fixent l'allure, et le trajet sans eux.
  const slow = player && hasShips ? slowestUnits(player.units, selected) : null;
  const flightWithout = slow?.speedWithout ? attackTravelSeconds(distance, slow.speedWithout, factor) : null;
  const slowNames = slow ? slow.ids.map((id) => findUnit(id)?.name ?? id).join(", ") : "";
  // 5.23 : seigneur visé : son rang et son trait entrent dans l'estimation (contrés par l'élite).
  const lord = useWarlordsStore((st) => st.list.find((w) => w.uid === target?.uid));
  useEffect(() => {
    if (isWarlordUid(target?.uid)) void loadWarlords().catch(() => undefined);
  }, [target?.uid]);
  const estimate = useMemo(
    () =>
      player && hasShips && spy
        ? simulateAgainstReport(
            player,
            selected,
            spy,
            lootFactor(Date.now()),
            formation,
            playerModifiers(player).attack + capsulePct(assault) / 100,
            isWarlordUid(target?.uid),
            priority || undefined,
            playerCombatEffects(player, isWarlordUid(target?.uid) ? "warlord" : "pvp"),
            lord ? { personality: lord.personality, rank: lord.rank ?? 1 } : undefined,
          )
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `selected` dérive de `fleet`
    [player, fleet, spy, formation, assault, target?.uid, priority, lord],
  );

  const handleConfirm = async () => {
    if (!uid || !player || !target) return;
    if (!hasShips) {
      toast.error("Sélectionne au moins une unité à envoyer.");
      return;
    }
    setSubmitting(true);
    try {
      const capsules = { ...(assault ? { assault } : {}), ...(decoy ? { decoy } : {}) };
      const sent = await sendFleet(target.uid, selected, "attack", { formation, ...(priority ? { targetPriority: priority } : {}), ...(assault || decoy ? { capsules } : {}), ...(delay > 0 ? { delayMinutes: delay } : {}) });
      setDelay(0);
      setAssault(0);
      setDecoy(0);
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
          {/* 5.23 : cible bien moins expérimentée : butin et XP dégressifs. */}
          {player && target.xp !== undefined && !isWarlordUid(target.uid) && weakTargetFactor(player.xp ?? 0, target.xp) < 1 && (
            <HudCallout tone="ember" className="mt-2 text-xs">
              Cible bien moins expérimentée : butin et XP réduits à <span className="font-mono">{Math.round(weakTargetFactor(player.xp ?? 0, target.xp) * 100)} %</span>.
            </HudCallout>
          )}

          {!player || submitting ? (
            submitting ? <RadarScan label="Décollage de la flotte…" /> : <SkeletonList rows={4} className="py-2" />
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
                <button type="button" className="px-2 py-1 text-xs text-slate-400 hover:text-slate-100" onClick={() => setFleet(owned)}>
                  Tout
                </button>
                <button type="button" className="px-2 py-1 text-xs text-slate-400 hover:text-slate-100" onClick={() => setFleet({})}>
                  Vider
                </button>
              </div>

              <div className="mt-3 space-y-2">
                {OFFENSIVE_UNITS.map((unitId) => {
                  const unit = findUnit(unitId);
                  const owned = player.units[unitId]?.count ?? 0;
                  if (!unit) return null;
                  return (
                    <div key={unitId} className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 text-sm">
                      <span className="flex-1 text-slate-200">{unit.name}</span>
                      <span className="text-xs text-slate-500">VIT {unit.stats.vitesse * Math.max(1, player.units[unitId]?.level ?? 1)}</span>
                      <span className="text-xs text-slate-500">Possédés : {owned}</span>
                      <NumberInput
                        size="sm"
                        max={owned}
                        disabled={owned === 0}
                        value={fleet[unitId] ?? 0}
                        onChange={(v) => setQty(unitId, owned, v)}
                        aria-label={`Quantité ${unit.name}`}
                        className="w-40"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 space-y-1.5 hud-cut-sm bg-black/20 px-3 py-2 text-xs text-slate-400">
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
                {(() => {
                  // v5.9 : puissance d'attaque réelle de la flotte choisie (bonus compris).
                  const base = computeFleetPower(player.units, player.techLevels, selected, ["attack"]);
                  const pve = isWarlordUid(target?.uid) ? pveAttackFactor(player.units, player.techLevels, selected) : 1;
                  const bonus = playerModifiers(player).attack + capsulePct(assault) / 100;
                  const total = Math.round(base * formationEffects(formation).attackFactor * (1 + bonus) * pve);
                  const parts = [
                    formationEffects(formation).attackFactor !== 1 && `formation ×${formationEffects(formation).attackFactor.toFixed(2)}`,
                    bonus > 0 && `officiers, reliques et capsule +${Math.round(bonus * 100)} %`,
                    pve > 1 && `Traqueurs Kesh contre un PNJ +${Math.round((pve - 1) * 100)} %`,
                  ].filter(Boolean);
                  return (
                    <p className="flex items-start gap-1.5">
                      <Swords className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger-glow" />
                      <span>
                        Puissance d'attaque : <strong className="tabular-mono text-slate-200">{formatNumber(total)}</strong>
                        {hasShips && parts.length > 0 ? <span className="text-slate-500"> (base {formatNumber(Math.round(base))} · {parts.join(" · ")})</span> : null}
                        {!hasShips && <span className="text-slate-500"> — choisis tes vaisseaux.</span>}
                      </span>
                    </p>
                  );
                })()}
                <p>
                  <GameIcon name="storage" /> Cargaison : <strong className="tabular-mono text-slate-200">{formatNumber(Math.floor(playerCargoCapacity(player, selected) * formationEffects(formation).cargoFactor))}</strong>{" "}
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
              <TargetPriorityPicker value={priority} onChange={setPriority} className="mt-3" />
              <DepartureDelayPicker value={delay} onChange={setDelay} className="mt-3" />
              {player && <HullWarning player={player} fleet={selected} />}

              {/* v4.0 : capsules du Labo de synthèse */}
              {(() => {
                const stock = synthesisState(player).stock;
                const rows = (["assault", "decoy"] as const).filter((t) => stock[t].length > 0);
                if (rows.length === 0) return null;
                return (
                  <div className="mt-3 flex flex-col gap-1.5 border border-violet-glow/25 bg-violet-glow/[0.05] px-3 py-2 text-xs">
                    <p className="flex items-center gap-1.5 text-violet-glow">
                      <FlaskConical className="h-3.5 w-3.5" /> Capsules embarquées (invisibles à l'espionnage)
                    </p>
                    {rows.map((type) => {
                      const value = type === "assault" ? assault : decoy;
                      const set = type === "assault" ? setAssault : setDecoy;
                      const levels = [...new Set(stock[type])].sort((a, b) => b - a);
                      return (
                        <div key={type} className="flex flex-wrap items-center gap-1.5">
                          <span className="w-36 text-slate-300">{CAPSULES[type].name}</span>
                          <button type="button" onClick={() => set(0)} className={value === 0 ? "border border-white/30 px-2 py-0.5 text-slate-100" : "border border-white/10 px-2 py-0.5 text-slate-500"}>
                            Aucune
                          </button>
                          {levels.map((l) => (
                            <button key={l} type="button" onClick={() => set(l)} className={value === l ? "border border-violet-glow bg-violet-glow/20 px-2 py-0.5 text-slate-100" : "border border-white/10 px-2 py-0.5 text-slate-400"}>
                              {capsulePct(l)} %
                            </button>
                          ))}
                        </div>
                      );
                    })}
                    {decoy > 0 && <p className="text-slate-500">{CAPSULES.decoy.description(capsulePct(decoy))}</p>}
                  </div>
                );
              })()}

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
                          {(c.rounds?.length ?? 0) > 0 && (
                            <>
                              {" "}· <span className="font-mono">{c.rounds?.length}</span> tour{(c.rounds?.length ?? 0) > 1 ? "s" : ""}
                              {c.retreated ? ", retraite" : ""}
                            </>
                          )}
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
                        {estimate.notes.length > 0 && <p className="text-[10px] text-slate-500">{estimate.notes.join(" · ")}</p>}
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
