import { productionHours } from "@/game/pirates";
import { addPassPoints } from "@/game/seasonPass";
import { addRelic, relicLabel, rollRelic } from "@/game/relics";
import type { WarlordDef, WarlordsState } from "@/game/warlords";
import type { StoryLine } from "@/game/story";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   v4.7 : coalition contre un seigneur. Quand un seigneur dépasse 1,5 fois
   la puissance du meilleur joueur pendant 48 h, tout le secteur a 5 jours
   pour lui détruire 1,5 fois sa puissance de flotte. Une coalition à la
   fois, 14 jours d'attente entre deux. Mini-arc en trois scènes.
===================================================== */

export const COALITION_RULES = {
  thresholdFactor: 1.5,
  holdHours: 48,
  durationDays: 5,
  goalFactor: 1.5,
  cooldownDays: 14,
  /** Réussite : puissance perdue, jours d'absence. */
  powerLoss: 0.4,
  awayDays: 10,
  /** Part minimale de l'objectif pour être récompensé. */
  minShare: 0.03,
  rewardHours: 4,
  topRelics: 3,
  /** Échec : le seigneur gagne cette part de puissance. */
  failGrowth: 0.1,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const COALITION_RULES_META = {
  thresholdFactor: { label: "Seuil de menace : × le meilleur joueur", unit: "×", min: 1, max: 10, hint: "Un seigneur plus puissant que ce multiple du meilleur joueur devient une cible de coalition." },
  holdHours: { label: "Durée au-dessus du seuil avant la coalition", unit: "h", min: 0, max: 336 },
  durationDays: { label: "Durée d'une coalition", unit: "j", min: 1, max: 30 },
  goalFactor: { label: "Objectif : × la puissance de flotte du seigneur", unit: "×", min: 0.1, max: 10 },
  cooldownDays: { label: "Délai avant une nouvelle coalition", unit: "j", min: 0, max: 90 },
  powerLoss: { label: "Réussite : puissance perdue par le seigneur", unit: "part", min: 0, max: 1 },
  awayDays: { label: "Réussite : absence du seigneur", unit: "j", min: 0, max: 60 },
  minShare: { label: "Part minimale de l'objectif pour être récompensé", unit: "part", min: 0, max: 1 },
  rewardHours: { label: "Récompense : heures de production", unit: "h", min: 0, max: 72 },
  topRelics: { label: "Relique épique pour les meilleurs contributeurs", min: 0, max: 20, hint: "Nombre de joueurs du haut du classement qui la reçoivent." },
  failGrowth: { label: "Échec : puissance gagnée par le seigneur", unit: "part", min: 0, max: 1 },
};

export interface Coalition {
  id: string;
  warlordId: string;
  startedAtMs: number;
  endsAtMs: number;
  goal: number;
  dealt: number;
  contributions: Record<string, number>;
  pseudos: Record<string, string>;
  status: "active" | "won" | "lost";
  finishedAtMs?: number;
}

export interface CoalitionState {
  coalition: Coalition | null;
  history: Coalition[];
  /** Depuis quand chaque seigneur dépasse le seuil. */
  overSince: Record<string, number>;
  lastEndMs: number;
}

const HOUR = 3600_000;
const DAY = 24 * HOUR;

export function coalitionState(raw: unknown): CoalitionState {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<CoalitionState>;
  return {
    coalition: r.coalition && typeof r.coalition === "object" && r.coalition.id ? r.coalition : null,
    history: Array.isArray(r.history) ? r.history.slice(0, 5) : [],
    overSince: r.overSince && typeof r.overSince === "object" ? { ...r.overSince } : {},
    lastEndMs: Number(r.lastEndMs) || 0,
  };
}

/** La coalition est rangée dans l'état des seigneurs (clé « coalitions »). */
export function readCoalitions(state: WarlordsState): CoalitionState {
  return coalitionState((state as WarlordsState & { coalitions?: unknown }).coalitions);
}

export function writeCoalitions(state: WarlordsState, c: CoalitionState): void {
  (state as WarlordsState & { coalitions?: CoalitionState }).coalitions = c;
}

export function activeCoalition(c: CoalitionState, now: number): Coalition | null {
  return c.coalition && c.coalition.status === "active" && now < c.coalition.endsAtMs ? c.coalition : null;
}

/**
 * Met à jour le suivi des seuils et ouvre une coalition si un seigneur
 * dépasse 1,5 × le meilleur joueur depuis 48 h (et que le délai est passé).
 */
export function checkCoalitionTrigger(
  c: CoalitionState,
  lords: { id: string; power: number; fleetPower: number; present: boolean }[],
  topHumanPower: number,
  now: number,
): Coalition | null {
  for (const l of lords) {
    if (l.present && topHumanPower > 0 && l.power > topHumanPower * COALITION_RULES.thresholdFactor) c.overSince[l.id] = c.overSince[l.id] ?? now;
    else delete c.overSince[l.id];
  }
  if (c.coalition && c.coalition.status === "active") return null;
  if (now - c.lastEndMs < COALITION_RULES.cooldownDays * DAY) return null;
  const ready = lords
    .filter((l) => l.present && c.overSince[l.id] !== undefined && now - c.overSince[l.id] >= COALITION_RULES.holdHours * HOUR)
    .sort((a, b) => b.power - a.power)[0];
  if (!ready) return null;
  const coalition: Coalition = {
    id: `coal-${ready.id}-${now}`,
    warlordId: ready.id,
    startedAtMs: now,
    endsAtMs: now + COALITION_RULES.durationDays * DAY,
    goal: Math.max(1, Math.round(ready.fleetPower * COALITION_RULES.goalFactor)),
    dealt: 0,
    contributions: {},
    pseudos: {},
    status: "active",
  };
  c.coalition = coalition;
  delete c.overSince[ready.id];
  return coalition;
}

/** Dégâts infligés au seigneur visé (pillage, défense victorieuse…). Renvoie la coalition si elle vient d'être gagnée. */
export function recordCoalitionDamage(c: CoalitionState, warlordId: string, uid: string, pseudo: string, dealt: number, now: number): Coalition | null {
  const co = activeCoalition(c, now);
  if (!co || co.warlordId !== warlordId || !(dealt > 0)) return null;
  co.dealt += Math.round(dealt);
  co.contributions[uid] = (co.contributions[uid] ?? 0) + Math.round(dealt);
  co.pseudos[uid] = pseudo;
  if (co.dealt >= co.goal) {
    co.status = "won";
    co.finishedAtMs = now;
    return co;
  }
  return null;
}

/** Coalition arrivée à échéance sans victoire. */
export function settleCoalition(c: CoalitionState, now: number): Coalition | null {
  const co = c.coalition;
  if (!co || co.status !== "active" || now < co.endsAtMs) return null;
  co.status = "lost";
  co.finishedAtMs = now;
  return co;
}

/** Range la coalition terminée dans l'historique et lance le délai de 14 jours. */
export function archiveCoalition(c: CoalitionState, now: number): void {
  if (!c.coalition || c.coalition.status === "active") return;
  c.history = [c.coalition, ...c.history].slice(0, 5);
  c.coalition = null;
  c.lastEndMs = now;
}

export function coalitionRanking(co: Coalition): { uid: string; pseudo: string; damage: number }[] {
  return Object.entries(co.contributions)
    .map(([uid, damage]) => ({ uid, pseudo: co.pseudos[uid] ?? "?", damage }))
    .sort((a, b) => b.damage - a.damage);
}

export function coalitionTitle(d: Pick<WarlordDef, "name">): string {
  return `Briseur de ${d.name.split(",")[0]}`;
}

/** Récompense d'un participant d'une coalition gagnée. */
export function grantCoalitionReward(
  co: Coalition,
  d: Pick<WarlordDef, "name">,
  player: PlayerState,
  now: number,
  random: () => number = Math.random,
): { eligible: boolean; gain: Partial<Record<ResourceId, number>>; relic?: string; title?: string } {
  const mine = co.contributions[player.uid] ?? 0;
  if (co.status !== "won" || mine < co.goal * COALITION_RULES.minShare) return { eligible: false, gain: {} };
  addPassPoints(player, "coalition", now);
  const gain = productionHours(player, COALITION_RULES.rewardHours);
  for (const [res, n] of Object.entries(gain) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + n;
  const rank = coalitionRanking(co).findIndex((r) => r.uid === player.uid);
  let relic: string | undefined;
  if (rank >= 0 && rank < COALITION_RULES.topRelics) {
    const item = rollRelic(`coalition:${co.warlordId}`, now, random, "epic");
    if (addRelic(player, item)) relic = relicLabel(item);
  }
  let title: string | undefined;
  if (rank === 0) {
    title = coalitionTitle(d);
    if (!(player.titles ?? []).some((t) => t.label === title)) player.titles = [...(player.titles ?? []), { label: title, seasonId: "coalition", rank: 1 }];
  }
  return { eligible: true, gain, relic, title };
}

/** Échec : le seigneur se renforce. */
export function empowerWarlord(npc: PlayerState, growth = COALITION_RULES.failGrowth): void {
  for (const [id, st] of Object.entries(npc.units ?? {})) {
    if (st.count > 0) npc.units[id] = { ...st, count: Math.round(st.count * (1 + growth)) };
  }
}

/* ---------- mini-arc : trois scènes ---------- */

export type CoalitionPhase = "open" | "mid" | "won" | "lost";

/** Réplique d'un seigneur (portrait du seigneur) ou de Vashka. */
export type ArcLine = StoryLine & { as?: { name: string; role: string; image: string; color: string } };

export function coalitionPhase(co: Coalition): CoalitionPhase {
  if (co.status === "won") return "won";
  if (co.status === "lost") return "lost";
  return co.dealt >= co.goal * 0.5 ? "mid" : "open";
}

export function coalitionScene(co: Coalition, d: Pick<WarlordDef, "name" | "portrait">, phase: CoalitionPhase): ArcLine[] {
  const lord = { name: d.name, role: "Seigneur de guerre", image: d.portrait, color: "#ff7a45" };
  const say = (text: string): ArcLine => ({ speaker: "varan", text, as: lord });
  const vashka = (text: string): ArcLine => ({ speaker: "vashka", text });
  const short = d.name.split(",")[0];
  switch (phase) {
    case "open":
      return [
        vashka(`${short} est devenu trop gros pour un seul empire, {pseudo}. L'Essaim appelle tout le secteur à la coalition.`),
        say("Une coalition ? Des moucherons qui se tiennent par la main. Venez donc, que je compte les épaves."),
        vashka(`Cinq jours. Chaque vaisseau détruit chez ${short} compte. Pillez-le, repoussez-le, saignez-le.`),
      ];
    case "mid":
      return [
        say("Vous m'avez entamé. C'est tout ce que vous aurez."),
        vashka(`La moitié du chemin, {pseudo}. ${short} recule : ne lui laisse pas le temps de reconstruire.`),
      ];
    case "won":
      return [
        say("Ce secteur… ne vaut pas mes flottes. Je reviendrai quand vous aurez oublié."),
        vashka(`${short} fuit pour dix jours. Le secteur a frappé d'une seule voix. L'Essaim s'en souviendra.`),
      ];
    case "lost":
      return [
        say("Cinq jours, et me voilà plus fort qu'avant. Merci pour l'exercice."),
        vashka(`${short} a tenu. Il sort de cette guerre renforcé : la prochaine fois, il faudra frapper plus tôt.`),
      ];
  }
}
