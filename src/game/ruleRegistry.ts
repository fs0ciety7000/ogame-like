import { ACHIEVEMENT_HINT_RULES, ACHIEVEMENT_HINT_RULES_META, ACHIEVEMENT_LIST_RULES, ACHIEVEMENT_LIST_RULES_META, ACHIEVEMENT_PACE_RULES, ACHIEVEMENT_PACE_RULES_META, ACHIEVEMENT_TOKENS, ACHIEVEMENT_TOKENS_META, CONTENT_ACHIEVEMENT_RULES, CONTENT_ACHIEVEMENT_RULES_META, TIER_REWARDS, TIER_REWARDS_META } from "@/game/achievements";
import { TEMPLATE_RULES, TEMPLATE_RULES_META } from "@/game/actionTemplates";
import { ALLIANCE_CHALLENGE_RULES, ALLIANCE_CHALLENGE_RULES_META } from "@/game/allianceChallenge";
import { ALLIANCE_DAILY_RULES, ALLIANCE_DAILY_RULES_META } from "@/game/allianceDaily";
import { ALLIANCE_PROFILE_RULES, ALLIANCE_PROFILE_RULES_META } from "@/game/allianceProfile";
import { ALLIANCE_SAGA_RULES, ALLIANCE_SAGA_RULES_META } from "@/game/allianceSaga";
import { ASCENSION_RULES, ASCENSION_RULES_META } from "@/game/ascension";
import { BALANCE_HEALTH_RULES, BALANCE_HEALTH_RULES_META } from "@/game/balance/healthRules";
import { BOUNTY_RULES, BOUNTY_RULES_META, BOUNTY_SHOP_RULES, BOUNTY_SHOP_RULES_META, ELITE_RULES, ELITE_RULES_META } from "@/game/bounties";
import { BUILD_PLAN_RULES, BUILD_PLAN_RULES_META } from "@/game/buildPlan";
import { BUILDING_UNLOCK_COST, buildingUnlockCostMeta, DOCK_TIERS, DOCK_TIERS_META } from "@/game/buildings";
import { CANCEL_RULES, CANCEL_RULES_META } from "@/game/cancel";
import { CHALLENGE_RULES, CHALLENGE_RULES_META } from "@/game/challenges";
import { COALITION_RULES, COALITION_RULES_META } from "@/game/coalition";
import { COLONY_SPEC_RULES, COLONY_SPEC_RULES_META, DEPOSIT_RULES, DEPOSIT_RULES_META } from "@/game/colonies";
import { COMMANDER_XP, COMMANDER_XP_META, OFFICER_TUNING_RULES, OFFICER_TUNING_RULES_META } from "@/game/commanders";
import { CONTRACT_RULES, CONTRACT_RULES_META } from "@/game/contracts";
import { DAILY_RULES, DAILY_RULES_META } from "@/game/dailyMissions";
import { DIPLOMACY_RULES, DIPLOMACY_RULES_META } from "@/game/diplomacy";
import { EFFECT_CAP_RULES, EFFECT_CAP_RULES_META } from "@/game/effects";
import { EFFECT_PRESET_RULES, EFFECT_PRESET_RULES_META } from "@/game/effectCatalog";
import { BOSS_REMINDERS, BOSS_REMINDERS_META } from "@/game/events";
import { GAZETTE_RULES, GAZETTE_RULES_META } from "@/game/gazette";
import { EXCHANGE_RULES, EXCHANGE_RULES_META } from "@/game/resources";
import { COLONY_BASE_RULES, COLONY_BASE_RULES_META } from "@/game/fleets";
import { MOON_RULES, MOON_RULES_META } from "@/game/moon";
import { NAV_UNLOCK_RULES, NAV_UNLOCK_RULES_META } from "@/game/navUnlock";
import { PHALANX_RULES, PHALANX_RULES_META } from "@/game/phalanx";
import { PRESTIGE_RULES, PRESTIGE_RULES_META } from "@/game/prestige";
import { JUMP_GATE_RULES, JUMP_GATE_RULES_META } from "@/game/jumpGate";
import { RESEARCH_RULES, RESEARCH_RULES_META } from "@/game/technologies";
import { RHYTHM_RULES, RHYTHM_RULES_META } from "@/game/rhythm";
import { SERVER_TASK_RULES, SERVER_TASK_RULES_META } from "@/game/serverTasks";
import { CHAT_ROOM_RULES, CHAT_ROOM_RULES_META, GLOBAL_CHAT_RULES, GLOBAL_CHAT_RULES_META, MENTION_RULES, MENTION_RULES_META, ROOM_EVENT_RULES, ROOM_EVENT_RULES_META } from "@/game/globalChat";
import { GOAL_RULES, GOAL_RULES_META } from "@/game/goals";
import { LEAGUE_RULES, LEAGUE_RULES_META } from "@/game/leagues";
import { BOSS_PHASE_RULES, BOSS_PHASE_RULES_META } from "@/game/leviathan";
import { MARKET_HISTORY_RULES, MARKET_HISTORY_RULES_META } from "@/game/marketHistory";
import { MESSAGE_RULES, MESSAGE_RULES_META } from "@/game/messages";
import { MISSION_XP_RULES, MISSION_XP_RULES_META } from "@/game/missions";
import { PASS_REWARD_RULES, PASS_REWARD_RULES_META } from "@/game/passSeasons";
import { MODULE_BUILD_COST, MODULE_BUILD_COST_META, MODULE_RULES, MODULE_RULES_META } from "@/game/modules";
import { TREATY_RULES, TREATY_RULES_META } from "@/game/pirates";
import { POLL_RULES, POLL_RULES_META } from "@/game/polls";
import { ACHIEVEMENT_GEN_RULES, ACHIEVEMENT_GEN_RULES_META, BASE_COUNTS, BASE_COUNTS_META } from "@/game/procedural";
import { PROFILE_RULES, PROFILE_RULES_META } from "@/game/profile";
import { REFERRAL_RULES, REFERRAL_RULES_META } from "@/game/referral";
import { RENAME_RULES, RENAME_RULES_META } from "@/game/rename";
import { REPORT_RULES, REPORT_RULES_META } from "@/game/reports";
import { PASS_BONUS_RULES, PASS_BONUS_RULES_META, PASS_OVERFLOW, PASS_OVERFLOW_META } from "@/game/seasonPass";
import { SEASON_WAR_RULES, SEASON_WAR_RULES_META, WAR_CHEST_RULES, WAR_CHEST_RULES_META } from "@/game/seasonWars";
import { TUTORIAL_RAID, TUTORIAL_RAID_META } from "@/game/story";
import { SYNTH_RULES, SYNTH_RULES_META } from "@/game/synthesis";
import { TALENT_RULES, TALENT_RULES_META } from "@/game/talents";
import { TERRITORY_RULES, TERRITORY_RULES_META } from "@/game/territories";
import { UNIT_AUDIT_RULES, UNIT_AUDIT_RULES_META } from "@/game/unitClasses";
import { VACATION_RULES, VACATION_RULES_META } from "@/game/vacation";
import { WARLORD_RULES, WARLORD_RULES_META } from "@/game/warlords";
import { WORLD_BOSS_RULES, WORLD_BOSS_RULES_META } from "@/game/worldBosses";
import { TRACKED_ACTION_RULES, TRACKED_ACTION_RULES_META } from "@/game/trackedActions";
import { NOVELTY_RULES, NOVELTY_RULES_META } from "@/game/novelty";
import { ACHIEVEMENT_XP_ALERT, ACHIEVEMENT_XP_ALERT_META } from "@/game/xpAudit";
import { HISTORICAL_RULES_META, type RuleFieldMeta } from "@/game/ruleMeta";

