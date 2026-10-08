import { COLONY_ROUTE_RULES, COLONY_RULES } from "@/game/colonies";
import { setTechCombatLimits } from "@/game/effects";
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
import { BUILDINGS, DEFAULT_BUILDINGS, findBuilding, setBuildings, withFixedBuildings, type BuildingDef } from "@/game/buildings";
import { CLASS_UNITS, DEFAULT_UNITS, ELITE_UNITS, findUnit, KESH_HUNTER_UNIT, setUnits, UNIT_ROLE_IDS, UNIT_TO_TECH, UNITS, type UnitDef } from "@/game/units";
import { DEFAULT_TECHNOLOGIES, findTech, setTechnologies, TECH_EFFECT_LABELS, techEffects, TECHNOLOGIES, validateTechEffect, type TechDef } from "@/game/technologies";
import { actionOfContract, setTrackedContentResolver, validateTrackedActionRules } from "@/game/trackedActions";
import { addedOnError, validateNoveltyRules } from "@/game/novelty";
import { DEFAULT_MISSIONS, setMissions, type MissionDef } from "@/game/missions";
import { PVP_RULES } from "@/game/pvp";
import { COMBAT_RULES } from "@/game/combat";
import { ECONOMY_RULES } from "@/game/economy";
import { FLEET_RULES, PATROL_RULES } from "@/game/fleets";
import { EMPIRE_CLASS_RULES } from "@/game/empireClass";
import { SPY_RULES } from "@/game/espionage";
import { DEBRIS_RULES } from "@/game/debris";
import { EVENT_RULES, validateBossSchedule } from "@/game/events";
import { SEASON_RULES } from "@/game/seasons";
import { STREAK_RULES } from "@/game/streak";
import { CATCHUP_RULES, validateCatchupRules } from "@/game/catchup";
import { MUTATOR_RULES, validateMutatorRules } from "@/game/mutators";
import { TERRITORY_WAR_RULES, validateTerritoryWarRules } from "@/game/territoryWar";
import { XP_TIER_RULES, validateXpTierRules } from "@/game/xpTiers";
import { PASS_GEN_RULES, validatePassGenRules } from "@/game/passGen";
import { CHRONICLE_GEN_RULES, validateChronicleGenRules } from "@/game/chronicleGen";
import { ARCHETYPES } from "@/game/procedural";
import { AUCTION_RULES } from "@/game/auctions";
import { TRADE_CONTRACT_RULES } from "@/game/tradeContracts";
import { GIFT_RULES } from "@/game/actions";
import { CONTEST_RULES } from "@/game/contests";
import { OUTCOME_POINTS } from "@/game/casino";
import { WEEKLY_STOCK_RULES } from "@/game/weeklyStock";
import { PATRON_RULES } from "@/game/patrons";
import { applyRhythmSwitch } from "@/game/rhythm";
import { applyRegisteredRules, mergeRuleGroup, REGISTERED_RULES, registeredRuleSnapshot, ruleFieldMeta, type RegisteredRuleGroups } from "@/game/ruleRegistry";
import { ruleBoundError } from "@/game/ruleMeta";
import { ALLIANCE_RULES, validateAllianceEffects } from "@/game/alliances";
import { MARKET_RULES } from "@/game/market";
import { EXPEDITION_RULES } from "@/game/expeditions";
import { LEVIATHAN_RULES, SEASON_BOSS_TUNING } from "@/game/leviathan";
import { WAR_RULES } from "@/game/wars";
import { DEFAULT_FACTIONS, PIRATE_RULES, setFactions, validateFactions, type FactionDef } from "@/game/pirates";
import { RESOURCE_LIST } from "@/game/resources";
import { driftWarnings, listShapeErrors, shapeErrors } from "@/game/contentShape";
import { DEFAULT_RANKS, setRanks, validateRanks, type RankDef } from "@/game/ranks";
import { applyAchievementPace, DEFAULT_ACHIEVEMENTS, METRICS, setAchievements, validateAchievements, withDefaultAchievements, type AchievementDef } from "@/game/achievements";

/* =====================================================
   Contenu du jeu piloté par les données.

   Le contenu par défaut est défini dans le code (buildings.ts, units.ts,
   technologies.ts, missions.ts…). L'interface d'administration peut en
   enregistrer une version modifiée dans la collection PocketBase
   `game_config` (un enregistrement par section). applyGameContent est
   appelé au démarrage du client ET par le serveur (pb_hooks) avant chaque
   action arbitrée : les deux voient toujours les mêmes règles.
===================================================== */

/** 6.9.1 : les groupes du registre des réglages (`ruleRegistry.ts`) font aussi partie des règles. */
export interface GameRules extends RegisteredRuleGroups {
  pvp: typeof PVP_RULES;
  combat: typeof COMBAT_RULES;
  economy: typeof ECONOMY_RULES;
  fleets: typeof FLEET_RULES;
  /** 6.0 : classes d'empire. */
  classes: typeof EMPIRE_CLASS_RULES;
  /** 6.7.1 : colonies (fondation, production, file de défense) et routes logistiques. */
  colonies: typeof COLONY_RULES;
  colonyRoutes: typeof COLONY_ROUTE_RULES;
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
  /** 5.16 : mutateur de saison (une règle spéciale par mois). */
  mutators: typeof MUTATOR_RULES;
  /** 5.17 : guerre de territoire (calendrier, points par secteur, récompenses). */
  territoryWar: typeof TERRITORY_WAR_RULES;
  /** 5.18 : paliers d'XP journaliers par source et bonus au jeu actif. */
  xpTiers: typeof XP_TIER_RULES;
  /** 6.8.1 : passe généré (budget des récompenses, rythme, défis). */
  passGen: typeof PASS_GEN_RULES;
  /** 6.8.2 : chapitres des Chroniques générés (récompenses, objectifs, difficulté, faction du thème). */
  chronicleGen: typeof CHRONICLE_GEN_RULES;
  /** 6.9.0 (AU4) : commerce réglable dans l'admin. */
  auctions: typeof AUCTION_RULES;
  tradeContracts: typeof TRADE_CONTRACT_RULES;
  gifts: typeof GIFT_RULES;
  contests: typeof CONTEST_RULES;
  tournamentPoints: typeof OUTCOME_POINTS;
  weeklyStock: typeof WEEKLY_STOCK_RULES;
  patrons: typeof PATRON_RULES;
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
  // 5.22 : les unités d'élite aussi (et leur rôle d'élite, même si la fiche a été modifiée).
  const out = units.some((u) => u.id === KESH_HUNTER_UNIT.id) ? [...units] : [...units, KESH_HUNTER_UNIT];
  for (const e of ELITE_UNITS) {
    const i = out.findIndex((u) => u.id === e.id);
    if (i < 0) out.push(e);
    else out[i] = { ...out[i], elite: e.elite, unlockTech: "", maxLevel: 1 };
  }
  // 6.5 : vaisseaux de classe (et leur verrou de classe, même si la fiche a été modifiée).
  for (const c of CLASS_UNITS) {
    const i = out.findIndex((u) => u.id === c.id);
    if (i < 0) out.push(c);
    else out[i] = { ...out[i], empireClass: c.empireClass, classTech: out[i].classTech || c.classTech, unlockTech: "" };
  }
  return out;
}

