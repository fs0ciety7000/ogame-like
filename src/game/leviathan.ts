import { allianceSiegeFactor } from "@/game/alliances";
import { playerModifiers, withRepairBonus } from "@/game/modifiers";
import { addRelic, relicLabel, rollRelic } from "@/game/relics";
import { computeFleetPower, computeFullPower, pveAttackFactor } from "@/game/combat";
import { getRepairPercent } from "@/game/buildings";
import { GameActionError } from "@/game/errors";
import { EVENT_RULES, weekendWindow } from "@/game/events";
import { formationEffects } from "@/game/formations";
import { productionHours } from "@/game/pirates";
import { bumpStat } from "@/game/stats";
import { OFFENSIVE_UNITS } from "@/game/units";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Boss mondial « Le Léviathan » (v3.1) : le premier week-end de chaque
   mois, de vendredi 18 h à lundi 18 h (heure de Paris), à la place de
   l'événement de la semaine. Tout le serveur l'attaque : ses points de
   structure valent plusieurs fois la puissance d'attaque cumulée des
   joueurs actifs. Récompenses selon la part des dégâts, réduites de moitié
   s'il survit. État stocké dans game_config (clé « leviathan »).
===================================================== */

export const LEVIATHAN_KEY = "leviathan";

export const LEVIATHAN_RULES = {
  name: "Le Léviathan",
  /** Points de structure : ce facteur × puissance d'attaque des joueurs actifs (7 j). */
  hpFactor: 4,
  minHp: 100_000,
  durationHours: 72,
  /** Un assaut toutes les N heures par joueur. */
  cooldownHours: 4,
  /** Trajet aller (et retour), en minutes. */
  flightMinutes: 30,
  /** Part de chaque type de vaisseau détruite à chaque assaut (réparable à l'Atelier). */
  lossPct: 0.08,
  /** Récompense : base + bonus × (dégâts / dégâts du premier), en heures de production. */
  baseRewardHours: 2,
  bonusRewardHours: 10,
  /** Récompenses si le Léviathan survit. */
  failedRewardFactor: 0.5,
  title: "Fléau du Léviathan",
  titleDays: 7,
};

export interface LeviathanContribution {
  pseudo: string;
  damage: number;
  assaults: number;
  lastLaunchMs: number;
}

export interface LeviathanState {
  id: string;
  startMs: number;
  endMs: number;
  maxHp: number;
  hp: number;
  status: "active" | "killed" | "failed";
  contributions: Record<string, LeviathanContribution>;
  endedAtMs: number;
  rewarded: boolean;
  /** Titre temporaire du premier en dégâts. */
  titleHolder: { uid: string; untilMs: number } | null;
  /** Relevé horaire des points de structure (suivi admin, v3.3). */
  timeline: { t: number; hp: number }[];
}

const HOUR = 3600_000;

export function normalizeLeviathan(raw: unknown): LeviathanState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<LeviathanState>;
  if (!r.id || !(Number(r.maxHp) > 0)) return null;
  return {
    id: String(r.id),
    startMs: Number(r.startMs) || 0,
    endMs: Number(r.endMs) || 0,
    maxHp: Number(r.maxHp),
    hp: Math.max(0, Number(r.hp) || 0),
    status: r.status === "killed" || r.status === "failed" ? r.status : "active",
    contributions: r.contributions && typeof r.contributions === "object" ? r.contributions : {},
    endedAtMs: Number(r.endedAtMs) || 0,
    rewarded: r.rewarded === true,
    titleHolder: r.titleHolder && r.titleHolder.uid ? r.titleHolder : null,
    timeline: Array.isArray(r.timeline) ? r.timeline.filter((p) => p && Number.isFinite(p.t) && Number.isFinite(p.hp)) : [],
  };
}

/** Fenêtre mensuelle en cours (ou null) : premier week-end du mois. */
export function leviathanWindow(now: number): { id: string; startMs: number; endMs: number } | null {
  if (!EVENT_RULES.bossMonthly) return null;
  const w = weekendWindow(now);
  if (!w.firstOfMonth) return null;
  const endMs = w.startMs + LEVIATHAN_RULES.durationHours * HOUR;
  if (now < w.startMs || now >= endMs) return null;
  return { id: `lev-${w.startMs}`, startMs: w.startMs, endMs };
}

/** Prochain départ du Léviathan (affichage). */
export function nextLeviathanStart(now: number): number | null {
  if (!EVENT_RULES.bossMonthly) return null;
  for (let i = 0; i < 6; i++) {
    const w = weekendWindow(now, i);
    if (w.firstOfMonth && w.startMs + LEVIATHAN_RULES.durationHours * HOUR > now) return w.startMs;
  }
  return null;
}

export function isActive(state: LeviathanState | null, now: number): boolean {
  return !!state && state.status === "active" && now >= state.startMs && now < state.endMs && state.hp > 0;
}

