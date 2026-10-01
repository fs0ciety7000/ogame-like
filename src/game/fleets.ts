import { bumpStat } from "@/game/stats";
import { galaxyCoords } from "@/game/galaxy";
import { GameActionError } from "@/game/errors";
import { checkAttackAllowed } from "@/game/pvp";
import { findUnit, OFFENSIVE_UNITS } from "@/game/units";
import { flushState, type NewNotification } from "@/game/flush";
import { withMissingBuildings } from "@/game/buildings";
import type { PlayerState, QueuesState, ResourceId, Units } from "@/types/game";
import { formatInt } from "@/game/format";
import { getFleetUpkeep } from "@/game/economy";
import { ALLIANCE_RULES, allianceFlightFactor } from "@/game/alliances";
import { checkLairLaunch, factionOfLair, findFaction, lairPower, lairUid } from "@/game/pirates";
import { SPY_RULES, spyTravelSeconds } from "@/game/espionage";
import { DEBRIS_RULES, debrisTotal, type DebrisField } from "@/game/debris";

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

/** Mode fuite : durée d'une patrouille, en minutes. */
export const PATROL_RULES = {
  minMinutes: 30,
  maxMinutes: 480,
};

export type FleetStatus = "outbound" | "stationed" | "returning" | "done";
/** attack : combat ; spy : sondes ; recycle : champ de débris ;
 *  patrol : mode fuite (la flotte quitte la base puis revient). */
export type FleetMission = "attack" | "spy" | "recycle" | "patrol" | "garrison" | "pirate" | "lair";

export const FLEET_MISSION_LABELS: Record<FleetMission, string> = {
  attack: "Attaque",
  spy: "Espionnage",
  recycle: "Recyclage",
  patrol: "Patrouille",
  garrison: "Garnison",
  pirate: "Raid pirate",
  lair: "Assaut du repaire",
};