const DEFAULT_PVP_RULES = { ...PVP_RULES };
const DEFAULT_COMBAT_RULES = { ...COMBAT_RULES };
const DEFAULT_ECONOMY_RULES = { ...ECONOMY_RULES };
const DEFAULT_FLEET_RULES = { ...FLEET_RULES };
const DEFAULT_EMPIRE_CLASS_RULES = { ...EMPIRE_CLASS_RULES };
const DEFAULT_COLONY_RULES = structuredClone(COLONY_RULES);
const DEFAULT_COLONY_ROUTE_RULES = structuredClone(COLONY_ROUTE_RULES);
const DEFAULT_SPY_RULES = { ...SPY_RULES };
const DEFAULT_DEBRIS_RULES = { ...DEBRIS_RULES };
const DEFAULT_PATROL_RULES = { ...PATROL_RULES };
const DEFAULT_EVENT_RULES = structuredClone(EVENT_RULES);
const DEFAULT_SEASON_RULES = structuredClone(SEASON_RULES);
const DEFAULT_STREAK_RULES = structuredClone(STREAK_RULES);
const DEFAULT_CATCHUP_RULES = { ...CATCHUP_RULES };
const DEFAULT_MUTATOR_RULES = structuredClone(MUTATOR_RULES);
const DEFAULT_TERRITORY_WAR_RULES = structuredClone(TERRITORY_WAR_RULES);
const DEFAULT_XP_TIER_RULES = structuredClone(XP_TIER_RULES);
const DEFAULT_PASS_GEN_RULES = structuredClone(PASS_GEN_RULES);
const DEFAULT_CHRONICLE_GEN_RULES = structuredClone(CHRONICLE_GEN_RULES);
/** 6.9.1 : valeurs par défaut des groupes du registre (lues au chargement, avant tout réglage). */
const DEFAULT_REGISTERED_RULES = registeredRuleSnapshot();
const DEFAULT_COMMERCE_RULES = {
  auctions: structuredClone(AUCTION_RULES),
  tradeContracts: structuredClone(TRADE_CONTRACT_RULES),
  gifts: structuredClone(GIFT_RULES),
  contests: structuredClone(CONTEST_RULES),
  tournamentPoints: structuredClone(OUTCOME_POINTS),
  weeklyStock: structuredClone(WEEKLY_STOCK_RULES),
  patrons: structuredClone(PATRON_RULES),
};
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
    rules: { pvp: DEFAULT_PVP_RULES, combat: DEFAULT_COMBAT_RULES, economy: DEFAULT_ECONOMY_RULES, fleets: DEFAULT_FLEET_RULES, classes: DEFAULT_EMPIRE_CLASS_RULES, colonies: DEFAULT_COLONY_RULES, colonyRoutes: DEFAULT_COLONY_ROUTE_RULES, spy: DEFAULT_SPY_RULES, debris: DEFAULT_DEBRIS_RULES, patrol: DEFAULT_PATROL_RULES, events: DEFAULT_EVENT_RULES, seasons: DEFAULT_SEASON_RULES, alliances: DEFAULT_ALLIANCE_RULES, pirates: DEFAULT_PIRATE_RULES, market: DEFAULT_MARKET_RULES, expeditions: DEFAULT_EXPEDITION_RULES, leviathan: DEFAULT_LEVIATHAN_RULES, seasonBoss: DEFAULT_SEASON_BOSS_RULES, allianceBoss: DEFAULT_ALLIANCE_BOSS_RULES, wars: DEFAULT_WAR_RULES, streak: DEFAULT_STREAK_RULES, catchup: DEFAULT_CATCHUP_RULES, mutators: DEFAULT_MUTATOR_RULES, territoryWar: DEFAULT_TERRITORY_WAR_RULES, xpTiers: DEFAULT_XP_TIER_RULES, passGen: DEFAULT_PASS_GEN_RULES, chronicleGen: DEFAULT_CHRONICLE_GEN_RULES, ...structuredClone(DEFAULT_COMMERCE_RULES), ...structuredClone(DEFAULT_REGISTERED_RULES) },
  });
}

let current: GameContent = defaultGameContent();

/** Contenu actuellement appliqué (copie). */
export function currentGameContent(): GameContent {
  return structuredClone(current);
}

/** 6.14.56 : succès par défaut retirés exprès (GameRules.achievementList.removedDefaults), lus avant la fusion des règles. */
function removedDefaultAchievements(rules: Partial<GameRules> | undefined): string[] {
  const list = (rules as { achievementList?: { removedDefaults?: unknown } } | undefined)?.achievementList?.removedDefaults;
  return Array.isArray(list) ? list.filter((x): x is string => typeof x === "string") : [];
}

