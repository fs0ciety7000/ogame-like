import { BUILDINGS, effectiveBuildingLevel, getStorageCapacity } from "@/game/buildings";
import type { MissionDef } from "@/game/missions";
import { getProductionBonus, getProductionRatesPerSecond } from "@/game/production";
import { RESOURCE_LIST } from "@/game/resources";
import { findUnit } from "@/game/units";
import { eventBoundaries, productionMultipliers } from "@/game/events";
import { allianceBastionBonus, allianceProductionFactor } from "@/game/alliances";
import { ascensionProductionFactor, upkeepFreeUntil } from "@/game/ascension";
import type { Buildings, PlayerState, ResourceId, Resources, TechLevels, Units } from "@/types/game";
import { empireEffects, playerModifiers } from "@/game/modifiers";
import type { EffectScope } from "@/game/effects";
import { techBonus, techReductionFactor, TECH_REDUCTION_CAP } from "@/game/technologies";
import { catchupFactorAt, catchupUntil } from "@/game/catchup";

/* =====================================================
   Économie continue : production, plafond de l'entrepôt, entretien de
   flotte et panne d'énergie. Une seule fonction (advanceResources) sert
   au serveur (flush) et au client (compteurs en direct) : les deux
   calculent exactement la même chose.
===================================================== */

export const ECONOMY_RULES = {
  /** Énergie consommée par seconde et par place de hangar occupée. */
  upkeepPerPlaceAttack: 0.015,
  upkeepPerPlaceDefense: 0.0075,
  /** Production des autres ressources pendant une panne d'énergie. */
  outageProductionFactor: 0.5,
  /** Part de la capacité de l'entrepôt à l'abri du pillage. */
  protectedStoragePct: 0.1,
  /** Missions : ressources communes = au moins ce multiple de (durée × production). */
  missionProductionMultiplier: 1.5,
  /** Missions : ressources rares × (1 + niveaux de bâtiments cumulés / ce diviseur). */
  missionRareLevelDivisor: 35,
  /** Rares (missions, contrats, coffre) : au moins récompense × production horaire / cette référence. */
  // v5.4 : 500 000 → 150 000 (les missions rares valaient < 1 % d'une heure de production en fin de partie).
  missionRareProductionRef: 150_000,
};

export const COMMON_RESOURCES = RESOURCE_LIST.filter((r) => r.rarity === "common").map((r) => r.id) as ResourceId[];

export interface EconomyInput {
  buildings: Buildings;
  techLevels: TechLevels;
  units?: Units;
  resources: Partial<Resources>;
  /** Recherches de l'alliance du joueur (Industrie coopérative). */
  allianceResearch?: Record<string, number>;
  /** v3.4 : ascensions (bonus de production) et date de la dernière (entretien suspendu). */
  ascensions?: number;
  ascendedAtMs?: number;
  /** v3.9 : Gelée de la Reine (production boostée jusqu'à boostUntilMs). */
  bounties?: { boostUntilMs?: number } | null;
  /** v4.0 : officiers (Intendant) et reliques de production. */
  commanders?: PlayerState["commanders"];
  relics?: PlayerState["relics"];
  /** v5.1 : bonus de secteur d'alliance et talents d'Ascension. */
  territory?: PlayerState["territory"];
  talents?: PlayerState["talents"];
  /** v5.10 : multiplicateur propre à la planète (colonies : terres neuves). */
  productionFactor?: number;
  /** Colonies : multiplicateur d'entrepôt (spécialisation « Dépôt logistique »). */
  storageFactor?: number;
  /** v5.14 : portée des effets (« colonies » : Gouverneure en poste comprise). */
  effectScope?: EffectScope;
  /** 5.16 : bonus de rattrapage (bonuses.catchup). */
  bonuses?: { catchup?: { factor: number; untilMs: number; ratio: number } | null } | null;
}

/** v3.9 : bonus de production de la Gelée de la Reine (Comptoir Kesh'Vaar). */
export const KESH_BOOST_PCT = 0.2;

function boostUntil(input: EconomyInput): number {
  const v = Number(input.bounties?.boostUntilMs);
  return Number.isFinite(v) ? v : 0;
}

