import { getRepairPercent } from "@/game/buildings";
import { exposureView } from "@/game/economy";
import { EMPIRE_CLASSES } from "@/game/empireClass";
import { economySnapshot } from "@/game/economy";
import { SLOT_FREE_MISSIONS } from "@/game/fleets";
import { withRepairBonus } from "@/game/modifiers";
import { isPvpReport } from "@/game/balance/combatTypes";
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
  parallel: { buildsMedian: number; buildsMax: number; fleetsMedian: number; fleetsMax: number };
  alliances: { count: number; sizes: number[] };
  colonies: { colonies: number; withRoute: number };
  classes: { none: number; rows: { id: string; name: string; players: number; sharePct: number; medianProduction: number }[] };
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
  // Colonies.
  const colonies = players.flatMap((p) => p.colonies ?? []);
  // Classes.
  const prodOf = (p: PlayerState) => Object.values(economySnapshot(p, now).gross).reduce((a: number, b) => a + (b ?? 0), 0) * 3600;
  const rows = EMPIRE_CLASSES.map((c) => {
    const who = players.filter((p) => p.empireClass?.id === c.id);
    return { id: c.id, name: c.name, players: who.length, sharePct: players.length ? Math.round((who.length / players.length) * 100) : 0, medianProduction: Math.round(median(who.map(prodOf))) };
  });
  return {
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
    parallel: { buildsMedian: median(builds), buildsMax: builds.length ? Math.max(...builds) : 0, fleetsMedian: median(fleets), fleetsMax: fleets.length ? Math.max(...fleets) : 0 },
    alliances: { count: input.alliances.length, sizes: input.alliances.map((a) => a.members.length).sort((a, b) => b - a) },
    colonies: { colonies: colonies.length, withRoute: colonies.filter((c) => !!c.route).length },
    classes: { none: players.filter((p) => !p.empireClass).length, rows },
  };
}
