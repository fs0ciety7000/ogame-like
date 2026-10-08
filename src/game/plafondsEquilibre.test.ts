import { afterEach, describe, expect, it } from "vitest";
import { performPlayerAction } from "@/game/actions";
import { performAttack } from "@/game/attack";
import { applyGameContent, defaultGameContent, validateRules } from "@/game/content";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import { storageCapacityOf } from "@/game/economy";
import { productionHours } from "@/game/pirates";
import { checkAttackAllowed, defeatLimitUntil, PVP_RULES, type AttackContext } from "@/game/pvp";
import { EXCHANGE_RULES, exchangeCapLabel, exchangeRareLeft, exchangeRareUsed } from "@/game/resources";
import { chestCommonAmount, chestCommonLabel, chestIndexed, claimStreak, rollStreakChest, STREAK_RULES } from "@/game/streak";
import { weekIdOf } from "@/game/weeklyRecap";
import type { PlayerState } from "@/types/game";

/* 6.14.106 (AU27, lot AE-L3) : plafonds d'équilibre dans le moteur.
   Coffre du 7e jour indexé sur la production (Q99), plafond hebdomadaire de rareté au comptoir (Q98),
   défaites en défense par 24 h (AE-7). Le rattrapage (AE-15) est couvert par catchup.test.ts. */

const NOW = Date.UTC(2026, 10, 4, 12); // mercredi 4 novembre 2026, 12 h UTC
const H = 3_600_000;

function player(patch: Partial<PlayerState> = {}): PlayerState {
  return { ...defaultPlayerState("u1", "U1"), createdAtMs: NOW - 30 * 24 * H, resourcesUpdatedAtMs: NOW, ...patch } as PlayerState;
}

afterEach(() => {
  applyGameContent({});
});

describe("coffre du 7e jour indexé sur la production (Q99)", () => {
  it("défauts : [6, 18] h, plancher 2 M ; réglage partiel du coffre fusionné", () => {
    expect(STREAK_RULES.chest.commonHours).toEqual([6, 18]);
    expect(chestIndexed()).toBe(true);
    applyGameContent({ rules: { streak: { chest: { amber: [10, 20] } } } as never });
    expect(STREAK_RULES.chest.commonHours).toEqual([6, 18]);
    expect(STREAK_RULES.chest.common).toEqual([2_000_000, 12_000_000]);
  });

  it("montant : heures × production, arrondi au millier, plancher, place libre de l'entrepôt", () => {
    expect(chestCommonAmount(1_000_000, 12, 2_000_000)).toBe(12_000_000);
    expect(chestCommonAmount(100_000, 6, 2_000_000)).toBe(2_000_000);
    expect(chestCommonAmount(1_234_567, 1, 0)).toBe(1_234_000);
    expect(chestCommonAmount(10_000_000, 18, 2_000_000, 50_000_000)).toBe(50_000_000);
    // Entrepôt plein : le plancher seulement.
    expect(chestCommonAmount(10_000_000, 18, 2_000_000, -5)).toBe(2_000_000);
  });

  it("tirage : chaque ressource entre min et max heures de production du joueur (ou le plancher)", () => {
    const p = player();
    p.buildings = { ...p.buildings, extracteur_ferraille: { ...p.buildings.extracteur_ferraille, level: 18 } } as never;
    p.resources = { ...p.resources, scrap: 0 };
    const perHour = productionHours(p, 1).scrap ?? 0;
    expect(perHour).toBeGreaterThan(0);
    const low = rollStreakChest(() => 0, p).resources.scrap!;
    const high = rollStreakChest(() => 0.999999, p).resources.scrap!;
    expect(low).toBe(Math.max(2_000_000, Math.min(Math.floor((perHour * 6) / 1000) * 1000, storageCapacityOf(p))));
    expect(high).toBeGreaterThanOrEqual(low);
    expect(high).toBeLessThanOrEqual(Math.max(2_000_000, perHour * 18));
  });

  it("entrepôt presque plein : le coffre s'arrête à la place libre (au moins le plancher)", () => {
    const p = player();
    const cap = storageCapacityOf(p);
    p.resources = { ...p.resources, scrap: cap - 500_000, energy: cap };
    const chest = rollStreakChest(() => 0.5, p);
    expect(chest.resources.scrap).toBe(2_000_000);
    expect(chest.resources.energy).toBe(2_000_000);
  });

  it("[0, 0] : ancien coffre aux bornes fixes, arrondi au million", () => {
    applyGameContent({ rules: { streak: { chest: { commonHours: [0, 0] } } } as never });
    expect(chestIndexed()).toBe(false);
    const c = rollStreakChest(() => 0, player());
    expect(c.resources.scrap).toBe(2_000_000);
    expect(chestCommonLabel(STREAK_RULES.chest, (n) => `${n / 1e6} M`)).toBe("2 M à 12 M");
  });

  it("le 7e jour de série verse le coffre indexé ; le texte joueur suit la règle", () => {
    const p = player({ streak: { count: 6, lastDay: "2026-11-03", best: 6, total: 6 } as never });
    const out = claimStreak(p, NOW, () => 0.5);
    expect(out.count).toBe(7);
    expect(out.chest?.resources.scrap).toBeGreaterThanOrEqual(2_000_000);
    expect(chestCommonLabel(STREAK_RULES.chest, (n) => `${n / 1e6} M`)).toBe("6 à 18 h de production, dans la place libre de l'entrepôt (au moins 2 M)");
  });

  it("validation : heures dans l'ordre, 72 h au plus", () => {
    const d = defaultGameContent().rules;
    expect(validateRules({ streak: d.streak })).toEqual([]);
    expect(validateRules({ streak: { ...d.streak, chest: { ...d.streak.chest, commonHours: [18, 6] } } }).join(" ")).toMatch(/heures de production/);
    expect(validateRules({ streak: { ...d.streak, chest: { ...d.streak.chest, commonHours: [6, 100] } } }).join(" ")).toMatch(/72/);
  });
});

