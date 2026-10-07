// 6.14.32 : réponses de l'administrateur aux décisions prises seules (page /decisions, collection `decision_answers`).
//
//   node scripts/decisions.mjs            # réponses à traiter (question encore « ouverte » dans docs/QUESTIONS.md)
//   node scripts/decisions.mjs --all      # toutes les réponses
//
// Serveurs lus :
// - pré-prod : PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD (superutilisateur de test) ;
// - production, si fournis : PROD_PB_URL et PROD_PB_TOKEN (jeton d'un compte admin du jeu). Lecture seule (GET), jamais d'écriture
//   (CLAUDE.md : données de production en lecture seule).
// Traiter une réponse (CLAUDE.md, règle n° 3) : « valide » → statut « validée » dans QUESTIONS.md ; « changer » → lot de changement
// (fiche, statut « changée (lot X) »), et la règle concernée réécrite dans CLAUDE.md, le GDD ou WORKFLOW.md. La question quitte la page
// /decisions au déploiement suivant.
import PocketBase from "pocketbase";
import { readFileSync } from "node:fs";

const all = process.argv.includes("--all");
const md = readFileSync(new URL("../docs/QUESTIONS.md", import.meta.url), "utf8");
const open = new Set();
for (const line of md.split("\n")) {
  const m = /^\| (Q\d+) \|/.exec(line);
  if (m && /\| ouverte[^|]*\|\s*$/.test(line)) open.add(m[1]);
}

async function read(label, pb) {
  try {
    const list = await pb.collection("decision_answers").getFullList({ sort: "answeredAtMs", batch: 500 });
    const latest = new Map();
    for (const r of list) latest.set(r.qid, r);
    return [...latest.values()].map((r) => ({ serveur: label, question: r.qid, réponse: r.choice || "(note seule)", note: (r.note || "").slice(0, 160), le: r.answeredAtMs ? new Date(r.answeredAtMs).toISOString().slice(0, 16).replace("T", " ") : "", àTraiter: open.has(r.qid) }));
  } catch (e) {
    console.error(`${label} : lecture impossible (${e.status ?? e.message})`);
    return [];
  }
}

const rows = [];
const { PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD, PROD_PB_URL, PROD_PB_TOKEN } = process.env;
if (PREPROD_PB_URL && PREPROD_PB_ADMIN_EMAIL && PREPROD_PB_ADMIN_PASSWORD) {
  const pb = new PocketBase(PREPROD_PB_URL);
  pb.autoCancellation(false);
  await pb.collection("_superusers").authWithPassword(PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD);
  rows.push(...(await read("pré-prod", pb)));
}
if (PROD_PB_URL && PROD_PB_TOKEN) {
  const pb = new PocketBase(PROD_PB_URL);
  pb.autoCancellation(false);
  pb.authStore.save(PROD_PB_TOKEN, null);
  rows.push(...(await read("production", pb)));
}
const shown = all ? rows : rows.filter((r) => r.àTraiter);
if (shown.length) console.table(shown);
console.log(`${shown.length} réponse(s) ${all ? "au total" : "à traiter"} ; ${open.size} question(s) ouverte(s) dans QUESTIONS.md.`);
