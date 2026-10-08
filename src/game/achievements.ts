import { commandersState, findCommander, isSeasonOfficer, RARE_ROLES } from "@/game/commanders";
import { DEFAULT_SEASON_CATALOG } from "@/game/seasonCatalog";
import { WORLD_BOSSES } from "@/game/worldBosses";
import { ALLIANCE_BOSSES } from "@/game/allianceBoss";
import { BUILDINGS, fullHangarCapacity, LOCKABLE_BUILDINGS, requiredForAscension } from "@/game/buildings";
import { TECHNOLOGIES } from "@/game/technologies";
import { UNITS, type UnitDef } from "@/game/units";
import { COMMON_RESOURCES } from "@/game/economy";
import { getProductionRatesPerSecond } from "@/game/production";
import { factionStates, findFaction } from "@/game/pirates";
import { playerStats } from "@/game/stats";
import { GameActionError } from "@/game/errors";
import { normalizePlanetLook } from "@/game/planetLook";
import { MOON_RULES, moonLevel, playerMoon } from "@/game/moon";
import { prestigeState } from "@/game/prestige";
import { COLONY_RULES } from "@/game/colonies";
import { formatInt } from "@/game/format";
import { TALENT_BRANCHES, TALENT_RULES, TALENTS, talentState } from "@/game/talents";
import { empireClasses } from "@/game/empireClass";
import { SIGNATURE_FAMILIES, signatureTiersReached, SPEC_SLOTS, specChoicesMade } from "@/game/buildingTiers";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Succès (v2.3) : fiches de données (section de contenu « achievements »,
   modifiable dans l'administration). Chaque succès suit une mesure du
   joueur et se débloque au seuil indiqué ; il rapporte de l'XP, des heures
   de production et éventuellement un titre.
===================================================== */

export type AchievementTier = "bronze" | "argent" | "or" | "legendaire" | "mythique";
export type AchievementCategory = "combat" | "construction" | "recherche" | "flotte" | "missions" | "logistique" | "commerce" | "alliance" | "menaces" | "prestige";

export interface AchievementDef {
  id: string;
  enabled: boolean;
  name: string;
  description: string;
  emoji: string;
  category: AchievementCategory;
  tier: AchievementTier;
  metric: AchievementMetric;
  threshold: number;
  /** Caché (« ??? ») tant qu'il n'est pas obtenu. */
  secret: boolean;
  rewardXp: number;
  /** Heures de production des ressources communes. */
  rewardHours: number;
  /** Titre décerné (vide = aucun). Libellé libre, gardé pour les anciens succès. */
  title: string;
  /** v5.10 : titre du catalogue décerné (prioritaire sur « title »). */
  titleId?: string;
  /** v5.4 : palier ajouté par le générateur. */
  auto?: boolean;
  /** 6.14.108 (AP-L4) : instant de création d'un palier généré (délai entre deux paliers d'une mesure). */
  createdAtMs?: number;
  /** 6.14.129 (AJ27-6) : contenu visé par une mesure ciblée (`TARGETED_METRICS` : identifiant d'unité ou de bâtiment). */
  target?: string;
}

export const TIER_LABELS: Record<AchievementTier, string> = { bronze: "Bronze", argent: "Argent", or: "Or", legendaire: "Légendaire", mythique: "Mythique" };
/** 5.15 : jetons du casino gagnés au déblocage, selon le palier. */
export const ACHIEVEMENT_TOKENS: Record<AchievementTier, number> = { bronze: 0, argent: 0, or: 1, legendaire: 2, mythique: 5 };

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const ACHIEVEMENT_TOKENS_META = {
  bronze: { label: "Jetons au palier bronze", unit: "jetons", min: 0, max: 50, hint: "Jetons du casino gagnés quand un succès atteint ce palier." },
  argent: { label: "Jetons au palier argent", unit: "jetons", min: 0, max: 50 },
  or: { label: "Jetons au palier or", unit: "jetons", min: 0, max: 50 },
  legendaire: { label: "Jetons au palier légendaire", unit: "jetons", min: 0, max: 50 },
  mythique: { label: "Jetons au palier mythique", unit: "jetons", min: 0, max: 100, hint: "Palier réservé aux exploits rarissimes (gros lot du casino)." },
};

export const TIER_REWARDS: Record<AchievementTier, { xp: number; hours: number }> = {
  bronze: { xp: 10, hours: 0 },
  argent: { xp: 25, hours: 0 },
  or: { xp: 60, hours: 2 },
  legendaire: { xp: 150, hours: 6 },
  // v5.14.2 : palier réservé aux exploits rarissimes (le gros lot du casino).
  mythique: { xp: 400, hours: 12 },
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const TIER_REWARDS_META = {
  bronze: { label: "Palier bronze", hint: "xp : XP gagnée ; hours : heures de production versées." },
  argent: { label: "Palier argent", hint: "xp : XP gagnée ; hours : heures de production versées." },
  or: { label: "Palier or", hint: "xp : XP gagnée ; hours : heures de production versées." },
  legendaire: { label: "Palier légendaire", hint: "xp : XP gagnée ; hours : heures de production versées." },
  mythique: { label: "Palier mythique", hint: "xp : XP gagnée ; hours : heures de production versées." },
};

export const CATEGORY_LABELS: Record<AchievementCategory, { label: string; emoji: string }> = {
  combat: { label: "Combat", emoji: "⚔️" },
  construction: { label: "Construction", emoji: "🏗️" },
  recherche: { label: "Recherche", emoji: "🔬" },
  flotte: { label: "Flotte", emoji: "🚀" },
  missions: { label: "Missions et contrats", emoji: "🧭" },
  logistique: { label: "Renseignement et logistique", emoji: "🛰️" },
  commerce: { label: "Commerce et Ruche", emoji: "⚖️" },
  alliance: { label: "Alliance", emoji: "🤝" },
  menaces: { label: "Menaces", emoji: "☠️" },
  prestige: { label: "Prestige", emoji: "🏆" },
};

/* ---------- mesures ---------- */

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
// v3.6 : les bâtiments de fin de partie (niveau 10 au plus) ne comptent pas.
const buildingLevels = (p: PlayerState) => BUILDINGS.filter((b) => requiredForAscension(b)).map((b) => p.buildings?.[b.id]?.level ?? 0);
const techLevels = (p: PlayerState) => TECHNOLOGIES.map((t) => p.techLevels?.[t.id] ?? 0);
const factions = (p: PlayerState) => Object.entries(factionStates(p));
const pct = (n: number, d: number) => (d > 0 ? Math.floor((n / d) * 100) : 0);

export const METRICS = {
  victories: { label: "Victoires", value: (p: PlayerState) => p.victories ?? 0 },
  defeats: { label: "Défaites", value: (p: PlayerState) => p.defeats ?? 0 },
  loot: { label: "Ressources pillées (cumul)", value: (p: PlayerState) => playerStats(p).loot ?? 0 },
  phoenix: { label: "Victoire dans l'heure suivant une défaite (0/1)", value: (p: PlayerState) => playerStats(p).phoenix ?? 0 },
  buildingLevels: { label: "Niveaux de bâtiments (total)", value: (p: PlayerState) => sum(buildingLevels(p)) },
  maxBuildingLevel: { label: "Niveau du meilleur bâtiment", value: (p: PlayerState) => Math.max(0, ...buildingLevels(p)) },
  minBuildingLevel: { label: "Niveau du bâtiment le plus bas", value: (p: PlayerState) => Math.min(...buildingLevels(p)) },
  buildingsUnlockedPct: {
    label: "Bâtiments débloqués (%)",
    value: (p: PlayerState) => pct(LOCKABLE_BUILDINGS.filter((id) => p.buildings?.[id]?.unlocked).length, LOCKABLE_BUILDINGS.length),
  },
  techCount: { label: "Technologies recherchées", value: (p: PlayerState) => techLevels(p).filter((l) => l > 0).length },
  techLevels: { label: "Niveaux de technologies (total)", value: (p: PlayerState) => sum(techLevels(p)) },
  maxTechLevel: { label: "Niveau de la meilleure technologie", value: (p: PlayerState) => Math.max(0, ...techLevels(p)) },
  techsMaxedPct: {
    label: "Technologies au maximum (%)",
    value: (p: PlayerState) => pct(TECHNOLOGIES.filter((t) => (p.techLevels?.[t.id] ?? 0) >= t.maxLevel).length, TECHNOLOGIES.length),
  },
  nightResearch: { label: "Recherche lancée entre 3 h et 5 h (0/1)", value: (p: PlayerState) => playerStats(p).nightResearch ?? 0 },
  unitsTotal: { label: "Unités possédées", value: (p: PlayerState) => sum(Object.values(p.units ?? {}).map((u) => u.count)) },
  defensesTotal: {
    label: "Défenses possédées",
    value: (p: PlayerState) => sum(UNITS.filter((u) => u.category === "defense").map((u) => p.units?.[u.id]?.count ?? 0)),
  },
  unitTypesPct: { label: "Types d'unités débloqués (%)", value: (p: PlayerState) => pct(UNITS.filter((u) => (p.units?.[u.id]?.level ?? 0) > 0).length, UNITS.length) },
  maxUnitLevel: { label: "Niveau de la meilleure unité", value: (p: PlayerState) => Math.max(0, ...UNITS.map((u) => p.units?.[u.id]?.level ?? 0)) },
  unitsBuilt: { label: "Unités construites (cumul)", value: (p: PlayerState) => playerStats(p).unitsBuilt ?? 0 },
  missions: { label: "Missions terminées", value: (p: PlayerState) => playerStats(p).missions ?? 0 },
  bestMissionDay: { label: "Missions terminées en une journée (record)", value: (p: PlayerState) => playerStats(p).bestMissionDay ?? 0 },
  contracts: { label: "Contrats remplis", value: (p: PlayerState) => playerStats(p).contracts ?? 0 },
  spies: { label: "Espionnages lancés", value: (p: PlayerState) => playerStats(p).spies ?? 0 },
  recycled: { label: "Débris recyclés (cumul)", value: (p: PlayerState) => playerStats(p).recycled ?? 0 },
  patrols: { label: "Patrouilles lancées", value: (p: PlayerState) => playerStats(p).patrols ?? 0 },
  evasions: { label: "Raids subis flotte en patrouille", value: (p: PlayerState) => playerStats(p).evasions ?? 0 },
  expeditions: { label: "Expéditions terminées", value: (p: PlayerState) => playerStats(p).expeditions ?? 0 },
  leviathanKills: { label: "Léviathans abattus (participation)", value: (p: PlayerState) => playerStats(p).leviathanKills ?? 0 },
  traded: { label: "Ressources échangées au marché (cumul)", value: (p: PlayerState) => playerStats(p).traded ?? 0 },
  giftsSent: { label: "Cadeaux envoyés (v5.10)", value: (p: PlayerState) => playerStats(p).giftsSent ?? 0 },
  inAlliance: { label: "Membre d'une alliance (0/1)", value: (p: PlayerState) => (p.allianceId ? 1 : 0) },
  allianceFounded: { label: "Alliance fondée (0/1)", value: (p: PlayerState) => playerStats(p).allianceFounded ?? 0 },
  garrisons: { label: "Garnisons envoyées", value: (p: PlayerState) => playerStats(p).garrisons ?? 0 },
  donated: { label: "Dons au trésor d'alliance (cumul)", value: (p: PlayerState) => playerStats(p).donated ?? 0 },
  ultimatums: { label: "Ultimatums reçus", value: (p: PlayerState) => playerStats(p).ultimatums ?? 0 },
  factionsThreatened: { label: "Factions différentes ayant menacé", value: (p: PlayerState) => (playerStats(p).threatenedBy ?? []).length },
  tributesPaid: { label: "Tributs payés", value: (p: PlayerState) => sum(factions(p).map(([, s]) => s.tributesPaid)) },
  raidsRepelled: { label: "Raids repoussés", value: (p: PlayerState) => sum(factions(p).map(([, s]) => s.raidsWon)) },
  lairsTaken: { label: "Repaires pris", value: (p: PlayerState) => sum(factions(p).map(([, s]) => s.lairsTaken)) },
  lairFactions: { label: "Factions dont le repaire est tombé", value: (p: PlayerState) => factions(p).filter(([, s]) => s.lairsTaken > 0).length },
  maxNotoriety: {
    label: "Notoriété maximale atteinte (0/1)",
    value: (p: PlayerState) => (factions(p).some(([id, s]) => s.notoriety >= (findFaction(id)?.raid.maxNotoriety ?? Infinity)) ? 1 : 0),
  },
  diplomat: {
    label: "Tributs payés sans jamais refuser",
    value: (p: PlayerState) => {
      const st = factions(p).map(([, s]) => s);
      return st.some((s) => s.raidsWon + s.raidsLost > 0) ? 0 : sum(st.map((s) => s.tributesPaid));
    },
  },
  xp: { label: "XP totale", value: (p: PlayerState) => p.xp ?? 0 },
  // v5.9 : seulement les titres de fin de saison (seasonId « AAAA-MM ») — pas ceux du passe, des défis, des boss…
  seasonTitles: { label: "Titres de saison", value: (p: PlayerState) => (p.titles ?? []).filter((t) => /^\d{4}-\d{2}$/.test(String(t.seasonId))).length },
  // v5.4 : Chroniques et passe.
  chaptersCompleted: { label: "Chapitres des Chroniques terminés", value: (p: PlayerState) => ((p.chronicle as { chapters?: string[] } | undefined)?.chapters ?? []).length },
  bossSeals: { label: "Sceaux de boss de saison", value: (p: PlayerState) => ((p.chronicle as { emblems?: string[] } | undefined)?.emblems ?? []).length },
  passesCompleted: { label: "Passes de saison terminés", value: (p: PlayerState) => ((p.seasonPass as { completed?: string[] } | undefined)?.completed ?? []).length },
  // 6.14.150 (AP-11) : passes dont tous les paliers de prestige sont atteints.
  passesPrestiged: { label: "Passes au prestige complet", value: (p: PlayerState) => ((p.seasonPass as { prestiged?: string[] } | undefined)?.prestiged ?? []).length },
  playtimeHours: { label: "Heures de jeu", value: (p: PlayerState) => Math.floor((p.playtimeSeconds ?? 0) / 3600) },
  // v5.14 : collections tirées des catalogues (officiers rares, commandants de saison, boss mondiaux).
  rareOfficers: { label: "Officiers rares dans l'état-major", value: (p: PlayerState) => Object.keys(commandersState(p).roster).filter((id) => findCommander(id)?.rare).length },
  seasonCommanders: { label: "Commandants de saison gagnés", value: (p: PlayerState) => Object.keys(commandersState(p).roster).filter((id) => isSeasonOfficer(id)).length },
  worldBossTypes: { label: "Boss mondiaux différents abattus", value: (p: PlayerState) => (playerStats(p).worldBossKilled ?? []).length },
  // 6.14.14 (C4) : boss d'alliance ; le tableau complet lit la liste en vigueur à l'usage (jamais au chargement du module).
  allianceBossTypes: { label: "Boss d'alliance différents abattus", value: (p: PlayerState) => (playerStats(p).allianceBossKilled ?? []).length },
  allianceBossAll: {
    label: "Tous les boss d'alliance abattus (0/1)",
    value: (p: PlayerState) => {
      const seen = new Set(playerStats(p).allianceBossKilled ?? []);
      return ALLIANCE_BOSSES.length > 0 && ALLIANCE_BOSSES.every((b) => seen.has(b.id)) ? 1 : 0;
    },
  },
  // v5.14.2 : gros lots (7-7-7) remportés au Casino orbital.
  casinoJackpots: { label: "Gros lots 7-7-7 au casino", value: (p: PlayerState) => Math.max(0, Math.floor(Number((p.casino as { jackpots?: number } | undefined)?.jackpots) || 0)) },
  // 5.26.1 : systèmes récents (Atelier, modules, enchères, reliques, primes).
  unitsRepaired: { label: "Unités réparées à l'Atelier (cumul)", value: (p: PlayerState) => playerStats(p).unitsRepaired ?? 0 },
  unitsDismantled: { label: "Vaisseaux démantelés en Cale sèche (cumul)", value: (p: PlayerState) => playerStats(p).unitsDismantled ?? 0 },
  dockFull: { label: "Cale sèche remplie (fois)", value: (p: PlayerState) => playerStats(p).dockFull ?? 0 },
  modulesBuilt: { label: "Modules de vaisseaux fabriqués", value: (p: PlayerState) => playerStats(p).modulesBuilt ?? 0 },
  modulesMounted: {
    label: "Emplacements de modules occupés",
    value: (p: PlayerState) => Object.values((p.modules as { slots?: Record<string, (string | null)[]> } | undefined)?.slots ?? {}).reduce((a, list) => a + (Array.isArray(list) ? list.filter(Boolean).length : 0), 0),
  },
  auctionsSold: { label: "Ventes conclues à l'Hôtel des enchères", value: (p: PlayerState) => playerStats(p).auctionsSold ?? 0 },
  auctionsWon: { label: "Enchères remportées", value: (p: PlayerState) => playerStats(p).auctionsWon ?? 0 },
  relicsOwned: { label: "Reliques en collection", value: (p: PlayerState) => ((p.relics as { items?: unknown[] } | undefined)?.items ?? []).length },
  bountiesDone: { label: "Primes Kesh'Vaar remplies", value: (p: PlayerState) => playerStats(p).bounties ?? 0 },
  amberEarned: { label: "Ambre de Ruche gagnée (cumul)", value: (p: PlayerState) => Math.floor(Number((p.bounties as { amberEarned?: number } | undefined)?.amberEarned) || 0) },
  bountyReputation: { label: "Réputation auprès de la Ruche", value: (p: PlayerState) => Math.floor(Number((p.bounties as { reputation?: number } | undefined)?.reputation) || 0) },
  vendettaWins: { label: "Vendettas gagnées contre les seigneurs", value: (p: PlayerState) => sum(Object.values(playerStats(p).vendettaWins ?? {}).map((n) => Number(n) || 0)) },
  warlordsBeaten: { label: "Seigneurs différents vaincus en vendetta", value: (p: PlayerState) => Object.values(playerStats(p).vendettaWins ?? {}).filter((n) => Number(n) > 0).length },
  casinoSpins: { label: "Tours de machine joués au casino", value: (p: PlayerState) => Math.floor(Number((p.casino as { spins?: number } | undefined)?.spins) || 0) },
  casinoWins: { label: "Tours gagnants au casino", value: (p: PlayerState) => Math.floor(Number((p.casino as { wins?: number } | undefined)?.wins) || 0) },
  marketTrades: { label: "Échanges conclus au marché entre joueurs", value: (p: PlayerState) => playerStats(p).marketTrades ?? 0 },
  contractsDelivered: { label: "Contrats de livraison honorés", value: (p: PlayerState) => playerStats(p).contractsDelivered ?? 0 },
  privateMessages: { label: "Messages privés envoyés", value: (p: PlayerState) => playerStats(p).privateMessages ?? 0 },
  globalMessages: { label: "Messages publiés sur le canal global", value: (p: PlayerState) => playerStats(p).globalMessages ?? 0 },
  codexChapters: { label: "Catégories du Codex complétées", value: (p: PlayerState) => (playerStats(p).codexClaimed ?? []).length },
  reportsResolved: { label: "Signalements résolus par l'équipe", value: (p: PlayerState) => playerStats(p).reportsResolved ?? 0 },
  profileCustomized: {
    label: "Éléments de profil personnalisés (bannière, emblème, devise, vitrine, planète)",
    value: (p: PlayerState) => {
      const s = (p.profileStyle ?? {}) as { banner?: string; emblem?: string; motto?: string; pinned?: string[]; planet?: unknown };
      const planet = JSON.stringify(normalizePlanetLook(s.planet)) !== JSON.stringify(normalizePlanetLook(undefined));
      return [!!s.banner && s.banner !== "nebula", !!s.emblem && s.emblem !== "rank", !!String(s.motto ?? "").trim(), (s.pinned ?? []).length > 0, planet].filter(Boolean).length;
    },
  },
  streakBest: { label: "Meilleure série de connexion (jours)", value: (p: PlayerState) => Math.floor(Number((p.streak as { best?: number } | undefined)?.best) || 0) },
  ascensionsDone: { label: "Ascensions accomplies", value: (p: PlayerState) => Math.floor(Number(p.ascensions) || 0) },
  // 6.14.85 (RL-2) : projets de prestige achevés (cumul, gardé par l'Ascension).
  prestigeProjects: { label: "Projets de prestige achevés", value: (p: PlayerState) => prestigeState(p).projects },
  // 6.14.3 : lunes (le niveau maximal se lit à l'usage : il est réglable).
  moonLevel: { label: "Niveau de la lune (0 sans lune)", value: (p: PlayerState) => (playerMoon(p) ? moonLevel(playerMoon(p)) : 0) },
  // 6.14.146 (PB-L5) : paliers des bâtiments de système (le nombre se lit à l'usage : familles et niveaux réglables).
  systemSignatures: {
    label: "Bâtiments de système à leur palier signature, en même temps (0 à 4 : entrepôt, Atelier, deux hangars)",
    value: (p: PlayerState) => signatureTiersReached(p),
  },
  allSystemSignatures: {
    label: "Les 4 bâtiments de système à leur palier signature en même temps (0/1)",
    value: (p: PlayerState) => (signatureTiersReached(p) >= SIGNATURE_FAMILIES.length ? 1 : 0),
  },
  specChoices: {
    label: "Choix de spécialisation faits aux paliers 15 (0 à 4)",
    value: (p: PlayerState) => specChoicesMade(p),
  },
  allSpecChoices: {
    label: "Un choix fait à chaque palier de spécialisation (0/1)",
    value: (p: PlayerState) => (specChoicesMade(p) >= SPEC_SLOTS.length ? 1 : 0),
  },
  moonMaxed: {
    label: "Lune au niveau maximal (0/1)",
    value: (p: PlayerState) => {
      const m = playerMoon(p);
      return m && MOON_RULES.maxLevel > 1 && moonLevel(m) >= MOON_RULES.maxLevel ? 1 : 0;
    },
  },
  // 6.14.69 (É30-1d) : phalange et porte de saut (compteurs tenus par le serveur : markScan, markJump, markGateSave).
  phalanxScans: { label: "Balayages de phalange", value: (p: PlayerState) => playerStats(p).phalanxScans ?? 0 },
  gateJumps: { label: "Sauts par la porte de saut", value: (p: PlayerState) => playerStats(p).gateJumps ?? 0 },
  gateSaves: { label: "Attaques repoussées juste après un saut (sauvetages)", value: (p: PlayerState) => playerStats(p).gateSaves ?? 0 },
  // 6.14.115 (AJ27-5) : colonies (le nombre maximal se lit à l'usage : il est réglable).
  coloniesFounded: { label: "Colonies fondées", value: (p: PlayerState) => (p.colonies ?? []).length },
  coloniesMaxed: {
    label: "Toutes les colonies permises fondées (0/1)",
    value: (p: PlayerState) => {
      const max = Math.floor(Number(COLONY_RULES.maxColonies) || 0);
      return max > 0 && (p.colonies ?? []).length >= max ? 1 : 0;
    },
  },
  colonyConvoys: { label: "Convois de route logistique arrivés", value: (p: PlayerState) => playerStats(p).colonyConvoys ?? 0 },
  colonyBaseTours: { label: "Bases avancées tenues jusqu'au bout de leur séjour", value: (p: PlayerState) => playerStats(p).colonyBaseTours ?? 0 },
  // 6.14.129 (AJ27-6, AJ-1) : mesures ciblées, lues avec le contenu visé par le succès (`target`). Sans cible : 0.
  unitOwned: { label: "Exemplaires d'une unité possédés (unité visée)", value: (p: PlayerState, target?: string) => (target ? (p.units?.[target]?.count ?? 0) : 0) },
  unitMastery: {
    label: "Exemplaires d'une unité au niveau maximal (unité visée ; 0 sous ce niveau)",
    value: (p: PlayerState, target?: string) => {
      const u = target ? UNITS.find((x) => x.id === target) : undefined;
      const s = u ? p.units?.[u.id] : undefined;
      return u && s && (s.level ?? 0) >= u.maxLevel ? (s.count ?? 0) : 0;
    },
  },
  buildingLevel: { label: "Niveau d'un bâtiment (bâtiment visé)", value: (p: PlayerState, target?: string) => (target ? (p.buildings?.[target]?.level ?? 0) : 0) },
  // 6.14.132 (AU27, AJ27-9, AJ-4) : talents, modules et classes d'empire (contenus lus à l'usage : ils sont réglables).
  talentBranchesComplete: {
    label: "Branches de talents complètes (chaque talent au rang maximal)",
    value: (p: PlayerState) => {
      const ranks = talentState(p).ranks;
      return TALENT_BRANCHES.filter((b) => {
        const list = TALENTS.filter((t) => t.branch === b.id && !t.retired);
        return list.length > 0 && list.every((t) => (ranks[t.id] ?? 0) >= TALENT_RULES.maxRank);
      }).length;
    },
  },
  legendaryModulesMounted: {
    label: "Modules légendaires montés",
    value: (p: PlayerState) => {
      const m = (p.modules ?? {}) as { items?: { id?: string; rarity?: string; built?: boolean }[]; slots?: Record<string, (string | null)[]> };
      const mounted = new Set(Object.values(m.slots ?? {}).flatMap((list) => (Array.isArray(list) ? list.filter((x): x is string => !!x) : [])));
      return (Array.isArray(m.items) ? m.items : []).filter((it) => it && it.built && it.rarity === "legendary" && mounted.has(String(it.id))).length;
    },
  },
  empireClassesTried: {
    label: "Classes d'empire choisies (au moins une fois)",
    value: (p: PlayerState) => {
      const ids = new Set<string>([...(playerStats(p).empireClassesUsed ?? []), ...(p.empireClass?.id ? [p.empireClass.id] : [])]);
      const known = new Set(empireClasses().map((c) => c.id));
      return [...ids].filter((id) => known.has(id)).length;
    },
  },
  /** Défi d'alliance « Les vigies » : garnisons envoyées et balayages (avec ou sans lune, Q40). */
  vigil: { label: "Garnisons envoyées et balayages de phalange", value: (p: PlayerState) => (playerStats(p).garrisons ?? 0) + (playerStats(p).phalanxScans ?? 0) },
} satisfies Record<string, { label: string; value: (p: PlayerState) => number }>;

export type AchievementMetric = keyof typeof METRICS;

/**
 * 6.14.129 (AJ27-6) : mesures qui comptent un contenu précis (le succès porte `target`). Hors des concours, titres, défis
 * d'alliance et paliers générés (une mesure sans cible vaut 0) ; le brouillard des paliers les range par mesure **et** cible.
 */
export const TARGETED_METRICS: readonly AchievementMetric[] = ["unitOwned", "unitMastery", "buildingLevel"];
export function isTargetedMetric(m: string): boolean {
  return (TARGETED_METRICS as readonly string[]).includes(m);
}
/** Famille d'un succès : sa mesure, et son contenu visé pour une mesure ciblée (brouillard, palier précédent). */
export function achievementFamily(a: Pick<AchievementDef, "metric" | "target">): string {
  return a.target && isTargetedMetric(a.metric) ? `${a.metric}:${a.target}` : a.metric;
}

/* ---------- les succès par défaut ---------- */

function def(
  id: string,
  category: AchievementCategory,
  tier: AchievementTier,
  metric: AchievementMetric,
  threshold: number,
  name: string,
  description: string,
  emoji: string,
  extra: Partial<AchievementDef> = {},
): AchievementDef {
  const r = TIER_REWARDS[tier];
  return { id, enabled: true, name, description, emoji, category, tier, metric, threshold, secret: false, rewardXp: r.xp, rewardHours: r.hours, title: "", ...extra };
}

export const DEFAULT_ACHIEVEMENTS: AchievementDef[] = [
  // Combat
  def("first_blood", "combat", "bronze", "victories", 1, "Premier sang", "Remporte ton premier combat.", "⚔️"),
  def("veteran", "combat", "bronze", "victories", 10, "Vétéran", "Remporte 10 combats.", "🎖️"),
  def("warlord", "combat", "argent", "victories", 50, "Seigneur de guerre", "Remporte 50 combats.", "🗡️"),
  def("star_scourge", "combat", "or", "victories", 200, "Fléau des étoiles", "Remporte 200 combats.", "☄️"),
  def("eternal_conqueror", "combat", "legendaire", "victories", 1000, "Conquérant éternel", "Remporte 1 000 combats.", "👑", { title: "Conquérant", titleId: "conquerant" }),
  def("raider", "combat", "bronze", "loot", 100_000, "Pillard", "Pille 100 000 ressources.", "💰"),
  def("corsair", "combat", "argent", "loot", 1_000_000, "Corsaire", "Pille 1 million de ressources.", "🏴‍☠️"),
  def("galactic_razzia", "combat", "or", "loot", 20_000_000, "Razzia galactique", "Pille 20 millions de ressources.", "💎"),
  def("persistent", "combat", "bronze", "defeats", 25, "Persévérant", "Encaisse 25 défaites… et continue.", "🩹", { secret: true }),
  def("phoenix", "combat", "argent", "phoenix", 1, "Phénix", "Remporte une victoire dans l'heure qui suit une défaite.", "🔥", { secret: true }),
  // Construction
  def("foundations", "construction", "bronze", "buildingLevels", 10, "Premières fondations", "Cumule 10 niveaux de bâtiments.", "🧱"),
  def("builder", "construction", "bronze", "buildingLevels", 50, "Bâtisseur", "Cumule 50 niveaux de bâtiments.", "🏗️"),
  def("urbanist", "construction", "argent", "buildingLevels", 150, "Urbaniste", "Cumule 150 niveaux de bâtiments.", "🏙️"),
  def("megastructure", "construction", "or", "buildingLevels", 300, "Mégastructure", "Cumule 300 niveaux de bâtiments.", "🌆"),
  def("architect", "construction", "bronze", "maxBuildingLevel", 10, "Architecte", "Amène un bâtiment au niveau 10.", "🏛️"),
  def("master_builder", "construction", "argent", "maxBuildingLevel", 15, "Maître d'œuvre", "Amène un bâtiment au niveau 15.", "📐"),
  def("masterpiece", "construction", "or", "maxBuildingLevel", 20, "Chef-d'œuvre", "Amène un bâtiment au niveau 20.", "🗼"),
  def("expansion", "construction", "argent", "buildingsUnlockedPct", 100, "Empire en expansion", "Débloque tous les bâtiments.", "🗺️"),
  def("world_city", "construction", "legendaire", "minBuildingLevel", 20, "Cité-monde", "Amène tous les bâtiments au niveau 20.", "🌍", { title: "Bâtisseur de mondes", titleId: "batisseur_mondes" }),
  // Recherche
  def("curious", "recherche", "bronze", "techCount", 1, "Curieux", "Termine ta première recherche.", "🔎"),
  def("researcher", "recherche", "bronze", "techCount", 5, "Chercheur", "Recherche 5 technologies différentes.", "🔬"),
  def("scholar", "recherche", "argent", "techLevels", 25, "Érudit", "Cumule 25 niveaux de technologies.", "📚"),
  def("savant", "recherche", "or", "techLevels", 75, "Savant", "Cumule 75 niveaux de technologies.", "🧠"),
  def("omniscience", "recherche", "legendaire", "techsMaxedPct", 100, "Omniscience", "Amène toutes les technologies au maximum.", "🌌", { title: "Omniscient", titleId: "omniscient" }),
  def("specialist", "recherche", "argent", "maxTechLevel", 10, "Spécialiste", "Amène une technologie au niveau 10.", "🧪"),
  def("night_owl", "recherche", "bronze", "nightResearch", 1, "Nuit blanche", "Lance une recherche entre 3 h et 5 h du matin.", "🦉", { secret: true }),
  // Flotte
  def("fleet", "flotte", "bronze", "unitsTotal", 50, "Flotte redoutable", "Possède 50 unités au total.", "🚀"),
  def("squadron", "flotte", "argent", "unitsTotal", 500, "Escadre", "Possède 500 unités.", "🛸"),
  def("armada", "flotte", "or", "unitsTotal", 5000, "Armada", "Possède 5 000 unités.", "🌠"),
  def("steel_tide", "flotte", "legendaire", "unitsTotal", 50_000, "Marée d'acier", "Possède 50 000 unités.", "🌊", { title: "Amiral de la Marée", titleId: "amiral_maree" }),
  def("collector", "flotte", "argent", "unitTypesPct", 100, "Collectionneur", "Débloque tous les types d'unités.", "🗂️"),
  def("tireless_yard", "flotte", "or", "unitsBuilt", 10_000, "Chantier infatigable", "Construis 10 000 unités.", "🛠️"),
  def("naval_engineer", "flotte", "argent", "maxUnitLevel", 10, "Ingénieur naval", "Amène une unité au niveau 10.", "⚙️"),
  def("bastion", "flotte", "argent", "defensesTotal", 1000, "Bastion", "Possède 1 000 défenses.", "🛡️"),
  // Missions et contrats
  def("scout", "missions", "bronze", "missions", 10, "Éclaireur", "Termine 10 missions.", "🧭"),
  def("explorer", "missions", "argent", "missions", 100, "Explorateur", "Termine 100 missions.", "🗺️"),
  def("frontier_legend", "missions", "or", "missions", 1000, "Légende des confins", "Termine 1 000 missions.", "🌌"),
  def("contractor", "missions", "bronze", "contracts", 10, "Contractuel", "Remplis 10 contrats.", "📜"),
  def("man_of_word", "missions", "argent", "contracts", 100, "Homme de parole", "Remplis 100 contrats.", "🤝"),
  def("always_there", "missions", "or", "contracts", 300, "Toujours au rendez-vous", "Remplis 300 contrats.", "📅"),
  def("no_rest", "missions", "bronze", "bestMissionDay", 10, "Sans repos", "Termine 10 missions en une seule journée.", "😤", { secret: true }),
  def("deep_space", "missions", "bronze", "expeditions", 1, "Grand large", "Termine ta première expédition.", "🛸"),
  def("pathfinder", "missions", "argent", "expeditions", 25, "Pionnier de l'inconnu", "Termine 25 expéditions.", "🔭"),
  def("leviathan_slayer", "menaces", "or", "leviathanKills", 1, "Tueur de Léviathan", "Participe à la chute du Léviathan.", "🐋"),
  // Renseignement et logistique
  def("prying_eye", "logistique", "bronze", "spies", 1, "Œil indiscret", "Lance ton premier espionnage.", "👁️"),
  def("spymaster", "logistique", "argent", "spies", 50, "Maître espion", "Lance 50 espionnages.", "🕵️"),
  def("scrapper", "logistique", "bronze", "recycled", 100_000, "Ferrailleur", "Recycle 100 000 ressources de débris.", "♻️"),
  def("star_scavenger", "logistique", "or", "recycled", 5_000_000, "Charognard des étoiles", "Recycle 5 millions de ressources de débris.", "🦅"),
  def("ghost", "logistique", "bronze", "patrols", 10, "Fantôme", "Lance 10 patrouilles.", "👻"),
  def("elusive", "logistique", "argent", "evasions", 1, "Insaisissable", "Sois en patrouille quand un raid frappe ta base.", "💨", { secret: true }),
  def("merchant", "logistique", "bronze", "traded", 1_000_000, "Marchand", "Échange 1 million de ressources au marché.", "⚖️"),
  def("tycoon", "logistique", "or", "traded", 50_000_000, "Magnat", "Échange 50 millions de ressources au marché.", "🏦"),
  // Alliance
  def("brothers_in_arms", "alliance", "bronze", "inAlliance", 1, "Frères d'armes", "Rejoins une alliance.", "🤝"),
  def("founder", "alliance", "bronze", "allianceFounded", 1, "Fondateur", "Fonde une alliance.", "🚩"),
  def("allied_shield", "alliance", "bronze", "garrisons", 5, "Bouclier allié", "Envoie 5 garnisons.", "🛡️"),
  def("faithful_sentinel", "alliance", "argent", "garrisons", 50, "Sentinelle fidèle", "Envoie 50 garnisons.", "🗼"),
  def("patron", "alliance", "argent", "donated", 1_000_000, "Mécène", "Donne 1 million de ressources au trésor.", "🎁"),
  def("pillar", "alliance", "or", "donated", 20_000_000, "Pilier de l'alliance", "Donne 20 millions de ressources au trésor.", "🏛️"),
  // Menaces
  def("on_the_list", "menaces", "bronze", "ultimatums", 1, "Sur la Liste", "Reçois ton premier ultimatum.", "📋"),
  def("taxpayer", "menaces", "bronze", "tributesPaid", 5, "Contribuable", "Paie 5 tributs.", "🪙"),
  def("defiant", "menaces", "bronze", "raidsRepelled", 1, "Insoumis", "Repousse un raid de faction.", "✊"),
  def("rampart", "menaces", "argent", "raidsRepelled", 10, "Rempart", "Repousse 10 raids de faction.", "🧱"),
  def("bounty_hunter", "menaces", "or", "lairsTaken", 1, "Chasseur de primes", "Prends un repaire de faction.", "🎯"),
  def("factions_bane", "menaces", "legendaire", "lairFactions", 3, "Fléau des factions", "Fais tomber les repaires de 3 factions différentes.", "💀", { title: "Fléau des factions", titleId: "fleau_factions" }),
  def("wanted", "menaces", "or", "maxNotoriety", 1, "Tête mise à prix", "Atteins la Notoriété maximale auprès d'une faction.", "📸"),
  def("diplomat", "menaces", "argent", "diplomat", 20, "Diplomate", "Paie 20 tributs sans jamais refuser.", "🕊️", { secret: true }),
  def("all_against_me", "menaces", "argent", "factionsThreatened", 4, "Tous contre moi", "Reçois les ultimatums de 4 factions différentes.", "🎭", { secret: true }),
  // Prestige
  def("commander", "prestige", "bronze", "xp", 900, "Commandant", "Atteins le rang Bronze III.", "🏅"),
  def("rising_star", "prestige", "argent", "xp", 7500, "Étoile montante", "Atteins le rang Or III.", "⭐"),
  def("elite_of_elite", "prestige", "or", "xp", 70_000, "Élite des élites", "Atteins le rang Diamant III.", "💠"),
  def("podium", "prestige", "or", "seasonTitles", 1, "Podium", "Remporte un titre de saison.", "🥇"),
  def("tireless", "prestige", "bronze", "playtimeHours", 24, "Increvable", "Cumule 24 h de temps de jeu.", "⏱️"),
  // v5.4 : Chroniques et passe (les paliers suivants sont générés automatiquement).
  def("chapter_reader", "prestige", "bronze", "chaptersCompleted", 1, "Lecteur des Chroniques", "Termine les quatre épisodes d'un chapitre.", "📖"),
  def("chapter_keeper", "prestige", "argent", "chaptersCompleted", 3, "Gardien des Chroniques", "Termine 3 chapitres des Chroniques.", "📚"),
  def("seal_bearer", "prestige", "argent", "bossSeals", 1, "Porte-sceau", "Participe à la chute d'un boss de saison.", "🔱"),
  def("pass_finisher", "prestige", "or", "passesCompleted", 1, "Jusqu'au bout", "Termine un passe de saison.", "🎟️"),
  // 6.14.150 (AP-11) : prestige du passe (palier argent : XP seule, sans ressources).
  def("pass_prestige", "prestige", "argent", "passesPrestiged", 1, "Au-delà du passe", "Atteins tous les paliers de prestige d'un passe.", "🌟"),
];

/** Registre courant (remplacé par applyGameContent). */
export const ACHIEVEMENTS: AchievementDef[] = [];
/** v5.14 : succès dérivés des catalogues. Leurs paliers suivent la taille des
 *  catalogues (rôles rares, saisons, boss mondiaux) : en ajouter met les succès à jour. */
export function derivedAchievements(): AchievementDef[] {
  const rare = RARE_ROLES.length;
  const bosses = WORLD_BOSSES.length;
  // 6.14.132 : nombre de classes d'empire en vigueur (règles : `applyAchievementPace` passe après elles).
  const classes = Math.max(1, empireClasses().length);
  return [
    def("officier_rare_1", "prestige", "or", "rareOfficers", 1, "Recrue d'exception", "Accueillir un officier rare dans l'état-major.", "🎖️", { auto: true }),
    def("officier_rare_all", "prestige", "legendaire", "rareOfficers", rare, "État-major complet", `Réunir les ${rare} officiers rares.`, "🏅", { auto: true, secret: true }),
    def("commandant_saison_1", "prestige", "argent", "seasonCommanders", 1, "Fin de saison", "Gagner un commandant de saison au dernier palier d'un passe.", "🎟️", { auto: true }),
    def("commandant_saison_12", "prestige", "or", "seasonCommanders", 12, "Une année de passes", "Gagner douze commandants de saison.", "📅", { auto: true }),
    def("commandant_saison_all", "prestige", "legendaire", "seasonCommanders", DEFAULT_SEASON_CATALOG.length, "Trois ans de campagne", `Gagner les ${DEFAULT_SEASON_CATALOG.length} commandants du catalogue.`, "🗓️", { auto: true, secret: true }),
    def("boss_mondiaux_3", "combat", "or", "worldBossTypes", Math.min(3, bosses), "Chasseur de colosses", "Abattre trois boss mondiaux différents.", "🐉", { auto: true }),
    def("boss_mondiaux_all", "combat", "legendaire", "worldBossTypes", bosses, "Bestiaire complet", `Abattre les ${bosses} boss mondiaux.`, "📜", { auto: true }),
    // v5.14.2 : le gros lot du casino, seul succès mythique (titre « Main d'or », bannière et emblème du 777, entrée du codex).
    // 5.26.1 : Atelier, modules, enchères, reliques, primes (paliers suivants : générateur procédural).
    def("atelier_1", "flotte", "bronze", "unitsRepaired", 50, "Mécano", "Faire réparer 50 unités à l'Atelier.", "🔧", { auto: true }),
    def("atelier_2", "flotte", "argent", "unitsRepaired", 1000, "Chef d'atelier", "Faire réparer 1 000 unités à l'Atelier.", "🛠️", { auto: true }),
    def("atelier_3", "flotte", "or", "unitsRepaired", 20_000, "Résurrecteur de flottes", "Faire réparer 20 000 unités à l'Atelier.", "⚙️", { auto: true }),
    // 5.28 : Cale sèche.
    def("cale_pleine", "flotte", "argent", "dockFull", 1, "Cale pleine", "Remplir tous les postes de la Cale sèche après un combat.", "⚓", { auto: true }),
    def("demolisseur_1", "flotte", "bronze", "unitsDismantled", 100, "Ferrailleur", "Démanteler 100 vaisseaux en Cale sèche.", "🪛", { auto: true }),
    def("demolisseur_2", "flotte", "or", "unitsDismantled", 1000, "Démolisseur", "Démanteler 1 000 vaisseaux en Cale sèche.", "🏗️", { auto: true }),
    def("module_1", "flotte", "bronze", "modulesBuilt", 1, "Premier module", "Fabriquer un module de vaisseau.", "🧩", { auto: true }),
    def("module_2", "flotte", "argent", "modulesBuilt", 10, "Armurier", "Fabriquer 10 modules de vaisseaux.", "🔩", { auto: true }),
    def("module_full", "flotte", "or", "modulesMounted", 8, "Flotte sur mesure", "Occuper les 8 emplacements de modules.", "🚀", { auto: true }),
    def("enchere_vente_1", "commerce", "bronze", "auctionsSold", 1, "Commissaire-priseur", "Conclure une vente à l'Hôtel des enchères.", "🔨", { auto: true }),
    def("enchere_vente_2", "commerce", "argent", "auctionsSold", 10, "Marchand d'art", "Conclure 10 ventes aux enchères.", "🖼️", { auto: true }),
    def("enchere_vente_3", "commerce", "or", "auctionsSold", 50, "Maison de ventes", "Conclure 50 ventes aux enchères.", "🏛️", { auto: true }),
    def("enchere_achat_1", "commerce", "bronze", "auctionsWon", 1, "Adjugé !", "Remporter une enchère.", "🛎️", { auto: true }),
    def("enchere_achat_2", "commerce", "argent", "auctionsWon", 10, "Collectionneur avisé", "Remporter 10 enchères.", "🏺", { auto: true }),
    def("enchere_achat_3", "commerce", "or", "auctionsWon", 50, "Grand acquéreur", "Remporter 50 enchères.", "💼", { auto: true }),
    def("relique_5", "prestige", "argent", "relicsOwned", 5, "Cabinet de curiosités", "Réunir 5 reliques dans ta collection.", "🗿", { auto: true }),
    def("relique_20", "prestige", "or", "relicsOwned", 20, "Reliquaire", "Réunir 20 reliques dans ta collection.", "⚱️", { auto: true }),
    def("prime_1", "commerce", "bronze", "bountiesDone", 1, "Première prime", "Remplir une prime Kesh'Vaar.", "🎯", { auto: true }),
    def("prime_2", "commerce", "argent", "bountiesDone", 25, "Chasseur de la Ruche", "Remplir 25 primes Kesh'Vaar.", "🐝", { auto: true }),
    def("prime_3", "commerce", "or", "bountiesDone", 150, "Traqueur légendaire", "Remplir 150 primes Kesh'Vaar.", "🏹", { auto: true }),
    def("ambre_1", "commerce", "argent", "amberEarned", 500, "Goût de l'Ambre", "Gagner 500 Ambre de Ruche.", "🍯", { auto: true }),
    def("ambre_2", "commerce", "or", "amberEarned", 5000, "Trésor de la Ruche", "Gagner 5 000 Ambre de Ruche.", "👑", { auto: true }),
    // 5.26.1 : Primes, Seigneurs, Casino, Commerce, Communications, Codex, Signalements, Profil, Série, Ascension.
    def("ruche_rep_1", "commerce", "argent", "bountyReputation", 50, "Ami de la Ruche", "Atteindre 50 de réputation auprès des Kesh'Vaar.", "🐝", { auto: true }),
    def("ruche_rep_2", "commerce", "or", "bountyReputation", 250, "Élu de la Reine", "Atteindre 250 de réputation auprès des Kesh'Vaar.", "👑", { auto: true }),
    def("vendetta_1", "combat", "argent", "vendettaWins", 1, "Vendetta", "Gagner une vendetta contre un seigneur de guerre.", "🗡️", { auto: true }),
    def("vendetta_2", "combat", "or", "vendettaWins", 10, "Tueur de seigneurs", "Gagner 10 vendettas.", "⚔️", { auto: true }),
    // 6.14.3 (P29-1, Q20) : lunes.
    def("lune_1", "combat", "argent", "moonLevel", 1, "Clair de lune", "Voir naître une lune au-dessus de ta planète mère.", "🌙", { auto: true, secret: true }),
    def("lune_max", "prestige", "or", "moonMaxed", 1, "Lune pleine", "Amener ta lune au niveau maximal.", "🌕", { auto: true }),
    // 6.14.146 (PB-L5, proposals/paliers-batiments.md §7) : paliers des bâtiments de système (entrée, maîtrise avec titre).
    def("palier_1", "construction", "bronze", "systemSignatures", 1, "Première signature", "Amener un bâtiment de système (entrepôt, Atelier, hangar) à son palier signature.", "🏗️", { auto: true }),
    def("architecte", "construction", "or", "allSystemSignatures", 1, "Architecte", "Tenir en même temps les paliers signature de l'entrepôt, de l'Atelier et des deux hangars.", "📐", { auto: true, title: "Grand architecte", titleId: "grand_architecte" }),
    def("specialiste_1", "construction", "bronze", "specChoices", 1, "Premier plan", "Faire un choix à un palier de spécialisation (niveau 15).", "📝", { auto: true }),
    def("batisseur_avise", "construction", "argent", "allSpecChoices", 1, "Bâtisseur avisé", "Faire un choix au palier de spécialisation de l'entrepôt, de l'Atelier et des deux hangars.", "🧭", { auto: true }),
    // 6.14.85 (RL-2, proposals/rythme-long-terme.md §5.2) : projets de prestige (entrée, paliers, maîtrise avec titre, secret).
    def("prestige_1", "prestige", "bronze", "prestigeProjects", 1, "Première pierre", "Achever un projet de prestige.", "🏛️", { auto: true }),
    def("prestige_10", "prestige", "argent", "prestigeProjects", 10, "Obélisque", "Achever 10 projets de prestige.", "🗿", { auto: true }),
    def("prestige_100", "prestige", "or", "prestigeProjects", 100, "Grand œuvre", "Achever 100 projets de prestige.", "🏟️", { auto: true, title: "Bâtisseur d'éternité", titleId: "batisseur_eternite" }),
    def("prestige_1000", "prestige", "legendaire", "prestigeProjects", 1000, "Merveille du secteur", "Achever 1 000 projets de prestige.", "🌌", { auto: true, secret: true }),
    // 6.14.69 (É30-1d, proposals/phalange-porte-de-saut.md §7) : phalange et porte de saut (entrée, maîtrise, secret).
    def("phalange_1", "combat", "bronze", "phalanxScans", 1, "Œil de la lune", "Balayer un agresseur avec la phalange de ta lune.", "🔭", { auto: true }),
    def("phalange_50", "combat", "argent", "phalanxScans", 50, "Vigie", "Lancer 50 balayages de phalange.", "🛰️", { auto: true }),
    def("porte_1", "flotte", "bronze", "gateJumps", 1, "Saut de l'ange", "Rapatrier une flotte par la porte de saut.", "🌀", { auto: true }),
    def("porte_25", "flotte", "or", "gateJumps", 25, "Maître du seuil", "Rapatrier 25 flottes par la porte de saut.", "🗝️", { auto: true, title: "Gardien du seuil", titleId: "gardien_seuil" }),
    def("porte_sauvetage", "combat", "or", "gateSaves", 1, "Retour fracassant", "Repousser une attaque avec une flotte rentrée par la porte de saut juste avant l'impact.", "💥", { auto: true, secret: true }),
    // 6.14.14 (C4) : boss d'alliance (chaîne de contenu), palier complet lu à l'usage (allianceBossAll).
    // 6.14.115 (AJ27-5, AU27 AJ-3) : colonies (entrée, maîtrise : toutes les colonies, convois, base avancée tenue).
    def("colonie_1", "construction", "argent", "coloniesFounded", 1, "Terres neuves", "Fonder ta première colonie.", "🪐", { auto: true }),
    def("colonie_all", "construction", "or", "coloniesMaxed", 1, "Empire des mondes", "Fonder toutes les colonies permises.", "🌍", { auto: true }),
    def("convoyeur_100", "logistique", "argent", "colonyConvoys", 100, "Convoyeur", "Faire arriver 100 convois de route logistique.", "🚚", { auto: true }),
    def("base_avancee_1", "combat", "or", "colonyBaseTours", 1, "Avant-poste tenu", "Tenir une base avancée sur une colonie jusqu'au bout de son séjour.", "🏰", { auto: true }),
    def("boss_alliance_1", "alliance", "argent", "allianceBossTypes", 1, "Frappe d'alliance", "Abattre un boss d'alliance en y prenant ta part.", "🛡️", { auto: true }),
    def("boss_alliance_all", "alliance", "or", "allianceBossAll", 1, "Trophées d'alliance", "Abattre chaque boss d'alliance au moins une fois.", "🏆", { auto: true, secret: true }),
    def("vendetta_3", "combat", "legendaire", "warlordsBeaten", 5, "Fin des seigneurs", "Vaincre 5 seigneurs différents en vendetta.", "💀", { auto: true }),
    def("casino_1", "prestige", "bronze", "casinoSpins", 10, "Habitué du casino", "Jouer 10 tours au Casino orbital.", "🎰", { auto: true }),
    def("casino_2", "prestige", "argent", "casinoWins", 25, "Main heureuse", "Gagner 25 tours au casino.", "🍀", { auto: true }),
    def("marche_1", "commerce", "bronze", "marketTrades", 5, "Négociant", "Conclure 5 échanges au marché entre joueurs.", "⚖️", { auto: true }),
    def("marche_2", "commerce", "argent", "marketTrades", 50, "Courtier", "Conclure 50 échanges au marché entre joueurs.", "📈", { auto: true }),
    def("livraison_1", "commerce", "bronze", "contractsDelivered", 3, "Livreur fiable", "Honorer 3 contrats de livraison.", "📦", { auto: true }),
    def("livraison_2", "commerce", "argent", "contractsDelivered", 25, "Transporteur émérite", "Honorer 25 contrats de livraison.", "🚚", { auto: true }),
    def("cadeau_1", "alliance", "bronze", "giftsSent", 5, "Généreux", "Envoyer 5 cadeaux à d'autres joueurs.", "🎁", { auto: true }),
    def("message_1", "alliance", "bronze", "privateMessages", 10, "Correspondant", "Envoyer 10 messages privés.", "✉️", { auto: true }),
    def("canal_1", "alliance", "bronze", "globalMessages", 10, "Voix du secteur", "Publier 10 messages sur le canal global.", "📡", { auto: true }),
    def("canal_2", "alliance", "argent", "globalMessages", 200, "Pilier du canal", "Publier 200 messages sur le canal global.", "📻", { auto: true }),
    def("codex_1", "prestige", "argent", "codexChapters", 1, "Archiviste", "Compléter une catégorie du Codex.", "📚", { auto: true }),
    def("codex_2", "prestige", "or", "codexChapters", 4, "Mémoire de la galaxie", "Compléter 4 catégories du Codex.", "🗃️", { auto: true }),
    def("signal_1", "prestige", "argent", "reportsResolved", 1, "Œil de lynx", "Un de tes signalements a été résolu par l'équipe.", "🐞", { auto: true }),
    def("signal_2", "prestige", "or", "reportsResolved", 5, "Testeur d'élite", "Cinq de tes signalements ont été résolus par l'équipe.", "🛠️", { auto: true }),
    def("profil_1", "prestige", "bronze", "profileCustomized", 1, "Signe distinctif", "Personnaliser un élément de ta fiche publique.", "🎨", { auto: true }),
    def("profil_all", "prestige", "argent", "profileCustomized", 5, "Fiche de légende", "Personnaliser bannière, emblème, devise, vitrine et planète.", "🖼️", { auto: true }),
    def("serie_7", "prestige", "bronze", "streakBest", 7, "Une semaine sans faillir", "Tenir une série de connexion de 7 jours.", "📆", { auto: true }),
    def("serie_30", "prestige", "or", "streakBest", 30, "Un mois de garde", "Tenir une série de connexion de 30 jours.", "🗓️", { auto: true }),
    def("ascension_1", "prestige", "or", "ascensionsDone", 1, "Renaissance", "Accomplir une Ascension.", "✨", { auto: true }),
    // 6.14.88 (RL-3) : jusqu'à l'Ascension X (maximum de 10 après la bascule du rythme, une tous les 30 jours au plus).
    def("ascension_2", "prestige", "or", "ascensionsDone", 2, "Seconde aube", "Accomplir 2 Ascensions.", "🌅", { auto: true }),
    def("ascension_5", "prestige", "legendaire", "ascensionsDone", 5, "Cinq renaissances", "Accomplir 5 Ascensions.", "🌠", { auto: true }),
    def("ascension_10", "prestige", "legendaire", "ascensionsDone", 10, "Dixième ciel", "Accomplir 10 Ascensions.", "💫", { auto: true }),
    def("rang_legende", "prestige", "legendaire", "xp", 250_000, "Légende vivante", "Cumuler 250 000 XP.", "🌟", { auto: true }),
    // 6.14.132 (AU27, AJ27-9, AJ-4) : talents (branche complète), modules (un légendaire monté), classes d'empire (entrée, toutes).
    def("doctrine_specialiste", "prestige", "or", "talentBranchesComplete", 1, "Spécialiste", "Porter chaque talent d'une branche au rang maximal.", "🎓", { auto: true }),
    def("arsenal_legendaire", "flotte", "or", "legendaryModulesMounted", 1, "Arsenal légendaire", "Monter un module légendaire sur ta flotte.", "💎", { auto: true }),
    def("classe_1", "prestige", "bronze", "empireClassesTried", 1, "Une identité", "Choisir une classe d'empire.", "🎭", { auto: true }),
    def("classe_all", "prestige", "or", "empireClassesTried", classes, "Toutes les doctrines", `Choisir au moins une fois chacune des ${classes} classes d'empire.`, "🧭", { auto: true }),
    def("main_or", "prestige", "mythique", "casinoJackpots", 1, "Main d'or", "Aligner trois 7 au Casino orbital et rafler le pot commun.", "🎰", { auto: true, secret: true, title: "Main d'or", titleId: "main_or" }),
  ];
}

/* ---------- 6.14.129 (AJ27-6, AJ-1) : succès dérivés par unité et par bâtiment ---------- */

/**
 * Succès propres à chaque unité et à chaque bâtiment du contenu en vigueur (une unité ajoutée dans l'admin reçoit les siens) :
 * - « Escadre » (ou « Rempart » pour une défense) : posséder N exemplaires, N = budget ÷ coût de l'unité, borné par une part
 *   du hangar plein (bâtiments au niveau maximal) pour rester atteignable ;
 * - « Maître » : l'unité au niveau maximal et N × facteur exemplaires ;
 * - bâtiment : le niveau réglé (20), ou son niveau maximal s'il est plus bas.
 * Seuils, palier, récompense, textes et activation se règlent ici (Admin → Règles → « Succès par unité et par bâtiment »).
 * Rythme (É30-6) : ce sont des succès de maîtrise, pas de prise en main ; voir `docs/changes/6.14.129-succes-par-contenu.md`.
 * Identifiants stables (`unite_<id>_escadre`, `unite_<id>_maitre`, `batiment_<id>_niveau`) : un réglage changé ne retire
 * aucun succès gagné (I25). Valeurs littérales (CLAUDE.md, initialisation des modules).
 */
export const CONTENT_ACHIEVEMENT_RULES = {
  enabled: true,
  unitFleetEnabled: true,
  unitFleetTier: "argent",
  /** Valeur (coût de base cumulé, toutes ressources) des exemplaires à posséder. */
  unitFleetBudget: 20_000_000,
  unitFleetMin: 10,
  /** Part du hangar plein (bâtiments au niveau maximal, sans techno) que le « Maître » ne dépasse pas (l'escadre : ÷ facteur). */
  unitFleetMaxHangarShare: 0.5,
  unitFleetXp: 25,
  unitFleetHours: 0,
  unitFleetName: "Escadre : {name}",
  defenseFleetName: "Rempart : {name}",
  unitFleetText: "Possède {n} × {name}.",
  unitMasterEnabled: true,
  unitMasterTier: "or",
  /** Exemplaires du succès « Maître » = seuil de l'escadre × ce facteur (borné par le hangar plein). */
  unitMasterFactor: 2,
  unitMasterXp: 60,
  unitMasterHours: 1,
  unitMasterName: "Maître : {name}",
  unitMasterText: "{name} au niveau {level} et {n} exemplaires possédés.",
  buildingEnabled: true,
  buildingTier: "or",
  buildingLevel: 20,
  buildingXp: 60,
  buildingHours: 1,
  buildingName: "{name} niveau {level}",
  buildingText: "{name} au niveau {level}.",
  /** Seuil imposé par succès (identifiant → seuil écrit), à la place du calcul. */
  thresholds: {} as Record<string, number>,
  /** Succès dérivés coupés (identifiants) ; ceux déjà gagnés restent acquis. */
  disabled: [] as string[],
};

/** 6.14.129 : libellé, unité, bornes et aide (admin, Tous les réglages et Admin → Règles). */
export const CONTENT_ACHIEVEMENT_RULES_META = {
  enabled: { label: "Succès par unité et par bâtiment", hint: "Décoché : aucun succès dérivé du contenu (ceux déjà gagnés restent acquis)." },
  unitFleetEnabled: { label: "Succès « Escadre » (N exemplaires d'une unité)" },
  unitFleetTier: { label: "Palier du succès « Escadre »", hint: "bronze, argent, or, legendaire ou mythique (jetons du casino selon le palier)." },
  unitFleetBudget: { label: "Valeur d'une escadre", unit: "ressources", min: 1000, max: 1e12, hint: "Seuil = cette valeur ÷ coût de base de l'unité (toutes ressources), arrondi." },
  unitFleetMin: { label: "Seuil minimal d'une escadre", unit: "unités", min: 1, max: 1e6 },
  unitFleetMaxHangarShare: {
    label: "Seuil maximal : part du hangar plein",
    unit: "part",
    min: 0.01,
    max: 1,
    hint: "Borne du « Maître » (l'escadre : cette part ÷ le facteur du « Maître »). Hangar de la catégorie, bâtiments au niveau maximal, sans techno ni effet : le seuil reste atteignable.",
  },
  unitFleetXp: { label: "XP du succès « Escadre »", unit: "XP", min: 0, max: 10_000 },
  unitFleetHours: { label: "Production du succès « Escadre »", unit: "h", min: 0, max: 48 },
  unitFleetName: { label: "Nom d'un succès « Escadre » (vaisseau)", hint: "{name} : nom de l'unité." },
  defenseFleetName: { label: "Nom d'un succès « Escadre » (défense)", hint: "{name} : nom de l'unité." },
  unitFleetText: { label: "Texte d'un succès « Escadre »", hint: "{n} : seuil ; {name} : nom de l'unité." },
  unitMasterEnabled: { label: "Succès « Maître » (niveau maximal et exemplaires)" },
  unitMasterTier: { label: "Palier du succès « Maître »", hint: "bronze, argent, or, legendaire ou mythique." },
  unitMasterFactor: { label: "Exemplaires du « Maître » (× escadre)", unit: "×", min: 0.1, max: 100, hint: "Borné par le hangar plein, comme l'escadre." },
  unitMasterXp: { label: "XP du succès « Maître »", unit: "XP", min: 0, max: 10_000 },
  unitMasterHours: { label: "Production du succès « Maître »", unit: "h", min: 0, max: 48 },
  unitMasterName: { label: "Nom d'un succès « Maître »", hint: "{name} : nom de l'unité." },
  unitMasterText: { label: "Texte d'un succès « Maître »", hint: "{name}, {level} : niveau maximal de l'unité, {n} : exemplaires. Une unité sans niveau (maximum 1) prend le texte de l'escadre." },
  buildingEnabled: { label: "Succès de niveau par bâtiment" },
  buildingTier: { label: "Palier du succès de bâtiment", hint: "bronze, argent, or, legendaire ou mythique." },
  buildingLevel: { label: "Niveau visé par bâtiment", unit: "niveau", min: 1, max: 1000, hint: "Le niveau maximal du bâtiment s'il est plus bas." },
  buildingXp: { label: "XP du succès de bâtiment", unit: "XP", min: 0, max: 10_000 },
  buildingHours: { label: "Production du succès de bâtiment", unit: "h", min: 0, max: 48 },
  buildingName: { label: "Nom d'un succès de bâtiment", hint: "{name} : nom du bâtiment ; {level} : niveau visé." },
  buildingText: { label: "Texte d'un succès de bâtiment", hint: "{name}, {level}." },
  thresholds: { label: "Seuils imposés par succès", hint: "Identifiant du succès (unite_<id>_escadre, unite_<id>_maitre, batiment_<id>_niveau) → seuil, à la place du calcul." },
  disabled: { label: "Succès dérivés coupés (ids)", hint: "Ni affichés ni attribués ; ceux déjà gagnés restent acquis." },
};

/** Palier réglé, ou celui par défaut s'il est inconnu (une règle mal saisie ne casse pas la liste). */
function contentTier(v: unknown, fallback: AchievementTier): AchievementTier {
  return typeof v === "string" && v in TIER_LABELS ? (v as AchievementTier) : fallback;
}
function fillText(tpl: unknown, fallback: string, vars: Record<string, string>): string {
  let out = typeof tpl === "string" && tpl.trim() ? tpl : fallback;
  for (const [k, v] of Object.entries(vars)) out = out.split(`{${k}}`).join(v);
  return out;
}
/** Arrondi lisible (2 chiffres significatifs, vers le bas : le seuil reste sous la borne du hangar). */
function contentRound(n: number): number {
  if (!(n >= 1)) return 1;
  const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1));
  return Math.max(1, Math.floor(n / p) * p);
}
/** Id de succès sûr à partir d'un identifiant de contenu (minuscules, chiffres, _). */
function contentKey(id: string): string {
  return id.toLowerCase().replace(/[^a-z0-9_]/g, "_");
}

