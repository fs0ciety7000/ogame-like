import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, defaultGameContent, validateGameContent } from "@/game/content";
import {
  ACHIEVEMENTS,
  achievementProgress,
  achievementVisibility,
  checkNewAchievements,
  CONTENT_ACHIEVEMENT_RULES,
  contentAchievements,
  DEFAULT_ACHIEVEMENTS,
  derivedAchievements,
  previousTier,
  setAchievements,
  TIER_REWARDS,
  unitAchievementThresholds,
  validateAchievements,
} from "@/game/achievements";
import { BUILDINGS } from "@/game/buildings";
import { rawUnitCapacity } from "@/game/hangar";
import { validateContest } from "@/game/contests";
import { defaultPlayerState } from "@/game/defaults";
import { formatInt } from "@/game/format";
import { proposeAchievementTiers } from "@/game/procedural";
import { validateTitles } from "@/game/titles";
import { UNITS } from "@/game/units";
import type { PlayerState } from "@/types/game";

/* 6.14.129 (AJ27-6, AU27 AJ-1) : succès dérivés par unité (« Escadre », « Maître ») et par bâtiment (« niveau 20 »), générés
   depuis le contenu en vigueur et réglables (`contentAchievements`), sans retirer un succès gagné (I25). */

const T0 = Date.UTC(2026, 9, 8, 9);
const byId = (id: string) => ACHIEVEMENTS.find((a) => a.id === id);

afterEach(() => {
  applyGameContent({});
  setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS));
});

function player(units: Record<string, { count: number; level: number }> = {}, buildings: Record<string, number> = {}): PlayerState {
  const p = defaultPlayerState("u1", "Joueur");
  p.lastActiveMs = T0;
  p.units = { ...(p.units ?? {}), ...units } as PlayerState["units"];
  for (const [id, level] of Object.entries(buildings)) p.buildings = { ...p.buildings, [id]: { ...(p.buildings?.[id] ?? {}), level } } as PlayerState["buildings"];
  return p;
}

