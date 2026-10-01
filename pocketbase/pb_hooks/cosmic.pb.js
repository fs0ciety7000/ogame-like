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
  db.processAllianceResearch(db.loadGame(), Date.now());
});

/**
 * POST /api/cosmic/alliance  { type, ... } — actions d'alliance (v1.9) :
 * create {name, tag}, join {allianceId}, leave, kick/promote/demote {targetUid},
 * deposit {resources}, distribute {targetUid, resources}, research {researchId}.
 */
routerAdd("POST", "/api/cosmic/alliance", (e) => require(`${__hooks}/cosmic_db.js`).allianceRequest(e), $apis.requireAuth("users"));

/** POST /api/cosmic/alliance/intel — rapports récents des membres. */
routerAdd("POST", "/api/cosmic/alliance/intel", (e) => require(`${__hooks}/cosmic_db.js`).allianceIntel(e), $apis.requireAuth("users"));

// Factions hostiles : inscriptions et ultimatums expirés, toutes les 10 min.
cronAdd("cosmic_pirates", "*/10 * * * *", () => {
  const db = require(`${__hooks}/cosmic_db.js`);
  // En maintenance, les factions attendent : les joueurs ne peuvent pas répondre.
  if (db.readMaintenance($app).enabled) return;
  db.processPirates(db.loadGame(), Date.now(), null);
});

/** POST /api/cosmic/pirates { answer: "pay" | "refuse" } — réponse à l'ultimatum en cours. */
routerAdd("POST", "/api/cosmic/pirates", (e) => require(`${__hooks}/cosmic_db.js`).piratesRequest(e), $apis.requireAuth("users"));

/**
 * POST /api/cosmic/admin/pirates  { uid, factionId?, force? } — administrateurs :
 * passe les factions pour un joueur ; force = ultimatum immédiat de la faction
 * `factionId` (Varan par défaut), si aucune autre menace n'est en cours.
 */
