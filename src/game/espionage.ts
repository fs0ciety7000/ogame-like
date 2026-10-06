import { colonyOf, colonyView } from "@/game/colonies";
import { flushState, type NewNotification } from "@/game/flush";
import { withMissingBuildings } from "@/game/buildings";
import type { Fleet } from "@/game/fleets";
import { galaxyCoords } from "@/game/galaxy";
import { DEFENSIVE_UNITS, OFFENSIVE_UNITS, UNIT_TO_TECH } from "@/game/units";
import { formatInt } from "@/game/format";
import { allianceCounterSpy } from "@/game/alliances";
import type { PlayerState, QueuesState, ResourceId, SpyReport, SpyReportData } from "@/types/game";
import { techBonus } from "@/game/technologies";
import { playerModifiers } from "@/game/modifiers";
import { activeVeil, veilCounts } from "@/game/synthesis";
import { anomalyChance } from "@/game/commanders";

/* =====================================================
   Espionnage à niveaux (v1.7) : des sondes partent vers la cible. À
   l'arrivée, un score décide de la profondeur du rapport :

     score = Espionnage de l'espion − contre-espionnage de la cible
             + log2(nombre de sondes)

   Le contre-espionnage vaut le niveau d'Espionnage de la cible, plus un
   point par tranche de sentinelles à quai. Une sonde détectée est abattue
   (la cible est prévenue), mais le rapport part quand même.
===================================================== */

export const SPY_RULES = {
  /** Unité envoyée en mission d'espionnage. */
  probeUnitId: "sonde_espionnage",
  /** Durée fixe du trajet, en minutes. */
  baseMinutes: 1,
  /** Minutes par unité de distance, divisées par la vitesse des sondes. */
  minutesPerDistance: 0.5,
  /** Sentinelles à quai : 1 point à 100, 2 à 300, 3 à 700… (log2), au plus sentinelCounterCap.
   *  5.22.1 : c'était 1 point par 100 sans plafond, des milliers de sentinelles rendaient
   *  tout espionnage impossible (2^20 sondes) en fin de partie. */
  sentinelsPerCounterLevel: 100,
  sentinelCounterCap: 4,
  sentinelUnitId: "sentinelle",
  /** Chance de détection : base + parPoint × (contre-espionnage − Espionnage). */
  detectionBase: 0.1,
  detectionPerPoint: 0.1,
  detectionMin: 0.05,
  detectionMax: 0.75,
  /** Score minimum de chaque palier du rapport. */
  tierResources: 0,
  tierForces: 2,
  tierInfrastructure: 4,
  tierActivity: 6,
};

/** Paliers du rapport, du plus superficiel au plus complet. */
export const SPY_TIER_LABELS = ["Brouillé", "Ressources", "Flotte et défenses", "Bâtiments et technologies", "Files et flottes en vol"];

/** Niveau d'Espionnage d'un joueur (la techno qui améliore les sondes). */
export function espionageLevel(player: Pick<PlayerState, "techLevels"> & Partial<Pick<PlayerState, "commanders" | "relics" | "ascensions">>): number {
  const tech = UNIT_TO_TECH[SPY_RULES.probeUnitId] ?? "tech20";
  // v4.0 : Espionne en poste et Œil de Vesper.
  return Math.max(0, Number(player.techLevels?.[tech]) || 0) + playerModifiers(player).spyLevel;
}

export function counterEspionage(target: Pick<PlayerState, "techLevels" | "units" | "allianceResearch"> & Partial<Pick<PlayerState, "commanders" | "relics" | "ascensions">>): number {
  const sentinels = target.units?.[SPY_RULES.sentinelUnitId]?.count ?? 0;
  const per = Math.max(1, SPY_RULES.sentinelsPerCounterLevel);
  const sentinelPoints = Math.min(SPY_RULES.sentinelCounterCap, Math.floor(Math.log2(1 + sentinels / per)));
  return espionageLevel(target) + sentinelPoints + allianceCounterSpy(target.allianceResearch) + Math.floor(techBonus(target.techLevels, "counter_spy") + playerModifiers(target).counterSpy);
}

