import { describe, expect, it } from "vitest";
import { BUILDINGS } from "@/game/buildings";
import { advanceColonies, colonyDefenseHangar, colonyDefenseSeconds, colonyHourlyRates, colonyStorage, COLONY_SPEC_RULES, setColonySpec, startColonization } from "@/game/colonies";
import { defaultPlayerState } from "@/game/defaults";
import { UNITS } from "@/game/units";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 7, 12);
const H = 3600_000;

function withColony(): PlayerState {
  const p = { ...defaultPlayerState("u1", "Colon"), createdAt: null } as unknown as PlayerState;
  for (const b of BUILDINGS) p.buildings[b.id] = { level: 15, unlocked: true };
  for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 2e9;
  p.resourcesUpdatedAtMs = NOW;
  startColonization(p, "Néo", NOW);
  advanceColonies(p, NOW + 3 * H);
  return p;
}

describe("spécialisation des colonies", () => {
  it("applique bonus et contreparties", () => {
    const p = withColony();
    const c = p.colonies![0];
    const base = colonyHourlyRates(c, p);
    const storage = colonyStorage(c, p);
    const hangar = colonyDefenseHangar(c).capacity;
    const def = UNITS.find((u) => u.category === "defense")!;
    const secs = colonyDefenseSeconds(p, def.id, 10, c);

    setColonySpec(p, c.id, "forge", NOW + 3 * H);
    const forge = colonyHourlyRates(c, p);
    expect(forge.scrap! / base.scrap!).toBeCloseTo(1.25, 2);
    expect(forge[c.biome!]! / base[c.biome!]!).toBeCloseTo(0.8, 2);

    c.specChangedAtMs = 0; // délai écoulé
    c.spec = null;
    setColonySpec(p, c.id, "depot", NOW);
    expect(colonyStorage(c, p)).toBe(Math.floor(storage * 1.6));

    c.spec = null;
    setColonySpec(p, c.id, "bastion", NOW);
    expect(colonyDefenseHangar(c).capacity).toBe(Math.floor(hangar * 1.5));
    expect(colonyDefenseSeconds(p, def.id, 10, c)).toBeCloseTo(secs * 0.7, 5);
  });

  it("premier choix libre, puis un changement tous les 7 jours", () => {
    const p = withColony();
    const c = p.colonies![0];
    setColonySpec(p, c.id, "forge", NOW);
    expect(() => setColonySpec(p, c.id, "forge", NOW + H)).toThrow(/déjà/);
    expect(() => setColonySpec(p, c.id, "extraction", NOW + H)).toThrow(/Changement possible/);
    setColonySpec(p, c.id, "extraction", NOW + COLONY_SPEC_RULES.changeCooldownMs);
    expect(c.spec).toBe("extraction");
    expect(() => setColonySpec(p, c.id, "inconnue", NOW + 30 * 24 * H)).toThrow(/inconnue/);
  });
});