describe("6.14.129 : succès par unité et par bâtiment (AJ27-6)", () => {
  it("chaque unité a « Escadre » et « Maître », chaque bâtiment son niveau ; 61 succès de plus", () => {
    applyGameContent({});
    for (const u of UNITS) {
      expect(byId(`unite_${u.id}_escadre`)?.target, u.id).toBe(u.id);
      expect(byId(`unite_${u.id}_maitre`)?.metric, u.id).toBe("unitMastery");
    }
    for (const b of BUILDINGS) expect(byId(`batiment_${b.id}_niveau`)?.threshold, b.id).toBe(Math.min(20, b.maxLevel));
    expect(contentAchievements()).toHaveLength(UNITS.length * 2 + BUILDINGS.length);
    // Rien ne se répète : un identifiant par succès, aucun conflit avec les succès écrits et dérivés des catalogues.
    const ids = ACHIEVEMENTS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ACHIEVEMENTS.length).toBe(DEFAULT_ACHIEVEMENTS.length + derivedAchievements().length + contentAchievements().length);
    expect(validateAchievements(ACHIEVEMENTS)).toEqual([]);
  });

  it("seuils : escadre sous le maître, atteignables (hangar plein), textes lus dans la règle", () => {
    applyGameContent({});
    const full = (c: "attack" | "defense") => rawUnitCapacity(Object.fromEntries(BUILDINGS.map((b) => [b.id, { level: b.maxLevel }])) as Parameters<typeof rawUnitCapacity>[0], c);
    for (const u of UNITS) {
      const t = unitAchievementThresholds(u);
      expect(t.fleet, u.id).toBeLessThan(t.master);
      expect(t.master * u.hangarSpace, u.id).toBeLessThanOrEqual(full(u.category === "defense" ? "defense" : "attack"));
      expect(t.fleet, u.id).toBeGreaterThanOrEqual(CONTENT_ACHIEVEMENT_RULES.unitFleetMin);
    }
    const star = byId("unite_etoile_noire_escadre")!;
    expect(star.description).toBe(`Possède ${formatInt(star.threshold)} × Étoile Noire.`);
    expect(byId("unite_etoile_noire_maitre")!.description).toContain("au niveau 10");
    expect(byId("batiment_entrepot_niveau")!.name).toBe("Entrepôt niveau 20");
    expect(byId("unite_roquette_escadre")!.name).toBe("Rempart : Roquette");
  });

  it("une unité ajoutée dans l'admin reçoit ses succès ; retirée, ils disparaissent du registre", () => {
    const units = [...defaultGameContent().units, { ...defaultGameContent().units[2], id: "corvette", name: "Corvette" }];
    applyGameContent({ units });
    expect(byId("unite_corvette_escadre")?.name).toBe("Escadre : Corvette");
    expect(byId("unite_corvette_maitre")).toBeTruthy();
    applyGameContent({});
    expect(byId("unite_corvette_escadre")).toBeUndefined();
  });

  it("réglables : activation, palier, récompense, seuil imposé, textes, succès coupés", () => {
    const rules = {
      ...defaultGameContent().rules,
      contentAchievements: {
        unitMasterEnabled: false,
        unitFleetTier: "legendaire",
        unitFleetXp: 99,
        unitFleetHours: 3,
        unitFleetName: "Flotte de {name}",
        buildingLevel: 15,
        thresholds: { unite_chasseur_escadre: 100 },
        disabled: ["batiment_entrepot_niveau"],
      },
    } as never;
    applyGameContent({ rules });
    expect(byId("unite_chasseur_maitre")).toBeUndefined();
    const ch = byId("unite_chasseur_escadre")!;
    expect([ch.tier, ch.rewardXp, ch.rewardHours, ch.threshold, ch.name, ch.description]).toEqual(["legendaire", 99, 3, 100, "Flotte de Chasseur", "Possède 100 × Chasseur."]);
    expect(byId("batiment_hangar_attaque_niveau")!.threshold).toBe(15);
    expect(byId("batiment_entrepot_niveau")).toBeUndefined();
    // Fusion champ par champ : un réglage partiel garde les autres valeurs par défaut.
    expect(byId("batiment_hangar_attaque_niveau")!.rewardXp).toBe(CONTENT_ACHIEVEMENT_RULES.buildingXp);
    applyGameContent({ rules: { ...defaultGameContent().rules, contentAchievements: { enabled: false } } as never });
    expect(ACHIEVEMENTS.some((a) => a.target)).toBe(false);
  });

  it("la valeur suit le contenu visé ; le maître demande le niveau maximal", () => {
    applyGameContent({});
    const fleet = byId("unite_chasseur_escadre")!;
    const master = byId("unite_chasseur_maitre")!;
    const p = player({ chasseur: { count: master.threshold, level: 9 } }, { entrepot: 20 });
    expect(achievementProgress(fleet, p).done).toBe(true);
    expect(achievementProgress(master, p).value).toBe(0);
    expect(achievementProgress(byId("batiment_entrepot_niveau")!, p).done).toBe(true);
    const got = checkNewAchievements(p).map((a) => a.id);
    expect(got).toContain("unite_chasseur_escadre");
    expect(got).not.toContain("unite_chasseur_maitre");
    expect(got).not.toContain("unite_fregate_escadre");
    p.units!.chasseur!.level = 10;
    expect(checkNewAchievements(p).map((a) => a.id)).toContain("unite_chasseur_maitre");
  });

  it("aucun succès gagné n'est repris : seuil relevé ou succès coupé, il reste dans le profil", () => {
    applyGameContent({});
    const p = player({ chasseur: { count: 200, level: 10 } });
    p.unlockedAchievements = ["unite_chasseur_escadre"];
    applyGameContent({ rules: { ...defaultGameContent().rules, contentAchievements: { enabled: false } } as never });
    expect(checkNewAchievements(p).some((a) => a.id === "unite_chasseur_escadre")).toBe(false);
    expect(p.unlockedAchievements).toEqual(["unite_chasseur_escadre"]);
    applyGameContent({ rules: { ...defaultGameContent().rules, contentAchievements: { thresholds: { unite_chasseur_escadre: 10_000 } } } as never });
    expect(checkNewAchievements(p).some((a) => a.id === "unite_chasseur_escadre")).toBe(false);
    expect(p.unlockedAchievements).toEqual(["unite_chasseur_escadre"]);
  });

  it("brouillard : rangé par mesure et contenu (l'escadre de frégates ne cache pas celle des chasseurs)", () => {
    applyGameContent({});
    const vis = achievementVisibility(ACHIEVEMENTS, new Set());
    expect(vis.get("unite_chasseur_escadre")).toBe("shown");
    expect(vis.get("unite_fregate_escadre")).toBe("shown");
    expect(previousTier(ACHIEVEMENTS, byId("unite_chasseur_escadre")!)).toBeNull();
  });

  it("hors des paliers générés, des concours et des titres ; palier inconnu refusé", () => {
    applyGameContent({});
    const p = player({ chasseur: { count: 1e6, level: 10 } }, { entrepot: 20 });
    const props = proposeAchievementTiers(ACHIEVEMENTS, Array.from({ length: 20 }, () => p), T0);
    expect(props.some((x) => ["unitOwned", "unitMastery", "buildingLevel"].includes(x.def.metric))).toBe(false);
    expect(validateContest({ title: "x", metric: "unitOwned", startMs: T0, endMs: T0 + 3600_000, potShare: 0.1, places: [0.5, 0.3, 0.2], amberShare: 0 }, T0)).toContain("Critère réservé aux succès par contenu.");
    const title = { id: "t", label: "T", rarity: "commun", enabled: true, unlock: { metric: "buildingLevel", threshold: 1 } };
    expect(validateTitles([title] as never).join(" ")).toMatch(/réservée aux succès par contenu/);
    const bad = { ...defaultGameContent(), rules: { ...defaultGameContent().rules, contentAchievements: { ...CONTENT_ACHIEVEMENT_RULES, unitFleetTier: "platine" } } } as never;
    expect(validateGameContent(bad).join(" ")).toMatch(/palier « platine » inconnu/);
    // Un succès écrit à mesure ciblée sans contenu visé est refusé.
    expect(validateAchievements([{ ...DEFAULT_ACHIEVEMENTS[0], metric: "unitOwned" }]).join(" ")).toMatch(/contenu visé manquant/);
  });

  it("récompenses par défaut : escadre argent sans production, maître et bâtiment or à 1 h", () => {
    applyGameContent({});
    const f = byId("unite_fregate_escadre")!;
    const m = byId("unite_fregate_maitre")!;
    const b = byId("batiment_entrepot_niveau")!;
    expect([f.tier, f.rewardXp, f.rewardHours]).toEqual(["argent", TIER_REWARDS.argent.xp, 0]);
    expect([m.tier, m.rewardXp, m.rewardHours]).toEqual(["or", TIER_REWARDS.or.xp, 1]);
    expect([b.tier, b.rewardXp, b.rewardHours]).toEqual(["or", TIER_REWARDS.or.xp, 1]);
  });
});
