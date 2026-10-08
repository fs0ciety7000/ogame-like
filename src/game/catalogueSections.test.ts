import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, CONTENT_SECTIONS, contentSectionErrors, currentGameContent, defaultGameContent, validateGameContent } from "@/game/content";
import { CATALOG_START, catalogCycle, catalogEntryFor, catalogIndex, DEFAULT_SEASON_CATALOG, DEFAULT_THEME_ROTATION, THEME_PRIMARY, THEME_ROTATION, type SeasonCatalogEntry } from "@/game/seasonCatalog";
import { DEFAULT_PASS_THEMES, generatePassSeason, nextMonthId, PASS_THEMES, publishPassSeason, regenerateChallenges, type PassTheme } from "@/game/passSeasons";
import { bannerOptions } from "@/game/profile";
import { ACHIEVEMENTS, DEFAULT_ACHIEVEMENTS, setAchievements } from "@/game/achievements";

/* =====================================================
   6.14.128 (AU27, lot AA9, constat AA-23) : thèmes du passe et catalogue des
   saisons en sections de contenu. Un thème ajouté entre dans la rotation et
   donne ses passes ; un thème retiré la quitte, les passes écrits gardent
   leur copie ; contenu par défaut = catalogue livré (capture avant / après
   dans la fiche du lot).
===================================================== */

afterEach(() => applyGameContent({}));

const digest = { monthId: "x", observedDays: 25, activePlayers: 20, weeklyMedian: {}, totals: {}, heroes: {}, episodes: [], passMedianTier: 18, passTiers: 30, passFinishedShare: 0.3, chapterShare: 0.4 };

const NEBULEUSE: PassTheme = {
  ...structuredClone(DEFAULT_PASS_THEMES[0]),
  id: "nebuleuse",
  accent: "#33ccaa",
  image: "/assets/pass/theme-nebuleuse.webp",
  primary: "engineer",
};
const entry = (year: number): SeasonCatalogEntry => ({
  id: `nebuleuse_${year}`,
  theme: "nebuleuse",
  year,
  name: `Nébuleuse ${year}`,
  tagline: "Une brume qui chante.",
  synopsis: "{mentor} entend un chant dans la brume ; {rival} veut le faire taire.",
  commander: { name: `Ondine ${year}`, title: "Pilote des brumes", secondary: "spy", lore: "{commander} connaît la brume.", look: "a misty pilot" },
  scene: "a teal nebula",
});

/** Mois du catalogue au rang `i` (0 : CATALOG_START). */
const monthAt = (i: number) => {
  let m = CATALOG_START;
  for (let k = 0; k < i; k++) m = nextMonthId(m);
  return m;
};

