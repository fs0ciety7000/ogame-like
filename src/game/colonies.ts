import { allianceProductionFactor } from "@/game/alliances";
import { ascensionProductionFactor } from "@/game/ascension";
import { playerBuildTimeFactor } from "@/game/bonuses";
import { applyBuildingDiscount, BUILDINGS, findBuilding, getBuildingUpgradeCost, getBuildingUpgradeTime, getStorageCapacity, getUnitCapacity, PRODUCTION_RESOURCE_BY_BUILDING } from "@/game/buildings";
import { advanceResources, COMMON_RESOURCES } from "@/game/economy";
import { GameActionError } from "@/game/errors";
import { formatInt } from "@/game/format";
import { RESOURCE_LIST } from "@/game/resources";
import { findUnit, getUnitBuildTime } from "@/game/units";
import type { NewNotification } from "@/game/flush";
import type { Buildings, PlayerState, ResourceId, Resources } from "@/types/game";

/* =====================================================
   Colonies (v3.5) : jusqu'à deux planètes en plus de la planète mère.
   Chacune a ses propres bâtiments (extracteurs, entrepôt, hangar de
   défense), son propre stock et ses défenses. Les technologies, l'alliance
   et les ascensions profitent à tout l'empire. Les ressources circulent
   par transport (flottes de la planète mère).
===================================================== */

export const COLONY_RULES = {
  maxColonies: 2,
  /** Niveaux de bâtiments cumulés (planète mère) requis pour la 1re, puis la 2e colonie. */
  levelsRequired: [120, 140],
  /** Vaisseau colonial : coût par ressource commune et par ressource rare. */
  foundCommonCost: 50_000_000,
  foundRareCost: 1_000_000,
  /** Voyage du vaisseau colonial (heures). */
  foundHours: 2,
  /** Stock de départ de chaque ressource commune. */
  startStock: 1_000_000,
  maxLevel: 15,
  /** Coût des bâtiments d'une colonie : × ce facteur par rapport à la planète mère. */
  costFactor: 1.5,
};

export interface ColonyBuildingJob {
  id: string;
  level: number;
  endTime: number;
  /** v4.7 : départ et coût payé (annulation au prorata). */
  startedAtMs?: number;
  paid?: Partial<Record<ResourceId, number>>;
}

export interface ColonyDefenseJob {
  unitId: string;
  qty: number;
  endTime: number;
  startedAtMs?: number;
  paid?: Partial<Record<ResourceId, number>>;
}

export interface Colony {
  /** `<uid>-c<slot>` : sert aussi de coordonnées sur la carte. */
  id: string;
  slot: number;
  name: string;
  foundedAtMs: number;
  buildings: Buildings;
  resources: Resources;
  updatedAtMs: number;
  building: ColonyBuildingJob | null;
  defenses: Record<string, { level: number; count: number }>;
  defenseJob: ColonyDefenseJob | null;
  /** Dernière défaite (bouclier d'une heure, propre à la colonie). */
  lastDefeatAtMs?: number;
}

export interface Colonizing {
  slot: number;
  name: string;
  endTime: number;
}

const HOUR = 3600_000;

/** Bâtiments constructibles sur une colonie. */
export function colonyBuildingIds(): string[] {
  return BUILDINGS.filter((b) => {
    const res = PRODUCTION_RESOURCE_BY_BUILDING[b.id];
    if (res && COMMON_RESOURCES.includes(res as ResourceId)) return true;
    if (b.effect?.type === "storage") return true;
    return b.effect?.type === "hangar" && b.effect.category === "defense";
  }).map((b) => b.id);
}

export function colonyMaxLevel(id: string): number {
  return Math.min(findBuilding(id)?.maxLevel ?? COLONY_RULES.maxLevel, COLONY_RULES.maxLevel);
}

export function colonyId(uid: string, slot: number): string {
  return `${uid}-c${slot}`;
}

export function colonyOf(player: Pick<PlayerState, "colonies">, id: string): Colony | undefined {
  return (player.colonies ?? []).find((c) => c.id === id);
}

/** Propriétaire d'une colonie d'après son identifiant (null si ce n'en est pas une). */
export function colonyOwnerUid(id: string): string | null {
  const m = /^(.+)-c(\d+)$/.exec(String(id ?? ""));
  return m ? m[1] : null;
}

/** Vue « planète » d'une colonie pour le combat et l'espionnage : ses
 *  défenses, bâtiments et stock à la place de ceux de la planète mère. */
export function colonyView(player: PlayerState, colony: Colony): PlayerState {
  return { ...player, uid: colony.id, pseudo: `${player.pseudo} — ${colony.name}`, units: colony.defenses, buildings: colony.buildings, resources: colony.resources, posture: undefined, lastDefeatAtMs: colony.lastDefeatAtMs };
}

