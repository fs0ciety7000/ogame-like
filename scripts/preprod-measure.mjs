// 6.14.16 (lot Z1) : mesures sur la pré-prod (copie de la production), en LECTURE seule.
//
//   node scripts/preprod-measure.mjs [fichier.json]
//
// Variables : PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD (docs/preprod.md §6).
// Ne sort que des agrégats anonymes (effectifs, médianes, quartiles, parts) : aucun pseudo, aucun identifiant.
// Complète le rapport du serveur (`/api/cosmic/admin/balance`, onglet Équilibrage) par ce qu'il ne calcule pas :
// passe (points, paliers, activité par source), lunes, colonies, classes, succès, Codex, reliques, série.
// La copie fige l'état de la production : on mesure des états, pas des rythmes (voir docs/audit/2026-10-07-z1-mesures.md).
import PocketBase from "pocketbase";
import { writeFileSync } from "node:fs";

const { PREPROD_PB_URL: URL_, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD } = process.env;
if (!URL_ || !PREPROD_PB_ADMIN_EMAIL || !PREPROD_PB_ADMIN_PASSWORD) {
  console.error("Renseigne PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL et PREPROD_PB_ADMIN_PASSWORD.");
  process.exit(1);
}
const host = new URL(URL_).hostname;
if (!/(^|[.-])(test|preprod)([.-]|$)/.test(host) && host !== "127.0.0.1" && host !== "localhost") {
  console.error(`Refusé : ${URL_} n'est pas un serveur de test.`);
  process.exit(1);
}

const pb = new PocketBase(URL_);
pb.autoCancellation(false);
await pb.collection("_superusers").authWithPassword(PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD);

const q = (xs, p) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.floor(p * (s.length - 1) + 0.5))];
};
const dist = (xs) => ({ n: xs.length, q1: q(xs, 0.25), median: q(xs, 0.5), q3: q(xs, 0.75), max: q(xs, 1) });
const share = (n, total) => (total ? Math.round((n / total) * 1000) / 10 : 0);
const count = (xs) => xs.reduce((acc, x) => ((acc[x] = (acc[x] ?? 0) + 1), acc), {});

const all = await pb.collection("players").getFullList({ batch: 500 });
const humans = all.filter((p) => !p.npc && !String(p.pseudo ?? "").startsWith("ClaudeCapture"));
// Instant de la copie : la dernière activité connue (le serveur de test n'a pas de vrais joueurs).
const snapshot = Math.max(...humans.map((p) => p.lastActiveMs ?? 0));
const DAY = 86_400_000;
const active = humans.filter((p) => snapshot - (p.lastActiveMs ?? 0) < 14 * DAY);

const pass = active.map((p) => p.seasonPass ?? {});
const passSeason = count(pass.map((s) => s.seasonId ?? "aucun"));
const activityTotals = {};
for (const s of pass) for (const [k, v] of Object.entries(s.activity ?? {})) activityTotals[k] = (activityTotals[k] ?? 0) + (Number(v) || 0);
const bySourceTotals = {};
for (const s of pass) for (const [k, v] of Object.entries(s.bySource ?? {})) bySourceTotals[k] = (bySourceTotals[k] ?? 0) + (Number(v) || 0);

// PRG-1 : points réels comparés à l'activité × barème en vigueur (missions à 0 depuis la 5.13, vendetta tracée « warlordWin »).
const PASS = { contract: 10, bounty: 8, raidRepelled: 8, victory: 8, bossAssault: 5, dailyLogin: 5, vendetta: 40, warlordWin: 40, chronicle: 40, seasonBoss: 60, allianceBoss: 40, allianceBossTry: 15, coalition: 50, allianceDaily: 15 };
const explained = pass.map((s) => Math.min(1200, Object.entries(s.activity ?? {}).reduce((t, [k, v]) => t + (PASS[k] ?? 0) * (Number(v) || 0), 0)));
const realPoints = pass.reduce((a, s) => a + (s.points ?? 0), 0);
const explainedPoints = explained.reduce((a, b) => a + b, 0);

const colonies = active.map((p) => (Array.isArray(p.colonies) ? p.colonies : []));
const stats = active.map((p) => p.stats ?? {});

const config = Object.fromEntries((await pb.collection("game_config").getFullList()).map((r) => [r.key, r.value ?? r.data ?? r]));
const bossHistory = (config.boss_history?.entries ?? config.boss_history ?? []);
const bossRows = Array.isArray(bossHistory) ? bossHistory : [];

const out = {
  snapshotDay: new Date(snapshot).toISOString().slice(0, 10),
  players: { total: humans.length, active14d: active.length, active7d: humans.filter((p) => snapshot - (p.lastActiveMs ?? 0) < 7 * DAY).length },
  xp: dist(active.map((p) => p.xp ?? 0)),
  playtimeHours: dist(active.map((p) => Math.round((p.playtimeSeconds ?? 0) / 3600))),
  pass: {
    seasons: passSeason,
    points: dist(pass.map((s) => s.points ?? 0)),
    tiersClaimed: dist(pass.map((s) => (s.claimed ?? []).length)),
    challengesCleared: dist(pass.map((s) => (s.cleared ?? []).length)),
    activityTotals,
    bySourceTotals,
    withFinishedAt: pass.filter((s) => s.finishedAtMs).length,
    realPoints,
    explainedPoints,
    unexplainedPct: share(Math.max(0, realPoints - explainedPoints), realPoints),
  },
  achievements: dist(active.map((p) => (p.unlockedAchievements ?? []).length)),
  codexCategoriesClaimed: dist(stats.map((s) => (s.codexClaimed ?? []).length)),
  moons: { withMoon: active.filter((p) => p.moon).length, levels: count(active.filter((p) => p.moon).map((p) => p.moon.level ?? 1)) },
  colonies: {
    perPlayer: dist(colonies.map((c) => c.length)),
    total: colonies.reduce((a, c) => a + c.length, 0),
    withBase: colonies.reduce((a, c) => a + c.filter((x) => x && (x.base || x.basedFleet)).length, 0),
  },
  empireClass: count(active.map((p) => p.empireClass?.id ?? p.empireClass ?? "aucune")),
  relics: dist(active.map((p) => (Array.isArray(p.relics?.items) ? p.relics.items.length : Array.isArray(p.relics) ? p.relics.length : 0))),
  ascensions: dist(active.map((p) => p.ascensions ?? 0)),
  streakBest: dist(active.map((p) => Math.floor(Number(p.streak?.best) || 0))),
  worldBossesKilledTypes: dist(stats.map((s) => (s.worldBossKilled ?? []).length)),
  bossHistory: { entries: bossRows.length, byKind: count(bossRows.map((b) => `${b.kind}:${b.won ? "abattu" : "survivant"}`)) },
};
out.pass.finishedShareActivePct = share(pass.filter((s) => (s.claimed ?? []).length >= 30).length, pass.length);

const json = JSON.stringify(out, null, 1);
if (process.argv[2]) writeFileSync(process.argv[2], json);
console.log(json);
