// Tests de bout en bout contre un VRAI serveur PocketBase de test (jamais
// celui de production : ils créent des comptes). Ignorés par défaut :
//   PB_TEST_URL=http://127.0.0.1:8090 PB_TEST_ADMIN_EMAIL=… PB_TEST_ADMIN_PASSWORD=… \
//     npx vitest run src/services/pocketbase.integration.test.ts
// Le serveur doit avoir le schéma (pocketbase/setup.mjs) et les hooks
// (pocketbase/pb_hooks) installés. Le compte superuser sert à préparer les
// scénarios (donner des ressources, vieillir un compte) : les joueurs ne
// peuvent plus modifier eux-mêmes ces champs.
import { findUnit } from "@/game/units";
import { debrisKey } from "@/game/debris";
import { sectorLabel, sectorOf } from "@/game/territories";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import PocketBase from "pocketbase";
import { pb } from "@/lib/pocketbase";
import { loginPlayer, registerPlayer, logout, changePassword } from "@/services/authService";
import * as ps from "@/services/playerService";
import { GameActionError } from "@/game/errors";
import * as tcs from "@/services/tradeContractService";
import * as al from "@/services/allianceService";
import * as ms from "@/services/messageService";
import * as srs from "@/services/sharedReportService";
import * as ds from "@/services/diplomacyService";
import * as bs from "@/services/bountyService";
import * as rs from "@/services/referralService";
import * as vcs from "@/services/victoryCardService";
import * as ws from "@/services/warlordService";
import * as sbs from "@/services/seasonBossService";
import { bountyState, viewBounties } from "@/game/bounties";
import { resetContentSection, saveContentSection } from "@/services/contentService";
import { checkIsAdmin } from "@/services/adminService";
import { defaultGameContent } from "@/game/content";
import { COMBAT_RULES, fleetCargoCapacity } from "@/game/combat";
import { XP_TIER_RULES } from "@/game/xpTiers";
import { DEFAULT_FACTIONS, type FactionDef } from "@/game/pirates";
import { getBuildingUpgradeTime, findBuilding, getUnitCapacity, keptOnAscension } from "@/game/buildings";
import { acceptMarketOffer, createMarketOffer, fetchMarketTrades } from "@/services/marketService";
import { priceBounds } from "@/game/market";
import { readAllianceSaga, sagaMonthId, sagaOf } from "@/game/allianceSaga";
import { fetchNpcOpponents } from "@/services/codexService";
import { CONTRACT_RULES, contractDay } from "@/game/contracts";
import { generatePassSeason, nextMonthId } from "@/game/passSeasons";
import { generateChapter, worldDigest } from "@/game/procedural";
import { DEFAULT_ACHIEVEMENTS } from "@/game/achievements";
import { chronicleMonthId } from "@/game/chronicles";

const suffix = Math.random().toString(36).slice(2, 7);
const A = { pseudo: `Alpha_${suffix}`, email: `a${suffix}@test.dev`, pw: "motdepasse1" };
const B = { pseudo: `Bravo_${suffix}`, email: `b${suffix}@test.dev`, pw: "motdepasse2" };

const PB_TEST_URL = process.env.PB_TEST_URL;
const PB_TEST_ADMIN = process.env.PB_TEST_ADMIN_EMAIL
  ? { email: process.env.PB_TEST_ADMIN_EMAIL, password: process.env.PB_TEST_ADMIN_PASSWORD ?? "" }
  : null;

const RICH = { scrap: 100000, energy: 100000, nano: 100000, data: 100000, reinforcedSteel: 500, cyberModule: 500, syntheticNanites: 500, aiFragment: 500 };
const MONTH_AGO = () => Date.now() - 30 * 24 * 3600 * 1000;