/** Hangar plein d'une catégorie (bâtiments au niveau maximal, sans techno ni effet) : borne des seuils d'exemplaires.
 *  Gardé le temps d'un calcul de `contentAchievements` (le serveur applique le contenu à chaque requête). */
let hangarMemo: Partial<Record<"attack" | "defense", number>> | null = null;
function fullHangar(category: "attack" | "defense"): number {
  if (hangarMemo) return (hangarMemo[category] ??= fullHangarCapacity(category));
  return fullHangarCapacity(category);
}

/** Seuils d'exemplaires d'une unité (escadre, maître) selon les règles en vigueur. */
export function unitAchievementThresholds(u: Pick<UnitDef, "id" | "cost" | "category" | "hangarSpace">): { fleet: number; master: number } {
  const r = CONTENT_ACHIEVEMENT_RULES;
  const cost = Math.max(1, Object.values(u.cost ?? {}).reduce((a: number, b) => a + (Number(b) || 0), 0));
  const share = Math.min(1, Math.max(0.01, Number(r.unitFleetMaxHangarShare) || 0.5));
  const factor = Math.max(0.1, Number(r.unitMasterFactor) || 1);
  const cap = Math.floor((fullHangar(u.category === "defense" ? "defense" : "attack") * share) / Math.max(1, Number(u.hangarSpace) || 1));
  const bound = (n: number, max: number) => contentRound(Math.max(1, Math.min(max > 0 ? max : n, Math.max(Number(r.unitFleetMin) || 1, n))));
  // L'escadre reste sous le « Maître » : sa borne est celle du « Maître » ÷ le facteur.
  const fleet = bound((Number(r.unitFleetBudget) || 0) / cost, Math.floor(cap / Math.max(1, factor)));
  const master = bound(fleet * factor, cap);
  const own = r.thresholds ?? {};
  const pick = (id: string, v: number) => (Number(own[id]) > 0 ? Math.floor(Number(own[id])) : v);
  const key = contentKey(u.id);
  return { fleet: pick(`unite_${key}_escadre`, fleet), master: pick(`unite_${key}_maitre`, master) };
}

