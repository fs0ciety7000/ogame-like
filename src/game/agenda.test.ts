import { afterEach, describe, expect, it } from "vitest";
import { upcomingAgenda } from "@/game/agenda";
import { EVENT_RULES } from "@/game/events";

const saved = { ...EVENT_RULES };
afterEach(() => Object.assign(EVENT_RULES, saved));

describe("frise des prochains rendez-vous (v5.10.5)", () => {
  const now = new Date("2026-10-05T12:00:00+02:00").getTime();

  it("boss, épisodes, événements et fin de saison, dans l'ordre", () => {
    const items = upcomingAgenda(now, 40);
    const kinds = new Set(items.map((i) => i.kind));
    expect(kinds.has("leviathan")).toBe(true);
    expect(kinds.has("season")).toBe(true);
    expect(kinds.has("chronicle")).toBe(true);
    expect(items.map((i) => i.startMs)).toEqual([...items.map((i) => i.startMs)].sort((a, b) => a - b));
  });

  it("dates précises et événements programmés sont repérés pour le planificateur", () => {
    const d = new Date("2026-10-14T20:00:00+02:00").getTime();
    EVENT_RULES.bossDates = [{ startMs: d, durationHours: 24 }];
    EVENT_RULES.scheduled = [{ id: "x1", type: EVENT_RULES.types[0].id, startMs: d + 3 * 86400_000, endMs: d + 4 * 86400_000 }];
    const items = upcomingAgenda(now, 30);
    expect(items.find((i) => i.kind === "leviathan" && i.fixed)?.source).toEqual({ type: "levDate", startMs: d });
    expect(items.find((i) => i.kind === "event" && i.fixed)?.source).toEqual({ type: "scheduled", id: "x1" });
  });
});
