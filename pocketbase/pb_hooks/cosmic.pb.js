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

    // Flottes arrivées ou rentrées qui concernent ce joueur (la tâche
    // minute s'occupe des autres).
    db.processDueFleets(game, Date.now(), uid);

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
 * POST /api/cosmic/fleet/send  { targetUid, fleet: { unitId: quantité } }
 *   + mission : "attack" (défaut), "spy", "recycle" (targetUid = champ de débris) ou "patrol" (minutes)
 * (et POST /api/cosmic/attack, ancien nom)
 *
 * Décollage d'une flotte d'attaque : protections vérifiées maintenant,
 * vaisseaux retirés de la base, combat résolu à l'arrivée (tâche minute).
 */
routerAdd("POST", "/api/cosmic/fleet/send", (e) => require(`${__hooks}/cosmic_db.js`).launchFleetRequest(e), $apis.requireAuth("users"));
routerAdd("POST", "/api/cosmic/attack", (e) => require(`${__hooks}/cosmic_db.js`).launchFleetRequest(e), $apis.requireAuth("users"));

/**
 * POST /api/cosmic/fleet/recall  { fleetId }
 * Demi-tour avant l'impact.
 */
routerAdd(
  "POST",
  "/api/cosmic/fleet/recall",
  (e) => {
    const db = require(`${__hooks}/cosmic_db.js`);
    const game = db.loadGame();
    const fleetId = String(db.body(e).fleetId || "");
    let response = null;
    $app.runInTransaction((txApp) => {
      const rec = db.findOrNull(txApp, "fleets", fleetId);
      if (!rec) throw new NotFoundError("Flotte introuvable.");
      let next;
      try {
        next = game.recallFleet(db.toPlain(rec), e.auth.id, Date.now());
      } catch (err) {
        throw db.asHttpError(game, err);
      }
      rec.set("status", next.status);
      rec.set("recalled", true);
      rec.set("returnAtMs", next.returnAtMs);
      txApp.save(rec);
      response = db.toPlain(rec);
    });
    return e.json(200, response);
  },
  $apis.requireAuth("users"),
);

// Arrivées et retours de flottes : vérifiés chaque minute.
cronAdd("cosmic_fleets", "* * * * *", () => {
  const db = require(`${__hooks}/cosmic_db.js`);
  db.processDueFleets(db.loadGame(), Date.now(), null);
  db.purgeDebris(Date.now());
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

/* ---------- Fiche publique des joueurs ---------- */

// Chaque enregistrement d'un joueur met à jour sa fiche publique (classement,
// carte, alliances) : les autres joueurs ne lisent plus que celle-ci.
onRecordAfterCreateSuccess((e) => {
  require(`${__hooks}/cosmic_db.js`).syncProfile(e.app, e.record);
  e.next();
}, "players");

onRecordAfterUpdateSuccess((e) => {
  require(`${__hooks}/cosmic_db.js`).syncProfile(e.app, e.record);
  e.next();
}, "players");

onRecordAfterDeleteSuccess((e) => {
  require(`${__hooks}/cosmic_db.js`).deleteProfile(e.app, e.record.id);
  e.next();
}, "players");
