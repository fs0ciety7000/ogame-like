import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, defaultGameContent, validateGameContent } from "@/game/content";
import { DEFAULT_RELICS, defaultRelicSettings, expeditionRelicChance, findTemplate, mythicFor, RARITIES, relicBonus, relicImage, rollRelic, type RelicTemplate } from "@/game/relics";
import { fleetCargoCapacity } from "@/game/combat";
import { playerCargoCapacity } from "@/game/modifiers";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

/* v5.9 : reliques administrables (modèles + réglages) et bonus de soute partout. */

afterEach(() => applyGameContent({}));

describe("v5.9 reliques dans l'administration", () => {
  it("les réglages par défaut reproduisent les valeurs du code", () => {
    applyGameContent({});
    expect(relicBonus({ rarity: "rare" })).toBeCloseTo(0.06);
    expect(expeditionRelicChance(8)).toBeCloseTo(0.15);
    expect(validateGameContent(defaultGameContent())).toEqual([]);
  });

  it("les bonus, le tirage et la chance en expédition suivent les réglages", () => {
    const s = defaultRelicSettings();
    s.rarities.rare.pct = 0.08;
    s.rarities.common.weight = 0;
    s.rarities.rare.weight = 1;
    s.rarities.epic.weight = 0;
    s.rarities.legendary.weight = 0;
    s.expeditionMax = 0.3;
    s.expeditionPerHour = 0.05;
    applyGameContent({ relicSettings: s });
    expect(relicBonus({ rarity: "rare" })).toBeCloseTo(0.08);
    expect(rollRelic("test", 0, () => 0.5).rarity).toBe("rare");
    expect(expeditionRelicChance(8)).toBeCloseTo(0.3);
    expect(RARITIES.find((r) => r.id === "mythic")?.weight).toBe(0);
  });

  it("une relique ajoutée est tirée, une relique inactive ne l'est plus", () => {
    const relics: RelicTemplate[] = DEFAULT_RELICS.map((t) => ({ ...t, disabled: !t.mythicOnly && !t.legendaryOnly ? true : t.disabled }));
    relics.push({ id: "prisme_test", name: "Prisme de test", effect: "cargo", lore: "", image: "/assets/relics/soute_pliee.webp" });
    applyGameContent({ relics });
    for (let i = 0; i < 20; i++) expect(rollRelic("t", i, () => (i % 10) / 10, "common").template).not.toBe("engrenage_varan");
    const rolled = rollRelic("t", 0, () => 0.1, "rare");
    expect(rolled.template).toBe("prisme_test");
    expect(relicImage("prisme_test")).toBe("/assets/relics/soute_pliee.webp");
    // Les modèles retirés restent connus pour les reliques déjà trouvées.
    expect(findTemplate("engrenage_varan")?.name).toBe("Engrenage de Varan");
  });

  it("une mythique inactive sort de la rotation", () => {
    applyGameContent({ relics: DEFAULT_RELICS.map((t) => (t.id === "coeur_leviathan" ? { ...t, disabled: true } : t)) });
    for (let m = 1; m <= 12; m++) expect(mythicFor(`2027-${String(m).padStart(2, "0")}`).template.id).not.toBe("coeur_leviathan");
  });

  it("la validation refuse les incohérences", () => {
    const c = defaultGameContent();
    c.relics = [{ id: "Bad Id", name: "", effect: "attack", lore: "", legendaryOnly: true, mythicOnly: true }];
    const errors = validateGameContent(c).join("\n");
    expect(errors).toMatch(/identifiant invalide/);
    expect(errors).toMatch(/nom manquant/);
    expect(errors).toMatch(/pas les deux/);
    expect(errors).toMatch(/au moins une relique active ordinaire/);
  });
});

describe("v5.9 Soute pliée : bonus de soute partout", () => {
  it("la soute d'une flotte inclut le bonus des reliques équipées", () => {
    const p = defaultPlayerState("u1", "u1") as PlayerState;
    p.units = { ...p.units, cargo: { level: 1, count: 10 } };
    const base = fleetCargoCapacity(p.units, { cargo: 10 }, p.techLevels);
    expect(playerCargoCapacity(p, { cargo: 10 })).toBe(base);
    p.relics = { items: [{ id: "r1", template: "soute_pliee", rarity: "rare", foundAtMs: 0, source: "test" }], slots: ["r1"], aegisWeek: "" };
    expect(playerCargoCapacity(p, { cargo: 10 })).toBe(Math.floor(base * 1.06));
  });
});
