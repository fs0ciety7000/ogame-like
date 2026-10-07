import { effectiveBuildingLevel } from "@/game/buildings";
import { GameActionError } from "@/game/errors";
import { formatInt } from "@/game/format";
import { getProductionRatesPerSecond } from "@/game/production";
import type { NewNotification } from "@/game/flush";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   6.14.85 (RL-2, proposals/rythme-long-terme.md §5.2, Q164 à Q171) :
   projets de prestige. Un puits durable pour la production en trop.

   - Un projet coûte `hoursPerProject` heures de la production commune du
     moment (extracteurs et technos, comme les primes et tributs), réparties
     comme la production ; `growth` multiplie ce nombre d'heures à chaque
     projet achevé (1 : coût constant en heures).
   - Il dure `durationHours` ; un seul à la fois (invariant I32).
   - Ouvert quand les 4 extracteurs atteignent `unlockExtractorLevel`.
   - Récompense **visible seulement** (Q168, RL-Q5) : compteur de projets,
     points de prestige (classement), monument sur la fiche publique,
     succès. Aucun bonus de combat ni de production : rien n'entre dans la
     couche empire (I14 intact).
   - Le compteur ne repart jamais de zéro (l'Ascension le garde).

   Règles : groupe `prestige` du registre (`ruleRegistry.ts`), valeurs
   littérales seulement (initialisation des modules, CLAUDE.md).
===================================================== */

/** Les 4 extracteurs des ressources communes (condition d'ouverture). */
export const PRESTIGE_EXTRACTORS = ["extracteur_ferraille", "reacteur_instable", "extracteur_nanocomposants", "archives_fracturees"] as const;

const COMMONS: ResourceId[] = ["scrap", "energy", "nano", "data"];

/** Illustration du chantier et du monument : image provisoire tant que l'emplacement `prestige-monument`
 *  (scripts/illustrations.json, cible /assets/prestige/monument.webp) n'est pas intégré (docs/illustrations.md). */
export const PRESTIGE_IMAGE = "/assets/buildings/fonderie_quantique.webp";

export interface PrestigeMonument {
  /** Projets achevés à partir desquels le monument s'élève. */
  projects: number;
  name: string;
}

export const PRESTIGE_RULES = {
  /** false : plus de nouveau projet (un projet en cours se termine ; compteurs, monuments et succès restent). */
  enabled: true,
  /** Coût d'un projet, en heures de production commune du moment. */
  hoursPerProject: 8,
  /** Durée d'un projet (h). */
  durationHours: 8,
  /** Niveau que les 4 extracteurs doivent atteindre pour ouvrir les projets. */
  unlockExtractorLevel: 10,
  /** Points de prestige gagnés par projet achevé (classement « Prestige »). */
  pointsPerProject: 8,
  /** Heures du projet suivant = heures × growth^(projets achevés) ; 1 = coût constant en heures. */
  growth: 1,
  /** Monuments de la fiche publique, par nombre de projets achevés (le plus haut atteint s'affiche). */
  monuments: [
    { projects: 1, name: "Stèle" },
    { projects: 10, name: "Obélisque" },
    { projects: 25, name: "Statue" },
    { projects: 50, name: "Arche" },
    { projects: 100, name: "Colonne orbitale" },
    { projects: 250, name: "Flèche stellaire" },
    { projects: 500, name: "Anneau monumental" },
    { projects: 1000, name: "Merveille du secteur" },
  ] as PrestigeMonument[],
};

export interface PrestigeProject {
  startedAtMs: number;
  endsAtMs: number;
  /** Ressources payées (rendues à personne : un projet ne s'annule pas). */
  paid: Partial<Record<ResourceId, number>>;
}

export interface PrestigeState {
  /** Projets achevés (cumul). */
  projects: number;
  /** Points de prestige (cumul ; points du réglage au moment de l'achèvement). */
  points: number;
  /** Projet en cours (un seul, I32). */
  active: PrestigeProject | null;
  lastDoneAtMs: number;
}

const num = (v: unknown, fallback: number, min = 0) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= min ? n : fallback;
};

/** État normalisé (fiche ancienne ou vide : aucun projet). */
export function prestigeState(p: Pick<PlayerState, "prestige"> | null | undefined): PrestigeState {
  const raw = (p?.prestige ?? {}) as Partial<PrestigeState>;
  const a = raw.active;
  const active = a && typeof a === "object" && Number(a.endsAtMs) > 0 ? { startedAtMs: Number(a.startedAtMs) || 0, endsAtMs: Number(a.endsAtMs), paid: a.paid && typeof a.paid === "object" ? a.paid : {} } : null;
  return { projects: Math.max(0, Math.floor(Number(raw.projects) || 0)), points: Math.max(0, Math.floor(Number(raw.points) || 0)), active, lastDoneAtMs: Number(raw.lastDoneAtMs) || 0 };
}

/** Niveau requis des extracteurs (réglage). */
export function prestigeUnlockLevel(): number {
  return Math.max(0, Math.floor(num(PRESTIGE_RULES.unlockExtractorLevel, 10)));
}

