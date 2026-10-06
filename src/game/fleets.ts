import { empireClassPerk } from "@/game/empireClass";
import { assertEliteMission } from "@/game/eliteUnits";
import { ALLIANCE_BOSS_RULES } from "@/game/allianceBoss";
import { recordChronicle } from "@/game/chronicles";
import { bumpStat } from "@/game/stats";
import { takeLaunchCapsules, type LaunchCapsules } from "@/game/synthesis";
import { COMMANDER_XP, grantCommanderXp } from "@/game/commanders";
import { launchExpedition } from "@/game/expeditions";
import { WAR_RULES } from "@/game/wars";
import { LEVIATHAN_RULES, seasonBossFlightMinutes } from "@/game/leviathan";
import { galaxyCoords } from "@/game/galaxy";
import { GameActionError } from "@/game/errors";
import { checkAttackAllowed } from "@/game/pvp";
import { findUnit, OFFENSIVE_UNITS } from "@/game/units";
import { flushState, type NewNotification } from "@/game/flush";
import { withMissingBuildings } from "@/game/buildings";
import { checkDelivery } from "@/game/tradeContracts";
import type { PlayerState, QueuesState, ResourceId, Units } from "@/types/game";
import { describeGain, formatInt } from "@/game/format";
import { computeFleetPower } from "@/game/combat";
import { formationEffects } from "@/game/formations";
import { playerCargoCapacity, playerModifiers } from "@/game/modifiers";
import { advanceColonies, collectFromColony, colonyOf, colonyView, deliverToColony, parseCargo, type TransportDirection, type TransportState } from "@/game/colonies";
import { getFleetUpkeep } from "@/game/economy";
import { ALLIANCE_RULES, allianceFlightFactor } from "@/game/alliances";
import { checkLairLaunch, factionOfLair, findFaction, lairPower, lairUid } from "@/game/pirates";
import { SPY_RULES, spyTravelSeconds } from "@/game/espionage";
import { onVacation } from "@/game/vacation";
import { bountyTarget, dropShield, ELITE_RULES, shieldUntil, startBounty } from "@/game/bounties";
import { debrisTotal, isRecyclerUnit, type DebrisField } from "@/game/debris";

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
  /** v3.7 : durée maximale du trajet d'une attaque, en minutes (0 = aucune). */
  maxAttackMinutes: 90,
  /** 5.33 (proposals/flottes-emplacements.md) : flottes en vol en même temps (hors sondes et expéditions, qui ont leur limite). */
  slotsBase: 10,
};

/** 5.33 : missions qui n'occupent pas d'emplacement de flotte. */
export const SLOT_FREE_MISSIONS = ["spy", "expedition"];

export function fleetSlots(owner?: Partial<Pick<PlayerState, "empireClass">> | null): number {
  // 6.0 : +2 pour la classe Seigneur de guerre.
  return Math.max(1, Math.floor(FLEET_RULES.slotsBase)) + empireClassPerk(owner, "fleetSlots");
}

/** Refus quand tous les emplacements sont pris, sinon null. `active` : flottes en vol qui occupent un emplacement. */
export function fleetSlotBlocker(owner: Partial<Pick<PlayerState, "empireClass">>, mission: string, active: number | undefined): string | null {
  if (active === undefined || SLOT_FREE_MISSIONS.includes(mission)) return null;
  const slots = fleetSlots(owner);
  return active >= slots ? `Tous tes emplacements de flotte sont pris (${slots} / ${slots}). Attends un retour ou rappelle une flotte. Les sondes et les expéditions ne comptent pas.` : null;
}

/** Mode fuite : durée d'une patrouille, en minutes. */
export const PATROL_RULES = {
  minMinutes: 30,
  maxMinutes: 480,
};

export type FleetStatus = "outbound" | "stationed" | "returning" | "done" | "decision";
/** attack : combat ; spy : sondes ; recycle : champ de débris ;
 *  patrol : mode fuite (la flotte quitte la base puis revient). */
export type FleetMission = "attack" | "spy" | "recycle" | "patrol" | "garrison" | "pirate" | "lair" | "expedition" | "leviathan" | "transport" | "bounty" | "elite" | "seasonboss" | "allianceboss" | "delivery";

