// 6.14.8 : prépare un serveur de test (pré-prod) restauré depuis une sauvegarde de la production.
//
//   PB_URL=https://test.fs0ciety.org PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… \
//     PREPROD_GAME_URL=https://test.fs0ciety.org [PREPROD_KEEP_EMAILS=moi@exemple.fr] \
//     PREPROD_CONFIRM=oui node scripts/preprod-scrub.mjs
//
// À lancer UNE FOIS juste après la restauration de la sauvegarde, AVANT d'ouvrir le serveur de test.
// Ce que fait le script (docs/preprod.md) :
// 1. réglages PocketBase : nom « (test) », adresse du jeu de test, e-mails coupés (SMTP), sauvegardes
//    automatiques et copie S3 des sauvegardes coupées (la prod garde les siennes) ;
// 2. connexion Google / Apple coupée (les redirections pointent vers la prod) ;
// 3. comptes : e-mails remplacés par <id>@test.invalid (connexion par pseudo et mot de passe inchangée),
//    sauf PREPROD_KEEP_EMAILS ; jetons de désinscription vidés ; passkeys supprimées (liées au domaine de la prod) ;
// 4. messages privés supprimés (rien de privé n'est utile aux essais).
// Garde : refuse de tourner sur une adresse qui n'est pas un serveur de test ou local.
import PocketBase from "pocketbase";

const { PB_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD, PREPROD_GAME_URL, PREPROD_CONFIRM } = process.env;
if (!PB_URL || !PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD || !PREPROD_GAME_URL) {
  console.error("Renseigne PB_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD et PREPROD_GAME_URL.");
  process.exit(1);
}

/** Vrai pour un serveur de test ou local, jamais pour la production. */
export function isPreprodHost(url) {
  let host;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }
  if (host === "localhost" || host === "127.0.0.1") return true;
  return /(^|[.-])test([.-]|$)/.test(host) || /(^|[.-])preprod([.-]|$)/.test(host);
}

if (!isPreprodHost(PB_URL) || !isPreprodHost(PREPROD_GAME_URL)) {
  console.error(`Refusé : ${PB_URL} (ou ${PREPROD_GAME_URL}) n'est pas un serveur de test. Ce script ne touche jamais la production.`);
  process.exit(1);
}
if (PREPROD_CONFIRM !== "oui") {
  console.error("Ajoute PREPROD_CONFIRM=oui : le script modifie les comptes de ce serveur.");
  process.exit(1);
}

const keep = new Set(
  (process.env.PREPROD_KEEP_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean),
);

const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);
await pb.collection("_superusers").authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);

// 1. Réglages.
const settings = await pb.settings.getAll();
await pb.settings.update({
  meta: { ...settings.meta, appName: "Cosmic Empires (test)", appURL: PREPROD_GAME_URL },
  smtp: { ...settings.smtp, enabled: false },
  backups: { ...settings.backups, cron: "", s3: { ...(settings.backups?.s3 ?? {}), enabled: false } },
});
console.log("Réglages : nom (test), adresse du jeu, e-mails et sauvegardes automatiques coupés.");
if (settings.s3?.enabled) {
  console.warn(
    "ATTENTION : les fichiers (avatars, illustrations) sont rangés sur S3. Si c'est le même bucket que la prod, " +
      "donne au serveur de test un autre bucket (Réglages → Files storage) avant de l'ouvrir.",
  );
}

// 2. Connexion Google / Apple.
const users = await pb.collections.getOne("users");
if (users.oauth2?.enabled) {
  await pb.collections.update("users", { oauth2: { ...users.oauth2, enabled: false } });
  console.log("Connexion Google / Apple coupée.");
}

// 3. Comptes.
let renamed = 0;
for (const u of await pb.collection("users").getFullList({ fields: "id,email" })) {
  if (keep.has(String(u.email ?? "").toLowerCase())) continue;
  const email = `${u.id}@test.invalid`;
  if (u.email === email) continue;
  await pb.collection("users").update(u.id, { email, emailVisibility: false });
  renamed++;
}
console.log(`Comptes : ${renamed} e-mail(s) remplacé(s), ${keep.size} gardé(s).`);

let tokens = 0;
for (const p of await pb.collection("players").getFullList({ fields: "id,mailToken", filter: 'mailToken != ""' })) {
  await pb.collection("players").update(p.id, { mailToken: "" });
  tokens++;
}
console.log(`Jetons de désinscription vidés : ${tokens}.`);

const purge = async (collection) => {
  let n = 0;
  for (const r of await pb.collection(collection).getFullList({ fields: "id" })) {
    await pb.collection(collection).delete(r.id);
    n++;
  }
  console.log(`${collection} : ${n} supprimé(s).`);
};
await purge("passkeys");
// 4. Messages privés.
await purge("private_messages");

console.log("Serveur de test prêt. Étapes suivantes : docs/preprod.md §6.");
