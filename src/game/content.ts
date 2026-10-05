import { ALLIANCE_BOSS_RULES, DEFAULT_ALLIANCE_BOSSES, setAllianceBosses, type AllianceBossDef } from "@/game/allianceBoss";
import { DEFAULT_WORLD_BOSSES, setWorldBosses, validateWorldBosses, type WorldBossDef } from "@/game/worldBosses";
import { defaultOfficersConfig, setOfficers, validateOfficers, type OfficersConfig } from "@/game/commanders";
import { defaultChroniclesConfig, SEASON_BOSS_RULES, setChronicles, validateChronicles, type ChroniclesConfig } from "@/game/chronicles";
import { DEFAULT_TITLES, setTitles, validateTitles, withLateDefaults, type TitleDef } from "@/game/titles";
import { setLootTables, validateLootTables } from "@/game/loot";
import { DEFAULT_RELICS, defaultRelicSettings, setRelics, validateRelics, type RelicSettings, type RelicTemplate } from "@/game/relics";
import { defaultSeasonPassConfig, setSeasonPass, validateSeasonPass, type SeasonPassConfig } from "@/game/seasonPass";
import { defaultPassSeasonsConfig, setPassSeasons, validatePassSeasons, type PassSeasonsConfig } from "@/game/passSeasons";
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
import { EVENT_RULES, validateBossSchedule } from "@/game/events";
import { SEASON_RULES } from "@/game/seasons";
import { STREAK_RULES } from "@/game/streak";
import { CATCHUP_RULES, validateCatchupRules } from "@/game/catchup";
import { ALLIANCE_RULES } from "@/game/alliances";
import { MARKET_RULES } from "@/game/market";
import { EXPEDITION_RULES } from "@/game/expeditions";
import { LEVIATHAN_RULES, SEASON_BOSS_TUNING } from "@/game/leviathan";
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
  /** v5.10.4 : boss de saison (occurrence, structure, reliques). */
  seasonBoss: typeof SEASON_BOSS_RULES;
  /** 5.15 : boss d'alliance (structure, rythme, coût, récompenses, catalogue). */
  allianceBoss: typeof ALLIANCE_BOSS_RULES & { bosses: AllianceBossDef[] };
  wars: typeof WAR_RULES;
  /** 5.15.9 : série de connexion (heures, jetons, Ambre du 6e jour, coffre du 7e). */
  streak: typeof STREAK_RULES;
  /** 5.16 : rattrapage de production des petits empires. */
  catchup: typeof CATCHUP_RULES;
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
  /** v4.3 : passe de saison (paliers et points) et chroniques mensuelles. */
  seasonPass: SeasonPassConfig;
  chronicles: ChroniclesConfig;
  /** v5.13 : passes de saison générés (brouillons et publiés). */
  passSeasons: PassSeasonsConfig;
  /** v5.9 : reliques (modèles, effets, images) et leurs réglages (raretés, emplacements, fusion). */
  relics: RelicTemplate[];
  relicSettings: RelicSettings;
  /** v5.10 : catalogue des titres (libellé, rareté, icône, déblocage). */
  titles: TitleDef[];
  /** v5.14 : boss mondiaux (catalogue de la rotation hebdomadaire). */
  worldBosses: WorldBossDef[];
  /** v5.14 : officiers (noms, effets par niveau, recrutement, officiers rares). */
  officers: OfficersConfig;
}

