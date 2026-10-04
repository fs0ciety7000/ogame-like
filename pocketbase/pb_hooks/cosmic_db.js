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
    if (!player.npc) recordChallengeProgress(txApp, game, toPlain(loaded.rec), player);
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

/** v4.2 : seigneur de guerre (enregistrement players marqué npc). */
function isNpcUid(txApp, uid) {
  if (!uid || String(uid).indexOf("npc") !== 0) return false;
  const rec = findOrNull(txApp, "players", uid);
  return !!rec && rec.getString("npc") !== "";
}

/** v5.10 : lien vers le rapport pour les notifications de combat (attaque/défense). */
function withReportLink(notifications, reportId) {
  return (notifications || []).map((n) => (n.kind === "combat-attacker" || n.kind === "combat-defender") && !n.link ? Object.assign({}, n, { link: `/game/combats?rapport=${reportId}` }) : n);
}

function notify(txApp, uid, notifications) {
  if (!notifications || notifications.length === 0) return;
  if (isNpcUid(txApp, uid)) return;
  const collection = txApp.findCollectionByNameOrId("notifications");
  notifications.forEach((n) => {
    const rec = new Record(collection);
    rec.load(Object.assign({}, n, { player_id: uid }));
    txApp.save(rec);
  });
}

/** v5.10.5 : un enregistrement des règles (game_config « rules ») invalide est refusé. */
function guardRulesConfig(e) {
  if (e.record.getString("key") !== "rules") return;
  const game = loadGame();
  const errors = game.validateRules(toPlain(e.record).data);
  if (errors.length > 0) throw new BadRequestError(`Règles refusées : ${errors.slice(0, 3).join(" · ")}`);
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

/** v4.7.2 : champs écrits par le jeu lui-même (lecture du canal…), jamais consignés. */
const LOG_IGNORED_FIELDS = ["allianceLastReadMs"];

function logAdminAction(e, action, before, after) {
  try {
    if (!isGameAdmin(e)) return;
    const record = after || before;
    const collection = record.collectionName || (e.collection && e.collection.name) || "";
    const labelField = LOG_LABEL_FIELD[collection];
    const changes = {};
    if (action === "update") {
      const fields = Object.keys(e.requestInfo().body || {}).filter((f) => LOG_IGNORED_FIELDS.indexOf(f) < 0);
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

const PROFILE_FIELDS = ["pseudo", "xp", "seasonId", "seasonXp", "createdAtMs", "lastDefeatAtMs", "lastAttackAtMs", "allianceId", "activeTitle", "ascensions", "ascendedAtMs", "npc", "lastActiveMs"];

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
  // v4.2 : fin des vacances affichée sur la fiche (0 hors vacances).
  const vac = parseJsonField(player, "vacation", null);
  const vacUntil = vac && !vac.endedAtMs && Number(vac.untilMs) > Date.now() ? Number(vac.untilMs) : 0;
  if (profile.getInt("vacationUntilMs") !== vacUntil) {
    profile.set("vacationUntilMs", vacUntil);
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
      unlockedAchievements: parseJsonField(player, "unlockedAchievements", []),
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
  if (mission === "seasonboss") return seasonBossArrival(txApp, game, rec, now);
  if (mission === "allianceboss") return allianceBossArrival(txApp, game, rec, now);
  if (mission === "transport") return transportArrival(txApp, game, rec, now);
  if (mission === "delivery") return deliveryArrival(txApp, game, rec, now);
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

/* ---------- Guerres de saison (v5.1) ---------- */

/** Classement de guerre d'une saison : points de guerre, puissance détruite, secteurs tenus. */
function seasonWarStandingsFor(txApp, game, seasonId) {
  const wars = txApp.findRecordsByFilter("alliance_wars", "seasonId = {:s}", "", 1000, 0, { s: seasonId }).map((r) => toPlain(r));
  const warPoints = game.seasonWarPoints(wars, seasonId);
  const power = {};
  txApp.findRecordsByFilter("players", "allianceId != '' && npc = ''", "", 0, 0).forEach((r) => {
    const p = toPlain(r);
    const n = game.seasonPowerOf(p, seasonId);
    if (n > 0) power[p.allianceId] = (power[p.allianceId] || 0) + n;
  });
  const sectors = {};
  try {
    const cfg = txApp.findFirstRecordByFilter("game_config", "key = 'territories'");
    ((toPlain(cfg).data || {}).sectors || []).forEach((sec) => {
      if (sec.allianceId) sectors[sec.allianceId] = (sectors[sec.allianceId] || 0) + 1;
    });
  } catch (_) {
    /* pas encore de territoires */
  }
  return game.seasonWarStandings({ warPoints, power, sectors });
}

/** GET /api/cosmic/season-war — classement de guerre de la saison en cours. */
function seasonWarRequest(e) {
  const game = loadGame();
  applyContent($app, game);
  const seasonId = game.currentSeasonId(Date.now());
  const standings = seasonWarStandingsFor($app, game, seasonId).slice(0, 20).map((st) => {
    const a = findOrNull($app, "alliances", st.allianceId);
    return Object.assign({}, st, { tag: a ? a.getString("tag") : "?", name: a ? a.getString("name") : "Alliance dissoute" });
  });
  return e.json(200, { seasonId, rules: game.SEASON_WAR_RULES, standings });
}

/* ---------- Territoires d'alliance (v5.1) ---------- */

/** Recalcule le contrôle des secteurs et le bonus de chaque joueur (tâche horaire). */
function territoriesTick(now) {
  const game = loadGame();
  const recs = $app.findRecordsByFilter("players", "id != ''", "", 2000, 0);
  const players = recs.map((r) => ({
    uid: r.id,
    allianceId: r.getString("allianceId"),
    buildings: parseJsonField(r, "buildings", {}) || {},
    colonies: (parseJsonField(r, "colonies", []) || []).map((c) => ({ id: c.id, buildings: c.buildings || {} })),
  }));
  const out = game.computeTerritories(players, now);
  const tags = {};
  $app.findRecordsByFilter("alliances", "id != ''", "", 500, 0).forEach((a) => (tags[a.id] = a.getString("tag")));
  const sectors = out.sectors.map((s) =>
    Object.assign({}, s, { tag: tags[s.allianceId] || "", contenders: s.contenders.map((c) => Object.assign({}, c, { tag: tags[c.allianceId] || "" })) }),
  );
  $app.runInTransaction((txApp) => {
    let cfg = null;
    try {
      cfg = txApp.findFirstRecordByFilter("game_config", "key = 'territories'");
    } catch (_) {
      cfg = new Record(txApp.findCollectionByNameOrId("game_config"));
      cfg.set("key", "territories");
    }
    cfg.set("data", { atMs: now, sectors });
    txApp.save(cfg);
    recs.forEach((r) => {
      const t = out.byUid[r.id];
      if (!t) return;
      const prev = parseJsonField(r, "territory", null);
      // Pas d'écriture inutile pour qui n'a ni bonus ni secteur, avant comme après.
      if (!t.pct && (!prev || !prev.pct)) return;
      const rec = txApp.findRecordById("players", r.id);
      rec.set("territory", t);
      txApp.save(rec);
    });
  });
  return { sectors: sectors.filter((s) => s.allianceId).length };
}

/* ---------- Contrats entre joueurs (v5.1) ---------- */

/** Contrats actifs d'un joueur : publiés (ouverts ou acceptés) et acceptés comme livreur. */
function activeTradeContracts(txApp, uid) {
  return txApp.findRecordsByFilter(
    "trade_contracts",
    '(clientUid = {:u} && (status = "open" || status = "accepted")) || (supplierUid = {:u} && status = "accepted")',
    "",
    20,
    0,
    { u: uid },
  ).length;
}

/** Arrivée d'une livraison : à temps, le contrat est honoré ; sinon la cargaison repart. */
function deliveryArrival(txApp, game, rec, now) {
  const fleet = fleetFromRecord(rec);
  const tripMs = Math.max(0, fleet.arriveAtMs - fleet.departAtMs);
  const cargo = (fleet.transport && fleet.transport.cargo) || {};
  const contractRec = fleet.transport && fleet.transport.contractId ? findOrNull(txApp, "trade_contracts", fleet.transport.contractId) : null;
  const c = contractRec ? toPlain(contractRec) : null;
  const ok = c && c.status === "accepted" && c.supplierUid === fleet.ownerUid && now <= c.deadlineMs && findOrNull(txApp, "players", c.clientUid) && findOrNull(txApp, "players", fleet.ownerUid);
  if (ok) {
    const client = loadPlayer(txApp, game, c.clientUid);
    const supplier = loadPlayer(txApp, game, fleet.ownerUid);
    try {
      game.completeTradeContract(c, client.player, supplier.player, Number(cargo[c.wantRes]) || 0, now);
    } catch (err) {
      throw asHttpError(game, err);
    }
    savePlayer(txApp, game, client, client.player, client.queues);
    savePlayer(txApp, game, supplier, supplier.player, supplier.queues);
    notify(txApp, c.clientUid, [
      { kind: "gift", title: "Contrat livré", message: `${c.supplierPseudo} t'a livré ${game.describeAmount(c.wantRes, c.wantAmount)}. Contrat honoré.`, createdAtMs: now, read: false },
    ]);
    notify(txApp, fleet.ownerUid, [
      { kind: "gift", title: "Contrat honoré", message: `Livraison reçue par ${c.clientPseudo} : +${game.describeAmount(c.payRes, c.payAmount)}, caution de ${game.describeAmount(c.payRes, c.deposit)} rendue.`, createdAtMs: now, read: false },
    ]);
    contractRec.set("status", "delivered");
    contractRec.set("closedAtMs", now);
    txApp.save(contractRec);
    rec.set("outcome", "delivered");
    rec.set("loot", null);
  } else {
    // Contrat échu ou disparu : la cargaison rentre avec les vaisseaux.
    rec.set("outcome", "late");
    rec.set("loot", cargo);
  }
  rec.set("status", "returning");
  rec.set("returnAtMs", now + tripMs);
  txApp.save(rec);
}

/** POST /api/cosmic/trade-contract { action: create | accept | cancel | abandon, ... } */
function tradeContractRequest(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const req = body(e);
  const action = String(req.action || "");
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    const me = loadFlushed(txApp, game, uid);
    if (game.onVacation(me.player, now)) throw new BadRequestError("Tu es en vacances : reviens d'abord pour commercer.");
    let rec = null;
    try {
      if (action === "create") {
        const c = game.createTradeContract(me.player, req, activeTradeContracts(txApp, uid), now);
        if (c.targetUid && !findOrNull(txApp, "players", c.targetUid)) throw new game.GameActionError("Ce commandant est introuvable.");
        rec = new Record(txApp.findCollectionByNameOrId("trade_contracts"));
        rec.load(Object.assign({ clientUid: uid, clientPseudo: me.player.pseudo, status: "open", createdAtMs: now, supplierUid: "", supplierPseudo: "", deposit: 0, acceptedAtMs: 0, deadlineMs: 0, fleetId: "", closedAtMs: 0 }, c));
        txApp.save(rec);
        savePlayer(txApp, game, me.loaded, me.player, me.queues);
        if (c.targetUid) {
          notify(txApp, c.targetUid, [
            { kind: "gift", title: "Contrat proposé", message: `${me.player.pseudo} te propose un contrat : livre ${game.describeAmount(c.wantRes, c.wantAmount)} contre ${game.describeAmount(c.payRes, c.payAmount)} (Marché → Contrats).`, link: "/game/marche?onglet=contrats", createdAtMs: now, read: false },
          ]);
        }
        out = toPlain(rec);
        return;
      }
      rec = findOrNull(txApp, "trade_contracts", String(req.id || ""));
      if (!rec) throw new NotFoundError("Contrat introuvable.");
      const c = toPlain(rec);
      if (action === "accept") {
        const res = game.acceptTradeContract(c, me.player, activeTradeContracts(txApp, uid), now);
        savePlayer(txApp, game, me.loaded, me.player, me.queues);
        rec.set("status", "accepted");
        rec.set("supplierUid", uid);
        rec.set("supplierPseudo", me.player.pseudo);
        rec.set("deposit", res.deposit);
        rec.set("acceptedAtMs", now);
        rec.set("deadlineMs", res.deadlineMs);
        txApp.save(rec);
        notify(txApp, c.clientUid, [
          { kind: "gift", title: "Contrat accepté", message: `${me.player.pseudo} s'engage à te livrer ${game.describeAmount(c.wantRes, c.wantAmount)} sous ${c.hours} h (caution : ${game.describeAmount(c.payRes, res.deposit)}).`, createdAtMs: now, read: false },
        ]);
      } else if (action === "cancel") {
        if (c.clientUid !== uid) throw new NotFoundError("Contrat introuvable.");
        game.cancelTradeContract(c, me.player);
        savePlayer(txApp, game, me.loaded, me.player, me.queues);
        rec.set("status", "cancelled");
        rec.set("closedAtMs", now);
        txApp.save(rec);
      } else if (action === "abandon") {
        if (c.supplierUid !== uid || c.status !== "accepted") throw new game.GameActionError("Ce contrat ne t'est pas attribué.");
        if (c.fleetId) {
          const f = findOrNull(txApp, "fleets", c.fleetId);
          if (f && f.getString("status") === "outbound") throw new game.GameActionError("Ta livraison est en route : rappelle-la d'abord.");
        }
        failTradeContractRec(txApp, game, rec, now, `${me.player.pseudo} a abandonné le contrat`);
      } else throw new game.GameActionError("Action inconnue.");
    } catch (err) {
      throw asHttpError(game, err);
    }
    out = toPlain(rec);
  });
  return e.json(200, out);
}

/** Échec ou expiration : le client récupère son paiement (et la caution si un livreur s'était engagé). */
function failTradeContractRec(txApp, game, rec, now, reason) {
  const c = toPlain(rec);
  const accepted = c.status === "accepted";
  rec.set("status", accepted ? "failed" : "expired");
  rec.set("closedAtMs", now);
  txApp.save(rec);
  if (!findOrNull(txApp, "players", c.clientUid)) return;
  const client = loadFlushed(txApp, game, c.clientUid);
  const penalty = game.failTradeContract(c, client.player);
  savePlayer(txApp, game, client.loaded, client.player, client.queues);
  notify(txApp, c.clientUid, client.notifications.concat([
    {
      kind: "gift",
      title: accepted ? "Contrat non honoré" : "Contrat expiré",
      message: accepted
        ? `${reason} : ton paiement de ${game.describeAmount(c.payRes, c.payAmount)} t'est rendu, avec la caution de ${game.describeAmount(c.payRes, penalty)}.`
        : `Personne n'a pris ton contrat : ${game.describeAmount(c.payRes, c.payAmount)} te sont rendus.`,
      createdAtMs: now,
      read: false,
    },
  ]));
  if (accepted && c.supplierUid && reason.indexOf("abandonné") < 0) {
    notify(txApp, c.supplierUid, [
      { kind: "gift", title: "Contrat échu", message: `Tu n'as pas livré ${c.clientPseudo} à temps : ta caution de ${game.describeAmount(c.payRes, penalty)} lui revient.`, createdAtMs: now, read: false },
    ]);
  }
}

/** Tâche planifiée : contrats ouverts expirés, contrats acceptés échus sans livraison en route. */
function tradeContractsTick(now) {
  const game = loadGame();
  const due = $app.findRecordsByFilter(
    "trade_contracts",
    '(status = "open" && expiresAtMs <= {:n}) || (status = "accepted" && deadlineMs <= {:n})',
    "createdAtMs",
    100,
    0,
    { n: now },
  );
  let count = 0;
  due.forEach((r) => {
    try {
      $app.runInTransaction((txApp) => {
        applyContent(txApp, game);
        const rec = txApp.findRecordById("trade_contracts", r.id);
        const st = rec.getString("status");
        if (st !== "open" && st !== "accepted") return;
        failTradeContractRec(txApp, game, rec, now, "Échéance dépassée");
      });
      count++;
    } catch (err) {
      console.log(`[cosmic] contrat ${r.id} : ${err}`);
    }
  });
  return count;
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
  const report = new Record(txApp.findCollectionByNameOrId("battle_reports"));
  report.load(out.report);
  txApp.save(report);
  notify(txApp, fleet.targetUid, withReportLink(out.notifications, report.id));
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
  const report = new Record(txApp.findCollectionByNameOrId("battle_reports"));
  report.load(out.report);
  txApp.save(report);
  notify(txApp, fleet.ownerUid, withReportLink(out.notifications, report.id));
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
  const recs = uid ? [findOrNull($app, "players", uid)].filter(Boolean) : $app.findRecordsByFilter("players", "npc = ''", "", 0, 0);
  let changed = 0;
  recs.forEach((candidate) => {
    try {
      $app.runInTransaction((txApp) => {
        applyContent(txApp, game);
        const rec = txApp.findRecordById("players", candidate.id);
        const player = toPlain(rec);
        player.uid = rec.id;
        // v4.2 : ni seigneurs de guerre ni joueurs en vacances.
        if (player.npc || game.onVacation(player, now)) return;
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
  // v4.2 : seigneur parti (vendetta perdue) : la flotte rentre sans combattre.
  const absent = defender && defender.player.npc ? warlordAbsence(txApp, game, defenderUid, now) : null;
  const result = defender && !absent
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
        // v4.2 : butin d'un seigneur plafonné à 6 h de production de sa cible.
        lootCap: attacker.player.npc ? game.warlordLootCap(defender.player) : undefined,
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
  // v5.10 : le rapport d'abord, pour que les notifications de combat y mènent.
  const report = new Record(txApp.findCollectionByNameOrId("battle_reports"));
  report.load(result.report);
  txApp.save(report);
  notify(txApp, fleet.ownerUid, withReportLink(result.notifications, report.id));
  notify(txApp, defenderUid, withReportLink(result.defenderNotifications, report.id));
  // v4.2 : seigneurs de guerre (vendetta, répliques).
  try {
    warlordAfterCombat(txApp, game, attacker, defender, result, now);
  } catch (err) {
    console.log(`[cosmic] seigneurs après combat : ${err}`);
  }
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
      // v4.9.3 : dernière erreur gardée en mémoire pour l'alerte de l'admin.
      try {
        $app.store().set(`cosmic_fleet_err_${candidate.id}`, { message: String(err).slice(0, 300), atMs: Date.now() });
      } catch (_) {
        /* mémoire indisponible */
      }
    }
  });
  return due.length;
}

/** Retard au-delà duquel une flotte est considérée bloquée. */
const STUCK_FLEET_MS = 10 * 60_000;

/** GET /api/cosmic/admin/stuck-fleets — flottes que la tâche n'arrive pas à traiter (v4.9.3). */
function adminStuckFleets(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const now = Date.now();
  const limit = now - STUCK_FLEET_MS;
  const recs = $app.findRecordsByFilter(
    "fleets",
    '(status = "outbound" && arriveAtMs <= {:t}) || (status = "returning" && returnAtMs > 0 && returnAtMs <= {:t}) || ((status = "stationed" || status = "decision") && stationedUntilMs > 0 && stationedUntilMs <= {:t})',
    "arriveAtMs",
    100,
    0,
    { t: limit },
  );
  const items = recs.map((r) => {
    const status = r.getString("status");
    const dueAt = status === "outbound" ? r.getFloat("arriveAtMs") : status === "returning" ? r.getFloat("returnAtMs") : r.getFloat("stationedUntilMs");
    let lastError = null;
    try {
      lastError = $app.store().get(`cosmic_fleet_err_${r.id}`) || null;
    } catch (_) {
      lastError = null;
    }
    return {
      id: r.id,
      mission: r.getString("mission"),
      status,
      ownerPseudo: r.getString("ownerPseudo"),
      targetPseudo: r.getString("targetPseudo"),
      factionId: r.getString("factionId"),
      dueAtMs: dueAt,
      lateMs: now - dueAt,
      lastError,
    };
  });
  return e.json(200, { thresholdMs: STUCK_FLEET_MS, count: items.length, items });
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
        : mission === "seasonboss"
        ? "seasonboss"
        : mission === "allianceboss"
        ? "allianceboss"
        : mission === "transport"
          ? String(body.colonyId || "")
          : mission === "delivery"
          ? `contract:${String(body.contractId || "")}`
          : mission === "bounty"
            ? body.bountyId
              ? `bounty_${body.bountyId}`
              : ""
            : mission === "elite"
              ? "bounty_elite"
              : String(body.targetUid || "");
  if (!targetUid) throw new BadRequestError("Cible manquante.");
  if (["attack", "spy", "recycle", "patrol", "garrison", "lair", "expedition", "leviathan", "transport", "bounty", "elite", "seasonboss", "allianceboss", "delivery"].indexOf(mission) < 0) throw new BadRequestError("Mission inconnue.");
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
    if (game.onVacation(attacker.player, now)) throw new BadRequestError("Tu es en vacances : reviens d'abord pour lancer une flotte.");
    if (mission === "attack" || mission === "spy" || mission === "garrison") {
      if (!db.findOrNull(txApp, "players", colonyOwner || targetUid)) throw new NotFoundError("Ce joueur est introuvable.");
      const gone = warlordAbsence(txApp, game, targetUid, now);
      if (gone) throw new BadRequestError(`${gone.name} a quitté le secteur après sa défaite : retour dans ${Math.ceil((gone.untilMs - now) / 3600000)} h.`);
      target = db.loadPlayer(txApp, game, colonyOwner || targetUid, "Ce joueur est introuvable.").player;
    } else if (mission === "recycle") {
      debris = loadDebris(txApp, targetUid).field;
    }
    // v5.1 : livraison d'un contrat — le client est la cible.
    let contractRec = null;
    if (mission === "delivery") {
      contractRec = db.findOrNull(txApp, "trade_contracts", String(body.contractId || ""));
      if (!contractRec) throw new NotFoundError("Contrat introuvable.");
      target = db.loadPlayer(txApp, game, contractRec.getString("clientUid"), "Le client n'existe plus.").player;
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
    let seasonBoss = null;
    if (mission === "seasonboss") {
      try {
        seasonBoss = game.checkSeasonBossLaunch(readSeasonBoss(txApp, game), attackerUid, attacker.player.pseudo, now);
      } catch (err) {
        throw db.asHttpError(game, err);
      }
    }
    // v4.6 : boss d'alliance (état sur la fiche de l'alliance).
    let allianceBoss = null;
    let allianceBossRec = null;
    if (mission === "allianceboss") {
      const aid = attacker.rec.getString("allianceId");
      allianceBossRec = aid ? db.findOrNull(txApp, "alliances", aid) : null;
      try {
        allianceBoss = game.checkAllianceBossLaunch(allianceBossRec ? db.readAllianceBoss(game, allianceBossRec) : null, attackerUid, attacker.player.pseudo, now);
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
        eliteName: elite ? game.describeElite(elite).name : seasonBoss ? (game.bossMonthOf(seasonBoss) || { boss: { name: "Boss de saison" } }).boss.name : allianceBoss ? game.allianceBossDef(allianceBoss).name : undefined,
        capsules: mission === "attack" ? body.capsules : undefined,
        delivery: contractRec ? db.toPlain(contractRec) : undefined,
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
    if (["attack", "lair", "expedition", "leviathan", "bounty", "elite", "seasonboss", "allianceboss"].indexOf(mission) >= 0) rec.set("formation", game.isFormation(body.formation) ? body.formation : "balanced");
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
    if (seasonBoss) writeSeasonBoss(txApp, game, seasonBoss);
    if (allianceBoss && allianceBossRec) {
      allianceBossRec.set("boss", allianceBoss);
      txApp.save(allianceBossRec);
    }
    if (elite) writeElite(txApp, game, elite);
    if (contractRec) {
      contractRec.set("fleetId", rec.id);
      txApp.save(contractRec);
    }
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
      .findRecordsByFilter("players", "(seasonId = {:s} || lastSeasonId = {:s}) && npc = ''", "", 0, 0, { s: seasonId })
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
    // v5.1 : guerres de saison — podium récompensé (trésor et titre d'alliance).
    const war = seasonWarStandingsFor(txApp, game, seasonId);
    war.slice(0, 10).forEach((st) => {
      const a = findOrNull(txApp, "alliances", st.allianceId);
      if (!a) return;
      const al = toPlain(a);
      const rec = new Record(collection);
      rec.load({ seasonId, kind: "seasonwar", uid: `seasonwar_${al.id}`, pseudo: `[${al.tag}] ${al.name}`, allianceId: al.id, rank: st.rank, seasonXp: st.score, reward: null, createdAtMs: now });
      txApp.save(rec);
      const hours = game.SEASON_WAR_RULES.rewardHours[st.rank - 1];
      if (!hours) return;
      const title = game.SEASON_WAR_RULES.titles[st.rank - 1];
      const treasury = al.treasury || {};
      const members = (al.members || []).filter((uid) => findOrNull(txApp, "players", uid));
      members.forEach((uid) => {
        const loaded = loadPlayer(txApp, game, uid);
        const gain = game.productionHours(loaded.player, hours);
        Object.keys(gain).forEach((r) => (treasury[r] = (Number(treasury[r]) || 0) + Math.floor(gain[r] || 0)));
        const out = game.performSeasonReward(loaded.player, loaded.queues, { seasonId, rank: st.rank, seasonXp: st.score }, { hours: 0, rare: 0, title }, now, `Guerres de saison : ton alliance [${al.tag}] finit ${st.rank === 1 ? "1re" : `${st.rank}e`} !`);
        savePlayer(txApp, game, loaded, out.player, out.queues);
        notify(txApp, uid, out.notifications.concat([
          { kind: "alliance", title: "Guerres de saison", message: `[${al.tag}] termine ${st.rank === 1 ? "1re" : `${st.rank}e`} du classement de guerre : ${hours} h de production des membres versées au trésor, titre « ${title} ».`, createdAtMs: now, read: false, link: "/game/alliance?onglet=guerre" },
        ]));
      });
      a.set("treasury", treasury);
      txApp.save(a);
    });
    // v5.10.5 : ligues — montées, descentes et récompense selon la ligue.
    try {
      const lrec = configRecord(txApp, game.LEAGUES_KEY);
      const leagues = game.normalizeLeagues(lrec ? toPlain(lrec).data : null);
      const everyone = proceduralPlayers(txApp);
      const closed = game.closeLeagues(leagues, everyone, seasonId, game.currentSeasonId(now));
      closed.rewards.forEach((r) => {
        if (!findOrNull(txApp, "players", r.uid)) return;
        const info = game.leagueInfo(r.tier);
        const next = game.leagueInfo(r.to);
        const loaded = loadPlayer(txApp, game, r.uid);
        const headline = r.move === "up" ? `Ligue : promotion en ${next.label} ${next.emoji} !` : r.move === "down" ? `Ligue : retour en ${next.label}` : `Ligue ${info.label} : ${r.rank}${r.rank === 1 ? "er" : "e"}`;
        const out = game.performSeasonReward(loaded.player, loaded.queues, { seasonId, rank: r.rank, seasonXp: 0 }, { hours: r.hours, rare: 0, title: "" }, now, headline);
        savePlayer(txApp, game, loaded, out.player, out.queues);
        notify(txApp, r.uid, out.notifications.map((n) => (n.kind === "season" && n.title === headline ? Object.assign({}, n, { message: `${info.emoji} Ligue ${info.label}, ${r.rank}${r.rank === 1 ? "er" : "e"} : ${r.hours} h de production versées.`, link: "/game/joueurs?onglet=ligues" }) : n)));
      });
      writeConfig(txApp, game.LEAGUES_KEY, closed.state);
    } catch (err) {
      console.log(`[cosmic] ligues : ${err}`);
    }
    summary = { seasonId, closed: true, ranked: standings.length, rewarded: summary.rewarded, alliances: allianceStanding.length, seasonWar: war.length };
  });
  return summary;
}
/* ---------- Alliances (v1.9) ---------- */

const ALLIANCE_FIELDS = ["name", "tag", "createdBy", "createdAtMs", "members", "memberPseudos", "roles", "treasury", "research", "activeResearch", "distributions", "projects", "projectContributors", "profile"];

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
  a.profile = a.profile || null;
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
    // v5.10.5 : candidatures (postuler, retirer) visent une autre alliance que la sienne.
    const external = action.type === "join" || action.type === "apply" || action.type === "withdraw";
    const allianceId = external ? String(action.allianceId || "") : String(flushed.player.allianceId || "");
    let allianceRec = null;
    if (action.type !== "create" && allianceId) {
      allianceRec = findOrNull(txApp, "alliances", allianceId);
    }
    let target = null;
    if (action.type === "distribute" || action.type === "applicationAccept") {
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
    targets = $app.findRecordsByFilter("players", "npc = ''", "", 0, 0).map((r) => r.id);
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
        res = game.declareWar({ actorUid: uid, actorPseudo: pseudo, own, target, wars: warsOf(txApp, [own.id, target.id]).map(warJson), now, chest: req.payFrom === "chest" ? game.readWarChest(toPlain(ownRec).warChest) : null });
      } catch (err) {
        throw asHttpError(game, err);
      }
      ownRec.set("treasury", res.own.treasury);
      if (res.chest) ownRec.set("warChest", res.chest);
      txApp.save(ownRec);
      const rec = new Record(txApp.findCollectionByNameOrId("alliance_wars"));
      rec.load(res.war);
      txApp.save(rec);
      const startText = `Début des hostilités dans ${game.WAR_RULES.prepHours} h, pour ${game.WAR_RULES.durationHours} h.`;
      notifyAlliance(txApp, own.id, "Guerre déclarée", `${pseudo} a déclaré la guerre à [${target.tag}] ${target.name}. ${startText}`, now);
      notifyAlliance(txApp, target.id, "Déclaration de guerre !", `[${own.tag}] ${own.name} vous déclare la guerre. ${startText}`, now);
      out = warJson(rec);
    } else if (req.action === "chestShield") {
      // v5.1 : bouclier de 2 h offert à un membre par le coffre de guerre.
      if (!game.canDiplomacyIn(own, uid)) throw new BadRequestError("Seuls le fondateur, les officiers et les diplomates disposent du coffre de guerre.");
      const memberUid = String(req.memberUid || "");
      if ((own.members || []).indexOf(memberUid) < 0) throw new BadRequestError("Ce commandant n'est pas membre de l'alliance.");
      const member = loadFlushed(txApp, game, memberUid);
      const chest = game.readWarChest(toPlain(ownRec).warChest);
      let res;
      try {
        res = game.grantChestShield(chest, member.player, now);
      } catch (err) {
        throw asHttpError(game, err);
      }
      savePlayer(txApp, game, member.loaded, member.player, member.queues);
      ownRec.set("warChest", chest);
      txApp.save(ownRec);
      notify(txApp, memberUid, member.notifications.concat([
        { kind: "alliance", title: "Bouclier offert", message: `${pseudo} t'offre un bouclier de ${game.WAR_CHEST_RULES.shieldHours} h financé par le coffre de guerre : aucune attaque ne peut te viser.`, createdAtMs: now, read: false },
      ]));
      out = { warChest: chest, untilMs: res.untilMs };
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
/** v5.1 : reliques mythiques déjà remises (game_config, clé "mythic_relics" : saison → uid). */
function readMythicGiven(txApp) {
  try {
    return toPlain(txApp.findFirstRecordByFilter("game_config", "key = 'mythic_relics'")).data || {};
  } catch (_) {
    return {};
  }
}

function writeMythicGiven(txApp, given) {
  let cfg = null;
  try {
    cfg = txApp.findFirstRecordByFilter("game_config", "key = 'mythic_relics'");
  } catch (_) {
    cfg = new Record(txApp.findCollectionByNameOrId("game_config"));
    cfg.set("key", "mythic_relics");
  }
  cfg.set("data", given);
  txApp.save(cfg);
}

/** Remet la mythique au n°1 d'un boss tué si c'est le boss qui la porte ce mois-ci. */
function grantMythicTo(txApp, game, player, source, now) {
  const out = game.grantMythicRelic(player, source, now, readMythicGiven(txApp));
  if (!out) return "";
  writeMythicGiven(txApp, out.given);
  return out.name;
}

/** v5.9 : récompense d'un participant, gardée dans l'état du boss pour son bilan. */
function bossRewardEntry(r) {
  const out = {};
  const gain = {};
  Object.keys(r.gain || {}).forEach((k) => {
    if (Number(r.gain[k]) > 0) gain[k] = Math.floor(Number(r.gain[k]));
  });
  if (Object.keys(gain).length) out.gain = gain;
  if (Number(r.points) > 0) out.points = Number(r.points);
  if (r.title) out.title = String(r.title);
  if (r.relic) out.relic = String(r.relic);
  if (r.mythic) out.mythic = String(r.mythic);
  if (Number(r.tokens) > 0) out.tokens = Math.floor(Number(r.tokens));
  return out;
}

/** v5.12 : ajoute les jetons du casino aux détails d'une notification. */
function tokenNotifData(data, tokens) {
  if (!(tokens > 0)) return data;
  return Object.assign({}, data || {}, { tokens });
}

/** v5.9 : détails structurés d'une notification de boss (pastilles). */
function bossNotifData(gain, relic, mythic) {
  const resources = {};
  Object.keys(gain || {}).forEach((k) => {
    if (Number(gain[k]) > 0) resources[k] = Math.floor(Number(gain[k]));
  });
  const relicName = mythic || relic || "";
  if (!Object.keys(resources).length && !relicName) return null;
  const data = {};
  if (Object.keys(resources).length) data.resources = resources;
  if (relicName) data.relic = relicName;
  return data;
}

/**
 * POST /api/cosmic/admin/bossrewards { kind: "leviathan" | "seasonboss", action: "distribute" }
 * v5.10 : relance une distribution restée bloquée (boss terminé, récompenses non versées).
 * Refusée si la distribution a déjà eu lieu : jamais de double paiement.
 */
function adminBossRewards(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  const req = body(e);
  const kind = String(req.kind || "");
  if (kind !== "leviathan" && kind !== "seasonboss") throw new BadRequestError("Boss inconnu.");
  if (req.action !== "distribute") throw new BadRequestError("Action inconnue.");
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    let state = kind === "leviathan" ? readLeviathan(txApp, game) : readSeasonBoss(txApp, game);
    if (!state) throw new BadRequestError("Aucun boss enregistré.");
    if (state.rewarded) throw new BadRequestError("Récompenses déjà versées : rien à rejouer.");
    if (state.status === "active" && now < state.endMs && state.hp > 0) throw new BadRequestError("Le combat est encore en cours.");
    if (state.status === "active") state = Object.assign({}, state, { status: state.hp <= 0 ? "killed" : "failed", endedAtMs: state.endedAtMs || now });
    state = kind === "leviathan" ? distributeLeviathan(txApp, game, state, now) : distributeSeasonBoss(txApp, game, state, now);
    if (kind === "leviathan") writeLeviathan(txApp, state);
    else writeSeasonBoss(txApp, game, state);
    const log = new Record(txApp.findCollectionByNameOrId("admin_logs"));
    log.load({
      actorId: e.auth ? e.auth.id : "superuser",
      actorName: e.auth ? e.auth.getString("name") || e.auth.getString("username") || e.auth.getString("email") : "superuser",
      action: "update",
      targetCollection: "game_config",
      recordId: kind,
      recordLabel: `${kind === "leviathan" ? "Léviathan" : "Boss de saison"} : distribution relancée`,
      changes: { participants: Object.keys(state.rewards || {}).length },
      createdAtMs: now,
    });
    txApp.save(log);
    out = state;
  });
  return e.json(200, out);
}

/** v5.10 : archive le combat dans le Hall of fame (game_config boss_history). */
function archiveBoss(txApp, game, kind, state, meta) {
  try {
    const rec = configRecord(txApp, game.BOSS_HISTORY_KEY);
    const list = game.normalizeBossHistory(rec ? toPlain(rec).data : null);
    writeConfig(txApp, game.BOSS_HISTORY_KEY, { entries: game.pushBossHistory(list, game.bossHistoryEntry(kind, state, meta)) });
  } catch (err) {
    console.log(`[cosmic] hall of fame : ${err}`);
  }
}

/**
 * v5.10.2 : combat d'avant la 5.10 → coup de grâce retrouvé (une seule fois) puis archivé.
 * La flotte qui l'a abattu porte l'issue « attacker_win » depuis la 3.1 ; à défaut, on le
 * déduit des derniers assauts.
 */
function withLegacyKiller(txApp, game, state, mission) {
  let killer = state.killedBy || null;
  if (!killer && state.status === "killed") {
    try {
      const recs = txApp.findRecordsByFilter("fleets", "mission = {:m} && outcome = 'attacker_win' && arriveAtMs >= {:a} && arriveAtMs <= {:b}", "-arriveAtMs", 1, 0, {
        m: mission,
        a: state.startMs,
        b: (state.endedAtMs || state.endMs) + 600000,
      });
      const uid = recs.length ? recs[0].getString("ownerUid") : "";
      if (uid && state.contributions[uid]) killer = { uid, pseudo: state.contributions[uid].pseudo };
    } catch (_) {
      /* flottes purgées : déduction ci-dessous */
    }
    if (!killer) killer = game.inferKilledBy(state);
  }
  return Object.assign({}, state, { archived: true, legacyChecked: true }, killer ? { killedBy: killer } : {});
}

/** v5.14 : notification du butin d'un combat (tables de butin). */
function lootNotif(loot, now) {
  return {
    kind: "event",
    title: loot.relic ? "Butin : une relique !" : "Butin : une capsule",
    message: `Dans l'épave :${loot.relic ? ` relique ${loot.relic}` : ""}${loot.relic && loot.capsule ? " et" : ""}${loot.capsule ? ` capsule ${loot.capsule.name} niv. ${loot.capsule.level}` : ""}.`,
    createdAtMs: now,
    read: false,
    link: "/game/etat-major",
  };
}

/** v5.14 : notification d'un officier rare trouvé sur un boss. */
function rareOfficerNotif(officer, now) {
  return {
    kind: "event",
    title: `${officer.title} ${officer.name} rejoint ton état-major !`,
    message: `Trouvé dans l'épave du boss : un officier rare, qui ne se recrute pas. Au niveau 1 : ${officer.bonus(1)}.`,
    createdAtMs: now,
    read: false,
    link: "/game/etat-major",
  };
}

function distributeLeviathan(txApp, game, state, now) {
  if (state.rewarded || state.status === "active") return state;
  const ranking = game.leviathanRanking(state);
  const rewards = {};
  const casino = readCasino(txApp, game).settings;
  ranking.forEach((c, i) => {
    if (!findOrNull(txApp, "players", c.uid)) return;
    const owner = loadPlayer(txApp, game, c.uid);
    const flushed = game.flushPlayer(owner.player, owner.queues, now);
    const out = game.grantLeviathanReward(state, flushed.player);
    const won = state.status === "killed";
    const mythic = won && i === 0 ? grantMythicTo(txApp, game, flushed.player, "leviathan", now) : "";
    const tokens = game.grantTokens(flushed.player, game.bossTokens(casino, won, i));
    // v5.14 : officier rare (rôle hors recrutement), à très faible chance.
    const officer = won ? game.rollRareOfficer(flushed.player, i < 3 ? game.RARE_OFFICER_RULES.podium : game.RARE_OFFICER_RULES.participant) : null;
    if (officer) flushed.notifications.push(rareOfficerNotif(officer, now));
    // v5.14 : butin du boss (relique, capsule), en plus des récompenses.
    const loot = won ? game.rollLoot(flushed.player, "worldBoss", now, i) : null;
    if (loot && (loot.relic || loot.capsule)) flushed.notifications.push(lootNotif(loot, now));
    savePlayer(txApp, game, owner, flushed.player, flushed.queues);
    rewards[c.uid] = bossRewardEntry({ gain: out.gain, title: out.title ? game.worldBossTitle(state) : "", relic: out.relic, mythic, tokens });
    notify(txApp, c.uid, flushed.notifications.concat([
      {
        kind: "event",
        title: won ? `${game.worldBossName(state)} est tombé !` : `${game.worldBossName(state)} s'est retiré`,
        message: `Récompense : ${game.describeGain(out.gain)}${out.title ? ` et le titre « ${game.worldBossTitle(state)} »` : ""}.${out.relic ? ` Relique : ${out.relic} !` : ""}${mythic ? ` Relique MYTHIQUE : ${mythic} !` : ""}${out.amber ? ` +${out.amber} Ambre (collection de reliques pleine).` : ""}${tokens ? ` +${game.tokensLabel(tokens)}.` : ""}`,
        createdAtMs: now,
        read: false,
        link: "/game/leviathan",
        data: tokenNotifData(Object.assign({}, bossNotifData(out.gain, out.relic, mythic) || {}, out.amber ? { amber: out.amber } : {}), tokens),
      },
    ]));
  });
  const top = ranking[0];
  archiveBoss(txApp, game, "leviathan", state, { name: game.worldBossName(state), image: game.worldBossOf(state).image });
  return Object.assign({}, state, {
    rewarded: true,
    archived: true,
    rewards,
    titleHolder: state.status === "killed" && top ? { uid: top.uid, untilMs: now + game.LEVIATHAN_RULES.titleDays * 86400000, title: game.worldBossTitle(state) } : state.titleHolder,
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
    game.grantCommanderXp(owner.player, "hunter", game.COMMANDER_XP.bossAssault);
    game.addPassPoints(owner.player, "bossAssault", now);
    owner.rec.set("commanders", owner.player.commanders || null);
    owner.rec.set("seasonPass", owner.player.seasonPass || null);
    txApp.save(owner.rec);
  }
  const lost = Object.keys(res.lost).reduce((a, k) => a + res.lost[k], 0);
  notify(txApp, fleet.ownerUid, [
    {
      kind: "combat-attacker",
      title: res.killed ? `Coup de grâce sur ${game.worldBossName(state)} !` : `Assaut sur ${game.worldBossName(state)}`,
      message: res.damage > 0 ? `${game.formatInt(res.damage)} dégâts infligés, ${lost} vaisseau(x) perdu(s).` : `${game.worldBossName(state)} n'était plus là : la flotte rentre.`,
      createdAtMs: now,
      read: false,
    },
  ]);
  if (res.killed) next = distributeLeviathan(txApp, game, next, now);
  writeLeviathan(txApp, next);
}

/**
 * v5.10.5 : rappels des boss mondiaux — la veille de l'apparition, puis N heures
 * avant la fin s'il tient encore. Chacun n'est envoyé qu'une fois. Retourne l'état
 * (marqué si le rappel de fin est parti).
 */
function bossReminders(txApp, game, kind, state, next, now) {
  const isLev = kind === "leviathan";
  const month = !isLev && state ? game.bossMonthOf(state) : null;
  const link = isLev ? "/game/leviathan" : "/game/boss";
  const actives = () => txApp.findRecordsByFilter("players", "resourcesUpdatedAtMs >= {:t} && npc = ''", "", 500, 0, { t: now - 7 * 86400000 });
  const send = (title, message) =>
    actives().forEach((r) => {
      try {
        notify(txApp, r.id, [{ kind: "event", title, message, createdAtMs: now, read: false, link }]);
      } catch (_) {
        /* facultatif */
      }
    });
  // La veille.
  const rec = configRecord(txApp, "boss_reminders");
  const sent = rec ? toPlain(rec).data || {} : {};
  if (game.eveReminderDue(next, sent[kind], now)) {
    const nextMonth = !isLev ? game.bossMonthOf({ id: next.id || "" }) : null;
    const name = isLev ? game.worldBossForStart(next.startMs).name : nextMonth ? nextMonth.boss.name : "Le boss de saison";
    send(`${name} arrive ${game.parisRelativeLabel(next.startMs, now)}`, `Préparez vos flottes d'attaque : ${isLev ? "tout le serveur" : "tout le secteur"} devra frapper ensemble. Un assaut toutes les ${game.LEVIATHAN_RULES.cooldownHours} h.`);
    writeConfig(txApp, "boss_reminders", Object.assign({}, sent, { [kind]: next.startMs }));
  }
  // Avant la fin, s'il tient encore.
  if (game.endingReminderDue(state, now)) {
    const name = isLev ? game.worldBossName(state) : month ? month.boss.name : "Le boss de saison";
    const pct = Math.max(1, Math.round((state.hp / state.maxHp) * 100));
    const hours = Math.max(1, Math.round((state.endMs - now) / 3600000));
    send(`Plus que ${hours} h contre ${name} !`, `Il lui reste ${pct} % de sa structure. Un dernier effort avant ${game.parisWhenLabel(state.endMs)}, sinon il repart et les récompenses sont réduites.`);
    return Object.assign({}, state, { endingNotified: true });
  }
  return state;
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
        game.removeLeviathanTitle(holder.player, state.titleHolder.title || undefined);
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
      // v5.10 : combat terminé avant le Hall of fame → archivé une fois.
      // v5.10.2 : un boss abattu avant la 5.10 retrouve son coup de grâce (archive mise à jour).
      if (state.status !== "active" && state.rewarded && (!state.archived || (state.status === "killed" && !state.killedBy && !state.legacyChecked))) {
        state = withLegacyKiller(txApp, game, state, "leviathan");
        archiveBoss(txApp, game, "leviathan", state, { name: game.worldBossName(state), image: game.worldBossOf(state).image });
        changed = true;
      }
    }
    const win = game.leviathanWindow(now);
    if (win && (!state || state.id !== win.id) && (!state || state.status !== "active")) {
      const actives = txApp.findRecordsByFilter("players", "resourcesUpdatedAtMs >= {:t} && npc = ''", "", 500, 0, { t: now - 7 * 86400000 }).map((r) => toPlain(r));
      state = game.spawnLeviathan(win, actives, state);
      changed = true;
      actives.forEach((p) => {
        try {
          notify(txApp, p.id, [{ kind: "event", title: `${game.worldBossName(state)} approche !`, message: `${game.worldBossOf(state).story.split(". ")[0]}. Unissez vos flottes avant ${game.parisWhenLabel(state.endMs)} (page Boss mondial).`, createdAtMs: now, read: false, link: "/game/leviathan" }]);
        } catch (_) {
          /* facultatif */
        }
      });
    }
    // v5.10.5 : rappels (la veille, avant la fin).
    const upcoming = game.bossWindows(now, game.leviathanSchedule(), 2).filter((w) => w.startMs > now)[0] || null;
    const reminded = bossReminders(txApp, game, "leviathan", state, upcoming, now);
    if (reminded !== state) {
      state = reminded;
      changed = true;
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
/** v5.10.4 : réglage à chaud d'un boss mondial, consigné dans le journal admin. */
function bossAdminLog(txApp, e, recordId, label, changes, now) {
  const log = new Record(txApp.findCollectionByNameOrId("admin_logs"));
  log.load({
    actorId: e.auth ? e.auth.id : "superuser",
    actorName: e.auth ? e.auth.getString("name") || e.auth.getString("username") || e.auth.getString("email") : "superuser",
    action: "update",
    targetCollection: "game_config",
    recordId,
    recordLabel: label,
    changes,
    createdAtMs: now,
  });
  txApp.save(log);
}

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
      if (state && state.status === "active" && now < state.endMs) throw new BadRequestError(`${game.worldBossName(state)} est déjà là.`);
      const actives = txApp.findRecordsByFilter("players", "resourcesUpdatedAtMs >= {:t} && npc = ''", "", 500, 0, { t: now - 7 * 86400000 }).map((r) => toPlain(r));
      state = game.spawnLeviathan({ id: `lev-manual-${now}`, startMs: now, endMs: now + game.LEVIATHAN_RULES.durationHours * 3600000 }, actives, state, String(body(e).bossId || "") || undefined);
    } else if (action === "stop") {
      if (!state || state.status !== "active") throw new BadRequestError("Aucun boss mondial en cours.");
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
    } else if (action === "reschedule") {
      // v5.10.4 : prolonger ou écourter le combat en cours.
      const before = state ? state.endMs : 0;
      try {
        state = game.rescheduleBoss(state, Number(body(e).endMs), now);
      } catch (err) {
        throw asHttpError(game, err);
      }
      bossAdminLog(txApp, e, "leviathan", "Léviathan : fin du combat déplacée", { endMs: { avant: before, après: state.endMs } }, now);
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
    if (game.onVacation(seller.player, now)) throw new BadRequestError("Tu es en vacances : reviens d'abord pour échanger.");
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
      kind: offer.kind,
      filled: 0,
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
    // v5.13 : plus d'échange avec un PNJ (Courtier du Comptoir, seigneurs de guerre).
    if (offer.sellerId === "market_maker") throw new BadRequestError("Cette offre a été retirée du marché.");
    const seller = loadFlushed(txApp, game, offer.sellerId, "Le vendeur n'existe plus.");
    if (seller.loaded.rec.getString("npc")) throw new BadRequestError("Cette offre a été retirée du marché.");
    if (game.onVacation(buyer.player, now)) throw new BadRequestError("Tu es en vacances : reviens d'abord pour échanger.");
    buyer.player.allianceId = buyer.loaded.rec.getString("allianceId");
    const buysToday = txApp.findRecordsByFilter("market_offers", "buyerId = {:u} && filledAtMs >= {:t}", "", 200, 0, { u: uid, t: game.utcDayStart(now) }).length;
    // v5.1 : ordre d'achat — livraison partielle, paiement au prorata.
    if (offer.kind === "buy") {
      let fill;
      try {
        fill = game.fillBuyOrder(offer, buyer.player, seller.player, body(e).qty, buysToday, now);
      } catch (err) {
        throw asHttpError(game, err);
      }
      savePlayer(txApp, game, buyer.loaded, buyer.player, buyer.queues);
      savePlayer(txApp, game, seller.loaded, seller.player, seller.queues);
      notify(txApp, uid, buyer.notifications);
      notify(txApp, offer.sellerId, seller.notifications.concat([
        {
          kind: "gift",
          title: fill.done ? "Ordre d'achat complété" : "Ordre d'achat en partie rempli",
          message: `${buyer.player.pseudo} t'a livré ${game.describeAmount(offer.wantRes, fill.qty)} : +${game.describeAmount(offer.wantRes, fill.qty - fill.tax)} (taxe : ${game.describeAmount(offer.wantRes, fill.tax)}).${fill.done ? "" : ` Reste ${game.describeAmount(offer.wantRes, offer.wantAmount - fill.filled)} à recevoir.`}`,
          createdAtMs: now,
          read: false,
        },
      ]));
      rec.set("filled", fill.filled);
      rec.set("tax", rec.getFloat("tax") + fill.tax);
      if (fill.tax > 0) addServerPot(txApp, game, "market", { [offer.wantRes]: fill.tax }, now);
      rec.set("buyerId", uid);
      rec.set("buyerPseudo", buyer.player.pseudo);
      if (fill.done) {
        rec.set("status", "filled");
        rec.set("filledAtMs", now);
      }
      txApp.save(rec);
      out = offerJson(rec);
      return;
    }
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
    if (res.tax > 0) addServerPot(txApp, game, "market", { [offer.wantRes]: res.tax }, now);
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

/** v5.13 : plus de ventes automatiques des PNJ (Courtier du Comptoir, seigneurs de guerre) : leurs offres encore ouvertes sont retirées. */
function purgeNpcMarketOffers() {
  const npcs = {};
  $app.findRecordsByFilter("players", "npc != ''", "", 0, 0).forEach((r) => (npcs[r.id] = true));
  let count = 0;
  $app.findRecordsByFilter("market_offers", 'status = "open"', "", 0, 0).forEach((r) => {
    const seller = r.getString("sellerId");
    if (seller !== "market_maker" && !npcs[seller]) return;
    r.set("status", "expired");
    $app.save(r);
    count++;
  });
  if (count > 0) console.log(`[cosmic] ${count} offre(s) de PNJ retirée(s) du marché`);
  return count;
}

/** Offres expirées : marchandise rendue au vendeur (tâche planifiée). */
function expireMarketOffers(now) {
  const game = loadGame();
  purgeNpcMarketOffers();
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
        const back = game.refundOffer(toPlain(rec), seller.player);
        savePlayer(txApp, game, seller.loaded, seller.player, seller.queues);
        notify(txApp, rec.getString("sellerId"), seller.notifications.concat([
          { kind: "gift", title: rec.getString("kind") === "buy" ? "Ordre d'achat expiré" : "Offre expirée", message: `${rec.getString("kind") === "buy" ? "Ton ordre d'achat" : "Ton offre au marché"} a expiré : ${game.describeAmount(rec.getString("giveRes"), back)} te sont rendus.`, createdAtMs: now, read: false },
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

/* ---------- v4.9 : sauvegardes depuis l'administration ---------- */

function backupStamp(now) {
  const d = new Date(now);
  const p = (n) => (n < 10 ? `0${n}` : String(n));
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;
}

/** GET /api/cosmic/admin/backups/list — sauvegardes présentes sur le serveur. */
function adminBackupList(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const out = [];
  const fsys = $app.newBackupsFilesystem();
  try {
    const list = fsys.list("");
    for (let i = 0; i < list.length; i++) {
      const key = String(list[i].key || "");
      if (!key.endsWith(".zip")) continue;
      out.push({ key, size: Number(list[i].size) || 0, modifiedAtMs: new Date(String(list[i].modTime)).getTime() });
    }
  } finally {
    fsys.close();
  }
  out.sort((a, b) => b.modifiedAtMs - a.modifiedAtMs);
  return e.json(200, out);
}

/** GET /api/cosmic/admin/backups/download?key=… — téléchargement d'une sauvegarde. */
function adminBackupDownload(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const key = String(e.request.url.query().get("key") || "");
  if (!/^[A-Za-z0-9._-]{1,120}\.zip$/.test(key)) throw new BadRequestError("Sauvegarde inconnue.");
  const fsys = $app.newBackupsFilesystem();
  try {
    if (!fsys.exists(key)) throw new NotFoundError("Sauvegarde introuvable.");
    fsys.serve(e.response, e.request, key, key);
  } finally {
    fsys.close();
  }
  return null;
}

/**
 * POST /api/cosmic/admin/backups/r2 { create? } — sauvegarde à l'instant
 * (facultatif), puis lance la copie vers Cloudflare R2 (workflow GitHub
 * « Copie vers Cloudflare R2 » : sauvegardes PocketBase et illustrations).
 * Variables : COSMIC_GITHUB_TOKEN (droit « Actions : écriture »),
 * COSMIC_DEPLOY_REPO (défaut : fs0ciety7000/ogame-like).
 */
function adminBackupToR2(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const req = body(e);
  const out = { backup: null, dispatched: false, message: "" };
  if (req.create !== false) {
    const name = `manuelle_${backupStamp(Date.now())}.zip`;
    $app.createBackup(e.request.context(), name);
    out.backup = name;
  }
  const token = $os.getenv("COSMIC_GITHUB_TOKEN");
  const repo = $os.getenv("COSMIC_DEPLOY_REPO") || "fs0ciety7000/ogame-like";
  if (!token) {
    out.message = "Sauvegarde faite. Copie vers R2 non lancée : variable COSMIC_GITHUB_TOKEN absente (elle se fera à 3 h 30).";
    return e.json(200, out);
  }
  const res = $http.send({
    url: `https://api.github.com/repos/${repo}/actions/workflows/r2-backup.yml/dispatches`,
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "Content-Type": "application/json", "User-Agent": "cosmic-empires" },
    body: JSON.stringify({ ref: "main" }),
    timeout: 20,
  });
  out.dispatched = res.statusCode === 204;
  out.message = out.dispatched
    ? "Copie vers R2 lancée : sauvegardes PocketBase et illustrations (quelques minutes, suivi dans GitHub Actions)."
    : `Sauvegarde faite, mais GitHub a refusé de lancer la copie (HTTP ${res.statusCode}) : le jeton doit avoir le droit « Actions : écriture ».`;
  return e.json(200, out);
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
    const recs = $app.findRecordsByFilter("players", "npc = ''", "id", 200, page * 200);
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
  // v4.2 : un seigneur de guerre répond par une réplique toute faite (une fois par jour).
  if (target.getString("npc")) {
    try {
      applyContent($app, game);
      const lord = game.findWarlord(target.getString("npc"));
      if (lord) {
        $app.runInTransaction((txApp) => {
          const st = readWarlordsState(txApp, game);
          if (warlordSay(txApp, game, st, lord, humanPlain(sender), "reply", now + 1, false)) writeWarlordsState(txApp, st);
        });
      }
    } catch (_) {
      /* facultatif */
    }
  }
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
/** v5.10 : verse d'office les récompenses non réclamées d'un défi terminé. */
function payUnclaimedChallenge(txApp, game, ch, now) {
  const casino = readCasino(txApp, game).settings;
  game.unclaimedRewardees(ch).forEach((uid) => {
    if (!findOrNull(txApp, "players", uid)) return;
    const loaded = loadPlayer(txApp, game, uid);
    const flushed = game.flushPlayer(loaded.player, loaded.queues, now);
    const gain = game.grantChallengeReward(ch, flushed.player, { title: false });
    const tokens = game.grantTokens(flushed.player, game.challengeTokens(casino, game.challengeTierIndex(ch)));
    savePlayer(txApp, game, loaded, flushed.player, flushed.queues);
    notify(txApp, uid, flushed.notifications.concat([{ kind: "event", title: "Récompense du défi versée", message: `Tu n'avais pas récupéré ta récompense du défi précédent : elle vient d'être versée (${game.describeGain(gain)}${tokens ? ` et ${game.tokensLabel(tokens)}` : ""}).`, createdAtMs: now, read: false, link: "/game", data: tokenNotifData({ resources: gain }, tokens) }]));
  });
}

/** POST /api/cosmic/challenge/claim — récupère la récompense du défi terminé. */
function challengeClaim(e) {
  const game = loadGame();
  const uid = e.auth.id;
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    const state = readChallengeState(txApp, game);
    const loaded = loadPlayer(txApp, game, uid);
    const flushed = game.flushPlayer(loaded.player, loaded.queues, now);
    let res;
    try {
      res = game.claimChallengeReward(state.previous, flushed.player);
    } catch (err) {
      throw asHttpError(game, err);
    }
    const tokens = game.grantTokens(flushed.player, game.challengeTokens(readCasino(txApp, game).settings, game.challengeTierIndex(state.previous)));
    savePlayer(txApp, game, loaded, flushed.player, flushed.queues);
    writeChallengeState(txApp, game, Object.assign({}, state, { previous: res.challenge }));
    notify(txApp, uid, flushed.notifications.concat([{ kind: "event", title: "Récompense du défi récupérée", message: `+${game.describeGain(res.gain)}${tokens ? ` et ${game.tokensLabel(tokens)}` : ""}.`, createdAtMs: now, read: true, link: "/game", data: tokenNotifData({ resources: res.gain }, tokens) }]));
    out = { gain: res.gain, tokens };
  });
  return e.json(200, out);
}

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
      // v5.10 : les récompenses non réclamées du défi précédent sont versées d'office.
      payUnclaimedChallenge(txApp, game, state.previous, now);
      const top = game.challengeRanking(done)[0];
      const chTokens = game.challengeTokens(readCasino(txApp, game).settings, game.challengeTierIndex(done));
      game.challengeRewardees(done).forEach((uid) => {
        if (!findOrNull(txApp, "players", uid)) return;
        // Le titre du meilleur est remis tout de suite ; les ressources se réclament.
        if (top && top.uid === uid) {
          const loaded = loadPlayer(txApp, game, uid);
          game.grantChallengeReward(done, loaded.player, { resources: false });
          savePlayer(txApp, game, loaded, loaded.player, loaded.queues);
        }
        notify(txApp, uid, [{ kind: "event", title: "Défi de la semaine réussi !", message: `${label} : objectif atteint à ${Math.round((done.total / done.target) * 100)} %. Ta récompense t'attend sur l'accueil : ${tier.hours} h de production, ${tier.rare} de chaque ressource rare${chTokens ? ` et ${game.tokensLabel(chTokens)}` : ""}.${top && top.uid === uid ? ` Tu deviens « ${game.CHALLENGE_RULES.title} » !` : ""}`, createdAtMs: now, read: false, link: "/game" }]);
      });
      state = Object.assign({}, state, {
        current: null,
        previous: done,
        titleHolder: tier && top ? { uid: top.uid, untilMs: now + game.CHALLENGE_RULES.titleDays * 86400000 } : state.titleHolder,
      });
      changed = true;
    }

    const week = game.weekWindow(now);
    if (!state.current && (!state.previous || state.previous.id !== week.id) && !game.isLeviathanWeek(now)) {
      const active = txApp.countRecords("players", $dbx.exp("resourcesUpdatedAtMs >= {:since} AND npc = ''", { since: now - game.CHALLENGE_RULES.activeDays * 86400000 }));
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
  const report = new Record(txApp.findCollectionByNameOrId("battle_reports"));
  report.load(out.report);
  txApp.save(report);
  notify(txApp, fleet.ownerUid, withReportLink(out.notifications, report.id));
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
    game.grantCommanderXp(owner.player, "hunter", game.COMMANDER_XP.bossAssault);
    game.addPassPoints(owner.player, "bossAssault", now);
    owner.rec.set("commanders", owner.player.commanders || null);
    owner.rec.set("seasonPass", owner.player.seasonPass || null);
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
      const actives = txApp.findRecordsByFilter("players", "resourcesUpdatedAtMs >= {:t} && npc = ''", "", 500, 0, { t: now - 7 * 86400000 }).map((r) => toPlain(r));
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
  // v5.1 : le pseudo ne s'écrit librement qu'à l'inscription ; ensuite, Profil → Changer de pseudo.
  if (sent.pseudo !== undefined) {
    const before = e.record.original();
    if (String(sent.pseudo) !== before.getString("pseudo") && (Date.now() - before.getInt("createdAtMs") > PSEUDO_SIGNUP_MS || before.get("renamed"))) {
      throw new ForbiddenError("Le pseudo se change depuis ton profil (une seule fois).");
    }
  }
}

const PSEUDO_SIGNUP_MS = 15 * 60000;

/* ---------- Migrations du contenu personnalisé (au démarrage) ---------- */

// Chaque migration ne passe qu'une fois (game_config « content_migrations ») et ne
// remplace une valeur que si elle vaut encore l'ancienne valeur par défaut : un
// réglage fait à la main dans l'administration est conservé.
const CONTENT_MIGRATIONS = [
  {
    id: "balance-5.4",
    key: "units",
    patches: [
      { id: "chasseur", field: "hangarSpace", from: 20, to: 2 },
      { id: "intercepteur", field: "hangarSpace", from: 20, to: 2 },
      { id: "etoile_noire", field: "hangarSpace", from: 200, to: 80 },
      { id: "lance_gravitationnelle", field: "hangarSpace", from: 8, to: 12 },
      { id: "canon_impulsion", field: "cost", from: { scrap: 2000, energy: 1200 }, to: { scrap: 1200, energy: 600 } },
      { id: "canon_plasma", field: "cost", from: { scrap: 2500, energy: 1500 }, to: { scrap: 1500, energy: 750 } },
    ],
  },
  // v5.5 : la techno « Extension des hangars » (tech26) ajoutée aux technologies personnalisées.
  {
    id: "hangar-tech-5.5",
    key: "technologies",
    patches: [],
    appendFromDefaults: ["tech26"],
  },
  // v5.14.1 : le passe d'octobre 2026 écrit et publié d'office en cours de mois (il remplaçait
  // celui des Chroniques, sur lequel les joueurs avançaient) est retiré : retour à l'ancien passe.
  {
    id: "pass-octobre-rollback-5.14.1",
    key: "passSeasons",
    patches: [],
    // v5.14.2 : neutralisée (le passe d'octobre reste en place, il reçoit ses défis ci-dessous).
    run() {
      return false;
    },
  },
  // v5.14.2 : les passes d'avant les défis par palier (prérequis aux paliers 10, 20, 30
  // seulement) reçoivent un défi à chaque palier ; thème, récompenses et points inchangés.
  {
    id: "pass-defis-30-paliers-5.14.2",
    key: "passSeasons",
    patches: [],
    run(data, changes, txApp) {
      if (!data || !Array.isArray(data.seasons)) return false;
      const game = loadGame();
      const digest = game.worldDigest(proceduralPlayers(txApp), Date.now());
      let touched = false;
      data.seasons = data.seasons.map((s) => {
        if (!s || !Array.isArray(s.tiers) || game.hasFullChallenges(s)) return s;
        touched = true;
        changes.push(`passe ${s.id} : un défi à chacun des ${s.tiers.length} paliers`);
        return game.regenerateChallenges(s, digest);
      });
      return touched;
    },
  },
];

function canonJson(v) {
  if (!v || typeof v !== "object" || Array.isArray(v)) return JSON.stringify(v);
  const out = {};
  Object.keys(v).sort().forEach((k) => (out[k] = v[k]));
  return JSON.stringify(out);
}

function configRecord(txApp, key) {
  try {
    return txApp.findFirstRecordByFilter("game_config", "key = {:k}", { k: key });
  } catch (_) {
    return null;
  }
}

/** Applique les migrations de contenu pas encore passées. Retourne les changements. */
function runContentMigrations(app) {
  const changes = [];
  app.runInTransaction((txApp) => {
    let marker = configRecord(txApp, "content_migrations");
    const applied = marker ? (toPlain(marker).data || {}).applied || [] : [];
    const done = [];
    CONTENT_MIGRATIONS.forEach((m) => {
      if (applied.indexOf(m.id) >= 0) return;
      const rec = configRecord(txApp, m.key);
      const items = rec ? toPlain(rec).data : null;
      if (m.run) {
        if (rec && m.run(items, changes, txApp)) {
          rec.set("data", items);
          txApp.save(rec);
        }
      } else if (Array.isArray(items)) {
        let touched = false;
        (m.appendFromDefaults || []).forEach((id) => {
          if (items.some((x) => x && x.id === id)) return;
          const def = loadGame().defaultGameContent()[m.key].find((x) => x.id === id);
          if (def) {
            items.push(def);
            touched = true;
            changes.push(`${m.id} : ${id} ajouté`);
          }
        });
        m.patches.forEach((p) => {
          const item = items.find((x) => x && x.id === p.id);
          if (item && canonJson(item[p.field]) === canonJson(p.from)) {
            item[p.field] = p.to;
            touched = true;
            changes.push(`${m.id} : ${p.id}.${p.field}`);
          }
        });
        if (touched) {
          rec.set("data", items);
          txApp.save(rec);
        }
      }
      done.push(m.id);
    });
    if (done.length === 0) return;
    if (!marker) {
      marker = new Record(txApp.findCollectionByNameOrId("game_config"));
      marker.set("key", "content_migrations");
    }
    marker.set("data", { applied: applied.concat(done) });
    txApp.save(marker);
  });
  return changes;
}

/* ---------- v5.4 / v5.5 : équilibrage (données réelles, historique) ---------- */

function readBalanceHistory(txApp, game) {
  const rec = configRecord(txApp, game.BALANCE_HISTORY_KEY);
  const data = rec ? toPlain(rec).data : null;
  return data && Array.isArray(data.days) ? data.days : [];
}

/** Données réelles de l'outil d'équilibrage (30 jours de combats), avec l'historique si demandé. */
function liveBalance(now, withHistory) {
  const game = loadGame();
  applyContent($app, game);
  const plain = (r) => Object.assign(toPlain(r), { uid: r.id });
  const players = $app.findRecordsByFilter("players", "npc = ''", "", 0, 0).map(plain);
  const warlords = $app.findRecordsByFilter("players", "npc != ''", "", 0, 0).map(plain);
  const reports = $app
    .findRecordsByFilter("battle_reports", "timestamp >= {:since}", "-timestamp", 10000, 0, { since: now - 30 * 24 * 3600 * 1000 })
    .map((r) => ({ attackerUid: r.getString("attackerUid"), defenderUid: r.getString("defenderUid"), outcome: r.getString("outcome"), timestamp: r.getFloat("timestamp") }));
  const live = game.computeLiveBalance(players, warlords, reports, now, 30);
  if (withHistory) live.history = readBalanceHistory($app, game);
  return { game, live, reports };
}

/** Tâche quotidienne : ajoute la photo du jour à l'historique. */
function balanceHistoryTick(now) {
  const out = liveBalance(now, false);
  const game = out.game;
  const snap = game.balanceSnapshot(out.live, out.reports, now);
  $app.runInTransaction((txApp) => {
    const days = game.pushSnapshot(readBalanceHistory(txApp, game), snap);
    writeConfig(txApp, game.BALANCE_HISTORY_KEY, { days });
  });
  return snap;
}

/* ---------- v5.5 : saga d'alliance (générée chaque mois) ---------- */

/** Tâche horaire : écrit la saga du mois si besoin, clôt et récompense le mois écoulé, met le classement à jour. */
/**
 * v5.6 : progression en direct de l'alliance du joueur (le classement complet
 * reste calculé chaque heure). GET /api/cosmic/alliance/saga/live
 */
function allianceSagaLive(e) {
  const game = loadGame();
  const now = Date.now();
  applyContent($app, game);
  const own = findOrNull($app, "players", e.auth.id);
  const allianceId = own ? own.getString("allianceId") : "";
  if (!allianceId) return e.json(200, null);
  const a = findOrNull($app, "alliances", allianceId);
  if (!a) return e.json(200, null);
  const rec = configRecord($app, game.ALLIANCE_SAGA_KEY);
  const state = game.readAllianceSaga(rec ? toPlain(rec).data : null);
  const monthId = game.sagaMonthId(now);
  const def = game.sagaOf(state, monthId);
  if (!def) return e.json(200, null);
  const members = (toPlain(a).members || [])
    .map((uid) => findOrNull($app, "players", uid))
    .filter((r) => !!r)
    .map((r) => ({ seasonPass: toPlain(r).seasonPass }));
  const progress = game.sagaProgress(def, members, now);
  return e.json(200, { monthId, allianceId, progress, points: game.sagaPoints(def, progress), updatedAtMs: now });
}

function allianceSagaTick(now) {
  const game = loadGame();
  const out = { generated: null, closed: null, alliances: 0 };
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const rec = configRecord(txApp, game.ALLIANCE_SAGA_KEY);
    const state = game.readAllianceSaga(rec ? toPlain(rec).data : null);
    const monthId = game.sagaMonthId(now);

    // 1. Mois écoulé : le dernier classement enregistré fait foi.
    const last = state.standing;
    if (last && last.monthId !== monthId && state.closed.indexOf(last.monthId) < 0) {
      const def = game.sagaOf(state, last.monthId);
      last.rows.slice(0, game.ALLIANCE_SAGA_RULES.rewardHours.length).forEach((row) => {
        const hours = game.ALLIANCE_SAGA_RULES.rewardHours[row.rank - 1];
        const a = findOrNull(txApp, "alliances", row.allianceId);
        if (!a || !hours || row.points <= 0) return;
        const al = toPlain(a);
        const treasury = al.treasury || {};
        (al.members || []).filter((uid) => findOrNull(txApp, "players", uid)).forEach((uid) => {
          const loaded = loadPlayer(txApp, game, uid);
          const gain = game.productionHours(loaded.player, hours);
          Object.keys(gain).forEach((r) => (treasury[r] = (Number(treasury[r]) || 0) + Math.floor(gain[r] || 0)));
          const title = row.rank === 1 && def ? def.winnerTitle : "";
          if (title && !(loaded.player.titles || []).some((t) => t.label === title)) {
            loaded.player.titles = (loaded.player.titles || []).concat([{ label: title, seasonId: `saga:${last.monthId}`, rank: 1 }]);
            savePlayer(txApp, game, loaded, loaded.player, loaded.queues);
          }
          notify(txApp, uid, [
            { kind: "alliance", title: "Saga d'alliance", message: `[${al.tag}] termine ${row.rank === 1 ? "1re" : `${row.rank}e`} de la saga « ${def ? def.title : last.monthId} » : ${hours} h de production des membres versées au trésor${title ? `, titre « ${title} »` : ""}.`, createdAtMs: now, read: false, link: "/game/alliance?onglet=saga" },
          ]);
        });
        a.set("treasury", treasury);
        txApp.save(a);
      });
      state.closed = state.closed.concat([last.monthId]).slice(-24);
      out.closed = last.monthId;
    }

    // 2. Saga du mois.
    const players = proceduralPlayers(txApp);
    let def = game.sagaOf(state, monthId);
    if (!def) {
      const digest = game.worldDigest(players, now);
      def = game.generateAllianceSaga(monthId, digest, game.chapterDifficulty(digest).value, now);
      state.sagas = state.sagas.concat([def]).slice(-12);
      out.generated = monthId;
    }

    // 3. Classement.
    const byId = {};
    players.forEach((p) => (byId[p.uid] = p));
    const alliances = txApp.findAllRecords("alliances").map((r) => {
      const al = toPlain(r);
      return { id: r.id, name: al.name, tag: al.tag, members: (al.members || []).map((uid) => byId[uid]).filter((p) => !!p) };
    });
    state.standing = { monthId, rows: game.sagaStandings(def, alliances, now), updatedAtMs: now };
    out.alliances = alliances.length;
    writeConfig(txApp, game.ALLIANCE_SAGA_KEY, state);
  });
  return out;
}

/* ---------- v5.5 : actions d'administration sur un joueur ---------- */

function writeAdminLog(txApp, e, action, uid, label, changes, reason) {
  try {
    const log = new Record(txApp.findCollectionByNameOrId("admin_logs"));
    log.load({
      actorId: e.auth ? e.auth.id : "superuser",
      actorName: e.auth ? e.auth.getString("name") || e.auth.getString("username") || e.auth.getString("email") || "admin" : "superuser",
      action: String(action).slice(0, 20),
      targetCollection: "players",
      recordId: uid,
      recordLabel: String(label || "").slice(0, 200),
      changes,
      reason: String(reason || "").slice(0, 300),
      createdAtMs: Date.now(),
    });
    txApp.save(log);
  } catch (err) {
    console.log(`[cosmic] journal admin impossible : ${err}`);
  }
}

const PLAYER_ACTION_LABELS = { testMode: "compte test", finishAll: "tout terminer", officers: "délais officiers", grant: "ressources", officer: "officier offert", relic: "relique offerte", capsule: "capsule offerte" };
/** v5.14 : actions qui donnent quelque chose (motif obligatoire). */
const PLAYER_GIFT_ACTIONS = ["grant", "officer", "relic", "capsule"];

/**
 * POST /api/cosmic/admin/player-action { uid, action, reason?, on?, resources? }
 * testMode (on) · finishAll · officers · grant (resources, motif obligatoire).
 * v5.14 : officer (officerId) · relic (template, rarity) · capsule (capsule, level) — motif obligatoire.
 */
function adminPlayerAction(e) {
  if (!e.hasSuperuserAuth() && !isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  const req = body(e);
  const uid = String(req.uid || "");
  const action = String(req.action || "");
  const reason = String(req.reason || "").trim();
  if (!PLAYER_ACTION_LABELS[action]) throw new BadRequestError("Action inconnue.");
  if (PLAYER_GIFT_ACTIONS.indexOf(action) >= 0 && reason.length < 5) throw new BadRequestError("Indique un motif (5 caractères au moins).");
  let summary = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const loaded = loadPlayer(txApp, game, uid, "Joueur introuvable.");
    const now = Date.now();
    let player = loaded.player;
    let queues = loaded.queues;
    let notes = [];
    const flush = () => {
      const f = game.flushPlayer(player, queues, now);
      player = f.player;
      queues = f.queues;
      notes = notes.concat(f.notifications);
    };
    if (action === "testMode") {
      const on = req.on === true;
      loaded.rec.set("testMode", on);
      player.testMode = on;
      if (on) flush();
      summary = { testMode: on };
    } else if (action === "finishAll") {
      const report = game.finishAllTimers(queues, now);
      const officers = game.clearOfficerCooldowns(player);
      flush();
      summary = Object.assign(report, { officers });
    } else if (action === "officers") {
      summary = { officers: game.clearOfficerCooldowns(player) };
    } else if (action === "officer") {
      // v5.14 : officier offert (rare ou de saison compris).
      const def = game.adminGrantOfficer(player, String(req.officerId || ""));
      notes.push({ kind: "event", title: `${def.title} ${def.name} rejoint ton état-major`, message: `Offert par l'équipe : ${reason}.`, createdAtMs: now, read: false, link: "/game/etat-major" });
      summary = { officier: `${def.title} ${def.name}` };
    } else if (action === "relic") {
      const item = game.makeRelic(String(req.template || ""), String(req.rarity || "rare"), now);
      if (!game.addRelic(player, item)) throw new BadRequestError("Collection de reliques pleine.");
      const label = game.relicLabel(item);
      notes.push({ kind: "event", title: "Une relique t'est offerte", message: `${label} — ${reason}.`, createdAtMs: now, read: false, link: "/game/etat-major" });
      summary = { relique: label };
    } else if (action === "capsule") {
      const type = String(req.capsule || "");
      const level = Math.max(1, Math.min(10, Math.floor(Number(req.level) || 1)));
      if (!game.addCapsule(player, type, level)) throw new BadRequestError("Réserve de ce type de capsule pleine.");
      const name = (game.CAPSULES[type] || {}).name || type;
      notes.push({ kind: "event", title: "Une capsule t'est offerte", message: `${name} niv. ${level} — ${reason}.`, createdAtMs: now, read: false, link: "/game/etat-major" });
      summary = { capsule: `${name} niv. ${level}` };
    } else {
      flush();
      const given = game.grantResources(player, req.resources);
      if (Object.keys(given).length === 0) throw new BadRequestError("Aucune ressource à rendre.");
      summary = { given };
    }
    savePlayer(txApp, game, loaded, player, queues);
    if (notes.length > 0) notify(txApp, uid, notes);
    writeAdminLog(txApp, e, `joueur : ${PLAYER_ACTION_LABELS[action]}`, uid, player.pseudo, summary, reason);
  });
  return e.json(200, summary);
}

/* ---------- v5.4 : générateur procédural (chapitres, passe, succès) ---------- */

/** v5.10 : verse des ressources au pot commun « Serveur » (taxes). */
function addServerPot(txApp, game, source, amounts, now, note) {
  const rec = configRecord(txApp, game.SERVER_POT_KEY);
  const pot = game.normalizeServerPot(rec ? toPlain(rec).data : null);
  const next = game.addToPot(pot, source, amounts || {}, now, note);
  if (next !== pot) writeConfig(txApp, game.SERVER_POT_KEY, next);
}

/** GET/POST /api/cosmic/admin/serverpot — solde, mouvements, versement à un joueur. */
function adminServerPot(e) {
  if (!e.hasSuperuserAuth() && !isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  if (e.request.method !== "POST") {
    const rec = configRecord($app, game.SERVER_POT_KEY);
    return e.json(200, game.normalizeServerPot(rec ? toPlain(rec).data : null));
  }
  const req = body(e);
  if (req.action !== "grant") throw new BadRequestError("Action inconnue.");
  const toUid = String(req.toUid || "");
  const note = String(req.note || "").trim().slice(0, 200);
  if (!note) throw new BadRequestError("Indique le motif (concours, événement…).");
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    if (!findOrNull(txApp, "players", toUid)) throw new BadRequestError("Joueur introuvable.");
    const rec = configRecord(txApp, game.SERVER_POT_KEY);
    const pot = game.normalizeServerPot(rec ? toPlain(rec).data : null);
    const owner = loadPlayer(txApp, game, toUid);
    const next = game.takeFromPot(pot, req.resources || {}, now, `${note} → ${owner.player.pseudo}`);
    if (next === pot) throw new BadRequestError("Rien à verser (montants vides ou pot insuffisant).");
    const given = {};
    const last = next.log[next.log.length - 1];
    Object.keys(last.resources).forEach((k) => (given[k] = -last.resources[k]));
    const flushed = game.flushPlayer(owner.player, owner.queues, now);
    Object.keys(given).forEach((k) => (flushed.player.resources[k] = (flushed.player.resources[k] || 0) + given[k]));
    savePlayer(txApp, game, owner, flushed.player, flushed.queues);
    notify(txApp, toUid, flushed.notifications.concat([
      { kind: "event", title: "Récompense du pot commun", message: `${note} : ${game.describeGain(given)} versés depuis le pot du serveur.`, createdAtMs: now, read: false, data: { resources: given } },
    ]));
    writeConfig(txApp, game.SERVER_POT_KEY, next);
    const log = new Record(txApp.findCollectionByNameOrId("admin_logs"));
    log.load({
      actorId: e.auth ? e.auth.id : "superuser",
      actorName: e.auth ? e.auth.getString("name") || e.auth.getString("username") || e.auth.getString("email") : "superuser",
      action: "update",
      targetCollection: "game_config",
      recordId: game.SERVER_POT_KEY,
      recordLabel: `Pot commun : ${note}`,
      changes: { versé: given, joueur: owner.player.pseudo },
      createdAtMs: now,
    });
    txApp.save(log);
    out = next;
  });
  return e.json(200, out);
}

/** POST /api/cosmic/admin/broadcast { segment, allianceId?, title, message, link?, dryRun? } — v5.10.5 : messages ciblés. */
function adminBroadcast(e) {
  if (!e.hasSuperuserAuth() && !isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  const req = body(e);
  const msg = { segment: String(req.segment || ""), allianceId: String(req.allianceId || ""), title: String(req.title || "").trim(), message: String(req.message || "").trim(), link: String(req.link || "").trim() };
  if (!req.dryRun) {
    const errors = game.validateBroadcast(msg);
    if (errors.length) throw new BadRequestError(errors.join(" "));
  }
  const now = Date.now();
  let count = 0;
  $app.runInTransaction((txApp) => {
    const players = proceduralPlayers(txApp);
    const targets = game.broadcastTargets(players, msg.segment, now, msg.allianceId || undefined);
    count = targets.length;
    if (req.dryRun) return;
    targets.forEach((p) => {
      try {
        notify(txApp, p.uid, [Object.assign({ kind: "event", title: msg.title, message: msg.message, createdAtMs: now, read: false }, msg.link ? { link: msg.link } : {})]);
      } catch (_) {
        /* un destinataire en échec n'empêche pas les autres */
      }
    });
    bossAdminLog(txApp, e, "broadcast", `Message ciblé : ${msg.title}`, { groupe: msg.segment, alliance: msg.allianceId || null, destinataires: count }, now);
  });
  return e.json(200, { count, sent: !req.dryRun });
}

/* ---------- v5.10.5 : défi d'alliance de la semaine ---------- */

/** Tâche planifiée (avec les concours) : relevé du classement, et le lundi, prix au podium. */
function allianceChallengeTick(now) {
  const game = loadGame();
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const rec = configRecord(txApp, game.ALLIANCE_CHALLENGE_KEY);
    const players = proceduralPlayers(txApp);
    const allianceRecs = txApp.findAllRecords("alliances");
    const alliances = allianceRecs.map((a) => ({ id: a.id, tag: a.getString("tag"), name: a.getString("name") }));
    if (!rec) {
      writeConfig(txApp, game.ALLIANCE_CHALLENGE_KEY, game.startAllianceChallengeWeek(players, now, null));
      return;
    }
    let state = game.normalizeAllianceChallenge(toPlain(rec).data, now);
    state = game.refreshAllianceChallenge(state, players, alliances, now);
    if (state.weekId !== game.allianceWeekId(now)) {
      const challenge = game.findAllianceChallenge(state.challengeId);
      const results = [];
      state.standings.slice(0, game.ALLIANCE_CHALLENGE_REWARDS.length).forEach((st, i) => {
        const aRec = allianceRecs.find((a) => a.id === st.allianceId);
        if (!aRec) return;
        const members = players.filter((p) => p.allianceId === st.allianceId);
        const reward = game.allianceChallengeReward(i + 1, members);
        const treasury = Object.assign({}, toPlain(aRec).treasury || {});
        Object.keys(reward).forEach((k) => (treasury[k] = (treasury[k] || 0) + reward[k]));
        aRec.set("treasury", treasury);
        txApp.save(aRec);
        const log = new Record(txApp.findCollectionByNameOrId("alliance_logs"));
        log.load({ allianceId: aRec.id, kind: "deposit", actorUid: "", actorPseudo: "Défi de la semaine", text: `${challenge.emoji} ${challenge.name} : ${i + 1 === 1 ? "1re" : `${i + 1}e`} place`, resources: reward, createdAtMs: now });
        txApp.save(log);
        members.forEach((m) => {
          try {
            notify(txApp, m.uid, [{ kind: "alliance", title: `Défi d'alliance : ${i + 1 === 1 ? "victoire" : `${i + 1}e place`} !`, message: `${challenge.emoji} ${challenge.name} : ${game.describeGain(reward)} versés au trésor.`, createdAtMs: now, read: false, link: "/game/alliance?onglet=defi" }]);
          } catch (_) {
            /* facultatif */
          }
        });
        results.push(Object.assign({}, st, { rank: i + 1, reward }));
      });
      state = game.startAllianceChallengeWeek(players, now, { weekId: state.weekId, challengeId: state.challengeId, results });
    }
    writeConfig(txApp, game.ALLIANCE_CHALLENGE_KEY, state);
  });
}

/* ---------- v5.10.5 : concours du pot commun ---------- */

function readContests(txApp, game) {
  const rec = configRecord(txApp, game.CONTESTS_KEY);
  return game.normalizeContests(rec ? toPlain(rec).data : null);
}

/** Tâche planifiée : lancement, relevé du classement, versement des prix à la fin. */
function contestsTick(now) {
  const game = loadGame();
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const state = readContests(txApp, game);
    if (!state.list.some((c) => c.status === "scheduled" || c.status === "running")) return;
    const players = proceduralPlayers(txApp);
    let changed = false;
    const list = state.list.map((c) => {
      const phase = game.contestPhase(c, now);
      if (phase === "scheduled" || phase === "done" || phase === "cancelled") return c;
      changed = true;
      let next = game.refreshContest(c, players, now);
      if (c.status === "scheduled") {
        next = Object.assign({}, next, { status: "running" });
        players.forEach((p) => {
          try {
            notify(txApp, p.uid, [{ kind: "event", title: `Concours : ${c.title}`, message: `C'est parti jusqu'au ${game.parisWhenLabel(c.endMs)} ! Les ${c.places.length} premiers se partagent ${Math.round(c.potShare * 100)} % du pot commun.`, createdAtMs: now, read: false, link: "/game/concours" }]);
          } catch (_) {
            /* facultatif */
          }
        });
      }
      if (phase === "ending") next = finishContest(txApp, game, next, now);
      return next;
    });
    if (changed) writeConfig(txApp, game.CONTESTS_KEY, { list: game.pruneContests(list) });
  });
}

