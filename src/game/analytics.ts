import { BUILDINGS, effectiveBuildingLevel, productionPerSecond } from "@/game/buildings";
import { MISSIONS } from "@/game/missions";
import { getProductionRatesPerSecond } from "@/game/production";
import { familyIndex, getRank } from "@/game/ranks";
import { RESOURCE_LIST } from "@/game/resources";
import { ENDGAME_TECH_IDS, TECHNOLOGIES } from "@/game/technologies";
import { UNIT_BASE_STATS, UNITS } from "@/game/units";
import { FACTIONS, factionOfLair, PIRATE_OWNER_UID } from "@/game/pirates";
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
  /** v2.8 : indicateurs d'équilibrage, sur `balance.windowDays` jours. */
  balance: {
    windowDays: number;
    activity: { active1d: number; active7d: number; active30d: number; dormant: { pseudo: string; days: number }[] };
    /** Ancienneté médiane (jours depuis l'inscription) des joueurs de chaque famille de rang. */
    rankAge: { label: string; players: number; medianDays: number }[];
    /** Combats lancés par des joueurs, classés par unité dominante de la flotte. */
    dominantUnits: { id: string; name: string; attacks: number; winPct: number }[];
    factions: { id: string; name: string; raids: number; repelledPct: number; lairAssaults: number; lairWinPct: number }[];
    flows: { productionPerHour: number; spentTotal: number; lootWindow: number; tradedTotal: number; marketTrades: number; marketTax: number };
    /** Stocks très au-dessus des autres joueurs (à vérifier). */
    anomalies: { pseudo: string; resource: string; amount: number; ratio: number }[];
  };
  /** v3.7 : contenu de fin de partie (technologies 21–25, bâtiments et unités associés). */
  endgame: {
    windowDays: number;
    /** Joueurs ayant au moins une technologie de fin de partie. */
    players: number;
    techs: { id: string; name: string; researchers: number; inProgress: number; avgLevel: number; maxLevel: number; leaders: string[] }[];
    buildings: { id: string; name: string; builders: number; avgLevel: number; maxLevel: number; resource: string | null; perHour: number }[];
    units: { id: string; name: string; owners: number; total: number; attacks: number; winPct: number }[];
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
  reports: (Pick<BattleReport, "attackerPseudo" | "defenderPseudo" | "outcome" | "timestamp" | "loot"> & Partial<Pick<BattleReport, "attackerUid" | "defenderUid" | "attackerFleet">>)[],
  now: number,
  windowDays = 7,
  balanceDays = 30,
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
    balance: computeBalance(players, reports, now, balanceDays),
    endgame: computeEndgame(players, queues, reports, now, balanceDays),
    insights: [],
  };
  stats.insights = computeInsights(stats);
  return stats;
}

