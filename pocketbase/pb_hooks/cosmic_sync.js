// Cosmic Empires — mise à jour des hooks depuis GitHub.
//
// Télécharge les fichiers du jeu depuis la branche main du dépôt et ne
// réécrit que ceux qui ont changé (et qui sont valides). PocketBase
// surveille pb_hooks/ et redémarre tout seul quand un fichier change.
//
// Appelé au démarrage par cosmic_updater.pb.js et depuis l'administration
// (POST /api/cosmic/admin/update-hooks).

const REPO_RAW = "https://raw.githubusercontent.com/fs0ciety7000/ogame-like";

// Ordre voulu : cosmic.pb.js en dernier, pour que ses dépendances soient
// déjà à jour quand PocketBase le recharge.
const FILES = [
  { name: "cosmic_game.js", marker: "performAttack" },
  { name: "cosmic_db.js", marker: "module.exports" },
  { name: "cosmic_sync.js", marker: "module.exports" },
  { name: "cosmic.pb.js", marker: "routerAdd(" },
];

function readText(path) {
  try {
    return toString($os.readFile(path));
  } catch (_) {
    return null;
  }
}

function exists(path) {
  try {
    $os.stat(path);
    return true;
  } catch (_) {
    return false;
  }
}

/** Mise à jour automatique désactivée : variable d'environnement, ou
 *  pb_hooks/ d'une copie de développement du dépôt (on n'écrase pas le
 *  code en cours d'écriture avec celui de main). */
function autoUpdateDisabled() {
  if ($os.getenv("COSMIC_HOOKS_AUTOUPDATE") === "0") return "désactivée (COSMIC_HOOKS_AUTOUPDATE=0)";
  if (exists(`${__hooks}/../../.git`)) return "désactivée (copie de développement du dépôt)";
  return null;
}

function download(url) {
  const res = $http.send({ url, method: "GET", timeout: 20 });
  if (res.statusCode !== 200) throw new Error(`HTTP ${res.statusCode}`);
  return typeof res.raw === "string" && res.raw ? res.raw : toString(res.body);
}

/** { updated: [...], unchanged: [...], errors: [...] }. `ref` : branche ou commit (défaut : main). */
function syncHooks(ref) {
  const branch = ref || $os.getenv("COSMIC_HOOKS_BRANCH") || "main";
  const report = { branch, updated: [], unchanged: [], errors: [] };

  const downloaded = [];
  for (const file of FILES) {
    try {
      const text = download(`${REPO_RAW}/${branch}/pocketbase/pb_hooks/${file.name}`);
      if (!text || text.indexOf(file.marker) < 0) throw new Error("contenu inattendu");
      // Vérifie que le fichier se compile (sans l'exécuter).
      new Function(text);
      downloaded.push({ name: file.name, text });
    } catch (err) {
      report.errors.push(`${file.name} : ${err}`);
    }
  }
  // Tout ou rien : un jeu de fichiers incomplet mélangerait deux versions.
  if (report.errors.length > 0) return report;

  for (const file of downloaded) {
    const path = `${__hooks}/${file.name}`;
    if (readText(path) === file.text) {
      report.unchanged.push(file.name);
      continue;
    }
    $os.writeFile(path, file.text, 0o644);
    report.updated.push(file.name);
  }
  return report;
}

/* ---------- v4.8 : déploiement complet en un appel ---------- */

function stamp(now) {
  const d = new Date(now);
  const p = (n) => (n < 10 ? `0${n}` : String(n));
  return `${d.getUTCFullYear()}${p(d.getUTCMonth() + 1)}${p(d.getUTCDate())}${p(d.getUTCHours())}${p(d.getUTCMinutes())}`;
}

/**
 * Sauvegarde, schéma (pb_schema.json), fiches publiques, puis hooks — dans
 * cet ordre, et on s'arrête à la première étape qui échoue (sauf fiches).
 * `ref` : branche ou commit du dépôt (un commit évite le cache de GitHub).
 */
function deployUpdate(e, ref) {
  const branch = ref || $os.getenv("COSMIC_HOOKS_BRANCH") || "main";
  const report = { ref: branch, backup: null, schema: null, profiles: null, hooks: null, errors: [] };

  // 1. Sauvegarde complète (base + fichiers), restaurable depuis l'admin PocketBase.
  const name = `avant_maj_${stamp(Date.now())}.zip`;
  try {
    $app.createBackup(e.request.context(), name);
    report.backup = name;
  } catch (err) {
    report.errors.push(`sauvegarde : ${err}`);
    return report;
  }

  // 2. Schéma : collections et champs ajoutés ou modifiés, rien n'est supprimé.
  try {
    const raw = download(`${REPO_RAW}/${branch}/pocketbase/pb_schema.json`);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) throw new Error("schéma vide");
    $app.importCollectionsByMarshaledJSON(raw, false);
    report.schema = parsed.length;
  } catch (err) {
    report.errors.push(`schéma : ${err}`);
    return report;
  }

  // 3. Fiches publiques (nouveaux champs recopiés), non bloquant.
  try {
    const db = require(`${__hooks}/cosmic_db.js`);
    let n = 0;
    $app.findAllRecords("players").forEach((rec) => {
      try {
        db.syncProfile($app, rec);
        n++;
      } catch (_) {
        /* fiche suivante */
      }
    });
    report.profiles = n;
  } catch (err) {
    report.errors.push(`fiches publiques : ${err}`);
  }

  // 4. Hooks en dernier : PocketBase redémarre dès qu'un fichier change.
  const disabled = autoUpdateDisabled();
  if (disabled) {
    report.hooks = { branch, updated: [], unchanged: [], errors: [`mise à jour ${disabled}`] };
    return report;
  }
  report.hooks = syncHooks(branch);
  report.hooks.errors.forEach((x) => report.errors.push(`hooks : ${x}`));
  return report;
}

module.exports = { syncHooks, autoUpdateDisabled, deployUpdate };