/** Les 4 extracteurs ont-ils le niveau requis ? (vrai même si le système est coupé : la page reste ouverte) */
export function prestigeUnlocked(p: Pick<PlayerState, "buildings"> | null | undefined): boolean {
  if (!p?.buildings) return false;
  const need = prestigeUnlockLevel();
  return PRESTIGE_EXTRACTORS.every((id) => effectiveBuildingLevel(p.buildings, id) >= need);
}

/** Heures de production que coûte le prochain projet. */
export function prestigeHours(p: Pick<PlayerState, "prestige"> | null | undefined): number {
  const hours = num(PRESTIGE_RULES.hoursPerProject, 8);
  const growth = num(PRESTIGE_RULES.growth, 1, 0.01);
  return hours * Math.pow(growth, prestigeState(p).projects);
}

/** Coût du prochain projet : `prestigeHours` heures de la production commune du moment (extracteurs et technos). */
export function prestigeCost(p: Pick<PlayerState, "buildings" | "techLevels" | "prestige">): Partial<Record<ResourceId, number>> {
  const rates = getProductionRatesPerSecond(p.buildings, p.techLevels ?? {});
  const seconds = prestigeHours(p) * 3600;
  const out: Partial<Record<ResourceId, number>> = {};
  for (const res of COMMONS) {
    const n = Math.floor((rates[res] ?? 0) * seconds);
    if (n > 0) out[res] = n;
  }
  return out;
}

/** Durée d'un projet (ms). */
export function prestigeDurationMs(): number {
  return Math.round(num(PRESTIGE_RULES.durationHours, 8) * 3_600_000);
}

/** Pourquoi un projet ne peut pas démarrer (null : il peut, ressources à part). */
export function prestigeBlocker(p: Pick<PlayerState, "buildings" | "prestige">): string | null {
  if (!PRESTIGE_RULES.enabled) return "Les projets de prestige sont fermés pour le moment.";
  if (!prestigeUnlocked(p)) return `Les projets de prestige s'ouvrent quand tes 4 extracteurs atteignent le niveau ${prestigeUnlockLevel()}.`;
  if (prestigeState(p).active) return "Un projet de prestige est déjà en cours : un seul à la fois.";
  return null;
}

/** Vérifie qu'un projet peut démarrer et rend son coût (l'appelant paie, `actions.ts`). */
export function prestigeStartCost(p: PlayerState): Partial<Record<ResourceId, number>> {
  const blocker = prestigeBlocker(p);
  if (blocker) throw new GameActionError(blocker);
  const cost = prestigeCost(p);
  if (Object.keys(cost).length === 0) throw new GameActionError("Tes extracteurs ne produisent rien : pas de projet possible.");
  return cost;
}

/** Démarre le projet (coût déjà payé). */
export function beginPrestige(p: PlayerState, paid: Partial<Record<ResourceId, number>>, now: number): PrestigeState {
  const st = prestigeState(p);
  const next: PrestigeState = { ...st, active: { startedAtMs: now, endsAtMs: now + prestigeDurationMs(), paid: { ...paid } } };
  p.prestige = next;
  return next;
}

/** Fin d'un projet arrivé à terme (rattrapage, `flushState`) : compteur, points, notification (Journal). */
export function advancePrestige(p: PlayerState, now: number): NewNotification[] {
  const st = prestigeState(p);
  if (!st.active || st.active.endsAtMs > now) return [];
  const gained = Math.max(0, Math.floor(num(PRESTIGE_RULES.pointsPerProject, 8)));
  const projects = st.projects + 1;
  const points = st.points + gained;
  p.prestige = { projects, points, active: null, lastDoneAtMs: st.active.endsAtMs };
  const monument = prestigeMonument(projects);
  const raised = monument && monument.projects === projects ? ` Ton monument s'élève : ${monument.name}.` : "";
  return [
    {
      kind: "building",
      title: "Projet de prestige achevé",
      message: `Projet n° ${formatInt(projects)} achevé : +${formatInt(gained)} points de prestige (${formatInt(points)} au total).${raised}`,
      createdAtMs: now,
      read: false,
      link: "/game/prestige",
    },
  ];
}

/** Monuments valides, du plus petit au plus grand. */
export function prestigeMonuments(): PrestigeMonument[] {
  const list = Array.isArray(PRESTIGE_RULES.monuments) ? PRESTIGE_RULES.monuments : [];
  return list
    .filter((m) => m && Number(m.projects) > 0 && String(m.name ?? "").trim())
    .map((m) => ({ projects: Math.floor(Number(m.projects)), name: String(m.name).trim() }))
    .sort((a, b) => a.projects - b.projects);
}

/** Monument atteint avec ce nombre de projets (null : aucun). */
export function prestigeMonument(projects: number): PrestigeMonument | null {
  let best: PrestigeMonument | null = null;
  for (const m of prestigeMonuments()) if (projects >= m.projects) best = m;
  return best;
}

/** Monument suivant (null : le dernier est atteint). */
export function nextPrestigeMonument(projects: number): PrestigeMonument | null {
  return prestigeMonuments().find((m) => m.projects > projects) ?? null;
}
