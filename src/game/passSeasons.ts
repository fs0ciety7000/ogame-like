import { COMMANDER_ROLES, setSeasonCommanders, type SeasonCommanderDef } from "@/game/commanders";
import type { ChronicleObjective } from "@/game/chronicles";
import { isTrackedObjective, objectiveLabel } from "@/game/trackedActions";
import { baseCount, generatePass, GENERATOR_VERSION, seededRandom, type WorldDigest } from "@/game/procedural";
import { normalizeTierReqs, PASS_RULES, setPassSeasonOverrides, type MonthPass, type PassRequirement, type PassReward } from "@/game/seasonPass";
import { seasonLabel } from "@/game/seasons";
import { STORY_SPEAKERS, type Speaker, type StoryLine } from "@/game/story";
import { challengePool, computePointsPerTier, generateBudgetTiers, passGenRules, tiersValue, type PassGenRules } from "@/game/passGen";
import { defaultSimProfiles, profileFromMedian, simulatePass } from "@/game/passSimulator";
import { NARRATIVE_RULES } from "@/game/narrative";
import { CATALOG_START, catalogCycle, catalogEntryFor, catalogIndex, DEFAULT_THEME_PRIMARY, DEFAULT_THEME_ROTATION, illustrationPrompt, portraitPrompt, THEME_PRIMARY, type SeasonCatalogEntry } from "@/game/seasonCatalog";
import type { CommanderId } from "@/game/commanders";

/* =====================================================
   v5.13 : passes de saison procéduraux. Chaque mois, le moteur écrit un
   brouillon complet que l'équipe relit, retouche puis publie :
   - un thème (nom, accroche, couleur, illustration) : v5.14, celui du
     catalogue (seasonCatalog.ts, douze thèmes en rotation sur trois ans) ;
   - un scénario en quatre temps (prologue, paliers 10, 20 et 30) porté par
     un mentor et un rival ;
   - 30 paliers de récompenses (points par palier ajustés sur le mois écoulé) ;
   - un défi à chaque palier (v5.14.1) : un à trois prérequis, jamais deux fois
     le même, de plus en plus exigeant, relevés un palier à la fois ;
   - au dernier palier : un commandant de saison inédit (rôle principal +
     moitié d'un second rôle) et une forte somme d'Ambre.
   Seuls les passes publiés s'appliquent ; un brouillon oublié est publié
   d'office au début de son mois (tâche du générateur).
===================================================== */

export const PASS_SEASONS_SECTION = "passSeasons";

/** v5.14.1 : actions possibles dans un défi de palier. Les raids repoussés et les assauts
 *  de boss n'en font pas partie : le joueur ne les déclenche pas quand il veut, et un
 *  défi bloque les suivants. */
export const CHALLENGE_KEYS: ChronicleObjective[] = ["victory", "contract", "spy", "market", "bounty", "warlordWin"];
// v5.14.2 : les missions terminées sortent du roulement (bien trop faciles).

/** Nombre de prérequis d'un palier : un au début, deux à partir du 11e, trois aux paliers 20 et 30. */
export function challengeSize(tier: number): number {
  if (tier === 20 || tier === 30) return 3;
  if (tier === 10) return 2;
  if (tier < 10) return 1;
  if (tier < 20) return tier % 2 === 0 ? 2 : 1;
  return 2;
}

/** Difficulté d'un palier : de ×0,4 (palier 1) à ×2,5 (palier 30) des valeurs de base. */
export function challengeRamp(tier: number, tiers = 30): number {
  return 0.4 + (2.1 * (tier - 1)) / Math.max(1, tiers - 1);
}

/** v5.14.1 : effort d'un passe complet, en mois d'activité du joueur médian. Le passe
 *  est le contenu d'un mois : ses défis réunis demandent, pour chaque action, un mois
 *  entier de l'activité médiane (et un seul défi avance à la fois). */