/** 6.14.129 (AJ27-6) : succès dérivés du contenu en vigueur (unités, bâtiments), lus après les règles (`applyAchievementPace`). */
export function contentAchievements(): AchievementDef[] {
  const r = CONTENT_ACHIEVEMENT_RULES;
  if (!r.enabled) return [];
  // Registres lus à l'usage : au premier chargement (import circulaire possible, CLAUDE.md), rien ; `applyGameContent` les ajoute.
  let units: UnitDef[];
  let buildings: typeof BUILDINGS;
  try {
    units = UNITS;
    buildings = BUILDINGS;
  } catch {
    return [];
  }
  // Bundle des hooks (goja) : un registre pas encore initialisé vaut `undefined` au lieu de lever une erreur.
  if (!Array.isArray(units) || !Array.isArray(buildings)) return [];
  // Le serveur applique le contenu à chaque requête : même contenu et mêmes règles → même liste (copies), sans la recalculer.
  const sig = [
    JSON.stringify(r),
    units.map((u) => `${u.id}:${u.name}:${u.maxLevel}:${u.category}:${u.hangarSpace}:${JSON.stringify(u.cost)}`).join(","),
    buildings.map((b) => `${b.id}:${b.name}:${b.maxLevel}:${b.effect?.type === "hangar" ? `${b.effect.category}${b.effect.perLevel}` : ""}`).join(","),
  ].join("|");
  if (contentMemo?.sig !== sig) {
    hangarMemo = {};
    try {
      contentMemo = { sig, list: buildContentAchievements(r, units, buildings) };
    } finally {
      hangarMemo = null;
    }
  }
  return contentMemo.list.map((a) => ({ ...a }));
}
let contentMemo: { sig: string; list: AchievementDef[] } | null = null;