routerAdd("POST", "/api/cosmic/admin/pirates", (e) => {
  const db = require(`${__hooks}/cosmic_db.js`);
  if (!db.isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const req = db.body(e);
  const uid = String(req.uid || "");
  const rec = uid ? db.findOrNull($app, "players", uid) : null;
  if (!rec) throw new NotFoundError("Joueur introuvable.");
  const factionId = req.force ? String(req.factionId || "varan") : null;
  return e.json(200, { changed: db.processPirates(db.loadGame(), Date.now(), uid, factionId) });
});

/** GET /api/cosmic/achievements — part des joueurs ayant obtenu chaque succès. */
routerAdd("GET", "/api/cosmic/achievements", (e) => {
  const counts = {};
  const players = $app.findAllRecords("players");
  players.forEach((rec) => {
    let list = [];
    try {
      list = JSON.parse(rec.getString("unlockedAchievements") || "[]") || [];
    } catch (_) {
      list = [];
    }
    list.forEach((id) => (counts[id] = (counts[id] || 0) + 1));
  });
  return e.json(200, { players: players.length, counts });
}, $apis.requireAuth("users"));

// Clôture de la saison précédente (sans effet si elle est déjà close).
cronAdd("cosmic_seasons", "7 * * * *", () => {
  const db = require(`${__hooks}/cosmic_db.js`);
  try {
    const out = db.closeSeason(db.loadGame(), Date.now(), null);
    if (out.closed) console.log(`[cosmic] saison ${out.seasonId} close : ${out.ranked} classés, ${out.rewarded} récompensés`);
  } catch (err) {
    console.log(`[cosmic] clôture de saison impossible : ${err}`);
  }
});

/**
 * POST /api/cosmic/admin/close-season  { seasonId? } — administrateurs.
 * Clôture immédiate (par défaut : la saison précédente).
 */
routerAdd(
  "POST",
  "/api/cosmic/admin/close-season",
  (e) => {
    const db = require(`${__hooks}/cosmic_db.js`);
    if (!db.isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
    const seasonId = String(db.body(e).seasonId || "");
    if (seasonId && !/^\d{4}-\d{2}$/.test(seasonId)) throw new BadRequestError("Saison invalide (AAAA-MM).");
    const game = db.loadGame();
    if (seasonId && seasonId > game.previousSeasonId(Date.now())) throw new BadRequestError("Cette saison n'est pas encore terminée.");
    return e.json(200, db.closeSeason(game, Date.now(), seasonId || null));
  },
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
    .findRecordsByFilter("battle_reports", "timestamp >= {:since}", "-timestamp", 10000, 0, { since: now - 30 * 24 * 3600 * 1000 })
    .map((r) => db.toPlain(r));

  return e.json(200, game.computeGameStats(players, queues, reports, now, 7));
});

/**
 * POST /api/cosmic/admin/reset — hard reset de la progression (un joueur ou
 * tous), précédé d'une sauvegarde complète. Administrateurs uniquement.
 */
routerAdd("POST", "/api/cosmic/admin/reset", (e) => require(`${__hooks}/cosmic_db.js`).adminReset(e), $apis.requireAuth("users", "_superusers"));

/* ---------- Mode maintenance (v2.5) ---------- */

// Pendant la maintenance, seules les requêtes des administrateurs modifient
// le jeu ; les joueurs peuvent encore se connecter et lire.
routerUse((e) => {
  require(`${__hooks}/cosmic_db.js`).maintenanceGuard(e);
  return e.next();
});

// Réouverture automatique à l'heure prévue, vérifiée chaque minute.
cronAdd("cosmic_maintenance", "* * * * *", () => {
  try {
    if (require(`${__hooks}/cosmic_db.js`).autoEndMaintenance(Date.now())) console.log("[cosmic] maintenance terminée automatiquement");
  } catch (err) {
    console.log(`[cosmic] fin automatique de maintenance : ${err}`);
  }
});

/** Guerres d'alliance (v3.2) : déclaration et reddition ; début et fin planifiés. */
routerAdd("POST", "/api/cosmic/war", (e) => require(`${__hooks}/cosmic_db.js`).warRequest(e), $apis.requireAuth("users"));
cronAdd("cosmic_wars", "*/5 * * * *", () => {
  try {
    require(`${__hooks}/cosmic_db.js`).warTick(Date.now());
  } catch (err) {
    console.log(`[cosmic] guerres : ${err}`);
  }
});

/** Expéditions (v3.1) : décision face à une faction. */
routerAdd("POST", "/api/cosmic/expedition/choose", (e) => require(`${__hooks}/cosmic_db.js`).expeditionChoose(e), $apis.requireAuth("users"));

/** Léviathan (v3.1) : apparition, échéance et récompenses ; lancement manuel par l'équipe. */
routerAdd("POST", "/api/cosmic/admin/leviathan", (e) => require(`${__hooks}/cosmic_db.js`).adminLeviathan(e), $apis.requireAuth("users", "_superusers"));
cronAdd("cosmic_leviathan", "*/5 * * * *", () => {
  try {
    require(`${__hooks}/cosmic_db.js`).leviathanTick(Date.now());
  } catch (err) {
    console.log(`[cosmic] Léviathan : ${err}`);
  }
});

/** Marché entre joueurs (v3.0) : publier, accepter, annuler une offre. */
routerAdd("POST", "/api/cosmic/market/create", (e) => require(`${__hooks}/cosmic_db.js`).marketCreate(e), $apis.requireAuth("users"));
routerAdd("POST", "/api/cosmic/market/accept", (e) => require(`${__hooks}/cosmic_db.js`).marketAccept(e), $apis.requireAuth("users"));
routerAdd("POST", "/api/cosmic/market/cancel", (e) => require(`${__hooks}/cosmic_db.js`).marketCancel(e), $apis.requireAuth("users"));

// Offres expirées rendues à leur vendeur.
cronAdd("cosmic_market", "*/5 * * * *", () => {
  try {
    const n = require(`${__hooks}/cosmic_db.js`).expireMarketOffers(Date.now());
    if (n > 0) console.log(`[cosmic] ${n} offre(s) du marché expirée(s)`);
  } catch (err) {
    console.log(`[cosmic] expiration du marché : ${err}`);
  }
});

// Sauvegardes : PocketBase en crée une chaque nuit (setup.mjs) ; on vérifie
// chaque matin qu'elle existe bien, sinon l'équipe est prévenue.
cronAdd("cosmic_backup_check", "20 5 * * *", () => {
  try {
    if (require(`${__hooks}/cosmic_db.js`).checkBackups(Date.now())) console.log("[cosmic] alerte : sauvegarde manquante");
  } catch (err) {
    console.log(`[cosmic] vérification des sauvegardes : ${err}`);
  }
});

/** GET /api/cosmic/admin/backups — état des sauvegardes (administrateurs). */
routerAdd("GET", "/api/cosmic/admin/backups", (e) => require(`${__hooks}/cosmic_db.js`).adminBackupStatus(e), $apis.requireAuth("users", "_superusers"));

/** POST /api/cosmic/admin/maintenance { enabled, message?, version?, endsAtMs? } — administrateurs. */
routerAdd("POST", "/api/cosmic/admin/maintenance", (e) => require(`${__hooks}/cosmic_db.js`).adminMaintenance(e), $apis.requireAuth("users", "_superusers"));

/** GET /api/cosmic/admin/admins · POST { action: "add" | "remove", uid, note? } — administrateurs. */
routerAdd("GET", "/api/cosmic/admin/admins", (e) => require(`${__hooks}/cosmic_db.js`).adminList(e), $apis.requireAuth("users", "_superusers"));
routerAdd("POST", "/api/cosmic/admin/admins", (e) => require(`${__hooks}/cosmic_db.js`).adminManage(e), $apis.requireAuth("users", "_superusers"));

/* ---------- Signalements de problèmes (v2.7) ---------- */

// Création par un joueur (collection reports) : champs validés et complétés.
onRecordCreateRequest((e) => require(`${__hooks}/cosmic_db.js`).reportCreateRequest(e), "reports");

/** POST /api/cosmic/reports/comment { id, text } · /seen { id } — joueur. */
routerAdd("POST", "/api/cosmic/reports/error", (e) => require(`${__hooks}/cosmic_db.js`).reportClientError(e), $apis.requireAuth("users"));
routerAdd("POST", "/api/cosmic/reports/comment", (e) => require(`${__hooks}/cosmic_db.js`).reportComment(e), $apis.requireAuth("users"));
routerAdd("POST", "/api/cosmic/reports/seen", (e) => require(`${__hooks}/cosmic_db.js`).reportSeen(e), $apis.requireAuth("users"));
/** Administration : mise à jour, options, issue GitHub. */
routerAdd("POST", "/api/cosmic/admin/reports", (e) => require(`${__hooks}/cosmic_db.js`).adminReportUpdate(e), $apis.requireAuth("users", "_superusers"));
routerAdd("GET", "/api/cosmic/admin/reports/config", (e) => require(`${__hooks}/cosmic_db.js`).adminReportConfig(e), $apis.requireAuth("users", "_superusers"));
routerAdd("POST", "/api/cosmic/admin/reports/github", (e) => require(`${__hooks}/cosmic_db.js`).adminReportGithub(e), $apis.requireAuth("users", "_superusers"));

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
