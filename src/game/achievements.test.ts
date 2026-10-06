import { beforeEach, describe, expect, it } from "vitest";
import {
  ACHIEVEMENTS,
  derivedAchievements,
  ACHIEVEMENT_HINT_PRICE,
  achievementHint,
  achievementProgress,
  achievementVisibility,
  previousTier,
  checkNewAchievements,
  DEFAULT_ACHIEVEMENTS,
  METRICS,
  setAchievements,
  validateAchievements,
} from "@/game/achievements";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { flushState } from "@/game/flush";
import { performPlayerAction } from "@/game/actions";
import { bumpStat, parisHour, recordMission } from "@/game/stats";
import { advanceWorkshop, sendToWorkshop } from "@/game/workshop";
import { recordAuctionStat } from "@/game/auctions";
import type { PlayerState } from "@/types/game";

function makePlayer(overrides: Partial<PlayerState> = {}): PlayerState {
  return { ...defaultPlayerState("u1", "Testeur"), ...overrides };
}
const ids = (p: PlayerState) => checkNewAchievements(p).map((a) => a.id);

describe("succès (v2.3)", () => {
  beforeEach(() => setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS)));

  it("has 76 valid achievements, keeping the 8 historical ids", () => {
    // 76 succès de base + les succès dérivés des catalogues (v5.14).
    expect(ACHIEVEMENTS).toHaveLength(76 + derivedAchievements().length);
    expect(validateAchievements(DEFAULT_ACHIEVEMENTS)).toEqual([]);
    for (const id of ["first_blood", "veteran", "architect", "expansion", "researcher", "commander", "fleet", "tireless"]) {
      expect(ACHIEVEMENTS.some((a) => a.id === id)).toBe(true);
    }
    for (const a of ACHIEVEMENTS) expect(METRICS[a.metric]).toBeDefined();
  });

  it("returns nothing for a fresh player", () => {
    expect(checkNewAchievements(makePlayer())).toHaveLength(0);
  });

  it("detects newly-met conditions, once", () => {
    expect(ids(makePlayer({ victories: 10, playtimeSeconds: 100_000 }))).toEqual(expect.arrayContaining(["first_blood", "veteran", "tireless"]));
    expect(ids(makePlayer({ victories: 1, unlockedAchievements: ["first_blood"] }))).not.toContain("first_blood");
  });

  it("follows the cumulative stats", () => {
    const p = makePlayer();
    bumpStat(p, "loot", 150_000);
    bumpStat(p, "traded", 2_000_000);
    expect(ids(p)).toEqual(expect.arrayContaining(["raider", "merchant"]));
    const corsair = ACHIEVEMENTS.find((a) => a.id === "corsair")!;
    expect(achievementProgress(corsair, p)).toEqual({ value: 150_000, target: 1_000_000, done: false });
    for (let i = 0; i < 10; i++) recordMission(p, "2026-10-01");
    recordMission(p, "2026-10-02");
    expect(p.stats).toMatchObject({ missions: 11, bestMissionDay: 10, missionDayCount: 1 });
  });

  it("disabled achievements never unlock", () => {
    ACHIEVEMENTS.find((a) => a.id === "first_blood")!.enabled = false;
    expect(ids(makePlayer({ victories: 1 }))).not.toContain("first_blood");
  });

  it("grants XP, production and titles when the server flushes", () => {
    const now = Date.UTC(2026, 9, 1, 12);
    const p = makePlayer({ resourcesUpdatedAtMs: now, victories: 1000 });
    const out = flushState(p, defaultQueues(), now);
    expect(out.player.unlockedAchievements).toEqual(expect.arrayContaining(["first_blood", "eternal_conqueror"]));
    expect(out.player.xp).toBe(10 + 10 + 25 + 60 + 150);
    expect(out.player.titles?.map((t) => t.label)).toContain("Conquérant");
    // 5.15 : jetons du casino — Or 1, Légendaire 2 (Bronze et Argent : aucun).
    expect(out.player.casino?.tokens).toBe(3);
    expect(out.notifications.filter((n) => n.kind === "achievement")).toHaveLength(1); // regroupées
    expect(out.notifications.find((n) => n.kind === "achievement")?.message).toMatch(/\+3 jetons du casino/);
    const again = flushState(out.player, out.queues, now + 1000);
    expect(again.notifications.filter((n) => n.kind === "achievement")).toHaveLength(0);
  });

  it("counts trades and claimed contracts in player actions", () => {
    const now = Date.UTC(2026, 9, 1, 12);
    const p = makePlayer({ resourcesUpdatedAtMs: now });
    p.resources.scrap = 10_000;
    const out = performPlayerAction(p, defaultQueues(), { type: "trade", sellId: "scrap", buyId: "energy", amount: 5000 }, now);
    expect(out.player.stats?.traded).toBe(5000);
  });

  it("knows the Paris hour (summer and winter time)", () => {
    expect(parisHour(Date.UTC(2026, 6, 1, 1))).toBe(3);
    expect(parisHour(Date.UTC(2026, 0, 15, 2))).toBe(3);
  });
});

