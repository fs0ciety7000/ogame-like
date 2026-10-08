import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { ACHIEVEMENTS, DEFAULT_ACHIEVEMENTS, withDefaultAchievements } from "@/game/achievements";
import { applyGameContent, currentGameContent } from "@/game/content";

/* 6.14.56 (AU27, AP-1) : les succès par défaut ajoutés au code après la première écriture de la liste des succès
   (`game_config.achievements`, écrite par le générateur de paliers) restent présents, sauf ceux retirés exprès. */

const LATE = ["chapter_reader", "chapter_keeper", "seal_bearer", "pass_finisher"];
/** Liste stockée sur la pré-prod (AU27 §2.6) : sans les succès des Chroniques et du passe (6.9.2), plus des paliers auto. */
const stored = () => [
  ...structuredClone(DEFAULT_ACHIEVEMENTS).filter((a) => !LATE.includes(a.id)),
  { ...structuredClone(DEFAULT_ACHIEVEMENTS[0]), id: "first_blood_auto2", name: "Premier sang II", threshold: 3, auto: true },
];

afterEach(() => {
  applyGameContent({});
});

describe("succès par défaut toujours présents", () => {
  it("les 4 succès des Chroniques et du passe existent dans le code", () => {
    for (const id of LATE) expect(DEFAULT_ACHIEVEMENTS.some((a) => a.id === id)).toBe(true);
  });

  it("liste enregistrée ancienne + succès par défaut récent → présent (contenu et catalogue en vigueur)", () => {
    applyGameContent({ achievements: stored() });
    const ids = currentGameContent().achievements.map((a) => a.id);
    for (const id of LATE) {
      expect(ids).toContain(id);
      expect(ACHIEVEMENTS.some((a) => a.id === id)).toBe(true);
    }
    // Le reste de la liste enregistrée est gardé (palier auto compris), sans doublon.
    expect(ids).toContain("first_blood_auto2");
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("un succès complété se place après le succès par défaut qui le précède", () => {
    const out = withDefaultAchievements(stored());
    for (const id of LATE) {
      const i = DEFAULT_ACHIEVEMENTS.findIndex((a) => a.id === id);
      const prev = DEFAULT_ACHIEVEMENTS[i - 1].id;
      expect(out.findIndex((a) => a.id === id)).toBeGreaterThan(out.findIndex((a) => a.id === prev));
    }
  });

  it("retiré exprès (removedDefaults) → absent ; les autres reviennent", () => {
    applyGameContent({ achievements: stored(), rules: { achievementList: { removedDefaults: ["seal_bearer"] } } as never });
    const ids = currentGameContent().achievements.map((a) => a.id);
    expect(ids).not.toContain("seal_bearer");
    expect(ids).toContain("pass_finisher");
    expect(currentGameContent().rules.achievementList.removedDefaults).toEqual(["seal_bearer"]);
  });

  it("une valeur modifiée dans l'admin est gardée (le complément n'écrase rien)", () => {
    const list = stored().map((a) => (a.id === "veteran" ? { ...a, threshold: 12 } : a));
    applyGameContent({ achievements: list });
    expect(currentGameContent().achievements.find((a) => a.id === "veteran")?.threshold).toBe(12);
  });

  it("le générateur de paliers n'écrit plus la liste entière (cosmic_db.js)", () => {
    const src = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
    expect(src).not.toMatch(/writeConfig\(txApp, "achievements", content\.achievements\.concat/);
    // 6.14.108 (AP-L4) : la liste enregistrée, paliers générés datés (`stampGeneratedTiers`), sinon la liste du contenu.
    expect(src).toMatch(/Array\.isArray\(storedList\) \? game\.stampGeneratedTiers\(storedList, now\)/);
    expect(src).toMatch(/const base = stamped\.list \|\| content\.achievements;/);
  });
});
