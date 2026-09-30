// Cosmic Empires — lecture/écriture des joueurs pour les hooks.
//
// Module CommonJS (chargé par require() depuis cosmic.pb.js) : PocketBase
// n'exécute pas ce fichier au démarrage, seuls les *.pb.js le sont.

function toPlain(record) {
  return JSON.parse(JSON.stringify(record));
}

/** Corps JSON de la requête (objet vide si absent). */
function body(e) {
  const data = e.requestInfo().body;
  return data && typeof data === "object" ? data : {};
}

function loadGame() {
  return require(`${__hooks}/cosmic_game.js`);
}

/** Applique le contenu personnalisé dans l'administration (game_config) :
 *  mêmes bâtiments, unités, technologies et règles que côté client. */
function applyContent(txApp, game) {
  const overrides = {};
  txApp.findAllRecords("game_config").forEach((r) => {
    const key = r.getString("key");
    if (game.CONTENT_SECTIONS.indexOf(key) >= 0) overrides[key] = toPlain(r).data;
  });
  game.applyGameContent(overrides);
}

function findOrNull(txApp, collection, id) {
  try {
    return txApp.findRecordById(collection, id);
  } catch (_) {
    return null;
  }
}

/** Joueur + files d'attente. La fiche des files est recréée si elle manque. */
function loadPlayer(txApp, game, uid, missingMessage) {
  const rec = findOrNull(txApp, "players", uid);
  if (!rec) throw new BadRequestError(missingMessage || "Profil joueur introuvable.");
  let queuesRec = findOrNull(txApp, "queues", uid);
  if (!queuesRec) {
    queuesRec = new Record(txApp.findCollectionByNameOrId("queues"));
    queuesRec.load(Object.assign({ id: uid }, game.defaultQueues()));
  }
  const player = toPlain(rec);
  player.uid = uid;
  const rawQueues = toPlain(queuesRec);
  const defaults = game.defaultQueues();
  const queues = {};
  game.QUEUE_FIELDS.forEach((f) => {
    queues[f] = rawQueues[f] || defaults[f];
  });
  return { rec, queuesRec, player, queues };
}

function savePlayer(txApp, game, loaded, player, queues) {
  game.GAME_FIELDS.forEach((field) => loaded.rec.set(field, player[field] === undefined ? null : player[field]));
  ["lastAttackAtMs", "lastDefeatAtMs"].forEach((field) => {
    if (player[field] !== undefined) loaded.rec.set(field, player[field]);
  });
  txApp.save(loaded.rec);
  game.QUEUE_FIELDS.forEach((field) => loaded.queuesRec.set(field, queues[field]));
  txApp.save(loaded.queuesRec);
}

function notify(txApp, uid, notifications) {
  if (!notifications || notifications.length === 0) return;
  const collection = txApp.findCollectionByNameOrId("notifications");
  notifications.forEach((n) => {
    const rec = new Record(collection);
    rec.load(Object.assign({}, n, { player_id: uid }));
    txApp.save(rec);
  });
}

/** Erreur de jeu (règle non respectée) → 400 avec le message pour le joueur. */
function asHttpError(game, err) {
  if (err instanceof game.GameActionError) return new BadRequestError(err.message);
  return err;
}

/** Compte administrateur (superuser PocketBase ou joueur listé dans `admins`). */
function isGameAdmin(e) {
  if (e.hasSuperuserAuth()) return true;
  if (!e.auth) return false;
  return $app.findRecordsByFilter("admins", "id = {:id}", "", 1, 0, { id: e.auth.id }).length > 0;
}

const LOG_LABEL_FIELD = { players: "pseudo", game_config: "key", game_assets: "name" };
const MAX_LOGGED_VALUE = 20000;

function shortValue(value) {
  const text = JSON.stringify(value === undefined ? null : value);
  if (text.length <= MAX_LOGGED_VALUE) return value === undefined ? null : value;
  return `(${text.length} caractères, non détaillé)`;
}

