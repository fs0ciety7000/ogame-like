/// <reference path="../pb_data/types.d.ts" />

// Cosmic Empires — toutes les actions de jeu, arbitrées par le serveur.
//
// Le navigateur ne peut plus écrire ses ressources, bâtiments, unités ni
// son XP (voir les règles de pb_schema.json) : il appelle ces routes, qui
// relisent le joueur, appliquent la production accumulée, vérifient
// l'action et écrivent le résultat dans une transaction.
//
// Fichiers associés dans pb_hooks/ : cosmic_game.js (logique de jeu
// compilée depuis src/game par `npm run build:hooks`), cosmic_db.js
// (lecture/écriture en base) et cosmic_updater.pb.js (mise à jour
// automatique de ces fichiers depuis GitHub).

// NB : chaque handler s'exécute isolé — les fonctions partagées sont dans
// cosmic_db.js, pas au niveau de ce fichier.

/**
 * POST /api/cosmic/init
 * Crée le profil du joueur connecté s'il n'existe pas encore.
 */
routerAdd(
  "POST",
  "/api/cosmic/init",
  (e) => {
    const db = require(`${__hooks}/cosmic_db.js`);
    const game = db.loadGame();
    const uid = e.auth.id;
    const pseudo = e.auth.getString("name") || e.auth.getString("username");
    let created = false;

    $app.runInTransaction((txApp) => {
      db.applyContent(txApp, game);
      const now = Date.now();
      const profile = game.newPlayerProfile(uid, pseudo, now);
      if (!db.findOrNull(txApp, "players", uid)) {
        const rec = new Record(txApp.findCollectionByNameOrId("players"));
        const data = Object.assign({}, profile.player, { id: uid });
        delete data.uid;
        rec.load(data);
        txApp.save(rec);
        created = true;
      }
      if (!db.findOrNull(txApp, "queues", uid)) {
        const rec = new Record(txApp.findCollectionByNameOrId("queues"));
        rec.load(Object.assign({ id: uid }, profile.queues));
        txApp.save(rec);
      }
    });

    return e.json(200, { created });
  },
  $apis.requireAuth("users"),
);

/**
 * POST /api/cosmic/action  { type, ...paramètres }
 * sync, unlockBuilding, upgradeBuilding, buildUnits, sellUnits, research,
 * mission, trade — voir src/game/actions.ts.
 */
routerAdd(
  "POST",
  "/api/cosmic/action",
  (e) => {
    const db = require(`${__hooks}/cosmic_db.js`);
    const game = db.loadGame();
    const uid = e.auth.id;
    const action = db.body(e);
    let response = null;

    $app.runInTransaction((txApp) => {
      db.applyContent(txApp, game);
      const loaded = db.loadPlayer(txApp, game, uid);
      let out;
      try {
        out = game.performPlayerAction(loaded.player, loaded.queues, action, Date.now());
      } catch (err) {
        throw db.asHttpError(game, err);
      }
      db.savePlayer(txApp, game, loaded, out.player, out.queues);
      db.notify(txApp, uid, out.notifications);
      response = { result: out.result === undefined ? null : out.result };
    });

    return e.json(200, response);
  },
  $apis.requireAuth("users"),
);

/**
 * POST /api/cosmic/gift  { toUid, resources: { ressource: quantité } }
 * Transfert immédiat : l'expéditeur est débité, le destinataire crédité.
 */
routerAdd(
  "POST",
  "/api/cosmic/gift",
  (e) => {
    const db = require(`${__hooks}/cosmic_db.js`);
    const game = db.loadGame();
    const uid = e.auth.id;
    const body = db.body(e);
    const toUid = String(body.toUid || "");
    if (!toUid) throw new BadRequestError("Destinataire manquant.");
    let response = null;

    $app.runInTransaction((txApp) => {
      db.applyContent(txApp, game);
      const now = Date.now();
      const sender = db.loadPlayer(txApp, game, uid);
      const recipient = db.loadPlayer(txApp, game, toUid, "Ce joueur est introuvable.");
      let out;
      try {
        out = game.performGift(sender.player, sender.queues, recipient.player, recipient.queues, body.resources || {}, now);
      } catch (err) {
        throw db.asHttpError(game, err);
      }
      db.savePlayer(txApp, game, sender, out.sender, out.senderQueues);
      db.savePlayer(txApp, game, recipient, out.recipient, out.recipientQueues);
      db.notify(txApp, uid, out.senderNotifications);
      db.notify(txApp, toUid, out.recipientNotifications);

      // Historique (déjà crédité : claimed = true).
      const gift = new Record(txApp.findCollectionByNameOrId("resource_gifts"));
      gift.load({
        fromUid: uid,
        fromPseudo: sender.player.pseudo,
        toUid,
        toPseudo: recipient.player.pseudo,
        resources: out.resources,
        timestamp: now,
        claimed: true,
      });
      txApp.save(gift);
      response = { resources: out.resources };
    });

    return e.json(200, response);
  },
  $apis.requireAuth("users"),
);

