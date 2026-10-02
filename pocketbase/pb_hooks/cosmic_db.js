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
  // v3.8 : progression du défi hebdomadaire (écart des compteurs suivis).
  try {
    recordChallengeProgress(txApp, game, toPlain(loaded.rec), player);
  } catch (err) {
    console.log(`[cosmic] défi hebdomadaire : ${err}`);
  }
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
/** Champs d'un joueur dont la modification par un administrateur exige un motif. */
const REASON_FIELDS = ["resources", "units", "buildings", "techLevels", "xp", "seasonXp", "colonies"];

function adminReason(e) {
  try {
    return String((e.requestInfo().body || {}).adminReason || "").trim().slice(0, 300);
  } catch (_) {
    return "";
  }
}

/** Un administrateur du jeu (hors superutilisateur PocketBase) qui modifie
 *  ressources, unités, bâtiments, technologies ou XP d'un joueur doit
 *  donner un motif (champ adminReason de la requête, consigné au journal). */
function requireAdminReason(e) {
  if (e.record.collection().name !== "players" || e.hasSuperuserAuth() || !isGameAdmin(e)) return;
  const before = toPlain(e.record.original());
  const after = toPlain(e.record);
  const changed = REASON_FIELDS.filter((f) => JSON.stringify(before[f]) !== JSON.stringify(after[f]));
  if (changed.length > 0 && adminReason(e).length < 5) throw new BadRequestError("Indique un motif (5 caractères au moins) pour modifier ce joueur.");
}

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
      reason: adminReason(e),
      createdAtMs: Date.now(),
    });
    $app.save(log);
  } catch (err) {
    console.log(`[cosmic] journal admin impossible : ${err}`);
  }
}

/* ---------- Fiche publique (collection profiles) ---------- */

const PROFILE_FIELDS = ["pseudo", "xp", "seasonId", "seasonXp", "createdAtMs", "lastDefeatAtMs", "lastAttackAtMs", "allianceId", "activeTitle", "ascensions", "ascendedAtMs"];

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
  // v3.5 : colonies publiques (identifiant et nom seulement).
  let colonies = [];
  try {
    const raw = JSON.parse(player.getString("colonies") || "[]");
    colonies = (Array.isArray(raw) ? raw : []).map((c) => ({ id: c.id, name: c.name }));
  } catch (_) {
    colonies = [];
  }
  let current = "[]";
  try {
    current = JSON.stringify(JSON.parse(profile.getString("planets") || "[]"));
  } catch (_) {
    current = "";
  }
  if (current !== JSON.stringify(colonies)) {
    profile.set("planets", colonies);
    changed = true;
  }
  // v3.7 : faits d'armes publics (titres, succès, combats, Léviathan, guerres).
  const feats = JSON.stringify(profileFeats(player));
  let currentFeats = "";
  try {
    currentFeats = JSON.stringify(JSON.parse(profile.getString("feats") || "null"));
  } catch (_) {
    currentFeats = "";
  }
  if (currentFeats !== feats) {
    profile.set("feats", JSON.parse(feats));
    changed = true;
  }
  if (changed) app.save(profile);
}

function parseJsonField(record, field, fallback) {
  try {
    const value = JSON.parse(record.getString(field) || "null");
    return value === null || value === undefined ? fallback : value;
  } catch (_) {
    return fallback;
  }
}

function profileFeats(player) {
  const stats = parseJsonField(player, "stats", {}) || {};
  const titles = parseJsonField(player, "titles", []);
  const achievements = parseJsonField(player, "unlockedAchievements", []);
  const labels = [];
  (Array.isArray(titles) ? titles : []).forEach((t) => {
    if (t && t.label && labels.indexOf(t.label) < 0) labels.push(String(t.label));
  });
  return {
    titles: labels.slice(-12),
    achievements: Array.isArray(achievements) ? achievements.length : 0,
    victories: player.getInt("victories"),
    defeats: player.getInt("defeats"),
    missions: Number(stats.missions) || 0,
    expeditions: Number(stats.expeditions) || 0,
    leviathanKills: Number(stats.leviathanKills) || 0,
    warsWon: Number(stats.warsWon) || 0,
    bounties: Number(stats.bounties) || 0,
    kesh: keshFeats(parseJsonField(player, "bounties", {}) || {}),
    showcase: showcaseOf(player),
  };
}

/** v3.9 : rang dans l'Essaim, cosmétiques et Voile de chitine (fiche publique). */
/** v4.0 : bannière, emblème, devise, officiers en poste et reliques équipées. */
function showcaseOf(player) {
  try {
    const game = loadGame();
    applyContent($app, game);
    return game.publicShowcase({
      pirates: parseJsonField(player, "pirates", null),
      bounties: parseJsonField(player, "bounties", null),
      stats: parseJsonField(player, "stats", null),
      profileStyle: parseJsonField(player, "profileStyle", null),
      commanders: parseJsonField(player, "commanders", null),
      relics: parseJsonField(player, "relics", null),
      ascensions: player.getInt("ascensions"),
    });
  } catch (err) {
    console.log(`[cosmic] vitrine du profil : ${err}`);
    return null;
  }
}