describe("AA9 (6.14.128) : sections « passThemes » et « seasonCatalog »", () => {
  it("contenu par défaut : catalogue livré, rotation de douze thèmes sur trois ans", () => {
    expect(CONTENT_SECTIONS).toEqual(expect.arrayContaining(["passThemes", "seasonCatalog"]));
    const d = defaultGameContent();
    expect(d.passThemes.map((t) => t.id)).toEqual([...DEFAULT_THEME_ROTATION]);
    expect(d.seasonCatalog).toEqual(DEFAULT_SEASON_CATALOG);
    expect(validateGameContent(d)).toEqual([]);
    expect(THEME_ROTATION).toEqual([...DEFAULT_THEME_ROTATION]);
    expect(catalogCycle()).toBe(36);
    expect(PASS_THEMES.find((t) => t.id === "maree")?.primary).toBe("admiral");
  });

  it("un thème ajouté (trois saisons) entre dans la rotation et donne ses passes", () => {
    applyGameContent({ passThemes: [...DEFAULT_PASS_THEMES, NEBULEUSE], seasonCatalog: [...DEFAULT_SEASON_CATALOG, entry(1), entry(2), entry(3)] });
    expect(THEME_ROTATION).toHaveLength(13);
    expect(catalogCycle()).toBe(39);
    expect(THEME_PRIMARY.nebuleuse).toBe("engineer");
    const m = monthAt(12);
    expect(catalogIndex(m)).toBe(12);
    expect(catalogEntryFor(m).id).toBe("nebuleuse_1");
    expect(catalogEntryFor(monthAt(25)).id).toBe("nebuleuse_2");
    const s = generatePassSeason({ monthId: m, digest: { ...digest, monthId: m } as never, existing: [], now: 0 });
    expect(s.theme).toMatchObject({ id: "nebuleuse", name: "Nébuleuse 1", accent: "#33ccaa" });
    expect(s.commander).toMatchObject({ name: "Ondine 1", primary: "engineer", secondary: "spy" });
    expect(s.scenario.synopsis).not.toContain("{mentor}");
  });

  it("un thème retiré quitte la rotation ; un passe déjà écrit sur ce thème garde ses défis (thème toujours connu)", () => {
    const s = generatePassSeason({ monthId: "2026-11", digest: { ...digest, monthId: "2026-11" } as never, existing: [], now: 0 });
    expect(s.theme.id).toBe("vide");
    applyGameContent({ passThemes: DEFAULT_PASS_THEMES.map((t) => (t.id === "vide" ? { ...t, retired: true } : t)) });
    expect(THEME_ROTATION).not.toContain("vide");
    expect(catalogCycle()).toBe(33);
    expect(catalogEntryFor("2026-11").theme).toBe("hiver");
    expect(Object.keys(regenerateChallenges(s, digest as never, 1).requirements)).toHaveLength(30);
  });

  it("la bannière d'un passe terminé garde le nom du passe publié, même si le catalogue change", () => {
    const s = publishPassSeason(generatePassSeason({ monthId: "2026-12", digest: { ...digest, monthId: "2026-12" } as never, existing: [], now: 0 }), 0);
    const renamed = DEFAULT_SEASON_CATALOG.map((e) => (e.id === "hiver_1" ? { ...e, name: "Autre nom" } : e));
    applyGameContent({ passSeasons: { seasons: [s] }, seasonCatalog: renamed });
    expect(bannerOptions({ seasonPass: { completed: ["2026-12"] } } as never).find((b) => b.id === "pass:2026-12")?.label).toBe("Passe « Hiver galactique »");
  });

  it("le succès « Trois ans de campagne » garde son palier (36) quel que soit le catalogue", () => {
    applyGameContent({ seasonCatalog: [...DEFAULT_SEASON_CATALOG, entry(1)], passThemes: [...DEFAULT_PASS_THEMES, { ...NEBULEUSE, retired: true }] });
    setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS));
    expect(ACHIEVEMENTS.find((a) => a.id === "commandant_saison_all")?.threshold).toBe(36);
  });

  it("validation : fiches incomplètes et trous dans le catalogue refusés", () => {
    const c = currentGameContent();
    const errs = (patch: Record<string, unknown>) => validateGameContent({ ...c, ...patch }).join(" · ");
    expect(errs({ passThemes: [...DEFAULT_PASS_THEMES, NEBULEUSE] })).toMatch(/aucune saison pour le thème « nebuleuse », année 1/);
    expect(errs({ passThemes: [...DEFAULT_PASS_THEMES, { ...NEBULEUSE, accent: "bleu", mentor: "inconnu", primary: "pirate" }] })).toMatch(/couleur « bleu » invalide.*mentor « inconnu » inconnu.*rôle principal « pirate » inconnu/);
    expect(errs({ passThemes: [...DEFAULT_PASS_THEMES, { ...NEBULEUSE, beats: [["a"], ["b"], ["c"]] }] })).toMatch(/répliques du mentor : quatre temps/);
    expect(errs({ passThemes: [...DEFAULT_PASS_THEMES, { ...NEBULEUSE, focus: ["voler"] }] })).toMatch(/actions mises en avant inconnues/);
    expect(errs({ seasonCatalog: [...DEFAULT_SEASON_CATALOG, entry(1)] })).toMatch(/thème « nebuleuse » inconnu/);
    expect(errs({ seasonCatalog: [...DEFAULT_SEASON_CATALOG, { ...DEFAULT_SEASON_CATALOG[0], id: "vide_bis" }] })).toMatch(/deux saisons pour « vide », année 1/);
    expect(errs({ seasonCatalog: DEFAULT_SEASON_CATALOG.filter((e) => e.id !== "forge_2") })).toMatch(/aucune saison pour le thème « forge », année 2/);
    expect(errs({ passThemes: DEFAULT_PASS_THEMES.map((t) => ({ ...t, retired: true })) })).toMatch(/au moins un thème en rotation/);
    expect(errs({ passThemes: [...DEFAULT_PASS_THEMES, { ...NEBULEUSE, retired: true }] })).toBe("");
  });

  it("garde du serveur : un thème ajouté sans ses saisons est refusé, avec ses saisons il passe", () => {
    expect(contentSectionErrors("passThemes", [...DEFAULT_PASS_THEMES, NEBULEUSE], {}).join(" ")).toMatch(/aucune saison pour le thème « nebuleuse »/);
    const stored = { seasonCatalog: [...DEFAULT_SEASON_CATALOG, entry(1), entry(2), entry(3)], passThemes: [...DEFAULT_PASS_THEMES, { ...NEBULEUSE, retired: true }] };
    expect(contentSectionErrors("passThemes", [...DEFAULT_PASS_THEMES, NEBULEUSE], stored)).toEqual([]);
  });
});