function boostAt(input: EconomyInput, at: number): number {
  return (at < boostUntil(input) ? 1 + KESH_BOOST_PCT : 1) * catchupFactorAt(input, at);
}

/** Capacité de l'entrepôt, Intendant en poste compris (v4.0). */
export function storageCapacityOf(input: EconomyInput): number {
  const base = getStorageCapacity(input.buildings, input.techLevels);
  const bonus = input.commanders ? playerModifiers(input, Date.now(), input.effectScope).storage : 0;
  const factor = (1 + Math.max(0, bonus)) * (input.storageFactor ?? 1);
  return factor !== 1 && Number.isFinite(base) ? Math.floor(base * factor) : base;
}

/** Énergie consommée par seconde par les unités construites. */
export function getFleetUpkeep(units: Units | undefined, techLevels?: TechLevels): number {
  let upkeep = 0;
  for (const [id, state] of Object.entries(units ?? {})) {
    const def = findUnit(id);
    if (!def || !state?.count) continue;
    const perPlace = def.category === "attack" ? ECONOMY_RULES.upkeepPerPlaceAttack : ECONOMY_RULES.upkeepPerPlaceDefense;
    upkeep += state.count * def.hangarSpace * perPlace;
  }
  return upkeep * techReductionFactor(techLevels, "fleet_upkeep");
}

export interface EconomySnapshot {
  /** Production brute par seconde (bâtiments + technologies). */
  gross: Partial<Resources>;
  /** Consommation d'énergie de la flotte, par seconde. */
  upkeep: number;
  /** Variation nette par seconde en ce moment (entrepôt plein = 0, panne prise en compte). */
  net: Partial<Resources>;
  capacity: number;
  /** Énergie épuisée : les autres productions tournent au ralenti. */
  outage: boolean;
  /** Ressources communes dont l'entrepôt est plein. */
  full: ResourceId[];
}

/** Production brute, avec les bonus d'événement donnés. */
function boostedRates(input: EconomyInput, multipliers: Partial<Record<string, number>>, boost = 1): Partial<Resources> {
  const gross = getProductionRatesPerSecond(input.buildings, input.techLevels);
  const alliance = allianceProductionFactor(input.allianceResearch) * ascensionProductionFactor(input) * boost * (input.productionFactor ?? 1);
  if (alliance !== 1) for (const res of Object.keys(gross) as ResourceId[]) gross[res] = (gross[res] ?? 0) * alliance;
  // v4.0 : Intendant en poste et reliques ; v5.2 : aussi secteur d'alliance et talents
  // (auparavant ignorés sans officier ni relique). v5.14 : portée des colonies comprise.
  const mods = playerModifiers(input, Date.now(), input.effectScope);
  for (const res of Object.keys(gross) as ResourceId[]) {
    const f = 1 + mods.productionAll + (mods.production[res] ?? 0);
    if (f !== 1) gross[res] = (gross[res] ?? 0) * f;
  }
  for (const [res, m] of Object.entries(multipliers)) {
    if (gross[res as ResourceId] && m) gross[res as ResourceId] = (gross[res as ResourceId] ?? 0) * m;
  }
  return gross;
}

/** `now` : applique les bonus de l'événement en cours à cet instant. */
export function economySnapshot(input: EconomyInput, now?: number): EconomySnapshot {
  const gross = boostedRates(input, now === undefined ? {} : productionMultipliers(now), now === undefined ? 1 : boostAt(input, now));
  const upkeep = now !== undefined && now < upkeepFreeUntil(input) ? 0 : getFleetUpkeep(input.units, input.techLevels);
  const capacity = storageCapacityOf(input);
  const energyNet = (gross.energy ?? 0) - upkeep;
  const outage = energyNet < 0 && (input.resources.energy ?? 0) <= 0;
  const factor = outage ? ECONOMY_RULES.outageProductionFactor : 1;
  const net: Partial<Resources> = {};
  const full: ResourceId[] = [];
  for (const r of RESOURCE_LIST) {
    const stock = input.resources[r.id] ?? 0;
    const isCommon = r.rarity === "common";
    const atCap = isCommon && stock >= capacity;
    if (r.id === "energy") {
      net.energy = outage ? 0 : atCap && energyNet > 0 ? 0 : energyNet;
    } else {
      net[r.id] = atCap ? 0 : (gross[r.id] ?? 0) * factor;
    }
    if (atCap) full.push(r.id);
  }
  return { gross, upkeep, net, capacity, outage, full };
}

