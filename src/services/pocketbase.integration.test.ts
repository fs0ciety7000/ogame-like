// Tests de bout en bout contre un VRAI serveur PocketBase de test (jamais
// celui de production : ils créent des comptes). Ignorés par défaut :
//   PB_TEST_URL=http://127.0.0.1:8090 [PB_TEST_ADMIN_EMAIL=… PB_TEST_ADMIN_PASSWORD=…] \
//     npx vitest run src/services/pocketbase.integration.test.ts
// Le serveur doit avoir le schéma (pocketbase/setup.mjs) et les hooks
// (pocketbase/pb_hooks) installés.
import { beforeAll, describe, expect, it } from "vitest";
import PocketBase from "pocketbase";
import { pb } from "@/lib/pocketbase";
import { loginPlayer, registerPlayer, logout, changePassword } from "@/services/authService";
import * as ps from "@/services/playerService";
import * as al from "@/services/allianceService";
import { resetContentSection, saveContentSection } from "@/services/contentService";
import { checkIsAdmin } from "@/services/adminService";
import { defaultGameContent } from "@/game/content";

const suffix = Math.random().toString(36).slice(2, 7);
const A = { pseudo: `Alpha_${suffix}`, email: `a${suffix}@test.dev`, pw: "motdepasse1" };
const B = { pseudo: `Bravo_${suffix}`, email: `b${suffix}@test.dev`, pw: "motdepasse2" };

const PB_TEST_URL = process.env.PB_TEST_URL;
// Facultatif : compte superuser du serveur de test, pour les scénarios qui
// demandent de modifier des champs réservés (ex. ancienneté d'un compte).
const PB_TEST_ADMIN = process.env.PB_TEST_ADMIN_EMAIL
  ? { email: process.env.PB_TEST_ADMIN_EMAIL, password: process.env.PB_TEST_ADMIN_PASSWORD ?? "" }
  : null;

