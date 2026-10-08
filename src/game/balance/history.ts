import { COMBAT_RULES } from "@/game/combat";
import type { BattleReport } from "@/types/game";
import type { LiveBalance } from "@/game/balance/diagnostics";
import { combatTypeCounts, isPvpReport, type CombatKind } from "@/game/balance/combatTypes";

/* =====================================================
   v5.5 : historique d'équilibrage. Une photo par jour (tâche du serveur)
   des indicateurs de l'onglet Équilibrage, gardée 180 jours dans
   game_config « balance_history ». Les combats sont comptés jour par jour
   (sommes glissantes à l'affichage) ; raids et repaires sont des cumuls.
===================================================== */

export const BALANCE_HISTORY_KEY = "balance_history";
export const BALANCE_HISTORY_DAYS = 180;

export interface BalanceSnapshot {
  /** « 2026-10-03 » (UTC). */
  day: string;
  atMs: number;
  activePlayers: number;
  /** Combats JcJ de la journée et victoires de l'attaquant. */
  pvpBattles: number;
  pvpAttackerWins: number;
  warlordBattles: number;
  warlordAttackerWins: number;
  /** Cumuls (joueurs actifs) : raids repoussés / perdus, repaires pris. */
  raidsWon: number;
  raidsLost: number;
  lairsTaken: number;
  /** Médiane de la production horaire (toutes ressources). */
  medianProduction: number;
  /** Remplissage moyen des hangars d'attaque (0,85 = 85 %). */
  avgHangarAttack: number;
  bestDefense: number;
  bestAttack: number;
  topWarlord: number;
  homeDefenseBonus: number;
  /** 5.21 : combats du jour par type : [combats, victoires du joueur]. */
  kinds?: Partial<Record<CombatKind, [number, number]>>;
  /** 6.0.1 (lot K) : médianes en heures de production (stock pillable, part à l'abri), butin moyen, joueurs par classe. */
  pillableHours?: number;
  protectedHours?: number;
  avgLoot?: number;
  classes?: Record<string, number>;
  /** 6.5.1 (lot U) : part des joueurs à court d'emplacements de flotte, routes de colonies (dont ravitaillement). */
  fullSlotsPct?: number;
  routes?: number;
  supplyRoutes?: number;
  /** 6.8.0 (AU3) : part des joueurs au dernier palier du passe, part des succès du joueur médian. */
  passFinishedPct?: number;
  achievementsPct?: number;
  /** 6.14.107 (AE-L4) : Ambre de la semaine précédente (lundi `amberWeek`) : total et par source, chez les actifs. */
  amberWeek?: string;
  amberTotal?: number;
  amberBySource?: Record<string, number>;
  /** 6.14.107 : boss abattus (%, 56 j) et heures avant la mort (médiane ; null : aucun). */
  bossKillPct?: number;
  bossKillHours?: number | null;
  /** 6.14.107 : jour médian de la 1re Ascension, production perdue (médiane, %), quartiles de production horaire. */
  ascensionDay?: number | null;
  productionLostPct?: number | null;
  productionQ1?: number;
  productionQ3?: number;
  /** 6.14.107 : suivi des choix d'AE-L3 : coffres au plancher (%), actifs au plafond du comptoir (%), protections (7 j). */
  chestFloorPct?: number;
  exchangeAtCapPct?: number;
  defeatProtections?: number;
}

type Report = Pick<BattleReport, "attackerUid" | "defenderUid" | "outcome" | "timestamp">;