export type ContentSection = keyof GameContent;
export const CONTENT_SECTIONS: ContentSection[] = ["buildings", "units", "technologies", "missions", "factions", "ranks", "achievements", "rules", "warlords", "seasonPass", "chronicles", "passSeasons", "relics", "relicSettings", "titles", "worldBosses", "officers"];

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
const DEFAULT_STREAK_RULES = structuredClone(STREAK_RULES);
const DEFAULT_CATCHUP_RULES = { ...CATCHUP_RULES };
const DEFAULT_ALLIANCE_RULES = structuredClone(ALLIANCE_RULES);
const DEFAULT_PIRATE_RULES = { ...PIRATE_RULES };
const DEFAULT_MARKET_RULES = { ...MARKET_RULES };
const DEFAULT_EXPEDITION_RULES = structuredClone(EXPEDITION_RULES);
const DEFAULT_LEVIATHAN_RULES = { ...LEVIATHAN_RULES };
const DEFAULT_SEASON_BOSS_RULES = { ...SEASON_BOSS_RULES };
const DEFAULT_ALLIANCE_BOSS_RULES = { ...ALLIANCE_BOSS_RULES, bosses: DEFAULT_ALLIANCE_BOSSES.map((b) => ({ ...b })) };
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
    seasonPass: defaultSeasonPassConfig(),
    chronicles: defaultChroniclesConfig(),
    passSeasons: defaultPassSeasonsConfig(),
    relics: DEFAULT_RELICS,
    relicSettings: defaultRelicSettings(),
    worldBosses: DEFAULT_WORLD_BOSSES,
    officers: defaultOfficersConfig(),
    titles: DEFAULT_TITLES,
    rules: { pvp: DEFAULT_PVP_RULES, combat: DEFAULT_COMBAT_RULES, economy: DEFAULT_ECONOMY_RULES, fleets: DEFAULT_FLEET_RULES, spy: DEFAULT_SPY_RULES, debris: DEFAULT_DEBRIS_RULES, patrol: DEFAULT_PATROL_RULES, events: DEFAULT_EVENT_RULES, seasons: DEFAULT_SEASON_RULES, alliances: DEFAULT_ALLIANCE_RULES, pirates: DEFAULT_PIRATE_RULES, market: DEFAULT_MARKET_RULES, expeditions: DEFAULT_EXPEDITION_RULES, leviathan: DEFAULT_LEVIATHAN_RULES, seasonBoss: DEFAULT_SEASON_BOSS_RULES, allianceBoss: DEFAULT_ALLIANCE_BOSS_RULES, wars: DEFAULT_WAR_RULES, streak: DEFAULT_STREAK_RULES, catchup: DEFAULT_CATCHUP_RULES },
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
    seasonPass: overrides.seasonPass ?? defaults.seasonPass,
    chronicles: overrides.chronicles ?? defaults.chronicles,
    passSeasons: overrides.passSeasons && Array.isArray(overrides.passSeasons.seasons) ? overrides.passSeasons : defaults.passSeasons,
    relics: overrides.relics ?? defaults.relics,
    titles: overrides.titles ?? defaults.titles,
    worldBosses: Array.isArray(overrides.worldBosses) ? overrides.worldBosses : defaults.worldBosses,
    officers: overrides.officers && typeof overrides.officers === "object" ? overrides.officers : defaults.officers,
    relicSettings: {
      ...defaults.relicSettings,
      ...(overrides.relicSettings ?? {}),
      rarities: Object.fromEntries(
        Object.entries(defaults.relicSettings.rarities).map(([id, v]) => [id, { ...v, ...(overrides.relicSettings?.rarities?.[id as keyof RelicSettings["rarities"]] ?? {}) }]),
      ) as RelicSettings["rarities"],
    },
    rules: {
      pvp: { ...defaults.rules.pvp, ...(overrides.rules?.pvp ?? {}) },
      combat: { ...defaults.rules.combat, ...(overrides.rules?.combat ?? {}) },
      economy: { ...defaults.rules.economy, ...(overrides.rules?.economy ?? {}) },
      fleets: { ...defaults.rules.fleets, ...(overrides.rules?.fleets ?? {}) },
      spy: { ...defaults.rules.spy, ...(overrides.rules?.spy ?? {}) },
      debris: { ...defaults.rules.debris, ...(overrides.rules?.debris ?? {}) },
      patrol: { ...defaults.rules.patrol, ...(overrides.rules?.patrol ?? {}) },
      events: { ...defaults.rules.events, ...(overrides.rules?.events ?? {}) },
      seasons: (() => {
        // 5.15.4 : lots imbriqués fusionnés un à un (anciens réglages « tiers » ignorés).
        const o = (overrides.rules?.seasons ?? {}) as Partial<GameRules["seasons"]> & { tiers?: unknown; participationHours?: unknown };
        const d = defaults.rules.seasons;
        const { tiers: _tiers, participationHours: _hours, ...rest } = o;
        void _tiers;
        void _hours;
        return { ...d, ...rest, champion: { ...d.champion, ...(o.champion ?? {}) }, podium: { ...d.podium, ...(o.podium ?? {}) }, participation: { ...d.participation, ...(o.participation ?? {}) } };
      })(),
      alliances: { ...defaults.rules.alliances, ...(overrides.rules?.alliances ?? {}) },
      pirates: { ...defaults.rules.pirates, ...(overrides.rules?.pirates ?? {}) },
      market: { ...defaults.rules.market, ...(overrides.rules?.market ?? {}) },
      expeditions: {
        ...defaults.rules.expeditions,
        ...(overrides.rules?.expeditions ?? {}),
        weights: { ...defaults.rules.expeditions.weights, ...(overrides.rules?.expeditions?.weights ?? {}) },
      },
      leviathan: { ...defaults.rules.leviathan, ...(overrides.rules?.leviathan ?? {}) },
      seasonBoss: { ...defaults.rules.seasonBoss, ...(overrides.rules?.seasonBoss ?? {}) },
      allianceBoss: { ...defaults.rules.allianceBoss, ...(overrides.rules?.allianceBoss ?? {}) },
      wars: { ...defaults.rules.wars, ...(overrides.rules?.wars ?? {}) },
      catchup: { ...defaults.rules.catchup, ...(overrides.rules?.catchup ?? {}) },
      streak: (() => {
        const o = (overrides.rules?.streak ?? {}) as Partial<GameRules["streak"]>;
        const d = defaults.rules.streak;
        const hours = Array.isArray(o.hours) && o.hours.length === d.hours.length && o.hours.every((h) => Number.isFinite(h) && h >= 0) ? [...o.hours] : [...d.hours];
        return { ...d, ...o, hours, chest: { ...d.chest, ...(o.chest ?? {}) } };
      })(),
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
  // v5.14 : officiers et boss mondiaux d'abord (succès et titres dérivés en dépendent).
  setOfficers(content.officers);
  setWorldBosses(content.worldBosses);
  setAchievements(content.achievements);
  setWarlords(content.warlords);
  setSeasonPass(content.seasonPass);
  setChronicles(content.chronicles);
  // Après les chapitres : un passe de saison publié remplace le passe du chapitre.
  setPassSeasons(content.passSeasons);
  setRelics(content.relics, content.relicSettings);
  setLootTables(content.relicSettings?.loot as Parameters<typeof setLootTables>[0], content.relicSettings?.lootTokenCap);
  setTitles(content.titles ? withLateDefaults(content.titles) : DEFAULT_TITLES);
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
  Object.assign(SEASON_BOSS_RULES, content.rules.seasonBoss);
  // 5.15 : réglages de combat du boss de saison, lus par le moteur des boss.
  const sb = content.rules.seasonBoss;
  SEASON_BOSS_TUNING.cooldownHours = sb.cooldownHours;
  SEASON_BOSS_TUNING.flightMinutes = sb.flightMinutes;
  SEASON_BOSS_TUNING.lossMult = sb.lossMult;
  SEASON_BOSS_TUNING.weakness = sb.weakness;
  // 5.15 : boss d'alliance (chiffres + catalogue).
  const { bosses: allianceBosses, ...allianceBossRules } = content.rules.allianceBoss;
  Object.assign(ALLIANCE_BOSS_RULES, allianceBossRules);
  setAllianceBosses(allianceBosses);
  Object.assign(WAR_RULES, content.rules.wars);
  Object.assign(STREAK_RULES, structuredClone(content.rules.streak));
  Object.assign(CATCHUP_RULES, content.rules.catchup);
  current = content;
  return content;
}

