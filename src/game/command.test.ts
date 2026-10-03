import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { assignCommanders, commanderLevel, grantCommanderXp, recruitCommander, xpForLevel, COMMANDER_RULES } from "@/game/commanders";
import { playerModifiers, withRepairBonus } from "@/game/modifiers";
import { addRelic, consumeAegis, equipRelic, fuseRelics, recycleRelic, relicsState, type RelicItem } from "@/game/relics";
import { activateCapsule, capsulePct, consumeArmor, craftCapsule, decoyUnits, takeLaunchCapsules, synthesisState, advanceSynthesis } from "@/game/synthesis";
import { setProfileStyle, publicShowcase, sanitizeMotto } from "@/game/profile";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 5, 12);

function player(): PlayerState {
  const p = defaultPlayerState("u1", "Alpha");
  p.resources = { ...p.resources, scrap: 1e9, energy: 1e9, nano: 1e9, data: 1e9 };
  return p;
}

const relic = (id: string, template = "engrenage_varan", rarity: RelicItem["rarity"] = "common"): RelicItem => ({ id, template, rarity, foundAtMs: NOW, source: "test" });

describe("v4.0 commanders", () => {
  it("levels follow the cumulative XP curve, capped at 20", () => {
    expect(commanderLevel(0)).toBe(1);
    expect(commanderLevel(xpForLevel(5))).toBe(5);
    expect(commanderLevel(xpForLevel(5) - 1)).toBe(4);
    expect(commanderLevel(1e9)).toBe(COMMANDER_RULES.maxLevel);
  });

  it("first recruit is free, then paid; only officers on duty earn XP and give bonuses", () => {
    const p = player();
    let paid = 0;
    recruitCommander(p, "admiral", () => (paid += 1), "amber");
    expect(paid).toBe(0);
    recruitCommander(p, "steward", () => (paid += 1), "amber");
    recruitCommander(p, "engineer", () => (paid += 1), "amber");
    expect(paid).toBe(2);
    // Deux postes : l'Ingénieure attend en réserve.
    expect(p.commanders?.active).toEqual(["admiral", "steward"]);
    grantCommanderXp(p, "admiral", xpForLevel(10));
    grantCommanderXp(p, "engineer", 5000);
    expect(p.commanders?.roster.engineer?.xp).toBe(0);
    expect(playerModifiers(p).attack).toBeCloseTo(0.1);
    expect(playerModifiers(p).buildTime).toBe(0);
    // Relève et nomination, puis délai de 24 h.
    assignCommanders(p, ["admiral", "engineer"], NOW);
    expect(() => assignCommanders(p, ["admiral", "steward"], NOW + 3600_000)).toThrow(/changer de poste/);
  });
});

describe("v4.0 relics", () => {
  it("fuse three identical relics into the next rarity, equip one per template, recycle into amber", () => {
    const p = player();
    for (const id of ["a", "b", "c", "d"]) addRelic(p, relic(id));
    const fused = fuseRelics(p, "engrenage_varan", "common", NOW, () => 0.5);
    expect(fused.rarity).toBe("rare");
    expect(relicsState(p).items).toHaveLength(2);
    equipRelic(p, 0, fused.id);
    expect(() => equipRelic(p, 1, "d")).toThrow(/déjà équipée/);
    expect(playerModifiers(p).attack).toBeCloseTo(0.06);
    expect(() => recycleRelic(p, fused.id)).toThrow(/Retire/);
    expect(recycleRelic(p, "d").amber).toBe(5);
  });

  it("the Queen's Aegis protects once per week; repair bonus is capped", () => {
    const p = player();
    addRelic(p, relic("e", "egide_reine", "legendary"));
    equipRelic(p, 0, "e");
    expect(consumeAegis(p, NOW)).toBe(true);
    expect(consumeAegis(p, NOW + 3600_000)).toBe(false);
    expect(consumeAegis(p, NOW + 8 * 86400_000)).toBe(true);
    addRelic(p, relic("r", "matrice_reparation", "legendary"));
    equipRelic(p, 1, "r");
    expect(withRepairBonus(0.9, p)).toBe(0.95);
  });
});

describe("v4.0 synthesis lab", () => {
  it("crafts capsules up to the lab level, stores them, and spends them", () => {
    const p = player();
    p.buildings.labo_synthese = { level: 4, unlocked: true };
    expect(() => craftCapsule(p, "assault", 5, NOW)).toThrow(/niveau 4/);
    const job = craftCapsule(p, "assault", 4, NOW);
    expect(advanceSynthesis(p, job.endsAtMs - 1)).toBeNull();
    expect(advanceSynthesis(p, job.endsAtMs)).toEqual({ type: "assault", level: 4 });
    expect(capsulePct(4)).toBe(20);
    const launch = takeLaunchCapsules(p, { assault: true }, { chasseur: 10 }, ["chasseur"]);
    expect(launch.boosts.assault).toBe(20);
    expect(synthesisState(p).stock.assault).toEqual([]);
  });

  it("armor is consumed by the first attack; the decoy fakes counts within ±pct", () => {
    const p = player();
    p.synthesis = { ...synthesisState(p), stock: { assault: [], armor: [3], decoy: [], veil: [] } };
    expect(activateCapsule(p, "armor", 3, NOW)).toBe(15);
    expect(consumeArmor(p, NOW + 1000)).toBe(15);
    expect(consumeArmor(p, NOW + 2000)).toBe(0);
    let i = 0;
    const seq = [1, 0.99];
    const fake = decoyUnits({ chasseur: 100 }, 50, ["chasseur", "croiseur"], () => seq[i++ % 2]);
    const total = Object.values(fake).reduce((a, b) => a + b, 0);
    expect(total).toBe(150);
  });
});

describe("v4.0 profile", () => {
  it("free banners only until earned; motto is cleaned; showcase lists officers and relics", () => {
    const p = player();
    expect(() => setProfileStyle(p, { banner: "leviathan" })).toThrow(/verrouillée/);
    setProfileStyle(p, { banner: "braise", motto: "  <b>Personne\n ne passe</b>  " });
    expect(p.profileStyle).toEqual({ banner: "braise", emblem: "rank", motto: "bPersonne ne passe/b", pinned: [] });
    expect(sanitizeMotto("x".repeat(100))).toHaveLength(60);
    p.stats = { ...(p.stats ?? {}), leviathanKills: 1 } as PlayerState["stats"];
    setProfileStyle(p, { banner: "leviathan", emblem: "leviathan" });
    recruitCommander(p, "spy", () => undefined, "amber");
    addRelic(p, relic("z", "oeil_vesper", "epic"));
    equipRelic(p, 0, "z");
    const show = publicShowcase(p);
    expect(show.banner.image).toMatch(/leviathan/);
    expect(show.commanders).toEqual([{ id: "spy", level: 1 }]);
    expect(show.relics).toEqual([{ template: "oeil_vesper", rarity: "epic" }]);
  });
});

describe("v4.9.3 : succès en vitrine", () => {
  it("seuls les succès obtenus, 3 au plus, publiés dans la vitrine", () => {
    const p = player();
    p.unlockedAchievements = ["a1", "a2", "a3", "a4"];
    expect(() => setProfileStyle(p, { pinned: ["zz"] })).toThrow(/obtenus/);
    expect(() => setProfileStyle(p, { pinned: ["a1", "a2", "a3", "a4"] })).toThrow(/3 succès/);
    setProfileStyle(p, { pinned: ["a2", "a1", "a2"] });
    expect(publicShowcase(p).achievements).toEqual(["a2", "a1"]);
  });
});
