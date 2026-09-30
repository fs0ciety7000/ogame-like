// Remet à zéro l'XP (totale et de saison) de tous les joueurs.
// Ressources, bâtiments, unités, recherches et statistiques de combat sont conservés.
//
//   PB_URL=https://… PB_ADMIN_EMAIL=… PB_ADMIN_PASSWORD=… node scripts/reset-xp.mjs [--dry-run]
import PocketBase from "pocketbase";

const { PB_URL, PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD } = process.env;
if (!PB_URL || !PB_ADMIN_EMAIL || !PB_ADMIN_PASSWORD) {
  console.error("Renseigne PB_URL, PB_ADMIN_EMAIL et PB_ADMIN_PASSWORD.");
  process.exit(1);
}
const dryRun = process.argv.includes("--dry-run");
const pb = new PocketBase(PB_URL);
pb.autoCancellation(false);
await pb.collection("_superusers").authWithPassword(PB_ADMIN_EMAIL, PB_ADMIN_PASSWORD);

const players = await pb.collection("players").getFullList({ fields: "id,pseudo,xp,seasonXp" });
for (const p of players) {
  console.log(`${p.pseudo}: ${p.xp} XP -> 0`);
  if (!dryRun) await pb.collection("players").update(p.id, { xp: 0, seasonXp: 0 });
}
console.log(dryRun ? `Simulation : ${players.length} joueurs.` : `XP remise à zéro pour ${players.length} joueurs.`);
