import { describe, expect, it } from "vitest";
import { fuseRelics, grantMythicRelic, mythicFor, recycleRelic, rollRelic } from "@/game/relics";
import { playerModifiers } from "@/game/modifiers";
import type { PlayerState } from "@/types/game";

const OCT = Date.UTC(2026, 9, 3); // octobre : mois pair → boss de saison
const NOV = Date.UTC(2026, 10, 3); // novembre : mois impair → Léviathan

function player(): PlayerState {
  return { uid: "p1", pseudo: "Test" } as unknown as PlayerState;
}

describe("v5.1 reliques mythiques", () => {
  it("alterne la source et le modèle selon le mois", () => {
    expect(mythicFor("2026-10").source).toBe("seasonboss");
    expect(mythicFor("2026-11").source).toBe("leviathan");
    expect(mythicFor("2026-10").template.id).not.toBe(mythicFor("2026-11").template.id);
    expect(mythicFor("2026-10").template.mythicOnly).toBe(true);
  });

  it("n'est remise qu'une fois par saison, et seulement par le bon boss", () => {
    const p = player();
    expect(grantMythicRelic(p, "leviathan", OCT, {})).toBeNull();
    const out = grantMythicRelic(p, "seasonboss", OCT, {});
    expect(out?.given).toEqual({ "2026-10": "p1" });
    expect(p.relics?.items[0].rarity).toBe("mythic");
    expect(grantMythicRelic(player(), "seasonboss", OCT, out!.given)).toBeNull();
    expect(grantMythicRelic(player(), "leviathan", NOV, out!.given)).not.toBeNull();
  });

  it("passe même avec un inventaire plein", () => {
    const p = player();
    for (let i = 0; i < 200; i++) grantMythicRelic(p, "seasonboss", OCT + i, {});
    expect(p.relics!.items.length).toBe(200);
  });

  it("ne tombe jamais au hasard, ne fusionne pas et ne se recycle pas", () => {
    for (let i = 0; i < 300; i++) {
      const r = rollRelic("expedition", OCT, Math.random, "common");
      expect(r.rarity).not.toBe("mythic");
    }
    const p = player();
    grantMythicRelic(p, "seasonboss", OCT, {});
    const id = p.relics!.items[0].id;
    expect(() => recycleRelic(p, id)).toThrow();
    grantMythicRelic(p, "seasonboss", OCT + 1, {});
    grantMythicRelic(p, "seasonboss", OCT + 2, {});
    expect(() => fuseRelics(p, p.relics!.items[0].template, "mythic", OCT)).toThrow();
  });

  it("Cœur du Léviathan : bonus de dégâts aux boss une fois équipé", () => {
    const p = player();
    p.relics = { items: [{ id: "m", template: "coeur_leviathan", rarity: "mythic", foundAtMs: OCT, source: "mythic:2026-10" }], slots: ["m"] } as never;
    expect(playerModifiers(p).bossDamage).toBeGreaterThan(0);
  });
});