describe("plafond hebdomadaire de rareté au comptoir (Q98)", () => {
  const rich = () => player({ resources: { ...player().resources, scrap: 1e12, energy: 1e12, reinforcedSteel: 1e9 } });

  it("défaut 30 M de rares par semaine ; réglage partiel du groupe fusionné", () => {
    expect(EXCHANGE_RULES.weeklyRareCap).toBe(30_000_000);
    applyGameContent({ rules: { exchange: { taxPct: 0.1 } } as never });
    expect(EXCHANGE_RULES.weeklyRareCap).toBe(30_000_000);
    expect(EXCHANGE_RULES.taxPct).toBe(0.1);
  });

  it("compte les rares reçues (après taxe), refuse au-delà, et repart à zéro le lundi", () => {
    applyGameContent({ rules: { exchange: { weeklyRareCap: 1_000, commonToRare: 0.01, taxPct: 0 } } as never });
    let p = rich();
    p = performPlayerAction(p, defaultQueues(), { type: "trade", sellId: "scrap", buyId: "reinforcedSteel", amount: 60_000 }, NOW).player;
    expect(exchangeRareUsed(p, NOW)).toBe(600);
    expect(p.exchangeWeek).toEqual({ week: weekIdOf(NOW), rares: 600 });
    expect(exchangeRareLeft(p, NOW)).toBe(400);
    // 500 de plus : refusé, rien n'est retiré.
    expect(() => performPlayerAction(p, defaultQueues(), { type: "trade", sellId: "scrap", buyId: "cyberModule", amount: 50_000 }, NOW)).toThrow(/t'en reste 400 cette semaine/);
    // Exactement le reste : accepté, plafond atteint.
    p = performPlayerAction(p, defaultQueues(), { type: "trade", sellId: "energy", buyId: "cyberModule", amount: 40_000 }, NOW).player;
    expect(exchangeRareLeft(p, NOW)).toBe(0);
    expect(() => performPlayerAction(p, defaultQueues(), { type: "trade", sellId: "scrap", buyId: "aiFragment", amount: 100 }, NOW)).toThrow(/Reviens lundi/);
    // Lundi suivant (5 jours plus tard, 00 h UTC) : compteur à zéro.
    const monday = Date.UTC(2026, 10, 9, 0, 0, 1);
    expect(exchangeRareUsed(p, monday)).toBe(0);
    expect(exchangeRareLeft(p, monday)).toBe(1_000);
    p = performPlayerAction({ ...p, resourcesUpdatedAtMs: monday }, defaultQueues(), { type: "trade", sellId: "scrap", buyId: "aiFragment", amount: 10_000 }, monday).player;
    expect(p.exchangeWeek).toEqual({ week: "2026-11-09", rares: 100 });
  });

  it("rares → communes et communes ↔ communes ne comptent pas ; 0 = sans plafond", () => {
    applyGameContent({ rules: { exchange: { weeklyRareCap: 10 } } as never });
    let p = rich();
    p = performPlayerAction(p, defaultQueues(), { type: "trade", sellId: "reinforcedSteel", buyId: "scrap", amount: 1_000 }, NOW).player;
    p = performPlayerAction(p, defaultQueues(), { type: "trade", sellId: "scrap", buyId: "energy", amount: 1_000 }, NOW).player;
    expect(exchangeRareUsed(p, NOW)).toBe(0);
    applyGameContent({ rules: { exchange: { weeklyRareCap: 0 } } as never });
    expect(exchangeRareLeft(p, NOW)).toBe(Infinity);
    expect(exchangeCapLabel()).toBeNull();
    p = performPlayerAction(p, defaultQueues(), { type: "trade", sellId: "scrap", buyId: "reinforcedSteel", amount: 1e10 }, NOW).player;
    expect(exchangeRareUsed(p, NOW)).toBeGreaterThan(1e6);
  });

  it("texte joueur lu dans la règle ; bornes de l'admin", () => {
    applyGameContent({ rules: { exchange: { weeklyRareCap: 5_000_000 } } as never });
    expect(exchangeCapLabel((n) => `${n / 1e6} M`)).toMatch(/^5 M de ressources rares par semaine au plus/);
    const d = defaultGameContent().rules;
    expect(validateRules({ exchange: { ...(d.exchange as object), weeklyRareCap: -1 } } as never).join(" ")).toMatch(/weeklyRareCap/);
  });
});

describe("défaites en défense par 24 h (AE-7)", () => {
  const base: AttackContext = {
    now: NOW,
    attackerUid: "a",
    attackerXp: 1000,
    defenderUid: "d",
    defenderXp: 1000,
    defenderCreatedAtMs: NOW - 30 * 24 * H,
    defenderHasAttacked: true,
    lastAttackOnTargetMs: null,
    lastDefenderDefeatMs: NOW - 5 * H,
  };

  it("défaut 4 ; protégé à la 4e défaite jusqu'à ce que la plus ancienne ait 24 h", () => {
    expect(PVP_RULES.maxDefeatsPer24h).toBe(4);
    const three = [NOW - 20 * H, NOW - 14 * H, NOW - 8 * H];
    expect(defeatLimitUntil(three, NOW)).toBeNull();
    expect(checkAttackAllowed({ ...base, defenderDefeatsMs: three }).allowed).toBe(true);
    const four = [...three, NOW - 5 * H];
    expect(defeatLimitUntil(four, NOW)).toBe(NOW + 4 * H);
    const check = checkAttackAllowed({ ...base, defenderDefeatsMs: four });
    expect(check.allowed).toBe(false);
    expect(check.reason).toBe("shield");
    expect(check.until).toBe(NOW + 4 * H);
    expect(check.message).toMatch(/perdu 4 combats en défense ces dernières 24 h : il est protégé encore 4 h/);
    // La plus ancienne sort de la fenêtre : de nouveau attaquable.
    expect(checkAttackAllowed({ ...base, now: NOW + 4 * H, defenderDefeatsMs: four }).allowed).toBe(true);
  });

  it("au-delà de 4 : la protection dure jusqu'à la sortie de la 4e plus récente ; défaites anciennes ignorées", () => {
    const five = [NOW - 23 * H, NOW - 22 * H, NOW - 10 * H, NOW - 6 * H, NOW - 1 * H];
    expect(defeatLimitUntil(five, NOW)).toBe(NOW - 22 * H + 24 * H);
    expect(defeatLimitUntil([NOW - 30 * H, NOW - 25 * H, NOW - 2 * H, NOW - 1 * H], NOW)).toBeNull();
    // Une défaite « dans le futur » (horloge) ne compte pas.
    expect(defeatLimitUntil([NOW - 3 * H, NOW - 2 * H, NOW - 1 * H, NOW + H], NOW)).toBeNull();
  });

  it("à l'arrivée d'une flotte partie avant la 4e défaite : retour sans combat, message lu dans la règle", () => {
    const four = [NOW - 20 * H, NOW - 14 * H, NOW - 8 * H, NOW - 6 * H];
    const attacker = { ...player(), uid: "a", pseudo: "A" } as PlayerState;
    const defender = { ...player(), uid: "d", pseudo: "Cible" } as PlayerState;
    const input = { now: NOW, attackerUid: "a", attacker, attackerQueues: defaultQueues(), defenderUid: "d", defender, defenderQueues: defaultQueues(), fleet: { chasseur: 1 }, lastAttackOnTargetMs: null, defenderXpLostLast24h: 0, inFlight: true };
    const out = performAttack({ ...input, defenderDefeatsMs: four });
    expect(out.ok).toBe(false);
    expect(!out.ok && out.message).toMatch(/Cible a perdu 4 combats en défense ces dernières 24 h : il est protégé, ta flotte rentre sans combattre/);
    // Trois défaites : le combat a lieu (le résultat dépend des flottes).
    expect(performAttack({ ...input, defenderDefeatsMs: four.slice(1) }).ok).not.toBe(false);
  });

  it("0 = sans limite ; un seigneur de guerre n'en profite pas ; sans donnée, pas de contrôle", () => {
    const four = [NOW - 20 * H, NOW - 14 * H, NOW - 8 * H, NOW - 6 * H];
    applyGameContent({ rules: { pvp: { maxDefeatsPer24h: 0 } } as never });
    expect(checkAttackAllowed({ ...base, defenderDefeatsMs: four }).allowed).toBe(true);
    applyGameContent({});
    expect(checkAttackAllowed({ ...base, defenderIsWarlord: true, defenderDefeatsMs: four }).allowed).toBe(true);
    expect(checkAttackAllowed({ ...base }).allowed).toBe(true);
    expect(validateRules({ pvp: { ...defaultGameContent().rules.pvp, maxDefeatsPer24h: -1 } }).join(" ")).toMatch(/maxDefeatsPer24h/);
  });
});
