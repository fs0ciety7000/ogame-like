import { describe, expect, it } from "vitest";
import { BUILDINGS } from "@/game/buildings";
import { defaultPlayerState } from "@/game/defaults";
import { balanceHealth, bossHealth, casinoHealth, median, MOON_PVP_WINDOW_DAYS, moonPvpHealth, npcHealth } from "@/game/balance/health";
import { achievementsPace } from "@/game/balance/history";
import { casinoWeekId } from "@/game/casino";
import { ELITE_UNIT_IDS } from "@/game/units";
import type { PlayerState } from "@/types/game";

/* 6.0.1 (lot K) : santé de l'équilibre. */

const NOW = Date.UTC(2026, 9, 20, 12);

function player(uid: string, cls?: string): PlayerState {
  const p = { ...defaultPlayerState(uid, uid), createdAt: null } as unknown as PlayerState;
  for (const b of BUILDINGS) p.buildings[b.id] = { level: 10, unlocked: true };
  for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 1e8;
  p.resourcesUpdatedAtMs = NOW;
  if (cls) p.empireClass = { id: cls as "industriel", chosenAtMs: NOW, changes: 0 };
  return p;
}

describe("santé de l'équilibre", () => {
  it("médiane", () => {
    expect(median([])).toBe(0);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
  });

  it("agrège abri, butin, parallèle, alliances, routes et classes", () => {
    const a = player("a", "industriel");
    const b = player("b", "seigneur");
    const c = player("c");
    const h = balanceHealth(
      {
        players: [a, b, c],
        reports: [
          { attackerUid: "a", defenderUid: "b", outcome: "attacker_win", timestamp: NOW - 3_600_000, lootTotal: 2_000_000 },
          { attackerUid: "b", defenderUid: "a", outcome: "defender_win", timestamp: NOW - 3_600_000 },
          { attackerUid: "a", defenderUid: "c", outcome: "attacker_win", timestamp: NOW - 30 * 86_400_000, lootTotal: 9e9 },
        ],
        fleets: [
          { ownerUid: "a", mission: "attack" },
          { ownerUid: "a", mission: "recycle" },
          { ownerUid: "a", mission: "spy" },
          { ownerUid: "b", mission: "expedition" },
        ],
        builds: { a: 3, b: 1 },
        alliances: [{ members: ["a", "b"] }, { members: ["c"] }],
      },
      NOW,
      7,
    );
    expect(h.pvp.avgLoot).toBe(2_000_000);
    expect(h.pvp.battlesPerDay).toBeCloseTo(2 / 7, 1);
    expect(h.parallel.fleetsMax).toBe(2);
    expect(h.parallel.buildsMax).toBe(3);
    expect(h.parallel.buildsMedian).toBe(1);
    expect(h.alliances.sizes).toEqual([2, 1]);
    expect(h.classes.none).toBe(1);
    expect(h.classes.rows.find((r) => r.id === "industriel")?.players).toBe(1);
    expect(h.exposure.stockHours).toBeGreaterThan(0);
    expect(h.salvage.maxPct).toBeGreaterThanOrEqual(h.salvage.avgPct);
  });

  it("6.5.1 : emplacements pleins, sens des routes, files de défense, défenses et vaisseaux de classe", () => {
    const a = player("a", "industriel");
    const b = player("b");
    a.units.batterie_aa = { level: 1, count: 30 };
    b.units.batterie_aa = { level: 1, count: 10 };
    b.units.intercepteur = { level: 1, count: 5 };
    a.units.recolteur = { level: 2, count: 7 };
    a.colonies = [
      { id: "a-c1", route: { everyHours: 6, keepPct: 0.5, nextAtMs: NOW, direction: "supply" }, defenseQueue: [{ unitId: "roquette", qty: 1, endTime: 0 }] },
      { id: "a-c2", route: { everyHours: 6, keepPct: 0.2, nextAtMs: NOW } },
    ] as never;
    const fleets = Array.from({ length: 10 }, () => ({ ownerUid: "b", mission: "attack" }));
    const h = balanceHealth({ players: [a, b], reports: [], fleets, builds: {}, alliances: [] }, NOW, 7);
    expect(h.parallel.fullSlotsPct).toBe(50);
    expect(h.colonies).toMatchObject({ colonies: 2, withRoute: 2, supply: 1, queued: 1 });
    expect(h.defenses[0]).toMatchObject({ id: "batterie_aa", total: 40, owners: 2 });
    expect(h.defenses.find((d) => d.id === "intercepteur")).toMatchObject({ total: 5, owners: 1 });
    expect(h.classUnits.find((c) => c.id === "recolteur")).toMatchObject({ total: 7, owners: 1 });
  });

  it("AU13 (COM-3) : volumes du commerce repris tels quels, échanges conclus par joueur et par semaine ; absent = non relevé", () => {
    const p = defaultPlayerState("a", "A") as PlayerState;
    const commerce = { marketCreated: 10, marketFilled: 6, auctionsCreated: 4, auctionsSold: 2, contractsCreated: 3, contractsDelivered: 2, gifts: 5 };
    const h = balanceHealth({ players: [p, { ...p, uid: "b" }], reports: [], fleets: [], builds: {}, alliances: [], commerce }, NOW, 7);
    expect(h.commerce).toEqual({ ...commerce, dealsPerPlayerWeek: 5 });
    expect(balanceHealth({ players: [p], reports: [], fleets: [], builds: {}, alliances: [] }, NOW, 7).commerce).toBeNull();
  });

  it("6.14.6 (BOSS-2) : boss abattus par type sur 8 semaines", () => {
    const day = 86_400_000;
    const e = (kind: "leviathan" | "seasonboss" | "allianceboss", won: boolean, ago: number, dmg: number, participants = 4) => ({
      kind,
      won,
      endedAtMs: NOW - ago * day,
      maxHp: 1000,
      totalDamage: dmg,
      participants,
    });
    const b = bossHealth(
      [e("leviathan", true, 1, 1000, 10), e("leviathan", false, 8, 400, 2), e("leviathan", true, 15, 1200, 6), e("leviathan", false, 80, 0), e("allianceboss", false, 3, 250)],
      NOW,
    );
    const lev = b.rows.find((r) => r.kind === "leviathan")!;
    expect(b.windowDays).toBe(56);
    expect([lev.fought, lev.won, lev.winPct]).toEqual([3, 2, 67]);
    expect(lev.medianParticipants).toBe(6);
    expect(lev.medianDamagePct).toBe(100);
    expect(b.rows.find((r) => r.kind === "seasonboss")).toMatchObject({ fought: 0, winPct: 0 });
    expect(b.rows.find((r) => r.kind === "allianceboss")).toMatchObject({ fought: 1, won: 0, medianDamagePct: 25 });
    // Sans historique fourni, la mesure n'est pas relevée.
    expect(balanceHealth({ players: [], reports: [], fleets: [], builds: {}, alliances: [] }, NOW).bosses).toBeNull();
  });
});

