import { describe, expect, it } from "vitest";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { performPlayerAction } from "@/game/actions";
import { CANCEL_RULES, quoteCancel, refundFraction, unitGroups } from "@/game/cancel";
import { advanceColonies, startColonization, upgradeColonyBuilding, buildColonyDefense } from "@/game/colonies";
import { BUILDINGS } from "@/game/buildings";
import { UNITS } from "@/game/units";
import type { PlayerState, QueuesState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 14, 10);
const MIN = 60_000;

function rich(): PlayerState {
  const p = defaultPlayerState("u1", "u1") as PlayerState;
  p.createdAtMs = NOW - 90 * 24 * 3600_000;
  p.resourcesUpdatedAtMs = NOW;
  for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 1e12;
  return p;
}

function run(p: PlayerState, q: QueuesState, action: Parameters<typeof performPlayerAction>[2], at: number) {
  const out = performPlayerAction(p, q, action, at);
  return { p: out.player, q: out.queues, result: out.result as { refund: Record<string, number>; fraction: number } };
}

describe("v4.7 cancel", () => {
  it("refunds 100 % in the first minute, then 80 % of the time left", () => {
    expect(refundFraction(0, 100 * MIN, 30_000)).toBe(1);
    expect(refundFraction(0, 100 * MIN, 50 * MIN)).toBeCloseTo(0.5 * CANCEL_RULES.refundPct);
    expect(refundFraction(0, 100 * MIN, 100 * MIN)).toBe(0);
  });

  it("cancels a building upgrade at half time with 40 % back", () => {
    let p = rich();
    let q = defaultQueues();
    const before = p.resources.scrap;
    ({ p, q } = run(p, q, { type: "upgradeBuilding", buildingId: "extracteur_ferraille" }, NOW));
    const entry = q.buildingUpgrades.extracteur_ferraille!;
    const paid = entry.paid!.scrap!;
    expect(before - p.resources.scrap).toBe(paid);
    // Clic par erreur : tout revient.
    expect(quoteCancel(p, q, { kind: "building", id: "extracteur_ferraille" }, NOW + 30_000).refund.scrap).toBe(paid);
    const half = entry.startedAtMs! + (entry.endTime - entry.startedAtMs!) / 2;
    const out = run(p, q, { type: "cancel", target: { kind: "building", id: "extracteur_ferraille" } }, half);
    expect(out.q.buildingUpgrades.extracteur_ferraille).toBeUndefined();
    expect(out.result.refund.scrap).toBe(Math.floor(paid * 0.4));
    expect(out.p.buildings.extracteur_ferraille.level).toBe(p.buildings.extracteur_ferraille.level);
  });

  it("cancels a research; old entries without paid/start are rebuilt from the formulas", () => {
    let p = rich();
    let q = defaultQueues();
    const tech = "tech1";
    ({ p, q } = run(p, q, { type: "research", techId: tech }, NOW));
    const entry = q.activeResearches[0];
    delete entry.paid;
    delete entry.startedAtMs;
    const out = run(p, q, { type: "cancel", target: { kind: "research", id: tech } }, NOW + 10_000);
    expect(out.q.activeResearches).toHaveLength(0);
    expect(Object.values(out.result.refund).some((n) => n > 0)).toBe(true);
  });

  it("cancels a unit batch: waiting units 100 %, the running one prorated, next batch starts", () => {
    let p = rich();
    p.units.chasseur = { level: 1, count: 0 };
    p.units.fregate = { level: 1, count: 0 };
    for (const b of BUILDINGS) if (b.effect?.type === "hangar") p.buildings[b.id] = { level: 10, unlocked: true };
    let q = defaultQueues();
    ({ p, q } = run(p, q, { type: "buildUnits", unitId: "chasseur", qty: 5 }, NOW));
    ({ p, q } = run(p, q, { type: "buildUnits", unitId: "fregate", qty: 2 }, NOW));
    expect(unitGroups(q.unitQueues.attack).map((g) => [g.unitId, g.count, g.running])).toEqual([
      ["chasseur", 5, true],
      ["fregate", 2, false],
    ]);
    const fregate = UNITS.find((u) => u.id === "fregate")!;
    // Lot en attente : remboursé en entier.
    const waiting = run(p, q, { type: "cancel", target: { kind: "units", category: "attack", index: 5 } }, NOW + 1000);
    expect(waiting.result.refund.scrap).toBe(fregate.cost.scrap * 2);
    expect(waiting.q.unitQueues.attack).toHaveLength(5);
    // Lot en cours annulé : le suivant démarre aussitôt.
    const running = run(p, q, { type: "cancel", target: { kind: "units", category: "attack", index: 0 } }, NOW + 2000);
    expect(running.q.unitQueues.attack.map((e) => e.unitId)).toEqual(["fregate", "fregate"]);
    expect(running.q.unitQueues.attack[0].endTime).toBeGreaterThan(NOW + 2000);
  });

  it("cancels colony works, refunded to the colony stock", () => {
    const p = rich();
    for (const b of BUILDINGS) p.buildings[b.id] = { level: 15, unlocked: true };
    startColonization(p, "Néo", NOW);
    advanceColonies(p, NOW + 3 * 3600_000);
    const c = p.colonies![0];
    const t = NOW + 3 * 3600_000;
    const before = c.resources.scrap;
    const job = upgradeColonyBuilding(p, c.id, "extracteur_ferraille", t);
    const q = defaultQueues();
    const out = run(p, q, { type: "cancel", target: { kind: "colonyBuilding", colonyId: c.id } }, t + 10_000);
    const c2 = out.p.colonies![0];
    expect(c2.building).toBeNull();
    expect(Math.round(c2.resources.scrap)).toBeGreaterThanOrEqual(Math.round(before) - 1);
    expect(job.paid?.scrap).toBeGreaterThan(0);
    const def = UNITS.find((u) => u.category === "defense")!;
    p.units[def.id] = { level: 1, count: 0 };
    expect(() => buildColonyDefense(p, c.id, def.id, 1, t)).not.toThrow();
  });

  it("rejects unknown targets", () => {
    expect(() => performPlayerAction(rich(), defaultQueues(), { type: "cancel", target: { kind: "building", id: "extracteur_ferraille" } }, NOW)).toThrow(/Aucune amélioration/);
    expect(() => performPlayerAction(rich(), defaultQueues(), { type: "cancel", target: { kind: "nope" } as never }, NOW)).toThrow(/Chantier inconnu/);
  });
});
