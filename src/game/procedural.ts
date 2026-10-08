import { ACHIEVEMENTS, METRICS, paceThreshold, TIER_REWARDS, type AchievementDef, type AchievementTier } from "@/game/achievements";
import {
  chronicleMonthId,
  chronicleOf,
  chronicleState,
  episodeUnlockMs,
  unlockedEpisodes,
  type ChapterAuto,
  type ChronicleCodexEntry,
  type ChronicleEpisode,
  type ChronicleMonth,
  type ChronicleObjective,
} from "@/game/chronicles";
import { parisOffsetMs } from "@/game/events";
import { formatInt, formatPct } from "@/game/format";
import { activePass, passState, passTier, PASS_RULES, type MonthPass, type PassReward } from "@/game/seasonPass";
import { actionPlayable, hasActivityData, passGenRules, percentile, type PassPace } from "@/game/passGen";
import { budgetEpisodeRewards, chronicleGenRules, objectiveWeight } from "@/game/chronicleGen";
import { CATALOG_START, catalogEntryFor } from "@/game/seasonCatalog";
import { seasonLabel } from "@/game/seasons";
import { STORY_SPEAKERS, type Speaker, type StoryLine } from "@/game/story";
import { chooseNovelty, contentToMeasure, hasContentAccess, NOVELTY_RULES, noveltyTexts } from "@/game/novelty";
import {
  extraObjectives,
  familyBase,
  measuredPlayable,
  NEW_OBJECTIVES,
  objectiveDeed,
  objectiveLabel,
  objectiveOrders,
  parseContentObjective,
  type StaticObjective,
} from "@/game/trackedActions";
import type { CapsuleType } from "@/game/synthesis";
import { FACTIONS, type FactionDef } from "@/game/pirates";
import type { PlayerState } from "@/types/game";

/* =====================================================
   v5.4 : générateur procédural. Chaque mois, un chapitre complet des
   Chroniques est écrit à partir de ce que les joueurs ont réellement fait
   le mois précédent :
   - scénario en quatre actes (antagoniste, allié, rebondissement, joueurs
     cités en exemple), prologue et titres d'épisodes ;
   - objectifs calibrés sur l'activité médiane et sur le taux de réussite
     des épisodes précédents ;
   - récompenses d'épisode, titre, bannière de profil et récompense de fin
     de chapitre ;
   - fiches de Codex (dossier du boss, archives du mois écoulé) ;
   - passe de saison du mois (points par palier ajustés, paliers variés) ;
   - nouveaux paliers de succès quand des joueurs ont atteint le dernier.
   Tout est déterministe pour un mois et une variante donnés, et reste
   modifiable dans l'administration (onglet Chroniques).
===================================================== */

export const PROCEDURAL_KEY = "procedural";

/** 6.14.57 (AU27, AP-3) : version logique des générateurs, écrite dans `auto.generator` de chaque chapitre et passe générés.
 *  Elle monte quand une règle de génération change ce que le joueur reçoit (objectifs, défis, récompenses) : un brouillon ou un
 *  chapitre non commencé écrit par une version plus ancienne est régénéré (`outdatedChapters`, `outdatedPassDrafts`).
 *  1 : avant 6.14.57 (champ absent) ; 2 : 6.14.57 ; 3 : 6.14.58 (défis et épisodes faisables, AP-L3). */
export const GENERATOR_VERSION = { chapter: 3, pass: 3 };

export interface ProceduralSettings {
  enabled: boolean;
  /** Écrit les chapitres des mois sans chronique. */
  chapters: boolean;
  /** Génère un passe propre à chaque chapitre. */
  pass: boolean;
  /** Ajoute des paliers de succès. */
  achievements: boolean;
  /** Jour du mois (Paris) à partir duquel le chapitre suivant est écrit. */
  leadDay: number;
  /** 6.14.57 (AU27, AP-3) : régénère les brouillons de passe et les chapitres non commencés écrits par un générateur plus ancien. */
  regenerateOutdated: boolean;
  log: { atMs: number; text: string }[];
}

export const DEFAULT_PROCEDURAL: ProceduralSettings = { enabled: true, chapters: true, pass: true, achievements: true, leadDay: 20, regenerateOutdated: true, log: [] };

export function normalizeProcedural(raw: unknown): ProceduralSettings {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<ProceduralSettings>;
  const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
  return {
    enabled: bool(r.enabled, DEFAULT_PROCEDURAL.enabled),
    chapters: bool(r.chapters, DEFAULT_PROCEDURAL.chapters),
    pass: bool(r.pass, DEFAULT_PROCEDURAL.pass),
    achievements: bool(r.achievements, DEFAULT_PROCEDURAL.achievements),
    leadDay: Math.min(28, Math.max(1, Math.floor(Number(r.leadDay) || DEFAULT_PROCEDURAL.leadDay))),
    regenerateOutdated: bool(r.regenerateOutdated, DEFAULT_PROCEDURAL.regenerateOutdated),
    log: (Array.isArray(r.log) ? r.log : []).filter((l) => l && typeof l.text === "string").slice(-50),
  };
}

/* ---------- hasard reproductible ---------- */

function hashSeed(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function seededRandom(seed: string): () => number {
  let a = hashSeed(seed);
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T>(rng: () => number, xs: readonly T[]): T => xs[Math.floor(rng() * xs.length) % xs.length];
const fill = (text: string, vars: Record<string, string | number>) => text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
const ucfirst = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
/** « La Foreuse » → « la Foreuse » (milieu de phrase). */
const lcArticle = (name: string) => name.replace(/^(Le|La|Les|L')(?=[\s'])/, (a) => a.toLowerCase()).replace(/^L'/, "l'");
/** « La Foreuse » → « de la Foreuse », « Le Croiseur » → « du Croiseur ». */
/** « le Syndicat » → « du Syndicat », « la Meute » → « de la Meute », « l'Inquisition » → « de l'Inquisition ». */
const ofFaction = (f: string) => (/^le\s/.test(f) ? f.replace(/^le\s/, "du ") : `de ${f}`);
const ofName = (name: string) => (/^Le\s/.test(name) ? name.replace(/^Le\s/, "du ") : /^Les\s/.test(name) ? name.replace(/^Les\s/, "des ") : `de ${lcArticle(name)}`);
const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));
const round2 = (x: number) => Math.round(x * 100) / 100;

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/* ---------- photographie du monde ---------- */

export const ACTIVITY_KEYS: ChronicleObjective[] = ["contract", "bounty", "raidRepelled", "victory", "mission", "spy", "market", "warlordWin"];

/** 6.14.121 (AP-L7) : actions des archives et des héros du mois : celles d'avant, puis lune et colonies (registre). */
function storyKeys(): ChronicleObjective[] {
  return [...ACTIVITY_KEYS, ...NEW_OBJECTIVES];
}

/** 6.14.121 : actions mesurées dans la photographie du monde : celles d'avant, les assauts de boss, le registre et les contenus pratiqués. */
function digestKeys(passes: { activity?: Record<string, number> }[]): ChronicleObjective[] {
  const keys: ChronicleObjective[] = [...ACTIVITY_KEYS, "bossAssault", ...NEW_OBJECTIVES];
  const seen = new Set<string>(keys);
  for (const s of passes)
    for (const k of Object.keys(s.activity ?? {}))
      if (!seen.has(k) && parseContentObjective(k)) {
        seen.add(k);
        keys.push(k as ChronicleObjective);
      }
  return keys;
}

