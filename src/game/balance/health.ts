import { getRepairPercent } from "@/game/buildings";
import { exposureView } from "@/game/economy";
import { empireClasses } from "@/game/empireClass";
import { economySnapshot } from "@/game/economy";
import { fleetSlots, SLOT_FREE_MISSIONS } from "@/game/fleets";
import { CLASS_UNIT_IDS, DEFENSIVE_UNITS, ELITE_UNIT_IDS, findUnit } from "@/game/units";
import { casinoWeekId, playerCasino } from "@/game/casino";
import { normalizeServerPot, POT_SOURCE_LABELS, potValue, type PotSource } from "@/game/serverPot";
import { withRepairBonus } from "@/game/modifiers";
import { moonLevel, playerMoon } from "@/game/moon";
import { ACHIEVEMENTS } from "@/game/achievements";
import { passState, PASS_RULES, activePass } from "@/game/seasonPass";
import { parisOffsetMs } from "@/game/events";
import { combatKind, isPvpReport } from "@/game/balance/combatTypes";
import { BOSS_KIND_LABELS, type BossHistoryEntry, type BossKind } from "@/game/bossHistory";
import { AMBER_SOURCE_LABELS, AMBER_SOURCES, amberWeeks, firstAscensionAtMs, productionLossShare, type AmberBySource, type ChestTrace } from "@/game/healthTrace";
import { ascensionCount } from "@/game/ascension";
import { EXCHANGE_RULES, exchangeRareUsed } from "@/game/resources";
import { defeatLimitUntil, PVP_RULES } from "@/game/pvp";
import { BALANCE_HEALTH_RULES } from "@/game/balance/healthRules";
import type { BattleReport, PlayerState } from "@/types/game";

/* =====================================================
   6.0.1 (lot K, feuille-de-route-2026-hiver.md) : santé de l'équilibre.
   Les relevés faits à la main sur la production (abri, butin, chantiers,
   flottes, alliances, routes, classes) calculés par le serveur pour
   l'onglet Équilibrage, sans accès direct aux données des joueurs.
===================================================== */

export interface HealthReport extends Pick<BattleReport, "attackerUid" | "defenderUid" | "outcome" | "timestamp" | "defenderMoonLevel"> {
  /** Butin total (toutes ressources), si connu. */
  lootTotal?: number;
}

export interface HealthInput {
  /** Joueurs actifs comptés pour l'équilibrage. */
  players: PlayerState[];
  reports: HealthReport[];
  /** Flottes non terminées. */
  fleets: { ownerUid: string; mission: string }[];
  /** Chantiers de bâtiments en cours, par joueur. */
  builds: Record<string, number>;
  alliances: { members: string[] }[];
  /** AU13 (COM-3) : volumes du commerce sur la fenêtre, comptés par le serveur. */
  commerce?: CommerceCounts;
  /** 6.14.6 (BOSS-2) : combats de boss archivés (Hall of fame, `boss_history`). */
  bossHistory?: (Pick<BossHistoryEntry, "kind" | "endedAtMs" | "won" | "participants" | "maxHp" | "totalDamage"> & Partial<Pick<BossHistoryEntry, "startMs">>)[];
  /** 6.14.19 (A29-2, COM-3) : pot commun du serveur (game_config « server_pot »), brut. */
  serverPot?: unknown;
}

/** 6.14.6 (BOSS-2) : fenêtre de la mesure des boss (8 semaines : un boss mondial par semaine en alternance). */
const BOSS_HEALTH_WINDOW_DAYS = 56;

export interface BossHealthRow {
  kind: BossKind;
  label: string;
  fought: number;
  won: number;
  winPct: number;
  medianParticipants: number;
  /** Dégâts infligés en % des PV du boss (médiane, plafonnée à 100). */
  medianDamagePct: number;
  /** 6.14.107 (AE-L4, AE-10) : heures entre l'ouverture et la mort des boss abattus (médiane et quartiles ; null : aucun). */
  medianKillHours: number | null;
  q1KillHours: number | null;
  q3KillHours: number | null;
}

/** 6.14.107 : heures avant la mort des boss abattus (ouverture connue). */
function killHours(entries: NonNullable<HealthInput["bossHistory"]>): number[] {
  return entries.filter((e) => e.won && Number(e.startMs) > 0 && e.endedAtMs > Number(e.startMs)).map((e) => (e.endedAtMs - Number(e.startMs)) / 3_600_000);
}