function keshFeats(b) {
  const owned = Array.isArray(b.owned) ? b.owned : [];
  const rep = Number(b.reputation) || 0;
  const ranks = [0, 10, 30, 70, 150];
  let rank = 1;
  ranks.forEach((at, i) => {
    if (rep >= at) rank = i + 1;
  });
  return { rank: rep > 0 ? rank : 0, frame: owned.indexOf("frame") >= 0, emblem: owned.indexOf("emblem") >= 0, shieldUntilMs: Number(b.shieldUntilMs) || 0 };
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
  // v3.5 : délai propre à chaque planète (planète mère ou colonie).
  const onColony = !!loadGame().colonyOwnerUid(d);
  const reports = txApp.findRecordsByFilter(
    "battle_reports",
    onColony ? "attackerUid = {:a} && planetId = {:d}" : "attackerUid = {:a} && defenderUid = {:d} && planetId = ''",
    "-timestamp",
    1,
    0,
    { a, d },
  );
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

function fleetFromRecord(rec, publicView) {
  const f = toPlain(rec);
  f.units = f.units || {};
  // v4.0 : flotte leurrée, la vraie composition est dans un champ caché.
  if (publicView !== true) {
    const real = parseJsonField(rec, "trueUnits", null);
    if (real && typeof real === "object" && Object.keys(real).length > 0) f.units = real;
    f.boosts = parseJsonField(rec, "boosts", null);
  }
  f.loot = f.loot || null;
  f.returnAtMs = f.returnAtMs || null;
  f.transport = f.transport || null;
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
  if (mission === "expedition") return expeditionStep(txApp, game, rec, now, 1);
  if (mission === "leviathan") return leviathanArrival(txApp, game, rec, now);
  if (mission === "transport") return transportArrival(txApp, game, rec, now);
  if (mission === "bounty") return bountyArrival(txApp, game, rec, now);
  if (mission === "elite") return eliteArrival(txApp, game, rec, now);
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
  // v3.5 : sondes envoyées sur une colonie (identifiant <uid>-c<n>).
  const colonyOwner = game.colonyOwnerUid(fleet.targetUid);
  const targetUid = colonyOwner || fleet.targetUid;
  const target = findOrNull(txApp, "players", targetUid) ? loadPlayer(txApp, game, targetUid) : null;
  if (!spy || !target) {
    rec.set("status", spy ? "returning" : "done");
    rec.set("returnAtMs", spy ? now + tripMs : null);
    rec.set("outcome", "none");
    txApp.save(rec);
    return;
  }
  // v3.9 : Brouilleur d'essaim de la cible, les sondes rentrent bredouilles.
  if (game.consumeJammer(target.player)) {
    savePlayer(txApp, game, target, target.player, target.queues);
    notify(txApp, fleet.ownerUid, [{ kind: "spy", title: "Sondes brouillées", message: `Un brouilleur kesh'vaar protège ${fleet.targetPseudo} : tes sondes rentrent sans rapport.`, createdAtMs: now, read: false }]);
    notify(txApp, targetUid, [{ kind: "spy-detected", title: "Espionnage brouillé", message: `Ton brouilleur d'essaim a aveuglé les sondes de ${fleet.ownerPseudo}.`, createdAtMs: now, read: false }]);
    rec.set("outcome", "jammed");
    rec.set("status", "returning");
    rec.set("returnAtMs", now + tripMs);
    txApp.save(rec);
    return;
  }
  const targetFleets = txApp
    .findRecordsByFilter("fleets", "ownerUid = {:u} && status != 'done'", "arriveAtMs", 50, 0, { u: targetUid })
    .map((r) => fleetFromRecord(r, true));
  const probes = Object.keys(fleet.units).reduce((sum, k) => sum + (fleet.units[k] || 0), 0);
  const out = game.resolveSpyArrival({
    now,
    spy: spy.player,
    spyQueues: spy.queues,
    target: target.player,
    targetQueues: target.queues,
    targetFleets,
    targetGarrisons: colonyOwner ? [] : stationedGarrisons(txApp, fleet.targetUid).map(fleetFromRecord),
    probes,
    colonyId: colonyOwner ? fleet.targetUid : undefined,
  });
  const report = new Record(txApp.findCollectionByNameOrId("spy_reports"));
  report.load(out.report);
  txApp.save(report);
  notify(txApp, fleet.ownerUid, out.spyNotifications);
  notify(txApp, targetUid, out.targetNotifications);
  // v4.0 : sondes abattues, l'Espionne en poste de la cible progresse.
  if (out.detected) {
    game.grantCommanderXp(target.player, "spy", game.COMMANDER_XP.probesCaught);
    target.rec.set("commanders", target.player.commanders || null);
    txApp.save(target.rec);
  }
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

/** Transport (v3.5) : livraison à la colonie ou chargement, puis retour. */
function transportArrival(txApp, game, rec, now) {
  const fleet = fleetFromRecord(rec);
  const tripMs = Math.max(0, fleet.arriveAtMs - fleet.departAtMs);
  if (!findOrNull(txApp, "players", fleet.ownerUid)) {
    rec.set("status", "done");
    txApp.save(rec);
    return;
  }
  const owner = loadPlayer(txApp, game, fleet.ownerUid);
  const out = game.performTransportArrival(owner.player, owner.queues, fleet, now);
  savePlayer(txApp, game, owner, out.owner, out.queues);
  notify(txApp, fleet.ownerUid, out.notifications);
  rec.set("loot", out.loot);
  rec.set("outcome", out.outcome);
  rec.set("status", "returning");
  rec.set("returnAtMs", now + tripMs);
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
  const out = game.resolveLairAssault(faction, player, loaded.queues, fleet.units, rec.getFloat("power"), now, rec.getString("formation"));
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
  // v3.5 : attaque d'une colonie (identifiant <uid>-c<n>) : son propriétaire défend.
  const colonyOwner = game.colonyOwnerUid(fleet.targetUid);
  const defenderUid = colonyOwner || fleet.targetUid;
  const defender = findOrNull(txApp, "players", defenderUid) ? loadPlayer(txApp, game, defenderUid) : null;
  if (!attacker) {
    rec.set("status", "done");
    txApp.save(rec);
    return;
  }
  // Garnisons alliées chez le défenseur : elles combattent à ses côtés.
  const garrisonRecs = defender && !colonyOwner ? stationedGarrisons(txApp, fleet.targetUid).filter((g) => findOrNull(txApp, "players", g.getString("ownerUid"))) : [];
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
        defenderUid,
        defender: defender.player,
        defenderQueues: defender.queues,
        fleet: fleet.units,
        lastAttackOnTargetMs: null,
        defenderXpLostLast24h: defenderXpLostLast24h(txApp, game, defenderUid, now),
        colonyId: colonyOwner ? fleet.targetUid : undefined,
        inFlight: true,
        garrisons,
        formation: rec.getString("formation"),
        boosts: fleet.boosts || undefined,
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
  game.clearDecoy(result.attacker, rec.id);
  savePlayer(txApp, game, attacker, result.attacker, result.attackerQueues);
  savePlayer(txApp, game, defender, result.defender, result.defenderQueues);
  notify(txApp, fleet.ownerUid, result.notifications);
  notify(txApp, defenderUid, result.defenderNotifications);

  const report = new Record(txApp.findCollectionByNameOrId("battle_reports"));
  report.load(result.report);
  txApp.save(report);
  // v3.2 : points de guerre si les deux alliances sont en guerre.
  scoreWarBattle(txApp, game, attacker.rec.getString("allianceId"), defender.rec.getString("allianceId"), attacker.player.pseudo, defender.player.pseudo, result.combat.outcome, result.loot, now);

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
  rec.set("trueUnits", null);
  rec.set("loot", result.loot || {});
  rec.set("reportId", report.id);
  rec.set("outcome", result.combat.outcome);
  rec.set("status", anyLeft ? "returning" : "done");
  rec.set("returnAtMs", anyLeft ? now + tripMs : null);
  txApp.save(rec);
}

function resolveFleetReturn(txApp, game, rec, now) {
  if (rec.getString("mission") === "expedition") return expeditionStep(txApp, game, rec, now, 2);
  const fleet = fleetFromRecord(rec);
  if (findOrNull(txApp, "players", fleet.ownerUid)) {
    const owner = loadPlayer(txApp, game, fleet.ownerUid);
    const out = game.performFleetReturn(owner.player, owner.queues, fleet, now);
    game.clearDecoy(out.owner, rec.id);
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
    `((status = "outbound" && arriveAtMs <= {:now}) || (status = "returning" && returnAtMs <= {:now}) || ((status = "stationed" || status = "decision") && stationedUntilMs <= {:now}))${scope}`,
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
        else if (status === "decision" && rec.getFloat("stationedUntilMs") <= now) expeditionDecide(txApp, game, rec, now, "toll");
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
  const targetUid =
    mission === "patrol" || mission === "expedition"
      ? attackerUid
      : mission === "leviathan"
        ? "leviathan"
        : mission === "transport"
          ? String(body.colonyId || "")
          : mission === "bounty"
            ? body.bountyId
              ? `bounty_${body.bountyId}`
              : ""
            : mission === "elite"
              ? "bounty_elite"
              : String(body.targetUid || "");
  if (!targetUid) throw new BadRequestError("Cible manquante.");
  if (["attack", "spy", "recycle", "patrol", "garrison", "lair", "expedition", "leviathan", "transport", "bounty", "elite"].indexOf(mission) < 0) throw new BadRequestError("Mission inconnue.");
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
    // v3.5 : une attaque ou un espionnage peut viser une colonie (<uid>-c<n>).
    const colonyOwner = mission === "attack" || mission === "spy" ? game.colonyOwnerUid(targetUid) : null;
    if (mission === "attack" || mission === "spy" || mission === "garrison") {
      if (!db.findOrNull(txApp, "players", colonyOwner || targetUid)) throw new NotFoundError("Ce joueur est introuvable.");
      target = db.loadPlayer(txApp, game, colonyOwner || targetUid, "Ce joueur est introuvable.").player;
    } else if (mission === "recycle") {
      debris = loadDebris(txApp, targetUid).field;
    }
    // v3.8 : pas d'attaque entre alliances liées par un pacte de non-agression.
    if (mission === "attack" && target) {
      const pact = bindingPact(txApp, game, attacker.rec.getString("allianceId"), target.allianceId, now);
      if (pact) {
        const tag = pact.allianceA === target.allianceId ? pact.tagA : pact.tagB;
        throw new BadRequestError(`Pacte de non-agression avec [${tag}] : attaque impossible${pact.status === "ending" ? " jusqu'à la fin du préavis" : ""}.`);
      }
    }
    let expeditionsActive = 0;
    let expeditionsToday = 0;
    let leviathan = null;
    if (mission === "expedition") {
      expeditionsActive = txApp.findRecordsByFilter("fleets", 'ownerUid = {:u} && mission = "expedition" && status != "done"', "", 5, 0, { u: attackerUid }).length;
      expeditionsToday = txApp.findRecordsByFilter("fleets", 'ownerUid = {:u} && mission = "expedition" && departAtMs >= {:t}', "", 20, 0, { u: attackerUid, t: game.utcDayStart(now) }).length;
    }
    if (mission === "leviathan") {
      try {
        leviathan = game.checkLeviathanLaunch(readLeviathan(txApp, game), attackerUid, attacker.player.pseudo, now);
      } catch (err) {
        throw db.asHttpError(game, err);
      }
    }
    let elite = null;
    if (mission === "elite") {
      try {
        elite = game.checkEliteLaunch(readElite(txApp, game), attacker.player, now);
      } catch (err) {
        throw db.asHttpError(game, err);
      }
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
        targetColonyId: colonyOwner ? targetUid : undefined,
        lastAttackOnTargetMs: mission === "attack" ? db.lastAttackOnTarget(txApp, attackerUid, targetUid) : null,
        patrolMinutes: Number(body.minutes) || 0,
        garrisonHours: Number(body.hours) || 0,
        garrisonsAtHost,
        atWar: mission === "attack" && !!target && !!activeWarRecord(txApp, game, attacker.rec.getString("allianceId"), target.allianceId, now),
        expeditionHours: Number(body.hours) || 0,
        expeditionsActive,
        expeditionsToday,
        formation: game.isFormation(body.formation) ? body.formation : "balanced",
        transport: mission === "transport" ? { colonyId: body.colonyId, direction: body.direction, cargo: body.cargo } : undefined,
        bountyId: mission === "bounty" ? String(body.bountyId || "") : undefined,
        eliteName: elite ? game.describeElite(elite).name : undefined,
        capsules: mission === "attack" ? body.capsules : undefined,
      });
    } catch (err) {
      throw db.asHttpError(game, err);
    }
    db.savePlayer(txApp, game, attacker, out.attacker, out.attackerQueues);
    db.notify(txApp, attackerUid, out.attackerNotifications);
    if (out.defenderNotifications.length > 0) db.notify(txApp, target ? target.uid : targetUid, out.defenderNotifications);
    const rec = new Record(txApp.findCollectionByNameOrId("fleets"));
    rec.load(out.fleet);
    // v3.5 : propriétaire de la colonie visée (il voit l'attaque approcher).
    if (colonyOwner && mission === "attack") rec.set("targetOwnerUid", colonyOwner);
    // v3.0 : formation choisie au lancement (attaque et repaire).
    if (["attack", "lair", "expedition", "leviathan", "bounty", "elite"].indexOf(mission) >= 0) rec.set("formation", game.isFormation(body.formation) ? body.formation : "balanced");
    // v4.0 : capsules (champs cachés) ; le leurre montre une fausse composition.
    const caps = out.capsules;
    const boosted = !!caps && Object.keys(caps.boosts).length > 0;
    if (boosted) rec.set("boosts", caps.boosts);
    if (caps && caps.fakeUnits) {
      rec.set("trueUnits", out.fleet.units);
      rec.set("units", caps.fakeUnits);
    }
    // Option C : l'Espionne en poste du défenseur peut flairer une anomalie chimique.
    const anomaly = boosted && target && Math.random() < game.anomalyChance(target);
    if (anomaly) rec.set("anomaly", true);
    txApp.save(rec);
    if (caps && caps.fakeUnits) {
      game.recordDecoy(out.attacker, rec.id, out.fleet.units);
      attacker.rec.set("synthesis", out.attacker.synthesis);
      txApp.save(attacker.rec);
    }
    if (anomaly) {
      db.notify(txApp, target.uid, [
        { kind: "spy-detected", title: "Anomalie chimique", message: `Ton Espionne a repéré des traces de synthèse sur la flotte de ${attacker.player.pseudo} : elle embarque des capsules (stimulant ou brouilleur).`, createdAtMs: now, read: false },
      ]);
    }
    // Léviathan : le délai entre deux assauts part du lancement.
    if (leviathan) writeLeviathan(txApp, leviathan);
    if (elite) writeElite(txApp, game, elite);
    response = Object.assign({ id: rec.id, formation: rec.getString("formation") }, out.fleet, { anomaly: !!anomaly });
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
    // v3.2 : +10 % par guerre gagnée pendant la saison.
    const warBonuses = game.warSeasonBonuses(txApp.findRecordsByFilter("alliance_wars", "seasonId = {:s} && winnerId != ''", "", 500, 0, { s: seasonId }).map(warJson), seasonId);
    const allianceStanding = game.allianceStandings(entries.map((p) => ({ allianceId: p.allianceId, seasonXp: game.seasonXpFor(p, seasonId) })), warBonuses);
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

const ALLIANCE_FIELDS = ["name", "tag", "createdBy", "createdAtMs", "members", "memberPseudos", "roles", "treasury", "research", "activeResearch", "distributions", "projects", "projectContributors"];

function allianceFromRecord(rec) {
  const a = toPlain(rec);
  a.members = a.members || [];
  a.memberPseudos = a.memberPseudos || {};
  a.roles = a.roles || {};
  a.treasury = a.treasury || {};
  a.research = a.research || {};
  a.activeResearch = a.activeResearch || null;
  a.distributions = a.distributions || { day: "", count: 0 };
  a.projects = a.projects || {};
  a.projectContributors = a.projectContributors || {};
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
    // Prochaine échéance : recherche ou construction d'un projet (v3.3).
    rec.set("researchEndMs", loadGame().allianceNextDueMs(out.alliance));
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
        a.set("projects", {});
        a.set("projectContributors", {});
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

/* ---------- Guerres d'alliance (v3.2) ---------- */

function warsOf(txApp, ids) {
  const parts = ids.filter(Boolean).map((_, i) => `attackerId = {:a${i}} || defenderId = {:a${i}}`);
  if (parts.length === 0) return [];
  const params = {};
  ids.filter(Boolean).forEach((id, i) => (params[`a${i}`] = id));
  return txApp.findRecordsByFilter("alliance_wars", parts.join(" || "), "-declaredAtMs", 200, 0, params);
}

function warJson(rec) {
  const w = toPlain(rec);
  w.log = w.log || [];
  return w;
}

function saveWar(txApp, rec, war) {
  ["status", "scoreAttacker", "scoreDefender", "log", "winnerId", "surrenderedBy", "endedAtMs", "rewarded", "seasonId", "titleUntilMs"].forEach((f) => rec.set(f, war[f]));
  txApp.save(rec);
}

/** Canal diplomatique : prévient les membres des deux alliances (sauf
 *  l'auteur). Une seule notification non lue par pacte et par joueur toutes
 *  les 10 minutes, pour ne pas inonder la cloche pendant une discussion. */
function notifyPactMessage(txApp, pact, authorUid, authorPseudo, authorTag, text, now) {
  const link = `/game/alliance?onglet=diplomatie&pacte=${pact.id}`;
  const otherTag = authorTag === pact.tagA ? pact.tagB : pact.tagA;
  const excerpt = text.length > 90 ? `${text.slice(0, 89)}…` : text;
  [pact.allianceA, pact.allianceB].forEach((allianceId) => {
    const rec = findOrNull(txApp, "alliances", allianceId);
    if (!rec) return;
    const ownSide = allianceId === (authorTag === pact.tagA ? pact.allianceA : pact.allianceB);
    (allianceFromRecord(rec).members || []).forEach((uid) => {
      if (uid === authorUid || mutedNotif(txApp, uid, "pactMessages")) return;
      try {
        const recent = txApp.findRecordsByFilter("notifications", "player_id = {:u} && link = {:l} && read = false && createdAtMs > {:t}", "", 1, 0, { u: uid, l: link, t: now - 10 * 60000 });
        if (recent.length > 0) return;
        notify(txApp, uid, [
          {
            kind: "alliance",
            title: `Canal diplomatique [${ownSide ? otherTag : authorTag}]`,
            message: `[${authorTag}] ${authorPseudo} : ${excerpt}`,
            createdAtMs: now,
            read: false,
            link,
          },
        ]);
      } catch (_) {
        /* facultatif */
      }
    });
  });
}

/** v4.0 : le joueur a coupé ce type de notification dans ses réglages. */
function mutedNotif(txApp, uid, key) {
  const rec = findOrNull(txApp, "players", uid);
  if (!rec) return false;
  const prefs = parseJsonField(rec, "notifPrefs", {}) || {};
  return prefs[key] === false;
}

function notifyAlliance(txApp, allianceId, title, message, now) {
  const rec = findOrNull(txApp, "alliances", allianceId);
  if (!rec) return;
  (allianceFromRecord(rec).members || []).forEach((uid) => {
    if (mutedNotif(txApp, uid, "allianceEvents")) return;
    try {
      notify(txApp, uid, [{ kind: "alliance", title, message, createdAtMs: now, read: false }]);
    } catch (_) {
      /* facultatif */
    }
  });
}

/** Guerre active entre les alliances de deux joueurs (enregistrement), ou null. */
function activeWarRecord(txApp, game, allianceA, allianceB, now) {
  if (!allianceA || !allianceB || allianceA === allianceB) return null;
  const recs = warsOf(txApp, [allianceA]);
  const plain = recs.map((r) => warJson(r));
  const w = game.activeWarBetween(plain, allianceA, allianceB, now);
  return w ? recs[plain.indexOf(w)] : null;
}

/** Récompenses du vainqueur (une fois) : trésor, titre temporaire, bonus de saison. */
function rewardWar(txApp, game, war, now) {
  if (war.status !== "ended" || war.rewarded) return war;
  const next = Object.assign({}, war, { rewarded: true });
  const loserId = war.winnerId ? (war.winnerId === war.attackerId ? war.defenderId : war.attackerId) : "";
  if (war.winnerId) {
    const rec = findOrNull(txApp, "alliances", war.winnerId);
    if (rec) {
      const al = game.warTreasuryReward(allianceFromRecord(rec));
      rec.set("treasury", al.treasury);
      txApp.save(rec);
      (al.members || []).forEach((uid) => {
        if (!findOrNull(txApp, "players", uid)) return;
        const loaded = loadPlayer(txApp, game, uid);
        const p = loaded.player;
        if (!(p.titles || []).some((t) => t.label === game.WAR_RULES.title)) {
          p.titles = (p.titles || []).concat([{ label: game.WAR_RULES.title, seasonId: `war:${war.id}`, rank: 1 }]);
          p.activeTitle = game.WAR_RULES.title;
        }
        p.stats = Object.assign({}, p.stats || {}, { warsWon: ((p.stats && p.stats.warsWon) || 0) + 1 });
        savePlayer(txApp, game, loaded, p, loaded.queues);
      });
    }
    next.seasonId = game.currentSeasonId(now);
    next.titleUntilMs = now + game.WAR_RULES.titleDays * 86400000;
  }
  const tag = (id) => (id === war.attackerId ? war.attackerTag : war.defenderTag);
  const summary = war.winnerId
    ? `Victoire de [${tag(war.winnerId)}] (${war.scoreAttacker} – ${war.scoreDefender})${war.surrenderedBy ? " par reddition" : ""}.`
    : `Égalité (${war.scoreAttacker} – ${war.scoreDefender}) : pas de vainqueur.`;
  [war.attackerId, war.defenderId].forEach((id) => {
    const won = id === war.winnerId;
    notifyAlliance(
      txApp,
      id,
      won ? "Guerre gagnée !" : id === loserId ? "Guerre perdue" : "Guerre terminée",
      won ? `${summary} Le trésor reçoit ${game.formatInt(game.WAR_RULES.rewardScrap)} ferraille et ${game.formatInt(game.WAR_RULES.rewardEnergy)} énergie ; titre « ${game.WAR_RULES.title} » pour ${game.WAR_RULES.titleDays} jours.` : summary,
      now,
    );
  });
  return next;
}

/** POST /api/cosmic/war { action: "declare", targetAllianceId } | { action: "surrender", warId } */
function warRequest(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const req = body(e);
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    const player = findOrNull(txApp, "players", uid);
    const allianceId = player ? player.getString("allianceId") : "";
    if (!allianceId) throw new BadRequestError("Tu n'as pas d'alliance.");
    const ownRec = findOrNull(txApp, "alliances", allianceId);
    if (!ownRec) throw new BadRequestError("Alliance introuvable.");
    const own = allianceFromRecord(ownRec);
    const pseudo = player.getString("pseudo");
    if (req.action === "declare") {
      const targetRec = findOrNull(txApp, "alliances", String(req.targetAllianceId || ""));
      if (!targetRec) throw new NotFoundError("Alliance introuvable.");
      const target = allianceFromRecord(targetRec);
      if (bindingPact(txApp, game, own.id, target.id, now)) throw new BadRequestError(`Un pacte de non-agression vous lie à [${target.tag}] : rompez-le d'abord (préavis de ${game.DIPLOMACY_RULES.breakNoticeHours} h).`);
      let res;
      try {
        res = game.declareWar({ actorUid: uid, actorPseudo: pseudo, own, target, wars: warsOf(txApp, [own.id, target.id]).map(warJson), now });
      } catch (err) {
        throw asHttpError(game, err);
      }
      ownRec.set("treasury", res.own.treasury);
      txApp.save(ownRec);
      const rec = new Record(txApp.findCollectionByNameOrId("alliance_wars"));
      rec.load(res.war);
      txApp.save(rec);
      const startText = `Début des hostilités dans ${game.WAR_RULES.prepHours} h, pour ${game.WAR_RULES.durationHours} h.`;
      notifyAlliance(txApp, own.id, "Guerre déclarée", `${pseudo} a déclaré la guerre à [${target.tag}] ${target.name}. ${startText}`, now);
      notifyAlliance(txApp, target.id, "Déclaration de guerre !", `[${own.tag}] ${own.name} vous déclare la guerre. ${startText}`, now);
      out = warJson(rec);
    } else if (req.action === "surrender") {
      const rec = findOrNull(txApp, "alliance_wars", String(req.warId || ""));
      if (!rec) throw new NotFoundError("Guerre introuvable.");
      let war;
      try {
        war = game.surrender(warJson(rec), own, uid, pseudo, now);
      } catch (err) {
        throw asHttpError(game, err);
      }
      war = rewardWar(txApp, game, war, now);
      saveWar(txApp, rec, war);
      out = war;
    } else throw new BadRequestError("Action inconnue.");
  });
  return e.json(200, out);
}

/** Points d'un combat entre deux alliances en guerre (appelé à l'arrivée d'une attaque). */
function scoreWarBattle(txApp, game, attackerAllianceId, defenderAllianceId, attackerPseudo, defenderPseudo, outcome, loot, now) {
  const rec = activeWarRecord(txApp, game, attackerAllianceId, defenderAllianceId, now);
  if (!rec) return;
  const lootTotal = Object.keys(loot || {}).reduce((a, k) => a + (loot[k] || 0), 0);
  const war = game.scoreBattle(warJson(rec), attackerAllianceId, attackerPseudo, defenderPseudo, outcome, lootTotal, now);
  saveWar(txApp, rec, war);
}

/** Tâche planifiée : début des hostilités, fin à l'échéance, fin des titres. */
function warTick(now) {
  const game = loadGame();
  const recs = $app.findRecordsByFilter("alliance_wars", 'status != "ended" || (titleUntilMs > 0 && titleUntilMs <= {:n})', "", 200, 0, { n: now });
  recs.forEach((r) => {
    try {
      $app.runInTransaction((txApp) => {
        applyContent(txApp, game);
        const rec = txApp.findRecordById("alliance_wars", r.id);
        let war = warJson(rec);
        if (war.status === "preparing" && now >= war.startMs && now < war.endMs) {
          war.status = "active";
          war.log = war.log.concat([{ atMs: now, text: "Les hostilités commencent." }]);
          [war.attackerId, war.defenderId].forEach((id) => notifyAlliance(txApp, id, "La guerre commence !", `[${war.attackerTag}] contre [${war.defenderTag}] : ${game.WAR_RULES.durationHours} h pour marquer des points.`, now));
        }
        if (war.status !== "ended" && now >= war.endMs) {
          war = game.concludeWar(Object.assign({}, war, { status: "active" }), now);
          war = rewardWar(txApp, game, war, now);
        }
        if (war.titleUntilMs > 0 && now >= war.titleUntilMs && war.winnerId) {
          const al = findOrNull(txApp, "alliances", war.winnerId);
          (al ? allianceFromRecord(al).members : []).forEach((uid) => {
            if (!findOrNull(txApp, "players", uid)) return;
            const loaded = loadPlayer(txApp, game, uid);
            const p = loaded.player;
            p.titles = (p.titles || []).filter((t) => t.seasonId !== `war:${war.id}`);
            if (p.activeTitle === game.WAR_RULES.title && !p.titles.some((t) => t.label === game.WAR_RULES.title)) p.activeTitle = p.titles.length ? p.titles[0].label : "";
            savePlayer(txApp, game, loaded, p, loaded.queues);
          });
          war.titleUntilMs = 0;
        }
        saveWar(txApp, rec, war);
      });
    } catch (err) {
      console.log(`[cosmic] guerre ${r.id} : ${err}`);
    }
  });
  return recs.length;
}

/* ---------- Expéditions (v3.1) ---------- */

function expeditionFleet(rec) {
  const fleet = fleetFromRecord(rec);
  fleet.id = rec.id;
  fleet.expedition = fleet.expedition || { hours: Math.round((fleet.durationMs || 0) / 3600000), log: [], pending: null };
  fleet.expedition.formation = rec.getString("formation") || fleet.expedition.formation || "balanced";
  return fleet;
}

function saveExpeditionFleet(txApp, rec, fleet) {
  rec.set("units", fleet.units);
  rec.set("loot", fleet.loot);
  rec.set("expedition", fleet.expedition);
  txApp.save(rec);
}

/** Fin d'expédition : survivants, butin et XP rendus au joueur. */
function finishExpeditionFleet(txApp, game, rec, fleet, player, owner, queues, notes, now) {
  notes.push(game.finishExpedition(player, fleet, now));
  game.completeFleetReturn(player, fleet, now);
  savePlayer(txApp, game, owner, player, queues);
  notify(txApp, fleet.ownerUid, notes);
  rec.set("status", "done");
  saveExpeditionFleet(txApp, rec, fleet);
}

/** Événement d'expédition : à mi-parcours (1) ou au retour (2). */
function expeditionStep(txApp, game, rec, now, stage) {
  const fleet = expeditionFleet(rec);
  if (!findOrNull(txApp, "players", fleet.ownerUid)) {
    rec.set("status", "done");
    txApp.save(rec);
    return;
  }
  const owner = loadPlayer(txApp, game, fleet.ownerUid);
  const flushed = game.flushPlayer(owner.player, owner.queues, now);
  const player = flushed.player;
  const notes = flushed.notifications.slice();
  const res = game.rollExpeditionEvent(player, fleet, stage, now, Math.random);
  notes.push({ kind: "fleet", title: stage === 1 ? "Expédition : mi-parcours" : "Expédition : dernier secteur", message: res.text, createdAtMs: now, read: false });
  if (res.pending) {
    notes.push({ kind: "fleet", title: "Expédition : décision requise", message: `Choisis dans les ${game.EXPEDITION_RULES.choiceMinutes} min (page Missions), sinon le péage sera payé.`, createdAtMs: now, read: false });
    rec.set("status", "decision");
    rec.set("stationedUntilMs", fleet.expedition.pending.deadlineMs);
    savePlayer(txApp, game, owner, player, flushed.queues);
    notify(txApp, fleet.ownerUid, notes);
    saveExpeditionFleet(txApp, rec, fleet);
    return;
  }
  if (stage === 1) {
    rec.set("status", "returning");
    rec.set("returnAtMs", Math.max(now, fleet.departAtMs + (fleet.durationMs || 0)));
    savePlayer(txApp, game, owner, player, flushed.queues);
    notify(txApp, fleet.ownerUid, notes);
    saveExpeditionFleet(txApp, rec, fleet);
    return;
  }
  finishExpeditionFleet(txApp, game, rec, fleet, player, owner, flushed.queues, notes, now);
}

/** Décision face à une faction (joueur, ou péage par défaut à l'échéance). */
function expeditionDecide(txApp, game, rec, now, choice) {
  const fleet = expeditionFleet(rec);
  const pending = fleet.expedition.pending;
  if (!pending || !findOrNull(txApp, "players", fleet.ownerUid)) {
    rec.set("status", "done");
    txApp.save(rec);
    return;
  }
  const owner = loadPlayer(txApp, game, fleet.ownerUid);
  const flushed = game.flushPlayer(owner.player, owner.queues, now);
  const player = flushed.player;
  const notes = flushed.notifications.slice();
  const text = game.resolveExpeditionChoice(player, fleet, choice, now, Math.random);
  notes.push({ kind: "fleet", title: "Expédition : rencontre", message: text, createdAtMs: now, read: false });
  rec.set("stationedUntilMs", null);
  if (pending.stage === 1) {
    rec.set("status", "returning");
    rec.set("returnAtMs", Math.max(now, fleet.departAtMs + (fleet.durationMs || 0)));
    savePlayer(txApp, game, owner, player, flushed.queues);
    notify(txApp, fleet.ownerUid, notes);
    saveExpeditionFleet(txApp, rec, fleet);
    return;
  }
  finishExpeditionFleet(txApp, game, rec, fleet, player, owner, flushed.queues, notes, now);
}

/** POST /api/cosmic/expedition/choose { fleetId, choice: "toll" | "force" } */
function expeditionChoose(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const req = body(e);
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const rec = findOrNull(txApp, "fleets", String(req.fleetId || ""));
    if (!rec || rec.getString("ownerUid") !== uid || rec.getString("mission") !== "expedition") throw new NotFoundError("Expédition introuvable.");
    if (rec.getString("status") !== "decision") throw new BadRequestError("Aucune décision en attente.");
    try {
      expeditionDecide(txApp, game, rec, Date.now(), req.choice === "force" ? "force" : "toll");
    } catch (err) {
      throw asHttpError(game, err);
    }
    out = toPlain(txApp.findRecordById("fleets", rec.id));
  });
  return e.json(200, out);
}