export interface WorldDigest {
  /** Mois observé (Paris). */
  monthId: string;
  observedDays: number;
  activePlayers: number;
  /** Activité médiane par joueur actif, ramenée à une semaine. */
  weeklyMedian: Partial<Record<ChronicleObjective, number>>;
  totals: Partial<Record<ChronicleObjective, number>>;
  /** Joueur le plus actif pour chaque action (cité dans le scénario). */
  heroes: Partial<Record<ChronicleObjective, { pseudo: string; count: number }>>;
  /** Épisodes du mois observé : part des joueurs actifs qui les ont terminés. */
  episodes: { type: ChronicleObjective; count: number; completion: number; open: boolean; daysOpen: number }[];
  passMedianTier: number;
  passTiers: number;
  passFinishedShare: number;
  chapterShare: number;
  /** v5.5 : nombre médian de membres actifs par alliance (saga d'alliance). */
  allianceSizeMedian?: number;
  /** 6.8.1 : points de passe par jour (joueur médian, plus actif), jusqu'au dernier palier pour ceux qui l'ont atteint. */
  passPace?: PassPace;
  /** 6.14.122 (AP-L8) : part des joueurs actifs qui ont accès à chaque contenu récent (épisode « nouveauté »). */
  access?: Record<string, number>;
}

type DigestPlayer = Pick<PlayerState, "pseudo" | "seasonPass" | "chronicle"> & Partial<Pick<PlayerState, "npc" | "lastActiveMs" | "resourcesUpdatedAtMs" | "allianceId" | "units" | "techLevels" | "buildings">>;

/** Jour du mois à Paris (1 à 31). */
export function parisDayOfMonth(now: number): number {
  return parisDay(now);
}

function parisDay(now: number): number {
  return new Date(now + parisOffsetMs(now)).getUTCDate();
}

export function worldDigest(players: DigestPlayer[], now: number): WorldDigest {
  const monthId = chronicleMonthId(now);
  const observedDays = Math.max(1, parisDay(now));
  const active = players.filter((p) => !p.npc && now - (p.lastActiveMs ?? p.resourcesUpdatedAtMs ?? 0) < 14 * 86_400_000);
  const passes = active.map((p) => passState(p, now));
  const weeklyMedian: WorldDigest["weeklyMedian"] = {};
  const totals: WorldDigest["totals"] = {};
  const heroes: WorldDigest["heroes"] = {};
  // 6.8.1 : les assauts de boss aussi (défis des paliers), sans entrer dans les objectifs des chapitres.
  // 6.14.121 (AP-L7) : et les actions du registre (lune, colonies, contenus pratiqués), mesurées avant d'entrer dans un tirage.
  for (const k of digestKeys(passes)) {
    const counts = passes.map((s) => s.activity?.[k] ?? 0);
    totals[k] = counts.reduce((a, b) => a + b, 0);
    weeklyMedian[k] = round2((median(counts) / observedDays) * 7);
    const best = counts.reduce((bi, c, i) => (c > counts[bi] ? i : bi), 0);
    if (counts[best] > 0) heroes[k] = { pseudo: active[best].pseudo, count: counts[best] };
  }
  const month = chronicleOf(now);
  const open = unlockedEpisodes(now);
  const states = active.map((p) => chronicleState(p, now));
  const share = (n: number) => (active.length > 0 ? round2(n / active.length) : 0);
  const episodes = (month?.episodes ?? []).map((e, i) => ({
    type: e.objective.type,
    count: e.objective.count,
    completion: share(states.filter((s) => s.claimed.includes(i)).length),
    open: i < open,
    daysOpen: Math.max(0, Math.floor((now - episodeUnlockMs(monthId, i)) / 86_400_000)),
  }));
  const seasonId = passes[0]?.seasonId ?? monthId;
  const tiers = passes.map((s) => passTier(s.points, s.seasonId));
  const passTiers = activePass(seasonId).tiers.length;
  return {
    monthId,
    observedDays,
    activePlayers: active.length,
    weeklyMedian,
    totals,
    heroes,
    episodes,
    passMedianTier: median(tiers),
    passTiers,
    passFinishedShare: share(tiers.filter((t) => t >= passTiers).length),
    chapterShare: month ? share(states.filter((s) => month.episodes.every((_, i) => s.claimed.includes(i))).length) : 0,
    passPace: passPace(passes, monthId, observedDays, now),
    // 6.14.122 (AP-L8) : accès des joueurs actifs aux contenus datés récents (unité débloquée, techno ouverte, bâtiment ouvert).
    access: contentAccess(active, now),
    allianceSizeMedian: median(Object.values(active.reduce<Record<string, number>>((acc, p) => (p.allianceId ? { ...acc, [p.allianceId]: (acc[p.allianceId] ?? 0) + 1 } : acc), {}))),
  };
}

/** 6.14.122 (AP-L8) : part des joueurs actifs qui ont accès à chaque contenu daté récent (absent : aucun contenu daté). */
function contentAccess(active: DigestPlayer[], now: number): Record<string, number> | undefined {
  const keys = contentToMeasure(now);
  if (keys.length === 0 || active.length === 0) return undefined;
  const out: Record<string, number> = {};
  for (const k of keys) out[k] = round2(active.filter((p) => hasContentAccess({ units: p.units ?? {}, techLevels: p.techLevels ?? {}, buildings: p.buildings ?? ({} as PlayerState["buildings"]) }, k)).length / active.length);
  return out;
}

/** 6.8.1 : points de passe par jour sur le mois observé. Un joueur au dernier palier compte jusqu'au jour où il l'a atteint
 *  (ses points ne montent plus ensuite) ; « plus actif » : centile réglable (passGen.topPercentile). */
function passPace(passes: ReturnType<typeof passState>[], monthId: string, observedDays: number, now: number): PassPace | undefined {
  const rates = passes
    .filter((s) => s.seasonId === monthId)
    .map((s) => {
      const days = s.finishedAtMs ? Math.max(1, observedDays - Math.floor((now - s.finishedAtMs) / 86_400_000)) : observedDays;
      return s.points / days;
    });
  if (rates.length === 0) return undefined;
  return { median: round2(median(rates)), top: round2(percentile(rates, passGenRules().topPercentile)) };
}

/* ---------- difficulté ---------- */

/** Nombre de base par épisode (une semaine de jeu normale). */
export const BASE_COUNTS: Record<StaticObjective, number> = {
  contract: 4,
  bounty: 2,
  raidRepelled: 2,
  victory: 3,
  bossAssault: 2,
  mission: 6,
  spy: 3,
  market: 3,
  warlordWin: 1,
  // 6.14.121 (AP-L7) : actions du registre (une semaine de jeu d'un joueur qui les pratique).
  moonUpgrade: 1,
  phalanxScan: 1,
  gateJump: 2,
  colonyConvoy: 10,
  colonyBase: 1,
  colonySpec: 1,
};

/** 6.14.121 : quantité de base d'une action (registre, ou famille par contenu : `trackedActions.familyBase`). */
export function baseCount(k: ChronicleObjective): number {
  const c = parseContentObjective(k);
  if (c) return familyBase(c.family);
  const n = Number(BASE_COUNTS[k as StaticObjective]);
  return Number.isFinite(n) ? n : 3;
}

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const BASE_COUNTS_META = {
  contract: { label: "Objectifs du jour terminés", min: 0, max: 100, hint: "Quantité de base d'un objectif de chapitre, avant la difficulté du mois." },
  bounty: { label: "Primes remplies", min: 0, max: 100 },
  raidRepelled: { label: "Raids repoussés", min: 0, max: 100 },
  victory: { label: "Victoires", min: 0, max: 100 },
  bossAssault: { label: "Assauts de boss", min: 0, max: 100 },
  mission: { label: "Missions", min: 0, max: 100 },
  spy: { label: "Espionnages", min: 0, max: 100 },
  market: { label: "Échanges au marché", min: 0, max: 100 },
  warlordWin: { label: "Victoires contre un seigneur", min: 0, max: 100 },
  moonUpgrade: { label: "Améliorations de lune (6.14.121)", min: 0, max: 100 },
  phalanxScan: { label: "Balayages de phalange (6.14.121)", min: 0, max: 100 },
  gateJump: { label: "Sauts par la porte (6.14.121)", min: 0, max: 100 },
  colonyConvoy: { label: "Convois de colonie arrivés (6.14.121)", min: 0, max: 100 },
  colonyBase: { label: "Bases avancées tenues (6.14.121)", min: 0, max: 100 },
  colonySpec: { label: "Colonies spécialisées (6.14.121)", min: 0, max: 100 },
};