/** Fin d'un concours : prix pris dans le pot et versés aux premiers. */
function finishContest(txApp, game, c, now) {
  const rec = configRecord(txApp, game.SERVER_POT_KEY);
  let pot = game.normalizeServerPot(rec ? toPlain(rec).data : null);
  const prizes = game.contestPrizes(c, game.contestPurse(c, pot));
  const results = [];
  prizes.forEach((prize) => {
    if (!findOrNull(txApp, "players", prize.uid) || Object.keys(prize.resources).length === 0) return;
    const before = pot;
    pot = game.takeFromPot(pot, prize.resources, now, `Concours « ${c.title} » : ${prize.rank === 1 ? "1re" : `${prize.rank}e`} place → ${prize.pseudo}`);
    if (pot === before) return;
    const last = pot.log[pot.log.length - 1];
    const given = {};
    Object.keys(last.resources).forEach((k) => (given[k] = -last.resources[k]));
    const owner = loadPlayer(txApp, game, prize.uid);
    const flushed = game.flushPlayer(owner.player, owner.queues, now);
    Object.keys(given).forEach((k) => (flushed.player.resources[k] = (flushed.player.resources[k] || 0) + given[k]));
    savePlayer(txApp, game, owner, flushed.player, flushed.queues);
    notify(txApp, prize.uid, flushed.notifications.concat([
      { kind: "event", title: `Concours « ${c.title} » : ${prize.rank === 1 ? "victoire" : `${prize.rank}e place`} !`, message: `${game.describeGain(given)} versés depuis le pot commun.`, createdAtMs: now, read: false, link: "/game/concours", data: { resources: given } },
    ]));
    results.push(Object.assign({}, prize, { resources: given }));
  });
  writeConfig(txApp, game.SERVER_POT_KEY, pot);
  return Object.assign({}, c, { status: "done", results });
}

