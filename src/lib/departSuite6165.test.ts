import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { frDe, frDeParts } from "@/lib/utils";
import { countsInBadge, ROUTINE_KINDS } from "@/lib/notificationCategories";
import { commonSurplus, EXCHANGE_RULES, getTradeRate, tradeQuote } from "@/game/resources";
import { nextActions } from "@/game/nextActions";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { STORY_CHAPTERS } from "@/game/story";
import { DEFAULT_FACTIONS, resolvePirateRaid } from "@/game/pirates";
import { REGISTERED_RULES } from "@/game/ruleRegistry";
import { performPlayerAction } from "@/game/actions";
import type { PlayerState } from "@/types/game";

/* 6.14.165 (S6) : suite du parcours débutant (audit 2026-10-09, second passage : NJ-26 à NJ-30). NJ-25 : recompensesDepart.test.ts. */

const ROOT = path.resolve(__dirname, "../..");
const src = (p: string) => readFileSync(path.join(ROOT, p), "utf8");
const NOW = Date.parse("2026-10-09T12:00:00Z");
const EXCHANGE_DEFAULTS = structuredClone(EXCHANGE_RULES);
afterEach(() => {
  Object.assign(EXCHANGE_RULES, structuredClone(EXCHANGE_DEFAULTS));
});

function newcomer(resources: Partial<Record<string, number>>): PlayerState {
  const p = { ...defaultPlayerState("n1", "Recrue"), createdAtMs: NOW - 45 * 60_000 } as PlayerState;
  Object.assign(p.resources, resources);
  return p;
}

describe("NJ-26 (RR-2) : surplus de nanocomposants et de données", () => {
  it("échange commune ↔ commune réglable (1 pour 1 par défaut, comme avant) ; 0 le ferme au serveur", () => {
    expect(getTradeRate("nano", "scrap")).toBe(1);
    expect(getTradeRate("aiFragment", "cyberModule")).toBe(1);
    expect(REGISTERED_RULES.exchange.target()).toBe(EXCHANGE_RULES);
    EXCHANGE_RULES.commonToCommon = 0.5;
    expect(tradeQuote("nano", "scrap", 1000).gross).toBe(500);
    EXCHANGE_RULES.commonToCommon = 0;
    const p = newcomer({ nano: 10_000 });
    p.resourcesUpdatedAtMs = NOW;
    expect(() => performPlayerAction(p, defaultQueues(), { type: "trade", sellId: "nano", buyId: "scrap", amount: 1000 }, NOW)).toThrow(/fermé/);
  });

  it("le comptoir dit le vrai taux (la page disait « aucun échange commune ↔ commune »)", () => {
    const page = src("src/pages/ResourcesPage.tsx");
    expect(page).not.toMatch(/Aucun échange rare ↔ rare ou commune ↔ commune/);
    expect(page).toMatch(/pairRateText\("commune", EXCHANGE_RULES\.commonToCommon\)/);
    expect(page).toMatch(/params\.get\("vendre"\)/);
  });

  it("surplus repéré (parcours joué, 45e minute : 309 k de nano pour 13 k de ferraille) et conseil « Échange ton surplus »", () => {
    // 6.14.166 (S8, NJ-32) : chaque stock est comparé à son besoin (prochaines améliorations), plus aux autres stocks.
    const need = { scrap: 60_000, energy: 30_000 };
    const s = commonSurplus({ scrap: 13_300, energy: 74_000, nano: 309_000, data: 205_000 }, need)!;
    expect(s.sell).toBe("nano");
    expect(s.buy).toBe("scrap");
    // Juste de quoi atteindre le besoin de ferraille, taxe comprise.
    const net = tradeQuote(s.sell, s.buy, s.amount).net;
    expect(13_300 + net).toBeGreaterThanOrEqual(60_000);
    expect(13_300 + net).toBeLessThan(60_002);
    // Pas de conseil sans manque, ni sous le minimum.
    expect(commonSurplus({ scrap: 50_000, energy: 40_000, nano: 60_000, data: 55_000 }, { scrap: 40_000, energy: 30_000 })).toBeNull();
    expect(commonSurplus({ scrap: 100, energy: 100, nano: 10_000, data: 100 }, need)).toBeNull();
    const p = newcomer({ scrap: 13_300, energy: 74_000, nano: 309_000, data: 205_000 });
    p.buildings.extracteur_ferraille.level = 8;
    const card = nextActions(p, null, [], NOW).find((a) => a.kind === "surplus");
    expect(card?.title).toBe("Échange ton surplus");
    expect(card?.text).toContain("Trop de nanocomposants");
    expect(card?.text).toContain("pas assez de ferraille");
    expect(card?.to).toContain("vendre=nano&recevoir=scrap");
    // Conseil des premiers jours seulement (I29) : plus rien au-delà de `surplusAdviceDays`.
    p.createdAtMs = NOW - (EXCHANGE_RULES.surplusAdviceDays + 1) * 86_400_000;
    expect(nextActions(p, null, [], NOW).some((a) => a.kind === "surplus")).toBe(false);
  });
});