/* =====================================================
   6.9.1 : registre des réglages (règle n° 2). Chaque objet de règles du
   moteur déclaré ici devient un groupe de GameRules : valeurs par défaut,
   fusion (sous-objets champ par champ), application et validation de type
   dans content.ts, édition dans Admin → Règles → Tous les réglages.
   `target` est un accesseur : rien n'est lu au chargement du module
   (CLAUDE.md, initialisation des modules).
   6.14.95 (AA2) : `meta` relie les métadonnées de chaque champ (libellé,
   unité, bornes, aide), déclarées à côté de l'objet (`X_RULES_META`) ;
   `ruleRegistry.test.ts` exige un libellé pour chaque champ et des défauts
   dans leurs bornes.
   Un nouvel objet `*_RULES` du moteur entre ici (ou dans un groupe dédié
   de content.ts) : `ruleRegistry.test.ts` échoue sinon.
===================================================== */

export interface RegisteredRules {
  label: string;
  target: () => object;
  /** Métadonnées des champs de premier niveau (lues à l'usage, comme `target`). */
  meta: () => Readonly<Record<string, RuleFieldMeta>>;
}

export const REGISTERED_RULES = {
  achievementTokens: { label: "Succès : jetons par palier", target: () => ACHIEVEMENT_TOKENS, meta: () => ACHIEVEMENT_TOKENS_META },
  achievementTierRewards: { label: "Succès : XP et production par palier", target: () => TIER_REWARDS, meta: () => TIER_REWARDS_META },
  achievementXpAlert: { label: "Anti-abus : XP des succès", target: () => ACHIEVEMENT_XP_ALERT, meta: () => ACHIEVEMENT_XP_ALERT_META },
  actionTemplates: { label: "File d'actions : modèles", target: () => TEMPLATE_RULES, meta: () => TEMPLATE_RULES_META },
  allianceChallenge: { label: "Alliance : défi de la semaine (podium)", target: () => ALLIANCE_CHALLENGE_RULES, meta: () => ALLIANCE_CHALLENGE_RULES_META },
  allianceDaily: { label: "Alliance : objectif du jour", target: () => ALLIANCE_DAILY_RULES, meta: () => ALLIANCE_DAILY_RULES_META },
  allianceProfile: { label: "Alliance : fiche, rangs et candidatures", target: () => ALLIANCE_PROFILE_RULES, meta: () => ALLIANCE_PROFILE_RULES_META },
  allianceSaga: { label: "Alliance : saga", target: () => ALLIANCE_SAGA_RULES, meta: () => ALLIANCE_SAGA_RULES_META },
  ascension: { label: "Ascension", target: () => ASCENSION_RULES, meta: () => ASCENSION_RULES_META },
  // 6.14.107 (AU27, AE-L4) : seuils d'alerte de la santé de l'équilibre (aucun effet en jeu).
  balanceHealth: { label: "Équilibrage : seuils d'alerte de la santé", target: () => BALANCE_HEALTH_RULES, meta: () => BALANCE_HEALTH_RULES_META },
  bossPhases: { label: "Boss : phases (riposte, bouclier, faiblesse)", target: () => BOSS_PHASE_RULES, meta: () => BOSS_PHASE_RULES_META },
  bossReminders: { label: "Boss : rappels (veille, fin)", target: () => BOSS_REMINDERS, meta: () => BOSS_REMINDERS_META },
  bounties: { label: "Primes Kesh'Vaar", target: () => BOUNTY_RULES, meta: () => BOUNTY_RULES_META },
  bountyShop: { label: "Comptoir de la Ruche", target: () => BOUNTY_SHOP_RULES, meta: () => BOUNTY_SHOP_RULES_META },
  buildPlan: { label: "File planifiée des bâtiments", target: () => BUILD_PLAN_RULES, meta: () => BUILD_PLAN_RULES_META },
  buildingUnlockCost: { label: "Bâtiments : coût de déblocage", target: () => BUILDING_UNLOCK_COST, meta: buildingUnlockCostMeta },
  cancel: { label: "Annulation des chantiers", target: () => CANCEL_RULES, meta: () => CANCEL_RULES_META },
  chapterBaseCounts: { label: "Chroniques : quantités de base des objectifs", target: () => BASE_COUNTS, meta: () => BASE_COUNTS_META },
  chatRooms: { label: "Salons", target: () => CHAT_ROOM_RULES, meta: () => CHAT_ROOM_RULES_META },
  coalition: { label: "Coalitions de seigneurs", target: () => COALITION_RULES, meta: () => COALITION_RULES_META },
  colonyDeposits: { label: "Colonies : gisements", target: () => DEPOSIT_RULES, meta: () => DEPOSIT_RULES_META },
  colonySpec: { label: "Colonies : spécialisation", target: () => COLONY_SPEC_RULES, meta: () => COLONY_SPEC_RULES_META },
  colonyBase: { label: "Colonies : flotte basée", target: () => COLONY_BASE_RULES, meta: () => COLONY_BASE_RULES_META },
  moon: { label: "Lunes : naissance, bonus et pitié", target: () => MOON_RULES, meta: () => MOON_RULES_META },
  // 6.14.74 (DP-L1, proposals/deblocage-progressif.md) : ouverture progressive du menu (I30).
  navUnlock: { label: "Ouverture du menu (comptes neufs)", target: () => NAV_UNLOCK_RULES, meta: () => NAV_UNLOCK_RULES_META },
  // 6.14.44 (É30-1a, proposals/phalange-porte-de-saut.md §5.4).
  phalanx: { label: "Lunes : phalange", target: () => PHALANX_RULES, meta: () => PHALANX_RULES_META },
  jumpGate: { label: "Lunes : porte de saut", target: () => JUMP_GATE_RULES, meta: () => JUMP_GATE_RULES_META },
  passRewards: { label: "Passe généré : dernier palier et effort", target: () => PASS_REWARD_RULES, meta: () => PASS_REWARD_RULES_META },
  achievementHint: { label: "Succès : prix d'un indice", target: () => ACHIEVEMENT_HINT_RULES, meta: () => ACHIEVEMENT_HINT_RULES_META },
  // 6.14.56 (AU27, AP-1) : succès du code retirés exprès (les autres succès par défaut absents de la liste sont complétés).
  achievementList: { label: "Succès : succès par défaut retirés", target: () => ACHIEVEMENT_LIST_RULES, meta: () => ACHIEVEMENT_LIST_RULES_META },
  // 6.14.108 (AU27, AP-L4) : paliers de succès générés bridés (détenteurs minimum, un par mesure et par mois, plafond, titre).
  achievementGen: { label: "Succès : paliers générés (rythme et plafond)", target: () => ACHIEVEMENT_GEN_RULES, meta: () => ACHIEVEMENT_GEN_RULES_META },
  achievementPace: { label: "Succès : rythme (seuils en jeu des succès de volume)", target: () => ACHIEVEMENT_PACE_RULES, meta: () => ACHIEVEMENT_PACE_RULES_META },
  // 6.14.129 (AJ27-6) : succès dérivés par unité et par bâtiment (seuils, palier, récompense, textes, activation).
  contentAchievements: { label: "Succès : par unité et par bâtiment", target: () => CONTENT_ACHIEVEMENT_RULES, meta: () => CONTENT_ACHIEVEMENT_RULES_META },
  passBonus: { label: "Passe : paliers bonus après le dernier palier", target: () => PASS_BONUS_RULES, meta: () => PASS_BONUS_RULES_META },
  missionXp: { label: "Missions : XP suggérée par heure (éditeur)", target: () => MISSION_XP_RULES, meta: () => MISSION_XP_RULES_META },
  commanderXp: { label: "Officiers : XP par action", target: () => COMMANDER_XP, meta: () => COMMANDER_XP_META },
  dailyContracts: { label: "Objectifs du jour", target: () => CONTRACT_RULES, meta: () => CONTRACT_RULES_META },
  dailyMissions: { label: "Missions du jour", target: () => DAILY_RULES, meta: () => DAILY_RULES_META },
  diplomacy: { label: "Diplomatie", target: () => DIPLOMACY_RULES, meta: () => DIPLOMACY_RULES_META },
  dockTiers: { label: "Cale sèche : paliers de niveau", target: () => DOCK_TIERS, meta: () => DOCK_TIERS_META },
  effectCaps: { label: "Bonus : plafonds par grandeur (techno, empire)", target: () => EFFECT_CAP_RULES, meta: () => EFFECT_CAP_RULES_META },
  // 6.14.104 (AU27, lot AA3, AA-13) : barèmes des préréglages d'effets (aide à l'édition, aucun effet en jeu).
  effectPresets: { label: "Préréglages d'effets : barèmes suggérés", target: () => EFFECT_PRESET_RULES, meta: () => EFFECT_PRESET_RULES_META },
  eliteBounty: { label: "Proie d'élite", target: () => ELITE_RULES, meta: () => ELITE_RULES_META },
  exchange: { label: "Comptoir d'échange : taux et taxe", target: () => EXCHANGE_RULES, meta: () => EXCHANGE_RULES_META },
  gazette: { label: "Gazette", target: () => GAZETTE_RULES, meta: () => GAZETTE_RULES_META },
  globalChat: { label: "Canal global", target: () => GLOBAL_CHAT_RULES, meta: () => GLOBAL_CHAT_RULES_META },
  goals: { label: "Objectifs personnels", target: () => GOAL_RULES, meta: () => GOAL_RULES_META },
  leagues: { label: "Divisions", target: () => LEAGUE_RULES, meta: () => LEAGUE_RULES_META },
  marketHistory: { label: "Marché : historique des prix", target: () => MARKET_HISTORY_RULES, meta: () => MARKET_HISTORY_RULES_META },
  mentions: { label: "Mentions", target: () => MENTION_RULES, meta: () => MENTION_RULES_META },
  messages: { label: "Messagerie privée", target: () => MESSAGE_RULES, meta: () => MESSAGE_RULES_META },
  moduleCost: { label: "Modules : coût de fabrication", target: () => MODULE_BUILD_COST, meta: () => MODULE_BUILD_COST_META },
  modules: { label: "Modules de vaisseaux", target: () => MODULE_RULES, meta: () => MODULE_RULES_META },
  // 6.14.122 (AU27, AP-L8) : épisode « nouveauté » des Chroniques générées (fréquence, durée, quantités, bibliothèque de textes).
  novelty: { label: "Chroniques : épisode « nouveauté » (contenu récent)", target: () => NOVELTY_RULES, meta: () => NOVELTY_RULES_META },
  officerTuning: { label: "Officiers : second rôle des commandants de saison, Phéromone", target: () => OFFICER_TUNING_RULES, meta: () => OFFICER_TUNING_RULES_META },
  passOverflow: { label: "Passe : points en trop convertis en Ambre", target: () => PASS_OVERFLOW, meta: () => PASS_OVERFLOW_META },
  polls: { label: "Sondages", target: () => POLL_RULES, meta: () => POLL_RULES_META },
  // 6.14.85 (RL-2, proposals/rythme-long-terme.md §5.2) : projets de prestige.
  prestige: { label: "Projets de prestige", target: () => PRESTIGE_RULES, meta: () => PRESTIGE_RULES_META },
  profile: { label: "Profil", target: () => PROFILE_RULES, meta: () => PROFILE_RULES_META },
  referral: { label: "Parrainage", target: () => REFERRAL_RULES, meta: () => REFERRAL_RULES_META },
  research: { label: "Labo : recherches en parallèle, croissance des coûts et durées, recherche tardive", target: () => RESEARCH_RULES, meta: () => RESEARCH_RULES_META },
  // 6.14.88 (RL-3, proposals/rythme-long-terme.md §5) : bascule datée du rythme (rhythm.ts).
  rhythm: { label: "Rythme sur des mois : bascule datée (second palier, recherche, Ascension, comptoir, missions, lune)", target: () => RHYTHM_RULES, meta: () => RHYTHM_RULES_META },
  rename: { label: "Changement de pseudo", target: () => RENAME_RULES, meta: () => RENAME_RULES_META },
  reports: { label: "Signalements", target: () => REPORT_RULES, meta: () => REPORT_RULES_META },
  roomEvents: { label: "Événements de salon", target: () => ROOM_EVENT_RULES, meta: () => ROOM_EVENT_RULES_META },
  // 6.14.111 (AU27, AC-E) : tâches planifiées (verrou par cadence, e-mails par lots, flottes, maintenance).
  serverTasks: { label: "Serveur : tâches planifiées (verrou, e-mails par lots, flottes, maintenance)", target: () => SERVER_TASK_RULES, meta: () => SERVER_TASK_RULES_META },
  seasonWars: { label: "Guerres de saison", target: () => SEASON_WAR_RULES, meta: () => SEASON_WAR_RULES_META },
  synthesis: { label: "Labo de synthèse", target: () => SYNTH_RULES, meta: () => SYNTH_RULES_META },
  talents: { label: "Talents d'Ascension", target: () => TALENT_RULES, meta: () => TALENT_RULES_META },
  // 6.14.121 (AU27, AP-L7) : registre des actions suivies (poids dans les tirages, familles par contenu, seuil des actions mesurées).
  trackedActions: { label: "Objectifs générés : actions suivies (registre)", target: () => TRACKED_ACTION_RULES, meta: () => TRACKED_ACTION_RULES_META },
  territories: { label: "Territoires d'alliance", target: () => TERRITORY_RULES, meta: () => TERRITORY_RULES_META },
  treaties: { label: "Traités avec les factions", target: () => TREATY_RULES, meta: () => TREATY_RULES_META },
  tutorialRaid: { label: "Tutoriel : raid de Varan", target: () => TUTORIAL_RAID, meta: () => TUTORIAL_RAID_META },
  unitAudit: { label: "Équilibrage : seuils de l'audit des unités", target: () => UNIT_AUDIT_RULES, meta: () => UNIT_AUDIT_RULES_META },
  vacation: { label: "Mode vacances", target: () => VACATION_RULES, meta: () => VACATION_RULES_META },
  warChest: { label: "Coffre de guerre", target: () => WAR_CHEST_RULES, meta: () => WAR_CHEST_RULES_META },
  warlords: { label: "Seigneurs de guerre", target: () => WARLORD_RULES, meta: () => WARLORD_RULES_META },
  weeklyChallenge: { label: "Défi de la semaine", target: () => CHALLENGE_RULES, meta: () => CHALLENGE_RULES_META },
  worldBossRotation: { label: "Boss mondiaux : rotation", target: () => WORLD_BOSS_RULES, meta: () => WORLD_BOSS_RULES_META },
} satisfies Record<string, RegisteredRules>;

