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

const PROFILE_FIELDS = ["pseudo", "xp", "seasonId", "seasonXp", "createdAtMs", "lastDefeatAtMs", "lastAttackAtMs", "allianceId", "activeTitle"];

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
  if (mission === "pirate") return resolvePirateArrival(txApp, game, rec, now);
  if (mission === "lair") return resolveLairArrival(txApp, game, rec, now);
  if (mission === "garrison") {
    const stationed = game.stationGarrison(fleetFromRecord(rec));
    rec.set("status", stationed.status);
    rec.set("stationedUntilMs", stationed.stationedUntilMs);
    txApp.save(rec);
    return;
  }
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
    targetGarrisons: stationedGarrisons(txApp, fleet.targetUid).map(fleetFromRecord),
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

/** Garnisons alliées stationnées chez un joueur. */
function stationedGarrisons(txApp, hostUid) {
  return txApp.findRecordsByFilter("fleets", 'targetUid = {:h} && mission = "garrison" && status = "stationed"', "arriveAtMs", 10, 0, { h: hostUid });
}

/* ---------- Factions hostiles (v2.0, génériques en v2.1) ---------- */

/** Crée la flotte de l'exécuteur d'une faction vers un joueur. */
function createPirateRaid(txApp, game, player, raid, now) {
  const faction = game.findFaction(raid.factionId);
  const rec = new Record(txApp.findCollectionByNameOrId("fleets"));
  rec.load({
    ownerUid: game.PIRATE_OWNER_UID,
    ownerPseudo: faction ? faction.enforcer : "Pirates",
    factionId: raid.factionId,
    targetUid: player.uid,
    targetPseudo: player.pseudo,
    mission: "pirate",
    units: {},
    power: raid.power,
    departAtMs: now,
    arriveAtMs: raid.arriveAtMs,
    returnAtMs: null,
    status: "outbound",
    loot: null,
    reportId: "",
    outcome: "",
    recalled: false,
  });
  txApp.save(rec);
}

function resolvePirateArrival(txApp, game, rec, now) {
  const fleet = fleetFromRecord(rec);
  const faction = game.findFaction(fleet.factionId || "varan");
  rec.set("status", "done");
  if (!faction || !findOrNull(txApp, "players", fleet.targetUid)) {
    txApp.save(rec);
    return;
  }
  const loaded = loadPlayer(txApp, game, fleet.targetUid);
  const garrisonRecs = stationedGarrisons(txApp, fleet.targetUid).filter((g) => findOrNull(txApp, "players", g.getString("ownerUid")));
  const garrisons = garrisonRecs.map((g) => {
    const owner = toPlain(txApp.findRecordById("players", g.getString("ownerUid")));
    const gf = fleetFromRecord(g);
    return { ownerUid: gf.ownerUid, ownerPseudo: gf.ownerPseudo, units: owner.units || {}, techLevels: owner.techLevels || {}, fleet: gf.units };
  });
  const patrolling = txApp.findRecordsByFilter("fleets", 'ownerUid = {:u} && mission = "patrol" && status != "done"', "", 1, 0, { u: fleet.targetUid }).length > 0;
  const out = game.resolvePirateRaid(faction, loaded.player, loaded.queues, rec.getFloat("power"), garrisons, now, { evading: patrolling });
  savePlayer(txApp, game, loaded, out.player, out.queues);
  notify(txApp, fleet.targetUid, out.notifications);
  const report = new Record(txApp.findCollectionByNameOrId("battle_reports"));
  report.load(out.report);
  txApp.save(report);
  garrisonRecs.forEach((g, i) => {
    const losses = (out.combat.garrisonLosses || [])[i] || {};
    const units = Object.assign({}, fleetFromRecord(g).units);
    Object.keys(losses).forEach((k) => (units[k] = Math.max(0, (units[k] || 0) - losses[k])));
    g.set("units", units);
    if (!Object.keys(units).some((k) => units[k] > 0)) g.set("status", "done");
    txApp.save(g);
  });
  if (game.debrisTotal(out.debris) > 0) {
    const debris = loadDebris(txApp, fleet.targetUid);
    saveDebris(txApp, debris, game.mergeDebris(debris.field, out.debris, { uid: fleet.targetUid, pseudo: fleet.targetPseudo }, now));
  }
  rec.set("reportId", report.id);
  rec.set("outcome", out.combat.outcome);
  txApp.save(rec);
}

function resolveLairArrival(txApp, game, rec, now) {
  const fleet = fleetFromRecord(rec);
  const tripMs = Math.max(0, fleet.arriveAtMs - fleet.departAtMs);
  const faction = game.findFaction(fleet.factionId || game.factionOfLair(fleet.targetUid));
  if (!findOrNull(txApp, "players", fleet.ownerUid)) {
    rec.set("status", "done");
    txApp.save(rec);
    return;
  }
  if (!faction) {
    // Faction supprimée entre-temps : la flotte rentre sans combattre.
    rec.set("status", "returning");
    rec.set("returnAtMs", now + tripMs);
    txApp.save(rec);
    return;
  }
  const loaded = loadPlayer(txApp, game, fleet.ownerUid);
  // Les vaisseaux sont partis : on les remet « à bord » le temps du combat.
  const player = loaded.player;
  Object.keys(fleet.units).forEach((id) => {
    const st = player.units[id] || { level: 1, count: 0 };
    player.units[id] = Object.assign({}, st, { count: st.count + fleet.units[id] });
  });
  const out = game.resolveLairAssault(faction, player, loaded.queues, fleet.units, rec.getFloat("power"), now);
  Object.keys(fleet.units).forEach((id) => {
    if (out.player.units[id]) out.player.units[id].count = Math.max(0, out.player.units[id].count - fleet.units[id]);
  });
  savePlayer(txApp, game, loaded, out.player, out.queues);
  notify(txApp, fleet.ownerUid, out.notifications);
  const report = new Record(txApp.findCollectionByNameOrId("battle_reports"));
  report.load(out.report);
  txApp.save(report);
  const anyLeft = Object.keys(out.survivors).some((k) => out.survivors[k] > 0);
  rec.set("units", out.survivors);
  rec.set("reportId", report.id);
  rec.set("outcome", out.combat.outcome);
  rec.set("status", anyLeft ? "returning" : "done");
  rec.set("returnAtMs", anyLeft ? now + tripMs : null);
  txApp.save(rec);
}

/** Victoires contre des joueurs et butin des `windowDays` derniers jours. */
function aggressionStats(txApp, uid, now, windowDays) {
  const since = now - windowDays * 24 * 3600 * 1000;
  const reports = txApp.findRecordsByFilter(
    "battle_reports",
    'attackerUid = {:u} && outcome = "attacker_win" && timestamp > {:t} && defenderUid !~ "lair_" && defenderUid != "pirates_lair" && defenderUid != "pirates"',
    "",
    0,
    0,
    { u: uid, t: since },
  );
  const plunder = {};
  reports.forEach((r) => {
    const loot = toPlain(r).loot || {};
    Object.keys(loot).forEach((k) => (plunder[k] = (plunder[k] || 0) + (Number(loot[k]) || 0)));
  });
  return { victories: reports.length, plunder };
}