function buildContentAchievements(r: typeof CONTENT_ACHIEVEMENT_RULES, units: UnitDef[], buildings: typeof BUILDINGS): AchievementDef[] {
  const off = new Set(Array.isArray(r.disabled) ? r.disabled : []);
  const out: AchievementDef[] = [];
  const reward = (xp: unknown, hours: unknown) => ({ rewardXp: Math.max(0, Math.floor(Number(xp) || 0)), rewardHours: Math.max(0, Number(hours) || 0) });
  for (const u of units) {
    const key = contentKey(u.id);
    const t = unitAchievementThresholds(u);
    const defense = u.category === "defense";
    if (r.unitFleetEnabled) {
      const tier = contentTier(r.unitFleetTier, "argent");
      const name = fillText(defense ? r.defenseFleetName : r.unitFleetName, "Escadre : {name}", { name: u.name });
      out.push({
        ...def(`unite_${key}_escadre`, "flotte", tier, "unitOwned", t.fleet, name, fillText(r.unitFleetText, "Possède {n} × {name}.", { n: formatInt(t.fleet), name: u.name }), defense ? "🛡️" : "🚀"),
        ...reward(r.unitFleetXp, r.unitFleetHours),
        auto: true,
        target: u.id,
      });
    }
    if (r.unitMasterEnabled) {
      const tier = contentTier(r.unitMasterTier, "or");
      const vars = { name: u.name, level: formatInt(u.maxLevel), n: formatInt(t.master) };
      // Une unité sans niveau (maximum 1) : le texte de l'escadre, avec le seuil du « Maître ».
      const text = u.maxLevel > 1 ? fillText(r.unitMasterText, "{name} au niveau {level} et {n} exemplaires possédés.", vars) : fillText(r.unitFleetText, "Possède {n} × {name}.", vars);
      out.push({
        ...def(`unite_${key}_maitre`, "flotte", tier, "unitMastery", t.master, fillText(r.unitMasterName, "Maître : {name}", vars), text, "🎖️"),
        ...reward(r.unitMasterXp, r.unitMasterHours),
        auto: true,
        target: u.id,
      });
    }
  }
  if (r.buildingEnabled) {
    const tier = contentTier(r.buildingTier, "or");
    for (const b of buildings) {
      const id = `batiment_${contentKey(b.id)}_niveau`;
      const own = Number((r.thresholds ?? {})[id]);
      const level = own > 0 ? Math.floor(own) : Math.max(1, Math.min(Math.floor(Number(r.buildingLevel) || 20), b.maxLevel));
      const vars = { name: b.name, level: formatInt(level) };
      out.push({
        ...def(id, "construction", tier, "buildingLevel", level, fillText(r.buildingName, "{name} niveau {level}", vars), fillText(r.buildingText, "{name} au niveau {level}.", vars), "🏗️"),
        ...reward(r.buildingXp, r.buildingHours),
        auto: true,
        target: b.id,
      });
    }
  }
  return out.filter((a) => !off.has(a.id));
}

