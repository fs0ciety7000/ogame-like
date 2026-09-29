// Tests de bout en bout contre un VRAI serveur PocketBase de test (jamais
// celui de production : ils créent des comptes). Ignorés par défaut :
//   PB_TEST_URL=http://127.0.0.1:8090 npx vitest run src/services/pocketbase.integration.test.ts
// Le serveur doit avoir le schéma installé (pocketbase/setup.mjs).
import { beforeAll, describe, expect, it } from "vitest";
import { pb } from "@/lib/pocketbase";
import { loginPlayer, registerPlayer, logout, changePassword } from "@/services/authService";
import * as ps from "@/services/playerService";
import * as al from "@/services/allianceService";

const suffix = Math.random().toString(36).slice(2, 7);
const A = { pseudo: `Alpha_${suffix}`, email: `a${suffix}@test.dev`, pw: "motdepasse1" };
const B = { pseudo: `Bravo_${suffix}`, email: `b${suffix}@test.dev`, pw: "motdepasse2" };

const PB_TEST_URL = process.env.PB_TEST_URL;

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

  it("attack + defender processing happens once", async () => {
    await pb.collection("players").update(aId, { units: { chasseur: { level: 1, count: 10 } } });
    const res = await ps.initiateAttack({ attackerUid: aId, attackerPseudo: A.pseudo, targetUid: bId, targetPseudo: B.pseudo, fleet: { chasseur: 5 } });
    expect(res.outcome).toBeTruthy();
    // un attaquant ne peut pas marquer le rapport comme traité
    const [rep] = await pb.collection("battle_reports").getFullList({ filter: `attackerUid="${aId}"` });
    await expect(pb.collection("battle_reports").update(rep.id, { defenderProcessed: true })).rejects.toBeTruthy();
    logout();
    await loginPlayer(B.pseudo, B.pw);
    const r = await Promise.all([ps.processBattleReportForDefender(bId, rep.id), ps.processBattleReportForDefender(bId, rep.id)]);
    expect(r.filter(Boolean).length).toBe(1);
    expect(await ps.processBattleReportForDefender(bId, rep.id)).toBeNull(); // passage suivant refusé par la règle
    const notifs = await pb.collection("notifications").getFullList({ filter: `player_id="${bId}" && kind="combat-defender"` });
    expect(notifs.length).toBe(1);
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
