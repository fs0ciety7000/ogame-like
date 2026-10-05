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

export const DAILY_RULES = { tasks: 3, tokensPerTask: 1, allBonusTokens: 2 };

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

export function dailyTasksFor(day: string): { key: ChronicleObjective; count: number }[] {
  const pool = [...POOL];
  const out: { key: ChronicleObjective; count: number }[] = [];
  let seed = hash(day);
  while (out.length < DAILY_RULES.tasks && pool.length > 0) {
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