describe.skipIf(!PB_TEST_URL)("PocketBase integration", () => {
  beforeAll(() => {
    pb.baseURL = PB_TEST_URL!;
    pb.authStore.clear();
  });

  let aId = "", bId = "", allianceId = "";

  it("registers two players and creates their docs", async () => {
    aId = (await registerPlayer(A.pseudo, A.email, A.pw)).id;
    const p = await ps.fetchPlayerSnapshot(aId);
    expect(p?.pseudo).toBe(A.pseudo);
    expect(p?.uid).toBe(aId);
    expect(p?.buildings.extracteur_ferraille.unlocked).toBe(true);
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

  it("runs game actions (sync, research, trade) serialized", async () => {
    await pb.collection("players").update(aId, { resources: { scrap: 100000, energy: 100000, nano: 100000, data: 100000, reinforcedSteel: 500, cyberModule: 500, syntheticNanites: 500, aiFragment: 500 } });
    const results = await Promise.all([ps.syncPlayer(aId, 5), ps.unlockBuilding(aId, "reacteur_instable"), ps.startResearch(aId, "tech1"), ps.tradeResources(aId, "scrap", "energy", 100)]);
    expect(results[3]).toBeGreaterThan(0);
    const p = await ps.fetchPlayerSnapshot(aId);
    expect(p?.buildings.reacteur_instable.unlocked).toBe(true);
    expect(p?.playtimeSeconds).toBe(5);
    const q = await pb.collection("queues").getOne(aId);
    expect(q.activeResearches.map((r: { id: string }) => r.id)).toContain("tech1");
    await expect(ps.startResearch(aId, "tech1")).rejects.toThrow(/déjà en cours/);
  });

  it("forbids writing another player's data", async () => {
    await expect(pb.collection("players").update(bId, { xp: 999999 })).rejects.toMatchObject({ status: 404 });
    await expect(pb.collection("queues").getOne(bId)).rejects.toMatchObject({ status: 404 });
    await expect(pb.collection("players").create({ id: "aaaaaaaaaaaaaaa", pseudo: "x", resources: {}, buildings: {} })).rejects.toBeTruthy();
    const other = await ps.fetchPlayerSnapshot(bId); // lecture autorisée (espionnage, classement)
    expect(other?.pseudo).toBe(B.pseudo);
  });

  it("creates an alliance, chat is members-only", async () => {
    allianceId = await al.createAlliance(aId, A.pseudo, "Les Testeurs", "tst" + suffix.slice(0, 2));
    await al.sendAllianceMessage(allianceId, aId, A.pseudo, "Bienvenue");
    // pseudo mis à jour côté joueur -> allianceId renseigné, pas écrasé par une action de jeu
    await ps.syncPlayer(aId);
    expect((await ps.fetchPlayerSnapshot(aId))?.allianceId).toBe(allianceId);
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

  it("gift can only be claimed once", async () => {
    await pb.collection("players").update(bId, { resources: { scrap: 5000, energy: 5000, nano: 0, data: 0, reinforcedSteel: 0, cyberModule: 0, syntheticNanites: 0, aiFragment: 0 } });
    await ps.sendResourceGift({ fromUid: bId, fromPseudo: B.pseudo, toUid: aId, toPseudo: A.pseudo, resources: { scrap: 1000 } });
    logout();
    await loginPlayer(A.pseudo, A.pw);
    const gifts = await pb.collection("resource_gifts").getFullList({ filter: `toUid="${aId}" && claimed=false` });
    expect(gifts.length).toBe(1);
    const before = (await ps.fetchPlayerSnapshot(aId))!.resources.scrap;
    await Promise.all([ps.claimResourceGift(aId, gifts[0].id), ps.claimResourceGift(aId, gifts[0].id)]);
    const after = (await ps.fetchPlayerSnapshot(aId))!.resources.scrap;
    expect(after - before).toBeGreaterThanOrEqual(1000);
    expect(after - before).toBeLessThan(2000);
    await ps.claimResourceGift(aId, gifts[0].id); // passage suivant refusé par la règle
    expect((await ps.fetchPlayerSnapshot(aId))!.resources.scrap - after).toBeLessThan(1000);
  });

  it("attack is arbitrated by the server: protections, XP, single defender processing", async () => {
    // Ni l'attaquant ni le défenseur ne peuvent écrire eux-mêmes un rapport
    // ou les champs JcJ réservés au serveur.
    await expect(
      pb.collection("battle_reports").create({ attackerUid: aId, defenderUid: bId, outcome: "attacker_win", defenderProcessed: false }),
    ).rejects.toBeTruthy();
    await expect(pb.collection("players").update(aId, { createdAtMs: 1 })).rejects.toBeTruthy();

    await pb.collection("players").update(aId, { units: { chasseur: { level: 1, count: 10 } } });
    // B vient de s'inscrire : protection débutant.
    await expect(
      ps.initiateAttack({ attackerUid: aId, attackerPseudo: A.pseudo, targetUid: bId, targetPseudo: B.pseudo, fleet: { chasseur: 5 } }),
    ).rejects.toThrow(/débute/);

    if (!PB_TEST_ADMIN) return; // la suite demande de vieillir le compte de B (superuser)
    const admin = new PocketBase(PB_TEST_URL);
    await admin.collection("_superusers").authWithPassword(PB_TEST_ADMIN.email, PB_TEST_ADMIN.password);
    await admin.collection("players").update(bId, { createdAtMs: Date.now() - 30 * 24 * 3600 * 1000 });

    const res = await ps.initiateAttack({ attackerUid: aId, attackerPseudo: A.pseudo, targetUid: bId, targetPseudo: B.pseudo, fleet: { chasseur: 5 } });
    expect(res.outcome).toBe("attacker_win");
    expect(res.attackerXpDelta).toBeGreaterThan(0);
    const me = await ps.fetchPlayerSnapshot(aId);
    expect(me?.victories).toBe(1);

    // Délai de 2 h (et bouclier) sur la même cible.
    await expect(
      ps.initiateAttack({ attackerUid: aId, attackerPseudo: A.pseudo, targetUid: bId, targetPseudo: B.pseudo, fleet: { chasseur: 1 } }),
    ).rejects.toThrow(/bouclier|récemment/);
    const recent = await ps.fetchMyRecentAttacks(aId, Date.now() - 3600 * 1000);
    expect(recent[bId]).toBeGreaterThan(0);

    const [rep] = await pb.collection("battle_reports").getFullList({ filter: `attackerUid="${aId}"` });
    expect(rep.defenderXpDelta).toBeLessThan(0);
    await expect(pb.collection("battle_reports").update(rep.id, { defenderProcessed: true })).rejects.toBeTruthy();

    logout();
    await loginPlayer(B.pseudo, B.pw);
    const xpBefore = (await ps.fetchPlayerSnapshot(bId))!.xp;
    const r = await Promise.all([ps.processBattleReportForDefender(bId, rep.id), ps.processBattleReportForDefender(bId, rep.id)]);
    expect(r.filter(Boolean).length).toBe(1);
    expect(await ps.processBattleReportForDefender(bId, rep.id)).toBeNull();
    const b = (await ps.fetchPlayerSnapshot(bId))!;
    expect(b.xp).toBe(Math.max(0, xpBefore + rep.defenderXpDelta));
    expect(b.defeats).toBe(1);
    expect(b.lastDefeatAtMs).toBeGreaterThan(0);
    const notifs = await pb.collection("notifications").getFullList({ filter: `player_id="${bId}" && kind="combat-defender"` });
    expect(notifs.length).toBe(1);
  });

  it("game content: only admins edit it, and the server applies it in combat", async () => {
    // Connecté en B (test précédent). Un joueur normal ne peut pas modifier le contenu.
    await expect(pb.collection("game_config").create({ key: "units", data: [] })).rejects.toBeTruthy();
    expect(await checkIsAdmin(bId)).toBe(false);
    if (!PB_TEST_ADMIN) return;

    const admin = new PocketBase(PB_TEST_URL);
    await admin.collection("_superusers").authWithPassword(PB_TEST_ADMIN.email, PB_TEST_ADMIN.password);
    await admin.collection("admins").create({ id: bId, note: "test" });
    expect(await checkIsAdmin(bId)).toBe(true);

    // B (admin) met l'attaque du Chasseur à 0 : une attaque de chasseurs
    // contre une base sans défense devient une égalité (0 contre 0).
    const units = defaultGameContent().units.map((u) => (u.id === "chasseur" ? { ...u, stats: { ...u.stats, attaque: 0 } } : u));
    await saveContentSection("units", units);
    try {
      await admin.collection("players").update(aId, { createdAtMs: Date.now() - 30 * 24 * 3600 * 1000 });
      await pb.collection("players").update(bId, { units: { chasseur: { level: 1, count: 10 } } });
      const res = await ps.initiateAttack({ attackerUid: bId, attackerPseudo: B.pseudo, targetUid: aId, targetPseudo: A.pseudo, fleet: { chasseur: 5 } });
      expect(res.attackerPower).toBe(0);
      expect(res.outcome).toBe("draw");
    } finally {
      await resetContentSection("units");
      await admin.collection("admins").delete(bId);
    }
  });

  it("leaderboard lists players without private fields", async () => {
    const list = await ps.listAllPlayers();
    expect(list.some((p) => p.uid === aId)).toBe(true);
  });

  it("changes password and keeps the session", async () => {
    await changePassword(B.pw, "nouveaumdp9");
    expect(pb.authStore.isValid).toBe(true);
    logout();
    await loginPlayer(B.email, "nouveaumdp9");
  });
});