/**
 * POST /api/cosmic/gift/claim  { giftId }
 * Dons envoyés avec l'ancien système (débités à l'envoi, pas encore crédités).
 */
routerAdd(
  "POST",
  "/api/cosmic/gift/claim",
  (e) => {
    const db = require(`${__hooks}/cosmic_db.js`);
    const game = db.loadGame();
    const uid = e.auth.id;
    const giftId = String(db.body(e).giftId || "");
    let claimed = false;

    $app.runInTransaction((txApp) => {
      const gift = db.findOrNull(txApp, "resource_gifts", giftId);
      if (!gift || gift.getString("toUid") !== uid || gift.getBool("claimed")) return;
      db.applyContent(txApp, game);
      const loaded = db.loadPlayer(txApp, game, uid);
      const out = game.applyLegacyGift(loaded.player, loaded.queues, db.toPlain(gift), Date.now());
      gift.set("claimed", true);
      txApp.save(gift);
      db.savePlayer(txApp, game, loaded, out.player, out.queues);
      db.notify(txApp, uid, out.notifications);
      claimed = true;
    });

    return e.json(200, { claimed });
  },
  $apis.requireAuth("users"),
);

/**
 * POST /api/cosmic/report/seen  { reportId }
 * Le défenseur a vu le rapport. Les anciens rapports (créés avant que le
 * serveur n'applique lui-même les pertes du défenseur) sont appliqués ici.
 */
routerAdd(
  "POST",
  "/api/cosmic/report/seen",
  (e) => {
    const db = require(`${__hooks}/cosmic_db.js`);
    const game = db.loadGame();
    const uid = e.auth.id;
    const reportId = String(db.body(e).reportId || "");
    let response = { report: null };

    $app.runInTransaction((txApp) => {
      const report = db.findOrNull(txApp, "battle_reports", reportId);
      if (!report || report.getString("defenderUid") !== uid || report.getBool("defenderProcessed")) return;
      if (!report.getBool("defenderApplied")) {
        db.applyContent(txApp, game);
        const loaded = db.loadPlayer(txApp, game, uid);
        const out = game.applyLegacyBattleReport(loaded.player, loaded.queues, db.toPlain(report), Date.now());
        db.savePlayer(txApp, game, loaded, out.player, out.queues);
        db.notify(txApp, uid, out.notifications);
        report.set("defenderApplied", true);
      }
      report.set("defenderProcessed", true);
      txApp.save(report);
      response = { report: db.toPlain(report) };
    });

    return e.json(200, response);
  },
  $apis.requireAuth("users"),
);

/**
 * POST /api/cosmic/attack  { targetUid, fleet: { unitId: quantité } }
 *
 * Vérifie les protections (délai entre attaques, bouclier, débutant, écart
 * de force), résout le combat et l'applique aux deux joueurs (pertes,
 * pillage, XP), puis crée le rapport — le tout dans une transaction.
 */