/** 6.14.59 (AA1) : contenu complet fusionné avec les défauts, **sans l'appliquer** (pur : sert aussi à la validation serveur). */
export function resolveGameContent(overrides: Partial<GameContent>, nowMs?: number): GameContent {
  const defaults = defaultGameContent();
  const content: GameContent = {
    buildings: withFixedBuildings(overrides.buildings ?? defaults.buildings),
    units: withFixedUnits(overrides.units ?? defaults.units),
    technologies: overrides.technologies ?? defaults.technologies,
    missions: overrides.missions ?? defaults.missions,
    factions: overrides.factions ?? defaults.factions,
    ranks: overrides.ranks ?? defaults.ranks,
    // 6.14.56 (AP-1) : une liste enregistrée garde les succès par défaut ajoutés au code depuis, sauf ceux retirés exprès.
    achievements: Array.isArray(overrides.achievements) ? withDefaultAchievements(overrides.achievements, removedDefaultAchievements(overrides.rules)) : defaults.achievements,
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
      classes: { ...defaults.rules.classes, ...(overrides.rules?.classes ?? {}) },
      colonies: { ...defaults.rules.colonies, ...(overrides.rules?.colonies ?? {}) },
      colonyRoutes: { ...defaults.rules.colonyRoutes, ...(overrides.rules?.colonyRoutes ?? {}) },
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
      alliances: (() => {
        // 5.33 : une recherche d'alliance ajoutée par défaut reste disponible même si l'admin a modifié la liste.
        const merged = { ...defaults.rules.alliances, ...(overrides.rules?.alliances ?? {}) };
        const ids = new Set((merged.researches ?? []).map((r) => r.id));
        return { ...merged, researches: [...(merged.researches ?? []), ...defaults.rules.alliances.researches.filter((r) => !ids.has(r.id))] };
      })(),
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
      mutators: { ...defaults.rules.mutators, ...(overrides.rules?.mutators ?? {}), overrides: { ...(overrides.rules?.mutators?.overrides ?? {}) }, values: { ...defaults.rules.mutators.values, ...(overrides.rules?.mutators?.values ?? {}) } },
      territoryWar: {
        ...defaults.rules.territoryWar,
        ...(overrides.rules?.territoryWar ?? {}),
        points: { ...defaults.rules.territoryWar.points, ...(overrides.rules?.territoryWar?.points ?? {}) },
        rewards: { ...defaults.rules.territoryWar.rewards, ...(overrides.rules?.territoryWar?.rewards ?? {}) },
      },
      xpTiers: {
        ...defaults.rules.xpTiers,
        ...(overrides.rules?.xpTiers ?? {}),
        tiers: { ...defaults.rules.xpTiers.tiers, ...(overrides.rules?.xpTiers?.tiers ?? {}) },
        multipliers: { ...defaults.rules.xpTiers.multipliers, ...(overrides.rules?.xpTiers?.multipliers ?? {}) },
      },
      passGen: {
        ...defaults.rules.passGen,
        ...(overrides.rules?.passGen ?? {}),
        values: { ...defaults.rules.passGen.values, ...(overrides.rules?.passGen?.values ?? {}) },
        caps: { ...defaults.rules.passGen.caps, ...(overrides.rules?.passGen?.caps ?? {}) },
        weights: { ...defaults.rules.passGen.weights, ...(overrides.rules?.passGen?.weights ?? {}) },
        challengeWeights: { ...defaults.rules.passGen.challengeWeights, ...(overrides.rules?.passGen?.challengeWeights ?? {}) },
      },
      chronicleGen: {
        ...defaults.rules.chronicleGen,
        ...(overrides.rules?.chronicleGen ?? {}),
        weights: { ...defaults.rules.chronicleGen.weights, ...(overrides.rules?.chronicleGen?.weights ?? {}) },
        caps: { ...defaults.rules.chronicleGen.caps, ...(overrides.rules?.chronicleGen?.caps ?? {}) },
        objectiveWeights: { ...defaults.rules.chronicleGen.objectiveWeights, ...(overrides.rules?.chronicleGen?.objectiveWeights ?? {}) },
        themeArchetypes: { ...defaults.rules.chronicleGen.themeArchetypes, ...(overrides.rules?.chronicleGen?.themeArchetypes ?? {}) },
      },
      auctions: {
        ...defaults.rules.auctions,
        ...(overrides.rules?.auctions ?? {}),
        minStart: { ...defaults.rules.auctions.minStart, ...(overrides.rules?.auctions?.minStart ?? {}) },
      },
      tradeContracts: { ...defaults.rules.tradeContracts, ...(overrides.rules?.tradeContracts ?? {}) },
      gifts: { ...defaults.rules.gifts, ...(overrides.rules?.gifts ?? {}) },
      contests: { ...defaults.rules.contests, ...(overrides.rules?.contests ?? {}) },
      tournamentPoints: { ...defaults.rules.tournamentPoints, ...(overrides.rules?.tournamentPoints ?? {}) },
      // 6.14.104 (AA3) : champs simples ajoutés (sac de jetons) gardés ; sous-objets fusionnés champ par champ.
      weeklyStock: {
        ...defaults.rules.weeklyStock,
        ...(overrides.rules?.weeklyStock ?? {}),
        prices: { ...defaults.rules.weeklyStock.prices, ...(overrides.rules?.weeklyStock?.prices ?? {}) },
        quantities: { ...defaults.rules.weeklyStock.quantities, ...(overrides.rules?.weeklyStock?.quantities ?? {}) },
      },
      patrons: { ...defaults.rules.patrons, ...(overrides.rules?.patrons ?? {}), tiers: { ...defaults.rules.patrons.tiers, ...(overrides.rules?.patrons?.tiers ?? {}) } },
      // 6.9.1 : registre des réglages, fusion profonde (un champ ajouté plus tard garde sa valeur par défaut).
      ...(Object.fromEntries(
        Object.keys(REGISTERED_RULES).map((k) => [k, mergeRuleGroup((defaults.rules as unknown as Record<string, unknown>)[k], (overrides.rules as Record<string, unknown> | undefined)?.[k])]),
      ) as RegisteredRuleGroups),
      streak: (() => {
        const o = (overrides.rules?.streak ?? {}) as Partial<GameRules["streak"]>;
        const d = defaults.rules.streak;
        const hours = Array.isArray(o.hours) && o.hours.length === d.hours.length && o.hours.every((h) => Number.isFinite(h) && h >= 0) ? [...o.hours] : [...d.hours];
        return { ...d, ...o, hours, chest: { ...d.chest, ...(o.chest ?? {}) } };
      })(),
    },
  };
  // 6.14.88 (RL-3) : bascule datée du rythme, seulement quand l'heure est donnée (serveur, client) : sans heure (tests,
  // validation de l'admin), le contenu enregistré tel quel.
  return nowMs === undefined ? content : applyRhythmSwitch(content, defaults.buildings, nowMs);
}

/** 6.14.121 (AU27, AP-L7) : noms et listes des contenus en vigueur pour le registre des actions suivies (actions par contenu :
 *  `unit:<id>`, `research:<id>`, `building:<id>`). Lus à l'usage dans les catalogues posés par `applyGameContent`. */
setTrackedContentResolver({
  name: (family, id) => (family === "unit" ? findUnit(id)?.name : family === "research" ? findTech(id)?.nom : findBuilding(id)?.name) ?? null,
  ids: (family) => (family === "unit" ? UNITS : family === "research" ? TECHNOLOGIES : BUILDINGS).map((x) => x.id),
});

