import { getProductionRatesPerSecond } from "@/game/production";
import { GameActionError } from "@/game/errors";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   6.14.163 (lot S3, docs/proposals/recompenses-du-depart.md) : récompenses du départ.
   Avant, la prime du raid d'initiation valait 4 h de production de chaque ressource commune (216 000 de chaque à 15/s,
   18e minute de jeu), et le Carnet du commandant versait des montants fixes (300 000, puis 2 000 000) dès la fin de la
   prise en main : la progression de la première heure perdait son sens, et les nanocomposants et données s'entassaient.
   Désormais :
   - la prime du raid d'initiation vaut quelques minutes de production, réparties comme les vrais coûts
     (ferraille d'abord, énergie ensuite, un peu de nanocomposants et de données) ;
   - chaque ressource commune versée par le Carnet vaut au plus `guideCapMinutes` minutes de production du joueur au moment
     où il la réclame (au moins `guideCapFloor`) : le montant fixe reste celui d'un joueur avancé.
   Production de référence : extracteurs et technos (`getProductionRatesPerSecond`), comme la série, les succès et les missions.
   `enabled` décoché : anciennes récompenses (prime en heures de la faction, Carnet aux montants fixes).
===================================================== */

const COMMONS: ResourceId[] = ["scrap", "energy", "nano", "data"];

export const START_REWARD_RULES = {
  enabled: true,
  /** Prime du raid d'initiation : minutes de production de chaque ressource commune (0 : rien de cette ressource). */
  tutorialRaidMinutes: { scrap: 30, energy: 15, nano: 5, data: 5 } as Record<string, number>,
  /** Prime du raid d'initiation : au moins ce montant pour chaque ressource dont les minutes sont > 0. */
  tutorialRaidFloor: 1_000,
  /** Carnet du commandant : chaque ressource commune versée vaut au plus N minutes de production (0 : montants fixes). */
  guideCapMinutes: 60,
  /** Carnet du commandant : le plafond ne descend jamais sous ce montant (petits empires). */
  guideCapFloor: 5_000,
  /** 6.14.165 (S6, NJ-25) : âge du compte (heures depuis l'inscription) en deçà duquel une récompense exprimée en heures de
   *  production (passe, Chroniques, succès, série, défi, expéditions, boss…) est plafonnée à `youngCapMinutes` (0 : jamais). */
  youngAccountHours: 24,
  /** 6.14.165 : plafond, en minutes de production du moment, d'une récompense en heures reçue par un compte jeune. Le reste
   *  va à la réserve du départ (`startReserve`), versée par « Tout réclamer » quand le compte a `youngAccountHours`. */
  youngCapMinutes: 60,
};

export const START_REWARD_RULES_META = {
  enabled: { label: "Récompenses du départ indexées sur la production", hint: "Décoché : prime du raid d'initiation en heures de la faction (4 h) et Carnet aux montants fixes (avant la 6.14.163)." },
  tutorialRaidMinutes: {
    label: "Raid d'initiation : minutes de production par ressource",
    hint: "Prime du premier raid de Varan repoussé (scrap, energy, nano, data). La répartition suit les coûts : la ferraille paie presque tout.",
  },
  tutorialRaidFloor: { label: "Raid d'initiation : au moins, par ressource", min: 0, max: 1_000_000 },
  guideCapMinutes: { label: "Carnet : plafond en minutes de production", unit: "min", min: 0, max: 1_440, hint: "Chaque ressource commune d'un objectif du Carnet vaut au plus N minutes de ta production. 0 : montants fixes." },
  guideCapFloor: { label: "Carnet : plafond, au moins", min: 0, max: 100_000_000 },
  youngAccountHours: {
    label: "Compte jeune : durée (heures depuis l'inscription)",
    unit: "h",
    min: 0,
    max: 72,
    hint: "Pendant cette durée, une récompense en heures de production (passe, Chroniques, succès, série, défi, expéditions, boss) est plafonnée. 0 : jamais. Au plus 72 h : le coffre du 7e jour reste hors d'atteinte.",
  },
  youngCapMinutes: {
    label: "Compte jeune : plafond en minutes de production",
    unit: "min",
    min: 0,
    max: 1_440,
    hint: "Une récompense en heures vaut au plus N minutes de production au versement ; le reste va à la réserve du départ, versée par « Tout réclamer » à la fin de la durée. 0 : pas de plafond.",
  },
};

type RewardPlayer = Pick<PlayerState, "buildings" | "techLevels">;
type Amounts = Partial<Record<ResourceId, number>>;

/** Production par seconde des ressources communes (extracteurs et technos). */
function commonRates(player: RewardPlayer): Partial<Record<ResourceId, number>> {
  return getProductionRatesPerSecond(player.buildings ?? {}, player.techLevels ?? {}) as Partial<Record<ResourceId, number>>;
}

/** Prime du raid d'initiation repoussé : `tutorialRaidMinutes` de production par ressource, au moins `tutorialRaidFloor`. */
export function tutorialRaidBounty(player: RewardPlayer): Partial<Record<ResourceId, number>> {
  const rates = commonRates(player);
  const R = START_REWARD_RULES;
  const out: Partial<Record<ResourceId, number>> = {};
  for (const res of COMMONS) {
    const minutes = Math.max(0, Number(R.tutorialRaidMinutes?.[res]) || 0);
    if (!(minutes > 0)) continue;
    const n = Math.max(Math.max(0, Number(R.tutorialRaidFloor) || 0), Math.floor((rates[res] ?? 0) * minutes * 60));
    if (n > 0) out[res] = n;
  }
  return out;
}

/** Plafond d'une ressource commune du Carnet pour ce joueur (Infinity : sans plafond). */
function guideCap(player: RewardPlayer, res: ResourceId): number {
  const R = START_REWARD_RULES;
  const minutes = Math.max(0, Number(R.guideCapMinutes) || 0);
  if (!R.enabled || !(minutes > 0) || !COMMONS.includes(res)) return Infinity;
  return Math.max(Math.max(0, Number(R.guideCapFloor) || 0), Math.floor((commonRates(player)[res] ?? 0) * minutes * 60));
}

/** Récompense réellement versée par un objectif du Carnet : montant réglé, plafonné en minutes de production (communes seules). */
export function cappedGuideReward(reward: Partial<Record<ResourceId, number>>, player: RewardPlayer): Partial<Record<ResourceId, number>> {
  const out: Partial<Record<ResourceId, number>> = {};
  for (const [res, n] of Object.entries(reward) as [ResourceId, number][]) {
    const v = Math.min(Math.max(0, Number(n) || 0), guideCap(player, res));
    if (v > 0) out[res] = v;
  }
  return out;
}

/* =====================================================
   6.14.165 (lot S6, NJ-25) : plafond « compte jeune » de toute récompense exprimée en heures de production.
   Le palier 1 du passe (« 2 h de production ») se payait à la 24e minute : 921 600 de ressources pour ≈ 58/s, le même
   saut que la prime du raid d'initiation retirée en 6.14.163. Désormais, tant que le compte a moins de `youngAccountHours`
   heures, une récompense en heures vaut au plus `youngCapMinutes` minutes de production au versement ; la différence
   (montants exacts, calculés au versement) va à la réserve du départ (`player.startReserve`), que « Tout réclamer » verse
   dès que le compte a l'âge requis. Rien n'est perdu ; la réserve arrive quand la production du joueur l'a rattrapée.
   Sources plafonnées (inventaire : proposals/recompenses-du-depart.md §9) : passe et Chroniques (`grantPassReward`),
   succès (`achievementReward`), série (`streakReward`), défi hebdomadaire, coalition, boss d'alliance, Léviathan,
   repaires, primes des factions, expéditions. Garde : `recompensesDepart.test.ts` (I50).
===================================================== */

function formatHours(h: number): string {
  return `${String(Math.max(0, Number(h) || 0)).replace(".", ",")} h`;
}

/** Le compte a-t-il moins de `youngAccountHours` heures ? Sans date d'inscription (anciens comptes, PNJ) : non. */
export function isYoungAccount(player: Pick<PlayerState, "createdAtMs">, now: number): boolean {
  const R = START_REWARD_RULES;
  const hours = Math.max(0, Number(R.youngAccountHours) || 0);
  const created = Number(player.createdAtMs) || 0;
  return !!R.enabled && hours > 0 && Number(R.youngCapMinutes) > 0 && created > 0 && now - created < hours * 3_600_000;
}

/** Heures versées tout de suite pour une récompense de `hours` heures (plafonnées pour un compte jeune). */
export function youngRewardHours(player: Pick<PlayerState, "createdAtMs">, hours: number, now: number): number {
  const h = Math.max(0, Number(hours) || 0);
  return isYoungAccount(player, now) ? Math.min(h, Math.max(0, Number(START_REWARD_RULES.youngCapMinutes) || 0) / 60) : h;
}

/** Heures de production des ressources communes (même calcul que `productionHours` des factions). */
function hoursOf(player: RewardPlayer, h: number): Amounts {
  const rates = commonRates(player);
  const out: Amounts = {};
  for (const res of COMMONS) {
    const n = Math.floor((rates[res] ?? 0) * h * 3600);
    if (n > 0) out[res] = n;
  }
  return out;
}

/** Récompense de `hours` heures de production : versée tout de suite (`paid`) et mise en réserve (`deferred`). Lecture seule. */
export function splitProductionReward(player: RewardPlayer & Pick<PlayerState, "createdAtMs">, hours: number, now: number): { paid: Amounts; deferred: Amounts } {
  const full = hoursOf(player, Math.max(0, Number(hours) || 0));
  const capped = youngRewardHours(player, hours, now);
  if (capped >= hours) return { paid: full, deferred: {} };
  const paid = hoursOf(player, capped);
  const deferred: Amounts = {};
  for (const res of COMMONS) {
    const d = (full[res] ?? 0) - (paid[res] ?? 0);
    if (d > 0) deferred[res] = d;
  }
  return { paid, deferred };
}

/** Ajoute des montants à la réserve du départ. */
export function addStartReserve(player: Pick<PlayerState, "startReserve">, amounts: Amounts): void {
  const entries = (Object.entries(amounts) as [ResourceId, number][]).filter(([, n]) => (Number(n) || 0) > 0);
  if (!entries.length) return;
  const reserve: Amounts = { ...(player.startReserve ?? {}) };
  for (const [res, n] of entries) reserve[res] = Math.floor((reserve[res] ?? 0) + n);
  player.startReserve = reserve;
}

/** Récompense en heures de production : renvoie ce qui est versé maintenant (à créditer par l'appelant) et met le reste en
 *  réserve (compte jeune). */
export function productionReward(player: PlayerState, hours: number, now: number): Amounts {
  const { paid, deferred } = splitProductionReward(player, hours, now);
  addStartReserve(player, deferred);
  return paid;
}

/** Total de la réserve du départ. */
export function startReserveTotal(player: Pick<PlayerState, "startReserve">): number {
  return Object.values(player.startReserve ?? {}).reduce((a: number, n) => a + Math.max(0, Number(n) || 0), 0);
}

/** La réserve est-elle à réclamer (non vide, compte plus jeune) ? */
export function startReserveReady(player: Pick<PlayerState, "startReserve" | "createdAtMs">, now: number): boolean {
  return startReserveTotal(player) > 0 && !isYoungAccount(player, now);
}

/** Heure à laquelle la réserve devient réclamable (null : déjà, ou rien en réserve). */
export function startReserveAtMs(player: Pick<PlayerState, "startReserve" | "createdAtMs">, now: number): number | null {
  if (!(startReserveTotal(player) > 0) || !isYoungAccount(player, now)) return null;
  return (Number(player.createdAtMs) || 0) + Math.max(0, Number(START_REWARD_RULES.youngAccountHours) || 0) * 3_600_000;
}

/** Verse la réserve du départ (compte qui n'est plus jeune) et la vide. */
export function claimStartReserve(player: PlayerState, now: number): Amounts {
  if (!(startReserveTotal(player) > 0)) throw new GameActionError("Rien en réserve.");
  if (isYoungAccount(player, now)) throw new GameActionError(`La réserve du départ se verse quand ton compte a ${formatHours(START_REWARD_RULES.youngAccountHours)}.`);
  const out: Amounts = {};
  for (const [res, n] of Object.entries(player.startReserve ?? {}) as [ResourceId, number][]) {
    const v = Math.max(0, Math.floor(Number(n) || 0));
    if (v <= 0) continue;
    out[res] = v;
    player.resources[res] = (player.resources[res] ?? 0) + v;
  }
  player.startReserve = null;
  return out;
}
