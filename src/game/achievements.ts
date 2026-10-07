import { commandersState, findCommander, isSeasonOfficer, RARE_ROLES } from "@/game/commanders";
import { SEASON_CATALOG } from "@/game/seasonCatalog";
import { WORLD_BOSSES } from "@/game/worldBosses";
import { BUILDINGS, LOCKABLE_BUILDINGS, requiredForAscension } from "@/game/buildings";
import { TECHNOLOGIES } from "@/game/technologies";
import { UNITS } from "@/game/units";
import { COMMON_RESOURCES } from "@/game/economy";
import { getProductionRatesPerSecond } from "@/game/production";
import { factionStates, findFaction } from "@/game/pirates";
import { playerStats } from "@/game/stats";
import { GameActionError } from "@/game/errors";
import { normalizePlanetLook } from "@/game/planetLook";
import { MOON_RULES, moonLevel, playerMoon } from "@/game/moon";
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
}

export const TIER_LABELS: Record<AchievementTier, string> = { bronze: "Bronze", argent: "Argent", or: "Or", legendaire: "Légendaire", mythique: "Mythique" };
/** 5.15 : jetons du casino gagnés au déblocage, selon le palier. */
export const ACHIEVEMENT_TOKENS: Record<AchievementTier, number> = { bronze: 0, argent: 0, or: 1, legendaire: 2, mythique: 5 };

export const TIER_REWARDS: Record<AchievementTier, { xp: number; hours: number }> = {
  bronze: { xp: 10, hours: 0 },
  argent: { xp: 25, hours: 0 },
  or: { xp: 60, hours: 2 },
  legendaire: { xp: 150, hours: 6 },
  // v5.14.2 : palier réservé aux exploits rarissimes (le gros lot du casino).
  mythique: { xp: 400, hours: 12 },
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
  playtimeHours: { label: "Heures de jeu", value: (p: PlayerState) => Math.floor((p.playtimeSeconds ?? 0) / 3600) },
  // v5.14 : collections tirées des catalogues (officiers rares, commandants de saison, boss mondiaux).
  rareOfficers: { label: "Officiers rares dans l'état-major", value: (p: PlayerState) => Object.keys(commandersState(p).roster).filter((id) => findCommander(id)?.rare).length },
  seasonCommanders: { label: "Commandants de saison gagnés", value: (p: PlayerState) => Object.keys(commandersState(p).roster).filter((id) => isSeasonOfficer(id)).length },
  worldBossTypes: { label: "Boss mondiaux différents abattus", value: (p: PlayerState) => (playerStats(p).worldBossKilled ?? []).length },
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
  // 6.14.3 : lunes (le niveau maximal se lit à l'usage : il est réglable).
  moonLevel: { label: "Niveau de la lune (0 sans lune)", value: (p: PlayerState) => (playerMoon(p) ? moonLevel(playerMoon(p)) : 0) },
  moonMaxed: {
    label: "Lune au niveau maximal (0/1)",
    value: (p: PlayerState) => {
      const m = playerMoon(p);
      return m && MOON_RULES.maxLevel > 1 && moonLevel(m) >= MOON_RULES.maxLevel ? 1 : 0;
    },
  },
} satisfies Record<string, { label: string; value: (p: PlayerState) => number }>;

export type AchievementMetric = keyof typeof METRICS;

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
];

/** Registre courant (remplacé par applyGameContent). */
export const ACHIEVEMENTS: AchievementDef[] = [];
/** v5.14 : succès dérivés des catalogues. Leurs paliers suivent la taille des
 *  catalogues (rôles rares, saisons, boss mondiaux) : en ajouter met les succès à jour. */
export function derivedAchievements(): AchievementDef[] {
  const rare = RARE_ROLES.length;
  const bosses = WORLD_BOSSES.length;
  return [
    def("officier_rare_1", "prestige", "or", "rareOfficers", 1, "Recrue d'exception", "Accueillir un officier rare dans l'état-major.", "🎖️", { auto: true }),
    def("officier_rare_all", "prestige", "legendaire", "rareOfficers", rare, "État-major complet", `Réunir les ${rare} officiers rares.`, "🏅", { auto: true, secret: true }),
    def("commandant_saison_1", "prestige", "argent", "seasonCommanders", 1, "Fin de saison", "Gagner un commandant de saison au dernier palier d'un passe.", "🎟️", { auto: true }),
    def("commandant_saison_12", "prestige", "or", "seasonCommanders", 12, "Une année de passes", "Gagner douze commandants de saison.", "📅", { auto: true }),
    def("commandant_saison_all", "prestige", "legendaire", "seasonCommanders", SEASON_CATALOG.length, "Trois ans de campagne", `Gagner les ${SEASON_CATALOG.length} commandants du catalogue.`, "🗓️", { auto: true, secret: true }),
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
    def("rang_legende", "prestige", "legendaire", "xp", 250_000, "Légende vivante", "Cumuler 250 000 XP.", "🌟", { auto: true }),
    def("main_or", "prestige", "mythique", "casinoJackpots", 1, "Main d'or", "Aligner trois 7 au Casino orbital et rafler le pot commun.", "🎰", { auto: true, secret: true, title: "Main d'or", titleId: "main_or" }),
  ];
}

export function setAchievements(defs: AchievementDef[]) {
  // v5.14 : les succès dérivés des catalogues s'ajoutent s'ils manquent (catalogue personnalisé).
  const have = new Set(defs.map((d) => d.id));
  ACHIEVEMENTS.splice(0, ACHIEVEMENTS.length, ...defs, ...derivedAchievements().filter((d) => !have.has(d.id)));
}
setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS));

/* ---------- 5.26.2 : indices des succès secrets ---------- */

/** Prix d'un indice (Ambre de Ruche), payé une fois par succès secret (Z5 : GameRules.achievementHint). */
export const ACHIEVEMENT_HINT_RULES = { price: 25 };

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
  for (const a of defs) byMetric.set(a.metric, [...(byMetric.get(a.metric) ?? []), a]);
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
  return defs.filter((d) => d.metric === a.metric && d.threshold < a.threshold).sort((x, y) => y.threshold - x.threshold)[0] ?? null;
}

export function achievementValue(a: Pick<AchievementDef, "metric">, player: PlayerState): number {
  const m = METRICS[a.metric];
  return m ? m.value(player) : 0;
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
    if (!(a.threshold > 0)) errors.push(`${label} : seuil invalide.`);
    if (!(a.tier in TIER_LABELS)) errors.push(`${label} : palier inconnu.`);
    if (!(a.category in CATEGORY_LABELS)) errors.push(`${label} : catégorie inconnue.`);
  }
  return errors;
}