function emptyResources(): Resources {
  return Object.fromEntries(RESOURCE_LIST.map((r) => [r.id, 0])) as unknown as Resources;
}

/** Niveaux cumulés de la planète mère (v4.9.3 : bâtiments de fin de partie compris). */
export function homeLevels(player: Pick<PlayerState, "buildings">): number {
  return BUILDINGS.reduce((a, b) => a + (player.buildings[b.id]?.level ?? 0), 0);
}

export function colonyFoundCost(): Partial<Record<ResourceId, number>> {
  const cost: Partial<Record<ResourceId, number>> = {};
  for (const r of RESOURCE_LIST) cost[r.id] = r.rarity === "rare" ? COLONY_RULES.foundRareCost : COLONY_RULES.foundCommonCost;
  return cost;
}

/** Prochain emplacement libre et niveaux requis (null si plus d'emplacement). */
export function nextColonySlot(player: Pick<PlayerState, "colonies" | "colonizing">): { slot: number; levels: number } | null {
  const used = new Set([...(player.colonies ?? []).map((c) => c.slot), ...(player.colonizing ? [player.colonizing.slot] : [])]);
  for (let slot = 1; slot <= COLONY_RULES.maxColonies; slot++) {
    if (!used.has(slot)) return { slot, levels: COLONY_RULES.levelsRequired[slot - 1] ?? Infinity };
  }
  return null;
}

/** Lancement du vaisseau colonial, payé par la planète mère. */
export function startColonization(player: PlayerState, nameIn: string, now: number): Colonizing {
  if (player.colonizing) throw new GameActionError("Un vaisseau colonial est déjà en route.");
  const next = nextColonySlot(player);
  if (!next) throw new GameActionError(`Tu as déjà ${COLONY_RULES.maxColonies} colonies.`);
  if (homeLevels(player) < next.levels) throw new GameActionError(`Il faut ${next.levels} niveaux de bâtiments cumulés sur ta planète mère (tu en as ${homeLevels(player)}).`);
  const name = String(nameIn ?? "").trim() || `Colonie ${next.slot}`;
  if (name.length > 30) throw new GameActionError("Le nom d'une colonie fait au plus 30 caractères.");
  const cost = colonyFoundCost();
  for (const [res, n] of Object.entries(cost) as [ResourceId, number][]) {
    if ((player.resources[res] ?? 0) < n) throw new GameActionError("Ressources insuffisantes pour le vaisseau colonial.");
  }
  for (const [res, n] of Object.entries(cost) as [ResourceId, number][]) player.resources[res] -= n;
  player.colonizing = { slot: next.slot, name, endTime: now + COLONY_RULES.foundHours * HOUR };
  return player.colonizing;
}

export function foundColony(uid: string, job: Colonizing, at: number): Colony {
  const buildings: Buildings = {};
  for (const id of colonyBuildingIds()) buildings[id] = { level: 1, unlocked: true };
  const resources = emptyResources();
  for (const res of COMMON_RESOURCES) resources[res] = COLONY_RULES.startStock;
  return { id: colonyId(uid, job.slot), slot: job.slot, name: job.name, foundedAtMs: at, buildings, resources, updatedAtMs: at, building: null, defenses: {}, defenseJob: null };
}

/** Entrées économiques d'une colonie : technologies, alliance et ascensions de l'empire. */
function economyInput(colony: Colony, player: PlayerState) {
  return {
    buildings: colony.buildings,
    techLevels: player.techLevels,
    resources: colony.resources,
    units: colony.defenses,
    allianceResearch: player.allianceResearch,
    ascensions: player.ascensions,
  };
}

export function colonyStorage(colony: Colony, player: Pick<PlayerState, "techLevels">): number {
  return getStorageCapacity(colony.buildings, player.techLevels);
}

/** Production horaire d'une colonie (affichage). */
export function colonyHourlyRates(colony: Colony, player: PlayerState): Partial<Record<ResourceId, number>> {
  const a = advanceResources({ ...economyInput(colony, player), resources: emptyResources() }, 3600);
  return Object.fromEntries(COMMON_RESOURCES.map((r) => [r, Math.round(a[r] ?? 0)]));
}

