import { afterEach, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { applyGameContent, currentGameContent, validateRules } from "@/game/content";
import { actionPlayable, challengePool, computePointsPerTier, PASS_GEN_RULES, passGenRules } from "@/game/passGen";
import { ensureFeasiblePass, generatePassSeason, nextMonthId, passPaceCheck, weeklyRate, type PassSeason } from "@/game/passSeasons";
import { generateChapter, objectiveCount, seededRandom, type WorldDigest } from "@/game/procedural";
import { chronicleGenRules } from "@/game/chronicleGen";
import { BASE_COUNTS } from "@/game/procedural";
import type { ChronicleMonth, ChronicleObjective } from "@/game/chronicles";

/* 6.14.58 (AU27, AP-2, AP-4) : défis du passe et épisodes des Chroniques faisables pour le joueur médian du serveur. */

const NOW = Date.UTC(2026, 9, 20, 12);
/** Médianes hebdomadaires mesurées sur la pré-prod le 7 octobre 2026 (AU27, profil « réel »). */
const REAL: WorldDigest["weeklyMedian"] = { contract: 5, bounty: 4, raidRepelled: 4, victory: 1, mission: 88, spy: 0, market: 0, warlordWin: 0, bossAssault: 0 };
const TYPICAL: WorldDigest["weeklyMedian"] = { contract: 9, bounty: 4, raidRepelled: 0.2, victory: 3, mission: 12, spy: 5, market: 2, warlordWin: 0.6, bossAssault: 1 };
const digest = (weeklyMedian: WorldDigest["weeklyMedian"], passPace?: WorldDigest["passPace"]): WorldDigest => ({
  monthId: "2026-10",
  observedDays: 20,
  activePlayers: 15,
  weeklyMedian,
  totals: {},
  heroes: {},
  episodes: [],
  passMedianTier: 11,
  passTiers: 30,
  passFinishedShare: 0.27,
  chapterShare: 0.3,
  ...(passPace ? { passPace } : {}),
});
const keysOf = (s: Pick<PassSeason, "requirements">) => new Set(Object.values(s.requirements).flat().map((r) => r.key));

afterEach(() => applyGameContent({}));

describe("défis du passe faisables (AP-2)", () => {
  it("profil réel : le passe de novembre finit au plus tard le jour limite, sans action de médiane nulle (Q-AP3)", () => {
    const s = generatePassSeason({ monthId: "2026-11", digest: digest(REAL, { median: 63.29, top: 171.43 }), existing: [], now: NOW });
    expect(s.auto!.pace!.medianDay).not.toBeNull();
    expect(s.auto!.pace!.medianDay!).toBeLessThanOrEqual(passGenRules().latestMedianDay);
    for (const k of ["spy", "market", "warlordWin", "bossAssault"]) expect(keysOf(s).has(k as ChronicleObjective)).toBe(false);
    expect(s.auto!.reasons.some((r) => r.startsWith("Hors des défis"))).toBe(true);
  });

  it("plancher borné par la médiane : jamais plus que ce que fait le joueur médian", () => {
    const d = digest(REAL);
    expect(weeklyRate("victory", d)).toBe(1);
    expect(weeklyRate("contract", d)).toBe(5);
    // Plafond inchangé (× 3 de la base), base sans mesure.
    expect(weeklyRate("mission", d)).toBe(BASE_COUNTS.mission * 3);
    expect(weeklyRate("spy", digest({}))).toBe(BASE_COUNTS.spy);
  });

  it("seuil unifié : action passive sous passiveMinWeekly, ou action de médiane nulle sur un serveur mesuré, hors des défis", () => {
    const r = passGenRules();
    expect(actionPlayable("bossAssault", { bossAssault: r.passiveMinWeekly - 0.1, victory: 2 })).toBe(false);
    expect(actionPlayable("bossAssault", { bossAssault: r.passiveMinWeekly, victory: 2 })).toBe(true);
    expect(actionPlayable("market", { victory: 2 })).toBe(false);
    expect(actionPlayable("market", {})).toBe(true);
    expect(challengePool(REAL).map((x) => x.key).sort()).toEqual(["bounty", "contract", "victory"]);
  });

  it("I18 étendu : 200 serveurs bruités, médian au plus tard le jour limite dès que ses points par jour le permettent", () => {
    const r = passGenRules();
    let months = "2026-11";
    let late = 0;
    for (let i = 0; i < 200; i++) {
      const rng = seededRandom(`noise:${i}`);
      const wm: Record<string, number> = {};
      for (const [k, v] of Object.entries(TYPICAL)) wm[k] = Math.round((v ?? 0) * (0.3 + 1.7 * rng()) * 100) / 100;
      const pace = { median: 20 + 60 * rng(), top: 80 + 200 * rng() };
      const s = generatePassSeason({ monthId: months, digest: digest(wm, pace), existing: [], now: 0 });
      months = nextMonthId(months);
      const day = s.auto!.pace!.medianDay;
      // Seule exception admise : le joueur médian gagne trop peu de points pour finir au minimum de points par palier.
      const pointsBound = (r.pointsMin * 30) / pace.median > r.latestMedianDay;
      if (day === null || day > r.latestMedianDay) {
        late++;
        expect(pointsBound).toBe(true);
        expect(s.pointsPerTier).toBe(r.pointsMin);
      }
    }
    expect(late).toBeLessThanOrEqual(30);
  });

  it("points par palier : l'arrondi ne fait plus dépasser le jour limite (60 → 55 pour 63 points par jour)", () => {
    const c = computePointsPerTier({ median: 63.29, top: 171.43 }, 30)!;
    expect(c.ppt).toBe(55);
    expect((30 * c.ppt) / 63.29).toBeLessThanOrEqual(passGenRules().latestMedianDay);
  });

  it("garde avant publication d'office : ancien brouillon infaisable → défis faisables, récompenses et commandant gardés", () => {
    const d = digest(REAL, { median: 63.29, top: 171.43 });
    const base = generatePassSeason({ monthId: "2026-11", digest: d, existing: [], now: NOW });
    const hard: PassSeason = {
      ...base,
      challengeMode: undefined,
      pointsPerTier: 40,
      requirements: Object.fromEntries(base.tiers.map((_, i) => [String(i + 1), [{ key: "spy", count: 3 + i }, { key: "market", count: 3 + i }]])) as PassSeason["requirements"],
    };
    expect(passPaceCheck(hard, d).medianDay).toBeNull();
    const fit = ensureFeasiblePass(hard, d);
    expect(fit.changed).toBe(true);
    expect(fit.ok).toBe(true);
    expect(fit.season.tiers).toEqual(hard.tiers);
    expect(fit.season.commander).toEqual(hard.commander);
    expect(passPaceCheck(fit.season, d).medianDay!).toBeLessThanOrEqual(passGenRules().latestMedianDay);
    expect(fit.season.auto!.reasons.some((r) => r.startsWith("Garde de faisabilité"))).toBe(true);
    // Un passe déjà faisable ne bouge pas.
    expect(ensureFeasiblePass(base, d).changed).toBe(false);
  });

  it("serveur : la garde passe avant la publication d'office", () => {
    const src = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
    const tick = src.slice(src.indexOf("function passSeasonsTick("), src.indexOf("function keepContentVersion("));
    expect(tick.indexOf("ensureFeasiblePass")).toBeGreaterThan(0);
    expect(tick.indexOf("ensureFeasiblePass")).toBeLessThan(tick.indexOf("game.publishPassSeason(cur, now)"));
  });

  it("réglages dans l'admin : nouveaux champs validés et appliqués", () => {
    const rules = currentGameContent().rules;
    expect(validateRules({ ...rules, passGen: { ...PASS_GEN_RULES, challengeMinFactor: 4 } })).not.toEqual([]);
    applyGameContent({ rules: { ...rules, passGen: { ...PASS_GEN_RULES, challengeMinWeekly: 0, challengeRedraws: 2 } } });
    expect(passGenRules().challengeMinWeekly).toBe(0);
    expect(passGenRules().challengeRedraws).toBe(2);
    applyGameContent({ rules: { ...rules, chronicleGen: { ...rules.chronicleGen, stretchMinWeekly: 1 } } });
    expect(chronicleGenRules().stretchMinWeekly).toBe(1);
  });
});

describe("épisodes des Chroniques faisables (AP-4, I19 étendu)", () => {
  it("profil réel, 12 mois : l'épisode 3 prend une action dont la médiane atteint stretchMinWeekly, aucun raid ni seigneur hors seuil", () => {
    const d = digest(REAL);
    const existing: ChronicleMonth[] = [];
    let m = "2026-11";
    for (let i = 0; i < 12; i++) {
      const c = generateChapter({ monthId: m, digest: d, existing: [...existing], now: NOW });
      existing.push(c);
      m = nextMonthId(m);
      const t3 = c.episodes[2].objective.type;
      expect(REAL[t3] ?? 0).toBeGreaterThanOrEqual(chronicleGenRules().stretchMinWeekly);
      for (const e of c.episodes) if (passGenRules().passiveKeys.includes(e.objective.type)) expect(actionPlayable(e.objective.type, REAL)).toBe(true);
    }
  });

  it("quantité d'un épisode : jamais plus que la médiane d'une semaine × difficulté quand la médiane est sous le plancher", () => {
    expect(objectiveCount("victory", digest(REAL), 1)).toBe(1);
    expect(objectiveCount("victory", digest({ victory: 6 }), 1)).toBe(6);
  });
});
