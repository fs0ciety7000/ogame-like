import { XP_TIER_RULES } from "@/game/xpTiers";
import { describe, expect, it } from "vitest";
import { defaultPlayerState, defaultQueues } from "@/game/defaults";
import {
  assertKeshEmojis,
  BOUNTY_RULES,
  bountyRank,
  bountyState,
  buyShopItem,
  consumeCharge,
  donateAmber,
  nameToneOf,
  patronTier,
  rerollablePlans,
  setNameTone,
  shopReminders,
  plannerUnlocked,
  checkEliteLaunch,
  closeElite,
  ELITE_RULES,
  eliteRewardees,
  exchangeAmber,
  fugitivePower,
  generateBoard,
  grantEliteReward,
  releaseBounty,
  resolveBountyHunt,
  resolveEliteAssault,
  spawnElite,
  startBounty,
  viewBounties,
} from "@/game/bounties";
import { launchBounty, performLaunch } from "@/game/fleets";
import { MODULE_TEMPLATES } from "@/game/modules";
import { advanceResources } from "@/game/economy";
import { checkAttackAllowed } from "@/game/pvp";
import { pveAttackFactor } from "@/game/combat";
import type { PlayerState } from "@/types/game";

const H = 3600_000;
// Lundi 5 octobre 2026, 1 h UTC.
const NOW = Date.UTC(2026, 9, 5, 1);

function player(uid = "u1", chasseurs = 100): PlayerState {
  const p = { ...defaultPlayerState(uid, uid), createdAt: null } as unknown as PlayerState;
  p.uid = uid;
  p.resourcesUpdatedAtMs = NOW;
  p.units = { chasseur: { level: 1, count: chasseurs } };
  p.buildings = { ...p.buildings, extracteur_ferraille: { level: 10, unlocked: true } };
  return p;
}