/** Rattrape une colonie jusqu'à `now` : production, construction, défenses. */
export function advanceColony(colony: Colony, player: PlayerState, now: number): NewNotification[] {
  const notes: NewNotification[] = [];
  let at = colony.updatedAtMs || now;
  for (let guard = 0; guard < 10; guard++) {
    const next = Math.min(colony.building?.endTime ?? Infinity, colony.defenseJob?.endTime ?? Infinity);
    const until = Math.min(next, now);
    if (until > at) {
      colony.resources = advanceResources(economyInput(colony, player), (until - at) / 1000, at);
      at = until;
    }
    if (next > now) break;
    if (colony.building && colony.building.endTime <= now) {
      const job = colony.building;
      colony.buildings[job.id] = { ...(colony.buildings[job.id] ?? { unlocked: true }), level: job.level };
      colony.building = null;
      notes.push({ kind: "building", title: "Colonie : construction terminée", message: `${colony.name} : ${findBuilding(job.id)?.name ?? job.id} niveau ${job.level}.`, createdAtMs: now, read: false });
    }
    if (colony.defenseJob && colony.defenseJob.endTime <= now) {
      const job = colony.defenseJob;
      const cur = colony.defenses[job.unitId] ?? { level: player.units[job.unitId]?.level ?? 1, count: 0 };
      colony.defenses[job.unitId] = { level: Math.max(cur.level, player.units[job.unitId]?.level ?? 1), count: cur.count + job.qty };
      colony.defenseJob = null;
      notes.push({ kind: "building", title: "Colonie : défenses prêtes", message: `${colony.name} : ${formatInt(job.qty)} ${findUnit(job.unitId)?.name ?? job.unitId}.`, createdAtMs: now, read: false });
    }
  }
  colony.updatedAtMs = now;
  return notes;
}

/** Rattrape la colonisation en cours et toutes les colonies. */
export function advanceColonies(player: PlayerState, now: number): NewNotification[] {
  const notes: NewNotification[] = [];
  if (player.colonizing && player.colonizing.endTime <= now) {
    const job = player.colonizing;
    player.colonies = [...(player.colonies ?? []), foundColony(player.uid, job, job.endTime)];
    player.colonizing = null;
    notes.push({ kind: "building", title: "Nouvelle colonie !", message: `${job.name} est fondée : construis ses extracteurs et envoie-lui des ressources.`, createdAtMs: now, read: false });
  }
  for (const c of player.colonies ?? []) notes.push(...advanceColony(c, player, now));
  return notes;
}

function payFrom(resources: Resources, cost: Partial<Record<string, number>>, what: string) {
  for (const [res, n] of Object.entries(cost)) {
    if ((resources[res as ResourceId] ?? 0) < (n ?? 0)) throw new GameActionError(`Le stock de la colonie ne suffit pas pour ${what}.`);
  }
  for (const [res, n] of Object.entries(cost)) resources[res as ResourceId] -= n ?? 0;
}

export function colonyUpgradeCost(player: Pick<PlayerState, "bonuses">, buildingId: string, nextLevel: number): Partial<Record<ResourceId, number>> {
  const def = findBuilding(buildingId);
  if (!def) return {};
  const base = applyBuildingDiscount(getBuildingUpgradeCost(def, nextLevel), player.bonuses?.buildingUpgradeDiscount ?? 0);
  return Object.fromEntries(Object.entries(base).map(([r, n]) => [r, Math.ceil((n ?? 0) * COLONY_RULES.costFactor)]));
}

export function colonyUpgradeSeconds(player: PlayerState, buildingId: string, nextLevel: number, now: number): number {
  const def = findBuilding(buildingId);
  return def ? Math.round(getBuildingUpgradeTime(def, nextLevel) * playerBuildTimeFactor(player, now)) : 0;
}

export function upgradeColonyBuilding(player: PlayerState, colonyIdIn: string, buildingId: string, now: number): ColonyBuildingJob {
  const colony = colonyOf(player, colonyIdIn);
  if (!colony) throw new GameActionError("Colonie introuvable.");
  if (!colonyBuildingIds().includes(buildingId)) throw new GameActionError("Ce bâtiment ne se construit pas sur une colonie.");
  if (colony.building) throw new GameActionError("Une construction est déjà en cours sur cette colonie.");
  const level = colony.buildings[buildingId]?.level ?? 0;
  if (level >= colonyMaxLevel(buildingId)) throw new GameActionError(`Niveau maximum d'une colonie atteint (${colonyMaxLevel(buildingId)}).`);
  const paid = colonyUpgradeCost(player, buildingId, level + 1);
  payFrom(colony.resources, paid, "cette construction");
  colony.building = { id: buildingId, level: level + 1, endTime: now + colonyUpgradeSeconds(player, buildingId, level + 1, now) * 1000, startedAtMs: now, paid };
  return colony.building;
}

/** Place occupée et capacité du hangar de défense d'une colonie. */
export function colonyDefenseHangar(colony: Colony): { used: number; capacity: number } {
  const used = Object.entries(colony.defenses).reduce((a, [id, s]) => a + (findUnit(id)?.hangarSpace ?? 1) * s.count, 0);
  return { used, capacity: getUnitCapacity(colony.buildings, "defense") };
}