routerAdd(
  "POST",
  "/api/cosmic/attack",
  (e) => {
    const db = require(`${__hooks}/cosmic_db.js`);
    const game = db.loadGame();

    const attackerUid = e.auth.id;
    const body = db.body(e);
    const targetUid = String(body.targetUid || "");
    const fleet = body.fleet && typeof body.fleet === "object" ? body.fleet : {};
    if (!targetUid) throw new BadRequestError("Cible manquante.");
    if (targetUid === attackerUid) throw new BadRequestError("Tu ne peux pas t'attaquer toi-même !");

    let response = null;

    $app.runInTransaction((txApp) => {
      const now = Date.now();
      db.applyContent(txApp, game);

      const attacker = db.loadPlayer(txApp, game, attackerUid);
      if (!db.findOrNull(txApp, "players", targetUid)) throw new NotFoundError("Ce joueur est introuvable.");
      const defender = db.loadPlayer(txApp, game, targetUid, "Ce joueur est introuvable.");

      const lastOnTarget = txApp.findRecordsByFilter(
        "battle_reports",
        "attackerUid = {:a} && defenderUid = {:d}",
        "-timestamp",
        1,
        0,
        { a: attackerUid, d: targetUid },
      );

      let defenderXpLostLast24h = 0;
      txApp
        .findRecordsByFilter(
          "battle_reports",
          "defenderUid = {:d} && timestamp > {:t} && defenderXpDelta < 0",
          "",
          200,
          0,
          { d: targetUid, t: now - game.PVP_RULES.defenseXpLossWindowMs },
        )
        .forEach((r) => {
          defenderXpLostLast24h += -r.getFloat("defenderXpDelta");
        });

      const result = game.performAttack({
        now,
        attackerUid,
        attacker: attacker.player,
        attackerQueues: attacker.queues,
        defenderUid: targetUid,
        defender: defender.player,
        defenderQueues: defender.queues,
        fleet,
        lastAttackOnTargetMs: lastOnTarget.length > 0 ? lastOnTarget[0].getFloat("timestamp") : null,
        defenderXpLostLast24h,
      });
      if (!result.ok) throw new BadRequestError(result.message);

      db.savePlayer(txApp, game, attacker, result.attacker, result.attackerQueues);
      db.savePlayer(txApp, game, defender, result.defender, result.defenderQueues);
      db.notify(txApp, attackerUid, result.notifications);
      db.notify(txApp, targetUid, result.defenderNotifications);

      const report = new Record(txApp.findCollectionByNameOrId("battle_reports"));
      report.load(result.report);
      txApp.save(report);

      response = Object.assign({ id: report.id }, result.report, { combat: result.combat });
    });

    return e.json(200, response);
  },
  $apis.requireAuth("users"),
);

/**
 * GET /api/cosmic/admin/stats — administrateurs du jeu uniquement.
 * Statistiques de game design (activité, économie, contenu, combats des
 * 7 derniers jours), calculées ici : le navigateur ne reçoit que des agrégats.
 */
routerAdd("GET", "/api/cosmic/admin/stats", (e) => {
  const db = require(`${__hooks}/cosmic_db.js`);
  if (!db.isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");

  const game = db.loadGame();
  db.applyContent($app, game);

  const now = Date.now();
  const players = $app.findAllRecords("players").map((r) => {
    const p = db.toPlain(r);
    p.uid = r.id;
    return p;
  });
  const queues = $app.findAllRecords("queues").map((r) => db.toPlain(r));
  const reports = $app
    .findRecordsByFilter("battle_reports", "timestamp >= {:since}", "-timestamp", 5000, 0, { since: now - 7 * 24 * 3600 * 1000 })
    .map((r) => db.toPlain(r));

  return e.json(200, game.computeGameStats(players, queues, reports, now, 7));
});

/* ---------- Journal des actions d'administration ---------- */

// Chaque modification faite par un administrateur (page Administration ou
// admin PocketBase) sur ces collections est consignée dans admin_logs.
onRecordCreateRequest(
  (e) => {
    e.next();
    const db = require(`${__hooks}/cosmic_db.js`);
    db.logAdminAction(e, "create", null, Object.assign({ collectionName: e.record.collection().name }, db.toPlain(e.record)));
  },
  "players",
  "queues",
  "game_config",
  "game_assets",
  "admins",
);

onRecordUpdateRequest(
  (e) => {
    const db = require(`${__hooks}/cosmic_db.js`);
    const before = Object.assign({ collectionName: e.record.collection().name }, db.toPlain(e.record.original()));
    e.next();
    db.logAdminAction(e, "update", before, Object.assign({ collectionName: e.record.collection().name }, db.toPlain(e.record)));
  },
  "players",
  "queues",
  "game_config",
  "game_assets",
  "admins",
);

onRecordDeleteRequest(
  (e) => {
    const db = require(`${__hooks}/cosmic_db.js`);
    const before = Object.assign({ collectionName: e.record.collection().name }, db.toPlain(e.record));
    e.next();
    db.logAdminAction(e, "delete", before, null);
  },
  "players",
  "queues",
  "game_config",
  "game_assets",
  "admins",
);