/** Applique un contenu (sections absentes = valeurs par défaut du code). 6.14.88 : `nowMs` (serveur et client) applique la
 *  bascule datée du rythme (`rhythm.ts`) ; sans heure, les valeurs enregistrées telles quelles. */
export function applyGameContent(overrides: Partial<GameContent>, nowMs?: number): GameContent {
  const content = resolveGameContent(overrides, nowMs);
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
  // 6.7.1 : plafonds des technos de combat réglables.
  setTechCombatLimits(COMBAT_RULES.techCombatCap, COMBAT_RULES.techCombatPerTechMax);
  Object.assign(ECONOMY_RULES, content.rules.economy);
  Object.assign(FLEET_RULES, content.rules.fleets);
  Object.assign(EMPIRE_CLASS_RULES, content.rules.classes);
  Object.assign(COLONY_RULES, structuredClone(content.rules.colonies));
  Object.assign(COLONY_ROUTE_RULES, structuredClone(content.rules.colonyRoutes));
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
  MUTATOR_RULES.enabled = content.rules.mutators.enabled !== false;
  MUTATOR_RULES.overrides = { ...content.rules.mutators.overrides };
  MUTATOR_RULES.values = { ...DEFAULT_MUTATOR_RULES.values, ...(content.rules.mutators.values ?? {}) };
  Object.assign(TERRITORY_WAR_RULES, structuredClone(content.rules.territoryWar));
  Object.assign(XP_TIER_RULES, structuredClone(content.rules.xpTiers));
  Object.assign(PASS_GEN_RULES, structuredClone(content.rules.passGen));
  Object.assign(CHRONICLE_GEN_RULES, structuredClone(content.rules.chronicleGen));
  Object.assign(AUCTION_RULES, structuredClone(content.rules.auctions));
  Object.assign(TRADE_CONTRACT_RULES, structuredClone(content.rules.tradeContracts));
  Object.assign(GIFT_RULES, structuredClone(content.rules.gifts));
  Object.assign(CONTEST_RULES, structuredClone(content.rules.contests));
  Object.assign(OUTCOME_POINTS, structuredClone(content.rules.tournamentPoints));
  Object.assign(WEEKLY_STOCK_RULES, structuredClone(content.rules.weeklyStock));
  Object.assign(PATRON_RULES, structuredClone(content.rules.patrons));
  applyRegisteredRules(content.rules);
  // 6.14.117 (É30-6) : seuils en jeu des succès, après les règles (le rythme des succès est un groupe du registre).
  applyAchievementPace();
  current = content;
  return content;
}

/* ---------- validation (interface d'administration) ---------- */

