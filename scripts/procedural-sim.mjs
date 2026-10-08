// 6.14.140 (AU27, lot AP-L14) : simulation des générateurs procéduraux sur N mois (répétitions, variété, faisabilité).
// Reprise des simulations de la revue AU27 (docs/audit/2026-10-07-au27-procedural.md §2). À lancer avant chaque lot qui touche un
// générateur (Chroniques, passe, catalogue des saisons, saga d'alliance, mutateurs), et après, pour comparer.
//
//   node scripts/procedural-sim.mjs [--months 24] [--from 2026-11] [--profile reel|typique|vide|bruite|all] [--servers 50]
//                                   [--rules fichier.json] [--base avant-ap|fichier.json] [--json]
//
// --months   nombre de mois enchaînés (défaut 24 ; 48 pour voir le catalogue reboucler ou se prolonger)
// --from     premier mois simulé (AAAA-MM, défaut 2026-11, début du catalogue)
// --profile  activité du serveur : « reel » (médianes de la pré-prod au 7 octobre 2026), « typique » (serveur calme), « vide »
//            (aucune mesure), « bruite » (--servers serveurs aux médianes du profil réel × 0,5 à 1,5), « all » (défaut : les quatre)
// --rules    réglages appliqués côté « après » ({ "rules": { … } } ou un extrait de GameContent)
// --base     côté « avant » : préréglage nommé (« avant-ap » : textes, mutateurs et catalogue d'avant AP-L9 à AP-L12) ou fichier JSON ;
//            sans --base, seul « après » (règles du code + --rules) est affiché
// --json     sortie JSON brute
//
// Mesures :
//   Chroniques : factions, titres de chapitre distincts et première répétition, images de boss distinctes, répliques et titres
//                d'épisode distincts sur les 12 premiers mois ; faisabilité : épisodes dont l'action a une médiane sous le seuil
//                du rebondissement (chronicleGen.stretchMinWeekly), ou nulle.
//   Passe      : noms de saison, commandants et paires de rôles distincts, première répétition, répliques des jalons distinctes ;
//                faisabilité : jour de fin simulé du joueur médian et du plus actif (passPaceCheck), mois où le médian dépasse
//                passGen.latestMedianDay ; jour du dernier palier de prestige du plus actif (6.14.150, `topPrestigeDay`).
//   Saga       : titres répétés deux mois de suite, faction identique à celle du chapitre du mois.
//   Mutateurs  : minimum de mutateurs distincts sur 12 mois glissants, écart minimal entre deux retours.
//
// Le moteur pur (src/game) est empaqueté à la volée par esbuild : rien n'est écrit dans le dépôt.
import { build } from "esbuild";
import { readFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Préréglages nommés. */
const PRESETS = {
  // Avant les lots AP-L9 à AP-L12 (6.14.136 à 6.14.139) : mutateurs sans anti-répétition, textes d'avant, catalogue qui reboucle.
  "avant-ap": { rules: { mutators: { noRepeatMonths: 0 }, narrative: { enabled: false }, seasonGen: { enabled: false } } },
};

/** Profils d'activité (médiane par joueur actif et par semaine ; points de passe par jour). */
const PROFILES = {
  reel: {
    label: "réel (pré-prod, 7 octobre 2026)",
    activePlayers: 17,
    weeklyMedian: { contract: 5, bounty: 4, raidRepelled: 4, victory: 1, mission: 88, spy: 0, market: 0, warlordWin: 0, bossAssault: 0 },
    passPace: { median: 63, top: 171 },
  },
  typique: {
    label: "typique (serveur calme)",
    activePlayers: 12,
    weeklyMedian: { contract: 5, bounty: 3, raidRepelled: 0.2, victory: 2, mission: 20, spy: 5, market: 2, warlordWin: 0.5, bossAssault: 0.8 },
    passPace: { median: 50, top: 110 },
  },
  vide: { label: "vide (aucune mesure)", activePlayers: 0, weeklyMedian: {}, passPace: undefined },
};

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(name);
  if (i < 0) return def;
  const v = args[i + 1];
  args.splice(i, 2);
  return v;
};
const months = Math.max(1, Number(opt("--months", 24)));
const from = opt("--from", "2026-11");
const profileArg = opt("--profile", "all");
const servers = Math.max(1, Number(opt("--servers", 50)));
const rulesArg = opt("--rules");
const baseArg = opt("--base");
const asJson = args.includes("--json");

function loadSettings(arg) {
  if (!arg) return {};
  if (PRESETS[arg]) return PRESETS[arg];
  const raw = JSON.parse(readFileSync(path.resolve(arg), "utf8"));
  return raw.rules ? raw : { rules: raw };
}