/** Z5 (printemps) : Ambre du dernier palier et effort du passe, réglables (GameRules.passRewards). */
export const PASS_REWARD_RULES = {
  /** Ambre du dernier palier d'un passe généré (avec le commandant et le cosmétique). */
  finalAmber: 300,
  /** Effort d'un passe complet, en mois d'activité du joueur médian. */
  monthEffort: 1,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const PASS_REWARD_RULES_META = {
  finalAmber: { label: "Ambre du dernier palier d'un passe généré", unit: "Ambre", min: 0, max: 10_000, hint: "Avec le commandant et le cosmétique." },
  monthEffort: { label: "Effort d'un passe complet", unit: "mois", min: 0.1, max: 6, hint: "En mois d'activité du joueur médian." },
};

/** Quantité d'une action demandée sur tout le passe : 4,3 semaines d'activité médiane
 *  (bornée comme les objectifs des Chroniques ; valeurs de base sans données). */
export function monthlyBudget(key: ChronicleObjective, d: Pick<WorldDigest, "weeklyMedian">): number {
  return Math.max(1, Math.round(weeklyRate(key, d) * 4.3 * PASS_REWARD_RULES.monthEffort));
}

/** v5.14.1 : défis des paliers. Chaque palier a les siens (compteur propre, un palier à la
 *  fois) et jamais deux fois les mêmes : l'action change d'un palier au suivant, une action
 *  qui revient ne demande jamais moins, et deux paliers n'ont jamais le même défi. Le mois
 *  d'activité de chaque action est réparti sur ses paliers, plus lourdement en fin de passe. */
export function generateTierChallenges(rng: () => number, focus: ChronicleObjective[], d: Pick<WorldDigest, "weeklyMedian">, tiers: number, themeId: string | null = null): Record<string, PassRequirement[]> {
  // v5.14.2 : les seigneurs de guerre seulement si des joueurs en battent vraiment (sinon un
  // débutant, ou un serveur sans seigneurs, resterait bloqué : un défi bloque les suivants).
  // 6.14.58 : même seuil que les défis cumulés (actionPlayable, médiane du serveur).
  const allowed = new Set(challengePool(d.weeklyMedian, undefined, themeId).map((x) => x.key));
  const kept = CHALLENGE_KEYS.filter((k) => allowed.has(k));
  const playable = kept.length > 0 ? kept : CHALLENGE_KEYS.filter((k) => k !== "warlordWin");
  const pool = [...focus.filter((k) => playable.includes(k)), ...playable.filter((k) => !focus.includes(k))];
  // 1. Actions de chaque palier : les moins utilisées d'abord (le thème à égalité), jamais celles du palier précédent.
  const used: Record<string, number> = {};
  const plan: ChronicleObjective[][] = [];
  let prev: ChronicleObjective[] = [];
  for (let t = 1; t <= tiers; t++) {
    // 6.14.58 : une seule action jouable : elle revient (un palier a toujours un défi).
    const avail = pool.filter((k) => !prev.includes(k));
    const keys = (avail.length > 0 ? avail : pool)
      .map((k, i) => ({ k, w: (used[k] ?? 0) * 10 + i + rng() * 3 }))
      .sort((a, b) => a.w - b.w)
      .slice(0, challengeSize(t))
      .map((x) => x.k);
    keys.forEach((k) => (used[k] = (used[k] ?? 0) + 1));
    plan.push(keys);
    prev = keys;
  }
  // 2. Répartition du mois de chaque action sur ses paliers, au poids de la difficulté.
  const weight = (t: number) => challengeRamp(t, tiers) * (plan[t - 1].length > 1 ? 0.8 : 1);
  const totalWeight: Record<string, number> = {};
  plan.forEach((keys, i) => keys.forEach((k) => (totalWeight[k] = (totalWeight[k] ?? 0) + weight(i + 1))));
  const last: Record<string, number> = {};
  const seen = new Set<string>();
  const out: Record<string, PassRequirement[]> = {};
  plan.forEach((keys, i) => {
    const t = i + 1;
    const reqs = keys.map((key) => {
      const share = (monthlyBudget(key, d) * weight(t)) / totalWeight[key];
      return { key, count: Math.max(1, Math.round(share), last[key] ?? 0) };
    });
    // Jamais deux fois le même défi : on monte l'action la plus lourde jusqu'à ce qu'il soit inédit.
    const sig = () => reqs.map((r) => `${r.key}:${r.count}`).sort().join("|");
    while (reqs.length > 0 && seen.has(sig())) reqs[reqs.length - 1].count += 1;
    seen.add(sig());
    reqs.forEach((r) => (last[r.key] = r.count));
    out[String(t)] = reqs;
  });
  return out;
}

/** 5.15.4 : jour du mois où le joueur médian doit avoir relevé le dernier défi (mode cumulé).
 *  6.8.1 : réglable (GameRules.passGen.targetMedianDay, 24 par défaut). */
export function passTargetDay(): number {
  return passGenRules().targetMedianDay;
}

/** Rythme de référence d'une action, par semaine : médiane du serveur (bornée), base sinon.
 *  6.14.58 (AU27, AP-2) : bornes réglables (`passGen.challengeMinFactor`, `challengeMaxFactor`) et plancher jamais au-dessus
 *  de la médiane (avant : 1,5 victoire par semaine demandée quand le joueur médian en fait 1). */
export function weeklyRate(key: ChronicleObjective, d: Pick<WorldDigest, "weeklyMedian">, rules: PassGenRules = passGenRules()): number {
  const base = baseCount(key);
  const weekly = d.weeklyMedian[key] ?? 0;
  if (!(weekly > 0)) return base;
  const floor = Math.min(base * rules.challengeMinFactor, weekly);
  return Math.max(floor, Math.min(base * rules.challengeMaxFactor, weekly));
}

/** Jour cible de chaque palier (cumul de la difficulté, dernier palier : PASS_TARGET_DAY). */
export function tierTargetDays(tiers: number): number[] {
  const w = Array.from({ length: tiers }, (_, i) => challengeRamp(i + 1, tiers));
  const total = w.reduce((a, b) => a + b, 0);
  let acc = 0;
  const target = passTargetDay();
  return w.map((x) => ((acc += x), (target * acc) / total));
}

/** 5.15.4 : défis CUMULÉS. Un palier demande un total d'actions depuis le début du mois
 *  (« 12 victoires ce mois-ci ») : une action compte pour tous les paliers, rien n'est
 *  perdu, et les paliers se débloquent toujours dans l'ordre. Quantités : ce que le
 *  joueur médian a fait au jour cible du palier ; une action trop rare n'apparaît que
 *  lorsqu'elle est atteignable. Toujours une ou plusieurs actions par palier, jamais
 *  celles du palier précédent, jamais deux fois le même défi. */
export function generateCumulativeChallenges(rng: () => number, focus: ChronicleObjective[], d: Pick<WorldDigest, "weeklyMedian">, tiers: number, themeId: string | null = null): Record<string, PassRequirement[]> {
  // 6.8.1 : actions et poids réglables (passGen.challengeWeights) ; une action passive n'entre que si le serveur la pratique.
  // 6.14.131 (AJ27-7) : le thème du passe active ses objectifs paramétrés (`trackedActions.themeWeights`).
  const weights = new Map(challengePool(d.weeklyMedian, undefined, themeId).map((x) => [x.key, x.weight]));
  const playable = [...weights.keys()];
  const pool = [...focus.filter((k) => playable.includes(k)), ...playable.filter((k) => !focus.includes(k))];
  const day = tierTargetDays(tiers);
  const by = (k: ChronicleObjective, t: number) => (weeklyRate(k, d) / 7) * day[t - 1];
  const used: Record<string, number> = {};
  const last: Record<string, number> = {};
  const seen = new Set<string>();
  const out: Record<string, PassRequirement[]> = {};
  let prev: ChronicleObjective[] = [];
  for (let t = 1; t <= tiers; t++) {
    const avail = pool.filter((k) => !prev.includes(k));
    const free = avail.length > 0 ? avail : pool;
    const feasible = free.filter((k) => by(k, t) >= 1);
    const extra = free.filter((k) => !feasible.includes(k)).sort((a, b) => by(b, t) - by(a, t));
    const candidates = feasible.length >= challengeSize(t) ? feasible : [...feasible, ...extra.slice(0, challengeSize(t) - feasible.length)];
    const keys = candidates
      .map((k) => ({ k, w: ((used[k] ?? 0) * 10 + pool.indexOf(k) + rng() * 3) / (weights.get(k) ?? 1) }))
      .sort((a, b) => a.w - b.w)
      .slice(0, challengeSize(t))
      .map((x) => x.k);
    keys.forEach((k) => (used[k] = (used[k] ?? 0) + 1));
    // Total du mois : jamais moins qu'au précédent passage de l'action.
    const reqs = keys.map((key) => ({ key, count: Math.max(1, Math.round(by(key, t)), last[key] ?? 0) }));
    const sig = () => reqs.map((r) => `${r.key}:${r.count}`).sort().join("|");
    while (reqs.length > 0 && seen.has(sig())) reqs[reqs.length - 1].count += 1;
    seen.add(sig());
    reqs.forEach((r) => (last[r.key] = r.count));
    out[String(t)] = reqs;
    prev = keys;
  }
  return out;
}

/* ---------- 6.14.58 (AU27, AP-2) : garde de faisabilité ---------- */

type PaceSeason = Pick<PassSeason, "pointsPerTier" | "tiers" | "requirements" | "challengeMode">;
type Pace = { medianDay: number | null; topDay: number | null };

const paceOk = (p: Pace, rules: PassGenRules) => p.medianDay !== null && p.medianDay <= rules.latestMedianDay;
const paceRank = (p: Pace) => p.medianDay ?? 999;
const dayText = (day: number | null) => (day === null ? "après la fin du mois" : `le jour ${day}`);

/** Seuils réduits au prorata (au moins 1), dans l'ordre des paliers : un total cumulé ne baisse jamais d'un palier au suivant. */
export function scaleRequirements(req: Record<string, PassRequirement[]>, factor: number): Record<string, PassRequirement[]> {
  const last: Record<string, number> = {};
  const out: Record<string, PassRequirement[]> = {};
  for (const t of Object.keys(req).sort((a, b) => Number(a) - Number(b)))
    out[t] = normalizeTierReqs(req[t]).map((r) => {
      const count = Math.max(1, Math.round(r.count * factor), last[r.key] ?? 0);
      last[r.key] = count;
      return { key: r.key, count };
    });
  return out;
}

/** Garde de faisabilité des défis : si le joueur médian simulé finit après `latestMedianDay`, nouveaux tirages des défis
 *  (`redraw(1…challengeRedraws)`), puis seuils réduits par pas de `challengeReduceStep` jusqu'à `challengeReduceMin`.
 *  Rend les défis gardés, la simulation et les lignes de « Pourquoi ces chiffres ». */
export function fitChallenges(
  season: PaceSeason,
  d: Pick<WorldDigest, "weeklyMedian" | "passPace">,
  redraw: (k: number) => Record<string, PassRequirement[]>,
  rules: PassGenRules = passGenRules(),
): { requirements: Record<string, PassRequirement[]>; pointsPerTier: number; pace: Pace; changed: boolean; ok: boolean; reasons: string[] } {
  const first = passPaceCheck(season, d);
  if (paceOk(first, rules)) return { requirements: season.requirements, pointsPerTier: season.pointsPerTier, pace: first, changed: false, ok: true, reasons: [] };
  const reasons = [`Garde de faisabilité : joueur médian au dernier palier ${dayText(first.medianDay)} (au plus tard le jour ${rules.latestMedianDay}).`];
  // 0. Les points seuls (sans défi) suffisent-ils ? Sinon, points par palier baissés par pas de 5 (jamais sous le minimum).
  let ppt = season.pointsPerTier;
  const byPoints = (p: number) => passPaceCheck({ ...season, pointsPerTier: p, requirements: {} }, d);
  while (!paceOk(byPoints(ppt), rules) && ppt - 5 >= rules.pointsMin) ppt -= 5;
  if (!paceOk(byPoints(ppt), rules))
    reasons.push(`Points par palier au minimum réglé (${rules.pointsMin}) : le joueur médian ne peut pas finir avant le jour ${rules.latestMedianDay} avec ses points par jour (baisser « Points par palier : minimum » pour un serveur aussi calme).`);
  if (ppt !== season.pointsPerTier) {
    reasons.push(`Points par palier ramenés de ${season.pointsPerTier} à ${ppt} : les points seuls faisaient finir le joueur médian trop tard.`);
    season = { ...season, pointsPerTier: ppt };
    const again = passPaceCheck(season, d);
    if (paceOk(again, rules)) return { requirements: season.requirements, pointsPerTier: ppt, pace: again, changed: true, ok: true, reasons };
  }
  let best = { requirements: season.requirements, pace: first };
  for (let k = 1; k <= rules.challengeRedraws; k++) {
    const requirements = redraw(k);
    const pace = passPaceCheck({ ...season, requirements }, d);
    if (paceRank(pace) < paceRank(best.pace)) best = { requirements, pace };
    if (paceOk(pace, rules)) {
      reasons.push(`Nouveau tirage des défis (${k}) : joueur médian au dernier palier le jour ${pace.medianDay}.`);
      return { requirements, pointsPerTier: ppt, pace, changed: true, ok: true, reasons };
    }
  }
  if (rules.challengeRedraws > 0) reasons.push(`${rules.challengeRedraws} nouveaux tirages des défis : au mieux ${dayText(best.pace.medianDay)}.`);
  let last = best;
  for (let f = 1 - rules.challengeReduceStep; f >= rules.challengeReduceMin - 1e-9; f -= rules.challengeReduceStep) {
    const requirements = scaleRequirements(best.requirements, f);
    const pace = passPaceCheck({ ...season, requirements }, d);
    last = { requirements, pace };
    if (paceOk(pace, rules)) {
      reasons.push(`Seuils des défis réduits à ${Math.round(f * 100)} % : joueur médian au dernier palier le jour ${pace.medianDay}.`);
      return { requirements, pointsPerTier: ppt, pace, changed: true, ok: true, reasons };
    }
  }
  reasons.push(`Seuils réduits à ${Math.round(rules.challengeReduceMin * 100)} % : joueur médian ${dayText(last.pace.medianDay)}. À relire (Admin → Passes de saison).`);
  return { requirements: last.requirements, pointsPerTier: ppt, pace: last.pace, changed: true, ok: false, reasons };
}

/** Nouveau tirage des défis d'un passe (même mode, même thème), graine propre au tirage `k`. */
function redrawChallenges(season: Pick<PassSeason, "id" | "theme" | "tiers" | "challengeMode">, d: Pick<WorldDigest, "weeklyMedian">, variant: number, k: number): Record<string, PassRequirement[]> {
  const theme = PASS_THEMES.find((t) => t.id === season.theme.id) ?? PASS_THEMES.find((t) => t.id === catalogEntryFor(season.id).theme) ?? PASS_THEMES[0];
  const rng = seededRandom(`challenges:${season.id}:${variant}:redraw${k}`);
  const gen = season.challengeMode === "cumulative" ? generateCumulativeChallenges : generateTierChallenges;
  return gen(rng, shuffle(rng, theme.focus), d, season.tiers.length, theme.id);
}

/** 6.14.58 : garde avant la publication d'office (un passe infaisable n'est jamais publié tel quel). Récompenses, points par
 *  palier, thème et commandant inchangés ; seuls les défis sont tirés à nouveau ou réduits. */
export function ensureFeasiblePass(season: PassSeason, d: Pick<WorldDigest, "weeklyMedian" | "passPace">): { season: PassSeason; changed: boolean; ok: boolean; reasons: string[] } {
  const variant = season.auto?.variant ?? 0;
  let fit = fitChallenges(season, d, (k) => redrawChallenges(season, d, variant, k));
  let mode = season.challengeMode;
  // Ancien format (un palier à la fois, compteur remis à zéro) toujours infaisable : défis en totaux du mois.
  if (!fit.ok && season.challengeMode !== "cumulative") {
    const cumulative = { ...season, challengeMode: "cumulative" as const };
    const again = fitChallenges({ ...cumulative, requirements: redrawChallenges(cumulative, d, variant, 0) }, d, (k) => redrawChallenges(cumulative, d, variant, k));
    if (again.ok || paceRank(again.pace) < paceRank(fit.pace)) {
      fit = { ...again, changed: true, reasons: [...fit.reasons, "Défis passés en totaux du mois (ancien format : un palier à la fois).", ...again.reasons] };
      mode = "cumulative";
    }
  }
  if (!fit.changed) return { season, changed: false, ok: true, reasons: [] };
  const auto = season.auto ?? { generatedAtMs: 0, variant: 0, reasons: [] };
  const next: PassSeason = { ...season, pointsPerTier: fit.pointsPerTier, requirements: fit.requirements, auto: { ...auto, reasons: [...auto.reasons, ...fit.reasons], pace: fit.pace } };
  if (mode === "cumulative") next.challengeMode = "cumulative";
  return { season: next, changed: true, ok: fit.ok, reasons: fit.reasons };
}

export type PassSeasonStatus = "draft" | "published";

export interface PassMilestone {
  /** 0 : prologue (visible dès l'ouverture), sinon palier qui le débloque. */
  tier: number;
  title: string;
  lines: StoryLine[];
}

export interface PassSeason {
  /** Mois (AAAA-MM). */
  id: string;
  status: PassSeasonStatus;
  theme: { id: string; name: string; tagline: string; accent: string; image: string; /** v5.14 : prompt Midjourney de l'illustration. */ prompt?: string };
  scenario: { synopsis: string; milestones: PassMilestone[] };
  pointsPerTier: number;
  tiers: PassReward[][];
  /** Prérequis par palier (clé : numéro de palier) ; v5.14.1 : plusieurs par palier. */
  requirements: Record<string, PassRequirement[]>;
  /** 5.15.4 : « cumulative » : totaux du mois (passes générés à partir de la 5.15.4) ;
   *  absent : un palier à la fois, compteur remis à zéro (passes plus anciens). */
  challengeMode?: "cumulative";
  commander: SeasonCommanderDef & { prompt: string };
  auto?: {
    generatedAtMs: number;
    variant: number;
    reasons: string[];
    /** 6.8.1 : jours de fin simulés (médian, plus actif). */
    pace?: { medianDay: number | null; topDay: number | null };
    /** 6.14.57 (AU27, AP-3) : version du générateur qui l'a écrit (absente : avant 6.14.57). */
    generator?: number;
    /** 6.14.57 : brouillon retouché à la main dans l'admin : jamais régénéré d'office. */
    editedAtMs?: number;
  };
  publishedAtMs?: number;
  /** Annonce envoyée aux joueurs (une fois, au début du mois). */
  announcedAtMs?: number;
}

export interface PassSeasonsConfig {
  seasons: PassSeason[];
}

export function defaultPassSeasonsConfig(): PassSeasonsConfig {
  return { seasons: [] };
}

/* ---------- thèmes ---------- */

/** 6.14.128 (AU27, lot AA9, constat AA-23) : thème du passe, fiche de la section `passThemes` (Admin → Catalogue du passe).
 *  L'ordre de la liste est celui de la rotation mensuelle ; un thème retiré quitte la rotation (les passes déjà écrits gardent
 *  leur copie du thème). */
export interface PassTheme {
  id: string;
  /** Rôle principal du commandant de saison du thème. */
  primary: CommanderId;
  /** Retiré de la rotation (les mois suivants prennent les autres thèmes). */
  retired?: boolean;
  accent: string;
  image: string;
  mentor: Speaker;
  rival: Speaker;
  /** Actions mises en avant (prérequis). */
  focus: ChronicleObjective[];
  /** Répliques : prologue, palier 10, palier 20, palier 30 (mentor puis rival).
   *  v5.14 : nom, accroche, scénario et commandant viennent du catalogue (seasonCatalog.ts). */
  beats: [string[], string[], string[], string[]];
  rivalLines: [string[], string[], string[], string[]];
}

/** 6.14.93 : mois dont le commandant de saison a son portrait (public/assets/commanders/s-<mois>.webp). Un autre mois prend le
 *  portrait du rôle principal ; un portrait se règle aussi par saison dans l'admin (Passe de saison). */
export const SEASON_PORTRAITS: readonly string[] = ["2026-11", "2026-12", "2027-01"];

/** 6.14.138 (AU27, lot AP-L11) : saisons du catalogue (`<thème>_<année>`) dont l'illustration propre existe
 *  (public/assets/pass/theme-<thème>-<année>.webp). Les autres prennent l'image du thème (image provisoire) ; l'année 1 garde
 *  l'image du thème (theme-<thème>.webp). Une saison générée (6.14.139) prend l'image de la saison écrite qu'elle prolonge. */
export const SEASON_THEME_ART: readonly string[] = [];

/** 6.14.138 : image de l'en-tête du passe d'une saison : image réglée sur la saison (admin), sinon son illustration d'année,
 *  sinon l'image du thème. */
export function seasonThemeImage(entry: Pick<SeasonCatalogEntry, "id" | "theme" | "year" | "image" | "generatedFrom">, themeImage: string): string {
  if (entry.image) return entry.image;
  const id = entry.generatedFrom ?? entry.id;
  const m = /^(.+)_(\d+)$/.exec(id);
  if (m && SEASON_THEME_ART.includes(id)) return `/assets/pass/theme-${m[1]}-${m[2]}.webp`;
  return themeImage;
}

/** 6.14.93 : images des thèmes avant leur illustration propre (migration `pass-art-6.14.93` des saisons déjà écrites). */
export const PASS_THEME_OLD_IMAGES: Record<string, string> = {
  maree: "/assets/blog/articles/5-9/poste-commandement.webp",
  forge: "/assets/blog/articles/5-10/pot-commun.webp",
  archives: "/assets/blog/articles/reliques/couverture.webp",
  hiver: "/assets/chronicles/2026-12-boss.webp",
  comete: "/assets/blog/articles/5-10/coup-de-grace.webp",
  primes: "/assets/blog/articles/5-9/podium-or.webp",
  bazar: "/assets/blog/articles/5-12/salle-de-jeu.webp",
  vide: "/assets/chronicles/2026-11-boss.webp",
  rempart: "/assets/chronicles/2027-01-boss.webp",
  colonies: "/assets/chronicles/2027-02-boss.webp",
  chantiers: "/assets/blog/articles/5-10/couverture.webp",
  moisson: "/assets/chronicles/2027-03-boss.webp",
};

const RAW_PASS_THEMES: Omit<PassTheme, "primary">[] = [
  {
    id: "maree",
    accent: "#4be8ff",
    image: "/assets/pass/theme-maree.webp",
    mentor: "vashka",
    rival: "varan",
    focus: ["victory", "raidRepelled", "bounty"],
    beats: [
      ["Les sondes ont repéré leurs escadres, commandant. Prépare ta flotte : on ne les laissera pas passer.", "Leur flotte revient, plus lourde que l'an dernier. On tiendra la ligne, commandant.", "Ils se terrent loin du front. Il faudra frapper loin, et frapper vite."],
      ["Première ligne tenue. Ils reculent, mais ils reviendront plus nombreux.", "La première vague s'est brisée. Garde ta formation : la suivante sera plus forte.", "Premier raid lointain réussi. Ils ne s'y attendaient pas."],
      ["Leur vaisseau amiral s'est montré. Un officier hors pair a rejoint nos rangs pour la dernière bataille.", "{commander} a tenu le ressac de Drakmor seul contre trois escadres. Il a choisi notre camp.", "{commander} connaît chaque courant de la Grande Houle. Avec elle, nos flottes iront plus loin."],
      ["La houle est retombée. {commander} a choisi ta bannière : sers-toi bien de cet officier.", "La mer d'étoiles est calme. {commander} garde la ligne à tes côtés.", "La houle nous porte. {commander} commande désormais nos frappes lointaines."],
    ],
    rivalLines: [
      ["Vos flottes sont des coquilles vides. La marée vous emportera.", "Vous avez survécu à une marée. Survivrez-vous au ressac ?", "Venez me chercher, si vos moteurs tiennent la distance."],
      ["Une vaguelette. Rien de plus.", "Vous reculez d'un pas, je gagne une lieue.", "Une piqûre. Je ne l'ai presque pas sentie."],
      ["Assez joué. Toute ma flotte converge sur vous.", "Mes réserves arrivent. Votre ligne ne tiendra pas la nuit.", "J'ai coupé vos lignes de retour. Bon voyage."],
      ["Cette fois... vous avez gagné.", "Votre ligne a tenu. Je m'en souviendrai.", "Vous frappez de loin. Je saurai frapper de plus loin encore."],
    ],
  },
  {
    id: "forge",
    accent: "#ffb347",
    image: "/assets/pass/theme-forge.webp",
    mentor: "lysa",
    rival: "kragmor",
    focus: ["contract", "victory", "bounty"],
    beats: [
      ["Les forges tournent pour l'ennemi. Il nous faut des contrats et des bras : on commence ce mois-ci.", "Les forges sont à nous, mais il manque des bras. Lance le chantier, commandant.", "Au cœur de l'Enclume dort une arme de légende. On va la forger avant eux."],
      ["Première forge reprise ! Les ouvriers reviennent.", "Les premières sections sont soudées. Le secteur vient voir la carcasse.", "Le premier alliage a tenu. L'Enclume chauffe enfin."],
      ["Un architecte de légende accepte de nous rejoindre si nous tenons jusqu'au bout.", "{commander} a dessiné la moitié des stations du secteur. Il veut voir la nôtre achevée.", "{commander} conçoit des vaisseaux de ligne et les mène au feu. Elle veut finir l'arme avec nous."],
      ["Les forges sont à nous. {commander} prend la tête de tes chantiers.", "Le Grand Chantier est fini. {commander} signe désormais tes plans.", "L'arme est forgée. {commander} la mènera à ton signal."],
    ],
    rivalLines: [
      ["Mes forges, mes règles. Payez ou partez.", "Un chantier de cette taille ? Il s'effondrera avant d'être fini.", "L'Enclume ne forge que pour ceux qui paient. Payez."],
      ["Une forge ? J'en ai cent.", "Joli squelette. Mes saboteurs adorent les squelettes.", "Une étincelle. J'ai vu des incendies."],
      ["Vous m'agacez. Mes foreuses vont raser vos chantiers.", "Mes équipes sont dans vos échafaudages. Comptez vos boulons.", "Je viens prendre votre arme avant qu'elle ne refroidisse."],
      ["Gardez vos forges. Pour l'instant.", "Elle tient debout. Je n'aurais pas parié dessus.", "Gardez votre jouet. Il faudra savoir s'en servir."],
    ],
  },
  {
    id: "archives",
    accent: "#a78bfa",
    image: "/assets/pass/theme-archives.webp",
    mentor: "nerea",
    rival: "vesper",
    focus: ["spy", "victory", "raidRepelled"],
    beats: [
      ["Nos sondes doivent percer leurs secrets avant qu'ils ne disparaissent. Espionne, commandant.", "Des fichiers noirs circulent dans les ports. Il faut les trouver avant qu'ils ne servent.", "Plus rien ne passe sur les ondes. Dans ce silence, ce sont nos sondes qui parlent."],
      ["Un premier fichier déchiffré. Il cite un nom que je croyais mort.", "Un premier fichier récupéré. Il porte la liste de nos propres informateurs.", "Une première trace dans le noir. Ils ne se savaient pas observés."],
      ["Une agente double propose ses services. Elle demande une seule chose : que tu ailles jusqu'au bout.", "{commander} sait exactement ce que vaut un secret. Il propose de garder les nôtres.", "{commander} voit tout et ne se montre jamais. Ce talent est désormais à nous."],
      ["Les archives sont à l'abri. {commander} rejoint ton état-major, avec tous ses secrets.", "Les fichiers sont sous clé. {commander} veille sur chacun d'eux.", "Le silence est à nous. {commander} écoute pour toi."],
    ],
    rivalLines: [
      ["Ce que vous cherchez n'existe pas.", "Un secret n'a de valeur que s'il est vendu.", "Chut. Vous entendez ? Moi non plus."],
      ["Curieux. Trop curieux.", "Vous lisez lentement. Moi, je publie vite.", "Une sonde de perdue. Vous en avez combien ?"],
      ["J'efface tout. Vous aussi, s'il le faut.", "J'ai votre dossier. Il est épais.", "Je coupe tout. Même vos pensées."],
      ["Gardez vos archives. Je garde mes ombres.", "Vous gardez vos fichiers. Pour combien de temps ?", "Vous avez appris à vous taire. C'est un début."],
    ],
  },
  {
    id: "hiver",
    accent: "#9fd8ff",
    image: "/assets/pass/theme-hiver.webp",
    mentor: "ilyon",
    rival: "vesper",
    focus: ["raidRepelled", "contract", "victory"],
    beats: [
      ["Le froid arrive. Remplis tes entrepôts, renforce tes défenses : la nuit sera longue.", "La nuit sera plus longue cette année. Rationne, protège, et compte chaque caisse.", "Un givre étrange ronge nos coques. Réparons, renforçons, tenons."],
      ["Les premiers raids sont repoussés. Le givre recule d'un cran.", "Les premières réserves tiennent. Les pillards rôdent autour des entrepôts.", "Les premières coques sont réparées. Le givre recule d'un pas."],
      ["Une gardienne des glaces a survécu à trois hivers comme celui-ci. Elle veut nous aider.", "{commander} tient les comptes de l'hiver au gramme près. Il veut tenir les nôtres.", "{commander} a réparé une station entière par moins quatre-vingts. Il est des nôtres."],
      ["Le dégel commence. {commander} veille désormais sur tes réserves.", "La Longue Nuit s'achève. {commander} garde tes réserves jusqu'au prochain hiver.", "Le dégel est là. {commander} garde tes cales à l'abri du givre."],
    ],
    rivalLines: [
      ["L'hiver est mon allié. Vous gèlerez.", "La nuit est longue. Mes raids aussi.", "Le givre fait mon travail. Je n'ai qu'à attendre."],
      ["Un feu de camp contre une tempête.", "Une réserve de plus ? J'ai faim pour deux.", "Vous réparez vite. Le froid ronge plus vite."],
      ["Mes raids frapperont au plus froid de la nuit.", "Je frapperai quand vos lampes s'éteindront.", "Toute la glace du secteur marche sur vos chantiers."],
      ["Le printemps... déjà ?", "Le jour revient. Je reviendrai avec la nuit.", "Vos coques tiennent. Le givre, lui, a toute l'éternité."],
    ],
  },
  {
    id: "comete",
    accent: "#ff5c7a",
    image: "/assets/pass/theme-comete.webp",
    mentor: "brannoc",
    rival: "kor",
    focus: ["bossAssault", "victory", "bounty"],
    beats: [
      ["Elle arrive, commandant ! Tout ce qui s'en détache est à prendre. Fais chauffer les moteurs.", "Une pluie de fragments arrive, et quelque chose bouge dedans. Prépare tes chasseurs.", "Le sillage rouge est encore chaud. On le suit, et on partage la prise."],
      ["Premiers fragments récupérés. Le Cartel commence à s'énerver.", "Premiers fragments récupérés. Le premier monstre aussi.", "Première prise ramenée. Le sillage mène plus loin."],
      ["Une pilote a suivi la comète depuis trois systèmes. Elle connaît son cœur.", "{commander} chasse les monstres des fragments depuis dix ans. Il veut celui-ci.", "{commander} suit les comètes depuis trois systèmes. Il connaît leur cœur."],
      ["La comète s'éloigne, ses trésors dans nos soutes. {commander} reste avec nous.", "La pluie est passée. {commander} reste pour la prochaine.", "La prise est partagée. {commander} chassera désormais avec toi."],
    ],
    rivalLines: [
      ["Cette comète m'appartient. Comme tout le reste.", "Chaque fragment est à moi. Les monstres aussi.", "Ce sillage mène à mes entrepôts. Vous êtes en retard."],
      ["Des miettes. Laissez-les-moi.", "Un caillou ? Gardez-le, il me reste la montagne.", "Partager ? Quel drôle de mot."],
      ["Mes chasseurs vont vous balayer de son sillage.", "Mes chasseurs vont nettoyer la pluie. Vous compris.", "Je brûle le sillage derrière moi. Suivez-moi donc."],
      ["Vous me devez une comète.", "Vous avez eu de la chance. La pluie, elle, reviendra.", "Une prise partagée, c'est une prise perdue. Pour moi."],
    ],
  },
  {
    id: "primes",
    accent: "#ffd86b",
    image: "/assets/pass/theme-primes.webp",
    mentor: "vashka",
    rival: "maru",
    focus: ["bounty", "victory", "warlordWin"],
    beats: [
      ["La traque est ouverte. Remplis les primes, et que l'Essaim retienne ton nom.", "Le tableau de chasse est plein. Ce qu'on ne voit pas, on ne le rate pas.", "Le plus gros gibier du secteur est en vue. Toute la meute est à toi."],
      ["Ton tableau de chasse s'allonge. Les autres chasseurs commencent à te craindre.", "Tes premières cibles sont tombées. L'Essaim t'a remarqué.", "Les premières traces sont fraîches. La bête n'est pas loin."],
      ["Une traqueuse légendaire te suit à la trace. Elle veut voir qui chasse aussi bien qu'elle.", "{commander} ne rate jamais une cible. Elle veut chasser à tes côtés.", "{commander} a traqué la bête pendant des années. Il veut voir la fin."],
      ["La traque est finie, et tu es en tête. {commander} chassera désormais pour toi.", "Le tableau est vide, et ton nom en haut. {commander} chasse pour toi.", "La traque est finie. {commander} garde ton tableau de chasse."],
    ],
    rivalLines: [
      ["Ma tête vaut une fortune. Venez la prendre.", "Mon nom est en haut du tableau. Il y restera.", "La bête est à moi. Vous n'êtes que des rabatteurs."],
      ["Pas mal, pour un débutant.", "Une prime de moins. J'en mets trois de plus.", "Vous suivez ma piste ? Elle mène à un piège."],
      ["Je vais vous traquer à mon tour.", "Je paie mieux que l'Essaim. Vos chasseurs le savent.", "J'ai lâché la bête sur vos routes. Bonne chasse."],
      ["Bien chassé. Je reviendrai.", "Bien joué. Je mets votre tête au tableau.", "Vous l'avez eue. Je trouverai plus gros."],
    ],
  },
  {
    id: "bazar",
    accent: "#5ef2b0",
    image: "/assets/pass/theme-bazar.webp",
    mentor: "kor",
    rival: "kragmor",
    focus: ["contract", "bounty", "raidRepelled"],
    beats: [
      ["Les routes rouvrent, commandant. Honore tes contrats : la réputation vaut plus que l'or.", "Les routes de la soie rouvrent. Un convoi bien protégé vaut une flotte.", "La Foire des mondes ouvre ses portes. On y échange des marchandises, et des secrets."],
      ["Les convois passent. Tes contrats font parler d'eux jusqu'aux franges.", "Les premiers convois sont arrivés. Les marchands lèvent leurs prix.", "Tes premiers échanges font parler. Les bons et les mauvais."],
      ["Une négociatrice redoutable propose de gérer tes affaires. Prouve-lui que tu en vaux la peine.", "{commander} a mené plus de convois qu'elle ne compte d'étoiles. Elle veut mener les tiens.", "{commander} connaît tous les secrets de la Foire, et choisit de les garder pour toi."],
      ["Le bazar ferme ses portes, tes coffres pleins. {commander} tient désormais tes comptes.", "La route est sûre. {commander} veille sur tes caravanes.", "La Foire ferme, et tu en repars plus riche. {commander} tient tes affaires."],
    ],
    rivalLines: [
      ["Chaque route passe par mes péages.", "Chaque caravane me paie sa part. Même la vôtre.", "Tout se vend à la Foire. Vous aussi."],
      ["Un convoi de plus, un péage de plus.", "Un convoi passé. Mes péages ont de la mémoire.", "Un bon prix. Pour moi."],
      ["Je ferme les routes. Toutes.", "Je coupe la route au milieu. Bonne chance pour revenir.", "J'achète vos fournisseurs. Tous."],
      ["Bon. Vous pouvez passer. Cette fois.", "Votre route tient. Mes péages attendront.", "Vous savez marchander. C'est presque vexant."],
    ],
  },
  {
    id: "vide",
    accent: "#ff5fd2",
    image: "/assets/pass/theme-vide.webp",
    mentor: "maru",
    rival: "varan",
    focus: ["victory", "raidRepelled", "contract"],
    beats: [
      ["Le Vide appelle, commandant. Ceux qui répondront en reviendront changés.", "Les routes ouvertes l'an dernier mènent à des mondes neufs. On y installe nos colons.", "Aux confins dérivent des formes immenses. On les piste, sans les réveiller."],
      ["Le signal se précise. Il parle de nous.", "Le premier convoi est arrivé. Les franges deviennent une frontière.", "Une première trace. Plus grande que tout ce qu'on connaît."],
      ["Une éclaireuse revenue des franges veut guider celui qui ira jusqu'au bout.", "{commander} a mené un convoi entier au-delà du Voile. Il veut mener le suivant.", "{commander} a suivi un colosse pendant deux ans. Elle connaît sa route."],
      ["Le signal s'est tu. {commander} a choisi de rester à tes côtés.", "Les franges sont peuplées. {commander} garde tes routes ouvertes.", "Le colosse s'éloigne. {commander} reste pour guetter son retour."],
    ],
    rivalLines: [
      ["Le Vide n'aime pas les curieux.", "Vos colons ? Mes proies.", "Les colosses du Vide sont à moi. Leurs carcasses aussi."],
      ["Vous entendez des voix ? Moi, j'entends des ressources.", "Une route ouverte. Une route à couper.", "Vous pistez une ombre. Moi, je la chasse."],
      ["Le premier arrivé prend tout.", "Je ferme le Voile derrière vous.", "J'ai réveillé le colosse. À vous de le calmer."],
      ["Gardez votre prophétie.", "Vos colons tiennent. Pour cette fois.", "Gardez vos colosses. Le Vide en a d'autres."],
    ],
  },
  // v5.14 : quatre thèmes de plus (douze, un par rôle d'officier).
  {
    id: "rempart",
    accent: "#7fb2ff",
    image: "/assets/pass/theme-rempart.webp",
    mentor: "ilyon",
    rival: "varan",
    focus: ["raidRepelled", "victory", "contract"],
    beats: [
      ["Leurs raids se multiplient, commandant. On fortifie, on tient, et on rend coup pour coup.", "Les murs de Vashka ont souffert. On répare, on renforce, et on tient.", "La ligne de fer doit tenir jusqu'à ce que le colosse se montre. Ensuite, on l'abat."],
      ["Les premières vagues se sont brisées sur nos défenses. Ils cherchent la faille.", "Les premières brèches sont colmatées. Ils cherchent ailleurs.", "La ligne tient. Le colosse s'impatiente."],
      ["Un stratège de siège légendaire a vu ta résistance. Il veut se battre à tes côtés.", "{commander} répare un mur plus vite qu'on ne l'abat. Elle veut défendre les nôtres.", "{commander} a tenu une ligne de fer pendant cent jours. Il veut tenir la nôtre."],
      ["Le siège est levé. {commander} rejoint ton état-major : aucun mur ne tombera plus.", "Les murs tiennent. {commander} veille sur chaque pierre.", "Le colosse est tombé, la ligne tient. {commander} garde le front."],
    ],
    rivalLines: [
      ["Vos murs sont en papier. Mes béliers ont faim.", "Un mur réparé n'est qu'un mur qui attend.", "Votre ligne de fer ? De la tôle."],
      ["Une vague de plus, et vous céderez.", "Vous colmatez. Je creuse.", "Un pas en arrière, et tout cède."],
      ["Toutes mes escadres sur le même point. Tenez donc, si vous pouvez.", "Tous mes béliers contre le même pan. Réparez donc ça.", "Le colosse est lâché. Tenez donc, maintenant."],
      ["Je reviendrai. Les murs finissent toujours par tomber.", "Vos murs tiennent. Les miens aussi, à présent.", "Votre ligne a tenu. Je déteste ça."],
    ],
  },
  {
    id: "colonies",
    accent: "#5ef2b0",
    image: "/assets/pass/theme-colonies.webp",
    mentor: "lysa",
    rival: "kragmor",
    focus: ["contract", "raidRepelled", "victory"],
    beats: [
      ["Les sondes ont trouvé des mondes habitables. À toi de les faire fleurir avant que d'autres ne s'en emparent.", "Les franges appellent : plus loin, plus vite, plus nombreux.", "Nos colonies doivent tenir, même sous le feu. Des terres d'aube, pas des proies."],
      ["Tes premières colonies prospèrent. Les colons affluent.", "Les colonies poussent comme des graines. Les foreuses aussi.", "Les premières colonies ont tenu un raid. Les colons reprennent confiance."],
      ["Une gouverneure de légende cherche un empire digne de ses talents. Le tien l'intéresse.", "{commander} a fondé trois colonies en un an. Il veut fonder les tiennes.", "{commander} n'a jamais perdu une colonie. Elle veut garder les tiennes."],
      ["Les franges sont à nous. {commander} gouvernera tes colonies.", "La ruée est finie, tes mondes tiennent. {commander} les gouverne.", "L'aube se lève sur des mondes qui ne tombent pas. {commander} les garde."],
    ],
    rivalLines: [
      ["Ces mondes sont à moi. Mes foreuses arrivent.", "Chaque monde que vous fondez, je le fore.", "Vos colonies tombent toujours. Il suffit de frapper au bon endroit."],
      ["Une colonie ? Un caillou de plus à raser.", "Une colonie de plus. Une cible de plus.", "Une colonie qui tient ? Une exception."],
      ["J'envoie mes équipes de forage sur toutes vos colonies.", "Mes foreuses descendent sur vos nouveaux mondes.", "Toutes mes équipes sur vos mondes les plus fragiles."],
      ["Gardez vos cailloux. J'en trouverai d'autres.", "Vous êtes partout. C'est agaçant.", "Vos colonies tiennent. Je reviendrai à la nuit."],
    ],
  },
  {
    id: "chantiers",
    accent: "#ff8a3d",
    image: "/assets/pass/theme-chantiers.webp",
    mentor: "brannoc",
    rival: "kor",
    focus: ["victory", "contract", "warlordWin"],
    beats: [
      ["Les chantiers sont rouillés, mais les plans sont bons. Remets-les en marche, commandant.", "Ce qui revient du front doit repartir réparé. Les cales sèches t'attendent.", "Des pièces partout, à temps : c'est comme ça qu'on gagne une guerre."],
      ["Les premières coques sortent des cales. L'équipage applaudit.", "Les premières coques réparées repartent. L'équipage n'en revient pas.", "Les premières pièces sont livrées. Les canons suivent."],
      ["Une mécanicienne de génie a entendu parler de tes chantiers. Elle veut voir ce qu'ils valent.", "{commander} répare une frégate en une nuit. Il veut voir tes cales.", "{commander} sait où trouver chaque rivet du secteur. Il veut fournir tes chantiers."],
      ["L'arsenal tourne à plein. {commander} veille sur tes cales sèches.", "Les cales tournent. {commander} remet ta flotte sur pied après chaque bataille.", "Rien ne manque plus. {commander} garde tes chantiers approvisionnés."],
    ],
    rivalLines: [
      ["Mes chantiers produisent dix coques pour une des vôtres.", "Vos épaves me rapportent plus que vos vaisseaux.", "Je tiens vos fournisseurs. Vos canons attendront."],
      ["Jolies coques. Elles brûleront bien.", "Une coque réparée ? Je la recasse.", "Un rivet. Il vous en faut un million."],
      ["Ma nouvelle flotte est prête. Et la vôtre ?", "Je frappe vos cales pendant qu'elles sont pleines.", "J'ai coupé vos livraisons. Construisez avec du vide."],
      ["Hum. Vos chantiers sont meilleurs que prévu.", "Vos cales sont bien tenues. Dommage.", "Vos chantiers tournent. Je n'aime pas ça."],
    ],
  },
  {
    id: "moisson",
    accent: "#ffd86b",
    image: "/assets/pass/theme-moisson.webp",
    mentor: "kor",
    rival: "maru",
    focus: ["contract", "bounty", "raidRepelled"],
    beats: [
      ["Les gisements n'ont jamais été aussi riches. Récolte, stocke, et protège tes réserves.", "Des réserves pleines attirent les rapaces. Récolte, et garde bien.", "Partager la récolte, c'est gagner des alliés. Remplis les greniers d'or."],
      ["Les greniers se remplissent. Les pillards rôdent déjà.", "Les greniers débordent déjà. Les rapaces tournent au-dessus.", "Les premiers dons partent. Les alliés répondent."],
      ["Un intendant légendaire propose ses services à l'empire le mieux tenu du secteur.", "{commander} a sauvé trois récoltes des pillards. Elle veut sauver la tienne.", "{commander} a nourri tout un secteur un hiver entier. Il veut nourrir le tien."],
      ["Les greniers débordent. {commander} tiendra tes comptes.", "L'abondance est à l'abri. {commander} tient tes greniers.", "Les greniers d'or sont pleins, les alliés nombreux. {commander} tient tes comptes."],
    ],
    rivalLines: [
      ["Tant de réserves... et si peu de gardes.", "Tant d'abondance. Il serait dommage de la gâcher.", "Partager ? Je préfère prendre."],
      ["Vos greniers sentent bon. J'arrive.", "Vos greniers sentent l'été. J'ai faim d'été.", "Vos alliés mangent dans votre main. Je mangerai la main."],
      ["Toute la Ruche a faim. Vos réserves la nourriront.", "Toute la Ruche descend sur vos greniers.", "Je rachète vos alliés avec vos propres réserves."],
      ["Vos greniers sont bien gardés. Pour cette saison.", "Vos rapaces sont mieux dressés que les miens.", "Vos greniers et vos alliés tiennent. Pour cette saison."],
    ],
  },
];

/** Thèmes livrés, dans l'ordre de la rotation (douze). */
export const DEFAULT_PASS_THEMES: PassTheme[] = DEFAULT_THEME_ROTATION.map((id) => RAW_PASS_THEMES.find((t) => t.id === id)!)
  .concat(RAW_PASS_THEMES.filter((t) => !(DEFAULT_THEME_ROTATION as readonly string[]).includes(t.id)))
  .map((t) => ({ ...t, primary: DEFAULT_THEME_PRIMARY[t.id] }));

/** Thèmes en vigueur (posés par `setPassThemes`, depuis `applyGameContent`). */
export const PASS_THEMES: PassTheme[] = structuredClone(DEFAULT_PASS_THEMES);

export function setPassThemes(list: PassTheme[]): void {
  PASS_THEMES.splice(0, PASS_THEMES.length, ...list);
}

const HEX = /^#[0-9a-fA-F]{6}$/;
const textList = (v: unknown) => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === "string" && x.trim() !== "");

