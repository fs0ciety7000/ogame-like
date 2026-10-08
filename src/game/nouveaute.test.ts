import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent, currentGameContent, defaultGameContent, validateGameContent } from "@/game/content";
import { applyLibraryChapter, chronicleState, type ChronicleMonth } from "@/game/chronicles";
import { defaultPlayerState } from "@/game/defaults";
import { chooseNovelty, contentAddedOn, hasContentAccess, NOVELTY_RULES, recentContent } from "@/game/novelty";
import { generateChapter, worldDigest, type WorldDigest } from "@/game/procedural";
import { contentObjective, trackAction } from "@/game/trackedActions";
import type { PlayerState } from "@/types/game";

/* 6.14.122 (AU27, lot AP-L8, constat AP-10) : épisode « nouveauté » des Chroniques générées. */

const OCT_20 = Date.UTC(2026, 9, 20, 12);
const DAY = 86_400_000;
const UNIT = "recolteur";
const KEY = contentObjective("unit", UNIT);

const digest = (access?: Record<string, number>, activePlayers = 12): WorldDigest => ({
  monthId: "2026-10",
  observedDays: 20,
  activePlayers,
  weeklyMedian: { victory: 3, contract: 4, spy: 3, market: 3, bounty: 2, mission: 6, raidRepelled: 1, warlordWin: 0.5, bossAssault: 0.6 },
  totals: {},
  heroes: {},
  episodes: [0, 1, 2].map((i) => ({ type: "victory" as const, count: 3, completion: 0.5, open: true, daysOpen: 10 + i })),
  passMedianTier: 18,
  passTiers: 30,
  passFinishedShare: 0.3,
  chapterShare: 0.4,
  ...(access ? { access } : {}),
});

/** Contenu par défaut, avec une date d'ajout sur une unité (et d'autres réglages). */
function dated(addedOn: string, patch: Record<string, unknown> = {}) {
  const d = defaultGameContent();
  applyGameContent({ units: d.units.map((u) => (u.id === UNIT ? { ...u, addedOn } : u)), ...patch } as never);
}
const gen = (monthId: string, d: WorldDigest, existing: ChronicleMonth[] = [], variant = 0) => generateChapter({ monthId, digest: d, existing, now: OCT_20, variant });
const strip = (m: ChronicleMonth) => m.episodes.map((e, i) => (i === 1 ? null : e));

afterEach(() => applyGameContent({}));

