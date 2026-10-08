import { readFileSync } from "node:fs";
import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, defaultGameContent } from "@/game/content";
import { ALLIANCE_BOSSES } from "@/game/allianceBoss";
import { chroniclesConfig } from "@/game/chronicles";
import { COLONY_SPECS, RARE_DEPOSITS } from "@/game/colonies";
import { allCommanders, COMMANDER_RULES, COMMANDERS, ROLE_EFFECTS } from "@/game/commanders";
import { EFFECT_CAP_RULES, EFFECT_SOURCE_LABELS, TECH_COMBAT_LIMITS } from "@/game/effects";
import { empireClasses } from "@/game/empireClass";
import { formulaCapRows, formulaClassRows, formulaOfficerRows, formulaSourceRows } from "@/game/formulasRegistry";
import { MODULE_TEMPLATES } from "@/game/modules";
import { matchPaletteContent, paletteContentEntries } from "@/game/paletteContent";
import { RELICS } from "@/game/relics";
import { TALENTS } from "@/game/talents";
import { WORLD_BOSSES } from "@/game/worldBosses";

/* 6.14.130 (AJ27-8, AU27 AJ-8 et AJ-9) : Formules générées depuis les registres (officiers, plafonds, sources, classes) et
   recherche Ctrl+K étendue (reliques, boss, colonies, talents, modules, classes, officiers). */

const FAR = Date.UTC(2100, 0, 1);

afterEach(() => {
  applyGameContent({});
});

