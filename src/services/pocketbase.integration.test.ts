// Tests de bout en bout contre un VRAI serveur PocketBase de test (jamais
// celui de production : ils créent des comptes). Ignorés par défaut :
//   PB_TEST_URL=http://127.0.0.1:8090 PB_TEST_ADMIN_EMAIL=… PB_TEST_ADMIN_PASSWORD=… \
//     npx vitest run src/services/pocketbase.integration.test.ts
// Le serveur doit avoir le schéma (pocketbase/setup.mjs) et les hooks
// (pocketbase/pb_hooks) installés. Le compte superuser sert à préparer les
// scénarios (donner des ressources, vieillir un compte) : les joueurs ne
// peuvent plus modifier eux-mêmes ces champs.
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
const PB_TEST_ADMIN = process.env.PB_TEST_ADMIN_EMAIL
  ? { email: process.env.PB_TEST_ADMIN_EMAIL, password: process.env.PB_TEST_ADMIN_PASSWORD ?? "" }
  : null;

const RICH = { scrap: 100000, energy: 100000, nano: 100000, data: 100000, reinforcedSteel: 500, cyberModule: 500, syntheticNanites: 500, aiFragment: 500 };
const MONTH_AGO = () => Date.now() - 30 * 24 * 3600 * 1000;

