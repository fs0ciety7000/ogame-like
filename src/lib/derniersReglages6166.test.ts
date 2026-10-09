import { readFileSync } from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { badgeCount } from "@/lib/notificationCategories";
import { commonSurplus, EXCHANGE_RULES, tradeQuote } from "@/game/resources";
import { nextActions, surplusNeeds } from "@/game/nextActions";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { tutorialRaidPending } from "@/game/pirates";
import { performPlayerAction } from "@/game/actions";
import { describePassReward, describePassRewardFor } from "@/game/seasonPass";
import { dailyOrders } from "@/game/dailyOrders";
import { ONBOARDING_STEPS } from "@/game/onboarding";
import { START_REWARD_RULES } from "@/game/startRewards";
import type { NotificationKind, PlayerState } from "@/types/game";

/* 6.14.166 (S8) : derniers réglages du parcours débutant (audit 2026-10-09, troisième passage : NJ-31 à NJ-34, reste de NJ-30,
   taxe du comptoir). */

const ROOT = path.resolve(__dirname, "../..");
const src = (p: string) => readFileSync(path.join(ROOT, p), "utf8");
const NOW = Date.parse("2026-10-09T12:00:00Z");
const EXCHANGE_DEFAULTS = structuredClone(EXCHANGE_RULES);
afterEach(() => {
  Object.assign(EXCHANGE_RULES, structuredClone(EXCHANGE_DEFAULTS));
});

function newcomer(resources: Partial<Record<string, number>>, minutes = 32): PlayerState {
  const p = { ...defaultPlayerState("n1", "Recrue"), createdAtMs: NOW - minutes * 60_000 } as PlayerState;
  Object.assign(p.resources, resources);
  p.resourcesUpdatedAtMs = NOW;
  return p;
}

describe("NJ-31 : l'histoire du chapitre 3 attend la fin du raid d'initiation", () => {
  it("raid lancé et pas encore résolu : en attente ; gagné ou perdu : plus en attente", () => {
    const p = newcomer({});
    expect(tutorialRaidPending(p)).toBe(false);
    p.onboarding = { claimed: ["rockets10"], tutorialRaid: "due" };
    expect(tutorialRaidPending(p)).toBe(true);
    p.onboarding = { claimed: ["rockets10"], tutorialRaid: "sent" };
    expect(tutorialRaidPending(p)).toBe(true);
    p.pirates = { varan: { raidsWon: 1 } } as never;
    expect(tutorialRaidPending(p)).toBe(false);
    p.pirates = { varan: { raidsLost: 1 } } as never;
    expect(tutorialRaidPending(p)).toBe(false);
  });

  it("StoryDialog ne joue pas l'intro d'un chapitre pendant le raid (l'alerte du raid passe toujours)", () => {
    const page = src("src/components/game/StoryDialog.tsx");
    expect(page).toMatch(/if \(ch && tutorialRaidPending\(player\)\) return null;/);
    expect(page.indexOf('st.tutorialRaid === "sent" && !seen.includes("raid")')).toBeLessThan(page.indexOf("tutorialRaidPending(player)) return null"));
  });
});

