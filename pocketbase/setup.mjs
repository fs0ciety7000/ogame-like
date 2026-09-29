// Installe (ou met à jour) le schéma du jeu sur un serveur PocketBase.
//
//   PB_URL=https://… PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… node pocketbase/setup.mjs
//
// - crée/met à jour les collections décrites dans pocketbase/pb_schema.json
//   (champs + règles d'accès) ;
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