export function spyScore(spyLevel: number, counter: number, probes: number): number {
  return spyLevel - counter + Math.log2(Math.max(1, probes));
}

/** 0 = rapport brouillé, 1 à 4 = paliers atteints. */
export function spyTier(score: number): number {
  const thresholds = [SPY_RULES.tierResources, SPY_RULES.tierForces, SPY_RULES.tierInfrastructure, SPY_RULES.tierActivity];
  return thresholds.filter((t) => score >= t).length;
}

export function detectionChance(spyLevel: number, counter: number): number {
  const raw = SPY_RULES.detectionBase + SPY_RULES.detectionPerPoint * (counter - spyLevel);
  return Math.min(SPY_RULES.detectionMax, Math.max(SPY_RULES.detectionMin, raw));
}

/** Durée du trajet des sondes, en secondes. */
export function spyTravelSeconds(distance: number, speed: number, factor = 1): number {
  return Math.round(factor * (SPY_RULES.baseMinutes + (distance * SPY_RULES.minutesPerDistance) / Math.max(1, speed)) * 60);
}

/** Secteur affiché d'un joueur (coordonnées arrondies sur la carte). */
export function sectorLabel(uid: string): string {
  const c = galaxyCoords(uid);
  return `${Math.round(c.x * 100)}·${Math.round(c.y * 100)}`;
}

function unitsOf(target: PlayerState, ids: string[]) {
  const out: Record<string, { count: number; level: number }> = {};
  for (const id of ids) {
    const u = target.units?.[id];
    if (u && (u.count > 0 || u.level > 0)) out[id] = { count: u.count, level: u.level };
  }
  return out;
}

/** Contenu du rapport, limité au palier atteint. */
export function buildSpyReportData(target: PlayerState, queues: QueuesState, targetFleets: Fleet[], tier: number, now: number, garrisons: Fleet[] = []): SpyReportData {
  const data: SpyReportData = {};
  if (tier >= 1) {
    data.resources = Object.fromEntries(
      Object.entries(target.resources ?? {}).map(([res, amount]) => [res, Math.floor(amount ?? 0)]),
    ) as Partial<Record<ResourceId, number>>;
  }
  if (tier >= 2) {
    data.units = unitsOf(target, OFFENSIVE_UNITS);
    data.defenses = unitsOf(target, DEFENSIVE_UNITS);
    data.garrisons = garrisons.map((g) => ({ ownerPseudo: g.ownerPseudo, units: g.units }));
    data.posture = target.posture?.id ?? "standard";
  }
  if (tier >= 3) {
    data.buildings = Object.fromEntries(Object.entries(target.buildings ?? {}).map(([id, b]) => [id, b?.unlocked === false ? 0 : b?.level ?? 0]));
    data.techLevels = { ...(target.techLevels ?? {}) };
  }
  if (tier >= 4) {
    data.queues = {
      buildings: Object.entries(queues.buildingUpgrades ?? {})
        .filter(([, u]) => u && u.endTime > now)
        .map(([id, u]) => ({ id, endTime: u!.endTime })),
      researches: (queues.activeResearches ?? []).map((r) => ({ id: r.id, endTime: r.endTime })),
      units: Object.values(queues.unitQueues ?? {})
        .flat()
        .map((q) => ({ id: q.unitId, endTime: q.endTime ?? null })),
    };
    data.fleets = targetFleets
      .filter((f) => f.status !== "done")
      .map((f) => ({
        mission: f.mission,
        targetPseudo: f.targetPseudo,
        units: f.units,
        status: f.status,
        at: f.status === "outbound" ? f.arriveAtMs : f.returnAtMs ?? f.arriveAtMs,
      }));
  }
  return data;
}

