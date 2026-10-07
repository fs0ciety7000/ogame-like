import { ACHIEVEMENT_HINT_RULES, ACHIEVEMENT_LIST_RULES, ACHIEVEMENT_TOKENS, TIER_REWARDS } from "@/game/achievements";
import { TEMPLATE_RULES } from "@/game/actionTemplates";
import { ALLIANCE_CHALLENGE_RULES } from "@/game/allianceChallenge";
import { ALLIANCE_DAILY_RULES } from "@/game/allianceDaily";
import { ALLIANCE_PROFILE_RULES } from "@/game/allianceProfile";
import { ALLIANCE_SAGA_RULES } from "@/game/allianceSaga";
import { ASCENSION_RULES } from "@/game/ascension";
import { BOUNTY_RULES, BOUNTY_SHOP_RULES, ELITE_RULES } from "@/game/bounties";
import { BUILD_PLAN_RULES } from "@/game/buildPlan";
import { BUILDING_UNLOCK_COST, DOCK_TIERS } from "@/game/buildings";
import { CANCEL_RULES } from "@/game/cancel";
import { CHALLENGE_RULES } from "@/game/challenges";
import { COALITION_RULES } from "@/game/coalition";
import { COLONY_SPEC_RULES, DEPOSIT_RULES } from "@/game/colonies";
import { COMMANDER_XP, OFFICER_TUNING_RULES } from "@/game/commanders";
import { CONTRACT_RULES } from "@/game/contracts";
import { DAILY_RULES } from "@/game/dailyMissions";
import { DIPLOMACY_RULES } from "@/game/diplomacy";
import { EFFECT_CAP_RULES } from "@/game/effects";
import { BOSS_REMINDERS } from "@/game/events";
import { GAZETTE_RULES } from "@/game/gazette";
import { EXCHANGE_RULES } from "@/game/resources";
import { COLONY_BASE_RULES } from "@/game/fleets";
import { MOON_RULES } from "@/game/moon";
import { NAV_UNLOCK_RULES } from "@/game/navUnlock";
import { PHALANX_RULES } from "@/game/phalanx";
import { PRESTIGE_RULES } from "@/game/prestige";
import { JUMP_GATE_RULES } from "@/game/jumpGate";
import { RESEARCH_RULES } from "@/game/technologies";
import { CHAT_ROOM_RULES, GLOBAL_CHAT_RULES, MENTION_RULES, ROOM_EVENT_RULES } from "@/game/globalChat";
import { GOAL_RULES } from "@/game/goals";
import { LEAGUE_RULES } from "@/game/leagues";
import { BOSS_PHASE_RULES } from "@/game/leviathan";
import { MARKET_HISTORY_RULES } from "@/game/marketHistory";
import { MESSAGE_RULES } from "@/game/messages";
import { MISSION_XP_RULES } from "@/game/missions";
import { PASS_REWARD_RULES } from "@/game/passSeasons";
import { MODULE_BUILD_COST, MODULE_RULES } from "@/game/modules";
import { TREATY_RULES } from "@/game/pirates";
import { POLL_RULES } from "@/game/polls";
import { BASE_COUNTS } from "@/game/procedural";
import { PROFILE_RULES } from "@/game/profile";
import { REFERRAL_RULES } from "@/game/referral";
import { RENAME_RULES } from "@/game/rename";
import { REPORT_RULES } from "@/game/reports";
import { PASS_BONUS_RULES, PASS_OVERFLOW } from "@/game/seasonPass";
import { SEASON_WAR_RULES, WAR_CHEST_RULES } from "@/game/seasonWars";
import { TUTORIAL_RAID } from "@/game/story";
import { SYNTH_RULES } from "@/game/synthesis";
import { TALENT_RULES } from "@/game/talents";
import { TERRITORY_RULES } from "@/game/territories";
import { UNIT_AUDIT_RULES } from "@/game/unitClasses";
import { VACATION_RULES } from "@/game/vacation";
import { WARLORD_RULES } from "@/game/warlords";
import { WORLD_BOSS_RULES } from "@/game/worldBosses";
import { ACHIEVEMENT_XP_ALERT } from "@/game/xpAudit";

