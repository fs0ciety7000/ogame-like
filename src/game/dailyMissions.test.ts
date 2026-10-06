import { beforeAll, describe, expect, it } from "vitest";
import { applyGameContent } from "@/game/content";
import { CONTRACT_RULES, claimContract, ensureContracts, recordContract } from "@/game/contracts";
import { dailyMissions, dailyTasksFor, DAILY_RULES, settleLegacyDaily } from "@/game/dailyMissions";
import { defaultPlayerState } from "@/game/defaults";
import { playerCasino } from "@/game/casino";
import { passState, trackActivity } from "@/game/seasonPass";
import { parisDay } from "@/game/retention";
import type { PlayerState } from "@/types/game";

/* 5.15.12 : missions du jour ; 6.2 (lot N) : fusionnées dans les objectifs du jour. */

const DAY = Date.UTC(2026, 9, 14, 10);

function player(): PlayerState {
  const p = defaultPlayerState("u1", "u1") as PlayerState;
  p.createdAtMs = DAY - 30 * 86400_000;
  return p;
}

describe("missions du jour fusionnées (6.2)", () => {
  beforeAll(() => applyGameContent({}));

  it("plus aucune tâche tirée ; l'ancien tirage reste déterministe pour la bascule", () => {
    expect(dailyMissions(player(), DAY).tasks).toHaveLength(0);
    const legacy = dailyTasksFor("2026-10-14", DAILY_RULES.legacyTasks);
    expect(legacy).toHaveLength(3);
    expect(dailyTasksFor("2026-10-14", DAILY_RULES.legacyTasks)).toEqual(legacy);
  });

  it("bascule sans perte : les missions faites et non réclamées sont payées une fois", () => {
    const p = player();
    const legacy = dailyTasksFor(parisDay(DAY), DAILY_RULES.legacyTasks);
    for (const t of legacy) trackActivity(p, t.key, DAY, t.count);
    const before = playerCasino(p).tokens;
    expect(settleLegacyDaily(p, DAY)).toBe(3 * DAILY_RULES.tokensPerTask + DAILY_RULES.allBonusTokens);
    expect(playerCasino(p).tokens - before).toBe(3 * DAILY_RULES.tokensPerTask + DAILY_RULES.allBonusTokens);
    expect(settleLegacyDaily(p, DAY)).toBe(0);
    expect(passState(p, DAY).daily?.settled).toBe(true);
  });

  it("totaux du jour inchangés : 4 objectifs = 360 rares × échelle, 60 XP, 5 jetons", () => {
    expect(CONTRACT_RULES.perDay * CONTRACT_RULES.rarePerContract).toBe(360);
    expect(CONTRACT_RULES.perDay * CONTRACT_RULES.xpPerContract).toBe(60);
    expect(CONTRACT_RULES.perDay * CONTRACT_RULES.tokensPerContract + CONTRACT_RULES.allDoneTokens).toBe(5);
  });

  it("les sondes et le marché font avancer les objectifs ; chaque objectif rapporte un jeton", () => {
    const p = player();
    const st = ensureContracts(p, DAY);
    st.items[0] = { ...st.items[0], type: "spy", target: 2, progress: 0 };
    trackActivity(p, "spy", DAY, 2);
    expect(p.contracts!.items[0].progress).toBe(2);
    const before = playerCasino(p).tokens;
    const res = claimContract(p, p.contracts!.items[0].id, DAY);
    expect(res.tokens).toBe(CONTRACT_RULES.tokensPerContract);
    expect(playerCasino(p).tokens - before).toBe(CONTRACT_RULES.tokensPerContract);
    for (const c of p.contracts!.items.slice(1)) recordContract(p, c.type, c.target, DAY);
    let last = res;
    for (const c of p.contracts!.items.slice(1)) last = claimContract(p, c.id, DAY);
    expect(last.dayCompleted).toBe(true);
    expect(last.tokens).toBe(CONTRACT_RULES.tokensPerContract + CONTRACT_RULES.allDoneTokens);
  });

  it("bascule de 3 à 4 objectifs dans la journée, sans rien retirer", () => {
    const p = player();
    const st = ensureContracts(p, DAY);
    p.contracts = { ...st, items: st.items.slice(0, 3) };
    const keep = p.contracts.items.map((c) => c.id);
    const after = ensureContracts(p, DAY + 60_000);
    expect(after.items).toHaveLength(4);
    expect(after.items.slice(0, 3).map((c) => c.id)).toEqual(keep);
  });
});