/** 6.14.128 (AA9) : erreurs des sections `passThemes` et `seasonCatalog` : fiches complètes, une saison par thème en rotation
 *  et par année du catalogue (sinon un mois tomberait sur une saison d'une autre année). */
export function validatePassCatalog(themes: unknown, entries: unknown): string[] {
  if (!Array.isArray(themes)) return ["Thèmes du passe : la section doit être une liste."];
  if (!Array.isArray(entries)) return ["Catalogue des saisons : la section doit être une liste."];
  const errors: string[] = [];
  const ids = new Set<string>();
  for (const t of themes as Partial<PassTheme>[]) {
    const label = `Thème du passe ${t?.id ?? "?"}`;
    if (!t || typeof t.id !== "string" || !/^[A-Za-z0-9_]+$/.test(t.id)) errors.push(`${label} : identifiant invalide (lettres, chiffres, _).`);
    else if (ids.has(t.id)) errors.push(`Thèmes du passe : identifiant « ${t.id} » en double.`);
    else ids.add(t.id);
    if (!t) continue;
    if (typeof t.accent !== "string" || !HEX.test(t.accent)) errors.push(`${label} : couleur « ${String(t.accent)} » invalide (#rrggbb).`);
    if (typeof t.image !== "string") errors.push(`${label} : image manquante.`);
    for (const k of ["mentor", "rival"] as const) if (!(String(t[k]) in STORY_SPEAKERS)) errors.push(`${label} : ${k === "mentor" ? "mentor" : "rival"} « ${String(t[k])} » inconnu.`);
    if (!COMMANDER_ROLES.includes(t.primary as CommanderId)) errors.push(`${label} : rôle principal « ${String(t.primary)} » inconnu.`);
    if (!Array.isArray(t.focus) || t.focus.length === 0 || t.focus.some((k) => !isTrackedObjective(k))) errors.push(`${label} : actions mises en avant inconnues ou absentes.`);
    for (const k of ["beats", "rivalLines"] as const) {
      const v = t[k] as unknown;
      if (!Array.isArray(v) || v.length !== 4 || !v.every(textList)) errors.push(`${label} : ${k === "beats" ? "répliques du mentor" : "répliques du rival"} : quatre temps, au moins une réplique chacun.`);
    }
    if (t.retired !== undefined && typeof t.retired !== "boolean") errors.push(`${label} : « retiré » doit être oui ou non.`);
  }
  const active = (themes as Partial<PassTheme>[]).filter((t) => t && !t.retired && typeof t.id === "string").map((t) => t.id as string);
  if (active.length === 0) errors.push("Thèmes du passe : au moins un thème en rotation.");
  const entryIds = new Set<string>();
  const slots = new Set<string>();
  let years = 1;
  for (const e of entries as Partial<SeasonCatalogEntry>[]) {
    const label = `Saison du catalogue ${e?.name || e?.id || "?"}`;
    if (!e || typeof e.id !== "string" || !/^[A-Za-z0-9_]+$/.test(e.id)) errors.push(`${label} : identifiant invalide (lettres, chiffres, _).`);
    else if (entryIds.has(e.id)) errors.push(`Catalogue des saisons : identifiant « ${e.id} » en double.`);
    else entryIds.add(e.id);
    if (!e) continue;
    if (!ids.has(String(e.theme))) errors.push(`${label} : thème « ${String(e.theme)} » inconnu.`);
    if (!(Number.isInteger(e.year) && (e.year as number) >= 1 && (e.year as number) <= 10)) errors.push(`${label} : année entière entre 1 et 10.`);
    else {
      years = Math.max(years, e.year as number);
      const slot = `${e.theme}:${e.year}`;
      if (slots.has(slot)) errors.push(`${label} : deux saisons pour « ${String(e.theme)} », année ${e.year}.`);
      slots.add(slot);
    }
    for (const k of ["name", "tagline", "synopsis", "scene"] as const) if (typeof e[k] !== "string" || (k === "name" && !e[k]!.trim())) errors.push(`${label} : « ${k} » manquant.`);
    // 6.14.138 (AP-L11) : image propre facultative (chemin d'image).
    if (e.image !== undefined && !(typeof e.image === "string" && (e.image === "" || e.image.startsWith("/")))) errors.push(`${label} : image : un chemin qui commence par « / ».`);
    const c = e.commander as Partial<SeasonCatalogEntry["commander"]> | undefined;
    if (!c || typeof c !== "object") errors.push(`${label} : commandant manquant.`);
    else {
      for (const k of ["name", "title", "lore", "look"] as const) if (typeof c[k] !== "string" || (k === "name" && !c[k]!.trim())) errors.push(`${label} : commandant, « ${k} » manquant.`);
      if (!COMMANDER_ROLES.includes(c.secondary as CommanderId)) errors.push(`${label} : second rôle « ${String(c.secondary)} » inconnu.`);
    }
  }
  for (const id of active) for (let y = 1; y <= years; y++) if (!slots.has(`${id}:${y}`)) errors.push(`Catalogue des saisons : aucune saison pour le thème « ${id} », année ${y} (${years} années au catalogue).`);
  return errors;
}

