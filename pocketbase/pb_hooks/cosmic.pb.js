/// <reference path="../pb_data/types.d.ts" />

// Cosmic Empires — actions arbitrées par le serveur.
//
// À déployer dans le dossier pb_hooks/ du serveur PocketBase (voir
// README, « Hooks serveur »), avec cosmic_game.js (logique de jeu
// compilée depuis src/game par `npm run build:hooks`).

/**
 * POST /api/cosmic/attack  { targetUid, fleet: { unitId: quantité } }
 *
 * Vérifie les protections (délai entre attaques, bouclier, débutant, écart
 * de force), résout le combat, applique le résultat à l'attaquant et crée
 * le rapport — le tout dans une transaction. Le défenseur applique ses
 * pertes et son XP à la réception du rapport (defenderProcessed = false).
 */
routerAdd(
  "POST",
  "/api/cosmic/attack",
  (e) => {
    const game = require(`${__hooks}/cosmic_game.js`);
    const toPlain = (record) => JSON.parse(JSON.stringify(record));

    const attackerUid = e.auth.id;
    const body = e.requestInfo().body || {};
    const targetUid = String(body.targetUid || "");
    const fleet = body.fleet && typeof body.fleet === "object" ? body.fleet : {};
    if (!targetUid) throw new BadRequestError("Cible manquante.");

    let response = null;

    $app.runInTransaction((txApp) => {
      const now = Date.now();

      let attackerRec, queuesRec, defenderRec;
      try {
        attackerRec = txApp.findRecordById("players", attackerUid);
        queuesRec = txApp.findRecordById("queues", attackerUid);
      } catch (_) {
        throw new BadRequestError("Profil joueur introuvable.");
      }
      try {
        defenderRec = txApp.findRecordById("players", targetUid);
      } catch (_) {
        throw new NotFoundError("Ce joueur est introuvable.");
      }

      const lastOnTarget = txApp.findRecordsByFilter(
        "battle_reports",
        "attackerUid = {:a} && defenderUid = {:d}",
        "-timestamp",
        1,
        0,
        { a: attackerUid, d: targetUid },
      );

      let defenderXpLostLast24h = 0;
      const recentDefenses = txApp.findRecordsByFilter(
        "battle_reports",
        "defenderUid = {:d} && timestamp > {:t} && defenderXpDelta < 0",
        "",
        200,
        0,
        { d: targetUid, t: now - game.PVP_RULES.defenseXpLossWindowMs },
      );
      recentDefenses.forEach((r) => {
        defenderXpLostLast24h += -r.getFloat("defenderXpDelta");
      });

      const attacker = toPlain(attackerRec);
      attacker.uid = attackerUid;
      const defender = toPlain(defenderRec);
      defender.uid = targetUid;

      const result = game.performAttack({
        now,
        attackerUid,
        attacker,
        attackerQueues: toPlain(queuesRec),
        defenderUid: targetUid,
        defender,
        fleet,
        lastAttackOnTargetMs: lastOnTarget.length > 0 ? lastOnTarget[0].getFloat("timestamp") : null,
        defenderXpLostLast24h,
      });
      if (!result.ok) throw new BadRequestError(result.message);

      game.GAME_FIELDS.forEach((field) => attackerRec.set(field, result.attacker[field]));
      attackerRec.set("lastAttackAtMs", now);
      txApp.save(attackerRec);

      game.QUEUE_FIELDS.forEach((field) => queuesRec.set(field, result.attackerQueues[field]));
      txApp.save(queuesRec);

      // Seul champ du défenseur écrit ici (bouclier). Ses pertes et son XP
      // sont appliquées par son propre client à la réception du rapport,
      // pour ne jamais entrer en conflit avec ses propres écritures.
      if (result.combat.outcome === "attacker_win") {
        defenderRec.set("lastDefeatAtMs", now);
        txApp.save(defenderRec);
      }

      const notifications = txApp.findCollectionByNameOrId("notifications");
      result.notifications.forEach((n) => {
        const rec = new Record(notifications);
        rec.load(Object.assign({}, n, { player_id: attackerUid }));
        txApp.save(rec);
      });

      const report = new Record(txApp.findCollectionByNameOrId("battle_reports"));
      report.load(result.report);
      txApp.save(report);

      response = Object.assign({ id: report.id }, result.report, { combat: result.combat });
    });

    return e.json(200, response);
  },
  $apis.requireAuth("users"),
);
