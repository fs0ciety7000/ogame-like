import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { formatHud, frDe, softHyphens } from "@/lib/utils";
import { GAME_ERROR_TEXTS, gameErrorText, isServerFault } from "@/lib/gameErrors";
import { isServerUnreachable, markServerDown, markServerUp, useServerHealth } from "@/store/serverHealthStore";
import { NEWCOMER_NEWS_RULES, NEWCOMER_NEWS_RULES_META } from "@/game/announcements";
import { REGISTERED_RULES } from "@/game/ruleRegistry";
import { ONBOARDING_STEPS } from "@/game/onboarding";
import { BUILDINGS } from "@/game/buildings";
import { findUnit } from "@/game/units";

/* 6.14.164 (S4) : confort du parcours débutant (audit 2026-10-09 : NJ-7, NJ-9, NJ-11, NJ-13, NJ-15, NJ-19 à NJ-24, restes de S1). */

const ROOT = path.resolve(__dirname, "../..");
const src = (p: string) => readFileSync(path.join(ROOT, p), "utf8");

describe("NJ-7 : barre de ressources lisible à 375 px", () => {
  it("le stock tient en 6 caractères au plus, sans ellipse", () => {
    for (const v of [0, 999, 1_234, 42_123, 150_234, 999_499, 1_234_567, 12_345_678, 987_654_321, 4_321_000_000]) {
      expect(formatHud(v).length, `${v} → ${formatHud(v)}`).toBeLessThanOrEqual(6);
    }
    expect(formatHud(150_234)).toBe("150 k");
    expect(formatHud(42_123)).toBe("42,1 k");
    expect(formatHud(512)).toBe("512");
  });

  it("les ressources de l'en-tête disent leur nom au toucher", () => {
    const hud = src("src/components/layout/ResourceHud.tsx");
    expect(hud.match(/<TapTooltip key=\{res\.id\}>/g)?.length).toBe(2);
    expect(hud).toContain("format={formatHud}");
  });
});

describe("NJ-9 : « Espionner » en toutes lettres", () => {
  it("bouton texte dans la Galaxie, lien « Espionner d'abord » et vaisseaux possédés seulement dans l'attaque", () => {
    const galaxy = src("src/pages/GalaxyPage.tsx");
    expect(galaxy).toContain("<Eye className=\"mr-1 h-4 w-4\" /> Espionner");
    expect(galaxy).toContain("onSpy=");
    const attack = src("src/components/game/AttackModal.tsx");
    expect(attack).toContain("Espionner d'abord");
    expect(attack).toContain("owned === 0 && !(fleet[unitId] ?? 0)");
  });
});

describe("NJ-11 : serveur en mise à jour", () => {
  afterEach(() => markServerUp());

  it("502, 504, 503 sans message du jeu et statut 0 veulent dire « serveur absent » ; la maintenance du jeu non", () => {
    expect(isServerUnreachable(502, false)).toBe(true);
    expect(isServerUnreachable(504, false)).toBe(true);
    expect(isServerUnreachable(0, false)).toBe(true);
    expect(isServerUnreachable(503, false)).toBe(true);
    expect(isServerUnreachable(503, true)).toBe(false);
    expect(isServerUnreachable(500, false)).toBe(false);
    expect(isServerUnreachable(400, true)).toBe(false);
  });

  it("une action qui échoue le dit, sans prévenir l'équipe pour un redéploiement", () => {
    expect(gameErrorText(502)).toBe(GAME_ERROR_TEXTS.restarting);
    expect(gameErrorText(504, "Gateway Timeout")).toBe(GAME_ERROR_TEXTS.restarting);
    expect(gameErrorText(503, "Le jeu est en maintenance : réessaie à la réouverture.")).toMatch(/maintenance/);
    expect(isServerFault(502)).toBe(false);
    expect(isServerFault(504)).toBe(false);
    expect(isServerFault(500)).toBe(true);
  });

  it("la marque « en mise à jour » se pose une fois et s'efface à la première réponse", () => {
    markServerDown(1_000);
    markServerDown(2_000);
    expect(useServerHealth.getState().downSince).toBe(1_000);
    markServerUp();
    expect(useServerHealth.getState().downSince).toBeNull();
  });

  it("le client repère les réponses (afterSend) et les échecs sans réponse (send) ; le bandeau est monté dans l'AppShell", () => {
    const client = src("src/lib/pocketbase.ts");
    expect(client).toContain("isServerUnreachable(response.status");
    expect(client).toContain("pb.send = (async");
    expect(src("src/components/layout/AppShell.tsx")).toContain("<ServerDownBanner />");
    expect(src("src/components/layout/ServerDownBanner.tsx")).toContain("Serveur en cours de mise à jour, nouvelle tentative…");
  });
});

