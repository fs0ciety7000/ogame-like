import { describe, expect, it } from "vitest";
import { matchPaletteTabs } from "@/lib/paletteTabs";
import { notificationLink } from "@/lib/notificationCategories";

/* 6.14.49 (É30-1c) : la phalange et la porte de saut se trouvent par Ctrl+K, et leurs notifications mènent au panneau Lune. */
describe("phalange : accès depuis l'interface", () => {
  it("Ctrl+K trouve la phalange et la porte de saut (panneau Lune des Statistiques)", () => {
    expect(matchPaletteTabs("phalange").map((t) => t.to)).toEqual(["/game/statistiques?onglet=lune"]);
    expect(matchPaletteTabs("porte de saut").map((t) => t.label)).toEqual(["Porte de saut"]);
    expect(matchPaletteTabs("lune").length).toBe(2);
  });

  it("balayage et saut mènent au panneau Lune ; le radar garde son lien vers l'Alliance", () => {
    expect(notificationLink({ kind: "spy", data: { phalanx: "scan" } })).toBe("/game/statistiques?onglet=lune");
    expect(notificationLink({ kind: "fleet", data: { phalanx: "jump" } })).toBe("/game/statistiques?onglet=lune");
    expect(notificationLink({ kind: "alliance", link: "/game/alliance", data: {} })).toBe("/game/alliance");
    expect(notificationLink({ kind: "spy" })).toBe("/game/combats");
  });
});