/** Multiplicateur de difficulté : 1 si la moitié des joueurs termine les épisodes ouverts. */

export function chapterDifficulty(d: WorldDigest): { value: number; reasons: string[] } {
  const r = chronicleGenRules();
  const mature = r.matureEpisodeDays;
  const open = d.episodes.filter((e) => e.open && (e.daysOpen ?? mature) >= mature);
  if (d.activePlayers === 0 || open.length === 0) return { value: 1, reasons: [`Pas encore d'épisode ouvert depuis ${mature} jours : difficulté normale (×1).`] };
  const c = open.reduce((a, e) => a + e.completion, 0) / open.length;
  const value = round2(clamp(1 + (c - r.targetCompletion), r.difficultyMin, r.difficultyMax));
  const pctTxt = Math.round(c * 100);
  const why = value > 1.02 ? "les objectifs montent" : value < 0.98 ? "les objectifs baissent" : "difficulté inchangée";
  return {
    value,
    reasons: [`${pctTxt} % des ${d.activePlayers} joueurs actifs ont terminé les ${open.length} épisode(s) ouverts depuis au moins ${mature} jours (cible ${Math.round(r.targetCompletion * 100)} %) : ${why} (×${value}).`],
  };
}

/** Nombre demandé pour un objectif : activité médiane d'une semaine × difficulté. */
export function objectiveCount(type: ChronicleObjective, d: WorldDigest, difficulty: number): number {
  const r = chronicleGenRules();
  const base = baseCount(type);
  const m = d.weeklyMedian[type] ?? 0;
  // 6.14.58 (AU27, AP-4) : le plancher ne dépasse jamais la médiane du serveur (même règle que les défis du passe).
  const raw = m > 0 ? clamp(m * difficulty, Math.min(base * r.objectiveMinFactor, m), base * r.objectiveMaxFactor) : base * difficulty;
  return Math.max(1, Math.round(raw));
}

/* ---------- archétypes d'antagonistes ---------- */

type Voice = { speaker: Speaker } | { as: NonNullable<StoryLine["as"]> };

export interface Archetype {
  id: string;
  /** 6.14.125 (AA7) : faction hostile (onglet Factions) que l'archétype incarne ; une faction sans archétype reçoit un archétype de repli. */
  factionId?: string;
  faction: string;
  villain: Voice;
  ally: Speaker;
  accent: string;
  themeLabels: string[];
  image: string;
  emblem: string;
  fallbackImage: string;
  bossNames: string[];
  titles: string[];
  completionTitles: string[];
  lore: string[];
}

/** Archétypes dont l'illustration du boss existe (public/assets/chronicles/auto/<id>-boss.webp). */
export const AUTO_ART: string[] = ["confrerie", "cartel", "choeur", "gravhorn", "culte", "inquisition", "meute"];
/** 5.16 : archétypes dont le sceau existe (public/assets/chronicles/auto/<id>-sceau.webp), indépendamment du boss. */
export const AUTO_SEALS: string[] = ["confrerie", "cartel", "choeur", "gravhorn", "culte", "inquisition", "meute"];

