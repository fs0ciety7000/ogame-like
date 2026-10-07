import { getRepairPercent } from "@/game/buildings";
import { exposureView } from "@/game/economy";
import { EMPIRE_CLASSES } from "@/game/empireClass";
import { economySnapshot } from "@/game/economy";
import { fleetSlots, SLOT_FREE_MISSIONS } from "@/game/fleets";
import { CLASS_UNIT_IDS, DEFENSIVE_UNITS, findUnit } from "@/game/units";
import { withRepairBonus } from "@/game/modifiers";
import { ACHIEVEMENTS } from "@/game/achievements";
import { passState, PASS_RULES, activePass } from "@/game/seasonPass";
import { parisOffsetMs } from "@/game/events";
import { isPvpReport } from "@/game/balance/combatTypes";
import { BOSS_KIND_LABELS, type BossHistoryEntry, type BossKind } from "@/game/bossHistory";
import type { BattleReport, PlayerState } from "@/types/game";

/* =====================================================
   6.0.1 (lot K, feuille-de-route-2026-hiver.md) : santé de l'équilibre.
   Les relevés faits à la main sur la production (abri, butin, chantiers,
   flottes, alliances, routes, classes) calculés par le serveur pour
   l'onglet Équilibrage, sans accès direct aux données des joueurs.
===================================================== */

export interface HealthReport extends Pick<BattleReport, "attackerUid" | "defenderUid" | "outcome" | "timestamp"> {
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
  bossHistory?: Pick<BossHistoryEntry, "kind" | "endedAtMs" | "won" | "participants" | "maxHp" | "totalDamage">[];
}

/** 6.14.6 (BOSS-2) : fenêtre de la mesure des boss (8 semaines : un boss mondial par semaine en alternance). */
export const BOSS_HEALTH_WINDOW_DAYS = 56;

export interface BossHealthRow {
  kind: BossKind;
  label: string;
  fought: number;
  won: number;
  winPct: number;
  medianParticipants: number;
  /** Dégâts infligés en % des PV du boss (médiane, plafonnée à 100). */
  medianDamagePct: number;
}

/** 6.14.6 (BOSS-2) : taux de boss abattus par type sur la fenêtre (combats terminés). */
export function bossHealth(entries: NonNullable<HealthInput["bossHistory"]>, now: number, windowDays = BOSS_HEALTH_WINDOW_DAYS): { windowDays: number; rows: BossHealthRow[] } {
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
    };
  });
  return { windowDays, rows };
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
  /** 6.14.6 (BOSS-2) : boss abattus par type (null : non relevé). */
  bosses: { windowDays: number; rows: BossHealthRow[] } | null;
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
  const rows = EMPIRE_CLASSES.map((c) => {
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
  return {
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
  };
}
