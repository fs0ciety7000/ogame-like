import { defaultWarlordsConfig, setWarlords, validateWarlords, type WarlordsConfig } from "@/game/warlords";
import { DEFAULT_BUILDINGS, setBuildings, withFixedBuildings, type BuildingDef } from "@/game/buildings";
import { DEFAULT_UNITS, KESH_HUNTER_UNIT, setUnits, UNIT_TO_TECH, type UnitDef } from "@/game/units";
import { DEFAULT_TECHNOLOGIES, setTechnologies, TECH_EFFECT_LABELS, techEffects, validateTechEffect, type TechDef } from "@/game/technologies";
import { DEFAULT_MISSIONS, setMissions, type MissionDef } from "@/game/missions";
import { PVP_RULES } from "@/game/pvp";
import { COMBAT_RULES } from "@/game/combat";
import { ECONOMY_RULES } from "@/game/economy";
import { FLEET_RULES, PATROL_RULES } from "@/game/fleets";
import { SPY_RULES } from "@/game/espionage";
import { DEBRIS_RULES } from "@/game/debris";
import { EVENT_RULES } from "@/game/events";
import { SEASON_RULES } from "@/game/seasons";
import { ALLIANCE_RULES } from "@/game/alliances";
import { MARKET_RULES } from "@/game/market";
import { EXPEDITION_RULES } from "@/game/expeditions";
import { LEVIATHAN_RULES } from "@/game/leviathan";
import { WAR_RULES } from "@/game/wars";
import { DEFAULT_FACTIONS, PIRATE_RULES, setFactions, validateFactions, type FactionDef } from "@/game/pirates";
import { RESOURCE_LIST } from "@/game/resources";
import { DEFAULT_RANKS, setRanks, validateRanks, type RankDef } from "@/game/ranks";
import { DEFAULT_ACHIEVEMENTS, setAchievements, validateAchievements, type AchievementDef } from "@/game/achievements";

/* =====================================================
   Contenu du jeu piloté par les données.

   Le contenu par défaut est défini dans le code (buildings.ts, units.ts,
   technologies.ts, missions.ts…). L'interface d'administration peut en
   enregistrer une version modifiée dans la collection PocketBase
   `game_config` (un enregistrement par section). applyGameContent est
   appelé au démarrage du client ET par le serveur (pb_hooks) avant chaque
   action arbitrée : les deux voient toujours les mêmes règles.
===================================================== */

export interface GameRules {
  pvp: typeof PVP_RULES;
  combat: typeof COMBAT_RULES;
  economy: typeof ECONOMY_RULES;
  fleets: typeof FLEET_RULES;
  spy: typeof SPY_RULES;
  debris: typeof DEBRIS_RULES;
  patrol: typeof PATROL_RULES;
  events: typeof EVENT_RULES;
  seasons: typeof SEASON_RULES;
  alliances: typeof ALLIANCE_RULES;
  pirates: typeof PIRATE_RULES;
  market: typeof MARKET_RULES;
  expeditions: typeof EXPEDITION_RULES;
  leviathan: typeof LEVIATHAN_RULES;
  wars: typeof WAR_RULES;
}

export interface GameContent {
  buildings: BuildingDef[];
  units: UnitDef[];
  technologies: TechDef[];
  missions: MissionDef[];
  factions: FactionDef[];
  ranks: RankDef[];
  achievements: AchievementDef[];
  rules: GameRules;
  /** v4.2 : seigneurs de guerre (réglages et fiches). */
  warlords: WarlordsConfig;
}

export type ContentSection = keyof GameContent;
export const CONTENT_SECTIONS: ContentSection[] = ["buildings", "units", "technologies", "missions", "factions", "ranks", "achievements", "rules", "warlords"];

/** v3.9 : le Traqueur Kesh existe toujours (plan du Comptoir), même si la
 *  liste des unités a été personnalisée avant son arrivée. */
function withFixedUnits(units: UnitDef[]): UnitDef[] {
  return units.some((u) => u.id === KESH_HUNTER_UNIT.id) ? units : [...units, KESH_HUNTER_UNIT];
}

