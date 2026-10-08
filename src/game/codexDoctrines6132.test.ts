import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ACHIEVEMENTS, achievementValue, checkNewAchievements, DEFAULT_ACHIEVEMENTS, setAchievements } from "@/game/achievements";
import { applyGameContent, currentGameContent } from "@/game/content";
import { DEFAULT_CODEX_REWARDS } from "@/game/chronicles";
import { CODEX_CATEGORIES, codexCategoryState, codexEntries, codexProgress } from "@/game/codex";
import { setSeasonCommanders } from "@/game/commanders";
import { defaultPlayerState } from "@/game/defaults";
import { empireClasses } from "@/game/empireClass";
import { chooseEmpireClass } from "@/game/empireClassChoose";
import { addModuleItem, buildModule, MODULE_TEMPLATES, modulesState, mountModule, recycleModule } from "@/game/modules";
import { learnTalent, resetTalents, TALENT_BRANCHES, TALENT_RULES, TALENTS } from "@/game/talents";
import type { PlayerState } from "@/types/game";

/* 6.14.132 (AU27, lot AJ27-9, constats AJ-4 et AJ-16) : Codex des officiers de saison, Doctrines (talents, classes d'empire),
   Arsenal (modules) ; succès « Spécialiste », « Arsenal légendaire », « Une identité », « Toutes les doctrines ». */

const NOW = Date.UTC(2026, 9, 8, 12);
const player = (patch: Partial<PlayerState> = {}) => ({ ...defaultPlayerState("u1", "U1"), ...patch }) as PlayerState;
const entries = (p: PlayerState) => codexEntries(p, new Set(), NOW);
const entry = (p: PlayerState, id: string) => entries(p).find((e) => e.id === id)!;
const rich = () => player({ resources: { ...defaultPlayerState("u1", "U1").resources, scrap: 1e9, energy: 1e9, nano: 1e9, data: 1e9, amber: 1e6 } as PlayerState["resources"], ascensions: 10 });

beforeEach(() => setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS)));
afterEach(() => {
  setSeasonCommanders([]);
  applyGameContent({});
});