describe("6.14.122 : choix du contenu nouveau", () => {
  it("aucun contenu daté (règles et contenu par défaut) : pas d'épisode « nouveauté », chapitre inchangé", () => {
    expect(recentContent("2026-12")).toEqual([]);
    const m = gen("2026-12", digest({ [KEY]: 1 }));
    expect(m.auto?.novelty).toBeUndefined();
    expect(m.episodes.map((e) => e.objective.type)).toEqual(["raidRepelled", "warlordWin", "bounty", "market"]);
  });

  it("une unité ajoutée le mois d'avant prend l'épisode 2 du chapitre suivant ; le reste du chapitre ne change pas", () => {
    const before = gen("2026-12", digest({ [KEY]: 0.8 }));
    dated("2026-11-20");
    expect(contentAddedOn(KEY)).toBe("2026-11-20");
    expect(recentContent("2026-12").map((c) => c.key)).toEqual([KEY]);
    const m = gen("2026-12", digest({ [KEY]: 0.8 }));
    expect(m.episodes[1].objective).toEqual({ type: KEY, count: NOVELTY_RULES.counts.unit });
    expect(m.auto?.novelty).toEqual({ key: KEY, addedOn: "2026-11-20", episode: 2 });
    expect(NOVELTY_RULES.texts.titles).toContain(m.episodes[1].title);
    expect(m.episodes[1].lines.some((l) => l.text.includes("Récolteur"))).toBe(true);
    expect(m.episodes[1].reward).toEqual(before.episodes[1].reward);
    // Graine propre : les autres épisodes, le titre, le boss et les récompenses sont ceux d'avant.
    expect(strip(m)).toEqual(strip(before));
    expect([m.title, m.boss.name, m.completion]).toEqual([before.title, before.boss.name, before.completion]);
    expect(m.auto?.reasons.some((r) => /Nouveauté : Récolteur/.test(r))).toBe(true);
    // Graine stable : même mois, même variante, même chapitre.
    expect(gen("2026-12", digest({ [KEY]: 0.8 }))).toEqual({ ...m, auto: { ...m.auto, generatedAtMs: OCT_20 } });
  });

  it("fenêtre de « nouveauté » : ni trop ancien, ni ajouté après le 1er du mois ; durée réglable", () => {
    dated("2026-09-01");
    expect(recentContent("2026-12")).toEqual([]);
    dated("2026-12-02");
    expect(recentContent("2026-12")).toEqual([]);
    dated("2026-09-01", { rules: { ...defaultGameContent().rules, novelty: { ...NOVELTY_RULES, noveltyDays: 120 } } });
    expect(recentContent("2026-12").map((c) => c.key)).toEqual([KEY]);
  });

  it("trop peu de joueurs y ont accès, ou aucun joueur actif : pas d'épisode, raison notée", () => {
    dated("2026-11-20");
    const low = gen("2026-12", digest({ [KEY]: 0.2 }));
    expect(low.auto?.novelty).toBeUndefined();
    expect(low.auto?.reasons.join(" ")).toMatch(/trop peu accessible/);
    expect(chooseNovelty("2026-12", [], { [KEY]: 1 }, 0).pick).toBeNull();
  });

  it("un contenu n'est mis en avant qu'une fois ; fréquence réglable ; désactivable", () => {
    dated("2026-11-20", { rules: { ...defaultGameContent().rules, novelty: { ...NOVELTY_RULES, noveltyDays: 90 } } });
    const dec = gen("2026-12", digest({ [KEY]: 1 }));
    expect(dec.auto?.novelty?.key).toBe(KEY);
    expect(gen("2027-01", digest({ [KEY]: 1 }), [dec]).auto?.novelty).toBeUndefined();
    expect(chooseNovelty("2027-01", [{ id: "2026-12", auto: { novelty: { key: "unit:autre", addedOn: "2026-11-01", episode: 2 } } }], { [KEY]: 1 }, 10).pick?.key).toBe(KEY);
    applyGameContent({ ...currentGameContent(), rules: { ...currentGameContent().rules, novelty: { ...NOVELTY_RULES, noveltyDays: 90, everyMonths: 2 } } });
    expect(chooseNovelty("2027-01", [{ id: "2026-12", auto: { novelty: { key: "unit:autre", addedOn: "2026-11-01", episode: 2 } } }], { [KEY]: 1 }, 10).reason).toMatch(/tous les 2 mois/);
    applyGameContent({ ...currentGameContent(), rules: { ...currentGameContent().rules, novelty: { ...NOVELTY_RULES, enabled: false } } });
    expect(gen("2026-12", digest({ [KEY]: 1 })).auto?.novelty).toBeUndefined();
  });

  it("épisode, quantités et textes lus dans la règle (bibliothèque réglable)", () => {
    dated("2026-11-20", {
      rules: { ...defaultGameContent().rules, novelty: { ...NOVELTY_RULES, episode: 3, counts: { unit: 12, research: 1, building: 1 }, texts: { ...NOVELTY_RULES.texts, titles: ["Le Plan neuf"], orders: { ...NOVELTY_RULES.texts.orders, unit: ["Lance {count} {name}, vite."] } } } },
    });
    const m = gen("2026-12", digest({ [KEY]: 1 }));
    expect(m.episodes[2].objective).toEqual({ type: KEY, count: 12 });
    expect(m.episodes[2].title).toBe("Le Plan neuf");
    expect(m.episodes[2].lines.at(-1)?.text).toBe("Lance 12 Récolteur, vite.");
  });
});