/** 6.14.6 (BOSS-2) : taux de boss abattus par type sur la fenêtre (combats terminés). */
export function bossHealth(entries: NonNullable<HealthInput["bossHistory"]>, now: number, windowDays = BOSS_HEALTH_WINDOW_DAYS): BossHealth {
  const since = now - windowDays * 86_400_000;
  const recent = entries.filter((e) => e.endedAtMs >= since && e.endedAtMs <= now);
  const rows = (Object.keys(BOSS_KIND_LABELS) as BossKind[]).map((kind) => {
    const of = recent.filter((e) => e.kind === kind);
    const won = of.filter((e) => e.won).length;
    return {
      kind,
      label: BOSS_KIND_LABELS[kind],
      fought: of.length,
      won,
      winPct: of.length ? Math.round((won / of.length) * 100) : 0,
      medianParticipants: median(of.map((e) => e.participants || 0)),
      medianDamagePct: Math.round(median(of.map((e) => (e.maxHp > 0 ? Math.min(1, (e.totalDamage || 0) / e.maxHp) : 0))) * 100),
      ...killStats(killHours(of)),
    };
  });
  const won = recent.filter((e) => e.won).length;
  const all = killStats(killHours(recent));
  return { windowDays, rows, total: { fought: recent.length, won, winPct: recent.length ? Math.round((won / recent.length) * 100) : 0, ...all } };
}

function killStats(hours: number[]): { medianKillHours: number | null; q1KillHours: number | null; q3KillHours: number | null } {
  if (!hours.length) return { medianKillHours: null, q1KillHours: null, q3KillHours: null };
  return { medianKillHours: round1(median(hours)), q1KillHours: round1(quantile(hours, 0.25)), q3KillHours: round1(quantile(hours, 0.75)) };
}

export interface BossHealth {
  windowDays: number;
  rows: BossHealthRow[];
  /** 6.14.107 (AE-L4) : tous types réunis (part abattue, heures avant la mort). */
  total: { fought: number; won: number; winPct: number; medianKillHours: number | null; q1KillHours: number | null; q3KillHours: number | null };
}

/** AU13 (COM-3) : volumes du commerce sur la fenêtre (offres du marchand PNJ exclues). */
export interface CommerceCounts {
  marketCreated: number;
  marketFilled: number;
  auctionsCreated: number;
  auctionsSold: number;
  contractsCreated: number;
  contractsDelivered: number;
  gifts: number;
}

export interface BalanceHealth {
  exposure: {
    /** Médianes en heures de production (ressources communes additionnées). */
    stockHours: number;
    protectedHours: number;
    pillableHours: number;
    /** Part des joueurs qui ont quelque chose de pillable. */
    pillablePlayersPct: number;
  };
  pvp: { battlesPerDay: number; avgLoot: number; windowDays: number };
  salvage: { avgPct: number; maxPct: number };
  /** 6.5.1 (lot U) : fullSlotsPct = part des joueurs dont tous les emplacements de flotte sont pris. */
  parallel: { buildsMedian: number; buildsMax: number; fleetsMedian: number; fleetsMax: number; fullSlotsPct: number };
  alliances: { count: number; sizes: number[] };
  /** 6.5.1 : supply = routes de ravitaillement (planète mère → colonie), queued = colonies avec des défenses en file. */
  colonies: { colonies: number; withRoute: number; supply: number; queued: number };
  /** 6.5.1 : défenses construites par type (total chez les joueurs actifs, nombre de joueurs qui en ont). */
  defenses: { id: string; name: string; total: number; owners: number }[];
  /** 6.5.1 : vaisseaux de classe (6.5). */
  classUnits: { id: string; name: string; total: number; owners: number }[];
  classes: { none: number; rows: { id: string; name: string; players: number; sharePct: number; medianProduction: number }[] };
  /** 6.8.0 (AU3) : passe du mois : part des joueurs au dernier palier, jour médian de fin, points médians, points gagnés par source. */
  pass: { finishedPct: number; medianFinishDay: number | null; medianPoints: number; maxPoints: number; bySource: { source: string; total: number; sharePct: number }[] };
  /** 6.8.0 (AU3) : succès obtenus par le joueur médian (sur le catalogue en vigueur). */
  achievements: { total: number; medianUnlocked: number; medianPct: number };
  /** AU13 (COM-3) : volumes du commerce sur la fenêtre et échanges conclus par joueur actif et par semaine (null : non relevé). */
  commerce: (CommerceCounts & { dealsPerPlayerWeek: number }) | null;
  /** 6.14.6 (BOSS-2) : boss abattus par type (null : non relevé). 6.14.107 : heures avant la mort, total tous types. */
  bosses: BossHealth | null;
  /** 6.14.19 (A29-2, PNJ-4) : raids de faction sur la fenêtre (part repoussée, cible 60 à 80 %) et repaires attaqués (part prise). */
  npc: { raids: number; raidsRepelledPct: number; lairs: number; lairsTakenPct: number; windowDays: number };
  /** 6.14.19 (A29-2, PNJ-5) : unités d'élite débloquées (joueurs, part des actifs) et possédées par type. */
  elites: { players: number; sharePct: number; rows: { id: string; name: string; total: number; owners: number }[] };
  /** 6.14.19 (A29-2, COM-3) : casino de la semaine (joueurs qui ont joué, tirages médians de ceux-là, gros lots cumulés)
   *  et pot commun (valeur en ressources communes, Ambre, entrées par source ; null : non relevé). */
  casino: {
    playersPct: number;
    medianSpins: number;
    jackpots: number;
    pot: { value: number; amber: number; inflows: { source: string; label: string; value: number; sharePct: number }[] } | null;
  };
  /** 6.14.69 (É30-1d, risque R1 de proposals/phalange-porte-de-saut.md) : lunes chez les actifs (part, niveau médian, nées par
   *  pitié, réserve de pitié en cours) et usage de la phalange et de la porte (cumuls des compteurs, joueurs qui s'en servent). */
  moons: {
    players: number;
    sharePct: number;
    medianLevel: number;
    byPity: number;
    pityPending: number;
    scans: number;
    scanners: number;
    jumps: number;
    jumpers: number;
    saves: number;
  };
  /** 6.14.77 (É30-1f) : victoires de l'attaquant en JcJ contre une cible avec ou sans lune, sur `windowDays` (30 j). `unknown` :
   *  combats sans niveau de lune relevé (rapports d'avant 6.14.77), écartés des deux taux. */
  moonPvp: MoonPvpHealth;
  /** 6.14.107 (AE-L4, AE-11) : Ambre gagnée par source, semaine précédente (complète) et semaine en cours. */
  amber: AmberHealth;
  /** 6.14.107 (AE-L4) : 1re Ascension (jours après l'inscription, joueurs qui l'ont faite). */
  ascension: AscensionHealth;
  /** 6.14.107 (AE-L4, AE-5, AE-15) : production perdue à entrepôt plein et écart de production entre quartiles. */
  production: ProductionHealth;
  /** 6.14.107 (AE-L4) : suivi des choix d'AE-L3 (coffre Q267, comptoir Q268, protections Q269). */
  choices: ChoicesHealth;
  /** 6.14.107 (AE-L4) : seuils d'alerte (`BALANCE_HEALTH_RULES`) comparés aux mesures. */
  alerts: HealthAlert[];
}