const DEFAULT_PVP_RULES = { ...PVP_RULES };
const DEFAULT_COMBAT_RULES = { ...COMBAT_RULES };
const DEFAULT_ECONOMY_RULES = { ...ECONOMY_RULES };
const DEFAULT_FLEET_RULES = { ...FLEET_RULES };
const DEFAULT_SPY_RULES = { ...SPY_RULES };
const DEFAULT_DEBRIS_RULES = { ...DEBRIS_RULES };
const DEFAULT_PATROL_RULES = { ...PATROL_RULES };
const DEFAULT_EVENT_RULES = structuredClone(EVENT_RULES);
const DEFAULT_SEASON_RULES = structuredClone(SEASON_RULES);
const DEFAULT_ALLIANCE_RULES = structuredClone(ALLIANCE_RULES);
const DEFAULT_PIRATE_RULES = { ...PIRATE_RULES };
const DEFAULT_MARKET_RULES = { ...MARKET_RULES };
const DEFAULT_EXPEDITION_RULES = structuredClone(EXPEDITION_RULES);
const DEFAULT_LEVIATHAN_RULES = { ...LEVIATHAN_RULES };
const DEFAULT_WAR_RULES = { ...WAR_RULES };

/** Copie profonde du contenu par défaut (celui du code). */
export function defaultGameContent(): GameContent {
  return structuredClone({
    buildings: DEFAULT_BUILDINGS,
    units: DEFAULT_UNITS,
    technologies: DEFAULT_TECHNOLOGIES,
    missions: Object.values(DEFAULT_MISSIONS),
    factions: DEFAULT_FACTIONS,
    ranks: DEFAULT_RANKS,
    achievements: DEFAULT_ACHIEVEMENTS,
    warlords: defaultWarlordsConfig(),
    rules: { pvp: DEFAULT_PVP_RULES, combat: DEFAULT_COMBAT_RULES, economy: DEFAULT_ECONOMY_RULES, fleets: DEFAULT_FLEET_RULES, spy: DEFAULT_SPY_RULES, debris: DEFAULT_DEBRIS_RULES, patrol: DEFAULT_PATROL_RULES, events: DEFAULT_EVENT_RULES, seasons: DEFAULT_SEASON_RULES, alliances: DEFAULT_ALLIANCE_RULES, pirates: DEFAULT_PIRATE_RULES, market: DEFAULT_MARKET_RULES, expeditions: DEFAULT_EXPEDITION_RULES, leviathan: DEFAULT_LEVIATHAN_RULES, wars: DEFAULT_WAR_RULES },
  });
}

let current: GameContent = defaultGameContent();

/** Contenu actuellement appliqué (copie). */
export function currentGameContent(): GameContent {
  return structuredClone(current);
}