describe("bounties", () => {
  it("builds the same board on client and server, renewed every 8 h", () => {
    const a = generateBoard("u1", 10, 1);
    expect(generateBoard("u1", 10, 1)).toEqual(a);
    expect(a.map((c) => c.tier)).toEqual([1, 2, 2]);
    expect(new Set(a.map((c) => c.fugitive)).size).toBe(3);
    expect(generateBoard("u1", 10, 3).map((c) => c.tier)).toEqual([1, 2, 3]);
    expect(generateBoard("u1", 10, 5).map((c) => c.tier)).toEqual([1, 2, 3, 4]);
    for (const c of a) {
      const t = BOUNTY_RULES.tiers[c.tier];
      expect(c.minutes).toBeGreaterThanOrEqual(t.minMinutes);
      expect(c.minutes).toBeLessThanOrEqual(t.maxMinutes);
    }
    const p = player();
    const first = viewBounties(p, NOW);
    expect(viewBounties(p, NOW + 6 * H).board).toEqual(first.board);
    expect(viewBounties(p, NOW + 7 * H).board).not.toEqual(first.board);
  });

  it("ranks follow reputation", () => {
    expect(bountyRank(0)).toBe(1);
    expect(bountyRank(10)).toBe(2);
    expect(bountyRank(29)).toBe(2);
    expect(bountyRank(150)).toBe(5);
  });

  it("calibrates the fugitive on the whole fleet, with a floor", () => {
    expect(fugitivePower(1, player("u1", 0))).toBe(BOUNTY_RULES.tiers[1].floor);
    // 100 chasseurs × 245 = 24 500 d'attaque.
    expect(fugitivePower(2, player())).toBe(Math.round(24_500 * 0.8));
  });

  it("launches a hunt, wins it and pays XP, amber and reputation", () => {
    const p = player();
    const board = viewBounties(p, NOW).board;
    const contract = board.find((c) => c.tier === 1)!;
    const out = launchBounty(p, contract.id, { chasseur: 100 }, NOW);
    expect(out.fleet.mission).toBe("bounty");
    expect(out.fleet.arriveAtMs).toBe(NOW + contract.minutes * 60_000);
    expect(out.fleet.power).toBe(Math.round(24_500 * 0.5));
    expect(out.attacker.units.chasseur.count).toBe(0);
    expect(bountyState(out.attacker).doneToday).toBe(1);
    expect(() => startBounty(out.attacker, contract.id, NOW)).toThrow(/déjà/);

    const back = out.attacker;
    back.units.chasseur.count = 100; // remis à bord pour le combat
    const hunt = resolveBountyHunt(back, defaultQueues(), contract.id, { chasseur: 100 }, out.fleet.power!, NOW + H);
    expect(hunt.success).toBe(true);
    const st = bountyState(hunt.player);
    expect(st.amber).toBe(BOUNTY_RULES.tiers[1].amber);
    expect(st.reputation).toBe(BOUNTY_RULES.tiers[1].rep);
    expect(st.board.some((c) => c.id === contract.id)).toBe(false);
    // 5.18 : bonus au jeu actif sur les primes (×1,5), sous le premier palier.
    expect(hunt.player.xp).toBe(BOUNTY_RULES.tiers[1].xp * (XP_TIER_RULES.multipliers.bounty ?? 1));
    expect(hunt.player.stats?.bounties).toBe(1);
    expect(hunt.notifications.some((n) => n.kind === "bounty" && n.link === "/game/primes")).toBe(true);
  });

  it("keeps a failed bounty open once, and frees a recalled one", () => {
    const p = player();
    const contract = viewBounties(p, NOW).board[0];
    startBounty(p, contract.id, NOW);
    let hunt = resolveBountyHunt(p, defaultQueues(), contract.id, { chasseur: 1 }, 1_000_000, NOW + H);
    expect(hunt.success).toBe(false);
    expect(bountyState(hunt.player).board.find((c) => c.id === contract.id)?.status).toBe("open");
    startBounty(hunt.player, contract.id, NOW + H);
    hunt = resolveBountyHunt(hunt.player, defaultQueues(), contract.id, { chasseur: 1 }, 1_000_000, NOW + 2 * H);
    expect(bountyState(hunt.player).board.some((c) => c.id === contract.id)).toBe(false);

    const q = player("u2");
    const c2 = viewBounties(q, NOW).board[1];
    startBounty(q, c2.id, NOW);
    releaseBounty(q, c2.id);
    expect(bountyState(q).board.find((c) => c.id === c2.id)?.status).toBe("open");
  });

  it("limits hunts to 4 a day", () => {
    const p = player();
    p.bounties = { ...bountyState(p), day: "2026-10-05", doneToday: BOUNTY_RULES.dailyLimit };
    const contract = viewBounties(p, NOW).board[0];
    expect(() => startBounty(p, contract.id, NOW)).toThrow(/par jour/);
    // Le lendemain, le compteur repart.
    expect(() => startBounty(p, viewBounties(p, NOW + 24 * H).board[0].id, NOW + 24 * H)).not.toThrow();
  });

  it("sends bounty fleets through performLaunch", () => {
    const p = player();
    const contract = viewBounties(p, NOW).board[0];
    const out = performLaunch({ mission: "bounty", now: NOW, owner: p, ownerQueues: defaultQueues(), fleet: { chasseur: 10 }, bountyId: contract.id });
    expect(out.fleet.targetUid).toBe(`bounty_${contract.id}`);
  });

  it("5.26.1 : le Planificateur s'achète une fois, 600 Ambre", () => {
    const p = player();
    const q = defaultQueues();
    expect(plannerUnlocked(p)).toBe(false);
    p.bounties = { ...bountyState(p), amber: 599 };
    expect(() => buyShopItem(p, q, "planner", NOW)).toThrow(/Ambre/);
    p.bounties = { ...bountyState(p), amber: 700 };
    buyShopItem(p, q, "planner", NOW);
    expect(plannerUnlocked(p)).toBe(true);
    expect(bountyState(p).amber).toBe(100);
    expect(() => buyShopItem(p, q, "planner", NOW)).toThrow(/Déjà/);
  });

  it("sells shop items once, with charges and cooldowns", () => {
    const p = player();
    const q = defaultQueues();
    expect(() => buyShopItem(p, q, "boost", NOW)).toThrow(/Ambre/);
    p.bounties = { ...bountyState(p), amber: 2000 };
    buyShopItem(p, q, "boost", NOW);
    expect(bountyState(p).boostUntilMs).toBe(NOW + 24 * H);
    buyShopItem(p, q, "blueprint", NOW);
    expect(p.units.traqueur_kesh.level).toBe(1);
    expect(() => buyShopItem(p, q, "blueprint", NOW)).toThrow(/Déjà/);
    buyShopItem(p, q, "jammer", NOW);
    buyShopItem(p, q, "jammer", NOW);
    buyShopItem(p, q, "jammer", NOW);
    expect(() => buyShopItem(p, q, "jammer", NOW)).toThrow(/réserve/);
    buyShopItem(p, q, "shield", NOW);
    expect(() => buyShopItem(p, q, "shield", NOW + H)).toThrow(/Disponible/);
    expect(() => buyShopItem(p, q, "accelerator", NOW)).toThrow(/construction/);
    buyShopItem(p, q, "title", NOW);
    expect(p.activeTitle).toBe("Chasseur de l'Essaim");
    expect(bountyState(p).amber).toBe(2000 - 80 - 600 - 150 - 150 - 120);
  });

  it("speeds up a building with the accelerator", () => {
    const p = player();
    p.bounties = { ...bountyState(p), amber: 100 };
    const q = defaultQueues();
    q.buildingUpgrades = { extracteur_ferraille: { endTime: NOW + 3 * H } } as unknown as typeof q.buildingUpgrades;
    buyShopItem(p, q, "accelerator", NOW);
    expect((q.buildingUpgrades as Record<string, { endTime: number }>).extracteur_ferraille.endTime).toBe(NOW + 2 * H);
  });

  it("exchanges amber for rare resources, capped each week", () => {
    const p = player();
    p.bounties = { ...bountyState(p), amber: 500 };
    const gain = exchangeAmber(p, 60, NOW);
    expect(Object.values(gain).every((n) => n === 60 * BOUNTY_RULES.exchange.rarePerAmber)).toBe(true);
    expect(() => exchangeAmber(p, 50, NOW)).toThrow(/Plafond/);
    expect(() => exchangeAmber(p, 50, NOW + 7 * 24 * H)).not.toThrow();
  });

  it("boosts production while the jelly lasts", () => {
    const p = player();
    p.resources = { ...p.resources, scrap: 0 };
    const base = advanceResources(p, 600, NOW).scrap ?? 0;
    p.bounties = { ...bountyState(p), boostUntilMs: NOW + 300_000 };
    const boosted = advanceResources(p, 600, NOW).scrap ?? 0;
    const start = 0;
    // +20 % pendant la moitié du temps (à l'énergie près).
    expect((boosted - start) / (base - start)).toBeGreaterThan(1.09);
    expect((boosted - start) / (base - start)).toBeLessThan(1.11);
  });

  it("blocks attacks under the chitin veil", () => {
    const check = checkAttackAllowed({
      now: NOW,
      attackerUid: "a",
      attackerXp: 0,
      defenderUid: "b",
      defenderXp: 0,
      defenderCreatedAtMs: 0,
      defenderHasAttacked: true,
      lastAttackOnTargetMs: null,
      lastDefenderDefeatMs: null,
      defenderShieldUntilMs: NOW + H,
    });
    expect(check.allowed).toBe(false);
    expect(check.message).toMatch(/Voile/);
  });

  it("gives hunters a PvE bonus", () => {
    const p = player();
    p.units.traqueur_kesh = { level: 1, count: 10 };
    expect(pveAttackFactor(p.units, p.techLevels, { chasseur: 10 })).toBe(1);
    expect(pveAttackFactor(p.units, p.techLevels, { traqueur_kesh: 10 })).toBeCloseTo(1.5);
  });

  it("restricts Kesh emojis to their owners", () => {
    const p = player();
    expect(() => assertKeshEmojis(p, "gg :kesh_gg:")).toThrow(/Comptoir/);
    expect(() => assertKeshEmojis(p, "gg :autre:")).not.toThrow();
    p.bounties = { ...bountyState(p), owned: ["emojis"] };
    expect(() => assertKeshEmojis(p, "gg :kesh_gg:")).not.toThrow();
  });

  it("runs the weekly elite hunt for the whole server", () => {
    const a = player("a", 1000);
    const b = player("b", 1000);
    let st = spawnElite(NOW, [a, b]);
    expect(st.maxHp).toBeGreaterThanOrEqual(ELITE_RULES.minHp);
    expect(() => checkEliteLaunch(st, a, NOW)).toThrow(/rang/);
    a.bounties = { ...bountyState(a), reputation: 10 };
    st = checkEliteLaunch(st, a, NOW);
    expect(() => checkEliteLaunch(st, a, NOW + H)).toThrow(/min/);
    st = { ...st, hp: 100_000, maxHp: 100_000 };
    const r = resolveEliteAssault(st, a, { chasseur: 1000 }, undefined, NOW + H);
    expect(r.damage).toBe(100_000);
    expect(r.killed).toBe(true);
    expect(r.lost.chasseur).toBe(100);
    expect(eliteRewardees(r.state)).toEqual(["a"]);
    const reward = grantEliteReward(r.state, a, NOW + H);
    expect(reward).toMatchObject({ xp: ELITE_RULES.killed.xp * (XP_TIER_RULES.multipliers.bounty ?? 1), amber: ELITE_RULES.killed.amber });
    expect(grantEliteReward(r.state, b, NOW + H)).toEqual({ xp: 0, amber: 0 });
    expect(closeElite(spawnElite(NOW, [a]), NOW + 8 * 24 * H).status).toBe("failed");
  });
});

