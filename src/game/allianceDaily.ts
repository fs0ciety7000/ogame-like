import { computeFullPower } from "@/game/combat";
import { GameActionError } from "@/game/errors";
import { productionHours } from "@/game/pirates";
import { lastActivity } from "@/game/retention";
import { OFFENSIVE_UNITS } from "@/game/units";
import { parisDay } from "@/game/retention";
import { parisHour } from "@/game/stats";
import type { PlayerStats } from "@/game/stats";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   v4.9 : objectifs du jour d'alliance. À 6 h (Paris), 3 objectifs sont
   proposés ; les officiers votent jusqu'à 10 h, l'objectif en tête
   devient celui du jour. Atteint avant minuit : chaque membre qui y a
   contribué gagne +15 points de passe et 1 h de production, le trésor
   10 % de la production de 4 h de l'alliance.
===================================================== */

export const ALLIANCE_DAILY_RULES = {
  proposeHour: 6,
  voteEndHour: 10,
  /** Membre actif : connecté dans les 3 derniers jours. */
  activeDays: 3,
  treasuryHours: 4,
  missionsPerMember: 4,
  researchPerMember: 2,
  powerPct: 0.02,
  passPoints: 15,
  rewardHours: 1,
  treasuryPct: 0.1,
};

export type DailyKind = "treasury" | "missions" | "power" | "research";
export const DAILY_KINDS: DailyKind[] = ["treasury", "missions", "power", "research"];

/** Compteur suivi pour chaque objectif. */
export const DAILY_STAT: Record<DailyKind, keyof PlayerStats> = { treasury: "donated", missions: "missions", power: "powerDestroyed", research: "researchStarted" };

export const DAILY_LABEL: Record<DailyKind, string> = {
  treasury: "Ressources versées au trésor",
  missions: "Missions terminées",
  power: "Puissance ennemie détruite",
  research: "Recherches lancées",
};

export interface DailyProposal {
  kind: DailyKind;
  target: number;
}

export interface AllianceDaily {
  day: string;
  proposals: DailyProposal[];
  /** Vote de chaque officier : index de la proposition. */
  votes: Record<string, number>;
  status: "voting" | "active" | "done" | "failed";
  chosen: number | null;
  /** Compteurs des membres au début de l'objectif. */
  baseline: Record<string, number>;
  progress: number;
  /** Contribution de chaque membre (au dernier calcul). */
  contributions: Record<string, number>;
  /** Production de 4 h de l'alliance (bonus du trésor : 10 %). */
  resourceBase: Partial<Record<ResourceId, number>>;
  updatedAtMs: number;
  doneAtMs?: number;
  /** Résultat de la veille (affichage). */
  previous?: { day: string; kind: DailyKind | null; status: "done" | "failed" };
}

export interface DailyMember {
  uid: string;
  active: boolean;
  stats: PlayerStats;
  /** Production de 4 h du membre. */
  production4h: Partial<Record<ResourceId, number>>;
  fleetPower: number;
}

export function dailyPhase(now: number): "before" | "voting" | "active" {
  const h = parisHour(now);
  if (h < ALLIANCE_DAILY_RULES.proposeHour) return "before";
  return h < ALLIANCE_DAILY_RULES.voteEndHour ? "voting" : "active";
}

function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** 3 objectifs parmi 4, tirés de façon stable pour l'alliance et le jour. */
export function proposeDaily(allianceId: string, day: string, members: DailyMember[], now: number): AllianceDaily {
  const R = ALLIANCE_DAILY_RULES;
  const active = Math.max(1, members.filter((m) => m.active).length);
  const resourceBase: Partial<Record<ResourceId, number>> = {};
  for (const m of members.filter((x) => x.active)) {
    for (const [res, n] of Object.entries(m.production4h) as [ResourceId, number][]) resourceBase[res] = (resourceBase[res] ?? 0) + Math.round(n ?? 0);
  }
  const treasuryTarget = Math.max(1000, Object.values(resourceBase).reduce((a, b) => a + (b ?? 0), 0));
  const fleet = members.reduce((a, m) => a + m.fleetPower, 0);
  const targets: Record<DailyKind, number> = {
    treasury: treasuryTarget,
    missions: R.missionsPerMember * active,
    power: Math.max(500, Math.round(fleet * R.powerPct)),
    research: R.researchPerMember * active,
  };
  const skip = hash(`${allianceId}:${day}`) % DAILY_KINDS.length;
  const proposals = DAILY_KINDS.filter((_, i) => i !== skip).map((kind) => ({ kind, target: targets[kind] }));
  return { day, proposals, votes: {}, status: "voting", chosen: null, baseline: {}, progress: 0, contributions: {}, resourceBase, updatedAtMs: now };
}