/** 6.14.56 (AU27, AP-1) : succès du code retirés exprès par l'admin. Les autres succès par défaut absents de la liste
 *  enregistrée (succès ajoutés au code après la première écriture de la liste) sont complétés à l'application du contenu. */
export const ACHIEVEMENT_LIST_RULES = { removedDefaults: [] as string[] };

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const ACHIEVEMENT_LIST_RULES_META = {
  removedDefaults: { label: "Succès par défaut retirés (ids)", hint: "Ces succès du code ne reviennent pas quand la liste enregistrée est complétée. Rempli par l'onglet Succès." },
};

/** 6.14.56 : liste enregistrée complétée par les succès par défaut qui y manquent, sauf ceux retirés exprès
 *  (`removedDefaults`). Un succès ajouté se place après le succès par défaut qui le précède dans le code. */
export function withDefaultAchievements(stored: AchievementDef[], removed: readonly string[] = []): AchievementDef[] {
  const have = new Set(stored.map((a) => a.id));
  const skip = new Set(removed);
  const out = [...stored];
  DEFAULT_ACHIEVEMENTS.forEach((d, i) => {
    if (have.has(d.id) || skip.has(d.id)) return;
    let at = out.length;
    for (let j = i - 1; j >= 0; j--) {
      const k = out.findIndex((a) => a.id === DEFAULT_ACHIEVEMENTS[j].id);
      if (k >= 0) {
        at = k + 1;
        break;
      }
    }
    out.splice(at, 0, structuredClone(d));
    have.add(d.id);
  });
  return out;
}

