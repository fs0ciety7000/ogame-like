import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, defaultGameContent, validateGameContent } from "@/game/content";
import {
  ACHIEVEMENT_PACE_RULES,
  ACHIEVEMENTS,
  DEFAULT_ACHIEVEMENTS,
  checkNewAchievements,
  paceDescription,
  paceThreshold,
  setAchievements,
  type AchievementDef,
} from "@/game/achievements";
import { proposeAchievementTiers } from "@/game/procedural";
import { defaultPlayerState } from "@/game/defaults";
import { formatInt } from "@/game/format";
import { UNITS } from "@/game/units";
import type { PlayerState } from "@/types/game";

/* 6.14.117 (É30-6, PRG-5, AE-12) : rythme des succès. Seuil en jeu = seuil écrit × facteur de la mesure (succès de volume,
   palier bronze gardé), réglable dans l'admin (`achievementPace`) ; un succès gagné reste gagné. */

const T0 = Date.UTC(2026, 10, 3, 4, 29);
const byId = (id: string) => ACHIEVEMENTS.find((a) => a.id === id)!;

afterEach(() => {
  applyGameContent({});
  setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS));
});

function withUnits(count: number, now = T0): PlayerState {
  const p = defaultPlayerState("u1", "Joueur");
  p.lastActiveMs = now;
  const ship = UNITS.find((u) => u.category !== "defense")!;
  p.units = { [ship.id]: { count, level: 1 } } as PlayerState["units"];
  return p;
}

