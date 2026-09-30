/// <reference path="../pb_data/types.d.ts" />

// Cosmic Empires — mise à jour automatique des hooks au démarrage.
//
// Seul fichier à installer à la main dans pb_hooks/ : au démarrage de
// PocketBase, il récupère les autres (cosmic.pb.js, cosmic_game.js,
// cosmic_db.js, cosmic_sync.js) depuis la branche main du dépôt GitHub.
// Désactivable avec la variable d'environnement COSMIC_HOOKS_AUTOUPDATE=0.

onBootstrap((e) => {
  e.next();

  const syncPath = `${__hooks}/cosmic_sync.js`;
  try {
    // Première installation : le module de mise à jour lui-même.
    try {
      $os.stat(syncPath);
    } catch (_) {
      if ($os.getenv("COSMIC_HOOKS_AUTOUPDATE") === "0") return;
      const branch = $os.getenv("COSMIC_HOOKS_BRANCH") || "main";
      const res = $http.send({
        url: `https://raw.githubusercontent.com/fs0ciety7000/ogame-like/${branch}/pocketbase/pb_hooks/cosmic_sync.js`,
        timeout: 20,
      });
      if (res.statusCode !== 200) throw new Error(`cosmic_sync.js : HTTP ${res.statusCode}`);
      $os.writeFile(syncPath, typeof res.raw === "string" && res.raw ? res.raw : toString(res.body), 0o644);
    }

    const sync = require(syncPath);
    const disabled = sync.autoUpdateDisabled();
    if (disabled) {
      console.log(`[cosmic] mise à jour des hooks ${disabled}`);
      return;
    }
    const report = sync.syncHooks();
    if (report.errors.length > 0) console.log(`[cosmic] mise à jour des hooks annulée : ${report.errors.join(" ; ")}`);
    else if (report.updated.length > 0) console.log(`[cosmic] hooks mis à jour depuis ${report.branch} : ${report.updated.join(", ")}`);
    else console.log(`[cosmic] hooks à jour (${report.branch})`);
  } catch (err) {
    // Jamais bloquant : le serveur démarre avec les hooks déjà présents.
    console.log(`[cosmic] mise à jour des hooks impossible : ${err}`);
  }
});

/**
 * POST /api/cosmic/admin/update-hooks — administrateurs du jeu uniquement.
 * Même mise à jour qu'au démarrage, à la demande (bouton de l'administration).
 */
routerAdd("POST", "/api/cosmic/admin/update-hooks", (e) => {
  const isAdmin =
    e.hasSuperuserAuth() ||
    (e.auth && $app.findRecordsByFilter("admins", "id = {:id}", "", 1, 0, { id: e.auth.id }).length > 0);
  if (!isAdmin) throw new ForbiddenError("Réservé aux administrateurs du jeu.");

  const sync = require(`${__hooks}/cosmic_sync.js`);
  const disabled = sync.autoUpdateDisabled();
  if (disabled) throw new BadRequestError(`Mise à jour ${disabled}.`);
  return e.json(200, sync.syncHooks());
});