describe.skipIf(!PB_TEST_URL || !PB_TEST_ADMIN)("PocketBase integration", () => {
  const admin = new PocketBase(PB_TEST_URL);

  beforeAll(async () => {
    pb.baseURL = PB_TEST_URL!;
    pb.authStore.clear();
    await admin.collection("_superusers").authWithPassword(PB_TEST_ADMIN!.email, PB_TEST_ADMIN!.password);
  });

  let aId = "", bId = "", allianceId = "";

  it("registers two players and the server creates their profiles", async () => {
    aId = (await registerPlayer(A.pseudo, A.email, A.pw)).id;
    const p = await ps.fetchPlayerSnapshot(aId);
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
    const p = await ps.fetchPlayerSnapshot(aId);
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
    const p = await ps.fetchPlayerSnapshot(aId);
    expect(p?.contracts?.items).toHaveLength(3);
    const open = p!.contracts!.items.find((c) => !c.claimed && c.progress < c.target);
    if (open) await expect(ps.claimContract(open.id)).rejects.toThrow(/pas encore/);
    await expect(pb.collection("players").update(aId, { contracts: { ...p!.contracts, items: [] } })).rejects.toBeTruthy();
  });

  it("forbids writing another player's data", async () => {
    await expect(pb.collection("players").update(bId, { pseudo: "pirate" })).rejects.toMatchObject({ status: 404 });
    await expect(pb.collection("queues").getOne(bId)).rejects.toMatchObject({ status: 404 });
    await expect(pb.collection("players").create({ id: "aaaaaaaaaaaaaaa", pseudo: "x", resources: {}, buildings: {} })).rejects.toBeTruthy();
    const other = await ps.fetchPlayerSnapshot(bId); // lecture autorisée (espionnage, classement)
    expect(other?.pseudo).toBe(B.pseudo);
  });

  it("creates an alliance, chat is members-only", async () => {
    allianceId = await al.createAlliance(aId, A.pseudo, "Les Testeurs", "tst" + suffix.slice(0, 2));
    await al.sendAllianceMessage(allianceId, aId, A.pseudo, "Bienvenue");
    // allianceId renseigné par le joueur, pas écrasé par une action de jeu
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

  it("gifts are transferred immediately by the server", async () => {
    await admin.collection("players").update(bId, { resources: { ...RICH, scrap: 5000 } });
    const before = (await ps.fetchPlayerSnapshot(aId))!.resources.scrap;
    await ps.sendResourceGift({ fromUid: bId, fromPseudo: B.pseudo, toUid: aId, toPseudo: A.pseudo, resources: { scrap: 1000 } });
    const b = (await ps.fetchPlayerSnapshot(bId))!;
    expect(b.resources.scrap).toBeLessThan(5000 - 999 + 100); // débité (hors production des dernières secondes)
    const after = (await ps.fetchPlayerSnapshot(aId))!.resources.scrap;
    expect(after - before).toBeGreaterThanOrEqual(1000);
    await expect(
      ps.sendResourceGift({ fromUid: bId, fromPseudo: B.pseudo, toUid: aId, toPseudo: A.pseudo, resources: { scrap: 10_000_000 } }),
    ).rejects.toThrow(/insuffisantes/);
  });

  it("legacy gifts (old system) are credited once", async () => {
    const gift = await admin.collection("resource_gifts").create({
      fromUid: aId, fromPseudo: A.pseudo, toUid: bId, toPseudo: B.pseudo, resources: { scrap: 700 }, timestamp: Date.now(), claimed: false,
    });
    const before = (await ps.fetchPlayerSnapshot(bId))!.resources.scrap;
    await Promise.all([ps.claimResourceGift(bId, gift.id), ps.claimResourceGift(bId, gift.id)]);
    await ps.claimResourceGift(bId, gift.id);
    const after = (await ps.fetchPlayerSnapshot(bId))!.resources.scrap;
    expect(after - before).toBeGreaterThanOrEqual(700);
    expect(after - before).toBeLessThan(1400);
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
    await expect(
      ps.initiateAttack({ attackerUid: aId, attackerPseudo: A.pseudo, targetUid: bId, targetPseudo: B.pseudo, fleet: { chasseur: 5 } }),
    ).rejects.toThrow(/débute/);

    await admin.collection("players").update(bId, { createdAtMs: MONTH_AGO() });
    const bBefore = (await ps.fetchPlayerSnapshot(bId))!;

    const res = await ps.initiateAttack({ attackerUid: aId, attackerPseudo: A.pseudo, targetUid: bId, targetPseudo: B.pseudo, fleet: { chasseur: 5 } });
    expect(res.outcome).toBe("attacker_win");
    expect(res.attackerXpDelta).toBeGreaterThan(0);
    expect((await ps.fetchPlayerSnapshot(aId))?.victories).toBe(1);

    // Le défenseur est mis à jour par le serveur, sans attendre sa connexion.
    const bAfter = (await ps.fetchPlayerSnapshot(bId))!;
    expect(bAfter.defeats).toBe(1);
    expect(bAfter.lastDefeatAtMs).toBeGreaterThan(0);
    // Butin limité par la cargaison des 5 chasseurs, retiré au défenseur.
    const looted = Object.values(res.loot ?? {}).reduce((a, b) => a + (b ?? 0), 0);
    expect(looted).toBe(res.cargoCapacity);
    expect(bAfter.resources.reinforcedSteel).toBe(bBefore.resources.reinforcedSteel - (res.loot?.reinforcedSteel ?? 0));

    // Délai de 2 h (et bouclier) sur la même cible.
    await expect(
      ps.initiateAttack({ attackerUid: aId, attackerPseudo: A.pseudo, targetUid: bId, targetPseudo: B.pseudo, fleet: { chasseur: 1 } }),
    ).rejects.toThrow(/bouclier|récemment/);
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
    expect((await ps.fetchPlayerSnapshot(bId))!.defeats).toBe(1);
    const notifs = await pb.collection("notifications").getFullList({ filter: `player_id="${bId}" && kind="combat-defender"` });
    expect(notifs.length).toBe(1);
  });

  it("legacy battle reports (old system) are applied when seen", async () => {
    const rep = await admin.collection("battle_reports").create({
      attackerUid: aId, attackerPseudo: A.pseudo, defenderUid: bId, defenderPseudo: B.pseudo, timestamp: Date.now() - 5000,
      outcome: "defender_win", defenderLosses: {}, loot: null, defenderProcessed: false, defenderXpDelta: 3,
    });
    const before = (await ps.fetchPlayerSnapshot(bId))!;
    const seen = await ps.processBattleReportForDefender(bId, rep.id);
    expect(seen?.id).toBe(rep.id);
    const after = (await ps.fetchPlayerSnapshot(bId))!;
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