describe("Restes de S1 : rapport de combat et histoires", () => {
  it("le rapport de combat prend la place unique des grandes fenêtres", () => {
    expect(src("src/components/game/CombatResultModal.tsx")).toContain('useExclusiveModal("combat", current !== null)');
  });

  it("Chroniques différées pour un compte neuf, écart réglable entre deux histoires", () => {
    expect(NEWCOMER_NEWS_RULES.storyGapMinutes).toBe(10);
    expect(NEWCOMER_NEWS_RULES_META.storyGapMinutes.label).toBeTruthy();
    expect(REGISTERED_RULES.newcomerNews.target()).toBe(NEWCOMER_NEWS_RULES);
    const story = src("src/components/game/StoryDialog.tsx");
    expect(story).toContain("isNewcomer(player.createdAtMs, now) || storyGapLeftMs(now) > 0");
    expect(story).toContain("NEWCOMER_NEWS_RULES.storyGapMinutes");
  });
});

describe("NJ-13 : « J'y vais » vise la carte", () => {
  it("chaque objectif de bâtiment ou d'unité porte un ?focus= qui existe", () => {
    const focused = ONBOARDING_STEPS.filter((s) => s.to.includes("?focus="));
    expect(focused.map((s) => s.id)).toEqual(["scrap3", "reactor3", "drones5", "storage2", "rockets10"]);
    for (const s of focused) {
      const id = s.to.split("?focus=")[1];
      const ok = s.to.startsWith("/game/batiments") ? BUILDINGS.some((b) => b.id === id) : !!findUnit(id);
      expect(ok, s.to).toBe(true);
    }
    expect(src("src/pages/BuildingsPage.tsx")).toContain("data-focus-id={building.id}");
    expect(src("src/pages/UnitsPage.tsx")).toContain("data-focus-id={unit.id}");
  });
});

describe("NJ-15 : recherche à 0 s", () => {
  it("« Finalisation… » à 0 s, et une synchro une seconde après la fin d'un chantier", () => {
    expect(src("src/pages/LabPage.tsx")).toContain("Finalisation…");
    expect(src("src/components/game/TechList.tsx")).toContain("Finalisation…");
    expect(src("src/hooks/useGameSync.ts")).toContain("safeSyncPlayer(uid), Math.max(500, wait)");
  });
});

describe("NJ-19 : textes", () => {
  it("« de » s'élide et se contracte", () => {
    expect(frDe("octobre")).toBe("d'octobre");
    expect(frDe("novembre 2026")).toBe("de novembre 2026");
    expect(frDe("Le Silencieux")).toBe("du Silencieux");
    expect(frDe("Les Ombres")).toBe("des Ombres");
    expect(frDe("La Ruche")).toBe("de la Ruche");
    expect(frDe("Legion")).toBe("de Legion");
    expect(frDe("Varan")).toBe("de Varan");
    expect(frDe("Hurlevent")).toBe("de Hurlevent");
  });

  it("un long libellé de tuile se coupe à une syllabe", () => {
    expect(softHyphens("Communications")).toBe("Communi­cations");
    expect(softHyphens("Administration")).toBe("Adminis­tration");
    expect(softHyphens("Ordres du jour")).toBe("Ordres du jour");
  });

  it("plus de « 1 jours », de « Elle est maintenant dans ton menu » ni de libellés anglais sur l'arbre", () => {
    expect(src("src/game/dailyOrders.ts")).not.toContain("best} jours.`");
    expect(src("src/game/navUnlock.ts")).not.toContain('"Elle est maintenant dans ton menu."');
    expect(src("src/components/game/TechTree.tsx")).toContain('"controls.zoomIn.ariaLabel": "Zoomer"');
  });
});

describe("NJ-20 à NJ-24 : petits défauts", () => {
  it("comptoir : quantité minimale utile ; Boss sans cadre vide ; jauge d'alliance qui rétrécit ; espionnage en mots ; protection datée", () => {
    expect(src("src/pages/ResourcesPage.tsx")).toContain("function minTradeAmount");
    expect(src("src/components/game/BossReturnCard.tsx")).toContain("if (!showWorld && !showSeason) return null;");
    expect(src("src/pages/AlliancePage.tsx")).toContain("h-1.5 min-w-0 flex-1 bg-cyan-glow");
    expect(src("src/components/game/SpyModal.tsx")).toContain("Plus tu envoies de sondes, plus le rapport est complet.");
    expect(src("src/components/game/StorageRiskCard.tsx")).toContain("Protégé jusqu'au");
  });
});
