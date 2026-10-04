import { afterAll, describe, expect, it } from "vitest";
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

describe("v5.9 recherche d'une techno à plan", () => {
  setTechnologies([
    ...DEFAULT_TECHNOLOGIES,
    { id: "tech_kesh", nom: "Traqueur Kesh", desc: "", maxLevel: 20, baseCost: { scrap: 1 }, baseTime: 1, effects: [{ type: "unlock_next_level", target: "traqueur_kesh" }], prereq: { tech1: 18 } },
  ]);
  afterAll(() => setTechnologies(DEFAULT_TECHNOLOGIES));

  it("est refusée sans le plan du Traqueur Kesh", () => {
    expect(() => performPlayerAction(rich(), defaultQueues(), { type: "research", techId: "tech_kesh" }, NOW)).toThrow(/Prérequis/);
  });

  it("est acceptée une fois le plan acheté", () => {
    const out = performPlayerAction(rich(["blueprint"]), defaultQueues(), { type: "research", techId: "tech_kesh" }, NOW);
    expect(out.queues.activeResearches.map((r) => r.id)).toContain("tech_kesh");
  });
});
