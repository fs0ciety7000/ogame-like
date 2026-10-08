import { findUnit } from "@/game/units";
import { describe, expect, it } from "vitest";
import { applyLegacyBattleReport, newPlayerProfile, performGift, performPlayerAction } from "@/game/actions";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { GameActionError } from "@/game/errors";
import { getUnitCapacity } from "@/game/buildings";
import type { PlayerState } from "@/types/game";

const NOW = 1_800_000_000_000;

function player(uid: string, patch: Partial<PlayerState> = {}): PlayerState {
  return { ...defaultPlayerState(uid, uid.toUpperCase()), createdAtMs: NOW - 1000, resourcesUpdatedAtMs: NOW, ...patch } as PlayerState;
}

describe("performPlayerAction", () => {
  it("catches up production before a sync, and bounds the declared playtime", () => {
    const p = player("a", { resourcesUpdatedAtMs: NOW - 10_000 });
    const out = performPlayerAction(p, defaultQueues(), { type: "sync", playtimeDeltaSeconds: 99_999 }, NOW);
    expect(out.player.resourcesUpdatedAtMs).toBe(NOW);
    expect(out.player.playtimeSeconds).toBeLessThanOrEqual(15);
    expect((out.result as { elapsedMs: number }).elapsedMs).toBe(10_000);
  });

  it("counts ships away on a mission in the hangar (v3.9.1)", () => {
    const base = player("a", { resources: { ...player("x").resources, scrap: 1e9, energy: 1e9 }, units: { chasseur: { level: 1, count: 0 } } });
    const cap = getUnitCapacity(base.buildings, "attack");
    const fit = Math.floor(cap / findUnit("chasseur")!.hangarSpace);
    expect(fit).toBeGreaterThan(0);
    // Toute la place est prise par des chasseurs partis en mission : on ne peut plus en construire.
    expect(() => performPlayerAction(base, defaultQueues(), { type: "buildUnits", unitId: "chasseur", qty: 1 }, NOW, { chasseur: fit })).toThrow(/hangar/);
    // Sans eux, la construction passe.
    expect(() => performPlayerAction(base, defaultQueues(), { type: "buildUnits", unitId: "chasseur", qty: 1 }, NOW)).not.toThrow();
  });

  it("pays and queues a building upgrade, refuses a second one", () => {
    const p = player("a", { resources: { ...player("x").resources, scrap: 1e6, energy: 1e6, nano: 1e6, data: 1e6 } });
    const out = performPlayerAction(p, defaultQueues(), { type: "upgradeBuilding", buildingId: "extracteur_ferraille" }, NOW);
    expect(out.player.resources.scrap).toBeLessThan(1e6);
    expect(out.queues.buildingUpgrades.extracteur_ferraille?.endTime).toBeGreaterThan(NOW);
    expect(() => performPlayerAction(out.player, out.queues, { type: "upgradeBuilding", buildingId: "extracteur_ferraille" }, NOW)).toThrow(
      /déjà en cours/,
    );
  });

  it("rejects forged parameters from the browser", () => {
    const p = player("a");
    const q = defaultQueues();
    expect(() => performPlayerAction(p, q, { type: "trade", sellId: "scrap", buyId: "energy", amount: -50 }, NOW)).toThrow(GameActionError);
    expect(() => performPlayerAction(p, q, { type: "trade", sellId: "gold" as never, buyId: "energy", amount: 5 }, NOW)).toThrow(/invalide/);
    // 5.26.1 : 5 % de ce qui est reçu part au pot commun (arrondi au supérieur).
    p.resources.aiFragment = 10;
    const out = performPlayerAction(p, q, { type: "trade", sellId: "aiFragment", buyId: "scrap", amount: 3 }, NOW);
    expect(out.result).toEqual({ gained: 142, tax: 8, taxRes: "scrap" });
    expect(() => performPlayerAction(p, q, { type: "sellUnits", unitId: "chasseur", qty: 5 }, NOW)).toThrow(/pas assez/);
    expect(() => performPlayerAction(p, q, { type: "hack" } as never, NOW)).toThrow(/inconnue/);
  });
});