export interface Fleet {
  id: string;
  ownerUid: string;
  ownerPseudo: string;
  targetUid: string;
  targetPseudo: string;
  mission: FleetMission;
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
  /** Garnison : durée de stationnement prévue, puis fin du stationnement. */
  durationMs?: number | null;
  stationedUntilMs?: number | null;
  /** Raid pirate ou repaire : puissance adverse fixée au départ. */
  power?: number | null;
  /** Faction du raid ou du repaire visé. */
  factionId?: string | null;
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
export function travelSeconds(distance: number, speed: number, factor = 1): number {
  return Math.round(factor * (FLEET_RULES.baseMinutes + (distance * FLEET_RULES.minutesPerDistance) / Math.max(1, speed)) * 60);
}

/** Position d'une flotte sur son trajet (0 = départ, 1 = cible). */
export function fleetProgress(fleet: Pick<Fleet, "status" | "departAtMs" | "arriveAtMs" | "returnAtMs" | "recalled">, now: number): number {
  if (fleet.status === "outbound") {
    const total = fleet.arriveAtMs - fleet.departAtMs;
    return total > 0 ? Math.min(1, Math.max(0, (now - fleet.departAtMs) / total)) : 1;
  }
  if (fleet.status === "stationed") return 1;
  if (fleet.status === "returning" && fleet.returnAtMs) {
    // Retour depuis la cible (ou depuis le point de rappel).
    // Demi-tour : au point de rappel, sinon à la cible (après le stationnement
    // d'une garnison) ; le retour dure autant que l'aller.
    const turnAt = fleet.recalled ? fleet.returnAtMs - (fleet.returnAtMs - fleet.departAtMs) / 2 : fleet.returnAtMs - (fleet.arriveAtMs - fleet.departAtMs);
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
  if (attacker.allianceId && attacker.allianceId === defender.allianceId) throw new GameActionError("Tu ne peux pas attaquer un membre de ton alliance.");
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
  const arriveAtMs = now + travelSeconds(distanceBetween(attacker.uid, defender.uid), speed, allianceFlightFactor(attacker.allianceResearch, attacker.techLevels)) * 1000;
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
  if (fleet.status === "stationed") {
    // Garnison : elle quitte l'allié et rentre (durée du trajet aller).
    return { ...fleet, status: "returning", stationedUntilMs: now, returnAtMs: now + (fleet.arriveAtMs - fleet.departAtMs) };
  }
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
  if (fleet.mission === "recycle") bumpStat(owner, "recycled", lootTotal);
  else if ((fleet.mission ?? "attack") === "attack") bumpStat(owner, "loot", lootTotal);
  return { owner, notifications: [{ kind: "fleet", ...returnMessage(fleet, lootTotal), createdAtMs: now, read: false }] };
}

function returnMessage(fleet: Fleet, lootTotal: number): { title: string; message: string } {
  switch (fleet.mission) {
    case "patrol":
      return { title: "Patrouille terminée", message: "Ta flotte en patrouille est rentrée à la base." };
    case "lair":
      return { title: "Retour du repaire", message: `Les survivants de l'assaut sur ${fleet.targetPseudo} sont rentrés.` };
    case "garrison":
      return { title: "Garnison rentrée", message: `Ta garnison stationnée chez ${fleet.targetPseudo} est de retour.` };
    case "spy":
      return { title: "Sondes rentrées", message: `Tes sondes envoyées vers ${fleet.targetPseudo} sont de retour.` };
    case "recycle":
      return fleet.recalled
        ? { title: "Recycleurs rentrés", message: "Tes recycleurs rappelés sont de retour, soute vide." }
        : {
            title: "Recyclage terminé",
            message: lootTotal > 0 ? `${formatInt(lootTotal)} ressources récupérées dans les débris de ${fleet.targetPseudo}.` : `Le champ de débris de ${fleet.targetPseudo} était déjà vide.`,
          };
    default:
      return fleet.recalled
        ? { title: "Flotte rappelée rentrée", message: `Ta flotte envoyée vers ${fleet.targetPseudo} est de retour, sans combat.` }
        : {
            title: "Flotte rentrée à la base",
            message: `Retour de ${fleet.targetPseudo}${lootTotal > 0 ? ` avec ${formatInt(lootTotal)} ressources de butin` : ""}.`,
          };
  }
}

/* ---------- points d'entrée serveur (production rattrapée avant) ---------- */

export interface LaunchRequest {
  mission?: FleetMission;
  now: number;
  owner: PlayerState;
  ownerQueues: QueuesState;
  /** Joueur visé (attaque, espionnage). */
  target?: PlayerState | null;
  /** Champ de débris visé (recyclage). */
  debris?: DebrisField | null;
  fleet: Record<string, unknown>;
  lastAttackOnTargetMs?: number | null;
  /** Durée de la patrouille (mode fuite), en minutes. */
  patrolMinutes?: number;
  /** Garnison : durée en heures et garnisons déjà chez l'hôte. */
  garrisonHours?: number;
  garrisonsAtHost?: number;
  /** Repaire visé (lair_<faction>). */
  lairTarget?: string;
}

export function performLaunch(req: LaunchRequest): LaunchOutput & { attackerQueues: QueuesState; attackerNotifications: NewNotification[] } {
  const mission = req.mission ?? "attack";
  const { now, target } = req;
  if ((mission === "attack" || mission === "spy") && !target) throw new GameActionError("Ce joueur est introuvable.");
  if (mission === "attack" && req.owner.uid === target!.uid) throw new GameActionError("Tu ne peux pas t'attaquer toi-même !");
  if (mission === "spy" && req.owner.uid === target!.uid) throw new GameActionError("Tu ne peux pas t'espionner toi-même.");
  if (mission === "garrison" && !target) throw new GameActionError("Ce joueur est introuvable.");
  const flushed = flushState({ ...req.owner, buildings: withMissingBuildings(req.owner.buildings, req.owner.resources) }, req.ownerQueues, now);
  const owner = flushed.player;
  let out: LaunchOutput;
  if (mission === "attack") out = launchFleet({ now, attacker: owner, defender: target!, fleet: req.fleet, lastAttackOnTargetMs: req.lastAttackOnTargetMs ?? null });
  else if (mission === "spy") out = launchSpy(owner, target!, req.fleet, now);
  else if (mission === "recycle") out = launchRecycle(owner, req.debris ?? null, req.fleet, now);
  else if (mission === "patrol") out = launchPatrol(owner, req.fleet, req.patrolMinutes ?? 0, now);
  else if (mission === "lair") out = launchLair(owner, req.lairTarget ?? "", req.fleet, now);
  else if (mission === "garrison") out = launchGarrison(owner, target!, req.fleet, req.garrisonHours ?? 0, req.garrisonsAtHost ?? 0, now);
  else throw new GameActionError("Mission inconnue.");
  const counter = ({ spy: "spies", patrol: "patrols", garrison: "garrisons" } as const)[mission as "spy" | "patrol" | "garrison"];
  if (counter) bumpStat(out.attacker, counter);
  return { ...out, attackerQueues: flushed.queues, attackerNotifications: flushed.notifications };
}

/** Vaisseaux choisis pour une mission, retirés de la base. */
function takeUnits(owner: PlayerState, raw: Record<string, unknown>, allowed: (unitId: string) => boolean, wrongUnit: string): Record<string, number> {
  const units: Record<string, number> = {};
  for (const [unitId, value] of Object.entries(raw ?? {})) {
    const qty = Math.floor(Number(value));
    if (!(qty > 0)) continue;
    if (!allowed(unitId)) throw new GameActionError(wrongUnit);
    if ((owner.units[unitId]?.count ?? 0) < qty) throw new GameActionError("Tu ne possèdes plus assez d'unités pour cette flotte.");
    units[unitId] = qty;
  }
  if (Object.keys(units).length === 0) throw new GameActionError("Sélectionne au moins une unité à envoyer.");
  for (const [unitId, qty] of Object.entries(units)) owner.units[unitId].count -= qty;
  return units;
}

function newFleet(owner: PlayerState, target: { uid: string; pseudo: string }, mission: FleetMission, units: Record<string, number>, now: number, arriveAtMs: number): Omit<Fleet, "id"> {
  return {
    ownerUid: owner.uid,
    ownerPseudo: owner.pseudo,
    targetUid: target.uid,
    targetPseudo: target.pseudo,
    mission,
    units,
    departAtMs: now,
    arriveAtMs,
    returnAtMs: null,
    status: "outbound",
    loot: null,
    reportId: "",
    outcome: "",
    recalled: false,
  };
}

/** Espionnage : sondes uniquement, trajet rapide, la cible ne voit rien venir. */
export function launchSpy(owner: PlayerState, target: PlayerState, raw: Record<string, unknown>, now: number): LaunchOutput {
  const units = takeUnits(owner, raw, (id) => id === SPY_RULES.probeUnitId, "Seules les sondes d'espionnage peuvent espionner.");
  const speed = fleetSpeed(owner.units, units);
  const arriveAtMs = now + spyTravelSeconds(distanceBetween(owner.uid, target.uid), speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels)) * 1000;
  return { attacker: owner, fleet: newFleet(owner, target, "spy", units, now, arriveAtMs), defenderNotifications: [] };
}

/** Recyclage : Drones récupérateurs vers un champ de débris encore présent. */
export function launchRecycle(owner: PlayerState, field: DebrisField | null, raw: Record<string, unknown>, now: number): LaunchOutput {
  if (!field || field.expiresAtMs <= now || debrisTotal(field) <= 0) throw new GameActionError("Ce champ de débris n'existe plus.");
  const units = takeUnits(owner, raw, (id) => id === DEBRIS_RULES.recyclerUnitId, "Seuls les Drones récupérateurs peuvent recycler.");
  const speed = fleetSpeed(owner.units, units);
  const arriveAtMs = now + travelSeconds(distanceBetween(owner.uid, field.id), speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels)) * 1000;
  return {
    attacker: owner,
    fleet: newFleet(owner, { uid: field.id, pseudo: field.locationPseudo }, "recycle", units, now, arriveAtMs),
    defenderNotifications: [],
  };
}