export interface AmberSourceRow {
  source: string;
  label: string;
  total: number;
  sharePct: number;
}

export interface AmberHealth {
  /** Semaine précédente (lundi, AAAA-MM-JJ) et semaine en cours. */
  lastWeek: string;
  week: string;
  last: { total: number; earners: number; medianPerPlayer: number; p90PerPlayer: number; topRatio: number | null; bySource: AmberSourceRow[] };
  current: { total: number; earners: number; bySource: AmberSourceRow[] };
}

export interface AscensionHealth {
  /** Actifs qui ont fait au moins une Ascension, et part des actifs. */
  ascended: number;
  sharePct: number;
  /** Joueurs dont le jour de la 1re Ascension est connu. */
  measured: number;
  medianDay: number | null;
  q1Day: number | null;
  q3Day: number | null;
}

export interface ProductionHealth {
  /** Production perdue à entrepôt plein, en % de la production possible (dernière semaine complète, sinon en cours). */
  measured: number;
  lostMedianPct: number | null;
  lostQ1Pct: number | null;
  lostQ3Pct: number | null;
  /** Production horaire (toutes ressources) : quartiles des actifs et rapport Q3 ÷ Q1. */
  q1: number;
  median: number;
  q3: number;
  spreadRatio: number | null;
}

export interface ChoicesHealth {
  chest: { windowDays: number; count: number; medianCommon: number; allFloorPct: number; anyFloorPct: number };
  exchange: { cap: number; users: number; atCap: number; atCapPct: number; nearCap: number };
  defeats: { windowDays: number; max: number; protections: number; players: number; sharePct: number };
}

export interface HealthAlert {
  id: string;
  label: string;
  /** Valeur mesurée et cible, en texte. */
  value: string;
  target: string;
  ok: boolean;
}

export interface MoonPvpSide {
  battles: number;
  attackerWins: number;
  /** Part des combats gagnés par l'attaquant (0 sans combat). */
  winPct: number;
}

export interface MoonPvpHealth {
  windowDays: number;
  withMoon: MoonPvpSide;
  withoutMoon: MoonPvpSide;
  unknown: number;
}

/** 6.14.77 (É30-1f) : fenêtre de la mesure « victoires de l'attaquant avec ou sans lune ». */
export const MOON_PVP_WINDOW_DAYS = 30;

/** 6.14.107 : quantile par interpolation linéaire (0 sans valeur). */
export function quantile(xs: number[], q: number): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const pos = Math.min(1, Math.max(0, q)) * (s.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return s[lo] + (s[hi] - s[lo]) * (pos - lo);
}

export function median(xs: number[]): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

const round1 = (x: number) => Math.round(x * 10) / 10;

