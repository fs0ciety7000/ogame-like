import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { changedRuleGroups, diffValues, isSettingsHistoryKey, restoreSettings, rollbackRuleGroup, settingsSnapshot, SETTINGS_HISTORY } from "@/game/contentHistory";
import { CONTENT_SECTIONS } from "@/game/content";

/* 6.14.126 (AU27, lot AA8, AA-27) : historique dans l'admin. */

describe("AA8 : différence champ par champ", () => {
  it("compare objets, listes à identifiant et valeurs simples", () => {
    const before = { combat: { maxRounds: 6, retreatAt: 0.3 }, alliances: { researches: [{ id: "logistique", perLevel: 0.05 }, { id: "industrie", perLevel: 0.03 }] }, durations: [1, 2] };
    const after = { combat: { maxRounds: 8, retreatAt: 0.3 }, alliances: { researches: [{ id: "logistique", perLevel: 0.06 }, { id: "soutes", perLevel: 0.1 }] }, durations: [1, 2, 4], pvp: { maxXpRatio: 3 } };
    expect(diffValues(before, after)).toEqual([
      { path: "alliances.researches[logistique].perLevel", kind: "changed", before: "0.05", after: "0.06" },
      { path: "alliances.researches[industrie]", kind: "removed", before: '{"id":"industrie","perLevel":0.03}' },
      { path: "alliances.researches[soutes]", kind: "added", after: '{"id":"soutes","perLevel":0.1}' },
      { path: "combat.maxRounds", kind: "changed", before: "6", after: "8" },
      { path: "durations", kind: "changed", before: "[1,2]", after: "[1,2,4]" },
      { path: "pvp", kind: "added", after: '{"maxXpRatio":3}' },
    ]);
    expect(diffValues({ a: 1 }, { a: 1 })).toEqual([]);
    expect(diffValues(null, { a: 1 })).toEqual([{ path: "(tout)", kind: "added", after: '{"a":1}' }]);
    expect(diffValues({ s: "x".repeat(200) }, { s: "y" })[0].before?.length).toBeLessThanOrEqual(80);
    expect(diffValues(Object.fromEntries(Array.from({ length: 300 }, (_, i) => [`k${i}`, i])), {}, 50)).toHaveLength(50);
  });
});

describe("AA8 : retour arrière d'un seul groupe de règles", () => {
  it("le groupe reprend la valeur de la version, les autres gardent l'état actuel", () => {
    const version = { combat: { maxRounds: 6 }, pvp: { maxXpRatio: 2 } };
    const current = { combat: { maxRounds: 8 }, pvp: { maxXpRatio: 3 }, economy: { keshBoostPct: 0.3 } };
    expect(changedRuleGroups(version, current)).toEqual(["combat", "economy", "pvp"]);
    expect(rollbackRuleGroup(current, version, "combat")).toEqual({ combat: { maxRounds: 6 }, pvp: { maxXpRatio: 3 }, economy: { keshBoostPct: 0.3 } });
    // Groupe absent de la version : il revient aux valeurs du code.
    expect(rollbackRuleGroup(current, version, "economy")).toEqual({ combat: { maxRounds: 8 }, pvp: { maxXpRatio: 3 } });
    expect(rollbackRuleGroup(null, version, "pvp")).toEqual({ pvp: { maxXpRatio: 2 } });
  });
});

describe("AA8 : instantanés des réglages serveur", () => {
  it("clés suivies hors sections de contenu ; partie réglée seulement", () => {
    for (const k of ["casino", "procedural", "announcements", "banners", "emojis", "staff"]) expect(isSettingsHistoryKey(k), k).toBe(true);
    for (const k of Object.keys(SETTINGS_HISTORY)) expect((CONTENT_SECTIONS as string[]).includes(k), k).toBe(false);
    expect(isSettingsHistoryKey("weekly_stock")).toBe(false);
    expect(settingsSnapshot("casino", { pot: 500, settings: { dailyFreeSpins: 2 } })).toEqual({ dailyFreeSpins: 2 });
    expect(settingsSnapshot("procedural", { enabled: true, log: [{ atMs: 1, text: "x" }] })).toEqual({ enabled: true });
    expect(settingsSnapshot("banners", [{ id: "b" }])).toEqual([{ id: "b" }]);
  });

  it("le retour garde l'état de jeu (pot du casino, journal des générateurs) et ferme l'équipe", () => {
    const casino = restoreSettings("casino", { pot: 900, settings: { a: 1 } }, {});
    expect(casino.errors).toEqual([]);
    expect((casino.data as { pot: number }).pot).toBe(900);
    const proc = restoreSettings("procedural", { enabled: false, log: [{ atMs: 2, text: "garde" }] }, { enabled: true, log: [] });
    expect(proc.data).toMatchObject({ enabled: true, log: [{ atMs: 2, text: "garde" }] });
    expect(restoreSettings("staff", { roles: {} }, { roles: { u: "admin" } }).errors[0]).toMatch(/Administrateurs/);
    expect(restoreSettings("inconnu", null, null).errors).toHaveLength(1);
  });

  it("le serveur garde, valide et restaure (route admin, garde de contenu, réglages des routes)", () => {
    const db = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
    const fn = (name: string) => db.slice(db.indexOf(`function ${name}(`), db.indexOf("\nfunction ", db.indexOf(`function ${name}(`) + 10));
    expect(fn("contentRollback")).toMatch(/isGameAdmin\(e\)/);
    expect(fn("contentRollback")).toMatch(/assertContentValid\(txApp, game, section, next/);
    expect(fn("contentRollback")).toMatch(/rollbackRuleGroup/);
    expect(fn("contentRollback")).toMatch(/restoreSettings/);
    expect(fn("guardContentConfig")).toMatch(/assertContentValid/);
    expect(fn("snapshotContent")).toMatch(/isSettingsHistoryKey/);
    expect(fn("adminCasino")).toMatch(/saveSettingsVersion/);
    expect(fn("adminProcedural")).toMatch(/saveSettingsVersion/);
    expect(fn("adminManage")).toMatch(/saveSettingsVersion/);
  });
});