/** Énergie payée au départ d'une patrouille : l'entretien de la flotte
 *  pour toute la durée. */
export function patrolEnergyCost(units: PlayerState["units"], fleet: Record<string, number>, minutes: number, techLevels?: PlayerState["techLevels"]): number {
  const selected: PlayerState["units"] = {};
  for (const [id, qty] of Object.entries(fleet)) selected[id] = { level: units[id]?.level ?? 1, count: qty };
  return Math.ceil(getFleetUpkeep(selected, techLevels) * minutes * 60);
}

/** Mode fuite : la flotte quitte la base (elle ne défend plus) et revient
 *  au bout de la durée choisie. Rappel possible jusqu'à mi-parcours. */
export function launchPatrol(owner: PlayerState, raw: Record<string, unknown>, minutes: number, now: number): LaunchOutput {
  const duration = Math.round(Number(minutes));
  if (!(duration >= PATROL_RULES.minMinutes && duration <= PATROL_RULES.maxMinutes)) {
    throw new GameActionError(`La patrouille dure entre ${PATROL_RULES.minMinutes} min et ${Math.round(PATROL_RULES.maxMinutes / 60)} h.`);
  }
  const requested: Record<string, number> = {};
  for (const [id, v] of Object.entries(raw ?? {})) {
    const qty = Math.floor(Number(v));
    if (qty > 0) requested[id] = qty;
  }
  const cost = patrolEnergyCost(owner.units, requested, duration, owner.techLevels);
  if ((owner.resources.energy ?? 0) < cost) throw new GameActionError(`Il faut ${formatInt(cost)} énergie pour l'entretien de la patrouille.`);
  const units = takeUnits(owner, raw, (id) => OFFENSIVE_UNITS.includes(id), "Seuls les vaisseaux peuvent partir en patrouille.");
  owner.resources.energy = (owner.resources.energy ?? 0) - cost;
  const arriveAtMs = now + (duration * 60_000) / 2;
  return {
    attacker: owner,
    fleet: newFleet(owner, { uid: owner.uid, pseudo: "Patrouille" }, "patrol", units, now, arriveAtMs),
    defenderNotifications: [],
  };
}

