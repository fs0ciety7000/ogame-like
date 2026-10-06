import { ALLIANCE_RULES, allianceFlightFactor } from "@/game/alliances";
import { CLASS_UNIT_RULES, HARVESTER_ID } from "@/game/classUnits";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyAction } from "@/components/ui/panel";
import { EmptyState } from "@/components/ui/hud";
import { useState } from "react";
import { toast } from "sonner";
import { Clock, Recycle, ShieldPlus, Wind } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { RadarScan } from "@/components/game/RadarScan";
import { distanceBetween, fleetSpeed, PATROL_RULES, patrolEnergyCost, travelSeconds } from "@/game/fleets";
import { playerModifiers } from "@/game/modifiers";
import { DEBRIS_RULES, recyclerCapacity, type DebrisField } from "@/game/debris";
import { findUnit, OFFENSIVE_UNITS } from "@/game/units";
import { formatDuration, formatNumber } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import { GameActionError, sendFleet } from "@/services/playerService";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { GameIcon, ResourceIcon } from "@/components/ui/game-icon";

function clockAt(seconds: number) {
  return new Date(Date.now() + seconds * 1000).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Mode fuite : la flotte part en patrouille et ne peut pas être prise
 *  pour cible pendant ce temps (elle ne défend pas non plus). */
export function PatrolDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const player = usePlayerStore((s) => s.player);
  const uid = useAuthStore((s) => s.user?.uid);
  const [minutes, setMinutes] = useState(60);
  const [fleet, setFleet] = useState<Record<string, number> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Par défaut : tous les vaisseaux à quai.
  const all: Record<string, number> = {};
  for (const id of OFFENSIVE_UNITS) {
    const n = player?.units[id]?.count ?? 0;
    if (n > 0) all[id] = n;
  }
  const current = fleet ?? all;
  const selected = Object.fromEntries(Object.entries(current).filter(([, n]) => n > 0));
  const cost = player ? patrolEnergyCost(player.units, selected, minutes, player.techLevels, playerModifiers(player).fleetUpkeep) : 0;
  const energy = player?.resources.energy ?? 0;
  const hasShips = Object.keys(selected).length > 0;

  const close = () => {
    setFleet(null);
    onClose();
  };

  const send = async () => {
    if (!uid || !hasShips) return;
    setSubmitting(true);
    try {
      await sendFleet(uid, selected, "patrol", { minutes });
      triggerWarpEffect();
      toast.success("Flotte partie en patrouille", { description: `Retour vers ${clockAt(minutes * 60)}. Rappel possible jusqu'à mi-parcours.` });
      close();
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Départ impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      {open && (
        <DialogContent>
          <DialogTitle>Mode fuite : patrouille</DialogTitle>
          <p className="text-sm text-slate-400">Tes vaisseaux quittent la base : une attaque ne pourra pas les détruire, mais ils ne défendront pas non plus.</p>
          {!player || submitting ? (
            submitting ? <RadarScan label="Décollage…" /> : <SkeletonList rows={4} className="py-2" />
          ) : (
            <div className="mt-3 space-y-3">
              <div className="space-y-2">
                {Object.keys(all).length === 0 && <EmptyState size="sm" icon="🚀" title="Aucun vaisseau à quai" action={<EmptyAction to="/game/unites">Construire des vaisseaux</EmptyAction>} />}
                {Object.entries(all).map(([unitId, owned]) => (
                  <div key={unitId} className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 text-sm">
                    <span className="flex-1 text-slate-200">{findUnit(unitId)?.name ?? unitId}</span>
                    <span className="text-xs text-slate-500">À quai : {owned}</span>
                    <NumberInput
                      size="sm"
                      max={owned}
                      value={current[unitId] ?? 0}
                      onChange={(v) => setFleet({ ...current, [unitId]: v })}
                      aria-label={`Quantité ${findUnit(unitId)?.name ?? unitId}`}
                      className="w-40"
                    />
                  </div>
                ))}
              </div>
              <label className="block text-xs text-slate-400">
                Durée : <strong className="text-slate-200">{formatDuration(minutes * 60)}</strong>
                <input
                  type="range"
                  className="mt-1 w-full accent-cyan-glow"
                  min={PATROL_RULES.minMinutes}
                  max={PATROL_RULES.maxMinutes}
                  step={30}
                  value={minutes}
                  onChange={(e) => setMinutes(parseInt(e.target.value))}
                />
              </label>
              <div className="space-y-1 rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-400">
                <p>
                  <Clock className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-cyan-glow" />
                  Retour vers <strong className="text-slate-200">{clockAt(minutes * 60)}</strong>. Rappel possible
                  jusqu'à mi-parcours (le retour prend alors le temps déjà écoulé).
                </p>
                <p className={cost > energy ? "text-danger-glow" : undefined}>
                  <ResourceIcon id="energy" /> Entretien payé au départ : <strong className="tabular-mono">{formatNumber(cost)}</strong> énergie (tu en as {formatNumber(Math.floor(energy))}).
                </p>
              </div>
              <Button className="w-full" disabled={!hasShips || cost > energy} onClick={() => void send()}>
                <Wind className="mr-1.5 h-4 w-4" /> Partir en patrouille
              </Button>
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}

/** Recyclage d'un champ de débris par des Drones récupérateurs (6.5 : et des Récolteurs de l'Industriel). */
export function RecycleDialog({ field, onClose }: { field: DebrisField | null; onClose: () => void }) {
  const player = usePlayerStore((s) => s.player);
  const uid = useAuthStore((s) => s.user?.uid);
  const [picked, setPicked] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const droneId = DEBRIS_RULES.recyclerUnitId;
  // Les Récolteurs n'apparaissent que si le joueur en possède.
  const ids = [droneId, ...((player?.units[HARVESTER_ID]?.count ?? 0) > 0 ? [HARVESTER_ID] : [])];
  const ownedOf = (id: string) => player?.units[id]?.count ?? 0;
  const total = field ? field.scrap + field.energy : 0;
  // 5.16 : la capacité d'un drone est sa cargaison (CAP), comme sur sa fiche.
  const perUnit = (id: string) => (player ? recyclerCapacity(player, { [id]: 1 }) : 0);
  const perDrone = perUnit(droneId);
  const needed = perDrone > 0 ? Math.min(ownedOf(droneId), Math.ceil(total / perDrone)) : ownedOf(droneId);
  const fleet: Record<string, number> = {};
  for (const id of ids) {
    const want = picked[id] ?? (id === droneId ? needed : 0);
    const n = Math.max(0, Math.min(ownedOf(id), want));
    if (n > 0) fleet[id] = n;
  }
  const count = Object.values(fleet).reduce((a, n) => a + n, 0);
  const capacity = player ? recyclerCapacity(player, fleet) : 0;
  const flight = player && uid && field && count > 0 ? travelSeconds(distanceBetween(uid, field.id), fleetSpeed(player.units, fleet), allianceFlightFactor(player.allianceResearch, player.techLevels, player)) : null;

  const send = async () => {
    if (!field || count <= 0) return;
    setSubmitting(true);
    try {
      await sendFleet(field.id, fleet, "recycle");
      triggerWarpEffect();
      toast.success("Recycleurs en route", { description: "Premier arrivé, premier servi : un autre joueur peut te devancer." });
      setPicked({});
      onClose();
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Envoi impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={field !== null} onOpenChange={(o) => !o && onClose()}>
      {field && (
        <DialogContent>
          <DialogTitle>Recycler les débris</DialogTitle>
          <p className="text-sm text-slate-400">
            Champ de débris de <strong className="text-slate-200">{field.locationPseudo}</strong> : <ResourceIcon id="scrap" /> {formatNumber(field.scrap)} · <ResourceIcon id="energy" /> {formatNumber(field.energy)}
          </p>
          {!player || submitting ? (
            submitting ? <RadarScan label="Décollage…" /> : <SkeletonList rows={4} className="py-2" />
          ) : (
            <div className="mt-3 space-y-3">
              {ids.map((id) => (
                <div key={id} className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 text-sm">
                  <span className="flex-1 text-slate-200">{findUnit(id)?.name ?? id}</span>
                  <span className="text-xs text-slate-500">
                    Possédés : <span className="font-mono tabular-nums">{ownedOf(id)}</span> · <span className="font-mono tabular-nums">{formatNumber(perUnit(id))}</span> chacun
                  </span>
                  <NumberInput size="sm" min={0} max={ownedOf(id)} disabled={ownedOf(id) === 0} value={fleet[id] ?? 0} onChange={(v) => setPicked((p) => ({ ...p, [id]: v }))} aria-label={`Nombre : ${findUnit(id)?.name ?? id}`} className="w-40" />
                </div>
              ))}
              <div className="space-y-1 rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-400">
                <p>
                  <GameIcon name="recycle" /> Capacité : <strong className="tabular-mono text-slate-200">{formatNumber(capacity)}</strong>
                  {capacity >= total ? " : tout le champ." : ` sur ${formatNumber(total)}.`}
                </p>
                {ids.includes(HARVESTER_ID) && <p>Récolteur : <span className="font-mono tabular-nums">+{Math.round(CLASS_UNIT_RULES.harvesterRecycleBonus * 100)} %</span> de capacité en plus de sa soute.</p>}
                {flight !== null && (
                  <p className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-cyan-glow" /> Trajet : <strong className="text-slate-200">{formatDuration(flight)}</strong>, puis retour.
                  </p>
                )}
                {ids.every((id) => ownedOf(id) === 0) && <p className="text-danger-glow">Il te faut des Drones récupérateurs.</p>}
              </div>
              <Button className="w-full" disabled={count <= 0} onClick={() => void send()}>
                <Recycle className="mr-1.5 h-4 w-4" /> Envoyer {count} recycleur{count > 1 ? "s" : ""}
              </Button>
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}

/** Garnison : des vaisseaux partent stationner chez un allié et combattent
 *  à ses côtés s'il est attaqué. */
export function GarrisonDialog({ target, onClose }: { target: { uid: string; pseudo: string } | null; onClose: () => void }) {
  const player = usePlayerStore((s) => s.player);
  const uid = useAuthStore((s) => s.user?.uid);
  const [hours, setHours] = useState(6);
  const [fleet, setFleet] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);

  const available: Record<string, number> = {};
  for (const id of OFFENSIVE_UNITS) {
    const n = player?.units[id]?.count ?? 0;
    if (n > 0) available[id] = n;
  }
  const selected = Object.fromEntries(Object.entries(fleet).filter(([, n]) => n > 0));
  const hasShips = Object.keys(selected).length > 0;
  const cost = player ? patrolEnergyCost(player.units, selected, hours * 60, player.techLevels, playerModifiers(player).fleetUpkeep) : 0;
  const energy = player?.resources.energy ?? 0;
  const flight =
    player && uid && target && hasShips
      ? travelSeconds(distanceBetween(uid, target.uid), fleetSpeed(player.units, selected), allianceFlightFactor(player.allianceResearch, player.techLevels, player))
      : null;

  const close = () => {
    setFleet({});
    onClose();
  };

  const send = async () => {
    if (!target || !hasShips) return;
    setSubmitting(true);
    try {
      await sendFleet(target.uid, selected, "garrison", { hours });
      triggerWarpEffect();
      toast.success(`Garnison en route vers ${target.pseudo}`, { description: `Stationnement de ${hours} h à l'arrivée. Rappel possible à tout moment.` });
      close();
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Envoi impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={target !== null} onOpenChange={(o) => !o && close()}>
      {target && (
        <DialogContent>
          <DialogTitle>Renforcer {target.pseudo}</DialogTitle>
          <p className="text-sm text-slate-400">
            Ta garnison combat avec {target.pseudo} s'il est attaqué, à {Math.round(ALLIANCE_RULES.garrisonPower * 100)} % de sa puissance, et subit sa part des pertes.
            {` ${ALLIANCE_RULES.maxGarrisonsPerHost} garnisons au plus par joueur.`}
          </p>
          {!player || submitting ? (
            submitting ? <RadarScan label="Décollage…" /> : <SkeletonList rows={4} className="py-2" />
          ) : (
            <div className="mt-3 space-y-3">
              {Object.keys(available).length === 0 && <EmptyState size="sm" icon="🚀" title="Aucun vaisseau à quai" action={<EmptyAction to="/game/unites">Construire des vaisseaux</EmptyAction>} />}
              {Object.entries(available).map(([unitId, owned]) => (
                <div key={unitId} className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1.5 text-sm">
                  <span className="flex-1 text-slate-200">{findUnit(unitId)?.name ?? unitId}</span>
                  <span className="text-xs text-slate-500">À quai : {owned}</span>
                  <NumberInput
                    size="sm"
                    max={owned}
                    value={fleet[unitId] ?? 0}
                    onChange={(v) => setFleet({ ...fleet, [unitId]: v })}
                    aria-label={`Quantité ${findUnit(unitId)?.name ?? unitId}`}
                    className="w-40"
                  />
                </div>
              ))}
              <label className="block text-xs text-slate-400">
                Stationnement : <strong className="text-slate-200">{hours} h</strong>
                <input
                  type="range"
                  className="mt-1 w-full accent-cyan-glow"
                  min={ALLIANCE_RULES.garrisonMinHours}
                  max={ALLIANCE_RULES.garrisonMaxHours}
                  step={1}
                  value={hours}
                  onChange={(e) => setHours(parseInt(e.target.value))}
                />
              </label>
              <div className="space-y-1 rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-400">
                {flight !== null && (
                  <p>
                    <Clock className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-cyan-glow" />
                    Trajet : <strong className="text-slate-200">{formatDuration(flight)}</strong>, puis {hours} h sur place et autant de trajet au retour.
                  </p>
                )}
                <p className={cost > energy ? "text-danger-glow" : undefined}>
                  <ResourceIcon id="energy" /> Entretien payé au départ : <strong className="tabular-mono">{formatNumber(cost)}</strong> énergie (tu en as {formatNumber(Math.floor(energy))}).
                </p>
              </div>
              <Button className="w-full" disabled={!hasShips || cost > energy} onClick={() => void send()}>
                <ShieldPlus className="mr-1.5 h-4 w-4" /> Envoyer la garnison
              </Button>
            </div>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}
