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
  if (["attack", "spy", "recycle", "patrol", "garrison"].indexOf(mission) < 0) throw new BadRequestError("Mission inconnue.");
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

module.exports = { allianceRequest, allianceIntel, processAllianceResearch, closeSeason, purgeDebris, syncProfile, deleteProfile, launchFleetRequest, lastAttackOnTarget, processDueFleets, isGameAdmin, logAdminAction, body, toPlain, loadGame, applyContent, findOrNull, loadPlayer, savePlayer, notify, asHttpError };
