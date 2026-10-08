import { readFileSync } from "node:fs";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ACHIEVEMENTS, checkNewAchievements, DEFAULT_ACHIEVEMENTS, METRICS, setAchievements } from "@/game/achievements";
import { BUILDINGS } from "@/game/buildings";
import { codexRewards, DEFAULT_CODEX_REWARDS, normalizeCodexRewards } from "@/game/chronicles";
import { CODEX_CATEGORIES, codexCategoryState, codexEntries } from "@/game/codex";
import { advanceColonies, BIOMES, biomeImage, BIOME_ART, COLONY_RULES, COLONY_SPECS, colonySpecImage, RARE_DEPOSITS, runColonyRoute, setColonyRoute, setColonySpec, startColonization } from "@/game/colonies";
import { applyGameContent } from "@/game/content";
import { contentChainReport } from "@/game/contentChain";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { completeFleetReturn, performLaunch, recallFleet, type Fleet } from "@/game/fleets";
import { jumpedFleet } from "@/game/jumpGate";
import type { PlayerState } from "@/types/game";

/* 6.14.115 (AJ27-5, audit AU27 AJ-3) : les colonies dans la chaîne de contenu : succès, Codex des biomes et des spécialisations,
   section Formules. */

const NOW = Date.UTC(2026, 9, 8, 12);
const H = 3600_000;

function colon(colonies = 1): PlayerState {
  const p = { ...defaultPlayerState("u1", "Colon"), createdAt: null } as unknown as PlayerState;
  for (const b of BUILDINGS) p.buildings[b.id] = { level: 15, unlocked: true };
  for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 2e9;
  p.resourcesUpdatedAtMs = NOW;
  for (let i = 0; i < colonies; i++) {
    startColonization(p, `Néo ${i + 1}`, NOW + i * 10 * H);
    advanceColonies(p, NOW + (i * 10 + 3) * H);
  }
  p.units.chasseur = { level: 1, count: 20 };
  p.xp = 5_000_000;
  p.createdAtMs = NOW - 60 * 24 * H;
  return p;
}

const value = (metric: keyof typeof METRICS, p: PlayerState) => METRICS[metric].value(p);

beforeEach(() => setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS)));
afterEach(() => applyGameContent({}));

describe("6.14.115 : succès des colonies", () => {
  it("quatre succès : entrée (1re colonie) et maîtrise (toutes les colonies, 100 convois, base avancée tenue)", () => {
    const ids = ["colonie_1", "colonie_all", "convoyeur_100", "base_avancee_1"];
    for (const id of ids) expect(ACHIEVEMENTS.find((a) => a.id === id && a.enabled), id).toBeTruthy();
    expect(ACHIEVEMENTS.find((a) => a.id === "convoyeur_100")!.threshold).toBe(100);
  });

  it("colonies fondées, puis toutes les colonies permises (nombre lu dans la règle, à l'usage)", () => {
    const p = colon(1);
    expect(value("coloniesFounded", p)).toBe(1);
    expect(value("coloniesMaxed", p)).toBe(0);
    COLONY_RULES.maxColonies = 1;
    try {
      expect(value("coloniesMaxed", p)).toBe(1);
    } finally {
      COLONY_RULES.maxColonies = 2;
    }
    expect(value("coloniesMaxed", colon(2))).toBe(1);
  });

  it("un succès gagné reste quand la règle change (admin qui relève le nombre de colonies)", () => {
    const p = colon(2);
    const got = checkNewAchievements(p).map((a) => a.id);
    expect(got).toEqual(expect.arrayContaining(["colonie_1", "colonie_all"]));
    p.unlockedAchievements = [...(p.unlockedAchievements ?? []), ...got];
    COLONY_RULES.maxColonies = 3;
    try {
      expect(value("coloniesMaxed", p)).toBe(0);
      checkNewAchievements(p);
      expect(p.unlockedAchievements).toContain("colonie_all");
    } finally {
      COLONY_RULES.maxColonies = 2;
    }
  });

  it("convoi arrivé compté, convoi vide non compté", () => {
    const p = colon(1);
    const c = p.colonies![0];
    for (const k of Object.keys(p.resources)) (p.resources as Record<string, number>)[k] = 0;
    c.resources.scrap = 5_000_000;
    setColonyRoute(p, c.id, 6, 0, NOW);
    runColonyRoute(c, p, NOW + 6 * H);
    expect(value("colonyConvoys", p)).toBe(1);
    for (const k of Object.keys(c.resources)) (c.resources as Record<string, number>)[k] = 0;
    runColonyRoute(c, p, NOW + 12 * H);
    expect(value("colonyConvoys", p)).toBe(1);
  });

  it("base avancée : comptée seulement au bout de son séjour (ni levée, ni rapatriée par la porte)", () => {
    const launch = (p: PlayerState): Fleet => {
      const out = performLaunch({ mission: "colonybase", now: NOW, owner: p, ownerQueues: defaultQueues(), fleet: { chasseur: 10 }, baseColonyId: p.colonies![0].id, basesAtColony: 0 });
      return { ...(out.fleet as Fleet), id: "b1", status: "stationed", stationedUntilMs: out.fleet.arriveAtMs + (out.fleet.durationMs ?? 0) };
    };
    // Séjour complet : la tâche serveur la renvoie à `stationedUntilMs` (endGarrison), retour plus tard.
    const p = colon(1);
    const base = launch(p);
    const end = base.stationedUntilMs!;
    completeFleetReturn(p, { ...base, status: "returning", returnAtMs: end + H }, end + H);
    expect(value("colonyBaseTours", p)).toBe(1);
    // Levée avant la fin.
    const q = colon(1);
    const lifted = recallFleet(launch(q), "u1", NOW + 2 * 24 * H);
    completeFleetReturn(q, lifted, lifted.returnAtMs!);
    expect(value("colonyBaseTours", q)).toBe(0);
    // Rapatriée par la porte de saut.
    const r = colon(1);
    const jumped = jumpedFleet(launch(r), NOW + 3 * 24 * H);
    completeFleetReturn(r, jumped, NOW + 3 * 24 * H);
    expect(value("colonyBaseTours", r)).toBe(0);
  });
});

