// Installe (ou met à jour) le schéma du jeu sur un serveur PocketBase.
//
//   PB_URL=https://… PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… \
//     [GAME_ADMIN_EMAILS=moi@exemple.fr,autre@exemple.fr] node pocketbase/setup.mjs
//
// GAME_ADMIN_EMAILS (facultatif) : comptes joueurs à promouvoir
// administrateurs du jeu (accès à la page Administration).
// - crée/met à jour les collections décrites dans pocketbase/pb_schema.json
//   (champs + règles d'accès) ;
// - active une sauvegarde automatique quotidienne (3 h, 14 conservées) ;
// - ajoute un champ `username` (le pseudo) à la collection `users` et
//   autorise la connexion par pseudo OU par email.
//
// Une collection existante du même nom mais créée à la main (autre id) est
// supprimée puis recréée SEULEMENT si elle est vide ; sinon le script
// s'arrête sans rien toucher à cette collection.
import { readFileSync } from "node:fs";
import PocketBase from "pocketbase";

const { PB_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD } = process.env;
if (!PB_URL || !PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error("Renseigne PB_URL, PB_ADMIN_EMAIL et PB_ADMIN_PASSWORD.");
  process.exit(1);
}

const schema = JSON.parse(readFileSync(new URL("./pb_schema.json", import.meta.url), "utf8"));
const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);
await pb.collection("_superusers").authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);

// 1. Collections du jeu
const existing = await pb.collections.getFullList();
for (const wanted of schema) {
  const clash = existing.find((c) => c.name === wanted.name && c.id !== wanted.id);
  if (!clash) continue;
  const { totalItems } = await pb.collection(clash.name).getList(1, 1);
  if (totalItems > 0) {
    console.error(
      `La collection "${clash.name}" existe déjà (créée à la main) et contient ${totalItems} enregistrement(s). ` +
        "Vide-la ou renomme-la dans l'admin PocketBase, puis relance le script.",
    );
    process.exit(1);
  }
  await pb.collections.delete(clash.id);
  console.log(`Collection vide "${clash.name}" remplacée.`);
}
await pb.collections.import(schema, false);
console.log(`Collections du jeu à jour : ${schema.map((c) => c.name).join(", ")}.`);

// Fiches publiques : créées pour les joueurs existants (les hooks les
// tiennent ensuite à jour à chaque modification d'un joueur).
const PROFILE_FIELDS = ["pseudo", "xp", "seasonId", "seasonXp", "createdAtMs", "lastDefeatAtMs", "lastAttackAtMs", "allianceId"];
const allPlayers = await pb.collection("players").getFullList({ fields: ["id", ...PROFILE_FIELDS, "titles", "unlockedAchievements", "victories", "defeats", "stats"].join(",") });
const existingProfiles = new Set((await pb.collection("profiles").getFullList({ fields: "id" })).map((r) => r.id));
// Même calcul que profileFeats() dans les hooks (faits d'armes publics).
const featsOf = (player) => {
  const stats = player.stats ?? {};
  const labels = [...new Set((player.titles ?? []).map((t) => t?.label).filter(Boolean).map(String))];
  return {
    titles: labels.slice(-12),
    achievements: (player.unlockedAchievements ?? []).length,
    victories: Math.trunc(player.victories ?? 0),
    defeats: Math.trunc(player.defeats ?? 0),
    missions: Number(stats.missions) || 0,
    expeditions: Number(stats.expeditions) || 0,
    leviathanKills: Number(stats.leviathanKills) || 0,
    warsWon: Number(stats.warsWon) || 0,
  };
};
for (const player of allPlayers) {
  const data = { ...Object.fromEntries(PROFILE_FIELDS.map((f) => [f, player[f] ?? null])), feats: featsOf(player) };
  if (existingProfiles.has(player.id)) await pb.collection("profiles").update(player.id, data);
  else await pb.collection("profiles").create({ id: player.id, ...data });
}
console.log(`Fiches publiques : ${allPlayers.length} joueur(s) synchronisé(s).`);

// Sauvegardes automatiques : tous les jours à 3 h (UTC), 14 conservées.
const settings = await pb.settings.getAll();
await pb.settings.update({ backups: { ...settings.backups, cron: "0 3 * * *", cronMaxKeep: 14 } });
console.log("Sauvegardes automatiques : tous les jours à 3 h, 14 conservées.");

// 2. Connexion par pseudo : champ `username` unique sur `users`
const users = await pb.collections.getOne("users");
const fields = users.fields ?? [];
if (!fields.some((f) => f.name === "username")) {
  fields.push({
    name: "username",
    type: "text",
    required: false,
    min: 0,
    max: 40,
    pattern: "^[a-z0-9_-]*$",
    presentable: true,
  });
}
const indexes = (users.indexes ?? []).filter((i) => !i.includes("idx_users_username"));
indexes.push("CREATE UNIQUE INDEX idx_users_username ON users (username) WHERE username != ''");
await pb.collections.update(users.id, {
  fields,
  indexes,
  passwordAuth: { ...(users.passwordAuth ?? {}), enabled: true, identityFields: ["email", "username"] },
});
console.log("Collection users : connexion par pseudo ou email activée.");

// 3. Administrateurs du jeu
const adminEmails = (process.env.GAME_ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);
for (const email of adminEmails) {
  let user;
  try {
    user = await pb.collection("users").getFirstListItem(pb.filter("email = {:email}", { email }));
  } catch {
    console.error(`Aucun compte avec l'email ${email} : inscris-toi d'abord dans le jeu.`);
    continue;
  }
  try {
    await pb.collection("admins").getOne(user.id);
  } catch {
    await pb.collection("admins").create({ id: user.id, note: email });
  }
  console.log(`Administrateur du jeu : ${email}`);
}


