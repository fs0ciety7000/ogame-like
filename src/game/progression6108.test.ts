import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, defaultGameContent, validateGameContent } from "@/game/content";
import { ACHIEVEMENT_GEN_RULES, achievementGenText, achievementHoldersNeeded, proposeAchievementTiers, stampGeneratedTiers } from "@/game/procedural";
import { DEFAULT_ACHIEVEMENTS, type AchievementDef } from "@/game/achievements";
import { defaultPlayerState } from "@/game/defaults";
import type { PlayerState } from "@/types/game";

/* 6.14.108 (AU27, lot AP-L4, constat AP-5, Q82 et Q89) : paliers de succès générés bridés. */

const DAY = 86_400_000;
const T0 = Date.UTC(2026, 10, 3, 4, 29);

afterEach(() => applyGameContent({}));

function players(n: number, now: number, victories = 1_000_000_000): PlayerState[] {
  return Array.from({ length: n }, (_, i) => {
    const p = defaultPlayerState(`u${i}`, `Joueur${i}`);
    p.lastActiveMs = now;
    p.victories = victories;
    return p;
  });
}

const generated = (defs: AchievementDef[], metric: string) => defs.filter((a) => a.metric === metric && /_auto\d+$/.test(a.id));
const defaults = () => structuredClone(DEFAULT_ACHIEVEMENTS);

