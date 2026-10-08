// 6.14.151 (R3, constat RV-6) : durée de chaque test d'intégration, lue dans le rapport JSON de vitest écrit par
// `scripts/itest-local.sh` (.pb/itest-durations.json). Affiche les tests les plus lents en fin de passage : un test qui
// s'approche de son délai (5 s par défaut, 20 à 60 s quand il est explicite) se voit avant d'échouer par intermittence.
//   node scripts/itest-durations.mjs [rapport.json] [nombre]
import { existsSync, readFileSync } from "node:fs";

const file = process.argv[2] || ".pb/itest-durations.json";
const top = Math.max(1, Number(process.argv[3]) || 12);
if (!existsSync(file)) {
  console.log(`Durées : pas de rapport (${file}).`);
  process.exit(0);
}
let report;
try {
  report = JSON.parse(readFileSync(file, "utf8"));
} catch (err) {
  console.log(`Durées : rapport illisible (${err.message}).`);
  process.exit(0);
}
const rows = [];
for (const f of report.testResults ?? []) {
  for (const a of f.assertionResults ?? []) {
    if (a.status === "skipped" || a.status === "pending" || a.status === "todo") continue;
    rows.push({ ms: Number(a.duration) || 0, status: a.status, title: a.title });
  }
}
if (rows.length === 0) {
  console.log("Durées : aucun test joué.");
  process.exit(0);
}
rows.sort((a, b) => b.ms - a.ms);
const total = rows.reduce((s, r) => s + r.ms, 0);
const sec = (ms) => (ms / 1000).toFixed(1).replace(".", ",");
console.log(`\nDurées : ${rows.length} tests, ${sec(total)} s au total ; les ${Math.min(top, rows.length)} plus lents :`);
for (const r of rows.slice(0, top)) {
  const title = r.title.length > 100 ? `${r.title.slice(0, 99)}…` : r.title;
  console.log(`  ${sec(r.ms).padStart(6)} s  ${r.status === "passed" ? " " : "×"} ${title}`);
}
