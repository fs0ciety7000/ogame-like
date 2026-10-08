import { chronicleMonthId, chroniclesConfig, type ChronicleMonth, type ChronicleObjective } from "@/game/chronicles";
import { extraObjectives, measuredPlayable, objectiveLabel, objectivePassive, trackedWeight } from "@/game/trackedActions";
import { passState } from "@/game/seasonPass";
import { ACTIVITY_KEYS, baseCount, chapterArchetypes, seededRandom, type WorldDigest } from "@/game/procedural";
import { seasonLabel } from "@/game/seasons";
import type { PlayerState } from "@/types/game";

/* =====================================================
   v5.5 : saga d'alliance, générée chaque mois. Trois objectifs communs
   (somme de l'activité du mois des membres : missions, combats, contrats…),
   calibrés sur l'activité médiane et la taille des alliances. Classement
   des alliances par points de saga (100 par objectif atteint, jusqu'à 200
   en le dépassant), mis à jour chaque heure par le serveur. À la fin du
   mois : heures de production des membres versées au trésor des trois
   premières, titre pour les membres de la première.
===================================================== */

export const ALLIANCE_SAGA_KEY = "alliance_saga";

export const ALLIANCE_SAGA_RULES = {
  objectives: 3,
  /** Points par objectif : 100 × progression, plafonnée à 2 (objectif dépassé). */
  pointsPerObjective: 100,
  overflowCap: 2,
  /** Heures de production des membres versées au trésor, 1re à 3e. */
  rewardHours: [24, 12, 6],
  /** Objectif = médiane hebdomadaire × semaines × taille médiane des alliances × ce facteur. */
  weeks: 4,
  share: 0.6,
  /** 6.14.148 (AU28, AP-L6, constat AP-6) : la saga suit la faction et le boss du chapitre des Chroniques du même mois. */
  followChapter: true,
  /** 6.14.148 (AP-L6) : un titre de saga ne revient pas avant ce nombre de mois (0 : tirage libre, comme avant). */
  noRepeatMonths: 3,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const ALLIANCE_SAGA_RULES_META = {
  objectives: { label: "Objectifs par saga", min: 1, max: 6 },
  pointsPerObjective: { label: "Points par objectif atteint", unit: "points", min: 1, max: 10_000 },
  overflowCap: { label: "Dépassement compté au plus", unit: "×", min: 1, max: 10, hint: "Un objectif dépassé compte jusqu'à ce multiple (2 = 200 points pour 100)." },
  rewardHours: { label: "Podium : heures de production versées au trésor (1re, 2e, 3e)", unit: "h" },
  weeks: { label: "Durée de référence de l'objectif", unit: "semaines", min: 1, max: 12, hint: "Objectif = médiane hebdomadaire × semaines × taille médiane des alliances × part." },
  share: { label: "Part de l'effort médian visée", unit: "×", min: 0.05, max: 5 },
  followChapter: { label: "Saga sur la faction du chapitre du mois", hint: "Décoché : faction tirée à part (avant la 6.14.148), au risque de trois histoires différentes le même mois." },
  noRepeatMonths: { label: "Titre de saga non repris avant", unit: "mois", min: 0, max: 5, hint: "0 : tirage libre. Au plus 5 (6 titres)." },
};

export interface AllianceSagaDef {
  monthId: string;
  title: string;
  lore: string;
  bossName: string;
  image: string;
  accent: string;
  objectives: { type: ChronicleObjective; count: number }[];
  /** Titre des membres de l'alliance victorieuse. */
  winnerTitle: string;
  generatedAtMs: number;
}

export interface SagaRow {
  allianceId: string;
  name: string;
  tag: string;
  members: number;
  progress: number[];
  points: number;
  rank: number;
}

export interface AllianceSagaState {
  sagas: AllianceSagaDef[];
  standing: { monthId: string; rows: SagaRow[]; updatedAtMs: number } | null;
  /** Mois déjà clos et récompensés. */
  closed: string[];
}

export function readAllianceSaga(raw: unknown): AllianceSagaState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<AllianceSagaState>;
  return {
    sagas: Array.isArray(r.sagas) ? r.sagas.slice(-12) : [],
    standing: r.standing && Array.isArray(r.standing.rows) ? r.standing : null,
    closed: Array.isArray(r.closed) ? r.closed.slice(-24) : [],
  };
}

export function sagaOf(state: AllianceSagaState, monthId: string): AllianceSagaDef | null {
  return state.sagas.find((s) => s.monthId === monthId) ?? null;
}

const SAGA_TITLES = ["L'Alliance des cendres", "Le Serment commun", "La Grande Coalition", "Les Bannières levées", "Le Pacte des étoiles", "La Marche commune"];
const SAGA_WINNERS = ["Héros de la saga", "Porte-bannière", "Champion d'alliance", "Fer de lance"];