export function voteDaily(daily: AllianceDaily, uid: string, role: string | null, index: unknown, now: number): void {
  if (role !== "founder" && role !== "officer") throw new GameActionError("Seuls le fondateur et les officiers votent l'objectif du jour.");
  if (daily.status !== "voting" || dailyPhase(now) !== "voting" || daily.day !== parisDay(now)) throw new GameActionError(`Le vote est ouvert de ${ALLIANCE_DAILY_RULES.proposeHour} h à ${ALLIANCE_DAILY_RULES.voteEndHour} h.`);
  const i = Math.floor(Number(index));
  if (!(i >= 0 && i < daily.proposals.length)) throw new GameActionError("Objectif inconnu.");
  daily.votes = { ...daily.votes, [uid]: i };
}

/** Proposition gagnante : la plus votée (à égalité, la première ; sans vote, la première). */
export function winningProposal(daily: Pick<AllianceDaily, "votes" | "proposals">): number {
  const counts = daily.proposals.map((_, i) => Object.values(daily.votes).filter((v) => v === i).length);
  let best = 0;
  counts.forEach((c, i) => {
    if (c > counts[best]) best = i;
  });
  return best;
}

function statOf(stats: PlayerStats | undefined, kind: DailyKind): number {
  return Number(stats?.[DAILY_STAT[kind]] ?? 0) || 0;
}

/** Fin du vote : l'objectif est retenu et les compteurs des membres photographiés. */
export function startDaily(daily: AllianceDaily, members: DailyMember[], now: number): void {
  const chosen = winningProposal(daily);
  const kind = daily.proposals[chosen].kind;
  daily.chosen = chosen;
  daily.status = "active";
  daily.baseline = Object.fromEntries(members.map((m) => [m.uid, statOf(m.stats, kind)]));
  daily.progress = 0;
  daily.contributions = {};
  daily.updatedAtMs = now;
}

/** Recalcule la progression. Renvoie true si l'objectif vient d'être atteint. */
export function updateDailyProgress(daily: AllianceDaily, members: DailyMember[], now: number): boolean {
  if (daily.status !== "active" || daily.chosen === null) return false;
  const { kind, target } = daily.proposals[daily.chosen];
  const contributions: Record<string, number> = {};
  for (const m of members) {
    // Un membre arrivé en cours de journée part de son compteur actuel.
    if (daily.baseline[m.uid] === undefined) daily.baseline[m.uid] = statOf(m.stats, kind);
    const delta = statOf(m.stats, kind) - daily.baseline[m.uid];
    if (delta > 0) contributions[m.uid] = Math.round(delta);
  }
  daily.contributions = contributions;
  daily.progress = Object.values(contributions).reduce((a, b) => a + b, 0);
  daily.updatedAtMs = now;
  if (daily.progress >= target) {
    daily.status = "done";
    daily.doneAtMs = now;
    return true;
  }
  return false;
}

/** Bonus du trésor quand l'objectif est atteint. */
export function dailyTreasuryBonus(daily: Pick<AllianceDaily, "resourceBase">): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {};
  for (const [res, n] of Object.entries(daily.resourceBase) as [ResourceId, number][]) {
    const v = Math.floor((n ?? 0) * ALLIANCE_DAILY_RULES.treasuryPct);
    if (v > 0) out[res] = v;
  }
  return out;
}

export function readDaily(raw: unknown): AllianceDaily | null {
  const d = raw as AllianceDaily | null;
  return d && typeof d === "object" && typeof d.day === "string" && Array.isArray(d.proposals) ? d : null;
}

/** Résumé de la journée écoulée, gardé dans l'objectif suivant. */
export function previousSummary(daily: AllianceDaily | null): AllianceDaily["previous"] {
  if (!daily) return undefined;
  return { day: daily.day, kind: daily.chosen !== null ? daily.proposals[daily.chosen].kind : null, status: daily.status === "done" ? "done" : "failed" };
}

/** Données d'un membre pour les objectifs du jour. */
export function dailyMemberOf(p: PlayerState, now: number): DailyMember {
  return {
    uid: p.uid,
    active: now - lastActivity(p) < ALLIANCE_DAILY_RULES.activeDays * 86400_000,
    stats: p.stats ?? {},
    production4h: productionHours(p, ALLIANCE_DAILY_RULES.treasuryHours),
    fleetPower: computeFullPower(p.units ?? {}, p.techLevels ?? {}, OFFENSIVE_UNITS, ["attack"]),
  };
}