/* ---------- validation (interface d'administration) ---------- */

const RULE_GROUP_LABELS: Record<string, string> = {
  pvp: "Protections",
  combat: "Combat",
  economy: "Économie",
  fleets: "Flottes",
  spy: "Espionnage",
  debris: "Débris",
  patrol: "Patrouilles",
  events: "Événements",
  seasons: "Saisons",
  alliances: "Alliances",
  pirates: "Pirates",
  market: "Marché",
  expeditions: "Expéditions",
  leviathan: "Léviathan",
  seasonBoss: "Boss de saison",
  allianceBoss: "Boss d'alliance",
  wars: "Guerres",
  streak: "Série de connexion",
  catchup: "Rattrapage",
};

/**
 * v5.10.5 : contrôle des règles avant enregistrement (onglet Règles, et serveur).
 * Chaque valeur garde le type de sa valeur par défaut ; un nombre est fini, positif
 * (sauf les malus déjà négatifs par défaut, compris entre −1 et 0) et un pourcentage
 * (clé en « Pct ») ne dépasse pas 1.
 */
export function validateRules(rules: Partial<GameRules> | null | undefined): string[] {
  const errors: string[] = [];
  if (!rules || typeof rules !== "object") return ["Règles : contenu illisible."];
  const defaults = defaultGameContent().rules as unknown as Record<string, Record<string, unknown>>;
  for (const [group, value] of Object.entries(rules as Record<string, unknown>)) {
    const def = defaults[group];
    const label = RULE_GROUP_LABELS[group] ?? group;
    if (!def) continue;
    if (!value || typeof value !== "object") {
      errors.push(`${label} : section illisible.`);
      continue;
    }
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
      const d = def[key];
      if (d === undefined || v === undefined) continue;
      if (typeof d === "number") {
        if (typeof v !== "number" || !Number.isFinite(v)) errors.push(`${label} : « ${key} » doit être un nombre.`);
        else if (d >= 0 && v < 0) errors.push(`${label} : « ${key} » ne peut pas être négatif.`);
        else if (d < 0 && (v < -1 || v > 0)) errors.push(`${label} : « ${key} » doit être entre −1 et 0.`);
        else if (/Pct$/.test(key) && v > 1) errors.push(`${label} : « ${key} » est une part (0,1 = 10 %), 1 au plus.`);
      } else if (typeof d === "boolean" && typeof v !== "boolean") errors.push(`${label} : « ${key} » doit être oui ou non.`);
      else if (typeof d === "string" && typeof v !== "string") errors.push(`${label} : « ${key} » doit être un texte.`);
      else if (Array.isArray(d) && !Array.isArray(v)) errors.push(`${label} : « ${key} » doit être une liste.`);
    }
  }
  const merged = mergeRulesForCheck(rules);
  errors.push(...validateBossSchedule("Léviathan", { weekend: merged.events.bossWeekend ?? "first", startHour: merged.leviathan.startHour ?? 18, durationHours: merged.leviathan.durationHours, dates: merged.events.bossDates ?? [] }));
  errors.push(...validateBossSchedule("Boss de saison", merged.seasonBoss));
  // 5.15 : réglages de combat du boss de saison (absents : ceux du boss mondial).
  const sbr = merged.seasonBoss;
  if (sbr.cooldownHours !== undefined && !(sbr.cooldownHours >= 0.25 && sbr.cooldownHours <= 48)) errors.push("Boss de saison : délai entre deux assauts entre 0,25 et 48 h.");
  if (sbr.flightMinutes !== undefined && !(sbr.flightMinutes >= 1 && sbr.flightMinutes <= 240)) errors.push("Boss de saison : trajet entre 1 et 240 min.");
  if (sbr.lossMult !== undefined && !(sbr.lossMult >= 0.1 && sbr.lossMult <= 5)) errors.push("Boss de saison : pertes entre 0,1 et 5.");
  if (!merged.leviathan.name?.trim()) errors.push("Léviathan : nom vide.");
  errors.push(...validateCatchupRules(merged.catchup));
  // 5.16 : récurrence des événements programmés.
  for (const ev of merged.events.scheduled ?? []) {
    if (ev.repeatWeeks === undefined) continue;
    if (!(Number.isInteger(ev.repeatWeeks) && ev.repeatWeeks >= 1 && ev.repeatWeeks <= 8)) errors.push("Événement programmé : récurrence entre 1 et 8 semaines.");
    if (!(Number.isInteger(ev.repeatCount) && (ev.repeatCount ?? 0) >= 2 && (ev.repeatCount ?? 0) <= 26)) errors.push("Événement programmé : entre 2 et 26 occurrences.");
  }
  // 5.15.9 : série de connexion (7 jours, bornes du coffre dans l'ordre).
  const st = merged.streak;
  if (st) {
    if (!Array.isArray(st.hours) || st.hours.length !== 7 || st.hours.some((h) => !Number.isFinite(h) || h < 0)) errors.push("Série de connexion : 7 durées de production positives (jours 1 à 7).");
    for (const [key, label] of [["amber", "Ambre"], ["tokens", "jetons"], ["common", "ressources"]] as const) {
      const r = st.chest?.[key];
      if (!Array.isArray(r) || r.length !== 2 || !(r[0] >= 0) || !(r[1] >= r[0])) errors.push(`Série de connexion : coffre, ${label} : minimum ≤ maximum, positifs.`);
    }
  }
  return errors;
}