export function balanceHealth(input: HealthInput, now: number, windowDays = 7): BalanceHealth {
  const players = input.players;
  // Abri et stock, en heures de production.
  const stock: number[] = [];
  const prot: number[] = [];
  const pill: number[] = [];
  let pillable = 0;
  for (const p of players) {
    const view = exposureView(p, now);
    const hourly = view.lines.reduce((a, l) => a + l.hourly, 0);
    if (!(hourly > 0)) continue;
    const s = view.lines.reduce((a, l) => a + l.stock, 0);
    const shown = view.lines.reduce((a, l) => a + Math.min(l.stock, view.active ? l.protectedNow : l.protectedSoon), 0);
    const protectedCap = view.lines.reduce((a, l) => a + (view.active ? l.protectedNow : l.protectedSoon), 0);
    stock.push(s / hourly);
    prot.push(protectedCap / hourly);
    pill.push(Math.max(0, s - shown) / hourly);
    if (s - shown > 0) pillable++;
  }
  // JcJ sur la fenêtre.
  const since = now - windowDays * 86_400_000;
  const pvp = input.reports.filter((r) => r.timestamp >= since && isPvpReport(r));
  const wins = pvp.filter((r) => r.outcome === "attacker_win" && typeof r.lootTotal === "number");
  // Sauvetage (Atelier, Cale orbitale, bonus d'empire).
  const salvage = players.map((p) => withRepairBonus(getRepairPercent(p.buildings), p));
  // Flottes en vol qui occupent un emplacement.
  const fleetsBy: Record<string, number> = {};
  for (const f of input.fleets) if (!SLOT_FREE_MISSIONS.includes(f.mission)) fleetsBy[f.ownerUid] = (fleetsBy[f.ownerUid] ?? 0) + 1;
  const uids = players.map((p) => p.uid);
  const builds = uids.map((u) => input.builds[u] ?? 0);
  const fleets = uids.map((u) => fleetsBy[u] ?? 0);
  const fullSlots = players.filter((p) => (fleetsBy[p.uid] ?? 0) >= fleetSlots(p)).length;
  // Unités possédées (planète mère), par type.
  const owned = (ids: string[]) =>
    ids
      .map((id) => {
        const counts = players.map((p) => p.units?.[id]?.count ?? 0);
        return { id, name: findUnit(id)?.name ?? id, total: counts.reduce((a, b) => a + b, 0), owners: counts.filter((n) => n > 0).length };
      })
      .sort((a, b) => b.total - a.total);
  // Colonies.
  const colonies = players.flatMap((p) => p.colonies ?? []);
  // Classes.
  const prodOf = (p: PlayerState) => Object.values(economySnapshot(p, now).gross).reduce((a: number, b) => a + (b ?? 0), 0) * 3600;
  const production = productionHealth(players, now, prodOf);
  const rows = empireClasses().map((c) => {
    const who = players.filter((p) => p.empireClass?.id === c.id);
    return { id: c.id, name: c.name, players: who.length, sharePct: players.length ? Math.round((who.length / players.length) * 100) : 0, medianProduction: Math.round(median(who.map(prodOf))) };
  });
  // Passe du mois (6.8.0).
  const passes = players.map((p) => passState(p, now));
  const maxPoints = activePass(passes[0]?.seasonId).tiers.length * (activePass(passes[0]?.seasonId).pointsPerTier || PASS_RULES.pointsPerTier);
  const finished = passes.filter((s) => s.points >= maxPoints);
  const finishDays = passes.filter((s) => s.finishedAtMs).map((s) => new Date(s.finishedAtMs! + parisOffsetMs(s.finishedAtMs!)).getUTCDate());
  const sources: Record<string, number> = {};
  for (const s of passes) for (const [k, v] of Object.entries(s.bySource ?? {})) sources[k] = (sources[k] ?? 0) + v;
  const sourceTotal = Object.values(sources).reduce((a, b) => a + b, 0);
  const unlocked = players.map((p) => (p.unlockedAchievements ?? []).length);
  const achTotal = ACHIEVEMENTS.length;
  const extras = { amber: amberHealth(players, now), ascension: ascensionHealth(players), production, choices: choicesHealth(players, input.reports, now) };
  const out: BalanceHealth = {
    pass: {
      finishedPct: players.length ? Math.round((finished.length / players.length) * 100) : 0,
      medianFinishDay: finishDays.length ? median(finishDays) : null,
      medianPoints: Math.round(median(passes.map((s) => s.points))),
      maxPoints,
      bySource: Object.entries(sources)
        .map(([source, total]) => ({ source, total, sharePct: sourceTotal ? Math.round((total / sourceTotal) * 100) : 0 }))
        .sort((a, b) => b.total - a.total),
    },
    achievements: { total: achTotal, medianUnlocked: median(unlocked), medianPct: achTotal ? Math.round((median(unlocked) / achTotal) * 100) : 0 },
    exposure: {
      stockHours: round1(median(stock)),
      protectedHours: round1(median(prot)),
      pillableHours: round1(median(pill)),
      pillablePlayersPct: stock.length ? Math.round((pillable / stock.length) * 100) : 0,
    },
    pvp: {
      battlesPerDay: round1(pvp.length / windowDays),
      avgLoot: wins.length ? Math.round(wins.reduce((a, r) => a + (r.lootTotal ?? 0), 0) / wins.length) : 0,
      windowDays,
    },
    salvage: {
      avgPct: salvage.length ? Math.round((salvage.reduce((a, b) => a + b, 0) / salvage.length) * 100) : 0,
      maxPct: salvage.length ? Math.round(Math.max(...salvage) * 100) : 0,
    },
    parallel: { buildsMedian: median(builds), buildsMax: builds.length ? Math.max(...builds) : 0, fleetsMedian: median(fleets), fleetsMax: fleets.length ? Math.max(...fleets) : 0, fullSlotsPct: players.length ? Math.round((fullSlots / players.length) * 100) : 0 },
    alliances: { count: input.alliances.length, sizes: input.alliances.map((a) => a.members.length).sort((a, b) => b - a) },
    colonies: { colonies: colonies.length, withRoute: colonies.filter((c) => !!c.route).length, supply: colonies.filter((c) => c.route?.direction === "supply").length, queued: colonies.filter((c) => (c.defenseQueue?.length ?? 0) > 0).length },
    defenses: owned(DEFENSIVE_UNITS),
    classUnits: owned(CLASS_UNIT_IDS),
    classes: { none: players.filter((p) => !p.empireClass).length, rows },
    commerce: input.commerce
      ? {
          ...input.commerce,
          dealsPerPlayerWeek: players.length
            ? round1(((input.commerce.marketFilled + input.commerce.auctionsSold + input.commerce.contractsDelivered) / players.length) * (7 / Math.max(1, windowDays)))
            : 0,
        }
      : null,
    bosses: input.bossHistory ? bossHealth(input.bossHistory, now) : null,
    npc: npcHealth(input.reports.filter((r) => r.timestamp >= since), windowDays),
    elites: (() => {
      const who = players.filter((p) => ELITE_UNIT_IDS.some((id) => !!p.units?.[id])).length;
      return { players: who, sharePct: players.length ? Math.round((who / players.length) * 100) : 0, rows: owned(ELITE_UNIT_IDS) };
    })(),
    casino: casinoHealth(players, now, input.serverPot),
    moons: moonHealth(players),
    moonPvp: moonPvpHealth(input.reports, now),
    ...extras,
    alerts: [],
  };
  out.alerts = healthAlerts(out);
  return out;
}

