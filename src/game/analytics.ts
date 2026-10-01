import { BUILDINGS, effectiveBuildingLevel } from "@/game/buildings";
import { MISSIONS } from "@/game/missions";
import { getProductionRatesPerSecond } from "@/game/production";
import { familyIndex, getRank } from "@/game/ranks";
import { RESOURCE_LIST } from "@/game/resources";
import { TECHNOLOGIES } from "@/game/technologies";
import { UNITS } from "@/game/units";
import type { BattleReport, PlayerState, QueuesState, ResourceId } from "@/types/game";

/* =====================================================
   Statistiques pour le game design (onglet Statistiques de
   l'administration). Calculées par le serveur (route admin) à partir de
   tous les joueurs et des combats récents : le navigateur ne reçoit que
   des agrégats.
===================================================== */

const HOUR = 3600_000;
const DAY = 24 * HOUR;

export interface GameStats {
  generatedAt: number;
  players: {
    total: number;
    active24h: number;
    active7d: number;
    new7d: number;
    medianPlaytimeHours: number;
    ranks: { label: string; count: number }[];
    medianXp: number;
    topXp: { pseudo: string; xp: number }[];
  };
  economy: {
    resources: { id: ResourceId; name: string; median: number; total: number; medianRate: number }[];
  };
  buildings: { id: string; name: string; avgLevel: number; maxLevel: number; unlockedPct: number; maxedPct: number }[];
  technologies: { id: string; name: string; researchedPct: number; avgLevel: number; maxLevel: number }[];
  units: { id: string; name: string; total: number; ownersPct: number; unlockedPct: number }[];
  missions: { key: string; name: string; running: number }[];
  combat: {
    windowDays: number;
    attacks: number;
    outcomes: { attacker_win: number; defender_win: number; draw: number };
    perDay: { day: string; count: number }[];
    avgLoot: number;
    topAttackers: { pseudo: string; count: number }[];
    mostAttacked: { pseudo: string; count: number }[];
  };
  insights: string[];
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

const pct = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 1000) / 10 : 0);
const round1 = (n: number) => Math.round(n * 10) / 10;

