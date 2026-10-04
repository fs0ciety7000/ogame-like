import { afterAll, describe, expect, it } from "vitest";
import { flushState } from "@/game/flush";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { setAchievements, DEFAULT_ACHIEVEMENTS } from "@/game/achievements";
import { DEFAULT_TITLES, checkNewTitles, grantTitle, setTitles, titleStyle, validateTitles, type TitleDef } from "@/game/titles";
import { validateGameContent, defaultGameContent } from "@/game/content";
import type { PlayerState } from "@/types/game";

const NOW = 1_800_000_000_000;
const player = (patch: Partial<PlayerState> = {}) => ({ ...defaultPlayerState("u", "U"), createdAtMs: NOW - 1000, resourcesUpdatedAtMs: NOW, ...patch }) as PlayerState;

afterAll(() => {
  setTitles(structuredClone(DEFAULT_TITLES));
  setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS));
});

describe("v5.10 titres administrables", () => {
  it("le catalogue par défaut est valide", () => {
    expect(validateTitles(DEFAULT_TITLES)).toEqual([]);
    expect(validateGameContent(defaultGameContent())).toEqual([]);
  });

  it("refuse doublons, rareté et mesure inconnues", () => {
    const bad: TitleDef[] = [
      { id: "a", label: "X", description: "", icon: "", rarity: "rare", enabled: true },
      { id: "a", label: "x", description: "", icon: "", rarity: "nope" as never, enabled: true, unlock: { metric: "nope" as never, threshold: 0 } },
    ];
    const errs = validateTitles(bad).join(" | ");
    expect(errs).toMatch(/en double/);
    expect(errs).toMatch(/rareté/);
    expect(errs).toMatch(/mesure/);
    expect(errs).toMatch(/seuil/);
  });

  it("débloque un titre sur une mesure, une seule fois, avec notification", () => {
    setTitles([{ id: "mecene", label: "Mécène", description: "Généreux.", icon: "🎁", rarity: "rare", enabled: true, unlock: { metric: "giftsSent", threshold: 2 } }]);
    const p = player({ stats: { giftsSent: 2 } });
    expect(checkNewTitles(p).map((t) => t.id)).toEqual(["mecene"]);
    const out = flushState(p, defaultQueues(), NOW);
    expect(out.player.titles?.map((t) => t.label)).toContain("Mécène");
    expect(out.notifications.some((n) => n.title === "Nouveau titre !")).toBe(true);
    expect(checkNewTitles(out.player)).toEqual([]);
    expect(grantTitle(out.player, "Mécène", "x")).toBe(false);
  });

  it("un succès décerne le titre du catalogue choisi (titleId)", () => {
    setTitles([{ id: "t1", label: "Premier du nom", description: "", icon: "⭐", rarity: "epic", enabled: true }]);
    setAchievements([
      { id: "a1", enabled: true, name: "A", description: "", emoji: "x", category: "combat", tier: "bronze", metric: "victories", threshold: 1, secret: false, rewardXp: 0, rewardHours: 0, title: "", titleId: "t1" },
    ]);
    const out = flushState(player({ victories: 1 }), defaultQueues(), NOW);
    expect(out.player.titles?.map((t) => t.label)).toContain("Premier du nom");
    expect(titleStyle("Premier du nom")).toMatchObject({ icon: "⭐", rarity: "Épique" });
    expect(titleStyle("Inconnu").icon).toBe("🏆");
  });
});