describe("6.14.19 (A29-2) : santé complétée", () => {
  it("raids repoussés et repaires pris (PNJ-4)", () => {
    const r = (a: string, d: string, outcome: string) => ({ attackerUid: a, defenderUid: d, outcome, timestamp: NOW });
    const out = npcHealth([r("pirates", "a", "defender_win"), r("pirates", "b", "defender_win"), r("pirates", "c", "attacker_win"), r("a", "lair_1", "attacker_win"), r("a", "b", "attacker_win")] as never, 7);
    expect(out).toEqual({ raids: 3, raidsRepelledPct: 67, lairs: 1, lairsTakenPct: 100, windowDays: 7 });
  });

  it("élites, casino de la semaine et pot commun (PNJ-5, COM-3)", () => {
    const a = player("a");
    const b = player("b");
    a.units = { ...a.units, [ELITE_UNIT_IDS[0]]: { level: 1, count: 0 } };
    a.casino = { tokens: 0, dailyDay: "", spins: 9, wins: 1, jackpots: 1, week: { id: casinoWeekId(NOW), spins: 4, wins: 1, points: 0, resources: {} } } as unknown as PlayerState["casino"];
    b.casino = { tokens: 0, dailyDay: "", spins: 3, wins: 0, jackpots: 0, week: { id: "ancienne", spins: 3, wins: 0, points: 0, resources: {} } } as unknown as PlayerState["casino"];
    const h = balanceHealth({ players: [a, b], reports: [], fleets: [], builds: {}, alliances: [], serverPot: { resources: { scrap: 1000 }, totals: { market: { scrap: 3000 }, gift: { scrap: 1000 } }, amber: 12 } }, NOW);
    expect(h.elites.players).toBe(1);
    expect(h.elites.sharePct).toBe(50);
    expect(h.casino.playersPct).toBe(50);
    expect(h.casino.medianSpins).toBe(4);
    expect(h.casino.jackpots).toBe(1);
    expect(h.casino.pot?.value).toBe(1000);
    expect(h.casino.pot?.amber).toBe(12);
    expect(h.casino.pot?.inflows.map((x) => [x.source, x.sharePct])).toEqual([["market", 75], ["gift", 25]]);
    // Sans pot transmis : non relevé.
    expect(casinoHealth([a], NOW).pot).toBeNull();
  });

  it("rythme des succès sur 7 jours (PRG-5)", () => {
    const snap = (day: string, achievementsPct: number) => ({ day, achievementsPct }) as never;
    expect(achievementsPace([snap("2026-10-01", 10), snap("2026-10-05", 14), snap("2026-10-08", 20)])).toBe(10);
    expect(achievementsPace([snap("2026-10-05", 14), snap("2026-10-08", 20)])).toBeNull();
    expect(achievementsPace([])).toBeNull();
  });
});

