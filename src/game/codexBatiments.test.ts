import { beforeAll, describe, expect, it } from "vitest";
import { BUILDINGS } from "@/game/buildings";
import { actionNeedsCodex, performPlayerAction } from "@/game/actions";
import { warlordsConfig } from "@/game/warlords";
import { pendingClaims } from "@/game/claimAll";
import { claimCodexCategory, codexCategoryState, codexClaimedCategories, codexEntries } from "@/game/codex";
import { applyGameContent } from "@/game/content";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { TECH_CODEX_IMAGE, TECHNOLOGIES } from "@/game/technologies";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 20, 12);

describe("6.14.12 (C2) : Codex des bâtiments et des technologies", () => {
  beforeAll(() => applyGameContent({}));

  it("une fiche par bâtiment et par techno en vigueur", () => {
    const p = defaultPlayerState("u1", "Archi") as PlayerState;
    const entries = codexEntries(p, new Set(), NOW);
    expect(entries.filter((e) => e.category === "buildings").map((e) => e.id)).toEqual(BUILDINGS.map((b) => `building:${b.id}`));
    expect(entries.filter((e) => e.category === "technologies").map((e) => e.id)).toEqual(TECHNOLOGIES.map((t) => `tech:${t.id}`));
    // Les technos sans illustration prennent l'image provisoire commune.
    expect(entries.find((e) => e.id === `tech:${TECHNOLOGIES[0].id}`)?.image).toBe(TECHNOLOGIES[0].image || TECH_CODEX_IMAGE);
  });

  it("bâtiment débloqué une fois construit, techno une fois recherchée", () => {
    const p = defaultPlayerState("u1", "Archi") as PlayerState;
    const start = BUILDINGS.find((b) => b.startsUnlocked)!;
    const locked = BUILDINGS.find((b) => !b.startsUnlocked)!;
    let entries = codexEntries(p, new Set(), NOW);
    expect(entries.find((e) => e.id === `building:${start.id}`)?.unlocked).toBe(true);
    // Niveau 1 par défaut mais verrouillé : pas encore construit.
    expect(entries.find((e) => e.id === `building:${locked.id}`)?.unlocked).toBe(false);
    expect(entries.find((e) => e.id === "tech:tech1")?.unlocked).toBe(false);
    p.techLevels = { tech1: 1 };
    entries = codexEntries(p, new Set(), NOW);
    expect(entries.find((e) => e.id === "tech:tech1")?.unlocked).toBe(true);
  });

  it("catégorie complète : 5 jetons et 25 Ambre", () => {
    const p = defaultPlayerState("u1", "Archi") as PlayerState;
    p.buildings = Object.fromEntries(BUILDINGS.map((b) => [b.id, { level: 1, unlocked: true }]));
    p.techLevels = Object.fromEntries(TECHNOLOGIES.map((t) => [t.id, 1]));
    const entries = codexEntries(p, new Set(), NOW);
    for (const cat of ["buildings", "technologies"] as const) {
      const st = codexCategoryState(p, entries, cat);
      expect(st.complete).toBe(true);
      expect(st.reward).toEqual({ tokens: 5, amber: 25 });
      expect(claimCodexCategory(p, entries, cat, NOW)).toEqual({ tokens: 5, amber: 25 });
    }
  });

  it("joueur sans bâtiments ni technos : fiches verrouillées, pas d'erreur", () => {
    const entries = codexEntries({ stats: {}, units: {} } as unknown as PlayerState, new Set(), NOW);
    expect(entries.filter((e) => e.category === "buildings" || e.category === "technologies").every((e) => !e.unlocked)).toBe(true);
  });
});

describe("6.14.17 (Z1-2) : catégories du Codex dans « Tout réclamer »", () => {
  beforeAll(() => applyGameContent({}));

  it("une catégorie complète est réclamée par « Tout réclamer », une seule fois", () => {
    const p = defaultPlayerState("u1", "Archi") as PlayerState;
    p.buildings = Object.fromEntries(BUILDINGS.map((b) => [b.id, { level: 1, unlocked: true }]));
    expect(pendingClaims(p, NOW)).toContainEqual({ type: "codexClaim", category: "buildings" });
    // Seigneurs et boss dépendent du serveur : jamais proposés ici.
    expect(pendingClaims(p, NOW).filter((c) => c.type === "codexClaim").map((c) => (c as { category: string }).category)).not.toContain("warlords");
    const out = performPlayerAction(p, defaultQueues(), { type: "claimAll" }, NOW);
    expect((out.result as Record<string, number>).codexClaim).toBeGreaterThanOrEqual(1);
    expect(codexClaimedCategories(out.player)).toContain("buildings");
    expect(pendingClaims(out.player, NOW).some((c) => c.type === "codexClaim" && c.category === "buildings")).toBe(false);
    expect(() => performPlayerAction(out.player, out.queues, { type: "codexClaim", category: "buildings" }, NOW)).toThrow(/déjà/);
  });
});

describe("6.14.25 (H29-3) : Seigneurs et Boss dans « Tout réclamer » (serveur)", () => {
  beforeAll(() => applyGameContent({}));

  it("avec les données du serveur, la catégorie Seigneurs complète est réclamée ; sans elles, jamais", () => {
    const p = defaultPlayerState("u1", "Archi") as PlayerState;
    const ctx = { fought: warlordsConfig().defs.filter((d) => d.enabled).map((d) => d.id), bossesFought: [] };
    const has = (list: ReturnType<typeof pendingClaims>) => list.some((c) => c.type === "codexClaim" && c.category === "warlords");
    expect(has(pendingClaims(p, NOW))).toBe(false);
    expect(has(pendingClaims(p, NOW, ctx))).toBe(true);
    expect(actionNeedsCodex({ type: "claimAll" })).toBe(true);
    expect(actionNeedsCodex({ type: "build" })).toBe(false);
    const out = performPlayerAction(p, defaultQueues(), { type: "claimAll" }, NOW, {}, false, ctx);
    expect(codexClaimedCategories(out.player)).toContain("warlords");
    // Sans contexte, la réclamation directe refuse (catégorie incomplète vue du joueur seul).
    const q = defaultPlayerState("u2", "Archi") as PlayerState;
    expect(() => performPlayerAction(q, defaultQueues(), { type: "codexClaim", category: "warlords" }, NOW)).toThrow(/incomplète/);
  });
});