/** Saga du mois, calibrée sur l'activité et la taille des alliances. */
export function generateAllianceSaga(
  monthId: string,
  digest: WorldDigest & { allianceSizeMedian?: number },
  difficulty: number,
  now: number,
  /** 6.14.148 (AP-L6) : chapitre du mois (absent : lu dans la configuration des Chroniques) et titres des sagas précédentes. */
  opts: { chapter?: Pick<ChronicleMonth, "auto" | "boss"> | null; recentTitles?: string[] } = {},
): AllianceSagaDef {
  const rng = seededRandom(`saga:${monthId}`);
  // 6.14.125 (AA7) : archétypes du jeu, plus celui de repli d'une faction ajoutée dans l'admin.
  const archetypes = chapterArchetypes();
  const drawn = archetypes[Math.floor(rng() * archetypes.length) % archetypes.length];
  // 6.14.148 (AP-L6, AP-6) : faction, boss et image du chapitre du mois ; un chapitre écrit à la main se reconnaît à son image de repli.
  const chapter = ALLIANCE_SAGA_RULES.followChapter ? (opts.chapter !== undefined ? opts.chapter : (chroniclesConfig().months.find((m) => m.id === monthId) ?? null)) : null;
  const chapterArch = chapter ? archetypes.find((a) => a.id === chapter.auto?.archetype) ?? archetypes.find((a) => a.fallbackImage === chapter.boss?.fallbackImage) : undefined;
  const arch = chapterArch ?? drawn;
  // 6.14.121 (AP-L7) : actions du registre (lune, colonies) en fin de liste, seulement si le serveur les pratique ; poids 0 : retirée.
  const extra = extraObjectives().filter((k) => measuredPlayable(k, digest.weeklyMedian) && (!objectivePassive(k) || (digest.weeklyMedian[k] ?? 0) > 0));
  const pool = [...ACTIVITY_KEYS.filter((k) => k !== "warlordWin" || (digest.weeklyMedian.warlordWin ?? 0) > 0), ...extra].filter((k) => trackedWeight(k) > 0);
  const chosen: ChronicleObjective[] = [];
  while (chosen.length < ALLIANCE_SAGA_RULES.objectives && pool.length > 0) chosen.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  const size = Math.max(2, Math.round(digest.allianceSizeMedian ?? 3));
  const objectives = chosen.map((type) => {
    const weekly = Math.max(digest.weeklyMedian[type] ?? 0, baseCount(type) / 2);
    return { type, count: Math.max(size, Math.round(weekly * ALLIANCE_SAGA_RULES.weeks * size * ALLIANCE_SAGA_RULES.share * difficulty)) };
  });
  const drawnBoss = arch.bossNames[Math.floor(rng() * arch.bossNames.length)];
  const bossName = chapterArch && chapter?.boss?.name ? chapter.boss.name : drawnBoss;
  // 6.14.148 (AP-L6) : titres des derniers mois écartés (même tirage qu'avant quand rien n'est écarté).
  const gap = Math.min(Math.max(0, Math.floor(ALLIANCE_SAGA_RULES.noRepeatMonths)), SAGA_TITLES.length - 1);
  const recent = new Set(gap > 0 ? (opts.recentTitles ?? []).slice(-gap) : []);
  const titles = SAGA_TITLES.filter((t) => !recent.has(t));
  const title = titles[Math.floor(rng() * titles.length)];
  return {
    monthId,
    title,
    lore: `${seasonLabel(monthId)} : ${arch.faction} lance ${bossName.replace(/^(Le|La|Les)(?=\s)|^L'/, (a) => a.toLowerCase())} contre le secteur. Seules les alliances qui tiennent ensemble auront leur nom gravé dans les archives.`,
    bossName,
    image: chapterArch && chapter?.boss?.image ? chapter.boss.image : arch.image,
    accent: arch.accent,
    objectives,
    winnerTitle: `${SAGA_WINNERS[Math.floor(rng() * SAGA_WINNERS.length)]} (${seasonLabel(monthId).toLowerCase()})`,
    generatedAtMs: now,
  };
}

/** Progression d'une alliance : somme de l'activité du mois de ses membres. */
export function sagaProgress(def: AllianceSagaDef, members: Pick<PlayerState, "seasonPass">[], now: number): number[] {
  return def.objectives.map((o) => members.reduce((a, m) => a + (passState(m, now).activity?.[o.type] ?? 0), 0));
}

export function sagaPoints(def: AllianceSagaDef, progress: number[]): number {
  return def.objectives.reduce((a, o, i) => a + Math.round(ALLIANCE_SAGA_RULES.pointsPerObjective * Math.min(ALLIANCE_SAGA_RULES.overflowCap, (progress[i] ?? 0) / Math.max(1, o.count))), 0);
}

export function sagaStandings(def: AllianceSagaDef, alliances: { id: string; name: string; tag: string; members: Pick<PlayerState, "seasonPass">[] }[], now: number): SagaRow[] {
  const rows = alliances.map((a) => {
    const progress = sagaProgress(def, a.members, now);
    return { allianceId: a.id, name: a.name, tag: a.tag, members: a.members.length, progress, points: sagaPoints(def, progress), rank: 0 };
  });
  rows.sort((x, y) => y.points - x.points || y.progress.reduce((a, b) => a + b, 0) - x.progress.reduce((a, b) => a + b, 0));
  rows.forEach((r, i) => (r.rank = i + 1));
  return rows.filter((r) => r.points > 0 || r.members > 0);
}

export function sagaObjectiveLabel(type: ChronicleObjective): string {
  return objectiveLabel(type);
}

/** Mois de la saga en cours (même calendrier que les Chroniques). */
export function sagaMonthId(now: number): string {
  return chronicleMonthId(now);
}