/* ---------- 6.14.117 (É30-6, PRG-5, AE-12) : rythme des succès ---------- */

/**
 * Seuils « en jeu » des succès de volume (unités, défenses, ressources, missions) : seuil écrit × facteur de la mesure.
 * Les mesures bornées par le jeu (niveaux, technos, rang, %) ne sont pas touchées : la bascule du rythme (RL-3) les étire.
 * Le seuil écrit reste dans la liste (admin, générateur) : le facteur s'applique à la lecture, donc 1 = ancien comportement.
 * Un succès déjà gagné reste gagné (rien ne relit `unlockedAchievements`) ; il n'est pas « repris » si le seuil monte.
 * Valeurs littérales (CLAUDE.md, initialisation des modules).
 */
export const ACHIEVEMENT_PACE_RULES = {
  /** Décoché : seuils écrits tels quels (ancien comportement). */
  enabled: true,
  /** Le premier palier (bronze) garde son seuil écrit : la prise en main reste rapide. */
  keepBronze: true,
  /** Facteur par mesure (1 ou absent : seuil écrit). Mesures de volume seulement. */
  scales: {
    unitsTotal: 10,
    defensesTotal: 10,
    unitsBuilt: 3,
    unitsRepaired: 2,
    missions: 5,
    bestMissionDay: 20,
    loot: 10,
    recycled: 10,
    traded: 200,
    donated: 200,
    ultimatums: 2,
  } as Record<string, number>,
};

