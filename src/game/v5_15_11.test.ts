import { afterEach, beforeAll, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { bonusRewards, chronicleBonus, claimChronicle, DEFAULT_CHRONICLE_BONUS, recordChronicle, chronicleOf } from "@/game/chronicles";
import { bossesFoughtBy, claimCodexCategory, codexCategoryState, codexEntries } from "@/game/codex";
import { defaultPlayerState } from "@/game/defaults";
import { playerCasino } from "@/game/casino";
import { WORLD_BOSSES } from "@/game/worldBosses";
import type { BossHistoryEntry } from "@/game/bossHistory";
import type { PlayerState } from "@/types/game";

/* 5.15.11 : bonus des Chroniques (jetons, Ambre) et Codex procédural. */

const OCT13 = Date.UTC(2026, 9, 13, 10);

function player(uid = "u1"): PlayerState {
  const p = defaultPlayerState(uid, uid) as PlayerState;
  p.createdAtMs = OCT13 - 30 * 86400_000;
  p.resourcesUpdatedAtMs = OCT13;
  return p;
}

const amber = (p: PlayerState) => Number((p.bounties as { amber?: number } | undefined)?.amber) || 0;

describe("Chroniques : bonus d'épisode et de chapitre", () => {
  beforeAll(() => applyGameContent({}));
  afterEach(() => applyGameContent({}));

  it("un épisode terminé verse le bonus (jetons et Ambre) en plus des points", () => {
    const p = player();
    const month = chronicleOf(OCT13)!;
    const e = month.episodes[0];
    recordChronicle(p, e.objective.type, OCT13, e.objective.count);
    const before = playerCasino(p).tokens;
    claimChronicle(p, 0, OCT13);
    expect(playerCasino(p).tokens - before).toBe(DEFAULT_CHRONICLE_BONUS.episode.tokens);
    expect(amber(p)).toBeGreaterThanOrEqual(DEFAULT_CHRONICLE_BONUS.episode.amber);
  });

  it("le bonus se règle dans le contenu (et un bonus nul ne verse rien)", () => {
    applyGameContent({ chronicles: { months: [], bonus: { episode: { tokens: 0, amber: 7 }, chapter: { tokens: 4, amber: 0 } } } as never });
    expect(chronicleBonus().episode).toEqual({ tokens: 0, amber: 7 });
    expect(bonusRewards(chronicleBonus().episode)).toEqual([{ kind: "amber", amount: 7 }]);
    expect(bonusRewards(chronicleBonus().chapter)).toEqual([{ kind: "tokens", count: 4 }]);
  });
});

describe("Codex procédural", () => {
  beforeAll(() => applyGameContent({}));

  it("une fiche par boss mondial, avec sa fiche technique, débloquée une fois affronté", () => {
    const p = player();
    const boss = WORLD_BOSSES.find((b) => b.id !== "leviathan")!;
    const locked = codexEntries(p, new Set(), OCT13).find((e) => e.id === `worldboss:${boss.id}`)!;
    expect(locked.unlocked).toBe(false);
    expect(locked.facts?.some((f) => f.label === "Faiblesse en phase 3")).toBe(true);
    const history = [{ id: "h1", kind: "leviathan", name: boss.name, ranking: [{ uid: "u1", pseudo: "u1", damage: 5, assaults: 1 }], top: [] } as unknown as BossHistoryEntry];
    const after = codexEntries(p, new Set(), OCT13, { bossesFought: bossesFoughtBy(history, "u1") });
    expect(after.find((e) => e.id === `worldboss:${boss.id}`)?.unlocked).toBe(true);
    // Un seul Léviathan (fiche historique conservée).
    expect(after.filter((e) => e.name === "Le Léviathan")).toHaveLength(1);
  });

  it("récompense de catégorie : complète, une seule fois", () => {
    const p = player();
    p.stats = { threatenedBy: [] };
    const entries0 = codexEntries(p, new Set(), OCT13);
    expect(() => claimCodexCategory(p, entries0, "factions", OCT13)).toThrow(/incomplète/);
    const all = entries0.filter((e) => e.category === "factions").map((e) => e.id.replace("faction:", ""));
    p.stats = { threatenedBy: all };
    const entries = codexEntries(p, new Set(), OCT13);
    expect(codexCategoryState(p, entries, "factions").complete).toBe(true);
    const before = playerCasino(p).tokens;
    const r = claimCodexCategory(p, entries, "factions", OCT13);
    expect(playerCasino(p).tokens - before).toBe(r.tokens);
    expect(codexCategoryState(p, entries, "factions").claimed).toBe(true);
    expect(() => claimCodexCategory(p, entries, "factions", OCT13)).toThrow(/déjà/);
    expect(() => claimCodexCategory(p, entries, "chronicles", OCT13)).toThrow(/Pas de récompense/);
  });
});