/** Applique un contenu (sections absentes = valeurs par défaut du code). */
export function applyGameContent(overrides: Partial<GameContent>): GameContent {
  const defaults = defaultGameContent();
  const content: GameContent = {
    buildings: withFixedBuildings(overrides.buildings ?? defaults.buildings),
    units: withFixedUnits(overrides.units ?? defaults.units),
    technologies: overrides.technologies ?? defaults.technologies,
    missions: overrides.missions ?? defaults.missions,
    factions: overrides.factions ?? defaults.factions,
    ranks: overrides.ranks ?? defaults.ranks,
    achievements: overrides.achievements ?? defaults.achievements,
    warlords: overrides.warlords ?? defaults.warlords,
    rules: {
      pvp: { ...defaults.rules.pvp, ...(overrides.rules?.pvp ?? {}) },
      combat: { ...defaults.rules.combat, ...(overrides.rules?.combat ?? {}) },
      economy: { ...defaults.rules.economy, ...(overrides.rules?.economy ?? {}) },
      fleets: { ...defaults.rules.fleets, ...(overrides.rules?.fleets ?? {}) },
      spy: { ...defaults.rules.spy, ...(overrides.rules?.spy ?? {}) },
      debris: { ...defaults.rules.debris, ...(overrides.rules?.debris ?? {}) },
      patrol: { ...defaults.rules.patrol, ...(overrides.rules?.patrol ?? {}) },
      events: { ...defaults.rules.events, ...(overrides.rules?.events ?? {}) },
      seasons: { ...defaults.rules.seasons, ...(overrides.rules?.seasons ?? {}) },
      alliances: { ...defaults.rules.alliances, ...(overrides.rules?.alliances ?? {}) },
      pirates: { ...defaults.rules.pirates, ...(overrides.rules?.pirates ?? {}) },
      market: { ...defaults.rules.market, ...(overrides.rules?.market ?? {}) },
      expeditions: {
        ...defaults.rules.expeditions,
        ...(overrides.rules?.expeditions ?? {}),
        weights: { ...defaults.rules.expeditions.weights, ...(overrides.rules?.expeditions?.weights ?? {}) },
      },
      leviathan: { ...defaults.rules.leviathan, ...(overrides.rules?.leviathan ?? {}) },
      wars: { ...defaults.rules.wars, ...(overrides.rules?.wars ?? {}) },
    },
  };
  setBuildings(content.buildings);
  setUnits(content.units);
  setTechnologies(content.technologies);
  // Une techno peut désigner elle-même l'unité qu'elle débloque (v2.6).
  for (const t of content.technologies) for (const e of techEffects(t)) if (e.type === "unlock_next_level" && e.target) UNIT_TO_TECH[e.target] = t.id;
  setMissions(content.missions);
  setFactions(content.factions);
  setRanks(content.ranks);
  setAchievements(content.achievements);
  setWarlords(content.warlords);
  Object.assign(PVP_RULES, content.rules.pvp);
  Object.assign(COMBAT_RULES, content.rules.combat);
  Object.assign(ECONOMY_RULES, content.rules.economy);
  Object.assign(FLEET_RULES, content.rules.fleets);
  Object.assign(SPY_RULES, content.rules.spy);
  Object.assign(DEBRIS_RULES, content.rules.debris);
  Object.assign(PATROL_RULES, content.rules.patrol);
  Object.assign(EVENT_RULES, content.rules.events);
  Object.assign(SEASON_RULES, content.rules.seasons);
  Object.assign(ALLIANCE_RULES, content.rules.alliances);
  Object.assign(PIRATE_RULES, content.rules.pirates);
  Object.assign(MARKET_RULES, content.rules.market);
  Object.assign(EXPEDITION_RULES, content.rules.expeditions);
  Object.assign(LEVIATHAN_RULES, content.rules.leviathan);
  Object.assign(WAR_RULES, content.rules.wars);
  current = content;
  return content;
}

/* ---------- validation (interface d'administration) ---------- */

const ID_PATTERN = /^[A-Za-z0-9_]+$/;

/** Liste des erreurs bloquantes : identifiants en double, références vers
 *  un élément inexistant, valeurs impossibles. Vide = contenu valide. */
