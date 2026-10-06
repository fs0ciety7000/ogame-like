import type { ChronicleObjective } from "@/game/chronicles";
import { generateBudgetTiers, passGenRules, type PassGenRules } from "@/game/passGen";
import type { PassReward } from "@/game/seasonPass";

/* =====================================================
   6.8.2 : chapitres des Chroniques générés sous réglages (proposition
   generation-passe-chroniques, §5.5 et §5.6). GameRules.chronicleGen,
   Admin → Règles → Chroniques générées.
   - Récompenses des 4 épisodes tirées sous budget (même table de valeurs
     que le passe, passGen.values), multiplié par la difficulté du mois.
   - Objectifs : actions autorisées et pondérées ; bornes de difficulté et
     des quantités demandées.
   - Thème commun : la faction du chapitre suit le thème du passe du mois
     (catalogue des saisons), sauf si elle revient deux mois de suite.
   Valeurs littérales (CLAUDE.md : pas de constante d'un autre module au chargement).
===================================================== */

export const CHRONICLE_GEN_RULES = {
  /** false : ancien gabarit des récompenses d'épisode (Ambre, capsule, production, dossier). */
  enabled: true,
  /** Valeur des 4 épisodes, en heures de production équivalentes (× difficulté du mois). */
  episodeBudgetHours: 10,
  /** Le 4e épisode vaut (1 + courbe) fois le 1er. */
  episodeCurve: 0.5,
  /** Poids de tirage des récompenses d'épisode (les jetons viennent déjà du bonus des Chroniques). */
  weights: { production: 2, amber: 2, capsule: 2, dossier: 1, tokens: 0 },
  /** Plafonds du chapitre (4 épisodes). */
  caps: { amber: 60, tokens: 0, dossier: 2, capsules: 2 },
  /** Chapitre terminé : Ambre, et relique épique (sinon rare) à partir de cette difficulté. */
  completionAmber: 30,
  completionEpicFrom: 1.2,
  /** Difficulté : 1 si la part visée des joueurs termine les épisodes ouverts depuis assez longtemps. */
  difficultyMin: 0.7,
  difficultyMax: 1.4,
  targetCompletion: 0.5,
  matureEpisodeDays: 5,
  /** Quantité demandée : médiane d'une semaine × difficulté, bornée entre ces facteurs de la base. */
  objectiveMinFactor: 0.5,
  objectiveMaxFactor: 3,
  /** Poids des actions dans les objectifs (0 : jamais). Les raids repoussés n'entrent que si le serveur en repousse. */
  objectiveWeights: { contract: 1, bounty: 1, raidRepelled: 1, victory: 1, mission: 1, spy: 1, market: 1, warlordWin: 1, bossAssault: 0 } as Record<string, number>,
  /** Faction du chapitre selon le thème du passe du mois (identifiants d'archétypes). */
  followPassTheme: true,
  themeArchetypes: {
    vide: "confrerie",
    hiver: "choeur",
    forge: "gravhorn",
    bazar: "cartel",
    maree: "confrerie",
    colonies: "meute",
    primes: "culte",
    comete: "cartel",
    moisson: "culte",
    archives: "choeur",
    chantiers: "cartel",
    rempart: "inquisition",
  } as Record<string, string>,
};

export type ChronicleGenRules = typeof CHRONICLE_GEN_RULES;

const DEFAULTS: ChronicleGenRules = structuredClone(CHRONICLE_GEN_RULES);

export function chronicleGenRules(): ChronicleGenRules {
  const r = CHRONICLE_GEN_RULES;
  return {
    ...DEFAULTS,
    ...r,
    weights: { ...DEFAULTS.weights, ...(r.weights ?? {}) },
    caps: { ...DEFAULTS.caps, ...(r.caps ?? {}) },
    objectiveWeights: { ...DEFAULTS.objectiveWeights, ...(r.objectiveWeights ?? {}) },
    themeArchetypes: { ...DEFAULTS.themeArchetypes, ...(r.themeArchetypes ?? {}) },
  };
}

export function validateChronicleGenRules(r: ChronicleGenRules | undefined, archetypeIds: string[] = []): string[] {
  if (!r) return [];
  const e: string[] = [];
  const L = "Chroniques générées";
  if (!(r.episodeBudgetHours > 0)) e.push(`${L} : budget des épisodes > 0.`);
  if (!(r.episodeCurve >= 0 && r.episodeCurve <= 10)) e.push(`${L} : courbe entre 0 et 10.`);
  if (!(r.difficultyMin > 0 && r.difficultyMin <= 1 && r.difficultyMax >= 1 && r.difficultyMax <= 5)) e.push(`${L} : difficulté min ≤ 1 ≤ max (5 au plus).`);
  if (!(r.targetCompletion > 0 && r.targetCompletion < 1)) e.push(`${L} : part visée entre 0 et 1.`);
  if (!(r.objectiveMinFactor > 0 && r.objectiveMinFactor <= r.objectiveMaxFactor)) e.push(`${L} : bornes des quantités min ≤ max.`);
  if (!(r.completionAmber >= 0)) e.push(`${L} : Ambre du chapitre terminé ≥ 0.`);
  if (Object.values(r.objectiveWeights ?? {}).filter((v) => Number(v) > 0).length < 4) e.push(`${L} : au moins 4 actions autorisées dans les objectifs.`);
  if (archetypeIds.length)
    for (const [theme, a] of Object.entries(r.themeArchetypes ?? {})) if (!archetypeIds.includes(a)) e.push(`${L} : thème ${theme}, faction « ${a} » inconnue.`);
  return e;
}

/** Règles du passe adaptées aux 4 épisodes (même table de valeurs). */
function episodeBudgetRules(r: ChronicleGenRules, difficulty: number): PassGenRules {
  const p = passGenRules();
  return {
    ...p,
    budgetHours: r.episodeBudgetHours * difficulty,
    curve: r.episodeCurve,
    milestones: [],
    rareRelicTiers: [],
    epicRelicTiers: [],
    weights: r.weights,
    caps: r.caps,
  };
}

/** Récompenses des 4 épisodes, tirées sous budget. */
export function budgetEpisodeRewards(rng: () => number, difficulty: number, r: ChronicleGenRules = chronicleGenRules()): PassReward[][] {
  return generateBudgetTiers(rng, 5, episodeBudgetRules(r, difficulty)).tiers.slice(0, 4);
}

/** Actions autorisées dans les objectifs et leur poids. */
export function objectiveWeight(k: ChronicleObjective, r: ChronicleGenRules = chronicleGenRules()): number {
  return Math.max(0, Number(r.objectiveWeights[k] ?? 0));
}