export const ARCHETYPES: Archetype[] = [
  {
    id: "confrerie",
    factionId: "varan",
    faction: "la Confrérie du Vide",
    villain: { speaker: "varan" },
    ally: "vashka",
    accent: "#ff7a45",
    themeLabels: ["Braise du Vide", "Rouille et cendre", "Feu de proue"],
    image: "/assets/chronicles/2026-10-boss.webp",
    emblem: "/assets/chronicles/2026-10-sceau.webp",
    fallbackImage: "/assets/story/varan.webp",
    bossNames: ["Le Croiseur-Dette", "La Forge du Silencieux", "Le Brûle-Noms", "L'Arche des Créanciers"],
    titles: ["Les Cendres de la Liste", "La Dette de sang", "Le Retour du Silencieux", "Les Noms effacés"],
    completionTitles: ["Briseur de Listes", "Créancier du Vide", "Effaceur de dettes", "Ombre de Varan"],
    lore: ["Un vaisseau de la Confrérie, rafistolé avec les épaves de ceux qui n'ont pas payé. Sa coque porte la liste de ses prochaines cibles.", "La Confrérie ne pardonne rien : chaque dette impayée finit gravée sur sa coque, chaque nom rayé devient un trophée."],
  },
  {
    id: "cartel",
    factionId: "cartel",
    faction: "le Cartel Néon",
    villain: { speaker: "kor" },
    ally: "nerea",
    accent: "#ff5fd2",
    themeLabels: ["Néon du Cartel", "Rose casino", "Lueur de jackpot"],
    image: "/assets/chronicles/2026-11-boss.webp",
    emblem: "/assets/chronicles/2026-11-sceau.webp",
    fallbackImage: "/assets/story/cartel.webp",
    bossNames: ["Le Casino-Forteresse", "La Banque Hurlante", "Le Jackpot Écarlate", "La Roue de Kor"],
    titles: ["La Mise de Kor", "Faites vos jeux", "La Banque saute", "Le Dernier Jeton"],
    completionTitles: ["Briseur de banque", "Joueur maudit", "Croupier noir", "Main de fer"],
    lore: ["Un casino volant où l'on parie des planètes. Ses tables sont des tourelles, ses croupiers des machines de guerre.", "Le Cartel achète tout ce qui se vend et vole le reste ; ses dettes se règlent en vaisseaux."],
  },
  {
    id: "choeur",
    factionId: "choeur",
    faction: "le Chœur Silencieux",
    villain: { speaker: "vesper" },
    ally: "ilyon",
    accent: "#9fd8ff",
    themeLabels: ["Givre du Chœur", "Bleu de cristal", "Écho glacé"],
    image: "/assets/chronicles/2026-12-boss.webp",
    emblem: "/assets/chronicles/2026-12-sceau.webp",
    fallbackImage: "/assets/story/choeur.webp",
    bossNames: ["L'Orgue des Abysses", "Le Psaume Noir", "La Cloche sans bouche", "Le Chantre de Givre"],
    titles: ["La Note perdue", "Le Silence revient", "Les Voix gelées", "Le Contre-Chant"],
    completionTitles: ["Voix du silence", "Briseur d'échos", "Chantre libre", "Porte-voix"],
    lore: ["Une cathédrale de cristal qui chante sans bouche. Là où passe son écho, les transmissions gèlent.", "Le Chœur ne parle pas : il accorde. Ceux qui l'entendent trop longtemps oublient leur propre voix."],
  },
  {
    id: "gravhorn",
    factionId: "gravhorn",
    faction: "le Syndicat Gravhorn",
    villain: { speaker: "kragmor" },
    ally: "lysa",
    accent: "#7fd1ff",
    themeLabels: ["Acier Gravhorn", "Bleu de forage", "Éclat de minerai"],
    image: "/assets/chronicles/2027-01-boss.webp",
    emblem: "/assets/chronicles/2027-01-sceau.webp",
    fallbackImage: "/assets/story/gravhorn.webp",
    bossNames: ["La Foreuse-Mère", "Le Concasseur d'astéroïdes", "La Plate-forme Ambre", "Le Bélier de Kragmor"],
    titles: ["La Ruée vers l'ambre", "Le Filon maudit", "Les Contrats de fer", "La Grande Excavation"],
    completionTitles: ["Briseur de foreuses", "Contremaître rebelle", "Cœur de minerai", "Pied-de-fer"],
    lore: ["Une plate-forme de forage géante qui avale des astéroïdes entiers et recrache des flottes.", "Le Syndicat vend le secteur au poids ; tout ce qui ne se mine pas se rase."],
  },
  {
    id: "culte",
    faction: "le culte de Maru",
    villain: { speaker: "maru" },
    ally: "vashka",
    accent: "#7dff9a",
    themeLabels: ["Vert des racines", "Sève de Maru", "Mousse des abysses"],
    image: "/assets/chronicles/2027-03-boss.webp",
    emblem: "/assets/chronicles/2027-03-sceau.webp",
    fallbackImage: "/assets/leviathan/leviathan.webp",
    bossNames: ["Le Colosse-Racine", "La Graine du Léviathan", "Le Jardin dévorant", "L'Arbre-Prophète"],
    titles: ["La Floraison noire", "Les Graines du dieu", "La Sève monte", "Le Réveil des racines"],
    completionTitles: ["Arracheur de racines", "Élagueur", "Hérétique de Maru", "Jardinier de cendres"],
    lore: ["Un colosse de chair et de racines, cultivé en l'honneur du Léviathan. Il grandit à chaque prière.", "Le culte plante ses graines dans les épaves ; au printemps suivant, les épaves marchent."],
  },
  {
    id: "inquisition",
    factionId: "inquisition",
    faction: "l'Inquisition de l'Aube Blanche",
    villain: { as: { name: "Haut-Juge Séraphin Vol", role: "Inquisition de l'Aube Blanche", image: "/assets/story/inquisition.webp", color: "#e8f4ff" } },
    ally: "brannoc",
    accent: "#ffe9a8",
    themeLabels: ["Aube blanche", "Or liturgique", "Lumière froide"],
    image: "/assets/chronicles/2027-02-boss.webp",
    emblem: "/assets/chronicles/2027-02-sceau.webp",
    fallbackImage: "/assets/story/inquisition.webp",
    bossNames: ["Le Tribunal Ardent", "La Nef du Jugement", "Le Bûcher Orbital", "Le Lecteur Éternel"],
    titles: ["Le Grand Procès", "La Sentence", "L'Index des hérétiques", "L'Aube des juges"],
    completionTitles: ["Hérétique notoire", "Briseur de sentences", "Acquitté", "Juge des juges"],
    lore: ["Une nef-tribunal qui juge les empires en orbite et exécute la sentence dans la foulée.", "L'Inquisition tient un index des hérétiques ; y figurer coûte une flotte, en sortir en coûte deux."],
  },
  {
    id: "meute",
    factionId: "meute",
    faction: "la Meute d'Ysgrim",
    villain: { as: { name: "Ysgrim Crocs-de-Fer", role: "Meute d'Ysgrim", image: "/assets/story/meute.webp", color: "#ff9a5c" } },
    ally: "brannoc",
    accent: "#ff9a5c",
    themeLabels: ["Croc de rouille", "Sang de meute", "Ambre sauvage"],
    image: "/assets/story/meute.webp",
    emblem: "/assets/chronicles/2026-10-sceau.webp",
    fallbackImage: "/assets/story/meute.webp",
    bossNames: ["La Louve Rouge", "Le Terrier d'Acier", "La Grande Chasse", "Le Croc-Monde"],
    titles: ["La Saison de chasse", "Les Crocs dans la nuit", "Le Hurlement", "La Curée"],
    completionTitles: ["Tueur de loups", "Chef de meute", "Croc d'argent", "Pisteur"],
    lore: ["Le vaisseau-tanière d'Ysgrim, hérissé de crocs d'abordage. Il ne frappe que les proies isolées.", "La Meute chasse en cercle ; quand on l'entend hurler, elle est déjà là."],
  },
];

/* ---------- 6.14.125 (AU27, lot AA7, constat AA-20) : archétype de repli d'une faction ajoutée dans l'admin ---------- */

/** Couleur d'accent d'une faction (jeton du thème) → teinte du chapitre (donnée de contenu, comme `accent` des archétypes). */
const FACTION_ACCENTS: Record<string, string> = { ember: "#ff7a45", gold: "#ffd166", cyan: "#7fd1ff", mint: "#7dff9a", danger: "#ff4d6d" };

/** Archétype construit depuis la fiche d'une faction (chef, exécuteur, repaire, récit, images). */
export function factionArchetype(f: Pick<FactionDef, "id" | "name" | "leader" | "enforcer" | "art" | "banner" | "emblem" | "color" | "story" | "ultimatum" | "lair">): Archetype {
  const accent = FACTION_ACCENTS[f.color] ?? FACTION_ACCENTS.ember;
  const paragraphs = String(f.story ?? "")
    .split(/\n\s*\n/)
    .map((x) => x.trim())
    .filter(Boolean);
  const name = f.name || f.id;
  return {
    id: f.id,
    factionId: f.id,
    faction: `la faction ${name}`,
    villain: { as: { name: f.leader || name, role: name, image: f.art, color: accent } },
    ally: "vashka",
    accent,
    themeLabels: [`Couleurs de ${name}`, "Ombre du secteur", "Lueur d'ultimatum"],
    image: f.banner || f.art,
    emblem: f.emblem || f.art,
    fallbackImage: f.art,
    bossNames: ["Le Vaisseau-amiral", "La Flotte de l'ultimatum", `Le Bras de ${f.enforcer || f.leader || name}`, "La Forteresse noire"],
    titles: ["Le Grand Ultimatum", "La Liste noire", "Le Tribut de sang", "L'Ombre sur le secteur"],
    completionTitles: [f.lair?.title || "Briseur d'ultimatums", "Briseur d'ultimatums", "Rempart du secteur", "Libérateur"],
    lore: paragraphs.length > 0 ? paragraphs.slice(0, 2) : [f.ultimatum?.quote?.replace(/\{pseudo\}/g, "commandant") || `${name} tient le secteur sous sa menace.`],
  };
}

/**
 * Archétypes du générateur de chapitres et de sagas : ceux du jeu, puis un archétype de repli pour chaque faction active qui
 * n'en a pas (faction ajoutée dans l'admin). À factions par défaut, la liste est celle d'avant la 6.14.125 (mêmes tirages).
 */
export function chapterArchetypes(): Archetype[] {
  const covered = new Set(ARCHETYPES.flatMap((a) => [a.id, a.factionId ?? a.id]));
  const extra = FACTIONS.filter((f) => f && f.enabled !== false && f.id && !covered.has(f.id)).map(factionArchetype);
  return extra.length > 0 ? [...ARCHETYPES, ...extra] : ARCHETYPES;
}

function voiceLine(v: Voice, text: string): StoryLine {
  return "speaker" in v ? { speaker: v.speaker, text: ucfirst(text) } : { speaker: "vashka", as: v.as, text: ucfirst(text) };
}

function villainName(v: Voice): string {
  return "speaker" in v ? STORY_SPEAKERS[v.speaker].name : v.as.name;
}

/* ---------- scénario ---------- */

const ACT_TITLES = [
  ["Les premiers signes", "L'appel", "Le signal", "Les rumeurs", "La brèche"],
  ["La traque", "Les routes rouges", "Sur la piste", "Le filet", "Les éclaireurs"],
  ["Le prix du silence", "La trahison", "Les masques tombent", "Le pacte brisé", "Le double jeu"],
  ["L'assaut", "La dernière nuit", "Le jugement", "La chute", "Tous ensemble"],
];