export const RULE_GROUP_LABELS: Record<string, string> = {
  pvp: "Protections",
  combat: "Combat",
  economy: "Économie",
  fleets: "Flottes",
  classes: "Classes d'empire",
  colonies: "Colonies",
  colonyRoutes: "Routes de colonies",
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
  mutators: "Mutateur de saison",
  territoryWar: "Guerre de territoire",
  xpTiers: "Paliers d'XP",
  passGen: "Passe généré",
  chronicleGen: "Chroniques générées",
  auctions: "Enchères",
  tradeContracts: "Contrats de livraison",
  gifts: "Cadeaux",
  contests: "Concours du pot commun",
  tournamentPoints: "Tournoi du casino : points par tirage",
  weeklyStock: "Offre de la semaine (Comptoir)",
  patrons: "Mécènes",
  ...Object.fromEntries(Object.entries(REGISTERED_RULES).map(([k, r]) => [k, r.label])),
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
        else {
          // 6.14.95 (AA2) : bornes déclarées dans les métadonnées du champ (X_RULES_META, HISTORICAL_RULES_META).
          const meta = ruleFieldMeta(group, key);
          const bound = ruleBoundError(meta, v);
          if (bound) errors.push(`${label} : « ${meta?.label ?? key} » (${key}) doit être ${bound}${meta?.unit ? ` (${meta.unit})` : ""}.`);
        }
      } else if (typeof d === "boolean" && typeof v !== "boolean") errors.push(`${label} : « ${key} » doit être oui ou non.`);
      else if (typeof d === "string" && typeof v !== "string") errors.push(`${label} : « ${key} » doit être un texte.`);
      else if (Array.isArray(d) && !Array.isArray(v)) errors.push(`${label} : « ${key} » doit être une liste.`);
      // 6.14.59 (AA1) : objets imbriqués et listes d'objets vérifiés selon la forme du défaut (types, champs obligatoires, null).
      else if (d !== null && typeof d === "object") errors.push(...shapeErrors(label, v, d, key));
    }
  }
  const merged = mergeRulesForCheck(rules);
  // 6.7.1 : plafonds des technos de combat et bonus du Traqueur.
  const cb6 = merged.combat;
  if (!(cb6.techCombatCap >= 0 && cb6.techCombatCap <= 5)) errors.push("Combat : plafond des technos de combat entre 0 et 5 (+500 %).");
  if (!(cb6.techCombatPerTechMax >= 0 && cb6.techCombatPerTechMax <= cb6.techCombatCap)) errors.push("Combat : une techno ne peut pas dépasser le plafond total des technos de combat.");
  if (!(cb6.keshPveBonus >= 0 && cb6.keshPveBonus <= 3)) errors.push("Combat : bonus du Traqueur contre les PNJ entre 0 et 3 (+300 %).");
  if (!(merged.pirates.lairLocateCostHours >= 0 && merged.pirates.lairLocateMinRepelled >= 0)) errors.push("Factions : « Localiser » invalide.");
  if (!(merged.classes.harvesterRecycleBonus >= 0 && merged.classes.harvesterRecycleBonus <= 5)) errors.push("Classes : bonus de recyclage du Récolteur entre 0 et 5.");
  if (!(merged.classes.scoutExpeditionTime >= 0 && merged.classes.scoutExpeditionTime < 1)) errors.push("Classes : réduction d'expédition de l'Éclaireur entre 0 et 0,99.");
  if (!(merged.colonies.defenseQueueMax >= 0 && merged.colonies.defenseQueueMax <= 20)) errors.push("Colonies : file de défense entre 0 et 20 lots.");
  if (!(merged.colonies.maxColonies >= 0 && merged.colonies.maxColonies <= (merged.colonies.levelsRequired?.length ?? 0))) errors.push("Colonies : autant de seuils de niveaux que de colonies.");
  errors.push(...validateBossSchedule("Léviathan", { weekend: merged.events.bossWeekend ?? "first", startHour: merged.leviathan.startHour ?? 18, durationHours: merged.leviathan.durationHours, dates: merged.events.bossDates ?? [] }));
  errors.push(...validateBossSchedule("Boss de saison", merged.seasonBoss));
  // 5.15 : réglages de combat du boss de saison (absents : ceux du boss mondial).
  const sbr = merged.seasonBoss;
  if (sbr.cooldownHours !== undefined && !(sbr.cooldownHours >= 0.25 && sbr.cooldownHours <= 48)) errors.push("Boss de saison : délai entre deux assauts entre 0,25 et 48 h.");
  if (sbr.flightMinutes !== undefined && !(sbr.flightMinutes >= 1 && sbr.flightMinutes <= 240)) errors.push("Boss de saison : trajet entre 1 et 240 min.");
  if (sbr.lossMult !== undefined && !(sbr.lossMult >= 0.1 && sbr.lossMult <= 5)) errors.push("Boss de saison : pertes entre 0,1 et 5.");
  if (!merged.leviathan.name?.trim()) errors.push("Léviathan : nom vide.");
  errors.push(...validateCatchupRules(merged.catchup));
  errors.push(...validateMutatorRules(merged.mutators));
  errors.push(...validateTerritoryWarRules(merged.territoryWar));
  errors.push(...validateXpTierRules(merged.xpTiers));
  errors.push(...validatePassGenRules(merged.passGen));
  errors.push(...validateChronicleGenRules(merged.chronicleGen, ARCHETYPES.map((a) => a.id)));
  // 6.14.121 (AP-L7) : registre des actions suivies (actions et familles connues, poids et quantités bornés).
  errors.push(...validateTrackedActionRules((merged as unknown as { trackedActions?: Parameters<typeof validateTrackedActionRules>[0] }).trackedActions));
  // 6.14.122 (AP-L8) : épisode « nouveauté » (quantités, bibliothèque de textes).
  errors.push(...validateNoveltyRules((merged as unknown as { novelty?: Parameters<typeof validateNoveltyRules>[0] }).novelty));
  // 6.9.0 (AU4) : commerce.
  const au = merged.auctions;
  if (!(au.minIncrement > 0 && au.minIncrement <= 1 && au.taxRate >= 0 && au.taxRate < 1)) errors.push("Enchères : surenchère entre 0 et 1, taxe entre 0 et 0,99.");
  if (!(Number.isInteger(au.maxOpenPerSeller) && au.maxOpenPerSeller >= 1 && au.watchMax >= 0 && au.historyPerLot >= 1 && au.historyMaxLots >= 1)) errors.push("Enchères : ventes ouvertes, alertes et historique ≥ 1 (entiers).");
  if (!(Array.isArray(au.durationsH) && au.durationsH.length > 0 && au.durationsH.every((h) => h > 0 && h <= 168))) errors.push("Enchères : durées entre 1 et 168 h.");
  const tc = merged.tradeContracts;
  if (!(tc.minHours >= 1 && tc.minHours <= tc.maxHours && tc.maxActive >= 1 && tc.openHours >= 1 && tc.priorityHours >= 0)) errors.push("Contrats : délais min ≤ max, contrats actifs ≥ 1.");
  if (!(merged.gifts.outsideAllianceTax >= 0 && merged.gifts.outsideAllianceTax < 1 && merged.gifts.minAccountDays >= 0)) errors.push("Cadeaux : taxe hors alliance entre 0 et 0,99, ancienneté ≥ 0.");
  if (!(merged.contests.maxPotShare > 0 && merged.contests.maxPotShare <= 1 && merged.contests.maxKept >= 1 && merged.contests.standingsSize >= 1)) errors.push("Concours : part du pot entre 0 et 1, listes ≥ 1.");
  if (!Object.values(merged.tournamentPoints).every((v) => v >= 0)) errors.push("Tournoi : points par tirage ≥ 0.");
  if (![...Object.values(merged.weeklyStock.prices), ...Object.values(merged.weeklyStock.quantities)].every((v) => v >= 1)) errors.push("Offre de la semaine : prix et exemplaires ≥ 1.");
  if (!(merged.patrons.top >= 1)) errors.push("Mécènes : au moins 1 place.");
  errors.push(...validateFixedListNumbers(merged));
  errors.push(...crossBoundErrors(merged));
  // 6.14.124 (AA6, AA-15) : effets composés des recherches et projets d'alliance (grandeur, cible, portée connues).
  const allianceUnitIds = new Set(UNITS.map((u) => u.id));
  errors.push(...validateAllianceEffects("Alliances : recherche", merged.alliances.researches, allianceUnitIds));
  errors.push(...validateAllianceEffects("Alliances : projet", merged.alliances.projects, allianceUnitIds));
  // 6.9.1 : la grille des territoires est figée (l'état des secteurs en dépend).
  const terr = merged.territories as { cols?: number; rows?: number };
  const terrDef = defaultGameContent().rules.territories as { cols?: number; rows?: number };
  if (terr.cols !== terrDef.cols || terr.rows !== terrDef.rows) errors.push(`Territoires d'alliance : la grille reste ${terrDef.cols} × ${terrDef.rows} (les secteurs en cours en dépendent).`);
  // 5.18 : combat en tours.
  const cb = merged.combat;
  if (!(cb.hpPerResistance > 0)) errors.push("Combat : points de vie par résistance > 0.");
  if (!(Number.isInteger(cb.maxRounds) && cb.maxRounds >= 1 && cb.maxRounds <= 20)) errors.push("Combat : nombre de tours entier entre 1 et 20.");
  for (const [k, label] of [["retreatAt", "retraite"], ["cautiousRetreatAt", "retraite prudente"], ["attackerWinBelow", "seuil de victoire"], ["timeoutWinMargin", "avance au dernier tour"], ["homeFleetDefenseFactor", "vaisseaux à quai"], ["riposteHomeFleet", "riposte"]] as const) {
    if (!(cb[k] >= 0 && cb[k] <= 1)) errors.push(`Combat : ${label} entre 0 et 1.`);
  }
  if (!(cb.pveHpFactor > 0 && cb.pveHpFactor <= 5)) errors.push("Combat : PV des ennemis PNJ entre 0 et 5.");
  // 5.20 : Atelier et dégâts conservés.
  if (!(cb.hullDamageShare >= 0 && cb.hullDamageShare <= 0.9)) errors.push("Combat : part des dégâts conservés entre 0 et 0,9.");
  if (!(cb.hullMaxDamage >= 0.1 && cb.hullMaxDamage <= 0.99)) errors.push("Combat : usure maximale entre 0,1 et 0,99.");
  if (!(cb.workshopHpPerSec > 0)) errors.push("Combat : cadence de l'Atelier > 0.");
  if (!(cb.workshopLevelGain >= 0 && cb.workshopLevelGain <= 5)) errors.push("Combat : gain de l'Atelier par niveau entre 0 et 5.");
  if (!(cb.workshopBaseFactor >= 0 && cb.workshopBaseFactor <= 1)) errors.push("Combat : cadence sans Atelier entre 0 et 1.");
  if (!(cb.classEdge >= 0 && cb.classEdge <= 0.9)) errors.push("Combat : avantage de classe entre 0 et 0,9.");
  if (!(cb.targetPriorityWeight >= 1 && cb.targetPriorityWeight <= 20)) errors.push("Combat : poids de la cible prioritaire entre 1 et 20.");
  if (!(cb.workshopRushSecondsPerAmber >= 1)) errors.push("Combat : tranche de secondes par Ambre d'au moins 1.");
  if (!(cb.warlordHullRepairPerHour >= 0 && cb.warlordHullRepairPerHour <= 1)) errors.push("Combat : réparation horaire des seigneurs entre 0 et 1.");
  // 5.28 : Cale sèche.
  if (!(cb.dockScrapRefund >= 0 && cb.dockScrapRefund <= 1)) errors.push("Combat : remboursement du démantèlement en Cale sèche entre 0 et 1.");
  if (!(cb.dockAutoSpeedBonus >= 0 && cb.dockAutoSpeedBonus <= 2)) errors.push("Combat : bonus de cadence de la Cale sèche entre 0 et 2.");
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
    // 6.14.106 (AE-L3, Q99) : coffre indexé sur la production ([0, 0] : bornes fixes).
    const ch = st.chest?.commonHours;
    if (ch !== undefined && (!Array.isArray(ch) || ch.length !== 2 || !(ch[0] >= 0) || !(ch[1] >= ch[0]) || !(ch[1] <= 72)))
      errors.push("Série de connexion : coffre, heures de production : 0 ≤ minimum ≤ maximum ≤ 72 ([0, 0] : bornes fixes).");
  }
  return errors;
}