/** 6.14.77 (É30-1f) : combats JcJ de la fenêtre partagés selon la lune du défenseur au moment du combat (`defenderMoonLevel`). */
export function moonPvpHealth(
  reports: Pick<HealthReport, "attackerUid" | "defenderUid" | "outcome" | "timestamp" | "defenderMoonLevel">[],
  now: number,
  windowDays = MOON_PVP_WINDOW_DAYS,
): MoonPvpHealth {
  const since = now - windowDays * 86_400_000;
  const pvp = reports.filter((r) => r.timestamp >= since && r.timestamp <= now && isPvpReport(r));
  const known = pvp.filter((r) => typeof r.defenderMoonLevel === "number" && Number.isFinite(r.defenderMoonLevel));
  const side = (rows: typeof known): MoonPvpSide => {
    const wins = rows.filter((r) => r.outcome === "attacker_win").length;
    return { battles: rows.length, attackerWins: wins, winPct: rows.length ? Math.round((wins / rows.length) * 100) : 0 };
  };
  return {
    windowDays,
    withMoon: side(known.filter((r) => (r.defenderMoonLevel as number) > 0)),
    withoutMoon: side(known.filter((r) => (r.defenderMoonLevel as number) <= 0)),
    unknown: pvp.length - known.length,
  };
}

/** 6.14.69 (É30-1d) : lunes et usage de la phalange et de la porte de saut chez les joueurs actifs. */
export function moonHealth(players: Pick<PlayerState, "moon" | "moonPity" | "stats">[]): BalanceHealth["moons"] {
  const moons = players.map((p) => playerMoon(p)).filter((m): m is NonNullable<typeof m> => !!m);
  const count = (k: "phalanxScans" | "gateJumps" | "gateSaves") => players.map((p) => Math.max(0, Math.floor(Number(p.stats?.[k]) || 0)));
  const scans = count("phalanxScans");
  const jumps = count("gateJumps");
  const total = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
  return {
    players: moons.length,
    sharePct: players.length ? Math.round((moons.length / players.length) * 100) : 0,
    medianLevel: median(moons.map((m) => moonLevel(m))),
    byPity: moons.filter((m) => m.byPity === true).length,
    pityPending: players.filter((p) => !playerMoon(p) && (Number(p.moonPity) || 0) > 0).length,
    scans: total(scans),
    scanners: scans.filter((n) => n > 0).length,
    jumps: total(jumps),
    jumpers: jumps.filter((n) => n > 0).length,
    saves: total(count("gateSaves")),
  };
}