describe.skipIf(!PB_TEST_URL || !PB_TEST_ADMIN)("PocketBase integration", () => {
  const admin = new PocketBase(PB_TEST_URL);

  // Vols de quelques secondes pendant les tests (règles restaurées à la fin).
  let savedRules: { id: string; data: unknown } | null = null;
  let createdRulesId: string | null = null;
  let savedFactions: { id: string; data: unknown } | null = null;
  let createdFactionsId: string | null = null;

  beforeAll(async () => {
    pb.baseURL = PB_TEST_URL!;
    pb.authStore.clear();
    await admin.collection("_superusers").authWithPassword(PB_TEST_ADMIN!.email, PB_TEST_ADMIN!.password);
    const existing = await admin.collection("game_config").getFirstListItem('key="rules"').catch(() => null);
    const fast = {
      ...((existing?.data as object) ?? {}),
      fleets: { baseMinutes: 0.03, minutesPerDistance: 0.001 },
      spy: { baseMinutes: 0.03, minutesPerDistance: 0.001 },
      // Pas d'événement du week-end pendant les tests (résultats stables).
      events: { rotationEnabled: false, scheduled: [] },
      // 6.14.106 (AE-L3) : A perd de nombreux combats pendant la suite ; la limite de défaites sur 24 h n'est active que
      // dans son propre test.
      pvp: { ...(((existing?.data as { pvp?: object } | undefined)?.pvp) ?? {}), maxDefeatsPer24h: 0 },
    };
    if (existing) {
      savedRules = { id: existing.id, data: existing.data };
      await admin.collection("game_config").update(existing.id, { data: fast });
    } else {
      createdRulesId = (await admin.collection("game_config").create({ key: "rules", data: fast })).id;
    }
    // Raids des factions en quelques secondes.
    const factions = await admin.collection("game_config").getFirstListItem('key="factions"').catch(() => null);
    const fastFactions = ((factions?.data as FactionDef[] | undefined) ?? DEFAULT_FACTIONS).map((f) => ({ ...f, raidTravelHours: 0.001 }));
    if (factions) {
      savedFactions = { id: factions.id, data: factions.data };
      await admin.collection("game_config").update(factions.id, { data: fastFactions });
    } else {
      createdFactionsId = (await admin.collection("game_config").create({ key: "factions", data: fastFactions })).id;
    }
  });

  afterAll(async () => {
    if (savedRules) await admin.collection("game_config").update(savedRules.id, { data: savedRules.data });
    if (createdRulesId) await admin.collection("game_config").delete(createdRulesId);
    if (savedFactions) await admin.collection("game_config").update(savedFactions.id, { data: savedFactions.data });
    if (createdFactionsId) await admin.collection("game_config").delete(createdFactionsId);
  });

  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

  /** v5.14.2 : sans passe de saison publié (ses défis par palier verrouilleraient les paliers testés). */
  const withoutPassSeasons = async (fn: () => Promise<void>) => {
    const rec = await admin.collection("game_config").getFirstListItem('key="passSeasons"').catch(() => null);
    if (rec) await admin.collection("game_config").update(rec.id, { data: { seasons: [] } });
    try {
      await fn();
    } finally {
      if (rec) await admin.collection("game_config").update(rec.id, { data: rec.data });
    }
  };

  /** Fiche complète d'un joueur, lue par le superuser (les joueurs ne
   *  voient plus que leur propre fiche depuis la v1.7). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- enregistrement brut pour les assertions
  const snap = async (id: string): Promise<any> =>
    admin.collection("players").getOne(id).then((r) => ({ ...r, uid: r.id })).catch(() => null);

  /** Envoie une flotte, attend son arrivée et renvoie la flotte + le rapport. */
  async function attackAndResolve(targetUid: string, fleet: Record<string, number>) {
    const sent = await ps.sendFleet(targetUid, fleet);
    await wait(Math.max(0, sent.arriveAtMs - Date.now()) + 400);
    await ps.syncPlayer(""); // traite les flottes arrivées de ce joueur
    const landed = await pb.collection("fleets").getOne(sent.id);
    const report = await pb.collection("battle_reports").getOne(landed.reportId);
    return { sent, landed, report };
  }

  let aId = "", bId = "", allianceId = "";
  /** 6.11.10 (H2) : un test lancé seul (`-t`) crée A et B s'ils n'existent pas encore (sinon il lisait un profil nul). */
  /** 6.14.34 (P30-3) : arrivée forcée d'une flotte. Départ et arrivée sont décalés ensemble pour garder la durée du trajet :
   *  avec l'arrivée seule dans le passé, la durée devenait négative (ramenée à 0) et le retour était dû aussitôt ; la tâche
   *  « à la minute » du serveur pouvait alors faire rentrer la flotte avant la lecture du test (échecs aléatoires v3.5, v3.9). */
  const forceArrival = async (id: string) => {
    const f = await admin.collection("fleets").getOne(id);
    const trip = Math.max(60_000, Number(f.arriveAtMs) - Number(f.departAtMs));
    await admin.collection("fleets").update(id, { arriveAtMs: Date.now() - 1000, departAtMs: Date.now() - 1000 - trip });
  };

  const ensureAB = async () => {
    if (!aId) {
      aId = (await registerPlayer(A.pseudo, A.email, A.pw)).id;
      logout();
    }
    if (!bId) {
      bId = (await registerPlayer(B.pseudo, B.email, B.pw)).id;
      logout();
    }
  };

  it("registers two players and the server creates their profiles", async () => {
    aId = (await registerPlayer(A.pseudo, A.email, A.pw)).id;
    const p = await snap(aId);
    expect(p?.pseudo).toBe(A.pseudo);
    expect(p?.uid).toBe(aId);
    expect(p?.buildings.extracteur_ferraille.unlocked).toBe(true);
    expect(p?.createdAtMs).toBeGreaterThan(0);
    // Deuxième appel : le profil existe déjà, rien n'est écrasé.
    await ps.ensurePlayerDoc(aId, A.pseudo);
    logout();
    bId = (await registerPlayer(B.pseudo, B.email, B.pw)).id;
    logout();
  });

  it("logs in by pseudo (case-insensitive) and by email", async () => {
    expect((await loginPlayer(A.pseudo.toUpperCase(), A.pw)).id).toBe(aId);
    logout();
    expect((await loginPlayer(A.email, A.pw)).id).toBe(aId);
  });

  it("rejects a wrong password", async () => {
    logout();
    await expect(loginPlayer(A.pseudo, "mauvais-mdp")).rejects.toMatchObject({ status: 400 });
    await loginPlayer(A.pseudo, A.pw);
  });

  it("the browser can no longer write its own game data", async () => {
    await expect(pb.collection("players").update(aId, { resources: RICH })).rejects.toBeTruthy();
    await expect(pb.collection("players").update(aId, { xp: 999999 })).rejects.toBeTruthy();
    await expect(pb.collection("players").update(aId, { units: { chasseur: { level: 1, count: 999 } } })).rejects.toBeTruthy();
    await expect(pb.collection("queues").update(aId, { activeResearches: [] })).rejects.toBeTruthy();
    await expect(
      pb.collection("resource_gifts").create({ fromUid: aId, toUid: bId, resources: { scrap: 1 }, claimed: false }),
    ).rejects.toBeTruthy();
    // Le pseudo reste modifiable par le joueur.
    await ps.setPlayerPseudo(aId, A.pseudo);
  });

  it("runs game actions (sync, unlock, research, trade) on the server", async () => {
    await admin.collection("players").update(aId, { resources: RICH });
    const results = await Promise.all([
      ps.syncPlayer(aId, 5),
      ps.unlockBuilding(aId, "reacteur_instable"),
      ps.startResearch(aId, "tech1"),
      ps.tradeResources(aId, "scrap", "energy", 100),
    ]);
    // 5.26.1 : 5 % de ce qui est reçu part au pot commun.
    expect(results[3]).toEqual({ gained: 95, tax: 5, taxRes: "energy" });
    const pot = await admin.collection("game_config").getFirstListItem("key = 'server_pot'");
    expect(pot.data.totals.exchange.energy).toBeGreaterThanOrEqual(5);
    const p = await snap(aId);
    expect(p?.buildings.reacteur_instable.unlocked).toBe(true);
    expect(p?.playtimeSeconds).toBeGreaterThan(0);
    expect(p?.playtimeSeconds).toBeLessThanOrEqual(5);
    const q = await pb.collection("queues").getOne(aId);
    expect(q.activeResearches.map((r: { id: string }) => r.id)).toContain("tech1");
    await expect(ps.startResearch(aId, "tech1")).rejects.toThrow(/déjà en cours/);
    await expect(ps.tradeResources(aId, "scrap", "energy", -5)).rejects.toThrow(/invalide/);
    await expect(ps.enqueueUnitBuild(aId, "chasseur", 1)).rejects.toThrow(/Labo/);
  });

  it("v2.9 onboarding: rewards paid once by the server, only for reached steps", async () => {
    const before = await snap(aId);
    await admin.collection("players").update(aId, { xp: 0, onboarding: null, buildings: { ...before!.buildings, extracteur_ferraille: { level: 3, unlocked: true } } });
    await expect(ps.claimOnboarding("storage2")).rejects.toThrow(/pas encore/);
    const scrap = (await snap(aId))!.resources.scrap;
    await ps.claimOnboarding("scrap3");
    const after = await snap(aId);
    expect(after!.onboarding?.claimed).toEqual(["scrap3"]);
    expect(after!.resources.scrap).toBeGreaterThanOrEqual(scrap + 1000);
    await expect(ps.claimOnboarding("scrap3")).rejects.toThrow(/déjà/);
    await ps.hideOnboarding(true);
    expect((await snap(aId))!.onboarding).toMatchObject({ claimed: ["scrap3"], hidden: true });
    await admin.collection("players").update(aId, { xp: before!.xp, onboarding: null, buildings: before!.buildings });
  });

  it("generates daily contracts on the server, refuses early claims and forged progress", async () => {
    await ps.syncPlayer(aId);
    const p = await snap(aId);
    expect(p?.contracts?.items).toHaveLength(CONTRACT_RULES.perDay);
    const open = p!.contracts!.items.find((c: { claimed: boolean; progress: number; target: number; id: string }) => !c.claimed && c.progress < c.target);
    if (open) await expect(ps.claimContract(open.id)).rejects.toThrow(/pas encore/);
    await expect(pb.collection("players").update(aId, { contracts: { ...p!.contracts, items: [] } })).rejects.toBeTruthy();
  });

  it("forbids writing another player's data", async () => {
    await expect(pb.collection("players").update(bId, { pseudo: "pirate" })).rejects.toMatchObject({ status: 404 });
    await expect(pb.collection("queues").getOne(bId)).rejects.toMatchObject({ status: 404 });
    await expect(pb.collection("players").create({ id: "aaaaaaaaaaaaaaa", pseudo: "x", resources: {}, buildings: {} })).rejects.toBeTruthy();
    // v1.7 : la fiche complète d'un autre joueur est privée, seule sa fiche
    // publique (profiles) est lisible.
    await expect(pb.collection("players").getOne(bId)).rejects.toMatchObject({ status: 404 });
    expect((await pb.collection("players").getFullList()).map((r) => r.id)).toEqual([aId]);
    const profile = await pb.collection("profiles").getOne(bId);
    expect(profile.pseudo).toBe(B.pseudo);
    expect(profile.resources).toBeUndefined();
    await expect(pb.collection("profiles").update(bId, { xp: 999999 })).rejects.toBeTruthy();
    await expect(pb.collection("spy_reports").create({ spyUid: aId, targetUid: bId, targetProcessed: false })).rejects.toBeTruthy();
  });

  it("creates an alliance, chat is members-only", async () => {
    allianceId = await al.createAlliance(aId, A.pseudo, "Les Testeurs", "tst" + suffix.slice(0, 2));
    await al.sendAllianceMessage(allianceId, aId, A.pseudo, "Bienvenue");
    // allianceId renseigné par le joueur, pas écrasé par une action de jeu
    await ps.syncPlayer(aId);
    expect((await snap(aId))?.allianceId).toBe(allianceId);
    logout();
    await loginPlayer(B.pseudo, B.pw);
    const msgs = await pb.collection("alliance_messages").getFullList({ filter: `allianceId="${allianceId}"` });
    expect(msgs.length).toBe(0); // B n'est pas membre
    await expect(al.sendAllianceMessage(allianceId, bId, B.pseudo, "intrus")).rejects.toBeTruthy();
    await al.joinAlliance(bId, B.pseudo, allianceId);
    const msgs2 = await pb.collection("alliance_messages").getFullList({ filter: `allianceId="${allianceId}"` });
    expect(msgs2.length).toBe(1);
    await expect(pb.collection("alliances").update(allianceId, { name: "Pirates" })).rejects.toBeTruthy();
    // v1.9 : l'appartenance n'est écrite que par le serveur.
    await expect(pb.collection("players").update(bId, { allianceId: "autre" })).rejects.toBeTruthy();
    await expect(pb.collection("alliances").update(allianceId, { members: [bId] })).rejects.toBeTruthy();
    // B repart : les tests suivants l'opposent à A.
    await al.leaveAlliance();
    expect((await snap(bId)).allianceId).toBe("");
    expect((await pb.collection("alliance_messages").getFullList({ filter: `allianceId="${allianceId}"` })).length).toBe(0);
  });

  it("gifts are transferred immediately by the server", async () => {
    // v5.10 : comptes de plus de 3 jours ; hors alliance, 20 % de taxe de transport.
    await admin.collection("players").update(bId, { resources: { ...RICH, scrap: 5000 }, createdAtMs: MONTH_AGO() });
    await admin.collection("players").update(aId, { createdAtMs: MONTH_AGO() });
    const before = (await snap(aId))!.resources.scrap;
    await ps.sendResourceGift({ fromUid: bId, fromPseudo: B.pseudo, toUid: aId, toPseudo: A.pseudo, resources: { scrap: 1000 } });
    const b = (await snap(bId))!;
    expect(b.resources.scrap).toBeLessThan(5000 - 999 + 100); // débité (hors production des dernières secondes)
    const after = (await snap(aId))!.resources.scrap;
    expect(after - before).toBeGreaterThanOrEqual(800);
    await expect(
      ps.sendResourceGift({ fromUid: bId, fromPseudo: B.pseudo, toUid: aId, toPseudo: A.pseudo, resources: { scrap: 10_000_000 } }),
    ).rejects.toThrow(/insuffisantes/);
  });

  it("legacy gifts (old system) are credited once", async () => {
    const gift = await admin.collection("resource_gifts").create({
      fromUid: aId, fromPseudo: A.pseudo, toUid: bId, toPseudo: B.pseudo, resources: { scrap: 700 }, timestamp: Date.now(), claimed: false,
    });
    const before = (await snap(bId))!.resources.scrap;
    await Promise.all([ps.claimResourceGift(bId, gift.id), ps.claimResourceGift(bId, gift.id)]);
    await ps.claimResourceGift(bId, gift.id);
    const after = (await snap(bId))!.resources.scrap;
    expect(after - before).toBeGreaterThanOrEqual(700);
    expect(after - before).toBeLessThan(1400);
  });

  it("fleet recall: the ships turn around before impact", async () => {
    await admin.collection("players").update(bId, { createdAtMs: MONTH_AGO(), units: { chasseur: { level: 1, count: 4 } } });
    // Connecté en B, qui vise A (encore protégé débutant ? on le vieillit).
    await admin.collection("players").update(aId, { createdAtMs: MONTH_AGO() });
    await admin.collection("game_config")
      .getFirstListItem('key="rules"')
      .then((r) => admin.collection("game_config").update(r.id, { data: { ...(r.data as object), fleets: { baseMinutes: 1, minutesPerDistance: 0 } } }));
    let fleetId = "";
    try {
      const sent = await ps.sendFleet(aId, { chasseur: 4 });
      fleetId = sent.id;
      expect((await snap(bId))!.units.chasseur.count).toBe(0);
      const back = await ps.recallFleet(sent.id);
      expect(back.status).toBe("returning");
      await expect(ps.recallFleet(sent.id)).rejects.toThrow(/plus être rappelée/);
    } finally {
      await admin.collection("game_config")
        .getFirstListItem('key="rules"')
        .then((r) => admin.collection("game_config").update(r.id, { data: { ...(r.data as object), fleets: { baseMinutes: 0.03, minutesPerDistance: 0.001 } } }));
      // Remise à l'état initial : pas de délai entre B et A pour la suite.
      if (fleetId) await admin.collection("fleets").delete(fleetId);
      await admin.collection("players").update(bId, { createdAtMs: Date.now(), units: {}, lastAttackAtMs: 0 });
      await admin.collection("players").update(aId, { createdAtMs: Date.now() });
    }
  });

  it("attack is arbitrated by the server and applied to both players", async () => {
    // B est connecté. Ni l'attaquant ni le défenseur ne peuvent écrire un
    // rapport ou les champs JcJ réservés au serveur.
    await expect(
      pb.collection("battle_reports").create({ attackerUid: bId, defenderUid: aId, outcome: "attacker_win", defenderProcessed: false }),
    ).rejects.toBeTruthy();
    await expect(pb.collection("players").update(bId, { createdAtMs: 1 })).rejects.toBeTruthy();

    logout();
    await loginPlayer(A.pseudo, A.pw);
    await admin.collection("players").update(aId, { units: { chasseur: { level: 1, count: 10 } } });
    // B vient de s'inscrire : protection débutant.
    await expect(ps.sendFleet(bId, { chasseur: 5 })).rejects.toThrow(/débute/);

    await admin.collection("players").update(bId, { createdAtMs: MONTH_AGO() });
    const bBefore = (await snap(bId))!;

    // La flotte part : les vaisseaux quittent la base, B la voit arriver.
    const { sent, landed, report: res } = await attackAndResolve(bId, { chasseur: 5 });
    expect(sent.status).toBe("outbound");
    expect(res.outcome).toBe("attacker_win");
    expect(res.attackerXpDelta).toBeGreaterThan(0);
    expect((await snap(aId))?.victories).toBe(1);
    expect(landed.status).toBe("returning");

    // Le défenseur est mis à jour par le serveur, sans attendre sa connexion.
    const bAfter = (await snap(bId))!;
    expect(bAfter.defeats).toBe(1);
    expect(bAfter.lastDefeatAtMs).toBeGreaterThan(0);
    // Butin limité par la cargaison des chasseurs (6.2 : × la surcharge de pillage), retiré au défenseur.
    const looted = Object.values((res.loot ?? {}) as Record<string, number>).reduce((a, b) => a + (b ?? 0), 0);
    expect(looted).toBe(fleetCargoCapacity({ chasseur: { level: 1, count: 0 } }, landed.units) * COMBAT_RULES.lootCargoFactor);
    expect(bAfter.resources.reinforcedSteel).toBe(bBefore.resources.reinforcedSteel - (res.loot?.reinforcedSteel ?? 0));

    // Délai de 2 h (et bouclier) sur la même cible.
    await expect(ps.sendFleet(bId, { chasseur: 1 })).rejects.toThrow(/bouclier|récemment/);

    // Retour : survivants et butin rejoignent A.
    const scrapBefore = (await snap(aId))!.resources.scrap;
    await wait(Math.max(0, landed.returnAtMs - Date.now()) + 400);
    await ps.syncPlayer("");
    const aBack = (await snap(aId))!;
    expect(aBack.units.chasseur.count).toBe(5 + landed.units.chasseur);
    expect(aBack.resources.scrap).toBeGreaterThanOrEqual(scrapBefore + ((res.loot as Record<string, number>)?.scrap ?? 0));
    expect((await ps.fetchMyRecentAttacks(aId, Date.now() - 3600 * 1000))[bId]).toBeGreaterThan(0);

    const [rep] = await pb.collection("battle_reports").getFullList({ filter: `attackerUid="${aId}"` });
    expect(rep.defenderXpDelta).toBeLessThan(0);
    expect(rep.defenderApplied).toBe(true);
    expect(Object.keys(rep.attackerFleet ?? {}).length).toBeGreaterThan(0);
    expect(bAfter.xp).toBe(Math.max(0, bBefore.xp + rep.defenderXpDelta));

    // Le défenseur voit le rapport une seule fois ; rien n'est réappliqué.
    logout();
    await loginPlayer(B.pseudo, B.pw);
    await expect(pb.collection("battle_reports").update(rep.id, { defenderProcessed: true })).rejects.toBeTruthy();
    const r = await Promise.all([ps.processBattleReportForDefender(bId, rep.id), ps.processBattleReportForDefender(bId, rep.id)]);
    expect(r.filter(Boolean).length).toBe(1);
    expect(await ps.processBattleReportForDefender(bId, rep.id)).toBeNull();
    expect((await snap(bId))!.defeats).toBe(1);
    const notifs = await pb.collection("notifications").getFullList({ filter: `player_id="${bId}" && kind="combat-defender"` });
    expect(notifs.length).toBe(1);
  }, 30_000);

  it("legacy battle reports (old system) are applied when seen", async () => {
    const rep = await admin.collection("battle_reports").create({
      attackerUid: aId, attackerPseudo: A.pseudo, defenderUid: bId, defenderPseudo: B.pseudo, timestamp: Date.now() - 5000,
      outcome: "defender_win", defenderLosses: {}, loot: null, defenderProcessed: false, defenderXpDelta: 3,
    });
    const before = (await snap(bId))!;
    const seen = await ps.processBattleReportForDefender(bId, rep.id);
    expect(seen?.id).toBe(rep.id);
    const after = (await snap(bId))!;
    expect(after.victories).toBe(before.victories + 1);
    // 5.18 : l'XP de défense passe par le bonus au jeu actif (×1,25).
    expect(after.xp).toBe(before.xp + Math.round(3 * (XP_TIER_RULES.multipliers.defense ?? 1)));
    expect(await ps.processBattleReportForDefender(bId, rep.id)).toBeNull();
  });

  it("game content: only admins edit it, and the server applies it in combat", async () => {
    // Connecté en B. Un joueur normal ne peut pas modifier le contenu.
    await expect(pb.collection("game_config").create({ key: "units", data: [] })).rejects.toBeTruthy();
    expect(await checkIsAdmin(bId)).toBe(false);

    await admin.collection("admins").create({ id: bId, note: "test" });
    expect(await checkIsAdmin(bId)).toBe(true);

    // B (admin) met l'attaque du Chasseur à 0 : une attaque de chasseurs
    // contre une base sans défense devient une égalité (rien à détruire, rien à prendre).
    const units = defaultGameContent().units.map((u) => (u.id === "chasseur" ? { ...u, stats: { ...u.stats, attaque: 0 } } : u));
    await saveContentSection("units", units);
    try {
      await admin.collection("players").update(aId, { createdAtMs: MONTH_AGO(), units: {} });
      await admin.collection("players").update(bId, { units: { chasseur: { level: 1, count: 10 } } });
      const { report: res } = await attackAndResolve(aId, { chasseur: 5 });
      // 5.18 : la puissance affichée ne garde que la résistance (10 par chasseur).
      expect(res.attackerPower).toBe(5 * 10);
      expect(res.outcome).toBe("draw");
    } finally {
      await resetContentSection("units");
      await admin.collection("admins").delete(bId);
    }
  }, 30_000);

  it("v3.5.1 / 6.14.65 (AC-B) : l'admin édite un joueur par le serveur (différences sur l'état frais, plafonds, motif)", async () => {
    await ensureAB();
    await loginPlayer(B.email, B.pw);
    const edit = (body: Record<string, unknown>) => pb.send("/api/cosmic/admin/player-action", { method: "POST", body: { uid: aId, action: "edit", ...body } });
    // Joueur ordinaire : refusé.
    await expect(edit({ changes: { xp: 1 }, reason: "essai refusé" })).rejects.toMatchObject({ status: 403 });
    await expect(pb.send("/api/cosmic/admin/player-action", { method: "POST", body: { action: "resetAllXp", confirm: "RESET" } })).rejects.toMatchObject({ status: 403 });
    const before = await snap(aId);
    await admin.collection("players").update(aId, { resources: { ...before.resources, scrap: 1000 }, units: { ...before.units, chasseur: { level: 1, count: 4 } } });
    await admin.collection("admins").create({ id: bId, note: "test" });
    try {
      // L'admin du jeu n'écrit plus la fiche directement (règle d'API), même avec un motif.
      await expect(pb.collection("players").update(aId, { xp: (before.xp ?? 0) + 1, adminReason: "écriture directe" })).rejects.toBeTruthy();
      // Fiche « ouverte » par l'admin : 1 000 ferraille, 4 chasseurs. Le joueur dépense et construit entre-temps.
      const opened = await snap(aId);
      await admin.collection("players").update(aId, { resources: { ...opened.resources, scrap: 600 }, units: { ...opened.units, chasseur: { level: 1, count: 10 } } });
      // Motif obligatoire.
      await expect(edit({ changes: { resources: { scrap: 500 } } })).rejects.toMatchObject({ status: 400 });
      // Différences : +500 ferraille, -1 chasseur, +1 XP, appliqués sur l'état rattrapé (600 et 10), pas sur l'instantané.
      const out = await edit({ changes: { resources: { scrap: 500 }, units: { chasseur: { count: -1 } }, xp: 1 }, reason: "Compensation de test" });
      expect(out["resources.scrap"]).toBeTruthy();
      const after = await snap(aId);
      expect(after.resources.scrap).toBeGreaterThanOrEqual(1100);
      expect(after.resources.scrap).toBeLessThan(1400);
      expect(after.units.chasseur.count).toBe(9);
      expect(after.xp).toBe((opened.xp ?? 0) + 1);
      const log = await admin.collection("admin_logs").getFirstListItem(`recordId="${aId}" && reason = "Compensation de test"`, { sort: "-createdAtMs" });
      expect(log.action).toBe("joueur : édition");
      expect(Object.keys(log.changes)).toEqual(expect.arrayContaining(["resources.scrap", "units.chasseur", "xp"]));
      const note = await admin.collection("notifications").getFirstListItem(`player_id="${aId}" && title="Empire ajusté par l'équipe"`);
      expect(note.message).toContain("Compensation de test");
      // Plafonds : entrepôt, hangar, niveau maximal ; rien n'est écrit sur un refus.
      await expect(edit({ changes: { resources: { scrap: 900_000_000_000 } }, reason: "plafond entrepôt" })).rejects.toMatchObject({ status: 400, response: { message: expect.stringMatching(/Entrepôt/) } });
      await expect(edit({ changes: { units: { chasseur: { count: 900_000_000 } } }, reason: "plafond hangar" })).rejects.toMatchObject({ status: 400, response: { message: expect.stringMatching(/Hangar d'attaque/) } });
      await expect(edit({ changes: { buildings: { extracteur_ferraille: { level: 10_000 } } }, reason: "plafond niveau" })).rejects.toMatchObject({ status: 400 });
      await expect(edit({ changes: {}, reason: "rien du tout" })).rejects.toMatchObject({ status: 400 });
      expect((await snap(aId)).units.chasseur.count).toBe(9);

      // Remise à zéro de l'XP de tous les joueurs : une transaction côté serveur, confirmation exigée.
      const all = await admin.collection("players").getFullList({ fields: "id,xp,seasonXp" });
      await expect(pb.send("/api/cosmic/admin/player-action", { method: "POST", body: { action: "resetAllXp", confirm: "non" } })).rejects.toMatchObject({ status: 400 });
      try {
        const reset = await pb.send("/api/cosmic/admin/player-action", { method: "POST", body: { action: "resetAllXp", confirm: "RESET" } });
        expect(reset.players).toBeGreaterThanOrEqual(1);
        const zero = await admin.collection("players").getFullList({ fields: "id,xp,seasonXp" });
        expect(zero.every((p) => (p.xp ?? 0) === 0 && (p.seasonXp ?? 0) === 0)).toBe(true);
      } finally {
        for (const p of all) if (p.xp || p.seasonXp) await admin.collection("players").update(p.id, { xp: p.xp ?? 0, seasonXp: p.seasonXp ?? 0 });
      }
    } finally {
      await admin.collection("players").update(aId, { xp: before.xp, resources: before.resources, units: before.units });
      await admin.collection("admins").delete(bId);
    }
  });

  it("6.14.23 illustrations: only game admins drop Midjourney renders", async () => {
    await ensureAB();
    await loginPlayer(B.email, B.pw);
    // Image PNG minimale (1 × 1).
    const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
    const form = () => {
      const f = new FormData();
      f.append("file", new Blob([png], { type: "image/png" }), "fs0ciety_sci-fi_game_item_icon_test.png");
      f.append("fileName", "fs0ciety_sci-fi_game_item_icon_test.png");
      f.append("status", "envoyée");
      return f;
    };
    await expect(pb.collection("illustration_uploads").create(form())).rejects.toBeTruthy();
    await expect(pb.collection("illustration_uploads").getFullList()).resolves.toEqual([]);
    await admin.collection("admins").create({ id: bId, note: "test" });
    try {
      const rec = await pb.collection("illustration_uploads").create(form());
      expect(rec).toMatchObject({ status: "envoyée", fileName: "fs0ciety_sci-fi_game_item_icon_test.png" });
      expect((await pb.collection("illustration_uploads").getFullList()).map((r) => r.id)).toContain(rec.id);
      await admin.collection("illustration_uploads").delete(rec.id);
    } finally {
      await admin.collection("admins").delete(bId);
    }
  });

  it("6.14.32 decisions: only game admins answer and read", async () => {
    await ensureAB();
    await loginPlayer(B.email, B.pw);
    const answer = { qid: "Q1", choice: "valide", note: "", answeredAtMs: Date.now(), answeredBy: bId };
    await expect(pb.collection("decision_answers").create(answer)).rejects.toBeTruthy();
    await expect(pb.collection("decision_answers").getFullList()).resolves.toEqual([]);
    await admin.collection("admins").create({ id: bId, note: "test" });
    try {
      const rec = await pb.collection("decision_answers").create(answer);
      expect(rec).toMatchObject({ qid: "Q1", choice: "valide" });
      expect((await pb.collection("decision_answers").getFullList()).map((r) => r.id)).toContain(rec.id);
      await admin.collection("decision_answers").delete(rec.id);
    } finally {
      await admin.collection("admins").delete(bId);
    }
  });

  it("6.14.42 : documents en direct (live_docs) lisibles par les admins du jeu seulement, unicité du chemin", async () => {
    await ensureAB();
    await loginPlayer(B.email, B.pw);
    const path = `docs/test-${Date.now()}.md`;
    const doc = await admin.collection("live_docs").create({ path, content: "# Essai\n\nTexte long : " + "x".repeat(20000), updatedAtMs: Date.now(), source: "itest" });
    try {
      await expect(pb.collection("live_docs").getFullList()).resolves.toEqual([]);
      await expect(pb.collection("live_docs").create({ path: "docs/autre.md", content: "pirate" })).rejects.toBeTruthy();
      await expect(admin.collection("live_docs").create({ path, content: "doublon" })).rejects.toBeTruthy();
      await admin.collection("admins").create({ id: bId, note: "test" });
      try {
        const list = await pb.collection("live_docs").getFullList({ filter: pb.filter("path = {:p}", { p: path }) });
        expect(list.map((r) => r.content.length)).toEqual([doc.content.length]);
      } finally {
        await admin.collection("admins").delete(bId);
      }
    } finally {
      await admin.collection("live_docs").delete(doc.id);
    }
  });

  it("admin routes exist (statistics, season closing)", async () => {
    const stats = await admin.send("/api/cosmic/admin/stats", { method: "GET" });
    expect(stats).toBeTruthy();
    await expect(pb.send("/api/cosmic/admin/stats", { method: "GET" })).rejects.toMatchObject({ status: 403 });
  });

  it("v5.14.2 : l'administration alimente le pot commun (motif obligatoire, réservé aux admins)", async () => {
    const before = await admin.send("/api/cosmic/admin/serverpot", { method: "GET" });
    await expect(admin.send("/api/cosmic/admin/serverpot", { method: "POST", body: { action: "deposit", resources: { scrap: 1000 }, note: "" } })).rejects.toMatchObject({ status: 400 });
    await expect(pb.send("/api/cosmic/admin/serverpot", { method: "POST", body: { action: "deposit", resources: { scrap: 1000 }, note: "triche" } })).rejects.toMatchObject({ status: 403 });
    const after = await admin.send("/api/cosmic/admin/serverpot", { method: "POST", body: { action: "deposit", resources: { scrap: 1000, inconnu: 5 }, note: "Test d'intégration" } });
    expect((after.resources.scrap ?? 0) - (before.resources.scrap ?? 0)).toBe(1000);
    expect(after.resources.inconnu).toBeUndefined();
    expect(after.log[after.log.length - 1]).toMatchObject({ source: "admin", note: "Test d'intégration", resources: { scrap: 1000 } });
  });

  it("leaderboard lists players without private fields", async () => {
    const list = await ps.listAllPlayers();
    expect(list.some((p) => p.uid === aId)).toBe(true);
  });

  it("v1.7 spy mission: tiered report, hidden from the target", async () => {
    // Connecté en B.
    await admin.collection("players").update(bId, { units: { sonde_espionnage: { level: 5, count: 4 } }, techLevels: { tech20: 5 } });
    await admin.collection("players").update(aId, { units: {}, techLevels: {} });
    await expect(ps.sendFleet(aId, { chasseur: 1 }, "spy")).rejects.toThrow(/sondes|assez/);
    const sent = await ps.sendFleet(aId, { sonde_espionnage: 4 }, "spy");
    expect(sent.mission).toBe("spy");
    await wait(Math.max(0, sent.arriveAtMs - Date.now()) + 400);
    await ps.syncPlayer("");
    const landed = await pb.collection("fleets").getOne(sent.id);
    expect(landed.reportId).toBeTruthy();
    const report = await ps.fetchSpyReport(landed.reportId);
    // Score = 5 − 0 + log2(4) = 7 : rapport complet.
    expect(report?.tier).toBe(4);
    expect(report?.data?.resources).toBeDefined();
    expect(report?.data?.buildings).toBeDefined();
    expect(Array.isArray(report?.data?.fleets)).toBe(true);
    expect((await ps.fetchLatestSpyReport(bId, aId))?.id).toBe(report?.id);
    // Espionner ne déclenche pas le délai entre deux attaques.
    expect((await ps.fetchMyRecentAttacks(bId, Date.now() - 60_000))[aId] ?? 0).toBeLessThan(sent.departAtMs);
    if (!report?.detected) {
      logout();
      await loginPlayer(A.pseudo, A.pw);
      await expect(pb.collection("spy_reports").getOne(report!.id)).rejects.toMatchObject({ status: 404 });
      await expect(pb.collection("fleets").getOne(sent.id)).rejects.toMatchObject({ status: 404 });
      logout();
      await loginPlayer(B.pseudo, B.pw);
    }
    await admin.collection("fleets").delete(sent.id);
  }, 30_000);

  it("v1.7 debris: ships destroyed in combat leave a field, recyclers collect it", async () => {
    // Connecté en B. On efface le délai B → A laissé par le test précédent.
    for (const r of await admin.collection("battle_reports").getFullList({ filter: `attackerUid="${bId}"` })) await admin.collection("battle_reports").delete(r.id);
    for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}"` })) await admin.collection("fleets").delete(f.id);
    await admin.collection("players").update(aId, { createdAtMs: MONTH_AGO(), units: { fregate: { level: 1, count: 200 } } });
    await admin.collection("players").update(bId, { createdAtMs: MONTH_AGO(), units: { chasseur: { level: 1, count: 40 }, drone_recuperateur: { level: 1, count: 3 } } });
    const { report } = await attackAndResolve(aId, { chasseur: 40 });
    const lost = { ...(report.attackerLosses ?? {}), ...(report.defenderLosses ?? {}) };
    const destroyed = Object.values(lost as Record<string, number>).some((n) => n > 0);
    const field = await pb.collection("debris_fields").getOne(aId).catch(() => null);
    if (destroyed) {
      expect(field?.scrap).toBeGreaterThan(0);
      expect(field?.expiresAtMs).toBeGreaterThan(Date.now() + 47 * 3600_000);
    }
    await expect(pb.collection("debris_fields").update(aId, { scrap: 1 })).rejects.toBeTruthy();

    // Champ connu pour un ramassage déterministe. 5.16 : capacité = CAP du drone (10 × niv. 1) × 2 drones = 20.
    if (field) await admin.collection("debris_fields").update(aId, { scrap: 1000, energy: 500 });
    else await admin.collection("debris_fields").create({ id: aId, locationPseudo: A.pseudo, scrap: 1000, energy: 500, expiresAtMs: Date.now() + 3600_000, updatedAtMs: Date.now() });
    await expect(ps.sendFleet(aId, { chasseur: 1 }, "recycle")).rejects.toThrow(/Drones|assez/);
    const sent = await ps.sendFleet(aId, { drone_recuperateur: 2 }, "recycle");
    await wait(Math.max(0, sent.arriveAtMs - Date.now()) + 400);
    await ps.syncPlayer("");
    const landed = await pb.collection("fleets").getOne(sent.id);
    expect(landed.loot).toEqual({ scrap: 13, energy: 7 });
    const left = await admin.collection("debris_fields").getOne(aId);
    expect([left.scrap, left.energy]).toEqual([987, 493]);
    const before = (await snap(bId)).resources.scrap;
    await wait(Math.max(0, landed.returnAtMs - Date.now()) + 400);
    await ps.syncPlayer("");
    const back = await snap(bId);
    expect(back.resources.scrap).toBeGreaterThanOrEqual(before + 13);
    expect(back.units.drone_recuperateur.count).toBe(3);
    await admin.collection("debris_fields").delete(aId);
  }, 30_000);

  it("v1.7 patrol: ships leave the base, upkeep prepaid, recall halfway", async () => {
    await admin.collection("players").update(bId, { units: { chasseur: { level: 1, count: 10 } }, resources: RICH });
    await expect(ps.sendFleet(bId, { chasseur: 10 }, "patrol", { minutes: 10 })).rejects.toThrow(/entre/);
    const energyBefore = (await snap(bId)).resources.energy;
    const sent = await ps.sendFleet(aId, { chasseur: 10 }, "patrol", { minutes: 30 }); // la cible est ignorée : patrouille chez soi
    expect(sent.targetUid).toBe(bId);
    expect(sent.arriveAtMs - sent.departAtMs).toBe(15 * 60_000);
    const during = await snap(bId);
    expect(during.units.chasseur.count).toBe(0);
    expect(during.resources.energy).toBeLessThan(energyBefore);
    const back = await ps.recallFleet(sent.id);
    expect(back.status).toBe("returning");
    await admin.collection("fleets").delete(sent.id);
  }, 30_000);

  it("v1.8 season closing: archived standings, rewards and titles", async () => {
    // Connecté en B. Saison fictive pour ne pas dépendre de la date du jour.
    const SEASON = "1999-12";
    const clean = async () => {
      for (const r of await admin.collection("season_results").getFullList({ filter: `seasonId="${SEASON}"` })) await admin.collection("season_results").delete(r.id);
      for (const p of await admin.collection("players").getFullList({ filter: `seasonId="${SEASON}" || lastSeasonId="${SEASON}"` })) {
        await admin.collection("players").update(p.id, { seasonId: "", seasonXp: 0, lastSeasonId: "", lastSeasonXp: 0 });
      }
    };
    await clean();
    try {
      await admin.collection("players").update(aId, { lastSeasonId: SEASON, lastSeasonXp: 500, titles: [], activeTitle: "" });
      await admin.collection("players").update(bId, { seasonId: SEASON, seasonXp: 200, titles: [], activeTitle: "" });
      const aBefore = await snap(aId);
      await expect(pb.send("/api/cosmic/admin/close-season", { method: "POST", body: { seasonId: SEASON } })).rejects.toMatchObject({ status: 403 });
      const out = await admin.send("/api/cosmic/admin/close-season", { method: "POST", body: { seasonId: SEASON } });
      expect(out).toMatchObject({ closed: true, ranked: 2, rewarded: 2 });
      expect((await admin.send("/api/cosmic/admin/close-season", { method: "POST", body: { seasonId: SEASON } })).closed).toBe(false);

      const results = await pb.collection("season_results").getFullList({ filter: `seasonId="${SEASON}" && kind="player"`, sort: "rank" });
      expect(results.map((r) => [r.uid, r.rank])).toEqual([[aId, 1], [bId, 2]]);
      const aAfter = await snap(aId);
      // 5.15.4 : champion = 50 jetons, 200 Ambre, 500 M de chaque commune (+ participation : 15, 35, 10 M).
      expect(aAfter.resources.scrap).toBeGreaterThanOrEqual(aBefore.resources.scrap + 510_000_000);
      expect(aAfter.casino?.tokens ?? 0).toBeGreaterThanOrEqual((aBefore.casino?.tokens ?? 0) + 65);
      expect(aAfter.bounties?.amber ?? 0).toBe((aBefore.bounties?.amber ?? 0) + 235);
      expect(aAfter.activeTitle).toBe("Champion du mois de décembre 1999");
      // A reçoit sa récompense individuelle et celle de son alliance championne.
      const notif = await admin.collection("notifications").getFullList({ filter: `player_id="${aId}" && kind="season"` });
      // Individuelle et alliance championne (5.15 : les divisions se clôturent le lundi, plus avec la saison).
      expect(notif.length).toBe(2);
      expect(aAfter.titles.map((t: { label: string }) => t.label)).toContain("Allié champion de Décembre 1999");
      expect((await pb.collection("season_results").getFullList({ filter: `seasonId="${SEASON}" && kind="alliance"` }))[0]?.allianceId).toBe(allianceId);

      // B choisit son titre, pas celui d'un autre ; il est public.
      // B, 2e et seul du podium : tout le lot du podium + la participation, pas de titre.
      const bAfter = await snap(bId);
      expect(bAfter.bounties?.amber ?? 0).toBeGreaterThanOrEqual(135);
      await expect(ps.setActiveTitle("Champion du mois de décembre 1999")).rejects.toThrow(/gagné/);
      await expect(pb.collection("players").update(bId, { activeTitle: "Tricheur" })).rejects.toBeTruthy();
      await ps.setActiveTitle("");
      await expect(admin.send("/api/cosmic/admin/close-season", { method: "POST", body: { seasonId: "2999-01" } })).rejects.toMatchObject({ status: 400 });
    } finally {
      await clean();
    }
  });

  it("v1.8 events: a scheduled event is applied by the server", async () => {
    const rules = await admin.collection("game_config").getFirstListItem('key="rules"');
    const data = rules.data as Record<string, unknown>;
    const now = Date.now();
    await admin.collection("game_config").update(rules.id, {
      data: { ...data, events: { rotationEnabled: false, scheduled: [{ id: "t", type: "chantiers_acceleres", startMs: now - 3600_000, endMs: now + 3600_000 }] } },
    });
    try {
      await admin.collection("players").update(bId, { resources: { ...RICH, scrap: 10_000_000, energy: 10_000_000, nano: 10_000_000 } });
      await admin.collection("queues").update(bId, { buildingUpgrades: {} });
      const level = (await snap(bId)).buildings.extracteur_ferraille.level;
      const before = Date.now();
      await ps.startBuildingUpgrade(bId, "extracteur_ferraille");
      const queues = await admin.collection("queues").getOne(bId);
      const full = getBuildingUpgradeTime(findBuilding("extracteur_ferraille")!, level + 1) * 1000;
      const took = queues.buildingUpgrades.extracteur_ferraille.endTime - before;
      expect(took).toBeLessThan(full * 0.75 + 2000);
      expect(took).toBeGreaterThan(full * 0.75 - 2000);
    } finally {
      await admin.collection("game_config").update(rules.id, { data });
    }
  });

  it("v1.9 alliances: treasury, research, garrison, intel", async () => {
    // Connecté en B ; A (fondateur) agit avec son propre client.
    const aClient = new PocketBase(PB_TEST_URL);
    await aClient.collection("users").authWithPassword(A.email, A.pw);
    const asA = (body: Record<string, unknown>) => aClient.send("/api/cosmic/alliance", { method: "POST", body });
    const cEmail = `c${suffix}@test.dev`;
    let cId = "";
    const cleanup: string[] = [];
    try {
      await al.joinAlliance(bId, B.pseudo, allianceId);
      expect((await pb.collection("profiles").getOne(bId)).allianceId).toBe(allianceId);

      // Trésor : dépôt libre, versements par le fondateur limités à 20 %.
      await admin.collection("players").update(bId, { resources: RICH });
      await al.depositToTreasury({ scrap: 1000 });
      expect(((await pb.collection("alliances").getOne(allianceId)).treasury as Record<string, number>).scrap).toBe(1000);
      // v5.10.5 : droits par rôle (« Trésor »).
      await expect(al.distributeTreasury(bId, { scrap: 10 })).rejects.toThrow(/Trésor/);
      await expect(asA({ type: "distribute", targetUid: bId, resources: { scrap: 201 } })).rejects.toMatchObject({ status: 400 });
      const before = (await snap(bId)).resources.scrap;
      await asA({ type: "distribute", targetUid: bId, resources: { scrap: 200 } });
      expect((await snap(bId)).resources.scrap).toBeGreaterThanOrEqual(before + 200);
      const logs = await pb.collection("alliance_logs").getFullList({ filter: `allianceId="${allianceId}"` });
      expect(logs.map((l) => l.kind)).toEqual(expect.arrayContaining(["deposit", "distribute", "join"]));

      // Recherche : payée par le trésor, bonus recopié chez les membres.
      const huge = Object.fromEntries(Object.keys(RICH).map((k) => [k, 500_000_000]));
      await admin.collection("alliances").update(allianceId, { treasury: huge });
      await asA({ type: "research", researchId: "industrie" });
      const running = await admin.collection("alliances").getOne(allianceId);
      expect(running.activeResearch.id).toBe("industrie");
      await admin.collection("alliances").update(allianceId, { activeResearch: { ...running.activeResearch, endTime: Date.now() - 1 }, researchEndMs: Date.now() - 1 });
      await al.depositToTreasury({ scrap: 1 }); // toute action d'alliance termine la recherche due
      expect((await snap(bId)).allianceResearch).toEqual({ industrie: 1 });
      expect((await snap(aId)).allianceResearch).toEqual({ industrie: 1 });

      // v3.3 Projets : don personnel (plafonné), trésor par le fondateur, construction puis bonus.
      await admin.collection("players").update(bId, { resources: RICH });
      await expect(al.fundAllianceProject("forge", "treasury", { scrap: 1 })).rejects.toThrow(/trésor/);
      const scrapBefore = (await snap(bId)).resources.scrap;
      await al.fundAllianceProject("forge", "self", { scrap: 1000 });
      expect((await snap(bId)).resources.scrap).toBeLessThan(scrapBefore - 900);
      const cost = Object.fromEntries(Object.keys(RICH).map((k) => [k, k === "scrap" ? 499_999_000 : k.length > 6 ? 5_000_000 : 500_000_000]));
      await admin.collection("alliances").update(allianceId, { treasury: Object.fromEntries(Object.keys(RICH).map((k) => [k, 600_000_000])) });
      await asA({ type: "project", projectId: "forge", source: "treasury", resources: cost });
      const building = await admin.collection("alliances").getOne(allianceId);
      expect(building.projects.forge.buildEndMs).toBeGreaterThan(Date.now());
      expect(building.projectContributors[bId]).toBe(1000);
      await admin.collection("alliances").update(allianceId, { projects: { forge: { ...building.projects.forge, buildEndMs: Date.now() - 1 } }, researchEndMs: Date.now() - 1 });
      await al.depositToTreasury({ scrap: 1 });
      expect((await snap(bId)).allianceResearch).toEqual({ industrie: 1, projet_forge: 1 });
      expect((await admin.collection("alliances").getOne(allianceId)).researchEndMs).toBe(0);

      // On n'attaque pas un allié.
      await admin.collection("players").update(bId, { units: { chasseur: { level: 1, count: 60 } }, createdAtMs: MONTH_AGO() });
      await expect(ps.sendFleet(aId, { chasseur: 1 })).rejects.toThrow(/alliance/);

      // Garnison de B chez A, puis C attaque A : la garnison combat.
      const g = await ps.sendFleet(aId, { chasseur: 50 }, "garrison", { hours: 1 });
      cleanup.push(g.id);
      await wait(Math.max(0, g.arriveAtMs - Date.now()) + 400);
      await ps.syncPlayer("");
      expect((await pb.collection("fleets").getOne(g.id)).status).toBe("stationed");
      expect((await aClient.collection("fleets").getOne(g.id)).mission).toBe("garrison"); // A voit sa garnison

      const cUser = await admin.collection("users").create({ username: `charlie_${suffix}`, name: `Charlie_${suffix}`, email: cEmail, password: "motdepasse3", passwordConfirm: "motdepasse3" });
      cId = cUser.id;
      const cClient = new PocketBase(PB_TEST_URL);
      await cClient.collection("users").authWithPassword(cEmail, "motdepasse3");
      await cClient.send("/api/cosmic/init", { method: "POST" });
      await admin.collection("players").update(cId, { createdAtMs: MONTH_AGO(), xp: (await snap(aId)).xp, units: { chasseur: { level: 1, count: 10 } } });
      await admin.collection("players").update(aId, { createdAtMs: MONTH_AGO(), lastDefeatAtMs: 0, units: {} });
      const attack = (await cClient.send("/api/cosmic/fleet/send", { method: "POST", body: { targetUid: aId, fleet: { chasseur: 10 } } })) as { id: string; arriveAtMs: number };
      cleanup.push(attack.id);
      await wait(Math.max(0, attack.arriveAtMs - Date.now()) + 400);
      await cClient.send("/api/cosmic/action", { method: "POST", body: { type: "sync" } });
      const landed = await admin.collection("fleets").getOne(attack.id);
      const report = await admin.collection("battle_reports").getOne(landed.reportId);
      expect(report.outcome).toBe("defender_win");
      expect(report.garrisons).toHaveLength(1);
      expect(report.garrisons[0].ownerUid).toBe(bId);

      // Renseignement : B voit le combat subi par A.
      const intel = await al.fetchAllianceIntel();
      expect(intel.some((i) => i.id === report.id)).toBe(true);

      // Rappel de la garnison.
      expect((await ps.recallFleet(g.id)).status).toBe("returning");
    } finally {
      for (const id of cleanup) await admin.collection("fleets").delete(id).catch(() => {});
      if (cId) {
        await admin.collection("players").delete(cId).catch(() => {});
        await admin.collection("users").delete(cId).catch(() => {});
      }
      await al.leaveAlliance().catch(() => {});
    }
    expect((await snap(bId)).allianceId).toBe("");
    expect((await snap(bId)).allianceResearch).toEqual({});
  }, 60_000);

  it("hard reset of one player, with a backup first", async () => {
    // Connecté en B (joueur normal) : refusé.
    await expect(pb.send("/api/cosmic/admin/reset", { method: "POST", body: { scope: "player", uid: bId, confirm: B.pseudo } })).rejects.toMatchObject({ status: 403 });
    await admin.collection("players").update(bId, { units: { chasseur: { level: 3, count: 99 } }, techLevels: { tech1: 5 }, xp: 777, resources: RICH });
    await expect(
      admin.send("/api/cosmic/admin/reset", { method: "POST", body: { scope: "player", uid: bId, confirm: "mauvais" } }),
    ).rejects.toMatchObject({ status: 400 });
    const out = await admin.send("/api/cosmic/admin/reset", {
      method: "POST",
      body: { scope: "player", uid: bId, confirm: B.pseudo, options: { xp: true, starterKit: { scrap: 5000, reinforcedSteel: 50 } } },
    });
    expect(out.players).toBe(1);
    expect(out.backup).toMatch(/^avant_reset_\d{12}\.zip$/);
    const backups = await admin.backups.getFullList();
    expect(backups.some((b) => b.key === out.backup)).toBe(true);
    await admin.backups.delete(out.backup);

    const b = await snap(bId);
    expect(b.units).toEqual({});
    expect(b.techLevels).toEqual({});
    expect(b.xp).toBe(0);
    expect(b.resources.scrap).toBeGreaterThanOrEqual(5100);
    expect(b.resources.scrap).toBeLessThan(5200);
    expect(b.resources.reinforcedSteel).toBe(50);
    expect(b.createdAtMs).toBeGreaterThan(Date.now() - 60_000);
    const a = await snap(aId);
    expect(a.xp).toBeGreaterThan(0); // les autres joueurs ne bougent pas
    const notes = await admin.collection("notifications").getFullList({ filter: `player_id="${bId}"` });
    expect(notes.map((n) => n.title)).toEqual(["Nouvelle ère : la galaxie repart de zéro"]);
  }, 60_000);

  it("v2.0/2.1 factions: Varan ultimatum, refused raid repelled, tribute paid, lair assault", async () => {
    // Connecté en B.
    await expect(pb.send("/api/cosmic/admin/pirates", { method: "POST", body: { uid: bId, force: true } })).rejects.toMatchObject({ status: 403 });
    await admin.collection("players").update(bId, { pirates: null, resources: RICH, units: { canon_plasma: { level: 1, count: 80 }, chasseur: { level: 3, count: 3000 } } });
    const varan = async () => (await snap(bId)).pirates.varan;
    const force = (factionId: string) => admin.send("/api/cosmic/admin/pirates", { method: "POST", body: { uid: bId, factionId, force: true } });
    try {
      expect((await force("varan")).changed).toBe(1);
      const u = (await varan()).ultimatum;
      expect(u.expiresAtMs).toBeGreaterThan(Date.now());
      await expect(pb.collection("players").update(bId, { pirates: { varan: { ultimatum: null } } })).rejects.toBeTruthy();
      // Une seule menace à la fois.
      expect((await force("gravhorn")).changed).toBe(0);

      // Refus : le Silencieux part, B voit le raid arriver puis le repousse.
      const refused = await ps.answerPirateUltimatum("refuse");
      expect(refused.raid).toMatchObject({ factionId: "varan" });
      // 6.14.21 (H29-2) : liste filtrée sur la faction et triée (ordre non garanti sinon).
      const raid = (await pb.collection("fleets").getFullList({ filter: `targetUid="${bId}" && mission="pirate" && factionId="varan"`, sort: "-departAtMs" }))[0];
      expect(raid).toMatchObject({ status: "outbound", factionId: "varan", ownerPseudo: "Le Silencieux" });
      await wait(Math.max(0, refused.raid!.arriveAtMs - Date.now()) + 400);
      await ps.syncPlayer("");
      const report = (await pb.collection("battle_reports").getFullList({ filter: `defenderUid="${bId}" && attackerUid="pirates"`, sort: "-timestamp" }))[0];
      expect(report.outcome).toBe("defender_win");
      const afterRaid = await varan();
      expect(afterRaid).toMatchObject({ raidsWon: 1, notoriety: 1, repelled: 1, ultimatum: null });

      // Deuxième ultimatum : B paie.
      await admin.collection("players").update(bId, { pirates: { varan: { ...afterRaid, raidUntilMs: 0 } } });
      await force("varan");
      const scrapBefore = (await snap(bId)).resources.scrap;
      expect((await ps.answerPirateUltimatum("pay")).raid).toBeNull();
      expect((await snap(bId)).resources.scrap).toBeLessThan(scrapBefore);
      expect((await varan()).tributesPaid).toBe(1);
      await expect(ps.answerPirateUltimatum("pay")).rejects.toThrow(/Aucun ultimatum/);

      // Repaire : fermé, puis localisé et pris d'assaut.
      await expect(ps.sendFleet("lair_varan", { chasseur: 10 }, "lair")).rejects.toThrow(/localisé/);
      await admin.collection("players").update(bId, { pirates: { varan: { ...(await varan()), lairOpen: true, repelled: 5 } } });
      // v5.4 : le repaire vaut 1,05 × l'attaque de la flotte à quai : toute la flotte en formation d'assaut (+10 %).
      const assault = await ps.sendFleet("lair_varan", { chasseur: (await snap(bId)).units.chasseur.count }, "lair", { formation: "assault" });
      expect(assault.power).toBeGreaterThan(0);
      await wait(Math.max(0, assault.arriveAtMs - Date.now()) + 400);
      await ps.syncPlayer("");
      const landed = await pb.collection("fleets").getOne(assault.id);
      expect(landed).toMatchObject({ outcome: "attacker_win", factionId: "varan" });
      const final = await snap(bId);
      expect(final.pirates.varan).toMatchObject({ lairOpen: false, lairsTaken: 1, notoriety: 0 });
      expect(final.titles.map((t: { label: string }) => t.label)).toContain("Fléau de la Confrérie");
    } finally {
      for (const f of await admin.collection("fleets").getFullList({ filter: `targetUid="${bId}" || ownerUid="${bId}"` })) await admin.collection("fleets").delete(f.id);
      await admin.collection("players").update(bId, { pirates: null });
    }
  }, 60_000);

  it("v2.3 achievements: stats written by the server, rewards, rates route; Cartel prices on the stock", async () => {
    // Connecté en B.
    await admin.collection("players").update(bId, { resources: RICH, stats: null, unlockedAchievements: [], pirates: null, createdAtMs: MONTH_AGO() });
    try {
      // Un client ne peut pas écrire ses statistiques.
      await expect(pb.collection("players").update(bId, { stats: { traded: 1e9 } })).rejects.toBeTruthy();
      await ps.tradeResources(bId, "scrap", "energy", 5000);
      const after = await snap(bId);
      expect(after.stats.traded).toBe(5000);
      // Rattrapage : les succès déjà mérités sont attribués d'un coup.
      expect(after.unlockedAchievements.length).toBeGreaterThan(0);
      const rates = await pb.send("/api/cosmic/achievements", { method: "GET" });
      expect(rates.players).toBeGreaterThan(0);
      expect(Object.keys(rates.counts).length).toBeGreaterThan(0);

      // Cartel Néon : tribut = 15 % du stock exposé.
      expect((await admin.send("/api/cosmic/admin/pirates", { method: "POST", body: { uid: bId, factionId: "cartel", force: true } })).changed).toBe(1);
      const p = await snap(bId);
      expect(p.pirates.cartel.ultimatum.tribute.scrap).toBeGreaterThan(0);
      expect(p.stats.ultimatums).toBe(1);
      expect(p.stats.threatenedBy).toEqual(["cartel"]);
    } finally {
      await admin.collection("players").update(bId, { pirates: null });
    }
  }, 60_000);

  it("v2.5 maintenance: players blocked (actions, sign-up), admins pass, ultimatums extended at the end", async () => {
    // Connecté en B.
    const now = Date.now();
    await admin.collection("players").update(bId, {
      resources: RICH,
      pirates: { varan: { notoriety: 1, ultimatum: { tribute: { scrap: 10 }, issuedAtMs: now - 1000, expiresAtMs: now + 3_600_000 } } },
    });
    const on = await admin.send("/api/cosmic/admin/maintenance", { method: "POST", body: { enabled: true, version: "9.9.9", endsAtMs: now + 600_000 } });
    try {
      expect(on).toMatchObject({ enabled: true, version: "9.9.9" });
      // Un joueur ne peut pas activer la maintenance.
      await expect(pb.send("/api/cosmic/admin/maintenance", { method: "POST", body: { enabled: false } })).rejects.toMatchObject({ status: 403 });
      await expect(ps.tradeResources(bId, "scrap", "energy", 100)).rejects.toThrow(/maintenance/);
      await expect(pb.collection("players").update(bId, { pseudo: "Pendant" })).rejects.toMatchObject({ status: 503 });
      const anon = new PocketBase(PB_TEST_URL!);
      await expect(
        anon.collection("users").create({ email: `mt${now}@test.dev`, password: "motdepasse1", passwordConfirm: "motdepasse1" }),
      ).rejects.toMatchObject({ status: 503 });
      // Lecture publique de l'état, écriture d'un administrateur.
      expect((await anon.collection("game_config").getFirstListItem('key="maintenance"')).data.enabled).toBe(true);
      await admin.collection("players").update(bId, { resources: RICH });
      await wait(1100);
    } finally {
      const off = await admin.send("/api/cosmic/admin/maintenance", { method: "POST", body: { enabled: false } });
      expect(off.enabled).toBe(false);
      expect(off.extended).toBeGreaterThanOrEqual(1);
    }
    const p = await snap(bId);
    expect(p.pirates.varan.ultimatum.expiresAtMs).toBeGreaterThan(now + 3_600_000 + 1000);
    await ps.tradeResources(bId, "scrap", "energy", 100);
    await admin.collection("players").update(bId, { pirates: null });
  }, 30_000);

  it("v2.5 admins and staff: only admins manage them, role badge and title, never yourself", async () => {
    // Connecté en B (joueur).
    await expect(pb.send("/api/cosmic/admin/admins", { method: "GET" })).rejects.toMatchObject({ status: 403 });
    await expect(pb.send("/api/cosmic/admin/admins", { method: "POST", body: { action: "add", uid: bId } })).rejects.toMatchObject({ status: 403 });
    await admin.collection("players").update(bId, { titles: [], activeTitle: "" });
    // Base vierge (CI) : un autre administrateur doit exister pour pouvoir retirer B.
    const guardian = (await admin.collection("admins").getFullList()).length === 0 ? await admin.collection("admins").create({ id: aId, note: "test" }) : null;
    const added = await admin.send("/api/cosmic/admin/admins", { method: "POST", body: { action: "add", uid: bId, note: "test", role: "developer" } });
    try {
      expect(added.admins.some((a: { id: string; note: string; role: string }) => a.id === bId && a.note === "test" && a.role === "developer")).toBe(true);
      // Badge public (game_config « staff ») et titre affiché d'office.
      const staff = await new PocketBase(PB_TEST_URL!).collection("game_config").getFirstListItem('key="staff"');
      expect(staff.data.roles[bId]).toBe("developer");
      let p = await snap(bId);
      expect(p.activeTitle).toBe("Développeur");
      await admin.send("/api/cosmic/admin/admins", { method: "POST", body: { action: "role", uid: bId, role: "admin" } });
      p = await snap(bId);
      expect(p.activeTitle).toBe("Administrateur");
      expect(p.titles.map((t: { label: string }) => t.label)).toEqual(["Administrateur"]);
      // B est maintenant admin : il lit la liste mais ne peut pas se retirer lui-même.
      expect((await pb.send("/api/cosmic/admin/admins", { method: "GET" })).admins.length).toBeGreaterThan(0);
      await expect(pb.send("/api/cosmic/admin/admins", { method: "POST", body: { action: "remove", uid: bId } })).rejects.toMatchObject({ status: 400 });
      await expect(admin.send("/api/cosmic/admin/admins", { method: "POST", body: { action: "add", uid: bId } })).rejects.toMatchObject({ status: 400 });
    } finally {
      await admin.send("/api/cosmic/admin/admins", { method: "POST", body: { action: "remove", uid: bId } });
      if (guardian) await admin.collection("admins").delete(guardian.id);
    }
    const after = await snap(bId);
    expect(after.titles ?? []).toEqual([]);
    expect(after.activeTitle ?? "").toBe("");
    await expect(pb.send("/api/cosmic/admin/admins", { method: "GET" })).rejects.toMatchObject({ status: 403 });
  });

  it("v2.7 reports: created by the player, private, quota, staff replies notify the player", async () => {
    // Connecté en B.
    const form = new FormData();
    form.append("reporterId", bId);
    form.append("category", "display");
    form.append("title", "Menu bloqué");
    form.append("description", "Le menu ne se ferme plus sur mobile.");
    form.append("status", "resolved"); // ignoré par le serveur
    form.append("context", JSON.stringify({ page: "/game", version: "test" }));
    const created = await pb.collection("reports").create(form);
    try {
      expect(created.status).toBe("new");
      expect(created.reporterPseudo).toBeTruthy();
      expect(created.history).toHaveLength(1);
      // Personne ne crée au nom d'un autre, ni ne modifie directement.
      const other = new FormData();
      other.append("reporterId", "someone_else");
      other.append("title", "x");
      other.append("description", "abcdefghijkl");
      await expect(pb.collection("reports").create(other)).rejects.toBeTruthy();
      await expect(pb.collection("reports").update(created.id, { status: "resolved" })).rejects.toBeTruthy();
      // Réponse de l'équipe : statut + message, le joueur est notifié.
      const updated = await admin.send("/api/cosmic/admin/reports", { method: "POST", body: { id: created.id, status: "in_progress", comment: "On regarde" } });
      expect(updated.status).toBe("in_progress");
      const notes = await admin.collection("notifications").getFullList({ filter: `player_id = "${bId}" && kind = "report"` });
      expect(notes.length).toBeGreaterThan(0);
      // Le joueur répond et marque comme lu ; un joueur ne peut pas utiliser la route d'équipe.
      const replied = await pb.send("/api/cosmic/reports/comment", { method: "POST", body: { id: created.id, text: "Merci !" } });
      expect(replied.history.at(-1).text).toBe("Merci !");
      await expect(pb.send("/api/cosmic/admin/reports", { method: "POST", body: { id: created.id, status: "resolved" } })).rejects.toMatchObject({ status: 403 });
      // Invisible pour un client anonyme.
      await expect(new PocketBase(PB_TEST_URL!).collection("reports").getOne(created.id)).rejects.toBeTruthy();
    } finally {
      await admin.collection("reports").delete(created.id);
      for (const n of await admin.collection("notifications").getFullList({ filter: `player_id = "${bId}" && kind = "report"` })) await admin.collection("notifications").delete(n.id);
    }
  });

  it("v2.8 tools: client errors grouped into staff-only reports, backup status, balance stats", async () => {
    // Connecté en B : deux occurrences de la même erreur (lignes différentes) → un seul signalement.
    const err = { message: "TypeError: test v2.8 is undefined", stack: "TypeError\n    at Foo (http://x/assets/index-AAAA1111.js:1:2)", page: "/game", version: "test" };
    await pb.send("/api/cosmic/reports/error", { method: "POST", body: err });
    await pb.send("/api/cosmic/reports/error", { method: "POST", body: { ...err, stack: "TypeError\n    at Foo (http://x/assets/index-BBBB2222.js:9:9)" } });
    const ignored = await pb.send("/api/cosmic/reports/error", { method: "POST", body: { message: "ResizeObserver loop limit exceeded" } });
    expect(ignored.ignored).toBe(true);
    const autos = await admin.collection("reports").getFullList({ filter: `reporterId = "system" && title ~ "test v2.8"` });
    try {
      expect(autos).toHaveLength(1);
      expect(autos[0].occurrences).toBe(2);
      expect(autos[0].category).toBe("bug");
      expect(autos[0].affected.length).toBe(1);
      // Invisible pour le joueur.
      await expect(pb.collection("reports").getOne(autos[0].id)).rejects.toBeTruthy();
      // Clos puis reproduit : rouvert.
      await admin.send("/api/cosmic/admin/reports", { method: "POST", body: { id: autos[0].id, status: "resolved" } });
      await pb.send("/api/cosmic/reports/error", { method: "POST", body: err });
      const again = await admin.collection("reports").getOne(autos[0].id);
      expect(again.status).toBe("new");
      expect(again.occurrences).toBe(3);
    } finally {
      for (const r of autos) await admin.collection("reports").delete(r.id);
    }
    // Sauvegardes : état réservé à l'équipe.
    const backups = await admin.send("/api/cosmic/admin/backups", { method: "GET" });
    expect(typeof backups.count).toBe("number");
    expect(backups.cron).toBeTruthy();
    await expect(pb.send("/api/cosmic/admin/backups", { method: "GET" })).rejects.toMatchObject({ status: 403 });
    // Statistiques d'équilibrage.
    const stats = await admin.send("/api/cosmic/admin/stats", { method: "GET" });
    expect(stats.balance.activity.active30d).toBeGreaterThan(0);
    expect(Array.isArray(stats.balance.factions)).toBe(true);
  });

  it("v3.0 market: escrow, price band, trade with tax, cancel and expiry refunds; posture", async () => {
    // Connecté en B ; A vend avec son propre client.
    const aClient = new PocketBase(PB_TEST_URL);
    await aClient.collection("users").authWithPassword(A.email, A.pw);
    const asA = (path: string, body: Record<string, unknown>) => aClient.send(`/api/cosmic/market/${path}`, { method: "POST", body });
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    await admin.collection("players").update(aId, { resources: { ...aBefore!.resources, scrap: 1_000_000, energy: 1_000_000 } });
    await admin.collection("players").update(bId, { resources: { ...bBefore!.resources, scrap: 1_000_000, energy: 1_000_000 } });
    const created: string[] = [];
    try {
      await expect(asA("create", { giveRes: "scrap", giveAmount: 1000, wantRes: "energy", wantAmount: 10_000 })).rejects.toMatchObject({ status: 400 });
      const offer = await asA("create", { giveRes: "scrap", giveAmount: 100_000, wantRes: "energy", wantAmount: 100_000 });
      created.push(offer.id);
      expect(offer.status).toBe("open");
      expect((await snap(aId))!.resources.scrap).toBeLessThanOrEqual(900_100);
      // Personne n'écrit directement dans la collection.
      await expect(pb.collection("market_offers").update(offer.id, { status: "filled" })).rejects.toBeTruthy();
      await expect(asA("accept", { id: offer.id })).rejects.toMatchObject({ status: 400 });
      // B accepte : échange immédiat, taxe de 5 % pour le vendeur (pas d'alliance commune).
      const bScrap = (await snap(bId))!.resources.scrap;
      const aEnergy = (await snap(aId))!.resources.energy;
      const filled = await pb.send("/api/cosmic/market/accept", { method: "POST", body: { id: offer.id } });
      expect(filled.status).toBe("filled");
      expect(filled.buyerId).toBe(bId);
      expect((await snap(bId))!.resources.scrap).toBeGreaterThanOrEqual(bScrap + 100_000);
      const aAfter = (await snap(aId))!.resources.energy;
      // Marge : l'entretien de la flotte consomme un peu d'énergie entre les deux relevés.
      expect(aAfter - aEnergy).toBeGreaterThanOrEqual(100_000 - filled.tax - 50);
      expect(aAfter - aEnergy).toBeLessThan(100_000);
      await expect(pb.send("/api/cosmic/market/accept", { method: "POST", body: { id: offer.id } })).rejects.toMatchObject({ status: 400 });
      // Annulation : marchandise rendue.
      const second = await asA("create", { giveRes: "energy", giveAmount: 50_000, wantRes: "scrap", wantAmount: 50_000 });
      created.push(second.id);
      const before = (await snap(aId))!.resources.energy;
      await expect(pb.send("/api/cosmic/market/cancel", { method: "POST", body: { id: second.id } })).rejects.toMatchObject({ status: 404 });
      expect((await asA("cancel", { id: second.id })).status).toBe("cancelled");
      expect((await snap(aId))!.resources.energy).toBeGreaterThanOrEqual(before + 50_000);
      // Expiration (tâche planifiée) : simulée en avançant l'échéance.
      const third = await asA("create", { giveRes: "scrap", giveAmount: 10_000, wantRes: "energy", wantAmount: 10_000 });
      created.push(third.id);
      await admin.collection("market_offers").update(third.id, { expiresAtMs: Date.now() - 1000 });
      await expect(pb.send("/api/cosmic/market/accept", { method: "POST", body: { id: third.id } })).rejects.toMatchObject({ status: 400 });
      // Posture de la base : action de jeu, puis délai d'une heure.
      await ps.setBasePosture("bunker");
      expect((await snap(bId))!.posture?.id).toBe("bunker");
      await expect(ps.setBasePosture("riposte")).rejects.toThrow(/min/);
    } finally {
      for (const id of created) await admin.collection("market_offers").delete(id).catch(() => undefined);
      await admin.collection("players").update(aId, { resources: aBefore!.resources });
      await admin.collection("players").update(bId, { resources: bBefore!.resources, posture: null });
    }
  });

  it("v3.1 expedition: two events, faction choice, ships and XP back", async () => {
    const before = await snap(bId);
    await admin.collection("players").update(bId, {
      units: { chasseur: { level: 1, count: 50 } },
      // 5.20 : flotte neuve (pas de dégâts hérités des tests précédents).
      workshop: null,
      resources: RICH,
      buildings: { ...before!.buildings, extracteur_ferraille: { level: 5, unlocked: true } },
    });
    const fleets: string[] = [];
    try {
      await expect(ps.sendFleet("", { chasseur: 5 }, "expedition", { hours: 2 })).rejects.toThrow(/au moins/);
      const sent = await ps.sendFleet("", { chasseur: 20 }, "expedition", { hours: 2 });
      fleets.push(sent.id);
      expect((await snap(bId))!.units.chasseur.count).toBe(30);
      await expect(ps.sendFleet("", { chasseur: 20 }, "expedition", { hours: 2 })).rejects.toThrow(/déjà/);
      await expect(ps.recallFleet(sent.id)).rejects.toThrow(/rappelée/);
      const xp = (await snap(bId))!.xp ?? 0;
      // 5.16 : au dernier secteur, on pousse une fois plus loin, puis on rentre.
      let deeperDone = false;
      const step = async (field: "arriveAtMs" | "returnAtMs") => {
        await admin.collection("fleets").update(sent.id, { [field]: Date.now() - 1000 });
        await ps.syncPlayer("");
        let f = await pb.collection("fleets").getOne(sent.id);
        for (let i = 0; i < 3 && f.status === "decision"; i++) {
          const deeper = f.expedition?.pending?.kind === "deeper";
          const choice = deeper ? (deeperDone ? "return" : "deeper") : "force";
          if (deeper && !deeperDone) deeperDone = true;
          f = await pb.send("/api/cosmic/expedition/choose", { method: "POST", body: { fleetId: sent.id, choice } });
        }
        return f;
      };
      const mid = await step("arriveAtMs");
      expect(["returning", "done"]).toContain(mid.status);
      expect(mid.expedition.log.length).toBeGreaterThanOrEqual(1);
      let end = mid.status === "done" ? mid : await step("returnAtMs");
      if (end.status === "returning") {
        // Étape profonde : partie pour une demi-durée.
        expect(end.expedition.depth).toBe(1);
        end = await step("returnAtMs");
      }
      expect(end.status).toBe("done");
      const after = await snap(bId);
      expect(after!.xp).toBeGreaterThanOrEqual(xp + (deeperDone ? 180 : 120)); // 2 h × 60 XP (+ 50 % par profondeur) + succès « Grand large »
      expect(after!.stats.expeditions).toBe(1);
      expect(after!.units.chasseur.count).toBeGreaterThan(30);
    } finally {
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      await admin.collection("players").update(bId, { units: before!.units, resources: before!.resources, buildings: before!.buildings, xp: before!.xp, stats: before!.stats, pirates: before!.pirates });
    }
  }, 60_000);

  it("v3.1 Leviathan: started by the staff, assaults deal damage, rewards when it leaves", async () => {
    const before = await snap(bId);
    await admin.collection("players").update(bId, { units: { chasseur: { level: 1, count: 50 } }, resources: RICH });
    const fleets: string[] = [];
    try {
      await expect(pb.send("/api/cosmic/admin/leviathan", { method: "POST", body: { action: "start" } })).rejects.toMatchObject({ status: 403 });
      // Le premier week-end du mois, un vrai Léviathan apparaît tout seul : on le renvoie d'abord.
      await admin.send("/api/cosmic/admin/leviathan", { method: "POST", body: { action: "stop" } }).catch(() => undefined);
      await expect(ps.sendFleet("", { chasseur: 10 }, "leviathan")).rejects.toThrow(/pas là/);
      const started = await admin.send("/api/cosmic/admin/leviathan", { method: "POST", body: { action: "start" } });
      expect(started.status).toBe("active");
      expect(started.hp).toBe(started.maxHp);
      const sent = await ps.sendFleet("", { chasseur: 10 }, "leviathan");
      fleets.push(sent.id);
      await expect(ps.sendFleet("", { chasseur: 10 }, "leviathan")).rejects.toThrow(/min/);
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      const landed = await pb.collection("fleets").getOne(sent.id);
      expect(landed.status).toBe("returning");
      const cfg = await pb.collection("game_config").getFirstListItem('key="leviathan"');
      expect(cfg.data.hp).toBeLessThan(cfg.data.maxHp);
      expect(cfg.data.contributions[bId].damage).toBeGreaterThan(0);
      const done = cfg.data.maxHp - cfg.data.hp;
      await expect(admin.send("/api/cosmic/admin/leviathan", { method: "POST", body: { action: "resize", maxHp: done } })).rejects.toMatchObject({ status: 400 });
      const resized = await admin.send("/api/cosmic/admin/leviathan", { method: "POST", body: { action: "resize", maxHp: done + 5000 } });
      expect(resized.maxHp).toBe(done + 5000);
      expect(resized.hp).toBe(5000);
      const logged = await admin.collection("admin_logs").getFirstListItem('recordId="leviathan"', { sort: "-createdAtMs" });
      expect(logged.recordLabel).toMatch(/structure/);
      const scrap = (await snap(bId))!.resources.scrap;
      const stopped = await admin.send("/api/cosmic/admin/leviathan", { method: "POST", body: { action: "stop" } });
      expect(stopped.status).toBe("failed");
      expect(stopped.rewarded).toBe(true);
      expect((await snap(bId))!.resources.scrap).toBeGreaterThanOrEqual(scrap);
    } finally {
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      const cfg = await admin.collection("game_config").getFirstListItem('key="leviathan"').catch(() => null);
      if (cfg) await admin.collection("game_config").delete(cfg.id);
      await admin.collection("players").update(bId, { units: before!.units, resources: before!.resources });
    }
  }, 60_000);

  it("5.21 Atelier: a boss assault sends saved ships to the workshop, damages hulls, and the workshop returns them", async () => {
    const before = await snap(bId);
    await admin.collection("players").update(bId, {
      units: { chasseur: { level: 1, count: 100 } },
      buildings: { ...before!.buildings, atelier_reparation: { level: 10, unlocked: true } },
      workshop: null,
      testMode: false,
      resources: RICH,
    });
    const fleets: string[] = [];
    try {
      await admin.send("/api/cosmic/admin/leviathan", { method: "POST", body: { action: "stop" } }).catch(() => undefined);
      await admin.send("/api/cosmic/admin/leviathan", { method: "POST", body: { action: "start" } });
      const sent = await ps.sendFleet("", { chasseur: 100 }, "leviathan");
      fleets.push(sent.id);
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      const landed = await pb.collection("fleets").getOne(sent.id);
      const survivors = landed.units.chasseur ?? 0;
      const after = await snap(bId);
      const jobs = (after.workshop?.jobs ?? []) as { unitId: string; count: number; source: string; hpLeft: number }[];
      const saved = jobs.filter((j) => j.unitId === "chasseur").reduce((a, j) => a + j.count, 0);
      // Pertes réparties : rentrent, à l'Atelier, ou détruites ; rien ne rentre deux fois.
      expect(saved).toBeGreaterThan(0);
      expect(jobs.every((j) => j.source === "boss")).toBe(true);
      expect(survivors + saved).toBeLessThan(100);
      expect(after.workshop.hull.chasseur).toBeGreaterThan(0);
      // 5.21 : sans Ambre, impossible de terminer tout de suite ; avec, les unités rentrent.
      await admin.collection("players").update(bId, { bounties: { ...(after.bounties ?? {}), amber: 0 } });
      await expect(ps.rushWorkshop()).rejects.toThrow(/Ambre/);
      await admin.collection("players").update(bId, { bounties: { ...(after.bounties ?? {}), amber: 500 } });
      const rushed = await ps.rushWorkshop();
      expect(rushed.units.chasseur).toBe(saved);
      const repaired = await snap(bId);
      expect(repaired.workshop?.jobs ?? []).toHaveLength(0);
      expect(repaired.units.chasseur.count).toBe(after.units.chasseur.count + saved);
      expect(repaired.bounties.amber).toBe(500 - rushed.amber);
    } finally {
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      const cfg = await admin.collection("game_config").getFirstListItem('key="leviathan"').catch(() => null);
      if (cfg) await admin.collection("game_config").delete(cfg.id);
      await admin.collection("players").update(bId, { units: before!.units, buildings: before!.buildings, resources: before!.resources, bounties: before!.bounties ?? null, workshop: null, testMode: before!.testMode ?? false });
    }
  }, 60_000);

  it("5.28 Cale sèche: ready ships come back only into free hangar places, triage scraps for 60 %", async () => {
    const before = await snap(bId);
    await admin.collection("players").update(bId, {
      units: { ...before!.units, chasseur: { level: 1, count: 900 } },
      buildings: { ...before!.buildings, atelier_reparation: { level: 10, unlocked: true }, hangar_attaque: { level: 1, unlocked: true }, cale_seche: { level: 10, unlocked: true } },
      workshop: { updatedAtMs: Date.now(), jobs: [], hull: {}, ready: { chasseur: 200 } },
      testMode: false,
      resources: RICH,
    });
    try {
      // Hangar 2 000 places, 900 chasseurs (1 800) : 100 rentrent d'eux-mêmes (palier 10), 100 attendent.
      await ps.syncPlayer("");
      let p = await snap(bId);
      const others = Object.entries(p.units as Record<string, { count: number }>).filter(([id]) => id !== "chasseur").reduce((a, [id, u]) => a + (findUnit(id)?.category === "attack" ? (u.count ?? 0) * (findUnit(id)?.hangarSpace ?? 1) : 0), 0);
      const expected = Math.max(0, Math.min(200, Math.floor((2000 - 1800 - others) / 2)));
      expect(p.units.chasseur.count).toBe(900 + expected);
      expect(p.workshop?.ready?.chasseur ?? 0).toBe(200 - expected);
      if (200 - expected > 0) await expect(ps.dockCommission()).rejects.toThrow(/place/);
      // Triage : démanteler les prêts restants rend 60 % du prix.
      const scrapBefore = p.resources.scrap;
      const left = 200 - expected;
      if (left > 0) {
        const out = await ps.dockScrap("chasseur", left);
        expect(out.count).toBe(left);
        p = await snap(bId);
        expect(p.resources.scrap).toBeGreaterThan(scrapBefore);
        expect(p.workshop?.ready?.chasseur ?? 0).toBe(0);
      }
      await ps.dockSettings({ policy: "scrapOverflow" });
      expect((await snap(bId)).workshop?.policy).toBe("scrapOverflow");
    } finally {
      await admin.collection("players").update(bId, { units: before!.units, buildings: before!.buildings, resources: before!.resources, workshop: null, testMode: before!.testMode ?? false });
    }
  }, 60_000);

  it("v3.4 ascension: resets buildings and resources, keeps the fleet, public stars and shield", async () => {
    const before = await snap(bId);
    // Bâtiments de fin de partie (v3.6) laissés de côté : hors condition, conservés.
    const maxed = Object.fromEntries(Object.entries(before!.buildings).map(([id, b]) => [id, findBuilding(id)?.endgame ? b : { ...(b as object), level: findBuilding(id)?.maxLevel ?? 20, unlocked: true }]));
    try {
      await admin.collection("queues").update(bId, { buildingUpgrades: {} });
      await admin.collection("players").update(bId, { buildings: maxed, resources: RICH, units: { chasseur: { level: 1, count: 77 } }, ascensions: 0, ascendedAtMs: 0 });
      await ps.ascendEmpire();
      const after = await snap(bId);
      expect(after.ascensions).toBe(1);
      // 5.27.2 : hangars et Cale sèche conservés (invariant I4), comme les bâtiments de fin de partie.
      expect(Object.entries(after.buildings).every(([id, b]) => (findBuilding(id) && keptOnAscension(findBuilding(id)!)) || (b as { level: number }).level === 1)).toBe(true);
      expect((after.buildings.hangar_attaque as { level: number }).level).toBe(findBuilding("hangar_attaque")!.maxLevel);
      expect(after.resources.reinforcedSteel).toBe(0);
      expect(after.units.chasseur.count).toBe(77);
      const profile = await pb.collection("profiles").getOne(bId);
      expect(profile.ascensions).toBe(1);
      expect(profile.ascendedAtMs).toBeGreaterThan(0);
      await expect(ps.ascendEmpire()).rejects.toThrow(/niveau maximal|jour/);
    } finally {
      await admin.collection("players").update(bId, { buildings: before!.buildings, resources: before!.resources, units: before!.units, ascensions: 0, ascendedAtMs: 0 });
    }
  }, 60_000);

  it("v3.5 colonies: colony ship, separate stock, buildings, delivery and collection", async () => {
    const before = await snap(bId);
    const maxed = Object.fromEntries(Object.entries(before!.buildings).map(([id, b]) => [id, findBuilding(id)?.endgame ? { level: 1, unlocked: false } : { ...(b as object), level: 16, unlocked: true }]));
    const big = Object.fromEntries(Object.keys(RICH).map((k) => [k, 200_000_000]));
    const fleets: string[] = [];
    try {
      await admin.collection("players").update(bId, { buildings: maxed, resources: big, units: { cargo: { level: 1, count: 50 }, chasseur: { level: 1, count: 5 } }, colonies: [], colonizing: null });
      await ps.startColonization("Néo-Avalon");
      let me = await snap(bId);
      expect(me.colonizing.name).toBe("Néo-Avalon");
      expect(me.resources.scrap).toBeLessThan(200_000_000 - 49_000_000);
      await expect(ps.startColonization("Bis")).rejects.toThrow(/en route/);
      await admin.collection("players").update(bId, { colonizing: { ...me.colonizing, endTime: Date.now() - 1000 } });
      await ps.syncPlayer("");
      me = await snap(bId);
      expect(me.colonies).toHaveLength(1);
      const colony = me.colonies[0];
      expect(colony.id).toBe(`${bId}-c1`);
      const homeScrap = me.resources.scrap;
      await ps.upgradeColonyBuilding(colony.id, "extracteur_ferraille");
      me = await snap(bId);
      expect(me.colonies[0].building.id).toBe("extracteur_ferraille");
      expect(me.resources.scrap).toBeGreaterThanOrEqual(homeScrap); // payé par la colonie

      // v5.2 : une ressource rare autre que celle du gisement (qui produit en continu).
      const rare = (["cyberModule", "syntheticNanites", "reinforcedSteel", "aiFragment"] as const).find((r) => r !== me.colonies[0].biome)!;
      // Livraison : quitte la planète mère, arrive dans le stock de la colonie.
      const sent = await ps.sendTransport(colony.id, "deliver", { cargo: 20 }, { [rare]: 1000 });
      fleets.push(sent.id);
      expect((await snap(bId)).resources[rare]).toBe(200_000_000 - 1_000_000 - 1000);
      await expect(ps.sendTransport(colony.id, "deliver", { cargo: 1 }, { scrap: 10_000_000 })).rejects.toThrow(/soute/);
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      me = await snap(bId);
      expect(me.colonies[0].resources[rare]).toBe(1000);
      expect((await pb.collection("fleets").getOne(sent.id)).status).toBe("returning");

      // Rapatriement : chargé à l'arrivée, crédité au retour.
      const back = await ps.sendTransport(colony.id, "collect", { cargo: 20 }, { [rare]: 400 });
      fleets.push(back.id);
      await forceArrival(back.id);
      await ps.syncPlayer("");
      const loaded = await pb.collection("fleets").getOne(back.id);
      expect(loaded.loot).toEqual({ [rare]: 400 });
      const steel = (await snap(bId)).resources[rare];
      await admin.collection("fleets").update(back.id, { returnAtMs: Date.now() - 1000 });
      await ps.syncPlayer("");
      expect((await snap(bId)).resources[rare]).toBe(steel + 400);
      expect((await snap(bId)).colonies[0].resources[rare]).toBe(600);
    } finally {
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      await admin.collection("players").update(bId, { buildings: before!.buildings, resources: before!.resources, units: before!.units, colonies: [], colonizing: null });
    }
  }, 60_000);

  it("v3.5 colonies: attacking and spying a colony hits its own defenses and stock", async () => {
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    const colonyId = `${aId}-c1`;
    const colony = {
      id: colonyId, slot: 1, name: "Bastion-Nord", foundedAtMs: Date.now() - 86400000, updatedAtMs: Date.now(),
      buildings: { extracteur_ferraille: { level: 1, unlocked: true }, entrepot: { level: 1, unlocked: true }, hangar_defense: { level: 1, unlocked: true } },
      resources: { ...RICH, scrap: 900_000 }, building: null, defenses: {}, defenseJob: null,
    };
    const fleets: string[] = [];
    const aClient = new PocketBase(PB_TEST_URL);
    await aClient.collection("users").authWithPassword(A.email, A.pw);
    try {
      await admin.collection("players").update(aId, { colonies: [colony], createdAtMs: MONTH_AGO(), lastDefeatAtMs: 0, ascendedAtMs: 0, xp: (await snap(bId)).xp });
      await admin.collection("players").update(bId, { allianceId: "", units: { chasseur: { level: 1, count: 40 }, sonde_espionnage: { level: 1, count: 5 } }, createdAtMs: MONTH_AGO(), ascendedAtMs: 0 });
      expect((await pb.collection("profiles").getOne(aId)).planets).toEqual([{ id: colonyId, name: "Bastion-Nord" }]);
      const homeScrap = (await snap(aId)).resources.scrap;

      // Espionnage : le rapport décrit la colonie.
      const probes = await ps.sendFleet(colonyId, { sonde_espionnage: 2 }, "spy");
      fleets.push(probes.id);
      await forceArrival(probes.id);
      await ps.syncPlayer("");
      const spyRep = await pb.collection("spy_reports").getFirstListItem(`targetUid="${colonyId}"`, { sort: "-timestamp" });
      expect(spyRep.targetPseudo).toMatch(/Bastion-Nord/);

      // Attaque : le défenseur voit venir la flotte, la colonie est pillée, pas la planète mère.
      const sent = await ps.sendFleet(colonyId, { chasseur: 30 }, "attack");
      fleets.push(sent.id);
      expect((await aClient.collection("fleets").getOne(sent.id)).targetOwnerUid).toBe(aId);
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      const landed = await admin.collection("fleets").getOne(sent.id);
      expect(landed.outcome).toBe("attacker_win");
      const report = await admin.collection("battle_reports").getOne(landed.reportId);
      expect(report.defenderUid).toBe(aId);
      expect(report.defenderPseudo).toMatch(/Bastion-Nord/);
      const after = await snap(aId);
      expect(after.colonies[0].resources.scrap).toBeLessThan(900_000);
      expect(after.colonies[0].lastDefeatAtMs).toBeGreaterThan(0);
      expect(after.resources.scrap).toBeGreaterThanOrEqual(homeScrap);
      // Bouclier de la colonie : nouvelle attaque refusée.
      await expect(ps.sendFleet(colonyId, { chasseur: 1 }, "attack")).rejects.toThrow(/bouclier|battu|récemment/);
    } finally {
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      await admin.collection("players").update(aId, { colonies: [], resources: aBefore!.resources, lastDefeatAtMs: aBefore!.lastDefeatAtMs ?? 0, xp: aBefore!.xp });
      await admin.collection("players").update(bId, { allianceId: bBefore!.allianceId, units: bBefore!.units });
    }
  }, 60_000);

  it("6.10.0 base avancée : baser, attaquer depuis la base, revenir à la base, rapatrier", async () => {
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    const colonyId = `${bId}-c1`;
    const colony = {
      id: colonyId, slot: 1, name: "Avant-Poste", foundedAtMs: Date.now() - 86400000, updatedAtMs: Date.now(),
      buildings: { extracteur_ferraille: { level: 1, unlocked: true }, entrepot: { level: 1, unlocked: true }, hangar_defense: { level: 1, unlocked: true } },
      resources: { ...RICH }, building: null, defenses: {}, defenseJob: null,
    };
    const fleets: string[] = [];
    try {
      await admin.collection("players").update(aId, { createdAtMs: MONTH_AGO(), lastDefeatAtMs: 0, ascendedAtMs: 0, xp: (await snap(bId)).xp, units: {} });
      await admin.collection("players").update(bId, { allianceId: "", colonies: [colony], units: { chasseur: { level: 1, count: 40 } }, createdAtMs: MONTH_AGO(), ascendedAtMs: 0 });
      const base = await ps.launchFleet({ mission: "colonybase", colonyId, targetUid: colonyId, fleet: { chasseur: 20 } });
      fleets.push(base.id);
      expect(base).toMatchObject({ mission: "colonybase", targetUid: colonyId, status: "outbound" });
      expect((await snap(bId)).units.chasseur.count).toBe(20);
      await expect(ps.launchFleet({ mission: "colonybase", colonyId, targetUid: colonyId, fleet: { chasseur: 1 } })).rejects.toThrow(/déjà une base/);
      await forceArrival(base.id);
      await ps.syncPlayer("");
      const stationed = await admin.collection("fleets").getOne(base.id);
      expect(stationed.status).toBe("stationed");
      expect(stationed.stationedUntilMs).toBeGreaterThan(Date.now() + 13 * 86400000);

      // Attaque depuis la base : vaisseaux pris dans la base, pas à quai.
      await expect(ps.sendFleet(aId, { chasseur: 21 }, "attack", { fromBaseId: base.id })).rejects.toThrow(/plus assez/);
      const sent = await ps.sendFleet(aId, { chasseur: 10 }, "attack", { fromBaseId: base.id });
      fleets.push(sent.id);
      expect((await admin.collection("fleets").getOne(base.id)).units).toEqual({ chasseur: 10 });
      expect((await snap(bId)).units.chasseur.count).toBe(20);
      expect((await admin.collection("fleets").getOne(sent.id)).base).toEqual({ colonyId, fromBaseId: base.id });
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      const fought = await admin.collection("fleets").getOne(sent.id);
      expect(fought.status).toBe("returning");
      const survivors = (fought.units as Record<string, number>).chasseur ?? 0;
      await admin.collection("fleets").update(sent.id, { returnAtMs: Date.now() - 1000 });
      await ps.syncPlayer("");
      // Retour : les survivants rejoignent la base, la planète mère ne bouge pas.
      expect((await admin.collection("fleets").getOne(base.id)).units).toEqual({ chasseur: 10 + survivors });
      expect((await snap(bId)).units.chasseur.count).toBe(20);

      // Rapatrier : la base rentre à la planète mère.
      await ps.recallFleet(base.id);
      await admin.collection("fleets").update(base.id, { returnAtMs: Date.now() - 1000 });
      await ps.syncPlayer("");
      expect((await snap(bId)).units.chasseur.count).toBe(30 + survivors);
      expect((await admin.collection("fleets").getOne(base.id)).status).toBe("done");
    } finally {
      // Le rapport de combat ouvrirait le délai d'attaque de B sur A pour les tests suivants.
      for (const r of await admin.collection("battle_reports").getFullList({ filter: `attackerUid="${bId}" && defenderUid="${aId}" && timestamp >= ${Date.now() - 600_000}` })) await admin.collection("battle_reports").delete(r.id).catch(() => undefined);
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      await admin.collection("players").update(aId, { resources: aBefore!.resources, lastDefeatAtMs: aBefore!.lastDefeatAtMs ?? 0, xp: aBefore!.xp, units: aBefore!.units });
      await admin.collection("players").update(bId, { allianceId: bBefore!.allianceId, units: bBefore!.units, colonies: [] });
    }
  }, 60_000);

  it("6.13.0 lune : un gros combat sur la planète mère fait naître la lune du défenseur", async () => {
    await ensureAB();
    const since = Date.now() - 1000;
    const fleets: string[] = [];
    const rulesRec = await admin.collection("game_config").getFirstListItem('key="rules"').catch(() => null);
    const rulesBefore = rulesRec ? rulesRec.data : null;
    try {
      // Chance certaine pour le test : 100 % dès 1 000 de débris.
      const data = Object.assign({}, rulesBefore || {}, { moon: { enabled: true, debrisPerPercent: 10, maxChance: 1, shieldBonus: 0.03, protectedStorageBonus: 0.05 } });
      if (rulesRec) await admin.collection("game_config").update(rulesRec.id, { data });
      else await admin.collection("game_config").create({ key: "rules", data });
      await admin.collection("players").update(aId, { moon: null, colonies: [], createdAtMs: MONTH_AGO(), lastDefeatAtMs: 0, ascendedAtMs: 0, vacation: null, xp: (await snap(bId)).xp, units: { fregate: { level: 1, count: 30 } } });
      await admin.collection("players").update(bId, { allianceId: "", units: { fregate: { level: 1, count: 40 } }, createdAtMs: MONTH_AGO(), ascendedAtMs: 0, vacation: null });
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
      await loginPlayer(B.email, B.pw);
      const sent = await ps.sendFleet(aId, { fregate: 40 }, "attack");
      fleets.push(sent.id);
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      const a = await snap(aId);
      expect(a.moon?.name, "lune du défenseur").toBeTruthy();
      expect(a.moon.fromDebris).toBeGreaterThan(0);
      // 6.13.3 : le nom de la lune est public (fiche joueur, Galaxie).
      expect((await admin.collection("profiles").getOne(aId)).moonName).toBe(a.moon.name);
      // 6.14.0 : A améliore sa lune (achat immédiat en ressources).
      await admin.collection("players").update(aId, { resources: { ...RICH, scrap: 5_000_000, energy: 5_000_000 }, resourcesUpdatedAtMs: Date.now() });
      await loginPlayer(A.email, A.pw);
      await ps.upgradeMoon();
      expect((await snap(aId)).moon.level).toBe(2);
      await loginPlayer(B.email, B.pw); // les tests suivants agissent en B
      expect((await snap(bId)).moon ?? null).toBeNull();
    } finally {
      await admin.collection("players").update(aId, { moon: null });
      for (const r of await admin.collection("battle_reports").getFullList({ filter: `attackerUid="${bId}" && defenderUid="${aId}" && timestamp >= ${since}` })) await admin.collection("battle_reports").delete(r.id).catch(() => undefined);
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      const cur = await admin.collection("game_config").getFirstListItem('key="rules"').catch(() => null);
      if (cur) {
        if (rulesBefore) await admin.collection("game_config").update(cur.id, { data: rulesBefore });
        else await admin.collection("game_config").delete(cur.id);
      }
    }
  });

  /** 6.14.48 (É30-1b) : lune de test (niveau donné, recharges prêtes). */
  const testMoon = (level: number) => ({ name: "Nyx", level, bornAtMs: Date.now() - 60_000, fromDebris: 1 });

  it("6.14.48 phalange : radar d'alliance, perce-brouillard et balayage de l'agresseur", async () => {
    await ensureAB();
    const fleets: string[] = [];
    const rulesRec = await admin.collection("game_config").getFirstListItem('key="rules"').catch(() => null);
    const rulesBefore = rulesRec ? rulesRec.data : null;
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    const cEmail = `ph${suffix}@test.dev`;
    let cId = "";
    // Alliance de test (identifiant seul : le radar lit `players.allianceId`).
    const ally = `phal${suffix}xxxxxxxxxx`.slice(0, 15);
    try {
      // Portée large (la position sur la carte dépend de l'identifiant) ; trajet de 30 min : la flotte reste en vol pendant le test.
      const data = Object.assign({}, rulesBefore || {}, { phalanx: { rangePerLevel: 200 }, fleets: { baseMinutes: 30, minutesPerDistance: 0 } });
      if (rulesRec) await admin.collection("game_config").update(rulesRec.id, { data });
      else await admin.collection("game_config").create({ key: "rules", data });
      await admin.collection("players").update(aId, { moon: testMoon(4), allianceId: ally, colonies: [], createdAtMs: MONTH_AGO(), lastDefeatAtMs: 0, ascendedAtMs: 0, vacation: null, xp: bBefore.xp, resources: RICH, resourcesUpdatedAtMs: Date.now(), units: { fregate: { level: 1, count: 30 } } });
      await admin.collection("players").update(bId, { allianceId: "", units: { fregate: { level: 1, count: 40 } }, createdAtMs: MONTH_AGO(), ascendedAtMs: 0, vacation: null });
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
      // C : allié de A, lune de niveau 1.
      const cUser = await admin.collection("users").create({ username: `phal_${suffix}`, name: `Phal_${suffix}`, email: cEmail, password: "motdepasse3", passwordConfirm: "motdepasse3" });
      cId = cUser.id;
      const cClient = new PocketBase(PB_TEST_URL);
      await cClient.collection("users").authWithPassword(cEmail, "motdepasse3");
      await cClient.send("/api/cosmic/init", { method: "POST" });
      await admin.collection("players").update(cId, { allianceId: ally, moon: testMoon(1), createdAtMs: MONTH_AGO(), resources: RICH, resourcesUpdatedAtMs: Date.now() });
      const aClient = new PocketBase(PB_TEST_URL);
      await aClient.collection("users").authWithPassword(A.email, A.pw);
      const post = (client: PocketBase, path: string, body: Record<string, unknown> = {}) => client.send(`/api/cosmic/${path}`, { method: "POST", body });

      // Avant l'attaque, B n'est pas un agresseur : balayage refusé.
      await expect(post(aClient, "moon/scan", { targetUid: bId })).rejects.toThrow(/ne balaie qu'un joueur/);
      // Q41 : le niveau de lune est public.
      await post(aClient, "action", { type: "sync" });
      expect((await admin.collection("profiles").getOne(aId)).moonLevel).toBe(4);

      // B attaque A : C, allié dont la phalange couvre A, est prévenu ; ni A ni B.
      await loginPlayer(B.email, B.pw);
      const sent = await ps.sendFleet(aId, { fregate: 40 }, "attack");
      fleets.push(sent.id);
      const radar = (uid: string) => admin.collection("notifications").getFullList({ filter: `player_id="${uid}" && title="Phalange : allié menacé"`, sort: "-createdAtMs" });
      const cNotes = await radar(cId);
      expect(cNotes).toHaveLength(1);
      expect(cNotes[0].message).toContain(`${B.pseudo} vise ${A.pseudo} (planète mère)`);
      expect(cNotes[0].data.fleetId).toBe(sent.id);
      expect(await radar(aId)).toHaveLength(0);
      expect(await radar(bId)).toHaveLength(0);

      // Leurre posé par le superuser : 10 frégates affichées, 40 réelles, stimulant de 20 %.
      await admin.collection("fleets").update(sent.id, { units: { fregate: 10 }, trueUnits: { fregate: 40 }, boosts: { assault: 20 } });
      // A (lune 4) : vraie composition et stimulant percés.
      const aView = await post(aClient, "moon/phalanx");
      expect(aView.level).toBe(4);
      const inc = aView.incoming.find((f: { id: string }) => f.id === sent.id);
      expect(inc.units).toEqual({ fregate: 40 });
      expect(inc.pierced).toEqual({ decoy: true, boosts: true });
      expect(inc.assault).toBe(20);
      expect(inc.piercedText).toContain("40 vaisseaux, pas 10");
      // C (lune 1) : l'attaque sur son allié, composition affichée seulement (I22).
      const cView = await post(cClient, "moon/phalanx");
      expect(cView.incoming).toEqual([]);
      const threat = cView.allies.find((f: { id: string }) => f.id === sent.id);
      expect(threat.units).toEqual({ fregate: 10 });
      expect(threat.allyUid).toBe(aId);
      expect(JSON.stringify(cView)).not.toMatch(/trueUnits|"assault":20/);
      // B, sans lune : rien de percé, aucun allié couvert.
      const bView = await ps.callGame<{ level: number; incoming: unknown[]; allies: unknown[] }>("moon/phalanx");
      expect(bView).toMatchObject({ level: 0, incoming: [], allies: [] });

      // Balayage de l'agresseur : énergie payée, recharge posée (niveau 4 : 15 min), rapport sans champ caché.
      const energyBefore = (await snap(aId)).resources.energy;
      const scan = await post(aClient, "moon/scan", { targetUid: bId });
      expect(scan.cost).toBeGreaterThanOrEqual(1000);
      const line = scan.report.fleets.find((f: { id: string }) => f.id === sent.id);
      expect(line.units).toEqual({ fregate: 10 });
      expect(scan.scanReadyAtMs - Date.now()).toBeGreaterThan(14 * 60_000);
      const aAfter = await snap(aId);
      expect(aAfter.moon.scanReadyAtMs).toBe(scan.scanReadyAtMs);
      expect(aAfter.resources.energy).toBeLessThanOrEqual(energyBefore - scan.cost + 100);
      expect(aAfter.stats.phalanxScans).toBe((aBefore.stats?.phalanxScans ?? 0) + 1);
      expect(await admin.collection("notifications").getFullList({ filter: `player_id="${aId}" && title="Balayage de ${B.pseudo}"` })).toHaveLength(1);
      // Recharge : deuxième balayage refusé.
      await expect(post(aClient, "moon/scan", { targetUid: bId })).rejects.toThrow(/se recharge/);
      // C balaie aussi B : l'attaque vise un allié dans sa portée.
      expect((await post(cClient, "moon/scan", { targetUid: bId })).report.targetUid).toBe(bId);
    } finally {
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      if (cId) {
        await admin.collection("players").delete(cId).catch(() => undefined);
        await admin.collection("users").delete(cId).catch(() => undefined);
      }
      await admin.collection("players").update(aId, { moon: null, allianceId: aBefore?.allianceId ?? "", resources: aBefore?.resources, units: aBefore?.units, xp: aBefore?.xp, stats: aBefore?.stats ?? null });
      await admin.collection("players").update(bId, { allianceId: bBefore?.allianceId ?? "", units: bBefore?.units });
      const cur = await admin.collection("game_config").getFirstListItem('key="rules"').catch(() => null);
      if (cur) {
        if (rulesBefore) await admin.collection("game_config").update(cur.id, { data: rulesBefore });
        else await admin.collection("game_config").delete(cur.id);
      }
      await loginPlayer(B.email, B.pw); // les tests suivants agissent en B
    }
  }, 60_000);

  it("6.14.48 porte de saut : patrouille rapatriée tout de suite, recharge, mission refusée", async () => {
    await ensureAB();
    const fleets: string[] = [];
    const aBefore = await snap(aId);
    const aClient = new PocketBase(PB_TEST_URL);
    await aClient.collection("users").authWithPassword(A.email, A.pw);
    const jump = (fleetId: string) => aClient.send("/api/cosmic/fleet/jump", { method: "POST", body: { fleetId } });
    const patrol = async () => {
      const f = (await aClient.send("/api/cosmic/fleet/send", { method: "POST", body: { mission: "patrol", fleet: { chasseur: 10 }, minutes: 30 } })) as { id: string };
      fleets.push(f.id);
      return f;
    };
    try {
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${aId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
      await admin.collection("players").update(aId, { moon: testMoon(2), resources: RICH, resourcesUpdatedAtMs: Date.now(), units: { chasseur: { level: 1, count: 20 } }, vacation: null });
      const p1 = await patrol();
      expect((await snap(aId)).units.chasseur.count).toBe(10);
      // Lune de niveau 2 : porte fermée.
      await expect(jump(p1.id)).rejects.toThrow(/niveau 3/);
      // Niveau 3 : la patrouille est à quai tout de suite (chemin de retour habituel).
      await admin.collection("players").update(aId, { moon: testMoon(3) });
      const out = await jump(p1.id);
      expect(out.status).toBe("done");
      expect((await admin.collection("fleets").getOne(p1.id)).status).toBe("done");
      const a = await snap(aId);
      expect(a.units.chasseur.count).toBe(20);
      expect(a.moon.gateReadyAtMs).toBe(out.gateReadyAtMs);
      expect(out.gateReadyAtMs - Date.now()).toBeGreaterThan(23 * 3600_000);
      expect(a.stats.gateJumps).toBe((aBefore.stats?.gateJumps ?? 0) + 1);
      expect(await admin.collection("notifications").getFullList({ filter: `player_id="${aId}" && title="Saut réussi"` })).toHaveLength(1);
      // Deuxième patrouille : la porte se recharge.
      const p2 = await patrol();
      await expect(jump(p2.id)).rejects.toThrow(/se recharge/);
      expect((await admin.collection("fleets").getOne(p2.id)).status).toBe("outbound");
      // Recharge effacée : une mission non permise reste refusée ; la flotte d'un autre est introuvable.
      await admin.collection("players").update(aId, { moon: testMoon(3) });
      const other = await admin.collection("fleets").create({ ownerUid: aId, ownerPseudo: A.pseudo, targetUid: `nulle${suffix}`, targetPseudo: "Champ", mission: "recycle", units: { chasseur: 1 }, departAtMs: Date.now(), arriveAtMs: Date.now() + 3600_000, status: "outbound" });
      fleets.push(other.id);
      await expect(jump(other.id)).rejects.toThrow(/ne ramène que/);
      const bFleet = await admin.collection("fleets").create({ ownerUid: bId, ownerPseudo: B.pseudo, targetUid: bId, targetPseudo: B.pseudo, mission: "patrol", units: { chasseur: 1 }, departAtMs: Date.now(), arriveAtMs: Date.now() + 3600_000, status: "outbound" });
      fleets.push(bFleet.id);
      await expect(jump(bFleet.id)).rejects.toMatchObject({ status: 404 });
    } finally {
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      await admin.collection("players").update(aId, { moon: null, resources: aBefore?.resources, units: aBefore?.units, stats: aBefore?.stats ?? null });
      await loginPlayer(B.email, B.pw); // les tests suivants agissent en B
    }
  }, 60_000);

  it("6.14.77 porte de saut : une seule notification (« Saut réussi »), sans « Patrouille terminée »", async () => {
    await ensureAB();
    const fleets: string[] = [];
    const aBefore = await snap(aId);
    const aClient = new PocketBase(PB_TEST_URL);
    await aClient.collection("users").authWithPassword(A.email, A.pw);
    try {
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${aId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
      await admin.collection("players").update(aId, { moon: testMoon(3), resources: RICH, resourcesUpdatedAtMs: Date.now(), units: { chasseur: { level: 1, count: 20 } }, vacation: null });
      const sent = (await aClient.send("/api/cosmic/fleet/send", { method: "POST", body: { mission: "patrol", fleet: { chasseur: 10 }, minutes: 30 } })) as { id: string };
      fleets.push(sent.id);
      // Notifications de flotte de A effacées : celle d'un saut du test précédent (même seconde) serait comptée.
      for (const old of await admin.collection("notifications").getFullList({ filter: `player_id="${aId}" && kind="fleet"` })) await admin.collection("notifications").delete(old.id);
      const t0 = Date.now() - 1000;
      const out = await aClient.send("/api/cosmic/fleet/jump", { method: "POST", body: { fleetId: sent.id } });
      expect(out.status).toBe("done");
      const notes = await admin.collection("notifications").getFullList({ filter: `player_id="${aId}" && kind="fleet" && createdAtMs >= ${t0}`, sort: "createdAtMs" });
      expect(notes.map((n) => n.title)).toEqual(["Saut réussi"]);
      // Un retour habituel (sans la porte) garde sa notification.
      await admin.collection("players").update(aId, { moon: testMoon(3) });
      const back = (await aClient.send("/api/cosmic/fleet/send", { method: "POST", body: { mission: "patrol", fleet: { chasseur: 5 }, minutes: 30 } })) as { id: string };
      fleets.push(back.id);
      await admin.collection("fleets").update(back.id, { status: "returning", returnAtMs: Date.now() - 1000 });
      const t1 = Date.now() - 1000;
      await aClient.send("/api/cosmic/action", { method: "POST", body: { type: "sync", playtimeDeltaSeconds: 0 } }); // traite les flottes de A
      for (let i = 0; i < 20 && (await admin.collection("fleets").getOne(back.id)).status !== "done"; i++) await wait(500);
      const ended = await admin.collection("notifications").getFullList({ filter: `player_id="${aId}" && title="Patrouille terminée" && createdAtMs >= ${t1}`, sort: "createdAtMs" });
      expect(ended).toHaveLength(1);
    } finally {
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      await admin.collection("players").update(aId, { moon: null, resources: aBefore?.resources, units: aBefore?.units, stats: aBefore?.stats ?? null });
      await loginPlayer(B.email, B.pw); // les tests suivants agissent en B
    }
  }, 60_000);

  it("6.14.77 rapport de combat : niveau de lune du défenseur, et santé « avec ou sans lune »", async () => {
    await ensureAB();
    const since = Date.now() - 1000;
    const fleets: string[] = [];
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    try {
      await admin.collection("players").update(aId, { moon: testMoon(2), colonies: [], createdAtMs: MONTH_AGO(), lastDefeatAtMs: 0, ascendedAtMs: 0, vacation: null, xp: bBefore.xp, units: { fregate: { level: 1, count: 5 } } });
      await admin.collection("players").update(bId, { allianceId: "", units: { fregate: { level: 1, count: 20 } }, createdAtMs: MONTH_AGO(), ascendedAtMs: 0, vacation: null });
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
      await loginPlayer(B.email, B.pw);
      const sent = await ps.sendFleet(aId, { fregate: 20 }, "attack");
      fleets.push(sent.id);
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      const landed = await admin.collection("fleets").getOne(sent.id);
      expect(landed.reportId, "rapport de combat").toBeTruthy();
      const report = await admin.collection("battle_reports").getOne(landed.reportId);
      expect(report.defenderMoonLevel).toBe(2);
      // Santé de l'équilibre : le combat compte parmi les cibles avec lune.
      const live = await admin.send("/api/cosmic/admin/balance", { method: "GET" });
      expect(live.health.moonPvp.windowDays).toBe(30);
      expect(live.health.moonPvp.withMoon.battles).toBeGreaterThanOrEqual(1);
    } finally {
      for (const r of await admin.collection("battle_reports").getFullList({ filter: `attackerUid="${bId}" && defenderUid="${aId}" && timestamp >= ${since}` })) await admin.collection("battle_reports").delete(r.id).catch(() => undefined);
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      await admin.collection("players").update(aId, { moon: null, units: aBefore?.units, resources: aBefore?.resources, lastDefeatAtMs: aBefore?.lastDefeatAtMs ?? 0, xp: aBefore?.xp });
      await admin.collection("players").update(bId, { allianceId: bBefore?.allianceId ?? "", units: bBefore?.units });
      await loginPlayer(B.email, B.pw); // les tests suivants agissent en B
    }
  }, 60_000);

  it("6.14.106 (AE-L3) comptoir : plafond hebdomadaire des rares compté par le serveur, refus au-delà", async () => {
    await ensureAB();
    const rules = await admin.collection("game_config").getFirstListItem('key="rules"');
    const rulesBefore = rules.data;
    const bBefore = await snap(bId);
    try {
      await admin.collection("game_config").update(rules.id, { data: { ...(rulesBefore as object), exchange: { commonToRare: 0.01, rareToCommon: 50, taxPct: 0, weeklyRareCap: 1000 } } });
      await admin.collection("players").update(bId, { resources: { ...RICH, scrap: 1_000_000, energy: 1_000_000 }, exchangeWeek: null, vacation: null, resourcesUpdatedAtMs: Date.now() });
      await loginPlayer(B.email, B.pw);
      expect(await ps.tradeResources(bId, "scrap", "reinforcedSteel", 60_000)).toEqual({ gained: 600, tax: 0, taxRes: "reinforcedSteel" });
      expect((await snap(bId)).exchangeWeek).toMatchObject({ rares: 600 });
      await expect(ps.tradeResources(bId, "scrap", "cyberModule", 50_000)).rejects.toThrow(/t'en reste 400 cette semaine/);
      // Rien n'a été retiré par l'échange refusé ; rares → communes reste libre.
      expect((await snap(bId)).exchangeWeek).toMatchObject({ rares: 600 });
      await ps.tradeResources(bId, "reinforcedSteel", "scrap", 10);
      expect(await ps.tradeResources(bId, "energy", "cyberModule", 40_000)).toMatchObject({ gained: 400 });
      await expect(ps.tradeResources(bId, "scrap", "aiFragment", 100)).rejects.toThrow(/Reviens lundi/);
    } finally {
      await admin.collection("game_config").update(rules.id, { data: rulesBefore });
      await admin.collection("players").update(bId, { resources: bBefore?.resources, exchangeWeek: null });
      await loginPlayer(B.email, B.pw);
    }
  }, 60_000);

  it("6.14.106 (AE-L3) défaites par 24 h : attaque refusée après 4, flotte en vol renvoyée à l'arrivée", async () => {
    await ensureAB();
    const rules = await admin.collection("game_config").getFirstListItem('key="rules"');
    const rulesBefore = rules.data as { pvp?: object };
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    const H = 3_600_000;
    const now = Date.now();
    const reports: string[] = [];
    const fleets: string[] = [];
    try {
      await admin.collection("game_config").update(rules.id, { data: { ...rulesBefore, pvp: { ...(rulesBefore.pvp ?? {}), maxDefeatsPer24h: 4 } } });
      await admin.collection("players").update(aId, { createdAtMs: MONTH_AGO(), lastDefeatAtMs: 0, lastAttackAtMs: now - H, ascendedAtMs: 0, vacation: null, xp: bBefore.xp, colonies: [] });
      await admin.collection("players").update(bId, { allianceId: "", units: { fregate: { level: 1, count: 20 } }, createdAtMs: MONTH_AGO(), ascendedAtMs: 0, vacation: null });
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
      // Défaites anciennes de A effacées de la fenêtre (rapports des tests précédents), puis 3 défaites récentes.
      for (const r of await admin.collection("battle_reports").getFullList({ filter: `defenderUid="${aId}" && outcome="attacker_win" && timestamp > ${now - 25 * H}` })) {
        await admin.collection("battle_reports").update(r.id, { timestamp: now - 25 * H });
      }
      // Délai entre deux attaques de B sur A : anciennes attaques des tests précédents reculées de 3 h.
      for (const r of await admin.collection("battle_reports").getFullList({ filter: `attackerUid="${bId}" && defenderUid="${aId}" && timestamp > ${now - 3 * H}` })) await admin.collection("battle_reports").update(r.id, { timestamp: now - 3 * H });
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && targetUid="${aId}" && mission="attack" && departAtMs > ${now - 3 * H}` })) await admin.collection("fleets").update(f.id, { departAtMs: now - 3 * H });
      for (const h of [20, 12, 6]) reports.push((await admin.collection("battle_reports").create({ attackerUid: "pnj_test", defenderUid: aId, outcome: "attacker_win", timestamp: now - h * H })).id);
      await loginPlayer(B.email, B.pw);
      // 3 défaites : le décollage passe.
      const sent = await ps.sendFleet(aId, { fregate: 5 }, "attack");
      fleets.push(sent.id);
      // 4e défaite (par un autre) pendant le vol : à l'arrivée, la flotte rentre sans combattre.
      reports.push((await admin.collection("battle_reports").create({ attackerUid: "pnj_test", defenderUid: aId, outcome: "attacker_win", timestamp: Date.now() - 1000 })).id);
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      const landed = await admin.collection("fleets").getOne(sent.id);
      expect(landed.status).toBe("returning");
      expect(landed.outcome).toBe("none");
      expect(landed.reportId || "").toBe("");
      const notes = await admin.collection("notifications").getFullList({ filter: `player_id="${bId}" && title="Cible protégée"` });
      expect(notes.length).toBeGreaterThanOrEqual(1);
      expect(notes[0].message).toMatch(/perdu 4 combats en défense ces dernières 24 h/);
      // Nouveau décollage : refusé, avec le délai jusqu'à la sortie de la plus ancienne (20 h → encore ≈ 4 h).
      await expect(ps.sendFleet(aId, { fregate: 5 }, "attack")).rejects.toThrow(/perdu 4 combats en défense ces dernières 24 h : il est protégé encore [34] h/);
      for (const n of notes) await admin.collection("notifications").delete(n.id).catch(() => undefined);
    } finally {
      for (const id of reports) await admin.collection("battle_reports").delete(id).catch(() => undefined);
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      await admin.collection("game_config").update(rules.id, { data: rulesBefore });
      await admin.collection("players").update(aId, { lastDefeatAtMs: aBefore?.lastDefeatAtMs ?? 0, lastAttackAtMs: aBefore?.lastAttackAtMs ?? 0, xp: aBefore?.xp, createdAtMs: aBefore?.createdAtMs });
      await admin.collection("players").update(bId, { allianceId: bBefore?.allianceId ?? "", units: bBefore?.units });
      await loginPlayer(B.email, B.pw); // les tests suivants agissent en B
    }
  }, 60_000);

  it("6.14.79 (DP-L4) compte neuf : objectifs du jour parmi les pages ouvertes (I31), une notification « Nouveau » par palier", async () => {
    await ensureAB();
    const N = { pseudo: `Neuf_${suffix}`, email: `neuf${suffix}@test.dev`, pw: "motdepasse5" };
    const rules = await admin.collection("game_config").getFirstListItem('key="rules"');
    const rulesBefore = rules.data;
    logout();
    const nId = (await registerPlayer(N.pseudo, N.email, N.pw)).id;
    try {
      // Tout compte de test est « neuf » (avant la date, il serait ancien dès Fer II).
      await admin.collection("game_config").update(rules.id, { data: { ...(rulesBefore as object), navUnlock: { newAccountsFrom: 1 } } });
      // Nouveau jour : les objectifs sont tirés à la prochaine action, parmi les systèmes ouverts (J0 : Bâtiments, Labo, Unités, Ressources).
      await admin.collection("players").update(nId, { contracts: null, stats: {} });
      await ps.syncPlayer(nId);
      const day = await snap(nId);
      expect(day.contracts.items).toHaveLength(CONTRACT_RULES.perDay);
      for (const c of day.contracts.items) expect(["upgrade_building", "research", "build_units", "spend"], c.type).toContain(c.type);
      expect(day.stats.navAnnounced).toEqual([]);
      // Fer II d'un coup (Fer III compris) : une seule notification qui cite les pages ouvertes, même après plusieurs actions.
      await admin.collection("players").update(nId, { xp: 250 });
      await ps.syncPlayer(nId);
      await ps.syncPlayer(nId);
      const notes = await admin.collection("notifications").getFullList({ filter: `player_id="${nId}" && title ~ "Nouveau :"` });
      expect(notes).toHaveLength(1);
      expect(notes[0].title).toMatch(/^Nouveau : Galaxie, Alliance, Missions, Combats/);
      expect(notes[0].link).toBe("/game/galaxie");
      expect(notes[0].kind).toBe("system");
      const after = await snap(nId);
      expect(after.stats.navAnnounced).toEqual(expect.arrayContaining(["/game/missions", "/game/succes", "/game/journal"]));
      // Le tirage du jour en cours n'est pas refait (I31).
      expect(after.contracts.items.map((c: { id: string }) => c.id)).toEqual(day.contracts.items.map((c: { id: string }) => c.id));
    } finally {
      await admin.collection("game_config").update(rules.id, { data: rulesBefore });
      pb.authStore.clear();
      for (const n of await admin.collection("notifications").getFullList({ filter: `player_id="${nId}"` })) await admin.collection("notifications").delete(n.id).catch(() => undefined);
      await admin.collection("players").delete(nId).catch(() => {});
      await admin.collection("queues").delete(nId).catch(() => {});
      await admin.collection("users").delete(nId).catch(() => {});
      await loginPlayer(B.email, B.pw); // les tests suivants agissent en B
    }
  }, 60_000);

  it("6.14.85 (RL-2) projet de prestige : lancé par le serveur, un à la fois, achevé au rattrapage, points publics (I32)", async () => {
    await ensureAB();
    await loginPlayer(B.email, B.pw);
    const before = await snap(bId);
    const EXTRACTORS = ["extracteur_ferraille", "reacteur_instable", "extracteur_nanocomposants", "archives_fracturees"];
    try {
      const buildings = { ...before.buildings };
      for (const id of EXTRACTORS) buildings[id] = { ...(buildings[id] ?? {}), unlocked: true, level: 10 };
      const plenty = { ...RICH, scrap: 1e9, energy: 1e9, nano: 1e9, data: 1e9 };
      await admin.collection("players").update(bId, { buildings, prestige: null, vacation: null, resources: plenty, resourcesUpdatedAtMs: Date.now() });
      const st = await ps.startPrestigeProject();
      expect(st.active?.endsAtMs ?? 0).toBeGreaterThan(Date.now() + 7 * 3_600_000);
      const paid = await snap(bId);
      expect(paid.resources.scrap).toBeLessThan(1e9);
      await expect(ps.startPrestigeProject()).rejects.toThrow(/un seul à la fois/);
      // Fin forcée : le rattrapage suivant achève le projet (compteur, points, notification), dans la transaction de l'action.
      await admin.collection("players").update(bId, { prestige: { ...paid.prestige, active: { ...paid.prestige.active, endsAtMs: Date.now() - 1000 } } });
      await ps.syncPlayer(bId);
      const after = await snap(bId);
      expect(after.prestige).toMatchObject({ projects: 1, points: 8, active: null });
      const notes = await admin.collection("notifications").getFullList({ filter: `player_id="${bId}" && title="Projet de prestige achevé"` });
      expect(notes).toHaveLength(1);
      expect(notes[0].link).toBe("/game/prestige");
      // Fiche publique et classement « Prestige ».
      const profile = await admin.collection("profiles").getOne(bId);
      expect(profile.prestigePoints).toBe(8);
      expect(profile.prestigeProjects).toBe(1);
      const top = await ps.fetchPrestigeLeaderboard(10);
      expect(top.find((e) => e.uid === bId)?.prestigePoints).toBe(8);
    } finally {
      await admin.collection("players").update(bId, { buildings: before.buildings, resources: before.resources, prestige: null, xp: before.xp, unlockedAchievements: before.unlockedAchievements, titles: before.titles ?? [], stats: before.stats ?? {}, resourcesUpdatedAtMs: Date.now() });
      for (const n of await admin.collection("notifications").getFullList({ filter: `player_id="${bId}" && title="Projet de prestige achevé"` })) await admin.collection("notifications").delete(n.id).catch(() => undefined);
    }
  }, 60_000);

  it("6.11.1 base avancée : défend sa colonie quand l'admin l'active", async () => {
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    const colonyId = `${aId}-c1`;
    const colony = {
      id: colonyId, slot: 1, name: "Rempart-Sud", foundedAtMs: Date.now() - 86400000, updatedAtMs: Date.now(),
      buildings: { extracteur_ferraille: { level: 1, unlocked: true }, entrepot: { level: 1, unlocked: true }, hangar_defense: { level: 1, unlocked: true } },
      resources: { ...RICH }, building: null, defenses: {}, defenseJob: null,
    };
    const fleets: string[] = [];
    const rulesRec = await admin.collection("game_config").getFirstListItem('key="rules"').catch(() => null);
    const rulesBefore = rulesRec ? rulesRec.data : null;
    try {
      const data = Object.assign({}, rulesBefore || {}, { colonyBase: Object.assign({}, (rulesBefore || {}).colonyBase || {}, { defendsColony: true }) });
      if (rulesRec) await admin.collection("game_config").update(rulesRec.id, { data });
      else await admin.collection("game_config").create({ key: "rules", data });
      await admin.collection("players").update(aId, { colonies: [colony], createdAtMs: MONTH_AGO(), lastDefeatAtMs: 0, ascendedAtMs: 0, xp: (await snap(bId)).xp, units: { chasseur: { level: 1, count: 30 } } });
      await admin.collection("players").update(bId, { allianceId: "", units: { chasseur: { level: 1, count: 40 } }, createdAtMs: MONTH_AGO(), ascendedAtMs: 0 });
      const base = await admin.collection("fleets").create({
        ownerUid: aId, ownerPseudo: aBefore!.pseudo, targetUid: colonyId, targetPseudo: "Rempart-Sud", mission: "colonybase", units: { chasseur: 20 },
        departAtMs: Date.now() - 7200000, arriveAtMs: Date.now() - 3600000, returnAtMs: 0, status: "stationed", durationMs: 14 * 86400000,
        stationedUntilMs: Date.now() + 10 * 86400000, base: { colonyId }, recalled: false, loot: null, reportId: "", outcome: "",
      });
      fleets.push(base.id);
      const sent = await ps.sendFleet(colonyId, { chasseur: 30 }, "attack");
      fleets.push(sent.id);
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      const landed = await admin.collection("fleets").getOne(sent.id);
      const report = await admin.collection("battle_reports").getOne(landed.reportId);
      expect(report.garrisons).toHaveLength(1);
      const after = await admin.collection("fleets").getOne(base.id);
      expect((after.units as Record<string, number>).chasseur ?? 0).toBeLessThanOrEqual(20);
      // 6.11.4 (E1) : le combat laisse un champ de débris sur la colonie, sous une clé de 15 caractères.
      const field = await admin.collection("debris_fields").getOne(debrisKey(colonyId));
      expect(field.locationId).toBe(colonyId);
      expect(Number(field.scrap) + Number(field.energy)).toBeGreaterThan(0);
      await admin.collection("debris_fields").delete(field.id);
    } finally {
      for (const r of await admin.collection("battle_reports").getFullList({ filter: `attackerUid="${bId}" && planetId="${colonyId}"` })) await admin.collection("battle_reports").delete(r.id).catch(() => undefined);
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      const cur = await admin.collection("game_config").getFirstListItem('key="rules"').catch(() => null);
      if (cur) {
        if (rulesBefore) await admin.collection("game_config").update(cur.id, { data: rulesBefore });
        else await admin.collection("game_config").delete(cur.id);
      }
      await admin.collection("players").update(aId, { colonies: [], resources: aBefore!.resources, lastDefeatAtMs: aBefore!.lastDefeatAtMs ?? 0, xp: aBefore!.xp, units: aBefore!.units });
      await admin.collection("players").update(bId, { allianceId: bBefore!.allianceId, units: bBefore!.units });
    }
  }, 60_000);

  it("v3.3 anomalies: an impossible stock jump becomes a staff report", async () => {
    const before = await snap(bId);
    const now = Date.now();
    const scan = await admin.collection("game_config").getFirstListItem('key="anomaly_scan"').catch(() => null);
    if (scan) await admin.collection("game_config").delete(scan.id);
    const cleanupLogs: string[] = [];
    const base = { ...before!.resources };
    const jumped = { ...base, reinforcedSteel: (base.reinforcedSteel ?? 0) + 900_000_000 };
    try {
      await admin.collection("players").update(bId, { resources: jumped, resourcesUpdatedAtMs: now - 60_000, resourceHistory: [{ t: now - 3600_000, r: base }] });
      const edit = await admin.collection("admin_logs").create({ actorId: "x", actorName: "Testeur", action: "update", targetCollection: "players", recordId: bId, recordLabel: "B", changes: { resources: { avant: 1, après: 2 } }, reason: "essai", createdAtMs: now - 90_000 });
      cleanupLogs.push(edit.id);
      await expect(pb.send("/api/cosmic/admin/anomalies", { method: "POST" })).rejects.toMatchObject({ status: 403 });
      const res = await admin.send("/api/cosmic/admin/anomalies", { method: "POST" });
      expect(res.alerts).toBeGreaterThanOrEqual(1);
      const report = await admin.collection("reports").getFirstListItem(`autoKey="anomaly:${bId}"`);
      expect(report.category).toBe("account");
      expect(report.description).toMatch(/Acier renforcé \+900/);
      expect(report.description).toMatch(/Édition admin par Testeur .* motif : essai/);
      expect(report.title).toMatch(/édition admin/);
      expect((await admin.send("/api/cosmic/admin/anomalies", { method: "POST" })).alerts).toBe(0); // déjà analysé
    } finally {
      const reports = await admin.collection("reports").getFullList({ filter: `autoKey="anomaly:${bId}"` });
      for (const r of reports) await admin.collection("reports").delete(r.id);
      for (const id of cleanupLogs) await admin.collection("admin_logs").delete(id).catch(() => undefined);
      await admin.collection("players").update(bId, { resources: before!.resources, resourceHistory: before!.resourceHistory ?? [] });
    }
  }, 60_000);

  it("v3.2 alliance war: declaration paid by the treasury, points in combat, surrender and rewards", async () => {
    // Connecté en B (fondateur de X) ; A dirige Y.
    const aClient = new PocketBase(PB_TEST_URL);
    await aClient.collection("users").authWithPassword(A.email, A.pw);
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    const X = await admin.collection("alliances").create({ name: `Xeno ${suffix}`, tag: "XEN", createdBy: bId, members: [bId, "fx1", "fx2"], memberPseudos: {}, treasury: { scrap: 10_000_000, energy: 10_000_000 } });
    const Y = await admin.collection("alliances").create({ name: `Ypsi ${suffix}`, tag: "YPS", createdBy: aId, members: [aId, "fy1", "fy2"], memberPseudos: {}, treasury: {} });
    const wars: string[] = [];
    try {
      await admin.collection("players").update(bId, { allianceId: X.id, units: { chasseur: { level: 5, count: 100 }, cargo: { level: 5, count: 50 } }, createdAtMs: MONTH_AGO(), titles: [], activeTitle: "" });
      await admin.collection("players").update(aId, { allianceId: Y.id, units: {}, createdAtMs: MONTH_AGO(), lastDefeatAtMs: 0, lastAttackAtMs: Date.now() - 1000, xp: bBefore!.xp, resources: RICH });
      const war = await pb.send("/api/cosmic/war", { method: "POST", body: { action: "declare", targetAllianceId: Y.id } });
      wars.push(war.id);
      expect(war.status).toBe("preparing");
      expect((await admin.collection("alliances").getOne(X.id)).treasury.scrap).toBe(5_000_000);
      await expect(pb.send("/api/cosmic/war", { method: "POST", body: { action: "declare", targetAllianceId: Y.id } })).rejects.toMatchObject({ status: 400 });
      // Les hostilités commencent : une attaque gagnée rapporte 3 points.
      await admin.collection("alliance_wars").update(war.id, { startMs: Date.now() - 1000 });
      const { report } = await attackAndResolve(aId, { chasseur: 50, cargo: 10 });
      expect(report.outcome).toBe("attacker_win");
      const scored = await pb.collection("alliance_wars").getOne(war.id);
      expect(scored.scoreAttacker).toBeGreaterThanOrEqual(3);
      // Pendant la guerre, une nouvelle attaque sur la même cible est possible après 1 h (et non 2 h).
      await expect(ps.sendFleet(aId, { chasseur: 1 })).rejects.toThrow(/bouclier|récemment|min/);
      // B (fondateur de X) se rend : Y gagne trésor et titre.
      await pb.send("/api/cosmic/war", { method: "POST", body: { action: "surrender", warId: war.id } });
      const ended = await pb.collection("alliance_wars").getOne(war.id);
      expect(ended.status).toBe("ended");
      expect(ended.winnerId).toBe(Y.id);
      expect(ended.rewarded).toBe(true);
      expect(ended.seasonId).toBeTruthy();
      expect((await admin.collection("alliances").getOne(Y.id)).treasury.scrap).toBe(20_000_000);
      expect((await snap(aId))!.titles.some((t: { label: string }) => t.label === "Vainqueurs")).toBe(true);
      await expect(aClient.send("/api/cosmic/war", { method: "POST", body: { action: "surrender", warId: war.id } })).rejects.toMatchObject({ status: 400 });
    } finally {
      for (const id of wars) await admin.collection("alliance_wars").delete(id).catch(() => undefined);
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}"` })) await admin.collection("fleets").delete(f.id);
      await admin.collection("alliances").delete(X.id);
      await admin.collection("alliances").delete(Y.id);
      await admin.collection("players").update(aId, { allianceId: aBefore!.allianceId ?? "", units: aBefore!.units, resources: aBefore!.resources, xp: aBefore!.xp, titles: aBefore!.titles, activeTitle: aBefore!.activeTitle ?? "", lastDefeatAtMs: aBefore!.lastDefeatAtMs ?? 0 });
      await admin.collection("players").update(bId, { allianceId: bBefore!.allianceId ?? "", units: bBefore!.units, resources: bBefore!.resources, titles: bBefore!.titles, activeTitle: bBefore!.activeTitle ?? "" });
    }
  }, 60_000);

  it("5.17 territory war: opened by the staff, combat points in the target's sector, close and rewards", async () => {
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    const old = await admin.collection("game_config").getFirstListItem(`key="territory_war"`).catch(() => null);
    if (old) await admin.collection("game_config").delete(old.id);
    const X = await admin.collection("alliances").create({ name: `Terra ${suffix}`, tag: "TRX", createdBy: bId, members: [bId], memberPseudos: {}, treasury: {} });
    const Y = await admin.collection("alliances").create({ name: `Ursa ${suffix}`, tag: "URS", createdBy: aId, members: [aId], memberPseudos: {}, treasury: {} });
    try {
      await admin.collection("players").update(bId, { allianceId: X.id, units: { chasseur: { level: 5, count: 100 }, cargo: { level: 5, count: 50 } }, createdAtMs: MONTH_AGO(), titles: [], activeTitle: "" });
      await admin.collection("players").update(aId, { allianceId: Y.id, units: {}, createdAtMs: MONTH_AGO(), lastDefeatAtMs: 0, lastAttackAtMs: 0, xp: bBefore!.xp, resources: RICH });
      // Un joueur ne peut pas ouvrir la guerre.
      await expect(pb.send("/api/cosmic/admin/territory-war", { method: "POST", body: { action: "start", hours: 2 } })).rejects.toMatchObject({ status: 403 });
      const opened = await admin.send("/api/cosmic/admin/territory-war", { method: "POST", body: { action: "start", hours: 2 } });
      expect(opened).toMatchObject({ status: "active", manual: true });
      await expect(admin.send("/api/cosmic/admin/territory-war", { method: "POST", body: { action: "start", hours: 2 } })).rejects.toMatchObject({ status: 400 });
      // Délai entre deux attaques sur la même cible : on recule les combats des tests précédents.
      for (const r of await admin.collection("battle_reports").getFullList({ filter: `attackerUid="${bId}" && defenderUid="${aId}"` })) await admin.collection("battle_reports").update(r.id, { timestamp: r.timestamp - 3 * 3600_000 });
      const { report } = await attackAndResolve(aId, { chasseur: 50, cargo: 10 });
      expect(report.outcome).toBe("attacker_win");
      // Lisible par tous : carte en direct.
      const live = (await pb.collection("game_config").getFirstListItem(`key="territory_war"`)).data;
      const sector = String(sectorOf(aId));
      expect(live.points[sector][X.id]).toBe(10);
      expect(live.tags[X.id]).toBe("TRX");
      expect(live.feed.at(-1).text).toContain(sectorLabel(Number(sector)));
      const tokens0 = (await snap(bId)).casino?.tokens ?? 0;
      const closed = await admin.send("/api/cosmic/admin/territory-war", { method: "POST", body: { action: "close" } });
      expect(closed).toMatchObject({ status: "closed", rewarded: true });
      expect(closed.results[0]).toMatchObject({ allianceId: X.id, sectors: [Number(sector)], points: 10 });
      const bAfter = await snap(bId);
      expect((bAfter.casino?.tokens ?? 0) - tokens0).toBe(3 + 10);
      expect(bAfter.titles.some((t: { label: string }) => t.label === "Conquérant des secteurs")).toBe(true);
      const notes = await admin.collection("notifications").getFullList({ filter: `player_id="${bId}" && title="Guerre de territoire terminée"` });
      expect(notes.length).toBe(1);
      await expect(admin.send("/api/cosmic/admin/territory-war", { method: "POST", body: { action: "close" } })).rejects.toMatchObject({ status: 400 });
    } finally {
      const cfg = await admin.collection("game_config").getFirstListItem(`key="territory_war"`).catch(() => null);
      if (cfg) await admin.collection("game_config").delete(cfg.id);
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}"` })) await admin.collection("fleets").delete(f.id);
      await admin.collection("alliances").delete(X.id);
      await admin.collection("alliances").delete(Y.id);
      await admin.collection("players").update(aId, { allianceId: aBefore!.allianceId ?? "", units: aBefore!.units, resources: aBefore!.resources, xp: aBefore!.xp, titles: aBefore!.titles, activeTitle: aBefore!.activeTitle ?? "", lastDefeatAtMs: aBefore!.lastDefeatAtMs ?? 0 });
      await admin.collection("players").update(bId, { allianceId: bBefore!.allianceId ?? "", units: bBefore!.units, resources: bBefore!.resources, titles: bBefore!.titles, activeTitle: bBefore!.activeTitle ?? "", casino: bBefore!.casino ?? null });
    }
  }, 60_000);

  it("5.17.1 activity audit: XP ledger by source, overview and player audit, admins only", async () => {
    // B (connecté) a gagné de l'XP en combat dans les tests précédents : le registre la range par source.
    const b = await snap(bId);
    expect(Object.keys(b.stats?.xpHours ?? {}).length).toBeGreaterThan(0);
    await expect(pb.send("/api/cosmic/admin/activity", { method: "GET" })).rejects.toMatchObject({ status: 403 });
    await expect(pb.send(`/api/cosmic/admin/player-audit?q=${B.pseudo}`, { method: "GET" })).rejects.toMatchObject({ status: 403 });
    const overview = await admin.send("/api/cosmic/admin/activity?window=7d", { method: "GET" });
    expect(overview.window).toBe("7d");
    expect(overview.missionCeiling24h).toBe(23_040);
    const row = overview.rows.find((r: { uid: string }) => r.uid === bId);
    // Registre ouvert pendant ce test : il ne couvre pas 7 jours, la reconstitution fait foi.
    expect(row).toMatchObject({ pseudo: B.pseudo, gainedSource: "notifications" });
    expect(row.gained.bySource.attack).toBeGreaterThan(0);
    const audit = await admin.send(`/api/cosmic/admin/player-audit?q=${encodeURIComponent(B.pseudo)}`, { method: "GET" });
    expect(audit.player.uid).toBe(bId);
    expect(audit.windows["7d"].ledger.bySource.attack).toBeGreaterThan(0);
    expect(audit.windows["7d"].bestSource).toBe("notifications");
    expect(audit.battleCount).toBeGreaterThan(0);
    expect(audit.pairs.some((x: { uid: string }) => x.uid === aId)).toBe(true);
    expect(Array.isArray(audit.flags)).toBe(true);
    expect(audit.stats.xpHours).toBeUndefined();
    await expect(admin.send("/api/cosmic/admin/player-audit?q=personne-de-ce-nom-zz", { method: "GET" })).rejects.toMatchObject({ status: 404 });
  });

  it("v2.1 Syndicat Gravhorn: hunts aggressors, prices the contract on plunder, raids the home fleet", async () => {
    const H = 3600_000;
    const now = Date.now();
    const legacy = { notoriety: 2, repelled: 1, lairOpen: false, nextListAtMs: now + 100 * H, ultimatum: null, raidUntilMs: 0, raidsWon: 1, raidsLost: 0, tributesPaid: 0, lairsTaken: 0 };
    const reports: string[] = [];
    // Ancien format v2.0 (état de Varan à plat) + trois victoires récentes de B.
    await admin.collection("players").update(bId, {
      pirates: legacy,
      createdAtMs: now - 30 * 24 * H,
      resources: RICH,
      units: { canon_plasma: { level: 1, count: 80 }, chasseur: { level: 3, count: 3000 } },
    });
    try {
      for (let i = 0; i < 3; i++) {
        const r = await admin.collection("battle_reports").create({ attackerUid: bId, defenderUid: aId, outcome: "attacker_win", timestamp: now - i * H, loot: { scrap: 100_000, energy: 20_000 } });
        reports.push(r.id);
      }
      // Premier passage : migration, puis la date de la première traque est fixée.
      await admin.send("/api/cosmic/admin/pirates", { method: "POST", body: { uid: bId } });
      let st = (await snap(bId)).pirates;
      expect(st.varan).toMatchObject({ notoriety: 2, raidsWon: 1 });
      expect(st.gravhorn.nextListAtMs).toBeGreaterThan(now);
      await admin.collection("players").update(bId, { pirates: { ...st, gravhorn: { ...st.gravhorn, nextListAtMs: now - 1 } } });
      expect((await admin.send("/api/cosmic/admin/pirates", { method: "POST", body: { uid: bId } })).changed).toBe(1);
      st = (await snap(bId)).pirates;
      // 50 % du butin des 7 derniers jours (au moins celui des trois rapports ci-dessus).
      expect(st.gravhorn.ultimatum.tribute.scrap).toBeGreaterThanOrEqual(150_000);
      expect(st.gravhorn.ultimatum.tribute.energy).toBeGreaterThanOrEqual(30_000);

      // Refus : l'Unité Ambre vise la flotte à quai, B la repousse.
      const rareBefore = (await snap(bId)).resources.aiFragment;
      const refused = await ps.answerPirateUltimatum("refuse");
      expect(refused.raid).toMatchObject({ factionId: "gravhorn" });
      const raid = (await pb.collection("fleets").getFullList({ filter: `targetUid="${bId}" && mission="pirate" && factionId="gravhorn"`, sort: "-departAtMs" }))[0];
      expect(raid).toMatchObject({ factionId: "gravhorn", ownerPseudo: "L'Unité Ambre" });
      await wait(Math.max(0, refused.raid!.arriveAtMs - Date.now()) + 400);
      await ps.syncPlayer("");
      const after = await snap(bId);
      expect(after.pirates.gravhorn).toMatchObject({ raidsWon: 1, notoriety: 1, repelled: 1 });
      expect(after.resources.aiFragment).toBe(rareBefore + 200);
      const report = await pb.collection("battle_reports").getOne((await admin.collection("fleets").getOne(raid.id)).reportId);
      expect(report).toMatchObject({ outcome: "defender_win", attackerPseudo: "L'Unité Ambre (Syndicat Gravhorn)" });
    } finally {
      for (const id of reports) await admin.collection("battle_reports").delete(id);
      for (const f of await admin.collection("fleets").getFullList({ filter: `targetUid="${bId}" || ownerUid="${bId}"` })) await admin.collection("fleets").delete(f.id);
      await admin.collection("players").update(bId, { pirates: null });
    }
  }, 60_000);

  it("sends private messages with read receipts, blocking and privacy", async () => {
    await loginPlayer(A.email, A.pw);
    const sent = await ms.sendPrivateMessage(bId, "  Salut Bravo !  ");
    expect(sent).toMatchObject({ fromUid: aId, toUid: bId, fromPseudo: A.pseudo, toPseudo: B.pseudo, text: "Salut Bravo !", readAtMs: 0 });
    await ms.sendPrivateMessage(bId, "Tu es là ?");
    await expect(ms.sendPrivateMessage(aId, "moi-même")).rejects.toThrow("Destinataire");
    await expect(ms.sendPrivateMessage(bId, "   ")).rejects.toThrow("vide");
    // Personne d'autre ne peut écrire directement dans la collection.
    await expect(pb.collection("private_messages").create({ fromUid: aId, toUid: bId, text: "direct" })).rejects.toBeTruthy();

    await loginPlayer(B.email, B.pw);
    const notes = await pb.collection("notifications").getFullList({ filter: `player_id="${bId}" && kind="message"` });
    expect(notes.length).toBe(1); // une seule notification tant que rien n'est lu
    const inbox = await pb.collection("private_messages").getFullList({ filter: `toUid="${bId}"` });
    expect(inbox.length).toBe(2);
    expect((await ms.markConversationRead(aId)).read).toBe(2);
    expect((await pb.collection("private_messages").getOne(sent.id)).readAtMs).toBeGreaterThan(0);

    const block = await ms.blockPlayer(bId, aId, A.pseudo);
    await loginPlayer(A.email, A.pw);
    await expect(ms.sendPrivateMessage(bId, "encore")).rejects.toThrow("ne reçoit pas");
    // Le blocage de B n'est pas visible par A.
    expect((await pb.collection("message_blocks").getFullList()).length).toBe(0);
    await loginPlayer(B.email, B.pw);
    await ms.unblock(block.id);
    await loginPlayer(A.email, A.pw);
    await ms.sendPrivateMessage(bId, "Débloqué");
    for (const m of await admin.collection("private_messages").getFullList({ filter: `fromUid="${aId}"` })) await admin.collection("private_messages").delete(m.id);
    await loginPlayer(B.email, B.pw);
  });

  it("shares a battle report with any logged-in player who has the link", async () => {
    const report = await admin.collection("battle_reports").create({
      attackerUid: aId, attackerPseudo: A.pseudo, defenderUid: bId, defenderPseudo: B.pseudo, timestamp: Date.now(), outcome: "attacker_win",
      attackerPower: 100, defenderPower: 50, attackerLossPercent: 10, defenderLossPercent: 60, loot: { scrap: 500 },
    });
    try {
      await loginPlayer(A.email, A.pw);
      const url = await srs.shareReport("battle", report.id);
      const id = url.split("/").pop()!;
      expect(await srs.shareReport("battle", report.id)).toBe(url); // même lien la deuxième fois
      await loginPlayer(B.email, B.pw);
      const shared = await srs.fetchSharedReport(id);
      expect(shared).toMatchObject({ kind: "battle", ownerUid: aId, ownerPseudo: A.pseudo });
      expect((shared.data as { loot: Record<string, number> }).loot.scrap).toBe(500);
      // Pas de liste, et seul un participant partage.
      await expect(pb.collection("shared_reports").getList(1, 10)).rejects.toBeTruthy();
      await expect(new PocketBase(PB_TEST_URL!).collection("shared_reports").getOne(id)).rejects.toBeTruthy();
      const other = await admin.collection("battle_reports").create({ attackerUid: "x", defenderUid: "y", timestamp: Date.now(), outcome: "draw" });
      await expect(srs.shareReport("battle", other.id)).rejects.toThrow("propres rapports");
      await admin.collection("battle_reports").delete(other.id);
      await admin.collection("shared_reports").delete(id);
    } finally {
      await admin.collection("battle_reports").delete(report.id);
      await loginPlayer(B.email, B.pw);
    }
  });

  it("v3.8 diplomacy: pact proposed, accepted, blocks attacks and war, shared channel, notice on break", async () => {
    const before = { a: (await snap(aId)).allianceId ?? "", b: (await snap(bId)).allianceId ?? "" };
    const X = await admin.collection("alliances").create({ name: "Pacte X", tag: `X${suffix.slice(0, 3)}`, createdBy: aId, createdAtMs: Date.now(), members: [aId], memberPseudos: { [aId]: A.pseudo }, roles: {} });
    const Y = await admin.collection("alliances").create({ name: "Pacte Y", tag: `Y${suffix.slice(0, 3)}`, createdBy: bId, createdAtMs: Date.now(), members: [bId], memberPseudos: { [bId]: B.pseudo }, roles: {} });
    await admin.collection("players").update(aId, { allianceId: X.id });
    await admin.collection("players").update(bId, { allianceId: Y.id });
    try {
      await loginPlayer(A.email, A.pw);
      const pact = await ds.diplomacy("propose", { targetAllianceId: Y.id });
      expect(pact).toMatchObject({ status: "proposed", allianceA: X.id, allianceB: Y.id });
      await expect(ds.diplomacy("accept", { pactId: pact.id })).rejects.toThrow("invitée");
      await ds.diplomacy("message", { pactId: pact.id, text: "On signe ?" });
      await ds.diplomacy("message", { pactId: pact.id, text: "Réponse attendue." });
      // v4.0 : l'autre alliance est prévenue, une seule fois par salve.
      const pactNotes = await admin.collection("notifications").getFullList({ filter: `player_id="${bId}" && link="/game/alliance?onglet=diplomatie&pacte=${pact.id}"` });
      expect(pactNotes).toHaveLength(1);
      expect(pactNotes[0]).toMatchObject({ kind: "alliance", title: `Canal diplomatique [${X.tag}]` });
      expect(pactNotes[0].message).toContain("On signe ?");
      expect(await admin.collection("notifications").getFullList({ filter: `player_id="${aId}" && link~"pacte=${pact.id}"` })).toHaveLength(0);
      // Réglage : le joueur coupe le canal diplomatique, plus rien n'arrive.
      await admin.collection("notifications").delete(pactNotes[0].id);
      const bClient = new PocketBase(PB_TEST_URL!);
      await bClient.collection("users").authWithPassword(B.email, B.pw);
      await bClient.collection("players").update(bId, { notifPrefs: { pactMessages: false } });
      await ds.diplomacy("message", { pactId: pact.id, text: "Toujours là ?" });
      expect(await admin.collection("notifications").getFullList({ filter: `player_id="${bId}" && link~"pacte=${pact.id}"` })).toHaveLength(0);
      await bClient.collection("players").update(bId, { notifPrefs: null });

      await loginPlayer(B.email, B.pw);
      // 6.14.19 : liste sans tri garanti (messages créés dans la même seconde) : on cherche le message par son texte.
      expect((await pb.collection("pact_messages").getFullList({ filter: `pactId="${pact.id}"` })).find((m) => m.text === "On signe ?")).toMatchObject({ authorTag: X.tag });
      expect((await ds.diplomacy("accept", { pactId: pact.id })).status).toBe("active");
      // 5.18 : le pacte n'interdit plus l'attaque à titre personnel, seulement la guerre d'alliance.
      for (const r of await admin.collection("battle_reports").getFullList({ filter: `attackerUid="${bId}" && defenderUid="${aId}"` })) await admin.collection("battle_reports").update(r.id, { timestamp: r.timestamp - 3 * 3600_000 });
      const xpBefore = { a: (await snap(aId)).xp, b: (await snap(bId)).xp };
      await admin.collection("players").update(aId, { lastDefeatAtMs: 0, xp: xpBefore.b });
      await admin.collection("players").update(bId, { units: { chasseur: { level: 5, count: 20 } } });
      const personal = await ps.sendFleet(aId, { chasseur: 1 });
      expect(personal.mission).toBe("attack");
      await admin.collection("fleets").delete(personal.id);
      await admin.collection("players").update(aId, { xp: xpBefore.a });

      await expect(pb.send("/api/cosmic/war", { method: "POST", body: { action: "declare", targetAllianceId: X.id } })).rejects.toMatchObject({ status: 400 });

      const ending = await ds.diplomacy("break", { pactId: pact.id });
      expect(ending.status).toBe("ending");
      expect(ending.endsAtMs).toBeGreaterThan(Date.now() + 23 * 3600_000);
      // Un tiers ne lit pas le canal.
      await expect(new PocketBase(PB_TEST_URL!).collection("pact_messages").getFullList()).resolves.toHaveLength(0);
    } finally {
      for (const m of await admin.collection("pact_messages").getFullList({ filter: `allianceA="${X.id}"` })) await admin.collection("pact_messages").delete(m.id);
      for (const p of await admin.collection("alliance_pacts").getFullList({ filter: `allianceA="${X.id}"` })) await admin.collection("alliance_pacts").delete(p.id);
      await admin.collection("players").update(aId, { allianceId: before.a });
      await admin.collection("players").update(bId, { allianceId: before.b });
      await admin.collection("alliances").delete(X.id);
      await admin.collection("alliances").delete(Y.id);
      await loginPlayer(B.email, B.pw);
    }
  });

  it("v3.8 weekly challenge: market trades count, closing pays participants and titles the top", async () => {
    const existing = await admin.collection("game_config").getFirstListItem('key="challenge"').catch(() => null);
    const now = Date.now();
    const current = { id: "wk-test", type: "market", target: 1000, startMs: now - 1000, endMs: now + 3_600_000, total: 0, contributions: {}, status: "active", success: false };
    const rec = existing
      ? await admin.collection("game_config").update(existing.id, { data: { current, previous: null, titleHolder: null } })
      : await admin.collection("game_config").create({ key: "challenge", data: { current, previous: null, titleHolder: null } });
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    try {
      await admin.collection("players").update(aId, { resources: { ...aBefore!.resources, scrap: 1_000_000, energy: 1_000_000 } });
      await admin.collection("players").update(bId, { resources: { ...bBefore!.resources, scrap: 1_000_000, energy: 1_000_000 } });
      await loginPlayer(A.email, A.pw);
      const offer = await pb.send("/api/cosmic/market/create", { method: "POST", body: { giveRes: "scrap", giveAmount: 20_000, wantRes: "energy", wantAmount: 20_000 } });
      await loginPlayer(B.email, B.pw);
      await pb.send("/api/cosmic/market/accept", { method: "POST", body: { id: offer.id } });

      let state = (await admin.collection("game_config").getOne(rec.id)).data;
      expect(state.current.contributions[bId].amount).toBe(20_000);
      expect(state.current.contributions[aId].amount).toBeGreaterThan(18_000); // reçu moins la taxe
      const aiBefore = (await snap(bId)).resources.aiFragment ?? 0;

      // Échéance passée : clôture, récompenses (palier 150 %) et titre.
      await admin.collection("game_config").update(rec.id, { data: { ...state, current: { ...state.current, endMs: Date.now() - 1 } } });
      state = await admin.send("/api/cosmic/admin/challenge", { method: "POST", body: {} });
      expect(state.previous).toMatchObject({ id: "wk-test", status: "done", success: true });
      // v5.10 : la récompense se réclame (connecté en B).
      await pb.send("/api/cosmic/challenge/claim", { method: "POST" });
      expect((await snap(bId)).resources.aiFragment).toBe(aiBefore + 600);
      expect(state.titleHolder.uid).toBe(bId);
      expect((await snap(bId)).activeTitle).toBe("Pilier de la semaine");
      const notes = await admin.collection("notifications").getFullList({ filter: `player_id="${aId}" && title~"Défi de la semaine"` });
      expect(notes.length).toBe(1);
    } finally {
      if (existing) await admin.collection("game_config").update(rec.id, { data: existing.data });
      else await admin.collection("game_config").delete(rec.id);
      await admin.collection("players").update(bId, { titles: [], activeTitle: "" });
      for (const n of await admin.collection("notifications").getFullList({ filter: `title~"Défi de la semaine"` })) await admin.collection("notifications").delete(n.id);
    }
  });

  it("v3.9 bounties: hunt paid in amber, shop items, Kesh emojis, beacon and weekly elite", async () => {
    await loginPlayer(B.email, B.pw);
    const before = await snap(bId);
    const fleets: string[] = [];
    const elite = await admin.collection("game_config").getFirstListItem('key="bounty_elite"').catch(() => null);
    try {
      await admin.collection("players").update(bId, { units: { chasseur: { level: 1, count: 200 } }, workshop: null, resources: RICH, bounties: {} });
      const board = viewBounties(await snap(bId), Date.now()).board;
      const contract = board.find((c) => c.tier === 1)!;
      const sent = await bs.sendBountyHunt(contract.id, { chasseur: 200 }, "balanced");
      fleets.push(sent.id);
      expect(sent).toMatchObject({ mission: "bounty", targetUid: `bounty_${contract.id}` });
      await expect(bs.sendBountyHunt(contract.id, { chasseur: 1 }, "balanced")).rejects.toThrow(/déjà/);
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      const landed = await pb.collection("fleets").getOne(sent.id);
      expect(landed.status).toBe("returning");
      expect(landed.outcome).toBe("attacker_win");
      let me = await snap(bId);
      expect(bountyState(me)).toMatchObject({ amber: 10, reputation: 1, completed: 1, doneToday: 1 });
      expect(me.stats.bounties).toBe(1);

      // Comptoir : plan, emojis, échange, brouilleur, Voile de chitine.
      await admin.collection("players").update(bId, { bounties: { ...bountyState(me), amber: 1500 } });
      await expect(ms.sendPrivateMessage(aId, "gg :kesh_gg:")).rejects.toThrow(/Comptoir/);
      await bs.buyBountyItem("emojis");
      await ms.sendPrivateMessage(aId, "gg :kesh_gg:");
      await bs.buyBountyItem("blueprint");
      await expect(bs.buyBountyItem("blueprint")).rejects.toThrow(/Déjà/);
      const rare = (await snap(bId)).resources.aiFragment;
      await bs.exchangeBountyAmber(10);
      await bs.buyBountyItem("shield");
      me = await snap(bId);
      expect(me.units.traqueur_kesh.level).toBe(1);
      expect(me.resources.aiFragment).toBe(rare + 400);
      expect(bountyState(me).amber).toBe(1500 - 80 - 600 - 10 - 150);
      const sheet = await ps.fetchPlayerSheet(bId);
      expect((sheet.feats as unknown as { kesh: { shieldUntilMs: number } }).kesh.shieldUntilMs).toBeGreaterThan(Date.now());

      // Balise de repli : la flotte rentre aussitôt, la prime redevient libre.
      await bs.buyBountyItem("beacon");
      // La première flotte est encore sur le retour : nouveaux vaisseaux à quai.
      await admin.collection("players").update(bId, { units: { ...me.units, chasseur: { level: 1, count: 100 } } });
      const other = viewBounties(me, Date.now()).board.find((c) => c.status === "open")!;
      const hunt = await bs.sendBountyHunt(other.id, { chasseur: 10 }, "balanced");
      fleets.push(hunt.id);
      await bs.fireRecallBeacon(hunt.id);
      expect((await pb.collection("fleets").getOne(hunt.id)).status).toBe("done");
      me = await snap(bId);
      expect(bountyState(me).board.find((c) => c.id === other.id)?.status).toBe("open");
      expect(bountyState(me).beacons).toBe(0);

      // Proie d'élite : créée par la tâche, rang 2 requis, dégâts enregistrés.
      if (elite) await admin.collection("game_config").delete(elite.id);
      const spawned = await admin.send("/api/cosmic/admin/elite", { method: "POST", body: {} });
      expect(spawned.status).toBe("active");
      await expect(bs.sendEliteAssault({ chasseur: 10 }, "balanced")).rejects.toThrow(/rang/);
      await admin.collection("players").update(bId, { bounties: { ...bountyState(me), reputation: 10 } });
      const assault = await bs.sendEliteAssault({ chasseur: 50 }, "balanced");
      fleets.push(assault.id);
      await forceArrival(assault.id);
      await ps.syncPlayer("");
      const cfg = await pb.collection("game_config").getFirstListItem('key="bounty_elite"');
      expect(cfg.data.contributions[bId].damage).toBeGreaterThan(0);
      expect(cfg.data.hp).toBeLessThan(cfg.data.maxHp);
    } finally {
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      const cfg = await admin.collection("game_config").getFirstListItem('key="bounty_elite"').catch(() => null);
      if (cfg) await admin.collection("game_config").delete(cfg.id);
      if (elite) await admin.collection("game_config").create({ key: "bounty_elite", data: elite.data });
      await admin.collection("players").update(bId, { units: before!.units, resources: before!.resources, bounties: {}, stats: before!.stats ?? {}, titles: before!.titles ?? [], activeTitle: before!.activeTitle ?? "" });
    }
  }, 60_000);

  it("v3.9.1 hangar: ships away on a mission still take their place", async () => {
    await loginPlayer(B.email, B.pw);
    const before = await snap(bId);
    const fleets: string[] = [];
    try {
      const fit = Math.floor(getUnitCapacity(before.buildings, "attack") / findUnit("chasseur")!.hangarSpace);
      await admin.collection("players").update(bId, { units: { ...before.units, chasseur: { level: 1, count: fit } }, resources: RICH });
      const patrol = await ps.sendFleet("", { chasseur: fit }, "patrol", { minutes: 30 });
      fleets.push(patrol.id);
      await expect(ps.enqueueUnitBuild(bId, "chasseur", 1)).rejects.toThrow(/hangar/);
    } finally {
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      await admin.collection("players").update(bId, { units: before!.units, resources: before!.resources });
    }
  });

  it("v3.9.2 players only write their pseudo and preferences; mail tool and unsubscribe", async () => {
    await loginPlayer(B.email, B.pw);
    await expect(pb.collection("players").update(bId, { bounties: { amber: 99999 } })).rejects.toMatchObject({ status: 403 });
    await expect(pb.collection("players").update(bId, { colonies: [] })).rejects.toMatchObject({ status: 403 });
    await expect(pb.collection("players").update(bId, { posture: { id: "bunker", changedAtMs: 0 } })).rejects.toMatchObject({ status: 403 });
    await pb.collection("players").update(bId, { allianceLastReadMs: Date.now() });
    await pb.collection("players").update(bId, { emailOptOut: true });
    expect((await snap(bId)).emailOptOut).toBe(true);
    await pb.collection("players").update(bId, { emailOptOut: false });
    // Outil d'envoi : réservé à l'équipe, décompte et envoi « à blanc ».
    await expect(pb.send("/api/cosmic/admin/mail", { method: "POST", body: { action: "count" } })).rejects.toMatchObject({ status: 403 });
    const count = await admin.send("/api/cosmic/admin/mail", { method: "POST", body: { action: "count" } });
    expect(count.recipients).toBeGreaterThanOrEqual(0);
    await expect(admin.send("/api/cosmic/admin/mail", { method: "POST", body: { action: "send", subject: "x", html: "<p>x</p>", apiUrl: PB_TEST_URL } })).rejects.toMatchObject({ status: 400 });
    const dry = await admin.send("/api/cosmic/admin/mail", { method: "POST", body: { action: "send", confirm: "ENVOYER", dryRun: true, subject: "x", html: "<p>x</p>", apiUrl: PB_TEST_URL } });
    expect(dry.dryRun).toBe(true);
    // Désinscription par lien : jeton exigé.
    await admin.collection("players").update(bId, { mailToken: "jeton-de-test-1234567890" });
    const bad = await fetch(`${PB_TEST_URL}/api/cosmic/unsubscribe?u=${bId}&t=faux-jeton-1234567890`);
    expect(await bad.text()).toMatch(/pas valide/);
    expect(await (await fetch(`${PB_TEST_URL}/api/cosmic/unsubscribe?demo=1`)).text()).toMatch(/démonstration/);
    expect((await snap(bId)).emailOptOut).toBe(false);
    const good = await fetch(`${PB_TEST_URL}/api/cosmic/unsubscribe?u=${bId}&t=jeton-de-test-1234567890`, { method: "POST" });
    expect(await good.text()).toMatch(/plus nos nouvelles/);
    expect((await snap(bId)).emailOptOut).toBe(true);
    await admin.collection("players").update(bId, { emailOptOut: false, mailToken: "" });
  });

  it("6.14.52 (AC-1) campagne e-mail : une fiche modifiée pendant l'envoi n'est pas écrasée par la lecture du départ", async () => {
    await ensureAB();
    await loginPlayer(B.email, B.pw);
    const user = await admin.collection("users").getOne(bId);
    const before = await snap(bId);
    try {
      // B est destinataire (compte vérifié, nouvelles acceptées) et n'a pas encore de jeton : la campagne doit le créer.
      await admin.collection("users").update(bId, { verified: true });
      await admin.collection("players").update(bId, { emailOptOut: false, mailToken: "", resources: RICH });
      const traded0 = Number((await snap(bId)).stats?.traded ?? 0);
      // Envoi « à blanc » : destinataires lus, 2,5 s de pause (durée simulée de l'envoi), puis jetons. Rien n'est envoyé.
      const campaign = admin.send("/api/cosmic/admin/mail", { method: "POST", body: { action: "send", confirm: "ENVOYER", dryRun: true, holdMs: 2500, subject: "x", html: "<p>x</p>", apiUrl: PB_TEST_URL } });
      await wait(600);
      // Pendant la campagne, B joue : 1 000 ferraille échangées.
      expect((await ps.tradeResources(bId, "scrap", "energy", 1000)).gained).toBeGreaterThan(0);
      const played = await snap(bId);
      const out = await campaign;
      expect(out.dryRun).toBe(true);
      expect(out.tokens).toBeGreaterThanOrEqual(1);
      const after = await snap(bId);
      // Le jeton est posé, et la partie jouée entre-temps est intacte (l'ancienne fiche n'a pas été réécrite).
      expect(after.mailToken).toMatch(/^.{32}$/);
      expect(Number(after.stats?.traded ?? 0)).toBe(Number(played.stats?.traded ?? 0));
      expect(Number(after.stats?.traded ?? 0)).toBeGreaterThan(traded0);
      expect(Math.floor(after.resources.scrap)).toBe(Math.floor(played.resources.scrap));
      expect(after.resources.scrap).toBeLessThan(RICH.scrap);
      // Deuxième passage : le jeton existant est gardé.
      await admin.send("/api/cosmic/admin/mail", { method: "POST", body: { action: "send", confirm: "ENVOYER", dryRun: true, subject: "x", html: "<p>x</p>", apiUrl: PB_TEST_URL } });
      expect((await snap(bId)).mailToken).toBe(after.mailToken);
    } finally {
      await admin.collection("users").update(bId, { verified: user.verified });
      await admin.collection("players").update(bId, { emailOptOut: false, mailToken: "", resources: before.resources });
    }
  }, 30_000);

  it("6.14.52 (AC-13) le raid du tutoriel part à l'instant de la réclamation", async () => {
    await ensureAB();
    await loginPlayer(B.email, B.pw);
    const before = await snap(bId);
    const purge = async () => {
      for (const f of await admin.collection("fleets").getFullList({ filter: `targetUid="${bId}" && mission="pirate"` })) await admin.collection("fleets").delete(f.id);
    };
    try {
      await purge();
      await admin.collection("players").update(bId, {
        onboarding: { claimed: ["scrap3", "reactor3", "research", "drones5", "mission", "storage2"] },
        units: { ...before.units, roquette: { level: 1, count: 10 } },
        allianceId: "",
      });
      const t0 = Date.now();
      await ps.claimOnboarding("rockets10");
      const raids = (await admin.collection("fleets").getFullList({ filter: `targetUid="${bId}" && mission="pirate"` })).sort((x, y) => x.arriveAtMs - y.arriveAtMs);
      expect(raids).toHaveLength(1);
      // Départ = l'instant de la réclamation (la barre de progression part de zéro), arrivée 2 min plus tard.
      expect(raids[0].departAtMs).toBeGreaterThanOrEqual(t0 - 5000);
      expect(raids[0].departAtMs).toBeLessThanOrEqual(Date.now());
      expect(raids[0].arriveAtMs - raids[0].departAtMs).toBeGreaterThan(60_000);
    } finally {
      await purge();
      await admin.collection("players").update(bId, { units: before.units, onboarding: before.onboarding ?? null, allianceId: before.allianceId ?? "", resources: before.resources, bounties: before.bounties ?? {} });
    }
  });

  it("v4.0 command: commanders, synthesis capsules (decoy hidden from the target) and relics", async () => {
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    const fleets: string[] = [];
    try {
      // Commandants : le premier est offert, le suivant se paie en Ambre ; le navigateur ne peut rien écrire.
      await loginPlayer(B.email, B.pw);
      await expect(pb.collection("players").update(bId, { commanders: { roster: { admiral: { xp: 99999 } }, active: ["admiral"] } })).rejects.toMatchObject({ status: 403 });
      await admin.collection("players").update(bId, {
        commanders: null, relics: null, synthesis: null,
        bounties: { ...(bBefore.bounties ?? {}), amber: 400 },
        buildings: { ...bBefore.buildings, labo_synthese: { level: 3, unlocked: true } },
        units: { ...bBefore.units, chasseur: { level: 1, count: 30 } },
        resources: RICH, createdAtMs: MONTH_AGO(), lastDefeatAtMs: 0, ascendedAtMs: 0, allianceId: "", xp: aBefore.xp,
      });
      expect(await ps.recruitCommander("admiral", "amber")).toEqual({ id: "admiral" });
      expect((await snap(bId)).bounties.amber).toBe(400);
      await ps.recruitCommander("spy", "amber");
      let b = await snap(bId);
      expect(b.bounties.amber).toBe(250);
      expect(b.commanders.active).toEqual(["admiral", "spy"]);
      await expect(ps.recruitCommander("admiral", "amber")).rejects.toThrow(/déjà/);
      await expect(ps.assignCommanders(["admiral", "spy", "steward"])).rejects.toThrow(/postes|recruté/);
      await bs.buyBountyItem("dossier");
      expect((await ps.trainCommander("admiral")).level).toBeGreaterThan(1);

      // Labo de synthèse : synthèse payée, capsules en réserve (fin forcée par l'équipe).
      const crafted = await ps.craftCapsule("assault", 3);
      expect(crafted.level).toBe(3);
      await expect(ps.craftCapsule("decoy", 4)).rejects.toThrow(/niveau 3/);
      b = await snap(bId);
      await admin.collection("players").update(bId, { synthesis: { ...b.synthesis, crafting: { ...b.synthesis.crafting, endsAtMs: Date.now() - 1000 } } });
      await ps.syncPlayer("");
      b = await snap(bId);
      expect(b.synthesis.stock.assault).toEqual([3]);
      await admin.collection("players").update(bId, { synthesis: { ...b.synthesis, stock: { ...b.synthesis.stock, decoy: [2], veil: [1] } } });
      expect((await ps.activateCapsule("veil")).pct).toBe(5);

      // Attaque avec stimulant et leurre : la cible voit une fausse flotte, le serveur combat avec la vraie.
      await admin.collection("players").update(aId, { createdAtMs: MONTH_AGO(), lastDefeatAtMs: 0, ascendedAtMs: 0, allianceId: "" });
      for (const r of await admin.collection("battle_reports").getFullList({ filter: `attackerUid="${bId}" && defenderUid="${aId}"` })) await admin.collection("battle_reports").delete(r.id);
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && targetUid="${aId}"` })) await admin.collection("fleets").delete(f.id);
      const sent = await ps.sendFleet(aId, { chasseur: 20 }, "attack", { capsules: { assault: 3, decoy: 2 } });
      fleets.push(sent.id);
      b = await snap(bId);
      expect(b.synthesis.stock.assault).toEqual([]);
      expect(b.synthesis.decoys[sent.id]).toEqual({ chasseur: 20 });
      const raw = await admin.collection("fleets").getOne(sent.id);
      expect(raw.trueUnits).toEqual({ chasseur: 20 });
      expect(raw.boosts).toEqual({ assault: 15, decoy: 10 });
      await loginPlayer(A.email, A.pw);
      const seen = await pb.collection("fleets").getOne(sent.id);
      expect(seen.trueUnits).toBeUndefined();
      expect(seen.boosts).toBeUndefined();
      expect(Object.values(seen.units as Record<string, number>).reduce((x, y) => x + y, 0)).toBeGreaterThan(0);
      await loginPlayer(B.email, B.pw);
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      const landed = await admin.collection("fleets").getOne(sent.id);
      expect(landed.reportId).not.toBe("");
      expect(landed.trueUnits ?? null).toBeNull();
      const report = await admin.collection("battle_reports").getOne(landed.reportId);
      expect(report.attackerFleet).toEqual({ chasseur: 20 });
      expect((await snap(bId)).synthesis.decoys[sent.id]).toBeUndefined();

      // Reliques : fusion de trois communes, équipement, recyclage contre de l'Ambre.
      const item = (id: string, rarity = "common") => ({ id, template: "engrenage_varan", rarity, foundAtMs: Date.now(), source: "test" });
      await admin.collection("players").update(bId, { relics: { items: [item("r1"), item("r2"), item("r3"), item("r4")], slots: [], aegisWeek: "" } });
      const fused = await ps.fuseRelics("engrenage_varan", "common");
      expect(fused.rarity).toBe("rare");
      await ps.equipRelic(0, fused.id);
      await expect(ps.recycleRelic(fused.id)).rejects.toThrow(/Retire/);
      const amber = (await snap(bId)).bounties.amber;
      expect((await ps.recycleRelic("r4")).amber).toBe(5);
      b = await snap(bId);
      expect(b.bounties.amber).toBe(amber + 5);
      expect(b.relics.slots[0]).toBe(fused.id);
      expect(b.relics.items).toHaveLength(1);

      // Profil : bannière verrouillée refusée, devise nettoyée, vitrine publique.
      await expect(ps.saveProfileStyle({ banner: "leviathan" })).rejects.toThrow(/verrouillée/);
      await ps.saveProfileStyle({ banner: "abysse", motto: "Personne ne passe." });
      const pub = await pb.collection("profiles").getOne(bId);
      expect(pub.feats.showcase.motto).toBe("Personne ne passe.");
      expect(pub.feats.showcase.commanders.map((c: { id: string }) => c.id)).toEqual(["admiral", "spy"]);
      expect(pub.feats.showcase.relics).toEqual([{ template: "engrenage_varan", rarity: "rare" }]);
    } finally {
      for (const id of fleets) await admin.collection("fleets").delete(id).catch(() => undefined);
      await admin.collection("players").update(bId, { units: bBefore.units, resources: bBefore.resources, buildings: bBefore.buildings, bounties: bBefore.bounties, commanders: null, relics: null, synthesis: null, profileStyle: null, xp: bBefore.xp });
      await admin.collection("players").update(aId, { units: aBefore.units, resources: aBefore.resources });
    }
  });

  it("v4.1 season pass, referral, scripted Varan raid and shareable victory card", async () => {
    await withoutPassSeasons(async () => {
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    try {
      // Passe : connexion du jour comptée une fois, palier atteint réclamé une fois.
      await loginPlayer(B.email, B.pw);
      await expect(pb.collection("players").update(bId, { seasonPass: { points: 9999 } })).rejects.toMatchObject({ status: 403 });
      await admin.collection("players").update(bId, { seasonPass: null, bounties: { ...(bBefore.bounties ?? {}), amber: 0 } });
      await ps.syncPlayer("");
      await ps.syncPlayer("");
      let b = await snap(bId);
      expect(b.seasonPass.points).toBe(5);
      await expect(ps.claimPassTier(1)).rejects.toThrow(/pas encore/);
      await admin.collection("players").update(bId, { seasonPass: { ...b.seasonPass, points: 80 } });
      await ps.claimPassTier(2);
      b = await snap(bId);
      expect(b.bounties.amber).toBe(20);
      expect(b.seasonPass.claimed).toEqual([2]);
      await expect(ps.claimPassTier(2)).rejects.toThrow(/déjà/);

      // Parrainage : B (compte récent) choisit A ; récompense à Bronze I, compte vérifié et âgé de 3 jours.
      await admin.collection("players").update(bId, { referral: null, createdAtMs: Date.now() - 3600_000, xp: 0 });
      await expect(rs.declareSponsor(bId)).rejects.toThrow(/propre parrain/);
      expect((await rs.declareSponsor(aId)).sponsor).toBe(A.pseudo);
      await expect(rs.declareSponsor(aId)).rejects.toThrow(/déjà/);
      await admin.collection("players").update(aId, { referral: null, bounties: { ...(aBefore.bounties ?? {}), amber: 0 } });
      const tick = () => admin.send<{ rewarded: number }>("/api/cosmic/admin/referrals", { method: "POST" });
      expect((await tick()).rewarded).toBe(0);
      await admin.collection("players").update(bId, { xp: 2000, createdAtMs: MONTH_AGO() });
      await admin.collection("users").update(bId, { verified: true });
      expect((await tick()).rewarded).toBe(1);
      expect((await snap(aId)).bounties.amber).toBe(150);
      expect((await snap(aId)).referral.recruits).toBe(1);
      expect((await snap(bId)).bounties.amber).toBe(120);
      expect((await tick()).rewarded).toBe(0);

      // Tutoriel : les dix roquettes réclamées envoient l'avant-garde de Varan, une seule fois.
      for (const f of await admin.collection("fleets").getFullList({ filter: `targetUid="${bId}" && ownerUid=""` })) await admin.collection("fleets").delete(f.id);
      await admin.collection("players").update(bId, {
        onboarding: { claimed: ["scrap3", "reactor3", "research", "drones5", "mission", "storage2"] },
        units: { ...bBefore.units, roquette: { level: 1, count: 10 } },
        allianceId: "",
      });
      await ps.claimOnboarding("rockets10");
      b = await snap(bId);
      expect(b.onboarding.tutorialRaid).toBe("sent");
      const raids = await admin.collection("fleets").getFullList({ filter: `targetUid="${bId}" && mission="pirate"` });
      expect(raids).toHaveLength(1);
      await ps.syncPlayer("");
      expect(await admin.collection("fleets").getFullList({ filter: `targetUid="${bId}" && mission="pirate"` })).toHaveLength(1);
      for (const f of raids) await admin.collection("fleets").delete(f.id);

      // Carte de victoire : image publique, page d'aperçu Open Graph, suppression par son auteur seul.
      const jpeg = Uint8Array.from(atob("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q=="), (c) => c.charCodeAt(0));
      const link = await vcs.uploadVictoryCard(new Blob([jpeg], { type: "image/jpeg" }), "Victoire contre <Vorn>", "B · Pertes 0", "/game/rapport/xyz");
      const id = link.split("/").pop()!;
      const page = await fetch(link).then((r) => r.text());
      expect(page).toContain('property="og:image"');
      expect(page).toContain("Victoire contre &lt;Vorn&gt;");
      expect(page).toContain("/game/rapport/xyz");
      await loginPlayer(A.email, A.pw);
      await expect(pb.collection("victory_cards").delete(id)).rejects.toBeTruthy();
      await expect(pb.collection("victory_cards").create({ ownerUid: bId, title: "faux" })).rejects.toBeTruthy();
      await loginPlayer(B.email, B.pw);
      await pb.collection("victory_cards").delete(id);
    } finally {
      await admin.collection("players").update(bId, { units: bBefore.units, bounties: bBefore.bounties, seasonPass: null, referral: null, onboarding: bBefore.onboarding ?? null, xp: bBefore.xp, createdAtMs: bBefore.createdAtMs });
      await admin.collection("players").update(aId, { bounties: aBefore.bounties, referral: null });
    }
    });
  });

  it("v4.2 warlords: hourly tick, raid on a lord, vendetta, lord attack, replies and vacation", async () => {
    await ensureAB();
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    const tick = (action = "tick", warlordId = "") => admin.send<Record<string, number>>("/api/cosmic/admin/warlords", { method: "POST", body: { action, warlordId } });
    const stateRec = async () => admin.collection("game_config").getFirstListItem('key="warlords_state"');
    try {
      // Les dix empires apparaissent, marqués PNJ sur leur fiche publique.
      await tick();
      const lords = await admin.collection("players").getFullList({ filter: "npc != ''" });
      expect(lords).toHaveLength(10);
      await loginPlayer(B.email, B.pw);
      const ossaya = await pb.collection("profiles").getOne("npcossaya000000");
      expect(ossaya.npc).toBe("ossaya");
      const view = await ws.fetchWarlords();
      expect(view.warlords.map((w) => w.id)).toContain("maru");

      // B pille Ossaya, affaiblie pour l'occasion : pas de bouclier, réplique en message.
      await admin.collection("players").update("npcossaya000000", { units: { roquette: { level: 1, count: 5 } }, xp: 100000 });
      await admin.collection("players").update(bId, {
        units: { ...bBefore.units, chasseur: { level: 1, count: 80 } },
        resources: RICH, createdAtMs: MONTH_AGO(), lastDefeatAtMs: 0, ascendedAtMs: 0, allianceId: "", vacation: null, xp: 5000,
      });
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
      // Vendetta : coût prélevé, puis objectif ramené à presque rien pour la gagner en une attaque.
      const before = (await snap(bId)).resources.scrap;
      const v = await ws.declareVendetta("ossaya", "player");
      expect(v.goal).toBeGreaterThan(0);
      expect((await snap(bId)).resources.scrap).toBeLessThan(before);
      await expect(ws.declareVendetta("ossaya", "player")).rejects.toThrow(/déjà/);
      let st = await stateRec();
      await admin.collection("game_config").update(st.id, { data: { ...st.data, vendettas: st.data.vendettas.map((x: { warlordId: string }) => (x.warlordId === "ossaya" ? { ...x, goal: 1 } : x)) } });
      const sent = await ps.sendFleet("npcossaya000000", { chasseur: 80 }, "attack");
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      const landed = await admin.collection("fleets").getOne(sent.id);
      expect(landed.outcome).toBe("attacker_win");
      expect((await snap("npcossaya000000")).lastDefeatAtMs || 0).toBe(0);
      const b = await snap(bId);
      expect(b.titles.map((t: { label: string }) => t.label)).toContain("Tombeur de Ossaya la Tisseuse");
      expect(b.seasonPass.points).toBeGreaterThanOrEqual(40);
      const msgs = await pb.collection("private_messages").getFullList({ filter: `fromUid="npcossaya000000" && toUid="${bId}"` });
      expect(msgs.length).toBeGreaterThan(0);
      // En fuite 7 jours : plus d'attaque possible.
      await expect(ps.sendFleet("npcossaya000000", { chasseur: 1 }, "attack")).rejects.toThrow(/quitté le secteur/);
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);

      // Un message au seigneur reçoit une réplique toute faite ; pas de cadeau possible.
      await ms.sendPrivateMessage("npcbrannoc00000", "Tu ne me fais pas peur.");
      expect((await pb.collection("private_messages").getFullList({ filter: `fromUid="npcbrannoc00000" && toUid="${bId}"` })).length).toBe(1);
      await expect(ps.sendResourceGift({ fromUid: bId, toUid: "npcbrannoc00000", resources: { scrap: 10 } } as Parameters<typeof ps.sendResourceGift>[0])).rejects.toThrow(/cadeau/);

      // Attaque forcée de Brannoc contre A : trajet de 3 à 5 h, cible prévenue.
      await admin.collection("players").update(aId, { xp: 6000, createdAtMs: MONTH_AGO(), lastAttackAtMs: Date.now() - 86400000, lastDefeatAtMs: 0, ascendedAtMs: 0, vacation: null, units: { roquette: { level: 1, count: 20 } } }); // 6.13.0 : défense fixe (elle dépendait des tests précédents : SP-2)
      st = await stateRec();
      const others = (await admin.collection("players").getFullList({ filter: "npc = ''", fields: "id" })).map((r) => r.id).filter((id) => id !== aId);
      // Tous les autres comptes de test viennent « d'être attaqués » : seul A reste une cible.
      await admin.collection("game_config").update(st.id, { data: { ...st.data, hits: Object.fromEntries(others.map((id) => [id, Date.now()])) } });
      await tick("attack", "brannoc");
      // AU14 : échec intermittent vu une fois en 6.11.0 (« resource wasn't found ») : on dit ce que Brannoc a lancé.
      const brannocFleets = await admin.collection("fleets").getFullList({ filter: `ownerUid="npcbrannoc00000" && status="outbound"` });
      expect(brannocFleets.map((f) => f.targetUid), "raids de Brannoc après l'attaque forcée").toContain(aId);
      const raid = brannocFleets.find((f) => f.targetUid === aId)!;
      const travel = raid.arriveAtMs - raid.departAtMs;
      expect(travel).toBeGreaterThanOrEqual(3 * 3600000 - 1000);
      expect(travel).toBeLessThanOrEqual(5 * 3600000 + 1000);
      await admin.collection("fleets").delete(raid.id);

      // Vacances de A : protégé, actions bloquées, retour anticipé après 48 h seulement.
      await loginPlayer(A.email, A.pw);
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${aId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
      for (const r of await admin.collection("battle_reports").getFullList({ filter: `defenderUid="${aId}"` })) await admin.collection("battle_reports").update(r.id, { timestamp: Date.now() - 86400000 });
      await expect(ws.startVacation(1)).rejects.toThrow(/entre 2 et 21/);
      await ws.startVacation(3);
      expect((await pb.collection("profiles").getOne(aId)).vacationUntilMs).toBeGreaterThan(Date.now() + 2 * 86400000);
      await expect(ps.startBuildingUpgrade(aId, "extracteur_ferraille")).rejects.toThrow(/vacances/);
      await expect(ws.endVacation()).rejects.toThrow(/48 h/);
      await loginPlayer(B.email, B.pw);
      await expect(ps.sendFleet(aId, { chasseur: 1 }, "attack")).rejects.toThrow(/vacances/);
      await loginPlayer(A.email, A.pw);
      const vac = (await snap(aId)).vacation;
      await admin.collection("players").update(aId, { vacation: { ...vac, startedAtMs: vac.startedAtMs - 3 * 86400000 } });
      await ws.endVacation();
      expect((await snap(aId)).vacation.endedAtMs).toBeGreaterThan(0);

      // Désactivés : les empires disparaissent à la tâche suivante.
      const off = { ...defaultGameContent().warlords, settings: { ...defaultGameContent().warlords.settings, enabled: false } };
      const existingCfg = await admin.collection("game_config").getFirstListItem('key="warlords"').catch(() => null);
      if (existingCfg) await admin.collection("game_config").update(existingCfg.id, { data: off });
      else await admin.collection("game_config").create({ key: "warlords", data: off });
      await tick();
      expect(await admin.collection("players").getFullList({ filter: "npc != ''" })).toHaveLength(0);
    } finally {
      const cfgRec = await admin.collection("game_config").getFirstListItem('key="warlords"').catch(() => null);
      if (cfgRec) await admin.collection("game_config").delete(cfgRec.id);
      await admin.collection("players").update(bId, { units: bBefore.units, resources: bBefore.resources, titles: bBefore.titles ?? null, relics: null, seasonPass: null, vacation: null, xp: bBefore.xp });
      await admin.collection("players").update(aId, { units: aBefore.units, vacation: null, xp: aBefore.xp });
      const st = await admin.collection("game_config").getFirstListItem('key="warlords_state"').catch(() => null);
      if (st) await admin.collection("game_config").delete(st.id);
      await loginPlayer(B.email, B.pw);
    }
  });

  it("v4.3 chronicles: episode claimed, season boss assault, rewards on stop, admin pass", async () => {
    await withoutPassSeasons(async () => {
    const bBefore = await snap(bId);
    const bossRec = async () => admin.collection("game_config").getFirstListItem('key="season_boss"').catch(() => null);
    try {
      // Épisode 1 du mois en cours rempli par l'équipe, réclamé par le joueur.
      await loginPlayer(B.email, B.pw);
      const monthId = new Date().toISOString().slice(0, 7);
      const hasChronicle = ["2026-10", "2026-11", "2026-12"].includes(monthId);
      if (hasChronicle) {
        await admin.collection("players").update(bId, { chronicle: { monthId, progress: [99, 0, 0, 0], claimed: [], emblems: [] }, seasonPass: null, vacation: null });
        expect((await ps.claimChronicleEpisode(0)).points).toBe(40);
        await expect(ps.claimChronicleEpisode(0)).rejects.toThrow(/déjà/);
        expect((await snap(bId)).seasonPass.points).toBeGreaterThanOrEqual(40);
      }

      // Boss de saison lancé par l'équipe, assaut, arrêt et récompenses.
      const existing = await bossRec();
      if (existing) await admin.collection("game_config").delete(existing.id);
      if (hasChronicle) {
        await admin.send("/api/cosmic/admin/seasonboss", { method: "POST", body: { action: "start" } });
        await admin.collection("players").update(bId, { units: { ...bBefore.units, chasseur: { level: 1, count: 50 } }, seasonPass: null });
        for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
        const sent = await sbs.sendSeasonBossAssault({ chasseur: 50 }, "balanced");
        await expect(sbs.sendSeasonBossAssault({ chasseur: 1 }, "balanced")).rejects.toThrow(/Prochain assaut/);
        await forceArrival((sent as { id: string }).id);
        await ps.syncPlayer("");
        const state = (await bossRec())!.data;
        expect(state.contributions[bId].damage).toBeGreaterThan(0);
        // 5.16 : réactions des spectateurs (pas sur son propre assaut).
        const line = state.feed.find((f: { uid?: string }) => f.uid === bId);
        await expect(pb.send("/api/cosmic/boss/react", { method: "POST", body: { boss: "season", key: `${line.t}:${bId}`, emoji: "🔥" } })).rejects.toMatchObject({ status: 400 });
        await expect(pb.send("/api/cosmic/boss/react", { method: "POST", body: { boss: "nope", key: "x", emoji: "🔥" } })).rejects.toMatchObject({ status: 400 });
        await admin.send("/api/cosmic/admin/seasonboss", { method: "POST", body: { action: "stop" } });
        const after = await snap(bId);
        expect(after.seasonPass.points).toBeGreaterThanOrEqual(60);
        expect((await bossRec())!.data.rewarded).toBe(true);
      }

      // Passe personnalisé : un seul palier, appliqué par le serveur.
      const cfg = await admin.collection("game_config").create({ key: "seasonPass", data: { tiers: [[{ kind: "amber", amount: 7 }]], points: {}, rules: { pointsPerTier: 10, tiers: 1 } } });
      await admin.collection("players").update(bId, { seasonPass: { seasonId: monthId, points: 10, claimed: [], loginDay: "", completed: [] }, bounties: { ...(bBefore.bounties ?? {}), amber: 0 } });
      await ps.claimPassTier(1);
      expect((await snap(bId)).bounties.amber).toBe(7);
      await admin.collection("game_config").delete(cfg.id);
    } finally {
      const st = await bossRec();
      if (st) await admin.collection("game_config").delete(st.id);
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
      await admin.collection("players").update(bId, { units: bBefore.units, seasonPass: null, chronicle: null, bounties: bBefore.bounties, relics: null, titles: bBefore.titles ?? null });
    }
    });
  });

  it("v4.6 social: presence, alliance boss called and killed, typing signal, gazette", async () => {
    const aClient = new PocketBase(PB_TEST_URL);
    await aClient.collection("users").authWithPassword(A.email, A.pw);
    const bBefore = await snap(bId);
    const gazetteRec = async () => admin.collection("game_config").getFirstListItem('key="gazette"').catch(() => null);
    let allianceBossId = "";
    try {
      // A fonde (ou garde) une alliance ; B la rejoint.
      let aAlliance = (await snap(aId)).allianceId as string;
      if (!aAlliance) aAlliance = (await aClient.send<{ allianceId: string }>("/api/cosmic/alliance", { method: "POST", body: { type: "create", name: "Chasseurs de boss", tag: "bs" + suffix.slice(0, 2) } })).allianceId;
      allianceBossId = aAlliance;
      await loginPlayer(B.email, B.pw);
      await al.leaveAlliance().catch(() => {});
      await al.joinAlliance(bId, B.pseudo, aAlliance);
      // Présence : la synchro du navigateur l'écrit, la fiche publique la recopie.
      await admin.collection("players").update(bId, { lastActiveMs: 0, vacation: null });
      await ps.syncPlayer("");
      expect((await pb.collection("profiles").getOne(bId)).lastActiveMs).toBeGreaterThan(Date.now() - 60_000);
      expect((await snap(bId)).stats.activeDays.length).toBeGreaterThan(0);

      // Boss d'alliance : un simple membre ne peut pas l'appeler, le fondateur si.
      await admin.collection("alliances").update(allianceBossId, { boss: null, treasury: { scrap: 1e12, energy: 1e12, nano: 1e12, data: 1e12 } });
      await expect(al.callAllianceBoss()).rejects.toThrow(/fondateur et les officiers/);
      // v5.14.2 : pas d'appel pendant le boss mondial (en alternance) : on le renvoie s'il est là.
      await admin.send("/api/cosmic/admin/leviathan", { method: "POST", body: { action: "stop" } }).catch(() => undefined);
      await aClient.send("/api/cosmic/allianceboss", { method: "POST", body: { action: "call" } });
      let alliance = await admin.collection("alliances").getOne(allianceBossId);
      expect(alliance.boss.status).toBe("active");
      expect(alliance.treasury.scrap).toBeLessThan(1e12);
      await expect(aClient.send("/api/cosmic/allianceboss", { method: "POST", body: { action: "call" } })).rejects.toMatchObject({ status: 400 });
      const treasuryAfterCall = alliance.treasury.scrap;

      // Assaut de B sur un boss affaibli : il tombe, récompenses et remboursement.
      await admin.collection("alliances").update(allianceBossId, { boss: { ...alliance.boss, hp: 1 } });
      await admin.collection("players").update(bId, { units: { ...bBefore.units, chasseur: { level: 1, count: 50 } }, seasonPass: null, relics: null });
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
      const sent = await ps.callGame<{ id: string; arriveAtMs: number; departAtMs: number }>("fleet/send", { targetUid: "allianceboss", fleet: { chasseur: 50 }, mission: "allianceboss", formation: "balanced" });
      expect(sent.arriveAtMs - sent.departAtMs).toBe(20 * 60_000);
      await expect(ps.callGame("fleet/send", { targetUid: "allianceboss", fleet: { chasseur: 1 }, mission: "allianceboss" })).rejects.toThrow(/Prochain assaut/);
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      alliance = await admin.collection("alliances").getOne(allianceBossId);
      expect(alliance.boss.status).toBe("killed");
      expect(alliance.boss.rewarded).toBe(true);
      expect(alliance.treasury.scrap).toBeGreaterThan(treasuryAfterCall);
      const after = await snap(bId);
      expect(after.seasonPass.points).toBeGreaterThanOrEqual(40);
      expect(after.relics?.items?.length ?? 0).toBeGreaterThan(0);

      // « … écrit » : signal éphémère, rien n'est enregistré.
      expect(await pb.send("/api/cosmic/alliance/typing", { method: "POST" })).toMatchObject({ ok: true });

      // Gazette publiée par l'équipe : un numéro, une notification.
      const old = await gazetteRec();
      if (old) await admin.collection("game_config").delete(old.id);
      await expect(pb.send("/api/cosmic/admin/gazette", { method: "POST" })).rejects.toMatchObject({ status: 403 });
      const issue = await admin.send("/api/cosmic/admin/gazette", { method: "POST" });
      expect(issue.number).toBe(1);
      expect(issue.headline.length).toBeGreaterThan(5);
      expect((await gazetteRec())!.data.issues).toHaveLength(1);
      const notes = await pb.collection("notifications").getFullList({ filter: `player_id="${bId}" && title ~ "Gazette"` }).catch(() => []);
      expect(notes.length).toBeGreaterThan(0);
    } finally {
      const g = await gazetteRec();
      if (g) await admin.collection("game_config").delete(g.id);
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
      if (allianceBossId) await admin.collection("alliances").update(allianceBossId, { boss: null }).catch(() => {});
      await al.leaveAlliance().catch(() => {});
      await admin.collection("players").update(bId, { units: bBefore.units, seasonPass: null, relics: null });
    }
  }, 60_000);

  it("v4.7: cancel a building with a full refund in the first minute, coalition won against a lord", async () => {
    const bBefore = await snap(bId);
    const tick = (action = "tick", warlordId = "") => admin.send<Record<string, unknown>>("/api/cosmic/admin/warlords", { method: "POST", body: { action, warlordId } });
    const stateRec = async () => admin.collection("game_config").getFirstListItem('key="warlords_state"');
    const brannoc = "npcbrannoc00000";
    try {
      await loginPlayer(B.email, B.pw);
      await admin.collection("players").update(bId, { resources: RICH, vacation: null, allianceId: "", createdAtMs: MONTH_AGO(), lastDefeatAtMs: 0, ascendedAtMs: 0, xp: 5000 });
      const q = await admin.collection("queues").getOne(bId);
      await admin.collection("queues").update(bId, { buildingUpgrades: {}, activeResearches: [], unitQueues: { attack: [], defense: [] }, activeMissions: q.activeMissions ?? [] });

      // Annulation : remboursement intégral dans la première minute.
      const scrapBefore = (await snap(bId)).resources.scrap;
      await ps.startBuildingUpgrade(bId, "extracteur_ferraille");
      const paid = scrapBefore - (await snap(bId)).resources.scrap;
      expect(paid).toBeGreaterThan(0);
      const quote = await ps.cancelJob({ kind: "building", id: "extracteur_ferraille" });
      expect(quote.fraction).toBe(1);
      expect((await admin.collection("queues").getOne(bId)).buildingUpgrades.extracteur_ferraille).toBeUndefined();
      expect((await snap(bId)).resources.scrap).toBeGreaterThanOrEqual(scrapBefore - 1);
      await expect(ps.cancelJob({ kind: "building", id: "extracteur_ferraille" })).rejects.toThrow(/Aucune amélioration/);

      // Coalition lancée par l'équipe contre Brannoc, objectif ramené à presque rien.
      const cfg = await admin.collection("game_config").getFirstListItem('key="warlords"').catch(() => null);
      if (cfg) await admin.collection("game_config").delete(cfg.id);
      await tick();
      let st = await stateRec();
      await admin.collection("game_config").update(st.id, { data: { ...st.data, coalitions: null, byId: { ...st.data.byId, brannoc: { ...(st.data.byId?.brannoc ?? {}), absentUntilMs: 0 } } } });
      await tick("coalitionStart", "brannoc");
      await expect(tick("coalitionStart", "brannoc")).rejects.toMatchObject({ status: 400 });
      const view = await ws.fetchWarlords();
      expect(view.coalition).toMatchObject({ warlordId: "brannoc", status: "active" });
      st = await stateRec();
      await admin.collection("game_config").update(st.id, { data: { ...st.data, coalitions: { ...st.data.coalitions, coalition: { ...st.data.coalitions.coalition, goal: 1 } } } });

      // B pille Brannoc affaibli : la coalition tombe, récompenses et titre.
      await admin.collection("players").update(brannoc, { units: { roquette: { level: 1, count: 5 } }, xp: 100000 });
      await admin.collection("players").update(bId, { units: { ...bBefore.units, chasseur: { level: 1, count: 80 } }, seasonPass: null, relics: null });
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
      const sent = await ps.sendFleet(brannoc, { chasseur: 80 }, "attack");
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      const after = await snap(bId);
      expect(after.titles.map((t: { label: string }) => t.label)).toContain("Briseur de Brannoc Demi-Barbe");
      expect(after.seasonPass.points).toBeGreaterThanOrEqual(50);
      const done = (await ws.fetchWarlords()).coalition;
      expect(done?.status).toBe("won");
      await expect(ps.sendFleet(brannoc, { chasseur: 1 }, "attack")).rejects.toThrow(/quitté le secteur/);
    } finally {
      const st = await stateRec().catch(() => null);
      if (st) await admin.collection("game_config").update(st.id, { data: { ...st.data, coalitions: null, byId: { ...st.data.byId, brannoc: { ...(st.data.byId?.brannoc ?? {}), absentUntilMs: 0 } } } });
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
      await admin.collection("players").update(bId, { units: bBefore.units, seasonPass: null, relics: null, titles: bBefore.titles ?? null });
    }
  }, 60_000);

  it("exposes public feats on the profile sheet", async () => {
    await admin.collection("players").update(aId, { victories: 3, stats: { missions: 5, warsWon: 1 } });
    const sheet = await ps.fetchPlayerSheet(aId);
    expect(sheet.entry.pseudo).toBe(A.pseudo);
    expect(sheet.feats).toMatchObject({ victories: 3, missions: 5, warsWon: 1 });
  });

  it("v4.9: build plan starts after the running upgrade, alliance daily objective proposed, voted and started", async () => {
    // File planifiée : programmée derrière le chantier en cours.
    await loginPlayer(B.email, B.pw);
    await admin.collection("players").update(bId, { resources: RICH, vacation: null });
    const q = await admin.collection("queues").getOne(bId);
    await admin.collection("queues").update(bId, { buildingUpgrades: {}, activeResearches: [], unitQueues: { attack: [], defense: [] }, activeMissions: q.activeMissions ?? [], buildPlan: [] });
    await ps.startBuildingUpgrade(bId, "extracteur_ferraille");
    await ps.planBuilding("extracteur_ferraille");
    const plan = (await admin.collection("queues").getOne(bId)).buildPlan;
    expect(plan).toHaveLength(1);
    await ps.unplanBuilding(0);
    expect((await admin.collection("queues").getOne(bId)).buildPlan).toHaveLength(0);

    // Objectif du jour : propositions à 8 h (Paris), vote du fondateur, lancement à 11 h.
    const day = new Date(Date.now() + 2 * 3600_000).toISOString().slice(0, 10);
    const at = (h: number) => Date.parse(`${day}T${String(h - 2).padStart(2, "0")}:30:00Z`);
    await admin.collection("alliances").update(allianceId, { daily: null });
    await admin.send("/api/cosmic/admin/alliance-daily", { method: "POST", body: { now: at(8) } });
    let daily = (await admin.collection("alliances").getOne(allianceId)).daily;
    expect(daily.status).toBe("voting");
    expect(daily.proposals).toHaveLength(3);
    await admin.send("/api/cosmic/admin/alliance-daily", { method: "POST", body: { now: at(11) } });
    daily = (await admin.collection("alliances").getOne(allianceId)).daily;
    expect(daily.status === "active" || daily.status === "done").toBe(true);
    expect(daily.chosen).toBe(0);
  });

  it("v4.8: codex title refused below 100 %, filled trades and npc opponents readable", async () => {
    // 6.14.12 : peut tourner seul (-t), CLAUDE.md.
    await ensureAB();
    await loginPlayer(B.email, B.pw);
    await expect(pb.send("/api/cosmic/codex/claim", { method: "POST", body: {} })).rejects.toMatchObject({ status: 400 });
    const trades = await fetchMarketTrades();
    expect(Array.isArray(trades)).toBe(true);
    const opponents = await fetchNpcOpponents(bId);
    expect(opponents.every((u) => u.startsWith("npc"))).toBe(true);
  });

  it("v4.7.1: closed announcements are kept on the account", async () => {
    await loginPlayer(B.email, B.pw);
    await admin.collection("players").update(bId, { announcementsSeen: null, vacation: null });
    await ps.markAnnouncementsSeen(["v4.7-coalitions", "v4.6-social", "bad id!"]);
    expect((await snap(bId)).announcementsSeen).toEqual(["v4.7-coalitions", "v4.6-social"]);
    await ps.markAnnouncementsSeen(["v4.6-social"]);
    expect((await snap(bId)).announcementsSeen).toEqual(["v4.7-coalitions", "v4.6-social"]);
    // Parrainage : pseudo du parrain sans connexion, suivi des filleuls.
    const anon = new PocketBase(PB_TEST_URL);
    const name = await anon.send<{ pseudo: string }>(`/api/cosmic/referral/sponsor?id=${bId}`, { method: "GET" });
    expect(name.pseudo).toBe((await snap(bId)).pseudo);
    await expect(anon.send("/api/cosmic/referral/sponsor?id=npcbrannoc00000", { method: "GET" })).rejects.toMatchObject({ status: 404 });
    const info = await pb.send<{ recruits: unknown[]; verified: boolean; rules: { rewardXp: number } }>("/api/cosmic/referral", { method: "GET" });
    expect(Array.isArray(info.recruits)).toBe(true);
    expect(info.rules.rewardXp).toBe(2000);
  });

  it("v5.1: buy order filled in two deliveries; trade contract accepted, delivered by fleet and honoured", async () => {
    await loginPlayer(B.email, B.pw);
    const aClient = new PocketBase(PB_TEST_URL);
    await aClient.collection("users").authWithPassword(A.email, A.pw);
    const asA = <T = Record<string, unknown>>(path: string, body: Record<string, unknown>) => aClient.send<T>(`/api/cosmic/${path}`, { method: "POST", body });
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    const money = { scrap: 1_000_000, energy: 1_000_000, nano: 1_000_000 };
    await admin.collection("players").update(aId, { resources: { ...aBefore.resources, ...money }, vacation: null });
    await admin.collection("players").update(bId, { resources: { ...bBefore.resources, ...money }, vacation: null, units: { ...bBefore.units, cargo: { level: 1, count: 200 } } });
    try {
      // Ordre d'achat : A réserve 10 000 ferraille pour 10 000 énergie ; B livre en deux fois.
      const order = await asA<{ id: string; kind: string }>("market/create", { kind: "buy", giveRes: "scrap", giveAmount: 10_000, wantRes: "energy", wantAmount: 10_000 });
      expect(order.kind).toBe("buy");
      expect((await snap(aId)).resources.scrap).toBeLessThanOrEqual(990_100);
      const part = await pb.send("/api/cosmic/market/accept", { method: "POST", body: { id: order.id, qty: 4_000 } });
      expect(part).toMatchObject({ status: "open", filled: 4_000 });
      const full = await pb.send("/api/cosmic/market/accept", { method: "POST", body: { id: order.id, qty: 99_999 } });
      expect(full).toMatchObject({ status: "filled", filled: 10_000 });
      const b1 = await snap(bId);
      expect(Math.round(b1.resources.scrap - 1_000_000)).toBeGreaterThanOrEqual(10_000);
      expect(Math.round(1_000_000 - b1.resources.energy)).toBeGreaterThanOrEqual(9_900);

      // Contrat : A veut 5 000 nanocomposants contre 5 000 ferraille, B accepte (caution 500) puis livre.
      const c = await asA<{ id: string; status: string }>("trade-contract", { action: "create", wantRes: "nano", wantAmount: 5_000, payRes: "scrap", payAmount: 5_000, hours: 4 });
      expect(c.status).toBe("open");
      await expect(asA("trade-contract", { action: "accept", id: c.id })).rejects.toMatchObject({ status: 400 });
      const accepted = await pb.send("/api/cosmic/trade-contract", { method: "POST", body: { action: "accept", id: c.id } });
      expect(accepted).toMatchObject({ status: "accepted", deposit: 500 });
      await expect(pb.collection("trade_contracts").update(c.id, { status: "delivered" })).rejects.toBeTruthy();
      await expect(tcs.sendDelivery(c.id, { cargo: 1 })).rejects.toThrow(/soute/);
      const sent = await tcs.sendDelivery(c.id, { cargo: 200 });
      expect(sent.mission).toBe("delivery");
      await expect(tcs.sendDelivery(c.id, { cargo: 200 })).rejects.toThrow(/déjà en route/);
      const aNano = (await snap(aId)).resources.nano;
      const bScrap = (await snap(bId)).resources.scrap;
      await forceArrival(sent.id);
      await ps.syncPlayer("");
      const done = await admin.collection("trade_contracts").getOne(c.id);
      expect(done.status).toBe("delivered");
      expect(Math.round((await snap(aId)).resources.nano - aNano)).toBeGreaterThanOrEqual(5_000);
      expect(Math.round((await snap(bId)).resources.scrap - bScrap)).toBeGreaterThanOrEqual(5_500);
    } finally {
      for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${bId}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
      await admin.collection("players").update(aId, { resources: aBefore.resources });
      await admin.collection("players").update(bId, { resources: bBefore.resources, units: bBefore.units });
    }
  }, 60_000);

  it("v5.1: season war standings readable; pseudo renamed once for amber, login follows", async () => {
    await loginPlayer(B.email, B.pw);
    const war = await pb.send<{ seasonId: string; standings: unknown[] }>("/api/cosmic/season-war", { method: "GET" });
    expect(war.seasonId).toMatch(/^\d{4}-\d{2}$/);
    expect(Array.isArray(war.standings)).toBe(true);

    const bBefore = await snap(bId);
    const fresh = `Renomme_${suffix}`;
    try {
      await admin.collection("players").update(bId, { bounties: { ...bountyState(bBefore), amber: 5 }, renamed: null });
      await expect(ps.renamePlayer(fresh)).rejects.toThrow(/Ambre/);
      await admin.collection("players").update(bId, { bounties: { ...bountyState(bBefore), amber: 25 } });
      await expect(ps.renamePlayer(A.pseudo.toUpperCase())).rejects.toThrow(/déjà pris/);
      await expect(ps.renamePlayer("!!")).rejects.toThrow(/3 caractères/);
      // 6.14.52 (AC-4) : un chantier fini au rattrapage du changement de pseudo arrive au Journal.
      await admin.collection("queues").update(bId, { buildingUpgrades: { extracteur_ferraille: { endTime: Date.now() - 1000 } } });
      const t0 = Date.now();
      expect(await ps.renamePlayer(fresh)).toEqual({ pseudo: fresh });
      const done = await admin.collection("notifications").getFullList({ filter: `player_id="${bId}" && title="Construction terminée" && createdAtMs >= ${t0 - 1000}` });
      expect(done.length).toBe(1);
      const b = await snap(bId);
      expect(b.pseudo).toBe(fresh);
      expect(b.renamed).toMatchObject({ fromPseudo: B.pseudo });
      expect(bountyState(b).amber).toBe(15);
      await expect(ps.renamePlayer(`Encore_${suffix}`)).rejects.toThrow(/déjà changé/);
      await expect(pb.collection("players").update(bId, { pseudo: "Pirate" })).rejects.toMatchObject({ status: 403 });
      logout();
      await loginPlayer(fresh, B.pw);
      expect(pb.authStore.record?.id).toBe(bId);
    } finally {
      await admin.collection("players").update(bId, { bounties: bBefore.bounties ?? {}, buildings: bBefore.buildings });
    }
  }, 30_000);

  it("v5.1: avatar uploaded on the public profile, other fields and other players refused", async () => {
    await loginPlayer(B.email, B.pw);
    const png = Uint8Array.from(atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="), (c) => c.charCodeAt(0));
    const form = new FormData();
    form.append("avatar", new Blob([png], { type: "image/png" }), "avatar.png");
    const rec = await pb.collection("profiles").update<{ avatar: string }>(bId, form);
    expect(rec.avatar).toMatch(/\.png$/);
    expect((await ps.fetchPlayerSheet(bId)).entry.avatar).toBe(rec.avatar);
    await expect(pb.collection("profiles").update(bId, { xp: 999_999_999 })).rejects.toMatchObject({ status: 403 });
    await expect(pb.collection("profiles").update(aId, { avatar: null })).rejects.toBeTruthy();
    await pb.collection("profiles").update(bId, { avatar: null });
    expect((await ps.fetchPlayerSheet(bId)).entry.avatar).toBeUndefined();
  });

  it("v5.3: daily streak claimed once per day through the server", async () => {
    await loginPlayer(B.email, B.pw);
    const before = await snap(bId);
    try {
      await admin.collection("players").update(bId, { streak: null });
      const out = await ps.claimStreak();
      expect(out.count).toBe(1);
      expect((await snap(bId)).streak).toMatchObject({ count: 1, total: 1 });
      await expect(ps.claimStreak()).rejects.toThrow(/déjà réclamée/);
    } finally {
      await admin.collection("players").update(bId, { streak: null, resources: before.resources });
    }
  });

  it("v5.3: balance report reads live players, refused to players", async () => {
    await loginPlayer(B.email, B.pw);
    await expect(pb.send("/api/cosmic/admin/balance", { method: "GET" })).rejects.toMatchObject({ status: 403 });
    const live = await admin.send("/api/cosmic/admin/balance", { method: "GET" });
    const { pseudo } = await admin.collection("players").getOne(bId);
    expect(live.players.some((p: { pseudo: string }) => p.pseudo === pseudo)).toBe(true);
    expect(live.factions.length).toBeGreaterThan(0);
    expect(live.pvp.windowDays).toBe(30);
    // 6.14.6 (BOSS-2) : boss abattus par type (Hall of fame), relevé même sans combat archivé.
    expect(live.health?.bosses?.windowDays).toBe(56);
    expect(live.health?.bosses?.rows.map((r: { kind: string }) => r.kind)).toEqual(["leviathan", "seasonboss", "allianceboss"]);
  });

  it("6.14.107 (AE-L4): balance health reports amber by source, ascension, lost production and AE-L3 follow-ups, admin only", async () => {
    await ensureAB();
    await loginPlayer(B.email, B.pw);
    await expect(pb.send("/api/cosmic/admin/balance", { method: "GET" })).rejects.toMatchObject({ status: 403 });
    const before = await admin.collection("players").getOne(bId);
    const now = Date.now();
    const d = new Date(now);
    const monday = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - ((d.getUTCDay() + 6) % 7) * 86_400_000;
    const week = new Date(monday).toISOString().slice(0, 10);
    const lastWeek = new Date(monday - 7 * 86_400_000).toISOString().slice(0, 10);
    try {
      // Traces fabriquées (taille fixe) : Ambre de la semaine passée, production perdue, coffre, 1re Ascension.
      await admin.collection("players").update(bId, {
        lastActiveMs: now,
        stats: {
          ...(before.stats ?? {}),
          amberWeek: { week, by: { pass: 5 }, prev: { week: lastWeek, by: { bounties: 777000, codex: 3000 } } },
          prodLoss: { week, pot: 1000, lost: 10, prev: { week: lastWeek, pot: 1000, lost: 250 } },
          lastChest: { atMs: now - 3_600_000, common: 8_000_000, floors: 4, n: 4 },
          firstAscensionAtMs: now - 3 * 86_400_000,
        },
        ascensions: 1,
        ascendedAtMs: now - 3 * 86_400_000,
        createdAtMs: now - 45 * 86_400_000,
      });
      const live = await admin.send("/api/cosmic/admin/balance", { method: "GET" });
      const h = live.health;
      expect(h.amber.lastWeek).toBe(lastWeek);
      expect(h.amber.last.total).toBeGreaterThanOrEqual(780000);
      expect(h.amber.last.bySource.find((r: { source: string }) => r.source === "bounties").total).toBeGreaterThanOrEqual(777000);
      expect(h.ascension.measured).toBeGreaterThanOrEqual(1);
      expect(h.ascension.medianDay).not.toBeNull();
      expect(h.production.measured).toBeGreaterThanOrEqual(1);
      expect(h.production.lostQ3Pct).toBeGreaterThanOrEqual(0);
      expect(h.choices.chest.count).toBeGreaterThanOrEqual(1);
      expect(h.choices.exchange).toHaveProperty("atCapPct");
      expect(h.choices.defeats.windowDays).toBe(7);
      expect(h.bosses.total).toHaveProperty("medianKillHours");
      expect(Array.isArray(h.alerts)).toBe(true);
      expect(h.alerts.some((a: { id: string }) => a.id === "amberBounties")).toBe(true);
    } finally {
      await admin.collection("players").update(bId, {
        stats: before.stats ?? null,
        ascensions: before.ascensions ?? 0,
        ascendedAtMs: before.ascendedAtMs ?? 0,
        createdAtMs: before.createdAtMs ?? 0,
        lastActiveMs: before.lastActiveMs ?? 0,
      });
    }
  });

  it("v5.4: generator writes a chapter, never replaces a hand-written month, refused to players", async () => {
    await loginPlayer(B.email, B.pw);
    await expect(pb.send("/api/cosmic/admin/procedural", { method: "GET" })).rejects.toMatchObject({ status: 403 });
    const find = async () => (await admin.collection("game_config").getFullList({ filter: 'key = "chronicles"' }))[0] ?? null;
    const before = await find();
    try {
      const overview = await admin.send("/api/cosmic/admin/procedural", { method: "GET" });
      expect(overview.digest.activePlayers).toBeGreaterThan(0);
      expect(overview.preview?.episodes).toHaveLength(4);
      const out = await admin.send("/api/cosmic/admin/procedural", { method: "POST", body: { action: "generate", monthId: "2031-04", variant: 0 } });
      expect(out.chapters[0].id).toBe("2031-04");
      const months = (await find())!.data.months as { id: string; auto?: unknown; pass?: { tiers: unknown[] } }[];
      const month = months.find((m) => m.id === "2031-04")!;
      expect(month.auto).toBeTruthy();
      expect(month.pass?.tiers).toHaveLength(30);
      await expect(admin.send("/api/cosmic/admin/procedural", { method: "POST", body: { action: "generate", monthId: "2026-10" } })).rejects.toMatchObject({ status: 400 });
    } finally {
      const now = await find();
      if (before) await admin.collection("game_config").update(before.id, { data: before.data });
      else if (now) await admin.collection("game_config").delete(now.id);
    }
  });

  it("6.14.57 (AP-3) brouillon et chapitre d'un ancien générateur régénérés ; passe publié, brouillon retouché et bibliothèque intacts", async () => {
    const cfg = async (key: string) => (await admin.collection("game_config").getFullList({ filter: `key = "${key}"` }))[0] ?? null;
    const keep = { passes: await cfg("passSeasons"), chronicles: await cfg("chronicles"), procedural: await cfg("procedural") };
    const put = async (key: string, data: unknown) => {
      const rec = await cfg(key);
      if (rec) await admin.collection("game_config").update(rec.id, { data });
      else await admin.collection("game_config").create({ key, data });
    };
    const now = Date.now();
    const m1 = nextMonthId(chronicleMonthId(now));
    const m2 = nextMonthId(m1);
    const m3 = nextMonthId(m2);
    const m4 = nextMonthId(m3);
    const digest = worldDigest([], now);
    const old = (id: string) => {
      const s = generatePassSeason({ monthId: id, digest, existing: [], now });
      delete s.challengeMode;
      delete s.auto!.generator;
      return s;
    };
    const published = { ...old(m2), status: "published" as const, publishedAtMs: now };
    const edited = { ...old(m3), auto: { ...old(m3).auto!, editedAtMs: now } };
    const chapter = generateChapter({ monthId: m4, digest, existing: [], now });
    delete chapter.auto!.generator;
    const bonus = { episode: { tokens: 4, amber: 15 }, chapter: { tokens: 10, amber: 50 } };
    const chronicles = { ...defaultGameContent().chronicles, bonus };
    try {
      await put("passSeasons", { seasons: [old(m1), published, edited] });
      await put("chronicles", { ...chronicles, months: [...chronicles.months.filter((m) => m.id !== m4), chapter] });
      const before = (await cfg("chronicles"))!.data;
      const out = await admin.send("/api/cosmic/admin/procedural", { method: "POST", body: { action: "passSeasonsRun" } });
      expect(out.lines.some((l: string) => l.startsWith(`Passe ${m1} : brouillon d'un ancien générateur`))).toBe(true);
      expect(out.lines.some((l: string) => l.startsWith(`Chapitre ${m4} : écrit par un ancien générateur`))).toBe(true);
      const seasons = (await cfg("passSeasons"))!.data.seasons as { id: string; challengeMode?: string; auto?: { generator?: number } }[];
      const draft = seasons.find((s) => s.id === m1)!;
      expect(draft.challengeMode).toBe("cumulative");
      expect(draft.auto?.generator).toBeGreaterThanOrEqual(3);
      expect(seasons.find((s) => s.id === m2)).toEqual(JSON.parse(JSON.stringify(published)));
      expect(seasons.find((s) => s.id === m3)).toEqual(JSON.parse(JSON.stringify(edited)));
      const after = (await cfg("chronicles"))!.data;
      expect(after.months.find((m: { id: string }) => m.id === m4).auto.generator).toBeGreaterThanOrEqual(3);
      // Le reste de la configuration est gardé (bonus réglé, bibliothèque, mois écrits).
      expect(after.bonus).toEqual(bonus);
      expect(after.library).toEqual(before.library);
      expect(after.months.filter((m: { id: string }) => m.id !== m4)).toEqual(before.months.filter((m: { id: string }) => m.id !== m4));
      // L'ancien état reste dans le journal de contenu (retour arrière possible).
      const versions = await admin.collection("content_versions").getList(1, 5, { filter: 'action = "regenerate"', sort: "-createdAtMs" });
      expect(versions.items.map((v) => v.section)).toEqual(expect.arrayContaining(["passSeasons", "chronicles"]));
      // Deuxième passage : rien à régénérer.
      const again = await admin.send("/api/cosmic/admin/procedural", { method: "POST", body: { action: "passSeasonsRun" } });
      expect(again.lines.some((l: string) => /ancien générateur/.test(l))).toBe(false);
    } finally {
      for (const [key, rec] of [["passSeasons", keep.passes], ["chronicles", keep.chronicles], ["procedural", keep.procedural]] as const) {
        const cur = await cfg(key);
        if (rec) await admin.collection("game_config").update(rec.id, { data: rec.data });
        else if (cur) await admin.collection("game_config").delete(cur.id);
      }
    }
  });

  it("6.14.108 (AP-L4) : paliers de succès générés datés et bridés, rien de retiré", async () => {
    const cfg = async (key: string) => (await admin.collection("game_config").getFullList({ filter: `key = "${key}"` }))[0] ?? null;
    const keep = { achievements: await cfg("achievements"), procedural: await cfg("procedural") };
    const put = async (key: string, data: unknown) => {
      const rec = await cfg(key);
      if (rec) await admin.collection("game_config").update(rec.id, { data });
      else await admin.collection("game_config").create({ key, data });
    };
    // Palier écrit par le générateur d'avant 6.14.108 : sans date.
    const base = DEFAULT_ACHIEVEMENTS.find((a) => a.id === "eternal_conqueror")!;
    const legacy = { ...base, id: "eternal_conqueror_auto1", name: "Conquérant éternel II", threshold: 1500, auto: true, title: "Conquérant éternel II" };
    try {
      await put("achievements", [legacy]);
      const before = Date.now();
      const out = await admin.send("/api/cosmic/admin/procedural", { method: "POST", body: { action: "achievements" } });
      // Serveur de test (moins de 3 joueurs actifs au dernier palier) : aucun nouveau palier.
      expect(out.achievements).toEqual([]);
      expect(out.stamped).toBe(true);
      const stored = (await cfg("achievements"))!.data as { id: string; createdAtMs?: number; title?: string }[];
      const kept = stored.find((a) => a.id === legacy.id)!;
      expect(kept).toBeTruthy();
      expect(kept.title).toBe(legacy.title);
      expect(kept.createdAtMs).toBeGreaterThanOrEqual(before);
      // Deuxième passage : déjà daté, rien d'écrit.
      const again = await admin.send("/api/cosmic/admin/procedural", { method: "POST", body: { action: "achievements" } });
      expect(again.stamped).toBeUndefined();
      expect(((await cfg("achievements"))!.data as { id: string; createdAtMs?: number }[]).find((a) => a.id === legacy.id)!.createdAtMs).toBe(kept.createdAtMs);
    } finally {
      for (const [key, rec] of [["achievements", keep.achievements], ["procedural", keep.procedural]] as const) {
        const cur = await cfg(key);
        if (rec) await admin.collection("game_config").update(rec.id, { data: rec.data });
        else if (cur) await admin.collection("game_config").delete(cur.id);
      }
    }
  });

  it("v5.5: admin player actions (test account, finish all, officers, grant with reason), refused to players", async () => {
    await loginPlayer(B.email, B.pw);
    await expect(pb.send("/api/cosmic/admin/player-action", { method: "POST", body: { uid: bId, action: "finishAll" } })).rejects.toMatchObject({ status: 403 });
    const before = await snap(bId);
    const q = await admin.collection("queues").getOne(bId);
    try {
      const level = before.buildings.extracteur_ferraille.level;
      await admin.collection("queues").update(bId, { buildingUpgrades: { extracteur_ferraille: { endTime: Date.now() + 3_600_000 } } });
      const fin = await admin.send("/api/cosmic/admin/player-action", { method: "POST", body: { uid: bId, action: "finishAll" } });
      expect(fin.buildings).toBe(1);
      expect((await snap(bId)).buildings.extracteur_ferraille.level).toBe(level + 1);
      await expect(admin.send("/api/cosmic/admin/player-action", { method: "POST", body: { uid: bId, action: "grant", resources: { scrap: 1234 } } })).rejects.toMatchObject({ status: 400 });
      const scrap = (await snap(bId)).resources.scrap;
      await admin.send("/api/cosmic/admin/player-action", { method: "POST", body: { uid: bId, action: "grant", resources: { scrap: 1234 }, reason: "test d'intégration" } });
      expect((await snap(bId)).resources.scrap).toBeGreaterThanOrEqual(scrap + 1234);
      await admin.send("/api/cosmic/admin/player-action", { method: "POST", body: { uid: bId, action: "testMode", on: true } });
      expect((await snap(bId)).testMode).toBe(true);
      const logs = await admin.collection("admin_logs").getList(1, 5, { filter: `recordId = "${bId}"`, sort: "-createdAtMs" });
      expect(logs.items.some((l) => String(l.action).startsWith("joueur"))).toBe(true);
    } finally {
      await admin.collection("players").update(bId, { testMode: false, buildings: before.buildings, resources: before.resources, commanders: before.commanders ?? null });
      await admin.collection("queues").update(bId, { buildingUpgrades: q.buildingUpgrades ?? {} });
    }
  });

  it("v5.5: balance snapshot, alliance saga and market broker run on demand", async () => {
    const cfg = async (key: string) => (await admin.collection("game_config").getFullList({ filter: `key = "${key}"` }))[0] ?? null;
    const keep = { history: await cfg("balance_history"), saga: await cfg("alliance_saga") };
    try {
      const snapDay = await admin.send("/api/cosmic/admin/balance/snapshot", { method: "POST" });
      expect(snapDay.day).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      const live = await admin.send("/api/cosmic/admin/balance", { method: "GET" });
      expect(live.history.length).toBeGreaterThan(0);
      await admin.send("/api/cosmic/admin/alliance-saga", { method: "POST" });
      const saga = (await cfg("alliance_saga"))!.data;
      expect(saga.sagas.length).toBeGreaterThan(0);
      expect(saga.standing.rows).toBeDefined();

    } finally {
      for (const [key, rec] of [["balance_history", keep.history], ["alliance_saga", keep.saga]] as const) {
        const now = await cfg(key);
        if (rec) await admin.collection("game_config").update(rec.id, { data: rec.data });
        else if (now) await admin.collection("game_config").delete(now.id);
      }
    }
  });

  it("v5.6: steward gains XP on both sides of a player market trade; alliance saga progress is live", async () => {
    const cfg = async (key: string) => (await admin.collection("game_config").getFullList({ filter: `key = "${key}"` }))[0] ?? null;
    const keepSaga = await cfg("alliance_saga");
    const aBefore = await snap(aId);
    const bBefore = await snap(bId);
    let sagaAllianceId = "";
    try {
      const steward = { roster: { steward: { xp: 0 } }, active: ["steward"], movedAtMs: {} };
      await admin.collection("players").update(aId, { commanders: steward, resources: RICH });
      await admin.collection("players").update(bId, { commanders: steward, resources: RICH, allianceId: "" });

      // Offre de A acceptée par B : l'Intendant de chacun progresse.
      await loginPlayer(A.email, A.pw);
      const offer = await createMarketOffer({ giveRes: "scrap", giveAmount: 1000, wantRes: "energy", wantAmount: priceBounds("scrap", 1000, "energy").min });
      await loginPlayer(B.email, B.pw);
      await acceptMarketOffer(offer.id);
      expect((await snap(aId)).commanders.roster.steward.xp).toBe(5);
      expect((await snap(bId)).commanders.roster.steward.xp).toBe(5);

      // Saga : la progression de l'alliance suit l'activité du mois sans attendre le classement horaire.
      sagaAllianceId = await al.createAlliance(bId, B.pseudo, "Saga Live", "sg" + suffix.slice(0, 2));
      await admin.send("/api/cosmic/admin/alliance-saga", { method: "POST" });
      const def = sagaOf(readAllianceSaga((await cfg("alliance_saga"))!.data), sagaMonthId(Date.now()))!;
      const before = await pb.send("/api/cosmic/alliance/saga/live", { method: "GET" });
      expect(before.allianceId).toBe(sagaAllianceId);
      const b = await snap(bId);
      const activity = { ...(b.seasonPass?.activity ?? {}) };
      for (const o of def.objectives) activity[o.type] = (activity[o.type] ?? 0) + 3;
      await admin.collection("players").update(bId, { seasonPass: { ...b.seasonPass, activity } });
      const after = await pb.send("/api/cosmic/alliance/saga/live", { method: "GET" });
      expect(after.progress).toEqual(before.progress.map((n: number) => n + 3));
      expect(after.points).toBeGreaterThanOrEqual(before.points);
    } finally {
      if (sagaAllianceId) await al.leaveAlliance().catch(() => undefined);
      await admin.collection("players").update(aId, { commanders: aBefore.commanders, resources: aBefore.resources });
      await admin.collection("players").update(bId, { commanders: bBefore.commanders, resources: bBefore.resources, allianceId: bBefore.allianceId, seasonPass: bBefore.seasonPass });
      const now = await cfg("alliance_saga");
      if (keepSaga) await admin.collection("game_config").update(keepSaga.id, { data: keepSaga.data });
      else if (now) await admin.collection("game_config").delete(now.id);
    }
  });

  it("v5.8: devblog — only authors write, drafts and scheduled posts stay hidden, pages, RSS and JSON follow publication", async () => {
    const base = PB_TEST_URL!.replace(/\/+$/, "");
    const slug = `test-${suffix}`;
    const created: string[] = [];
    try {
      // B n'est pas auteur : création refusée.
      await loginPlayer(B.email, B.pw);
      await expect(pb.collection("blog_posts").create({ slug: `${slug}-b`, title: "Intrus", category: "notes", status: "published", authorUid: bId, publishedAtMs: Date.now() })).rejects.toBeTruthy();
      // A devient auteur (un administrateur l'ajoute).
      await admin.collection("blog_authors").create({ id: aId, pseudo: A.pseudo, role: "Testeur" });
      await loginPlayer(A.email, A.pw);
      const draft = await pb.collection("blog_posts").create({ slug, title: "Article de test", body: "## Partie\n\nTexte :rocket:", category: "notes", tags: ["test"], status: "draft", authorUid: aId, authorPseudo: A.pseudo, updatedAtMs: Date.now() });
      created.push(draft.id);
      // Un auteur ne peut pas signer au nom d'un autre.
      await expect(pb.collection("blog_posts").create({ slug: `${slug}-x`, title: "Faux", category: "notes", status: "draft", authorUid: bId })).rejects.toBeTruthy();
      expect((await fetch(`${base}/blog/p/${slug}`)).status).toBe(404);
      // B ne voit pas les brouillons.
      await loginPlayer(B.email, B.pw);
      expect((await pb.collection("blog_posts").getList(1, 50, { filter: `slug = "${slug}"` })).items).toHaveLength(0);
      // Publication : page, accueil, RSS, JSON.
      await loginPlayer(A.email, A.pw);
      await pb.collection("blog_posts").update(draft.id, { status: "published", publishedAtMs: Date.now() - 1000 });
      const page = await fetch(`${base}/blog/p/${slug}`);
      expect(page.status).toBe(200);
      const html = await page.text();
      expect(html).toContain("Article de test");
      expect(html).toContain('id="partie"');
      expect(html).toContain("🚀");
      expect(await (await fetch(`${base}/blog/`)).text()).toContain(`/blog/p/${slug}`);
      expect(await (await fetch(`${base}/blog/rss.xml`)).text()).toContain(`/blog/p/${slug}`);
      const json = await (await fetch(`${base}/api/cosmic/blog/posts?limite=50`)).json();
      expect(json.posts.some((p: { slug: string }) => p.slug === slug)).toBe(true);
      expect((await fetch(`${base}/blog/assets/blog.css`)).headers.get("content-type")).toContain("text/css");
      // Programmé dans le futur : invisible.
      await pb.collection("blog_posts").update(draft.id, { publishedAtMs: Date.now() + 3_600_000 });
      expect((await fetch(`${base}/blog/p/${slug}`)).status).toBe(404);
      // Sous-domaine : mêmes pages à la racine.
      const host = await fetch(`${base}/c/notes`, { headers: { "X-Forwarded-Host": "devblog.fs0ciety.org" } });
      expect([200, 404]).toContain(host.status);
    } finally {
      for (const id of created) await admin.collection("blog_posts").delete(id).catch(() => undefined);
      await admin.collection("blog_authors").delete(aId).catch(() => undefined);
      await loginPlayer(B.email, B.pw);
    }
  });

  it("v5.9 Google account: pseudo chosen once before the empire exists", async () => {
    const email = `oa${suffix}@test.dev`;
    const rec = await admin.collection("users").create({ email, password: "motdepasse3", passwordConfirm: "motdepasse3" });
    const oa = new PocketBase(PB_TEST_URL);
    try {
      await oa.collection("users").authWithPassword(email, "motdepasse3");
      expect(oa.authStore.record?.username).toBe("");
      await expect(oa.send("/api/cosmic/init", { method: "POST" })).rejects.toMatchObject({ status: 400 });
      await expect(oa.send("/api/cosmic/account/pseudo", { method: "POST", body: { pseudo: A.pseudo } })).rejects.toMatchObject({ status: 400 });
      const pseudo = `Oauth_${suffix}`;
      await oa.send("/api/cosmic/account/pseudo", { method: "POST", body: { pseudo } });
      await expect(oa.send("/api/cosmic/account/pseudo", { method: "POST", body: { pseudo: `Autre_${suffix}` } })).rejects.toMatchObject({ status: 400 });
      await oa.send("/api/cosmic/init", { method: "POST" });
      expect((await snap(rec.id))?.pseudo).toBe(pseudo);
    } finally {
      await admin.collection("players").delete(rec.id).catch(() => undefined);
      await admin.collection("users").delete(rec.id).catch(() => undefined);
    }
  });

  it("v5.9 passkeys: options need a session, unknown credentials are refused", async () => {
    const anon = new PocketBase(PB_TEST_URL);
    await expect(anon.send("/api/cosmic/passkey/register/options", { method: "POST" })).rejects.toMatchObject({ status: 401 });
    const login = await anon.send("/api/cosmic/passkey/login/options", { method: "POST" });
    expect(login.challenge).toMatch(/^[A-Za-z0-9_-]{20,}$/);
    await expect(
      anon.send("/api/cosmic/passkey/login/verify", { method: "POST", body: { id: "AAAA", response: { clientDataJSON: "e30", authenticatorData: "", signature: "" } } }),
    ).rejects.toMatchObject({ status: 400 });
    const reg = await pb.send("/api/cosmic/passkey/register/options", { method: "POST" });
    expect(reg.authenticatorSelection.residentKey).toBe("required");
    expect(await pb.collection("passkeys").getFullList()).toEqual([]);
  });

  it("5.15 divisions: placement, weekly close, casino tokens and champion title", async () => {
    await expect(pb.send("/api/cosmic/admin/leagues", { method: "POST" })).rejects.toMatchObject({ status: 403 });
    const rec = await admin.collection("game_config").getFirstListItem('key="leagues"').catch(() => null);
    const saved = rec ? rec.data : null;
    try {
      const a0 = await snap(aId);
      const b0 = await snap(bId);
      expect(a0.xp).toBeGreaterThan(0);
      // Semaine passée (lointaine) : A a gagné de l'XP, B rien.
      const past = { version: 2, weekId: "2020-01-06", tiers: { [aId]: "or", [bId]: "or" }, base: { [aId]: 0, [bId]: b0.xp }, last: null, history: {} };
      const id = rec ? rec.id : (await admin.collection("game_config").create({ key: "leagues", data: past })).id;
      await admin.collection("game_config").update(id, { data: past });
      const out = await admin.send("/api/cosmic/admin/leagues", { method: "POST" });
      expect(out.closed).toBe("2020-01-06");
      const st = (await admin.collection("game_config").getOne(id)).data as { weekId: string; tiers: Record<string, string>; base: Record<string, number>; history: Record<string, { tier: string; rank: number }[]> };
      expect(st.weekId).not.toBe("2020-01-06");
      expect(st.tiers[aId]).toBe("platine");
      expect(st.tiers[bId]).toBe("argent");
      expect(st.base[aId]).toBe(a0.xp);
      expect(st.history[aId].at(-1)).toMatchObject({ tier: "or", rank: 1 });
      const a1 = await snap(aId);
      expect((a1.casino?.tokens ?? 0) - (a0.casino?.tokens ?? 0)).toBe(2);
      expect((a1.titles ?? []).some((t: { label: string }) => t.label === "Champion Or")).toBe(true);
      const b1 = await snap(bId);
      expect((b1.titles ?? []).some((t: { label: string }) => t.label === "Champion Or")).toBe(false);
      // Passage suivant dans la même semaine : rien ne bouge, rien n'est versé.
      const again = await admin.send("/api/cosmic/admin/leagues", { method: "POST" });
      expect(again).toMatchObject({ closed: null, rewarded: 0 });
    } finally {
      const now = await admin.collection("game_config").getFirstListItem('key="leagues"').catch(() => null);
      if (now) await admin.collection("game_config").update(now.id, { data: saved ?? {} });
    }
  });

  it("6.14.59 garde-fous : le serveur refuse un contenu cassé dans toute section, accepte un contenu correct, le jeu continue", async () => {
    await ensureAB();
    await loginPlayer(B.email, B.pw); // le pseudo de B change dans un test précédent
    const d = defaultGameContent();
    const existing = (key: string) => admin.collection("game_config").getFirstListItem(`key="${key}"`).catch(() => null);
    const write = async (key: string, data: unknown) => {
      const rec = await existing(key);
      return rec ? admin.collection("game_config").update(rec.id, { data }) : admin.collection("game_config").create({ key, data });
    };
    const refused = async (key: string, data: unknown): Promise<string> => {
      const err = await write(key, data).then(
        () => null,
        (e: { status?: number; response?: { message?: string } }) => e,
      );
      expect(err?.status).toBe(400);
      return String(err?.response?.message ?? "");
    };
    const saved: Record<string, { id: string; data: unknown } | null> = {};
    for (const key of ["units", "buildings", "technologies", "relics", "rules"]) {
      const rec = await existing(key);
      saved[key] = rec ? { id: rec.id, data: rec.data } : null;
    }
    try {
      // Valeurs cassées : refusées avec le champ fautif (unités, bâtiments, technos, reliques, règles imbriquées).
      expect(await refused("units", d.units.map((u) => (u.id === "fregate" ? { ...u, cost: { scrap: null, energy: 500 } } : u)))).toMatch(/Unité Frégate : « cost\.scrap » doit être un nombre/);
      expect(await refused("units", { fregate: {} })).toMatch(/doit être une liste/);
      expect(await refused("buildings", d.buildings.map((b, i) => (i === 0 ? { ...b, maxLevel: "dix" } : b)))).toMatch(/maxLevel/);
      expect(await refused("technologies", d.technologies.map((t) => (t.id === "tech1" ? { ...t, baseTime: -30 } : t)))).toMatch(/négatif/);
      expect(await refused("relics", d.relics.map((r, i) => (i === 0 ? { ...r, custom: "x", effect: 3 } : r)))).toMatch(/Relique/);
      const rules = ((await existing("rules"))?.data ?? {}) as Record<string, unknown>;
      expect(await refused("rules", { ...rules, alliances: { ...d.rules.alliances, researches: d.rules.alliances.researches.map((r, i) => (i === 0 ? { ...r, perLevel: undefined } : r)) } })).toMatch(/perLevel/);
      expect(await refused("rules", { ...rules, combat: { ...((rules.combat as object) ?? {}), maxRounds: null } })).toMatch(/maxRounds/);
      // Rien n'a été écrit.
      for (const key of ["units", "buildings", "technologies", "relics"]) expect((await existing(key))?.data ?? null).toEqual(saved[key]?.data ?? null);

      // Valeur correcte : enregistrée.
      const units = d.units.map((u) => (u.id === "fregate" ? { ...u, stats: { ...u.stats, attaque: u.stats.attaque + 1 } } : u));
      await write("units", units);
      expect(((await existing("units"))!.data as typeof units).find((u) => u.id === "fregate")!.stats.attaque).toBe(d.units.find((u) => u.id === "fregate")!.stats.attaque + 1);

      // Le jeu continue de tourner : une action du joueur passe.
      await admin.collection("players").update(bId, { resources: { ...RICH, scrap: 10_000_000, energy: 10_000_000, nano: 10_000_000 } });
      await admin.collection("queues").update(bId, { buildingUpgrades: {} });
      await ps.startBuildingUpgrade(bId, "extracteur_ferraille");
      expect((await admin.collection("queues").getOne(bId)).buildingUpgrades.extracteur_ferraille).toBeTruthy();
    } finally {
      for (const [key, v] of Object.entries(saved)) {
        const rec = await existing(key);
        if (v && rec) await admin.collection("game_config").update(rec.id, { data: v.data });
        else if (!v && rec) await admin.collection("game_config").delete(rec.id);
      }
      await admin.collection("queues").update(bId, { buildingUpgrades: {} });
    }
  });

  it("6.14.88 (RL-3) : la bascule du rythme prend effet à sa date sur le serveur ; un chantier lancé avant garde sa fin", async () => {
    await ensureAB();
    await loginPlayer(B.email, B.pw);
    const rulesRec = await admin.collection("game_config").getFirstListItem('key="rules"');
    const savedRules = rulesRec.data as Record<string, unknown>;
    const player = await admin.collection("players").getOne(bId);
    const savedBuildings = player.buildings;
    const lots = 200_000_000;
    try {
      await admin.collection("players").update(bId, {
        resources: { scrap: lots, energy: lots, nano: lots, data: lots, reinforcedSteel: lots, cyberModule: lots, syntheticNanites: lots, aiFragment: lots },
        buildings: { ...player.buildings, extracteur_ferraille: { level: 10, unlocked: true }, archives_fracturees: { level: 10, unlocked: true } },
      });
      await admin.collection("queues").update(bId, { buildingUpgrades: {} });
      const seconds = (e: { endTime: number; startedAtMs: number }) => Math.round((e.endTime - e.startedAtMs) / 1000);
      // Avant la date (défaut : 1er novembre 2026) : niveau 11 en 3 h.
      await ps.startBuildingUpgrade(bId, "extracteur_ferraille");
      const before = (await admin.collection("queues").getOne(bId)).buildingUpgrades.extracteur_ferraille;
      expect(seconds(before)).toBe(10_800);
      // Date passée : niveau 11 en 36 h (6.14.89 ; 30 h en 6.14.88) pour un chantier lancé maintenant ; le premier garde sa fin.
      await admin.collection("game_config").update(rulesRec.id, { data: { ...savedRules, rhythm: { switchAt: Date.now() - 60_000 } } });
      await ps.startBuildingUpgrade(bId, "archives_fracturees");
      const q = (await admin.collection("queues").getOne(bId)).buildingUpgrades;
      expect(seconds(q.archives_fracturees)).toBe(129_600);
      expect(q.extracteur_ferraille.endTime).toBe(before.endTime);
    } finally {
      await admin.collection("game_config").update(rulesRec.id, { data: savedRules });
      await admin.collection("queues").update(bId, { buildingUpgrades: {} });
      await admin.collection("players").update(bId, { buildings: savedBuildings, resources: RICH });
    }
  });

  it("6.14.66 (AC-C) : le joueur supprime son compte par le serveur (flotte, offre, enchère, alliance, contrat nettoyés)", async () => {
    await ensureAB();
    const C = { pseudo: `Charl_${suffix}`, email: `del${suffix}@test.dev`, pw: "motdepasse3" };
    const D = { pseudo: `Delta_${suffix}`, email: `dd${suffix}@test.dev`, pw: "motdepasse4" };
    const dId = (await registerPlayer(D.pseudo, D.email, D.pw)).id;
    logout();
    const cId = (await registerPlayer(C.pseudo, C.email, C.pw)).id;
    const now = Date.now();
    try {
      // L'API des collections ne permet plus au joueur d'effacer sa fiche, ses files ou son compte (contournement d'AC-3).
      await expect(pb.collection("players").delete(cId)).rejects.toBeTruthy();
      await expect(pb.collection("queues").delete(cId)).rejects.toBeTruthy();
      await expect(pb.collection("users").delete(cId)).rejects.toMatchObject({ status: 403 });
      expect(await snap(cId)).toBeTruthy();

      // Situation : C fonde une alliance avec D, a une flotte en vol, une offre, une enchère (D en tête), un contrat accepté par D ;
      // D a une garnison chez C.
      const tag = `Z${suffix.slice(0, 3)}`.toUpperCase();
      const al = await admin.collection("alliances").create({ name: `Zeta ${suffix}`, tag, createdBy: cId, createdAtMs: now, members: [cId, dId], memberPseudos: { [cId]: C.pseudo, [dId]: D.pseudo }, roles: {} });
      await admin.collection("players").update(cId, { allianceId: al.id });
      await admin.collection("players").update(dId, { allianceId: al.id, resources: { ...RICH, scrap: 5000 } });
      const fleet = await admin.collection("fleets").create({ ownerUid: cId, ownerPseudo: C.pseudo, targetUid: dId, targetPseudo: D.pseudo, mission: "transport", units: { chasseur: 1 }, departAtMs: now, arriveAtMs: now + 3600_000, status: "outbound" });
      const garrison = await admin.collection("fleets").create({ ownerUid: dId, ownerPseudo: D.pseudo, targetUid: cId, targetPseudo: C.pseudo, mission: "garrison", units: { chasseur: 2 }, departAtMs: now - 120_000, arriveAtMs: now - 60_000, stationedUntilMs: now + 3600_000, status: "stationed" });
      const offer = await admin.collection("market_offers").create({ sellerId: cId, sellerPseudo: C.pseudo, giveRes: "scrap", giveAmount: 100, wantRes: "energy", wantAmount: 100, status: "open", createdAtMs: now, expiresAtMs: now + 3600_000 });
      const auction = await admin.collection("auctions").create({ sellerId: cId, sellerPseudo: C.pseudo, kind: "relic", item: {}, label: "Lot d'essai", res: "scrap", startPrice: 100, bid: 700, bidderId: dId, bidderPseudo: D.pseudo, bids: 1, status: "open", createdAtMs: now, endsAtMs: now + 3600_000 });
      const contract = await admin.collection("trade_contracts").create({ clientUid: cId, clientPseudo: C.pseudo, targetUid: "", wantRes: "energy", wantAmount: 100, payRes: "scrap", payAmount: 100, hours: 4, status: "accepted", createdAtMs: now, expiresAtMs: now + 3600_000, supplierUid: dId, supplierPseudo: D.pseudo, deposit: 300, acceptedAtMs: now, deadlineMs: now + 3600_000, fleetId: "", closedAtMs: 0 });
      const dScrap = (await snap(dId)).resources.scrap;

      // Mauvais mot de passe : refusé, rien n'est effacé.
      await expect(pb.send("/api/cosmic/account/delete", { method: "POST", body: { password: "mauvais", confirm: C.pseudo } })).rejects.toMatchObject({ status: 400 });
      expect(await snap(cId)).toBeTruthy();
      const token = pb.authStore.token;
      const record = pb.authStore.record;
      const { deleteAccount } = await import("@/services/authService");
      await deleteAccount(C.pw, C.pseudo);
      expect(pb.authStore.isValid).toBe(false);

      // Compte, fiche, files, fiche publique : effacés.
      expect(await snap(cId)).toBeNull();
      await expect(admin.collection("queues").getOne(cId)).rejects.toMatchObject({ status: 404 });
      await expect(admin.collection("users").getOne(cId)).rejects.toMatchObject({ status: 404 });
      await expect(admin.collection("profiles").getOne(cId)).rejects.toMatchObject({ status: 404 });
      // Flotte en vol supprimée ; garnison de D renvoyée chez elle.
      await expect(admin.collection("fleets").getOne(fleet.id)).rejects.toMatchObject({ status: 404 });
      expect((await admin.collection("fleets").getOne(garrison.id)).status).toBe("returning");
      // Offre retirée ; enchère annulée et D remboursé (700), caution du contrat rendue (300).
      await expect(admin.collection("market_offers").getOne(offer.id)).rejects.toMatchObject({ status: 404 });
      expect((await admin.collection("auctions").getOne(auction.id)).status).toBe("cancelled");
      expect((await admin.collection("trade_contracts").getOne(contract.id)).status).toBe("cancelled");
      expect((await snap(dId)).resources.scrap).toBeGreaterThanOrEqual(dScrap + 700 + 300);
      // Alliance : D devient fondateur, C n'est plus membre.
      const left = await admin.collection("alliances").getOne(al.id);
      expect(left.members).toEqual([dId]);
      expect(left.createdBy).toBe(dId);
      const titles = (await admin.collection("notifications").getFullList({ filter: `player_id="${dId}"` })).map((n) => n.title);
      expect(titles).toEqual(expect.arrayContaining(["Tu diriges l'alliance", "Garnison rappelée", "Enchère annulée", "Contrat annulé"]));
      // Journal de l'équipe.
      const log = await admin.collection("admin_logs").getFirstListItem(`recordId="${cId}"`, { sort: "-createdAtMs" });
      expect(log.action).toBe("compte : supprimé");

      // Un nouvel « init » avec l'ancien jeton ne recrée rien.
      pb.authStore.save(token, record);
      await expect(pb.send("/api/cosmic/init", { method: "POST" })).rejects.toBeTruthy();
      expect(await snap(cId)).toBeNull();
      await admin.collection("alliances").delete(al.id).catch(() => {});
    } finally {
      pb.authStore.clear();
      await admin.collection("players").delete(cId).catch(() => {});
      await admin.collection("users").delete(cId).catch(() => {});
      await loginPlayer(B.email, B.pw);
    }
  });

  it("6.14.110 (AC-D) : dépense comptée, réclamation au Journal, revente comptée, rappel de flotte tracé et allié prévenu", async () => {
    await ensureAB();
    await loginPlayer(B.email, B.pw);
    const before = await snap(bId);
    const now = Date.now();
    let garrisonId = "";
    try {
      await admin.collection("players").update(bId, {
        resources: { ...RICH, scrap: 2_000_000, energy: 2_000_000 },
        moon: { name: "Lune d'essai", level: 1, bornAtMs: now - 60_000, fromDebris: 1 },
        units: { ...before.units, chasseur: { level: 1, count: 10 } },
        contracts: { day: contractDay(now), items: [{ id: "acd1", type: "spy", target: 1, progress: 1, claimed: false }, { id: "acd2", type: "spend", target: 10_000_000, progress: 0, claimed: false }], streak: 0, lastCompletedDay: null, rerolled: false },
        stats: { ...(before.stats ?? {}), spent: 0, unitsSold: 0 },
        vacation: null,
      });
      // AC-5 : l'amélioration de la lune passe par le chemin unique (statistique et objectif « Dépenser »).
      await ps.upgradeMoon();
      const afterMoon = await snap(bId);
      expect(afterMoon.moon.level).toBe(2);
      expect(afterMoon.stats.spent).toBeGreaterThanOrEqual(750_000);
      expect(afterMoon.contracts.items.find((c: { id: string }) => c.id === "acd2").progress).toBeGreaterThanOrEqual(750_000);
      // AC-21 : revente comptée.
      await ps.sellUnit(bId, "chasseur", 3);
      expect((await snap(bId)).stats.unitsSold).toBe(3);
      // AC-6 : une ligne déjà lue au Journal, avec le gain.
      await ps.claimContract("acd1");
      const notes = await admin.collection("notifications").getFullList({ filter: `player_id="${bId}" && title="Objectif du jour récupéré"` });
      expect(notes).toHaveLength(1);
      expect(notes[0].read).toBe(true);
      expect(notes[0].message).toMatch(/^Objectif du jour : \+/);
      // AC-12 : garnison de B chez A rappelée ; B garde une trace, A est prévenu.
      const g = await admin.collection("fleets").create({ ownerUid: bId, ownerPseudo: B.pseudo, targetUid: aId, targetPseudo: A.pseudo, mission: "garrison", units: { chasseur: 2 }, departAtMs: now - 120_000, arriveAtMs: now - 60_000, stationedUntilMs: now + 3600_000, status: "stationed" });
      garrisonId = g.id;
      const back = await ps.recallFleet(g.id);
      expect(back.status).toBe("returning");
      const mine = await admin.collection("notifications").getFullList({ filter: `player_id="${bId}" && title="Flotte rappelée"` });
      expect(mine.length).toBeGreaterThanOrEqual(1);
      expect(mine[0].read).toBe(true);
      const host = await admin.collection("notifications").getFullList({ filter: `player_id="${aId}" && title="Garnison rappelée"`, sort: "-createdAtMs" });
      expect(host.length).toBeGreaterThanOrEqual(1);
      // Pseudo du moment (un test plus haut renomme B).
      expect(host[0].message).toContain((await snap(bId)).pseudo);
      expect(host[0].read).toBe(false);
    } finally {
      if (garrisonId) await admin.collection("fleets").delete(garrisonId).catch(() => {});
      await admin.collection("players").update(bId, { resources: before.resources, moon: before.moon ?? null, units: before.units, contracts: before.contracts ?? null, stats: before.stats ?? {} });
    }
  });

  it("6.14.111 (AC-E) : campagne d'e-mails en file, envoyée par lots, chaque destinataire une fois ; échéances décalées après une maintenance", async () => {
    await ensureAB();
    const rulesRec = await admin.collection("game_config").getFirstListItem('key="rules"');
    const rulesBefore = rulesRec.data as Record<string, unknown>;
    const settingsBefore = await admin.settings.getAll();
    const userBefore = await admin.collection("users").getOne(bId);
    const levRec = await admin.collection("game_config").getFirstListItem('key="leviathan"').catch(() => null);
    try {
      // Lots d'un e-mail, sans pause ; SMTP « activé » vers une adresse morte : chaque envoi échoue tout de suite.
      await admin.collection("game_config").update(rulesRec.id, { data: { ...rulesBefore, serverTasks: { mailBatchSize: 1, mailPauseMs: 0 } } });
      await admin.settings.update({ smtp: { enabled: true, host: "127.0.0.1", port: 9, username: "", password: "" } });
      await admin.collection("users").update(bId, { verified: true });
      await admin.collection("players").update(bId, { emailOptOut: false });
      const count = await admin.send("/api/cosmic/admin/mail", { method: "POST", body: { action: "count" } });
      expect(count.smtp).toBe(true);
      expect(count.recipients).toBeGreaterThanOrEqual(1);
      const t0 = Date.now();
      const out = await admin.send("/api/cosmic/admin/mail", { method: "POST", body: { action: "send", confirm: "ENVOYER", subject: "Lots", html: "<p>Bonjour {{PSEUDO}}</p>", text: "x", apiUrl: PB_TEST_URL } });
      // La route rend la main tout de suite (avant : 600 ms par destinataire).
      expect(Date.now() - t0).toBeLessThan(5000);
      expect(out.queued).toBe(count.recipients);
      // Un lot par passage (la cadence minute peut aussi en traiter : on vide la file).
      let guard = 0;
      let left = out.queued;
      while (left > 0 && guard++ < out.queued + 5) left = (await admin.send("/api/cosmic/admin/mail", { method: "POST", body: { action: "tick" } })).queued;
      expect(left).toBe(0);
      const hist = (await admin.collection("game_config").getFirstListItem('key="mail_campaigns"')).data as { list: { id: string; sent: number; failed: number; pending?: number; total?: number }[] };
      const entry = hist.list.find((c) => c.id === out.campaignId)!;
      expect(entry.total).toBe(out.queued);
      expect(entry.pending).toBe(0);
      // Chaque destinataire tenté une seule fois (au plus une fois) : envoyés + échecs = total.
      expect(entry.sent + entry.failed).toBe(out.queued);
      // Fiche du joueur jamais réécrite par l'envoi.
      expect((await snap(bId)).emailOptOut).toBe(false);
    } finally {
      await admin.settings.update({ smtp: settingsBefore.smtp });
      await admin.collection("users").update(bId, { verified: userBefore.verified });
      await admin.collection("game_config").update(rulesRec.id, { data: rulesBefore });
    }

    // Q77 : un boss en cours pendant une maintenance voit son échéance décalée de la durée de la coupure.
    const now = Date.now();
    const lev = { id: "lev-ace", startMs: now - 3_600_000, endMs: now + 3_600_000, maxHp: 1_000_000, hp: 1_000_000, status: "active", contributions: {}, endedAtMs: 0, rewarded: false, titleHolder: null, timeline: [] };
    const levId = levRec ? levRec.id : (await admin.collection("game_config").create({ key: "leviathan", data: lev })).id;
    try {
      await admin.collection("game_config").update(levId, { data: lev });
      await admin.send("/api/cosmic/admin/maintenance", { method: "POST", body: { enabled: true, endsAtMs: now + 600_000 } });
      await wait(1500);
      await admin.send("/api/cosmic/admin/maintenance", { method: "POST", body: { enabled: false } });
      const after = (await admin.collection("game_config").getOne(levId)).data as { endMs: number; startMs: number };
      expect(after.endMs).toBeGreaterThanOrEqual(lev.endMs + 1400);
      expect(after.startMs).toBe(lev.startMs);
      const log = await admin.collection("admin_logs").getFirstListItem('action="maintenance"', { sort: "-createdAtMs" });
      expect((log.changes as { échéancesDécalées?: number }).échéancesDécalées).toBeGreaterThanOrEqual(1);
    } finally {
      const m = await admin.collection("game_config").getFirstListItem('key="maintenance"').catch(() => null);
      if (m && (m.data as { enabled?: boolean }).enabled) await admin.send("/api/cosmic/admin/maintenance", { method: "POST", body: { enabled: false } });
      if (levRec) await admin.collection("game_config").update(levRec.id, { data: levRec.data });
      else await admin.collection("game_config").delete(levId);
    }
  }, 60_000);

  it("6.14.112 (AC-F) : erreurs traduites côté client ; garde de vacances unique sur les routes qui rapportent", async () => {
    await ensureAB();
    await loginPlayer(B.email, B.pw);
    // 403 d'une route du jeu : GameActionError avec le message du serveur (avant : erreur brute, « Action impossible. » à l'écran).
    const forbidden = (await ps.callGame("admin/maintenance", { enabled: false }).catch((err: unknown) => err)) as Error;
    expect(forbidden).toBeInstanceOf(GameActionError);
    expect(forbidden.message).toMatch(/administrateurs/);
    const before = await snap(bId);
    const now = Date.now();
    try {
      await admin.collection("players").update(bId, { vacation: { startedAtMs: now - 60_000, untilMs: now + 3 * 86_400_000 } });
      // Une seule liste et un seul message : action, casino, Codex, défi, Comptoir, porte de saut.
      await expect(ps.claimAllRewards()).rejects.toThrow(/vacances/);
      await expect(pb.send("/api/cosmic/casino", { method: "POST", body: { action: "daily" } })).rejects.toMatchObject({ status: 400, response: { message: expect.stringMatching(/vacances.*casino/) } });
      await expect(ps.callGame("codex/claim", { category: "units" })).rejects.toThrow(/vacances.*Codex/);
      await expect(ps.callGame("codex/claim")).rejects.toThrow(/vacances.*titre du Codex/);
      await expect(ps.callGame("challenge/claim")).rejects.toThrow(/vacances/);
      await expect(pb.send("/api/cosmic/bounty", { method: "POST", body: { action: "exchange", amount: 1 } })).rejects.toMatchObject({ status: 400, response: { message: expect.stringMatching(/vacances/) } });
      // Ce que la liste permet passe toujours.
      await ps.syncPlayer(bId);
      // L'admin ouvre un geste : la route l'accepte aussitôt (même liste pour tout le serveur).
      const rulesRec = await admin.collection("game_config").getFirstListItem('key="rules"');
      const rulesBefore = rulesRec.data as Record<string, unknown>;
      try {
        const vac = (rulesBefore.vacation as Record<string, unknown> | undefined) ?? {};
        await admin.collection("game_config").update(rulesRec.id, { data: { ...rulesBefore, vacation: { ...vac, allowed: ["sync", "seenAnnouncements", "setTitle", "hideOnboarding", "setProfileStyle", "colonyRename", "vacationEnd", "hideGuide", "casinoDaily"] } } });
        const daily = await pb.send("/api/cosmic/casino", { method: "POST", body: { action: "daily" } }).catch((err) => err);
        // Permis : plus de refus « vacances » (le jeton peut déjà avoir été pris : autre refus, sans « vacances »).
        expect(String(daily?.response?.message ?? "")).not.toMatch(/vacances/);
      } finally {
        await admin.collection("game_config").update(rulesRec.id, { data: rulesBefore });
      }
    } finally {
      await admin.collection("players").update(bId, { vacation: before.vacation ?? null, casino: before.casino ?? null });
    }
  });

  it("6.14.113 (AC-G) : « Tout réclamer » prend le jeton du casino et la récompense du défi, une seule fois, avec une ligne au Journal", async () => {
    await ensureAB();
    await loginPlayer(B.email, B.pw);
    const existing = await admin.collection("game_config").getFirstListItem('key="challenge"').catch(() => null);
    const now = Date.now();
    const previous = { id: "wk-acg", type: "market", target: 1000, startMs: now - 8 * 86_400_000, endMs: now - 86_400_000, total: 1200, contributions: { [bId]: { pseudo: B.pseudo, amount: 1200 } }, status: "done", success: true, claimed: [] };
    const rec = existing
      ? await admin.collection("game_config").update(existing.id, { data: { current: null, previous, titleHolder: null } })
      : await admin.collection("game_config").create({ key: "challenge", data: { current: null, previous, titleHolder: null } });
    const before = await snap(bId);
    try {
      await admin.collection("players").update(bId, { casino: { ...(before.casino ?? {}), tokens: 0, dailyDay: "2000-01-01" }, vacation: null });
      const aiBefore = (await snap(bId)).resources.aiFragment ?? 0;
      const out = (await ps.claimAllRewards()) as Record<string, number>;
      expect(out.challengeClaim).toBe(1);
      const after = await snap(bId);
      expect(after.resources.aiFragment).toBeGreaterThan(aiBefore);
      // Le jeton du jour, si le casino du serveur en donne (réglages par défaut : oui).
      if (out.casinoDaily) expect(after.casino.tokens).toBeGreaterThanOrEqual(1);
      // État du défi enregistré dans la même transaction : réclamé une seule fois.
      expect(((await admin.collection("game_config").getOne(rec.id)).data as { previous: { claimed: string[] } }).previous.claimed).toEqual([bId]);
      const again = (await ps.claimAllRewards()) as Record<string, number>;
      expect(again.challengeClaim ?? 0).toBe(0);
      expect(again.casinoDaily ?? 0).toBe(0);
      await expect(pb.send("/api/cosmic/challenge/claim", { method: "POST" })).rejects.toMatchObject({ status: 400 });
      const lines = await admin.collection("notifications").getFullList({ filter: `player_id="${bId}" && title="Tout réclamé"`, sort: "-createdAtMs" });
      // Une ligne par « Tout réclamer » (le second passage peut prendre d'autres récompenses prêtes dans la suite complète).
      const line = lines.find((n) => /récompense du défi/.test(n.message));
      expect(line).toBeTruthy();
      expect(line!.read).toBe(true);
    } finally {
      if (existing) await admin.collection("game_config").update(rec.id, { data: existing.data });
      else await admin.collection("game_config").delete(rec.id);
      await admin.collection("players").update(bId, { casino: before.casino ?? null, resources: before.resources });
    }
  });

  it("changes password and keeps the session", async () => {
    await changePassword(B.pw, "nouveaumdp9");
    expect(pb.authStore.isValid).toBe(true);
    logout();
    await loginPlayer(B.email, "nouveaumdp9");
  });
});