describe("6.14.122 : mois écrits, bibliothèque, comptage, réglages", () => {
  it("mois déjà écrit inchangé ; un chapitre de la bibliothèque ne reçoit pas d'épisode « nouveauté »", () => {
    const written = gen("2026-12", digest({ [KEY]: 1 }));
    const snapshot = JSON.stringify(written);
    dated("2026-11-20");
    // Le contenu daté ne réécrit pas le mois déjà écrit (I17) : seul un nouveau tirage le voit.
    expect(JSON.stringify(written)).toBe(snapshot);
    const lib = { ...structuredClone(written), id: "lib-hiver" };
    delete lib.auto;
    const cfg = applyLibraryChapter({ months: [], library: [lib] }, "lib-hiver", "2027-01");
    expect(cfg.months[0].auto).toBeUndefined();
    expect(cfg.months[0].episodes.map((e) => e.objective.type)).not.toContain(KEY);
  });

  it("l'action par contenu fait avancer l'épisode ouvert ; photographie du monde : part des joueurs qui y ont accès", () => {
    dated("2026-10-01");
    const m = generateChapter({ monthId: "2026-10", digest: digest({ [KEY]: 1 }), existing: [], now: Date.UTC(2026, 8, 20) });
    expect(m.episodes[1].objective.type).toBe(KEY);
    applyGameContent({ ...currentGameContent(), chronicles: { ...currentGameContent().chronicles, months: [m] } });
    const p = defaultPlayerState("p", "P") as PlayerState;
    const now = Date.UTC(2026, 9, 10, 12);
    trackAction(p, KEY, now, 3);
    expect(chronicleState(p, now).progress[1]).toBe(3);
    const mk = (lvl: number) => ({ ...defaultPlayerState(`u${lvl}`, "X"), lastActiveMs: now, units: { [UNIT]: { level: lvl, count: 0 } } }) as unknown as PlayerState;
    expect(hasContentAccess(mk(1), KEY)).toBe(true);
    expect(hasContentAccess(mk(0), KEY)).toBe(false);
    expect(worldDigest([mk(1), mk(1), mk(0), mk(2)], now).access?.[KEY]).toBe(0.75);
  });

  it("validation : date d'ajout au format AAAA-MM-JJ, bibliothèque de textes non vide", () => {
    const d = defaultGameContent();
    expect(validateGameContent({ ...d, units: d.units.map((u) => (u.id === UNIT ? { ...u, addedOn: "20/11/2026" } : u)) }).join(" ")).toMatch(/Unité recolteur : date d'ajout au format AAAA-MM-JJ/);
    expect(validateGameContent({ ...d, units: d.units.map((u) => (u.id === UNIT ? { ...u, addedOn: "2026-11-20" } : u)) })).toEqual([]);
    const bad = validateGameContent({ ...d, rules: { ...d.rules, novelty: { ...NOVELTY_RULES, counts: { unit: 0 }, texts: { titles: [], hooks: ["x"], orders: { unit: ["sans nom"] } } } } } as never).join(" ");
    expect(bad).toMatch(/quantité de unit/);
    expect(bad).toMatch(/au moins un titre/);
    expect(bad).toMatch(/ordre « unit » avec \{name\}/);
  });

  it("garde : un contenu par défaut ajouté après la 6.14.122 porte sa date d'ajout (`addedOn`)", () => {
    const d = defaultGameContent();
    const undated = [...d.units, ...d.technologies, ...d.buildings].filter((x) => !(x as { addedOn?: string }).addedOn);
    // 67 contenus d'avant la 6.14.122 (24 unités, 30 technos, 13 bâtiments) : ce nombre ne monte plus.
    expect(undated.length, "nouveau contenu sans `addedOn` : ajoute sa date d'ajout (épisode « nouveauté »)").toBeLessThanOrEqual(67);
  });

  it("les réglages par défaut restent dans leurs bornes et la fusion garde les textes", () => {
    applyGameContent({ rules: { novelty: { noveltyDays: 30 } } } as never);
    expect(NOVELTY_RULES.noveltyDays).toBe(30);
    expect(NOVELTY_RULES.texts.orders.unit.length).toBeGreaterThan(0);
    expect(NOVELTY_RULES.episode).toBe(2);
  });

  it("date limite : 45 jours par défaut avant le 1er du mois", () => {
    dated(new Date(Date.UTC(2026, 11, 1) - 45 * DAY).toISOString().slice(0, 10));
    expect(recentContent("2026-12")).toHaveLength(1);
    dated(new Date(Date.UTC(2026, 11, 1) - 46 * DAY).toISOString().slice(0, 10));
    expect(recentContent("2026-12")).toHaveLength(0);
  });
});