/** Passage périodique : listes des factions, ultimatums expirés (raids).
 *  `uid` : un seul joueur ; `force` : identifiant de la faction à forcer. */
function processPirates(game, now, uid, force) {
  const recs = uid ? [findOrNull($app, "players", uid)].filter(Boolean) : $app.findAllRecords("players");
  let changed = 0;
  recs.forEach((candidate) => {
    try {
      $app.runInTransaction((txApp) => {
        applyContent(txApp, game);
        const rec = txApp.findRecordById("players", candidate.id);
        const player = toPlain(rec);
        player.uid = rec.id;
        const hunter = game.FACTIONS.filter((f) => f.enabled && f.trigger.type === "aggression");
        const windowDays = hunter.reduce((m, f) => Math.max(m, f.trigger.windowDays || 0), 0);
        const aggression = hunter.length > 0 ? aggressionStats(txApp, rec.id, now, windowDays) : null;
        const out = game.pirateTick(player, now, { random: Math.random, aggression, force: force || null });
        if (!out.changed) return;
        rec.set("pirates", player.pirates);
        rec.set("stats", player.stats || null);
        txApp.save(rec);
        notify(txApp, rec.id, out.notifications);
        if (out.raid) createPirateRaid(txApp, game, player, out.raid, now);
        changed++;
      });
    } catch (err) {
      console.log(`[cosmic] pirates (${candidate.id}) : ${err}`);
    }
  });
  return changed;
}

