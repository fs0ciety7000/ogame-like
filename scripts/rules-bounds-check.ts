// 6.14.95 (Q259) : les règles enregistrées sur la pré-prod passent-elles les bornes de l'admin (AA2) ?
//
//   npx vite-node scripts/rules-bounds-check.ts
//
// Lecture seule : lit `game_config` (clé « rules ») et passe le contenu par `validateRules`, comme l'onglet Règles et le garde serveur.
// Une erreur listée ici bloquera l'enregistrement de l'onglet Règles tant qu'elle n'est pas corrigée. Variables : PREPROD_PB_URL,
// PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD. Refuse tout serveur qui n'est pas de test.
import PocketBase from "pocketbase";
import { validateRules } from "@/game/content";

const { PREPROD_PB_URL: URL_, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD } = process.env;
if (!URL_ || !PREPROD_PB_ADMIN_EMAIL || !PREPROD_PB_ADMIN_PASSWORD) {
  console.error("Renseigne PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL et PREPROD_PB_ADMIN_PASSWORD.");
  process.exit(1);
}
const host = new URL(URL_).hostname;
if (!/(^|[.-])(test|preprod)([.-]|$)/.test(host) && host !== "127.0.0.1" && host !== "localhost") {
  console.error(`Refusé : ${URL_} n'est pas un serveur de test.`);
  process.exit(1);
}
const pb = new PocketBase(URL_);
await pb.collection("_superusers").authWithPassword(PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD);
const rec = await pb.collection("game_config").getFirstListItem('key="rules"').catch(() => null);
const rules = (rec?.data ?? {}) as Record<string, unknown>;
const errors = validateRules(rules);
console.log(`${Object.keys(rules).length} groupe(s) enregistré(s) ; ${errors.length} valeur(s) hors bornes.`);
for (const e of errors) console.log(`- ${e}`);