function mergeRulesForCheck(rules: Partial<GameRules>): GameRules {
  const d = defaultGameContent().rules;
  const out = { ...d } as Record<string, unknown>;
  for (const [k, v] of Object.entries(rules)) if (v && typeof v === "object" && !Array.isArray(v)) out[k] = { ...(d as unknown as Record<string, object>)[k], ...v };
  return out as unknown as GameRules;
}

const ID_PATTERN = /^[A-Za-z0-9_]+$/;

/** Liste des erreurs bloquantes : identifiants en double, références vers
 *  un élément inexistant, valeurs impossibles. Vide = contenu valide. */
export function validateGameContent(content: GameContent): string[] {
  const errors: string[] = [];
  // v5.10.5 : règles (types, bornes, occurrence des boss).
  errors.push(...validateRules(content.rules));
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
    if (t.amberCost !== undefined && (!Number.isFinite(t.amberCost) || t.amberCost < 0)) errors.push(`${label} : ambre par niveau invalide.`);
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
  errors.push(...validateSeasonPass(content.seasonPass));
  errors.push(...validateChronicles(content.chronicles));
  errors.push(...validatePassSeasons(content.passSeasons));
  errors.push(...validateRanks(content.ranks ?? []));
  errors.push(...validateAchievements(content.achievements ?? []));
  errors.push(...validateRelics(content.relics ?? [], content.relicSettings ?? defaultRelicSettings()));
  errors.push(...validateLootTables(content.relicSettings?.loot as Parameters<typeof validateLootTables>[0]));
  const cap = content.relicSettings?.lootTokenCap;
  if (cap !== undefined && !(Number.isInteger(cap) && cap >= 0 && cap <= 500)) errors.push("Butin : plafond hebdomadaire de jetons entier, entre 0 (sans plafond) et 500.");
  errors.push(...validateTitles(content.titles ?? []));
  errors.push(...validateWorldBosses(content.worldBosses));
  errors.push(...validateOfficers(content.officers));

  return [...new Set(errors)];
}
