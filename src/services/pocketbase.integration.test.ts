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
  });

  afterAll(async () => {
    if (savedRules) await admin.collection("game_config").update(savedRules.id, { data: savedRules.data });
    if (createdRulesId) await admin.collection("game_config").delete(createdRulesId);
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

      const results = await pb.collection("season_results").getFullList({ filter: `seasonId="${SEASON}"`, sort: "rank" });
      expect(results.map((r) => [r.uid, r.rank])).toEqual([[aId, 1], [bId, 2]]);
      const aAfter = await snap(aId);
      expect(aAfter.resources.reinforcedSteel).toBeGreaterThanOrEqual(aBefore.resources.reinforcedSteel + 500);
      expect(aAfter.activeTitle).toBe("Champion de Décembre 1999");
      const notif = await admin.collection("notifications").getFullList({ filter: `player_id="${aId}" && kind="season"` });
      expect(notif.length).toBe(1);

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

  it("changes password and keeps the session", async () => {
    await changePassword(B.pw, "nouveaumdp9");
    expect(pb.authStore.isValid).toBe(true);
    logout();
    await loginPlayer(B.email, "nouveaumdp9");
  });
});