/** 6.14.117 : libellé, unité, bornes et aide (admin, Tous les réglages et Admin → Règles). */
export const ACHIEVEMENT_PACE_RULES_META = {
  enabled: { label: "Rythme des succès appliqué", hint: "Décoché : chaque succès se débloque à son seuil écrit (avant la 6.14.117)." },
  keepBronze: { label: "Palier bronze au seuil écrit", hint: "Le premier succès d'une mesure reste rapide (prise en main) ; les paliers argent et plus suivent le facteur." },
  scales: { label: "Facteur du seuil par mesure", unit: "×", hint: "Seuil en jeu = seuil écrit × facteur (entre 1 et 1 000). Un succès déjà gagné reste gagné. 1 = seuil écrit." },
};

/** Arrondi à 2 chiffres significatifs (un facteur décimal ne donne pas 7 499 999). */
function paceRound(n: number): number {
  if (!(n > 0)) return 1;
  const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(n)) - 1));
  return Math.max(1, Math.round(n / p) * p);
}

/** Facteur en vigueur pour un succès (1 : seuil écrit). */
export function achievementPaceScale(a: Pick<AchievementDef, "metric" | "tier">): number {
  const r = ACHIEVEMENT_PACE_RULES;
  if (!r.enabled || (r.keepBronze && a.tier === "bronze")) return 1;
  const f = Number((r.scales ?? {})[a.metric]);
  return Number.isFinite(f) && f > 1 ? Math.min(1000, f) : 1;
}

/** Seuil en jeu d'un succès écrit (liste enregistrée, admin, générateur). */
export function paceThreshold(a: Pick<AchievementDef, "metric" | "tier" | "threshold">): number {
  const f = achievementPaceScale(a);
  return f === 1 ? a.threshold : paceRound(a.threshold * f);
}

const PACE_SEP = "[ \u00a0\u202f]?";
/** Motif d'un entier écrit avec ou sans séparateur de milliers (« 1 000 », « 1000 », espace fine). */
function digitsPattern(n: number): string {
  const d = String(Math.round(n));
  let out = "";
  for (let i = 0; i < d.length; i++) {
    if (i > 0 && (d.length - i) % 3 === 0) out += PACE_SEP;
    out += d[i];
  }
  return out;
}
/** « 5 millions », « 2 milliards », « 7,5 milliards » ; null si le nombre ne s'écrit pas ainsi. */
function bigWords(n: number): string | null {
  if (n >= 1e9 && n % 1e8 === 0) {
    const v = n / 1e9;
    return `${String(v).replace(".", ",")} milliard${v >= 2 ? "s" : ""}`;
  }
  if (n >= 1e6 && n % 1e6 === 0) {
    const v = n / 1e6;
    return `${formatInt(v)} million${v >= 2 ? "s" : ""}`;
  }
  return null;
}

