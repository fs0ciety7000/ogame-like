import { GameActionError } from "@/game/errors";
import type { PlayerState, QueuesState } from "@/types/game";

/* =====================================================
   Mode vacances (v4.2) : un joueur qui s'absente le déclare. Pendant ce
   temps, personne ne peut l'attaquer (joueurs, seigneurs, factions), sa
   production tourne à 25 % et ses files de construction, de recherche et
   de missions sont gelées puis décalées à son retour.
===================================================== */

export interface VacationState {
  startedAtMs: number;
  untilMs: number;
  /** Retour (anticipé ou à l'échéance). */
  endedAtMs?: number;
}

export const VACATION_RULES = {
  minDays: 2,
  maxDays: 21,
  /** Attente entre deux périodes. */
  cooldownDays: 5,
  /** Production pendant l'absence. */
  productionFactor: 0.25,
  /** Pas d'activation dans les 12 h qui suivent une attaque subie. */
  recentAttackHours: 12,
  /** Retour anticipé possible après 48 h seulement. */
  minStayHours: 48,
};

const DAY = 86_400_000;
const HOUR = 3_600_000;

export function onVacation(p: Pick<PlayerState, "vacation">, now: number): boolean {
  const v = p.vacation;
  return !!v && !v.endedAtMs && v.startedAtMs <= now && now < v.untilMs;
}

export interface VacationContext {
  /** Flottes du joueur encore en vol (ou stationnées ailleurs). */
  fleetsAway: number;
  /** Flottes hostiles en approche. */
  hostileIncoming: number;
  /** Dernière attaque subie (rapport de combat), en ms. */
  lastAttackedAtMs: number;
  /** Ultimatum de faction en cours. */
  ultimatum: boolean;
}

/** Début des vacances (le serveur fournit le contexte). */
export function startVacation(player: PlayerState, daysIn: unknown, ctx: VacationContext, now: number): VacationState {
  const days = Math.floor(Number(daysIn));
  if (!(days >= VACATION_RULES.minDays && days <= VACATION_RULES.maxDays)) {
    throw new GameActionError(`Choisis une durée entre ${VACATION_RULES.minDays} et ${VACATION_RULES.maxDays} jours.`);
  }
  if (onVacation(player, now)) throw new GameActionError("Tu es déjà en vacances.");
  const lastEnd = player.vacation?.endedAtMs ?? player.vacation?.untilMs ?? 0;
  if (lastEnd > 0 && now < lastEnd + VACATION_RULES.cooldownDays * DAY) {
    const left = Math.ceil((lastEnd + VACATION_RULES.cooldownDays * DAY - now) / HOUR);
    throw new GameActionError(`Tes dernières vacances sont trop récentes : encore ${left} h d'attente.`);
  }
  if (ctx.fleetsAway > 0) throw new GameActionError("Rappelle d'abord tes flottes : elles doivent toutes être à quai.");
  if (ctx.hostileIncoming > 0) throw new GameActionError("Une flotte hostile approche : impossible de partir maintenant.");
  if (ctx.ultimatum) throw new GameActionError("Réponds d'abord à l'ultimatum en cours.");
  if (ctx.lastAttackedAtMs > 0 && now - ctx.lastAttackedAtMs < VACATION_RULES.recentAttackHours * HOUR) {
    throw new GameActionError(`Tu as été attaqué il y a moins de ${VACATION_RULES.recentAttackHours} h : les vacances ne servent pas de bouclier d'urgence.`);
  }
  const v: VacationState = { startedAtMs: now, untilMs: now + days * DAY };
  player.vacation = v;
  return v;
}

/** Fin des vacances : files et colonies décalées de la durée de l'absence. */
export function endVacation(player: PlayerState, queues: QueuesState, at: number, early = false): void {
  const v = player.vacation;
  if (!v || v.endedAtMs) return;
  if (early && at - v.startedAtMs < VACATION_RULES.minStayHours * HOUR) {
    const left = Math.ceil((v.startedAtMs + VACATION_RULES.minStayHours * HOUR - at) / HOUR);
    throw new GameActionError(`Retour possible après ${VACATION_RULES.minStayHours} h de vacances : encore ${left} h.`);
  }
  const end = Math.min(at, v.untilMs);
  const shift = Math.max(0, end - v.startedAtMs);
  const later = (t: number | null) => (t === null ? null : t + shift);
  for (const id of Object.keys(queues.buildingUpgrades)) {
    const e = queues.buildingUpgrades[id as keyof typeof queues.buildingUpgrades];
    if (e) e.endTime += shift;
  }
  (["attack", "defense"] as const).forEach((c) => queues.unitQueues[c].forEach((e) => (e.endTime = later(e.endTime))));
  queues.activeResearches.forEach((e) => (e.endTime += shift));
  queues.activeMissions.forEach((e) => (e.endTime += shift));
  // Colonies : travaux décalés, production réduite au quart pendant l'absence.
  for (const c of player.colonies ?? []) {
    if (c.building) c.building.endTime += shift;
    if (c.defenseJob) c.defenseJob.endTime += shift;
    c.updatedAtMs = Math.min(end, c.updatedAtMs + shift * (1 - VACATION_RULES.productionFactor));
  }
  if (player.colonizing) player.colonizing.endTime += shift;
  if (player.synthesis?.crafting) player.synthesis.crafting.endsAtMs += shift;
  player.vacation = { ...v, endedAtMs: end };
}

export function vacationLabel(v: VacationState | null | undefined, now: number): string | null {
  if (!v || v.endedAtMs || now >= v.untilMs || now < v.startedAtMs) return null;
  const days = Math.ceil((v.untilMs - now) / DAY);
  return `En vacances (encore ${days} j)`;
}
