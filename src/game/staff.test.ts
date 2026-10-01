import { describe, expect, it } from "vitest";
import { applyStaffTitle, normalizeStaff, STAFF_TITLE_SEASON } from "@/game/staff";
import type { PlayerTitle } from "@/types/game";

const season: PlayerTitle = { label: "Podium de Septembre 2026", rank: 3, seasonId: "2026-09" };

describe("équipe du jeu (v2.5)", () => {
  it("lecture tolérante des rôles", () => {
    expect(normalizeStaff(null)).toEqual({ roles: {} });
    expect(normalizeStaff({ roles: { a: "developer", b: "admin", c: "roi" } })).toEqual({ roles: { a: "developer", b: "admin" } });
  });

  it("ajoute, remplace et retire le titre d'équipe sans toucher aux titres de saison", () => {
    const p: { titles?: PlayerTitle[]; activeTitle?: string } = { titles: [season], activeTitle: season.label };
    expect(applyStaffTitle(p, "developer", false)).toBe(true);
    expect(p.titles?.map((t) => t.label)).toEqual(["Développeur", season.label]);
    expect(p.activeTitle).toBe(season.label);

    expect(applyStaffTitle(p, "developer", true)).toBe(true);
    expect(p.activeTitle).toBe("Développeur");
    expect(applyStaffTitle(p, "developer", true)).toBe(false);

    // Changement de rôle : l'ancien titre affiché disparaît.
    applyStaffTitle(p, "admin", false);
    expect(p.titles?.filter((t) => t.seasonId === STAFF_TITLE_SEASON).map((t) => t.label)).toEqual(["Administrateur"]);
    expect(p.activeTitle).toBe("");

    applyStaffTitle(p, null, false);
    expect(p.titles).toEqual([season]);
  });
});