/** POST /api/cosmic/pirates { answer: "pay" | "refuse" } */
function piratesRequest(e) {
  const game = loadGame();
  const answer = body(e).answer === "pay" ? "pay" : "refuse";
  let response = null;
  $app.runInTransaction((txApp) => {
    const now = Date.now();
    applyContent(txApp, game);
    const loaded = loadPlayer(txApp, game, e.auth.id);
    const flushed = game.flushPlayer(loaded.player, loaded.queues, now);
    let out;
    try {
      out = game.answerUltimatum(flushed.player, answer, now);
    } catch (err) {
      throw asHttpError(game, err);
    }
    savePlayer(txApp, game, loaded, flushed.player, flushed.queues);
    notify(txApp, e.auth.id, flushed.notifications.concat(out.notifications));
    if (out.raid) createPirateRaid(txApp, game, flushed.player, out.raid, now);
    response = { answer, raid: out.raid };
  });
  return e.json(200, response);
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
  // Garnisons alliées chez le défenseur : elles combattent à ses côtés.
  const garrisonRecs = defender ? stationedGarrisons(txApp, fleet.targetUid).filter((g) => findOrNull(txApp, "players", g.getString("ownerUid"))) : [];
  const garrisons = garrisonRecs.map((g) => {
    const owner = toPlain(txApp.findRecordById("players", g.getString("ownerUid")));
    const gf = fleetFromRecord(g);
    return { fleetId: g.id, ownerUid: gf.ownerUid, ownerPseudo: gf.ownerPseudo, units: owner.units || {}, techLevels: owner.techLevels || {}, fleet: gf.units };
  });
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
        garrisons,
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

  garrisonRecs.forEach((g, i) => {
    const losses = (result.combat.garrisonLosses || [])[i] || {};
    const units = Object.assign({}, fleetFromRecord(g).units);
    let lost = 0;
    Object.keys(losses).forEach((k) => {
      units[k] = Math.max(0, (units[k] || 0) - losses[k]);
      lost += losses[k];
    });
    const left = Object.keys(units).some((k) => units[k] > 0);
    g.set("units", units);
    if (!left) g.set("status", "done");
    txApp.save(g);
    notify(txApp, g.getString("ownerUid"), [
      {
        kind: "fleet",
        title: "Ta garnison a combattu",
        message: `Attaque de ${fleet.ownerPseudo} contre ${fleet.targetPseudo} : ${lost} vaisseau(x) perdu(s)${left ? "" : ", garnison détruite"}.`,
        createdAtMs: now,
        read: false,
      },
    ]);
  });

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
    `((status = "outbound" && arriveAtMs <= {:now}) || (status = "returning" && returnAtMs <= {:now}) || (status = "stationed" && stationedUntilMs <= {:now}))${scope}`,
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
        else if (status === "stationed" && rec.getFloat("stationedUntilMs") <= now) {
          const back = game.endGarrison(fleetFromRecord(rec), now);
          rec.set("status", back.status);
          rec.set("returnAtMs", back.returnAtMs);
          txApp.save(rec);
        }
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
  if (["attack", "spy", "recycle", "patrol", "garrison", "lair"].indexOf(mission) < 0) throw new BadRequestError("Mission inconnue.");
  let response = null;

  $app.runInTransaction((txApp) => {
    const now = Date.now();
    db.applyContent(txApp, game);
    const attacker = db.loadPlayer(txApp, game, attackerUid);
    let target = null;
    let debris = null;
    let garrisonsAtHost = 0;
    if (mission === "garrison") {
      garrisonsAtHost = txApp.findRecordsByFilter("fleets", 'targetUid = {:h} && mission = "garrison" && (status = "outbound" || status = "stationed")', "", 10, 0, { h: targetUid }).length;
    }
    if (mission === "attack" || mission === "spy" || mission === "garrison") {
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
        lairTarget: mission === "lair" ? targetUid : undefined,
        lastAttackOnTargetMs: mission === "attack" ? db.lastAttackOnTarget(txApp, attackerUid, targetUid) : null,
        patrolMinutes: Number(body.minutes) || 0,
        garrisonHours: Number(body.hours) || 0,
        garrisonsAtHost,
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

/* ---------- Clôture des saisons ---------- */

/** Fige le classement de la saison terminée, l'archive (season_results) et
 *  verse les récompenses. Ne fait rien si elle est déjà close. */
function closeSeason(game, now, seasonIdIn) {
  const seasonId = seasonIdIn || game.previousSeasonId(now);
  let summary = { seasonId, closed: false, ranked: 0, rewarded: 0 };
  // Tâche automatique : rien avant la première saison récompensée.
  if (!seasonIdIn) {
    applyContent($app, game);
    if (seasonId < game.SEASON_RULES.firstSeasonId) return summary;
  }
  $app.runInTransaction((txApp) => {
    if (txApp.findRecordsByFilter("season_results", "seasonId = {:s}", "", 1, 0, { s: seasonId }).length > 0) return;
    applyContent(txApp, game);
    const entries = txApp
      .findRecordsByFilter("players", "seasonId = {:s} || lastSeasonId = {:s}", "", 0, 0, { s: seasonId })
      .map((r) => {
        const p = toPlain(r);
        p.uid = r.id;
        return p;
      });
    const standings = game.seasonStandings(entries, seasonId);
    const collection = txApp.findCollectionByNameOrId("season_results");
    standings.forEach((st) => {
      const reward = game.seasonRewardFor(st.rank, st.seasonXp);
      let gained = null;
      if (reward) {
        const loaded = loadPlayer(txApp, game, st.uid);
        const out = game.performSeasonReward(loaded.player, loaded.queues, { seasonId, rank: st.rank, seasonXp: st.seasonXp }, reward, now);
        savePlayer(txApp, game, loaded, out.player, out.queues);
        notify(txApp, st.uid, out.notifications);
        gained = out.gained;
        summary.rewarded++;
      }
      const rec = new Record(collection);
      rec.load({
        seasonId,
        kind: "player",
        uid: st.uid,
        pseudo: st.pseudo,
        allianceId: st.allianceId,
        rank: st.rank,
        seasonXp: st.seasonXp,
        reward: reward ? Object.assign({}, reward, { gained }) : null,
        createdAtMs: now,
      });
      txApp.save(rec);
    });
    // Saison d'alliance : somme des meilleures XP de saison des membres.
    const allianceStanding = game.allianceStandings(entries.map((p) => ({ allianceId: p.allianceId, seasonXp: game.seasonXpFor(p, seasonId) })));
    allianceStanding.slice(0, 10).forEach((st) => {
      const a = findOrNull(txApp, "alliances", st.allianceId);
      if (!a) return;
      const al = toPlain(a);
      const rec = new Record(collection);
      rec.load({ seasonId, kind: "alliance", uid: `alliance_${al.id}`, pseudo: `[${al.tag}] ${al.name}`, allianceId: al.id, rank: st.rank, seasonXp: st.score, reward: null, createdAtMs: now });
      txApp.save(rec);
      if (st.rank !== 1) return;
      const rules = game.ALLIANCE_RULES;
      entries
        .filter((p) => p.allianceId === al.id && game.seasonXpFor(p, seasonId) >= game.SEASON_RULES.participationXp)
        .forEach((p) => {
          const loaded = loadPlayer(txApp, game, p.uid);
          const out = game.performSeasonReward(
            loaded.player,
            loaded.queues,
            { seasonId, rank: 1, seasonXp: game.seasonXpFor(p, seasonId) },
            { hours: rules.seasonRewardHours, rare: 0, title: rules.seasonTitle },
            now,
            `Ton alliance [${al.tag}] remporte la saison !`,
          );
          savePlayer(txApp, game, loaded, out.player, out.queues);
          notify(txApp, p.uid, out.notifications);
        });
    });
    summary = { seasonId, closed: true, ranked: standings.length, rewarded: summary.rewarded, alliances: allianceStanding.length };
  });
  return summary;
}
/* ---------- Alliances (v1.9) ---------- */

const ALLIANCE_FIELDS = ["name", "tag", "createdBy", "createdAtMs", "members", "memberPseudos", "roles", "treasury", "research", "activeResearch", "distributions"];

function allianceFromRecord(rec) {
  const a = toPlain(rec);
  a.members = a.members || [];
  a.memberPseudos = a.memberPseudos || {};
  a.roles = a.roles || {};
  a.treasury = a.treasury || {};
  a.research = a.research || {};
  a.activeResearch = a.activeResearch || null;
  a.distributions = a.distributions || { day: "", count: 0 };
  return a;
}

/** Enregistre (ou supprime si null) l'alliance et applique les effets. */
function applyAllianceOutput(txApp, allianceRec, out, now) {
  let id = allianceRec ? allianceRec.id : "";
  if (out.alliance === null) {
    if (allianceRec) txApp.delete(allianceRec);
  } else if (out.alliance) {
    const rec = allianceRec || new Record(txApp.findCollectionByNameOrId("alliances"));
    ALLIANCE_FIELDS.forEach((f) => rec.set(f, out.alliance[f] === undefined ? null : out.alliance[f]));
    rec.set("researchEndMs", out.alliance.activeResearch ? out.alliance.activeResearch.endTime : 0);
    txApp.save(rec);
    id = rec.id;
  }
  Object.keys(out.memberships || {}).forEach((uid) => {
    const p = findOrNull(txApp, "players", uid);
    if (!p) return;
    const m = out.memberships[uid];
    p.set("allianceId", m.allianceId === undefined ? id : m.allianceId);
    p.set("allianceResearch", m.allianceResearch || {});
    txApp.save(p);
  });
  const logs = txApp.findCollectionByNameOrId("alliance_logs");
  (out.logs || []).forEach((l) => {
    if (!id) return;
    const rec = new Record(logs);
    rec.load(Object.assign({}, l, { allianceId: id, resources: l.resources || null }));
    txApp.save(rec);
  });
  Object.keys(out.notifications || {}).forEach((uid) => notify(txApp, uid, out.notifications[uid]));
  return id;
}

/** Termine la recherche d'une alliance si son heure est passée. */
function finishResearchIfDue(txApp, game, rec, now) {
  const done = game.finishAllianceResearch(allianceFromRecord(rec), now);
  if (done) applyAllianceOutput(txApp, rec, done, now);
  return !!done;
}

/** POST /api/cosmic/alliance { action, ... } */
function allianceRequest(e) {
  const db = module.exports;
  const game = loadGame();
  const uid = e.auth.id;
  const action = db.body(e);
  let response = null;
  $app.runInTransaction((txApp) => {
    const now = Date.now();
    applyContent(txApp, game);
    // Recherche arrivée à terme : terminée d'abord (elle réécrit les fiches
    // des membres, qu'on ne doit charger qu'ensuite).
    const own = findOrNull(txApp, "players", uid);
    const ownAllianceId = own ? own.getString("allianceId") : "";
    [ownAllianceId, action.type === "join" ? String(action.allianceId || "") : ""].forEach((id) => {
      const rec = id ? findOrNull(txApp, "alliances", id) : null;
      if (rec) finishResearchIfDue(txApp, game, rec, now);
    });
    const actor = loadPlayer(txApp, game, uid);
    const flushed = game.flushPlayer(actor.player, actor.queues, now);
    // Alliance disparue ou dont on a été retiré : on repart de zéro.
    const current = actor.player.allianceId ? findOrNull(txApp, "alliances", actor.player.allianceId) : null;
    if (!current || (toPlain(current).members || []).indexOf(uid) < 0) flushed.player.allianceId = "";
    const allianceId = action.type === "join" ? String(action.allianceId || "") : String(flushed.player.allianceId || "");
    let allianceRec = null;
    if (action.type !== "create" && allianceId) {
      allianceRec = findOrNull(txApp, "alliances", allianceId);
    }
    let target = null;
    if (action.type === "distribute") {
      const targetUid = String(action.targetUid || "");
      if (targetUid === uid) target = { loaded: actor, flushed };
      else if (findOrNull(txApp, "players", targetUid)) {
        const loaded = loadPlayer(txApp, game, targetUid);
        target = { loaded, flushed: game.flushPlayer(loaded.player, loaded.queues, now) };
      }
    }
    let out;
    try {
      out = game.performAllianceAction({
        action,
        now,
        actor: flushed.player,
        alliance: allianceRec ? allianceFromRecord(allianceRec) : null,
        target: target ? target.flushed.player : null,
      });
    } catch (err) {
      throw asHttpError(game, err);
    }
    savePlayer(txApp, game, actor, out.actor, flushed.queues);
    notify(txApp, uid, flushed.notifications);
    if (target && target.loaded !== actor) {
      savePlayer(txApp, game, target.loaded, out.target, target.flushed.queues);
      notify(txApp, target.loaded.player.uid, target.flushed.notifications);
    } else if (target) {
      // Versement à soi-même : même fiche que l'acteur.
      savePlayer(txApp, game, actor, out.target, flushed.queues);
    }
    if (action.type === "create") {
      out.memberships = {};
      out.memberships[uid] = { allianceResearch: {} };
      out.logs = [{ kind: "join", actorUid: uid, actorPseudo: actor.player.pseudo, text: "(fondation)", createdAtMs: now }];
      try {
        const id = applyAllianceOutput(txApp, null, out, now);
        response = { allianceId: id };
      } catch (err) {
        if (String(err).indexOf("tag") >= 0) throw new BadRequestError("Ce tag est déjà utilisé par une autre alliance.");
        throw err;
      }
    } else {
      const id = applyAllianceOutput(txApp, allianceRec, out, now);
      response = { allianceId: out.alliance ? id : "" };
    }
  });
  return e.json(200, response);
}

/** Recherches d'alliance terminées (tâche minute). */
function processAllianceResearch(game, now) {
  $app.findRecordsByFilter("alliances", "researchEndMs > 0 && researchEndMs <= {:now}", "", 50, 0, { now }).forEach((candidate) => {
    try {
      $app.runInTransaction((txApp) => {
        applyContent(txApp, game);
        finishResearchIfDue(txApp, game, txApp.findRecordById("alliances", candidate.id), now);
      });
    } catch (err) {
      console.log(`[cosmic] recherche d'alliance ${candidate.id} non traitée : ${err}`);
    }
  });
}

/** Rapports d'espionnage et de combat des membres (onglet Renseignement). */
function allianceIntel(e) {
  const game = loadGame();
  applyContent($app, game);
  const player = findOrNull($app, "players", e.auth.id);
  const allianceId = player ? player.getString("allianceId") : "";
  const alliance = allianceId ? findOrNull($app, "alliances", allianceId) : null;
  if (!alliance) throw new BadRequestError("Tu n'es membre d'aucune alliance.");
  const members = toPlain(alliance).members || [];
  if (members.indexOf(e.auth.id) < 0) throw new ForbiddenError("Tu n'es pas membre de cette alliance.");
  const since = Date.now() - game.ALLIANCE_RULES.sharedReportsDays * 86400000;
  const max = game.ALLIANCE_RULES.sharedReportsMax;
  const params = { since };
  const spyOr = [];
  const battleOr = [];
  members.forEach((m, i) => {
    params["m" + i] = m;
    spyOr.push(`spyUid = {:m${i}}`);
    battleOr.push(`attackerUid = {:m${i}} || defenderUid = {:m${i}}`);
  });
  const spies = $app
    .findRecordsByFilter("spy_reports", `timestamp > {:since} && (${spyOr.join(" || ")})`, "-timestamp", max, 0, params)
    .map((r) => Object.assign({ type: "spy" }, toPlain(r)));
  const battles = $app
    .findRecordsByFilter("battle_reports", `timestamp > {:since} && (${battleOr.join(" || ")})`, "-timestamp", max, 0, params)
    .map((r) => Object.assign({ type: "battle" }, toPlain(r)));
  const items = spies.concat(battles).sort((a, b) => b.timestamp - a.timestamp).slice(0, max);
  return e.json(200, { items });
}

/* ---------- Hard reset (administration) ---------- */

/** POST /api/cosmic/admin/reset { scope: "all" | "player", uid?, confirm, options } */
function adminReset(e) {
  const db = module.exports;
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  const req = body(e);
  const scope = req.scope === "player" ? "player" : "all";
  const options = game.parseResetOptions(req.options);
  let targets;
  if (scope === "player") {
    const rec = findOrNull($app, "players", String(req.uid || ""));
    if (!rec) throw new NotFoundError("Joueur introuvable.");
    if (String(req.confirm || "") !== rec.getString("pseudo")) throw new BadRequestError("Confirmation incorrecte : tape le pseudo du joueur.");
    targets = [rec.id];
  } else {
    if (String(req.confirm || "") !== "RESET") throw new BadRequestError("Confirmation incorrecte : tape RESET.");
    targets = $app.findAllRecords("players").map((r) => r.id);
  }

  // Sauvegarde complète avant toute modification (annule le reset si elle échoue).
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 12);
  const backup = `avant_reset_${stamp}.zip`;
  try {
    $app.createBackup(e.request.context(), backup);
  } catch (err) {
    throw new BadRequestError(`Sauvegarde impossible, reset annulé : ${err}`);
  }

  const now = Date.now();
  const summary = { scope, players: 0, fleets: 0, debris: 0, reports: 0, alliances: 0, backup };
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const params = {};
    const inList = (field) =>
      targets
        .map((id, i) => {
          params["t" + i] = id;
          return `${field} = {:t${i}}`;
        })
        .join(" || ");
    const deleteWhere = (collection, filter) => {
      const recs = scope === "all" ? txApp.findAllRecords(collection) : txApp.findRecordsByFilter(collection, filter, "", 0, 0, params);
      recs.forEach((r) => txApp.delete(r));
      return recs.length;
    };

    summary.fleets = deleteWhere("fleets", `${inList("ownerUid")} || ${inList("targetUid")}`);
    summary.debris = deleteWhere("debris_fields", inList("id"));
    if (options.reports) {
      summary.reports += deleteWhere("battle_reports", `${inList("attackerUid")} || ${inList("defenderUid")}`);
      summary.reports += deleteWhere("spy_reports", `${inList("spyUid")} || ${inList("targetUid")}`);
      deleteWhere("notifications", inList("player_id"));
    }
    if (scope === "all" && options.titles) deleteWhere("season_results", "id != ''");
    if (scope === "all" && options.alliances) {
      txApp.findAllRecords("alliances").forEach((a) => {
        a.set("treasury", {});
        a.set("research", {});
        a.set("activeResearch", null);
        a.set("researchEndMs", 0);
        a.set("distributions", { day: "", count: 0 });
        txApp.save(a);
        summary.alliances++;
      });
      txApp.findAllRecords("alliance_logs").forEach((l) => txApp.delete(l));
    }

    const staffRecord = readStaffRecord(txApp, game);
    const staffRoles = staffRecord ? game.normalizeStaff(toPlain(staffRecord).data).roles : {};
    targets.forEach((uid) => {
      const loaded = loadPlayer(txApp, game, uid);
      const out = game.resetPlayerState(loaded.player, options, now);
      // Le titre d'équipe survit à la remise à zéro des titres.
      if (staffRoles[uid]) game.applyStaffTitle(out.player, staffRoles[uid], false);
      savePlayer(txApp, game, loaded, out.player, out.queues);
      ["createdAtMs", "lastAttackAtMs", "lastDefeatAtMs"].forEach((f) => loaded.rec.set(f, out.player[f]));
      if (scope === "all" && options.alliances) loaded.rec.set("allianceResearch", {});
      txApp.save(loaded.rec);
      notify(txApp, uid, out.notifications);
      summary.players++;
    });

    const log = new Record(txApp.findCollectionByNameOrId("admin_logs"));
    log.load({
      actorId: e.auth ? e.auth.id : "superuser",
      actorName: e.auth ? e.auth.getString("name") || e.auth.getString("username") || e.auth.getString("email") : "superuser",
      action: "reset",
      targetCollection: "players",
      recordId: scope === "player" ? targets[0] : "",
      recordLabel: scope === "player" ? String(req.confirm) : "tous les joueurs",
      changes: { options, résultat: summary },
      createdAtMs: now,
    });
    txApp.save(log);
  });
  return e.json(200, summary);
}

/* ---------- Mode maintenance (v2.5) ---------- */

/** État de la maintenance (clé "maintenance" de game_config). */
function readMaintenance(txApp, game) {
  const g = game || loadGame();
  try {
    const rec = (txApp || $app).findFirstRecordByData("game_config", "key", g.MAINTENANCE_KEY);
    return g.normalizeMaintenance(toPlain(rec).data);
  } catch (_) {
    return g.normalizeMaintenance(null);
  }
}

/** Requêtes d'écriture fermées aux joueurs pendant la maintenance : actions
 *  de jeu (/api/cosmic/…, hors administration) et écritures directes dans
 *  les collections (inscription comprise). La connexion reste possible. */
function closedDuringMaintenance(method, path) {
  if (method === "GET" || method === "HEAD" || method === "OPTIONS") return false;
  if (path.indexOf("/api/cosmic/admin/") === 0) return false;
  if (path.indexOf("/api/cosmic/") === 0) return true;
  return /^\/api\/collections\/[^/]+\/records/.test(path);
}

/** Middleware : refuse l'action d'un joueur pendant la maintenance. */
function maintenanceGuard(e) {
  if (!closedDuringMaintenance(e.request.method, e.request.url.path)) return;
  const m = readMaintenance($app);
  if (!m.enabled || isGameAdmin(e)) return;
  throw new ApiError(503, "Le jeu est en maintenance : réessaie à la réouverture.", { maintenance: true });
}

/** Enregistre le nouvel état de la maintenance ; à la fin, les ultimatums en
 *  cours sont prolongés de la durée de la coupure. Consigné dans le journal. */
function writeMaintenance(txApp, game, previous, next, now, actor) {
  let extended = 0;
  if (previous.enabled && !next.enabled && previous.startedAtMs > 0) {
    txApp.findAllRecords("players").forEach((rec) => {
      const shifted = game.extendUltimatums(toPlain(rec).pirates, previous.startedAtMs, now);
      if (!shifted) return;
      rec.set("pirates", shifted);
      txApp.save(rec);
      extended++;
    });
  }
  let rec = null;
  try {
    rec = txApp.findFirstRecordByData("game_config", "key", game.MAINTENANCE_KEY);
  } catch (_) {
    rec = new Record(txApp.findCollectionByNameOrId("game_config"));
    rec.set("key", game.MAINTENANCE_KEY);
  }
  rec.set("data", next);
  txApp.save(rec);

  const log = new Record(txApp.findCollectionByNameOrId("admin_logs"));
  log.load({
    actorId: actor.id,
    actorName: actor.name,
    action: "maintenance",
    targetCollection: "game_config",
    recordId: rec.id,
    recordLabel: next.enabled ? "maintenance activée" : actor.id === "system" ? "maintenance terminée automatiquement" : "maintenance terminée",
    changes: { avant: previous, après: next, ultimatumsProlongés: extended },
    createdAtMs: now,
  });
  txApp.save(log);
  return extended;
}

/** POST /api/cosmic/admin/maintenance { enabled, message, version, endsAtMs, autoEnd } */
function adminMaintenance(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  const req = body(e);
  const now = Date.now();
  const actor = {
    id: e.auth ? e.auth.id : "superuser",
    name: e.auth ? e.auth.getString("name") || e.auth.getString("username") || e.auth.getString("email") : "superuser",
  };
  let response = null;
  $app.runInTransaction((txApp) => {
    const previous = readMaintenance(txApp, game);
    const next = game.nextMaintenance(previous, req, now);
    const extended = writeMaintenance(txApp, game, previous, next, now, actor);
    response = Object.assign({ extended }, next);
  });
  return e.json(200, response);
}

/** Tâche planifiée : rouvre le jeu à l'heure prévue (si l'option est active). */
function autoEndMaintenance(now) {
  const game = loadGame();
  let ended = false;
  $app.runInTransaction((txApp) => {
    const previous = readMaintenance(txApp, game);
    if (!game.maintenanceShouldAutoEnd(previous, now)) return;
    const next = game.nextMaintenance(previous, { enabled: false }, now);
    writeMaintenance(txApp, game, previous, next, now, { id: "system", name: "Système" });
    ended = true;
  });
  return ended;
}

/* ---------- Administrateurs et équipe du jeu (v2.5) ---------- */

function readStaffRecord(txApp, game) {
  try {
    return txApp.findFirstRecordByData("game_config", "key", game.STAFF_KEY);
  } catch (_) {
    return null;
  }
}

/** Titre d'équipe d'un joueur aligné sur son rôle (null = retiré). */
function setPlayerStaffTitle(txApp, game, uid, role, display) {
  const rec = findOrNull(txApp, "players", uid);
  if (!rec) return;
  const p = toPlain(rec);
  if (!game.applyStaffTitle(p, role, display)) return;
  rec.set("titles", p.titles);
  rec.set("activeTitle", p.activeTitle || "");
  txApp.save(rec);
}

/** Rôles de l'équipe ; créés au premier appel à partir des administrateurs
 *  existants (rôles par défaut selon le pseudo, titre affiché d'emblée). */
function ensureStaff(txApp, game) {
  const existing = readStaffRecord(txApp, game);
  if (existing) return { rec: existing, state: game.normalizeStaff(toPlain(existing).data) };
  const roles = {};
  txApp.findAllRecords("admins").forEach((a) => {
    const player = findOrNull(txApp, "players", a.id);
    const pseudo = player ? player.getString("pseudo") : "";
    roles[a.id] = game.DEFAULT_STAFF_BY_PSEUDO[pseudo] || "admin";
    setPlayerStaffTitle(txApp, game, a.id, roles[a.id], true);
  });
  const rec = new Record(txApp.findCollectionByNameOrId("game_config"));
  rec.set("key", game.STAFF_KEY);
  rec.set("data", { roles });
  txApp.save(rec);
  return { rec, state: { roles } };
}

function adminEntry(txApp, id, note, roles) {
  const player = findOrNull(txApp, "players", id);
  const user = findOrNull(txApp, "users", id);
  return {
    id,
    pseudo: player ? player.getString("pseudo") : "",
    email: user ? user.getString("email") : "",
    note: note || "",
    role: (roles && roles[id]) || "admin",
  };
}

function adminEntries(txApp, roles) {
  return txApp.findAllRecords("admins").map((r) => adminEntry(txApp, r.id, r.getString("note"), roles));
}

/** GET /api/cosmic/admin/admins — liste des administrateurs et de leur rôle. */
function adminList(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  let list = [];
  $app.runInTransaction((txApp) => {
    list = adminEntries(txApp, ensureStaff(txApp, game).state.roles);
  });
  return e.json(200, { admins: list });
}

/** POST /api/cosmic/admin/admins { action: "add" | "remove" | "role", uid, note?, role? } */
function adminManage(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  const req = body(e);
  const uid = String(req.uid || "");
  const action = String(req.action || "");
  if (["add", "remove", "role"].indexOf(action) < 0) throw new BadRequestError("Action inconnue.");
  const role = game.isStaffRole(req.role) ? req.role : "admin";
  let response = null;
  $app.runInTransaction((txApp) => {
    if (!findOrNull(txApp, "users", uid)) throw new NotFoundError("Compte introuvable.");
    const staff = ensureStaff(txApp, game);
    const roles = staff.state.roles;
    const existing = findOrNull(txApp, "admins", uid);
    let label = "";
    if (action === "add") {
      if (existing) throw new BadRequestError("Ce joueur est déjà administrateur.");
      const rec = new Record(txApp.findCollectionByNameOrId("admins"));
      rec.set("id", uid);
      rec.set("note", String(req.note || "").slice(0, 200));
      txApp.save(rec);
      roles[uid] = role;
      const player = findOrNull(txApp, "players", uid);
      setPlayerStaffTitle(txApp, game, uid, role, !!player && !player.getString("activeTitle"));
      label = `nommé ${role === "developer" ? "développeur" : "administrateur"}`;
    } else if (action === "remove") {
      if (!existing) throw new BadRequestError("Ce joueur n'est pas administrateur.");
      if (e.auth && e.auth.id === uid) throw new BadRequestError("Tu ne peux pas te retirer toi-même.");
      if (txApp.findAllRecords("admins").length <= 1) throw new BadRequestError("Il faut garder au moins un administrateur.");
      txApp.delete(existing);
      delete roles[uid];
      setPlayerStaffTitle(txApp, game, uid, null, false);
      label = "administrateur retiré";
    } else {
      if (!existing) throw new BadRequestError("Ce joueur n'est pas administrateur.");
      const player = findOrNull(txApp, "players", uid);
      const shown = player ? player.getString("activeTitle") : "";
      const wasStaffShown = shown === "Développeur" || shown === "Administrateur";
      roles[uid] = role;
      setPlayerStaffTitle(txApp, game, uid, role, wasStaffShown);
      label = `rôle : ${role === "developer" ? "développeur" : "administrateur"}`;
    }
    staff.rec.set("data", { roles });
    txApp.save(staff.rec);

    const entry = adminEntry(txApp, uid, String(req.note || ""), roles);
    const log = new Record(txApp.findCollectionByNameOrId("admin_logs"));
    log.load({
      actorId: e.auth ? e.auth.id : "superuser",
      actorName: e.auth ? e.auth.getString("name") || e.auth.getString("username") || e.auth.getString("email") : "superuser",
      action: action === "add" ? "create" : action === "remove" ? "delete" : "update",
      targetCollection: "admins",
      recordId: uid,
      recordLabel: `${entry.pseudo || entry.email || uid} : ${label}`,
      changes: { [label]: entry.pseudo || entry.email || uid },
      createdAtMs: Date.now(),
    });
    txApp.save(log);
    response = { ok: true, admins: adminEntries(txApp, roles) };
  });
  return e.json(200, response);
}

/* ---------- Sauvegardes (v2.8) ---------- */

const BACKUP_MAX_AGE_MS = 26 * 3600 * 1000;

/** Sauvegardes présentes : nombre, plus récente, planification. */
function backupStatus() {
  let latestAtMs = 0;
  let count = 0;
  let latestKey = "";
  const fsys = $app.newBackupsFilesystem();
  try {
    const list = fsys.list("");
    for (let i = 0; i < list.length; i++) {
      const obj = list[i];
      const key = String(obj.key || "");
      if (!key.endsWith(".zip")) continue;
      count++;
      const at = new Date(String(obj.modTime)).getTime();
      if (at > latestAtMs) {
        latestAtMs = at;
        latestKey = key;
      }
    }
  } finally {
    fsys.close();
  }
  let cron = "";
  let maxKeep = 0;
  try {
    cron = String($app.settings().backups.cron || "");
    maxKeep = Number($app.settings().backups.cronMaxKeep) || 0;
  } catch (_) {
    /* réglages illisibles */
  }
  return { latestAtMs, latestKey, count, cron, maxKeep, staleAfterMs: BACKUP_MAX_AGE_MS };
}

/** GET /api/cosmic/admin/backups — état des sauvegardes (administrateurs). */
function adminBackupStatus(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  return e.json(200, backupStatus());
}

/** Vérification quotidienne : alerte l'équipe si la dernière sauvegarde est trop ancienne. */
function checkBackups(now) {
  const st = backupStatus();
  if (st.latestAtMs > 0 && now - st.latestAtMs <= BACKUP_MAX_AGE_MS) return false;
  const age = st.latestAtMs > 0 ? `la dernière date de ${Math.round((now - st.latestAtMs) / 3600000)} h` : "aucune sauvegarde trouvée";
  const message = `Sauvegarde quotidienne manquante : ${age}. Planification : ${st.cron || "désactivée"}.`;
  adminIds().forEach((id) => {
    try {
      notify($app, id, [{ kind: "report", title: "Alerte sauvegarde", message, createdAtMs: now, read: false }]);
    } catch (_) {
      /* facultatif */
    }
    sendMail(userEmail(id), "[Cosmic Empires] Alerte : sauvegarde manquante", [message, "Vérifie l'espace disque et les réglages Backups de PocketBase."], appUrl("/game/admin?onglet=tools"));
  });
  return true;
}

/* ---------- Signalements de problèmes (v2.7) ---------- */

/** Adresse publique du jeu (« Application URL » de PocketBase). */
function appUrl(path) {
  let base = "";
  try {
    base = String($app.settings().meta.appURL || "").replace(/\/+$/, "");
  } catch (_) {
    base = "";
  }
  return base + path;
}

function mailEnabled() {
  try {
    return !!$app.settings().smtp.enabled;
  } catch (_) {
    return false;
  }
}

function escapeHtml(text) {
  return String(text || "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
}

/** E-mail best effort (SMTP configuré dans PocketBase), jamais bloquant. */
function sendMail(to, subject, lines, link) {
  if (!to || !mailEnabled()) return false;
  try {
    const meta = $app.settings().meta;
    const html =
      `<div style="font-family:Arial,sans-serif;font-size:14px;color:#111">` +
      lines.map((l) => `<p>${escapeHtml(l).replace(/\n/g, "<br>")}</p>`).join("") +
      (link ? `<p><a href="${escapeHtml(link)}">${escapeHtml(link)}</a></p>` : "") +
      `<p style="color:#888;font-size:12px">Cosmic Empires</p></div>`;
    const message = new MailerMessage({
      from: { address: meta.senderAddress, name: meta.senderName || "Cosmic Empires" },
      to: [{ address: to }],
      subject,
      html,
    });
    $app.newMailClient().send(message);
    return true;
  } catch (err) {
    console.log(`[cosmic] e-mail non envoyé (${subject}) : ${err}`);
    return false;
  }
}

function userEmail(uid) {
  const user = findOrNull($app, "users", uid);
  return user ? user.getString("email") : "";
}

function adminIds() {
  return $app.findAllRecords("admins").map((r) => r.id);
}

function reportJson(rec) {
  const r = toPlain(rec);
  r.history = r.history || [];
  return r;
}

/** Création par un joueur : champs validés et complétés côté serveur. */
function reportCreateRequest(e) {
  const game = loadGame();
  const rec = e.record;
  const uid = e.auth ? e.auth.id : "";
  if (!uid || rec.getString("reporterId") !== uid) throw new ForbiddenError("Signalement refusé.");
  const now = Date.now();
  let clean = null;
  try {
    const previous = $app.findRecordsByFilter("reports", "reporterId = {:u} && createdAtMs > {:t}", "", 50, 0, { u: uid, t: now - 24 * 3600 * 1000 }).map((r) => r.getInt("createdAtMs"));
    game.assertReportQuota(previous, now);
    clean = game.sanitizeNewReport({ category: rec.getString("category"), title: rec.getString("title"), description: rec.getString("description"), context: toPlain(rec).context });
  } catch (err) {
    throw asHttpError(game, err);
  }
  const player = findOrNull($app, "players", uid);
  const pseudo = player ? player.getString("pseudo") : "";
  rec.set("category", clean.category);
  rec.set("title", clean.title);
  rec.set("description", clean.description);
  rec.set("context", clean.context);
  rec.set("status", "new");
  rec.set("resolution", "");
  rec.set("githubUrl", "");
  rec.set("reporterPseudo", pseudo);
  rec.set("history", [{ kind: "created", atMs: now, byId: uid, byName: pseudo, staff: false }]);
  rec.set("createdAtMs", now);
  rec.set("updatedAtMs", now);
  rec.set("reporterSeenAtMs", now);
  e.next();

  // Équipe prévenue : notification en jeu et e-mail.
  const link = appUrl(`/game/admin?onglet=reports&signalement=${rec.id}`);
  adminIds().forEach((id) => {
    if (id === uid) return;
    try {
      notify($app, id, [{ kind: "report", title: "Nouveau signalement", message: `${pseudo || "Un joueur"} : ${clean.title}`, createdAtMs: now, read: false }]);
    } catch (_) {
      /* notification facultative */
    }
    sendMail(userEmail(id), `[Cosmic Empires] Signalement : ${clean.title}`, [`${pseudo || "Un joueur"} a signalé un problème.`, clean.title, clean.description], link);
  });
}

/** POST /api/cosmic/reports/error { message, stack, page, version } — erreur
 *  JavaScript remontée automatiquement (v2.8), regroupée par empreinte. */
function reportClientError(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const now = Date.now();
  const err = game.sanitizeClientError(body(e));
  if (!err) return e.json(200, { ok: true, ignored: true });

  // Quota quotidien par joueur (mémoire du serveur, remise à zéro au redémarrage).
  const quotaKey = game.errorQuotaKey(uid, now);
  let sent = 0;
  try {
    sent = Number($app.store().get(quotaKey)) || 0;
    if (sent >= game.AUTO_ERROR_RULES.maxPerDay) return e.json(200, { ok: true, ignored: true });
    $app.store().set(quotaKey, sent + 1);
  } catch (_) {
    /* sans mémoire partagée : pas de quota */
  }

  const player = findOrNull($app, "players", uid);
  const pseudo = player ? player.getString("pseudo") : "";
  const key = game.errorKey(err.message, err.stack);
  let created = null;
  let reopened = null;
  $app.runInTransaction((txApp) => {
    const existing = txApp.findRecordsByFilter("reports", "autoKey = {:k}", "-createdAtMs", 1, 0, { k: key })[0];
    if (existing) {
      const r = reportJson(existing);
      const next = game.addOccurrence({ status: r.status, history: r.history, occurrences: r.occurrences || 1, affected: r.affected || [] }, pseudo, now);
      existing.set("status", next.status);
      existing.set("history", next.history);
      existing.set("occurrences", next.occurrences);
      existing.set("affected", next.affected);
      existing.set("updatedAtMs", now);
      txApp.save(existing);
      if (next.reopened) reopened = existing;
      return;
    }
    const col = txApp.findCollectionByNameOrId("reports");
    const rec = new Record(col);
    rec.set("reporterId", game.AUTO_REPORTER_ID);
    rec.set("reporterPseudo", "Système");
    rec.set("category", "bug");
    rec.set("title", game.autoReportTitle(err.message));
    rec.set("description", game.autoReportDescription(err));
    rec.set("context", { version: err.version, page: err.page, theme: "", userAgent: String(e.request.header.get("User-Agent") || "").slice(0, 300), screen: "" });
    rec.set("status", "new");
    rec.set("resolution", "");
    rec.set("githubUrl", "");
    rec.set("history", [{ kind: "created", atMs: now, byId: game.AUTO_REPORTER_ID, byName: "Système", staff: true, text: `Première occurrence chez ${pseudo || "un joueur"}.` }]);
    rec.set("autoKey", key);
    rec.set("occurrences", 1);
    rec.set("affected", pseudo ? [pseudo] : []);
    rec.set("createdAtMs", now);
    rec.set("updatedAtMs", now);
    rec.set("reporterSeenAtMs", now);
    txApp.save(rec);
    created = rec;
  });

  // Équipe prévenue à la première occurrence (ou si l'erreur revient après clôture).
  const rec = created || reopened;
  if (rec) {
    const title = rec.getString("title");
    const link = appUrl(`/game/admin?onglet=reports&signalement=${rec.id}`);
    adminIds().forEach((id) => {
      try {
        notify($app, id, [{ kind: "report", title: created ? "Erreur détectée" : "Erreur revenue", message: title, createdAtMs: now, read: false }]);
      } catch (_) {
        /* facultatif */
      }
      sendMail(userEmail(id), `[Cosmic Empires] ${created ? "Erreur détectée" : "Erreur revenue"} : ${title}`, [err.message, err.stack, `Page : ${err.page || "?"} · version ${err.version || "?"}`], link);
    });
  }
  return e.json(200, { ok: true });
}

/** POST /api/cosmic/reports/comment { id, text } — réponse du joueur. */
function reportComment(e) {
  const game = loadGame();
  const req = body(e);
  const uid = e.auth.id;
  const now = Date.now();
  let out = null;
  let title = "";
  let pseudo = "";
  $app.runInTransaction((txApp) => {
    const rec = findOrNull(txApp, "reports", String(req.id || ""));
    if (!rec || rec.getString("reporterId") !== uid) throw new NotFoundError("Signalement introuvable.");
    pseudo = rec.getString("reporterPseudo");
    title = rec.getString("title");
    let history;
    try {
      history = game.addReportComment(reportJson(rec).history, { id: uid, name: pseudo, staff: false }, req.text, now);
    } catch (err) {
      throw asHttpError(game, err);
    }
    rec.set("history", history);
    rec.set("updatedAtMs", now);
    rec.set("reporterSeenAtMs", now);
    // Un signalement clos qui reçoit un message repasse « en cours ».
    if (rec.getString("status") === "resolved" || rec.getString("status") === "rejected") rec.set("status", "in_progress");
    txApp.save(rec);
    out = reportJson(rec);
  });
  adminIds().forEach((id) => {
    if (id === uid) return;
    try {
      notify($app, id, [{ kind: "report", title: "Signalement : nouveau message", message: `${pseudo} : ${title}`, createdAtMs: now, read: false }]);
    } catch (_) {
      /* facultatif */
    }
  });
  return e.json(200, out);
}

/** POST /api/cosmic/reports/seen { id } — réponses lues par le joueur. */
function reportSeen(e) {
  const req = body(e);
  const rec = findOrNull($app, "reports", String(req.id || ""));
  if (!rec || rec.getString("reporterId") !== e.auth.id) throw new NotFoundError("Signalement introuvable.");
  rec.set("reporterSeenAtMs", Date.now());
  $app.save(rec);
  return e.json(200, { ok: true });
}

function actorOf(e) {
  return {
    id: e.auth ? e.auth.id : "superuser",
    name: e.auth ? e.auth.getString("name") || e.auth.getString("username") || e.auth.getString("email") : "Équipe",
  };
}

/** POST /api/cosmic/admin/reports { id, status?, resolution?, comment? } */
function adminReportUpdate(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  const req = body(e);
  const now = Date.now();
  const actor = actorOf(e);
  const player = e.auth ? findOrNull($app, "players", e.auth.id) : null;
  if (player && player.getString("pseudo")) actor.name = player.getString("pseudo");
  let out = null;
  let notifyText = null;
  let reporterId = "";
  let title = "";
  let comment = "";
  $app.runInTransaction((txApp) => {
    const rec = findOrNull(txApp, "reports", String(req.id || ""));
    if (!rec) throw new NotFoundError("Signalement introuvable.");
    let res;
    try {
      res = game.applyStaffUpdate({ status: rec.getString("status"), resolution: rec.getString("resolution"), history: reportJson(rec).history }, actor, req, now);
    } catch (err) {
      throw asHttpError(game, err);
    }
    if (!res.changed) {
      out = reportJson(rec);
      return;
    }
    rec.set("status", res.status);
    rec.set("resolution", res.resolution);
    rec.set("history", res.history);
    rec.set("updatedAtMs", now);
    txApp.save(rec);
    out = reportJson(rec);
    notifyText = res.notify;
    reporterId = rec.getString("reporterId");
    title = rec.getString("title");
    comment = typeof req.comment === "string" ? req.comment.trim() : "";
    const log = new Record(txApp.findCollectionByNameOrId("admin_logs"));
    log.load({
      actorId: actor.id,
      actorName: actor.name,
      action: "update",
      targetCollection: "reports",
      recordId: rec.id,
      recordLabel: `Signalement : ${title}`,
      changes: { [res.notify || "mise à jour"]: game.reportStatusLabel(res.status) },
      createdAtMs: now,
    });
    txApp.save(log);
  });
  if (notifyText && reporterId && reporterId !== game.AUTO_REPORTER_ID) {
    try {
      notify($app, reporterId, [{ kind: "report", title: "Ton signalement a avancé", message: `${title} — ${notifyText}`, createdAtMs: now, read: false }]);
    } catch (_) {
      /* facultatif */
    }
    const lines = [`Ton signalement « ${title} » a été mis à jour : ${notifyText}.`];
    if (comment) lines.push(`Message de l'équipe :\n${comment}`);
    if (out.resolution) lines.push(`Résolution :\n${out.resolution}`);
    sendMail(userEmail(reporterId), `[Cosmic Empires] ${title} — ${game.reportStatusLabel(out.status)}`, lines, appUrl(`/game/signalements?id=${out.id}`));
  }
  return e.json(200, out);
}

/** GET /api/cosmic/admin/reports/config — options disponibles (e-mail, GitHub). */
function adminReportConfig(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  return e.json(200, { email: mailEnabled(), github: !!($os.getenv("COSMIC_GITHUB_TOKEN") && $os.getenv("COSMIC_GITHUB_REPO")) });
}

/** POST /api/cosmic/admin/reports/github { id } — crée l'issue GitHub liée. */
function adminReportGithub(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const token = $os.getenv("COSMIC_GITHUB_TOKEN");
  const repo = $os.getenv("COSMIC_GITHUB_REPO");
  if (!token || !repo) throw new BadRequestError("GitHub n'est pas configuré (variables COSMIC_GITHUB_TOKEN et COSMIC_GITHUB_REPO).");
  const game = loadGame();
  const req = body(e);
  const rec = findOrNull($app, "reports", String(req.id || ""));
  if (!rec) throw new NotFoundError("Signalement introuvable.");
  if (rec.getString("githubUrl")) return e.json(200, reportJson(rec));
  const report = reportJson(rec);
  const labels = { bug: "bug", display: "bug", balance: "equilibrage", account: "compte", idea: "enhancement", other: "signalement" };
  const res = $http.send({
    url: `https://api.github.com/repos/${repo}/issues`,
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "cosmic-empires" },
    body: JSON.stringify({ title: `[Joueur] ${report.title}`, body: game.githubIssueBody(report, appUrl(`/game/admin?onglet=reports&signalement=${rec.id}`)), labels: [labels[report.category] || "signalement"] }),
    timeout: 20,
  });
  if (res.statusCode < 200 || res.statusCode >= 300) throw new BadRequestError(`GitHub a refusé la création (HTTP ${res.statusCode}).`);
  const url = (res.json && res.json.html_url) || "";
  const now = Date.now();
  const actor = actorOf(e);
  rec.set("githubUrl", url);
  rec.set("history", report.history.concat([{ kind: "comment", atMs: now, byId: actor.id, byName: actor.name, staff: true, text: "Suivi technique ouvert sur GitHub." }]));
  rec.set("updatedAtMs", now);
  if (rec.getString("status") === "new") rec.set("status", "in_progress");
  $app.save(rec);
  return e.json(200, reportJson(rec));
}

module.exports = { adminBackupStatus, checkBackups, reportCreateRequest, reportClientError, reportComment, reportSeen, adminReportUpdate, adminReportConfig, adminReportGithub, autoEndMaintenance, adminList, adminManage, readMaintenance, closedDuringMaintenance, maintenanceGuard, adminMaintenance, processPirates, piratesRequest, adminReset, allianceRequest, allianceIntel, processAllianceResearch, closeSeason, purgeDebris, syncProfile, deleteProfile, launchFleetRequest, lastAttackOnTarget, processDueFleets, isGameAdmin, logAdminAction, body, toPlain, loadGame, applyContent, findOrNull, loadPlayer, savePlayer, notify, asHttpError };
