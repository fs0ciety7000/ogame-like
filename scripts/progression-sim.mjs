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
//   node scripts/progression-sim.mjs --prestige --ascend --days 365   # 6.14.85 (RL-2) : avant = sans projets de prestige,
//                                                        # après = projets selon les règles `prestige` en vigueur ; --ascend : Ascensions dès que possible
//   node scripts/progression-sim.mjs --bascule --prestige --ascend --days 365   # 6.14.88 (RL-3) : avant = règles d'avant la
//                                                        # bascule du rythme, après = règles en vigueur après `rhythm.switchAt`
//                                                        # (projets de prestige des deux côtés avec --prestige)
//   node scripts/progression-sim.mjs rythme-6.14.88 --bascule --prestige --ascend --days 365   # 6.14.89 (RL-5) : après = valeurs
//                                                        # visées de 6.14.88 (avant le réglage fin) ; sans préréglage : celles du code
//   node scripts/progression-sim.mjs --base sans-paliers --apres-bascule --prestige --ascend --days 365   # 6.14.143 (PB-L2) :
//                                                        # avant = sans tampon de l'entrepôt, après = paliers en vigueur (I29)
//   node scripts/progression-sim.mjs --base avant-ae-l3 --catchup   # 6.14.106 (AE-L3) : avant = règles d'avant le lot
//                                                        # (coffre fixe, comptoir et défaites sans plafond, rattrapage 0,25 / 0,1) ;
//                                                        # --catchup : rattrapage simulé (médiane des 4 profils), écart de production
//                                                        # et rares obtenues au comptoir affichés ; --apres-bascule : les deux côtés
//                                                        # sur les règles d'après la bascule du rythme
//   node scripts/progression-sim.mjs --base lineaire --depart        # 6.14.159 (RD-1) : avant = ancienne durée linéaire des
//                                                        # bâtiments, après = courbe du départ ; --depart : temps jusqu'aux extracteurs
//                                                        # niveau 5 et 10, niveaux à J1, J3, J7, et première heure d'un nouveau compte
//                                                        # connecté sans interruption (ajouter --apres-bascule pour le jeu d'après le 1er novembre)
//   node scripts/progression-sim.mjs --base anciennes-recompenses --recompenses --depart --surplus   # 6.14.163 (S3) : avant = prime
//                                                        # du raid d'initiation en heures de la faction et Carnet aux montants fixes,
//                                                        # après = récompenses du départ indexées ; --recompenses : raid à la 18e minute,
//                                                        # objectif du jour du Carnet à la 60e (aussi dans la première heure de --depart)
//                                                        # 6.14.165 (S6) : et palier 1 du passe (2 h) à la 24e, plafonné pour un
//                                                        # compte jeune ; --surplus : côté « après », communes en trop échangées au
//                                                        # comptoir (commune → commune) ; stocks de la première heure affichés
//   node scripts/progression-sim.mjs --base pente-avant --rythme --recompenses --surplus   # 6.14.167 (S9) : avant = coûts du
//                                                        # premier palier d'avant la pente adoucie ; --rythme : jeu continu de l'actif
//                                                        # (J1 0–16 h, J2 et J7 7–23 h) : plus long temps sans action utile, attentes
//                                                        # de plus de 10 min, cause (files pleines ou coût) ; actions à chaque retour
//                                                        # des 4 profils (J1, J2, J7) ; --courbes : coût, production, durée et attente
//                                                        # (coût ÷ production) des extracteurs, de l'entrepôt et des premières recherches
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
  // Valeurs d'avant le lot AE-L3 (6.14.106) : coffre aux bornes fixes, comptoir et défaites sans plafond, rattrapage 0,25 / 0,1.
  "avant-ae-l3": {
    rules: {
      streak: { chest: { commonHours: [0, 0] } },
      exchange: { weeklyRareCap: 0 },
      pvp: { maxDefeatsPer24h: 0 },
      catchup: { maxBonus: 0.25, fullBelow: 0.1 },
    },
  },
  // Lot AE-L2 (à venir) : second palier ×4, comptoir 1 rare pour 250, missions moins rentables.
  "ae-l2": {
    tier2Factor: 4,
    rules: { exchange: { commonToRare: 0.004 }, economy: { missionProductionMultiplier: 0.75, missionRareProductionRef: 400_000 } },
  },
  // 6.14.143 (PB-L2) : sans les paliers de l'entrepôt dans le modèle (tampon du palier 10 à 0 h). Mesure d'I29 :
  //   node scripts/progression-sim.mjs --base sans-paliers --apres-bascule --prestige --ascend --days 365
  "sans-paliers": { rules: { buildingTiers: { storageBufferHours: 0 } } },
  // Variante étudiée (PB-Q2) : tampon de 4 h.
  "tampon-4h": { rules: { buildingTiers: { storageBufferHours: 4 } } },
  // Valeurs visées de la bascule du rythme en 6.14.88 (RL-3), avant le réglage fin de 6.14.89 (RL-5) : à lancer avec --bascule.
  // 6.14.159 (RD-1, proposals/rythme-du-depart.md) : ancienne durée linéaire du premier palier, et variantes de la jonction.
  lineaire: { rules: { buildTime: { enabled: false } } },
  "jonction-0": { rules: { buildTime: { junctionMaxRatio: 0 } } },
  "jonction-4": { rules: { buildTime: { junctionMaxRatio: 4 } } },
  "jonction-6": { rules: { buildTime: { junctionMaxRatio: 6 } } },
  "depart-60": { rules: { buildTime: { startDivisor: 60 } } },
  // 6.14.163 (S3, proposals/recompenses-du-depart.md) : prime du raid d'initiation en heures de la faction, Carnet aux montants fixes.
  "anciennes-recompenses": { rules: { startRewards: { enabled: false } } },
  // 6.14.167 (S9, proposals/rythme-du-premier-jour.md) : coûts du premier palier d'avant la pente adoucie, et variantes étudiées.
  "pente-avant": { rules: { buildCost: { enabled: false } } },
  // Avant le lot S9 : coûts d'avant et prérequis d'avant des missions du premier jour (Patrouille du périmètre, Forage profond,
  // Collecte d'énergie).
  "avant-s9": {
    rules: { buildCost: { enabled: false } },
    missionPrereqs: { patrouille_perimetrique: { roquette: 30 }, forage_profond: { drone_recuperateur: 12, cargo: 3 }, collecte_energie: { chasseur: 6, fregate: 2 } },
  },
  "pente-2": { rules: { buildCost: { maxGrowth: 2 } } },
  "pente-2.5": { rules: { buildCost: { maxGrowth: 2.5 } } },
  "pente-3": { rules: { buildCost: { maxGrowth: 3 } } },
  "pente-2.5-j3": { rules: { buildCost: { maxGrowth: 2.5, junctionMaxRatio: 3 } } },
  "pente-2.5-j4": { rules: { buildCost: { maxGrowth: 2.5, junctionMaxRatio: 4 } } },
  "pente-2.5-j5": { rules: { buildCost: { maxGrowth: 2.5, junctionMaxRatio: 5 } } },
  "pente-2-j4": { rules: { buildCost: { maxGrowth: 2, junctionMaxRatio: 4 } } },
  "pente-2.5-tous": { rules: { buildCost: { maxGrowth: 2.5, productionOnly: false } } },
  "rythme-6.14.88": {
    rules: { rhythm: { tier2BaseSeconds: 108_000, tier2SecondsPerLevel: 86_400, researchLateFromLevel: 6, researchLateTimeFactor: 30 } },
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
const withPrestige = args.includes("--prestige");
const withAscend = args.includes("--ascend");
const withSwitch = args.includes("--bascule");
const withCatchup = args.includes("--catchup");
const withStart = args.includes("--depart");
const withRewards = args.includes("--recompenses");
// 6.14.165 (S6, NJ-25) : palier 1 du passe (2 h de production) à la 24e minute, comme au parcours joué.
const START_REWARDS = { raidMinute: 18, guideMinute: 60, passMinute: 24 };
// 6.14.165 (S6, NJ-26, RR-2) : --surplus : côté « après », le joueur échange ses communes en trop au comptoir (commune → commune).
const withSurplus = args.includes("--surplus");
// 6.14.167 (S9, proposals/rythme-du-premier-jour.md) : rythme d'une journée de jeu et courbes du premier palier.
const withPace = args.includes("--rythme");
const withCurves = args.includes("--courbes");
const afterArg = args.filter((a) => !["--json", "--prestige", "--ascend", "--bascule", "--catchup", "--apres-bascule", "--depart", "--recompenses", "--surplus", "--rythme", "--courbes"].includes(a))[0];

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

// 6.14.106 : --apres-bascule résout avant et après à la date de la bascule du rythme (comparer un lot sur le jeu d'après).
const bothSwitched = args.includes("--apres-bascule");
const base = { ...load(baseArg), afterSwitch: bothSwitched };
const extra = load(afterArg);
const after = { rules: deepMerge({}, extra.rules ?? {}), missionPrereqs: extra.missionPrereqs, tier2Factor: extra.tier2Factor ?? 1, afterSwitch: withSwitch || bothSwitched, surplus: withSurplus };

// Empaquetage du moteur pur.
const dir = mkdtempSync(path.join(tmpdir(), "progression-sim-"));
const outfile = path.join(dir, "sim.mjs");
await build({
  stdin: {
    // 6.14.85 : le simulateur d'abord (même ordre de chargement que le jeu) : commencer par content.ts lisait COLONY_RULES
    // (advancedGuide.ts) avant son initialisation (import circulaire), et le script échouait dès 6.14.8x.
    contents: `
      export { simulateAllProfiles, simulateAllProfilesWithCatchup, scaleTier2Costs, prestigeProjectsFromRules, simulateProgression, PROGRESSION_PROFILES } from "@/game/balance/progressionSim";
      export { BUILDINGS, getBuildingUpgradeCost, getBuildingUpgradeTime, productionPerSecond, getStorageCapacity } from "@/game/buildings";
      export { TECHNOLOGIES, getTechCost, getTechTime } from "@/game/technologies";
      export { DEFAULT_MISSIONS } from "@/game/missions";
      export { applyGameContent } from "@/game/content";
      export { attackerWinThreshold, budgetDuel } from "@/game/balance/pvpBudget";
      export { COMBAT_RULES } from "@/game/combat";
      export { PVP_RULES } from "@/game/pvp";
      export { STREAK_RULES } from "@/game/streak";
      export { RHYTHM_RULES } from "@/game/rhythm";
      export { EXCHANGE_RULES } from "@/game/resources";
      export { CATCHUP_RULES } from "@/game/catchup";
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

/** 6.14.167 (S9) : courbes du premier palier (règles chargées) : coût, production, durée et attente de chaque niveau. */
function firstTierCurves() {
  const b = (id) => E.BUILDINGS.find((x) => x.id === id);
  const ex = b("extracteur_ferraille");
  const st = b("entrepot");
  const rows = [];
  for (let n = 2; n <= 12; n++) {
    const c = E.getBuildingUpgradeCost(ex, n);
    const prod = E.productionPerSecond("extracteur_ferraille", n - 1);
    const gain = E.productionPerSecond("extracteur_ferraille", n) - prod;
    const sc = E.getBuildingUpgradeCost(st, n);
    rows.push({
      level: n,
      scrap: c.scrap ?? 0,
      energy: c.energy ?? 0,
      prodBefore: prod,
      gain,
      seconds: E.getBuildingUpgradeTime(ex, n),
      // Attente : ferraille des 4 extracteurs au niveau n ÷ production de ferraille au niveau n − 1 (heures).
      waitH: prod > 0 ? (4 * (c.scrap ?? 0)) / prod / 3600 : 0,
      // Rentabilité : coût (ferraille + énergie) ÷ production gagnée (heures).
      paybackH: gain > 0 ? ((c.scrap ?? 0) + (c.energy ?? 0)) / gain / 3600 : 0,
      storage: { scrap: sc.scrap ?? 0, energy: sc.energy ?? 0, seconds: E.getBuildingUpgradeTime(st, n) },
    });
  }
  return rows;
}

function measure(settings, prestige = false) {
  // 6.14.88 : `afterSwitch` résout le contenu à la date de la bascule du rythme (rhythm.ts), sinon avant (règles du code).
  // 6.14.167 (S9) : `missionPrereqs` d'un préréglage remplace les prérequis de missions du contenu par défaut.
  const missions = settings.missionPrereqs ? Object.values(E.DEFAULT_MISSIONS).map((m) => (settings.missionPrereqs[m.key] ? { ...m, prereq: settings.missionPrereqs[m.key] } : m)) : undefined;
  E.applyGameContent({ rules: settings.rules ?? {}, ...(missions ? { missions } : {}) }, settings.afterSwitch ? E.RHYTHM_RULES.switchAt : undefined);
  const restore = settings.tier2Factor && settings.tier2Factor !== 1 ? E.scaleTier2Costs(settings.tier2Factor) : () => {};
  try {
    const projects = prestige ? E.prestigeProjectsFromRules() : null;
    const simOpts = {
      days,
      ascend: withAscend,
      ...(projects ? { prestigeProjects: projects } : {}),
      ...(withRewards ? { startRewards: START_REWARDS } : {}),
      ...(settings.surplus ? { surplusExchange: true } : {}),
      milestones: [...new Set([...(withStart ? [1, 3, 7] : []), 14, 30, days])].filter((d) => d <= days),
    };
    const profiles = withCatchup ? E.simulateAllProfilesWithCatchup(simOpts).results : E.simulateAllProfiles(simOpts);
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
      // 6.14.106 (AE-L3).
      chestCommonHours: [...(E.STREAK_RULES.chest.commonHours ?? [0, 0])],
      weeklyRareCap: E.EXCHANGE_RULES.weeklyRareCap,
      maxDefeatsPer24h: E.PVP_RULES.maxDefeatsPer24h,
      catchup: [E.CATCHUP_RULES.maxBonus, E.CATCHUP_RULES.fullBelow],
    };
    // 6.14.159 (RD-1) : première heure, simulée à part (un nouveau compte connecté sans interruption ; les relevés d'I29 n'en dépendent pas).
    const first = withStart
      ? E.simulateAllProfiles({
          days: 1,
          milestones: [],
          opening: { minutes: 60, stepSeconds: 10, marks: withRewards ? [1, 5, 15, 18, 20, 24, 25, 30, 45, 60] : [1, 5, 15, 30, 60] },
          ...(withRewards ? { startRewards: START_REWARDS } : {}),
          ...(settings.surplus ? { surplusExchange: true } : {}),
        })[0]
      : null;
    const opening = first ? first.opening : [];
    const startPaid = first ? first.startRewardsPaid : null;
    // 6.14.167 (S9) : journée de jeu continu de l'actif (J1 0–16 h, J2 et J7 7–23 h) et actions à chaque retour des 4 profils.
    const paceOpts = {
      days: 8,
      milestones: [],
      opening: { minutes: 60, stepSeconds: 10, marks: [] },
      ...(withRewards ? { startRewards: START_REWARDS } : {}),
      ...(settings.surplus ? { surplusExchange: true } : {}),
    };
    const pace = withPace
      ? {
          continuous: E.simulateProgression(E.PROGRESSION_PROFILES.actif, { ...paceOpts, activeWindows: [[0, 16], [31, 47], [151, 167]] }).pace,
          returns: E.simulateAllProfiles(paceOpts).map((r) => ({ profile: r.profile, pace: r.pace })),
        }
      : null;
    const curves = withCurves ? firstTierCurves() : null;
    return { rules, profiles, pvp, opening, startPaid, pace, curves };
  } finally {
    restore();
    E.applyGameContent({});
  }
}

const before = measure(base, (withSwitch || bothSwitched) && withPrestige);
const result = measure(after, withPrestige);

if (asJson) {
  console.log(JSON.stringify({ before, after: result }, null, 2));
  process.exit(0);
}

const fmtDay = (d) => (d === null ? `> J${days}` : `J${d}`);
const fmtM = (n) => (n >= 1e9 ? `${(n / 1e9).toFixed(1)} Md` : n >= 1e6 ? `${(n / 1e6).toFixed(1)} M` : `${Math.round(n)}`);
const row = (cells) => `| ${cells.join(" | ")} |`;
console.log(`Avant : ${baseArg ? `code + ${baseArg}` : "règles du code"} ; après : ${afterArg ? `code + ${afterArg}` : "règles du code"}${withSwitch ? " après la bascule du rythme" : ""} (${days} jours)\n`);
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
if (withPrestige || withAscend) {
  // 6.14.85 (RL-2) : puits des projets de prestige (production perdue, jours sans dépense, projets achevés).
  const worst = (r, k) => Math.max(0, ...r.windows.map((w) => w[k]));
  const last = (r) => r.snapshots[r.snapshots.length - 1] ?? { prestigeProjects: 0 };
  console.log(`\nPuits et rythme (${withPrestige ? "après = projets de prestige des règles en vigueur" : "sans projets"}${withAscend ? ", Ascensions dès que possible" : ""}) :`);
  console.log(row(["Profil", "Projets à la fin", "Prod. perdue (cumul)", "Jours sans dépense (pire mois)", "Jours « fini, sans suite »", "Ascensions (jours)", "Sessions bloquées (pire mois)", "Mois après la 1re Ascension", "Sans action J1–7"]));
  console.log(row(["---", "---", "---", "---", "---", "---", "---", "---", "---"]));
  // 6.14.89 (RL-5) : sessions bloquées, dont les 30 jours qui suivent la 1re Ascension (une ou deux fenêtres de 30 jours).
  const afterFirst = (r) => {
    const first = r.ascensionDays[0];
    if (first === undefined) return "—";
    const idx = new Set([Math.floor(first / 30), Math.floor((first + 30) / 30)]);
    return `${Math.max(0, ...r.windows.filter((_, i) => idx.has(i)).map((w) => w.blockedPct))} %`;
  };
  for (let i = 0; i < before.profiles.length; i++) {
    const a = before.profiles[i];
    const b = result.profiles[i];
    const fin = (r) => r.windows.reduce((n, w) => n + w.finishedDays, 0);
    console.log(
      row([
        a.profile,
        `${last(a).prestigeProjects} → ${last(b).prestigeProjects}`,
        `${a.lostPct} % → ${b.lostPct} %`,
        `${worst(a, "daysWithoutSpend")} → ${worst(b, "daysWithoutSpend")}`,
        `${fin(a)} → ${fin(b)}`,
        `${a.ascensionDays.join(", ") || "—"} → ${b.ascensionDays.join(", ") || "—"}`,
        `${worst(a, "blockedPct")} % → ${worst(b, "blockedPct")} %`,
        `${afterFirst(a)} → ${afterFirst(b)}`,
        `${a.deadSessionsPct.early} % → ${b.deadSessionsPct.early} %`,
      ]),
    );
  }
}
// 6.14.106 (AE-L3) : comptoir (rares obtenues, semaine la plus forte), rattrapage et écart de production actif / occasionnel.
{
  console.log(`\nComptoir et rattrapage${withCatchup ? " (rattrapage simulé : médiane des 4 profils)" : ""} :`);
  console.log(row(["Profil", "Rares au comptoir (total)", "Semaine la plus forte", "Rattrapage moyen J1–30", "Prod. commune J14", "Prod. commune J30"]));
  console.log(row(["---", "---", "---", "---", "---", "---"]));
  const prodAt = (r, d) => r.snapshots.find((x) => x.day === d)?.commonPerHour ?? 0;
  for (let i = 0; i < before.profiles.length; i++) {
    const a = before.profiles[i];
    const b = result.profiles[i];
    console.log(
      row([
        a.profile,
        `${fmtM(a.exchangedRare)} → ${fmtM(b.exchangedRare)}`,
        `${fmtM(a.exchangedRarePeakWeek)} → ${fmtM(b.exchangedRarePeakWeek)}`,
        `+${Math.round(a.catchupAvgJ1to30 * 1000) / 10} % → +${Math.round(b.catchupAvgJ1to30 * 1000) / 10} %`,
        `${fmtM(prodAt(a, 14))}/h → ${fmtM(prodAt(b, 14))}/h`,
        `${fmtM(prodAt(a, 30))}/h → ${fmtM(prodAt(b, 30))}/h`,
      ]),
    );
  }
  const gap = (rs, d) => {
    const act = rs.find((r) => r.profile === "actif");
    const occ = rs.find((r) => r.profile === "occasionnel");
    const o = prodAt(occ, d);
    return o > 0 ? `×${(prodAt(act, d) / o).toFixed(1)}` : "—";
  };
  if (days >= 30) console.log(`- écart de production actif / occasionnel : J14 ${gap(before.profiles, 14)} → ${gap(result.profiles, 14)} ; J30 ${gap(before.profiles, 30)} → ${gap(result.profiles, 30)}`);
}
// 6.14.159 (RD-1) : rythme du départ.
if (withStart) {
  const h = (x) => (x === null ? "—" : x < 1 ? `${Math.round(x * 60)} min` : `${x.toFixed(1)} h`);
  const lv = (r, d) => r.snapshots.find((x) => x.day === d)?.extractors.join("/") ?? "—";
  console.log(`\nRythme du départ (première heure : nouveau compte connecté sans interruption dès l'inscription) :`);
  console.log(row(["Profil", "Extracteurs niv. 5", "Extracteurs niv. 10", "J1", "J3", "J7", "Sans action J1–7"]));
  console.log(row(["---", "---", "---", "---", "---", "---", "---"]));
  for (let i = 0; i < before.profiles.length; i++) {
    const a = before.profiles[i];
    const b = result.profiles[i];
    console.log(row([a.profile, `${h(a.reachHours.l5)} → ${h(b.reachHours.l5)}`, `${h(a.reachHours.l10)} → ${h(b.reachHours.l10)}`, `${lv(a, 1)} → ${lv(b, 1)}`, `${lv(a, 3)} → ${lv(b, 3)}`, `${lv(a, 7)} → ${lv(b, 7)}`, `${a.deadSessionsPct.early} % → ${b.deadSessionsPct.early} %`]));
  }
  const oa = before.opening;
  const ob = result.opening;
  console.log(`\nPremière heure (extracteurs ferraille/énergie/nano/données, entrepôt, lancements : chantiers, déblocages et recherches) :`);
  for (let i = 0; i < ob.length; i++) console.log(`- ${ob[i].minute} min : ${oa[i]?.extractors.join("/") ?? "—"} (entrepôt ${oa[i]?.storageLevel ?? "—"}, ${oa[i]?.launched ?? 0} lancements) → ${ob[i].extractors.join("/")} (entrepôt ${ob[i].storageLevel}, ${ob[i].launched} lancements)`);
  // 6.14.165 (RR-2) : stocks des communes aux relevés (surplus de nano et de données), et communes échangées (--surplus).
  console.log(`\nStocks de la première heure (ferraille / énergie / nano / données ; communes échangées au comptoir) :`);
  const st = (m) => (m ? `${m.stocks.map(fmtM).join(" / ")}${m.swapped ? ` (échangé ${fmtM(m.swapped)})` : ""}` : "—");
  for (let i = 0; i < ob.length; i++) console.log(`- ${ob[i].minute} min : ${st(oa[i])} → ${st(ob[i])}`);
  // 6.14.163 (S3) : récompenses du départ versées dans la première heure (--recompenses).
  if (withRewards && before.startPaid && result.startPaid) {
    const fmtR = (r) => ["scrap", "energy", "nano", "data"].map((k) => fmtM(r[k] ?? 0)).join(" / ");
    const mins = (r, perHour) => (perHour > 0 ? `${Math.round((Object.values(r).reduce((a, b) => a + b, 0) / perHour) * 60)} min` : "—");
    console.log(`\nRécompenses du départ (ferraille / énergie / nano / données ; en minutes de production commune totale du moment) :`);
    console.log(`- raid d'initiation (${START_REWARDS.raidMinute}e min) : ${fmtR(before.startPaid.raid)} (${mins(before.startPaid.raid, before.startPaid.raidPerHour)}) → ${fmtR(result.startPaid.raid)} (${mins(result.startPaid.raid, result.startPaid.raidPerHour)})`);
    const res = (p) => (Object.keys(p.passDeferred ?? {}).length ? ` ; en réserve ${fmtR(p.passDeferred)}` : "");
    console.log(`- palier 1 du passe, 2 h (${START_REWARDS.passMinute}e min) : ${fmtR(before.startPaid.pass)} (${mins(before.startPaid.pass, before.startPaid.passPerHour)})${res(before.startPaid)} → ${fmtR(result.startPaid.pass)} (${mins(result.startPaid.pass, result.startPaid.passPerHour)})${res(result.startPaid)}`);
    console.log(`- Carnet, objectif du jour (${START_REWARDS.guideMinute}e min) : ${fmtR(before.startPaid.guide)} (${mins(before.startPaid.guide, before.startPaid.guidePerHour)}) → ${fmtR(result.startPaid.guide)} (${mins(result.startPaid.guide, result.startPaid.guidePerHour)})`);
  }
}
// 6.14.167 (S9) : courbes et rythme d'une journée.
if (withCurves) {
  const d = (s) => (s < 60 ? `${s} s` : s < 3600 ? `${Math.round(s / 60)} min` : `${(s / 3600).toFixed(1)} h`);
  const h = (x) => (x < 1 ? `${Math.round(x * 60)} min` : `${x.toFixed(1)} h`);
  console.log(`\nCourbes de l'extracteur de ferraille (avant → après ; attente : ferraille des 4 extracteurs ÷ production de ferraille du niveau d'avant) :`);
  console.log(row(["Niv.", "Coût ferraille / énergie", "Pente", "Production (avant → gain)", "Durée", "Attente", "Rentabilité", "Entrepôt (ferraille)"]));
  console.log(row(["---", "---", "---", "---", "---", "---", "---", "---"]));
  for (let i = 0; i < result.curves.length; i++) {
    const a = before.curves[i];
    const b = result.curves[i];
    const slope = (c, j) => (j > 0 ? `×${(c[j].scrap / c[j - 1].scrap).toFixed(2)}` : "—");
    console.log(row([b.level, `${fmtM(a.scrap)} / ${fmtM(a.energy)} → ${fmtM(b.scrap)} / ${fmtM(b.energy)}`, `${slope(before.curves, i)} → ${slope(result.curves, i)}`, `${b.prodBefore}/s (+${b.gain})`, `${d(a.seconds)} → ${d(b.seconds)}`, `${h(a.waitH)} → ${h(b.waitH)}`, `${h(a.paybackH)} → ${h(b.paybackH)}`, `${fmtM(a.storage.scrap)} → ${fmtM(b.storage.scrap)}`]));
  }
}
if (withPace) {
  console.log(`\nJeu continu de l'actif (J1 0–16 h après l'inscription, J2 et J7 7–23 h ; action utile : chantier, déblocage ou recherche) :`);
  console.log(row(["Jour", "Minutes jouées", "Plus long sans action utile", "Avec missions", "Attentes > 10 min", "Files pleines (min)", "Coût qui freine (min)"]));
  console.log(row(["---", "---", "---", "---", "---", "---", "---"]));
  const at = (m) => `${String(Math.floor(m / 60)).padStart(2, "0")} h ${String(Math.round(m % 60)).padStart(2, "0")}`;
  for (const day of [1, 2, 7]) {
    const a = before.pace.continuous.find((p) => p.day === day);
    const b = result.pace.continuous.find((p) => p.day === day);
    if (!a || !b) continue;
    console.log(row([`J${day}`, `${b.continuousMinutes}`, `${a.longestIdleMinutes} min (${at(a.longestIdleAt)}) → ${b.longestIdleMinutes} min (${at(b.longestIdleAt)})`, `${a.longestIdleWithMissionsMinutes} → ${b.longestIdleWithMissionsMinutes} min`, `${a.idleOver10} → ${b.idleOver10}`, `${a.idleFullMinutes} → ${b.idleFullMinutes}`, `${a.idlePoorMinutes} → ${b.idlePoorMinutes}`]));
  }
  // Attentes de plus de 10 min du premier jour, par tranche d'heures de jeu.
  const slices = [[0, 1], [1, 2], [2, 4], [4, 8], [8, 16]];
  const bySlice = (p) => slices.map(([a, b]) => { const g = (p?.idleGaps ?? []).filter(([at]) => at >= a * 60 && at < b * 60); return g.length ? `${g.length} (max ${Math.max(...g.map((x) => x[1]))} min)` : "0"; });
  const j1a = before.pace.continuous.find((p) => p.day === 1);
  const j1b = result.pace.continuous.find((p) => p.day === 1);
  console.log(`\nJ1, attentes de plus de 10 min par tranche d'heures de jeu (nombre, plus longue) :`);
  console.log(row(["Tranche", ...slices.map(([a, b]) => `${a}–${b} h`)]));
  console.log(row(["---", ...slices.map(() => "---")]));
  console.log(row(["avant", ...bySlice(j1a)]));
  console.log(row(["après", ...bySlice(j1b)]));
  console.log(`\nActions utiles à chaque retour, + missions terminées et relancées (« 4+3m » ; sessions des profils, la première heure jouée n'est pas un retour) :`);
  console.log(row(["Profil", "J1", "J2", "J7"]));
  console.log(row(["---", "---", "---", "---"]));
  const list = (r, day) => {
    const p = r.pace.find((x) => x.day === day);
    return p ? p.actionsPerReturn.map((n, i) => `${n}+${p.missionsPerReturn[i] ?? 0}m`).join(", ") : "—";
  };
  for (let i = 0; i < result.pace.returns.length; i++) {
    const a = before.pace.returns[i];
    const b = result.pace.returns[i];
    console.log(row([b.profile, `${list(a, 1)} → ${list(b, 1)}`, `${list(a, 2)} → ${list(b, 2)}`, `${list(a, 7)} → ${list(b, 7)}`]));
  }
}
const thr = (x) => (x === null ? "> ×3" : `×${x.toFixed(2)}`);
const duel = (d) => `${d.outcome}, attaquant −${Math.round(d.attackerLoss * 100)} %, défenseur −${Math.round(d.defenderLoss * 100)} %`;
console.log(`\nJcJ à budget égal (techno 50 %, unités niv. 6, bouclier 7,5 %) :`);
console.log(`- seuil de victoire contre un défenseur mixte : ${thr(before.pvp.mixedThreshold)} → ${thr(result.pvp.mixedThreshold)}`);
console.log(`- seuil contre des défenses seules : ${thr(before.pvp.defensesThreshold)} → ${thr(result.pvp.defensesThreshold)}`);
console.log(`- à dépense égale (mixte) : ${duel(before.pvp.atEqualBudget)} → ${duel(result.pvp.atEqualBudget)}`);