function addCapped(stock: number, gain: number, cap: number): number {
  if (gain <= 0) return Math.max(0, stock + gain);
  if (stock >= cap) return stock; // déjà au-delà : conservé, mais plus de production
  return Math.min(cap, stock + gain);
}

/** Ressources après `elapsedSeconds` de production continue. */
export function advanceResources(input: EconomyInput, elapsedSeconds: number, startMs?: number): Resources {
  // Avec `startMs`, les bonus d'événements s'appliquent sur leur seule durée.
  if (startMs === undefined || elapsedSeconds <= 0) return advanceSegment(input, elapsedSeconds, {});
  const endMs = startMs + elapsedSeconds * 1000;
  let resources = input.resources;
  let at = startMs;
  // v3.4 : l'entretien de flotte reprend à la fin de la suspension d'ascension.
  const freeUntil = upkeepFreeUntil(input);
  const boostEnd = boostUntil(input);
  const catchupEnd = catchupUntil(input);
  const cuts = [
    ...(catchupEnd > startMs && catchupEnd < endMs ? [catchupEnd] : []),
    ...eventBoundaries(startMs, endMs),
    ...(freeUntil > startMs && freeUntil < endMs ? [freeUntil] : []),
    ...(boostEnd > startMs && boostEnd < endMs ? [boostEnd] : []),
    endMs,
  ].sort((a, b) => a - b);
  for (const cut of cuts) {
    if (cut <= at) continue;
    resources = advanceSegment({ ...input, resources }, (cut - at) / 1000, productionMultipliers(at), at < freeUntil, boostAt(input, at));
    at = cut;
  }
  return resources as Resources;
}

function advanceSegment(input: EconomyInput, elapsedSeconds: number, multipliers: Partial<Record<string, number>>, upkeepFree = false, boost = 1): Resources {
  const out = { ...input.resources } as Resources;
  if (elapsedSeconds <= 0) return out;

  const gross = boostedRates(input, multipliers, boost);
  const upkeep = upkeepFree ? 0 : getFleetUpkeep(input.units, input.techLevels);
  const capacity = storageCapacityOf(input);
  const capOf = (res: ResourceId) => (COMMON_RESOURCES.includes(res) ? capacity : Infinity);

  // Énergie : production moins entretien. Si elle baisse, on calcule
  // l'instant où le stock tombe à zéro : au-delà, c'est la panne.
  const energyNet = (gross.energy ?? 0) - upkeep;
  const energyStock = out.energy ?? 0;
  let normalSeconds = elapsedSeconds;
  if (energyNet < 0) normalSeconds = Math.min(elapsedSeconds, Math.max(0, energyStock) / -energyNet);
  const outageSeconds = elapsedSeconds - normalSeconds;

  out.energy = addCapped(energyStock, energyNet * normalSeconds, capOf("energy"));
  if (outageSeconds > 0) out.energy = 0;

  for (const r of RESOURCE_LIST) {
    if (r.id === "energy") continue;
    const rate = gross[r.id] ?? 0;
    if (!rate) continue;
    const gain = rate * normalSeconds + rate * ECONOMY_RULES.outageProductionFactor * outageSeconds;
    out[r.id] = addCapped(out[r.id] ?? 0, gain, capOf(r.id));
  }
  return out;
}

/** Quantité d'une ressource à l'abri du pillage (bunker de l'entrepôt). */
export function protectedAmount(buildings: Buildings, res: ResourceId, techLevels?: TechLevels, allianceLevels?: Record<string, number>, player?: Parameters<typeof playerModifiers>[0]): number {
  if (!COMMON_RESOURCES.includes(res)) return 0;
  const capacity = getStorageCapacity(buildings, techLevels);
  // v3.3 : le Bastion fédéral s'ajoute (et repousse le plafond d'autant).
  // v5.14 : la Gardienne en poste aussi (couche empire, plafonnée à part).
  const bastion = allianceBastionBonus(allianceLevels) + (player ? playerModifiers(player).protectedStorage : 0);
  const pct = Math.min(TECH_REDUCTION_CAP + bastion, ECONOMY_RULES.protectedStoragePct + techBonus(techLevels, "protected_storage") + bastion);
  return Number.isFinite(capacity) ? Math.floor(capacity * pct) : 0;
}