describe("5.26.3 Comptoir : consommables et prestige", () => {
  const rich = () => {
    const p = player();
    p.bounties = { ...bountyState(p), amber: 5000 };
    return p;
  };

  it("sondes fantômes, contrats prioritaires et jetons de vendetta : réserves de 3", () => {
    const p = rich();
    const q = defaultQueues();
    for (const id of ["phantom", "priority", "vendettaToken"] as const) {
      buyShopItem(p, q, id, NOW);
      buyShopItem(p, q, id, NOW);
      buyShopItem(p, q, id, NOW);
      expect(() => buyShopItem(p, q, id, NOW)).toThrow(/réserve/);
    }
    expect(bountyState(p)).toMatchObject({ phantoms: 3, priorityContracts: 3, vendettaTokens: 3 });
    expect(consumeCharge(p, "phantoms")).toBe(true);
    expect(bountyState(p).phantoms).toBe(2);
  });

  it("analgésique : 2 h de réparations d'un coup, refusé sans réparation", () => {
    const p = rich();
    const q = defaultQueues();
    expect(() => buyShopItem(p, q, "painkiller", NOW)).toThrow(/Atelier/);
    p.workshop = { updatedAtMs: NOW, jobs: [{ id: "j0", unitId: "chasseur", count: 1, hpTotal: 10, hpLeft: 10, source: "raid", addedAtMs: NOW }], hull: {} } as PlayerState["workshop"];
    expect(() => buyShopItem(p, q, "painkiller", NOW)).toThrow(/Construis d'abord/);
    p.buildings = { ...p.buildings, atelier_reparation: { level: 5, unlocked: true } };
    p.workshop = { updatedAtMs: NOW, jobs: [{ id: "j1", unitId: "chasseur", count: 100, hpTotal: 1e9, hpLeft: 1e9, source: "raid", addedAtMs: NOW }], hull: {} } as PlayerState["workshop"];
    buyShopItem(p, q, "painkiller", NOW);
    expect(p.workshop!.jobs[0].hpLeft).toBeLessThan(1e9);
    expect(p.workshop!.updatedAtMs).toBe(NOW);
  });

  it("rappel de plan : une fois par plan commun", () => {
    const p = rich();
    const q = defaultQueues();
    expect(() => buyShopItem(p, q, "reroll", NOW)).toThrow(/plan commun/);
    p.modules = { items: [{ id: "m1", template: MODULE_TEMPLATES[0].id, rarity: "common", built: false, foundAtMs: NOW, source: "test" }] } as unknown as PlayerState["modules"];
    expect(rerollablePlans(p)).toHaveLength(1);
    buyShopItem(p, q, "reroll", NOW, "m1", () => 0.999);
    expect(rerollablePlans(p)).toHaveLength(0);
    expect(() => buyShopItem(p, q, "reroll", NOW)).toThrow(/plan commun/);
  });

  it("phéromone : cumulable dans le temps", () => {
    const p = rich();
    const q = defaultQueues();
    buyShopItem(p, q, "pheromone", NOW);
    buyShopItem(p, q, "pheromone", NOW);
    expect(bountyState(p).pheromoneUntilMs).toBe(NOW + 48 * H);
  });

  it("couleur de pseudo : réservée aux acheteurs, jetons du thème seulement", () => {
    const p = rich();
    expect(() => setNameTone(p, "mint")).toThrow();
    buyShopItem(p, defaultQueues(), "nameColor", NOW);
    expect(nameToneOf(p)).toBe("gold");
    setNameTone(p, "mint");
    expect(nameToneOf(p)).toBe("mint");
    expect(() => setNameTone(p, "#ff00ff")).toThrow();
  });

  it("mécène : don d'Ambre et paliers", () => {
    const p = rich();
    expect(() => donateAmber(p, 0)).toThrow();
    expect(() => donateAmber(p, 6000)).toThrow(/Ambre/);
    donateAmber(p, 120);
    expect(bountyState(p).amber).toBe(4880);
    expect(p.stats?.amberDonated).toBe(120);
    expect(patronTier(120)?.label).toBe("Mécène d'argent");
    expect(patronTier(10)).toBeNull();
  });
});

describe("5.27 Comptoir : historique et rappels", () => {
  it("garde les achats et les dons, 30 au plus", () => {
    const p = player();
    p.bounties = { ...bountyState(p), amber: 5000 };
    buyShopItem(p, defaultQueues(), "pheromone", NOW);
    donateAmber(p, 15, NOW + 1);
    expect(bountyState(p).history).toEqual([
      { atMs: NOW, item: "pheromone", amber: 90 },
      { atMs: NOW + 1, item: "donate", amber: 15 },
    ]);
    for (let i = 0; i < 40; i++) donateAmber(p, 1, NOW + 10 + i);
    expect(bountyState(p).history).toHaveLength(30);
  });

  it("prévient une seule fois, une heure avant la fin", () => {
    const p = player();
    p.bounties = { ...bountyState(p), pheromoneUntilMs: NOW + 3 * H, shieldUntilMs: NOW + 30 * 60_000 };
    const first = shopReminders(p, NOW);
    expect(first.notifications.map((n) => n.title)).toEqual(["Voile de chitine bientôt levé"]);
    expect(shopReminders(p, NOW + 60_000).changed).toBe(false);
    expect(shopReminders(p, NOW + 2.5 * H).notifications.map((n) => n.title)).toEqual(["Phéromone bientôt dissipée"]);
    // Une nouvelle dose repousse la fin : nouveau rappel le moment venu.
    p.bounties = { ...bountyState(p), pheromoneUntilMs: NOW + 27 * H };
    expect(shopReminders(p, NOW + 26.5 * H).changed).toBe(true);
  });
});
