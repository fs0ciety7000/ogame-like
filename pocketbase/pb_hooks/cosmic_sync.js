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

/** { updated: [...], unchanged: [...], errors: [...] } */
function syncHooks() {
  const branch = $os.getenv("COSMIC_HOOKS_BRANCH") || "main";
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

module.exports = { syncHooks, autoUpdateDisabled };