export interface SpyArrivalInput {
  now: number;
  spy: PlayerState;
  spyQueues: QueuesState;
  target: PlayerState;
  targetQueues: QueuesState;
  /** Flottes de la cible en vol (pour le dernier palier). */
  targetFleets: Fleet[];
  /** Garnisons alliées stationnées chez la cible (palier flotte et défenses). */
  targetGarrisons?: Fleet[];
  probes: number;
  random?: () => number;
  /** v3.5 : colonie visée (sinon la planète mère). */
  colonyId?: string;
  /** 5.26.3 : Sondes fantômes (Comptoir) : impossibles à repérer. */
  undetectable?: boolean;
}

export interface SpyArrivalOutput {
  report: Omit<SpyReport, "id">;
  detected: boolean;
  spyNotifications: NewNotification[];
  targetNotifications: NewNotification[];
}

/** Arrivée des sondes : score, rapport, jet de détection. Les états sont
 *  rattrapés en lecture seule (rien n'est enregistré pour les joueurs). */
export function resolveSpyArrival(input: SpyArrivalInput): SpyArrivalOutput {
  const { now, probes } = input;
  const spy = flushState({ ...input.spy, buildings: withMissingBuildings(input.spy.buildings, input.spy.resources) }, input.spyQueues, now).player;
  const flushed = flushState({ ...input.target, buildings: withMissingBuildings(input.target.buildings, input.target.resources) }, input.targetQueues, now);
  const owner = flushed.player;
  // v3.5 : sur une colonie, le rapport décrit la colonie (défenses, stock, bâtiments).
  const colony = input.colonyId ? colonyOf(owner, input.colonyId) : undefined;
  const target = colony ? colonyView(owner, colony) : owner;

  const level = espionageLevel(spy);
  const counter = counterEspionage(target);
  const score = spyScore(level, counter, probes);
  const tier = spyTier(score);
  const detected = !input.undetectable && (input.random ?? Math.random)() < Math.min(0.95, detectionChance(level, counter) + playerModifiers(owner).detection);

  const random = input.random ?? Math.random;
  const data = colony ? buildSpyReportData(target, { ...flushed.queues, buildingUpgrades: {}, activeResearches: [], unitQueues: { attack: [], defense: [] } }, [], tier, now) : buildSpyReportData(target, flushed.queues, input.targetFleets, tier, now, input.targetGarrisons ?? []);
  // v4.0 : brouilleur de défense (Labo de synthèse) : flotte et défenses faussées.
  const veil = activeVeil(owner, now);
  if (veil > 0) {
    data.units = veilCounts(data.units, veil, random);
    data.defenses = veilCounts(data.defenses, veil, random);
  }
  const anomaly = veil > 0 && random() < anomalyChance(spy);

  const report: Omit<SpyReport, "id"> = {
    spyUid: spy.uid,
    spyPseudo: spy.pseudo,
    targetUid: target.uid,
    targetPseudo: target.pseudo,
    timestamp: now,
    targetProcessed: true,
    probes,
    score: Math.round(score * 100) / 100,
    tier,
    detected,
    data,
    anomaly,
  };

  const spyNotifications: NewNotification[] = [
    {
      kind: "spy",
      title: detected ? "Sondes repérées et abattues" : "Rapport d'espionnage reçu",
      message: `${target.pseudo} : ${SPY_TIER_LABELS[tier].toLowerCase()}${detected ? ". Tes sondes n'ont pas survécu." : "."}${anomaly ? " Ton Espionne flaire une anomalie chimique : les chiffres sont peut-être faussés." : ""}`,
      createdAtMs: now,
      read: false,
    },
  ];
  const targetNotifications: NewNotification[] = detected
    ? [
        {
          kind: "spy-detected",
          title: "Espionnage détecté !",
          message: `${spy.pseudo} (secteur ${sectorLabel(spy.uid)}) t'a envoyé ${formatInt(probes)} sonde${probes > 1 ? "s" : ""} : abattue${probes > 1 ? "s" : ""}.`,
          createdAtMs: now,
          read: false,
        },
      ]
    : [];
  return { report, detected, spyNotifications, targetNotifications };
}