export function validateGameContent(content: GameContent): string[] {
  const errors: string[] = [];
  const resources = new Set(RESOURCE_LIST.map((r) => r.id as string));
  const techIds = new Set(content.technologies.map((t) => t.id));
  const unitIds = new Set(content.units.map((u) => u.id));

  const checkIds = (label: string, ids: string[]) => {
    const seen = new Set<string>();
    for (const id of ids) {
      if (!id || !ID_PATTERN.test(id)) errors.push(`${label} : identifiant « ${id} » invalide (lettres, chiffres, _).`);
      if (seen.has(id)) errors.push(`${label} : identifiant « ${id} » en double.`);
      seen.add(id);
    }
  };
  const checkResources = (label: string, map: Record<string, number> | undefined) => {
    for (const [res, v] of Object.entries(map ?? {})) {
      if (!resources.has(res)) errors.push(`${label} : ressource inconnue « ${res} ».`);
      if (typeof v !== "number" || !Number.isFinite(v) || v < 0) errors.push(`${label} : valeur invalide pour ${res}.`);
    }
  };

  checkIds("Bâtiments", content.buildings.map((b) => b.id));
  for (const b of content.buildings) {
    const label = `Bâtiment ${b.name || b.id}`;
    if (!(b.maxLevel >= 1)) errors.push(`${label} : niveau max doit être ≥ 1.`);
    checkResources(`${label} (déblocage)`, b.unlockCost);
    checkResources(`${label} (coût initial)`, b.upgrade?.baseCost);
    checkResources(`${label} (coût max)`, b.upgrade?.maxCost);
    if (b.unlockedByTech && !techIds.has(b.unlockedByTech)) errors.push(`${label} : techno « ${b.unlockedByTech} » inexistante.`);
    if (b.production && !resources.has(b.production.resource)) errors.push(`${label} : ressource produite inconnue.`);
    if (b.production && b.production.perSecond.length === 0) errors.push(`${label} : table de production vide.`);
    const t2 = b.upgrade?.tier2;
    if (t2) {
      if (!(t2.fromLevel >= 2 && t2.fromLevel <= b.maxLevel)) errors.push(`${label} : le second palier doit commencer entre le niveau 2 et le niveau max.`);
      checkResources(`${label} (second palier, coût initial)`, t2.baseCost);
      checkResources(`${label} (second palier, coût max)`, t2.maxCost);
      if (!(t2.baseSeconds >= 0 && t2.secondsPerLevel >= 0)) errors.push(`${label} : durées du second palier invalides.`);
    }
    if (b.effect?.type === "storage" && !(b.effect.base > 0 && b.effect.growth >= 1)) errors.push(`${label} : capacité d'entrepôt invalide.`);
  }
  if (!content.buildings.some((b) => b.startsUnlocked)) errors.push("Au moins un bâtiment doit être débloqué dès le départ.");

  checkIds("Unités", content.units.map((u) => u.id));
  for (const u of content.units) {
    const label = `Unité ${u.name || u.id}`;
    if (!u.blueprint && !techIds.has(u.unlockTech)) errors.push(`${label} : techno de déblocage « ${u.unlockTech} » inexistante.`);
    if (u.category !== "attack" && u.category !== "defense") errors.push(`${label} : catégorie invalide.`);
    if (!(u.hangarSpace >= 1)) errors.push(`${label} : places de hangar doit être ≥ 1.`);
    if (u.levelBonus !== undefined && !(u.levelBonus >= 0)) errors.push(`${label} : gain par niveau invalide.`);
    checkResources(`${label} (coût)`, u.cost as Record<string, number>);
  }

  checkIds("Technologies", content.technologies.map((t) => t.id));
  for (const t of content.technologies) {
    const label = `Techno ${t.nom || t.id}`;
    if (t.effects && t.effects.length > 0) {
      for (const e of t.effects) errors.push(...validateTechEffect(label, e, { resources, unitIds, buildingIds: new Set(content.buildings.map((b) => b.id)) }));
    } else if (t.effect !== undefined && !(t.effect in TECH_EFFECT_LABELS)) errors.push(`${label} : effet « ${t.effect} » inconnu.`);
    checkResources(`${label} (coût)`, t.baseCost);
    for (const req of Object.keys(t.prereq ?? {})) {
      if (!techIds.has(req)) errors.push(`${label} : prérequis « ${req} » inexistant.`);
      if (req === t.id) errors.push(`${label} : ne peut pas être son propre prérequis.`);
    }
  }
  // Cycles de prérequis (A requiert B qui requiert A) : recherche impossible.
  const byId = new Map(content.technologies.map((t) => [t.id, t]));
  const visiting = new Set<string>();
  const done = new Set<string>();
  const visit = (id: string, path: string[]): void => {
    if (done.has(id)) return;
    if (visiting.has(id)) {
      errors.push(`Technologies : cycle de prérequis ${[...path, id].join(" → ")}.`);
      return;
    }
    visiting.add(id);
    for (const req of Object.keys(byId.get(id)?.prereq ?? {})) if (byId.has(req)) visit(req, [...path, id]);
    visiting.delete(id);
    done.add(id);
  };
  for (const t of content.technologies) visit(t.id, []);

  checkIds("Missions", content.missions.map((m) => m.key));
  for (const m of content.missions) {
    const label = `Mission ${m.name || m.key}`;
    if (!(m.duration > 0)) errors.push(`${label} : durée doit être > 0.`);
    for (const unitId of Object.keys(m.prereq ?? {})) {
      if (!unitIds.has(unitId)) errors.push(`${label} : unité requise « ${unitId} » inexistante.`);
    }
    const res = { ...(m.reward ?? {}) };
    delete res.xp;
    checkResources(`${label} (récompense)`, res);
  }
  errors.push(...validateFactions(content.factions ?? []));
  errors.push(...validateWarlords(content.warlords));
  errors.push(...validateRanks(content.ranks ?? []));
  errors.push(...validateAchievements(content.achievements ?? []));

  return [...new Set(errors)];
}