/** POST /api/cosmic/admin/contests { action: "create" | "cancel", contest?, id? } */
function adminContests(e) {
  if (!e.hasSuperuserAuth() && !isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  const req = body(e);
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    const state = readContests(txApp, game);
    let list = state.list;
    if (req.action === "create") {
      const c = req.contest || {};
      const draft = {
        id: `contest-${now}`,
        title: String(c.title || "").trim().slice(0, 80),
        description: String(c.description || "").trim().slice(0, 400),
        metric: String(c.metric || ""),
        startMs: Math.max(now, Number(c.startMs) || now),
        endMs: Number(c.endMs) || 0,
        potShare: Number(c.potShare) || 0,
        places: (Array.isArray(c.places) ? c.places : []).map(Number),
        status: "scheduled",
        baselines: {},
        standings: [],
        updatedAtMs: now,
        createdBy: e.auth ? e.auth.id : "superuser",
      };
      const errors = game.validateContest(draft, now);
      if (errors.length) throw new BadRequestError(errors.join(" "));
      list = game.pruneContests([draft].concat(list));
    } else if (req.action === "cancel") {
      const c = list.find((x) => x.id === req.id);
      if (!c || !(c.status === "scheduled" || c.status === "running")) throw new BadRequestError("Concours introuvable ou déjà terminé.");
      list = list.map((x) => (x.id === req.id ? Object.assign({}, x, { status: "cancelled", updatedAtMs: now }) : x));
    } else throw new BadRequestError("Action inconnue.");
    writeConfig(txApp, game.CONTESTS_KEY, { list });
    bossAdminLog(txApp, e, game.CONTESTS_KEY, req.action === "create" ? `Concours créé : ${String((req.contest || {}).title || "")}` : "Concours annulé", { action: req.action, id: req.id || null }, now);
    out = { list };
  });
  if (req.action === "create") contestsTick(Date.now());
  return e.json(200, out);
}

