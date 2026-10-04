import { BUILDINGS, LOCKABLE_BUILDINGS } from "@/game/buildings";
import { TECHNOLOGIES } from "@/game/technologies";
import { UNITS } from "@/game/units";
import { COMMON_RESOURCES } from "@/game/economy";
import { getProductionRatesPerSecond } from "@/game/production";
import { factionStates, findFaction } from "@/game/pirates";
import { playerStats } from "@/game/stats";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Succès (v2.3) : fiches de données (section de contenu « achievements »,
   modifiable dans l'administration). Chaque succès suit une mesure du
   joueur et se débloque au seuil indiqué ; il rapporte de l'XP, des heures
   de production et éventuellement un titre.
===================================================== */

export type AchievementTier = "bronze" | "argent" | "or" | "legendaire";
export type AchievementCategory = "combat" | "construction" | "recherche" | "flotte" | "missions" | "logistique" | "alliance" | "menaces" | "prestige";

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

export const TIER_LABELS: Record<AchievementTier, string> = { bronze: "Bronze", argent: "Argent", or: "Or", legendaire: "Légendaire" };
export const TIER_REWARDS: Record<AchievementTier, { xp: number; hours: number }> = {
  bronze: { xp: 10, hours: 0 },
  argent: { xp: 25, hours: 0 },
  or: { xp: 60, hours: 2 },
  legendaire: { xp: 150, hours: 6 },
};
export const CATEGORY_LABELS: Record<AchievementCategory, { label: string; emoji: string }> = {
  combat: { label: "Combat", emoji: "⚔️" },
  construction: { label: "Construction", emoji: "🏗️" },
  recherche: { label: "Recherche", emoji: "🔬" },
  flotte: { label: "Flotte", emoji: "🚀" },
  missions: { label: "Missions et contrats", emoji: "🧭" },
  logistique: { label: "Renseignement et logistique", emoji: "🛰️" },
  alliance: { label: "Alliance", emoji: "🤝" },
  menaces: { label: "Menaces", emoji: "☠️" },
  prestige: { label: "Prestige", emoji: "🏆" },
};

/* ---------- mesures ---------- */

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
// v3.6 : les bâtiments de fin de partie (niveau 10 au plus) ne comptent pas.
const buildingLevels = (p: PlayerState) => BUILDINGS.filter((b) => !b.endgame).map((b) => p.buildings?.[b.id]?.level ?? 0);
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
export function setAchievements(defs: AchievementDef[]) {
  ACHIEVEMENTS.splice(0, ACHIEVEMENTS.length, ...defs);
}
setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS));

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