function computeEndgame(
  players: PlayerState[],
  queues: Partial<QueuesState>[],
  reports: Parameters<typeof computeGameStats>[2],
  now: number,
  windowDays: number,
): GameStats["endgame"] {
  const since = now - windowDays * DAY;
  const recent = reports.filter((r) => (r.timestamp ?? 0) >= since && r.attackerUid !== PIRATE_OWNER_UID);
  const avg = (values: number[]) => (values.length ? round1(values.reduce((a, v) => a + v, 0) / values.length) : 0);

  const techs = TECHNOLOGIES.filter((t) => ENDGAME_TECH_IDS.includes(t.id)).map((t) => {
    const holders = players.filter((p) => (p.techLevels?.[t.id] ?? 0) > 0).sort((a, b) => (b.techLevels?.[t.id] ?? 0) - (a.techLevels?.[t.id] ?? 0));
    return {
      id: t.id,
      name: t.nom,
      researchers: holders.length,
      inProgress: queues.filter((q) => (q.activeResearches ?? []).some((r) => r.id === t.id)).length,
      avgLevel: avg(holders.map((p) => p.techLevels?.[t.id] ?? 0)),
      maxLevel: t.maxLevel,
      leaders: holders.slice(0, 3).map((p) => `${p.pseudo} (${p.techLevels?.[t.id] ?? 0})`),
    };
  });

  const buildings = BUILDINGS.filter((b) => b.endgame).map((b) => {
    const levels = players.map((p) => effectiveBuildingLevel(p.buildings ?? {}, b.id)).filter((l) => l > 0);
    return {
      id: b.id,
      name: b.name,
      builders: levels.length,
      avgLevel: avg(levels),
      maxLevel: b.maxLevel,
      resource: b.production?.resource ?? null,
      perHour: b.production ? Math.round(levels.reduce((a, l) => a + productionPerSecond(b.id, l), 0) * 3600) : 0,
    };
  });

  const units = UNITS.filter((u) => ENDGAME_TECH_IDS.includes(u.unlockTech)).map((u) => {
    const owned = players.map((p) => p.units?.[u.id]?.count ?? 0);
    const used = recent.filter((r) => (r.attackerFleet?.[u.id] ?? 0) > 0);
    return {
      id: u.id,
      name: u.name,
      owners: owned.filter((c) => c > 0).length,
      total: owned.reduce((a, c) => a + c, 0),
      attacks: used.length,
      winPct: pct(used.filter((r) => r.outcome === "attacker_win").length, used.length),
    };
  });

  return {
    windowDays,
    players: players.filter((p) => ENDGAME_TECH_IDS.some((id) => (p.techLevels?.[id] ?? 0) > 0)).length,
    techs,
    buildings,
    units,
  };
}

/** Unité qui pèse le plus dans la puissance d'attaque d'une flotte. */
export function dominantUnit(fleet: Record<string, number>): string | null {
  let best: string | null = null;
  let bestPower = 0;
  for (const [id, qty] of Object.entries(fleet)) {
    const power = (UNIT_BASE_STATS[id]?.attack ?? 0) * (qty || 0);
    if (power > bestPower) {
      best = id;
      bestPower = power;
    }
  }
  return best;
}

const sumValues = (r: Partial<Record<string, number>> | null | undefined) => Object.values(r ?? {}).reduce((a: number, v) => a + (v ?? 0), 0);

