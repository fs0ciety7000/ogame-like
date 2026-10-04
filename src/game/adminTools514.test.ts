import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent, validateGameContent } from "@/game/content";
import { activeWorldBosses, DEFAULT_WORLD_BOSSES, findWorldBoss, validateWorldBosses, worldBossOfWeek } from "@/game/worldBosses";
import { adminGrantOfficer, COMMANDER_RULES, COMMANDERS, RARE_OFFICER_RULES, ROLE_EFFECTS, validateOfficers, xpForLevel } from "@/game/commanders";
import { playerModifiers } from "@/game/modifiers";
import { addCapsule, synthesisState, SYNTH_RULES } from "@/game/synthesis";
import { makeRelic, relicsState, addRelic } from "@/game/relics";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const player = () => ({ ...defaultPlayerState("u", "u") }) as PlayerState;
afterEach(() => applyGameContent({}));

describe("v5.14 administration : boss mondiaux éditables", () => {
  it("renommer, retoucher et retirer un boss de la rotation", () => {
    applyGameContent({ worldBosses: [{ id: "titan", name: "Le Colosse de fer", hpMult: 2 } as never, { id: "abyssal", enabled: false } as never] });
    expect(findWorldBoss("titan").name).toBe("Le Colosse de fer");
    expect(findWorldBoss("titan").hpMult).toBe(2);
    expect(findWorldBoss("titan").phases).toEqual(DEFAULT_WORLD_BOSSES.find((b) => b.id === "titan")!.phases);
    expect(activeWorldBosses().map((b) => b.id)).not.toContain("abyssal");
    for (let w = 0; w < 30; w++) expect(worldBossOfWeek(w).id).not.toBe("abyssal");
    // Un combat passé de l'Abyssal garde son identité.
    expect(findWorldBoss("abyssal").name).toBe("L'Abyssal");
    expect(validateGameContent(currentGameContent())).toEqual([]);
  });

  it("validation : bornes, phases, au moins un boss en rotation", () => {
    expect(validateWorldBosses([{ id: "x", hpMult: 9 }]).join()).toMatch(/structure/);
    expect(validateWorldBosses([{ id: "leviathan", phases: [{ name: "a", flavor: "" }] as never }]).join()).toMatch(/trois phases/);
    expect(validateWorldBosses(DEFAULT_WORLD_BOSSES.map((b) => ({ id: b.id, enabled: false }))).join()).toMatch(/au moins un boss/);
  });
});

describe("v5.14 administration : officiers", () => {
  it("effets par niveau, noms, recrutement et officiers rares réglables", () => {
    applyGameContent({ officers: { roles: { admiral: { perLevel: [0.02], name: "Rhys Calder II" } }, rules: { recruitAmber: 90 }, rareDrop: { participant: 0.01 } } });
    expect(ROLE_EFFECTS.admiral[0].perLevel).toBe(0.02);
    expect(COMMANDERS.find((c) => c.id === "admiral")!.name).toBe("Rhys Calder II");
    expect(COMMANDER_RULES.recruitAmber).toBe(90);
    expect(RARE_OFFICER_RULES.participant).toBe(0.01);
    const p = { commanders: { roster: { admiral: { xp: xpForLevel(10) } }, active: ["admiral"], movedAtMs: {}, dossiers: 0 } as never };
    expect(playerModifiers(p).attack).toBeCloseTo(0.2);
    expect(COMMANDERS.find((c) => c.id === "admiral")!.bonus(10)).toContain("+20 %");
    // Retour aux valeurs du code.
    applyGameContent({});
    expect(ROLE_EFFECTS.admiral[0].perLevel).toBe(0.01);
    expect(COMMANDER_RULES.recruitAmber).toBe(150);
    expect(COMMANDERS.find((c) => c.id === "admiral")!.name).toBe("Rhys Calder");
  });

  it("validation des réglages d'officiers", () => {
    expect(validateOfficers({ roles: { admiral: { perLevel: [3] } } }).join()).toMatch(/entre 0 et 1/);
    expect(validateOfficers({ rareDrop: { podium: 0.5 } }).join()).toMatch(/0,2/);
    expect(validateOfficers({ rules: { slots: 0 } }).join()).toMatch(/postes/);
  });
});

describe("v5.14 administration : dons à un joueur", () => {
  it("officier rare, relique choisie, capsule", () => {
    const p = player();
    expect(adminGrantOfficer(p, "hunter").rare).toBe(true);
    expect(() => adminGrantOfficer(p, "hunter")).toThrow(/sert déjà/);
    const item = makeRelic("soute_pliee", "legendary", 1);
    expect(addRelic(p, item)).toBe(true);
    expect(relicsState(p).items[0]).toMatchObject({ template: "soute_pliee", rarity: "legendary" });
    expect(() => makeRelic("nope", "rare", 1)).toThrow(/inconnue/);
    for (let i = 0; i < SYNTH_RULES.maxStock; i++) expect(addCapsule(p, "assault", 12)).toBe(true);
    expect(addCapsule(p, "assault", 3)).toBe(false);
    expect(synthesisState(p).stock.assault[0]).toBe(10);
  });
});