/** 6.14.19 (A29-2, PNJ-4) : raids de faction et repaires sur les rapports de la fenêtre. */
export function npcHealth(reports: Pick<HealthReport, "attackerUid" | "defenderUid" | "outcome">[], windowDays: number): BalanceHealth["npc"] {
  const raids = reports.filter((r) => combatKind(r) === "raid");
  const lairs = reports.filter((r) => combatKind(r) === "lair");
  const pct = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);
  return {
    raids: raids.length,
    raidsRepelledPct: pct(raids.filter((r) => r.outcome === "defender_win").length, raids.length),
    lairs: lairs.length,
    lairsTakenPct: pct(lairs.filter((r) => r.outcome === "attacker_win").length, lairs.length),
    windowDays,
  };
}

/** 6.14.19 (A29-2, COM-3) : casino de la semaine en cours et pot commun. */
export function casinoHealth(players: PlayerState[], now: number, rawPot?: unknown): BalanceHealth["casino"] {
  const week = casinoWeekId(now);
  const spins = players.map((p) => playerCasino(p)).map((c) => (c.week.id === week ? c.week.spins : 0));
  const played = spins.filter((n) => n > 0);
  const jackpots = players.reduce((a, p) => a + playerCasino(p).jackpots, 0);
  let pot: BalanceHealth["casino"]["pot"] = null;
  if (rawPot !== undefined) {
    const sp = normalizeServerPot(rawPot);
    const inflows = (Object.keys(POT_SOURCE_LABELS) as PotSource[])
      .map((source) => ({ source, label: POT_SOURCE_LABELS[source], value: Math.round(potValue(sp.totals[source] ?? {})) }))
      .filter((r) => r.value > 0);
    const total = inflows.reduce((a, r) => a + r.value, 0);
    pot = {
      value: Math.round(potValue(sp.resources)),
      amber: Math.floor(sp.amber || 0),
      inflows: inflows.map((r) => ({ ...r, sharePct: total ? Math.round((r.value / total) * 100) : 0 })).sort((a, b) => b.value - a.value),
    };
  }
  return { playersPct: players.length ? Math.round((played.length / players.length) * 100) : 0, medianSpins: median(played), jackpots, pot };
}

/* ---------- 6.14.107 (AU27, lot AE-L4) : santé de l'équilibre complétée ---------- */

const DAY_MS = 86_400_000;
const pct = (n: number, d: number) => (d > 0 ? Math.round((n / d) * 100) : 0);

function sourceRows(by: AmberBySource): AmberSourceRow[] {
  const total = AMBER_SOURCES.reduce((a, k) => a + (by[k] ?? 0), 0);
  return AMBER_SOURCES.filter((k) => (by[k] ?? 0) > 0)
    .map((k) => ({ source: k, label: AMBER_SOURCE_LABELS[k], total: by[k] ?? 0, sharePct: pct(by[k] ?? 0, total) }))
    .sort((a, b) => b.total - a.total);
}

/** Ambre gagnée par source chez les actifs : semaine précédente (complète, répartition par joueur) et semaine en cours. */
export function amberHealth(players: Pick<PlayerState, "stats">[], now: number): AmberHealth {
  const last: AmberBySource = {};
  const current: AmberBySource = {};
  const perPlayer: number[] = [];
  let currentEarners = 0;
  let week = "";
  for (const p of players) {
    const w = amberWeeks(p, now);
    week = w.week;
    let lp = 0;
    let cp = 0;
    for (const k of AMBER_SOURCES) {
      const l = w.last[k] ?? 0;
      const c = w.current[k] ?? 0;
      if (l > 0) last[k] = (last[k] ?? 0) + l;
      if (c > 0) current[k] = (current[k] ?? 0) + c;
      lp += l;
      cp += c;
    }
    if (lp > 0) perPlayer.push(lp);
    if (cp > 0) currentEarners++;
  }
  if (!week) week = amberWeeks({}, now).week;
  const lastWeek = new Date(Date.parse(`${week}T00:00:00Z`) - 7 * DAY_MS).toISOString().slice(0, 10);
  const med = median(perPlayer);
  const p90 = quantile(perPlayer, 0.9);
  const sum = (by: AmberBySource) => AMBER_SOURCES.reduce((a, k) => a + (by[k] ?? 0), 0);
  return {
    week,
    lastWeek,
    last: { total: sum(last), earners: perPlayer.length, medianPerPlayer: Math.round(med), p90PerPlayer: Math.round(p90), topRatio: med > 0 ? round1(p90 / med) : null, bySource: sourceRows(last) },
    current: { total: sum(current), earners: currentEarners, bySource: sourceRows(current) },
  };
}

