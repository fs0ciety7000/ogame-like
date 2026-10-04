import { describe, expect, it } from "vitest";
import { alliancePerms, applyToAlliance, assertCanJoin, assignRank, hasAlliancePerm, normalizeAllianceProfile, saveRank, setAllianceProfile } from "@/game/allianceProfile";
import { performAllianceAction } from "@/game/alliances";
import { allianceChallengeReward, challengeOfWeek, refreshAllianceChallenge, startAllianceChallengeWeek } from "@/game/allianceChallenge";
import { defaultPlayerState } from "@/game/defaults";
import type { Alliance, PlayerState } from "@/types/game";

const NOW = Date.UTC(2026, 9, 7, 12);
const base = (): Alliance => ({ id: "al1", name: "Les Testeurs", tag: "TST", createdBy: "f", members: ["f", "o", "m"], memberPseudos: { f: "F", o: "O", m: "M" }, roles: { o: "officer" } });
const player = (uid: string, patch: Partial<PlayerState> = {}): PlayerState => ({ ...(defaultPlayerState(uid, uid) as unknown as PlayerState), uid, pseudo: uid.toUpperCase(), ...patch });

describe("rangs personnalisés et fiche d'alliance (v5.10.5)", () => {
  it("droits : rôles historiques + rang personnalisé", () => {
    let a = base();
    expect([...alliancePerms(a, "f")]).toHaveLength(7);
    expect(hasAlliancePerm(a, "o", "treasury")).toBe(true);
    expect(hasAlliancePerm(a, "o", "kick")).toBe(false);
    expect(hasAlliancePerm(a, "m", "treasury")).toBe(false);
    a = saveRank(a, "f", { name: "Trésorier", color: "#ffd86b", perms: ["treasury", "kick"] });
    const rankId = normalizeAllianceProfile(a.profile).ranks[0].id;
    a = assignRank(a, "f", "m", rankId);
    expect(hasAlliancePerm(a, "m", "treasury")).toBe(true);
    expect(hasAlliancePerm(a, "m", "kick")).toBe(true);
    expect(() => saveRank(a, "o", { name: "X" })).toThrow(/fondateur/);
    expect(() => assignRank(a, "f", "f", rankId)).toThrow();
  });

  it("recrutement : rejoindre, postuler, accepter", () => {
    let a = setAllianceProfile(base(), "o", { recruiting: "apply", description: "On recrute !" });
    expect(() => assertCanJoin(a)).toThrow(/candidature/);
    expect(() => setAllianceProfile(a, "m", { recruiting: "open" })).toThrow(/Recrutement/);
    a = applyToAlliance(a, { uid: "x", pseudo: "X", allianceId: "" }, "Salut", NOW);
    expect(() => applyToAlliance(a, { uid: "x", pseudo: "X" }, "", NOW)).toThrow(/attente/);
    const out = performAllianceAction({ action: { type: "applicationAccept", targetUid: "x" }, now: NOW, actor: player("o"), alliance: a, target: player("x") });
    expect(out.alliance?.members).toContain("x");
    expect(normalizeAllianceProfile(out.alliance?.profile).applications).toHaveLength(0);
    expect(out.memberships.x?.allianceId).toBe("al1");
  });
});

describe("défi d'alliance de la semaine (v5.10.5)", () => {
  it("score = progression cumulée des membres ; récompense en heures de production", () => {
    const players = [player("a", { allianceId: "al1", victories: 5 }), player("b", { allianceId: "al2", victories: 3 })];
    let st = startAllianceChallengeWeek(players, NOW, null);
    st = { ...st, challengeId: "conquerants" };
    st = { ...st, baselines: { a: 5, b: 3 } };
    const later = [player("a", { allianceId: "al1", victories: 9 }), player("b", { allianceId: "al2", victories: 4 }), player("c", { allianceId: "al2", victories: 1 })];
    st = refreshAllianceChallenge(st, later, [{ id: "al1", tag: "A", name: "A" }, { id: "al2", tag: "B", name: "B" }], NOW);
    expect(st.standings.map((s) => [s.allianceId, s.score])).toEqual([
      ["al1", 4],
      ["al2", 1],
    ]);
    expect(st.baselines.c).toBe(1);
    expect(challengeOfWeek(st.weekId).id).toBeTruthy();
    expect(Object.keys(allianceChallengeReward(1, [player("a")])).length).toBeGreaterThan(0);
    expect(allianceChallengeReward(9, [player("a")])).toEqual({});
  });

  it("5.15.4 : ce qui est fait entre lundi 0 h et le premier relevé compte pour la nouvelle semaine", () => {
    // Dimanche 23 h 50 (Paris) : dernier relevé de la semaine.
    const SUN = Date.UTC(2026, 9, 11, 21, 50);
    const MON_0015 = Date.UTC(2026, 9, 11, 22, 15);
    const sundayWeek = startAllianceChallengeWeek([player("a", { allianceId: "al1" })], SUN, null);
    const nextMetricPlayer = (n: number) => {
      const p = player("a", { allianceId: "al1" });
      // Toutes les mesures possibles du défi suivant (quelle que soit la semaine).
      p.stats = { ...(p.stats ?? {}), recycled: n, missions: n, loot: n, unitsBuilt: n, contracts: n } as PlayerState["stats"];
      p.victories = n;
      return p;
    };
    let st = refreshAllianceChallenge(sundayWeek, [nextMetricPlayer(1000)], [{ id: "al1", tag: "A", name: "A" }], SUN);
    expect(st.next?.weekId).toBe("2026-10-12");
    // 00:08 : gros recyclage ; 00:15 : premier relevé de la nouvelle semaine.
    const after = [nextMetricPlayer(1_386_000)];
    st = refreshAllianceChallenge(st, after, [{ id: "al1", tag: "A", name: "A" }], MON_0015);
    expect(st.next?.weekId).toBe("2026-10-12"); // pas réécrit après minuit
    const week = startAllianceChallengeWeek(after, MON_0015, null, st.next);
    expect(week.weekId).toBe("2026-10-12");
    expect(week.baselines.a).toBe(1000);
    const live = refreshAllianceChallenge(week, after, [{ id: "al1", tag: "A", name: "A" }], MON_0015);
    expect(live.standings[0]?.score).toBe(1_385_000);
  });
});