/** Facteur des ressources rares : le plus grand entre le développement
 *  (niveaux de bâtiments cumulés) et la production horaire moyenne d'une
 *  ressource commune rapportée à la référence (v3.2.3). */
export function rareRewardScale(player: { buildings: Buildings; techLevels?: TechLevels }): number {
  const levels = BUILDINGS.reduce((sum, b) => sum + effectiveBuildingLevel(player.buildings, b.id), 0);
  const development = 1 + levels / Math.max(1, ECONOMY_RULES.missionRareLevelDivisor);
  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels ?? {});
  const perHour = (COMMON_RESOURCES.reduce((a, r) => a + (rates[r] ?? 0), 0) / Math.max(1, COMMON_RESOURCES.length)) * 3600;
  const ref = ECONOMY_RULES.missionRareProductionRef;
  const production = ref > 0 ? perHour / ref : 0;
  return Math.max(development, production);
}

/** Récompenses réelles d'une mission pour ce joueur : les ressources
 *  communes valent au moins 1,5 × la durée en production, les rares
 *  suivent le développement ou la production de l'empire. */
export function missionRewards(mission: MissionDef, player: { buildings: Buildings; techLevels: TechLevels }): Record<string, number> {
  const rates = getProductionRatesPerSecond(player.buildings, player.techLevels);
  const rareScale = rareRewardScale(player);
  const out: Record<string, number> = {};
  for (const [res, fixed] of Object.entries(mission.reward)) {
    if (res === "xp") out.xp = fixed;
    else if (COMMON_RESOURCES.includes(res as ResourceId)) {
      const indexed = Math.floor(ECONOMY_RULES.missionProductionMultiplier * mission.duration * (rates[res as ResourceId] ?? 0));
      out[res] = Math.max(fixed, indexed);
    } else out[res] = Math.floor(fixed * rareScale);
  }
  return out;
}

/** v5.2 : bonus de production actifs d'une ressource, pour l'affichage (0,1 = +10 %). */
export function productionBonuses(input: EconomyInput, now: number, res: ResourceId): { label: string; pct: number }[] {
  const out: { label: string; pct: number }[] = [];
  const tech = getProductionBonus(input.techLevels) + techBonus(input.techLevels, "resource_production", res);
  if (tech > 0) out.push({ label: "Technologies", pct: tech });
  const alliance = allianceProductionFactor(input.allianceResearch) - 1;
  if (alliance > 0) out.push({ label: "Recherche d'alliance", pct: alliance });
  const asc = ascensionProductionFactor(input) - 1;
  if (asc > 0) out.push({ label: "Ascensions", pct: asc });
  // v5.14 : lu dans le circuit d'effets, regroupé par famille de source.
  const bySource: Record<string, number> = {};
  for (const g of empireEffects(input, now)) {
    if (g.stat !== "productionAll" && !(g.stat === "production" && g.target === res)) continue;
    if (g.scope && g.scope !== "all" && g.scope !== input.effectScope) continue;
    const label = g.source.kind === "officer" ? "Officiers" : g.source.kind === "territory" ? "Secteurs d'alliance" : "Reliques et talents";
    bySource[label] = (bySource[label] ?? 0) + g.value;
  }
  for (const label of ["Officiers", "Secteurs d'alliance", "Reliques et talents"]) if ((bySource[label] ?? 0) > 0.0001) out.push({ label, pct: bySource[label] });
  if (now < boostUntil(input)) out.push({ label: "Gelée de la Reine", pct: KESH_BOOST_PCT });
  const catchup = catchupFactorAt(input, now);
  if (catchup > 1) out.push({ label: "Rattrapage", pct: catchup - 1 });
  const ev = productionMultipliers(now)[res];
  if (ev && ev !== 1) out.push({ label: "Événement en cours", pct: ev - 1 });
  return out;
}
