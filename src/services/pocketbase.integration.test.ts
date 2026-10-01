// Tests de bout en bout contre un VRAI serveur PocketBase de test (jamais
// celui de production : ils créent des comptes). Ignorés par défaut :
//   PB_TEST_URL=http://127.0.0.1:8090 PB_TEST_ADMIN_EMAIL=… PB_TEST_ADMIN_PASSWORD=… \
//     npx vitest run src/services/pocketbase.integration.test.ts
// Le serveur doit avoir le schéma (pocketbase/setup.mjs) et les hooks
// (pocketbase/pb_hooks) installés. Le compte superuser sert à préparer les
// scénarios (donner des ressources, vieillir un compte) : les joueurs ne
// peuvent plus modifier eux-mêmes ces champs.
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import PocketBase from "pocketbase";
import { pb } from "@/lib/pocketbase";
import { loginPlayer, registerPlayer, logout, changePassword } from "@/services/authService";
import * as ps from "@/services/playerService";
import * as al from "@/services/allianceService";
import { resetContentSection, saveContentSection } from "@/services/contentService";
import { checkIsAdmin } from "@/services/adminService";
import { defaultGameContent } from "@/game/content";
import { fleetCargoCapacity } from "@/game/combat";
import { DEFAULT_FACTIONS, type FactionDef } from "@/game/pirates";
import { getBuildingUpgradeTime, findBuilding } from "@/game/buildings";

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
    expect(results[3]).toBeGreaterThan(0);
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
    expect(p?.contracts?.items).toHaveLength(3);
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
    await admin.collection("players").update(bId, { resources: { ...RICH, scrap: 5000 } });
    const before = (await snap(aId))!.resources.scrap;
    await ps.sendResourceGift({ fromUid: bId, fromPseudo: B.pseudo, toUid: aId, toPseudo: A.pseudo, resources: { scrap: 1000 } });
    const b = (await snap(bId))!;
    expect(b.resources.scrap).toBeLessThan(5000 - 999 + 100); // débité (hors production des dernières secondes)
    const after = (await snap(aId))!.resources.scrap;
    expect(after - before).toBeGreaterThanOrEqual(1000);
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
    // Butin limité par la cargaison des 5 chasseurs, retiré au défenseur.
    const looted = Object.values((res.loot ?? {}) as Record<string, number>).reduce((a, b) => a + (b ?? 0), 0);
    expect(looted).toBe(fleetCargoCapacity({ chasseur: { level: 1, count: 0 } }, landed.units));
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
    expect(after.xp).toBe(before.xp + 3);
    expect(await ps.processBattleReportForDefender(bId, rep.id)).toBeNull();
  });

  it("game content: only admins edit it, and the server applies it in combat", async () => {
    // Connecté en B. Un joueur normal ne peut pas modifier le contenu.
    await expect(pb.collection("game_config").create({ key: "units", data: [] })).rejects.toBeTruthy();
    expect(await checkIsAdmin(bId)).toBe(false);

    await admin.collection("admins").create({ id: bId, note: "test" });
    expect(await checkIsAdmin(bId)).toBe(true);

    // B (admin) met l'attaque du Chasseur à 0 : une attaque de chasseurs
    // contre une base sans défense devient une égalité (0 contre 0).
    const units = defaultGameContent().units.map((u) => (u.id === "chasseur" ? { ...u, stats: { ...u.stats, attaque: 0 } } : u));
    await saveContentSection("units", units);
    try {
      await admin.collection("players").update(aId, { createdAtMs: MONTH_AGO(), units: {} });
      await admin.collection("players").update(bId, { units: { chasseur: { level: 1, count: 10 } } });
      const { report: res } = await attackAndResolve(aId, { chasseur: 5 });
      expect(res.attackerPower).toBe(0);
      expect(res.outcome).toBe("draw");
    } finally {
      await resetContentSection("units");
      await admin.collection("admins").delete(bId);
    }
  }, 30_000);

  it("admin routes exist (statistics, season closing)", async () => {
    const stats = await admin.send("/api/cosmic/admin/stats", { method: "GET" });
    expect(stats).toBeTruthy();
    await expect(pb.send("/api/cosmic/admin/stats", { method: "GET" })).rejects.toMatchObject({ status: 403 });
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

    // Champ connu pour un ramassage déterministe : 2 drones niv. 1 = 500.
    if (field) await admin.collection("debris_fields").update(aId, { scrap: 1000, energy: 500 });
    else await admin.collection("debris_fields").create({ id: aId, locationPseudo: A.pseudo, scrap: 1000, energy: 500, expiresAtMs: Date.now() + 3600_000, updatedAtMs: Date.now() });
    await expect(ps.sendFleet(aId, { chasseur: 1 }, "recycle")).rejects.toThrow(/Drones|assez/);
    const sent = await ps.sendFleet(aId, { drone_recuperateur: 2 }, "recycle");
    await wait(Math.max(0, sent.arriveAtMs - Date.now()) + 400);
    await ps.syncPlayer("");
    const landed = await pb.collection("fleets").getOne(sent.id);
    expect(landed.loot).toEqual({ scrap: 333, energy: 167 });
    const left = await admin.collection("debris_fields").getOne(aId);
    expect([left.scrap, left.energy]).toEqual([667, 333]);
    const before = (await snap(bId)).resources.scrap;
    await wait(Math.max(0, landed.returnAtMs - Date.now()) + 400);
    await ps.syncPlayer("");
    const back = await snap(bId);
    expect(back.resources.scrap).toBeGreaterThanOrEqual(before + 333);
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
      expect(aAfter.resources.reinforcedSteel).toBeGreaterThanOrEqual(aBefore.resources.reinforcedSteel + 500);
      expect(aAfter.activeTitle).toBe("Champion de Décembre 1999");
      // A reçoit sa récompense individuelle et celle de son alliance championne.
      const notif = await admin.collection("notifications").getFullList({ filter: `player_id="${aId}" && kind="season"` });
      expect(notif.length).toBe(2);
      expect(aAfter.titles.map((t: { label: string }) => t.label)).toContain("Allié champion de Décembre 1999");
      expect((await pb.collection("season_results").getFullList({ filter: `seasonId="${SEASON}" && kind="alliance"` }))[0]?.allianceId).toBe(allianceId);

      // B choisit son titre, pas celui d'un autre ; il est public.
      await expect(ps.setActiveTitle("Champion de Décembre 1999")).rejects.toThrow(/gagné/);
      await expect(pb.collection("players").update(bId, { activeTitle: "Tricheur" })).rejects.toBeTruthy();
      await ps.setActiveTitle("");
      await ps.setActiveTitle("Podium de Décembre 1999");
      expect((await pb.collection("profiles").getOne(bId)).activeTitle).toBe("Podium de Décembre 1999");
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
      await expect(al.distributeTreasury(bId, { scrap: 10 })).rejects.toThrow(/officiers/);
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
      const raid = (await pb.collection("fleets").getFullList({ filter: `targetUid="${bId}" && mission="pirate"` }))[0];
      expect(raid).toMatchObject({ status: "outbound", factionId: "varan", ownerPseudo: "Le Silencieux" });
      await wait(Math.max(0, refused.raid!.arriveAtMs - Date.now()) + 400);
      await ps.syncPlayer("");
      const report = (await pb.collection("battle_reports").getFullList({ filter: `defenderUid="${bId}" && attackerUid="pirates"` }))[0];
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
      const assault = await ps.sendFleet("lair_varan", { chasseur: (await snap(bId)).units.chasseur.count }, "lair");
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
      expect(aAfter - aEnergy).toBeGreaterThanOrEqual(100_000 - filled.tax);
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
      const step = async (field: "arriveAtMs" | "returnAtMs") => {
        await admin.collection("fleets").update(sent.id, { [field]: Date.now() - 1000 });
        await ps.syncPlayer("");
        let f = await pb.collection("fleets").getOne(sent.id);
        if (f.status === "decision") {
          f = await pb.send("/api/cosmic/expedition/choose", { method: "POST", body: { fleetId: sent.id, choice: "force" } });
        }
        return f;
      };
      const mid = await step("arriveAtMs");
      expect(["returning", "done"]).toContain(mid.status);
      expect(mid.expedition.log.length).toBeGreaterThanOrEqual(1);
      const end = mid.status === "done" ? mid : await step("returnAtMs");
      expect(end.status).toBe("done");
      const after = await snap(bId);
      expect(after!.xp).toBeGreaterThanOrEqual(xp + 120); // + XP du succès « Grand large »
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
      await expect(ps.sendFleet("", { chasseur: 10 }, "leviathan")).rejects.toThrow(/pas là/);
      const started = await admin.send("/api/cosmic/admin/leviathan", { method: "POST", body: { action: "start" } });
      expect(started.status).toBe("active");
      expect(started.hp).toBe(started.maxHp);
      const sent = await ps.sendFleet("", { chasseur: 10 }, "leviathan");
      fleets.push(sent.id);
      await expect(ps.sendFleet("", { chasseur: 10 }, "leviathan")).rejects.toThrow(/min/);
      await admin.collection("fleets").update(sent.id, { arriveAtMs: Date.now() - 1000 });
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

  it("v3.3 anomalies: an impossible stock jump becomes a staff report", async () => {
    const before = await snap(bId);
    const now = Date.now();
    const scan = await admin.collection("game_config").getFirstListItem('key="anomaly_scan"').catch(() => null);
    if (scan) await admin.collection("game_config").delete(scan.id);
    const base = { ...before!.resources };
    const jumped = { ...base, reinforcedSteel: (base.reinforcedSteel ?? 0) + 900_000_000 };
    try {
      await admin.collection("players").update(bId, { resources: jumped, resourcesUpdatedAtMs: now - 60_000, resourceHistory: [{ t: now - 3600_000, r: base }] });
      await expect(pb.send("/api/cosmic/admin/anomalies", { method: "POST" })).rejects.toMatchObject({ status: 403 });
      const res = await admin.send("/api/cosmic/admin/anomalies", { method: "POST" });
      expect(res.alerts).toBeGreaterThanOrEqual(1);
      const report = await admin.collection("reports").getFirstListItem(`autoKey="anomaly:${bId}"`);
      expect(report.category).toBe("account");
      expect(report.description).toMatch(/Acier renforcé \+900/);
      expect((await admin.send("/api/cosmic/admin/anomalies", { method: "POST" })).alerts).toBe(0); // déjà analysé
    } finally {
      const reports = await admin.collection("reports").getFullList({ filter: `autoKey="anomaly:${bId}"` });
      for (const r of reports) await admin.collection("reports").delete(r.id);
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
      const raid = (await pb.collection("fleets").getFullList({ filter: `targetUid="${bId}" && mission="pirate"` }))[0];
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

  it("changes password and keeps the session", async () => {
    await changePassword(B.pw, "nouveaumdp9");
    expect(pb.authStore.isValid).toBe(true);
    logout();
    await loginPlayer(B.email, "nouveaumdp9");
  });
});