const HOOKS: string[][] = [
  [
    "{villain} refait surface, {pseudo}. Et pas les mains vides : {boss} quitte son chantier.",
    "Mes éclaireurs ont repéré la signature {ofFaction} aux confins du secteur. Ils préparent quelque chose de grand.",
    "On parle de {boss} dans tous les ports. Personne ne l'a vu, mais tout le monde l'a entendu.",
  ],
  [
    "Ils se croient à l'abri derrière leurs routes. Remontons-les une à une.",
    "Chaque coup porté maintenant leur coûtera une semaine de préparatifs.",
    "{faction} a besoin de temps. Ne lui en laissons aucun.",
  ],
  [
    "Un de nos informateurs a changé de camp. {villain} sait déjà où nous frapperons.",
    "Les seigneurs de guerre ont été payés pour regarder ailleurs. Certains, pour regarder vers nous.",
    "Le plan a changé : {boss} n'est pas une arme, c'est un appât. Et l'appât, c'est le secteur entier.",
  ],
  [
    "Le dernier week-end du mois, {boss} sortira de l'ombre. Tout le secteur devra frapper ensemble.",
    "C'est maintenant ou jamais. Rassemble ta flotte : {boss} arrive.",
    "{villain} a mis toutes ses forces dans {boss}. S'il tombe, {faction} tombe avec lui.",
  ],
];

const VILLAIN_TAUNTS = [
  "{pseudo}… Ton nom revient souvent. Trop souvent.",
  "Vous pensiez avoir gagné le mois dernier ? Je ne faisais que compter vos forces.",
  "Chaque empire a un prix. Je viens chercher le tien.",
  "Continue de t'agiter, petit commandant. {boss} adore les proies qui bougent.",
];


const HERO_LINES = [
  "Le mois dernier, {hero} a {deed}. Le secteur s'en souvient ; {villain} aussi.",
  "On raconte que {hero} a {deed} en un mois. Voilà l'exemple à suivre.",
  "{hero} a {deed} ; {villain} a mis sa tête à prix. Ça ne passe pas inaperçu.",
];

function heroLine(rng: () => number, d: WorldDigest, vars: Record<string, string | number>): string | null {
  const keys = storyKeys().filter((k) => d.heroes[k]);
  if (keys.length === 0) return null;
  const k = pick(rng, keys);
  const h = d.heroes[k]!;
  return fill(pick(rng, HERO_LINES), { ...vars, hero: h.pseudo, deed: fill(objectiveDeed(k), { n: h.count }) });
}

/* ---------- objectifs ---------- */

function chooseObjectives(rng: () => number, d: WorldDigest, previous: ChronicleObjective[]): ChronicleObjective[] {
  // 6.14.58 (AU27, AP-4) : seuil des actions passives unifié avec le passe (raids, seigneurs : médiane ≥ passiveMinWeekly).
  const passive = passGenRules().passiveKeys;
  // 6.14.121 (AP-L7) : actions du registre ajoutées en fin de liste, seulement si le serveur les pratique (médiane ≥
  // `trackedActions.measuredMinWeekly`) : sans mesure, la liste et le tirage d'avant ne changent pas.
  const extra = extraObjectives().filter((k) => measuredPlayable(k, d.weeklyMedian) && actionPlayable(k, d.weeklyMedian) && objectiveWeight(k) > 0);
  const playable = [...ACTIVITY_KEYS.filter((k) => !passive.includes(k) || actionPlayable(k, d.weeklyMedian)), ...extra];
  // 6.8.2 : actions autorisées et pondérées (chronicleGen.objectiveWeights) ; il en faut 4 (sinon toutes celles jouables).
  const allowed = playable.filter((k) => objectiveWeight(k) > 0);
  const pool = allowed.length >= 4 ? allowed : playable;
  const weight = (k: ChronicleObjective) => (1 + Math.min(3, d.weeklyMedian[k] ?? 0)) * (previous.includes(k) ? 0.4 : 1) * (objectiveWeight(k) || 1);
  const chosen: ChronicleObjective[] = [];
  // Une action peu pratiquée pour varier le jeu (la moins faite des actions courantes).
  // 6.14.58 (Q-AP4) : peu pratiquée mais faisable : médiane du serveur ≥ chronicleGen.stretchMinWeekly (sans mesure : comme avant).
  const minStretch = chronicleGenRules().stretchMinWeekly;
  const rare = [...pool].filter((k) => k !== "warlordWin").sort((a, b) => (d.weeklyMedian[a] ?? 0) - (d.weeklyMedian[b] ?? 0));
  const doable = hasActivityData(d.weeklyMedian) ? rare.filter((k) => (d.weeklyMedian[k] ?? 0) >= minStretch) : rare;
  const stretchPool = doable.length >= 2 ? doable : rare;
  const stretch = stretchPool[Math.floor(rng() * 2)];
  while (chosen.length < 3) {
    const left = pool.filter((k) => !chosen.includes(k) && k !== stretch);
    const total = left.reduce((a, k) => a + weight(k), 0);
    let r = rng() * total;
    const k = left.find((x) => (r -= weight(x)) <= 0) ?? left[0];
    chosen.push(k);
  }
  // Le rebondissement (acte 3) prend l'action « nouvelle » ; le final, la plus pratiquée.
  chosen.sort((a, b) => (d.weeklyMedian[a] ?? 0) - (d.weeklyMedian[b] ?? 0));
  return [chosen[1], chosen[0], stretch, chosen[2]];
}

/* ---------- récompenses ---------- */

const CAPSULE_ROTATION: CapsuleType[] = ["assault", "armor", "decoy", "veil"];

function episodeRewards(rng: () => number, difficulty: number): PassReward[][] {
  const cap = CAPSULE_ROTATION[Math.floor(rng() * CAPSULE_ROTATION.length)];
  return [
    [{ kind: "amber", amount: Math.max(10, Math.round((15 * difficulty) / 5) * 5) }],
    [{ kind: "capsule", capsule: cap, level: difficulty >= 1.15 ? 4 : 3 }],
    [{ kind: "production", hours: Math.max(2, Math.round(3 * difficulty)) }],
    [{ kind: "dossier", count: 1 }],
  ];
}

function bannerGradient(accent: string): string {
  return `linear-gradient(120deg,#05070f 0%,${accent}40 45%,${accent} 100%)`;
}

