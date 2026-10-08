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
  /** 6.14.112 (AU27, AC-11, Q79 = Q-AC4 option A) : gestes permis pendant les vacances, liste unique pour l'action et les
   *  routes. Le serveur interroge la garde (`vacationBlock`) pour chaque geste qui rapporte ou dépense ; tout ce qui n'est pas
   *  ici est refusé. Lecture (phalange sans balayage, Codex, fiches) toujours permise. Clés : type d'action, nom de route,
   *  `route:geste` (ex. `alliance:deposit`, `bounty:shop`). */
  allowed: ["sync", "seenAnnouncements", "setTitle", "hideOnboarding", "setProfileStyle", "colonyRename", "vacationEnd", "hideGuide"] as string[],
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const VACATION_RULES_META = {
  minDays: { label: "Durée minimale", unit: "j", min: 1, max: 30 },
  maxDays: { label: "Durée maximale", unit: "j", min: 1, max: 90 },
  cooldownDays: { label: "Attente entre deux périodes", unit: "j", min: 0, max: 60 },
  productionFactor: { label: "Production pendant l'absence", unit: "part", min: 0, max: 1, hint: "0,25 = 25 % de la production normale." },
  recentAttackHours: { label: "Pas d'activation après une attaque subie", unit: "h", min: 0, max: 168 },
  minStayHours: { label: "Retour anticipé possible après", unit: "h", min: 0, max: 336 },
  allowed: { label: "Gestes permis pendant les vacances (liste blanche unique)", hint: "Types d'action et routes (ex. « sync », « vacationEnd », « casino:daily »). Tout geste qui rapporte ou dépense et n'est pas ici est refusé (Q79)." },
};

const DAY = 86_400_000;
const HOUR = 3_600_000;

export function onVacation(p: Pick<PlayerState, "vacation">, now: number): boolean {
  const v = p.vacation;
  return !!v && !v.endedAtMs && v.startedAtMs <= now && now < v.untilMs;
}

/** 6.14.112 (AC-11) : ce que le joueur voulait faire, pour un refus clair. Clé absente : « jouer ». */
const VACATION_VERBS: Record<string, string> = {
  gift: "envoyer des ressources",
  "fleet/send": "lancer une flotte",
  "fleet/jump": "utiliser la porte de saut",
  "moon/scan": "balayer un agresseur",
  market: "échanger",
  auction: "enchérir ou vendre",
  "trade-contract": "commercer",
  bounty: "chasser ou acheter au Comptoir",
  casino: "jouer au casino",
  casinoDaily: "récupérer le jeton du jour du casino",
  challengeClaim: "récupérer la récompense du défi",
  codexClaim: "récupérer une récompense du Codex",
  codexTitle: "recevoir le titre du Codex",
  claimAll: "réclamer tes récompenses",
  pirates: "traiter avec les factions",
  alliance: "dépenser pour ton alliance",
  warlords: "défier un seigneur",
  rename: "changer de pseudo",
};

/** Garde unique des vacances (action et routes) : `null` si le geste `key` est permis, sinon le message du refus. */
export function vacationBlock(p: Pick<PlayerState, "vacation">, now: number, key: string): string | null {
  if (!onVacation(p, now)) return null;
  const allowed = Array.isArray(VACATION_RULES.allowed) ? VACATION_RULES.allowed : [];
  if (allowed.includes(key)) return null;
  const verb = VACATION_VERBS[key] ?? VACATION_VERBS[key.split(":")[0]] ?? "jouer";
  return `Tu es en vacances : reviens d'abord (Paramètres) pour ${verb}.`;
}

/** Lève le refus de `vacationBlock` (moteur). */
export function assertNotOnVacation(p: Pick<PlayerState, "vacation">, now: number, key: string): void {
  const block = vacationBlock(p, now, key);
  if (block) throw new GameActionError(block);
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
    if (e) {
      e.endTime += shift;
      if (e.startedAtMs) e.startedAtMs += shift;
    }
  }
  (["attack", "defense"] as const).forEach((c) => queues.unitQueues[c].forEach((e) => (e.endTime = later(e.endTime))));
  queues.activeResearches.forEach((e) => {
    e.endTime += shift;
    if (e.startedAtMs) e.startedAtMs += shift;
  });
  queues.activeMissions.forEach((e) => (e.endTime += shift));
  // Colonies : travaux décalés, production réduite au quart pendant l'absence.
  for (const c of player.colonies ?? []) {
    if (c.building) {
      c.building.endTime += shift;
      if (c.building.startedAtMs) c.building.startedAtMs += shift;
    }
    if (c.defenseJob) {
      c.defenseJob.endTime += shift;
      if (c.defenseJob.startedAtMs) c.defenseJob.startedAtMs += shift;
    }
    c.updatedAtMs = Math.min(end, c.updatedAtMs + shift * (1 - VACATION_RULES.productionFactor));
  }
  if (player.colonizing) player.colonizing.endTime += shift;
  if (player.synthesis?.crafting) player.synthesis.crafting.endsAtMs += shift;
  player.vacation = { ...v, endedAtMs: end };
}