/** Durée de construction (secondes) d'un lot de défenses sur une colonie. */
export function colonyDefenseSeconds(player: Pick<PlayerState, "techLevels">, unitId: string, qty: number): number {
  const unit = findUnit(unitId);
  return unit ? getUnitBuildTime(unit, player.techLevels) * Math.max(0, qty) : 0;
}

export function buildColonyDefense(player: PlayerState, colonyIdIn: string, unitId: string, qtyIn: number, now: number): ColonyDefenseJob {
  const colony = colonyOf(player, colonyIdIn);
  if (!colony) throw new GameActionError("Colonie introuvable.");
  const unit = findUnit(unitId);
  if (!unit || unit.category !== "defense") throw new GameActionError("Seules les défenses se construisent sur une colonie.");
  if ((player.units[unitId]?.level ?? 0) <= 0) throw new GameActionError("Débloque d'abord cette défense sur ta planète mère.");
  const qty = Math.floor(Number(qtyIn));
  if (!(qty > 0)) throw new GameActionError("Quantité invalide.");
  if (colony.defenseJob) throw new GameActionError("Des défenses sont déjà en construction sur cette colonie.");
  const { used, capacity } = colonyDefenseHangar(colony);
  if (used + qty * unit.hangarSpace > capacity) throw new GameActionError("Capacité du hangar de défense de la colonie insuffisante.");
  const paid = { scrap: unit.cost.scrap * qty, energy: unit.cost.energy * qty };
  payFrom(colony.resources, paid, "ces défenses");
  colony.defenseJob = { unitId, qty, endTime: now + colonyDefenseSeconds(player, unitId, qty) * 1000, startedAtMs: now, paid };
  return colony.defenseJob;
}

export function renameColony(player: PlayerState, colonyIdIn: string, nameIn: string): void {
  const colony = colonyOf(player, colonyIdIn);
  if (!colony) throw new GameActionError("Colonie introuvable.");
  const name = String(nameIn ?? "").trim();
  if (name.length < 2 || name.length > 30) throw new GameActionError("Le nom d'une colonie fait entre 2 et 30 caractères.");
  colony.name = name;
}

/* ---------- transport (flottes de la planète mère) ---------- */

export type TransportDirection = "deliver" | "collect";

export interface TransportState {
  direction: TransportDirection;
  colonyId: string;
  /** Livraison : chargement au départ. Collecte : quantités demandées (vide = au maximum). */
  cargo: Partial<Record<ResourceId, number>>;
}

/** Montants valides d'un chargement, plafonnés à la soute. */
export function parseCargo(raw: unknown, capacity: number): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {};
  let total = 0;
  for (const r of RESOURCE_LIST) {
    const n = Math.floor(Number((raw as Record<string, unknown>)?.[r.id]));
    if (!(n > 0)) continue;
    out[r.id] = n;
    total += n;
  }
  if (total > capacity) throw new GameActionError(`La soute ne contient que ${formatInt(capacity)} ressources.`);
  return out;
}

/** Collecte à l'arrivée : prend dans le stock de la colonie, dans la limite
 *  de la soute (au prorata si rien n'est précisé). */
export function collectFromColony(colony: Colony, requested: Partial<Record<ResourceId, number>>, capacity: number): Partial<Record<ResourceId, number>> {
  const wanted: Partial<Record<ResourceId, number>> = Object.keys(requested).length
    ? requested
    : Object.fromEntries(RESOURCE_LIST.map((r) => [r.id, Math.floor(colony.resources[r.id] ?? 0)]));
  const available = Object.fromEntries(Object.entries(wanted).map(([r, n]) => [r, Math.max(0, Math.min(n ?? 0, Math.floor(colony.resources[r as ResourceId] ?? 0)))])) as Partial<Record<ResourceId, number>>;
  const total = Object.values(available).reduce((a: number, b) => a + (b ?? 0), 0);
  const ratio = total > capacity ? capacity / total : 1;
  const taken: Partial<Record<ResourceId, number>> = {};
  for (const [r, n] of Object.entries(available) as [ResourceId, number][]) {
    const k = Math.floor(n * ratio);
    if (k > 0) {
      taken[r] = k;
      colony.resources[r] -= k;
    }
  }
  return taken;
}

/** Livraison à l'arrivée : le stock de la colonie reçoit tout (comme une livraison, sans plafond). */
export function deliverToColony(colony: Colony, cargo: Partial<Record<ResourceId, number>>): void {
  for (const [r, n] of Object.entries(cargo) as [ResourceId, number][]) colony.resources[r] = (colony.resources[r] ?? 0) + (n ?? 0);
}