describe("5.26.1 : succès des systèmes récents", () => {
  beforeEach(() => setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS)));

  it("Atelier, enchères, modules, reliques, primes et Ambre ont leurs succès (même avec un catalogue personnalisé)", () => {
    setAchievements([]);
    const ids = new Set(ACHIEVEMENTS.map((a) => a.id));
    for (const id of ["atelier_1", "enchere_vente_1", "enchere_achat_1", "module_1", "module_full", "relique_5", "prime_1", "ambre_1"]) expect(ids.has(id)).toBe(true);
    expect(validateAchievements(derivedAchievements())).toEqual([]);
  });

  it("les compteurs débloquent les succès", () => {
    const p = makePlayer();
    sendToWorkshop(p, { chasseur: 60 }, 0, "raid", true);
    advanceWorkshop(p, 1, true);
    expect(METRICS.unitsRepaired.value(p)).toBe(60);
    recordAuctionStat(p, "sold");
    recordAuctionStat(p, "won");
    const got = checkNewAchievements(p).map((a) => a.id);
    expect(got).toEqual(expect.arrayContaining(["atelier_1", "enchere_vente_1", "enchere_achat_1"]));
  });
});

describe("5.26.1 : brouillard des paliers", () => {
  it("obtenus et prochain palier visibles, les suivants dans le brouillard, les secrets restent secrets", () => {
    const chain = DEFAULT_ACHIEVEMENTS.filter((a) => a.metric === "victories").sort((x, y) => x.threshold - y.threshold);
    const v0 = achievementVisibility(chain, new Set());
    expect(chain.map((a) => v0.get(a.id))).toEqual(["shown", "fog", "fog", "fog", "fog"]);
    const v1 = achievementVisibility(chain, new Set([chain[0].id]));
    expect(chain.map((a) => v1.get(a.id))).toEqual(["shown", "shown", "fog", "fog", "fog"]);
    expect(previousTier(chain, chain[2])?.id).toBe(chain[1].id);
    const secret = DEFAULT_ACHIEVEMENTS.find((a) => a.id === "phoenix")!;
    expect(achievementVisibility([secret], new Set()).get("phoenix")).toBe("secret");
  });
});

describe("5.26.2 : indices des succès secrets", () => {
  beforeEach(() => setAchievements(structuredClone(DEFAULT_ACHIEVEMENTS)));
  it("un indice par secret, payé en Ambre, jamais pour un succès visible ou obtenu", () => {
    const p = makePlayer({ bounties: { amber: 60 } as PlayerState["bounties"] });
    expect(() => performPlayerAction(p, defaultQueues(), { type: "achievementHint", achievementId: "first_blood" }, 1)).toThrow(/indice/);
    const out = performPlayerAction(p, defaultQueues(), { type: "achievementHint", achievementId: "phoenix" }, 1);
    expect((out.result as { hint: string }).hint).toMatch(/cendres/);
    expect(out.player.bounties?.amber).toBe(60 - ACHIEVEMENT_HINT_PRICE);
    expect(out.player.stats?.hintsBought).toEqual(["phoenix"]);
    expect(() => performPlayerAction(out.player, defaultQueues(), { type: "achievementHint", achievementId: "phoenix" }, 2)).toThrow(/déjà/);
    expect(achievementHint({ metric: "victories", category: "combat" })).toMatch(/combat/);
  });
});
