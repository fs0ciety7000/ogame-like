import { describe, expect, it } from "vitest";
import { campaignsState, inSegment, instrumentHtml, normalizeSegment, trackCampaign } from "@/game/mailSegments";

const now = Date.UTC(2026, 9, 5);
const DAY = 86400_000;

describe("segments et suivi des campagnes (5.16)", () => {
  it("filtre selon l'activité, l'ancienneté et l'alliance", () => {
    const fresh = { lastActiveMs: now - DAY, createdAtMs: now - 3 * DAY, allianceId: "a1" };
    const gone = { lastActiveMs: now - 40 * DAY, createdAtMs: now - 90 * DAY, allianceId: null };
    expect(inSegment({ id: "active7" }, fresh, now)).toBe(true);
    expect(inSegment({ id: "inactive7" }, fresh, now)).toBe(false);
    expect(inSegment({ id: "inactive30" }, gone, now)).toBe(true);
    expect(inSegment({ id: "newcomers14" }, fresh, now)).toBe(true);
    expect(inSegment({ id: "noAlliance" }, gone, now)).toBe(true);
    expect(inSegment({ id: "alliance", allianceId: "a1" }, fresh, now)).toBe(true);
    expect(inSegment({ id: "alliance", allianceId: "a1" }, gone, now)).toBe(false);
    expect(normalizeSegment({ id: "nope" })).toEqual({ id: "all" });
  });

  it("ouvertures et clics uniques par joueur", () => {
    let st = campaignsState({ list: [{ id: "c1", subject: "S", segment: { id: "all" }, sentAtMs: now, sent: 3, failed: 0, opened: [], clicked: [] }] });
    st = trackCampaign(st, "c1", "u1", "open");
    st = trackCampaign(st, "c1", "u1", "open");
    st = trackCampaign(st, "c1", "u2", "click");
    expect(st.list[0].opened).toEqual(["u1", "u2"]);
    expect(st.list[0].clicked).toEqual(["u2"]);
  });

  it("pixel d'ouverture et liens suivis, sauf la désinscription", () => {
    const html = '<body><a href="https://empire.fs0ciety.org/game?x=1&amp;y=2">Jouer</a><a href="https://api/api/cosmic/unsubscribe?u=1">Stop</a></body>';
    const out = instrumentHtml(html, "https://api/o.gif", (u) => `https://api/c?url=${encodeURIComponent(u)}`);
    expect(out).toContain('href="https://api/c?url=https%3A%2F%2Fempire.fs0ciety.org%2Fgame%3Fx%3D1%26y%3D2"');
    expect(out).toContain('href="https://api/api/cosmic/unsubscribe?u=1"');
    expect(out).toContain('<img src="https://api/o.gif"');
  });
});