describe("NJ-32 : « Échange ton surplus » compare chaque stock à son besoin", () => {
  it("besoin : niveau suivant des bâtiments de production, file planifiée, objectif en cours (10 roquettes)", () => {
    const p = newcomer({});
    const base = surplusNeeds(p, defaultQueues());
    expect(base.scrap).toBeGreaterThan(0);
    p.buildings.extracteur_ferraille.level = 8;
    expect(surplusNeeds(p, defaultQueues()).scrap!).toBeGreaterThan(base.scrap!);
    // Chantier en cours : on vise le niveau d'après.
    const q = defaultQueues();
    q.buildingUpgrades = { extracteur_ferraille: { endTime: NOW + 60_000 } } as never;
    expect(surplusNeeds(p, q).scrap!).toBeGreaterThan(surplusNeeds(p, defaultQueues()).scrap!);
    // Objectif « 10 roquettes » : coût des roquettes qui manquent.
    p.buildings.extracteur_ferraille.level = 1;
    p.onboarding = { claimed: ["scrap3", "reactor3", "research", "drones5", "mission", "storage2"] };
    for (const s of ONBOARDING_STEPS.slice(0, 6)) expect(p.onboarding.claimed).toContain(s.id);
    const rockets = surplusNeeds(p, defaultQueues());
    expect(rockets.scrap!).toBeGreaterThan(base.scrap!);
  });

  it("parcours joué, 32e minute : ferraille haute juste après la prime, nano sans besoin : aucun conseil (avant : ferraille → nano)", () => {
    const p = newcomer({ scrap: 158_900, energy: 60_000, nano: 26_600, data: 20_000 });
    p.buildings.extracteur_ferraille.level = 6;
    expect(nextActions(p, defaultQueues(), [], NOW).some((a) => a.kind === "surplus")).toBe(false);
  });

  it("vrai manque d'un côté, vrai surplus de l'autre : juste de quoi combler le manque", () => {
    const s = commonSurplus({ scrap: 16_200, energy: 50_000, nano: 95_400, data: 30_000 }, { scrap: 40_000, energy: 20_000 })!;
    expect(s).toMatchObject({ sell: "nano", buy: "scrap" });
    expect(16_200 + tradeQuote("nano", "scrap", s.amount).net).toBeGreaterThanOrEqual(40_000);
    // La ressource vendue garde son besoin.
    expect(commonSurplus({ scrap: 1_000, energy: 0, nano: 30_000, data: 0 }, { scrap: 40_000, nano: 20_000 })).toBeNull();
    // Rien ne manque : rien à échanger, même avec un gros écart entre les stocks.
    expect(commonSurplus({ scrap: 41_000, energy: 21_000, nano: 300_000, data: 300_000 }, { scrap: 40_000, energy: 20_000 })).toBeNull();
  });

  it("jamais l'inverse d'un échange fait il y a moins de `surplusReverseMinutes` ; le serveur garde le dernier échange", () => {
    let p = newcomer({ scrap: 100_000, nano: 50_000 });
    p = performPlayerAction(p, defaultQueues(), { type: "trade", sellId: "scrap", buyId: "nano", amount: 10_000 }, NOW).player;
    expect(p.exchangeWeek?.last).toEqual({ sell: "scrap", buy: "nano", atMs: NOW });
    const res = { scrap: 5_000, energy: 0, nano: 90_000, data: 0 };
    const need = { scrap: 40_000 };
    const last = p.exchangeWeek!.last;
    expect(commonSurplus(res, need, { last, now: NOW + 10 * 60_000 })).toBeNull();
    expect(commonSurplus(res, need, { last, now: NOW + (EXCHANGE_RULES.surplusReverseMinutes + 1) * 60_000 })?.sell).toBe("nano");
    // Un échange commune → rare ne touche pas au dernier échange commune → commune, et inversement.
    p = performPlayerAction(p, defaultQueues(), { type: "trade", sellId: "scrap", buyId: "reinforcedSteel", amount: 1_000 }, NOW + 1).player;
    expect(p.exchangeWeek?.last?.atMs).toBe(NOW);
    expect(p.exchangeWeek?.rares).toBeGreaterThan(0);
  });

  it("réglages dans l'admin (Tous les réglages) : besoin × N et garde en minutes", () => {
    expect(EXCHANGE_RULES.surplusAdviceRatio).toBe(2);
    expect(EXCHANGE_RULES.surplusReverseMinutes).toBe(60);
    expect(src("src/game/resources.ts")).toMatch(/surplusReverseMinutes: \{\s+label:/);
  });
});

describe("NJ-33 : le passe dit ce qui est versé maintenant, la réserve dit quand", () => {
  it("compte jeune : « 1 h de production maintenant, 1 h en réserve du départ » ; ensuite : « 2 h de production »", () => {
    const r = { kind: "production", hours: 2 } as const;
    const young = newcomer({}, 31);
    expect(describePassRewardFor(r, undefined, young, NOW)).toBe("1 h de production maintenant, 1 h en réserve du départ");
    const old = newcomer({}, 25 * 60);
    expect(describePassRewardFor(r, undefined, old, NOW)).toBe(describePassReward(r));
    expect(src("src/pages/SeasonPassPage.tsx")).toMatch(/describePassRewardFor\(r, st\.seasonId, player, now\)/);
  });

  it("réserve du départ : temps restant à la minute (avant : « 24 h » à la 31e minute comme à la 47e)", () => {
    const p = newcomer({}, 31);
    p.startReserve = { scrap: 100_000 };
    const detail = (q: PlayerState, now: number) => dailyOrders(q, now).find((o) => o.id === "reserve")!.detail;
    expect(detail(p, NOW)).toContain(`Versée dans ${START_REWARD_RULES.youngAccountHours - 1} h 29 min.`);
    expect(detail(p, NOW + 16 * 60_000)).toContain(`Versée dans ${START_REWARD_RULES.youngAccountHours - 1} h 13 min.`);
    expect(detail(p, NOW + (START_REWARD_RULES.youngAccountHours * 60 - 31 - 5) * 60_000)).toContain("Versée dans 5 min.");
    expect(src("src/pages/OrdersPage.tsx")).toMatch(/useNowTicker\(\)/);
  });
});

describe("NJ-34 : l'objectif d'espionnage accepte un Seigneur de guerre", () => {
  it("le texte le dit ; toute sonde lancée compte (un Seigneur est une cible d'espionnage comme une autre)", () => {
    const spy = ONBOARDING_STEPS.find((s) => s.id === "spy")!;
    expect(spy.label).toBe("Espionner un joueur ou un Seigneur");
    expect(spy.hint).toMatch(/Seigneur de guerre/);
    expect(spy.hint).toMatch(/ne lève pas ta protection/);
    const p = newcomer({});
    expect(spy.done(p)).toBe(false);
    p.stats = { ...(p.stats ?? {}), spies: 1 };
    expect(spy.done(p)).toBe(true);
    // Compteur générique (mission « spy », PNJ compris) et pas de levée de protection à l'espionnage.
    const fleets = src("src/game/fleets.ts");
    expect(fleets).toMatch(/\{ spy: "spies", patrol: "patrols", garrison: "garrisons" \}/);
    const launchSpy = fleets.slice(fleets.indexOf("export function launchSpy"), fleets.indexOf("export function launchSpy") + 1500);
    expect(launchSpy).not.toMatch(/dropShield|lastAttackAtMs/);
  });
});

describe("Taxe du comptoir : la taxe affichée est juste", () => {
  it("pourcentage affiché et quantité par défaut à brut 100 (5 % → taxe 5, plus « brut 2 · taxe 1 »)", () => {
    const page = src("src/pages/ResourcesPage.tsx");
    expect(page).toMatch(/taxe \{formatPct\(quote\.taxPct, 1\)\}/);
    expect(page).toMatch(/defaultTradeAmount\(sellId, buyId, taxCut, stock\)/);
    expect(tradeQuote("scrap", "reinforcedSteel", 200)).toMatchObject({ gross: 2, tax: 1 });
    const q = tradeQuote("scrap", "reinforcedSteel", 10_000);
    expect(q.gross).toBe(100);
    expect(q.tax / q.gross).toBeCloseTo(EXCHANGE_RULES.taxPct, 5);
  });
});

describe("Reste de NJ-30 : succès et « Nouveau : … » regroupés dans le chiffre de la cloche", () => {
  it("10 succès et 6 ouvertures de pages comptent 2 ; une attaque compte 1 ; la routine 0", () => {
    const n = (kind: NotificationKind, title = "x", read = false) => ({ kind, title, read });
    const items = [
      ...Array.from({ length: 10 }, () => n("achievement", "Succès débloqué")),
      ...Array.from({ length: 6 }, (_, i) => n("system", `Nouveau : Page ${i}`)),
      ...Array.from({ length: 12 }, () => n("building")),
    ];
    expect(badgeCount(items)).toBe(2);
    expect(badgeCount([...items, n("combat-defender")])).toBe(3);
    expect(badgeCount([...items, n("system", "Maintenance")])).toBe(3);
    expect(badgeCount(items.map((i) => ({ ...i, read: true })))).toBe(0);
    expect(src("src/components/layout/NotificationBell.tsx")).toMatch(/badgeCount\(items\)/);
  });
});