/** Passe du mois : points par palier selon la réussite du mois observé, paliers variés. */
export function generatePass(rng: () => number, d: WorldDigest, base: number): { pass: MonthPass; reasons: string[] } {
  let ppt = base;
  const reasons: string[] = [];
  const done = Math.round(d.passFinishedShare * 100);
  if (d.activePlayers > 0 && d.passFinishedShare > 0.4) {
    ppt = base * 1.15;
    reasons.push(`${done} % des joueurs ont fini le passe : palier plus long.`);
  } else if (d.activePlayers > 0 && d.passFinishedShare < 0.1 && d.passMedianTier < 10) {
    ppt = base * 0.85;
    reasons.push(`Seulement ${done} % ont fini le passe (palier médian ${d.passMedianTier}) : palier plus court.`);
  } else reasons.push(`Passe : rythme conservé (${done} % l'ont fini, palier médian ${d.passMedianTier}).`);
  ppt = clamp(Math.round(ppt / 5) * 5, 25, 80);
  reasons.push(`Points par palier : ${base} → ${ppt}.`);
  const start = Math.floor(rng() * CAPSULE_ROTATION.length);
  let capIdx = 0;
  const tiers: PassReward[][] = [];
  for (let t = 1; t <= 30; t++) {
    if (t === 30) tiers.push([{ kind: "relic", rarity: "epic" }, { kind: "amber", amount: 40 }, { kind: "cosmetic" }]);
    else if (t === 20) tiers.push([{ kind: "relic", rarity: "rare" }]);
    else if (t === 10) tiers.push([{ kind: "amber", amount: 40 }, { kind: "production", hours: 4 }]);
    else if (t % 10 === 5) tiers.push(t === 5 ? [{ kind: "dossier", count: 1 }] : [{ kind: "dossier", count: 1 }, { kind: "amber", amount: 30 + (t > 20 ? 10 : 0) }]);
    else {
      const slot = (t + start) % 3;
      if (slot === 0) tiers.push([{ kind: "production", hours: Math.min(12, 2 + Math.floor(t / 3)) }]);
      else if (slot === 1) tiers.push([{ kind: "amber", amount: 20 + Math.floor(t / 10) * 10 }]);
      else tiers.push([{ kind: "capsule", capsule: CAPSULE_ROTATION[(start + capIdx++) % CAPSULE_ROTATION.length], level: t < 10 ? 3 : t < 20 ? 4 : 5 }]);
    }
    // v5.12 : des jetons du casino aux paliers 7, 17 et 27.
    if (t % 10 === 7) tiers[tiers.length - 1].push({ kind: "tokens", count: t > 20 ? 2 : 1 });
  }
  return { pass: { pointsPerTier: ppt, tiers }, reasons };
}

/* ---------- codex ---------- */

function archivesText(d: WorldDigest, label: string): string {
  const parts = [`Archives du secteur, ${label} : ${d.activePlayers} commandants actifs.`];
  const deeds = storyKeys().filter((k) => (d.totals[k] ?? 0) > 0).map((k) => fill(objectiveDeed(k), { n: d.totals[k]! }));
  if (deeds.length > 0) parts.push(`Ensemble, ils ont ${deeds.join(", ")}.`);
  const heroes = storyKeys().filter((k) => d.heroes[k]).map((k) => `${d.heroes[k]!.pseudo} (${objectiveLabel(k).toLowerCase()} : ${d.heroes[k]!.count})`);
  if (heroes.length > 0) parts.push(`Noms retenus : ${heroes.join(", ")}.`);
  parts.push(`${Math.round(d.chapterShare * 100)} % ont terminé le chapitre, ${Math.round(d.passFinishedShare * 100)} % le passe de saison.`);
  return parts.join(" ");
}

/* ---------- chapitre ---------- */

export interface GenerateOptions {
  monthId: string;
  digest: WorldDigest;
  /** Mois déjà écrits (pour éviter les répétitions). */
  existing: ChronicleMonth[];
  settings?: Pick<ProceduralSettings, "pass">;
  now: number;
  /** Change le tirage (bouton « Régénérer »). */
  variant?: number;
}

export function generateChapter(o: GenerateOptions): ChronicleMonth {
  const rng = seededRandom(`${o.monthId}:${o.variant ?? 0}`);
  const d = o.digest;
  const recent = [...o.existing].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)).slice(-2);
  const archetypes = chapterArchetypes();
  const recentArch = recent.map((m) => m.auto?.archetype ?? archetypes.find((a) => a.fallbackImage === m.boss.fallbackImage)?.id);
  const gen = chronicleGenRules();
  // Tirage d'abord (la suite du tirage ne dépend pas du thème), puis 6.8.2 : la faction du thème du passe, sauf si elle revient deux mois de suite.
  const drawn = pick(rng, archetypes.filter((a) => !recentArch.includes(a.id)));
  const themeId = o.monthId >= CATALOG_START ? catalogEntryFor(o.monthId).theme : null;
  const themed = gen.followPassTheme && themeId ? archetypes.find((a) => a.id === gen.themeArchetypes[themeId]) : undefined;
  const arch = themed && themed.id !== recentArch.at(-1) ? themed : drawn;
  const usedTitles = new Set(o.existing.flatMap((m) => [m.title, m.completion?.title ?? "", m.boss.name]));
  const fresh = (xs: string[]) => pick(rng, xs.filter((x) => !usedTitles.has(x)).length ? xs.filter((x) => !usedTitles.has(x)) : xs);
  const title = fresh(arch.titles);
  const bossName = fresh(arch.bossNames);
  const completionTitle = fresh(arch.completionTitles);
  const { value: difficulty, reasons } = chapterDifficulty(d);
  const previousTypes = (recent.at(-1)?.episodes ?? []).map((e) => e.objective.type);
  const types = chooseObjectives(rng, d, previousTypes);
  // 6.8.2 : récompenses des épisodes tirées sous budget, avec leur propre graine (l'ancien tirage reste fait : le reste du chapitre ne change pas).
  const template = episodeRewards(rng, difficulty);
  const rewards = gen.enabled ? budgetEpisodeRewards(seededRandom(`chapter-rewards:${o.monthId}:${o.variant ?? 0}`), difficulty, gen) : template;
  if (themed) reasons.push(arch === themed ? `Faction du thème du passe (${themeId}) : ${arch.faction}.` : `Le thème du passe (${themeId}) appelait ${themed.faction}, déjà là le mois dernier : faction tirée au sort.`);
  if (gen.enabled) reasons.push(`Récompenses des épisodes tirées sous budget : ${round2(gen.episodeBudgetHours * difficulty)} h de production équivalentes (×${difficulty}).`);
  const vars: Record<string, string | number> = { villain: villainName(arch.villain), boss: lcArticle(bossName), faction: arch.faction, ofFaction: ofFaction(arch.faction) };
  const usedActs = new Set<string>();
  const episodes: ChronicleEpisode[] = types.map((type, i) => {
    const count = objectiveCount(type, d, difficulty);
    const lines: StoryLine[] = [];
    if (i === 0) {
      lines.push(voiceLine(arch.villain, fill(pick(rng, VILLAIN_TAUNTS), vars)));
      const hero = heroLine(rng, d, vars);
      if (hero) lines.push({ speaker: arch.ally, text: ucfirst(hero) });
    }
    if (i === 2) lines.push(voiceLine(arch.villain, fill(pick(rng, VILLAIN_TAUNTS.filter((t) => !lines.some((l) => l.text === fill(t, vars)))), vars)));
    lines.push({ speaker: arch.ally, text: ucfirst(fill(pick(rng, HOOKS[i]), vars)) });
    lines.push({ speaker: arch.ally, text: ucfirst(fill(pick(rng, objectiveOrders(type)), { ...vars, count, s: count > 1 ? "s" : "" })) });
    let epTitle = pick(rng, ACT_TITLES[i]);
    while (usedActs.has(epTitle)) epTitle = pick(rng, ACT_TITLES[i]);
    usedActs.add(epTitle);
    return { title: epTitle, lines, objective: { type, count }, reward: rewards[i] };
  });
  reasons.push(...types.map((t, i) => `Épisode ${i + 1} : ${objectiveLabel(t).toLowerCase()} × ${episodes[i].objective.count} (médiane ${d.weeklyMedian[t] ?? 0} par semaine, base ${baseCount(t)}).`));
  // 6.14.122 (AU27, AP-L8) : épisode « nouveauté » : un contenu ajouté récemment prend un épisode (sa propre graine : le reste du
  // chapitre ne change pas ; aucun contenu daté récent : rien ne change).
  const nov = chooseNovelty(o.monthId, o.existing, d.access, d.activePlayers);
  if (nov.reason) reasons.push(nov.reason);
  let novelty: ChapterAuto["novelty"];
  if (nov.pick) {
    const p = nov.pick;
    const i = p.episode - 1;
    const nrng = seededRandom(`novelty:${o.monthId}:${o.variant ?? 0}`);
    const texts = noveltyTexts(parseContentObjective(p.key)!.family, NOVELTY_RULES);
    const ep = episodes[i];
    const titles = texts.titles.filter((t) => !episodes.some((e, j) => j !== i && e.title === t));
    const nvars = { ...vars, name: p.name, count: p.count, s: p.count > 1 ? "s" : "" };
    episodes[i] = {
      ...ep,
      title: pick(nrng, titles.length > 0 ? titles : texts.titles),
      lines: [...ep.lines.slice(0, Math.max(0, ep.lines.length - 2)), { speaker: arch.ally, text: ucfirst(fill(pick(nrng, texts.hooks), nvars)) }, { speaker: arch.ally, text: ucfirst(fill(pick(nrng, texts.orders), nvars)) }],
      objective: { type: p.key, count: p.count },
    };
    novelty = { key: p.key, addedOn: p.addedOn, episode: p.episode };
    reasons.push(p.reason);
  }
  const art = AUTO_ART.includes(arch.id);
  const seal = AUTO_SEALS.includes(arch.id);
  const label = seasonLabel(d.monthId);
  const codex: ChronicleCodexEntry[] = [
    { id: "dossier", name: `Dossier : ${bossName}`, subtitle: `${ucfirst(arch.faction)} · ${title}`, text: `${arch.lore.join(" ")} Commandement : ${vars.villain}.`, image: art ? `/assets/chronicles/auto/${arch.id}-boss.webp` : arch.image },
    { id: "archives", name: `Archives : ${label}`, subtitle: "Ce que le secteur a accompli", text: archivesText(d, label), image: seal ? `/assets/chronicles/auto/${arch.id}-sceau.webp` : arch.emblem },
  ];
  const auto: ChapterAuto = {
    generatedAtMs: o.now,
    sourceMonth: d.monthId,
    archetype: arch.id,
    difficulty,
    activePlayers: d.activePlayers,
    reasons,
    generator: GENERATOR_VERSION.chapter,
    variant: Math.max(0, Math.floor(o.variant ?? 0)),
    ...(novelty ? { novelty } : {}),
  };
  const month: ChronicleMonth = {
    id: o.monthId,
    title,
    theme: { accent: arch.accent, label: pick(rng, arch.themeLabels) },
    boss: {
      name: bossName,
      title: `Pourfendeur ${ofName(bossName)}`,
      image: art ? `/assets/chronicles/auto/${arch.id}-boss.webp` : arch.image,
      emblem: seal ? `/assets/chronicles/auto/${arch.id}-sceau.webp` : arch.emblem,
      fallbackImage: arch.fallbackImage,
      lore: pick(rng, arch.lore),
    },
    episodes,
    synopsis: fill(`${pick(rng, arch.lore)} Ce mois-ci, {villain} lance {boss} contre le secteur. ${ucfirst(heroLine(rng, d, vars) ?? "")}`.trim(), vars),
    completion: { title: completionTitle, banner: bannerGradient(arch.accent), rewards: [{ kind: "relic", rarity: difficulty >= gen.completionEpicFrom ? "epic" : "rare" }, { kind: "amber", amount: gen.completionAmber }] },
    codex,
    auto,
  };
  if (o.settings?.pass !== false) {
    const prev = activePass(d.monthId).pointsPerTier || PASS_RULES.pointsPerTier;
    const g = generatePass(rng, d, prev);
    month.pass = g.pass;
    auto.reasons.push(...g.reasons);
  }
  return month;
}