function writeConfig(txApp, key, data) {
  let rec = configRecord(txApp, key);
  if (!rec) {
    rec = new Record(txApp.findCollectionByNameOrId("game_config"));
    rec.set("key", key);
  }
  rec.set("data", data);
  txApp.save(rec);
}

function proceduralPlayers(txApp) {
  return txApp.findRecordsByFilter("players", "npc = ''", "", 0, 0).map((r) => Object.assign(toPlain(r), { uid: r.id }));
}

/**
 * Écrit les chapitres manquants et les nouveaux paliers de succès.
 * opts : { force, monthId, variant, achievements } (bouton de l'administration).
 */
function proceduralTick(now, opts) {
  const o = opts || {};
  const game = loadGame();
  const out = { chapters: [], achievements: [] };
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const rec = configRecord(txApp, game.PROCEDURAL_KEY);
    const settings = game.normalizeProcedural(rec ? toPlain(rec).data : null);
    if (!settings.enabled && !o.force) return;
    const players = proceduralPlayers(txApp);
    const content = game.currentGameContent();
    let months = content.chronicles.months;
    const targets = o.monthId ? [o.monthId] : settings.chapters && o.achievements !== true ? game.monthsToGenerate(months, now, settings.leadDay) : [];
    if (targets.length > 0) {
      const digest = game.worldDigest(players, now);
      targets.forEach((id) => {
        const month = game.generateChapter({ monthId: id, digest, existing: months.filter((m) => m.id !== id), settings, now, variant: o.variant || 0 });
        months = months.filter((m) => m.id !== id).concat([month]).sort((a, b) => (a.id < b.id ? -1 : 1));
        out.chapters.push({ id, title: month.title, boss: month.boss.name });
      });
      const errors = game.validateGameContent(Object.assign({}, content, { chronicles: { months } })).filter((x) => /^Chroniques/.test(x));
      if (errors.length > 0) throw new Error(`chapitre invalide : ${errors.slice(0, 3).join(" ; ")}`);
      writeConfig(txApp, "chronicles", { months });
    }
    if (settings.achievements && !o.monthId) {
      const proposals = game.proposeAchievementTiers(content.achievements, players, now);
      if (proposals.length > 0) {
        writeConfig(txApp, "achievements", content.achievements.concat(proposals.map((p) => p.def)));
        proposals.forEach((p) => out.achievements.push({ id: p.def.id, name: p.def.name, reason: p.reason }));
      }
    }
    // v5.13 : passes de saison — brouillon du mois suivant, publication d'office et annonce au début du mois.
    out.passes = [];
    if (settings.pass && o.achievements !== true && !o.monthId) {
      passSeasonsTick(txApp, game, players, now, out.passes);
    }
    const lines = out.chapters.map((c) => `Chapitre ${c.id} écrit : « ${c.title} » (${c.boss}).`).concat(out.achievements.map((a) => `Succès ajouté : ${a.name}. ${a.reason}`)).concat(out.passes);
    if (lines.length > 0) {
      settings.log = settings.log.concat(lines.map((text) => ({ atMs: now, text }))).slice(-50);
      writeConfig(txApp, game.PROCEDURAL_KEY, settings);
    }
  });
  return out;
}

/** v5.13 : passes de saison procéduraux (brouillon à J-leadDay, publication d'office, annonce). */
function readPassSeasons(txApp, game) {
  const rec = configRecord(txApp, game.PASS_SEASONS_SECTION);
  const data = rec ? toPlain(rec).data : null;
  return data && Array.isArray(data.seasons) ? data : { seasons: [] };
}

function passSeasonDraft(game, players, cfg, monthId, now, variant) {
  const digest = game.worldDigest(players, now);
  const prev = cfg.seasons.filter((s) => s.id < monthId && s.status === "published").pop();
  return game.generatePassSeason({ monthId, digest, existing: cfg.seasons.filter((s) => s.id !== monthId), now, variant: variant || 0, basePointsPerTier: prev ? prev.pointsPerTier : undefined });
}

function passSeasonsTick(txApp, game, players, now, lines) {
  let cfg = readPassSeasons(txApp, game);
  let changed = false;
  const current = game.chronicleMonthId(now);
  const settings = game.normalizeProcedural((configRecord(txApp, game.PROCEDURAL_KEY) && toPlain(configRecord(txApp, game.PROCEDURAL_KEY)).data) || null);
  // Brouillon du mois en cours (le 1er seulement, s'il manque) et du suivant à partir du jour J.
  // v5.14.1 : jamais avant le catalogue (novembre 2026), jamais en cours de mois.
  game.autoDraftMonths(current, game.parisDayOfMonth(now), settings.leadDay).forEach((id) => {
    if (game.findPassSeason(cfg, id)) return;
    cfg = game.upsertPassSeason(cfg, passSeasonDraft(game, players, cfg, id, now, 0));
    changed = true;
    lines.push(`Passe ${id} : brouillon écrit, à relire et publier (Admin → Passes de saison).`);
  });
  // Début du mois : un brouillon oublié est publié d'office, puis le passe est annoncé une fois.
  const cur = game.findPassSeason(cfg, current);
  if (cur && cur.status === "draft") {
    cfg = game.upsertPassSeason(cfg, game.publishPassSeason(cur, now));
    changed = true;
    lines.push(`Passe ${current} publié d'office (brouillon non relu au début du mois).`);
  }
  const live = game.findPassSeason(cfg, current);
  if (live && live.status === "published" && !live.announcedAtMs) {
    cfg = game.upsertPassSeason(cfg, Object.assign({}, live, { announcedAtMs: now }));
    changed = true;
    players.forEach((p) => {
      notify(txApp, p.uid, [{ kind: "event", title: `Nouveau passe de saison : ${live.theme.name}`, message: `${live.theme.tagline} Au dernier palier : ${live.commander.title} ${live.commander.name} rejoint ton état-major, avec ${live.tiers[live.tiers.length - 1].filter((r) => r.kind === "amber").reduce((a, r) => a + r.amount, 0)} Ambre.`, createdAtMs: now, read: false, link: "/game/passe", data: live.theme.image ? { image: live.theme.image } : undefined }]);
    });
    lines.push(`Passe ${current} annoncé aux joueurs.`);
  }
  if (changed) writeConfig(txApp, game.PASS_SEASONS_SECTION, cfg);
}

/** v5.13 : passage horaire des passes de saison (publication d'office et annonce dès le début du mois). */
function passSeasonsRun(now) {
  const game = loadGame();
  const lines = [];
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const rec = configRecord(txApp, game.PROCEDURAL_KEY);
    const settings = game.normalizeProcedural(rec ? toPlain(rec).data : null);
    if (!settings.enabled || !settings.pass) return;
    passSeasonsTick(txApp, game, proceduralPlayers(txApp), now, lines);
    if (lines.length > 0) {
      settings.log = settings.log.concat(lines.map((text) => ({ atMs: now, text }))).slice(-50);
      writeConfig(txApp, game.PROCEDURAL_KEY, settings);
    }
  });
  return lines;
}

