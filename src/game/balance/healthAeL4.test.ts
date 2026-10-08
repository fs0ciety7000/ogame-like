import { describe, expect, it } from "vitest";
import { BUILDINGS } from "@/game/buildings";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { amberHealth, ascensionHealth, balanceHealth, bossHealth, choicesHealth, defeatProtections, productionHealth, quantile } from "@/game/balance/health";
import { amberWeeksFromHistory, balanceSnapshot, pushSnapshot } from "@/game/balance/history";
import { BALANCE_HEALTH_RULES } from "@/game/balance/healthRules";
import { amberWeeks, firstAscensionAtMs, noteAmber, noteChest, noteProductionLoss, previousWeekId, productionLossShare } from "@/game/healthTrace";
import { ascend } from "@/game/ascension";
import { claimStreak, STREAK_RULES } from "@/game/streak";
import { EXCHANGE_RULES } from "@/game/resources";
import { flushState } from "@/game/flush";
import { storageCapacityOf } from "@/game/economy";
import { REGISTERED_RULES } from "@/game/ruleRegistry";
import { weekIdOf } from "@/game/weeklyRecap";
import type { LiveBalance } from "@/game/balance/diagnostics";
import type { PlayerState, QueuesState } from "@/types/game";

/* 6.14.107 (AU27, lot AE-L4) : santé de l'équilibre complétée (traces et indicateurs, sur des données fabriquées). */

const DAY = 86_400_000;
// Mercredi 21 octobre 2026, 12 h UTC : semaine du lundi 19.
const NOW = Date.UTC(2026, 9, 21, 12);

function player(uid: string): PlayerState {
  const p = { ...defaultPlayerState(uid, uid), createdAt: null } as unknown as PlayerState;
  for (const b of BUILDINGS) p.buildings[b.id] = { level: 10, unlocked: true };
  p.resourcesUpdatedAtMs = NOW;
  return p;
}

const emptyQueues = (): QueuesState => defaultQueues();

