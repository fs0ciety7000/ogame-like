import { XP_TIER_RULES } from "@/game/xpTiers";
import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { canGoDeeper, deepLegMs, expeditionDepth, EXPEDITION_RULES, finishExpedition, launchExpedition, offerDeeper, resolveDeeper, resolveExpeditionChoice, rollExpeditionEvent, type ExpeditionFleet } from "@/game/expeditions";
import { pirateState } from "@/game/pirates";
import type { PlayerState } from "@/types/game";

function player(): PlayerState {
  const p = { ...defaultPlayerState("u1", "Nova"), createdAt: null } as unknown as PlayerState;
  p.uid = "u1";
  p.units = { chasseur: { level: 5, count: 200 }, cargo: { level: 3, count: 50 }, sonde_espionnage: { level: 1, count: 10 } };
  p.buildings = { ...p.buildings, extracteur_ferraille: { level: 10, unlocked: true }, reacteur_instable: { level: 10, unlocked: true } };
  p.resources = { ...p.resources, scrap: 1_000_000, energy: 1_000_000 };
  return p;
}
/** Générateur déterministe : renvoie les valeurs données en boucle. */
const seq = (...v: number[]) => {
  let i = 0;
  return () => v[i++ % v.length];
};
const weightsBefore = (kind: keyof typeof EXPEDITION_RULES.weights) => {
  const entries = Object.entries(EXPEDITION_RULES.weights);
  const total = entries.reduce((a, [, w]) => a + w, 0);
  let acc = 0;
  for (const [k, w] of entries) {
    if (k === kind) return (acc + w / 2) / total;
    acc += w;
  }
  return 0;
};

function launched(p: PlayerState): ExpeditionFleet {
  return launchExpedition(p, { chasseur: 100, cargo: 20 }, 4, 0, 0, 1000).fleet;
}

describe("expeditions", () => {
  it("checks durations, limits, ship count and takes the ships", () => {
    const p = player();
    expect(() => launchExpedition(p, { chasseur: 100 }, 3, 0, 0, 0)).toThrow(/Durée/);
    expect(() => launchExpedition(p, { chasseur: 100 }, 2, 1, 0, 0)).toThrow(/déjà/);
    expect(() => launchExpedition(p, { chasseur: 100 }, 2, 0, 3, 0)).toThrow(/Limite/);
    expect(() => launchExpedition(p, { chasseur: 5 }, 2, 0, 0, 0)).toThrow(/au moins/);
    expect(() => launchExpedition(p, { sonde_espionnage: 10, chasseur: 20 }, 2, 0, 0, 0)).toThrow(/Seuls/);
    const fleet = launched(p);
    expect(p.units.chasseur.count).toBe(100);
    expect(fleet.arriveAtMs).toBe(1000 + 2 * 3600_000);
    expect(fleet.durationMs).toBe(4 * 3600_000);
  });

  it("deposits scale with the player's production", () => {
    const p = player();
    const fleet = launched(p);
    const res = rollExpeditionEvent(p, fleet, 1, 2000, seq(weightsBefore("deposit"), 0.5));
    expect(res.pending).toBe(false);
    expect((fleet.loot?.scrap ?? 0) > 0).toBe(true);
    expect(fleet.expedition.log).toHaveLength(1);
  });

  it("wrecks add ships, ambushes cost ships", () => {
    const p = player();
    const fleet = launched(p);
    rollExpeditionEvent(p, fleet, 1, 2000, seq(weightsBefore("wreck"), 1));
    expect(fleet.units.chasseur).toBeGreaterThan(100);
    const before = fleet.units.chasseur;
    rollExpeditionEvent(p, fleet, 2, 3000, seq(weightsBefore("ambush"), 0.5));
    expect(fleet.units.chasseur).toBeLessThan(before);
  });

  it("a faction encounter waits for a choice; the toll lowers notoriety", () => {
    const p = player();
    const fleet = launched(p);
    const res = rollExpeditionEvent(p, fleet, 1, 2000, seq(weightsBefore("faction"), 0));
    expect(res.pending).toBe(true);
    expect(fleet.expedition.pending?.deadlineMs).toBe(2000 + EXPEDITION_RULES.choiceMinutes * 60_000);
    const scrap = p.resources.scrap;
    resolveExpeditionChoice(p, fleet, "toll", 3000, seq(0.5));
    expect(p.resources.scrap).toBeLessThan(scrap);
    expect(fleet.expedition.pending).toBeNull();
    expect(() => resolveExpeditionChoice(p, fleet, "toll", 3000, seq(0.5))).toThrow(/Aucune/);
  });

  it("forcing the way raises notoriety; finishing grants XP", () => {
    const p = player();
    const fleet = launched(p);
    rollExpeditionEvent(p, fleet, 1, 2000, seq(weightsBefore("faction"), 0));
    const factionId = fleet.expedition.pending!.factionId;
    resolveExpeditionChoice(p, fleet, "force", 3000, seq(0.1));
    expect(pirateState(p, factionId).notoriety).toBe(1);
    const xp = p.xp ?? 0;
    finishExpedition(p, fleet, 4000);
    expect(p.xp).toBe(xp + 4 * EXPEDITION_RULES.xpPerHour * (XP_TIER_RULES.multipliers.expedition ?? 1));
    expect(p.stats?.expeditions).toBe(1);
  });
});

describe("expéditions en chaîne (5.16)", () => {
  it("pousser plus loin augmente la profondeur et le butin ; rentrer sécurise", () => {
    const p = player();
    const f = launched(p);
    expect(canGoDeeper(f)).toBe(true);
    offerDeeper(f, 5000);
    expect(f.expedition.pending?.kind).toBe("deeper");
    expect(() => resolveExpeditionChoice(p, f, "force", 5001, Math.random)).toThrow();
    const out = resolveDeeper(f, "deeper", 5001);
    expect(out.deeper).toBe(true);
    expect(expeditionDepth(f)).toBe(1);
    expect(deepLegMs(f)).toBe(2 * 3600_000);
    // Gisement en profondeur 1 : ×1,25 par rapport à la surface.
    const surface = launched(player());
    rollExpeditionEvent(p, surface, 2, 6000, seq(weightsBefore("deposit"), 0.5));
    rollExpeditionEvent(p, f, 2, 6000, seq(weightsBefore("deposit"), 0.5));
    expect(f.loot?.scrap ?? 0).toBe(Math.floor((surface.loot?.scrap ?? 0) * 1.25));
    offerDeeper(f, 7000);
    expect(resolveDeeper(f, "return", 7001).deeper).toBe(false);
    expect(f.expedition.pending).toBeNull();
    f.expedition.depth = EXPEDITION_RULES.maxDepth;
    expect(canGoDeeper(f)).toBe(false);
  });

  it("l'XP de fin compte une demi-durée de plus par profondeur", () => {
    const p = player();
    const f = launched(p);
    f.expedition.depth = 2;
    const xp0 = p.xp ?? 0;
    finishExpedition(p, f, 9000, () => 0.99);
    expect((p.xp ?? 0) - xp0).toBeGreaterThanOrEqual(4 * EXPEDITION_RULES.xpPerHour * 2);
  });
});