describe("6.14.132 : catégories Doctrines et Arsenal", () => {
  it("deux catégories, récompense réglable comme les autres (barème des Unités)", () => {
    expect(CODEX_CATEGORIES.map((c) => c.id)).toEqual(expect.arrayContaining(["doctrines", "arsenal"]));
    expect(DEFAULT_CODEX_REWARDS.doctrines).toEqual(DEFAULT_CODEX_REWARDS.units);
    expect(DEFAULT_CODEX_REWARDS.arsenal).toEqual(DEFAULT_CODEX_REWARDS.units);
    const p = player();
    expect(codexCategoryState(p, entries(p), "doctrines").reward).toEqual(DEFAULT_CODEX_REWARDS.units);
    applyGameContent({ chronicles: { ...currentGameContent().chronicles, codexRewards: { ...DEFAULT_CODEX_REWARDS, arsenal: { tokens: 9, amber: 90 } } } } as never);
    expect(codexCategoryState(p, entries(p), "arsenal").reward).toEqual({ tokens: 9, amber: 90 });
  });

  it("une fiche par talent, classe d'empire et modèle de module, verrouillée pour un compte neuf", () => {
    const list = entries(player());
    expect(list.filter((e) => e.category === "doctrines")).toHaveLength(TALENTS.length + empireClasses().length);
    expect(list.filter((e) => e.category === "arsenal" && !e.bonus)).toHaveLength(MODULE_TEMPLATES.length);
    for (const e of list.filter((x) => x.category === "doctrines" || x.category === "arsenal")) {
      expect(e.unlocked, e.id).toBe(false);
      expect(e.image, e.id).toMatch(/^\/assets\//);
      expect(e.text.trim(), e.id).not.toBe("");
    }
  });

  it("talent appris : fiche ouverte et gardée après une redistribution", () => {
    const p = rich();
    learnTalent(p, TALENTS[0].id);
    expect(entry(p, `talent:${TALENTS[0].id}`).unlocked).toBe(true);
    resetTalents(p, NOW);
    expect(entry(p, `talent:${TALENTS[0].id}`).unlocked).toBe(true);
    expect(entry(p, `talent:${TALENTS[1].id}`).unlocked).toBe(false);
  });

  it("classe choisie : fiche ouverte et gardée après un changement ; succès « Une identité » puis « Toutes les doctrines »", () => {
    const p = rich();
    p.bounties = { ...(p.bounties ?? {}), amber: 1000 } as PlayerState["bounties"];
    const [a, b, c] = empireClasses();
    chooseEmpireClass(p, a.id, NOW);
    expect(entry(p, `class:${a.id}`).unlocked).toBe(true);
    expect(achievementValue({ metric: "empireClassesTried" }, p)).toBe(1);
    expect(checkNewAchievements(p).map((x) => x.id)).toContain("classe_1");
    chooseEmpireClass(p, b.id, NOW + 30 * 86_400_000);
    chooseEmpireClass(p, c.id, NOW + 60 * 86_400_000);
    expect(entry(p, `class:${a.id}`).unlocked).toBe(true);
    expect(achievementValue({ metric: "empireClassesTried" }, p)).toBe(3);
    expect(ACHIEVEMENTS.find((x) => x.id === "classe_all")!.threshold).toBe(empireClasses().length);
    expect(checkNewAchievements(p).map((x) => x.id)).toContain("classe_all");
    // Un joueur d'avant la 6.14.132 (classe choisie, sans historique) compte sa classe actuelle.
    const old = player({ empireClass: { id: a.id, chosenAtMs: NOW, changes: 0 } });
    expect(entry(old, `class:${a.id}`).unlocked).toBe(true);
    expect(achievementValue({ metric: "empireClassesTried" }, old)).toBe(1);
  });

  it("module trouvé : fiche ouverte, gardée après le recyclage ; « Arsenal légendaire » au montage d'un légendaire", () => {
    const p = rich();
    const tpl = MODULE_TEMPLATES.find((t) => t.family === "armement")!;
    addModuleItem(p, { id: "m1", template: tpl.id, rarity: "legendary", built: false, foundAtMs: NOW, source: "test" });
    expect(entry(p, `module:${tpl.id}`).unlocked).toBe(true);
    buildModule(p, "m1", () => {});
    mountModule(p, "m1", "heavy", 0);
    expect(achievementValue({ metric: "legendaryModulesMounted" }, p)).toBe(1);
    expect(checkNewAchievements(p).map((x) => x.id)).toContain("arsenal_legendaire");
    recycleModule(p, "m1");
    expect(modulesState(p).items).toHaveLength(0);
    expect(entry(p, `module:${tpl.id}`).unlocked).toBe(true);
    // Joueur d'avant la 6.14.132 : son inventaire compte.
    const old = player({ modules: { items: [{ id: "x", template: tpl.id, rarity: "rare", built: false, foundAtMs: NOW, source: "t" }], slots: { light: [null, null], medium: [null, null], heavy: [null, null], support: [null, null] } } as PlayerState["modules"] });
    expect(entry(old, `module:${tpl.id}`).unlocked).toBe(true);
  });

  it("« Spécialiste » : chaque talent d'une branche au rang maximal", () => {
    const p = rich();
    p.ascensions = 20;
    const branch = TALENT_BRANCHES[0].id;
    const list = TALENTS.filter((t) => t.branch === branch && !t.retired);
    for (const t of list) for (let r = 0; r < TALENT_RULES.maxRank; r++) learnTalent(p, t.id);
    expect(achievementValue({ metric: "talentBranchesComplete" }, p)).toBe(1);
    expect(checkNewAchievements(p).map((x) => x.id)).toContain("doctrine_specialiste");
    // Redistribution : la mesure retombe, le succès gagné reste (I25 : rien ne relit `unlockedAchievements`).
    p.unlockedAchievements = ["doctrine_specialiste"];
    resetTalents(p, NOW);
    expect(achievementValue({ metric: "talentBranchesComplete" }, p)).toBe(0);
    expect(p.unlockedAchievements).toContain("doctrine_specialiste");
  });
});

describe("6.14.132 : officiers de saison (AJ-16)", () => {
  const def = { id: "s-2026-11", name: "Ilsa Varn", title: "Amirale de la Marée", portrait: "/assets/commanders/admiral.webp", primary: "admiral" as const, secondary: "engineer" as const, lore: "Elle a tenu la ligne.", seasonId: "2026-11", seasonLabel: "Novembre 2026" };

  it("fiche en plus pour chaque commandant de saison publié, débloquée à l'obtention, hors du pourcentage", () => {
    const p = player();
    const before = codexProgress(entries(p));
    const officersBefore = codexCategoryState(p, entries(p), "officers");
    setSeasonCommanders([def]);
    const e = entry(p, "officer:s-2026-11");
    expect(e.category).toBe("officers");
    expect(e.bonus).toBe(true);
    expect(e.unlocked).toBe(false);
    expect(e.subtitle).toContain("Novembre 2026");
    expect(codexProgress(entries(p))).toEqual(before);
    expect(codexCategoryState(p, entries(p), "officers").total).toBe(officersBefore.total);
    p.commanders = { roster: { "s-2026-11": { xp: 0 } }, active: [], movedAtMs: {}, dossiers: 0 } as never;
    expect(entry(p, "officer:s-2026-11").unlocked).toBe(true);
  });
});