/** Texte d'un succès dont le seuil change : le nombre écrit est remplacé par le seuil en jeu, dans la même forme. */
export function paceDescription(text: string, written: number, shown: number): string {
  if (written === shown || typeof text !== "string") return text;
  if (written >= 1e6 && written % 1e6 === 0) {
    const m = new RegExp(`(^|[^0-9])${digitsPattern(written / 1e6)} millions?`).exec(text);
    if (m) return text.slice(0, m.index) + m[1] + (bigWords(shown) ?? formatInt(shown)) + text.slice(m.index + m[0].length);
  }
  const m = new RegExp(`(^|[^0-9])${digitsPattern(written)}(?![0-9])`).exec(text);
  if (!m) return text;
  return text.slice(0, m.index) + m[1] + formatInt(shown) + text.slice(m.index + m[0].length);
}

/**
 * 6.14.130 : premier chargement du module. Les succès dérivés lisent d'autres registres (officiers, boss, unités, bâtiments) ; selon
 * l'ordre des imports (import circulaire, CLAUDE.md « Initialisation des modules »), ils peuvent ne pas être prêts : la liste
 * initiale s'en passe, `applyGameContent` les ajoute. Après le chargement, une erreur remonte normalement.
 */
let moduleLoaded = false;
function whenLoaded(fn: () => AchievementDef[]): AchievementDef[] {
  if (moduleLoaded) return fn();
  try {
    return fn();
  } catch {
    return [];
  }
}

/** Liste donnée par le contenu (admin, code) : les succès dérivés s'y ajoutent à chaque application des règles. */
let givenAchievements: AchievementDef[] = [];
/** Liste écrite (avant le rythme) : relue quand les règles changent (`applyAchievementPace`). */
let writtenAchievements: AchievementDef[] = [];

/** 6.14.117 : registre recalculé depuis la liste écrite et les règles en vigueur (appelé après les règles, `applyGameContent`). */
export function applyAchievementPace(): void {
  // v5.14 : les succès dérivés des catalogues s'ajoutent s'ils manquent (catalogue personnalisé).
  // 6.14.129 (AJ27-6) : recalculés ici, après les règles (CLAUDE.md : `setAchievements` passe avant les règles) ;
  // un succès de même identifiant dans la liste donnée (admin) l'emporte.
  const have = new Set(givenAchievements.map((d) => d.id));
  writtenAchievements = [...givenAchievements, ...whenLoaded(derivedAchievements).filter((d) => !have.has(d.id))];
  for (const d of whenLoaded(contentAchievements)) if (!have.has(d.id)) writtenAchievements.push(d);
  ACHIEVEMENTS.splice(
    0,
    ACHIEVEMENTS.length,
    ...writtenAchievements.map((a) => {
      const threshold = paceThreshold(a);
      return threshold === a.threshold ? a : { ...a, threshold, description: paceDescription(a.description, a.threshold, threshold) };
    }),
  );
}

export function setAchievements(defs: AchievementDef[]) {
  givenAchievements = defs;
  applyAchievementPace();
}

/** 6.14.130 : liste donnée sans recalcul du registre ; `applyGameContent` appelle `applyAchievementPace` après les règles
 *  (un seul calcul des succès dérivés par application du contenu : le serveur applique le contenu à chaque requête). */
export function setAchievementList(defs: AchievementDef[]) {
  givenAchievements = defs;
}
setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS));
moduleLoaded = true;

/* ---------- 5.26.2 : indices des succès secrets ---------- */

/** Prix d'un indice (Ambre de Ruche), payé une fois par succès secret (Z5 : GameRules.achievementHint). */
export const ACHIEVEMENT_HINT_RULES = { price: 25 };

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const ACHIEVEMENT_HINT_RULES_META = {
  price: { label: "Prix d'un indice de succès secret", unit: "Ambre", min: 0, max: 1000, hint: "Ambre de Ruche dépensée pour lire la piste d'un succès caché." },
};

/** Indices cryptiques par mesure : une piste, jamais le seuil exact. */
const METRIC_HINTS: Partial<Record<AchievementMetric, string>> = {
  defeats: "Celui qui tombe souvent finit par apprendre à se relever.",
  phoenix: "Les cendres d'une défaite sont encore chaudes : frappe avant qu'elles ne refroidissent.",
  nightResearch: "Les laboratoires sont plus calmes quand la galaxie dort, aux heures où même les sentinelles bâillent.",
  bestMissionDay: "Un seul jour, un équipage infatigable, et un registre des missions qui déborde.",
  evasions: "Une base vide ne craint pas les pillards : sois ailleurs quand ils frappent.",
  diplomat: "Payer sans jamais dire non. Encore. Et encore.",
  factionsThreatened: "Quand toutes les factions connaissent ton nom, tu as réussi… en quelque sorte.",
  rareOfficers: "L'état-major complet réunit ceux qu'on ne croise qu'une fois.",
  seasonCommanders: "Chaque saison offre un visage ; il faudra tous les réunir.",
  casinoJackpots: "Trois fois le même chiffre, et le pot commun change de mains.",
  moonLevel: "Un champ de débris assez lourd finit parfois par tourner autour de ceux qui ont tenu bon.",
  gateSaves: "Une flotte au loin ne défend rien. Ramène-la d'un coup, juste avant que la tempête ne frappe.",
  prestigeProjects: "Un empire qui n'a plus rien à bâtir pour lui bâtit pour la postérité. Encore, et encore.",
};

/** Indice d'un succès (piste de la mesure, sinon la catégorie). */
export function achievementHint(a: Pick<AchievementDef, "metric" | "category">): string {
  return METRIC_HINTS[a.metric] ?? `Une piste du côté de : ${CATEGORY_LABELS[a.category].label.toLowerCase()}.`;
}

/** Achat d'un indice : succès secret, pas encore obtenu ni indiqué ; l'Ambre est débitée par l'appelant. */
export function checkHintPurchase(player: Pick<PlayerState, "unlockedAchievements" | "stats">, id: unknown): AchievementDef {
  const a = ACHIEVEMENTS.find((x) => x.id === String(id) && x.enabled);
  if (!a || !a.secret) throw new GameActionError("Ce succès n'a pas d'indice.");
  if ((player.unlockedAchievements ?? []).includes(a.id)) throw new GameActionError("Succès déjà obtenu.");
  if ((playerStats(player).hintsBought ?? []).includes(a.id)) throw new GameActionError("Indice déjà acheté.");
  return a;
}

/** 5.26.1 : brouillard des succès. Par mesure, les paliers obtenus et le prochain
 *  sont visibles ; les suivants restent dans le brouillard (nom, seuil et récompense
 *  cachés) jusqu'à ce que le précédent tombe. Un succès secret non obtenu reste secret.
 *  Le joueur voit toujours un objectif concret, sans pouvoir planifier toute l'échelle. */
export type AchievementVisibility = "shown" | "fog" | "secret";

export function achievementVisibility(defs: AchievementDef[], unlocked: ReadonlySet<string>): Map<string, AchievementVisibility> {
  const out = new Map<string, AchievementVisibility>();
  const byMetric = new Map<string, AchievementDef[]>();
  // 6.14.129 : une mesure ciblée se range par contenu (l'escadre de frégates ne cache pas celle des chasseurs).
  for (const a of defs) byMetric.set(achievementFamily(a), [...(byMetric.get(achievementFamily(a)) ?? []), a]);
  for (const list of byMetric.values()) {
    let nextShown = false;
    for (const a of [...list].sort((x, y) => x.threshold - y.threshold)) {
      if (unlocked.has(a.id)) out.set(a.id, "shown");
      else if (!nextShown) {
        nextShown = true;
        out.set(a.id, a.secret ? "secret" : "shown");
      } else out.set(a.id, "fog");
    }
  }
  return out;
}

/** Palier précédent dans la même mesure (pour dire quoi obtenir avant de révéler un palier caché). */
export function previousTier(defs: AchievementDef[], a: AchievementDef): AchievementDef | null {
  return defs.filter((d) => achievementFamily(d) === achievementFamily(a) && d.threshold < a.threshold).sort((x, y) => y.threshold - x.threshold)[0] ?? null;
}

export function achievementValue(a: Pick<AchievementDef, "metric" | "target">, player: PlayerState): number {
  const m = METRICS[a.metric];
  // 6.14.129 : une mesure ciblée lit le contenu visé (`target`) ; les autres ignorent le second argument.
  return m ? (m.value as (p: PlayerState, target?: string) => number)(player, a.target) : 0;
}

export function achievementProgress(a: AchievementDef, player: PlayerState): { value: number; target: number; done: boolean } {
  const value = achievementValue(a, player);
  return { value: Math.min(value, a.threshold), target: a.threshold, done: value >= a.threshold };
}

export function checkNewAchievements(player: PlayerState): AchievementDef[] {
  const unlocked = new Set(player.unlockedAchievements ?? []);
  return ACHIEVEMENTS.filter((a) => a.enabled && !unlocked.has(a.id) && achievementValue(a, player) >= a.threshold);
}

/** Récompense d'un succès (ressources communes pour `rewardHours`). */
export function achievementReward(a: AchievementDef, player: PlayerState): Partial<Record<ResourceId, number>> {
  if (!(a.rewardHours > 0)) return {};
  const rates = getProductionRatesPerSecond(player.buildings ?? {}, player.techLevels ?? {});
  const out: Partial<Record<ResourceId, number>> = {};
  for (const res of COMMON_RESOURCES) {
    const n = Math.floor((rates[res] ?? 0) * a.rewardHours * 3600);
    if (n > 0) out[res] = n;
  }
  return out;
}

export function validateAchievements(defs: AchievementDef[]): string[] {
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const a of defs) {
    const label = `Succès ${a.name || a.id}`;
    if (!/^[a-z0-9_]+$/.test(a.id ?? "")) errors.push(`${label} : identifiant « ${a.id} » invalide (minuscules, chiffres, _).`);
    if (seen.has(a.id)) errors.push(`${label} : identifiant en double.`);
    seen.add(a.id);
    if (!(a.metric in METRICS)) errors.push(`${label} : mesure inconnue.`);
    else if (isTargetedMetric(a.metric) && !/^[A-Za-z0-9_-]+$/.test(a.target ?? "")) errors.push(`${label} : contenu visé manquant (unité ou bâtiment).`);
    if (!(a.threshold > 0)) errors.push(`${label} : seuil invalide.`);
    if (!(a.tier in TIER_LABELS)) errors.push(`${label} : palier inconnu.`);
    if (!(a.category in CATEGORY_LABELS)) errors.push(`${label} : catégorie inconnue.`);
  }
  return errors;
}
