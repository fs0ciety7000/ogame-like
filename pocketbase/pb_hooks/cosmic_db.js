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

module.exports = { isGameAdmin, logAdminAction, body, toPlain, loadGame, applyContent, findOrNull, loadPlayer, savePlayer, notify, asHttpError };