describe("NJ-27 : « Débloquer » grisé quand il manque des ressources", () => {
  it("pastilles « manque N », bouton désactivé et raison en clair", () => {
    const page = src("src/pages/BuildingsPage.tsx");
    expect(page).toMatch(/disabled=\{pending === building\.id \|\| !affordable\}/);
    expect(page).toMatch(/<MissingReason cost=\{unlockCost\}/);
    expect(src("src/components/ui/afford.tsx")).toMatch(/Il manque : /);
  });
});

describe("NJ-28 : ressources rares à 375 px", () => {
  it("plus de rangée qui défile en douce : les pastilles passent à la ligne, les rares en 4 colonnes sur téléphone", () => {
    const hud = src("src/components/layout/ResourceHud.tsx");
    expect(hud).not.toMatch(/overflow-x-auto/);
    expect(hud).toMatch(/grid w-full grid-cols-4 gap-1 sm:contents/);
  });
});

describe("NJ-29 : un seul nom pour le raid d'initiation, accords", () => {
  it("l'histoire présente le Silencieux, que l'alerte et le rapport nomment", () => {
    const ch2 = STORY_CHAPTERS.find((c) => c.id === 2)!;
    expect(ch2.intro.map((l) => l.text).join(" ")).toContain("le Silencieux");
    const varan = DEFAULT_FACTIONS.find((f) => f.id === "varan")!;
    expect(varan.enforcer).toBe("Le Silencieux");
  });

  it("« Attaque du Silencieux », « Raid repoussé : Confrérie du Vide »", () => {
    expect(frDe("Le Silencieux (Confrérie du Vide)")).toBe("du Silencieux (Confrérie du Vide)");
    expect(frDeParts("Le Silencieux")).toEqual(["du ", "Silencieux"]);
    expect(frDeParts("Aldo")).toEqual(["d'", "Aldo"]);
    expect(frDeParts("Zed_42")).toEqual(["de ", "Zed_42"]);
    const varan = DEFAULT_FACTIONS.find((f) => f.id === "varan")!;
    const p = newcomer({});
    p.units = { roquette: { level: 1, count: 10 } };
    const out = resolvePirateRaid(varan, p, defaultQueues(), 5, [], NOW);
    const titles = out.notifications.map((n) => n.title);
    expect(titles).toContain("Raid repoussé : Confrérie du Vide");
    expect(titles.join(" ")).not.toMatch(/Vide repoussé/);
    expect(src("src/components/game/CombatResultModal.tsx")).not.toMatch(/"Attaque de"/);
    expect(src("src/components/game/FleetsPanel.tsx")).not.toMatch(/"Raid du"/);
  });
});

describe("NJ-30 : la cloche signale ce qui compte", () => {
  it("fins de chantier, de recherche, d'unités et de mission ne comptent pas dans le chiffre", () => {
    for (const k of ["building", "research", "unit", "mission"] as const) expect(countsInBadge(k)).toBe(false);
    for (const k of ["combat-defender", "spy-detected", "fleet", "achievement", "alliance", "message", "event"] as const) expect(countsInBadge(k)).toBe(true);
    expect(ROUTINE_KINDS.length).toBe(4);
    expect(src("src/components/layout/NotificationBell.tsx")).toMatch(/unreadImportant > 9 \? "9\+" : unreadImportant/);
  });
});
