import { galaxyCoords } from "@/game/galaxy";
import { GameActionError } from "@/game/errors";
import { checkAttackAllowed } from "@/game/pvp";
import { findUnit, OFFENSIVE_UNITS } from "@/game/units";
import { flushState, type NewNotification } from "@/game/flush";
import { withMissingBuildings } from "@/game/buildings";
import type { PlayerState, QueuesState, ResourceId, Units } from "@/types/game";
import { formatInt } from "@/game/format";

/* =====================================================
   Flottes en vol : une attaque met du temps à arriver. Le défenseur voit
   la flotte approcher, l'attaquant peut la rappeler. Au retour, les
   survivants et le butin rejoignent la base.

   Fonctions pures, partagées par le client (affichage, temps de vol) et
   le serveur (pb_hooks), qui est le seul à créer et résoudre les flottes.
===================================================== */

export const FLEET_RULES = {
  /** Durée fixe de tout trajet (décollage, approche), en minutes. */
  baseMinutes: 5,
  /** Minutes par unité de distance, divisées par la vitesse de la flotte. */
  minutesPerDistance: 3,
  /** Côté de la carte de la galaxie (distance max ≈ 141). */
  mapSize: 100,
};

export type FleetStatus = "outbound" | "returning" | "done";

export interface Fleet {
  id: string;
  ownerUid: string;
  ownerPseudo: string;
  targetUid: string;
  targetPseudo: string;
  mission: "attack";
  units: Record<string, number>;
  departAtMs: number;
  arriveAtMs: number;
  /** Retour à la base (connu après le combat ou un rappel). */
  returnAtMs: number | null;
  status: FleetStatus;
  loot: Partial<Record<ResourceId, number>> | null;
  reportId: string;
  outcome: string;
  recalled: boolean;
}

export function mapPosition(uid: string): { x: number; y: number } {
  const c = galaxyCoords(uid);
  return { x: c.x * FLEET_RULES.mapSize, y: c.y * FLEET_RULES.mapSize };
}