/** Points de structure : facteur × puissance d'attaque de toute la flotte des joueurs actifs. */
export function leviathanHp(activePlayers: Pick<PlayerState, "units" | "techLevels">[]): number {
  const power = activePlayers.reduce((a, p) => a + computeFullPower(p.units ?? {}, p.techLevels ?? {}, OFFENSIVE_UNITS, ["attack"]), 0);
  return Math.max(LEVIATHAN_RULES.minHp, Math.round(power * LEVIATHAN_RULES.hpFactor));
}

export function spawnLeviathan(window: { id: string; startMs: number; endMs: number }, activePlayers: Pick<PlayerState, "units" | "techLevels">[], previous: LeviathanState | null): LeviathanState {
  const maxHp = leviathanHp(activePlayers);
  return { ...window, maxHp, hp: maxHp, status: "active", contributions: {}, endedAtMs: 0, rewarded: false, titleHolder: previous?.titleHolder ?? null, timeline: [{ t: window.startMs, hp: maxHp }] };
}

/** Lancement d'un assaut : Léviathan présent et délai respecté. */
export function checkLeviathanLaunch(state: LeviathanState | null, uid: string, pseudo: string, now: number): LeviathanState {
  if (!state || !isActive(state, now)) throw new GameActionError("Le Léviathan n'est pas là en ce moment.");
  const c = state.contributions[uid];
  const wait = c ? c.lastLaunchMs + LEVIATHAN_RULES.cooldownHours * HOUR - now : 0;
  if (wait > 0) throw new GameActionError(`Prochain assaut possible dans ${Math.ceil(wait / 60_000)} min.`);
  return { ...state, contributions: { ...state.contributions, [uid]: { pseudo, damage: c?.damage ?? 0, assaults: c?.assaults ?? 0, lastLaunchMs: now } } };
}

/** Assaut à l'arrivée : dégâts, pertes de la flotte (réparées en partie). */
export function resolveLeviathanAssault(
  state: LeviathanState,
  player: PlayerState,
  fleet: Record<string, number>,
  formation: string | undefined,
  now: number,
): { state: LeviathanState; damage: number; survivors: Record<string, number>; lost: Record<string, number>; killed: boolean } {
  const fx = formationEffects(formation);
  const power = Math.round(computeFleetPower(player.units, player.techLevels, fleet, ["attack"]) * fx.attackFactor * allianceSiegeFactor(player.allianceResearch) * pveAttackFactor(player.units, player.techLevels, fleet) * (1 + playerModifiers(player).attack) * (1 + playerModifiers(player).bossDamage));
  const active = isActive(state, now);
  const damage = active ? Math.min(state.hp, power) : 0;
  const repair = withRepairBonus(getRepairPercent(player.buildings), player);
  const lossPct = Math.min(1, LEVIATHAN_RULES.lossPct * fx.attackerLossFactor);
  const survivors: Record<string, number> = {};
  const lost: Record<string, number> = {};
  for (const [id, qty] of Object.entries(fleet)) {
    const raw = active ? Math.floor(qty * lossPct) : 0;
    const gone = raw - Math.floor(raw * repair);
    if (gone > 0) lost[id] = gone;
    survivors[id] = qty - gone;
  }
  const c = state.contributions[player.uid] ?? { pseudo: player.pseudo, damage: 0, assaults: 0, lastLaunchMs: now };
  const hp = state.hp - damage;
  const killed = active && hp <= 0;
  return {
    state: {
      ...state,
      hp: Math.max(0, hp),
      status: killed ? "killed" : state.status,
      endedAtMs: killed ? now : state.endedAtMs,
      contributions: active ? { ...state.contributions, [player.uid]: { ...c, pseudo: player.pseudo, damage: c.damage + damage, assaults: c.assaults + 1 } } : state.contributions,
    },
    damage,
    survivors,
    lost,
    killed,
  };
}

export function leviathanRanking(state: LeviathanState): ({ uid: string } & LeviathanContribution)[] {
  return Object.entries(state.contributions)
    .filter(([, c]) => c.damage > 0)
    .map(([uid, c]) => ({ uid, ...c }))
    .sort((a, b) => b.damage - a.damage);
}

/** Heures de production gagnées par un participant. */
export function rewardHours(state: LeviathanState, uid: string): number {
  const ranking = leviathanRanking(state);
  const top = ranking[0]?.damage ?? 0;
  const mine = state.contributions[uid]?.damage ?? 0;
  if (!(mine > 0) || !(top > 0)) return 0;
  const hours = LEVIATHAN_RULES.baseRewardHours + LEVIATHAN_RULES.bonusRewardHours * (mine / top);
  return state.status === "killed" ? hours : hours * LEVIATHAN_RULES.failedRewardFactor;
}