/* ---------- Léviathan (v3.1) ---------- */

function readLeviathan(txApp, game) {
  try {
    const rec = (txApp || $app).findFirstRecordByData("game_config", "key", game.LEVIATHAN_KEY);
    return game.normalizeLeviathan(toPlain(rec).data);
  } catch (_) {
    return null;
  }
}

function writeLeviathan(txApp, state) {
  let rec;
  try {
    rec = txApp.findFirstRecordByData("game_config", "key", "leviathan");
  } catch (_) {
    rec = new Record(txApp.findCollectionByNameOrId("game_config"));
    rec.set("key", "leviathan");
  }
  rec.set("data", state);
  txApp.save(rec);
}

/** Récompenses versées à tous les participants (une seule fois). */
function distributeLeviathan(txApp, game, state, now) {
  if (state.rewarded || state.status === "active") return state;
  const ranking = game.leviathanRanking(state);
  ranking.forEach((c) => {
    if (!findOrNull(txApp, "players", c.uid)) return;
    const owner = loadPlayer(txApp, game, c.uid);
    const flushed = game.flushPlayer(owner.player, owner.queues, now);
    const out = game.grantLeviathanReward(state, flushed.player);
    savePlayer(txApp, game, owner, flushed.player, flushed.queues);
    const won = state.status === "killed";
    notify(txApp, c.uid, flushed.notifications.concat([
      {
        kind: "event",
        title: won ? "Le Léviathan est tombé !" : "Le Léviathan s'est retiré",
        message: `Récompense : ${game.describeGain(out.gain)}${out.title ? ` et le titre « ${game.LEVIATHAN_RULES.title} »` : ""}.${out.relic ? ` Relique : ${out.relic} !` : ""}`,
        createdAtMs: now,
        read: false,
      },
    ]));
  });
  const top = ranking[0];
  return Object.assign({}, state, {
    rewarded: true,
    titleHolder: state.status === "killed" && top ? { uid: top.uid, untilMs: now + game.LEVIATHAN_RULES.titleDays * 86400000 } : state.titleHolder,
  });
}