export const FLEET_MISSION_LABELS: Record<FleetMission, string> = {
  attack: "Attaque",
  spy: "Espionnage",
  recycle: "Recyclage",
  patrol: "Patrouille",
  garrison: "Garnison",
  pirate: "Raid pirate",
  lair: "Assaut du repaire",
  expedition: "Expédition",
  leviathan: "Assaut du Léviathan",
  transport: "Transport",
  bounty: "Chasse à la prime",
  elite: "Proie d'élite",
  seasonboss: "Assaut du boss de saison",
  allianceboss: "Assaut du boss d'alliance",
  delivery: "Livraison de contrat",
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
  /** v3.1 : déroulé d'une expédition. */
  expedition?: import("@/game/expeditions").ExpeditionState | null;
  /** v3.5 : propriétaire de la planète visée (attaque d'une colonie). */
  targetOwnerUid?: string | null;
  /** v3.5 : transport entre la planète mère et une colonie. */
  transport?: TransportState | null;
  /** v4.0 : l'Espionne du défenseur a flairé une anomalie chimique (capsules à bord). */
  anomaly?: boolean;
  /** v4.0 (affichage) : flotte leurrée par son propriétaire. */
  decoyed?: boolean;
}

/** v3.5 : la flotte vise ce joueur (planète mère ou une de ses colonies). */
export function targetsPlayer(f: Pick<Fleet, "targetUid"> & { targetOwnerUid?: string | null }, uid: string | undefined): boolean {
  return !!uid && (f.targetUid === uid || f.targetOwnerUid === uid);
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

/** Trajet d'une attaque : comme travelSeconds, plafonné à maxAttackMinutes. */
export function attackTravelSeconds(distance: number, speed: number, factor = 1): number {
  const seconds = travelSeconds(distance, speed, factor);
  const cap = FLEET_RULES.maxAttackMinutes;
  return cap > 0 ? Math.min(seconds, Math.round(cap * 60)) : seconds;
}

/** Vaisseaux qui fixent l'allure de la flotte (les plus lents), et vitesse
 *  de la flotte sans eux (null s'il ne reste rien). */
export function slowestUnits(units: Units, fleet: Record<string, number>): { ids: string[]; speed: number; speedWithout: number | null } | null {
  const ids = Object.keys(fleet).filter((id) => fleet[id] > 0);
  if (ids.length === 0) return null;
  const speed = fleetSpeed(units, fleet);
  const slow = ids.filter((id) => fleetSpeed(units, { [id]: 1 }) === speed);
  const rest = Object.fromEntries(ids.filter((id) => !slow.includes(id)).map((id) => [id, fleet[id]]));
  return { ids: slow, speed, speedWithout: Object.keys(rest).length > 0 ? fleetSpeed(units, rest) : null };
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
  atWar?: boolean;
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
    defenderAscendedAtMs: defender.ascendedAtMs,
    defenderShieldUntilMs: shieldUntil(defender),
    defenderVacationUntilMs: onVacation(defender, now) ? defender.vacation?.untilMs : undefined,
    defenderIsWarlord: !!defender.npc,
    lastDefenderDefeatMs: defender.lastDefeatAtMs ?? null,
    attackCooldownMs: input.atWar ? WAR_RULES.attackCooldownHours * 3600_000 : undefined,
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
  const arriveAtMs = now + attackTravelSeconds(distanceBetween(attacker.uid, defender.uid), speed, allianceFlightFactor(attacker.allianceResearch, attacker.techLevels, attacker)) * 1000;
  for (const [unitId, qty] of Object.entries(units)) attacker.units[unitId].count -= qty;
  // Attaquer lève sa propre protection débutant, dès le décollage (et le Voile de chitine).
  attacker.lastAttackAtMs = now;
  dropShield(attacker, now);

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
  if (fleet.mission === "expedition" || fleet.mission === "leviathan" || fleet.mission === "seasonboss" || fleet.mission === "allianceboss" || fleet.mission === "elite") throw new GameActionError("Cette flotte ne peut pas être rappelée.");
  if (fleet.status !== "outbound") throw new GameActionError("Cette flotte ne peut plus être rappelée.");
  if (now >= fleet.arriveAtMs) throw new GameActionError("Trop tard : la flotte est déjà au contact.");
  // 5.23 : rappelée avant son décollage programmé : elle est encore à quai.
  return { ...fleet, status: "returning", recalled: true, returnAtMs: now + Math.max(0, now - fleet.departAtMs) };
}

/** Retour à la base : survivants et butin rejoignent le propriétaire. */
export function completeFleetReturn(owner: PlayerState, fleet: Fleet, now: number): { owner: PlayerState; notifications: NewNotification[] } {
  for (const [unitId, qty] of Object.entries(fleet.units ?? {})) {
    if (!(qty > 0)) continue;
    const state = owner.units[unitId] ?? { level: 1, count: 0 };
    owner.units[unitId] = { ...state, count: state.count + qty };
  }
  // v3.5 : livraison rappelée avant d'atteindre la colonie, la cargaison revient.
  // v5.1 : de même pour une livraison de contrat rappelée.
  if ((fleet.mission === "transport" || fleet.mission === "delivery") && fleet.recalled && fleet.transport?.direction === "deliver") {
    for (const [res, amount] of Object.entries(fleet.transport.cargo ?? {})) owner.resources[res as ResourceId] = (owner.resources[res as ResourceId] ?? 0) + (amount ?? 0);
  }
  // Le butin arrive même si l'entrepôt est plein (comme une livraison).
  for (const [res, amount] of Object.entries(fleet.loot ?? {})) {
    owner.resources[res as ResourceId] = (owner.resources[res as ResourceId] ?? 0) + (amount ?? 0);
  }
  const lootTotal = Object.values(fleet.loot ?? {}).reduce((a: number, b) => a + (b ?? 0), 0);
  if (fleet.mission === "recycle") bumpStat(owner, "recycled", lootTotal);
  else if ((fleet.mission ?? "attack") === "attack") bumpStat(owner, "loot", lootTotal);
  return { owner, notifications: [{ kind: "fleet", ...returnMessage(fleet, lootTotal), createdAtMs: now, read: false, ...(lootTotal > 0 ? { data: { resources: fleet.loot ?? undefined } } : {}) }] };
}

function returnMessage(fleet: Fleet, lootTotal: number): { title: string; message: string } {
  switch (fleet.mission) {
    case "patrol":
      return { title: "Patrouille terminée", message: "Ta flotte en patrouille est rentrée à la base." };
    case "expedition":
      return { title: "Expédition terminée", message: "Ta flotte d'expédition est rentrée à la base." };
    case "leviathan":
      return { title: "Retour du Léviathan", message: "Les survivants de l'assaut sur le Léviathan sont rentrés." };
    case "seasonboss":
    case "allianceboss":
      return { title: "Retour de l'assaut", message: `Les survivants de l'assaut sur ${fleet.targetPseudo} sont rentrés.` };
    case "lair":
      return { title: "Retour du repaire", message: `Les survivants de l'assaut sur ${fleet.targetPseudo} sont rentrés.` };
    case "bounty":
      return fleet.recalled
        ? { title: "Traque abandonnée", message: `Ta flotte lancée sur ${fleet.targetPseudo} est rentrée : la prime reste au tableau.` }
        : { title: "Chasseurs rentrés", message: `Ta flotte lancée sur ${fleet.targetPseudo} est de retour.` };
    case "elite":
      return { title: "Retour de la traque d'élite", message: `Les survivants de l'assaut sur ${fleet.targetPseudo} sont rentrés.` };
    case "transport":
      return fleet.transport?.direction === "collect" && !fleet.recalled
        ? { title: "Transport rentré", message: lootTotal > 0 ? `Rapatrié de ${fleet.targetPseudo} : ${describeGain(fleet.loot ?? {})} (${formatInt(lootTotal)} au total).` : `Rien à rapatrier de ${fleet.targetPseudo}.` }
        : { title: "Transport rentré", message: `Tes vaisseaux de transport sont revenus de ${fleet.targetPseudo}${fleet.recalled ? " avec leur cargaison" : ""}.` };
    case "delivery":
      return fleet.recalled || lootTotal > 0
        ? { title: "Livraison revenue", message: `Tes vaisseaux sont revenus de chez ${fleet.targetPseudo} avec la cargaison du contrat.` }
        : { title: "Livreurs rentrés", message: `Tes vaisseaux de livraison sont revenus de chez ${fleet.targetPseudo}.` };
    case "garrison":
      return { title: "Garnison rentrée", message: `Ta garnison stationnée chez ${fleet.targetPseudo} est de retour.` };
    case "spy":
      return { title: "Sondes rentrées", message: `Tes sondes envoyées vers ${fleet.targetPseudo} sont de retour.` };
    case "recycle":
      return fleet.recalled
        ? { title: "Recycleurs rentrés", message: "Tes recycleurs rappelés sont de retour, soute vide." }
        : {
            title: "Recyclage terminé",
            message: lootTotal > 0 ? `Récupéré dans les débris de ${fleet.targetPseudo} : ${describeGain(fleet.loot ?? {})} (${formatInt(lootTotal)} au total).` : `Le champ de débris de ${fleet.targetPseudo} était déjà vide.`,
          };
    default:
      return fleet.recalled
        ? { title: "Flotte rappelée rentrée", message: `Ta flotte envoyée vers ${fleet.targetPseudo} est de retour, sans combat.` }
        : {
            title: "Flotte rentrée à la base",
            message: lootTotal > 0 ? `Retour de ${fleet.targetPseudo}. Butin : ${describeGain(fleet.loot ?? {})} (${formatInt(lootTotal)} au total).` : `Retour de ${fleet.targetPseudo}, sans butin.`,
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
  /** v3.2 : les deux alliances sont en guerre (délai d'attaque réduit). */
  atWar?: boolean;
  /** v3.1 : expédition (durée, expéditions en cours et du jour) et formation. */
  expeditionHours?: number;
  expeditionsActive?: number;
  expeditionsToday?: number;
  /** 5.33 : flottes en vol qui occupent un emplacement (lues par le serveur ; absent = pas de contrôle). */
  fleetsActive?: number;
  formation?: string;
  /** v3.5 : colonie visée par une attaque ou un espionnage (sinon la planète mère). */
  targetColonyId?: string;
  /** v3.5 : transport (colonie, sens, chargement). */
  transport?: { colonyId?: unknown; direction?: unknown; cargo?: unknown };
  /** v3.9 : contrat de prime visé, ou nom de la proie d'élite. */
  bountyId?: string;
  /** v4.0 : capsules du Labo de synthèse embarquées (attaque de joueur). */
  capsules?: unknown;
  /** v5.1 : contrat livré (vérifié par le serveur, qui fournit le client en `target`). */
  delivery?: { id: string; status: string; supplierUid: string; deadlineMs: number; fleetId: string; wantRes: ResourceId; wantAmount: number };
  random?: () => number;
  eliteName?: string;
}

export function performLaunch(req: LaunchRequest): LaunchOutput & { capsules: LaunchCapsules | null; attackerQueues: QueuesState; attackerNotifications: NewNotification[] } {
  const mission = req.mission ?? "attack";
  const { now, target } = req;
  if ((mission === "attack" || mission === "spy") && !target) throw new GameActionError("Ce joueur est introuvable.");
  if (mission === "attack" && req.owner.uid === target!.uid) throw new GameActionError("Tu ne peux pas t'attaquer toi-même !");
  if (mission === "spy" && req.owner.uid === target!.uid) throw new GameActionError("Tu ne peux pas t'espionner toi-même.");
  if (mission === "garrison" && !target) throw new GameActionError("Ce joueur est introuvable.");
  // 5.22 : unités d'élite contre les seigneurs de guerre seulement.
  assertEliteMission(req.fleet, mission === "attack" && !!target?.npc && !req.targetColonyId);
  const flushed = flushState({ ...req.owner, buildings: withMissingBuildings(req.owner.buildings, req.owner.resources) }, req.ownerQueues, now);
  const owner = flushed.player;
  // v3.5 : attaque ou espionnage d'une colonie (ses coordonnées, son bouclier).
  let planet = target;
  if (req.targetColonyId && (mission === "attack" || mission === "spy")) {
    if (target!.uid === owner.uid) throw new GameActionError("C'est ta propre colonie.");
    const colony = colonyOf(advanceTarget(target!, now), req.targetColonyId);
    if (!colony) throw new GameActionError("Cette colonie n'existe plus.");
    planet = colonyView(target!, colony);
  }
  const slotBlocker = fleetSlotBlocker(owner, mission, req.fleetsActive);
  if (slotBlocker) throw new GameActionError(slotBlocker);
  let out: LaunchOutput;
  if (mission === "attack") out = launchFleet({ now, attacker: owner, defender: planet!, fleet: req.fleet, lastAttackOnTargetMs: req.lastAttackOnTargetMs ?? null, atWar: req.atWar });
  else if (mission === "spy") out = launchSpy(owner, planet!, req.fleet, now);
  else if (mission === "recycle") out = launchRecycle(owner, req.debris ?? null, req.fleet, now);
  else if (mission === "patrol") out = launchPatrol(owner, req.fleet, req.patrolMinutes ?? 0, now);
  else if (mission === "lair") out = launchLair(owner, req.lairTarget ?? "", req.fleet, now);
  else if (mission === "garrison") out = launchGarrison(owner, target!, req.fleet, req.garrisonHours ?? 0, req.garrisonsAtHost ?? 0, now);
  else if (mission === "expedition") {
    const e = launchExpedition(owner, req.fleet, req.expeditionHours, req.expeditionsActive ?? 0, req.expeditionsToday ?? 0, now, req.formation);
    out = { attacker: e.attacker, fleet: e.fleet, defenderNotifications: [] };
  } else if (mission === "leviathan") {
    const units = takeUnits(owner, req.fleet, (id) => OFFENSIVE_UNITS.includes(id) && id !== "sonde_espionnage", "Seuls les vaisseaux de combat peuvent attaquer un boss mondial.");
    if (Object.keys(units).length === 0) throw new GameActionError("Sélectionne au moins une unité à envoyer.");
    out = {
      attacker: owner,
      fleet: newFleet(owner, { uid: "leviathan", pseudo: "Boss mondial" }, "leviathan", units, now, now + LEVIATHAN_RULES.flightMinutes * 60_000),
      defenderNotifications: [],
    };
  }
  else if (mission === "seasonboss") {
    const units = takeUnits(owner, req.fleet, (id) => OFFENSIVE_UNITS.includes(id) && id !== "sonde_espionnage", "Seuls les vaisseaux de combat peuvent attaquer le boss de saison.");
    if (Object.keys(units).length === 0) throw new GameActionError("Sélectionne au moins une unité à envoyer.");
    out = {
      attacker: owner,
      fleet: newFleet(owner, { uid: "seasonboss", pseudo: req.eliteName ?? "Boss de saison" }, "seasonboss", units, now, now + seasonBossFlightMinutes() * 60_000),
      defenderNotifications: [],
    };
  }
  else if (mission === "allianceboss") {
    // v4.6 : boss d'alliance, cible « allianceboss:<id de l'alliance> ».
    const units = takeUnits(owner, req.fleet, (id) => OFFENSIVE_UNITS.includes(id) && id !== "sonde_espionnage", "Seuls les vaisseaux de combat peuvent attaquer le boss d'alliance.");
    if (Object.keys(units).length === 0) throw new GameActionError("Sélectionne au moins une unité à envoyer.");
    if (!owner.allianceId) throw new GameActionError("Il faut une alliance pour combattre son boss.");
    out = {
      attacker: owner,
      fleet: newFleet(owner, { uid: `allianceboss:${owner.allianceId}`, pseudo: req.eliteName ?? "Boss d'alliance" }, "allianceboss", units, now, now + ALLIANCE_BOSS_RULES.flightMinutes * 60_000),
      defenderNotifications: [],
    };
  }
  else if (mission === "transport") out = launchTransport(owner, req.fleet, req.transport ?? {}, now);
  else if (mission === "bounty") out = launchBounty(owner, req.bountyId ?? "", req.fleet, now);
  else if (mission === "delivery") {
    if (!target || !req.delivery) throw new GameActionError("Contrat introuvable.");
    out = launchDelivery(owner, target, req.fleet, req.delivery, now);
  }
  else if (mission === "elite") {
    const units = takeUnits(owner, req.fleet, (id) => OFFENSIVE_UNITS.includes(id) && id !== SPY_RULES.probeUnitId, "Seuls les vaisseaux de combat peuvent traquer la proie d'élite.");
    out = { attacker: owner, fleet: newFleet(owner, { uid: ELITE_TARGET, pseudo: req.eliteName ?? "Proie d'élite" }, "elite", units, now, now + ELITE_RULES.flightMinutes * 60_000), defenderNotifications: [] };
  }
  else throw new GameActionError("Mission inconnue.");
  // v4.0 : stimulant d'assaut et brouilleur d'approche (joueur contre joueur seulement).
  let capsules: LaunchCapsules | null = null;
  if (mission === "attack" && req.capsules) {
    capsules = takeLaunchCapsules(out.attacker, req.capsules, out.fleet.units, OFFENSIVE_UNITS.filter((id) => id !== SPY_RULES.probeUnitId), req.random);
    if (capsules.fakeUnits) {
      const fakeTotal = Object.values(capsules.fakeUnits).reduce((a, b) => a + b, 0);
      out.defenderNotifications = out.defenderNotifications.map((n) => ({ ...n, message: n.message.replace(/t'envoie [\d\s\u202f\u00a0.,]+ vaisseaux/, `t'envoie ${formatInt(fakeTotal)} vaisseaux`) }));
    }
  }
  // v5.1 : puissance d'attaque affichée au défenseur (sur la composition qu'il voit, leurre compris).
  if (mission === "attack") out.fleet.power = attackPowerShown(out.attacker, capsules?.fakeUnits ?? out.fleet.units, req.formation);
  if (mission === "spy") grantCommanderXp(out.attacker, "spy", COMMANDER_XP.spyLaunched);
  if (mission === "spy") recordChronicle(out.attacker, "spy", now);
  const counter = ({ spy: "spies", patrol: "patrols", garrison: "garrisons" } as const)[mission as "spy" | "patrol" | "garrison"];
  if (counter) bumpStat(out.attacker, counter);
  return { ...out, capsules, attackerQueues: flushed.queues, attackerNotifications: flushed.notifications };
}

/** Puissance d'attaque d'une flotte (bonus de l'attaquant et formation compris), pour l'alerte du défenseur. */
export function attackPowerShown(attacker: PlayerState, units: Record<string, number>, formation?: string): number {
  return Math.round(computeFleetPower(attacker.units, attacker.techLevels, units, ["attack"]) * formationEffects(formation).attackFactor * (1 + playerModifiers(attacker).attack));
}

/** Copie de la cible avec ses colonies rattrapées (colonisation arrivée). */
function advanceTarget(target: PlayerState, now: number): PlayerState {
  const copy = structuredClone(target);
  advanceColonies(copy, now);
  return copy;
}

/** Transport (v3.5) : livraison (chargée sur la planète mère) ou collecte
 *  (chargée à l'arrivée sur la colonie, rapportée au retour). */
export function launchTransport(owner: PlayerState, raw: Record<string, unknown>, req: { colonyId?: unknown; direction?: unknown; cargo?: unknown }, now: number): LaunchOutput {
  const colony = colonyOf(owner, String(req.colonyId ?? ""));
  if (!colony) throw new GameActionError("Colonie introuvable.");
  const direction: TransportDirection = req.direction === "collect" ? "collect" : "deliver";
  const units = takeUnits(owner, raw, (id) => OFFENSIVE_UNITS.includes(id) && id !== SPY_RULES.probeUnitId, "Seuls les vaisseaux (hors sondes) peuvent transporter.");
  const capacity = playerCargoCapacity(owner, units);
  if (capacity <= 0) throw new GameActionError("Ces vaisseaux n'ont pas de soute.");
  const cargo = parseCargo(req.cargo, direction === "deliver" ? capacity : Infinity);
  if (direction === "deliver") {
    if (Object.keys(cargo).length === 0) throw new GameActionError("Charge au moins une ressource.");
    for (const [res, n] of Object.entries(cargo) as [ResourceId, number][]) {
      if ((owner.resources[res] ?? 0) < n) throw new GameActionError("Ressources insuffisantes sur la planète mère.");
    }
    for (const [res, n] of Object.entries(cargo) as [ResourceId, number][]) owner.resources[res] -= n;
  }
  const speed = fleetSpeed(owner.units, units);
  const arriveAtMs = now + travelSeconds(distanceBetween(owner.uid, colony.id), speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels, owner)) * 1000;
  grantCommanderXp(owner, "logistician", COMMANDER_XP.fleetDispatched);
  bumpStat(owner, "transports");
  return {
    attacker: owner,
    fleet: { ...newFleet(owner, { uid: colony.id, pseudo: colony.name }, "transport", units, now, arriveAtMs), transport: { direction, colonyId: colony.id, cargo } },
    defenderNotifications: [],
  };
}

/** v5.1 : livraison d'un contrat entre joueurs — cargaison chargée au départ, arrivée avant l'échéance. */
export function launchDelivery(
  owner: PlayerState,
  client: PlayerState,
  raw: Record<string, unknown>,
  contract: NonNullable<LaunchRequest["delivery"]>,
  now: number,
): LaunchOutput {
  if (contract.fleetId) throw new GameActionError("Une livraison est déjà en route pour ce contrat.");
  const units = takeUnits(owner, raw, (id) => OFFENSIVE_UNITS.includes(id) && id !== SPY_RULES.probeUnitId, "Seuls les vaisseaux (hors sondes) peuvent livrer.");
  const capacity = playerCargoCapacity(owner, units);
  const speed = fleetSpeed(owner.units, units);
  const arriveAtMs = now + travelSeconds(distanceBetween(owner.uid, client.uid), speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels, owner)) * 1000;
  grantCommanderXp(owner, "logistician", COMMANDER_XP.fleetDispatched);
  checkDelivery(contract, owner.uid, capacity, arriveAtMs);
  if ((owner.resources[contract.wantRes] ?? 0) < contract.wantAmount) throw new GameActionError("Ressources insuffisantes pour cette livraison.");
  owner.resources[contract.wantRes] -= contract.wantAmount;
  return {
    attacker: owner,
    fleet: {
      ...newFleet(owner, { uid: client.uid, pseudo: client.pseudo }, "delivery", units, now, arriveAtMs),
      transport: { direction: "deliver", colonyId: "", cargo: { [contract.wantRes]: contract.wantAmount }, contractId: contract.id },
    },
    defenderNotifications: [],
  };
}

/** Arrivée d'un transport : livraison ou chargement, puis retour. */
export function performTransportArrival(
  ownerIn: PlayerState,
  ownerQueues: QueuesState,
  fleet: Fleet,
  now: number,
): { owner: PlayerState; queues: QueuesState; notifications: NewNotification[]; loot: Partial<Record<ResourceId, number>> | null; outcome: string } {
  const flushed = flushState({ ...ownerIn, buildings: withMissingBuildings(ownerIn.buildings, ownerIn.resources) }, ownerQueues, now);
  const owner = flushed.player;
  const notes = [...flushed.notifications, ...advanceColonies(owner, now)];
  const colony = colonyOf(owner, fleet.transport?.colonyId ?? fleet.targetUid);
  const t = fleet.transport;
  if (!colony || !t) {
    // Colonie disparue : la cargaison d'une livraison repart vers la planète mère.
    return { owner, queues: flushed.queues, notifications: notes, loot: t?.direction === "deliver" ? t.cargo : null, outcome: "lost" };
  }
  if (t.direction === "deliver") {
    deliverToColony(colony, t.cargo);
    const total = Object.values(t.cargo).reduce((a: number, b) => a + (b ?? 0), 0);
    notes.push({ kind: "fleet", title: "Livraison effectuée", message: `${formatInt(total)} ressources livrées à ${colony.name}.`, createdAtMs: now, read: false });
    return { owner, queues: flushed.queues, notifications: notes, loot: null, outcome: "delivered" };
  }
  const taken = collectFromColony(colony, t.cargo, playerCargoCapacity(owner, fleet.units));
  return { owner, queues: flushed.queues, notifications: notes, loot: taken, outcome: "collected" };
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
  const arriveAtMs = now + spyTravelSeconds(distanceBetween(owner.uid, target.uid), speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels, owner)) * 1000;
  return { attacker: owner, fleet: newFleet(owner, target, "spy", units, now, arriveAtMs), defenderNotifications: [] };
}

/** Recyclage : Drones récupérateurs vers un champ de débris encore présent. */
export function launchRecycle(owner: PlayerState, field: DebrisField | null, raw: Record<string, unknown>, now: number): LaunchOutput {
  if (!field || field.expiresAtMs <= now || debrisTotal(field) <= 0) throw new GameActionError("Ce champ de débris n'existe plus.");
  const units = takeUnits(owner, raw, isRecyclerUnit, "Seuls les Drones récupérateurs et les Récolteurs peuvent recycler.");
  const speed = fleetSpeed(owner.units, units);
  const arriveAtMs = now + travelSeconds(distanceBetween(owner.uid, field.id), speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels, owner)) * 1000;
  grantCommanderXp(owner, "logistician", COMMANDER_XP.fleetDispatched);
  return {
    attacker: owner,
    fleet: newFleet(owner, { uid: field.id, pseudo: field.locationPseudo }, "recycle", units, now, arriveAtMs),
    defenderNotifications: [],
  };
}

/** Énergie payée au départ d'une patrouille : l'entretien de la flotte
 *  pour toute la durée. */
export function patrolEnergyCost(units: PlayerState["units"], fleet: Record<string, number>, minutes: number, techLevels?: PlayerState["techLevels"], empireCut = 0): number {
  const selected: PlayerState["units"] = {};
  for (const [id, qty] of Object.entries(fleet)) selected[id] = { level: units[id]?.level ?? 1, count: qty };
  return Math.ceil(getFleetUpkeep(selected, techLevels, empireCut) * minutes * 60);
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
  const cost = patrolEnergyCost(owner.units, requested, duration, owner.techLevels, playerModifiers(owner).fleetUpkeep);
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
  const cost = patrolEnergyCost(owner.units, requested, hours * 60, owner.techLevels, playerModifiers(owner).fleetUpkeep);
  if ((owner.resources.energy ?? 0) < cost) throw new GameActionError(`Il faut ${formatInt(cost)} énergie pour l'entretien de la garnison.`);
  const units = takeUnits(owner, raw, (id) => OFFENSIVE_UNITS.includes(id), "Seuls les vaisseaux peuvent former une garnison.");
  owner.resources.energy = (owner.resources.energy ?? 0) - cost;
  const speed = fleetSpeed(owner.units, units);
  const arriveAtMs = now + travelSeconds(distanceBetween(owner.uid, host.uid), speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels, owner)) * 1000;
  grantCommanderXp(owner, "logistician", COMMANDER_XP.fleetDispatched);
  // v5.3 : puissance brute (attaque + défense) affichée à l'hôte dans le comparatif des menaces.
  const power = Math.round(computeFleetPower(owner.units, owner.techLevels, units, ["attack", "defense"]));
  const fleet = { ...newFleet(owner, host, "garrison", units, now, arriveAtMs), durationMs: hours * 3600_000, stationedUntilMs: null, power };
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
  const arriveAtMs = now + travelSeconds(LAIR_DISTANCE, speed, allianceFlightFactor(owner.allianceResearch, owner.techLevels, owner)) * 1000;
  return {
    attacker: owner,
    fleet: { ...newFleet(owner, { uid: lairUid(faction!.id), pseudo: faction!.lair.name }, "lair", units, now, arriveAtMs), power, factionId: faction!.id },
    defenderNotifications: [],
  };
}

/** v3.9 : chasse à la prime. La puissance du fugitif est fixée au départ,
 *  sur toute la flotte à quai (vaisseaux envoyés compris). */
export function launchBounty(owner: PlayerState, contractId: string, raw: Record<string, unknown>, now: number): LaunchOutput {
  const { contract, power, fugitive } = startBounty(owner, contractId, now);
  const units = takeUnits(owner, raw, (id) => OFFENSIVE_UNITS.includes(id) && id !== SPY_RULES.probeUnitId, "Seuls les vaisseaux de combat peuvent chasser.");
  return {
    attacker: owner,
    fleet: { ...newFleet(owner, { uid: bountyTarget(contract), pseudo: fugitive.name }, "bounty", units, now, now + contract.minutes * 60_000), power, factionId: fugitive.factionId },
    defenderNotifications: [],
  };
}

/** Contrat visé par une flotte de prime (targetUid = bounty_<id>). */
export function bountyIdOf(targetUid: string): string {
  return targetUid.startsWith("bounty_") ? targetUid.slice("bounty_".length) : "";
}

export const ELITE_TARGET = "bounty_elite";

/** v3.9 : Balise de repli. La flotte rentre aussitôt (rappelée si elle
 *  n'avait pas encore atteint sa cible). */
export function beaconReturn(fleet: Fleet, uid: string, now: number): Fleet {
  if (fleet.ownerUid !== uid) throw new GameActionError("Cette flotte ne t'appartient pas.");
  if (!["outbound", "returning", "stationed"].includes(fleet.status)) throw new GameActionError("Cette flotte n'est plus en vol.");
  if (fleet.mission === "expedition" || ((fleet.mission === "leviathan" || fleet.mission === "seasonboss" || fleet.mission === "allianceboss" || fleet.mission === "elite") && fleet.status === "outbound")) {
    throw new GameActionError("La balise ne peut pas ramener cette flotte.");
  }
  const recalled = fleet.status === "outbound" ? true : fleet.recalled;
  return { ...fleet, status: "returning", recalled, returnAtMs: now };
}

/** Vaisseaux d'un joueur actuellement hors de la base (toutes missions). */
export function unitsAwayOf(fleets: Pick<Fleet, "ownerUid" | "status" | "units">[], uid: string): Record<string, number> {
  const away: Record<string, number> = {};
  for (const f of fleets) {
    if (f.ownerUid !== uid || f.status === "done") continue;
    for (const [id, n] of Object.entries(f.units ?? {})) if (n > 0) away[id] = (away[id] ?? 0) + n;
  }
  return away;
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

/** 5.23 : missions dont le décollage peut être programmé, et délai maximal. */
export const SCHEDULABLE_MISSIONS: FleetMission[] = ["attack", "spy", "transport", "recycle", "garrison"];
export const FLEET_DELAY_MAX_MINUTES = 12 * 60;

/** 5.23 : délai de décollage demandé (minutes entières), borné ; 0 si la mission ne s'y prête pas. */
export function fleetDelayMs(mission: string, minutes: unknown): number {
  const m = Math.floor(Number(minutes));
  if (!SCHEDULABLE_MISSIONS.includes(mission as FleetMission) || !(m > 0)) return 0;
  return Math.min(FLEET_DELAY_MAX_MINUTES, m) * 60_000;
}

/** 5.23 : la flotte attend son décollage programmé. */
export function awaitingDeparture(f: Pick<Fleet, "departAtMs" | "status">, now: number): boolean {
  return f.status === "outbound" && f.departAtMs > now;
}