/** Verse la récompense d'un participant (et le titre au premier). */
export function grantLeviathanReward(state: LeviathanState, player: PlayerState, random: () => number = Math.random): { gain: Partial<Record<ResourceId, number>>; title: boolean; relic?: string } {
  const hours = rewardHours(state, player.uid);
  const gain = hours > 0 ? productionHours(player, hours) : {};
  for (const [res, n] of Object.entries(gain) as [ResourceId, number][]) player.resources[res] = (player.resources[res] ?? 0) + n;
  if (state.status === "killed" && hours > 0) bumpStat(player, "leviathanKills");
  const top = leviathanRanking(state)[0];
  const title = !!top && top.uid === player.uid && state.status === "killed";
  if (title && !(player.titles ?? []).some((t) => t.label === LEVIATHAN_RULES.title)) {
    player.titles = [...(player.titles ?? []), { label: LEVIATHAN_RULES.title, seasonId: `leviathan:${state.id}`, rank: 1 }];
    player.activeTitle = LEVIATHAN_RULES.title;
  }
  // v4.0 : Léviathan abattu, une relique (épique au moins pour le premier).
  if (state.status === "killed" && hours > 0) {
    const item = rollRelic("leviathan", Date.now(), random, title ? "epic" : "rare");
    if (addRelic(player, item)) return { gain, title, relic: relicLabel(item) };
  }
  return { gain, title };
}

/** Retire le titre temporaire une fois sa durée écoulée. */
export function removeLeviathanTitle(player: PlayerState): void {
  player.titles = (player.titles ?? []).filter((t) => t.label !== LEVIATHAN_RULES.title);
  if (player.activeTitle === LEVIATHAN_RULES.title) player.activeTitle = player.titles[0]?.label;
}

/** Fin de partie : tué, ou échéance dépassée sans victoire. */
export function closeLeviathan(state: LeviathanState, now: number): LeviathanState {
  if (state.status === "active" && now >= state.endMs) return { ...state, status: "failed", endedAtMs: now };
  return state;
}

/* ---------- Suivi en direct (admin, v3.3) ---------- */

const TIMELINE_MAX = 120;

/** Ajoute un relevé des points de structure, au plus un par heure. */
export function recordLeviathanTimeline(state: LeviathanState, now: number): LeviathanState {
  if (!isActive(state, now)) return state;
  const last = state.timeline[state.timeline.length - 1];
  if (last && now - last.t < HOUR) return state;
  return { ...state, timeline: [...state.timeline, { t: now, hp: state.hp }].slice(-TIMELINE_MAX) };
}

export interface LeviathanPace {
  elapsedHours: number;
  remainingHours: number;
  /** Dégâts infligés depuis l'apparition. */
  done: number;
  /** Rythme moyen depuis l'apparition (dégâts par heure). */
  ratePerHour: number;
  /** Dégâts de la dernière heure (d'après les relevés). */
  lastHour: number;
  /** Points de structure prévus à l'échéance au rythme moyen (0 = abattu). */
  projectedHp: number;
  /** Heures avant sa chute au rythme moyen (null si le rythme est nul). */
  killInHours: number | null;
  /** Structure qui serait tout juste abattue à l'échéance au rythme moyen. */
  suggestedMaxHp: number;
}

export function leviathanPace(state: LeviathanState, now: number): LeviathanPace {
  const at = Math.min(now, state.endedAtMs || state.endMs);
  const elapsedHours = Math.max(0, (at - state.startMs) / HOUR);
  const remainingHours = Math.max(0, (state.endMs - at) / HOUR);
  const done = Math.max(0, state.maxHp - state.hp);
  const ratePerHour = elapsedHours > 0 ? done / Math.max(elapsedHours, 0.25) : 0;
  const before = [...state.timeline].reverse().find((p) => p.t <= now - HOUR) ?? state.timeline[0];
  const lastHour = before ? Math.max(0, before.hp - state.hp) : 0;
  const projectedHp = Math.max(0, Math.round(state.hp - ratePerHour * remainingHours));
  const killInHours = state.hp <= 0 ? 0 : ratePerHour > 0 ? state.hp / ratePerHour : null;
  const suggestedMaxHp = Math.max(LEVIATHAN_RULES.minHp, Math.round(done + ratePerHour * remainingHours));
  return { elapsedHours, remainingHours, done, ratePerHour, lastHour, projectedHp, killInHours, suggestedMaxHp };
}

/** Ajustement à chaud (admin) : nouvelle structure maximale, dégâts déjà infligés conservés. */
export function resizeLeviathan(state: LeviathanState, maxHp: number, now: number): LeviathanState {
  if (!isActive(state, now)) throw new GameActionError("Le Léviathan n'est pas là en ce moment.");
  const next = Math.round(maxHp);
  const done = state.maxHp - state.hp;
  if (!(next > done)) throw new GameActionError(`La structure doit dépasser les dégâts déjà infligés (${done}).`);
  return { ...state, maxHp: next, hp: next - done, timeline: [...state.timeline, { t: now, hp: next - done }].slice(-TIMELINE_MAX) };
}