/** GET/POST /api/cosmic/admin/procedural — aperçu, réglages, génération à la demande. */
function adminProcedural(e) {
  if (!e.hasSuperuserAuth() && !isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  const now = Date.now();
  applyContent($app, game);
  const rec = configRecord($app, game.PROCEDURAL_KEY);
  const settings = game.normalizeProcedural(rec ? toPlain(rec).data : null);
  if (e.request.method === "POST") {
    const req = body(e);
    if (req.action === "settings") {
      const next = game.normalizeProcedural(Object.assign({}, settings, req.settings || {}, { log: settings.log }));
      $app.runInTransaction((txApp) => writeConfig(txApp, game.PROCEDURAL_KEY, next));
      return e.json(200, { settings: next });
    }
    if (req.action === "generate") {
      const monthId = String(req.monthId || "");
      if (!/^\d{4}-\d{2}$/.test(monthId)) throw new BadRequestError("Mois invalide (AAAA-MM).");
      const existing = game.chroniclesConfig().months.find((m) => m.id === monthId);
      if (existing && !existing.auto) throw new BadRequestError("Ce mois a une chronique écrite à la main : elle n'est pas remplacée.");
      if (existing && game.episodeUnlockMs(monthId, 0) <= now && !req.confirmStarted) throw new BadRequestError("Ce chapitre a déjà commencé : confirme pour le réécrire.");
      return e.json(200, proceduralTick(now, { force: true, monthId, variant: Math.max(0, Math.floor(Number(req.variant) || 0)) }));
    }
    if (req.action === "achievements") return e.json(200, proceduralTick(now, { force: true, achievements: true }));
    if (req.action === "passSeasonsRun") return e.json(200, { lines: passSeasonsRun(now) });
    // v5.13 : (ré)écrit le brouillon du passe d'un mois. Un passe publié n'est réécrit qu'après confirmation.
    // v5.14.2 : réécrit seulement les défis d'un passe (n'importe quel mois, même en cours).
    if (req.action === "passChallenges") {
      const monthId = String(req.monthId || "");
      let season = null;
      $app.runInTransaction((txApp) => {
        applyContent(txApp, game);
        const cfg = readPassSeasons(txApp, game);
        const existing = game.findPassSeason(cfg, monthId);
        if (!existing) throw new BadRequestError("Passe introuvable.");
        season = game.regenerateChallenges(existing, game.worldDigest(proceduralPlayers(txApp), now), Math.max(0, Math.floor(Number(req.variant) || 0)));
        writeConfig(txApp, game.PASS_SEASONS_SECTION, game.upsertPassSeason(cfg, season));
        bossAdminLog(txApp, e, game.PASS_SEASONS_SECTION, `Passe ${monthId} : défis réécrits`, {}, now);
      });
      return e.json(200, { season });
    }
    if (req.action === "passSeason") {
      const monthId = String(req.monthId || "");
      if (!/^\d{4}-\d{2}$/.test(monthId)) throw new BadRequestError("Mois invalide (AAAA-MM).");
      if (!game.passSeasonAllowed(monthId)) throw new BadRequestError("Les passes de saison commencent en novembre 2026 : avant, le passe du mois reste celui des Chroniques.");
      let draft = null;
      $app.runInTransaction((txApp) => {
        applyContent(txApp, game);
        const cfg = readPassSeasons(txApp, game);
        const existing = game.findPassSeason(cfg, monthId);
        if (existing && existing.status === "published" && !req.confirmPublished) throw new BadRequestError("Ce passe est déjà publié : confirme pour le remplacer par un nouveau brouillon.");
        draft = passSeasonDraft(game, proceduralPlayers(txApp), cfg, monthId, now, Math.max(0, Math.floor(Number(req.variant) || 0)));
        writeConfig(txApp, game.PASS_SEASONS_SECTION, game.upsertPassSeason(cfg, draft));
        bossAdminLog(txApp, e, game.PASS_SEASONS_SECTION, `Passe ${monthId} : brouillon généré (variante ${draft.auto.variant})`, {}, now);
      });
      return e.json(200, { season: draft });
    }
    throw new BadRequestError("Action inconnue.");
  }
  const players = proceduralPlayers($app);
  const digest = game.worldDigest(players, now);
  const months = game.chroniclesConfig().months;
  const pending = game.monthsToGenerate(months, now, settings.leadDay);
  // Aperçu : le mois à écrire, sinon le premier mois sans chronique après la dernière.
  const last = months.map((x) => x.id).sort().pop() || game.chronicleMonthId(now);
  const [y, m] = last.split("-").map(Number);
  const previewId = pending[0] || (m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, "0")}`);
  return e.json(200, {
    settings,
    digest,
    difficulty: game.chapterDifficulty(digest),
    pending,
    preview: previewId ? game.generateChapter({ monthId: previewId, digest, existing: months, settings, now }) : null,
    months: months.map((x) => ({ id: x.id, title: x.title, auto: x.auto || null, boss: x.boss.name })),
    achievements: game.proposeAchievementTiers(game.currentGameContent().achievements, players, now),
  });
}

/** v5.1 : sur sa fiche publique, un joueur ne change que son avatar (le reste vient du serveur). */
function guardProfileUpdate(e) {
  if (e.hasSuperuserAuth()) return;
  const sent = e.requestInfo().body || {};
  const bad = Object.keys(sent).filter((k) => !/^avatar[+-]?$/.test(k));
  if (bad.length > 0) throw new ForbiddenError("Seul l'avatar se modifie ici.");
}

/** POST /api/cosmic/rename — changement de pseudo unique (10 Ambre). */
function renameRequest(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const req = body(e);
  let pseudo = "";
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    const me = loadFlushed(txApp, game, uid);
    try {
      const out = game.renamePlayer(me.player, req.pseudo, now);
      const sameLogin = txApp.findRecordsByFilter("users", "username = {:u} && id != {:id}", "", 1, 0, { u: out.login, id: uid });
      const lower = out.pseudo.toLowerCase();
      const samePseudo = txApp.findRecordsByFilter("players", "pseudo ~ {:p} && id != {:id}", "", 50, 0, { p: out.pseudo, id: uid }).filter((r) => r.getString("pseudo").toLowerCase() === lower);
      if (sameLogin.length > 0 || samePseudo.length > 0) throw new game.GameActionError("Ce pseudo est déjà pris.");
      me.loaded.rec.set("pseudo", out.pseudo);
      savePlayer(txApp, game, me.loaded, me.player, me.queues);
      const user = txApp.findRecordById("users", uid);
      user.set("username", out.login);
      user.set("name", out.pseudo);
      txApp.save(user);
      const allianceId = me.loaded.rec.getString("allianceId");
      const alliance = allianceId ? findOrNull(txApp, "alliances", allianceId) : null;
      if (alliance) {
        const pseudos = parseJsonField(alliance, "memberPseudos", {}) || {};
        pseudos[uid] = out.pseudo;
        alliance.set("memberPseudos", pseudos);
        txApp.save(alliance);
      }
      pseudo = out.pseudo;
    } catch (err) {
      throw asHttpError(game, err);
    }
  });
  return e.json(200, { pseudo });
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

/* ---------- Parrainage (v4.1) ---------- */

/** Le nouveau joueur déclare son parrain (lien ?parrain=<uid>). */
function referralRequest(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const sponsorId = String(body(e).sponsor || "");
  let out = null;
  $app.runInTransaction((txApp) => {
    const now = Date.now();
    if (!findOrNull(txApp, "players", sponsorId)) throw new NotFoundError("Parrain introuvable.");
    const recruit = loadPlayer(txApp, game, uid);
    const sponsor = loadPlayer(txApp, game, sponsorId);
    try {
      game.linkReferrer(recruit.player, sponsor.player, now);
    } catch (err) {
      throw asHttpError(game, err);
    }
    recruit.rec.set("referral", recruit.player.referral);
    txApp.save(recruit.rec);
    notify(txApp, sponsorId, [{ kind: "alliance", title: "Nouveau filleul", message: `${recruit.player.pseudo} t'a choisi comme parrain. Récompense quand il atteindra Bronze I.`, createdAtMs: now, read: false, link: "/game/profil" }]);
    out = { sponsor: sponsor.player.pseudo };
  });
  return e.json(200, out);
}

/** v4.8 : adversaires PNJ d'un joueur (seigneurs affrontés, pour le Codex). */
function npcOpponents(app, uid) {
  const uids = {};
  app
    .findRecordsByFilter("battle_reports", "(attackerUid = {:u} && defenderUid ~ 'npc') || (defenderUid = {:u} && attackerUid ~ 'npc')", "", 500, 0, { u: uid })
    .forEach((r) => {
      uids[r.getString("attackerUid") === uid ? r.getString("defenderUid") : r.getString("attackerUid")] = true;
    });
  return Object.keys(uids);
}

/** POST /api/cosmic/codex/claim : titre « Archiviste » à 100 % du Codex. */
function codexClaim(e) {
  const game = loadGame();
  const uid = e.auth.id;
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const loaded = loadPlayer(txApp, game, uid);
    const entries = game.codexEntries(loaded.player, game.foughtWarlords(npcOpponents(txApp, uid)), Date.now());
    const progress = game.codexProgress(entries);
    if (progress.pct < 100) throw new BadRequestError(`Codex complété à ${progress.pct} % : il faut 100 %.`);
    if (!game.grantCodexTitle(loaded.player, entries)) throw new BadRequestError("Titre déjà reçu.");
    loaded.rec.set("titles", loaded.player.titles);
    txApp.save(loaded.rec);
    out = { title: game.CODEX_TITLE };
  });
  return e.json(200, out);
}

/** v4.7.1 : pseudo d'un parrain (page d'inscription, sans connexion). */
function referralSponsorName(e) {
  const id = String(e.request.url.query().get("id") || "");
  if (!/^[a-z0-9]{6,30}$/i.test(id)) throw new BadRequestError("Lien de parrainage invalide.");
  const rec = findOrNull($app, "players", id);
  if (!rec || rec.getString("npc")) throw new NotFoundError("Parrain introuvable.");
  return e.json(200, { pseudo: rec.getString("pseudo") });
}

/** v4.7.1 : mes filleuls et leur avancement, et mes propres conditions. */
function referralInfo(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const now = Date.now();
  const R = game.REFERRAL_RULES;
  const isVerified = (id) => {
    try {
      return $app.findRecordById("users", id).getBool("verified");
    } catch (_) {
      return false;
    }
  };
  const recruits = $app.findRecordsByFilter("players", "referral ~ {:q}", "-createdAtMs", 50, 0, { q: `"by":"${uid}"` }).map((r) => {
    const ref = toPlain(r).referral || {};
    return { pseudo: r.getString("pseudo"), xp: r.getInt("xp"), createdAtMs: r.getInt("createdAtMs"), verified: isVerified(r.id), rewarded: ref.rewarded === true };
  });
  return e.json(200, { recruits, verified: isVerified(uid), rules: { rewardXp: R.rewardXp, minAgeDays: R.minAgeDays }, now });
}

/** Tâche horaire : récompense les filleuls arrivés à Bronze I. */
function referralTick(now) {
  const game = loadGame();
  let rewarded = 0;
  $app.findRecordsByFilter("players", "referral ~ '\"rewarded\":false'", "", 200, 0).forEach((cand) => {
    try {
      $app.runInTransaction((txApp) => {
        const recruit = loadPlayer(txApp, game, cand.id);
        const sponsorId = (recruit.player.referral || {}).by;
        let verified = false;
        try {
          verified = txApp.findRecordById("users", cand.id).getBool("verified");
        } catch (_) {
          verified = false;
        }
        if (!sponsorId || !game.referralDue(recruit.player, verified, now)) return;
        if (!findOrNull(txApp, "players", sponsorId)) {
          recruit.player.referral = Object.assign({}, recruit.player.referral, { rewarded: true });
          recruit.rec.set("referral", recruit.player.referral);
          txApp.save(recruit.rec);
          return;
        }
        const sponsor = loadPlayer(txApp, game, sponsorId);
        const res = game.grantReferral(sponsor.player, recruit.player, now);
        ["referral", "bounties"].forEach((f) => {
          recruit.rec.set(f, recruit.player[f]);
          sponsor.rec.set(f, sponsor.player[f]);
        });
        txApp.save(recruit.rec);
        txApp.save(sponsor.rec);
        const R = game.REFERRAL_RULES;
        notify(txApp, cand.id, [{ kind: "event", title: "Parrainage récompensé", message: `Bronze I atteint : +${R.amberRecruit} Ambre de Ruche, offert par ton parrain ${sponsor.player.pseudo}.`, createdAtMs: now, read: false, link: "/game/profil", data: { amber: R.amberRecruit, fromUid: sponsorId, fromPseudo: sponsor.player.pseudo } }]);
        notify(txApp, sponsorId, [
          {
            kind: "event",
            title: res.capped ? "Filleul arrivé à Bronze I" : "Parrainage récompensé",
            message: res.capped
              ? `${recruit.player.pseudo} a atteint Bronze I. Plafond de ${R.perMonth} récompenses ce mois-ci atteint : la prochaine viendra le mois prochain.`
              : `${recruit.player.pseudo} a atteint Bronze I : +${R.amberSponsor} Ambre de Ruche et la bannière « Recruteur ».`,
            createdAtMs: now,
            read: false,
            link: "/game/profil",
            data: res.capped ? null : { amber: R.amberSponsor },
          },
        ]);
        rewarded += 1;
      });
    } catch (err) {
      console.log(`[cosmic] parrainage ${cand.id} : ${err}`);
    }
  });
  return rewarded;
}

/* ---------- Carte de victoire (v4.1) ---------- */

/** Page minimale avec balises Open Graph (aperçu Discord, WhatsApp…), puis
 *  redirection vers le rapport dans le jeu. */
function victoryCardPage(e) {
  const id = String(e.request.pathValue("id") || "");
  const rec = findOrNull($app, "victory_cards", id);
  if (!rec) return e.html(404, "<!doctype html><meta charset=utf-8><title>Carte introuvable</title><p>Carte introuvable.</p>");
  const base = (() => {
    try {
      return String($app.settings().meta.appURL || "").replace(/\/+$/, "");
    } catch (_) {
      return "";
    }
  })();
  const reqHost = String(e.request.host || "");
  // Derrière le proxy de production, toujours en https ; en local, http.
  const host = (/^(127\.0\.0\.1|localhost)(:|$)/.test(reqHost) ? "http://" : "https://") + reqHost;
  const image = `${host}/api/files/victory_cards/${rec.id}/${rec.getString("image")}`;
  const target = base + (rec.getString("target") || "/");
  const title = escapeHtml(rec.getString("title") || "Victoire");
  const desc = escapeHtml(rec.getString("description") || "Cosmic Empires");
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>${title}</title>
<meta property="og:type" content="website"><meta property="og:site_name" content="Cosmic Empires">
<meta property="og:title" content="${title}"><meta property="og:description" content="${desc}">
<meta property="og:image" content="${image}"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image"><meta name="twitter:image" content="${image}">
<meta http-equiv="refresh" content="0;url=${escapeHtml(target)}"></head>
<body style="background:#03040a;color:#e2e8f0;font-family:sans-serif;text-align:center;padding:24px">
<img src="${image}" alt="" style="max-width:100%;height:auto"><p><a style="color:#4be8ff" href="${escapeHtml(target)}">Ouvrir Cosmic Empires</a></p></body></html>`;
  return e.html(200, html);
}

/* ---------- Devblog (v5.8) ---------- */

const BLOG_DEFAULT_AUTHORS = ["Nicotine", "Tartiflex"];

/* ---------- Comptes Google / Apple (v5.9) ---------- */

/** POST /api/cosmic/account/pseudo { pseudo } : premier pseudo d'un compte
 *  ouvert par Google ou Apple (aucun identifiant, aucun empire encore).
 *  Gratuit et unique ; ensuite, c'est le changement de pseudo habituel. */
function accountPseudo(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const req = body(e);
  let pseudo = "";
  $app.runInTransaction((txApp) => {
    const user = txApp.findRecordById("users", uid);
    if (user.getString("username") || findOrNull(txApp, "players", uid)) throw new BadRequestError("Ton pseudo est déjà choisi.");
    try {
      pseudo = game.cleanNewPseudo(req.pseudo);
    } catch (err) {
      throw new BadRequestError(err.message);
    }
    const login = game.pseudoLogin(pseudo);
    const lower = pseudo.toLowerCase();
    const sameLogin = txApp.findRecordsByFilter("users", "username = {:u} && id != {:id}", "", 1, 0, { u: login, id: uid });
    const samePseudo = txApp.findRecordsByFilter("players", "pseudo ~ {:p}", "", 50, 0, { p: pseudo }).filter((r) => r.getString("pseudo").toLowerCase() === lower);
    if (sameLogin.length > 0 || samePseudo.length > 0) throw new BadRequestError("Ce pseudo est déjà pris.");
    user.set("username", login);
    user.set("name", pseudo);
    txApp.save(user);
  });
  return e.json(200, { pseudo });
}

/* ---------- Passkeys (v5.9) ---------- */

function findFirstOrNull(app, collection, filter, params) {
  try {
    return app.findFirstRecordByFilter(collection, filter, params);
  } catch (_) {
    return null;
  }
}

/** Origines autorisées : COSMIC_PASSKEY_ORIGINS (séparées par des virgules),
 *  sinon l'adresse du jeu. Le site (rpId) est le nom d'hôte de l'origine. */
function passkeyOrigins() {
  const env = String($os.getenv("COSMIC_PASSKEY_ORIGINS") || "").split(",").map((o) => o.trim().replace(/\/+$/, "")).filter(Boolean);
  if (env.length > 0) return env;
  let game = String($os.getenv("COSMIC_GAME_URL") || "");
  if (!game) {
    try {
      game = $app.settings().meta.appURL || "";
    } catch (_) {
      game = "";
    }
  }
  const list = [game || "https://empire.fs0ciety.org", "https://empire.fs0ciety.org"].map((o) => o.replace(/\/+$/, ""));
  return list.filter((o, i) => list.indexOf(o) === i);
}

function passkeyContext(e) {
  const origins = passkeyOrigins();
  const asked = String(e.request.header.get("Origin") || "").replace(/\/+$/, "");
  const origin = origins.indexOf(asked) >= 0 ? asked : origins[0];
  const rpId = origin.replace(/^https?:\/\//, "").replace(/:\d+$/, "").replace(/\/.*$/, "");
  return { origin, origins, rpId };
}

/** Défi à usage unique, gardé en mémoire 5 minutes. */
function passkeyIssueChallenge(game, kind, uid, rpId) {
  const challenge = game.challengeFromBytes(game.passkeyUtf8($security.randomString(32)));
  $app.store().set(`passkey:${challenge}`, { kind, uid, rpId, exp: Date.now() + game.PASSKEY_RULES.challengeTtlMs });
  return challenge;
}

function passkeyTakeChallenge(game, clientDataJSON, kind) {
  let challenge = "";
  try {
    challenge = game.clientChallenge(clientDataJSON);
  } catch (_) {
    throw new BadRequestError("Réponse de la passkey illisible.");
  }
  const key = `passkey:${challenge}`;
  const saved = $app.store().get(key);
  $app.store().remove(key);
  if (!saved || saved.kind !== kind || saved.exp < Date.now()) throw new BadRequestError("Défi expiré : réessaie.");
  return { challenge, saved };
}

function passkeyError(game, err) {
  if (err && (err.name === "PasskeyError" || err.name === "Base64urlError")) return new BadRequestError(err.message);
  if (err instanceof game.PasskeyError) return new BadRequestError(err.message);
  return err;
}

function passkeyView(rec) {
  return { id: rec.id, name: rec.getString("name"), createdAtMs: rec.getInt("createdAtMs"), lastUsedAtMs: rec.getInt("lastUsedAtMs") };
}

/** POST /api/cosmic/passkey/register/options : paramètres de navigator.credentials.create(). */
function passkeyRegisterOptions(e) {
  const game = loadGame();
  const ctx = passkeyContext(e);
  const uid = e.auth.id;
  const mine = $app.findRecordsByFilter("passkeys", "user = {:u}", "", 50, 0, { u: uid });
  if (mine.length >= game.PASSKEY_RULES.maxPerUser) throw new BadRequestError(`${game.PASSKEY_RULES.maxPerUser} passkeys au plus par compte.`);
  const login = e.auth.getString("username") || e.auth.getString("email") || uid;
  const display = e.auth.getString("name") || login;
  return e.json(200, {
    challenge: passkeyIssueChallenge(game, "create", uid, ctx.rpId),
    rp: { id: ctx.rpId, name: "Cosmic Empires" },
    user: { id: game.challengeFromBytes(game.passkeyUtf8(`cosmic:${uid}`)), name: login, displayName: display },
    pubKeyCredParams: [
      { type: "public-key", alg: -7 },
      { type: "public-key", alg: -257 },
    ],
    excludeCredentials: mine.map((r) => ({ type: "public-key", id: r.getString("credentialId") })),
    authenticatorSelection: { residentKey: "required", requireResidentKey: true, userVerification: "preferred" },
    attestation: "none",
    timeout: game.PASSKEY_RULES.challengeTtlMs,
  });
}

/** POST /api/cosmic/passkey/register/verify { response, name, transports } */
function passkeyRegisterVerify(e) {
  const game = loadGame();
  const ctx = passkeyContext(e);
  const uid = e.auth.id;
  const req = body(e);
  const response = req.response || {};
  const { challenge, saved } = passkeyTakeChallenge(game, response.clientDataJSON, "create");
  if (saved.uid !== uid) throw new BadRequestError("Défi émis pour un autre compte.");
  let reg;
  try {
    reg = game.verifyRegistration({ clientDataJSON: response.clientDataJSON, attestationObject: response.attestationObject }, { challenge, rpId: saved.rpId, origins: ctx.origins });
  } catch (err) {
    throw passkeyError(game, err);
  }
  if (findFirstOrNull($app, "passkeys", "credentialId = {:c}", { c: reg.credentialId })) throw new BadRequestError("Cette passkey est déjà enregistrée.");
  const rec = new Record($app.findCollectionByNameOrId("passkeys"));
  const now = Date.now();
  rec.set("user", uid);
  rec.set("credentialId", reg.credentialId);
  rec.set("publicKey", reg.publicKey);
  rec.set("alg", reg.alg);
  rec.set("signCount", reg.signCount);
  rec.set("name", game.cleanPasskeyName(req.name));
  rec.set("transports", Array.isArray(req.transports) ? req.transports.filter((t) => typeof t === "string").slice(0, 6) : []);
  rec.set("createdAtMs", now);
  rec.set("lastUsedAtMs", 0);
  $app.save(rec);
  return e.json(200, passkeyView(rec));
}

/** POST /api/cosmic/passkey/login/options : passkeys découvrables (aucun identifiant à saisir). */
function passkeyLoginOptions(e) {
  const game = loadGame();
  const ctx = passkeyContext(e);
  return e.json(200, { challenge: passkeyIssueChallenge(game, "get", "", ctx.rpId), rpId: ctx.rpId, userVerification: "preferred", allowCredentials: [], timeout: game.PASSKEY_RULES.challengeTtlMs });
}

/** POST /api/cosmic/passkey/login/verify { id, response } → jeton de session PocketBase. */
function passkeyLoginVerify(e) {
  const game = loadGame();
  const ctx = passkeyContext(e);
  const req = body(e);
  const response = req.response || {};
  const { challenge, saved } = passkeyTakeChallenge(game, response.clientDataJSON, "get");
  const rec = findFirstOrNull($app, "passkeys", "credentialId = {:c}", { c: String(req.id || "") });
  if (!rec) throw new BadRequestError("Passkey inconnue : elle a peut-être été retirée de ton compte.");
  let out;
  try {
    out = game.verifyAssertion(
      { clientDataJSON: response.clientDataJSON, authenticatorData: response.authenticatorData, signature: response.signature },
      { challenge, rpId: saved.rpId, origins: ctx.origins },
      rec.getString("publicKey"),
      rec.getInt("signCount"),
    );
  } catch (err) {
    throw passkeyError(game, err);
  }
  const user = findOrNull($app, "users", rec.getString("user"));
  if (!user) throw new BadRequestError("Compte introuvable.");
  rec.set("signCount", out.signCount);
  rec.set("lastUsedAtMs", Date.now());
  $app.save(rec);
  return $apis.recordAuthResponse(e, user, "passkey", null);
}

/** POST /api/cosmic/passkey/rename { id, name } */
function passkeyRename(e) {
  const game = loadGame();
  const req = body(e);
  const rec = findOrNull($app, "passkeys", String(req.id || ""));
  if (!rec || rec.getString("user") !== e.auth.id) throw new BadRequestError("Passkey introuvable.");
  rec.set("name", game.cleanPasskeyName(req.name));
  $app.save(rec);
  return e.json(200, passkeyView(rec));
}

function blogHost() {
  return String($os.getenv("COSMIC_BLOG_HOST") || "devblog.fs0ciety.org").toLowerCase();
}

/** v5.8 : sur le domaine du blog, seul le blog est visible. L'API (/api/…)
 *  reste ouverte (essais de routes, images) ; le panneau d'administration
 *  (/_/) renvoie vers l'accueil et toute autre adresse affiche la page 404
 *  du blog au lieu des réponses brutes de PocketBase. */
function blogHostIntercept(e) {
  const host = String(e.request.host || "").toLowerCase().replace(/:\d+$/, "");
  if (host !== blogHost()) return null;
  const path = String(e.request.url.path || "/");
  if (path.indexOf("/api/") === 0) return null;
  if (/^\/($|[ctp]\/|recherche$|rss\.xml$|feed$|sitemap\.xml$|robots\.txt$|assets\/blog\.(css|js)$)/.test(path)) return null;
  if (path.indexOf("/_") === 0) return "home";
  return "notfound";
}

/** Contexte des pages : « / » sur le sous-domaine, « /blog » ailleurs. */
function blogSite(e, game) {
  const host = String(e.request.host || "").toLowerCase();
  const local = /^(127\.0\.0\.1|localhost)(:|$)/.test(host);
  const origin = (local ? "http://" : "https://") + host;
  const onBlogHost = host.split(":")[0] === blogHost();
  let gameUrl = String($os.getenv("COSMIC_GAME_URL") || "");
  if (!gameUrl) {
    try {
      gameUrl = String($app.settings().meta.appURL || "");
    } catch (_) {
      gameUrl = "";
    }
  }
  gameUrl = (gameUrl || "https://empire.fs0ciety.org").replace(/\/+$/, "");
  const cfg = configRecord($app, game.EMOJIS_KEY);
  const custom = game.normalizeCustomEmojis(cfg ? toPlain(cfg).data : null);
  return {
    base: onBlogHost ? "" : "/blog",
    origin,
    filesBase: origin,
    gameUrl,
    now: Date.now(),
    emojis: game.GAME_EMOJIS.concat(game.KESH_EMOJIS || [], custom),
    assetVersion: game.shortHash(game.BLOG_CSS + game.BLOG_JS),
  };
}

function blogAuthors(filesBase) {
  const out = {};
  let recs = [];
  try {
    recs = $app.findAllRecords("blog_authors");
  } catch (_) {
    recs = [];
  }
  recs.forEach((r) => {
    const avatar = r.getString("avatar");
    out[r.id] = { pseudo: r.getString("pseudo"), role: r.getString("role"), avatarUrl: avatar ? `${filesBase}/api/files/blog_authors/${r.id}/${avatar}` : "" };
  });
  return out;
}

function blogPublicPosts(game, site) {
  let recs = [];
  try {
    recs = $app.findRecordsByFilter("blog_posts", 'status = "published"', "-publishedAtMs", 0, 0);
  } catch (_) {
    recs = [];
  }
  const authors = blogAuthors(site.filesBase);
  return game.publicPosts(recs.map((r) => game.blogPostFromRecord(Object.assign(toPlain(r), { id: r.id }), site.filesBase, authors)), site.now);
}

function blogSend(e, status, type, body, maxAge) {
  e.response.header().set("Content-Type", type);
  e.response.header().set("Cache-Control", `public, max-age=${maxAge}`);
  e.response.header().set("X-Content-Type-Options", "nosniff");
  return e.blob(status, type, body);
}

/** Routes publiques du devblog (pages HTML, flux, fichiers). */
function blogRequest(e, page) {
  const game = loadGame();
  applyContent($app, game);
  const site = blogSite(e, game);
  const posts = blogPublicPosts(game, site);
  const q = e.request.url.query();
  const pageNo = Math.max(1, parseInt(q.get("page"), 10) || 1);
  const html = (status, body) => blogSend(e, status, "text/html; charset=utf-8", body, status === 200 ? 60 : 30);
  switch (page) {
    case "home":
      return html(200, game.renderBlogList(site, { posts, page: pageNo }));
    case "category": {
      const id = String(e.request.pathValue("id") || "");
      const known = ["annonces", "mises-a-jour", "notes", "coulisses", "equilibrage", "evenements"].indexOf(id) >= 0;
      return known ? html(200, game.renderBlogList(site, { posts, page: pageNo, category: id })) : html(404, game.renderBlogNotFound(site, posts));
    }
    case "tag":
      return html(200, game.renderBlogList(site, { posts, page: pageNo, tag: game.slugify(String(e.request.pathValue("id") || ""), 32) }));
    case "search":
      return html(200, game.renderBlogList(site, { posts, page: pageNo, q: String(q.get("q") || "").slice(0, 80) }));
    case "post": {
      const slug = String(e.request.pathValue("slug") || "");
      const post = posts.find((p) => p.slug === slug);
      return post ? html(200, game.renderBlogPost(site, post, posts)) : html(404, game.renderBlogNotFound(site, posts));
    }
    case "rss":
      return blogSend(e, 200, "application/rss+xml; charset=utf-8", game.renderBlogRss(site, posts), 300);
    case "sitemap":
      return blogSend(e, 200, "application/xml; charset=utf-8", game.renderBlogSitemap(site, posts), 3600);
    case "robots":
      return blogSend(e, 200, "text/plain; charset=utf-8", game.renderBlogRobots(site), 3600);
    case "api": {
      // Liste publique en JSON (bots Discord, intégrations).
      const cat = String(q.get("categorie") || "");
      const list = posts.filter((p) => !cat || p.category === cat).slice(0, Math.min(50, Math.max(1, parseInt(q.get("limite"), 10) || 10)));
      e.response.header().set("Cache-Control", "public, max-age=60");
      return e.json(200, {
        posts: list.map((p) => ({ slug: p.slug, title: p.title, excerpt: p.excerpt, category: p.category, tags: p.tags, version: p.version, author: p.authorPseudo, publishedAt: new Date(p.publishedAtMs).toISOString(), url: `${site.origin}${site.base}/p/${p.slug}`, cover: p.coverUrl })),
      });
    }
    case "css":
      return blogSend(e, 200, "text/css; charset=utf-8", game.BLOG_CSS, 604800);
    case "js":
      return blogSend(e, 200, "application/javascript; charset=utf-8", game.BLOG_JS, 604800);
    default:
      return html(404, game.renderBlogNotFound(site, posts));
  }
}

/** Auteurs par défaut (Nicotine, Tartiflex) : ajoutés une fois si leur compte existe. */
function ensureBlogAuthors(app) {
  let col = null;
  try {
    col = app.findCollectionByNameOrId("blog_authors");
  } catch (_) {
    return [];
  }
  const added = [];
  BLOG_DEFAULT_AUTHORS.forEach((pseudo) => {
    let player = null;
    try {
      player = app.findFirstRecordByFilter("players", "pseudo = {:p}", { p: pseudo });
    } catch (_) {
      player = null;
    }
    if (!player || findOrNull(app, "blog_authors", player.id)) return;
    const rec = new Record(col);
    rec.set("id", player.id);
    rec.set("pseudo", player.getString("pseudo"));
    rec.set("role", "Équipe Cosmic Empires");
    app.save(rec);
    added.push(pseudo);
  });
  // Premier article en brouillon (relu puis publié par l'équipe), une seule fois.
  try {
    const authors = app.findAllRecords("blog_authors");
    const posts = app.findRecordsByFilter("blog_posts", "id != ''", "", 1, 0);
    if (authors.length > 0 && posts.length === 0 && !configRecord(app, "blog_welcome")) {
      const w = loadGame().BLOG_WELCOME;
      const rec = new Record(app.findCollectionByNameOrId("blog_posts"));
      const now = Date.now();
      rec.load({ slug: w.slug, title: w.title, excerpt: w.excerpt, body: w.body, category: w.category, tags: w.tags, version: w.version, status: "draft", publishedAtMs: 0, updatedAtMs: now, pinned: true, authorUid: authors[0].id, authorPseudo: authors[0].getString("pseudo") });
      app.save(rec);
      writeConfig(app, "blog_welcome", { createdAtMs: now });
      added.push("article de bienvenue (brouillon)");
    }
  } catch (err) {
    console.log(`[cosmic] devblog, article de bienvenue : ${err}`);
  }
  return added;
}

/* ---------- Seigneurs de guerre (v4.2) ---------- */

const WARLORDS_STATE_KEY = "warlords_state";

function readWarlordsState(txApp, game) {
  let rec = null;
  try {
    rec = (txApp || $app).findFirstRecordByData("game_config", "key", WARLORDS_STATE_KEY);
  } catch (_) {
    rec = null;
  }
  return game.warlordsState(rec ? toPlain(rec).data : null);
}

function writeWarlordsState(txApp, state) {
  let rec;
  try {
    rec = txApp.findFirstRecordByData("game_config", "key", WARLORDS_STATE_KEY);
  } catch (_) {
    rec = new Record(txApp.findCollectionByNameOrId("game_config"));
    rec.set("key", WARLORDS_STATE_KEY);
  }
  rec.set("data", state);
  txApp.save(rec);
}

function humanPlain(rec) {
  const p = toPlain(rec);
  p.uid = rec.id;
  return p;
}

/** Message privé d'un seigneur (une fois par jour et par joueur, sauf `force`). */
function warlordSay(txApp, game, state, d, human, key, now, force) {
  if (!d || !human || human.npc) return false;
  const prefs = human.notifPrefs || {};
  if (prefs.warlords === false) return false;
  if (!force && !game.canMessage(state, d.id, human.uid, now)) return false;
  const text = game.warlordLine(d, key, human.pseudo || "commandant", Math.random);
  if (!text) return false;
  const from = game.warlordUid(d.id);
  const rec = new Record(txApp.findCollectionByNameOrId("private_messages"));
  rec.load({ fromUid: from, fromPseudo: d.name, toUid: human.uid, toPseudo: human.pseudo || "", text, createdAtMs: now, readAtMs: 0 });
  txApp.save(rec);
  state.lastMsg[`${d.id}:${human.uid}`] = now;
  notify(txApp, human.uid, [{ kind: "message", title: `Message de ${d.name}`, message: text.length > 140 ? `${text.slice(0, 140)}…` : text, createdAtMs: now, read: false, link: `/game/messages?with=${from}&pseudo=${encodeURIComponent(d.name)}` }]);
  return true;
}

/** Crée l'empire d'un seigneur s'il n'existe pas encore. */
function ensureWarlordRecord(txApp, game, d, now) {
  const uid = game.warlordUid(d.id);
  let rec = findOrNull(txApp, "players", uid);
  if (!rec) {
    const profile = game.newPlayerProfile(uid, d.name, now);
    rec = new Record(txApp.findCollectionByNameOrId("players"));
    const data = Object.assign({}, profile.player, { id: uid, npc: d.id, createdAtMs: now - 30 * 86400000 });
    delete data.uid;
    rec.load(data);
    txApp.save(rec);
    if (!findOrNull(txApp, "queues", uid)) {
      const q = new Record(txApp.findCollectionByNameOrId("queues"));
      q.load(Object.assign({ id: uid }, profile.queues));
      txApp.save(q);
    }
  } else if (rec.getString("pseudo") !== d.name || rec.getString("npc") !== d.id) {
    rec.set("pseudo", d.name);
    rec.set("npc", d.id);
    txApp.save(rec);
  }
  return rec;
}

/** Retire un seigneur désactivé (empire, fiche, offres, flottes). */
function removeWarlord(txApp, uid) {
  const rec = findOrNull(txApp, "players", uid);
  if (!rec) return false;
  txApp.findRecordsByFilter("market_offers", 'sellerId = {:u} && status = "open"', "", 50, 0, { u: uid }).forEach((o) => {
    o.set("status", "cancelled");
    txApp.save(o);
  });
  txApp.findRecordsByFilter("fleets", 'ownerUid = {:u} && status != "done"', "", 50, 0, { u: uid }).forEach((f) => {
    f.set("status", "done");
    txApp.save(f);
  });
  ["queues", "profiles"].forEach((c) => {
    const r = findOrNull(txApp, c, uid);
    if (r) txApp.delete(r);
  });
  txApp.delete(rec);
  return true;
}

/** Lancement d'une attaque de seigneur (trajet de 3 à 5 h). */
function launchWarlordAttack(txApp, game, d, npc, pick, now) {
  const target = loadPlayer(txApp, game, pick.target.player.uid);
  // L'écart d'XP ne protège pas des seigneurs : ils choisissent eux-mêmes des cibles à leur portée.
  const owner = Object.assign({}, npc.player, { xp: 0 });
  const out = game.performLaunch({
    mission: "attack",
    now,
    owner,
    ownerQueues: npc.queues,
    target: target.player,
    fleet: pick.fleet,
    lastAttackOnTargetMs: lastAttackOnTarget(txApp, npc.player.uid, target.player.uid),
    atWar: false,
  });
  out.attacker.xp = npc.player.xp;
  savePlayer(txApp, game, npc, out.attacker, out.attackerQueues);
  const arrive = now + game.warlordTravelMs(Math.random);
  const fleetRec = new Record(txApp.findCollectionByNameOrId("fleets"));
  fleetRec.load(Object.assign({}, out.fleet, { arriveAtMs: arrive }));
  fleetRec.set("formation", "balanced");
  txApp.save(fleetRec);
  const ships = Object.keys(pick.fleet).reduce((a, k) => a + pick.fleet[k], 0);
  const minutes = Math.round((arrive - now) / 60000);
  notify(txApp, target.player.uid, [
    {
      kind: "fleet",
      title: "Flotte hostile en approche !",
      message: `${d.name}, seigneur de guerre, t'envoie ${game.formatInt(ships)} vaisseaux : impact dans ${Math.floor(minutes / 60)} h ${minutes % 60} min. Renforce tes défenses !`,
      createdAtMs: now,
      read: false,
    },
  ]);
  return fleetRec;
}

