import { allianceProductionFactor } from "@/game/alliances";
import { ascensionProductionFactor } from "@/game/ascension";
import { playerBuildTimeFactor } from "@/game/bonuses";
import { COMMANDER_XP, grantCommanderXp } from "@/game/commanders";
import { applyBuildingDiscount, BUILDINGS, findBuilding, getBuildingUpgradeCost, getBuildingUpgradeTime, getUnitCapacity, PRODUCTION_RESOURCE_BY_BUILDING } from "@/game/buildings";
import { advanceResources, COMMON_RESOURCES, storageCapacityOf } from "@/game/economy";
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
  /** Stock de départ de chaque ressource commune (v5.10 : 1 M → 5 M). */
  startStock: 5_000_000,
  /** v5.10 : 15 → 18. */
  maxLevel: 18,
  /** Coût des bâtiments d'une colonie : × ce facteur par rapport à la planète mère (v5.10 : 1,5 → 1). */
  costFactor: 1,
  /** v5.10 : terres neuves — production des colonies × (1 + bonus). */
  productionBonus: 0.5,
  /** v5.10 : à la fondation, chaque extracteur et l'entrepôt démarrent à cette part du niveau de la planète mère… */
  foundationShare: 0.5,
  /** …sans dépasser ce niveau. */
  foundationMax: 8,
};

/** Bâtiments relevés à la fondation (extracteurs communs et entrepôt). */
function foundationBuildingIds(): string[] {
  return colonyBuildingIds().filter((id) => {
    const res = PRODUCTION_RESOURCE_BY_BUILDING[id];
    return (res && COMMON_RESOURCES.includes(res as ResourceId)) || findBuilding(id)?.effect?.type === "storage";
  });
}

/** v5.10 : niveau de départ d'un bâtiment de colonie selon la planète mère. */
export function foundationLevel(homeLevel: number): number {
  return Math.max(1, Math.min(COLONY_RULES.foundationMax, Math.floor((homeLevel || 0) * COLONY_RULES.foundationShare)));
}

/** v5.10 : relève les extracteurs et l'entrepôt d'une colonie au niveau de fondation (jamais à la baisse). */
export function applyFoundation(colony: Colony, home: Buildings | undefined): void {
  for (const id of foundationBuildingIds()) {
    const target = foundationLevel(home?.[id]?.level ?? 0);
    const cur = colony.buildings[id]?.level ?? 1;
    if (target > cur) colony.buildings[id] = { ...(colony.buildings[id] ?? { unlocked: true }), level: target, unlocked: true };
  }
  colony.foundation = 1;
}

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
  /** v5.1 : biome tiré à la fondation (ressource rare du gisement). */
  biome?: RareResourceId;
  /** v5.10 : niveaux de fondation appliqués (colonies plus anciennes : relevées une fois). */
  foundation?: number;
}

export interface Colonizing {
  slot: number;
  name: string;
  endTime: number;
}

const HOUR = 3600_000;

/* ---------- v5.1 : biomes et gisements de ressource rare ---------- */

export type RareResourceId = "reinforcedSteel" | "cyberModule" | "syntheticNanites" | "aiFragment";

/** Bâtiment propre aux colonies : extrait la ressource rare du biome. */
export const DEPOSIT_ID = "gisement";

export const BIOMES: Record<RareResourceId, { name: string; deposit: string; lore: string; tone: string }> = {
  reinforcedSteel: { name: "Monde ferreux", deposit: "Mine d'acier profond", lore: "Un noyau saturé de métal : l'acier renforcé affleure presque à la surface.", tone: "#9fb4c8" },
  cyberModule: { name: "Cimetière d'épaves", deposit: "Atelier de récupération", lore: "Des flottes entières s'y sont écrasées ; leurs modules dorment sous la poussière.", tone: "#5de0ff" },
  syntheticNanites: { name: "Marais de nanites", deposit: "Ruche de nanites", lore: "Une brume grise vivante, que l'on récolte comme du miel.", tone: "#7cf0b0" },
  aiFragment: { name: "Nécropole d'IA", deposit: "Excavation de noyaux", lore: "Les ruines d'une civilisation de machines, aux mémoires encore chaudes.", tone: "#c792ff" },
};

export const RARE_DEPOSITS = Object.keys(BIOMES) as RareResourceId[];