function computeBalance(players: PlayerState[], reports: Parameters<typeof computeGameStats>[2], now: number, windowDays: number): GameStats["balance"] {
  const seen = (p: PlayerState) => p.resourcesUpdatedAtMs ?? 0;
  const days = (ms: number) => Math.floor(ms / DAY);
  const since = now - windowDays * DAY;
  const recent = reports.filter((r) => (r.timestamp ?? 0) >= since);

  const dormant = players
    .filter((p) => now - seen(p) >= 3 * DAY && now - seen(p) < 30 * DAY)
    .map((p) => ({ pseudo: p.pseudo, days: days(now - seen(p)) }))
    .sort((a, b) => a.days - b.days);

  const byFamily = new Map<string, number[]>();
  players.forEach((p) => {
    if (!p.createdAtMs) return;
    const family = getRank(p.xp ?? 0).family;
    byFamily.set(family, [...(byFamily.get(family) ?? []), (now - p.createdAtMs) / DAY]);
  });
  const rankAge = [...byFamily.entries()]
    .map(([label, ages]) => ({ label, players: ages.length, medianDays: round1(median(ages)) }))
    .sort((a, b) => familyIndex(a.label) - familyIndex(b.label));

  const dom = new Map<string, { attacks: number; wins: number }>();
  recent.forEach((r) => {
    if (!r.attackerFleet || r.attackerUid === PIRATE_OWNER_UID) return;
    const id = dominantUnit(r.attackerFleet);
    if (!id) return;
    const cur = dom.get(id) ?? { attacks: 0, wins: 0 };
    cur.attacks++;
    if (r.outcome === "attacker_win") cur.wins++;
    dom.set(id, cur);
  });
  const dominantUnits = [...dom.entries()]
    .map(([id, v]) => ({ id, name: UNITS.find((u) => u.id === id)?.name ?? id, attacks: v.attacks, winPct: pct(v.wins, v.attacks) }))
    .sort((a, b) => b.attacks - a.attacks);

  const factions = FACTIONS.map((f) => {
    const raids = recent.filter((r) => r.attackerUid === PIRATE_OWNER_UID && r.attackerPseudo.includes(f.name));
    const lairs = recent.filter((r) => r.defenderUid && factionOfLair(r.defenderUid) === f.id);
    return {
      id: f.id,
      name: f.name,
      raids: raids.length,
      repelledPct: pct(raids.filter((r) => r.outcome !== "attacker_win").length, raids.length),
      lairAssaults: lairs.length,
      lairWinPct: pct(lairs.filter((r) => r.outcome === "attacker_win").length, lairs.length),
    };
  });

  const active = players.filter((p) => now - seen(p) < 7 * DAY);
  const productionPerHour = Math.round(active.reduce((a, p) => a + sumValues(getProductionRatesPerSecond(p.buildings ?? {}, p.techLevels ?? {})) * 3600, 0));

  // Stock anormal : plus de 20 fois la médiane des autres joueurs (et au moins 1 M).
  const anomalies: GameStats["balance"]["anomalies"] = [];
  for (const r of RESOURCE_LIST) {
    for (const p of players) {
      const amount = p.resources?.[r.id] ?? 0;
      if (amount < 1_000_000) continue;
      const others = median(players.filter((o) => o !== p).map((o) => o.resources?.[r.id] ?? 0));
      const ratio = others > 0 ? amount / others : Infinity;
      if (ratio >= 20) anomalies.push({ pseudo: p.pseudo, resource: r.name, amount: Math.floor(amount), ratio: Number.isFinite(ratio) ? Math.round(ratio) : 0 });
    }
  }
  anomalies.sort((a, b) => b.amount - a.amount);

  return {
    windowDays,
    activity: {
      active1d: players.filter((p) => now - seen(p) < DAY).length,
      active7d: active.length,
      active30d: players.filter((p) => now - seen(p) < 30 * DAY).length,
      dormant,
    },
    rankAge,
    dominantUnits,
    factions,
    flows: {
      productionPerHour,
      spentTotal: players.reduce((a, p) => a + (p.stats?.spent ?? 0), 0),
      lootWindow: recent.filter((r) => r.attackerUid !== PIRATE_OWNER_UID).reduce((a, r) => a + sumValues(r.loot), 0),
      tradedTotal: players.reduce((a, p) => a + (p.stats?.traded ?? 0), 0),
      marketTrades: Math.round(players.reduce((a, p) => a + (p.stats?.marketTrades ?? 0), 0) / 2),
      marketTax: players.reduce((a, p) => a + (p.stats?.marketTax ?? 0), 0),
    },
    anomalies: anomalies.slice(0, 10),
  };
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
  for (const u of s.balance.dominantUnits) {
    if (u.attacks >= 5 && u.winPct >= 85) out.push(`Flottes dominées par « ${u.name} » : ${u.winPct} % de victoires sur ${u.attacks} attaques — trop efficace ?`);
    if (u.attacks >= 5 && u.winPct <= 20) out.push(`Flottes dominées par « ${u.name} » : seulement ${u.winPct} % de victoires — trop faible ?`);
  }
  for (const f of s.balance.factions) {
    if (f.raids >= 5 && f.repelledPct >= 90) out.push(`${f.name} : ${f.repelledPct} % des raids repoussés — faction trop faible ?`);
    if (f.raids >= 5 && f.repelledPct <= 20) out.push(`${f.name} : seulement ${f.repelledPct} % des raids repoussés — faction trop forte ?`);
  }
  if (s.balance.anomalies.length > 0) out.push(`${s.balance.anomalies.length} stock(s) anormalement élevé(s) à vérifier (section Équilibrage).`);
  return out;
}