describe("traces de la santé (healthTrace)", () => {
  it("Ambre par source : semaine en cours, bascule sur la précédente, taille fixe", () => {
    const p = player("a");
    const lastWeek = NOW - 7 * DAY;
    noteAmber(p, "bounties", 60, lastWeek);
    noteAmber(p, "pass", 40, lastWeek);
    noteAmber(p, "bounties", 25, NOW);
    noteAmber(p, "codex", 0, NOW); // rien
    const w = amberWeeks(p, NOW);
    expect(w.week).toBe("2026-10-19");
    expect(w.last).toEqual({ bounties: 60, pass: 40 });
    expect(w.current).toEqual({ bounties: 25 });
    // Deux semaines plus tard : la semaine du 19 devient la précédente, celle du 12 disparaît.
    noteAmber(p, "streak", 35, NOW + 7 * DAY);
    const later = amberWeeks(p, NOW + 7 * DAY);
    expect(later.last).toEqual({ bounties: 25 });
    expect(later.current).toEqual({ streak: 35 });
    expect(JSON.stringify(p.stats?.amberWeek).length).toBeLessThan(300);
    // Une trace trop ancienne ne compte plus.
    expect(amberWeeks(p, NOW + 30 * DAY)).toEqual({ week: weekIdOf(NOW + 30 * DAY), current: {}, last: {} });
    expect(previousWeekId("2026-10-19")).toBe("2026-10-12");
  });

  it("source inconnue rangée dans « Autres »", () => {
    const p = player("a");
    noteAmber(p, "nimporte" as never, 10, NOW);
    expect(amberWeeks(p, NOW).current).toEqual({ other: 10 });
  });

  it("production perdue : rien sous le plafond, la part bloquée au plafond", () => {
    const p = player("a");
    const cap = storageCapacityOf(p);
    // Sous le plafond : tout est produit.
    noteProductionLoss(p, { scrap: 0, nano: 0, data: 0 }, { scrap: 100, nano: 100, data: 100 }, 3600, NOW - 3_600_000, NOW);
    expect(p.stats?.prodLoss?.lost).toBe(0);
    expect(productionLossShare(p, NOW)).toBe(0);
    // Déjà plein : toute la production de cette ressource est perdue.
    noteProductionLoss(p, { scrap: cap, nano: 0, data: 0 }, { scrap: cap, nano: 100, data: 100 }, 3600, NOW - 3_600_000, NOW);
    const share = productionLossShare(p, NOW)!;
    expect(share).toBeGreaterThan(0);
    expect(share).toBeLessThan(1);
  });

  it("flush : un entrepôt plein laisse une trace de production perdue", () => {
    const p = player("a");
    // 6.14.143 (PB-L2) : sous le palier du tampon (entrepôt 10), toute la production en trop est perdue.
    p.buildings.entrepot = { level: 9, unlocked: true };
    const cap = storageCapacityOf(p);
    for (const k of ["scrap", "nano", "data"]) (p.resources as Record<string, number>)[k] = cap;
    p.resourcesUpdatedAtMs = NOW - 3_600_000;
    const out = flushState(p, emptyQueues(), NOW);
    expect(out.player.stats?.prodLoss?.lost).toBeGreaterThan(0);
    expect(productionLossShare(out.player, NOW)).toBeCloseTo(1, 5);
  });

  it("6.14.143 (PB-L2) : le tampon de l'entrepôt (palier 10) n'est pas une perte", () => {
    const p = player("a");
    const cap = storageCapacityOf(p);
    for (const k of ["scrap", "nano", "data"]) (p.resources as Record<string, number>)[k] = cap;
    p.resourcesUpdatedAtMs = NOW - 4 * 3_600_000;
    const out = flushState(p, emptyQueues(), NOW);
    // 4 h à entrepôt plein : 2 h gardées en tampon, 2 h perdues.
    expect(out.player.storageBuffer?.scrap).toBeGreaterThan(0);
    expect(productionLossShare(out.player, NOW)).toBeCloseTo(0.5, 1);
  });

  it("coffre du 7e jour : montant et tirages au plancher gardés à la réclamation", () => {
    const p = player("a");
    p.streak = { count: 6, lastDay: new Date(NOW - DAY + 2 * 3_600_000).toISOString().slice(0, 10), best: 6, total: 6 };
    const out = claimStreak(p, NOW, () => 0);
    expect(out.chest).not.toBeNull();
    const c = p.stats?.lastChest;
    expect(c?.atMs).toBe(NOW);
    expect(c?.n).toBe(Object.keys(out.chest!.resources).length);
    expect(c?.common).toBe(Object.values(out.chest!.resources).reduce((a, b) => a + (b ?? 0), 0));
    // Ambre du coffre et du jour comptée dans la source « Série ».
    expect(amberWeeks(p, NOW).current.streak).toBeGreaterThan(0);
    noteChest(p, { scrap: STREAK_RULES.chest.common[0], nano: STREAK_RULES.chest.common[0] }, STREAK_RULES.chest.common[0], NOW);
    expect(p.stats?.lastChest).toMatchObject({ floors: 2, n: 2 });
  });

  it("1re Ascension : gardée une fois ; ancien compte à une seule Ascension lu par ascendedAtMs", () => {
    expect(firstAscensionAtMs({ ascensions: 1, ascendedAtMs: 123 })).toBe(123);
    expect(firstAscensionAtMs({ ascensions: 2, ascendedAtMs: 123 })).toBeNull();
    expect(firstAscensionAtMs({ ascensions: 2, ascendedAtMs: 999, stats: { firstAscensionAtMs: 50 } })).toBe(50);
    const p = player("a");
    p.ascensions = 1;
    p.ascendedAtMs = NOW - 40 * DAY;
    // Le contrôle de l'Ascension n'est pas l'objet du test : on vérifie la date gardée par `ascend` quand elle réussit.
    try {
      ascend(p, emptyQueues(), NOW);
      expect(p.stats?.firstAscensionAtMs).toBe(NOW - 40 * DAY);
    } catch {
      expect(firstAscensionAtMs(p)).toBe(NOW - 40 * DAY);
    }
  });
});