/** Vendetta gagnée : récompenses, seigneur affaibli et absent 7 jours. */
function finishVendettaWon(txApp, game, state, d, v, now) {
  const uid = game.warlordUid(d.id);
  if (findOrNull(txApp, "players", uid)) {
    const npc = loadPlayer(txApp, game, uid);
    game.shatterWarlord(npc.player);
    savePlayer(txApp, game, npc, npc.player, npc.queues);
  }
  const rt = Object.assign(game.emptyRuntime(), state.byId[d.id] || {});
  rt.absentUntilMs = now + game.WARLORD_RULES.vendetta.awayDays * 86400000;
  state.byId[d.id] = rt;
  // Flottes encore en route vers lui : elles rentrent sans combattre.
  txApp.findRecordsByFilter("fleets", 'targetUid = {:u} && status = "outbound"', "", 100, 0, { u: uid }).forEach((f) => {
    f.set("status", "returning");
    f.set("returnAtMs", now + Math.max(0, f.getFloat("arriveAtMs") - f.getFloat("departAtMs")));
    f.set("outcome", "none");
    txApp.save(f);
  });
  const title = game.vendettaTitle(d);
  game.vendettaWinners(v).forEach((w) => {
    if (!findOrNull(txApp, "players", w)) return;
    const loaded = loadPlayer(txApp, game, w);
    const p = loaded.player;
    const relic = game.rollRelic(`vendetta:${d.id}`, now, Math.random, d.tier === "strong" ? "rare" : "common");
    const kept = game.addRelic(p, relic);
    if (!(p.titles || []).some((t) => t.label === title)) p.titles = (p.titles || []).concat([{ label: title, seasonId: "vendetta", rank: 1 }]);
    game.addPassPoints(p, "vendetta", now);
    // v5.14 : table de butin « seigneur de guerre ».
    const loot = game.rollLoot(p, "warlord", now);
    savePlayer(txApp, game, loaded, p, loaded.queues);
    notify(txApp, w, [
      {
        kind: "event",
        title: "Vendetta gagnée !",
        message: `${d.name} quitte le secteur pour ${game.WARLORD_RULES.vendetta.awayDays} jours. Titre « ${title} », +${game.WARLORD_RULES.vendetta.passPoints} points de passe${kept ? " et une relique" : " (collection de reliques pleine)"}.${game.describeLoot(loot)}`,
        createdAtMs: now,
        read: false,
        link: "/game/seigneurs",
      },
    ]);
  });
  if (findOrNull(txApp, "players", v.ownerUid)) warlordSay(txApp, game, state, d, humanPlain(txApp.findRecordById("players", v.ownerUid)), "vendettaWon", now, true);
}

/* ---------- Coalitions (v4.7) ---------- */

function notifyHumans(txApp, notes) {
  txApp.findRecordsByFilter("players", "npc = ''", "", 0, 0).forEach((r) => {
    try {
      notify(txApp, r.id, notes);
    } catch (_) {
      /* facultatif */
    }
  });
}

/** Coalition gagnée : seigneur affaibli de 40 % et absent 10 jours, récompenses. */
function finishCoalitionWon(txApp, game, state, coal, co, now) {
  const d = game.findWarlord(co.warlordId);
  if (!d) return;
  const uid = game.warlordUid(d.id);
  if (findOrNull(txApp, "players", uid)) {
    const npc = loadPlayer(txApp, game, uid);
    game.shatterWarlord(npc.player, game.COALITION_RULES.powerLoss);
    savePlayer(txApp, game, npc, npc.player, npc.queues);
  }
  const rt = Object.assign(game.emptyRuntime(), state.byId[d.id] || {});
  rt.absentUntilMs = now + game.COALITION_RULES.awayDays * 86400000;
  state.byId[d.id] = rt;
  txApp.findRecordsByFilter("fleets", 'targetUid = {:u} && status = "outbound"', "", 200, 0, { u: uid }).forEach((f) => {
    f.set("status", "returning");
    f.set("returnAtMs", now + Math.max(0, f.getFloat("arriveAtMs") - f.getFloat("departAtMs")));
    f.set("outcome", "none");
    txApp.save(f);
  });
  game.coalitionRanking(co).forEach((c) => {
    if (!findOrNull(txApp, "players", c.uid)) return;
    const loaded = loadPlayer(txApp, game, c.uid);
    const out = game.grantCoalitionReward(co, d, loaded.player, now);
    // v5.14 : table de butin « seigneur de guerre » (participants récompensés).
    const loot = out.eligible ? game.rollLoot(loaded.player, "warlord", now) : null;
    savePlayer(txApp, game, loaded, loaded.player, loaded.queues);
    notify(txApp, c.uid, [
      {
        kind: "event",
        title: `Coalition victorieuse contre ${d.name}`,
        message: out.eligible
          ? `+${game.PASS_POINTS.coalition} points de passe, ${game.COALITION_RULES.rewardHours} h de production${out.relic ? `, relique : ${out.relic}` : ""}${out.title ? `, titre « ${out.title} »` : ""}.${game.describeLoot(loot)}`
          : `Ta part (moins de ${Math.round(game.COALITION_RULES.minShare * 100)} % de l'objectif) ne suffit pas pour une récompense, mais le secteur te doit une fière chandelle.`,
        createdAtMs: now,
        read: false,
        link: "/game/seigneurs",
      },
    ]);
  });
  notifyHumans(txApp, [{ kind: "event", title: `${d.name} est brisé`, message: `La coalition a gagné : il quitte le secteur pour ${game.COALITION_RULES.awayDays} jours.`, createdAtMs: now, read: false, link: "/game/seigneurs" }]);
  game.archiveCoalition(coal, now);
}

/** Coalition échouée : le seigneur se renforce. */
function finishCoalitionLost(txApp, game, coal, co, now) {
  const d = game.findWarlord(co.warlordId);
  const uid = d ? game.warlordUid(d.id) : "";
  if (d && findOrNull(txApp, "players", uid)) {
    const npc = loadPlayer(txApp, game, uid);
    game.empowerWarlord(npc.player);
    savePlayer(txApp, game, npc, npc.player, npc.queues);
  }
  if (d) notifyHumans(txApp, [{ kind: "event", title: `${d.name} a résisté à la coalition`, message: `Il sort de ces 5 jours renforcé de ${Math.round(game.COALITION_RULES.failGrowth * 100)} %.`, createdAtMs: now, read: false, link: "/game/seigneurs" }]);
  game.archiveCoalition(coal, now);
}

/** Tâche horaire des seigneurs : échéance, seuils, ouverture d'une coalition. */
function coalitionTick(txApp, game, state, humans, now) {
  const coal = game.readCoalitions(state);
  const lost = game.settleCoalition(coal, now);
  if (lost) finishCoalitionLost(txApp, game, coal, lost, now);
  const topHuman = humans.reduce((m, h) => Math.max(m, game.empirePower(h)), 0);
  const lords = game.warlordsConfig().defs
    .filter((d) => d.enabled)
    .map((d) => {
      const r = findOrNull(txApp, "players", game.warlordUid(d.id));
      const p = r ? humanPlain(r) : null;
      const rt = state.byId[d.id];
      return { id: d.id, power: p ? game.empirePower(p) : 0, fleetPower: p ? game.warlordFleetPower(p) : 0, present: !!p && !(rt && rt.absentUntilMs > now) };
    });
  const opened = game.checkCoalitionTrigger(coal, lords, topHuman, now);
  if (opened) {
    const d = game.findWarlord(opened.warlordId);
    notifyHumans(txApp, [
      { kind: "event", title: `Coalition contre ${d ? d.name : "un seigneur"} !`, message: `Il écrase le secteur : 5 jours pour lui détruire ${game.formatInt(opened.goal)} de puissance, tous ensemble.`, createdAtMs: now, read: false, link: "/game/seigneurs" },
    ]);
  }
  game.writeCoalitions(state, coal);
  return opened;
}

/** Après un combat impliquant un seigneur : vendetta, répliques. */
function warlordAfterCombat(txApp, game, attacker, defender, result, now) {
  const atkDef = attacker.player.npc ? game.findWarlord(attacker.player.npc) : null;
  const defDef = defender.player.npc ? game.findWarlord(defender.player.npc) : null;
  if (!atkDef && !defDef) return;
  const state = readWarlordsState(txApp, game);
  const outcome = result.combat.outcome;
  let won = null;
  let lord = null;
  if (defDef) {
    lord = defDef;
    const dealt = game.lossesPower(result.defender, result.combat.defenderLosses || {});
    won = game.recordVendettaDamage(state, defDef.id, attacker.player.uid, attacker.rec.getString("allianceId"), dealt, now);
    if (outcome === "attacker_win") warlordSay(txApp, game, state, defDef, humanPlain(attacker.rec), "raided", now, false);
  } else if (atkDef) {
    lord = atkDef;
    const dealt = game.lossesPower(result.attacker, result.combat.attackerLosses || {});
    won = game.recordVendettaDamage(state, atkDef.id, defender.player.uid, defender.rec.getString("allianceId"), dealt, now);
    warlordSay(txApp, game, state, atkDef, humanPlain(defender.rec), outcome === "attacker_win" ? "won" : "repelled", now, false);
  }
  if (won) finishVendettaWon(txApp, game, state, lord, won, now);
  // v4.7 : chaque vaisseau détruit chez le seigneur visé compte pour la coalition.
  const human = defDef ? attacker : defender;
  const humanDealt = defDef ? game.lossesPower(result.defender, result.combat.defenderLosses || {}) : game.lossesPower(result.attacker, result.combat.attackerLosses || {});
  const coal = game.readCoalitions(state);
  const coWon = game.recordCoalitionDamage(coal, lord.id, human.player.uid, human.player.pseudo, humanDealt, now);
  if (coWon) finishCoalitionWon(txApp, game, state, coal, coWon, now);
  game.writeCoalitions(state, coal);
  writeWarlordsState(txApp, state);
}

/** Seigneur absent (vendetta perdue) : on ne peut ni l'attaquer ni l'espionner. */
function warlordAbsence(txApp, game, uid, now) {
  if (!uid || String(uid).indexOf("npc") !== 0) return null;
  const d = game.warlordByUid(uid);
  if (!d) return null;
  const rt = readWarlordsState(txApp, game).byId[d.id];
  return rt && rt.absentUntilMs > now ? { name: d.name, untilMs: rt.absentUntilMs } : null;
}

/** Tâche horaire : croissance, attaques, marché, premiers contacts, vendettas échues. */
function warlordTick(now, opts) {
  const game = loadGame();
  const summary = { grown: 0, removed: 0, attacks: 0, offers: 0, contacts: 0, lost: 0 };
  const forceAttack = opts && opts.forceAttack ? String(opts.forceAttack) : "";
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const cfg = game.warlordsConfig();
    const state = readWarlordsState(txApp, game);
    const humans = txApp
      .findRecordsByFilter("players", "npc = '' && resourcesUpdatedAtMs >= {:t}", "", 500, 0, { t: now - game.WARLORD_RULES.activeDays * 86400000 })
      .map(humanPlain);
    const ref = game.warlordReference(humans);

    // Vendettas échues : perdues, riposte programmée.
    game.settleVendettas(state, now).forEach((v) => {
      const d = game.findWarlord(v.warlordId);
      summary.lost++;
      if (!d || !findOrNull(txApp, "players", v.ownerUid)) return;
      notify(txApp, v.ownerUid, [{ kind: "event", title: "Vendetta perdue", message: `${d.name} a tenu 72 h : il prépare sa riposte.`, createdAtMs: now, read: false, link: "/game/seigneurs" }]);
      warlordSay(txApp, game, state, d, humanPlain(txApp.findRecordById("players", v.ownerUid)), "vendettaLost", now, true);
    });

    const active = [];
    cfg.defs.forEach((d) => {
      const uid = game.warlordUid(d.id);
      try {
        if (!cfg.settings.enabled || !d.enabled) {
          if (removeWarlord(txApp, uid)) summary.removed++;
          delete state.byId[d.id];
          return;
        }
        ensureWarlordRecord(txApp, game, d, now);
        const loaded = loadPlayer(txApp, game, uid);
        const flushed = game.flushPlayer(loaded.player, loaded.queues, now);
        const npc = flushed.player;
        npc.npc = d.id;
        const rt = Object.assign(game.emptyRuntime(), state.byId[d.id] || {});
        if (rt.absentUntilMs > now) {
          rt.lastTickMs = now;
          state.byId[d.id] = rt;
          savePlayer(txApp, game, loaded, npc, flushed.queues);
          return;
        }
        state.byId[d.id] = game.growWarlord(npc, d, ref, rt, now);
        savePlayer(txApp, game, loaded, npc, flushed.queues);
        summary.grown++;
        active.push(d);
      } catch (err) {
        console.log(`[cosmic] seigneur ${d.id} : ${err}`);
      }
    });

    // v4.7 : coalitions (échéance, seuils, ouverture).
    try {
      if (coalitionTick(txApp, game, state, humans, now)) summary.coalition = true;
    } catch (err) {
      console.log(`[cosmic] coalition : ${err}`);
    }

    // Attaques (agressifs, opportunistes, ripostes de vendetta).
    active.forEach((d) => {
      const uid = game.warlordUid(d.id);
      const rt = state.byId[d.id];
      try {
        const reprisals = state.reprisals.filter((r) => r.warlordId === d.id);
        const attacks = d.personality === "aggressive" || d.personality === "opportunist";
        const due = forceAttack === d.id || (attacks && cfg.settings.attackFrequency > 0 && now >= rt.nextAttackAtMs);
        if (reprisals.length === 0 && !due) return;
        const npc = loadPlayer(txApp, game, uid);
        const pool = reprisals.length > 0 ? humans.filter((h) => reprisals.some((r) => r.uid === h.uid)) : humans;
        const candidates = pool.map((p) => ({
          player: p,
          lastAttackOnTargetMs: lastAttackOnTarget(txApp, uid, p.uid),
          lastWarlordHitMs: state.hits[p.uid] || 0,
          reprisal: reprisals.some((r) => r.uid === p.uid),
        }));
        const pick = game.pickWarlordTarget(d, npc.player, candidates, now, Math.random);
        // Une riposte qui ne trouve pas sa cible abandonne au bout de 48 h.
        state.reprisals = state.reprisals.filter((r) => r.warlordId !== d.id || now - r.dueAtMs < 48 * 3600000);
        if (!pick) {
          if (due) rt.nextAttackAtMs = now + game.WARLORD_RULES.retryHours * 3600000;
          return;
        }
        launchWarlordAttack(txApp, game, d, npc, pick, now);
        state.hits[pick.target.player.uid] = now;
        state.reprisals = state.reprisals.filter((r) => !(r.warlordId === d.id && r.uid === pick.target.player.uid));
        if (due) rt.nextAttackAtMs = now + game.nextAttackDelayMs(Math.random);
        summary.attacks++;
      } catch (err) {
        console.log(`[cosmic] attaque du seigneur ${d.id} : ${err}`);
        rt.nextAttackAtMs = now + game.WARLORD_RULES.retryHours * 3600000;
      }
    });

    // Premier contact : le seigneur le plus proche se présente aux joueurs arrivés à Bronze I.
    if (active.length > 0) {
      humans
        .filter((h) => (h.xp || 0) >= game.WARLORD_RULES.minTargetXp && !state.contacted[h.uid])
        .slice(0, 20)
        .forEach((h) => {
          const d = game.nearestWarlord(h.uid, active);
          state.contacted[h.uid] = now;
          if (d && warlordSay(txApp, game, state, d, h, "contact", now, true)) summary.contacts++;
        });
    }

    // Ménage : touches et messages de plus de 7 jours.
    const week = now - 7 * 86400000;
    Object.keys(state.hits).forEach((k) => state.hits[k] < week && delete state.hits[k]);
    Object.keys(state.lastMsg).forEach((k) => state.lastMsg[k] < week && delete state.lastMsg[k]);
    writeWarlordsState(txApp, state);
  });
  return summary;
}

