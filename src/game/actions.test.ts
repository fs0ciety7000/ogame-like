import { findUnit } from "@/game/units";
import { describe, expect, it } from "vitest";
import { applyLegacyBattleReport, applyLegacyGift, newPlayerProfile, performGift, performPlayerAction } from "@/game/actions";
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
    expect(() => performPlayerAction(p, q, { type: "sellUnits", unitId: "chasseur", qty: 5 }, NOW)).toThrow(/pas assez/);
    expect(() => performPlayerAction(p, q, { type: "hack" } as never, NOW)).toThrow(/inconnue/);
  });
});

describe("performGift", () => {
  it("moves resources from sender to recipient and notifies the recipient", () => {
    const a = player("a", { resources: { ...player("x").resources, scrap: 5000 } });
    const b = player("b");
    const out = performGift(a, defaultQueues(), b, defaultQueues(), { scrap: 1200, energy: 0 }, NOW);
    expect(out.sender.resources.scrap).toBe(5000 - 1200);
    expect(out.recipient.resources.scrap).toBe(b.resources.scrap + 1200);
    expect(out.recipientNotifications.some((n) => n.kind === "gift")).toBe(true);
  });

  it("refuses gifts to oneself, empty gifts and unaffordable gifts", () => {
    const a = player("a");
    expect(() => performGift(a, defaultQueues(), a, defaultQueues(), { scrap: 1 }, NOW)).toThrow(/toi-même/);
    expect(() => performGift(a, defaultQueues(), player("b"), defaultQueues(), { scrap: 0 }, NOW)).toThrow(/au moins/);
    expect(() => performGift(a, defaultQueues(), player("b"), defaultQueues(), { scrap: 1e12 }, NOW)).toThrow(/insuffisantes/);
    expect(() => performGift(a, defaultQueues(), player("b"), defaultQueues(), { scrap: -5 }, NOW)).toThrow(/invalides/);
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

  it("credits an old gift", () => {
    const p = player("d");
    const out = applyLegacyGift(p, defaultQueues(), { fromPseudo: "A", resources: { scrap: 50, bogus: 999 } }, NOW);
    expect(out.player.resources.scrap).toBe(p.resources.scrap + 50);
    expect(out.notifications[0].kind).toBe("gift");
  });
});