/** 6.14.57 (AU27, AP-3) : chapitres générés par une version plus ancienne du générateur, à régénérer. Jamais un chapitre
 *  commencé (premier épisode ouvert), jamais un chapitre écrit ou repris de la bibliothèque (sans `auto`, I17), jamais un
 *  chapitre retouché dans l'admin (`auto.editedAtMs`). */
export function outdatedChapters(months: ChronicleMonth[], now: number): ChronicleMonth[] {
  return months.filter((m) => m && m.auto && !m.auto.editedAtMs && (m.auto.generator ?? 1) < GENERATOR_VERSION.chapter && episodeUnlockMs(m.id, 0) > now);
}

/** Mois à écrire maintenant : le mois en cours s'il n'a pas de chronique, et le suivant à partir de `leadDay`. */
export function monthsToGenerate(existing: Pick<ChronicleMonth, "id">[], now: number, leadDay: number): string[] {
  const current = chronicleMonthId(now);
  const [y, m] = current.split("-").map(Number);
  const next = m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
  const ids = new Set(existing.map((x) => x.id));
  const out: string[] = [];
  if (!ids.has(current)) out.push(current);
  if (parisDay(now) >= leadDay && !ids.has(next)) out.push(next);
  return out;
}

/* ---------- succès : paliers suivants ---------- */

// 6.14.14 : allianceBossTypes plafonne au nombre de boss d'alliance (le palier complet est allianceBossAll).
const NO_EXTENSION = new Set(["maxBuildingLevel", "minBuildingLevel", "maxTechLevel", "maxUnitLevel", "allianceBossTypes", "coloniesFounded"]);
const NEXT_TIER: Record<AchievementTier, AchievementTier> = { bronze: "argent", argent: "or", or: "legendaire", legendaire: "legendaire", mythique: "mythique" };
const ROMAN = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
const DAY_MS_ACH = 86_400_000;
/** Identifiant d'un palier écrit par le générateur (`<succès>_auto<n>`), à distinguer des succès dérivés marqués `auto`. */
const GENERATED_TIER_ID = /_auto\d+$/;

/* 6.14.108 (AU27, AP-L4, constat AP-5, Q82 et Q89) : paliers de succès générés bridés. Avant : un seul détenteur suffisait, un
   palier par mesure et par jour, toujours légendaire avec titre (47 paliers en 3 jours sur la pré-prod, 37 titres). Les paliers déjà
   créés restent (données des joueurs) : le bridage ne vaut que pour la suite. Valeurs littérales (initialisation des modules). */
export const ACHIEVEMENT_GEN_RULES = {
  /** Détenteurs minimum du dernier palier avant d'en générer un nouveau (joueurs actifs). */
  minHolders: 3,
  /** Part minimum des joueurs actifs qui détiennent le dernier palier (la plus exigeante des deux règles s'applique). */
  minHoldersShare: 0.1,
  /** Jours sans activité au-delà desquels un joueur ne compte plus parmi les actifs. */
  activeDays: 14,
  /** Jours entre deux paliers générés d'une même mesure (30 = un par mois). 0 = sans délai. */
  cooldownDays: 30,
  /** Paliers générés au plus par mesure (famille). 0 = sans plafond. */
  maxAutoPerFamily: 3,
  /** Titre décerné au dernier palier générable de la famille seulement (sinon : à chaque palier légendaire, comme avant). */
  titleOnLastOnly: true,
  /** Seuil du palier suivant : × `growthSmall` sous `smallBelow`, × `growthLarge` à partir de `largeFrom`, × `growth` entre les deux. */
  growthSmall: 3,
  smallBelow: 5,
  growth: 2,
  growthLarge: 1.5,
  largeFrom: 100,
};

