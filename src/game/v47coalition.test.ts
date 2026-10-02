import { describe, expect, it } from "vitest";
import { defaultPlayerState } from "@/game/defaults";
import {
  archiveCoalition,
  checkCoalitionTrigger,
  COALITION_RULES,
  coalitionPhase,
  coalitionScene,
  coalitionState,
  empowerWarlord,
  grantCoalitionReward,
  readCoalitions,
  recordCoalitionDamage,
  settleCoalition,
  writeCoalitions,
} from "@/game/coalition";
import { warlordsState } from "@/game/warlords";
import { PASS_POINTS, passState } from "@/game/seasonPass";
import type { PlayerState } from "@/types/game";

const H = 3600_000;
const NOW = Date.UTC(2026, 9, 14, 10);
const lord = (power: number) => [{ id: "zharkesh", power, fleetPower: 100_000, present: true }];

function player(uid: string): PlayerState {
  const p = defaultPlayerState(uid, uid) as PlayerState;
  p.buildings.extracteur_ferraille = { level: 10, unlocked: true };
  return p;
}

describe("v4.7 coalitions", () => {
  it("opens after 48 h above 1.5 × the best player, then waits 14 days", () => {
    const c = coalitionState(null);
    expect(checkCoalitionTrigger(c, lord(140), 100, NOW)).toBeNull(); // 1,4 × : pas assez
    expect(c.overSince.zharkesh).toBeUndefined();
    expect(checkCoalitionTrigger(c, lord(160), 100, NOW)).toBeNull(); // seuil franchi, chrono lancé
    expect(checkCoalitionTrigger(c, lord(160), 100, NOW + 47 * H)).toBeNull();
    const co = checkCoalitionTrigger(c, lord(160), 100, NOW + 48 * H)!;
    expect(co).toBeTruthy();
    expect(co.goal).toBe(150_000);
    expect(co.endsAtMs - co.startedAtMs).toBe(COALITION_RULES.durationDays * 24 * H);
    // Échéance : échec, archivage, 14 jours d'attente.
    expect(settleCoalition(c, co.endsAtMs)?.status).toBe("lost");
    archiveCoalition(c, co.endsAtMs);
    expect(c.coalition).toBeNull();
    expect(checkCoalitionTrigger(c, lord(160), 100, co.endsAtMs + 13 * 24 * H)).toBeNull();
    // Le seigneur est resté au-dessus du seuil : la suivante part dès la fin de l'attente (48 h tenues).
    expect(checkCoalitionTrigger(c, lord(160), 100, co.endsAtMs + 15 * 24 * H)).toBeTruthy();
  });

  it("counts everyone's damage, rewards ≥ 3 % of the goal, relics for the top 3, title for the first", () => {
    const c = coalitionState(null);
    checkCoalitionTrigger(c, lord(160), 100, NOW);
    const co = checkCoalitionTrigger(c, lord(160), 100, NOW + 48 * H)!;
    const t = NOW + 50 * H;
    expect(recordCoalitionDamage(c, "autre", "a", "A", 1000, t)).toBeNull();
    recordCoalitionDamage(c, "zharkesh", "a", "Alpha", 100_000, t);
    recordCoalitionDamage(c, "zharkesh", "c", "Charlie", 2000, t); // 1,3 % : sous le seuil
    expect(coalitionPhase(co)).toBe("mid");
    const won = recordCoalitionDamage(c, "zharkesh", "b", "Bravo", 48_000, t)!;
    expect(won.status).toBe("won");
    const a = player("a");
    const out = grantCoalitionReward(won, { name: "Zhar'Kesh, le Dévoreur" }, a, t, () => 0.1);
    expect(out).toMatchObject({ eligible: true, title: "Briseur de Zhar'Kesh" });
    expect(out.relic).toBeTruthy();
    expect(passState(a, t).points).toBeGreaterThanOrEqual(PASS_POINTS.coalition);
    expect(grantCoalitionReward(won, { name: "Zhar'Kesh" }, player("c"), t).eligible).toBe(false);
    expect(coalitionScene(won, { name: "Zhar'Kesh", portrait: "/x.webp" }, "won").some((l) => l.as?.name === "Zhar'Kesh")).toBe(true);
  });

  it("is kept in the warlords state, and a failure empowers the lord", () => {
    const st = warlordsState(null);
    const c = coalitionState(null);
    c.lastEndMs = 123;
    writeCoalitions(st, c);
    expect(readCoalitions(warlordsState(JSON.parse(JSON.stringify(st)))).lastEndMs).toBe(123);
    const npc = player("npc");
    npc.units.chasseur = { level: 1, count: 100 };
    empowerWarlord(npc);
    expect(npc.units.chasseur.count).toBe(110);
  });
});