describe("6.14.130 : Ctrl+K étendu (AJ27-8)", () => {
  it("chaque contenu des registres a son entrée", () => {
    const keys = new Set(paletteContentEntries(FAR).map((e) => `${e.kind}:${e.id}`));
    for (const r of RELICS.filter((x) => !x.disabled)) expect(keys.has(`relic:${r.id}`), r.id).toBe(true);
    for (const b of WORLD_BOSSES.filter((x) => x.enabled !== false)) expect(keys.has(`worldBoss:${b.id}`), b.id).toBe(true);
    for (const b of ALLIANCE_BOSSES) expect(keys.has(`allianceBoss:${b.id}`), b.id).toBe(true);
    for (const m of chroniclesConfig().months) expect(keys.has(`seasonBoss:${m.id}`), m.id).toBe(true);
    for (const b of RARE_DEPOSITS) expect(keys.has(`colony:${b}`), b).toBe(true);
    for (const s of COLONY_SPECS) expect(keys.has(`colony:${s.id}`), s.id).toBe(true);
    for (const t of TALENTS) expect(keys.has(`talent:${t.id}`), t.id).toBe(true);
    for (const m of MODULE_TEMPLATES) expect(keys.has(`module:${m.id}`), m.id).toBe(true);
    for (const c of empireClasses()) expect(keys.has(`class:${c.id}`), c.id).toBe(true);
    for (const c of allCommanders()) expect(keys.has(`officer:${c.id}`), c.id).toBe(true);
    for (const e of paletteContentEntries(FAR)) expect(e.to, e.id).toMatch(/^\/game\//);
  });

  it("recherche sans accents, 2 lettres au moins, 3 par type au plus ; un boss de chronique à venir reste caché", () => {
    const relic = RELICS.find((r) => !r.disabled)!;
    const q = relic.name.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().slice(0, 5);
    expect(matchPaletteContent(q, FAR).some((e) => e.kind === "relic" && e.id === relic.id)).toBe(true);
    expect(matchPaletteContent("a", FAR)).toEqual([]);
    const perKind = new Map<string, number>();
    for (const e of matchPaletteContent("er", FAR)) perKind.set(e.kind, (perKind.get(e.kind) ?? 0) + 1);
    expect(perKind.size).toBeGreaterThan(1);
    for (const [k, n] of perKind) expect(n, k).toBeLessThanOrEqual(3);
    const months = chroniclesConfig().months;
    if (months.length > 0) {
      const first = [...months].sort((a, b) => (a.id < b.id ? -1 : 1))[0];
      const before = Date.UTC(Number(first.id.slice(0, 4)), Number(first.id.slice(5, 7)) - 2, 15);
      expect(paletteContentEntries(before).some((e) => e.kind === "seasonBoss" && e.id === first.id)).toBe(false);
    }
  });

  it("un contenu ajouté dans l'admin est trouvable", () => {
    const base = defaultGameContent().relics.find((r) => !r.disabled)!;
    applyGameContent({ relics: [...defaultGameContent().relics, { ...base, id: "moteur_corvette", name: "Moteur de corvette" }] });
    expect(matchPaletteContent("moteur de corv", FAR).map((e) => e.id)).toContain("moteur_corvette");
  });

  it("la palette lit la liste et va à la page du contenu", () => {
    const src = readFileSync("src/components/layout/CommandPalette.tsx", "utf8");
    expect(src).toContain("matchPaletteContent(q, Date.now())");
    expect(src).toContain("navigate(e.to)");
  });
});

describe("6.14.130 : Formules générées (AJ27-8)", () => {
  it("officiers : un rang par officier, effet lu dans ROLE_EFFECTS (un réglage change la page)", () => {
    const rows = formulaOfficerRows();
    expect(rows.length).toBe(COMMANDERS.length);
    const admiral = rows.find((r) => r.id === "admiral")!;
    expect(admiral.perLevel).toMatch(/Attaque/);
    const before = admiral.perLevel;
    const saved = ROLE_EFFECTS.admiral[0].perLevel;
    ROLE_EFFECTS.admiral[0].perLevel = saved * 3;
    try {
      expect(formulaOfficerRows().find((r) => r.id === "admiral")!.perLevel).not.toBe(before);
    } finally {
      ROLE_EFFECTS.admiral[0].perLevel = saved;
    }
    expect(admiral.atMax).not.toBe(admiral.perLevel);
    expect(COMMANDER_RULES.maxLevel).toBeGreaterThan(1);
  });

  it("plafonds : lus dans effectCaps et combat.techCombatCap", () => {
    const rows = formulaCapRows();
    expect(rows.find((r) => r.stat === "attack")!.caps.tech).toBe(TECH_COMBAT_LIMITS.cap);
    const saved = EFFECT_CAP_RULES.buildTime.empire;
    EFFECT_CAP_RULES.buildTime.empire = 0.33;
    try {
      expect(formulaCapRows().find((r) => r.stat === "buildTime")!.caps.empire).toBe(0.33);
    } finally {
      EFFECT_CAP_RULES.buildTime.empire = saved;
    }
    expect(rows.find((r) => r.stat === "buildTime")!.reduction).toBe(true);
  });

  it("sources : chaque source du circuit d'effets, avec ses contenus et grandeurs", () => {
    const rows = formulaSourceRows();
    expect(rows.map((r) => r.kind).sort()).toEqual(Object.keys(EFFECT_SOURCE_LABELS).sort());
    for (const k of ["tech", "officer", "relic", "talent", "module", "class", "moon", "season", "capsule"]) {
      const r = rows.find((x) => x.kind === k)!;
      expect(r.carriers.length, k).toBeGreaterThan(0);
      expect(r.stats.length, k).toBeGreaterThan(0);
    }
    expect(rows.find((x) => x.kind === "class")!.carriers.length).toBe(empireClasses().length);
  });

  it("classes d'empire : effets chiffrés en vigueur", () => {
    const rows = formulaClassRows();
    expect(rows.length).toBe(empireClasses().length);
    for (const r of rows) expect(r.effects.length, r.id).toBeGreaterThan(0);
  });

  it("le bloc « Bonus » ne contient plus d'effet d'officier écrit à la main", () => {
    const src = readFileSync("src/components/game/FormulasGuide.tsx", "utf8");
    const block = src.slice(src.indexOf('id="bonus"'), src.indexOf('<Block id="passe"'));
    for (const fn of ["formulaOfficerRows", "formulaSourceRows", "formulaCapRows", "formulaClassRows"]) expect(src, fn).toContain(`${fn}()`);
    expect(block).not.toMatch(/"Amiral"|"Stratège"|"Ingénieur"|"Intendant"|par niveau`\]/);
  });
});