export type RegisteredGroupId = keyof typeof REGISTERED_RULES;
export type RegisteredRuleGroups = { [K in RegisteredGroupId]: Record<string, unknown> };

const isPlain = (x: unknown): x is Record<string, unknown> => !!x && typeof x === "object" && !Array.isArray(x);

/** Fusion profonde : les objets champ par champ, les listes et valeurs remplacées. */
export function mergeRuleGroup(defaults: unknown, override: unknown): unknown {
  if (!isPlain(defaults) || !isPlain(override)) return override === undefined ? structuredClone(defaults) : structuredClone(override);
  const out: Record<string, unknown> = structuredClone(defaults);
  for (const [k, v] of Object.entries(override)) if (v !== undefined) out[k] = k in defaults ? mergeRuleGroup(defaults[k], v) : structuredClone(v);
  return out;
}

/** Valeurs actuelles de chaque groupe déclaré (copie). */
export function registeredRuleSnapshot(): RegisteredRuleGroups {
  return Object.fromEntries(Object.entries(REGISTERED_RULES).map(([k, r]) => [k, structuredClone(r.target())])) as RegisteredRuleGroups;
}

/** Écrit les valeurs fusionnées dans les objets du moteur. */
export function applyRegisteredRules(groups: Partial<RegisteredRuleGroups>): void {
  for (const [k, r] of Object.entries(REGISTERED_RULES)) {
    const v = groups[k as RegisteredGroupId];
    if (isPlain(v)) Object.assign(r.target(), structuredClone(v));
  }
}

/** 6.14.95 (AA2) : métadonnées d'un groupe (registre, ou table des groupes historiques de content.ts). */
export function ruleGroupMeta(group: string): Readonly<Record<string, RuleFieldMeta>> {
  const r = (REGISTERED_RULES as Record<string, RegisteredRules>)[group];
  return r ? r.meta() : (HISTORICAL_RULES_META[group] ?? {});
}

/** 6.14.95 (AA2) : métadonnées d'un champ de premier niveau (undefined : aucune). */
export function ruleFieldMeta(group: string, key: string): RuleFieldMeta | undefined {
  const m = ruleGroupMeta(group);
  return Object.prototype.hasOwnProperty.call(m, key) ? m[key] : undefined;
}