/** 1re Ascension des actifs : jours après l'inscription (médiane et quartiles des joueurs dont la date est connue). */
export function ascensionHealth(players: Pick<PlayerState, "stats" | "ascensions" | "ascendedAtMs" | "createdAtMs">[]): AscensionHealth {
  const ascended = players.filter((p) => ascensionCount(p) > 0);
  const days: number[] = [];
  for (const p of ascended) {
    const first = firstAscensionAtMs(p);
    const created = Number(p.createdAtMs) || 0;
    if (first !== null && created > 0 && first >= created) days.push((first - created) / DAY_MS);
  }
  return {
    ascended: ascended.length,
    sharePct: pct(ascended.length, players.length),
    measured: days.length,
    medianDay: days.length ? round1(median(days)) : null,
    q1Day: days.length ? round1(quantile(days, 0.25)) : null,
    q3Day: days.length ? round1(quantile(days, 0.75)) : null,
  };
}

/** Production perdue à entrepôt plein et écart de production horaire entre quartiles (`prodOf` : production horaire). */
export function productionHealth<P extends Pick<PlayerState, "stats">>(players: P[], now: number, prodOf: (p: P) => number): ProductionHealth {
  const lost = players.map((p) => productionLossShare(p, now)).filter((x): x is number => x !== null).map((x) => x * 100);
  const prod = players.map(prodOf).filter((x) => x > 0);
  const q1 = quantile(prod, 0.25);
  const q3 = quantile(prod, 0.75);
  return {
    measured: lost.length,
    lostMedianPct: lost.length ? round1(median(lost)) : null,
    lostQ1Pct: lost.length ? round1(quantile(lost, 0.25)) : null,
    lostQ3Pct: lost.length ? round1(quantile(lost, 0.75)) : null,
    q1: Math.round(q1),
    median: Math.round(median(prod)),
    q3: Math.round(q3),
    spreadRatio: q1 > 0 ? round1(q3 / q1) : null,
  };
}

/** Protections « trop de défaites » déclenchées sur la fenêtre : défaites en défense d'un joueur (toutes origines, comme
 *  `recentDefeatsMs` du serveur), une protection par défaite qui atteint le maximum hors d'une protection en cours. */
export function defeatProtections(
  reports: Pick<HealthReport, "attackerUid" | "defenderUid" | "outcome" | "timestamp">[],
  now: number,
  windowDays = 7,
  max: number = PVP_RULES.maxDefeatsPer24h,
): { protections: number; players: string[] } {
  const since = now - windowDays * DAY_MS;
  const byUid: Record<string, number[]> = {};
  for (const r of reports) {
    if (r.outcome !== "attacker_win" || r.timestamp > now || r.timestamp < since - DAY_MS) continue;
    const kind = combatKind(r);
    if (kind !== "pvp" && kind !== "reprisal" && kind !== "raid") continue;
    (byUid[r.defenderUid] = byUid[r.defenderUid] ?? []).push(r.timestamp);
  }
  let protections = 0;
  const who: string[] = [];
  for (const [uid, list] of Object.entries(byUid)) {
    const times = list.sort((a, b) => a - b);
    let until = 0;
    let hit = false;
    for (let i = 0; i < times.length; i++) {
      const t = times[i];
      if (t < until) continue;
      const end = defeatLimitUntil(times.slice(0, i + 1), t, max);
      if (end !== null && end > t) {
        until = end;
        if (t >= since) {
          protections++;
          hit = true;
        }
      }
    }
    if (hit) who.push(uid);
  }
  return { protections, players: who };
}

/** Suivi des choix d'AE-L3 : coffre du 7e jour (Q267), plafond du comptoir (Q268), protections après défaites (Q269). */
export function choicesHealth(players: PlayerState[], reports: HealthInput["reports"], now: number): ChoicesHealth {
  const R = BALANCE_HEALTH_RULES;
  const windowDays = Math.max(1, Math.floor(Number(R.chestWindowDays) || 14));
  const chests = players
    .map((p) => p.stats?.lastChest as ChestTrace | undefined)
    .filter((c): c is ChestTrace => !!c && Number(c.atMs) >= now - windowDays * DAY_MS && Number(c.atMs) <= now);
  const cap = Math.max(0, Number(EXCHANGE_RULES.weeklyRareCap) || 0);
  const used = players.map((p) => exchangeRareUsed(p, now));
  const def = defeatProtections(reports, now, 7);
  const human = new Set(players.map((p) => p.uid));
  const protectedActive = def.players.filter((u) => human.has(u)).length;
  return {
    chest: {
      windowDays,
      count: chests.length,
      medianCommon: Math.round(median(chests.map((c) => Number(c.common) || 0))),
      allFloorPct: pct(chests.filter((c) => c.n > 0 && c.floors >= c.n).length, chests.length),
      anyFloorPct: pct(chests.filter((c) => c.floors > 0).length, chests.length),
    },
    exchange: {
      cap,
      users: used.filter((n) => n > 0).length,
      atCap: cap > 0 ? used.filter((n) => n >= cap).length : 0,
      atCapPct: cap > 0 ? pct(used.filter((n) => n >= cap).length, players.length) : 0,
      nearCap: cap > 0 ? used.filter((n) => n >= cap * 0.8).length : 0,
    },
    defeats: { windowDays: 7, max: Math.floor(Number(PVP_RULES.maxDefeatsPer24h) || 0), protections: def.protections, players: protectedActive, sharePct: pct(protectedActive, players.length) },
  };
}