/** Assaut à l'arrivée : dégâts au Léviathan, pertes, demi-tour. */
function leviathanArrival(txApp, game, rec, now) {
  const fleet = fleetFromRecord(rec);
  const backAt = now + game.LEVIATHAN_RULES.flightMinutes * 60000;
  const state = readLeviathan(txApp, game);
  if (!findOrNull(txApp, "players", fleet.ownerUid)) {
    rec.set("status", "done");
    txApp.save(rec);
    return;
  }
  const owner = loadPlayer(txApp, game, fleet.ownerUid);
  if (!state) {
    rec.set("status", "returning");
    rec.set("returnAtMs", backAt);
    txApp.save(rec);
    return;
  }
  const res = game.resolveLeviathanAssault(state, owner.player, fleet.units, rec.getString("formation"), now);
  let next = res.state;
  rec.set("units", res.survivors);
  rec.set("status", "returning");
  rec.set("returnAtMs", backAt);
  rec.set("outcome", res.killed ? "attacker_win" : "draw");
  txApp.save(rec);
  // v4.0 : l'Amiral en poste progresse à chaque assaut porté.
  if (res.damage > 0) {
    game.grantCommanderXp(owner.player, "admiral", game.COMMANDER_XP.bossAssault);
    owner.rec.set("commanders", owner.player.commanders || null);
    txApp.save(owner.rec);
  }
  const lost = Object.keys(res.lost).reduce((a, k) => a + res.lost[k], 0);
  notify(txApp, fleet.ownerUid, [
    {
      kind: "combat-attacker",
      title: res.killed ? "Coup de grâce sur le Léviathan !" : "Assaut sur le Léviathan",
      message: res.damage > 0 ? `${game.formatInt(res.damage)} dégâts infligés, ${lost} vaisseau(x) perdu(s).` : "Le Léviathan n'était plus là : la flotte rentre.",
      createdAtMs: now,
      read: false,
    },
  ]);
  if (res.killed) next = distributeLeviathan(txApp, game, next, now);
  writeLeviathan(txApp, next);
}

/** Tâche planifiée : apparition, échéance, récompenses, fin du titre. */
function leviathanTick(now) {
  const game = loadGame();
  let changed = false;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    let state = readLeviathan(txApp, game);
    if (state && state.titleHolder && now >= state.titleHolder.untilMs) {
      if (findOrNull(txApp, "players", state.titleHolder.uid)) {
        const holder = loadPlayer(txApp, game, state.titleHolder.uid);
        game.removeLeviathanTitle(holder.player);
        savePlayer(txApp, game, holder, holder.player, holder.queues);
      }
      state = Object.assign({}, state, { titleHolder: null });
      changed = true;
    }
    if (state) {
      const closed = game.closeLeviathan(state, now);
      if (closed !== state) {
        state = closed;
        changed = true;
      }
      if (state.status !== "active" && !state.rewarded) {
        state = distributeLeviathan(txApp, game, state, now);
        changed = true;
      }
    }
    const win = game.leviathanWindow(now);
    if (win && (!state || state.id !== win.id) && (!state || state.status !== "active")) {
      const actives = txApp.findRecordsByFilter("players", "resourcesUpdatedAtMs >= {:t}", "", 500, 0, { t: now - 7 * 86400000 }).map((r) => toPlain(r));
      state = game.spawnLeviathan(win, actives, state);
      changed = true;
      actives.forEach((p) => {
        try {
          notify(txApp, p.id, [{ kind: "event", title: "Le Léviathan approche !", message: "Un monstre colossal menace la galaxie : unissez vos flottes avant lundi 18 h (page Léviathan).", createdAtMs: now, read: false }]);
        } catch (_) {
          /* facultatif */
        }
      });
    }
    if (state) {
      const sampled = game.recordLeviathanTimeline(state, now);
      if (sampled !== state) {
        state = sampled;
        changed = true;
      }
    }
    if (changed && state) writeLeviathan(txApp, state);
  });
  return changed;
}

