import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { activeMutator, autoMutatorFor, MUTATOR_RULES, mutatorList, mutatorEffects, mutatorFor, mutatorMonthId, validateMutatorRules } from "@/game/mutators";
import { applyGameContent } from "@/game/content";
import { empireEffects, playerModifiers } from "@/game/modifiers";

describe("mutateur de saison (5.16)", () => {
  beforeEach(() => {
    MUTATOR_RULES.enabled = true;
    MUTATOR_RULES.overrides = {};
  });
  afterEach(() => {
    MUTATOR_RULES.enabled = false;
    MUTATOR_RULES.overrides = {};
    MUTATOR_RULES.noRepeatMonths = 6;
    MUTATOR_RULES.freshMonths = 12;
    MUTATOR_RULES.noRepeatFrom = "2027-01";
  });

  it("tirage déterministe, jamais deux mois de suite le même", () => {
    const months = Array.from({ length: 24 }, (_, i) => `${2026 + Math.floor(i / 12)}-${String((i % 12) + 1).padStart(2, "0")}`);
    const ids = months.map((m) => mutatorFor(m)!.id);
    expect(ids.map((_, i) => mutatorFor(months[i])!.id)).toEqual(ids);
    for (let i = 1; i < ids.length; i++) expect(ids[i]).not.toBe(ids[i - 1]);
    expect(new Set(ids).size).toBeGreaterThan(4);
  });

  it("l'administration impose un mutateur ou aucun", () => {
    MUTATOR_RULES.overrides = { "2026-10": "vents", "2026-11": "none" };
    expect(mutatorFor("2026-10")?.id).toBe("vents");
    expect(mutatorFor("2026-11")).toBeNull();
    expect(validateMutatorRules({ overrides: { "2026-12": "inconnu", bad: "ruee" } })).toHaveLength(2);
  });

  it("passe par le circuit d'effets (source « season »)", () => {
    const now = Date.UTC(2026, 9, 15);
    MUTATOR_RULES.overrides = { "2026-10": "ruee" };
    expect(activeMutator(now)?.id).toBe("ruee");
    expect(mutatorEffects(now)).toEqual([{ stat: "productionAll", value: 0.1, target: undefined, layer: "empire", source: { kind: "season", id: "ruee", label: "Ruée industrielle" } }]);
    const p = { commanders: undefined, relics: undefined, talents: undefined, territory: undefined } as Parameters<typeof empireEffects>[0];
    expect(empireEffects(p, now).some((g) => g.source.kind === "season")).toBe(true);
    expect(playerModifiers(p, now).productionAll).toBeCloseTo(0.1);
    MUTATOR_RULES.enabled = false;
    expect(playerModifiers(p, now).productionAll).toBe(0);
    expect(mutatorList().length).toBeGreaterThanOrEqual(8);
  });
});

/** Mois AAAA-MM de `from` sur `count` mois. */
function monthsFrom(from: string, count: number): string[] {
  const [y0, m0] = from.split("-").map(Number);
  return Array.from({ length: count }, (_, i) => {
    const k = y0 * 12 + (m0 - 1) + i;
    return `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`;
  });
}