describe("6.14.77 (É30-1f) : victoires de l'attaquant avec ou sans lune", () => {
  const H = 3_600_000;
  const r = (outcome: "attacker_win" | "defender_win" | "draw", moon: number | null | undefined, ageMs = H, attackerUid = "a1") => ({
    attackerUid,
    defenderUid: "d1",
    outcome,
    timestamp: NOW - ageMs,
    defenderMoonLevel: moon,
  });

  it("sépare les combats JcJ par lune du défenseur, sur 30 jours", () => {
    const h = moonPvpHealth(
      [
        r("attacker_win", 2),
        r("defender_win", 1),
        r("defender_win", 4),
        r("defender_win", 3),
        r("attacker_win", 0),
        r("attacker_win", 0),
        r("draw", 0),
        r("attacker_win", null), // rapport d'avant 6.14.77
        r("attacker_win", undefined),
        r("attacker_win", 3, 31 * 24 * H), // hors fenêtre
        r("attacker_win", 3, H, "pirates"), // pas du JcJ
      ],
      NOW,
    );
    expect(MOON_PVP_WINDOW_DAYS).toBe(30);
    expect(h.windowDays).toBe(30);
    expect(h.withMoon).toEqual({ battles: 4, attackerWins: 1, winPct: 25 });
    expect(h.withoutMoon).toEqual({ battles: 3, attackerWins: 2, winPct: 67 });
    expect(h.unknown).toBe(2);
  });

  it("sans combat : taux à 0, et la santé porte la mesure", () => {
    const empty = moonPvpHealth([], NOW);
    expect(empty.withMoon).toEqual({ battles: 0, attackerWins: 0, winPct: 0 });
    expect(empty.unknown).toBe(0);
    const health = balanceHealth({ players: [], reports: [r("attacker_win", 2, 20 * 24 * H)], fleets: [], builds: {}, alliances: [] }, NOW, 7);
    // Fenêtre propre (30 j), indépendante de celle de la santé (7 j).
    expect(health.moonPvp.withMoon.battles).toBe(1);
    expect(health.pvp.battlesPerDay).toBe(0);
  });
});