/** POST /api/cosmic/admin/leviathan { action: "start" | "stop" | "resize", maxHp? } */
function adminLeviathan(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  const action = String(body(e).action || "");
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    let state = readLeviathan(txApp, game);
    if (action === "start") {
      if (state && state.status === "active" && now < state.endMs) throw new BadRequestError("Le Léviathan est déjà là.");
      const actives = txApp.findRecordsByFilter("players", "resourcesUpdatedAtMs >= {:t}", "", 500, 0, { t: now - 7 * 86400000 }).map((r) => toPlain(r));
      state = game.spawnLeviathan({ id: `lev-manual-${now}`, startMs: now, endMs: now + game.LEVIATHAN_RULES.durationHours * 3600000 }, actives, state);
    } else if (action === "stop") {
      if (!state || state.status !== "active") throw new BadRequestError("Aucun Léviathan en cours.");
      state = distributeLeviathan(txApp, game, Object.assign({}, state, { status: "failed", endedAtMs: now, endMs: now }), now);
    } else if (action === "resize") {
      const before = state ? state.maxHp : 0;
      try {
        state = game.resizeLeviathan(state, Number(body(e).maxHp), now);
      } catch (err) {
        throw asHttpError(game, err);
      }
      const log = new Record(txApp.findCollectionByNameOrId("admin_logs"));
      log.load({
        actorId: e.auth ? e.auth.id : "superuser",
        actorName: e.auth ? e.auth.getString("name") || e.auth.getString("username") || e.auth.getString("email") : "superuser",
        action: "update",
        targetCollection: "game_config",
        recordId: "leviathan",
        recordLabel: "Léviathan : structure ajustée",
        changes: { maxHp: { avant: before, après: state.maxHp } },
        createdAtMs: now,
      });
      txApp.save(log);
    } else throw new BadRequestError("Action inconnue.");
    writeLeviathan(txApp, state);
    out = state;
  });
  return e.json(200, out);
}

/* ---------- Marché entre joueurs (v3.0) ---------- */

/** Joueur chargé et rattrapé (production, files) avant un échange. */
function loadFlushed(txApp, game, uid, missing) {
  const loaded = loadPlayer(txApp, game, uid, missing);
  const f = game.flushPlayer(loaded.player, loaded.queues, Date.now());
  return { loaded, player: f.player, queues: f.queues, notifications: f.notifications };
}

function offerJson(rec) {
  return toPlain(rec);
}

/** POST /api/cosmic/market/create { giveRes, giveAmount, wantRes, wantAmount } */
function marketCreate(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const req = body(e);
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    const seller = loadFlushed(txApp, game, uid);
    const open = txApp.findRecordsByFilter("market_offers", 'sellerId = {:u} && status = "open"', "", 100, 0, { u: uid }).length;
    let offer;
    try {
      offer = game.createOffer(seller.player, req, open, now);
    } catch (err) {
      throw asHttpError(game, err);
    }
    savePlayer(txApp, game, seller.loaded, seller.player, seller.queues);
    notify(txApp, uid, seller.notifications);
    const rec = new Record(txApp.findCollectionByNameOrId("market_offers"));
    rec.load({
      sellerId: uid,
      sellerPseudo: seller.player.pseudo,
      sellerAllianceId: seller.loaded.rec.getString("allianceId"),
      giveRes: offer.giveRes,
      giveAmount: offer.giveAmount,
      wantRes: offer.wantRes,
      wantAmount: offer.wantAmount,
      status: "open",
      createdAtMs: now,
      expiresAtMs: offer.expiresAtMs,
      buyerId: "",
      buyerPseudo: "",
      filledAtMs: 0,
      tax: 0,
    });
    txApp.save(rec);
    out = offerJson(rec);
  });
  return e.json(200, out);
}

/** POST /api/cosmic/market/accept { id } */
function marketAccept(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const id = String(body(e).id || "");
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    const rec = findOrNull(txApp, "market_offers", id);
    if (!rec) throw new NotFoundError("Offre introuvable.");
    const offer = toPlain(rec);
    if (offer.sellerId === uid) throw new BadRequestError("Tu ne peux pas accepter ta propre offre.");
    const buyer = loadFlushed(txApp, game, uid);
    const seller = loadFlushed(txApp, game, offer.sellerId, "Le vendeur n'existe plus.");
    buyer.player.allianceId = buyer.loaded.rec.getString("allianceId");
    const buysToday = txApp.findRecordsByFilter("market_offers", "buyerId = {:u} && filledAtMs >= {:t}", "", 200, 0, { u: uid, t: game.utcDayStart(now) }).length;
    let res;
    try {
      res = game.acceptOffer(offer, buyer.player, seller.player, buysToday, now);
    } catch (err) {
      throw asHttpError(game, err);
    }
    savePlayer(txApp, game, buyer.loaded, buyer.player, buyer.queues);
    savePlayer(txApp, game, seller.loaded, seller.player, seller.queues);
    notify(txApp, uid, buyer.notifications);
    notify(txApp, offer.sellerId, seller.notifications.concat([
      {
        kind: "gift",
        title: "Offre acceptée au marché",
        message: `${buyer.player.pseudo} a pris ton offre : +${game.describeAmount(offer.wantRes, offer.wantAmount - res.tax)} (taxe : ${game.describeAmount(offer.wantRes, res.tax)}).`,
        createdAtMs: now,
        read: false,
      },
    ]));
    rec.set("status", "filled");
    rec.set("buyerId", uid);
    rec.set("buyerPseudo", buyer.player.pseudo);
    rec.set("filledAtMs", now);
    rec.set("tax", res.tax);
    txApp.save(rec);
    out = offerJson(rec);
  });
  return e.json(200, out);
}

/** POST /api/cosmic/market/cancel { id } — le vendeur récupère sa marchandise. */
function marketCancel(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const id = String(body(e).id || "");
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const rec = findOrNull(txApp, "market_offers", id);
    if (!rec || rec.getString("sellerId") !== uid) throw new NotFoundError("Offre introuvable.");
    if (rec.getString("status") !== "open") throw new BadRequestError("Cette offre n'est plus ouverte.");
    const seller = loadFlushed(txApp, game, uid);
    game.refundOffer(toPlain(rec), seller.player);
    savePlayer(txApp, game, seller.loaded, seller.player, seller.queues);
    notify(txApp, uid, seller.notifications);
    rec.set("status", "cancelled");
    txApp.save(rec);
    out = offerJson(rec);
  });
  return e.json(200, out);
}