const dir = mkdtempSync(path.join(tmpdir(), "procedural-sim-"));
const outfile = path.join(dir, "engine.mjs");
await build({
  stdin: {
    contents: `
      export { applyGameContent } from "@/game/content";
      export { generateChapter } from "@/game/procedural";
      export { generatePassSeason, passPaceCheck, prestigeDay, topPointsPerDay } from "@/game/passSeasons";
      export { generateAllianceSaga } from "@/game/allianceSaga";
      export { mutatorFor } from "@/game/mutators";
      export { catalogEntryFor, THEME_PRIMARY } from "@/game/seasonCatalog";
      export { chronicleGenRules } from "@/game/chronicleGen";
      export { passGenRules } from "@/game/passGen";
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

const shift = (monthId, d) => {
  const [y, m] = monthId.split("-").map(Number);
  const k = y * 12 + (m - 1) + d;
  return `${Math.floor(k / 12)}-${String((k % 12) + 1).padStart(2, "0")}`;
};
const monthList = Array.from({ length: months }, (_, i) => shift(from, i));
const NOW = Date.UTC(Number(from.slice(0, 4)), Number(from.slice(5, 7)) - 2, 20, 12);

/** Petit générateur pseudo-aléatoire (mulberry32) pour les serveurs bruités. */
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function digest(p, monthId) {
  const has = Object.keys(p.weeklyMedian).length > 0;
  return {
    monthId,
    observedDays: has ? 20 : 0,
    activePlayers: p.activePlayers,
    weeklyMedian: p.weeklyMedian,
    totals: has ? Object.fromEntries(Object.entries(p.weeklyMedian).map(([k, v]) => [k, Math.round(v * 4 * p.activePlayers)])) : {},
    heroes: has ? { victory: { pseudo: "Nova", count: 12 }, mission: { pseudo: "Kaz", count: 40 } } : {},
    episodes: [],
    passMedianTier: has ? 18 : 0,
    passTiers: 30,
    passFinishedShare: has ? 0.3 : 0,
    chapterShare: has ? 0.4 : 0,
    passPace: p.passPace,
    allianceSizeMedian: has ? 4 : undefined,
  };
}

const distinctShare = (xs) => (xs.length ? new Set(xs).size / xs.length : 1);
const firstRepeat = (ids, values) => {
  const seen = new Set();
  for (let i = 0; i < values.length; i++) {
    if (seen.has(values[i])) return ids[i];
    seen.add(values[i]);
  }
  return null;
};
const minSliding = (xs, w) => (xs.length < w ? new Set(xs).size : Math.min(...xs.slice(0, xs.length - w + 1).map((_, i) => new Set(xs.slice(i, i + w)).size)));
const minGap = (xs) => {
  let gap = Infinity;
  const last = new Map();
  xs.forEach((x, i) => {
    if (x !== null && last.has(x)) gap = Math.min(gap, i - last.get(x));
    if (x !== null) last.set(x, i);
  });
  return gap === Infinity ? null : gap;
};
const stats = (xs) => {
  const v = xs.filter((x) => x !== null).sort((a, b) => a - b);
  if (!v.length) return { min: null, median: null, max: null, never: xs.length };
  return { min: v[0], median: v[Math.floor(v.length / 2)], max: v[v.length - 1], never: xs.length - v.length };
};

/** Une simulation complète sur un profil (contenu déjà appliqué). */
function simulate(p) {
  const gen = E.chronicleGenRules();
  const pg = E.passGenRules();
  const chapters = [];
  for (const m of monthList) chapters.push(E.generateChapter({ monthId: m, digest: digest(p, shift(m, -1)), existing: [...chapters], now: NOW }));
  const y1 = chapters.slice(0, 12);
  const lines = y1.flatMap((c) => c.episodes.flatMap((e) => e.lines.map((l) => l.text)));
  const epTitles = y1.flatMap((c) => c.episodes.map((e) => e.title));
  const hasData = Object.keys(p.weeklyMedian).length > 0;
  const lowEpisodes = hasData ? chapters.flatMap((c) => c.episodes.filter((e) => (p.weeklyMedian[e.objective.type] ?? 0) < gen.stretchMinWeekly && !String(e.objective.type).includes(":"))) : [];
  const zeroEpisodes = hasData ? chapters.flatMap((c) => c.episodes.filter((e) => (p.weeklyMedian[e.objective.type] ?? 0) === 0 && !String(e.objective.type).includes(":"))) : [];
  const factions = chapters.map((c) => c.auto?.archetype ?? "?");
  const chron = {
    factions12: factions.slice(0, 12).join(" "),
    factionMax12: Math.max(...Object.values(factions.slice(0, 12).reduce((a, f) => ((a[f] = (a[f] ?? 0) + 1), a), {}))),
    chapterTitles: `${new Set(chapters.map((c) => c.title)).size}/${chapters.length}`,
    firstTitleRepeat: firstRepeat(monthList, chapters.map((c) => c.title)),
    bossImages: new Set(chapters.map((c) => c.boss.image)).size,
    lines12: `${new Set(lines).size}/${lines.length} (${Math.round(distinctShare(lines) * 100)} %)`,
    episodeTitles12: `${new Set(epTitles).size}/${epTitles.length}`,
    lowEpisodes: `${lowEpisodes.length}/${chapters.length * 4}`,
    zeroEpisodes: `${zeroEpisodes.length}/${chapters.length * 4}`,
  };

  const passes = monthList.map((m) => E.generatePassSeason({ monthId: m, digest: digest(p, shift(m, -1)), existing: [], now: NOW }));
  const names = passes.map((s) => s.theme.name);
  const cmd = passes.map((s) => s.commander.name);
  const pairs = passes.map((s) => `${s.commander.primary}+${s.commander.secondary}`);
  const msLines = passes.flatMap((s) => s.scenario.milestones.flatMap((x) => x.lines.map((l) => l.text)));
  const paces = passes.map((s) => s.auto?.pace ?? E.passPaceCheck(s, digest(p, s.id)));
  const pass = {
    names: `${new Set(names).size}/${names.length}`,
    firstNameRepeat: firstRepeat(monthList, names),
    commanders: `${new Set(cmd).size}/${cmd.length}`,
    rolePairs: `${new Set(pairs).size}/${pairs.length}`,
    milestoneLines: `${new Set(msLines).size}/${msLines.length}`,
    medianDay: stats(paces.map((x) => x.medianDay)),
    topDay: stats(paces.map((x) => x.topDay)),
    medianLate: paces.filter((x) => x.medianDay === null || x.medianDay > pg.latestMedianDay).length,
    topEarly: paces.filter((x) => x.topDay !== null && x.topDay < pg.targetTopDay).length,
    // 6.14.150 (AP-11) : jour du dernier palier de prestige du plus actif (absent : prestige désactivé).
    ...(() => {
      const days = passes.map((s, i) => E.prestigeDay(s, paces[i].topDay, E.topPointsPerDay(digest(p, s.id))));
      return days.some((x) => x === undefined) ? {} : { topPrestigeDay: stats(days) };
    })(),
  };

  // 6.14.148 (AP-L6) : la saga lit le chapitre du mois et les titres des sagas précédentes, comme le serveur.
  const sagas = [];
  monthList.forEach((m, i) => sagas.push(E.generateAllianceSaga(m, digest(p, shift(m, -1)), 1, NOW, { chapter: chapters[i], recentTitles: sagas.map((s) => s.title) })));
  const sagaTitles = sagas.map((s) => s.title);
  const saga = {
    consecutiveTitleRepeats: sagaTitles.filter((t, i) => i > 0 && t === sagaTitles[i - 1]).length,
    sameFactionAsChapter: `${sagas.filter((s, i) => s.accent === chapters[i].theme.accent).length}/${sagas.length}`,
  };

  const muts = monthList.map((m) => E.mutatorFor(m)?.id ?? null);
  const mutators = { distinctMin12: minSliding(muts, 12), minGap: minGap(muts), list: muts.slice(0, 12).join(" ") };
  return { chroniques: chron, passe: pass, saga, mutateurs: mutators };
}

function runSide(settings) {
  E.applyGameContent(settings);
  const out = {};
  const wanted = profileArg === "all" ? ["reel", "typique", "vide", "bruite"] : [profileArg];
  for (const id of wanted) {
    if (id === "bruite") {
      // Serveurs bruités : médianes du profil réel × 0,5 à 1,5 ; faisabilité du passe agrégée.
      const r = rng(20261007);
      const late = [];
      const medDays = [];
      for (let s = 0; s < servers; s++) {
        const k = () => 0.5 + r();
        const p = { ...PROFILES.reel, weeklyMedian: Object.fromEntries(Object.entries(PROFILES.reel.weeklyMedian).map(([a, v]) => [a, Math.round(v * k() * 10) / 10])), passPace: { median: Math.round(63 * k()), top: Math.round(171 * k()) } };
        const m = monthList[0];
        const pace = E.generatePassSeason({ monthId: m, digest: digest(p, shift(m, -1)), existing: [], now: NOW }).auto?.pace;
        medDays.push(pace?.medianDay ?? null);
        if (!pace || pace.medianDay === null || pace.medianDay > E.passGenRules().latestMedianDay) late.push(s);
      }
      out.bruite = { label: `bruité (${servers} serveurs, ${monthList[0]})`, passe: { medianDay: stats(medDays), medianLate: `${late.length}/${servers}` } };
      continue;
    }
    const p = PROFILES[id];
    if (!p) throw new Error(`Profil inconnu : ${id}`);
    out[id] = { label: p.label, ...simulate(p) };
  }
  return out;
}

const after = runSide(loadSettings(rulesArg));
const before = baseArg ? runSide(loadSettings(baseArg)) : null;

if (asJson) {
  console.log(JSON.stringify(before ? { avant: before, apres: after } : after, null, 1));
} else {
  const show = (label, side) => {
    console.log(`\n=== ${label} : ${months} mois à partir de ${from} ===`);
    for (const [, r] of Object.entries(side)) {
      console.log(`\n# ${r.label}`);
      for (const [k, v] of Object.entries(r)) {
        if (k === "label") continue;
        console.log(`  ${k}`);
        for (const [m, x] of Object.entries(v)) console.log(`    ${m.padEnd(26)} ${typeof x === "object" && x !== null ? JSON.stringify(x) : x}`);
      }
    }
  };
  if (before) show(`avant (${baseArg})`, before);
  show(rulesArg ? `après (${rulesArg})` : "après (règles du code)", after);
}