export function distanceBetween(uidA: string, uidB: string): number {
  const a = mapPosition(uidA);
  const b = mapPosition(uidB);
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/** Vitesse d'une flotte : celle de son vaisseau le plus lent (vitesse × niveau). */
export function fleetSpeed(units: Units, fleet: Record<string, number>): number {
  let slowest = Infinity;
  for (const [id, qty] of Object.entries(fleet)) {
    if (!(qty > 0)) continue;
    const def = findUnit(id);
    const speed = (def?.stats.vitesse ?? 0) * Math.max(1, units[id]?.level ?? 1);
    slowest = Math.min(slowest, Math.max(1, speed));
  }
  return Number.isFinite(slowest) ? slowest : 1;
}

/** Durée du trajet aller, en secondes. */
export function travelSeconds(distance: number, speed: number): number {
  return Math.round((FLEET_RULES.baseMinutes + (distance * FLEET_RULES.minutesPerDistance) / Math.max(1, speed)) * 60);
}

/** Position d'une flotte sur son trajet (0 = départ, 1 = cible). */
export function fleetProgress(fleet: Pick<Fleet, "status" | "departAtMs" | "arriveAtMs" | "returnAtMs" | "recalled">, now: number): number {
  if (fleet.status === "outbound") {
    const total = fleet.arriveAtMs - fleet.departAtMs;
    return total > 0 ? Math.min(1, Math.max(0, (now - fleet.departAtMs) / total)) : 1;
  }
  if (fleet.status === "returning" && fleet.returnAtMs) {
    // Retour depuis la cible (ou depuis le point de rappel).
    const turnAt = fleet.recalled ? fleet.returnAtMs - (fleet.returnAtMs - fleet.departAtMs) / 2 : fleet.arriveAtMs;
    const startProgress = fleet.recalled ? Math.min(1, (turnAt - fleet.departAtMs) / Math.max(1, fleet.arriveAtMs - fleet.departAtMs)) : 1;
    const total = fleet.returnAtMs - turnAt;
    const done = total > 0 ? Math.min(1, Math.max(0, (now - turnAt) / total)) : 1;
    return startProgress * (1 - done);
  }
  return 0;
}

export interface LaunchInput {
  now: number;
  attacker: PlayerState;
  defender: PlayerState;
  fleet: Record<string, unknown>;
  /** Dernier départ (ou combat) de cet attaquant vers cette cible. */
  lastAttackOnTargetMs: number | null;
}

export interface LaunchOutput {
  attacker: PlayerState;
  fleet: Omit<Fleet, "id">;
  defenderNotifications: NewNotification[];
}

/** Décollage : vérifie les protections, retire les vaisseaux de la base et
 *  calcule l'heure d'arrivée. `attacker` doit être rattrapé à `now`. */
export function launchFleet(input: LaunchInput): LaunchOutput {
  const { now, attacker, defender } = input;
  const check = checkAttackAllowed({
    now,
    attackerUid: attacker.uid,
    attackerXp: attacker.xp ?? 0,
    defenderUid: defender.uid,
    defenderXp: defender.xp ?? 0,
    defenderCreatedAtMs: defender.createdAtMs,
    defenderHasAttacked: (defender.lastAttackAtMs ?? 0) > 0,
    lastAttackOnTargetMs: input.lastAttackOnTargetMs,
    lastDefenderDefeatMs: defender.lastDefeatAtMs ?? null,
  });
  if (!check.allowed) throw new GameActionError(check.message ?? "Attaque impossible.");

  const units: Record<string, number> = {};
  for (const [unitId, raw] of Object.entries(input.fleet ?? {})) {
    const qty = Math.floor(Number(raw));
    if (!(qty > 0)) continue;
    if (!OFFENSIVE_UNITS.includes(unitId)) throw new GameActionError("Seules les unités d'attaque peuvent être envoyées.");
    if ((attacker.units[unitId]?.count ?? 0) < qty) throw new GameActionError("Tu ne possèdes plus assez d'unités pour cette flotte.");
    units[unitId] = qty;
  }
  if (Object.keys(units).length === 0) throw new GameActionError("Sélectionne au moins une unité à envoyer.");

  const speed = fleetSpeed(attacker.units, units);
  const arriveAtMs = now + travelSeconds(distanceBetween(attacker.uid, defender.uid), speed) * 1000;
  for (const [unitId, qty] of Object.entries(units)) attacker.units[unitId].count -= qty;
  // Attaquer lève sa propre protection débutant, dès le décollage.
  attacker.lastAttackAtMs = now;

  const minutes = Math.max(1, Math.round((arriveAtMs - now) / 60000));
  const total = Object.values(units).reduce((a, b) => a + b, 0);
  return {
    attacker,
    fleet: {
      ownerUid: attacker.uid,
      ownerPseudo: attacker.pseudo,
      targetUid: defender.uid,
      targetPseudo: defender.pseudo,
      mission: "attack",
      units,
      departAtMs: now,
      arriveAtMs,
      returnAtMs: null,
      status: "outbound",
      loot: null,
      reportId: "",
      outcome: "",
      recalled: false,
    },
    defenderNotifications: [
      {
        kind: "fleet",
        title: "Flotte hostile en approche !",
        message: `${attacker.pseudo} t'envoie ${formatInt(total)} vaisseaux : impact dans ${minutes} min. Renforce tes défenses !`,
        createdAtMs: now,
        read: false,
      },
    ],
  };
}

/** Rappel avant l'impact : la flotte fait demi-tour et met autant de temps
 *  à revenir qu'elle en a passé à l'aller. */
export function recallFleet(fleet: Fleet, uid: string, now: number): Fleet {
  if (fleet.ownerUid !== uid) throw new GameActionError("Cette flotte ne t'appartient pas.");
  if (fleet.status !== "outbound") throw new GameActionError("Cette flotte ne peut plus être rappelée.");
  if (now >= fleet.arriveAtMs) throw new GameActionError("Trop tard : la flotte est déjà au contact.");
  return { ...fleet, status: "returning", recalled: true, returnAtMs: now + (now - fleet.departAtMs) };
}

/** Retour à la base : survivants et butin rejoignent le propriétaire. */
export function completeFleetReturn(owner: PlayerState, fleet: Fleet, now: number): { owner: PlayerState; notifications: NewNotification[] } {
  for (const [unitId, qty] of Object.entries(fleet.units ?? {})) {
    if (!(qty > 0)) continue;
    const state = owner.units[unitId] ?? { level: 1, count: 0 };
    owner.units[unitId] = { ...state, count: state.count + qty };
  }
  // Le butin arrive même si l'entrepôt est plein (comme une livraison).
  for (const [res, amount] of Object.entries(fleet.loot ?? {})) {
    owner.resources[res as ResourceId] = (owner.resources[res as ResourceId] ?? 0) + (amount ?? 0);
  }
  const lootTotal = Object.values(fleet.loot ?? {}).reduce((a: number, b) => a + (b ?? 0), 0);
  return {
    owner,
    notifications: [
      {
        kind: "fleet",
        title: fleet.recalled ? "Flotte rappelée rentrée" : "Flotte rentrée à la base",
        message: fleet.recalled
          ? `Ta flotte envoyée vers ${fleet.targetPseudo} est de retour, sans combat.`
          : `Retour de ${fleet.targetPseudo}${lootTotal > 0 ? ` avec ${formatInt(lootTotal)} ressources de butin` : ""}.`,
        createdAtMs: now,
        read: false,
      },
    ],
  };
}

/* ---------- points d'entrée serveur (production rattrapée avant) ---------- */

export function performLaunch(
  attackerIn: PlayerState,
  attackerQueues: QueuesState,
  defender: PlayerState,
  rawFleet: Record<string, unknown>,
  lastAttackOnTargetMs: number | null,
  now: number,
): LaunchOutput & { attackerQueues: QueuesState; attackerNotifications: NewNotification[] } {
  if (attackerIn.uid === defender.uid) throw new GameActionError("Tu ne peux pas t'attaquer toi-même !");
  const flushed = flushState({ ...attackerIn, buildings: withMissingBuildings(attackerIn.buildings, attackerIn.resources) }, attackerQueues, now);
  const out = launchFleet({ now, attacker: flushed.player, defender, fleet: rawFleet, lastAttackOnTargetMs });
  return { ...out, attackerQueues: flushed.queues, attackerNotifications: flushed.notifications };
}

export function performFleetReturn(
  ownerIn: PlayerState,
  ownerQueues: QueuesState,
  fleet: Fleet,
  now: number,
): { owner: PlayerState; queues: QueuesState; notifications: NewNotification[] } {
  const flushed = flushState({ ...ownerIn, buildings: withMissingBuildings(ownerIn.buildings, ownerIn.resources) }, ownerQueues, now);
  const done = completeFleetReturn(flushed.player, fleet, now);
  return { owner: done.owner, queues: flushed.queues, notifications: [...flushed.notifications, ...done.notifications] };
}