/** Offres expirées : marchandise rendue au vendeur (tâche planifiée). */
function expireMarketOffers(now) {
  const game = loadGame();
  const due = $app.findRecordsByFilter("market_offers", 'status = "open" && expiresAtMs <= {:n}', "expiresAtMs", 200, 0, { n: now });
  let count = 0;
  due.forEach((r) => {
    try {
      $app.runInTransaction((txApp) => {
        applyContent(txApp, game);
        const rec = txApp.findRecordById("market_offers", r.id);
        if (rec.getString("status") !== "open") return;
        rec.set("status", "expired");
        txApp.save(rec);
        if (!findOrNull(txApp, "players", rec.getString("sellerId"))) return;
        const seller = loadFlushed(txApp, game, rec.getString("sellerId"));
        game.refundOffer(toPlain(rec), seller.player);
        savePlayer(txApp, game, seller.loaded, seller.player, seller.queues);
        notify(txApp, rec.getString("sellerId"), seller.notifications.concat([
          { kind: "gift", title: "Offre expirée", message: `Ton offre au marché a expiré : ${game.describeAmount(rec.getString("giveRes"), rec.getFloat("giveAmount"))} te sont rendus.`, createdAtMs: now, read: false },
        ]));
      });
      count++;
    } catch (err) {
      console.log(`[cosmic] expiration d'offre ${r.id} : ${err}`);
    }
  });
  return count;
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

/* ---------- Alertes de ressources anormales (v3.3) ---------- */

/** Tâche horaire : compare les relevés de stocks de chaque joueur depuis la
 *  dernière analyse ; un bond anormal devient un signalement « Compte »
 *  réservé à l'équipe (un par joueur, complété ou rouvert ensuite). */
function scanAnomalies(now) {
  const game = loadGame();
  const key = game.ANOMALY_RULES.scanKey;
  let scanRec;
  try {
    scanRec = $app.findFirstRecordByData("game_config", "key", key);
  } catch (_) {
    scanRec = new Record($app.findCollectionByNameOrId("game_config"));
    scanRec.set("key", key);
  }
  const data = toPlain(scanRec).data || {};
  const since = Number(data.lastScanMs) || now - 2 * 3600000;
  applyContent($app, game);
  const flagged = [];
  for (let page = 0; page < 20; page++) {
    const recs = $app.findRecordsByFilter("players", "id != ''", "id", 200, page * 200);
    recs.forEach((r) => {
      const p = toPlain(r);
      const list = game.detectResourceAnomalies(p, since);
      if (list.length > 0) flagged.push({ uid: r.id, pseudo: p.pseudo || r.id, list });
    });
    if (recs.length < 200) break;
  }
  const alerts = [];
  flagged.forEach((f) => {
    // v3.5.1 : éditions admin sur la période d'un bond (auteur, champs, motif).
    let byAdmin = false;
    const text = f.list
      .map((a) => {
        const line = game.describeAnomalies([a]);
        const logs = $app.findRecordsByFilter(
          "admin_logs",
          "recordId = {:u} && targetCollection = 'players' && action = 'update' && createdAtMs >= {:from} && createdAtMs <= {:to}",
          "createdAtMs",
          20,
          0,
          { u: f.uid, from: a.fromMs - 120000, to: a.toMs + 120000 },
        );
        const edits = logs
          .map((l) => {
            const fields = Object.keys(toPlain(l).changes || {}).filter((k) => REASON_FIELDS.indexOf(k) >= 0);
            if (fields.length === 0) return "";
            const at = new Date(l.getFloat("createdAtMs")).toISOString().slice(11, 16);
            const reason = l.getString("reason");
            return `  ↳ Édition admin par ${l.getString("actorName") || "?"} à ${at} UTC (${fields.join(", ")})${reason ? ` — motif : ${reason}` : " — sans motif"}.`;
          })
          .filter(Boolean);
        if (edits.length > 0) byAdmin = true;
        return [line].concat(edits).join("\n");
      })
      .join("\n");
    $app.runInTransaction((txApp) => {
      const autoKey = `anomaly:${f.uid}`;
      const existing = txApp.findRecordsByFilter("reports", "autoKey = {:k}", "-createdAtMs", 1, 0, { k: autoKey })[0];
      if (existing) {
        const r = reportJson(existing);
        const closed = r.status === "resolved" || r.status === "rejected";
        const history = (r.history || []).slice();
        if (closed) history.push({ kind: "status", atMs: now, byId: game.AUTO_REPORTER_ID, byName: "Système", staff: true, status: "new", text: "Nouveau bond détecté après la clôture." });
        history.push({ kind: "comment", atMs: now, byId: game.AUTO_REPORTER_ID, byName: "Système", staff: true, text });
        existing.set("history", history);
        existing.set("status", closed ? "new" : r.status);
        existing.set("occurrences", (r.occurrences || 1) + 1);
        existing.set("updatedAtMs", now);
        txApp.save(existing);
        alerts.push({ id: existing.id, title: existing.getString("title"), text });
        return;
      }
      const rec = new Record(txApp.findCollectionByNameOrId("reports"));
      rec.set("reporterId", game.AUTO_REPORTER_ID);
      rec.set("reporterPseudo", "Système");
      rec.set("category", "account");
      rec.set("title", `Ressources anormales : ${f.pseudo}${byAdmin ? " (édition admin)" : ""}`);
      rec.set("description", `Bonds de stock qu'aucune action normale n'explique. Vérifier le journal admin et le marché.\n\n${text}`);
      rec.set("context", { version: "", page: "", theme: "", userAgent: "", screen: "" });
      rec.set("status", "new");
      rec.set("resolution", "");
      rec.set("githubUrl", "");
      rec.set("history", [{ kind: "created", atMs: now, byId: game.AUTO_REPORTER_ID, byName: "Système", staff: true, text: "Détecté par l'analyse horaire des stocks." }]);
      rec.set("autoKey", autoKey);
      rec.set("occurrences", 1);
      rec.set("affected", [f.pseudo]);
      rec.set("createdAtMs", now);
      rec.set("updatedAtMs", now);
      rec.set("reporterSeenAtMs", now);
      txApp.save(rec);
      alerts.push({ id: rec.id, title: rec.getString("title"), text });
    });
  });
  scanRec.set("data", { lastScanMs: now });
  $app.save(scanRec);
  alerts.forEach((a) => {
    const link = appUrl(`/game/admin?onglet=reports&signalement=${a.id}`);
    adminIds().forEach((id) => {
      try {
        notify($app, id, [{ kind: "report", title: "Ressources anormales", message: a.title, createdAtMs: now, read: false }]);
      } catch (_) {
        /* facultatif */
      }
      sendMail(userEmail(id), `[Cosmic Empires] ${a.title}`, a.text.split("\n"), link);
    });
  });
  return alerts.length;
}

/** POST /api/cosmic/admin/anomalies — analyse immédiate (administrateurs). */
function adminScanAnomalies(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  return e.json(200, { alerts: scanAnomalies(Date.now()) });
}

/* ---------- Messagerie privée (v3.7) ---------- */

/** POST /api/cosmic/messages/send { to, text } */
function messageSend(e) {
  const game = loadGame();
  const req = body(e);
  const uid = e.auth.id;
  const to = String(req.to || "");
  const now = Date.now();
  let text;
  try {
    text = game.sanitizeMessageText(req.text);
  } catch (err) {
    throw asHttpError(game, err);
  }
  if (!to || to === uid) throw new BadRequestError("Destinataire invalide.");
  const sender = findOrNull($app, "players", uid);
  const target = findOrNull($app, "players", to);
  if (!sender || !target) throw new NotFoundError("Joueur introuvable.");
  assertKeshEmojis(game, sender, text);
  if ($app.findRecordsByFilter("message_blocks", "ownerUid = {:to} && blockedUid = {:uid}", "", 1, 0, { to, uid }).length > 0) {
    throw new BadRequestError("Ce joueur ne reçoit pas tes messages.");
  }
  const count = (since) => $app.countRecords("private_messages", $dbx.exp("fromUid = {:uid} AND createdAtMs >= {:since}", { uid, since }));
  try {
    game.assertMessageQuota(count(now - 60000), count(now - 86400000));
  } catch (err) {
    throw asHttpError(game, err);
  }
  // Une seule notification tant que les messages précédents ne sont pas lus.
  const pending = $app.findRecordsByFilter("private_messages", "fromUid = {:uid} && toUid = {:to} && readAtMs = 0", "", 1, 0, { uid, to }).length > 0;
  const rec = new Record($app.findCollectionByNameOrId("private_messages"));
  rec.load({ fromUid: uid, fromPseudo: sender.getString("pseudo"), toUid: to, toPseudo: target.getString("pseudo"), text, createdAtMs: now, readAtMs: 0 });
  $app.save(rec);
  if (!pending) {
    try {
      notify($app, to, [{ kind: "message", title: `Message de ${sender.getString("pseudo")}`, message: text.length > 140 ? `${text.slice(0, 140)}…` : text, createdAtMs: now, read: false, link: `/game/messages?with=${uid}&pseudo=${encodeURIComponent(sender.getString("pseudo"))}` }]);
    } catch (_) {
      /* facultatif */
    }
  }
  return e.json(200, toPlain(rec));
}

/** POST /api/cosmic/messages/read { with } — messages reçus de `with` marqués lus. */
function messageRead(e) {
  const req = body(e);
  const uid = e.auth.id;
  const other = String(req.with || "");
  const now = Date.now();
  const recs = $app.findRecordsByFilter("private_messages", "toUid = {:uid} && fromUid = {:other} && readAtMs = 0", "", 500, 0, { uid, other });
  recs.forEach((r) => {
    r.set("readAtMs", now);
    $app.save(r);
  });
  return e.json(200, { read: recs.length });
}

/* ---------- Rapports partagés (v3.8) ---------- */

/** POST /api/cosmic/reports/share { kind: "battle" | "spy", id } — instantané
 *  lisible par tout joueur connecté qui a le lien (non listable). */
function reportShare(e) {
  const req = body(e);
  const uid = e.auth.id;
  const kind = req.kind === "spy" ? "spy" : "battle";
  const sourceId = String(req.id || "");
  const src = findOrNull($app, kind === "spy" ? "spy_reports" : "battle_reports", sourceId);
  if (!src) throw new NotFoundError("Rapport introuvable.");
  const allowed = kind === "spy" ? src.getString("spyUid") === uid : src.getString("attackerUid") === uid || src.getString("defenderUid") === uid;
  if (!allowed) throw new ForbiddenError("Tu ne peux partager que tes propres rapports.");
  const existing = $app.findRecordsByFilter("shared_reports", "ownerUid = {:uid} && sourceId = {:id}", "", 1, 0, { uid, id: sourceId })[0];
  if (existing) return e.json(200, { id: existing.id });
  const player = findOrNull($app, "players", uid);
  const rec = new Record($app.findCollectionByNameOrId("shared_reports"));
  rec.load({ ownerUid: uid, ownerPseudo: player ? player.getString("pseudo") : "", kind, sourceId, data: toPlain(src), createdAtMs: Date.now() });
  $app.save(rec);
  return e.json(200, { id: rec.id });
}

/* ---------- Diplomatie (v3.8) ---------- */

const PACT_FIELDS = ["allianceA", "allianceB", "tagA", "tagB", "nameA", "nameB", "status", "proposedByUid", "proposedByPseudo", "createdAtMs", "acceptedAtMs", "endsAtMs", "brokenByTag"];

function pactJson(rec) {
  const out = { id: rec.id };
  PACT_FIELDS.forEach((f) => (out[f] = rec.get(f)));
  return out;
}

function pactsOf(txApp, ids) {
  const recs = [];
  const seen = {};
  ids.filter(Boolean).forEach((id) => {
    txApp.findRecordsByFilter("alliance_pacts", "allianceA = {:id} || allianceB = {:id}", "", 100, 0, { id }).forEach((r) => {
      if (!seen[r.id]) {
        seen[r.id] = true;
        recs.push(r);
      }
    });
  });
  return recs;
}

/** Pacte qui interdit les attaques entre deux alliances (ou null). */
function bindingPact(txApp, game, allianceA, allianceB, now) {
  if (!allianceA || !allianceB || allianceA === allianceB) return null;
  return game.bindingPactBetween(pactsOf(txApp, [allianceA]).map(pactJson), allianceA, allianceB, now);
}

/** POST /api/cosmic/diplomacy { action: propose|accept|decline|cancel|break|message, ... } */
function diplomacyRequest(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const req = body(e);
  let out = null;
  $app.runInTransaction((txApp) => {
    const now = Date.now();
    const player = findOrNull(txApp, "players", uid);
    const allianceId = player ? player.getString("allianceId") : "";
    if (!allianceId) throw new BadRequestError("Tu n'as pas d'alliance.");
    const ownRec = findOrNull(txApp, "alliances", allianceId);
    if (!ownRec) throw new BadRequestError("Alliance introuvable.");
    const own = allianceFromRecord(ownRec);
    const pseudo = player.getString("pseudo");
    try {
      if (req.action === "propose") {
        const targetRec = findOrNull(txApp, "alliances", String(req.targetAllianceId || ""));
        if (!targetRec) throw new NotFoundError("Alliance introuvable.");
        const target = allianceFromRecord(targetRec);
        const pacts = pactsOf(txApp, [own.id, target.id]).map(pactJson);
        const atWar = !!activeWarRecord(txApp, game, own.id, target.id, now);
        const pact = game.proposePact({ actorUid: uid, actorPseudo: pseudo, own, target, pacts, atWar, now });
        const rec = new Record(txApp.findCollectionByNameOrId("alliance_pacts"));
        rec.load(pact);
        txApp.save(rec);
        notifyAlliance(txApp, target.id, "Proposition de pacte", `[${own.tag}] ${own.name} propose un pacte de non-agression.`, now);
        out = pactJson(rec);
        return;
      }
      const rec = findOrNull(txApp, "alliance_pacts", String(req.pactId || ""));
      if (!rec) throw new NotFoundError("Pacte introuvable.");
      const pact = pactJson(rec);
      if (pact.allianceA !== own.id && pact.allianceB !== own.id) throw new ForbiddenError("Ce pacte ne concerne pas ton alliance.");
      const other = pact.allianceA === own.id ? pact.allianceB : pact.allianceA;
      if (req.action === "message") {
        if (!game.pactOpen(pact, now)) throw new BadRequestError("Ce canal est fermé.");
        const text = game.sanitizePactMessage(req.text);
        assertKeshEmojis(game, findOrNull(txApp, "players", uid), text);
        const msg = new Record(txApp.findCollectionByNameOrId("pact_messages"));
        msg.load({ pactId: pact.id, allianceA: pact.allianceA, allianceB: pact.allianceB, authorUid: uid, authorPseudo: pseudo, authorTag: own.tag, text, createdAtMs: now });
        txApp.save(msg);
        notifyPactMessage(txApp, pact, uid, pseudo, own.tag, text, now);
        out = toPlain(msg);
        return;
      }
      let next;
      if (req.action === "break") next = game.breakPact(pact, own, uid, now);
      else if (req.action === "accept" || req.action === "decline" || req.action === "cancel") next = game.answerPact(pact, own, uid, req.action, now);
      else throw new BadRequestError("Action inconnue.");
      PACT_FIELDS.forEach((f) => rec.set(f, next[f]));
      txApp.save(rec);
      const label = `[${own.tag}] ${own.name}`;
      if (req.action === "accept") {
        notifyAlliance(txApp, own.id, "Pacte signé", `Pacte de non-agression avec [${pact.tagA}] ${pact.nameA}.`, now);
        notifyAlliance(txApp, other, "Pacte signé", `${label} accepte votre pacte de non-agression.`, now);
      } else if (req.action === "break") {
        const h = game.DIPLOMACY_RULES.breakNoticeHours;
        notifyAlliance(txApp, other, "Pacte rompu", `${label} rompt le pacte : il prend fin dans ${h} h.`, now);
        notifyAlliance(txApp, own.id, "Pacte rompu", `${pseudo} a rompu le pacte : fin dans ${h} h.`, now);
      } else if (req.action === "decline") {
        notifyAlliance(txApp, other, "Pacte refusé", `${label} refuse votre proposition de pacte.`, now);
      }
      out = pactJson(rec);
    } catch (err) {
      throw asHttpError(game, err);
    }
  });
  return e.json(200, out);
}

/* ---------- Défis hebdomadaires (v3.8) ---------- */

function readChallengeState(txApp, game) {
  try {
    const rec = (txApp || $app).findFirstRecordByData("game_config", "key", game.CHALLENGE_KEY);
    return game.normalizeChallengeState(toPlain(rec).data);
  } catch (_) {
    return game.normalizeChallengeState(null);
  }
}

function writeChallengeState(txApp, game, state) {
  let rec;
  try {
    rec = txApp.findFirstRecordByData("game_config", "key", game.CHALLENGE_KEY);
  } catch (_) {
    rec = new Record(txApp.findCollectionByNameOrId("game_config"));
    rec.set("key", game.CHALLENGE_KEY);
  }
  rec.set("data", state);
  txApp.save(rec);
}

/** Ajoute au défi en cours ce que le joueur vient d'accomplir. */
function recordChallengeProgress(txApp, game, before, after) {
  const b = game.challengeMetrics(before);
  const a = game.challengeMetrics(after);
  const deltas = {};
  let any = false;
  Object.keys(a).forEach((k) => {
    const d = (a[k] || 0) - (b[k] || 0);
    if (d > 0) {
      deltas[k] = d;
      any = true;
    }
  });
  if (!any) return;
  const state = readChallengeState(txApp, game);
  const ch = state.current;
  if (!ch || ch.status !== "active" || !deltas[ch.type]) return;
  const now = Date.now();
  const next = game.addContribution(ch, after.uid || before.id, after.pseudo || before.pseudo || "", deltas[ch.type], now);
  if (next === ch) return;
  writeChallengeState(txApp, game, Object.assign({}, state, { current: next }));
}

/** Tâche planifiée : clôture et récompenses, titre temporaire, nouveau défi. */
function challengeTick(now) {
  const game = loadGame();
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    let state = readChallengeState(txApp, game);
    let changed = false;

    if (state.titleHolder && now >= state.titleHolder.untilMs) {
      if (findOrNull(txApp, "players", state.titleHolder.uid)) {
        const holder = loadPlayer(txApp, game, state.titleHolder.uid);
        game.removeChallengeTitle(holder.player);
        savePlayer(txApp, game, holder, holder.player, holder.queues);
      }
      state = Object.assign({}, state, { titleHolder: null });
      changed = true;
    }

    const ch = state.current;
    if (ch && ch.status === "active" && now >= ch.endMs) {
      const tier = game.challengeTier(ch);
      const done = Object.assign({}, ch, { status: "done", success: !!tier });
      const label = game.CHALLENGE_TYPES[ch.type].label;
      game.challengeRewardees(done).forEach((uid) => {
        if (!findOrNull(txApp, "players", uid)) return;
        const loaded = loadPlayer(txApp, game, uid);
        game.grantChallengeReward(done, loaded.player);
        savePlayer(txApp, game, loaded, loaded.player, loaded.queues);
        notify(txApp, uid, [{ kind: "event", title: "Défi de la semaine réussi !", message: `${label} : objectif atteint à ${Math.round((done.total / done.target) * 100)} %. Récompense versée : ${tier.hours} h de production et ${tier.rare} de chaque ressource rare.`, createdAtMs: now, read: false }]);
      });
      const top = game.challengeRanking(done)[0];
      state = Object.assign({}, state, {
        current: null,
        previous: done,
        titleHolder: tier && top ? { uid: top.uid, untilMs: now + game.CHALLENGE_RULES.titleDays * 86400000 } : state.titleHolder,
      });
      changed = true;
    }

    const week = game.weekWindow(now);
    if (!state.current && (!state.previous || state.previous.id !== week.id) && !game.isLeviathanWeek(now)) {
      const active = txApp.countRecords("players", $dbx.exp("resourcesUpdatedAtMs >= {:since}", { since: now - game.CHALLENGE_RULES.activeDays * 86400000 }));
      state = Object.assign({}, state, { current: game.startChallenge(now, active, state.previous ? state.previous.type : null) });
      changed = true;
    }

    if (changed) writeChallengeState(txApp, game, state);
  });
}