/** 6.14.108 : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages et Admin → Règles). */
export const ACHIEVEMENT_GEN_RULES_META = {
  minHolders: { label: "Détenteurs minimum du dernier palier", unit: "joueurs", min: 1, max: 1000, hint: "Joueurs actifs qui doivent tenir le dernier palier avant qu'un palier plus dur soit généré." },
  minHoldersShare: { label: "Part minimum des actifs au dernier palier", unit: "part", min: 0, max: 1, hint: "0,1 = 10 % des joueurs actifs. La plus exigeante des deux règles (nombre ou part) s'applique." },
  activeDays: { label: "Joueur actif : connecté depuis moins de", unit: "j", min: 1, max: 90 },
  cooldownDays: { label: "Délai entre deux paliers d'une même mesure", unit: "j", min: 0, max: 365, hint: "30 = un palier par mois au plus. 0 = sans délai (ancien comportement : un par jour)." },
  maxAutoPerFamily: { label: "Paliers générés au plus par mesure", min: 0, max: 50, hint: "0 = sans plafond. Les paliers déjà créés restent, même au-delà." },
  titleOnLastOnly: { label: "Titre au dernier palier générable seulement", hint: "Décoché : chaque palier légendaire généré donne un titre (ancien comportement)." },
  growthSmall: { label: "Seuil suivant : multiplicateur des petits seuils", unit: "×", min: 1.1, max: 10 },
  smallBelow: { label: "Petit seuil : en dessous de", min: 1, max: 1000 },
  growth: { label: "Seuil suivant : multiplicateur courant", unit: "×", min: 1.1, max: 10 },
  growthLarge: { label: "Seuil suivant : multiplicateur des grands seuils", unit: "×", min: 1.1, max: 10 },
  largeFrom: { label: "Grand seuil : à partir de", min: 1, max: 1_000_000 },
};

/** 6.14.108 : détenteurs demandés pour `active` joueurs actifs (nombre ou part, la plus exigeante). */
export function achievementHoldersNeeded(active: number): number {
  const r = ACHIEVEMENT_GEN_RULES;
  return Math.max(1, Math.floor(Number(r.minHolders) || 1), Math.ceil(Math.max(0, Number(r.minHoldersShare) || 0) * Math.max(0, active)));
}

/** 6.14.108 : règle du générateur de paliers, en une phrase (admin : Générateur), lue dans les règles en vigueur. */
export function achievementGenText(): string {
  const r = ACHIEVEMENT_GEN_RULES;
  const share = Number(r.minHoldersShare) > 0 ? ` (et au moins ${formatPct(r.minHoldersShare)} des actifs)` : "";
  const pace = Number(r.cooldownDays) > 0 ? `un palier par mesure tous les ${formatInt(r.cooldownDays)} jours au plus` : "sans délai entre deux paliers";
  const cap = Number(r.maxAutoPerFamily) > 0 ? `, ${formatInt(r.maxAutoPerFamily)} par mesure au plus` : "";
  const title = r.titleOnLastOnly ? (Number(r.maxAutoPerFamily) > 0 ? ", titre au dernier seulement" : ", sans titre") : ", titre à chaque palier légendaire";
  return `Ajoute le palier suivant quand ${formatInt(Math.max(1, Number(r.minHolders) || 1))} joueur(s) actif(s)${share} ont atteint le dernier ; ${pace}${cap}${title}.`;
}

/** 6.14.108 : palier généré sans date (écrit avant 6.14.108) → daté de `now` ; les autres tels quels. `changed` : au moins un daté. */
export function stampGeneratedTiers<T extends { id?: string; createdAtMs?: number }>(defs: T[], now: number): { list: T[]; changed: boolean } {
  let changed = false;
  const list = defs.map((a) => {
    if (!a || typeof a.id !== "string" || !GENERATED_TIER_ID.test(a.id) || Number.isFinite(a.createdAtMs)) return a;
    changed = true;
    return { ...a, createdAtMs: now };
  });
  return { list, changed };
}

function niceNumber(x: number): number {
  const p = 10 ** Math.max(0, Math.floor(Math.log10(x)) - 1);
  return Math.ceil(x / p) * p;
}

export interface AchievementProposal {
  def: AchievementDef;
  holders: number;
  reason: string;
}

/**
 * Pour chaque mesure dont le dernier palier est atteint par assez de joueurs actifs, propose le palier suivant
 * (×2, ×3 sous 5, ×1,5 à partir de 100 : `ACHIEVEMENT_GEN_RULES`).
 * 6.14.108 (AP-L4) : détenteurs minimum, délai entre deux paliers d'une mesure (un palier sans date compte comme créé à `now`),
 * plafond par mesure, titre au dernier palier générable.
 */
export function proposeAchievementTiers(defs: AchievementDef[], players: PlayerState[], now: number): AchievementProposal[] {
  const r = ACHIEVEMENT_GEN_RULES;
  const activeMs = Math.max(1, Number(r.activeDays) || 14) * DAY_MS_ACH;
  const active = players.filter((p) => !p.npc && now - (p.lastActiveMs ?? p.resourcesUpdatedAtMs ?? 0) < activeMs);
  const needed = achievementHoldersNeeded(active.length);
  const cooldownMs = Math.max(0, Number(r.cooldownDays) || 0) * DAY_MS_ACH;
  const cap = Math.max(0, Math.floor(Number(r.maxAutoPerFamily) || 0));
  const out: AchievementProposal[] = [];
  const byMetric = new Map<string, AchievementDef[]>();
  for (const a of defs.filter((x) => x.enabled)) byMetric.set(a.metric, [...(byMetric.get(a.metric) ?? []), a]);
  for (const [metric, list] of byMetric) {
    const m = METRICS[metric as keyof typeof METRICS];
    if (!m || NO_EXTENSION.has(metric) || /\((%|0\/1)\)/.test(m.label)) continue;
    // Paliers déjà générés pour cette mesure (activés ou non).
    const generated = defs.filter((a) => a.metric === metric && GENERATED_TIER_ID.test(a.id));
    if (cap > 0 && generated.length >= cap) continue;
    if (cooldownMs > 0 && generated.some((a) => now - (Number.isFinite(a.createdAtMs) ? (a.createdAtMs as number) : now) < cooldownMs)) continue;
    const top = [...list].sort((a, b) => b.threshold - a.threshold)[0];
    // 6.14.117 (É30-6) : détenteurs comptés au seuil en jeu (rythme des succès) ; le palier suivant s'écrit sur le seuil écrit.
    const shown = paceThreshold(top);
    const holders = active.filter((p) => m.value(p) >= shown).length;
    if (holders === 0 || holders < needed) continue;
    const factor = top.threshold >= r.largeFrom ? r.growthLarge : top.threshold < r.smallBelow ? r.growthSmall : r.growth;
    const threshold = niceNumber(top.threshold * Math.max(1.1, Number(factor) || 2));
    const autoCount = list.filter((a) => a.auto).length;
    const baseName = top.name.replace(/\s+[IVX]+$/, "");
    const level = autoCount + 2;
    const tier = NEXT_TIER[top.tier];
    const rw = TIER_REWARDS[tier];
    const id = `${top.id.replace(/_auto\d+$/, "")}_auto${autoCount + 1}`;
    if (defs.some((a) => a.id === id)) continue;
    const isLast = cap > 0 && generated.length + 1 >= cap;
    const titled = tier === "legendaire" && (!r.titleOnLastOnly || isLast);
    out.push({
      def: {
        id,
        enabled: true,
        name: `${baseName} ${ROMAN[level] ?? level}`,
        description: `${m.label} : ${formatInt(threshold)}.`,
        emoji: top.emoji,
        category: top.category,
        tier,
        metric: top.metric,
        threshold,
        secret: false,
        rewardXp: rw.xp,
        rewardHours: rw.hours,
        title: titled ? `${baseName} ${ROMAN[level] ?? level}` : "",
        auto: true,
        createdAtMs: now,
      },
      holders,
      reason: `${holders} joueur(s) actif(s) sur ${active.length} ont atteint « ${top.name} » (${formatInt(shown)}, ${needed} demandés) : nouveau palier à ${formatInt(paceThreshold({ ...top, tier, threshold }))}.`,
    });
  }
  return out;
}

/** Succès actuels (pour l'aperçu côté client). */
export function currentAchievements(): AchievementDef[] {
  return ACHIEVEMENTS;
}