function topCounts(values: string[], limit: number) {
  const counts = new Map<string, number>();
  values.forEach((v) => counts.set(v, (counts.get(v) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([pseudo, count]) => ({ pseudo, count }));
}

export function computeGameStats(
  players: PlayerState[],
  queues: Partial<QueuesState>[],
  reports: Pick<BattleReport, "attackerPseudo" | "defenderPseudo" | "outcome" | "timestamp" | "loot">[],
  now: number,
  windowDays = 7,
): GameStats {
  const n = players.length;
  const lastSeen = (p: PlayerState) => p.resourcesUpdatedAtMs ?? 0;

  // Rangs regroupés par famille (Fer, Bronze, Argent…).
  const families = new Map<string, number>();
  players.forEach((p) => {
    const family = getRank(p.xp ?? 0).family;
    families.set(family, (families.get(family) ?? 0) + 1);
  });

  const rates = players.map((p) => getProductionRatesPerSecond(p.buildings ?? {}, p.techLevels ?? {}));

  const buildings = BUILDINGS.map((b) => {
    const levels = players.map((p) => effectiveBuildingLevel(p.buildings ?? {}, b.id));
    return {
      id: b.id,
      name: b.name,
      avgLevel: round1(levels.reduce((a, l) => a + l, 0) / Math.max(1, n)),
      maxLevel: b.maxLevel,
      unlockedPct: pct(levels.filter((l) => l > 0).length, n),
      maxedPct: pct(levels.filter((l) => l >= b.maxLevel).length, n),
    };
  });

  const technologies = TECHNOLOGIES.map((t) => {
    const levels = players.map((p) => p.techLevels?.[t.id] ?? 0);
    return {
      id: t.id,
      name: t.nom,
      researchedPct: pct(levels.filter((l) => l > 0).length, n),
      avgLevel: round1(levels.reduce((a, l) => a + l, 0) / Math.max(1, n)),
      maxLevel: t.maxLevel,
    };
  });

  const units = UNITS.map((u) => {
    const owned = players.map((p) => p.units?.[u.id]);
    return {
      id: u.id,
      name: u.name,
      total: owned.reduce((a, s) => a + (s?.count ?? 0), 0),
      ownersPct: pct(owned.filter((s) => (s?.count ?? 0) > 0).length, n),
      unlockedPct: pct(owned.filter((s) => (s?.level ?? 0) > 0).length, n),
    };
  });

  const missionCounts = new Map<string, number>();
  queues.forEach((q) => (q.activeMissions ?? []).forEach((m) => missionCounts.set(m.key, (missionCounts.get(m.key) ?? 0) + 1)));
  const missions = Object.values(MISSIONS)
    .map((m) => ({ key: m.key, name: m.name, running: missionCounts.get(m.key) ?? 0 }))
    .sort((a, b) => b.running - a.running);

  const since = now - windowDays * DAY;
  const recent = reports.filter((r) => (r.timestamp ?? 0) >= since);
  const outcomes = { attacker_win: 0, defender_win: 0, draw: 0 };
  recent.forEach((r) => {
    if (r.outcome in outcomes) outcomes[r.outcome as keyof typeof outcomes]++;
  });
  const perDay = Array.from({ length: windowDays }, (_, i) => {
    const start = now - (windowDays - i) * DAY;
    const d = new Date(start + DAY);
    return {
      day: `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}`,
      count: recent.filter((r) => r.timestamp >= start && r.timestamp < start + DAY).length,
    };
  });
  const lootTotals = recent
    .filter((r) => r.outcome === "attacker_win")
    .map((r) => Object.values(r.loot ?? {}).reduce((a: number, v) => a + (v ?? 0), 0));

  const stats: GameStats = {
    generatedAt: now,
    players: {
      total: n,
      active24h: players.filter((p) => now - lastSeen(p) < DAY).length,
      active7d: players.filter((p) => now - lastSeen(p) < 7 * DAY).length,
      new7d: players.filter((p) => now - (p.createdAtMs ?? 0) < 7 * DAY).length,
      medianPlaytimeHours: round1(median(players.map((p) => (p.playtimeSeconds ?? 0) / 3600))),
      ranks: [...families.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => familyIndex(a.label) - familyIndex(b.label)),
      medianXp: median(players.map((p) => p.xp ?? 0)),
      topXp: [...players]
        .sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0))
        .slice(0, 5)
        .map((p) => ({ pseudo: p.pseudo, xp: p.xp ?? 0 })),
    },
    economy: {
      resources: RESOURCE_LIST.map((r) => {
        const amounts = players.map((p) => p.resources?.[r.id] ?? 0);
        return {
          id: r.id,
          name: r.name,
          median: Math.floor(median(amounts)),
          total: Math.floor(amounts.reduce((a, v) => a + v, 0)),
          medianRate: round1(median(rates.map((rt) => rt[r.id] ?? 0))),
        };
      }),
    },
    buildings,
    technologies,
    units,
    missions,
    combat: {
      windowDays,
      attacks: recent.length,
      outcomes,
      perDay,
      avgLoot: lootTotals.length ? Math.round(lootTotals.reduce((a, v) => a + v, 0) / lootTotals.length) : 0,
      topAttackers: topCounts(recent.map((r) => r.attackerPseudo), 5),
      mostAttacked: topCounts(recent.map((r) => r.defenderPseudo), 5),
    },
    insights: [],
  };
  stats.insights = computeInsights(stats);
  return stats;
}

/** Pistes d'équilibrage repérées automatiquement. */
function computeInsights(s: GameStats): string[] {
  const out: string[] = [];
  if (s.players.total === 0) return out;
  const shortList = (names: string[]) => (names.length > 4 ? `${names.slice(0, 4).join(", ")} et ${names.length - 4} autre(s)` : names.join(", "));
  const neverResearched = s.technologies.filter((t) => t.researchedPct === 0).map((t) => t.name);
  if (neverResearched.length > 0) out.push(`Technologies que personne n'a recherchées : ${shortList(neverResearched)}.`);
  for (const u of s.units) {
    if (u.unlockedPct >= 30 && u.ownersPct === 0) out.push(`Unité « ${u.name} » : débloquée par ${u.unlockedPct} % des joueurs mais jamais construite.`);
  }
  for (const b of s.buildings) {
    if (b.maxedPct >= 50) out.push(`Bâtiment « ${b.name} » : au niveau max chez ${b.maxedPct} % des joueurs — ajouter des niveaux ?`);
  }
  const idle = s.missions.filter((m) => m.running === 0).map((m) => m.name);
  if (idle.length > 0 && idle.length < s.missions.length) out.push(`Missions lancées par personne en ce moment : ${shortList(idle)}.`);
  const { attacks, outcomes } = s.combat;
  if (attacks >= 5 && outcomes.defender_win / attacks > 0.7) out.push("Les défenseurs gagnent plus de 70 % des combats : l'attaque est peut-être trop faible.");
  if (attacks >= 5 && outcomes.attacker_win / attacks > 0.85) out.push("Les attaquants gagnent plus de 85 % des combats : la défense est peut-être trop faible.");
  if (s.players.active7d > 0 && attacks === 0) out.push(`Aucun combat depuis ${s.combat.windowDays} jours.`);
  if (s.players.total >= 5 && s.players.active7d / s.players.total < 0.4) out.push("Moins de 40 % des joueurs sont venus cette semaine.");
  return out;
}