/** GET /api/cosmic/warlords — fiches publiques des seigneurs et vendettas en cours. */
function warlordsList(e) {
  const game = loadGame();
  applyContent($app, game);
  const now = Date.now();
  const cfg = game.warlordsConfig();
  const state = readWarlordsState($app, game);
  const list = cfg.settings.enabled
    ? cfg.defs
        .filter((d) => d.enabled)
        .map((d) => {
          const rec = findOrNull($app, "players", game.warlordUid(d.id));
          return game.warlordPublic(d, rec ? humanPlain(rec) : null, state.byId[d.id], state, now);
        })
    : [];
  const history = state.vendettas.filter((v) => v.status !== "active").slice(-10);
  const coal = game.readCoalitions(state);
  return e.json(200, { warlords: list, history, rules: { vendetta: game.WARLORD_RULES.vendetta, coalition: game.COALITION_RULES }, coalition: coal.coalition || coal.history[0] || null });
}

/** POST /api/cosmic/warlords { action: "vendetta", warlordId, scope } */
function warlordsRequest(e) {
  const game = loadGame();
  const req = body(e);
  const uid = e.auth.id;
  let out = null;
  if (String(req.action || "") !== "vendetta") throw new BadRequestError("Action inconnue.");
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    const d = game.findWarlord(String(req.warlordId || ""));
    if (!d || !d.enabled || !game.warlordsConfig().settings.enabled) throw new NotFoundError("Seigneur introuvable.");
    const npcUid = game.warlordUid(d.id);
    if (!findOrNull(txApp, "players", npcUid)) throw new BadRequestError(`${d.name} n'est pas encore arrivé dans le secteur.`);
    const state = readWarlordsState(txApp, game);
    const me = loadFlushed(txApp, game, uid);
    if (game.onVacation(me.player, now)) throw new BadRequestError("Tu es en vacances.");
    me.player.allianceId = me.loaded.rec.getString("allianceId");
    const cost = game.productionHours(me.player, game.WARLORD_RULES.vendetta.costHours);
    Object.keys(cost).forEach((res) => {
      if ((me.player.resources[res] || 0) < cost[res]) throw new BadRequestError(`Une vendetta coûte ${game.WARLORD_RULES.vendetta.costHours} h de production : il te manque des ressources.`);
    });
    const npc = loadPlayer(txApp, game, npcUid);
    let v;
    try {
      v = game.openVendetta(state, d, me.player, req.scope === "alliance" ? "alliance" : "player", npc.player, state.byId[d.id], now);
    } catch (err) {
      throw asHttpError(game, err);
    }
    Object.keys(cost).forEach((res) => (me.player.resources[res] -= cost[res]));
    savePlayer(txApp, game, me.loaded, me.player, me.queues);
    notify(txApp, uid, me.notifications);
    if (v.allianceId) notifyAlliance(txApp, v.allianceId, "Vendetta d'alliance", `${me.player.pseudo} déclare une vendetta à ${d.name} : 72 h pour lui détruire ${game.formatInt(v.goal)} de puissance.`, now);
    warlordSay(txApp, game, state, d, Object.assign({}, me.player, { uid }), "vendettaOpen", now, true);
    writeWarlordsState(txApp, state);
    out = v;
  });
  return e.json(200, out);
}

/** POST /api/cosmic/admin/warlords { action: "tick" | "attack" | "reset", warlordId } */
function adminWarlords(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  const req = body(e);
  const action = String(req.action || "tick");
  const id = String(req.warlordId || "");
  if (action === "reset") {
    $app.runInTransaction((txApp) => {
      applyContent(txApp, game);
      const d = game.findWarlord(id);
      if (!d) throw new NotFoundError("Seigneur introuvable.");
      removeWarlord(txApp, game.warlordUid(d.id));
      const state = readWarlordsState(txApp, game);
      delete state.byId[d.id];
      writeWarlordsState(txApp, state);
    });
  }
  if (action === "coalitionStart" || action === "coalitionStop") {
    let out = null;
    $app.runInTransaction((txApp) => {
      applyContent(txApp, game);
      const now = Date.now();
      const state = readWarlordsState(txApp, game);
      const coal = game.readCoalitions(state);
      if (action === "coalitionStart") {
        const d = game.findWarlord(id);
        const rec = d ? findOrNull(txApp, "players", game.warlordUid(d.id)) : null;
        if (!d || !rec) throw new NotFoundError("Seigneur introuvable.");
        if (coal.coalition && coal.coalition.status === "active") throw new BadRequestError("Une coalition est déjà en cours.");
        const p = humanPlain(rec);
        // Lancement manuel : seuil et délais considérés comme remplis.
        coal.lastEndMs = 0;
        coal.overSince = { [d.id]: now - game.COALITION_RULES.holdHours * 3600000 };
        out = game.checkCoalitionTrigger(coal, [{ id: d.id, power: Number.MAX_SAFE_INTEGER, fleetPower: game.warlordFleetPower(p), present: true }], 1, now);
        if (!out) throw new BadRequestError("Coalition impossible.");
        notifyHumans(txApp, [{ kind: "event", title: `Coalition contre ${d.name} !`, message: `5 jours pour lui détruire ${game.formatInt(out.goal)} de puissance, tous ensemble.`, createdAtMs: now, read: false, link: "/game/seigneurs" }]);
      } else {
        if (!coal.coalition || coal.coalition.status !== "active") throw new BadRequestError("Aucune coalition en cours.");
        coal.coalition.endsAtMs = now;
        const lost = game.settleCoalition(coal, now);
        if (lost) finishCoalitionLost(txApp, game, coal, lost, now);
      }
      game.writeCoalitions(state, coal);
      writeWarlordsState(txApp, state);
    });
    return e.json(200, out || { ok: true });
  }
  const summary = warlordTick(Date.now(), action === "attack" ? { forceAttack: id } : null);
  return e.json(200, summary);
}

/** POST /api/cosmic/vacation { days } — départ en vacances (le retour passe par l'action vacationEnd). */
function vacationRequest(e) {
  const game = loadGame();
  const req = body(e);
  const uid = e.auth.id;
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    const me = loadFlushed(txApp, game, uid);
    const fleetsAway = txApp.findRecordsByFilter("fleets", 'ownerUid = {:u} && status != "done"', "", 10, 0, { u: uid }).length;
    const hostileIncoming = txApp.findRecordsByFilter("fleets", '(targetUid = {:u} || targetOwnerUid = {:u}) && status = "outbound" && (mission = "attack" || mission = "pirate")', "", 10, 0, { u: uid }).length;
    const last = txApp.findRecordsByFilter("battle_reports", "defenderUid = {:u}", "-timestamp", 1, 0, { u: uid });
    const ctx = {
      fleetsAway,
      hostileIncoming,
      lastAttackedAtMs: last.length > 0 ? last[0].getFloat("timestamp") : 0,
      ultimatum: !!game.activeUltimatum(me.player, now),
    };
    try {
      out = game.startVacation(me.player, req.days, ctx, now);
    } catch (err) {
      throw asHttpError(game, err);
    }
    savePlayer(txApp, game, me.loaded, me.player, me.queues);
    notify(txApp, uid, me.notifications);
  });
  return e.json(200, out);
}

/* ---------- Boss de saison (v4.3) : moteur du Léviathan, dernier week-end du mois ---------- */

function readSeasonBoss(txApp, game) {
  try {
    const rec = (txApp || $app).findFirstRecordByData("game_config", "key", game.SEASON_BOSS_KEY);
    return game.normalizeLeviathan(toPlain(rec).data);
  } catch (_) {
    return null;
  }
}

function writeSeasonBoss(txApp, game, state) {
  let rec;
  try {
    rec = txApp.findFirstRecordByData("game_config", "key", game.SEASON_BOSS_KEY);
  } catch (_) {
    rec = new Record(txApp.findCollectionByNameOrId("game_config"));
    rec.set("key", game.SEASON_BOSS_KEY);
  }
  rec.set("data", state);
  txApp.save(rec);
}

function distributeSeasonBoss(txApp, game, state, now) {
  if (state.rewarded || state.status === "active") return state;
  const month = game.bossMonthOf(state);
  const name = month ? month.boss.name : "Le boss de saison";
  const rewards = {};
  const casino = readCasino(txApp, game).settings;
  game.leviathanRanking(state).forEach((c, i) => {
    if (!findOrNull(txApp, "players", c.uid)) return;
    const owner = loadPlayer(txApp, game, c.uid);
    const flushed = game.flushPlayer(owner.player, owner.queues, now);
    const out = game.grantSeasonBossReward(state, flushed.player, now);
    const won = state.status === "killed";
    const mythic = won && i === 0 ? grantMythicTo(txApp, game, flushed.player, "seasonboss", now) : "";
    const tokens = game.grantTokens(flushed.player, game.bossTokens(casino, won, i));
    // v5.14 : officier rare (rôle hors recrutement), à très faible chance.
    const officer = won ? game.rollRareOfficer(flushed.player, i < 3 ? game.RARE_OFFICER_RULES.podium : game.RARE_OFFICER_RULES.participant) : null;
    if (officer) flushed.notifications.push(rareOfficerNotif(officer, now));
    // v5.14 : butin du boss (relique, capsule), en plus des récompenses.
    const loot = won ? game.rollLoot(flushed.player, "seasonBoss", now, i) : null;
    if (loot && (loot.relic || loot.capsule)) flushed.notifications.push(lootNotif(loot, now));
    savePlayer(txApp, game, owner, flushed.player, flushed.queues);
    rewards[c.uid] = bossRewardEntry({ points: out.points, title: out.title, relic: out.relic, mythic, tokens });
    notify(txApp, c.uid, flushed.notifications.concat([
      {
        kind: "event",
        title: won ? `${name} est tombé !` : `${name} s'est retiré`,
        message: `+${out.points} points de passe${out.title ? `, le titre « ${out.title} » et son sceau` : ""}${out.relic ? `, relique : ${out.relic}` : ""}${mythic ? `, relique MYTHIQUE : ${mythic} !` : ""}${tokens ? `, ${game.tokensLabel(tokens)}` : ""}.`,
        createdAtMs: now,
        read: false,
        link: "/game/boss",
        data: tokenNotifData(bossNotifData(null, out.relic, mythic), tokens),
      },
    ]));
  });
  archiveBoss(txApp, game, "seasonboss", state, { name, image: month ? month.boss.image : undefined });
  return Object.assign({}, state, { rewarded: true, archived: true, rewards });
}

function seasonBossArrival(txApp, game, rec, now) {
  const fleet = fleetFromRecord(rec);
  const backAt = now + game.LEVIATHAN_RULES.flightMinutes * 60000;
  const state = readSeasonBoss(txApp, game);
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
  if (res.damage > 0) {
    game.grantCommanderXp(owner.player, "admiral", game.COMMANDER_XP.bossAssault);
    game.grantCommanderXp(owner.player, "hunter", game.COMMANDER_XP.bossAssault);
    game.addPassPoints(owner.player, "bossAssault", now);
    owner.rec.set("commanders", owner.player.commanders || null);
    owner.rec.set("seasonPass", owner.player.seasonPass || null);
    owner.rec.set("chronicle", owner.player.chronicle || null);
    txApp.save(owner.rec);
  }
  const lost = Object.keys(res.lost).reduce((a, k) => a + res.lost[k], 0);
  notify(txApp, fleet.ownerUid, [
    {
      kind: "combat-attacker",
      title: res.killed ? `Coup de grâce sur ${fleet.targetPseudo} !` : `Assaut sur ${fleet.targetPseudo}`,
      message: res.damage > 0 ? `${game.formatInt(res.damage)} dégâts infligés, ${lost} vaisseau(x) perdu(s).` : "Le boss n'était plus là : la flotte rentre.",
      createdAtMs: now,
      read: false,
    },
  ]);
  if (res.killed) next = distributeSeasonBoss(txApp, game, next, now);
  writeSeasonBoss(txApp, game, next);
}

/** Tâche planifiée : apparition (week-end réglable, dernier du mois par défaut), échéance, récompenses. */
function seasonBossTick(now) {
  const game = loadGame();
  let changed = false;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    let state = readSeasonBoss(txApp, game);
    if (state) {
      const closed = game.closeLeviathan(state, now);
      if (closed !== state) {
        state = closed;
        changed = true;
      }
      if (state.status !== "active" && !state.rewarded) {
        state = distributeSeasonBoss(txApp, game, state, now);
        changed = true;
      }
      // v5.10 : combat terminé avant le Hall of fame → archivé une fois.
      if (state.status !== "active" && state.rewarded && (!state.archived || (state.status === "killed" && !state.killedBy && !state.legacyChecked))) {
        state = withLegacyKiller(txApp, game, state, "seasonboss");
        const month = game.bossMonthOf(state);
        archiveBoss(txApp, game, "seasonboss", state, { name: month ? month.boss.name : "Le boss de saison", image: month ? month.boss.image : undefined });
        changed = true;
      }
    }
    const win = game.seasonBossWindow(now);
    if (win && (!state || state.id !== win.id) && (!state || state.status !== "active")) {
      const actives = txApp.findRecordsByFilter("players", "resourcesUpdatedAtMs >= {:t} && npc = ''", "", 500, 0, { t: now - 7 * 86400000 }).map((r) => toPlain(r));
      state = game.spawnSeasonBoss(win, actives);
      changed = true;
      const month = game.bossMonthOf(state);
      actives.forEach((p) => {
        try {
          notify(txApp, p.id, [{ kind: "event", title: `${month ? month.boss.name : "Le boss de saison"} surgit !`, message: `Tout le secteur doit frapper avant ${game.parisWhenLabel(state.endMs)} (page Boss de saison).`, createdAtMs: now, read: false, link: "/game/boss" }]);
        } catch (_) {
          /* facultatif */
        }
      });
    }
    // v5.10.5 : rappels (la veille, avant la fin).
    const coming = game.seasonBossWindow(now, true);
    const reminded = bossReminders(txApp, game, "seasonboss", state, coming && coming.startMs > now ? coming : null, now);
    if (reminded !== state) {
      state = reminded;
      changed = true;
    }
    if (state) {
      const sampled = game.recordLeviathanTimeline(state, now);
      if (sampled !== state) {
        state = sampled;
        changed = true;
      }
    }
    if (changed && state) writeSeasonBoss(txApp, game, state);
  });
  return changed;
}

/** POST /api/cosmic/admin/seasonboss { action: "start" | "stop" | "resize", maxHp? } */
function adminSeasonBoss(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  const req = body(e);
  const action = String(req.action || "");
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    let state = readSeasonBoss(txApp, game);
    if (action === "start") {
      if (state && state.status === "active" && now < state.endMs) throw new BadRequestError("Le boss de saison est déjà là.");
      const monthId = game.chronicleMonthId(now);
      if (!game.chroniclesConfig().months.some((m) => m.id === monthId)) throw new BadRequestError("Pas de chronique (ni de boss) pour ce mois.");
      const actives = txApp.findRecordsByFilter("players", "resourcesUpdatedAtMs >= {:t} && npc = ''", "", 500, 0, { t: now - 7 * 86400000 }).map((r) => toPlain(r));
      state = game.spawnSeasonBoss({ id: `boss-${monthId}-manual-${now}`, startMs: now, endMs: now + game.SEASON_BOSS_RULES.durationHours * 3600000 }, actives);
    } else if (action === "stop") {
      if (!state || state.status !== "active") throw new BadRequestError("Aucun boss en cours.");
      state = distributeSeasonBoss(txApp, game, Object.assign({}, state, { status: "failed", endedAtMs: now, endMs: now }), now);
    } else if (action === "resize") {
      const before = state ? state.maxHp : 0;
      try {
        state = game.resizeLeviathan(state, Number(req.maxHp), now);
      } catch (err) {
        throw asHttpError(game, err);
      }
      bossAdminLog(txApp, e, "season_boss", "Boss de saison : structure ajustée", { maxHp: { avant: before, après: state.maxHp } }, now);
    } else if (action === "reschedule") {
      // v5.10.4 : prolonger ou écourter le combat en cours.
      const before = state ? state.endMs : 0;
      try {
        state = game.rescheduleBoss(state, Number(req.endMs), now);
      } catch (err) {
        throw asHttpError(game, err);
      }
      bossAdminLog(txApp, e, "season_boss", "Boss de saison : fin du combat déplacée", { endMs: { avant: before, après: state.endMs } }, now);
    } else throw new BadRequestError("Action inconnue.");
    writeSeasonBoss(txApp, game, state);
    out = state;
  });
  return e.json(200, out);
}

/* ---------- Boss d'alliance (v4.6) : une fois par semaine, payé par le trésor ---------- */

function readAllianceBoss(game, allianceRec) {
  try {
    return game.normalizeAllianceBoss(toPlain(allianceRec).boss);
  } catch (_) {
    return null;
  }
}

/** Membres de l'alliance (fiches complètes), et ceux actifs ces 7 derniers jours. */
function allianceMembers(txApp, alliance, now) {
  const members = [];
  (alliance.members || []).forEach((uid) => {
    const r = findOrNull(txApp, "players", uid);
    if (r) members.push(Object.assign(toPlain(r), { uid: r.id }));
  });
  const actives = members.filter((m) => now - (Number(m.lastActiveMs) || Number(m.resourcesUpdatedAtMs) || 0) < 7 * 86400000);
  return { members, actives };
}

function allianceBossLog(txApp, allianceId, uid, pseudo, text, resources) {
  const rec = new Record(txApp.findCollectionByNameOrId("alliance_logs"));
  rec.load({ allianceId, kind: "boss", actorUid: uid, actorPseudo: pseudo, text, resources: resources || null, createdAtMs: Date.now() });
  txApp.save(rec);
}

/** Récompenses, remboursement au trésor et notifications (une seule fois). */
function distributeAllianceBoss(txApp, game, allianceRec, state, now) {
  if (state.rewarded || state.status === "active") return state;
  const name = game.allianceBossDef(state).name;
  const rewards = {};
  const casino = readCasino(txApp, game).settings;
  game.leviathanRanking(state).forEach((c, i) => {
    if (!findOrNull(txApp, "players", c.uid)) return;
    const owner = loadPlayer(txApp, game, c.uid);
    const flushed = game.flushPlayer(owner.player, owner.queues, now);
    const out = game.grantAllianceBossReward(state, flushed.player, now);
    const won = state.status === "killed";
    const tokens = game.grantTokens(flushed.player, game.bossTokens(casino, won, i));
    // v5.14 : officier rare (rôle hors recrutement), à très faible chance.
    const officer = won ? game.rollRareOfficer(flushed.player, i < 3 ? game.RARE_OFFICER_RULES.podium : game.RARE_OFFICER_RULES.participant) : null;
    if (officer) flushed.notifications.push(rareOfficerNotif(officer, now));
    // v5.14 : butin du boss (relique, capsule), en plus des récompenses.
    const loot = won ? game.rollLoot(flushed.player, "allianceBoss", now, i) : null;
    if (loot && (loot.relic || loot.capsule)) flushed.notifications.push(lootNotif(loot, now));
    savePlayer(txApp, game, owner, flushed.player, flushed.queues);
    rewards[c.uid] = bossRewardEntry({ gain: out.gain, points: out.points, relic: out.relic, tokens });
    notify(txApp, c.uid, flushed.notifications.concat([
      {
        kind: "alliance",
        title: won ? `${name} est tombé !` : `${name} s'est retiré`,
        message: `+${out.points} points de passe${Object.keys(out.gain || {}).length ? ", 2 h de production" : ""}${out.relic ? `, relique : ${out.relic}` : ""}${tokens ? `, ${game.tokensLabel(tokens)}` : ""}.`,
        createdAtMs: now,
        read: false,
        link: "/game/alliance",
        data: tokenNotifData(bossNotifData(out.gain, out.relic, ""), tokens),
      },
    ]));
  });
  const refund = game.allianceBossRefund(state);
  if (Object.keys(refund).length > 0) {
    const treasury = toPlain(allianceRec).treasury || {};
    Object.keys(refund).forEach((r) => (treasury[r] = (Number(treasury[r]) || 0) + refund[r]));
    allianceRec.set("treasury", treasury);
  }
  allianceBossLog(txApp, allianceRec.id, "", name, state.status === "killed" ? `${name} abattu : la moitié du coût revient au trésor.` : `${name} a survécu.`, Object.keys(refund).length ? refund : null);
  archiveBoss(txApp, game, "allianceboss", state, { name, image: game.allianceBossDef(state).image, allianceId: allianceRec.id, allianceName: allianceRec.getString("name") });
  return Object.assign({}, state, { rewarded: true, archived: true, rewards });
}

/** POST /api/cosmic/allianceboss { action: "call" } */
function allianceBossRequest(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const req = body(e);
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    const actor = loadPlayer(txApp, game, uid);
    const allianceRec = actor.player.allianceId ? findOrNull(txApp, "alliances", actor.player.allianceId) : null;
    if (!allianceRec) throw new BadRequestError("Il faut une alliance.");
    const alliance = Object.assign(toPlain(allianceRec), { id: allianceRec.id });
    if ((alliance.members || []).indexOf(uid) < 0) throw new BadRequestError("Tu ne fais plus partie de cette alliance.");
    if (String(req.action || "") !== "call") throw new BadRequestError("Action inconnue.");
    const { members, actives } = allianceMembers(txApp, alliance, now);
    let state;
    try {
      // v5.14.2 : en alternance avec le boss mondial (pas d'appel pendant son passage).
      const lev = readLeviathan(txApp, game);
      state = game.callAllianceBoss(alliance, readAllianceBoss(game, allianceRec), members, actives, uid, now, lev && lev.status === "active" && now < lev.endMs ? lev : null);
    } catch (err) {
      throw asHttpError(game, err);
    }
    allianceRec.set("treasury", alliance.treasury);
    allianceRec.set("boss", state);
    txApp.save(allianceRec);
    const def = game.allianceBossDef(state);
    allianceBossLog(txApp, allianceRec.id, uid, actor.player.pseudo, `${actor.player.pseudo} appelle ${def.name} : 24 h pour l'abattre.`, state.cost);
    members.forEach((m) => {
      notify(txApp, m.uid, [{ kind: "alliance", title: `${def.name} approche !`, message: `${actor.player.pseudo} a appelé le boss d'alliance : 24 h pour l'abattre, un assaut toutes les 4 h.`, createdAtMs: now, read: false, link: "/game/alliance" }]);
    });
    out = state;
  });
  return e.json(200, out);
}