/** Journal des actions d'administration (collection admin_logs). */
function logAdminAction(e, action, before, after) {
  try {
    if (!isGameAdmin(e)) return;
    const record = after || before;
    const collection = record.collectionName || (e.collection && e.collection.name) || "";
    const labelField = LOG_LABEL_FIELD[collection];
    const changes = {};
    if (action === "update") {
      const fields = Object.keys(e.requestInfo().body || {});
      fields.forEach((f) => {
        const a = before[f];
        const b = after[f];
        if (JSON.stringify(a) !== JSON.stringify(b)) changes[f] = { avant: shortValue(a), après: shortValue(b) };
      });
      if (Object.keys(changes).length === 0) return;
    } else {
      changes.enregistrement = shortValue(action === "delete" ? before : after);
    }
    const log = new Record($app.findCollectionByNameOrId("admin_logs"));
    log.load({
      actorId: e.auth ? e.auth.id : "superuser",
      actorName: e.auth ? e.auth.getString("name") || e.auth.getString("username") || e.auth.getString("email") : "superuser",
      action,
      targetCollection: collection,
      recordId: record.id || "",
      recordLabel: labelField ? String(record[labelField] || "") : "",
      changes,
      createdAtMs: Date.now(),
    });
    $app.save(log);
  } catch (err) {
    console.log(`[cosmic] journal admin impossible : ${err}`);
  }
}

/* ---------- Fiche publique (collection profiles) ---------- */

const PROFILE_FIELDS = ["pseudo", "xp", "seasonId", "seasonXp", "createdAtMs", "lastDefeatAtMs", "lastAttackAtMs", "allianceId"];

/** Recopie les champs publics d'un joueur dans sa fiche publique : la fiche
 *  complète (ressources, flotte…) n'est plus lisible par les autres. */
function syncProfile(app, player) {
  let profile;
  try {
    profile = app.findRecordById("profiles", player.id);
  } catch (_) {
    profile = new Record(app.findCollectionByNameOrId("profiles"));
    profile.set("id", player.id);
  }
  let changed = profile.isNew();
  PROFILE_FIELDS.forEach((f) => {
    const value = player.get(f);
    if (JSON.stringify(profile.get(f)) !== JSON.stringify(value)) {
      profile.set(f, value);
      changed = true;
    }
  });
  if (changed) app.save(profile);
}

function deleteProfile(app, playerId) {
  try {
    app.delete(app.findRecordById("profiles", playerId));
  } catch (_) {
    /* déjà absente */
  }
}

/* ---------- Flottes en vol ---------- */

/** Dernière attaque (combat ou départ de flotte) de a vers d (ms), ou null. */
function lastAttackOnTarget(txApp, a, d) {
  let last = null;
  const reports = txApp.findRecordsByFilter("battle_reports", "attackerUid = {:a} && defenderUid = {:d}", "-timestamp", 1, 0, { a, d });
  if (reports.length > 0) last = reports[0].getFloat("timestamp");
  const fleets = txApp.findRecordsByFilter("fleets", "ownerUid = {:a} && targetUid = {:d} && mission = 'attack'", "-departAtMs", 1, 0, { a, d });
  if (fleets.length > 0) last = Math.max(last || 0, fleets[0].getFloat("departAtMs"));
  return last;
}

/** XP déjà perdue en défense sur 24 h (plafond de perte). */
function defenderXpLostLast24h(txApp, game, uid, now) {
  let lost = 0;
  txApp
    .findRecordsByFilter("battle_reports", "defenderUid = {:d} && timestamp > {:t} && defenderXpDelta < 0", "", 200, 0, {
      d: uid,
      t: now - game.PVP_RULES.defenseXpLossWindowMs,
    })
    .forEach((r) => {
      lost += -r.getFloat("defenderXpDelta");
    });
  return lost;
}

function fleetFromRecord(rec) {
  const f = toPlain(rec);
  f.units = f.units || {};
  f.loot = f.loot || null;
  f.returnAtMs = f.returnAtMs || null;
  return f;
}