/* =====================================================
   6.9.1 : registre des réglages (règle n° 2). Chaque objet de règles du
   moteur déclaré ici devient un groupe de GameRules : valeurs par défaut,
   fusion (sous-objets champ par champ), application et validation de type
   dans content.ts, édition dans Admin → Règles → Tous les réglages.
   `target` est un accesseur : rien n'est lu au chargement du module
   (CLAUDE.md, initialisation des modules).
   Un nouvel objet `*_RULES` du moteur entre ici (ou dans un groupe dédié
   de content.ts) : `ruleRegistry.test.ts` échoue sinon.
===================================================== */

export interface RegisteredRules {
  label: string;
  target: () => object;
}

export const REGISTERED_RULES = {
  achievementTokens: { label: "Succès : jetons par palier", target: () => ACHIEVEMENT_TOKENS },
  achievementTierRewards: { label: "Succès : XP et production par palier", target: () => TIER_REWARDS },
  achievementXpAlert: { label: "Anti-abus : XP des succès", target: () => ACHIEVEMENT_XP_ALERT },
  actionTemplates: { label: "File d'actions : modèles", target: () => TEMPLATE_RULES },
  allianceChallenge: { label: "Alliance : défi de la semaine (podium)", target: () => ALLIANCE_CHALLENGE_RULES },
  allianceDaily: { label: "Alliance : objectif du jour", target: () => ALLIANCE_DAILY_RULES },
  allianceProfile: { label: "Alliance : fiche, rangs et candidatures", target: () => ALLIANCE_PROFILE_RULES },
  allianceSaga: { label: "Alliance : saga", target: () => ALLIANCE_SAGA_RULES },
  ascension: { label: "Ascension", target: () => ASCENSION_RULES },
  bossPhases: { label: "Boss : phases (riposte, bouclier, faiblesse)", target: () => BOSS_PHASE_RULES },
  bossReminders: { label: "Boss : rappels (veille, fin)", target: () => BOSS_REMINDERS },
  bounties: { label: "Primes Kesh'Vaar", target: () => BOUNTY_RULES },
  bountyShop: { label: "Comptoir de la Ruche", target: () => BOUNTY_SHOP_RULES },
  buildPlan: { label: "File planifiée des bâtiments", target: () => BUILD_PLAN_RULES },
  buildingUnlockCost: { label: "Bâtiments : coût de déblocage", target: () => BUILDING_UNLOCK_COST },
  cancel: { label: "Annulation des chantiers", target: () => CANCEL_RULES },
  chapterBaseCounts: { label: "Chroniques : quantités de base des objectifs", target: () => BASE_COUNTS },
  chatRooms: { label: "Salons", target: () => CHAT_ROOM_RULES },
  coalition: { label: "Coalitions de seigneurs", target: () => COALITION_RULES },
  colonyDeposits: { label: "Colonies : gisements", target: () => DEPOSIT_RULES },
  colonySpec: { label: "Colonies : spécialisation", target: () => COLONY_SPEC_RULES },
  colonyBase: { label: "Colonies : flotte basée", target: () => COLONY_BASE_RULES },
  moon: { label: "Lunes : naissance, bonus et pitié", target: () => MOON_RULES },
  // 6.14.74 (DP-L1, proposals/deblocage-progressif.md) : ouverture progressive du menu (I30).
  navUnlock: { label: "Ouverture du menu (comptes neufs)", target: () => NAV_UNLOCK_RULES },
  // 6.14.44 (É30-1a, proposals/phalange-porte-de-saut.md §5.4).
  phalanx: { label: "Lunes : phalange", target: () => PHALANX_RULES },
  jumpGate: { label: "Lunes : porte de saut", target: () => JUMP_GATE_RULES },
  passRewards: { label: "Passe généré : dernier palier et effort", target: () => PASS_REWARD_RULES },
  achievementHint: { label: "Succès : prix d'un indice", target: () => ACHIEVEMENT_HINT_RULES },
  // 6.14.56 (AU27, AP-1) : succès du code retirés exprès (les autres succès par défaut absents de la liste sont complétés).
  achievementList: { label: "Succès : succès par défaut retirés", target: () => ACHIEVEMENT_LIST_RULES },
  passBonus: { label: "Passe : paliers bonus après le dernier palier", target: () => PASS_BONUS_RULES },
  missionXp: { label: "Missions : XP suggérée par heure (éditeur)", target: () => MISSION_XP_RULES },
  commanderXp: { label: "Officiers : XP par action", target: () => COMMANDER_XP },
  dailyContracts: { label: "Objectifs du jour", target: () => CONTRACT_RULES },
  dailyMissions: { label: "Missions du jour", target: () => DAILY_RULES },
  diplomacy: { label: "Diplomatie", target: () => DIPLOMACY_RULES },
  dockTiers: { label: "Cale sèche : paliers de niveau", target: () => DOCK_TIERS },
  effectCaps: { label: "Bonus : plafonds par grandeur (techno, empire)", target: () => EFFECT_CAP_RULES },
  eliteBounty: { label: "Proie d'élite", target: () => ELITE_RULES },
  exchange: { label: "Comptoir d'échange : taux et taxe", target: () => EXCHANGE_RULES },
  gazette: { label: "Gazette", target: () => GAZETTE_RULES },
  globalChat: { label: "Canal global", target: () => GLOBAL_CHAT_RULES },
  goals: { label: "Objectifs personnels", target: () => GOAL_RULES },
  leagues: { label: "Divisions", target: () => LEAGUE_RULES },
  marketHistory: { label: "Marché : historique des prix", target: () => MARKET_HISTORY_RULES },
  mentions: { label: "Mentions", target: () => MENTION_RULES },
  messages: { label: "Messagerie privée", target: () => MESSAGE_RULES },
  moduleCost: { label: "Modules : coût de fabrication", target: () => MODULE_BUILD_COST },
  modules: { label: "Modules de vaisseaux", target: () => MODULE_RULES },
  officerTuning: { label: "Officiers : second rôle des commandants de saison, Phéromone", target: () => OFFICER_TUNING_RULES },
  passOverflow: { label: "Passe : points en trop convertis en Ambre", target: () => PASS_OVERFLOW },
  polls: { label: "Sondages", target: () => POLL_RULES },
  // 6.14.85 (RL-2, proposals/rythme-long-terme.md §5.2) : projets de prestige.
  prestige: { label: "Projets de prestige", target: () => PRESTIGE_RULES },
  profile: { label: "Profil", target: () => PROFILE_RULES },
  referral: { label: "Parrainage", target: () => REFERRAL_RULES },
  research: { label: "Labo : recherches en parallèle, croissance des coûts et durées, recherche tardive", target: () => RESEARCH_RULES },
  rename: { label: "Changement de pseudo", target: () => RENAME_RULES },
  reports: { label: "Signalements", target: () => REPORT_RULES },
  roomEvents: { label: "Événements de salon", target: () => ROOM_EVENT_RULES },
  seasonWars: { label: "Guerres de saison", target: () => SEASON_WAR_RULES },
  synthesis: { label: "Labo de synthèse", target: () => SYNTH_RULES },
  talents: { label: "Talents d'Ascension", target: () => TALENT_RULES },
  territories: { label: "Territoires d'alliance", target: () => TERRITORY_RULES },
  treaties: { label: "Traités avec les factions", target: () => TREATY_RULES },
  tutorialRaid: { label: "Tutoriel : raid de Varan", target: () => TUTORIAL_RAID },
  unitAudit: { label: "Équilibrage : seuils de l'audit des unités", target: () => UNIT_AUDIT_RULES },
  vacation: { label: "Mode vacances", target: () => VACATION_RULES },
  warChest: { label: "Coffre de guerre", target: () => WAR_CHEST_RULES },
  warlords: { label: "Seigneurs de guerre", target: () => WARLORD_RULES },
  weeklyChallenge: { label: "Défi de la semaine", target: () => CHALLENGE_RULES },
  worldBossRotation: { label: "Boss mondiaux : rotation", target: () => WORLD_BOSS_RULES },
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