function allianceBossArrival(txApp, game, rec, now) {
  const fleet = fleetFromRecord(rec);
  const backAt = now + game.ALLIANCE_BOSS_RULES.flightMinutes * 60000;
  const allianceId = String(fleet.targetUid || "").replace(/^allianceboss:/, "");
  const allianceRec = allianceId ? findOrNull(txApp, "alliances", allianceId) : null;
  const state = allianceRec ? readAllianceBoss(game, allianceRec) : null;
  if (!findOrNull(txApp, "players", fleet.ownerUid)) {
    rec.set("status", "done");
    txApp.save(rec);
    return;
  }
  const owner = loadPlayer(txApp, game, fleet.ownerUid);
  if (!state || !allianceRec) {
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
  if (res.damage > 0) {
    game.grantCommanderXp(owner.player, "admiral", game.COMMANDER_XP.bossAssault);
    game.grantCommanderXp(owner.player, "hunter", game.COMMANDER_XP.bossAssault);
    game.addPassPoints(owner.player, "bossAssault", now);
    owner.rec.set("commanders", owner.player.commanders || null);
    owner.rec.set("seasonPass", owner.player.seasonPass || null);
    owner.rec.set("chronicle", owner.player.chronicle || null);
    txApp.save(owner.rec);
  }
  const lost = Object.keys(res.lost).reduce((a, k) => a + res.lost[k], 0);
  notify(txApp, fleet.ownerUid, [
    {
      kind: "combat-attacker",
      title: res.killed ? `Coup de grâce sur ${fleet.targetPseudo} !` : `Assaut sur ${fleet.targetPseudo}`,
      message: res.damage > 0 ? `${game.formatInt(res.damage)} dégâts infligés, ${lost} vaisseau(x) perdu(s).` : "Le boss n'était plus là : la flotte rentre.",
      createdAtMs: now,
      read: false,
    },
  ]);
  if (res.killed) next = distributeAllianceBoss(txApp, game, allianceRec, next, now);
  allianceRec.set("boss", next);
  txApp.save(allianceRec);
}

/** Tâche planifiée : fin des boss d'alliance (24 h), récompenses, relevé horaire. */
function allianceBossTick(now) {
  const game = loadGame();
  let changed = 0;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    txApp.findAllRecords("alliances").forEach((allianceRec) => {
      let state = readAllianceBoss(game, allianceRec);
      if (!state) return;
      const before = JSON.stringify(state);
      state = game.closeLeviathan(state, now);
      if (state.status !== "active" && !state.rewarded) state = distributeAllianceBoss(txApp, game, allianceRec, state, now);
      state = game.recordLeviathanTimeline(state, now);
      if (JSON.stringify(state) !== before) {
        allianceRec.set("boss", state);
        txApp.save(allianceRec);
        changed++;
      }
    });
  });
  return changed;
}

/* ---------- Objectifs du jour d'alliance (v4.9) ---------- */

function dailyMembersOf(txApp, game, allianceRec, now) {
  return (toPlain(allianceRec).members || [])
    .map((uid) => {
      const rec = findOrNull(txApp, "players", uid);
      if (!rec) return null;
      const p = toPlain(rec);
      p.uid = uid;
      return game.dailyMemberOf(p, now);
    })
    .filter((m) => !!m);
}

/** Objectif atteint : points de passe et production pour chaque contributeur, bonus du trésor. */
function rewardAllianceDaily(txApp, game, allianceRec, daily, now) {
  const R = game.ALLIANCE_DAILY_RULES;
  Object.keys(daily.contributions || {}).forEach((uid) => {
    if (!findOrNull(txApp, "players", uid)) return;
    const owner = loadPlayer(txApp, game, uid);
    const flushed = game.flushPlayer(owner.player, owner.queues, now);
    game.addPassPoints(flushed.player, "allianceDaily", now);
    const gain = game.productionHours(flushed.player, R.rewardHours);
    Object.keys(gain).forEach((r) => (flushed.player.resources[r] = (flushed.player.resources[r] || 0) + gain[r]));
    savePlayer(txApp, game, owner, flushed.player, flushed.queues);
    notify(txApp, uid, flushed.notifications.concat([
      { kind: "alliance", title: "Objectif du jour atteint", message: `Ton alliance a rempli son objectif : +${R.passPoints} points de passe et ${R.rewardHours} h de production.`, createdAtMs: now, read: false, link: "/game/alliance" },
    ]));
  });
  const bonus = game.dailyTreasuryBonus(daily);
  if (Object.keys(bonus).length > 0) {
    const treasury = toPlain(allianceRec).treasury || {};
    Object.keys(bonus).forEach((r) => (treasury[r] = (Number(treasury[r]) || 0) + bonus[r]));
    allianceRec.set("treasury", treasury);
    // v5.1 : 10 % du bonus rejoint aussi le coffre de guerre (plafonné à 30 jours de dépôts).
    const chest = game.readWarChest(toPlain(allianceRec).warChest);
    game.depositWarChest(chest, bonus);
    allianceRec.set("warChest", chest);
  }
  allianceBossLog(txApp, allianceRec.id, "", "", "Objectif du jour atteint : le trésor reçoit 10 % de la production de l'alliance.", Object.keys(bonus).length ? bonus : null);
}

/** Tâche (toutes les 10 min) : propositions à 6 h, fin du vote à 10 h, progression, récompenses. */
function allianceDailyTick(now) {
  const game = loadGame();
  let changed = 0;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const today = game.parisDay(now);
    const phase = game.dailyPhase(now);
    txApp.findAllRecords("alliances").forEach((allianceRec) => {
      let daily = game.readDaily(toPlain(allianceRec).daily);
      const before = JSON.stringify(daily);
      if (daily && daily.day !== today && (daily.status === "active" || daily.status === "voting")) daily.status = "failed";
      const needsNew = (!daily || daily.day !== today) && phase !== "before";
      if (!needsNew && !(daily && daily.day === today)) {
        if (JSON.stringify(daily) !== before) {
          allianceRec.set("daily", daily);
          txApp.save(allianceRec);
          changed++;
        }
        return;
      }
      const members = dailyMembersOf(txApp, game, allianceRec, now);
      if (members.length === 0) return;
      if (needsNew) {
        const previous = game.previousSummary(daily);
        daily = game.proposeDaily(allianceRec.id, today, members, now);
        if (previous) daily.previous = previous;
      }
      if (daily.status === "voting" && phase === "active") game.startDaily(daily, members, now);
      if (daily.status === "active" && game.updateDailyProgress(daily, members, now)) rewardAllianceDaily(txApp, game, allianceRec, daily, now);
      if (JSON.stringify(daily) !== before) {
        allianceRec.set("daily", daily);
        txApp.save(allianceRec);
        changed++;
      }
    });
  });
  return changed;
}

/** POST /api/cosmic/alliance/daily { vote: index } — fondateur et officiers, de 6 h à 10 h. */
function allianceDailyVote(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const req = body(e);
  let out = null;
  $app.runInTransaction((txApp) => {
    const now = Date.now();
    const player = findOrNull(txApp, "players", uid);
    const allianceId = player ? player.getString("allianceId") : "";
    const allianceRec = allianceId ? findOrNull(txApp, "alliances", allianceId) : null;
    if (!allianceRec) throw new BadRequestError("Tu n'as pas d'alliance.");
    const alliance = toPlain(allianceRec);
    const daily = game.readDaily(alliance.daily);
    if (!daily) throw new BadRequestError("Pas encore d'objectif proposé aujourd'hui (à partir de 6 h).");
    try {
      game.voteDaily(daily, uid, game.allianceRole(alliance, uid), req.vote, now);
    } catch (err) {
      throw asHttpError(game, err);
    }
    allianceRec.set("daily", daily);
    txApp.save(allianceRec);
    out = daily;
  });
  return e.json(200, out);
}

/* ---------- Chat d'alliance : « … écrit » (v4.6) ---------- */

/** POST /api/cosmic/alliance/typing — diffuse un signal éphémère aux
 *  membres abonnés au sujet « alliancetyping_<id> » (rien n'est enregistré). */
function allianceTyping(e) {
  const uid = e.auth.id;
  const player = findOrNull($app, "players", uid);
  const allianceId = player ? player.getString("allianceId") : "";
  if (!allianceId) return e.json(200, { ok: false });
  const topic = `alliancetyping_${allianceId}`;
  const message = new SubscriptionMessage({ name: topic, data: JSON.stringify({ uid, pseudo: player.getString("pseudo"), at: Date.now() }) });
  const clients = $app.subscriptionsBroker().clients();
  for (const id in clients) {
    try {
      if (clients[id].hasSubscription(topic)) clients[id].send(message);
    } catch (_) {
      /* client déconnecté */
    }
  }
  return e.json(200, { ok: true });
}

/* ---------- Gazette du secteur (v4.6) : chaque lundi à 9 h ---------- */

function readGazette(txApp, game) {
  try {
    return game.gazetteState(toPlain((txApp || $app).findFirstRecordByData("game_config", "key", game.GAZETTE_KEY)).data);
  } catch (_) {
    return game.gazetteState(null);
  }
}

function writeGazette(txApp, game, state) {
  let rec;
  try {
    rec = txApp.findFirstRecordByData("game_config", "key", game.GAZETTE_KEY);
  } catch (_) {
    rec = new Record(txApp.findCollectionByNameOrId("game_config"));
    rec.set("key", game.GAZETTE_KEY);
  }
  rec.set("data", state);
  txApp.save(rec);
}

function bossSummary(game, state, name) {
  if (!state || state.status === "active" || !state.endedAtMs) return null;
  return { name, status: state.status, endedAtMs: state.endedAtMs, top: game.leviathanRanking(state).slice(0, 3).map((c) => c.pseudo) };
}

/** Compose et publie le numéro de la semaine (force : publication manuelle). */
function publishGazetteNow(txApp, game, now) {
  const state = readGazette(txApp, game);
  const sinceMs = now - 7 * 86400000;
  const players = txApp.findRecordsByFilter("players", "npc = ''", "", 0, 0).map((r) => ({ uid: r.id, pseudo: r.getString("pseudo"), xp: r.getInt("xp"), seasonXp: r.getInt("seasonXp"), createdAtMs: r.getInt("createdAtMs") }));
  const bosses = [];
  const lev = readLeviathan(txApp, game);
  const levSum = bossSummary(game, lev, game.worldBossName(lev));
  if (levSum) bosses.push(levSum);
  const sb = readSeasonBoss(txApp, game);
  const sbMonth = sb ? game.bossMonthOf(sb) : null;
  const sbSum = bossSummary(game, sb, sbMonth ? sbMonth.boss.name : "Le boss de saison");
  if (sbSum) bosses.push(sbSum);
  txApp.findAllRecords("alliances").forEach((a) => {
    const st = readAllianceBoss(game, a);
    const sum = st ? bossSummary(game, st, `${game.allianceBossDef(st).name} de [${a.getString("tag")}]`) : null;
    if (sum) bosses.push(sum);
  });
  const wl = readWarlordsState(txApp, game);
  const nameOf = (id) => {
    const d = game.warlordsConfig().defs.find((x) => x.id === id);
    return d ? d.name : id;
  };
  const vendettas = (wl.vendettas || []).filter((v) => v.status !== "active" && v.finishedAtMs).map((v) => ({ warlordName: nameOf(v.warlordId), ownerPseudo: v.ownerPseudo, won: v.status === "won", finishedAtMs: v.finishedAtMs }));
  const wars = txApp.findRecordsByFilter("alliance_wars", "endedAtMs >= {:t}", "", 50, 0, { t: sinceMs }).map((w) => {
    const winner = w.getString("winnerId");
    return { attackerTag: w.getString("attackerTag"), defenderTag: w.getString("defenderTag"), winnerTag: winner ? (winner === w.getString("attackerId") ? w.getString("attackerTag") : w.getString("defenderTag")) : null, endedAtMs: w.getInt("endedAtMs") };
  });
  const raids = txApp.findRecordsByFilter("battle_reports", "timestamp >= {:t} && outcome = 'attacker_win'", "-timestamp", 2000, 0, { t: sinceMs }).map((r) => {
    const loot = toPlain(r).loot || {};
    return { attackerPseudo: r.getString("attackerPseudo"), defenderPseudo: r.getString("defenderPseudo"), loot: Object.keys(loot).reduce((a, k) => a + (Number(loot[k]) || 0), 0), timestamp: r.getInt("timestamp") };
  });
  const warlords = txApp.findRecordsByFilter("players", "npc != ''", "", 50, 0).map((r) => {
    const p = toPlain(r);
    return { name: r.getString("pseudo"), power: game.empirePower(p) };
  });
  const issue = game.compileGazette({ now, sinceMs, players, xpSnapshot: state.xpSnapshot, bosses, vendettas, wars, raids, warlords }, (state.issues[0] ? state.issues[0].number : 0) + 1);
  writeGazette(txApp, game, game.publishGazette(state, issue, players));
  players.forEach((p) => {
    try {
      notify(txApp, p.uid, [{ kind: "event", title: `La Gazette n°${issue.number} est parue`, message: issue.headline, createdAtMs: now, read: false, link: "/game/gazette" }]);
    } catch (_) {
      /* facultatif */
    }
  });
  return issue;
}

/** Tâche planifiée : publie le numéro du lundi une fois l'heure passée. */
function gazetteTick(now) {
  const game = loadGame();
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    if (!game.gazetteDue(readGazette(txApp, game), now)) return;
    out = publishGazetteNow(txApp, game, now);
  });
  return out;
}

/** POST /api/cosmic/admin/gazette — publie un numéro tout de suite. */
function adminGazette(e) {
  if (!isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    out = publishGazetteNow(txApp, game, Date.now());
  });
  return e.json(200, out);
}

/* ---------- v5.12 : Casino orbital (machine à sous du pot commun) ---------- */

function readCasino(txApp, game) {
  const rec = configRecord(txApp, game.CASINO_KEY);
  return game.normalizeCasino(rec ? toPlain(rec).data : null);
}

/** POST /api/cosmic/casino { action: "daily" | "spin" } */
function casinoRequest(e) {
  const game = loadGame();
  const uid = e.auth.id;
  const action = String(body(e).action || "");
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    let casino = readCasino(txApp, game);
    const settings = casino.settings;
    // Fermé : seuls les administrateurs peuvent encore tester la machine.
    if (!game.casinoOpen(settings, now) && !isGameAdmin(e)) throw new BadRequestError("Le casino est fermé pour le moment.");
    const loaded = loadPlayer(txApp, game, uid);
    if (loaded.player.npc) throw new ForbiddenError("Réservé aux joueurs.");
    const flushed = game.flushPlayer(loaded.player, loaded.queues, now);
    const player = flushed.player;
    const notes = flushed.notifications.slice();

    if (action === "daily") {
      const added = game.claimDailyTokens(player, settings, now);
      if (added <= 0) throw new BadRequestError("Le jeton du jour est déjà récupéré.");
      savePlayer(txApp, game, loaded, player, flushed.queues);
      if (notes.length) notify(txApp, uid, notes);
      out = { added, tokens: game.playerCasino(player).tokens };
      return;
    }
    if (action !== "spin") throw new BadRequestError("Action inconnue.");

    const c = game.playerCasino(player);
    if (c.tokens < 1) throw new BadRequestError("Plus de jeton : reviens demain pour le jeton du jour.");
    const outcome = game.rollOutcome(settings, Math.random);
    const reels = game.reelsFor(outcome, Math.random);
    let gained = {};
    let token = false;
    let fromPot = false;
    if (outcome === "jackpot") {
      const rec = configRecord(txApp, game.SERVER_POT_KEY);
      const pot = game.normalizeServerPot(rec ? toPlain(rec).data : null);
      const want = game.jackpotAmounts(pot, settings.jackpotShare);
      const after = game.takeFromPot(pot, want, now, `Casino : gros lot 7-7-7 → ${player.pseudo}`);
      if (after !== pot) {
        const last = after.log[after.log.length - 1];
        Object.keys(last.resources).forEach((k) => (gained[k] = -last.resources[k]));
        writeConfig(txApp, game.SERVER_POT_KEY, after);
        fromPot = true;
      } else {
        gained = game.productionHours(player, settings.jackpotFallbackHours);
      }
    } else if (outcome === "cherry") {
      token = true;
    } else if (outcome !== "lose") {
      gained = game.productionHours(player, settings.hours[outcome] || 0);
    }
    Object.keys(gained).forEach((k) => (player.resources[k] = (player.resources[k] || 0) + gained[k]));
    game.applySpin(player, outcome, gained, now);
    // Trois 7 : titre définitif.
    if (outcome === "jackpot") game.giveTitle(player, settings.rewards.jackpotTitle, "casino:jackpot", true);
    savePlayer(txApp, game, loaded, player, flushed.queues);

    const win = { uid, pseudo: player.pseudo, atMs: now, outcome, resources: gained };
    if (token) win.token = true;
    casino = settleTournament(txApp, game, casino, now);
    casino = game.scoreSpin(game.recordWin(casino, win), uid, player.pseudo, outcome);
    writeConfig(txApp, game.CASINO_KEY, casino);

    if (outcome === "jackpot") {
      const text = `${player.pseudo} décroche le gros lot du Casino orbital : ${game.describeGain(gained)}${fromPot ? " pris dans le pot commun" : ""} !`;
      notes.push({ kind: "event", title: "777 ! Gros lot !", message: `Tu remportes ${game.describeGain(gained)} et le titre « ${settings.rewards.jackpotTitle} ».`, createdAtMs: now, read: false, link: "/game/casino", data: { resources: gained, image: JACKPOT_IMAGE } });
      proceduralPlayers(txApp).forEach((p) => {
        if (p.uid !== uid) notify(txApp, p.uid, [{ kind: "event", title: "💰 Gros lot au Casino orbital", message: text, createdAtMs: now, read: false, link: "/game/casino", data: { image: JACKPOT_IMAGE } }]);
      });
    }
    if (notes.length) notify(txApp, uid, notes);
    out = { outcome, reels, resources: gained, token, tokens: game.playerCasino(player).tokens, fromPot };
  });
  return e.json(200, out);
}

const JACKPOT_IMAGE = "/assets/blog/articles/5-12/gros-lot.webp";

/** v5.12 : clôture le tournoi d'une ouverture terminée (jetons du podium, titre du vainqueur) et ouvre le suivant. */
function settleTournament(txApp, game, casino, now) {
  const rolled = game.rollTournament(casino, now);
  let next = rolled.state;
  if (!rolled.closed) return next;
  const s = casino.settings;
  const result = game.tournamentResult(rolled.closed, s, now);
  const label = s.rewards.tournamentTitle;
  // Le titre change de main : retiré au précédent vainqueur.
  const prevHolder = casino.lastTournament ? casino.lastTournament.titleUid : "";
  if (prevHolder && prevHolder !== result.titleUid && findOrNull(txApp, "players", prevHolder)) {
    const old = loadPlayer(txApp, game, prevHolder);
    game.removeTitle(old.player, label);
    savePlayer(txApp, game, old, old.player, old.queues);
  }
  result.podium.forEach((p, i) => {
    if (!findOrNull(txApp, "players", p.uid)) return;
    const loaded = loadPlayer(txApp, game, p.uid);
    const flushed = game.flushPlayer(loaded.player, loaded.queues, now);
    const tokens = game.grantTokens(flushed.player, p.tokens);
    if (p.uid === result.titleUid) game.giveTitle(flushed.player, label, `casino:${result.id}`, true);
    savePlayer(txApp, game, loaded, flushed.player, flushed.queues);
    notify(txApp, p.uid, flushed.notifications.concat([{
      kind: "event",
      title: i === 0 ? `🏆 Tu remportes le tournoi du casino !` : `Tournoi du casino : ${i + 1}e place`,
      message: `${p.points} points${tokens ? `, ${game.tokensLabel(tokens)}` : ""}${p.uid === result.titleUid ? ` et le titre « ${label} » jusqu'au prochain tournoi` : ""}.`,
      createdAtMs: now,
      read: false,
      link: "/game/casino",
      data: tokenNotifData(null, tokens),
    }]));
  });
  return Object.assign({}, next, { lastTournament: result });
}

/** Annonce l'ouverture du casino (programme ou ouverture manuelle), une fois par période, et clôture les tournois. Cron 15 min. */
function casinoTick(now) {
  const game = loadGame();
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const casino = readCasino(txApp, game);
    const settled = settleTournament(txApp, game, casino, now);
    const id = game.casinoOpeningId(casino.settings, now);
    if (!id || id === casino.announcedId) {
      if (settled !== casino) writeConfig(txApp, game.CASINO_KEY, Object.assign({}, settled, { updatedAtMs: now }));
      return;
    }
    proceduralPlayers(txApp).forEach((p) => {
      notify(txApp, p.uid, [{ kind: "event", title: "🎰 Le Casino orbital est ouvert", message: "La machine à sous du pot commun tourne : récupère ton jeton du jour, grimpe au classement du tournoi et tente le 7-7-7 !", createdAtMs: now, read: false, link: "/game/casino", data: { image: "/assets/casino/salle-777.webp" } }]);
    });
    writeConfig(txApp, game.CASINO_KEY, Object.assign({}, settled, { announcedId: id, updatedAtMs: now }));
  });
}

/** POST /api/cosmic/admin/casino { action: "settings", settings } | { action: "grant", target: "all" | "active" | pseudo, tokens } */
function adminCasino(e) {
  if (!e.hasSuperuserAuth() && !isGameAdmin(e)) throw new ForbiddenError("Réservé aux administrateurs du jeu.");
  const game = loadGame();
  const req = body(e);
  let out = null;
  $app.runInTransaction((txApp) => {
    applyContent(txApp, game);
    const now = Date.now();
    const casino = readCasino(txApp, game);
    if (req.action === "settings") {
      const settings = game.normalizeCasinoSettings(req.settings);
      const errors = game.validateCasinoSettings(settings);
      if (errors.length) throw new BadRequestError(errors.join(" "));
      writeConfig(txApp, game.CASINO_KEY, Object.assign({}, casino, { settings, updatedAtMs: now }));
      bossAdminLog(txApp, e, game.CASINO_KEY, "Casino : réglages", { réglages: { avant: JSON.stringify(casino.settings).slice(0, 300), après: JSON.stringify(settings).slice(0, 300) } }, now);
      out = { settings };
      return;
    }
    if (req.action !== "grant") throw new BadRequestError("Action inconnue.");
    const tokens = Math.floor(Number(req.tokens) || 0);
    if (!(tokens >= 1 && tokens <= 100)) throw new BadRequestError("Entre 1 et 100 jetons.");
    const target = String(req.target || "").trim();
    const note = String(req.note || "").trim().slice(0, 140);
    let players = proceduralPlayers(txApp);
    if (target === "active") players = players.filter((p) => now - (Number(p.lastActiveMs) || 0) < 7 * 86400000);
    else if (target !== "all") players = players.filter((p) => String(p.pseudo).toLowerCase() === target.toLowerCase() || p.uid === target);
    if (players.length === 0) throw new BadRequestError("Aucun joueur trouvé.");
    players.forEach((p) => {
      const loaded = loadPlayer(txApp, game, p.uid);
      game.grantTokens(loaded.player, tokens);
      savePlayer(txApp, game, loaded, loaded.player, loaded.queues);
      notify(txApp, p.uid, [{ kind: "gift", title: `🎰 ${tokens} jeton${tokens > 1 ? "s" : ""} de casino`, message: note || "Offerts par l'équipe : tente ta chance au Casino orbital !", createdAtMs: now, read: false, link: "/game/casino" }]);
    });
    bossAdminLog(txApp, e, game.CASINO_KEY, "Casino : jetons offerts", { jetons: { avant: "", après: `${tokens} × ${players.length} joueur(s) (${target})` } }, now);
    out = { players: players.length, tokens };
  });
  return e.json(200, out);
}

module.exports = { passSeasonsRun, purgeNpcMarketOffers, casinoRequest, adminCasino, casinoTick, allianceChallengeTick, adminBroadcast, contestsTick, adminContests, guardRulesConfig, adminBossRewards, challengeClaim, addServerPot, adminServerPot, accountPseudo, passkeyRegisterOptions, passkeyRegisterVerify, passkeyLoginOptions, passkeyLoginVerify, passkeyRename, blogRequest, blogHostIntercept, ensureBlogAuthors, allianceSagaLive, allianceSagaTick, liveBalance, balanceHistoryTick, adminPlayerAction, proceduralTick, adminProcedural, runContentMigrations, guardProfileUpdate, renameRequest, seasonWarRequest, territoriesTick, tradeContractRequest, tradeContractsTick, adminStuckFleets, adminBackupList, adminBackupDownload, adminBackupToR2, allianceDailyTick, allianceDailyVote, codexClaim, referralSponsorName, referralInfo, gazetteTick, adminGazette, allianceTyping, allianceBossRequest, allianceBossTick, readAllianceBoss, seasonBossTick, adminSeasonBoss, readSeasonBoss, warlordTick, warlordsList, warlordsRequest, adminWarlords, vacationRequest, warlordAfterCombat, warlordAbsence, readWarlordsState, writeWarlordsState, warlordSay, isNpcUid, humanPlain, createPirateRaid, victoryCardPage, referralRequest, referralTick, fleetFromRecord, guardPlayerUpdate, adminMail, unsubscribe, bountyRequest, eliteTick, adminElite, readElite, releaseBountyOnRecall, allianceMessageCreate, requireAdminReason, challengeTick, readChallengeState, diplomacyRequest, bindingPact, reportShare, messageSend, messageRead, scanAnomalies, adminScanAnomalies, warRequest, warTick, expeditionChoose, leviathanTick, adminLeviathan, marketCreate, marketAccept, marketCancel, expireMarketOffers, adminBackupStatus, checkBackups, reportCreateRequest, reportClientError, reportComment, reportSeen, adminReportUpdate, adminReportConfig, adminReportGithub, autoEndMaintenance, adminList, adminManage, readMaintenance, closedDuringMaintenance, maintenanceGuard, adminMaintenance, processPirates, piratesRequest, adminReset, allianceRequest, allianceIntel, processAllianceResearch, closeSeason, purgeDebris, syncProfile, deleteProfile, launchFleetRequest, lastAttackOnTarget, processDueFleets, isGameAdmin, logAdminAction, body, toPlain, loadGame, applyContent, findOrNull, loadPlayer, savePlayer, notify, asHttpError };