/* ---------- Champs de débris ---------- */

function loadDebris(txApp, id) {
  const rec = findOrNull(txApp, "debris_fields", id);
  return rec ? { rec, field: toPlain(rec) } : { rec: null, field: null };
}

function saveDebris(txApp, loaded, field) {
  let rec = loaded.rec;
  if (!rec) {
    rec = new Record(txApp.findCollectionByNameOrId("debris_fields"));
    rec.set("id", field.id);
  }
  ["locationPseudo", "scrap", "energy", "expiresAtMs", "updatedAtMs"].forEach((f) => rec.set(f, field[f]));
  txApp.save(rec);
}

/** Supprime les champs de débris expirés ou vides. */
function purgeDebris(now) {
  $app.findRecordsByFilter("debris_fields", "expiresAtMs <= {:now} || (scrap <= 0 && energy <= 0)", "", 200, 0, { now }).forEach((r) => {
    try {
      $app.delete(r);
    } catch (err) {
      console.log(`[cosmic] champ de débris ${r.id} non supprimé : ${err}`);
    }
  });
}

/** Arrivée d'une flotte : selon la mission. */
function resolveFleetArrival(txApp, game, rec, now) {
  const mission = rec.getString("mission") || "attack";
  if (mission === "spy") return resolveSpyArrival(txApp, game, rec, now);
  if (mission === "recycle") return resolveRecycleArrival(txApp, game, rec, now);
  if (mission === "patrol") {
    const turned = game.patrolTurnaround(fleetFromRecord(rec));
    rec.set("status", turned.status);
    rec.set("returnAtMs", turned.returnAtMs);
    txApp.save(rec);
    return;
  }
  return resolveAttackArrival(txApp, game, rec, now);
}

/** Sondes : rapport à la mesure du score, sondes abattues si repérées. */
function resolveSpyArrival(txApp, game, rec, now) {
  const fleet = fleetFromRecord(rec);
  const tripMs = Math.max(0, fleet.arriveAtMs - fleet.departAtMs);
  const spy = findOrNull(txApp, "players", fleet.ownerUid) ? loadPlayer(txApp, game, fleet.ownerUid) : null;
  const target = findOrNull(txApp, "players", fleet.targetUid) ? loadPlayer(txApp, game, fleet.targetUid) : null;
  if (!spy || !target) {
    rec.set("status", spy ? "returning" : "done");
    rec.set("returnAtMs", spy ? now + tripMs : null);
    rec.set("outcome", "none");
    txApp.save(rec);
    return;
  }
  const targetFleets = txApp
    .findRecordsByFilter("fleets", "ownerUid = {:u} && status != 'done'", "arriveAtMs", 50, 0, { u: fleet.targetUid })
    .map(fleetFromRecord);
  const probes = Object.keys(fleet.units).reduce((sum, k) => sum + (fleet.units[k] || 0), 0);
  const out = game.resolveSpyArrival({
    now,
    spy: spy.player,
    spyQueues: spy.queues,
    target: target.player,
    targetQueues: target.queues,
    targetFleets,
    probes,
  });
  const report = new Record(txApp.findCollectionByNameOrId("spy_reports"));
  report.load(out.report);
  txApp.save(report);
  notify(txApp, fleet.ownerUid, out.spyNotifications);
  notify(txApp, fleet.targetUid, out.targetNotifications);
  rec.set("reportId", report.id);
  rec.set("outcome", out.detected ? "detected" : "success");
  if (out.detected) {
    rec.set("units", {});
    rec.set("status", "done");
    rec.set("returnAtMs", null);
  } else {
    rec.set("status", "returning");
    rec.set("returnAtMs", now + tripMs);
  }
  txApp.save(rec);
}

