// 6.14.117 (É30-6, PRG-5, AE-12) : rythme des succès simulé sur des états réels de joueurs (rétro-simulation).
//
//   node scripts/achievement-pace-sim.mjs [--scales '{"traded":200}'] [--days 5-30] [--details]
//   node scripts/achievement-pace-sim.mjs --players joueurs.json --config config.json   # extraits gardés hors du dépôt
//   node scripts/achievement-pace-sim.mjs --content '{"unitFleetBudget":2e7}'   # 6.14.129 : succès par contenu réglés autrement
//   node scripts/achievement-pace-sim.mjs --content-off                           # 6.14.129 : sans les succès par contenu (avant)
//
// Sans fichiers : lit la pré-prod en lecture seule (PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD ; adresse de
// test exigée). Chaque joueur humain dont l'âge du compte (dernière activité − création) tombe dans `--days` est vu « comme un
// nouveau » : on compte les succès dont la mesure atteint le seuil, sans rythme (seuils écrits) puis avec le rythme en vigueur
// (`achievementPace` du serveur, ou du code) ou celui de `--scales`. Rien n'est écrit ; seuls des agrégats s'affichent.
// Cible (AU27, AE-12) : 15 à 25 % des succès après une semaine pour le joueur médian.
import { build } from "esbuild";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const argv = process.argv.slice(2);
const opt = (k) => {
  const i = argv.indexOf(k);
  return i >= 0 ? argv[i + 1] : undefined;
};
const [minDays, maxDays] = (opt("--days") ?? "5-30").split("-").map(Number);
const scalesArg = opt("--scales") ? JSON.parse(opt("--scales")) : null;
// 6.14.129 (AJ27-6) : réglages des succès par unité et par bâtiment (`contentAchievements`), ou coupés.
const contentArg = argv.includes("--content-off") ? { enabled: false } : opt("--content") ? JSON.parse(opt("--content")) : null;

const SECTIONS = ["buildings", "units", "technologies", "missions", "factions", "ranks", "achievements", "rules", "warlords", "seasonPass", "chronicles", "passSeasons", "relics", "relicSettings", "titles", "worldBosses", "officers"];
let players;
let config;
if (opt("--players")) {
  players = JSON.parse(readFileSync(opt("--players"), "utf8"));
  config = opt("--config") ? JSON.parse(readFileSync(opt("--config"), "utf8")) : {};
} else {
  const { PREPROD_PB_URL: URL_, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD } = process.env;
  if (!URL_ || !PREPROD_PB_ADMIN_EMAIL || !PREPROD_PB_ADMIN_PASSWORD) {
    console.error("Renseigne PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL et PREPROD_PB_ADMIN_PASSWORD, ou --players et --config.");
    process.exit(1);
  }
  const host = new URL(URL_).hostname;
  if (!/(^|[.-])(test|preprod)([.-]|$)/.test(host) && host !== "127.0.0.1" && host !== "localhost") {
    console.error(`Refusé : ${URL_} n'est pas un serveur de test.`);
    process.exit(1);
  }
  const { default: PocketBase } = await import("pocketbase");
  const pb = new PocketBase(URL_);
  pb.autoCancellation(false);
  await pb.collection("_superusers").authWithPassword(PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD);
  players = await pb.collection("players").getFullList();
  config = {};
  for (const r of await pb.collection("game_config").getFullList()) config[r.key] = r.data;
}

const dir = mkdtempSync(path.join(tmpdir(), "ach-pace-"));
const outfile = path.join(dir, "engine.mjs");
await build({
  stdin: {
    contents: `
      export { simulateAllProfiles } from "@/game/balance/progressionSim";
      export { applyGameContent } from "@/game/content";
      export { ACHIEVEMENTS, ACHIEVEMENT_PACE_RULES, achievementValue } from "@/game/achievements";
    `,
    resolveDir: root,
    loader: "ts",
  },
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node18",
  alias: { "@": path.join(root, "src") },
  outfile,
  logLevel: "error",
});
const E = await import(pathToFileURL(outfile).href);
rmSync(dir, { recursive: true, force: true });