function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Photo du jour à partir des données réelles et des combats des dernières 24 h. */
export function balanceSnapshot(live: LiveBalance, reports: Report[], now: number): BalanceSnapshot {
  const day = reports.filter((r) => r.timestamp >= now - 86_400_000 && r.timestamp <= now);
  const pvp = day.filter(isPvpReport);
  const wl = day.filter((r) => r.attackerUid?.startsWith("npc") || r.defenderUid?.startsWith("npc"));
  const wins = (xs: Report[]) => xs.filter((r) => r.outcome === "attacker_win").length;
  const hangars = live.players.filter((p) => p.attackPlaces > 0).map((p) => p.attackPlacesUsed / p.attackPlaces);
  return {
    day: new Date(now).toISOString().slice(0, 10),
    atMs: now,
    activePlayers: live.activePlayers,
    pvpBattles: pvp.length,
    pvpAttackerWins: wins(pvp),
    warlordBattles: wl.length,
    warlordAttackerWins: wins(wl),
    raidsWon: live.factions.reduce((a, f) => a + f.raidsWon, 0),
    raidsLost: live.factions.reduce((a, f) => a + f.raidsLost, 0),
    lairsTaken: live.factions.reduce((a, f) => a + f.lairsTaken, 0),
    medianProduction: Math.round(median(live.players.map((p) => p.productionPerHour))),
    avgHangarAttack: hangars.length ? Math.round((hangars.reduce((a, b) => a + b, 0) / hangars.length) * 1000) / 1000 : 0,
    bestDefense: live.bestDefense,
    bestAttack: live.bestAttack,
    topWarlord: live.warlords[0]?.power ?? 0,
    homeDefenseBonus: COMBAT_RULES.homeDefenseBonus,
    kinds: combatTypeCounts(reports, now - 86_400_000, now),
    ...(live.health
      ? {
          pillableHours: live.health.exposure.pillableHours,
          protectedHours: live.health.exposure.protectedHours,
          avgLoot: live.health.pvp.avgLoot,
          classes: Object.fromEntries(live.health.classes.rows.map((r) => [r.id, r.players])),
          fullSlotsPct: live.health.parallel.fullSlotsPct,
          routes: live.health.colonies.withRoute,
          supplyRoutes: live.health.colonies.supply,
          passFinishedPct: live.health.pass.finishedPct,
          achievementsPct: live.health.achievements.medianPct,
          ...(live.health.amber
            ? {
                amberWeek: live.health.amber.lastWeek,
                amberTotal: live.health.amber.last.total,
                amberBySource: Object.fromEntries(live.health.amber.last.bySource.map((r) => [r.source, r.total])),
              }
            : {}),
          ...(live.health.bosses?.total ? { bossKillPct: live.health.bosses.total.winPct, bossKillHours: live.health.bosses.total.medianKillHours } : {}),
          ...(live.health.ascension ? { ascensionDay: live.health.ascension.medianDay } : {}),
          ...(live.health.production
            ? { productionLostPct: live.health.production.lostMedianPct, productionQ1: live.health.production.q1, productionQ3: live.health.production.q3 }
            : {}),
          ...(live.health.choices
            ? { chestFloorPct: live.health.choices.chest.allFloorPct, exchangeAtCapPct: live.health.choices.exchange.atCapPct, defeatProtections: live.health.choices.defeats.protections }
            : {}),
        }
      : {}),
  };
}

/** 6.14.19 (A29-2, PRG-5) : points de succès gagnés par le joueur médian sur les `days` derniers jours (en points de %,
 *  d'après les photos quotidiennes ; null s'il manque une photo assez ancienne). */
export function achievementsPace(history: BalanceSnapshot[] | null | undefined, days = 7): number | null {
  const list = (Array.isArray(history) ? history : []).filter((s) => typeof s.achievementsPct === "number");
  if (list.length < 2) return null;
  const last = list[list.length - 1];
  const target = Date.parse(`${last.day}T00:00:00Z`) - days * 86_400_000;
  const older = [...list].reverse().find((s) => Date.parse(`${s.day}T00:00:00Z`) <= target);
  return older ? (last.achievementsPct ?? 0) - (older.achievementsPct ?? 0) : null;
}

/** Ajoute (ou remplace) la photo du jour ; garde les 180 derniers jours. */
export function pushSnapshot(history: BalanceSnapshot[] | null | undefined, snap: BalanceSnapshot): BalanceSnapshot[] {
  const list = (Array.isArray(history) ? history : []).filter((s) => s && s.day !== snap.day);
  return [...list, snap].sort((a, b) => (a.day < b.day ? -1 : 1)).slice(-BALANCE_HISTORY_DAYS);
}

/** Part des victoires de l'attaquant en JcJ sur les `days` dernières photos (null si trop peu de combats). */
export function rollingPvpWinPct(history: BalanceSnapshot[], days = 7, minBattles = 20): { pct: number; battles: number } | null {
  const last = history.slice(-days);
  const battles = last.reduce((a, s) => a + s.pvpBattles, 0);
  if (battles < minBattles) return null;
  return { pct: Math.round((last.reduce((a, s) => a + s.pvpAttackerWins, 0) / battles) * 100), battles };
}

/** Raids repoussés pendant la période (différence des cumuls), en %. */
export function periodRaidRepelPct(history: BalanceSnapshot[], days = 7): { pct: number; raids: number } | null {
  if (history.length < 2) return null;
  const last = history.at(-1)!;
  const first = history[Math.max(0, history.length - 1 - days)];
  const won = last.raidsWon - first.raidsWon;
  const lost = last.raidsLost - first.raidsLost;
  if (won + lost <= 0) return null;
  return { pct: Math.round((won / (won + lost)) * 100), raids: won + lost };
}

/** 6.14.107 (AE-L4) : Ambre gagnée par semaine et par source, une ligne par semaine (la photo la plus récente de chaque
 *  semaine), de la plus récente à la plus ancienne. */
export function amberWeeksFromHistory(history: BalanceSnapshot[] | null | undefined): { week: string; total: number; bySource: Record<string, number> }[] {
  const byWeek = new Map<string, { week: string; total: number; bySource: Record<string, number> }>();
  for (const s of Array.isArray(history) ? history : []) {
    if (!s || typeof s.amberWeek !== "string" || !s.amberWeek) continue;
    byWeek.set(s.amberWeek, { week: s.amberWeek, total: Number(s.amberTotal) || 0, bySource: { ...(s.amberBySource ?? {}) } });
  }
  return [...byWeek.values()].sort((a, b) => (a.week < b.week ? 1 : -1));
}