/** Recycleurs : ramassent ce qui reste du champ, premier arrivé servi. */
function resolveRecycleArrival(txApp, game, rec, now) {
  const fleet = fleetFromRecord(rec);
  const tripMs = Math.max(0, fleet.arriveAtMs - fleet.departAtMs);
  const owner = findOrNull(txApp, "players", fleet.ownerUid);
  const debris = loadDebris(txApp, fleet.targetUid);
  let taken = { scrap: 0, energy: 0 };
  if (owner && debris.field && debris.field.expiresAtMs > now) {
    const units = toPlain(owner).units || {};
    const out = game.collectDebris(debris.field, game.recyclerCapacity(units, fleet.units));
    taken = out.taken;
    saveDebris(txApp, debris, Object.assign({}, debris.field, out.remaining, { updatedAtMs: now }));
  }
  rec.set("loot", taken);
  rec.set("outcome", game.debrisTotal(taken) > 0 ? "collected" : "empty");
  rec.set("status", owner ? "returning" : "done");
  rec.set("returnAtMs", owner ? now + tripMs : null);
  txApp.save(rec);
}

/** Combat à l'arrivée d'une flotte, puis demi-tour avec survivants et butin. */
function resolveAttackArrival(txApp, game, rec, now) {
  const fleet = fleetFromRecord(rec);
  const tripMs = Math.max(0, fleet.arriveAtMs - fleet.departAtMs);
  const attacker = findOrNull(txApp, "players", fleet.ownerUid) ? loadPlayer(txApp, game, fleet.ownerUid) : null;
  const defender = findOrNull(txApp, "players", fleet.targetUid) ? loadPlayer(txApp, game, fleet.targetUid) : null;
  if (!attacker) {
    rec.set("status", "done");
    txApp.save(rec);
    return;
  }
  const result = defender
    ? game.performAttack({
        now,
        attackerUid: fleet.ownerUid,
        attacker: attacker.player,
        attackerQueues: attacker.queues,
        defenderUid: fleet.targetUid,
        defender: defender.player,
        defenderQueues: defender.queues,
        fleet: fleet.units,
        lastAttackOnTargetMs: null,
        defenderXpLostLast24h: defenderXpLostLast24h(txApp, game, fleet.targetUid, now),
        inFlight: true,
      })
    : { ok: false };
  if (!result.ok) {
    // Cible disparue : la flotte rentre sans combattre.
    rec.set("status", "returning");
    rec.set("returnAtMs", now + tripMs);
    rec.set("outcome", "none");
    txApp.save(rec);
    return;
  }
  savePlayer(txApp, game, attacker, result.attacker, result.attackerQueues);
  savePlayer(txApp, game, defender, result.defender, result.defenderQueues);
  notify(txApp, fleet.ownerUid, result.notifications);
  notify(txApp, fleet.targetUid, result.defenderNotifications);

  const report = new Record(txApp.findCollectionByNameOrId("battle_reports"));
  report.load(result.report);
  txApp.save(report);

  if (game.debrisTotal(result.debris) > 0) {
    const debris = loadDebris(txApp, fleet.targetUid);
    const field = game.mergeDebris(debris.field, result.debris, { uid: fleet.targetUid, pseudo: fleet.targetPseudo }, now);
    saveDebris(txApp, debris, field);
  }

  const survivors = result.survivors || {};
  const anyLeft = Object.keys(survivors).some((k) => survivors[k] > 0);
  rec.set("units", survivors);
  rec.set("loot", result.loot || {});
  rec.set("reportId", report.id);
  rec.set("outcome", result.combat.outcome);
  rec.set("status", anyLeft ? "returning" : "done");
  rec.set("returnAtMs", anyLeft ? now + tripMs : null);
  txApp.save(rec);
}

function resolveFleetReturn(txApp, game, rec, now) {
  const fleet = fleetFromRecord(rec);
  if (findOrNull(txApp, "players", fleet.ownerUid)) {
    const owner = loadPlayer(txApp, game, fleet.ownerUid);
    const out = game.performFleetReturn(owner.player, owner.queues, fleet, now);
    savePlayer(txApp, game, owner, out.owner, out.queues);
    notify(txApp, fleet.ownerUid, out.notifications);
  }
  rec.set("status", "done");
  txApp.save(rec);
}