/* ---------- Chasseurs de primes Kesh'Vaar (v3.9) ---------- */

/** Emojis Kesh'Vaar : réservés aux détenteurs du pack. */
function assertKeshEmojis(game, playerRec, text) {
  if (!playerRec || String(text || "").indexOf(":kesh_") < 0) return;
  try {
    game.assertKeshEmojis({ bounties: parseJsonField(playerRec, "bounties", {}) }, String(text));
  } catch (err) {
    throw asHttpError(game, err);
  }
}

/** Tchat d'alliance (création directe) : même contrôle des emojis. */
function allianceMessageCreate(e) {
  const game = loadGame();
  if (e.auth) assertKeshEmojis(game, findOrNull($app, "players", e.auth.id), e.record.getString("text"));
  e.next();
}

function readElite(txApp, game) {
  try {
    const rec = (txApp || $app).findFirstRecordByData("game_config", "key", game.ELITE_KEY);
    return game.normalizeElite(toPlain(rec).data);
  } catch (_) {
    return null;
  }
}

function writeElite(txApp, game, state) {
  let rec;
  try {
    rec = txApp.findFirstRecordByData("game_config", "key", game.ELITE_KEY);
  } catch (_) {
    rec = new Record(txApp.findCollectionByNameOrId("game_config"));
    rec.set("key", game.ELITE_KEY);
  }
  rec.set("data", state);
  txApp.save(rec);
}

/** Arrivée d'une flotte de prime : combat contre le fugitif. */
function bountyArrival(txApp, game, rec, now) {
  const fleet = fleetFromRecord(rec);
  const tripMs = Math.max(0, fleet.arriveAtMs - fleet.departAtMs);
  if (!findOrNull(txApp, "players", fleet.ownerUid)) {
    rec.set("status", "done");
    txApp.save(rec);
    return;
  }
  const loaded = loadPlayer(txApp, game, fleet.ownerUid);
  const player = loaded.player;
  // Les vaisseaux sont partis : on les remet « à bord » le temps du combat.
  Object.keys(fleet.units).forEach((id) => {
    const st = player.units[id] || { level: 1, count: 0 };
    player.units[id] = Object.assign({}, st, { count: st.count + fleet.units[id] });
  });
  const out = game.resolveBountyHunt(player, loaded.queues, game.bountyIdOf(fleet.targetUid), fleet.units, rec.getFloat("power"), now, rec.getString("formation"));
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

/** Arrivée sur la proie d'élite : dégâts, pertes, retour. */
function eliteArrival(txApp, game, rec, now) {
  const fleet = fleetFromRecord(rec);
  const backAt = now + game.ELITE_RULES.flightMinutes * 60000;
  if (!findOrNull(txApp, "players", fleet.ownerUid)) {
    rec.set("status", "done");
    txApp.save(rec);
    return;
  }
  const state = readElite(txApp, game);
  const owner = loadPlayer(txApp, game, fleet.ownerUid);
  if (!state) {
    rec.set("status", "returning");
    rec.set("returnAtMs", backAt);
    txApp.save(rec);
    return;
  }
  const res = game.resolveEliteAssault(state, owner.player, fleet.units, rec.getString("formation"), now);
  rec.set("units", res.survivors);
  rec.set("status", "returning");
  rec.set("returnAtMs", backAt);
  rec.set("outcome", res.killed ? "attacker_win" : "draw");
  txApp.save(rec);
  // v4.0 : l'Amiral en poste progresse à chaque assaut porté.
  if (res.damage > 0) {
    game.grantCommanderXp(owner.player, "admiral", game.COMMANDER_XP.bossAssault);
    owner.rec.set("commanders", owner.player.commanders || null);
    txApp.save(owner.rec);
  }
  const lost = Object.keys(res.lost).reduce((a, k) => a + res.lost[k], 0);
  const name = game.describeElite(state).name;
  notify(txApp, fleet.ownerUid, [
    {
      kind: "bounty",
      title: res.killed ? `Coup de grâce sur ${name} !` : `Assaut sur ${name}`,
      message: res.damage > 0 ? `${game.formatInt(res.damage)} dégâts infligés, ${lost} vaisseau(x) perdu(s).` : "La proie n'était plus là : la flotte rentre.",
      createdAtMs: now,
      read: false,
      link: "/game/primes",
    },
  ]);
  let next = res.state;
  if (res.killed) next = distributeElite(txApp, game, next, now);
  writeElite(txApp, game, next);
}

/** Récompenses de la proie d'élite (une seule fois). */
function distributeElite(txApp, game, state, now) {
  if (state.rewarded || state.status === "active") return state;
  game.eliteRanking(state).forEach((c) => {
    if (!findOrNull(txApp, "players", c.uid)) return;
    const loaded = loadPlayer(txApp, game, c.uid);
    const reward = game.grantEliteReward(state, loaded.player, now);
    savePlayer(txApp, game, loaded, loaded.player, loaded.queues);
    notify(txApp, c.uid, [game.eliteNotice(state, reward, now)]);
  });
  return Object.assign({}, state, { rewarded: true });
}

/** Tâche planifiée : nouvelle proie chaque lundi, fuite à l'échéance. */
function eliteTick(now) {
  const game = loadGame();
  let state = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    state = readElite(txApp, game);
    let changed = false;
    if (state) {
      const closed = game.closeElite(state, now);
      if (closed !== state) {
        state = closed;
        changed = true;
      }
      if (state.status !== "active" && !state.rewarded) {
        state = distributeElite(txApp, game, state, now);
        changed = true;
      }
    }
    const win = game.eliteWindow(now);
    if (!state || (state.id !== win.id && state.status !== "active")) {
      const actives = txApp.findRecordsByFilter("players", "resourcesUpdatedAtMs >= {:t}", "", 500, 0, { t: now - 7 * 86400000 }).map((r) => toPlain(r));
      state = game.spawnElite(now, actives);
      changed = true;
    }
    if (changed) writeElite(txApp, game, state);
  });
  return state;
}

