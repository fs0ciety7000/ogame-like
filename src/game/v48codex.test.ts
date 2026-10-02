import { beforeAll, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { CODEX_TITLE, codexEntries, codexProgress, foughtWarlords, grantCodexTitle } from "@/game/codex";
import { defaultPlayerState } from "@/game/defaults";
import { warlordUid } from "@/game/warlords";
import type { PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 20, 12);

describe("v4.8 : Codex", () => {
  beforeAll(() => applyGameContent({}));

  it("débloque selon les rencontres", () => {
    const p = defaultPlayerState("u1", "Archi") as PlayerState;
    const blank = codexEntries(p, new Set(), NOW);
    expect(blank.find((e) => e.id === "boss:leviathan")?.unlocked).toBe(false);
    // Épisodes parus ce mois-ci : ouverts à tous.
    expect(blank.filter((e) => e.category === "chronicles").every((e) => e.unlocked)).toBe(true);
    p.stats = { threatenedBy: ["varan"], leviathanKills: 1 };
    p.units = { drone_recuperateur: { level: 1, count: 3 } };
    const fought = foughtWarlords([warlordUid("brannoc"), "someone"]);
    const after = codexEntries(p, fought, NOW);
    expect(after.find((e) => e.id === "faction:varan")?.unlocked).toBe(true);
    expect(after.find((e) => e.id === "warlord:brannoc")?.unlocked).toBe(true);
    expect(after.find((e) => e.id === "boss:leviathan")?.unlocked).toBe(true);
    expect(after.find((e) => e.id === "unit:drone_recuperateur")?.unlocked).toBe(true);
    expect(codexProgress(after).unlocked).toBeGreaterThan(codexProgress(blank).unlocked);
  });

  it("titre Archiviste seulement à 100 %, une fois", () => {
    const p = defaultPlayerState("u1", "Archi") as PlayerState;
    const partial = codexEntries(p, new Set(), NOW);
    expect(grantCodexTitle(p, partial)).toBe(false);
    const full = partial.map((e) => ({ ...e, unlocked: true }));
    expect(grantCodexTitle(p, full)).toBe(true);
    expect(p.titles?.some((t) => t.label === CODEX_TITLE)).toBe(true);
    expect(grantCodexTitle(p, full)).toBe(false);
  });
});