describe("6.14.108 : succès procéduraux bridés (AP-L4)", () => {
  it("1 détenteur → aucun palier ; 3 détenteurs → un palier ; 10 % des actifs si c'est plus exigeant", () => {
    const victories = (out: ReturnType<typeof proposeAchievementTiers>) => out.find((o) => o.def.metric === "victories");
    expect(victories(proposeAchievementTiers(defaults(), players(1, T0), T0))).toBeUndefined();
    expect(victories(proposeAchievementTiers(defaults(), players(2, T0), T0))).toBeUndefined();
    const ok = victories(proposeAchievementTiers(defaults(), players(3, T0), T0));
    expect(ok?.def.threshold).toBe(1500);
    expect(ok?.def.createdAtMs).toBe(T0);
    // 40 actifs : 10 % = 4 détenteurs demandés.
    expect(achievementHoldersNeeded(40)).toBe(4);
    const crowd = [...players(3, T0), ...players(37, T0, 0)];
    expect(victories(proposeAchievementTiers(defaults(), crowd, T0))).toBeUndefined();
    const crowd4 = [...players(4, T0), ...players(36, T0, 0)];
    expect(victories(proposeAchievementTiers(defaults(), crowd4, T0))?.holders).toBe(4);
    // Les inactifs ne comptent pas.
    const idle = players(3, T0 - 20 * DAY);
    expect(victories(proposeAchievementTiers(defaults(), idle, T0))).toBeUndefined();
  });

  it("30 jours de passages quotidiens : au plus 1 palier par mesure ; le suivant au 30e jour", () => {
    const defs = defaults();
    const ps = players(5, T0);
    for (let d = 0; d < 30; d++) {
      const now = T0 + d * DAY;
      ps.forEach((p) => (p.lastActiveMs = now));
      defs.push(...proposeAchievementTiers(defs, ps, now).map((o) => o.def));
    }
    const metrics = new Set(defs.filter((a) => /_auto\d+$/.test(a.id)).map((a) => a.metric));
    expect(metrics.has("victories")).toBe(true);
    for (const m of metrics) expect(generated(defs, m)).toHaveLength(1);
    const day30 = T0 + 30 * DAY;
    ps.forEach((p) => (p.lastActiveMs = day30));
    expect(proposeAchievementTiers(defs, ps, day30).some((o) => o.def.metric === "victories")).toBe(true);
  });

  it("3 paliers générés au plus par mesure, titre au dernier seulement ; rien n'est retiré au-delà", () => {
    const defs = defaults();
    const ps = players(5, T0);
    for (let month = 0; month < 8; month++) {
      const now = T0 + month * 31 * DAY;
      ps.forEach((p) => (p.lastActiveMs = now));
      defs.push(...proposeAchievementTiers(defs, ps, now).map((o) => o.def));
    }
    const wins = generated(defs, "victories").sort((a, b) => a.threshold - b.threshold);
    expect(wins).toHaveLength(3);
    expect(wins.map((a) => a.tier)).toEqual(["legendaire", "legendaire", "legendaire"]);
    expect(wins.map((a) => a.title !== "")).toEqual([false, false, true]);
    // Une famille déjà au-delà du plafond (paliers créés avant 6.14.108) garde tout, sans nouveau palier.
    const legacy = [...defs, { ...wins[2], id: "eternal_conqueror_auto9", threshold: wins[2].threshold * 2, createdAtMs: T0 - 400 * DAY }];
    const later = T0 + 400 * DAY;
    ps.forEach((p) => (p.lastActiveMs = later));
    expect(proposeAchievementTiers(legacy, ps, later).some((o) => o.def.metric === "victories")).toBe(false);
    expect(validateGameContent({ ...defaultGameContent(), achievements: defs })).toEqual([]);
  });

  it("un palier généré sans date (avant 6.14.108) bloque sa mesure jusqu'à être daté, sans être retiré", () => {
    const old: AchievementDef = { ...DEFAULT_ACHIEVEMENTS.find((a) => a.id === "eternal_conqueror")!, id: "eternal_conqueror_auto1", threshold: 1500, auto: true };
    const defs = [...defaults(), old];
    expect(proposeAchievementTiers(defs, players(5, T0), T0).some((o) => o.def.metric === "victories")).toBe(false);
    const stamped = stampGeneratedTiers(defs, T0);
    expect(stamped.changed).toBe(true);
    expect(stamped.list).toHaveLength(defs.length);
    expect(stamped.list.find((a) => a.id === old.id)?.createdAtMs).toBe(T0);
    // Les autres succès (par défaut, dérivés marqués auto) ne sont pas touchés.
    expect(stamped.list.filter((a) => a.id !== old.id)).toEqual(defs.filter((a) => a.id !== old.id));
    expect(stampGeneratedTiers(stamped.list, T0 + DAY).changed).toBe(false);
    // 30 jours après la date : la mesure repart.
    const later = T0 + 30 * DAY;
    expect(proposeAchievementTiers(stamped.list, players(5, later), later).find((o) => o.def.metric === "victories")?.def.id).toBe("eternal_conqueror_auto2");
  });

  it("réglages dans l'admin (achievementGen) : à 0, ancien comportement ; le texte suit la règle", () => {
    expect(achievementGenText()).toBe("Ajoute le palier suivant quand 3 joueur(s) actif(s) (et au moins 10 % des actifs) ont atteint le dernier ; un palier par mesure tous les 30 jours au plus, 3 par mesure au plus, titre au dernier seulement.");
    const d = defaultGameContent();
    expect(d.rules.achievementGen).toEqual(ACHIEVEMENT_GEN_RULES);
    applyGameContent({ rules: { ...d.rules, achievementGen: { minHolders: 1, minHoldersShare: 0, cooldownDays: 0, maxAutoPerFamily: 0, titleOnLastOnly: false } } });
    expect(ACHIEVEMENT_GEN_RULES.growth).toBe(2);
    const defs = defaults();
    const one = players(1, T0);
    const first = proposeAchievementTiers(defs, one, T0).find((o) => o.def.metric === "victories")!;
    expect(first.def.title).not.toBe("");
    defs.push(first.def);
    expect(proposeAchievementTiers(defs, one, T0 + DAY).find((o) => o.def.metric === "victories")?.def.id).toBe("eternal_conqueror_auto2");
    expect(achievementGenText()).toBe("Ajoute le palier suivant quand 1 joueur(s) actif(s) ont atteint le dernier ; sans délai entre deux paliers, titre à chaque palier légendaire.");
    // Bornes : refusées à l'enregistrement.
    expect(validateGameContent({ ...d, rules: { ...d.rules, achievementGen: { ...d.rules.achievementGen, minHolders: 0 } } }).join(" ")).toMatch(/Détenteurs minimum/);
  });
});
