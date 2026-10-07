// 6.14.39 : veille de la pré-prod pour /img et /decisions (consigne du 2026-10-07 : vérifier toutes les 2 min et traiter en parallèle).
//
//   node scripts/preprod-watch.mjs [--every 120] [--state <fichier>] [--auto-valide]
//
// Tourne en arrière-plan dans la session de travail. À chaque tour, lit :
// - les envois de /img à traiter (collection `illustration_uploads`, statut « envoyée » ou « attribuée ») ;
// - les réponses de /decisions (collection `decision_answers`, champ `answeredAtMs`).
// Se termine (code 0) dès qu'un envoi ou une réponse est **nouveau** par rapport au fichier d'état, en affichant ce qu'il a vu :
// la session lance alors une tâche parallèle (détourage, report de la réponse) puis relance la veille. Le fichier d'état garde les
// identifiants déjà signalés (aucune donnée personnelle). Variables : PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD.
// Refuse tout serveur qui n'est pas de test.
import PocketBase from "pocketbase";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const { PREPROD_PB_URL: URL_, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD } = process.env;
const argv = process.argv.slice(2);
const opt = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 ? argv[i + 1] : def;
};
const EVERY = Math.max(30, Number(opt("--every", 120)) || 120) * 1000;
const STATE = opt("--state", ".pb/preprod-watch.json");
/** 6.14.45 : `--auto-valide` reporte seul les « valide » sans note sur une question ouverte (scripts/decisions-apply-valid.py) et
 *  envoie les documents en direct ; la veille ne rend la main que pour le reste (images, notes, « changer », feuille de route, ajouts). */
const AUTO = argv.includes("--auto-valide");
const openQuestions = () => {
  const set = new Set();
  for (const line of readFileSync("docs/QUESTIONS.md", "utf8").split("\n")) {
    const m = /^\| (Q\d+) \|/.exec(line);
    if (m && /\| ouverte[^|]*\|\s*$/.test(line)) set.add(m[1]);
  }
  return set;
};
if (!URL_ || !PREPROD_PB_ADMIN_EMAIL || !PREPROD_PB_ADMIN_PASSWORD) {
  console.error("Renseigne PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL et PREPROD_PB_ADMIN_PASSWORD.");
  process.exit(1);
}
const host = new URL(URL_).hostname;
if (!/(^|[.-])(test|preprod)([.-]|$)/.test(host) && host !== "127.0.0.1" && host !== "localhost") {
  console.error(`Refusé : ${URL_} n'est pas un serveur de test.`);
  process.exit(1);
}

const state = existsSync(STATE) ? JSON.parse(readFileSync(STATE, "utf8")) : { uploads: [], answersAtMs: 0 };
const pb = new PocketBase(URL_);
pb.autoCancellation(false);
const login = () => pb.collection("_superusers").authWithPassword(PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD);
await login();

for (;;) {
  try {
    if (!pb.authStore.isValid) await login();
    const uploads = await pb.collection("illustration_uploads").getFullList({ filter: 'status = "envoyée" || status = "attribuée"', fields: "id,fileName,slotId", batch: 500 });
    const fresh = uploads.filter((u) => !state.uploads.includes(u.id));
    const answers = await pb.collection("decision_answers").getFullList({ filter: `answeredAtMs > ${Number(state.answersAtMs) || 0}`, sort: "answeredAtMs", fields: "qid,choice,note,answeredAtMs", batch: 500 });
    let rest = answers;
    if (AUTO && answers.length) {
      const open = openQuestions();
      const plain = answers.filter((a) => a.choice === "valide" && !String(a.note ?? "").trim() && open.has(a.qid));
      if (plain.length) {
        const ids = [...new Set(plain.map((a) => a.qid))];
        console.log(execFileSync("python3", ["scripts/decisions-apply-valid.py", ...ids]).toString().trim());
        console.log(execFileSync("node", ["scripts/live-docs.mjs", "push", "docs/QUESTIONS.md", "docs/decisions-a-valider.md"]).toString().trim().split("\n").pop());
      }
      rest = answers.filter((a) => !plain.includes(a) && !(a.choice === "valide" && !String(a.note ?? "").trim() && !open.has(a.qid) && /^Q\d+$/.test(a.qid)));
      state.answersAtMs = Math.max(Number(state.answersAtMs) || 0, ...answers.map((a) => Number(a.answeredAtMs) || 0));
      writeFileSync(STATE, JSON.stringify(state));
      answers.length = 0;
      answers.push(...rest);
    }
    if (fresh.length || answers.length) {
      state.uploads = [...new Set([...state.uploads, ...fresh.map((u) => u.id)])].slice(-500);
      if (answers.length) state.answersAtMs = Math.max(...answers.map((a) => Number(a.answeredAtMs) || 0));
      writeFileSync(STATE, JSON.stringify(state));
      if (fresh.length) console.log(`/img : ${fresh.length} nouvel(s) envoi(s) (${uploads.length} à traiter en tout)`);
      for (const a of answers) console.log(`/decisions : ${a.qid} → ${a.choice || "(note seule)"}${a.note ? ` : ${String(a.note).slice(0, 300)}` : ""}`);
      process.exit(0);
    }
  } catch (e) {
    console.error(`tour manqué : ${e.status ?? e.message}`);
  }
  await new Promise((r) => setTimeout(r, EVERY));
}
