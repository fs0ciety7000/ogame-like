import { grantTokens } from "@/game/casino";
import { GameActionError } from "@/game/errors";
import { parisDay } from "@/game/retention";
import { OBJECTIVE_LABELS, passState, type PassState } from "@/game/seasonPass";
import type { ChronicleObjective } from "@/game/chronicles";
import type { PlayerState } from "@/types/game";

/* =====================================================
   5.15.12 : missions du jour. Trois petites tâches tirées chaque jour (heure
   de Paris), les mêmes pour tous ; chacune rapporte un jeton du casino, et les
   trois réunies un bonus. Les actions sont comptées par trackActivity.
===================================================== */

/** 6.2 (lot N) : fusionnées dans les objectifs du jour (contracts.ts) : plus de tâche tirée. `legacyTasks` sert à payer
 *  les missions faites et non réclamées le jour de la bascule (settleLegacyDaily). */
export const DAILY_RULES = { tasks: 0, legacyTasks: 3, tokensPerTask: 1, allBonusTokens: 2 };

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const DAILY_RULES_META = {
  tasks: { label: "Tâches tirées par jour (ancien système)", min: 0, max: 10, hint: "0 : fusionnées dans les objectifs du jour depuis 6.2. Laisser à 0." },
  legacyTasks: { label: "Tâches des anciennes journées", min: 0, max: 10, hint: "Sert seulement à payer les journées commencées avant la fusion." },
  tokensPerTask: { label: "Jetons par tâche", unit: "jetons", min: 0, max: 20 },
  allBonusTokens: { label: "Jetons en plus quand toutes sont faites", unit: "jetons", min: 0, max: 20 },
};

/** Tâches possibles (faisables par tout le monde) et quantité demandée. */
const POOL: { key: ChronicleObjective; count: number }[] = [
  { key: "mission", count: 2 },
  { key: "spy", count: 2 },
  { key: "victory", count: 1 },
  { key: "contract", count: 1 },
  { key: "market", count: 1 },
];

/** Tirage déterministe du jour (même jour, mêmes tâches pour tous). */
function hash(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0;
  return h;
}

export function dailyTasksFor(day: string, tasks: number = DAILY_RULES.tasks): { key: ChronicleObjective; count: number }[] {
  const pool = [...POOL];
  const out: { key: ChronicleObjective; count: number }[] = [];
  let seed = hash(day);
  while (out.length < tasks && pool.length > 0) {
    const i = seed % pool.length;
    out.push(pool.splice(i, 1)[0]);
    seed = hash(`${day}:${seed}`);
  }
  return out;
}

export interface DailyTaskView {
  key: ChronicleObjective;
  label: string;
  count: number;
  progress: number;
  done: boolean;
  claimed: boolean;
}

function todayState(st: PassState, day: string): NonNullable<PassState["daily"]> {
  return st.daily && st.daily.day === day ? st.daily : { day, counts: {}, claimed: [] };
}

export function dailyMissions(player: Pick<PlayerState, "seasonPass">, now: number): { day: string; tasks: DailyTaskView[]; allClaimed: boolean } {
  const day = parisDay(now);
  const daily = todayState(passState(player as PlayerState, now), day);
  const tasks = dailyTasksFor(day).map((t, i) => {
    const progress = Math.min(t.count, daily.counts[t.key] ?? 0);
    return { key: t.key, label: OBJECTIVE_LABELS[t.key], count: t.count, progress, done: progress >= t.count, claimed: daily.claimed.includes(i) };
  });
  return { day, tasks, allClaimed: tasks.every((t) => t.claimed) };
}

/** Missions faites mais pas encore réclamées (pastille). */
export function dailyReadyCount(player: Pick<PlayerState, "seasonPass">, now: number): number {
  return dailyMissions(player, now).tasks.filter((t) => t.done && !t.claimed).length;
}

/** Réclame une mission du jour : 1 jeton, et le bonus quand les trois sont réclamées. */
export function claimDailyMission(player: PlayerState, index: unknown, now: number): { tokens: number; bonus: boolean } {
  const i = Math.floor(Number(index));
  const view = dailyMissions(player, now);
  const task = view.tasks[i];
  if (!task) throw new GameActionError("Mission inconnue.");
  if (task.claimed) throw new GameActionError("Mission déjà réclamée.");
  if (!task.done) throw new GameActionError(`Pas encore faite (${task.progress} / ${task.count}).`);
  const st = passState(player, now);
  const daily = todayState(st, view.day);
  st.daily = { ...daily, claimed: [...daily.claimed, i] };
  player.seasonPass = st;
  const bonus = st.daily.claimed.length >= view.tasks.length;
  const tokens = DAILY_RULES.tokensPerTask + (bonus ? DAILY_RULES.allBonusTokens : 0);
  grantTokens(player, tokens);
  return { tokens, bonus };
}

/** 6.2 (lot N) : bascule sans perte. Les missions du jour faites mais pas réclamées (tirage d'avant, 3 tâches) sont
 *  payées une fois, automatiquement. Renvoie les jetons versés. */
export function settleLegacyDaily(player: PlayerState, now: number): number {
  if (DAILY_RULES.tasks > 0) return 0;
  const st = passState(player, now);
  const daily = st.daily;
  if (!daily || daily.day !== parisDay(now) || daily.settled) return 0;
  const tasks = dailyTasksFor(daily.day, DAILY_RULES.legacyTasks);
  const claimed = [...daily.claimed];
  let tokens = 0;
  tasks.forEach((t, i) => {
    if (claimed.includes(i) || (daily.counts[t.key] ?? 0) < t.count) return;
    claimed.push(i);
    tokens += DAILY_RULES.tokensPerTask;
  });
  if (tokens > 0 && claimed.length >= tasks.length) tokens += DAILY_RULES.allBonusTokens;
  st.daily = { ...daily, claimed, settled: true };
  player.seasonPass = st;
  if (tokens > 0) grantTokens(player, tokens);
  return tokens;
}