export const DEPOSIT_RULES = {
  /** Production par seconde, niveaux 1 à 15. */
  perSecond: [0.1, 0.15, 0.2, 0.3, 0.4, 0.5, 0.7, 0.9, 1.1, 1.3, 1.5, 1.8, 2.1, 2.4, 3],
  /** Coût : celui d'un extracteur de colonie × ce facteur (plus nanocomposants et données). */
  costFactor: 1.2,
  /** Durée : celle d'un extracteur de colonie × ce facteur. */
  timeFactor: 1.5,
};

function hashString(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Biome tiré au hasard (déterministe : même résultat côté serveur et navigateur). */
export function biomeFor(seed: string): RareResourceId {
  return RARE_DEPOSITS[hashString(seed) % RARE_DEPOSITS.length];
}

/** Biome d'une colonie (les colonies fondées avant la v5.1 en reçoivent un aussi). */
export function colonyBiome(colony: Pick<Colony, "id" | "foundedAtMs" | "biome">): RareResourceId {
  return colony.biome && BIOMES[colony.biome] ? colony.biome : biomeFor(`${colony.id}:${colony.foundedAtMs}`);
}

export function depositLevel(colony: Pick<Colony, "buildings">): number {
  return colony.buildings[DEPOSIT_ID]?.level ?? 1;
}

export function depositPerSecond(level: number): number {
  if (level <= 0) return 0;
  return DEPOSIT_RULES.perSecond[Math.min(level, DEPOSIT_RULES.perSecond.length) - 1];
}

/** Nom d'un bâtiment de colonie (le gisement dépend du biome). */
export function colonyBuildingName(colony: Pick<Colony, "id" | "foundedAtMs" | "biome">, id: string): string {
  return id === DEPOSIT_ID ? BIOMES[colonyBiome(colony)].deposit : (findBuilding(id)?.name ?? id);
}

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

export function foundColony(uid: string, job: Colonizing, at: number, home?: Buildings): Colony {
  const buildings: Buildings = {};
  for (const id of colonyBuildingIds()) buildings[id] = { level: 1, unlocked: true };
  const resources = emptyResources();
  for (const res of COMMON_RESOURCES) resources[res] = COLONY_RULES.startStock;
  buildings[DEPOSIT_ID] = { level: 1, unlocked: true };
  const id = colonyId(uid, job.slot);
  const colony: Colony = { id, slot: job.slot, name: job.name, foundedAtMs: at, buildings, resources, updatedAtMs: at, building: null, defenses: {}, defenseJob: null, biome: biomeFor(`${id}:${at}`) };
  applyFoundation(colony, home);
  return colony;
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
    productionFactor: 1 + COLONY_RULES.productionBonus,
    // v5.3 : bonus de l'empire (Intendant, reliques, talents, secteurs, Gelée de la Reine).
    commanders: player.commanders,
    relics: player.relics,
    talents: player.talents,
    territory: player.territory,
    bounties: player.bounties,
  };
}

/** Entrepôt de la colonie (v5.3 : Intendant en poste compris, comme pour la production). */
export function colonyStorage(colony: Colony, player: Pick<PlayerState, "techLevels" | "commanders">): number {
  return storageCapacityOf({ buildings: colony.buildings, techLevels: player.techLevels, resources: colony.resources, commanders: player.commanders });
}

/** Production horaire d'une colonie (affichage). */
export function colonyHourlyRates(colony: Colony, player: PlayerState): Partial<Record<ResourceId, number>> {
  const a = advanceResources({ ...economyInput(colony, player), resources: emptyResources() }, 3600);
  const out: Partial<Record<ResourceId, number>> = Object.fromEntries(COMMON_RESOURCES.map((r) => [r, Math.round(a[r] ?? 0)]));
  out[colonyBiome(colony)] = Math.round(depositPerSecond(depositLevel(colony)) * 3600);
  return out;
}

