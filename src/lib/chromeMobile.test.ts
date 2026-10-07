import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { PAGE_TIPS, tipId, tipSeen } from "@/components/game/PageTip";
import { addSeenAnnouncements } from "@/game/announcements";
import { DEFAULT_TABS, moreBadgeCount } from "@/lib/mobileTabs";

/* 6.14.62 à 6.14.64 (AU27, lots UX-4, UX-5, UX-8) : chrome mobile, accueil du joueur, navigation mobile. */

const src = (p: string) => readFileSync(p, "utf8");

describe("6.14.62 : astuces de page gardées sur le compte (Q93)", () => {
  it("chaque astuce a un identifiant que le serveur accepte dans la liste des vues", () => {
    const ids = Object.keys(PAGE_TIPS).map(tipId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(tipId("/game/batiments")).toBe("tip:batiments");
    // Même filtre que l'action « seenAnnouncements » du serveur : aucun identifiant rejeté.
    expect(addSeenAnnouncements(undefined, ids)).toEqual(ids);
  });

  it("une astuce vue sur un autre appareil ne revient pas, sauf si le joueur les a réaffichées ici", () => {
    expect(tipSeen("/game/labo", ["v4.0-commandement", "tip:labo"], [], false)).toBe(true);
    expect(tipSeen("/game/labo", ["tip:labo"], [], true)).toBe(false);
    expect(tipSeen("/game/labo", undefined, ["/game/labo"], true)).toBe(true);
    expect(tipSeen("/game/missions", ["tip:labo"], [], false)).toBe(false);
  });

  it("l'astuce est sous le titre (PageHeader), en HudCallout neutre, plus au-dessus de la page", () => {
    expect(src("src/components/layout/AppShell.tsx")).not.toContain("<PageTip");
    expect(src("src/components/layout/PageHeader.tsx")).toContain("<PageTip />");
    const tip = src("src/components/game/PageTip.tsx");
    expect(tip).toContain('<HudCallout tone="neutral"');
    expect(tip).not.toMatch(/gold-glow/);
  });

  it("sur téléphone, les bandeaux du haut se fusionnent et le titre de l'en-tête ne double pas celui de la page", () => {
    expect(src("src/index.css")).toMatch(/\.strip-stack:not\(\[data-open\]\) > \[data-strip\] ~ \[data-strip\]/);
    const shell = src("src/components/layout/AppShell.tsx");
    expect(shell).toContain("<StripStack>");
    expect(shell).toContain("!pageHasHeader &&");
  });
});

describe("6.14.64 : barre d'onglets mobile (Q90)", () => {
  it("onglets par défaut : Accueil, Bâtiments, Unités, Galaxie", () => {
    expect(DEFAULT_TABS).toEqual(["/game", "/game/batiments", "/game/unites", "/game/galaxie"]);
  });

  it("la pastille « Plus » ne compte pas le journal des versions ni une page déjà épinglée", () => {
    expect(moreBadgeCount({ messages: 2, alliance: 1, reports: 0 }, DEFAULT_TABS)).toBe(3);
    expect(moreBadgeCount({ messages: 2, alliance: 1, reports: 4 }, ["/game", "/game/messages"])).toBe(5);
    expect(moreBadgeCount({ messages: 0, alliance: 0, reports: 0 }, DEFAULT_TABS)).toBe(0);
    expect(src("src/components/layout/NavBar.tsx")).toMatch(/<Badge count=\{moreCount\} neutral \/>/);
  });
});

describe("6.14.63 : accueil du joueur", () => {
  it("la Prise en main se réduit (une ligne reste) au lieu de disparaître", () => {
    const c = src("src/components/game/OnboardingChecklist.tsx");
    expect(c).toContain("Déplier la Prise en main");
    expect(c).not.toMatch(/if \(!onboardingEligible\(player\) \|\| onboardingState\(player\)\.hidden\) return null/);
  });
});
