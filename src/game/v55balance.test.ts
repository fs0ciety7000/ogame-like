import { beforeEach, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { defensivePower, findFaction, PIRATE_RULES, pirateState, raidPower, resolvePirateRaid } from "@/game/pirates";
import { DEFAULT_WARLORDS, empirePower, emptyRuntime, growWarlord, warlordReference, warlordTargetPower, WARLORD_RULES } from "@/game/warlords";
import { getUnitCapacity } from "@/game/buildings";
import { findTech, techBonus } from "@/game/technologies";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 3, 12);
const HOUR = 3_600_000;
const base = (over: Partial<PlayerState> = {}): PlayerState => ({ ...defaultPlayerState("p", "Joueur"), createdAt: NOW, xp: 5000, ...over }) as PlayerState;

beforeEach(() => applyGameContent({}));

describe("v5.5 raids adaptatifs", () => {
  it("chaque raid repoussé renforce le suivant, une défaite l'affaiblit, dans les bornes", () => {
    const varan = findFaction("varan")!;
    let p = base({ units: { canon_plasma: { level: 3, count: 200 } } });
    const def = defensivePower(p);
    for (let i = 0; i < 3; i++) p = resolvePirateRaid(varan, p, defaultQueues(), Math.round(def * 0.3), [], NOW + i * HOUR).player;
    const st = pirateState(p, "varan");
    expect(st.adapt).toBeCloseTo(1 + 3 * PIRATE_RULES.adaptUp, 5);
    expect(raidPower(varan, p, st.notoriety, st.adapt)).toBeGreaterThan(raidPower(varan, p, st.notoriety));
    const lost = resolvePirateRaid(varan, p, defaultQueues(), def * 50, [], NOW + 5 * HOUR).player;
    expect(pirateState(lost, "varan").adapt).toBeCloseTo(st.adapt - PIRATE_RULES.adaptDown, 5);
    expect(pirateState({ pirates: { varan: { adapt: 9 } } } as never, "varan").adapt).toBe(PIRATE_RULES.adaptMax);
  });
});

describe("v5.5 plafond des seigneurs", () => {
  const strong = DEFAULT_WARLORDS.find((d) => d.tier === "strong")!;
  const players = [base({ units: { canon_plasma: { level: 3, count: 100 }, fregate: { level: 3, count: 50_000 } } })];

  it("puissance visée au plus 2,5 × la meilleure défense de joueur", () => {
    const ref = warlordReference(players);
    expect(ref.maxDefense).toBeGreaterThan(0);
    expect(warlordTargetPower(strong, ref)).toBeLessThanOrEqual(Math.round(ref.maxDefense! * WARLORD_RULES.maxDefenseRatio));
  });

  it("une armée au-dessus du plafond fond d'un jour à l'autre", () => {
    const ref = warlordReference(players);
    const npc = base({ npc: "warlord" as never, units: { fregate: { level: 1, count: 2_000_000 } } });
    const before = empirePower(npc);
    growWarlord(npc, strong, ref, { ...emptyRuntime(), seeded: true, lastTickMs: NOW - 24 * HOUR }, NOW);
    expect(empirePower(npc)).toBeLessThan(before);
  });

  it("5.23 : plus de 2 fois la puissance visée : recalée tout de suite près de la cible", () => {
    const ref = warlordReference(players);
    const target = warlordTargetPower(strong, ref);
    const npc = base({ npc: "warlord" as never, units: { fregate: { level: 1, count: 2_000_000 } } });
    expect(empirePower(npc)).toBeGreaterThan(target * WARLORD_RULES.snapAbove);
    growWarlord(npc, strong, ref, { ...emptyRuntime(), seeded: true, lastTickMs: NOW - HOUR }, NOW);
    expect(empirePower(npc)).toBeLessThanOrEqual(target * 1.3);
  });
});

describe("v5.5 Extension des hangars", () => {
  it("+5 % de places d'attaque et de défense par niveau, +50 % au niveau 10", () => {
    const tech = findTech("tech26");
    expect(tech?.maxLevel).toBe(10);
    const p = base();
    const buildings = p.buildings;
    for (const id of Object.keys(buildings)) buildings[id] = { ...buildings[id], level: 10, unlocked: true };
    const plain = getUnitCapacity(buildings, "attack");
    expect(techBonus({ tech26: 10 }, "hangar_capacity", "defense")).toBeCloseTo(0.5, 5);
    expect(getUnitCapacity(buildings, "attack", { tech26: 10 })).toBe(Math.floor(plain * 1.5));
  });
});
