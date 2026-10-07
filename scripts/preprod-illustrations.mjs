// 6.14.23 : rendus Midjourney déposés sur la pré-prod (test.fs0ciety.org/img, collection `illustration_uploads`).
//
//   node scripts/preprod-illustrations.mjs pull <dossier>            # télécharge les envois non intégrés et reconnaît chaque image
//   node scripts/preprod-illustrations.mjs assign <envoi> <image>    # attribue un envoi à une image (après examen à l'œil)
//   node scripts/preprod-illustrations.mjs reject <envoi> [raison]   # écarte un envoi (doublon, mauvaise image)
//   node scripts/preprod-illustrations.mjs integrated <image> [...]  # marque les envois de ces images « intégrée »
//
// Variables : PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD (docs/preprod.md §6). Refuse tout serveur
// qui n'est pas de test. Reconnaissance : Midjourney nomme ses fichiers « <pseudo>_<début du prompt>_<identifiant>.png » ;
// le début du nom est comparé au début de chaque prompt de scripts/illustrations.json. Une image reconnue est écrite
// sous <dossier>/<image>.<ext> (prête pour scripts/illustrations.py) ; les autres sous <dossier>/a-identifier/<envoi>.<ext>.
import PocketBase from "pocketbase";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { recognizeImage } from "./illustrations-match.mjs";

const { PREPROD_PB_URL: URL_, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD } = process.env;
const [cmd, ...args] = process.argv.slice(2);
if (!URL_ || !PREPROD_PB_ADMIN_EMAIL || !PREPROD_PB_ADMIN_PASSWORD || !cmd) {
  console.error("Usage : voir l'en-tête du script ; renseigne PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL et PREPROD_PB_ADMIN_PASSWORD.");
  process.exit(1);
}
const host = new URL(URL_).hostname;
if (!/(^|[.-])(test|preprod)([.-]|$)/.test(host) && host !== "127.0.0.1" && host !== "localhost") {
  console.error(`Refusé : ${URL_} n'est pas un serveur de test.`);
  process.exit(1);
}

const SLOTS = JSON.parse(readFileSync(new URL("./illustrations.json", import.meta.url), "utf8")).slots;
const COLLECTION = "illustration_uploads";
const pb = new PocketBase(URL_);
pb.autoCancellation(false);
await pb.collection("_superusers").authWithPassword(PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD);

const known = (id) => SLOTS.some((s) => s.id === id);

if (cmd === "pull") {
  const dir = args[0];
  if (!dir) throw new Error("Indique le dossier de destination.");
  mkdirSync(join(dir, "a-identifier"), { recursive: true });
  const records = await pb.collection(COLLECTION).getFullList({ filter: 'status = "envoyée" || status = "attribuée"', sort: "uploadedAtMs", batch: 500 });
  const report = [];
  for (const r of records) {
    const ext = (r.file.match(/\.[a-z0-9]+$/i)?.[0] ?? ".png").toLowerCase();
    const bytes = Buffer.from(await (await fetch(pb.files.getURL(r, r.file))).arrayBuffer());
    let slot = known(r.slotId) ? r.slotId : null;
    let how = slot ? "déjà attribuée" : "";
    if (!slot) {
      const hit = recognizeImage(r.fileName || r.file, SLOTS);
      if (hit) {
        slot = hit.id;
        how = `nom de fichier (${hit.score} mots)`;
        await pb.collection(COLLECTION).update(r.id, { slotId: slot, status: "attribuée" });
      }
    }
    const out = slot ? join(dir, `${slot}${ext}`) : join(dir, "a-identifier", `${r.id}${ext}`);
    writeFileSync(out, bytes);
    report.push({ envoi: r.id, fichier: r.fileName, image: slot ?? "?", reconnaissance: how || "à identifier à l'œil", vers: out });
  }
  console.table(report);
  const unknown = report.filter((x) => x.image === "?").length;
  console.log(`${report.length} envoi(s) : ${report.length - unknown} reconnu(s), ${unknown} à identifier (${join(dir, "a-identifier")}).`);
} else if (cmd === "assign") {
  const [id, slot] = args;
  if (!known(slot)) throw new Error(`Image inconnue : ${slot} (voir scripts/illustrations.json).`);
  await pb.collection(COLLECTION).update(id, { slotId: slot, status: "attribuée" });
  console.log(`${id} → ${slot}`);
} else if (cmd === "reject") {
  const [id, ...note] = args;
  await pb.collection(COLLECTION).update(id, { status: "refusée", note: note.join(" ").slice(0, 300) });
  console.log(`${id} écarté.`);
} else if (cmd === "integrated") {
  let n = 0;
  for (const slot of args) {
    for (const r of await pb.collection(COLLECTION).getFullList({ filter: pb.filter("slotId = {:s} && status = 'attribuée'", { s: slot }) })) {
      await pb.collection(COLLECTION).update(r.id, { status: "intégrée" });
      n++;
    }
  }
  console.log(`${n} envoi(s) marqué(s) « intégrée ».`);
} else {
  console.error(`Commande inconnue : ${cmd}`);
  process.exit(1);
}