/**
 * 6.14.104 (AU27, lot AA3) : chiffres des listes fixes (Comptoir, talents, spécialisations, modules, divisions, défi, mécènes,
 * offre de la semaine, barèmes) : sous-objets sans métadonnées de bornes, contrôlés ici.
 */
function validateFixedListNumbers(merged: GameRules): string[] {
  const errors: string[] = [];
  const d = defaultGameContent().rules;
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : NaN);
  const entries = (o: unknown) => Object.entries(o && typeof o === "object" ? (o as Record<string, unknown>) : {});
  for (const [id, v] of entries(merged.bountyShop.prices)) if (!(num(v) >= 1 && num(v) <= 100_000)) errors.push(`Comptoir de la Ruche : prix de « ${id} » entre 1 et 100 000 Ambre.`);
  for (const [id, v] of entries(merged.talents.perRank)) {
    const max = id === "reseau" ? 2 : 0.25;
    if (!(num(v) >= 0 && num(v) <= max)) errors.push(`Talents d'Ascension : valeur par rang de « ${id} » entre 0 et ${String(max).replace(".", ",")}.`);
  }
  for (const [id, f] of entries(merged.colonySpec.specs))
    for (const [k, v] of entries(f)) if (!(num(v) >= 0.1 && num(v) <= 5)) errors.push(`Colonies : spécialisation « ${id} », multiplicateur « ${k} » entre 0,1 et 5.`);
  const weights = entries(merged.modules.rarityWeights);
  if (weights.some(([, v]) => !(num(v) >= 0)) || !(weights.reduce((a, [, v]) => a + (num(v) || 0), 0) > 0)) errors.push("Modules de vaisseaux : poids de rareté positifs, au moins un non nul.");
  for (const [id, v] of entries(merged.modules.recycleAmber)) if (!(num(v) >= 0 && num(v) <= 10_000)) errors.push(`Modules de vaisseaux : Ambre de recyclage « ${id} » entre 0 et 10 000.`);
  for (const [fam, vals] of entries(merged.modules.familyValues)) {
    const max = fam === "voile" ? 20 : 1;
    for (const [r, v] of entries(vals)) if (!(num(v) >= 0 && num(v) <= max)) errors.push(`Modules de vaisseaux : valeur « ${fam} / ${r} » entre 0 et ${max}.`);
  }
  const tiers = entries(merged.leagues.tiers) as [string, { tokens?: unknown; placementPct?: unknown }][];
  for (const [id, t] of tiers) {
    if (!(Number.isInteger(num(t?.tokens)) && num(t?.tokens) >= 0 && num(t?.tokens) <= 100)) errors.push(`Divisions : jetons de « ${id} » entiers, entre 0 et 100.`);
    if (!(num(t?.placementPct) >= 0 && num(t?.placementPct) <= 1)) errors.push(`Divisions : part de placement de « ${id} » entre 0 et 1.`);
  }
  const placement = tiers.reduce((a, [, t]) => a + (num(t?.placementPct) || 0), 0);
  if (Math.abs(placement - 1) > 0.001) errors.push(`Divisions : les parts de placement font ${Math.round(placement * 1000) / 10} %, elles doivent faire 100 %.`);
  for (const [id, v] of entries(merged.weeklyChallenge.perActive)) if (!(num(v) > 0)) errors.push(`Défi de la semaine : objectif par joueur actif de « ${id} » plus grand que 0.`);
  const bag = num(merged.weeklyStock.tokensBag);
  if (!(Number.isInteger(bag) && bag >= 1 && bag <= 1000)) errors.push("Offre de la semaine : sac de jetons entier, entre 1 et 1 000.");
  const patronTiers = { ...d.patrons.tiers, ...(merged.patrons.tiers ?? {}) };
  const order = ["bronze", "argent", "or", "grand"] as const;
  if (!order.every((k, i) => num(patronTiers[k]) >= 1 && (i === 0 || num(patronTiers[k]) > num(patronTiers[order[i - 1]])))) errors.push("Mécènes : paliers du badge croissants (bronze < argent < or < grand), 1 Ambre au moins.");
  for (const [id, b] of entries(merged.effectPresets.budgets)) for (const [k, v] of entries(b)) if (!(num(v) >= 0)) errors.push(`Préréglages d'effets : barème « ${id} », « ${k} » positif.`);
  // 6.14.109 (AU27, AP-L5) : poids et quantités des objectifs du jour.
  const dc = merged.dailyContracts as { weights?: unknown; targets?: unknown; perDay?: unknown };
  const cw = entries(dc.weights);
  for (const [id, v] of cw) if (!(num(v) >= 0 && num(v) <= 100)) errors.push(`Objectifs du jour : poids de « ${id} » entre 0 et 100.`);
  // 6.14.121 (AP-L7) : les types du registre (porte de saut, convoi) ne comptent pas : ils ne sont proposés qu'à certains joueurs.
  const drawable = cw.filter(([id, v]) => num(v) > 0 && actionOfContract(id) === null).length;
  if (cw.length > 0 && drawable < (num(dc.perDay) || 1)) errors.push(`Objectifs du jour : au moins ${num(dc.perDay) || 1} types de poids non nul (un par objectif du jour), ${drawable} aujourd'hui.`);
  for (const [id, v] of entries(dc.targets)) if (!(Number.isInteger(num(v)) && num(v) >= 1 && num(v) <= 10_000)) errors.push(`Objectifs du jour : quantité de « ${id} » entière, entre 1 et 10 000.`);
  // 6.14.117 (É30-6) : rythme des succès, un facteur par mesure connue, entre 1 et 1 000.
  for (const [id, v] of entries((merged.achievementPace as { scales?: unknown }).scales)) {
    if (!(id in METRICS)) errors.push(`Rythme des succès : mesure inconnue « ${id} ».`);
    else if (!(num(v) >= 1 && num(v) <= 1000)) errors.push(`Rythme des succès : facteur de « ${id} » entre 1 et 1 000.`);
  }
  return errors;
}