/** Garnison : la flotte part stationner chez un membre de son alliance et
 *  combat à ses côtés s'il est attaqué. Entretien payé au départ. */
export function launchGarrison(owner: PlayerState, host: PlayerState, raw: Record<string, unknown>, hoursIn: number, garrisonsAtHost: number, now: number): LaunchOutput {
  if (owner.uid === host.uid) throw new GameActionError("Tu ne peux pas stationner chez toi : utilise la patrouille.");
  if (!owner.allianceId || owner.allianceId !== host.allianceId) throw new GameActionError("Tu ne peux stationner que chez un membre de ton alliance.");
  const hours = Math.round(Number(hoursIn));
  if (!(hours >= ALLIANCE_RULES.garrisonMinHours && hours <= ALLIANCE_RULES.garrisonMaxHours)) {
    throw new GameActionError(`Le stationnement dure entre ${ALLIANCE_RULES.garrisonMinHours} h et ${ALLIANCE_RULES.garrisonMaxHours} h.`);
  }
  if (garrisonsAtHost >= ALLIANCE_RULES.maxGarrisonsPerHost) throw new GameActionError(`${host.pseudo} accueille déjà ${ALLIANCE_RULES.maxGarrisonsPerHost} garnisons.`);
  const requested: Record<string, number> = {};
  for (const [id, v] of Object.entries(raw ?? {})) {
    const qty = Math.floor(Number(v));
    if (qty > 0) requested[id] = qty;
  }
  const cost = patrolEnergyCost(owner.units, requested, hours * 60, owner.techLevels);
  if ((owner.resources.energy ?? 0) < cost) throw new GameActionError(`Il faut ${formatInt(cost)} énergie pour l'entretien de la garnison.`);
  const units = takeUnits(owner, raw, (id) => OFFENSIVE_UNITS.includes(id), "Seuls les vaisseaux peuvent former une garnison.");
  owner.resources.energy = (owner.resources.energy ?? 0) - cost;
  const speed = fleetSpeed(owner.units, units);
  const arriveAtMs = now + travelSeconds(distanceBetween(owner.uid, host.uid), speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels)) * 1000;
  const fleet = { ...newFleet(owner, host, "garrison", units, now, arriveAtMs), durationMs: hours * 3600_000, stationedUntilMs: null };
  return {
    attacker: owner,
    fleet,
    defenderNotifications: [
      {
        kind: "fleet",
        title: "Renforts en approche",
        message: `${owner.pseudo} t'envoie une garnison de ${formatInt(Object.values(units).reduce((a, b) => a + b, 0))} vaisseaux pour ${hours} h.`,
        createdAtMs: now,
        read: false,
      },
    ],
  };
}

/** Assaut du repaire d'une faction (PvE) : sa puissance est fixée au départ. */
export function launchLair(owner: PlayerState, target: string, raw: Record<string, unknown>, now: number): LaunchOutput {
  const faction = findFaction(factionOfLair(target));
  checkLairLaunch(faction, owner, raw);
  const power = lairPower(faction!, owner);
  const units = takeUnits(owner, raw, (id) => OFFENSIVE_UNITS.includes(id), "Seules les unités d'attaque peuvent être envoyées.");
  const speed = fleetSpeed(owner.units, units);
  const arriveAtMs = now + travelSeconds(LAIR_DISTANCE, speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels)) * 1000;
  return {
    attacker: owner,
    fleet: { ...newFleet(owner, { uid: lairUid(faction!.id), pseudo: faction!.lair.name }, "lair", units, now, arriveAtMs), power, factionId: faction!.id },
    defenderNotifications: [],
  };
}

/** Distance fixe jusqu'au repaire (aux confins de la carte). */
export const LAIR_DISTANCE = 60;

/** Arrivée d'une garnison : elle stationne pour la durée prévue. */
export function stationGarrison(fleet: Fleet): Fleet {
  return { ...fleet, status: "stationed", stationedUntilMs: fleet.arriveAtMs + (fleet.durationMs ?? 0) };
}

/** Fin du stationnement : retour à la base (durée du trajet aller). */
export function endGarrison(fleet: Fleet, now: number): Fleet {
  return { ...fleet, status: "returning", returnAtMs: now + (fleet.arriveAtMs - fleet.departAtMs) };
}

/** Mi-parcours d'une patrouille : elle entame son retour. */
export function patrolTurnaround(fleet: Fleet): Fleet {
  return { ...fleet, status: "returning", returnAtMs: fleet.departAtMs + 2 * (fleet.arriveAtMs - fleet.departAtMs) };
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