/** POST /api/cosmic/bounty { action: "buy" | "exchange" | "beacon", item?, amount?, fleetId?, buildingId? } */
function bountyRequest(e) {
  const game = loadGame();
  const req = body(e);
  const uid = e.auth.id;
  let out = null;
  $app.runInTransaction((txApp) => {
    const now = Date.now();
    applyContent(txApp, game);
    const loaded = loadPlayer(txApp, game, uid);
    const flushed = game.flushPlayer(loaded.player, loaded.queues, now);
    const player = flushed.player;
    const queues = flushed.queues;
    try {
      if (req.action === "buy") {
        out = game.buyShopItem(player, queues, req.item, now, req.buildingId ? String(req.buildingId) : undefined);
      } else if (req.action === "exchange") {
        out = { gain: game.exchangeAmber(player, req.amount, now) };
      } else if (req.action === "beacon") {
        const rec = findOrNull(txApp, "fleets", String(req.fleetId || ""));
        if (!rec) throw new game.GameActionError("Flotte introuvable.");
        const wasStatus = rec.getString("status");
        const fleet = game.beaconReturn(fleetFromRecord(rec), uid, now);
        game.consumeBeacon(player);
        if (fleet.mission === "bounty" && wasStatus === "outbound") game.releaseBounty(player, game.bountyIdOf(fleet.targetUid));
        const done = game.completeFleetReturn(player, fleet, now);
        game.clearDecoy(player, rec.id);
        notify(txApp, uid, done.notifications);
        rec.set("status", "done");
        rec.set("recalled", fleet.recalled);
        rec.set("returnAtMs", now);
        if (wasStatus === "stationed") rec.set("stationedUntilMs", now);
        txApp.save(rec);
        out = { message: "Balise activée : ta flotte est rentrée." };
      } else throw new game.GameActionError("Action inconnue.");
    } catch (err) {
      throw asHttpError(game, err);
    }
    savePlayer(txApp, game, loaded, player, queues);
    notify(txApp, uid, flushed.notifications);
  });
  return e.json(200, out || {});
}

/** Rappel d'une flotte de prime : le contrat redevient disponible. */
function releaseBountyOnRecall(txApp, game, fleet) {
  if (fleet.mission !== "bounty" || !findOrNull(txApp, "players", fleet.ownerUid)) return;
  const loaded = loadPlayer(txApp, game, fleet.ownerUid);
  game.releaseBounty(loaded.player, game.bountyIdOf(fleet.targetUid));
  savePlayer(txApp, game, loaded, loaded.player, loaded.queues);
}

/** POST /api/cosmic/admin/elite { now? } — tâche de la proie d'élite (tests, administration). */
function adminElite(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  return e.json(200, eliteTick(Number(body(e).now) || Date.now()));
}

/* ---------- Sécurité de la fiche joueur (v3.9.2) ---------- */

/** Seuls ces champs s'écrivent directement par un joueur ; tout le reste
 *  passe par les routes du serveur (actions de jeu). */
const PLAYER_WRITABLE = ["pseudo", "allianceLastReadMs", "emailOptOut", "notifPrefs"];

function guardPlayerUpdate(e) {
  if (e.hasSuperuserAuth() || isGameAdmin(e)) return;
  const sent = e.requestInfo().body || {};
  const bad = Object.keys(sent).filter((k) => PLAYER_WRITABLE.indexOf(k) < 0);
  if (bad.length > 0) throw new ForbiddenError("Ces informations ne se modifient qu'en jeu.");
}

/* ---------- Campagnes e-mail (v3.9.2) ---------- */

/** Joueurs joignables : compte vérifié, nouvelles acceptées. */
function mailRecipients(app) {
  const out = [];
  let optedOut = 0;
  app.findRecordsByFilter("users", "verified = true", "", 0, 0, {}).forEach((u) => {
    const player = findOrNull(app, "players", u.id);
    if (!player) return;
    if (player.getBool("emailOptOut")) {
      optedOut += 1;
      return;
    }
    const email = u.getString("email");
    if (email) out.push({ email, player });
  });
  return { list: out, optedOut };
}

function unsubscribeUrl(player, apiUrl) {
  let token = player.getString("mailToken");
  if (!token) {
    token = $security.randomString(32);
    player.set("mailToken", token);
    $app.save(player);
  }
  return `${apiUrl}/api/cosmic/unsubscribe?u=${encodeURIComponent(player.id)}&t=${encodeURIComponent(token)}`;
}

function personalize(str, pseudo, unsubUrl, html) {
  return String(str || "")
    .split("{{PSEUDO}}")
    .join(html ? escapeHtml(pseudo) : pseudo)
    .split("{{UNSUBSCRIBE_URL}}")
    .join(unsubUrl);
}

/** POST /api/cosmic/admin/mail { action: "count" | "test" | "send", subject, html, text, apiUrl, confirm?, dryRun? } */
function adminMail(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const req = body(e);
  const action = String(req.action || "");
  const recipients = mailRecipients($app);
  if (action === "count") return e.json(200, { recipients: recipients.list.length, optedOut: recipients.optedOut, smtp: mailEnabled() });
  const subject = String(req.subject || "").trim();
  const html = String(req.html || "");
  const text = String(req.text || "");
  const apiUrl = String(req.apiUrl || "").replace(/\/+$/, "");
  if (!subject || !html) throw new BadRequestError("Objet et contenu requis.");
  if (!/^https?:\/\/[^\s]+$/.test(apiUrl)) throw new BadRequestError("Adresse du serveur invalide.");
  const meta = $app.settings().meta;
  const from = { address: meta.senderAddress, name: String(req.fromName || "").trim() || meta.senderName || "Cosmic Empires" };
  const sendOne = (email, pseudo, player, demo) => {
    // Test : lien de démonstration (ne désinscrit personne).
    const url = demo ? `${apiUrl}/api/cosmic/unsubscribe?demo=1` : unsubscribeUrl(player, apiUrl);
    const message = new MailerMessage({
      from,
      to: [{ address: email }],
      subject: personalize(subject, pseudo, url, false),
      html: personalize(html, pseudo, url, true),
      text: personalize(text, pseudo, url, false),
      headers: { "List-Unsubscribe": `<${url}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
    });
    $app.newMailClient().send(message);
  };

  if (action === "test") {
    if (!mailEnabled()) throw new BadRequestError("L'envoi d'e-mails n'est pas configuré (SMTP).");
    const to = String(req.to || (e.auth ? e.auth.getString("email") : "")).trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(to)) throw new BadRequestError("Adresse de test invalide.");
    // Pseudo de l'équipier : sa fiche de jeu (compte joueur, ou même adresse que le superuser).
    let player = e.auth ? findOrNull($app, "players", e.auth.id) : null;
    if (!player && e.auth) {
      try {
        const user = $app.findFirstRecordByData("users", "email", e.auth.getString("email"));
        player = findOrNull($app, "players", user.id);
      } catch (_) {
        player = null;
      }
    }
    try {
      sendOne(to, player ? player.getString("pseudo") : "de test", player, true);
    } catch (err) {
      throw new BadRequestError(`Envoi impossible : ${err}`);
    }
    return e.json(200, { sent: 1, to });
  }

  if (action !== "send") throw new BadRequestError("Action inconnue.");
  if (req.confirm !== "ENVOYER") throw new BadRequestError("Confirmation manquante.");
  if (req.dryRun) return e.json(200, { sent: 0, failed: 0, recipients: recipients.list.length, dryRun: true });
  if (!mailEnabled()) throw new BadRequestError("L'envoi d'e-mails n'est pas configuré (SMTP).");
  let sent = 0;
  const failed = [];
  recipients.list.forEach((r, i) => {
    try {
      sendOne(r.email, r.player.getString("pseudo"), r.player);
      sent += 1;
    } catch (err) {
      failed.push(r.player.getString("pseudo"));
      console.log(`[cosmic] campagne : échec pour ${r.player.id} : ${err}`);
    }
    // Limite du fournisseur (2 envois par seconde chez Resend).
    if (i < recipients.list.length - 1) sleep(600);
  });
  try {
    const log = new Record($app.findCollectionByNameOrId("admin_logs"));
    log.load({
      actorId: e.auth ? e.auth.id : "superuser",
      actorName: e.auth ? e.auth.getString("name") || e.auth.getString("username") || e.auth.getString("email") : "superuser",
      action: "create",
      targetCollection: "emails",
      recordId: "campagne",
      recordLabel: `Campagne e-mail : ${subject}`,
      changes: { envoyés: sent, échecs: failed.length },
      createdAtMs: Date.now(),
    });
    $app.save(log);
  } catch (_) {
    /* journal facultatif */
  }
  return e.json(200, { sent, failed: failed.length, failedPseudos: failed });
}

/** GET/POST /api/cosmic/unsubscribe?u=&t= — lien de désinscription des e-mails. */
function unsubscribe(e) {
  const q = e.requestInfo().query || {};
  const uid = String(q.u || "");
  const token = String(q.t || "");
  const demo = String(q.demo || "") === "1";
  const player = uid ? findOrNull($app, "players", uid) : null;
  const ok = !!player && token.length >= 16 && player.getString("mailToken") === token;
  if (ok && !player.getBool("emailOptOut")) {
    player.set("emailOptOut", true);
    $app.save(player);
  }
  const appUrl = String($app.settings().meta.appURL || "").replace(/\/+$/, "");
  const page =
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Cosmic Empires</title></head>` +
    `<body style="margin:0;background:#03040a;color:#cbd5e1;font-family:Arial,sans-serif;display:flex;min-height:100vh;align-items:center;justify-content:center">` +
    `<div style="max-width:420px;padding:32px;border:1px solid #12324a;background:#05070f;text-align:center">` +
    `<div style="letter-spacing:4px;color:#fff;font-weight:bold">COSMIC EMPIRES</div>` +
    (demo
      ? `<p style="margin-top:20px;line-height:1.6">Lien de démonstration (e-mail de test).<br>Dans les e-mails envoyés aux joueurs, ce lien les désinscrit en un clic.</p>`
      : ok
      ? `<p style="margin-top:20px;line-height:1.6">C'est noté, commandant : tu ne recevras plus nos nouvelles par e-mail.<br>Tu peux les réactiver à tout moment dans les <b>Réglages</b> du jeu.</p>`
      : `<p style="margin-top:20px;line-height:1.6">Ce lien de désinscription n'est pas valide. Tu peux gérer tes e-mails depuis les <b>Réglages</b> du jeu.</p>`) +
    `<p style="margin-top:24px"><a href="${escapeHtml(appUrl || "/")}" style="color:#4be8ff">Retourner en jeu →</a></p></div></body></html>`;
  return e.html(200, page);
}

module.exports = { fleetFromRecord, guardPlayerUpdate, adminMail, unsubscribe, bountyRequest, eliteTick, adminElite, readElite, releaseBountyOnRecall, allianceMessageCreate, requireAdminReason, challengeTick, readChallengeState, diplomacyRequest, bindingPact, reportShare, messageSend, messageRead, scanAnomalies, adminScanAnomalies, warRequest, warTick, expeditionChoose, leviathanTick, adminLeviathan, marketCreate, marketAccept, marketCancel, expireMarketOffers, adminBackupStatus, checkBackups, reportCreateRequest, reportClientError, reportComment, reportSeen, adminReportUpdate, adminReportConfig, adminReportGithub, autoEndMaintenance, adminList, adminManage, readMaintenance, closedDuringMaintenance, maintenanceGuard, adminMaintenance, processPirates, piratesRequest, adminReset, allianceRequest, allianceIntel, processAllianceResearch, closeSeason, purgeDebris, syncProfile, deleteProfile, launchFleetRequest, lastAttackOnTarget, processDueFleets, isGameAdmin, logAdminAction, body, toPlain, loadGame, applyContent, findOrNull, loadPlayer, savePlayer, notify, asHttpError };