const overrides = {};
for (const k of SECTIONS) if (config[k] != null) overrides[k] = config[k];
const withPace = (pace) => {
  const rules = structuredClone(overrides.rules ?? {});
  rules.achievementPace = pace;
  if (contentArg) rules.contentAchievements = { ...(rules.contentAchievements ?? {}), ...contentArg };
  E.applyGameContent({ ...overrides, rules }, Date.now());
  return E.ACHIEVEMENTS.filter((a) => a.enabled).map((a) => ({ id: a.id, metric: a.metric, tier: a.tier, threshold: a.threshold, target: a.target }));
};
const off = withPace({ enabled: false });
const on = withPace(scalesArg ? { enabled: true, scales: scalesArg } : (overrides.rules?.achievementPace ?? {}));
const pace = structuredClone(E.ACHIEVEMENT_PACE_RULES);

const age = (p) => ((Number(p.lastActiveMs) || 0) - (Number(p.createdAtMs) || 0)) / 86_400_000;
const sample = players.filter((p) => !p.npc && age(p) >= minDays && age(p) <= maxDays);
if (sample.length === 0) {
  console.error(`Aucun joueur humain dont le compte a entre ${minDays} et ${maxDays} jours.`);
  process.exit(1);
}
const met = (list, p) => list.filter((a) => E.achievementValue(a, p) >= a.threshold);
const q = (xs, f) => {
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(f * s.length))];
};
const pct = (n, total) => Math.round((n / total) * 1000) / 10;
const before = sample.map((p) => met(off, p).length);
const after = sample.map((p) => met(on, p).length);
const total = on.length;
const ages = sample.map(age);
console.log(`Joueurs : ${sample.length} (comptes de ${Math.round(q(ages, 0) * 10) / 10} à ${Math.round(q(ages, 0.999) * 10) / 10} jours, médiane ${Math.round(q(ages, 0.5) * 10) / 10}) ; succès actifs : ${total}`);
console.log(`Rythme : ${JSON.stringify(pace)}`);
console.log("| | Q1 | médiane | Q3 | médiane (%) |");
console.log("|:--|--:|--:|--:|--:|");
console.log(`| seuils écrits | ${q(before, 0.25)} | ${q(before, 0.5)} | ${q(before, 0.75)} | ${pct(q(before, 0.5), total)} % |`);
console.log(`| rythme | ${q(after, 0.25)} | ${q(after, 0.5)} | ${q(after, 0.75)} | ${pct(q(after, 0.5), total)} % |`);
if (argv.includes("--details")) {
  // Par mesure touchée : succès tenus par le joueur médian avant / après (agrégats).
  const metrics = [...new Set(on.filter((a, i) => a.threshold !== off[i].threshold).map((a) => a.metric))];
  console.log("\n| Mesure | facteur | succès de la mesure | tenus (médiane) avant | après |");
  console.log("|:--|--:|--:|--:|--:|");
  for (const m of metrics) {
    const lo = off.filter((a) => a.metric === m);
    const hi = on.filter((a) => a.metric === m);
    console.log(`| ${m} | ${pace.scales?.[m] ?? 1} | ${lo.length} | ${q(sample.map((p) => met(lo, p).length), 0.5)} | ${q(sample.map((p) => met(hi, p).length), 0.5)} |`);
  }
  // 6.14.129 (AJ27-6) : succès par unité et par bâtiment (mesures ciblées), tenus par le joueur médian.
  const targeted = ["unitOwned", "unitMastery", "buildingLevel"];
  if (on.some((a) => targeted.includes(a.metric))) {
    console.log("\n| Succès par contenu | nombre | tenus (Q1) | médiane | Q3 |");
    console.log("|:--|--:|--:|--:|--:|");
    for (const m of targeted) {
      const list = on.filter((a) => a.metric === m);
      const held = sample.map((p) => met(list, p).length);
      console.log(`| ${m} | ${list.length} | ${q(held, 0.25)} | ${q(held, 0.5)} | ${q(held, 0.75)} |`);
    }
  }
}
