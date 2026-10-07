// 6.14.71 (AU27, lot AE-L0) : simulateur de progression et combats à budget égal, avant / après un jeu de réglages.
//
//   node scripts/progression-sim.mjs [réglages] [--base réglages] [--days 90] [--json]
//
// « réglages » : un préréglage nommé (voir PRESETS ci-dessous) ou un fichier JSON
//   { "rules": { …extrait de GameRules… }, "tier2Factor": 4 }
// « avant » = règles du code + --base ; « après » = règles du code + réglages. Sans argument : règles du code des deux côtés.
// Exemples :
//   node scripts/progression-sim.mjs --base avant-ae-l1   # mesure du lot AE-L1 (anciennes valeurs → code)
//   node scripts/progression-sim.mjs ae-l2               # effet attendu du lot AE-L2 sur le code actuel
//
// Le moteur pur (src/game/balance/progressionSim.ts, pvpBudget.ts) est empaqueté à la volée par esbuild : rien n'est écrit dans le dépôt.
import { build } from "esbuild";
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Jeux de réglages nommés (docs/proposals/equilibrage-au27.md). */
const PRESETS = {
  // Valeurs d'avant le lot AE-L1 (6.14.72).
  "avant-ae-l1": {
    rules: {
      streak: { chest: { common: [45_000_000, 280_000_000] } },
      combat: { homeFleetDefenseFactor: 0.5, homeDefenseBonus: 0.15 },
      pvp: { shieldAfterDefeatMs: 3_600_000, hardXpRatio: 12 },
    },
  },
  // Lot AE-L2 (à venir) : second palier ×4, comptoir 1 rare pour 250, missions moins rentables.
  "ae-l2": {
    tier2Factor: 4,
    rules: { exchange: { commonToRare: 0.004 }, economy: { missionProductionMultiplier: 0.75, missionRareProductionRef: 400_000 } },
  },
};

const args = process.argv.slice(2);
const opt = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return undefined;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const baseArg = opt("--base");
const days = Number(opt("--days") ?? 90);
const asJson = args.includes("--json");
const afterArg = args.filter((a) => a !== "--json")[0];

function load(arg) {
  if (!arg) return { rules: {} };
  if (PRESETS[arg]) return PRESETS[arg];
  return JSON.parse(readFileSync(path.resolve(arg), "utf8"));
}
function deepMerge(a, b) {
  if (!b || typeof b !== "object" || Array.isArray(b)) return b === undefined ? a : b;
  const out = { ...(a && typeof a === "object" && !Array.isArray(a) ? a : {}) };
  for (const [k, v] of Object.entries(b)) out[k] = deepMerge(out[k], v);
  return out;
}

const base = load(baseArg);
const extra = load(afterArg);
const after = { rules: deepMerge({}, extra.rules ?? {}), tier2Factor: extra.tier2Factor ?? 1 };

// Empaquetage du moteur pur.
const dir = mkdtempSync(path.join(tmpdir(), "progression-sim-"));
const outfile = path.join(dir, "sim.mjs");
await build({
  stdin: {
    contents: `
      export { applyGameContent } from "@/game/content";
      export { simulateAllProfiles, scaleTier2Costs } from "@/game/balance/progressionSim";
      export { attackerWinThreshold, budgetDuel } from "@/game/balance/pvpBudget";
      export { COMBAT_RULES } from "@/game/combat";
      export { PVP_RULES } from "@/game/pvp";
      export { STREAK_RULES } from "@/game/streak";
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

function measure(settings) {
  E.applyGameContent({ rules: settings.rules ?? {} });
  const restore = settings.tier2Factor && settings.tier2Factor !== 1 ? E.scaleTier2Costs(settings.tier2Factor) : () => {};
  try {
    const profiles = E.simulateAllProfiles({ days });
    const pvp = {
      mixedThreshold: E.attackerWinThreshold("mixed"),
      defensesThreshold: E.attackerWinThreshold("defenses"),
      atEqualBudget: E.budgetDuel(1, "mixed"),
    };
    const rules = {
      chestCommon: [...E.STREAK_RULES.chest.common],
      homeFleetDefenseFactor: E.COMBAT_RULES.homeFleetDefenseFactor,
      homeDefenseBonus: E.COMBAT_RULES.homeDefenseBonus,
      shieldAfterDefeatH: E.PVP_RULES.shieldAfterDefeatMs / 3_600_000,
      hardXpRatio: E.PVP_RULES.hardXpRatio,
    };
    return { rules, profiles, pvp };
  } finally {
    restore();
    E.applyGameContent({});
  }
}

const before = measure(base);
const result = measure(after);

if (asJson) {
  console.log(JSON.stringify({ before, after: result }, null, 2));
  process.exit(0);
}

const fmtDay = (d) => (d === null ? `> J${days}` : `J${d}`);
const fmtM = (n) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} Md` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : `${Math.round(n)}`);
const row = (cells) => `| ${cells.join(" | ")} |`;
console.log(`Avant : ${baseArg ? `code + ${baseArg}` : "règles du code"} ; après : ${afterArg ? `code + ${afterArg}` : "règles du code"} (${days} jours)\n`);
console.log("Réglages lus :", JSON.stringify(before.rules), "→", JSON.stringify(result.rules), "\n");
console.log(row(["Profil", "1re Ascension", "Arbre complet", "Prod. perdue (cumul)", "Missions (J14+)", "Coffre du 7e jour", "Stock après coffre / entrepôt", "Sessions sans action J8–30"]));
console.log(row(["---", "---", "---", "---", "---", "---", "---", "---"]));
for (let i = 0; i < before.profiles.length; i++) {
  const a = before.profiles[i];
  const b = result.profiles[i];
  const chest = (r) => (r.firstChest ? `${fmtM(r.firstChest.common)} = ${r.firstChest.hoursOfProduction} h` : "—");
  const stock = (r) => (r.firstChest ? `${fmtM(r.firstChest.maxStockAfter)} / ${fmtM(r.firstChest.storageCap)}` : "—");
  console.log(
    row([
      a.profile,
      `${fmtDay(a.ascensionDay)} → ${fmtDay(b.ascensionDay)}`,
      `${fmtDay(a.techCompleteDay)} → ${fmtDay(b.techCompleteDay)}`,
      `${a.lostPct} % → ${b.lostPct} %`,
      `${a.incomeShareFromJ14.missions ?? 0} % → ${b.incomeShareFromJ14.missions ?? 0} %`,
      `${chest(a)} → ${chest(b)}`,
      `${stock(a)} → ${stock(b)}`,
      `${a.deadSessionsPct.mid} % → ${b.deadSessionsPct.mid} %`,
    ]),
  );
}
const thr = (x) => (x === null ? "> ×3" : `×${x.toFixed(2)}`);
const duel = (d) => `${d.outcome}, attaquant −${Math.round(d.attackerLoss * 100)} %, défenseur −${Math.round(d.defenderLoss * 100)} %`;
console.log(`\nJcJ à budget égal (techno 50 %, unités niv. 6, bouclier 7,5 %) :`);
console.log(`- seuil de victoire contre un défenseur mixte : ${thr(before.pvp.mixedThreshold)} → ${thr(result.pvp.mixedThreshold)}`);
console.log(`- seuil contre des défenses seules : ${thr(before.pvp.defensesThreshold)} → ${thr(result.pvp.defensesThreshold)}`);
console.log(`- à dépense égale (mixte) : ${duel(before.pvp.atEqualBudget)} → ${duel(result.pvp.atEqualBudget)}`);
