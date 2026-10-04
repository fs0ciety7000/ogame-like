import { beforeEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent } from "@/game/content";
import { generatePassSeason, publishPassSeason } from "@/game/passSeasons";
import { checkMonth, monthCheckSummary, windowsInMonth } from "@/game/monthCheck";
import { defaultSimProfiles, passDurationVerdict, simulatePass } from "@/game/passSimulator";
import { leviathanSchedule } from "@/game/leviathan";
import { seasonBossSchedule } from "@/game/chronicles";
import type { WorldDigest } from "@/game/procedural";

/* 5.15.4 : contrôle de novembre 2026 en CI : passe généré (défis sur les 30
   paliers, durée tenable), Chroniques, boss de saison et alternance. */

const OCT_20 = Date.UTC(2026, 9, 20, 12);
const digest = (): WorldDigest => ({
  monthId: "2026-10",
  observedDays: 20,
  activePlayers: 12,
  weeklyMedian: { victory: 3, contract: 4, spy: 3, market: 3, bounty: 2, warlordWin: 0.5 },
  totals: {},
  heroes: {},
  episodes: [],
  passMedianTier: 18,
  passTiers: 30,
  passFinishedShare: 0.3,
  chapterShare: 0.4,
});

beforeEach(() => applyGameContent({}));

describe("5.15.4 contrôle de novembre", () => {
  const nov = () => publishPassSeason(generatePassSeason({ monthId: "2026-11", digest: digest(), existing: [], now: OCT_20 }), OCT_20);

  it("le passe de novembre a un défi à chacun des 30 paliers et se termine dans le mois pour le joueur médian", () => {
    const pass = nov();
    expect(pass.tiers).toHaveLength(30);
    const [casual, median, active] = defaultSimProfiles().map((p) => simulatePass(pass, p, 30));
    expect(median.finishDay).not.toBeNull();
    expect(passDurationVerdict(median, 30).tone).not.toBe("danger");
    // Plus on joue, plus on va vite ; l'occasionnel n'est pas obligé de finir.
    expect(active.finishDay!).toBeLessThanOrEqual(median.finishDay!);
    expect(casual.tiersInMonth).toBeLessThanOrEqual(median.tiersInMonth);
    // Les paliers tombent dans l'ordre.
    const days = median.tierDays.filter((d): d is number => d !== null);
    expect([...days].sort((a, b) => a - b)).toEqual(days);
  });

  it("Chroniques, boss de saison et alternance avec le boss mondial : rien de bloquant", () => {
    const content = currentGameContent();
    const items = checkMonth("2026-11", { passSeasons: { seasons: [nov()] }, chronicles: content.chronicles });
    const blocking = items.filter((i) => i.status === "bad");
    expect(blocking.map((i) => `${i.area} / ${i.label} : ${i.detail}`)).toEqual([]);
    expect(monthCheckSummary(items)).not.toBe("bad");
    // Boss de saison chaque semaine, jamais en même temps qu'un boss mondial.
    const world = windowsInMonth("2026-11", leviathanSchedule());
    const season = windowsInMonth("2026-11", seasonBossSchedule());
    expect(world.length).toBeGreaterThanOrEqual(4);
    expect(season.length).toBeGreaterThanOrEqual(3);
    for (const s of season) for (const w of world) expect(s.startMs < w.endMs && w.startMs < s.endMs).toBe(false);
  });

  it("signale un passe absent et un boss trop long pour l'alternance", () => {
    const content = currentGameContent();
    const items = checkMonth("2026-11", { passSeasons: { seasons: [] }, chronicles: content.chronicles });
    expect(items.find((i) => i.area === "Passe")?.status).toBe("warn");
    applyGameContent({ rules: { ...content.rules, seasonBoss: { ...content.rules.seasonBoss, durationHours: 150 } } });
    const long = checkMonth("2026-11", { passSeasons: { seasons: [nov()] }, chronicles: content.chronicles });
    expect(long.find((i) => i.label === "Apparitions")?.status).not.toBe("ok");
  });
});
