import { describe, expect, it } from "vitest";
import { compileGazette, gazetteSince, gazetteSnapshots, gazetteState, gazetteTrend, publishGazette, type GazetteInput } from "@/game/gazette";

const H = 3600_000;
const now = Date.UTC(2026, 9, 19, 7);

function base(over: Partial<GazetteInput> = {}): GazetteInput {
  return {
    now,
    sinceMs: now - 7 * 24 * H,
    players: [
      { uid: "a", pseudo: "Alpha", xp: 5000, ascensions: 2, lastActiveMs: now - H },
      { uid: "b", pseudo: "Bravo", xp: 9000, ascensions: 0, lastActiveMs: now - 30 * 24 * H },
    ],
    xpSnapshot: { a: 1000, b: 8500 },
    bosses: [],
    vendettas: [],
    wars: [],
    raids: [],
    warlords: [{ name: "Brannoc", power: 2e6 }, { name: "Zhar'Kesh", power: 9e6 }],
    ...over,
  };
}

describe("gazette 5.15.15", () => {
  it("couvre la période depuis le numéro précédent (pas de chevauchement)", () => {
    const st = gazetteState(null);
    expect(gazetteSince(st, now)).toBe(now - 7 * 24 * H);
    const recent = { ...st, issues: [{ ...compileGazette(base(), 1), weekId: "2026-10-12", toMs: now - 2 * 24 * H }] };
    expect(gazetteSince(recent, now)).toBe(now - 2 * 24 * H);
    // Même semaine : le numéro est remplacé, la période repart du numéro d'avant.
    const sameWeek = { ...st, issues: [{ ...compileGazette(base(), 2), toMs: now - H }, { ...compileGazette(base(), 1), weekId: "2026-10-05", toMs: now - 6 * 24 * H }] };
    expect(gazetteSince(sameWeek, now)).toBe(now - 6 * 24 * H);
    const old = { ...st, issues: [{ ...compileGazette(base(), 1), weekId: "2026-09-28", toMs: now - 20 * 24 * H }] };
    expect(gazetteSince(old, now)).toBe(now - 7 * 24 * H);
  });

  it("le seigneur qui monte remplace le plus fort quand un instantané existe", () => {
    const first = compileGazette(base(), 1);
    expect(JSON.stringify(first.sections)).toContain("Zhar'Kesh aligne 9 M");
    const second = compileGazette(base({ powerSnapshot: { Brannoc: 1e6, "Zhar'Kesh": 9e6 } }), 2);
    const w = second.sections.find((s) => s.kind === "warlord")!;
    expect(w.title).toBe("Le seigneur qui monte");
    expect(w.lines[0]).toContain("Brannoc gagne 1 M");
  });

  it("écarte une rubrique identique au numéro précédent et change de manchette", () => {
    const raids = [{ attackerPseudo: "Alpha", defenderPseudo: "Bravo", loot: 50_000, timestamp: now - H }];
    const first = compileGazette(base({ raids }), 1);
    const second = compileGazette(base({ raids, previous: first }), 2);
    expect(second.sections.some((s) => s.kind === "raid")).toBe(false);
    expect(second.headline).not.toBe(first.headline);
  });

  it("nouvelles rubriques : ascensions, rempart, marché, entraide, alliances, agenda, chiffres", () => {
    const issue = compileGazette(
      base({
        ascSnapshot: { a: 1, b: 0 },
        defenses: [
          { defenderPseudo: "Bravo", attackerPseudo: "X", timestamp: now - H },
          { defenderPseudo: "Bravo", attackerPseudo: "Y", timestamp: now - 2 * H },
        ],
        trades: [{ sellerPseudo: "Alpha", buyerPseudo: "Bravo", amount: 30_000, filledAtMs: now - H }],
        gifts: [{ fromPseudo: "Bravo", toPseudo: "Alpha", amount: 1000, timestamp: now - H }],
        alliances: [{ name: "Orion", tag: "ORN", createdAtMs: now - H }],
        battles: 7,
      }),
      4,
    );
    const kinds = issue.sections.map((s) => s.kind);
    for (const k of ["ascension", "defense", "market", "solidarity", "alliance", "agenda"]) expect(kinds).toContain(k);
    expect(JSON.stringify(issue.sections)).toContain("Alpha franchit l'Ascension II");
    expect(JSON.stringify(issue.sections)).toContain("Bravo a repoussé 2 attaques");
    expect(issue.stats).toMatchObject({ battles: 7, defenses: 2, trades: 1, tradeVolume: 30_000, gifts: 1, activePlayers: 1 });
  });

  it("instantanés d'ascension et de puissance, et écart des chiffres", () => {
    const st = publishGazette(gazetteState(null), compileGazette(base(), 1), [{ uid: "a", xp: 5000, ascensions: 2 }], [{ name: "Brannoc", power: 2e6 }]);
    expect(st.ascSnapshot).toEqual({ a: 2 });
    expect(st.powerSnapshot).toEqual({ Brannoc: 2e6 });
    expect(gazetteTrend(12, 10)).toEqual({ dir: "up", text: "+2" });
    expect(gazetteTrend(5, undefined)).toBeNull();
  });

  it("remplacer le numéro de la semaine garde les instantanés d'avant", () => {
    let st = publishGazette(gazetteState(null), { ...compileGazette(base(), 1), weekId: "2026-10-12" }, [{ uid: "a", xp: 1000 }]);
    st = publishGazette(st, compileGazette(base(), 2), [{ uid: "a", xp: 3000 }]);
    const nextWeek = now + 7 * 24 * H;
    // Republier cette semaine : on compare à l'instantané d'avant ce numéro ; la semaine suivante, au dernier.
    expect(gazetteSnapshots(st, now).xp).toEqual({ a: 1000 });
    expect(gazetteSnapshots(st, nextWeek).xp).toEqual({ a: 3000 });
    const st2 = publishGazette(st, compileGazette(base(), 2), [{ uid: "a", xp: 4000 }]);
    expect(gazetteSnapshots(st2, now).xp).toEqual({ a: 1000 });
    expect(gazetteSnapshots(st2, nextWeek).xp).toEqual({ a: 4000 });
  });
});
