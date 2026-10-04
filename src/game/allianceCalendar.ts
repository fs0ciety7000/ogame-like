import { ALLIANCE_DAILY_RULES } from "@/game/allianceDaily";
import { allianceBossDef, allianceBossOfWeek, allianceWeekId, type AllianceBossState } from "@/game/allianceBoss";
import { seasonBossSchedule, seasonBossWindow } from "@/game/chronicles";
import { parisLocalToUtc } from "@/game/events";
import { gazettePublishAt } from "@/game/gazette";
import { nextLeviathanStart, worldBossForStart, worldBossName, type LeviathanState } from "@/game/leviathan";
import { parisDay } from "@/game/retention";
import type { AllianceWar } from "@/game/wars";

/* =====================================================
   v4.9 : calendrier commun de l'alliance (lecture seule), calculé à partir
   des événements existants : boss d'alliance, guerres, coalition,
   Léviathan, boss de saison, Gazette, objectif du jour.
===================================================== */

export type CalendarKind = "boss" | "war" | "coalition" | "leviathan" | "seasonBoss" | "gazette" | "daily";

export interface CalendarEvent {
  kind: CalendarKind;
  title: string;
  detail?: string;
  startMs: number;
  endMs?: number;
  to: string;
}

export interface CalendarInput {
  allianceId: string;
  boss: AllianceBossState | null;
  wars: AllianceWar[];
  coalition: { warlordName: string; startedAtMs: number; endsAtMs: number; status: string } | null;
  leviathan: LeviathanState | null;
}

const DAY = 86400_000;

export function allianceCalendar(input: CalendarInput, now: number, horizonDays = 14): CalendarEvent[] {
  const out: CalendarEvent[] = [];
  const horizon = now + horizonDays * DAY;

  // Boss d'alliance : celui de la semaine (en cours, ou à appeler).
  const week = allianceWeekId(now);
  if (input.boss && input.boss.weekId === week && input.boss.status === "active") {
    out.push({ kind: "boss", title: `Boss d'alliance : ${allianceBossDef(input.boss).name}`, detail: "24 h pour l'abattre", startMs: input.boss.startMs, endMs: input.boss.endMs, to: "/game/alliance?onglet=boss" });
  } else if (!input.boss || input.boss.weekId !== week) {
    const nextMonday = parisLocalToUtc(Date.parse(`${week}T00:00:00Z`) + 7 * DAY);
    out.push({ kind: "boss", title: `Boss d'alliance : ${allianceBossOfWeek(now).name}`, detail: "À appeler par un officier cette semaine", startMs: now, endMs: nextMonday, to: "/game/alliance?onglet=boss" });
  }

  for (const w of input.wars) {
    if (w.endMs < now || w.startMs > horizon) continue;
    const us = w.attackerId === input.allianceId;
    out.push({ kind: "war", title: `Guerre contre [${us ? w.defenderTag : w.attackerTag}]`, detail: us ? "Déclarée par nous" : "Déclarée contre nous", startMs: w.startMs, endMs: w.endMs, to: "/game/alliance?onglet=guerre" });
  }

  if (input.coalition && input.coalition.status === "active" && input.coalition.endsAtMs > now) {
    out.push({ kind: "coalition", title: `Coalition contre ${input.coalition.warlordName}`, startMs: input.coalition.startedAtMs, endMs: input.coalition.endsAtMs, to: "/game/seigneurs" });
  }

  if (input.leviathan && input.leviathan.status === "active" && input.leviathan.endMs > now) {
    out.push({ kind: "leviathan", title: worldBossName(input.leviathan), detail: "Boss mondial", startMs: input.leviathan.startMs, endMs: input.leviathan.endMs, to: "/game/leviathan" });
  } else {
    const next = nextLeviathanStart(now);
    if (next && next <= horizon) out.push({ kind: "leviathan", title: worldBossForStart(next).name, detail: "Boss mondial", startMs: next, to: "/game/leviathan" });
  }

  const sb = seasonBossWindow(now, true);
  if (sb && sb.endMs > now && sb.startMs <= horizon) out.push({ kind: "seasonBoss", title: "Boss de saison", detail: seasonBossSchedule().weekly?.between ? "Entre deux boss mondiaux" : "Dernier week-end du mois", startMs: sb.startMs, endMs: sb.endMs, to: "/game/boss" });

  let gz = gazettePublishAt(now);
  if (gz <= now) gz = gazettePublishAt(now + 7 * DAY);
  out.push({ kind: "gazette", title: "La Gazette du secteur", startMs: gz, to: "/game/gazette" });

  // Objectif du jour : vote de 6 h à 10 h, puis jusqu'à minuit.
  const midnight = Date.parse(`${parisDay(now)}T00:00:00Z`);
  const vote = parisLocalToUtc(midnight + ALLIANCE_DAILY_RULES.proposeHour * 3600_000);
  const close = parisLocalToUtc(midnight + ALLIANCE_DAILY_RULES.voteEndHour * 3600_000);
  if (now < close) out.push({ kind: "daily", title: "Vote de l'objectif du jour", detail: "Officiers", startMs: vote, endMs: close, to: "/game/alliance?onglet=objectif" });

  return out.sort((a, b) => a.startMs - b.startMs);
}
