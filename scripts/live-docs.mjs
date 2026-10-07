// 6.14.42 : documents en direct pour /decisions et /img (collection `live_docs`), sans commit GitHub ni redéploiement Coolify.
//
//   node scripts/live-docs.mjs push [fichier …]   # envoie les documents (par défaut : la liste ci-dessous) ; seuls les changés partent
//   node scripts/live-docs.mjs status             # ce qui diffère entre le dépôt local et la pré-prod
//   node scripts/live-docs.mjs pull <fichier>     # affiche la version en direct d'un document
//
// Par défaut : docs/QUESTIONS.md, docs/decisions-a-valider.md, docs/changes/README.md, docs/proposals/*.md, scripts/illustrations.json
// et les fiches de docs/changes/ citées par une question ouverte (lot) : tout ce que lisent /decisions et /img.
// Variables : PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD. Refuse tout serveur qui n'est pas de test : la
// production garde la version de son build (lecture seule, CLAUDE.md).
import PocketBase from "pocketbase";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { execSync } from "node:child_process";

const ROOT = new URL("../", import.meta.url);
const { PREPROD_PB_URL: URL_, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD } = process.env;
const [cmd = "push", ...args] = process.argv.slice(2);
if (!URL_ || !PREPROD_PB_ADMIN_EMAIL || !PREPROD_PB_ADMIN_PASSWORD) {
  console.error("Renseigne PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL et PREPROD_PB_ADMIN_PASSWORD.");
  process.exit(1);
}
const host = new URL(URL_).hostname;
if (!/(^|[.-])(test|preprod)([.-]|$)/.test(host) && host !== "127.0.0.1" && host !== "localhost") {
  console.error(`Refusé : ${URL_} n'est pas un serveur de test.`);
  process.exit(1);
}

const read = (p) => readFileSync(new URL(p, ROOT), "utf8");

/** Liste par défaut : ce que lisent /decisions et /img. */
function defaultPaths() {
  const out = ["docs/QUESTIONS.md", "docs/decisions-a-valider.md", "docs/changes/README.md", "scripts/illustrations.json"];
  for (const f of readdirSync(new URL("docs/proposals/", ROOT))) if (f.endsWith(".md")) out.push(`docs/proposals/${f}`);
  // Fiches citées par le lot d'une question ouverte (même logique que decisionDocs, src/lib/decisions.ts).
  const index = {};
  for (const line of read("docs/changes/README.md").split("\n")) {
    const m = /^\| (\d+\.\d+\.\d+) \| \[[^\]]*\]\(([^)]+\.md)\)/.exec(line);
    if (m) index[m[1]] = `docs/changes/${m[2]}`;
  }
  for (const line of read("docs/QUESTIONS.md").split("\n")) {
    if (!/^\| Q\d+ \|/.test(line) || !/\| ouverte[^|]*\|\s*$/.test(line)) continue;
    const text = line;
    const re = /(docs\/[0-9A-Za-z_./-]+\.md)/g;
    let m;
    while ((m = re.exec(text))) if (existsSync(new URL(m[1], ROOT))) out.push(m[1]);
    const lot = line.split(" | ")[2] ?? "";
    const vre = /\b(\d+\.\d+\.\d+)\b/g;
    while ((m = vre.exec(lot))) if (index[m[1]]) out.push(index[m[1]]);
  }
  return [...new Set(out)];
}

const commit = (() => {
  try {
    return execSync("git rev-parse --short HEAD", { cwd: ROOT }).toString().trim();
  } catch {
    return "";
  }
})();

const pb = new PocketBase(URL_);
pb.autoCancellation(false);
await pb.collection("_superusers").authWithPassword(PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD);
const col = pb.collection("live_docs");
const remote = new Map((await col.getFullList({ batch: 500 })).map((r) => [r.path, r]));

if (cmd === "pull") {
  const r = remote.get(args[0]);
  if (!r) {
    console.error(`${args[0]} : pas de version en direct.`);
    process.exit(1);
  }
  process.stdout.write(r.content);
} else if (cmd === "status" || cmd === "push") {
  const paths = args.length ? args : defaultPaths();
  let sent = 0;
  for (const p of paths) {
    if (!existsSync(new URL(p, ROOT))) {
      console.error(`${p} : introuvable dans le dépôt, ignoré.`);
      continue;
    }
    const content = read(p);
    const r = remote.get(p);
    if (r && r.content === content) continue;
    if (cmd === "status") {
      console.log(`${r ? "modifié" : "nouveau "} ${p}`);
      continue;
    }
    const data = { path: p, content, updatedAtMs: Date.now(), source: `${process.env.LIVE_DOCS_SOURCE ?? "claude"} ${commit}`.trim() };
    if (r) await col.update(r.id, data);
    else await col.create(data);
    sent++;
    console.log(`envoyé ${p}`);
  }
  console.log(cmd === "push" ? `${sent} document(s) envoyé(s) sur ${paths.length}.` : "Fin de la comparaison.");
} else {
  console.error("Commandes : push [fichier …], status, pull <fichier>.");
  process.exit(1);
}