describe("6.14.115 : Codex des colonies", () => {
  const colonyEntries = (p: PlayerState) => codexEntries(p, new Set(), NOW).filter((e) => e.category === "colonies");

  it("catégorie « Colonies » : 4 biomes et 4 spécialisations, avec récompense réglable comme les autres catégories", () => {
    expect(CODEX_CATEGORIES.some((c) => c.id === "colonies")).toBe(true);
    const list = colonyEntries(colon(0));
    expect(list.length).toBe(RARE_DEPOSITS.length + COLONY_SPECS.length);
    expect(list.every((e) => !e.unlocked)).toBe(true);
    expect(DEFAULT_CODEX_REWARDS.colonies).toEqual({ tokens: 5, amber: 25 });
    expect(normalizeCodexRewards({ colonies: { tokens: 9, amber: 1 } }).colonies).toEqual({ tokens: 9, amber: 1 });
    expect(codexRewards().colonies).toEqual({ tokens: 5, amber: 25 });
  });

  it("biomes : tous ouverts par le relevé de la première colonie ; la sienne est nommée", () => {
    const p = colon(1);
    const list = colonyEntries(p).filter((e) => e.id.startsWith("colony:biome:"));
    expect(list.every((e) => e.unlocked)).toBe(true);
    expect(list.some((e) => e.facts?.some((f) => f.label === "Tes colonies" && f.value.includes("Néo 1")))).toBe(true);
    for (const b of RARE_DEPOSITS) expect(list.find((e) => e.id === `colony:biome:${b}`)!.name).toBe(BIOMES[b].name);
  });

  it("spécialisation : ouverte au premier choix, gardée après un changement ; catégorie complète réclamable", () => {
    const p = colon(1);
    const c = p.colonies![0];
    for (const [i, sp] of COLONY_SPECS.entries()) setColonySpec(p, c.id, sp.id, NOW + i * 8 * 24 * H);
    const list = colonyEntries(p);
    expect(list.every((e) => e.unlocked)).toBe(true);
    expect(p.stats?.colonySpecsUsed).toEqual(COLONY_SPECS.map((s) => s.id));
    expect(codexCategoryState(p, codexEntries(p, new Set(), NOW), "colonies")).toMatchObject({ complete: true, claimed: false });
  });

  it("une spécialisation choisie avant 6.14.115 (sans trace) est ouverte", () => {
    const p = colon(1);
    p.colonies![0].spec = "bastion";
    expect(colonyEntries(p).find((e) => e.id === "colony:spec:bastion")!.unlocked).toBe(true);
  });

  it("images : spécialisations définitives, biomes provisoires (icône de la ressource) tant que le rendu manque", () => {
    expect(colonySpecImage("forge")).toBe("/assets/colonies/forge.webp");
    for (const b of RARE_DEPOSITS) expect(biomeImage(b)).toBe(BIOME_ART.includes(b) ? `/assets/colonies/biome-${b}.webp` : `/assets/icons/${b}.webp`);
    const slots = (JSON.parse(readFileSync("scripts/illustrations.json", "utf8")) as { slots: { id: string; target: string }[] }).slots;
    for (const b of RARE_DEPOSITS) expect(slots.find((s) => s.id === `colonie-biome-${b}`)?.target, b).toBe(`public/assets/colonies/biome-${b}.webp`);
  });
});

describe("6.14.115 : chaîne et Formules", () => {
  it("chaque biome et spécialisation a son Codex et ses succès d'entrée et de maîtrise", () => {
    const rows = contentChainReport().filter((r) => r.kind === "colony");
    expect(rows.length).toBe(8);
    for (const r of rows) expect([r.links.codex, r.links.achievementEntry, r.links.achievementMastery], r.id).toEqual([true, true, true]);
  });

  it("la page Formules a sa section Colonies, chiffres lus dans les règles", () => {
    const src = readFileSync("src/components/game/FormulasGuide.tsx", "utf8");
    expect(src).toContain('{ id: "colonies", label: "Colonies"');
    const block = src.slice(src.indexOf('<Block id="colonies"'), src.indexOf('<Block id="gains"'));
    for (const rule of ["COLONY_RULES.productionBonus", "COLONY_ROUTE_RULES.feePct", "DEPOSIT_RULES.perSecond", "COLONY_RULES.levelsRequired", "COLONY_SPECS"]) expect(block, rule).toContain(rule);
    expect(block).not.toMatch(/\+50 %|10 % perdus/);
  });
});