/* ---------- génération ---------- */

const pick = <T>(rng: () => number, xs: T[]): T => xs[Math.min(xs.length - 1, Math.floor(rng() * xs.length))];
const fill = (t: string, vars: Record<string, string>) => t.replace(/\{(\w+)\}/g, (_, k: string) => vars[k] ?? "");
const shuffle = <T>(rng: () => number, xs: T[]): T[] => {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

/** v5.14.2 : le passe a-t-il un défi à chaque palier ? (sinon : ancien format, à compléter) */
export function hasFullChallenges(s: Pick<PassSeason, "tiers" | "requirements">): boolean {
  return (s.tiers ?? []).every((_, i) => normalizeTierReqs(s.requirements?.[String(i + 1)]).length > 0);
}

/** v5.14.2 : réécrit seulement les défis d'un passe (thème, récompenses et points par
 *  palier inchangés : la progression des joueurs ne bouge pas). */
export function regenerateChallenges(season: PassSeason, digest: Pick<WorldDigest, "weeklyMedian">, variant = 0): PassSeason {
  const theme = PASS_THEMES.find((t) => t.id === season.theme.id) ?? PASS_THEMES.find((t) => t.id === catalogEntryFor(season.id).theme) ?? PASS_THEMES[0];
  const rng = seededRandom(`challenges:${season.id}:${variant}`);
  const focus = shuffle(rng, theme.focus);
  const gen = season.challengeMode === "cumulative" ? generateCumulativeChallenges : generateTierChallenges;
  return { ...season, requirements: gen(rng, focus, digest, season.tiers.length, theme.id) };
}

export interface GeneratePassSeasonOptions {
  monthId: string;
  digest: WorldDigest;
  existing: PassSeason[];
  now: number;
  variant?: number;
  /** Points par palier du mois précédent (base de l'ajustement). */
  basePointsPerTier?: number;
}

export function generatePassSeason(o: GeneratePassSeasonOptions): PassSeason {
  const variant = Math.max(0, Math.floor(o.variant ?? 0));
  const rng = seededRandom(`pass:${o.monthId}:${variant}`);
  // v5.14 : le catalogue fixe le thème du mois (douze en rotation, trois ans), son nom,
  // son scénario et son commandant ; le tirage ne règle plus que paliers et répliques.
  const entry = catalogEntryFor(o.monthId);
  const theme = PASS_THEMES.find((t) => t.id === entry.theme) ?? PASS_THEMES[0];
  const name = entry.name;
  const label = seasonLabel(o.monthId);

  // Commandant de saison : rôle du thème, second rôle propre à l'année.
  const cmdName = entry.commander.name;
  const cmdTitle = entry.commander.title;
  const vars = { mentor: STORY_SPEAKERS[theme.mentor].name, rival: STORY_SPEAKERS[theme.rival].name, commander: cmdName, theme: name };
  const commander: PassSeason["commander"] = {
    id: `s-${o.monthId}`,
    name: cmdName,
    title: cmdTitle,
    portrait: SEASON_PORTRAITS.includes(o.monthId) ? `/assets/commanders/s-${o.monthId}.webp` : "",
    primary: THEME_PRIMARY[entry.theme],
    secondary: entry.commander.secondary,
    lore: fill(entry.commander.lore, vars),
    seasonId: o.monthId,
    seasonLabel: label,
    prompt: portraitPrompt(entry, theme.accent),
  };

  // Paliers : ancien gabarit du générateur de chapitres (repli), puis prérequis et final.
  const g = generatePass(rng, o.digest, o.basePointsPerTier ?? PASS_RULES.pointsPerTier);
  const rules = passGenRules();
  const reasons: string[] = [];
  // 6.8.1 : récompenses tirées sous budget (tirage à part : le reste du passe ne change pas de graine).
  let tiers = g.pass.tiers.map((t) => t.map((r) => ({ ...r }))) as PassReward[][];
  if (rules.enabled) {
    const b = generateBudgetTiers(seededRandom(`passgen:${o.monthId}:${variant}`), tiers.length, rules);
    tiers = b.tiers;
    reasons.push(...b.reasons);
  } else reasons.push(`Récompenses : gabarit fixe (budget désactivé), ${Math.round(tiersValue(tiers.slice(0, -1), rules))} h de production équivalentes.`);
  tiers[tiers.length - 1] = [{ kind: "commander", id: commander.id }, { kind: "amber", amount: PASS_REWARD_RULES.finalAmber }, { kind: "cosmetic" }];
  // 6.8.1 : points par palier calculés sur les points par jour mesurés ; sans mesure, l'ancien ajustement de ±15 %.
  const computed = computePointsPerTier(o.digest.passPace, tiers.length, rules);
  let pointsPerTier = computed?.ppt ?? g.pass.pointsPerTier;
  reasons.push(...(computed?.reasons ?? [...g.reasons, "Pas encore de points par jour mesurés : ajustement sur la part de joueurs qui ont fini."]));
  const focus = shuffle(rng, theme.focus);
  reasons.push(
    entry.generatedFrom
      ? `Thème : ${name} (${theme.id}, année ${entry.year}, saison générée au-delà du cycle de ${catalogCycle()} mois, sur la saison écrite ${entry.generatedFrom} ; à relire avant publication).`
      : `Thème : ${name} (${theme.id}, année ${entry.year} du catalogue, saison ${catalogIndex(o.monthId) + 1} sur ${catalogCycle()}).`,
  );
  let requirements = generateCumulativeChallenges(rng, focus, o.digest, tiers.length, theme.id);
  // 6.14.58 (AU27, AP-2) : défis faisables pour le joueur médian avant tout le reste (nouveaux tirages, puis seuils réduits).
  const fit = fitChallenges({ pointsPerTier, tiers, requirements, challengeMode: "cumulative" }, o.digest, (k) =>
    redrawChallenges({ id: o.monthId, theme: { id: theme.id } as PassSeason["theme"], tiers, challengeMode: "cumulative" }, o.digest, variant, k),
  );
  requirements = fit.requirements;
  pointsPerTier = fit.pointsPerTier;
  const excluded = Object.keys(rules.challengeWeights).filter((k) => Number(rules.challengeWeights[k]) > 0 && !challengePool(o.digest.weeklyMedian, rules, theme.id).some((x) => x.key === k));
  if (excluded.length > 0)
    reasons.push(`Hors des défis (médiane du serveur trop faible, seuil ${rules.challengeMinWeekly} par semaine, ${rules.passiveMinWeekly} pour une action passive) : ${excluded.map((k) => objectiveLabel(k).toLowerCase()).join(", ")}.`);
  const totals: Record<string, number> = {};
  Object.values(requirements).forEach((list) => list.forEach((r) => (totals[r.key] = (totals[r.key] ?? 0) + r.count)));
  reasons.push(
    `Défis cumulés (totaux du mois, paliers dans l'ordre) : le joueur médian relève le dernier vers le jour ${passTargetDay()}. Sommes des seuils : ${Object.entries(totals)
      .map(([k, n]) => `${objectiveLabel(k).toLowerCase()} ${n} (médiane ${o.digest.weeklyMedian[k as ChronicleObjective] ?? 0} par semaine)`)
      .join(", ")}.`,
  );
  for (const t of [1, 10, 20, 30].filter((x) => x <= tiers.length))
    reasons.push(`Défi du palier ${t} : ${requirements[String(t)].map((r) => `${objectiveLabel(r.key).toLowerCase()} × ${r.count}`).join(", ")}.`);
  reasons.push(...fit.reasons);

  // 6.8.1 : contrôle par simulation avant publication (joueur médian et plus actif du serveur).
  const pace = passPaceCheck({ pointsPerTier, tiers, requirements, challengeMode: "cumulative" }, o.digest);
  if (pace.topDay !== null && pace.topDay < rules.targetTopDay && pointsPerTier < rules.pointsMax) {
    // Trop rapide pour le plus actif : on allonge le palier, sans faire finir le médian après le jour limite.
    for (let ppt = pointsPerTier + 5; ppt <= rules.pointsMax; ppt += 5) {
      const c = passPaceCheck({ pointsPerTier: ppt, tiers, requirements, challengeMode: "cumulative" }, o.digest);
      if (c.medianDay === null || c.medianDay > rules.latestMedianDay) break;
      pointsPerTier = ppt;
      if (c.topDay === null || c.topDay >= rules.targetTopDay) break;
    }
    reasons.push(`Simulation : le plus actif finissait au jour ${pace.topDay} ; points par palier portés à ${pointsPerTier}.`);
  }
  const check = passPaceCheck({ pointsPerTier, tiers, requirements, challengeMode: "cumulative" }, o.digest);
  reasons.push(
    `Simulation : joueur médian au dernier palier ${check.medianDay === null ? "après la fin du mois" : `le jour ${check.medianDay}`} (cible ${rules.targetMedianDay}), plus actif ${check.topDay === null ? "après la fin du mois" : `le jour ${check.topDay}`} (pas avant ${rules.targetTopDay}).`,
  );

  const line = (speaker: Speaker, text: string): StoryLine => ({ speaker, text: fill(text, vars) });
  const titles = ["Prologue", "Premier acte", "Deuxième acte", "Dénouement"];
  // 6.14.137 (AU27, lot AP-L10) : la n-ième réplique d'un temps sert l'année n du catalogue (un tirage consommé comme avant :
  // l'année 1 garde ses répliques ; l'année 2 ne répète plus l'année 1 mot pour mot).
  // Banques désactivées : la première réplique (celle d'avant) ; `passLinesByYear` faux : tirage au hasard.
  const legacy = NARRATIVE_RULES.enabled === false;
  const byYear = !legacy && NARRATIVE_RULES.passLinesByYear !== false;
  const pickLine = (xs: string[]): string => {
    const drawn = pick(rng, xs);
    const list = (xs ?? []).filter((x) => typeof x === "string" && x.trim() !== "");
    if (list.length <= 1) return drawn;
    return legacy ? list[0] : byYear ? list[(Math.max(1, Math.floor(entry.year) || 1) - 1) % list.length] : drawn;
  };
  const milestones: PassMilestone[] = [0, 10, 20, 30].map((tier, i) => ({
    tier: Math.min(tier, tiers.length),
    title: titles[i],
    lines: [line(theme.mentor, pickLine(theme.beats[i])), line(theme.rival, pickLine(theme.rivalLines[i]))],
  }));

  return {
    id: o.monthId,
    status: "draft",
    theme: { id: theme.id, name, tagline: entry.tagline, accent: theme.accent, image: seasonThemeImage(entry, theme.image), prompt: illustrationPrompt(entry, theme.accent) },
    scenario: { synopsis: fill(entry.synopsis, vars), milestones },
    pointsPerTier,
    tiers,
    requirements,
    challengeMode: "cumulative",
    commander,
    auto: { generatedAtMs: o.now, variant, reasons, pace: check, generator: GENERATOR_VERSION.pass },
  };
}

/** 6.8.1 : jour de fin simulé du joueur médian et du plus actif (actions du serveur, points par jour mesurés ;
 *  sans mesure : profils par défaut). Le plus actif fait les actions au même rapport que ses points. */
export function passPaceCheck(season: Pick<PassSeason, "pointsPerTier" | "tiers" | "requirements" | "challengeMode">, d: Pick<WorldDigest, "weeklyMedian" | "passPace">): { medianDay: number | null; topDay: number | null } {
  const [, defMedian, defActive] = defaultSimProfiles();
  const hasData = Object.values(d.weeklyMedian).some((v) => (v ?? 0) > 0);
  const median = hasData ? profileFromMedian(d.weeklyMedian) : defMedian;
  const pace = d.passPace;
  const ratio = pace && pace.median > 0 ? Math.min(4, Math.max(1, pace.top / pace.median)) : 2;
  const top = { ...median, id: "top", label: "Plus actif", weekly: Object.fromEntries(Object.entries(median.weekly).map(([k, v]) => [k, (v ?? 0) * ratio])) };
  const run = (p: typeof median, ppd?: number) => simulatePass(season, ppd ? { ...p, pointsPerDay: ppd } : p, 31, 62).finishDay;
  return { medianDay: run(median, pace?.median), topDay: pace ? run(top, Math.max(pace.top, pace.median)) : run(defActive) };
}

/* ---------- validation, application ---------- */

const MONTH = /^\d{4}-\d{2}$/;

export function validatePassSeasons(cfg: PassSeasonsConfig | undefined): string[] {
  const errors: string[] = [];
  if (!cfg) return errors;
  const ids = new Set<string>();
  for (const s of cfg.seasons ?? []) {
    const at = `Passe ${s?.id ?? "?"}`;
    if (!s || !MONTH.test(String(s.id))) {
      errors.push("Passes de saison : mois invalide (AAAA-MM).");
      continue;
    }
    if (ids.has(s.id)) errors.push(`${at} : en double.`);
    ids.add(s.id);
    if (!(s.pointsPerTier >= 1)) errors.push(`${at} : points par palier ≥ 1.`);
    if (!Array.isArray(s.tiers) || s.tiers.length < 1 || s.tiers.length > 60) errors.push(`${at} : entre 1 et 60 paliers.`);
    if (!s.theme?.name?.trim()) errors.push(`${at} : nom du thème manquant.`);
    for (const [tier, raw] of Object.entries(s.requirements ?? {})) {
      if (!(Number(tier) >= 1 && Number(tier) <= (s.tiers?.length ?? 0))) errors.push(`${at} : prérequis sur un palier inexistant (${tier}).`);
      const list = (Array.isArray(raw) ? raw : [raw]) as Partial<PassRequirement>[];
      if (list.length > 4) errors.push(`${at}, palier ${tier} : quatre prérequis au plus.`);
      const keys = new Set<string>();
      for (const r of list) {
        if (!isTrackedObjective(r?.key)) errors.push(`${at}, palier ${tier} : action de prérequis inconnue.`);
        if (!(Number(r?.count) >= 1)) errors.push(`${at}, palier ${tier} : nombre ≥ 1.`);
        if (keys.has(String(r?.key))) errors.push(`${at}, palier ${tier} : la même action deux fois.`);
        keys.add(String(r?.key));
      }
    }
    const c = s.commander;
    if (!c?.name?.trim()) errors.push(`${at} : nom du commandant manquant.`);
    if (c && c.id !== `s-${s.id}`) errors.push(`${at} : identifiant du commandant attendu « s-${s.id} ».`);
    if (c && (!COMMANDER_ROLES.includes(c.primary) || !COMMANDER_ROLES.includes(c.secondary))) errors.push(`${at} : rôles du commandant inconnus.`);
    if (c && c.primary === c.secondary) errors.push(`${at} : le second rôle du commandant doit différer du premier.`);
    if (s.status === "published" && !(s.tiers ?? []).some((t) => (t ?? []).some((r) => r?.kind === "commander" && r.id === c?.id))) errors.push(`${at} : le commandant n'est donné à aucun palier.`);
  }
  return errors;
}

/** Passes publiés : remplacent le passe du mois ; leurs commandants rejoignent le catalogue. */
export function setPassSeasons(cfg: PassSeasonsConfig | undefined): void {
  const published = (cfg?.seasons ?? []).filter((s) => s && s.status === "published" && MONTH.test(s.id) && s.pointsPerTier >= 1 && Array.isArray(s.tiers) && s.tiers.length > 0);
  const passes = new Map<string, MonthPass>();
  for (const s of published)
    passes.set(s.id, {
      pointsPerTier: s.pointsPerTier,
      tiers: s.tiers,
      requirements: Object.fromEntries(Object.entries(s.requirements ?? {}).map(([t, r]) => [t, normalizeTierReqs(r)])),
      ...(s.challengeMode === "cumulative" ? { challengeMode: "cumulative" as const } : {}),
    });
  setPassSeasonOverrides(passes);
  setSeasonCommanders(published.filter((s) => s.commander).map((s) => s.commander));
  PUBLISHED.splice(0, PUBLISHED.length, ...published);
}

const PUBLISHED: PassSeason[] = [];

/** Passe publié d'un mois (thème, scénario…), s'il y en a un. */
export function publishedPassSeason(seasonId: string): PassSeason | null {
  return PUBLISHED.find((s) => s.id === seasonId) ?? null;
}

/** Brouillon ou passe d'un mois dans la configuration. */
export function findPassSeason(cfg: PassSeasonsConfig, id: string): PassSeason | null {
  return cfg.seasons.find((s) => s.id === id) ?? null;
}

/** Remplace (ou ajoute) un passe, trié par mois. */
export function upsertPassSeason(cfg: PassSeasonsConfig, season: PassSeason): PassSeasonsConfig {
  return { seasons: [...cfg.seasons.filter((s) => s.id !== season.id), season].sort((a, b) => (a.id < b.id ? -1 : 1)) };
}

/** Publication : brouillon → publié (garde la date). */
export function publishPassSeason(season: PassSeason, now: number): PassSeason {
  return { ...season, status: "published", publishedAtMs: season.publishedAtMs ?? now };
}

/** 6.14.57 (AU27, AP-3) : brouillons écrits par une version plus ancienne du générateur, à régénérer (même variante).
 *  Seulement un brouillon généré (`auto`), du mois en cours ou d'un mois à venir, jamais retouché dans l'admin ; un passe
 *  publié n'est jamais touché (les joueurs y avancent). */
export function outdatedPassDrafts(cfg: PassSeasonsConfig, currentMonthId: string): PassSeason[] {
  return cfg.seasons.filter((s) => s && s.status === "draft" && s.auto && !s.auto.editedAtMs && (s.auto.generator ?? 1) < GENERATOR_VERSION.pass && s.id >= currentMonthId && passSeasonAllowed(s.id));
}

/** Le mois suivant (AAAA-MM). */
/** v5.14.1 : les passes de saison commencent avec le catalogue (novembre 2026) ; avant,
 *  le passe du mois reste celui des Chroniques (sinon le catalogue repartirait par la fin). */
export function passSeasonAllowed(monthId: string): boolean {
  return monthId >= CATALOG_START;
}

/** v5.14.1 : mois dont la tâche horaire peut écrire le brouillon. Le mois en cours seulement
 *  le 1er (un passe écrit en cours de mois remplacerait celui sur lequel les joueurs avancent). */
export function autoDraftMonths(currentMonthId: string, dayOfMonth: number, leadDay: number): string[] {
  const ids = [...(dayOfMonth <= 1 ? [currentMonthId] : []), ...(dayOfMonth >= leadDay ? [nextMonthId(currentMonthId)] : [])];
  return ids.filter(passSeasonAllowed);
}

export function nextMonthId(id: string): string {
  const [y, m] = id.split("-").map(Number);
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`;
}