/**
 * 6.14.104 (AU27, AA3, Q260) : bornes croisées entre deux champs d'un même groupe (minimum ≤ maximum, seuils dans l'ordre).
 * `strict` : le premier doit être strictement inférieur au second.
 */
export const CROSS_BOUNDS: { group: string; low: string; high: string; strict?: boolean }[] = [
  { group: "warlords", low: "travelMinHours", high: "travelMaxHours" },
  { group: "chatRooms", low: "nameMin", high: "nameMax" },
  { group: "rename", low: "minLength", high: "maxLength" },
  { group: "bossPhases", low: "shieldPct", high: "ripostePct", strict: true },
  { group: "patrol", low: "minMinutes", high: "maxMinutes" },
  { group: "expeditions", low: "depositMinHours", high: "depositMaxHours" },
  { group: "expeditions", low: "rareMinHours", high: "rareMaxHours" },
  { group: "expeditions", low: "wreckMinPct", high: "wreckMaxPct" },
  { group: "expeditions", low: "ambushMinPower", high: "ambushMaxPower" },
  { group: "expeditions", low: "forceMinPower", high: "forceMaxPower" },
  { group: "jumpGate", low: "cooldownMinHours", high: "cooldownHours" },
  { group: "phalanx", low: "scanCooldownMinMinutes", high: "scanCooldownMinutes" },
  { group: "unitAudit", low: "weakBelow", high: "strongAbove", strict: true },
  { group: "unitAudit", low: "strongAbove", high: "endgameStrongAbove" },
  { group: "unitAudit", low: "pvpAttackLow", high: "pvpAttackHigh", strict: true },
];