/** Traite les flottes arrivées ou rentrées (une transaction par flotte).
 *  `uid` limite aux flottes d'un joueur (attaquant ou cible). */
function processDueFleets(game, now, uid) {
  const scope = uid ? " && (ownerUid = {:u} || targetUid = {:u})" : "";
  const due = $app.findRecordsByFilter(
    "fleets",
    `((status = "outbound" && arriveAtMs <= {:now}) || (status = "returning" && returnAtMs <= {:now}))${scope}`,
    "arriveAtMs",
    50,
    0,
    { now, u: uid || "" },
  );
  due.forEach((candidate) => {
    try {
      $app.runInTransaction((txApp) => {
        const rec = txApp.findRecordById("fleets", candidate.id);
        applyContent(txApp, game);
        const status = rec.getString("status");
        if (status === "outbound" && rec.getFloat("arriveAtMs") <= now) resolveFleetArrival(txApp, game, rec, now);
        else if (status === "returning" && rec.getFloat("returnAtMs") <= now) resolveFleetReturn(txApp, game, rec, now);
      });
    } catch (err) {
      console.log(`[cosmic] flotte ${candidate.id} non traitée : ${err}`);
    }
  });
  return due.length;
}

/** Décollage d'une flotte (routes /fleet/send et /attack). */
function launchFleetRequest(e) {
  const db = module.exports;
  const game = loadGame();
  const attackerUid = e.auth.id;
  const body = db.body(e);
  const mission = String(body.mission || "attack");
  const fleet = body.fleet && typeof body.fleet === "object" ? body.fleet : {};
  const targetUid = mission === "patrol" ? attackerUid : String(body.targetUid || "");
  if (!targetUid) throw new BadRequestError("Cible manquante.");
  if (["attack", "spy", "recycle", "patrol"].indexOf(mission) < 0) throw new BadRequestError("Mission inconnue.");
  let response = null;

  $app.runInTransaction((txApp) => {
    const now = Date.now();
    db.applyContent(txApp, game);
    const attacker = db.loadPlayer(txApp, game, attackerUid);
    let target = null;
    let debris = null;
    if (mission === "attack" || mission === "spy") {
      if (!db.findOrNull(txApp, "players", targetUid)) throw new NotFoundError("Ce joueur est introuvable.");
      target = db.loadPlayer(txApp, game, targetUid, "Ce joueur est introuvable.").player;
    } else if (mission === "recycle") {
      debris = loadDebris(txApp, targetUid).field;
    }
    let out;
    try {
      out = game.performLaunch({
        mission,
        now,
        owner: attacker.player,
        ownerQueues: attacker.queues,
        target,
        debris,
        fleet,
        lastAttackOnTargetMs: mission === "attack" ? db.lastAttackOnTarget(txApp, attackerUid, targetUid) : null,
        patrolMinutes: Number(body.minutes) || 0,
      });
    } catch (err) {
      throw db.asHttpError(game, err);
    }
    db.savePlayer(txApp, game, attacker, out.attacker, out.attackerQueues);
    db.notify(txApp, attackerUid, out.attackerNotifications);
    if (out.defenderNotifications.length > 0) db.notify(txApp, targetUid, out.defenderNotifications);
    const rec = new Record(txApp.findCollectionByNameOrId("fleets"));
    rec.load(out.fleet);
    txApp.save(rec);
    response = Object.assign({ id: rec.id }, out.fleet);
  });

  return e.json(200, response);
}


module.exports = { purgeDebris, syncProfile, deleteProfile, launchFleetRequest, lastAttackOnTarget, processDueFleets, isGameAdmin, logAdminAction, body, toPlain, loadGame, applyContent, findOrNull, loadPlayer, savePlayer, notify, asHttpError };