describe("performGift", () => {
  const OLD = { createdAtMs: NOW - 10 * 86_400_000 };
  it("moves resources from sender to recipient and notifies the recipient", () => {
    const a = player("a", { ...OLD, resources: { ...player("x").resources, scrap: 5000 } });
    const b = player("b", OLD);
    const out = performGift(a, defaultQueues(), b, defaultQueues(), { scrap: 1200, energy: 0 }, NOW);
    expect(out.sender.resources.scrap).toBe(5000 - 1200);
    // v5.10 : hors alliance, 20 % se perdent en route.
    expect(out.recipient.resources.scrap).toBe(b.resources.scrap + 960);
    expect(out.delivered).toEqual({ scrap: 960 });
    expect(out.recipientNotifications.some((n) => n.kind === "gift")).toBe(true);
  });

  it("refuses gifts to oneself, empty gifts and unaffordable gifts", () => {
    const a = player("a", OLD);
    const b = player("b", OLD);
    expect(() => performGift(a, defaultQueues(), a, defaultQueues(), { scrap: 1 }, NOW)).toThrow(/toi-même/);
    expect(() => performGift(a, defaultQueues(), b, defaultQueues(), { scrap: 0 }, NOW)).toThrow(/au moins/);
    expect(() => performGift(a, defaultQueues(), b, defaultQueues(), { scrap: 1e12 }, NOW)).toThrow(/insuffisantes/);
    expect(() => performGift(a, defaultQueues(), b, defaultQueues(), { scrap: -5 }, NOW)).toThrow(/invalides/);
  });

  it("v5.10 : comptes de moins de 3 jours bloqués, cadeau entier dans l'alliance", () => {
    const rich = { ...player("x").resources, scrap: 5000 };
    const young = player("y", { createdAtMs: NOW - 86_400_000 });
    expect(() => performGift(young, defaultQueues(), player("b", OLD), defaultQueues(), { scrap: 1 }, NOW)).toThrow(/3 jours/);
    expect(() => performGift(player("a", { ...OLD, resources: rich }), defaultQueues(), young, defaultQueues(), { scrap: 1 }, NOW)).toThrow(/recevoir/);
    const a = player("a", { ...OLD, resources: rich, allianceId: "al" });
    const b = player("b", { ...OLD, allianceId: "al" });
    const out = performGift(a, defaultQueues(), b, defaultQueues(), { scrap: 1000 }, NOW);
    expect(out.delivered).toEqual({ scrap: 1000 });
    expect(out.recipientNotifications.find((n) => n.kind === "gift")?.data?.resources).toEqual({ scrap: 1000 });
  });
});

describe("profiles and legacy records", () => {
  it("creates a starting profile with a fallback pseudo", () => {
    const { player: p, queues } = newPlayerProfile("u1", "  ", NOW);
    expect(p.pseudo).toBe("Joueur");
    expect(p.createdAtMs).toBe(NOW);
    expect(queues.activeResearches).toEqual([]);
  });

  it("applies an old battle report (losses, loot, XP) for the defender", () => {
    const p = player("d", { xp: 100, units: { roquette: { level: 1, count: 10 } }, resources: { ...player("x").resources, scrap: 1000 } });
    const out = applyLegacyBattleReport(
      p,
      defaultQueues(),
      { outcome: "attacker_win", defenderLosses: { roquette: 4 }, loot: { scrap: 300 }, defenderXpDelta: -10, attackerPseudo: "Z" },
      NOW,
    );
    expect(out.player.units.roquette.count).toBe(6);
    expect(out.player.resources.scrap).toBe(700);
    expect(out.player.xp).toBe(90);
    expect(out.player.defeats).toBe(1);
  });
});