describe("6.14.117 : rythme des succès (É30-6)", () => {
  it("seuils en jeu : volume × facteur, bronze et mesures bornées au seuil écrit, textes réécrits", () => {
    applyGameContent({});
    expect(byId("fleet").threshold).toBe(50); // bronze gardé
    expect(byId("squadron").threshold).toBe(5000);
    expect(byId("armada").threshold).toBe(50_000);
    expect(byId("armada").description).toBe(`Possède ${formatInt(50_000)} unités.`);
    expect(byId("bastion").threshold).toBe(10_000);
    expect(byId("corsair").description).toBe("Pille 10 millions de ressources.");
    expect(byId("tycoon").threshold).toBe(10_000_000_000);
    expect(byId("tycoon").description).toBe("Échange 10 milliards de ressources au marché.");
    expect(byId("pillar").description).toBe("Donne 4 milliards de ressources au trésor.");
    expect(byId("patron").description).toBe("Donne 200 millions de ressources au trésor.");
    expect(byId("merchant").description).toBe("Échange 1 million de ressources au marché."); // bronze
    // Mesures bornées par le jeu : inchangées (la bascule du rythme les étire).
    expect(byId("masterpiece").threshold).toBe(20);
    expect(byId("savant").threshold).toBe(75);
    expect(byId("rising_star").threshold).toBe(7500);
  });

  it("chaque succès par défaut dont le seuil change garde son texte juste (nouveau nombre écrit)", () => {
    applyGameContent({});
    const written = new Map(DEFAULT_ACHIEVEMENTS.map((a) => [a.id, a]));
    let changed = 0;
    for (const a of ACHIEVEMENTS) {
      const w = written.get(a.id);
      if (!w || w.threshold === a.threshold) continue;
      changed++;
      expect(a.description, a.id).not.toBe(w.description);
      expect(a.description.replace(/[\u00a0\u202f]/g, " "), a.id).toMatch(/\d/);
    }
    expect(changed).toBeGreaterThanOrEqual(12);
  });

  it("palier généré : « Mesure : 1 500. » devient le seuil en jeu ; nombre absent du texte → texte gardé", () => {
    expect(paceDescription("Défenses possédées : 1 500.", 1500, 15_000)).toBe(`Défenses possédées : ${formatInt(15_000)}.`);
    expect(paceDescription(`Ressources échangées au marché (cumul) : ${formatInt(75_000_000)}.`, 75_000_000, 15_000_000_000)).toBe(
      `Ressources échangées au marché (cumul) : ${formatInt(15_000_000_000)}.`,
    );
    expect(paceDescription("Possède 2 500 unités et 25 navires.", 25, 250)).toBe(`Possède 2 500 unités et ${formatInt(250)} navires.`);
    expect(paceDescription("Texte libre.", 10, 100)).toBe("Texte libre.");
  });

  it("réglable dans l'admin : décoché → seuils écrits ; facteur partiel fusionné ; bornes vérifiées", () => {
    applyGameContent({ rules: { ...defaultGameContent().rules, achievementPace: { ...ACHIEVEMENT_PACE_RULES, enabled: false } } });
    expect(byId("armada").threshold).toBe(5000);
    expect(byId("armada").description).toBe("Possède 5 000 unités.");
    applyGameContent({ rules: { achievementPace: { scales: { traded: 1 } } } } as never);
    expect(byId("tycoon").threshold).toBe(50_000_000);
    expect(byId("armada").threshold).toBe(50_000); // autres facteurs gardés
    applyGameContent({ rules: { achievementPace: { keepBronze: false } } } as never);
    expect(byId("fleet").threshold).toBe(500);
    const bad = (scales: Record<string, number>) => validateGameContent({ ...defaultGameContent(), rules: { ...defaultGameContent().rules, achievementPace: { ...ACHIEVEMENT_PACE_RULES, scales } } });
    expect(bad({ traded: 0.5 }).some((e) => /Rythme des succès/.test(e))).toBe(true);
    expect(bad({ inconnue: 2 }).some((e) => /mesure inconnue/.test(e))).toBe(true);
    expect(bad({ traded: 50 }).some((e) => /Rythme des succès/.test(e))).toBe(false);
  });

  it("un succès gagné reste gagné ; un nouveau joueur l'obtient au seuil en jeu", () => {
    applyGameContent({});
    const veteran = withUnits(6000);
    veteran.unlockedAchievements = ["fleet", "squadron", "armada"];
    expect(checkNewAchievements(veteran).map((a) => a.id)).not.toContain("armada");
    expect(veteran.unlockedAchievements).toContain("armada");
    const rookie = withUnits(6000);
    const got = checkNewAchievements(rookie).map((a) => a.id);
    expect(got).toContain("squadron");
    expect(got).not.toContain("armada");
    expect(checkNewAchievements(withUnits(50_000)).map((a) => a.id)).toContain("armada");
  });

  it("ordre des paliers gardé dans une mesure, paliers générés compris", () => {
    const stored: AchievementDef[] = [
      ...structuredClone(DEFAULT_ACHIEVEMENTS),
      { ...structuredClone(DEFAULT_ACHIEVEMENTS.find((a) => a.id === "bastion")!), id: "bastion_auto1", tier: "or", threshold: 1500, description: "Défenses possédées : 1 500.", auto: true },
    ];
    applyGameContent({ achievements: stored });
    const ladder = ACHIEVEMENTS.filter((a) => a.metric === "defensesTotal");
    expect(ladder.map((a) => a.threshold)).toEqual([10_000, 15_000]);
    for (const metric of Object.keys(ACHIEVEMENT_PACE_RULES.scales)) {
      const written = stored.filter((a) => a.metric === metric).sort((x, y) => x.threshold - y.threshold);
      const shown = written.map((a) => paceThreshold(a));
      expect([...shown].sort((x, y) => x - y), metric).toEqual(shown);
    }
  });

  it("générateur : détenteurs comptés au seuil en jeu, palier suivant écrit sur le seuil écrit", () => {
    applyGameContent({});
    const defs = structuredClone(DEFAULT_ACHIEVEMENTS);
    const few = [withUnits(60_000), withUnits(60_000), withUnits(60_000)];
    // Marée d'acier : 50 000 écrits, 500 000 en jeu → personne ne la tient.
    expect(proposeAchievementTiers(defs, few, T0).find((o) => o.def.metric === "unitsTotal")).toBeUndefined();
    const many = [withUnits(500_000), withUnits(500_000), withUnits(500_000)];
    const out = proposeAchievementTiers(defs, many, T0).find((o) => o.def.metric === "unitsTotal");
    expect(out?.def.threshold).toBe(75_000);
    expect(paceThreshold(out!.def)).toBe(750_000);
    expect(out?.reason).toContain(formatInt(500_000));
    expect(out?.reason).toContain(formatInt(750_000));
  });
});
