import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { generatePassSeason, outdatedPassDrafts, type PassSeason } from "@/game/passSeasons";
import { generateChapter, GENERATOR_VERSION, normalizeProcedural, outdatedChapters, worldDigest } from "@/game/procedural";
import { episodeUnlockMs, type ChronicleMonth } from "@/game/chronicles";

/* 6.14.57 (AU27, AP-3) : version du générateur dans le contenu généré ; un brouillon ou un chapitre non commencé écrit par
   un générateur plus ancien est régénéré, jamais un passe publié, un mois commencé, un chapitre écrit ou retouché. */

const OCT_7 = Date.UTC(2026, 9, 7, 12);
const digest = worldDigest([], OCT_7);
const pass = (id: string, patch: Partial<PassSeason> = {}, auto: Partial<NonNullable<PassSeason["auto"]>> = {}): PassSeason => {
  const s = generatePassSeason({ monthId: id, digest, existing: [], now: OCT_7 });
  return { ...s, ...patch, auto: { ...s.auto!, ...auto } };
};
const chapter = (id: string, auto: Partial<NonNullable<ChronicleMonth["auto"]>> | null = {}): ChronicleMonth => {
  const m = generateChapter({ monthId: id, digest, existing: [], now: OCT_7 });
  if (auto === null) {
    const { auto: _drop, ...rest } = m;
    void _drop;
    return rest;
  }
  return { ...m, auto: { ...m.auto!, ...auto } };
};

describe("générateur versionné", () => {
  it("passe et chapitre générés portent la version du générateur (et la variante du chapitre)", () => {
    expect(pass("2026-11").auto?.generator).toBe(GENERATOR_VERSION.pass);
    const m = generateChapter({ monthId: "2026-12", digest, existing: [], now: OCT_7, variant: 2 });
    expect(m.auto?.generator).toBe(GENERATOR_VERSION.chapter);
    expect(m.auto?.variant).toBe(2);
  });

  it("brouillons à régénérer : générés par une version plus ancienne, mois en cours ou à venir, jamais retouchés ni publiés", () => {
    const old = pass("2026-11", { challengeMode: undefined }, { generator: undefined });
    const cfg = {
      seasons: [
        old,
        pass("2026-12", {}, { generator: GENERATOR_VERSION.pass - 1, editedAtMs: OCT_7 }),
        pass("2027-01", { status: "published" }, { generator: undefined }),
        pass("2027-02"),
        pass("2026-10", {}, { generator: undefined }),
        { ...pass("2027-03"), auto: undefined },
      ],
    };
    expect(outdatedPassDrafts(cfg, "2026-10").map((s) => s.id)).toEqual(["2026-11"]);
    // Le mois en cours : un brouillon n'est jamais lu par les joueurs, il peut être régénéré avant sa publication d'office.
    expect(outdatedPassDrafts(cfg, "2026-11").map((s) => s.id)).toEqual(["2026-11"]);
    expect(outdatedPassDrafts(cfg, "2026-12")).toEqual([]);
  });

  it("chapitres à régénérer : générés par une version plus ancienne et pas commencés ; jamais écrits, repris ni retouchés", () => {
    const months = [
      chapter("2026-11", { generator: undefined }),
      chapter("2026-12", { generator: GENERATOR_VERSION.chapter - 1, editedAtMs: OCT_7 }),
      chapter("2027-01", null),
      chapter("2027-02"),
      chapter("2026-10", { generator: undefined }),
    ];
    expect(outdatedChapters(months, OCT_7).map((m) => m.id)).toEqual(["2026-11"]);
    // Commencé (premier épisode ouvert) : jamais.
    expect(outdatedChapters(months, episodeUnlockMs("2026-11", 0))).toEqual([]);
  });

  it("réglage admin : régénération active par défaut, coupable", () => {
    expect(normalizeProcedural(null).regenerateOutdated).toBe(true);
    expect(normalizeProcedural({ regenerateOutdated: false }).regenerateOutdated).toBe(false);
  });

  it("serveur : régénère avant la publication d'office, garde l'ancien état et le reste de la configuration", () => {
    const src = readFileSync("pocketbase/pb_hooks/cosmic_db.js", "utf8");
    const tick = src.slice(src.indexOf("function passSeasonsTick("), src.indexOf("function keepContentVersion("));
    expect(tick.indexOf("outdatedPassDrafts")).toBeGreaterThan(0);
    expect(tick.indexOf("outdatedPassDrafts")).toBeLessThan(tick.indexOf("publishPassSeason"));
    const regen = src.slice(src.indexOf("function regenerateOutdatedChapters("), src.indexOf("function passSeasonsRun("));
    expect(regen).toContain("Object.assign({}, content.chronicles, { months })");
    expect(regen).toContain('keepContentVersion(txApp, "chronicles"');
    expect(regen).toContain("settings.regenerateOutdated");
  });
});
