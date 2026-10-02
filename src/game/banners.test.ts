import { describe, expect, it } from "vitest";
import { dismissKey, normalizeBanners, parseBannerText, safeHref, visibleBanners } from "@/game/banners";

const NOW = 1_800_000_000_000;

describe("banners", () => {
  const banners = normalizeBanners([
    { id: "a", kind: "info", text: "Bienvenue 👋", updatedAtMs: 1 },
    { id: "b", kind: "critical", text: "Incident", dismissible: true, updatedAtMs: 2 },
    { id: "c", kind: "event", text: "Bientôt", startsAtMs: NOW + 1000 },
    { id: "d", kind: "alert", text: "Fini", endsAtMs: NOW - 1 },
    { id: "e", kind: "alert", text: "Masqué", active: false },
    { id: "f", kind: "weird", text: "Public", public: true },
    { nope: true },
  ]);

  it("normalizes and never lets an urgent banner be dismissed", () => {
    expect(banners).toHaveLength(6);
    expect(banners.find((b) => b.id === "b")?.dismissible).toBe(false);
    expect(banners.find((b) => b.id === "f")?.kind).toBe("info");
  });

  it("shows active, scheduled banners, most severe first, minus dismissed ones", () => {
    expect(visibleBanners(banners, NOW).map((b) => b.id)).toEqual(["b", "a", "f"]);
    expect(visibleBanners(banners, NOW, { dismissed: [dismissKey(banners[0])] }).map((b) => b.id)).toEqual(["b", "f"]);
    expect(visibleBanners(banners, NOW + 2000).map((b) => b.id)).toContain("c");
    expect(visibleBanners(banners, NOW, { publicOnly: true }).map((b) => b.id)).toEqual(["f"]);
    // Modifié depuis : réapparaît.
    expect(visibleBanners([{ ...banners[0], updatedAtMs: 5 }], NOW, { dismissed: [dismissKey(banners[0])] })).toHaveLength(1);
  });

  it("parses bold and safe links only", () => {
    expect(parseBannerText("Le **Léviathan** arrive : [voir](/game/leviathan) ou [site](https://example.org) [x](javascript:alert(1))")).toEqual([
      { type: "text", text: "Le " },
      { type: "bold", text: "Léviathan" },
      { type: "text", text: " arrive : " },
      { type: "link", text: "voir", href: "/game/leviathan", internal: true },
      { type: "text", text: " ou " },
      { type: "link", text: "site", href: "https://example.org/", internal: false },
      { type: "text", text: " " },
      { type: "text", text: "x" },
      { type: "text", text: ")" },
    ]);
    expect(safeHref("//evil.com")).toBeNull();
    expect(safeHref("data:text/html,x")).toBeNull();
  });
});
