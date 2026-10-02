import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import { computeRetention, parisDay, recordActiveDay } from "@/game/retention";
import { normalizeLayout, moveSection, toggleSection, defaultLayout } from "@/lib/dashboardLayout";
import { announcementLive, normalizeAnnouncementSettings, scheduledAnnouncements } from "@/game/announcements";
import { performPlayerAction } from "@/game/actions";
import { defaultQueues } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

const DAY = 24 * 3600_000;
const NOW = Date.UTC(2026, 9, 20, 10);

function player(uid: string, createdAtMs: number, lastSeen: number): PlayerState {
  const p = defaultPlayerState(uid, uid) as PlayerState;
  p.createdAtMs = createdAtMs;
  p.resourcesUpdatedAtMs = lastSeen;
  return p;
}

describe("v4.5 retention", () => {
  it("records one active day per Paris day, 60 kept", () => {
    const p = player("a", NOW, NOW);
    recordActiveDay(p, NOW);
    recordActiveDay(p, NOW + 3600_000);
    expect(p.stats?.activeDays).toEqual(["2026-10-20"]);
    // 23 h 30 UTC = 1 h 30 le lendemain à Paris (heure d'été).
    expect(parisDay(Date.UTC(2026, 9, 20, 23, 30))).toBe("2026-10-21");
    for (let i = 1; i <= 70; i++) recordActiveDay(p, NOW + i * DAY);
    expect(p.stats?.activeDays).toHaveLength(60);
  });

  it("is recorded by the sync action", () => {
    const p = player("s", NOW - DAY, NOW);
    const out = performPlayerAction(p, defaultQueues(), { type: "sync" }, NOW);
    expect(out.player.stats?.activeDays).toEqual(["2026-10-20"]);
  });

  it("computes daily actives, D1/D7 cohorts and the onboarding drop-off", () => {
    const signup = NOW - 10 * DAY;
    const back = player("back", signup, NOW);
    back.stats = { activeDays: [parisDay(signup), parisDay(signup + DAY), parisDay(signup + 8 * DAY), parisDay(NOW)] };
    const gone = player("gone", signup, signup + 2 * 3600_000);
    gone.stats = { activeDays: [parisDay(signup)] };
    const r = computeRetention([back, gone], NOW);
    expect(r.trackingSince).toBe(parisDay(signup));
    expect(r.daily).toHaveLength(30);
    expect(r.daily.find((d) => d.day === parisDay(signup))).toMatchObject({ active: 2, signups: 2 });
    const cohort = r.cohorts.find((c) => c.signups === 2)!;
    expect(cohort).toMatchObject({ d1Pct: 50, d7Pct: 50, activeNowPct: 50 });
    expect(r.active).toMatchObject({ d1: 1, d7: 1, d30: 2, total: 2 });
    expect(r.recentPlayers).toBe(2);
    expect(r.dropoff[0]).toMatchObject({ id: "scrap3", count: 1 });
    // v4.6 : la présence l'emporte sur la dernière mise à jour (tâches du serveur).
    const touched = player("cron", signup, NOW);
    touched.lastActiveMs = NOW - 3 * DAY;
    expect(computeRetention([touched], NOW).active.d1).toBe(0);
  });
});

describe("v4.5 dashboard layout", () => {
  it("keeps known sections, appends new ones, moves and hides", () => {
    const l = normalizeLayout({ order: ["log", "bogus", "log", "next"], hidden: ["power", "nope"] });
    expect(l.order.slice(0, 2)).toEqual(["log", "next"]);
    expect(l.order).toHaveLength(defaultLayout().order.length);
    expect(l.hidden).toEqual(["power"]);
    expect(moveSection(l, "next", -1).order.slice(0, 2)).toEqual(["next", "log"]);
    expect(moveSection(l, "log", -1)).toBe(l);
    expect(toggleSection(l, "power").hidden).toEqual([]);
  });
});

describe("v4.5 announcement schedule", () => {
  it("filters by window, puts admin-made announcements first", () => {
    const settings = normalizeAnnouncementSettings({
      custom: [{ id: "c1", eyebrow: "x", title: "Custom", text: "t", cta: { label: "Go", to: "/game" }, createdAtMs: NOW - DAY }],
      schedule: { old: { endsAtMs: NOW - 1 }, later: { startsAtMs: NOW + DAY }, off: { disabled: true } },
    });
    const code = [{ id: "old" }, { id: "later" }, { id: "off" }, { id: "plain" }];
    const list = scheduledAnnouncements(code, settings, NOW, (c) => ({ id: c.id }));
    expect(list.map((a) => a.id)).toEqual(["c1", "plain"]);
    expect(announcementLive("later", settings, NOW + 2 * DAY)).toBe(true);
    expect(normalizeAnnouncementSettings({ custom: [{ id: "z", features: new Array(9).fill({ title: "a" }) }] }).custom[0].features).toHaveLength(4);
  });
});