const fr = (x: number) => String(x).replace(".", ",");
/** Seuil réglé en part (0,2) lu en points de pourcentage (20). */
const P = (part: number) => Math.round((Number(part) || 0) * 1000) / 10;

/** Mesures comparées aux seuils réglables (`BALANCE_HEALTH_RULES`) ; une mesure sans donnée n'alerte pas. */
function healthAlerts(h: Omit<BalanceHealth, "alerts">): HealthAlert[] {
  const R = BALANCE_HEALTH_RULES;
  const out: HealthAlert[] = [];
  const bounty = h.amber.last.bySource.find((r) => r.source === "bounties")?.sharePct ?? 0;
  if (h.amber.last.total > 0) {
    out.push({ id: "amberBounties", label: "Ambre : part des primes (semaine passée)", value: `${bounty} %`, target: `≤ ${P(R.amberBountySharePct)} %`, ok: bounty <= P(R.amberBountySharePct) });
    if (h.amber.last.topRatio !== null)
      out.push({ id: "amberTop", label: "Ambre : 9e décile ÷ médiane", value: `×${fr(h.amber.last.topRatio)}`, target: `≤ ×${fr(R.amberTopRatio)}`, ok: h.amber.last.topRatio <= R.amberTopRatio });
  }
  if (h.bosses && h.bosses.total.fought > 0) {
    const t = h.bosses.total;
    out.push({ id: "bossKill", label: `Boss abattus (${h.bosses.windowDays} j)`, value: `${t.winPct} %`, target: `${P(R.bossKillLow)} à ${P(R.bossKillHigh)} %`, ok: t.winPct >= P(R.bossKillLow) && t.winPct <= P(R.bossKillHigh) });
    if (t.medianKillHours !== null)
      out.push({ id: "bossHours", label: "Boss : heures avant la mort (médiane)", value: `${fr(t.medianKillHours)} h`, target: `${R.bossKillHoursLow} à ${R.bossKillHoursHigh} h`, ok: t.medianKillHours >= R.bossKillHoursLow && t.medianKillHours <= R.bossKillHoursHigh });
  }
  if (h.ascension.medianDay !== null)
    out.push({ id: "ascension", label: "1re Ascension (jour médian)", value: `J${fr(h.ascension.medianDay)}`, target: `J${R.ascensionDayLow} à J${R.ascensionDayHigh}`, ok: h.ascension.medianDay >= R.ascensionDayLow && h.ascension.medianDay <= R.ascensionDayHigh });
  if (h.production.lostMedianPct !== null)
    out.push({ id: "productionLost", label: "Production perdue (médiane)", value: `${fr(h.production.lostMedianPct)} %`, target: `≤ ${P(R.productionLostPct)} %`, ok: h.production.lostMedianPct <= P(R.productionLostPct) });
  if (h.production.spreadRatio !== null)
    out.push({ id: "productionSpread", label: "Écart de production Q3 ÷ Q1", value: `×${fr(h.production.spreadRatio)}`, target: `≤ ×${fr(R.productionSpreadRatio)}`, ok: h.production.spreadRatio <= R.productionSpreadRatio });
  if (h.choices.chest.count > 0)
    out.push({ id: "chestFloor", label: "Coffres du 7e jour au plancher (Q267)", value: `${h.choices.chest.allFloorPct} %`, target: `≤ ${P(R.chestFloorPct)} %`, ok: h.choices.chest.allFloorPct <= P(R.chestFloorPct) });
  if (h.choices.exchange.cap > 0)
    out.push({ id: "exchangeCap", label: "Actifs au plafond du comptoir (Q268)", value: `${h.choices.exchange.atCapPct} %`, target: `≤ ${P(R.exchangeCapPlayersPct)} %`, ok: h.choices.exchange.atCapPct <= P(R.exchangeCapPlayersPct) });
  if (h.choices.defeats.max > 0)
    out.push({ id: "defeatProtected", label: "Actifs protégés après défaites, 7 j (Q269)", value: `${h.choices.defeats.sharePct} %`, target: `≤ ${P(R.defeatProtectedPct)} %`, ok: h.choices.defeats.sharePct <= P(R.defeatProtectedPct) });
  return out;
}