function crossBoundErrors(merged: GameRules): string[] {
  const errors: string[] = [];
  const all = merged as unknown as Record<string, Record<string, unknown>>;
  for (const { group, low, high, strict } of CROSS_BOUNDS) {
    const g = all[group];
    const a = g?.[low];
    const b = g?.[high];
    if (typeof a !== "number" || typeof b !== "number" || !Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (strict ? a < b : a <= b) continue;
    const label = RULE_GROUP_LABELS[group] ?? group;
    const name = (k: string) => `« ${ruleFieldMeta(group, k)?.label ?? k} » (${k})`;
    errors.push(`${label} : ${name(low)} doit être ${strict ? "inférieur à" : "inférieur ou égal à"} ${name(high)}.`);
  }
  return errors;
}

function mergeRulesForCheck(rules: Partial<GameRules>): GameRules {
  const d = defaultGameContent().rules;
  const out = { ...d } as Record<string, unknown>;
  for (const [k, v] of Object.entries(rules))
    if (v && typeof v === "object" && !Array.isArray(v)) out[k] = k in REGISTERED_RULES ? mergeRuleGroup((d as unknown as Record<string, unknown>)[k], v) : { ...(d as unknown as Record<string, object>)[k], ...v };
  return out as unknown as GameRules;
}

const ID_PATTERN = /^[A-Za-z0-9_]+$/;

/** Liste des erreurs bloquantes : identifiants en double, références vers
 *  un élément inexistant, valeurs impossibles. Vide = contenu valide. */
export function validateGameContent(content: GameContent): string[] {
  const errors: string[] = [];
  // 6.14.59 (AA1) : une section de liste qui n'est pas une liste rend le reste illisible.
  const LIST_SECTIONS: [keyof GameContent, string][] = [["buildings", "Bâtiments"], ["units", "Unités"], ["technologies", "Technologies"], ["missions", "Missions"], ["relics", "Reliques"]];
  for (const [key, label] of LIST_SECTIONS) if (content[key] !== undefined && !Array.isArray(content[key])) errors.push(`${label} : la section doit être une liste.`);
  if (errors.length > 0) return errors;
  // 6.14.59 (AA1) : chaque définition garde la forme des définitions par défaut (nombres finis, champs chiffrés présents).
  const defaults = defaultGameContent();
  errors.push(...listShapeErrors("Bâtiments", "Bâtiment", content.buildings, defaults.buildings));
  errors.push(...listShapeErrors("Unités", "Unité", content.units, defaults.units));
  errors.push(...listShapeErrors("Technologies", "Techno", content.technologies, defaults.technologies));
  if (content.relics !== undefined) errors.push(...listShapeErrors("Reliques", "Relique", content.relics, defaults.relics));
  // 6.14.122 (AP-L8) : date d'ajout d'une unité, techno ou bâtiment (épisode « nouveauté »).
  for (const [label, list] of [["Unité", content.units], ["Techno", content.technologies], ["Bâtiment", content.buildings]] as const)
    for (const d of (list ?? []) as { id?: string; addedOn?: unknown }[]) {
      const e = addedOnError(d?.addedOn);
      if (e) errors.push(`${label} ${d?.id ?? "?"} : ${e}.`);
    }
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
    if (b.effect?.type === "dock" && !(b.effect.perLevel >= 0 && (b.effect.orbitalRepair ?? 0) >= 0 && (b.effect.orbitalRepair ?? 0) <= 0.5)) errors.push(`${label} : Cale sèche invalide (postes ≥ 0, Cale orbitale entre 0 et 0,5).`);
    if (b.requires && !(content.buildings.some((o) => o.id === b.requires!.building) && b.requires.level >= 1)) errors.push(`${label} : bâtiment requis inconnu ou niveau < 1.`);
  }
  if (!content.buildings.some((b) => b.startsUnlocked)) errors.push("Au moins un bâtiment doit être débloqué dès le départ.");

  checkIds("Unités", content.units.map((u) => u.id));
  for (const u of content.units) {
    const label = `Unité ${u.name || u.id}`;
    if (!u.blueprint && !u.elite && !u.empireClass && !techIds.has(u.unlockTech)) errors.push(`${label} : techno de déblocage « ${u.unlockTech} » inexistante.`);
    if (u.category !== "attack" && u.category !== "defense") errors.push(`${label} : catégorie invalide.`);
    if (!(u.hangarSpace >= 1)) errors.push(`${label} : places de hangar doit être ≥ 1.`);
    if (u.levelBonus !== undefined && !(u.levelBonus >= 0)) errors.push(`${label} : gain par niveau invalide.`);
    checkResources(`${label} (coût)`, u.cost as Record<string, number>);
    // 6.14.123 (AA5) : rôles connus seulement (une liste vide est permise : aucun rôle).
    if (u.roles !== undefined) {
      if (!Array.isArray(u.roles)) errors.push(`${label} : rôles invalides (liste attendue).`);
      else for (const r of u.roles) if (!UNIT_ROLE_IDS.includes(r)) errors.push(`${label} : rôle « ${r} » inconnu.`);
    }
  }

  checkIds("Technologies", content.technologies.map((t) => t.id));
  for (const t of content.technologies) {
    const label = `Techno ${t.nom || t.id}`;
    if (t.effects && t.effects.length > 0) {
      for (const e of t.effects) errors.push(...validateTechEffect(label, e, { resources, unitIds, buildingIds: new Set(content.buildings.map((b) => b.id)), maxLevel: t.maxLevel, unitMaxLevel: (id) => content.units.find((u) => u.id === id)?.maxLevel }));
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

/** 6.14.59 (AA1) : libellés des sections de contenu (messages de refus du serveur). */
export const CONTENT_SECTION_LABELS: Record<ContentSection, string> = {
  buildings: "Bâtiments",
  units: "Unités",
  technologies: "Technologies",
  missions: "Missions",
  factions: "Factions",
  ranks: "Rangs",
  achievements: "Succès",
  rules: "Règles",
  warlords: "Seigneurs de guerre",
  seasonPass: "Passe de saison",
  chronicles: "Chroniques",
  passSeasons: "Passes générés",
  relics: "Reliques",
  relicSettings: "Réglages des reliques",
  titles: "Titres",
  worldBosses: "Boss mondiaux",
  officers: "Officiers",
};

/**
 * 6.14.59 (AU27, lot AA1 : garde-fous, constats AA-25 et AA-26) : erreurs **nouvelles** qu'apporterait l'enregistrement
 * de `data` dans la section `section`, par rapport au contenu enregistré `stored` (game_config, sections brutes).
 *
 * - Le contenu est fusionné avec les défauts sans être appliqué (`resolveGameContent`, pur) ; les règles restent brutes
 *   (`validateRules` vérifie le type de chaque valeur saisie avant toute fusion).
 * - Seules les erreurs absentes du contenu actuel sont rendues : une erreur ancienne, enregistrée avant ce garde-fou,
 *   ne bloque pas l'admin qui corrige une autre section (le plus prudent pour un serveur en service).
 * - Une section illisible (pas une liste, JSON qui fait planter la fusion) est refusée avec son nom.
 *
 * Appelée par le serveur (`guardContentConfig`, cosmic_db.js) à chaque création ou modification de `game_config`.
 */
export function contentSectionErrors(section: string, data: unknown, stored: Partial<GameContent>): string[] {
  if (!(CONTENT_SECTIONS as string[]).includes(section)) return [];
  const label = CONTENT_SECTION_LABELS[section as ContentSection] ?? section;
  const check = (overrides: Partial<GameContent>): string[] => {
    try {
      const content = resolveGameContent(overrides);
      content.rules = (overrides.rules ?? {}) as GameRules;
      return validateGameContent(content);
    } catch (err) {
      return [`${label} : contenu illisible (${String((err as Error)?.message ?? err)}).`];
    }
  };
  if (data === null || data === undefined || typeof data !== "object") return [`${label} : contenu illisible (une liste ou un objet est attendu).`];
  const defaultValue = (defaultGameContent() as unknown as Record<string, unknown>)[section];
  if (Array.isArray(defaultValue) !== Array.isArray(data)) return [`${label} : la section doit être ${Array.isArray(defaultValue) ? "une liste" : "un objet"}.`];
  const before = check(stored);
  const after = check({ ...stored, [section]: data } as Partial<GameContent>);
  return after.filter((e) => !before.includes(e));
}

/**
 * 6.14.59 (AA1, Q75) : avertissements **non bloquants** de l'onglet Règles : un nombre qui s'écarte de plus de ×2 (ou ÷2)
 * de sa valeur par défaut. L'admin peut enregistrer ; il voit seulement ce qui mérite un second regard.
 */
export function ruleDriftWarnings(rules: Partial<GameRules> | null | undefined): string[] {
  if (!rules || typeof rules !== "object") return [];
  const defaults = defaultGameContent().rules as unknown as Record<string, unknown>;
  const out: string[] = [];
  for (const [group, value] of Object.entries(rules as Record<string, unknown>)) {
    if (!(group in defaults)) continue;
    out.push(...driftWarnings(RULE_GROUP_LABELS[group] ?? group, value, defaults[group]));
  }
  return out;
}
