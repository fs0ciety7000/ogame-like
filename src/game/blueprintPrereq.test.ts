import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { performPlayerAction } from "@/game/actions";
import { DEFAULT_TECHNOLOGIES, setTechnologies } from "@/game/technologies";
import type { PlayerState } from "@/types/game";

/* v5.9 : une techno qui améliore une unité à plan (Traqueur Kesh) exige le
   plan du Comptoir : sinon la recherche débloquerait l'unité gratuitement. */

const NOW = Date.UTC(2026, 9, 4, 10);

function rich(owned: string[] = []): PlayerState {
  const p = defaultPlayerState("u1", "u1") as PlayerState;
  p.createdAtMs = NOW - 90 * 24 * 3600_000;
  p.resourcesUpdatedAtMs = NOW;
  for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 1e12;
  p.techLevels = { ...p.techLevels, tech1: 18 };
  p.bounties = { ...(p.bounties ?? ({} as NonNullable<PlayerState["bounties"]>)), owned } as NonNullable<PlayerState["bounties"]>;
  return p;
}

beforeAll(() =>
  setTechnologies([
    ...DEFAULT_TECHNOLOGIES,
    { id: "tech_kesh", nom: "Traqueur Kesh", desc: "", maxLevel: 20, baseCost: { scrap: 1 }, baseTime: 1, effects: [{ type: "unlock_next_level", target: "traqueur_kesh" }], prereq: { tech1: 18 } },
    { id: "tech_ambre", nom: "Techno à l'ambre", desc: "", maxLevel: 5, baseCost: { scrap: 1 }, baseTime: 600, amberCost: 10, effects: [{ type: "unit_attack" }], prereq: {} },
  ]),
);
afterAll(() => setTechnologies(DEFAULT_TECHNOLOGIES));

describe("v5.9 recherche d'une techno à plan", () => {

  it("est refusée sans le plan du Traqueur Kesh", () => {
    expect(() => performPlayerAction(rich(), defaultQueues(), { type: "research", techId: "tech_kesh" }, NOW)).toThrow(/Prérequis/);
  });

  it("est acceptée une fois le plan acheté", () => {
    const out = performPlayerAction(rich(["blueprint"]), defaultQueues(), { type: "research", techId: "tech_kesh" }, NOW);
    expect(out.queues.activeResearches.map((r) => r.id)).toContain("tech_kesh");
  });
});

describe("v5.9 ambre dans le coût d'une techno", () => {

  const withAmber = (amber: number) => {
    const p = rich();
    p.bounties = { ...p.bounties!, amber } as NonNullable<PlayerState["bounties"]>;
    return p;
  };

  it("prélève l'ambre en plus des ressources", () => {
    const out = performPlayerAction(withAmber(25), defaultQueues(), { type: "research", techId: "tech_ambre" }, NOW);
    expect(out.player.bounties?.amber).toBe(15);
    expect(out.queues.activeResearches.find((r) => r.id === "tech_ambre")?.paidAmber).toBe(10);
  });

  it("refuse la recherche sans assez d'ambre, sans rien prélever", () => {
    const p = withAmber(9);
    const scrap = p.resources.scrap;
    expect(() => performPlayerAction(p, defaultQueues(), { type: "research", techId: "tech_ambre" }, NOW)).toThrow(/ambre/);
    expect(p.resources.scrap).toBe(scrap);
  });

  it("rend l'ambre si la recherche est annulée dans la première minute", () => {
    const started = performPlayerAction(withAmber(10), defaultQueues(), { type: "research", techId: "tech_ambre" }, NOW);
    expect(started.player.bounties?.amber).toBe(0);
    const out = performPlayerAction(started.player, started.queues, { type: "cancel", target: { kind: "research", id: "tech_ambre" } }, NOW + 10_000);
    expect(out.player.bounties?.amber).toBe(10);
  });
});
