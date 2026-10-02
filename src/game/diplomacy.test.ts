import { describe, expect, it } from "vitest";
import { answerPact, bindingPactBetween, breakPact, DIPLOMACY_RULES, pactBinds, pactStatusAt, proposePact } from "@/game/diplomacy";

const NOW = 1_800_000_000_000;
const H = 3_600_000;
const al = (id: string, leader: string, officer?: string) => ({ id, tag: id.toUpperCase(), name: `Alliance ${id}`, createdBy: leader, members: [leader, ...(officer ? [officer] : []), `${id}-m`], roles: officer ? { [officer]: "officer" as const } : {} });

describe("diplomacy", () => {
  const A = al("a", "a1", "a2");
  const B = al("b", "b1");

  it("lets leaders propose, accept, then break with notice", () => {
    const p = proposePact({ actorUid: "a2", actorPseudo: "Off", own: A, target: B, pacts: [], atWar: false, now: NOW });
    expect(p).toMatchObject({ status: "proposed", allianceA: "a", allianceB: "b" });
    expect(() => answerPact(p, A, "a1", "accept", NOW)).toThrow("invitée");
    expect(() => answerPact(p, B, "b-m", "accept", NOW)).toThrow("officiers");
    const active = answerPact(p, B, "b1", "accept", NOW);
    expect(pactBinds(active, NOW)).toBe(true);
    const ending = breakPact(active, A, "a1", NOW + H);
    expect(ending).toMatchObject({ status: "ending", endsAtMs: NOW + H + DIPLOMACY_RULES.breakNoticeHours * H, brokenByTag: "A" });
    expect(pactBinds(ending, NOW + 2 * H)).toBe(true);
    expect(pactStatusAt(ending, ending.endsAtMs)).toBe("ended");
    expect(pactBinds(ending, ending.endsAtMs)).toBe(false);
  });

  it("refuses members, duplicates, wars and too many pacts", () => {
    expect(() => proposePact({ actorUid: "a-m", actorPseudo: "M", own: A, target: B, pacts: [], atWar: false, now: NOW })).toThrow("officiers");
    expect(() => proposePact({ actorUid: "a1", actorPseudo: "L", own: A, target: B, pacts: [], atWar: true, now: NOW })).toThrow("guerre");
    const open = proposePact({ actorUid: "a1", actorPseudo: "L", own: A, target: B, pacts: [], atWar: false, now: NOW });
    expect(() => proposePact({ actorUid: "b1", actorPseudo: "L", own: B, target: A, pacts: [open], atWar: false, now: NOW })).toThrow("déjà en cours");
    const many = ["c", "d", "e"].map((id) => ({ ...open, allianceB: id }));
    expect(() => proposePact({ actorUid: "a1", actorPseudo: "L", own: A, target: al("f", "f1"), pacts: many, atWar: false, now: NOW })).toThrow(`${DIPLOMACY_RULES.maxPacts} pactes`);
  });

  it("finds the binding pact between two alliances", () => {
    const p = { allianceA: "a", allianceB: "b", status: "active" as const, endsAtMs: 0 };
    expect(bindingPactBetween([p], "b", "a", NOW)).toBe(p);
    expect(bindingPactBetween([{ ...p, status: "proposed" as const }], "a", "b", NOW)).toBeNull();
    expect(bindingPactBetween([p], "a", "a", NOW)).toBeNull();
  });
});