describe("6.14.136 (AU27, lot AP-L9) : mutateurs sans répétition, horloge de Paris", () => {
  beforeEach(() => {
    applyGameContent({});
    MUTATOR_RULES.enabled = true;
    MUTATOR_RULES.overrides = {};
  });
  afterEach(() => {
    MUTATOR_RULES.enabled = false;
    MUTATOR_RULES.overrides = {};
    MUTATOR_RULES.noRepeatMonths = 6;
    MUTATOR_RULES.freshMonths = 12;
    MUTATOR_RULES.noRepeatFrom = "2027-01";
  });

  it("12 mois de suite : 10 mutateurs distincts au moins, aucun retour avant 6 mois (graine stable)", () => {
    const months = monthsFrom("2027-01", 72);
    const ids = months.map((m) => mutatorFor(m)!.id);
    expect(months.map((m) => mutatorFor(m)!.id)).toEqual(ids);
    for (let i = 0; i + 12 <= ids.length; i++) expect(new Set(ids.slice(i, i + 12)).size, months[i]).toBeGreaterThanOrEqual(10);
    for (let i = 0; i < ids.length; i++) for (let j = Math.max(0, i - 6); j < i; j++) expect(ids[j], `${months[j]} / ${months[i]}`).not.toBe(ids[i]);
    // Avant : 7 distincts au plus bas sur 12 mois.
    MUTATOR_RULES.noRepeatMonths = 0;
    const old = months.map((m) => mutatorFor(m)!.id);
    expect(Math.min(...old.slice(0, 61).map((_, i) => new Set(old.slice(i, i + 12)).size))).toBeLessThan(10);
  });

  it("mois écrits inchangés : avant `noRepeatFrom`, l'ancien tirage ; l'ancien tirage est gardé quand il reste permis", () => {
    const before = monthsFrom("2025-01", 24);
    const fresh = before.map((m) => mutatorFor(m)!.id);
    MUTATOR_RULES.noRepeatMonths = 0;
    expect(before.map((m) => mutatorFor(m)!.id)).toEqual(fresh);
    // Octobre 2026 (en cours), novembre (annoncé), décembre et janvier : ancien tirage.
    expect(["2026-10", "2026-11", "2026-12", "2027-01"].map((m) => mutatorFor(m)!.id)).toEqual(["vents", "guerre", "chantiers", "soutes"]);
    MUTATOR_RULES.noRepeatMonths = 6;
    expect(["2026-10", "2026-11", "2026-12", "2027-01"].map((m) => mutatorFor(m)!.id)).toEqual(["vents", "guerre", "chantiers", "soutes"]);
    // Mars 2027 (« marchands ») n'a pas servi depuis août 2026 : gardé.
    expect(mutatorFor("2027-03")!.id).toBe("marchands");
  });

  it("un mois imposé compte pour la répétition ; l'aperçu du tirage ignore le mois imposé lui-même", () => {
    const auto = mutatorFor("2027-02")!.id;
    MUTATOR_RULES.overrides = { "2027-02": "chasse" };
    expect(mutatorFor("2027-02")!.id).toBe("chasse");
    expect(autoMutatorFor("2027-02")!.id).toBe(auto);
    for (const m of monthsFrom("2027-03", 6)) expect(mutatorFor(m)!.id, m).not.toBe("chasse");
    // « Aucun mutateur » : le mois ne retient rien.
    MUTATOR_RULES.overrides = { "2027-02": "none" };
    expect(mutatorFor("2027-02")).toBeNull();
  });

  it("liste courte : jamais bloqué (fenêtre plafonnée au nombre de mutateurs moins un)", () => {
    applyGameContent({ rules: { mutators: { enabled: true, overrides: {}, defs: mutatorList().slice(0, 3).map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, effects: m.grants })) } } } as never);
    MUTATOR_RULES.enabled = true;
    const ids = monthsFrom("2027-01", 24).map((m) => mutatorFor(m)!.id);
    for (let i = 2; i < ids.length; i++) expect(new Set(ids.slice(i - 2, i + 1)).size).toBe(3);
  });

  it("changement de mois à minuit, heure de Paris (hiver et été)", () => {
    // 31 décembre 2026, 23 h 30 à Paris = 22 h 30 UTC : encore décembre (avant : déjà janvier, UTC+2 fixe).
    expect(mutatorMonthId(Date.UTC(2026, 11, 31, 22, 30))).toBe("2026-12");
    expect(mutatorMonthId(Date.UTC(2026, 11, 31, 23, 0))).toBe("2027-01");
    // 31 juillet 2027, 23 h 30 à Paris = 21 h 30 UTC (heure d'été).
    expect(mutatorMonthId(Date.UTC(2027, 6, 31, 21, 30))).toBe("2027-07");
    expect(mutatorMonthId(Date.UTC(2027, 6, 31, 22, 0))).toBe("2027-08");
  });

  it("réglages lus dans la règle et validés", () => {
    applyGameContent({ rules: { mutators: { noRepeatMonths: 0 } } } as never);
    expect(MUTATOR_RULES.noRepeatMonths).toBe(0);
    expect(MUTATOR_RULES.freshMonths).toBe(12);
    expect(MUTATOR_RULES.noRepeatFrom).toBe("2027-01");
    expect(validateMutatorRules({ noRepeatMonths: -1, freshMonths: 40, noRepeatFrom: "2027" } as never)).toHaveLength(3);
    expect(validateMutatorRules({ noRepeatMonths: 6, freshMonths: 12, noRepeatFrom: "2027-01" } as never)).toEqual([]);
  });
});
