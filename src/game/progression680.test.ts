import { afterEach, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { addPassPoints, activePass, passDailyLogin, passState, PASS_RULES, setMonthPasses } from "@/game/seasonPass";
import { chroniclesConfig, defaultChroniclesConfig, GENERATED_CHAPTERS_FROM, moveWrittenToLibrary, applyLibraryChapter } from "@/game/chronicles";
import { groupedTitles, titleFamily } from "@/game/titles";
import { defaultPlayerState } from "@/game/defaults";
import { balanceHealth } from "@/game/balance/health";

/* 6.8.0 (AU3, generation-passe-chroniques.md) : points de passe par source, un seul passe par mois,
   chapitres écrits en bibliothèque (novembre → mars générés), titres groupés, santé du passe. */

afterEach(() => applyGameContent({}));

const NOW = Date.UTC(2026, 9, 10, 12);

describe("6.8.0 : passe", () => {
  it("trace les points réellement gagnés par source et l'instant de fin", () => {
    const p = defaultPlayerState("p", "Pilote");
    passDailyLogin(p, NOW);
    addPassPoints(p, "bounty", NOW, 2);
    let st = passState(p, NOW);
    expect(st.bySource).toEqual({ dailyLogin: 5, bounty: 16 });
    expect(st.finishedAtMs).toBeUndefined();
    p.seasonPass = { ...st, points: 30 * PASS_RULES.pointsPerTier - 3 };
    addPassPoints(p, "victory", NOW + 1000);
    st = passState(p, NOW + 1000);
    expect(st.bySource?.victory).toBe(3); // plafonné : seuls 3 points comptent
    expect(st.finishedAtMs).toBe(NOW + 1000);
  });

  it("un seul passe par mois : dès novembre 2026, le passe du chapitre n'est plus lu", () => {
    const pass = { pointsPerTier: 77, tiers: [[{ kind: "amber" as const, amount: 5 }]] };
    setMonthPasses([{ id: "2026-10", pass }, { id: "2026-12", pass }]);
    expect(activePass("2026-10").pointsPerTier).toBe(77);
    expect(activePass("2026-12").pointsPerTier).toBe(PASS_RULES.pointsPerTier);
    setMonthPasses([]);
  });
});

describe("6.8.0 : Chroniques — bibliothèque des chapitres écrits", () => {
  it("par défaut : octobre en jeu, novembre → mars en bibliothèque", () => {
    const cfg = defaultChroniclesConfig();
    expect(cfg.months.map((m) => m.id)).toEqual(["2026-10"]);
    expect(cfg.library?.map((m) => m.id)).toEqual(["2026-11", "2026-12", "2027-01", "2027-02", "2027-03"]);
    expect(GENERATED_CHAPTERS_FROM).toBe("2026-11");
  });

  it("migration : les chapitres écrits pas encore commencés passent en bibliothèque ; un chapitre généré reste", () => {
    const written = [...defaultChroniclesConfig().months, ...(defaultChroniclesConfig().library ?? [])];
    const generated = { ...written[1], id: "2027-04", auto: { generatedAtMs: 1, sourceMonth: "2027-03", archetype: "x", difficulty: 1, activePlayers: 1, reasons: [] } };
    const out = moveWrittenToLibrary({ months: [...written, generated] }, NOW)!;
    expect(out.months!.map((m) => m.id)).toEqual(["2026-10", "2027-04"]);
    expect(out.library!.map((m) => m.id)).toEqual(["2026-11", "2026-12", "2027-01", "2027-02", "2027-03"]);
    expect(moveWrittenToLibrary(out, NOW)).toBeNull();
    // En novembre, le chapitre de novembre (déjà commencé) n'est plus déplacé.
    const inNov = moveWrittenToLibrary({ months: written }, Date.UTC(2026, 10, 3))!;
    expect(inNov.months!.map((m) => m.id)).toEqual(["2026-10", "2026-11"]);
  });

  it("reprendre un chapitre de la bibliothèque pour un mois", () => {
    const cfg = applyLibraryChapter(chroniclesConfig(), "2026-12", "2027-05");
    const m = cfg.months.find((x) => x.id === "2027-05")!;
    expect(m.title).toBe("Le Silence d'hiver");
    expect(m.auto).toBeUndefined();
    expect(() => applyLibraryChapter(chroniclesConfig(), "1999-01", "2027-05")).toThrow(/absent/);
  });
});

describe("6.8.0 : titres groupés", () => {
  it("garde le plus haut palier de chaque famille, et le titre affiché", () => {
    expect(titleFamily("Magnat IV")).toEqual({ family: "Magnat", rank: 4 });
    expect(titleFamily("Marchand des étoiles")).toEqual({ family: "Marchand des étoiles", rank: 0 });
    const titles = ["Magnat II", "Magnat IV", "Magnat III", "Bastion III", "Bastion IV", "Marchand des étoiles", "Sans repos IX", "Sans repos X"].map((label) => ({ label }));
    const { shown, hidden } = groupedTitles(titles, "Bastion III");
    expect(shown.map((t) => t.label)).toEqual(["Magnat IV", "Bastion III", "Bastion IV", "Marchand des étoiles", "Sans repos X"]);
    expect(hidden.map((t) => t.label)).toEqual(["Magnat II", "Magnat III", "Sans repos IX"]);
  });
});

describe("6.8.0 : santé du passe et des succès", () => {
  it("part des joueurs au dernier palier, jour de fin, points par source", () => {
    const a = defaultPlayerState("a", "A");
    const b = defaultPlayerState("b", "B");
    addPassPoints(a, "bounty", NOW);
    a.seasonPass = { ...passState(a, NOW), points: 30 * PASS_RULES.pointsPerTier - 1 };
    addPassPoints(a, "victory", NOW);
    passDailyLogin(b, NOW);
    const h = balanceHealth({ players: [a, b], reports: [], fleets: [], builds: {}, alliances: [] }, NOW);
    expect(h.pass.finishedPct).toBe(50);
    expect(h.pass.medianFinishDay).toBe(10);
    expect(h.pass.bySource.map((r) => r.source)).toEqual(["bounty", "dailyLogin", "victory"]);
    expect(h.achievements.total).toBeGreaterThan(0);
  });
});