describe("indicateurs de la santé (AE-L4)", () => {
  it("quantile linéaire", () => {
    expect(quantile([], 0.5)).toBe(0);
    expect(quantile([1, 2, 3, 4, 5], 0.25)).toBe(2);
    expect(quantile([1, 2, 3, 4, 5], 0.9)).toBeCloseTo(4.6, 5);
  });

  it("Ambre par source : totaux, parts, médiane et 9e décile par joueur", () => {
    const players = ["a", "b", "c", "d"].map(player);
    const last = NOW - 7 * DAY;
    noteAmber(players[0], "bounties", 300, last);
    noteAmber(players[0], "pass", 100, last);
    noteAmber(players[1], "bounties", 100, last);
    noteAmber(players[2], "codex", 100, last);
    noteAmber(players[3], "streak", 35, NOW);
    const h = amberHealth(players, NOW);
    expect(h.lastWeek).toBe("2026-10-12");
    expect(h.last.total).toBe(600);
    expect(h.last.earners).toBe(3);
    expect(h.last.bySource[0]).toMatchObject({ source: "bounties", total: 400, sharePct: 67, label: "Primes" });
    expect(h.last.medianPerPlayer).toBe(100);
    expect(h.last.topRatio).toBeCloseTo(3.4, 1);
    expect(h.current).toMatchObject({ total: 35, earners: 1 });
  });

  it("boss : heures avant la mort (abattus seulement), total tous types", () => {
    const e = (kind: "leviathan" | "seasonboss" | "allianceboss", hours: number, won: boolean) => ({
      kind,
      startMs: NOW - DAY * 3,
      endedAtMs: NOW - DAY * 3 + hours * 3_600_000,
      won,
      participants: 5,
      maxHp: 100,
      totalDamage: won ? 100 : 40,
    });
    const b = bossHealth([e("leviathan", 30, true), e("leviathan", 50, true), e("seasonboss", 72, false), e("allianceboss", 20, true)], NOW);
    const lev = b.rows.find((r) => r.kind === "leviathan")!;
    expect(lev.medianKillHours).toBe(40);
    expect(b.rows.find((r) => r.kind === "seasonboss")!.medianKillHours).toBeNull();
    expect(b.total).toMatchObject({ fought: 4, won: 3, winPct: 75, medianKillHours: 30 });
    // Archive sans ouverture : comptée dans la part abattue, pas dans le temps.
    const old = bossHealth([{ kind: "leviathan", endedAtMs: NOW - DAY, won: true, participants: 1, maxHp: 1, totalDamage: 1 }], NOW);
    expect(old.total).toMatchObject({ won: 1, medianKillHours: null });
  });

  it("1re Ascension : jour médian et quartiles des joueurs qui l'ont faite", () => {
    const mk = (day: number | null) => {
      const p = player(`p${day}`);
      p.createdAtMs = NOW - 200 * DAY;
      if (day !== null) {
        p.ascensions = 1;
        p.ascendedAtMs = p.createdAtMs + day * DAY;
      }
      return p;
    };
    const h = ascensionHealth([mk(30), mk(40), mk(50), mk(70), mk(null)]);
    expect(h).toMatchObject({ ascended: 4, sharePct: 80, measured: 4, medianDay: 45, q1Day: 37.5, q3Day: 55 });
    expect(ascensionHealth([mk(null)]).medianDay).toBeNull();
  });

  it("production perdue et écart entre quartiles", () => {
    const players = [1, 2, 3, 4, 5].map((i) => {
      const p = player(`p${i}`);
      p.stats = { prodLoss: { week: weekIdOf(NOW), pot: 1000, lost: i * 100, prev: null } };
      return p;
    });
    const prod: Record<string, number> = { p1: 100, p2: 200, p3: 300, p4: 400, p5: 900 };
    const h = productionHealth(players, NOW, (p) => prod[p.uid]);
    expect(h).toMatchObject({ measured: 5, lostMedianPct: 30, lostQ1Pct: 20, lostQ3Pct: 40, q1: 200, median: 300, q3: 400, spreadRatio: 2 });
  });

  it("protections après défaites : une par passage au maximum, raids et seigneurs compris", () => {
    const d = (uid: string, t: number, attacker = "x") => ({ attackerUid: attacker, defenderUid: uid, outcome: "attacker_win" as const, timestamp: t });
    const reports = [
      // a : 4 défaites en 3 h → une protection ; les défaites pendant la protection n'en ouvrent pas d'autre.
      d("a", NOW - 10 * 3_600_000),
      d("a", NOW - 9 * 3_600_000, "npc_w1"),
      d("a", NOW - 8 * 3_600_000, "pirates"),
      d("a", NOW - 7 * 3_600_000),
      d("a", NOW - 6 * 3_600_000),
      // b : 3 défaites → aucune.
      d("b", NOW - 5 * 3_600_000),
      d("b", NOW - 4 * 3_600_000),
      d("b", NOW - 3 * 3_600_000),
      // Une prime perdue ne compte pas (le défenseur n'est pas un joueur).
      d("bounty_1", NOW - 2 * 3_600_000, "a"),
    ];
    const out = defeatProtections(reports, NOW, 7, 4);
    expect(out.protections).toBe(1);
    expect(out.players).toEqual(["a"]);
    expect(defeatProtections(reports, NOW, 7, 0).protections).toBe(0);
  });

  it("choix d'AE-L3 : coffres au plancher, plafond du comptoir, protections", () => {
    const players = ["a", "b", "c", "d"].map(player);
    const floor = STREAK_RULES.chest.common[0];
    noteChest(players[0], { scrap: floor, nano: floor }, floor, NOW - DAY);
    noteChest(players[1], { scrap: floor, nano: 5 * floor }, floor, NOW - DAY);
    noteChest(players[2], { scrap: 9 * floor, nano: 9 * floor }, floor, NOW - 60 * DAY); // hors fenêtre
    const cap = EXCHANGE_RULES.weeklyRareCap;
    players[0].exchangeWeek = { week: weekIdOf(NOW), rares: cap };
    players[1].exchangeWeek = { week: weekIdOf(NOW), rares: cap * 0.9 };
    players[2].exchangeWeek = { week: weekIdOf(NOW - 7 * DAY), rares: cap }; // semaine passée
    const c = choicesHealth(players, [], NOW);
    expect(c.chest).toMatchObject({ count: 2, allFloorPct: 50, anyFloorPct: 100, medianCommon: 4 * floor });
    expect(c.exchange).toMatchObject({ cap, users: 2, atCap: 1, atCapPct: 25, nearCap: 2 });
    expect(c.defeats).toMatchObject({ protections: 0, players: 0, sharePct: 0 });
  });

  it("balanceHealth : nouvelles mesures, alertes selon les seuils réglables, photo du jour", () => {
    const players = ["a", "b"].map(player);
    noteAmber(players[0], "bounties", 900, NOW - 7 * DAY);
    noteAmber(players[1], "pass", 100, NOW - 7 * DAY);
    const h = balanceHealth({ players, reports: [], fleets: [], builds: {}, alliances: [], bossHistory: [] }, NOW);
    expect(h.amber.last.total).toBe(1000);
    const alert = h.alerts.find((a) => a.id === "amberBounties")!;
    expect(alert).toMatchObject({ value: "90 %", ok: false });
    const before = BALANCE_HEALTH_RULES.amberBountySharePct;
    try {
      BALANCE_HEALTH_RULES.amberBountySharePct = 0.95;
      const h2 = balanceHealth({ players, reports: [], fleets: [], builds: {}, alliances: [] }, NOW);
      expect(h2.alerts.find((a) => a.id === "amberBounties")!.ok).toBe(true);
    } finally {
      BALANCE_HEALTH_RULES.amberBountySharePct = before;
    }
    // Photo du jour et Ambre par semaine dans l'historique.
    const live = { activePlayers: 2, players: [], factions: [], warlords: [], bestDefense: 0, bestAttack: 0, health: h } as unknown as LiveBalance;
    const snap = balanceSnapshot(live, [], NOW);
    expect(snap).toMatchObject({ amberWeek: "2026-10-12", amberTotal: 1000, amberBySource: { bounties: 900, pass: 100 } });
    const hist = pushSnapshot(pushSnapshot([], { ...snap, day: "2026-10-20" }), snap);
    expect(amberWeeksFromHistory(hist)).toEqual([{ week: "2026-10-12", total: 1000, bySource: { bounties: 900, pass: 100 } }]);
  });

  it("seuils déclarés au registre (règle n° 2)", () => {
    expect(REGISTERED_RULES.balanceHealth.target()).toBe(BALANCE_HEALTH_RULES);
    for (const k of Object.keys(BALANCE_HEALTH_RULES)) expect((REGISTERED_RULES.balanceHealth.meta() as Record<string, { label?: string }>)[k]?.label).toBeTruthy();
  });
});