/** Rattrape une colonie jusqu'à `now` : production, construction, défenses. */
export function advanceColony(colony: Colony, player: PlayerState, now: number): NewNotification[] {
  const notes: NewNotification[] = [];
  // v5.10 : colonies fondées avant le rééquilibrage — production rattrapée à l'ancien
  // niveau jusqu'ici, puis extracteurs et entrepôt relevés au niveau de fondation.
  const upgradeOld = !colony.foundation;
  let at = colony.updatedAtMs || now;
  for (let guard = 0; guard < 10; guard++) {
    const next = Math.min(colony.building?.endTime ?? Infinity, colony.defenseJob?.endTime ?? Infinity);
    const until = Math.min(next, now);
    if (until > at) {
      colony.resources = advanceResources(economyInput(colony, player), (until - at) / 1000, at);
      // v5.1 : gisement du biome (ressource rare, non plafonnée).
      const rare = colonyBiome(colony);
      colony.resources[rare] = (colony.resources[rare] ?? 0) + depositPerSecond(depositLevel(colony)) * ((until - at) / 1000);
      at = until;
    }
    if (next > now) break;
    if (colony.building && colony.building.endTime <= now) {
      const job = colony.building;
      // v5.10 : jamais à la baisse (un chantier lancé avant la fondation relevée).
      colony.buildings[job.id] = { ...(colony.buildings[job.id] ?? { unlocked: true }), level: Math.max(job.level, colony.buildings[job.id]?.level ?? 0) };
      colony.building = null;
      // v5.6 : l'Ingénieure en poste progresse aussi avec les chantiers des colonies.
      grantCommanderXp(player, "engineer", COMMANDER_XP.buildingDone);
      notes.push({ kind: "building", title: "Colonie : construction terminée", message: `${colony.name} : ${colonyBuildingName(colony, job.id)} niveau ${job.level}.`, createdAtMs: now, read: false });
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
  if (upgradeOld) {
    applyFoundation(colony, player.buildings);
    notes.push({ kind: "building", title: "Colonie modernisée", message: `${colony.name} : ses extracteurs et son entrepôt ont été relevés au niveau de fondation, et les colonies produisent désormais 50 % de plus.`, createdAtMs: now, read: false, link: "/game/colonies" });
  }
  return notes;
}

/** Rattrape la colonisation en cours et toutes les colonies. */
export function advanceColonies(player: PlayerState, now: number): NewNotification[] {
  const notes: NewNotification[] = [];
  if (player.colonizing && player.colonizing.endTime <= now) {
    const job = player.colonizing;
    player.colonies = [...(player.colonies ?? []), foundColony(player.uid, job, job.endTime, player.buildings)];
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
  if (buildingId === DEPOSIT_ID) {
    // v5.1 : gisement, payé en ressources communes seulement.
    const base = colonyUpgradeCost(player, "extracteur_ferraille", nextLevel);
    const scrap = Math.ceil((base.scrap ?? 0) * DEPOSIT_RULES.costFactor);
    return { scrap, energy: Math.ceil((base.energy ?? 0) * DEPOSIT_RULES.costFactor), nano: Math.ceil(scrap / 2), data: Math.ceil(scrap / 4) };
  }
  const def = findBuilding(buildingId);
  if (!def) return {};
  const base = applyBuildingDiscount(getBuildingUpgradeCost(def, nextLevel), player.bonuses?.buildingUpgradeDiscount ?? 0);
  return Object.fromEntries(Object.entries(base).map(([r, n]) => [r, Math.ceil((n ?? 0) * COLONY_RULES.costFactor)]));
}

export function colonyUpgradeSeconds(player: PlayerState, buildingId: string, nextLevel: number, now: number): number {
  if (buildingId === DEPOSIT_ID) return Math.round(colonyUpgradeSeconds(player, "extracteur_ferraille", nextLevel, now) * DEPOSIT_RULES.timeFactor);
  const def = findBuilding(buildingId);
  return def ? Math.round(getBuildingUpgradeTime(def, nextLevel) * playerBuildTimeFactor(player, now)) : 0;
}

export function upgradeColonyBuilding(player: PlayerState, colonyIdIn: string, buildingId: string, now: number): ColonyBuildingJob {
  const colony = colonyOf(player, colonyIdIn);
  if (!colony) throw new GameActionError("Colonie introuvable.");
  if (buildingId !== DEPOSIT_ID && !colonyBuildingIds().includes(buildingId)) throw new GameActionError("Ce bâtiment ne se construit pas sur une colonie.");
  if (colony.building) throw new GameActionError("Une construction est déjà en cours sur cette colonie.");
  const level = buildingId === DEPOSIT_ID ? depositLevel(colony) : (colony.buildings[buildingId]?.level ?? 0);
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
  /** v5.1 : contrat entre joueurs livré par cette flotte. */
  contractId?: string;
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
