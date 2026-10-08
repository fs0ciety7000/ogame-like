// 6.14.39 (É30-2) : performance mesurée sur la pré-prod (Z6). Chargement à froid de chaque page, 375 px et bureau.
//
//   node scripts/preprod-perf.mjs [--runs 3] [/game /game/galaxie …]
//   PERF_FRONT_URL=http://127.0.0.1:4173 PREPROD_PB_URL=http://127.0.0.1:8090 … node scripts/preprod-perf.mjs   # build local (6.14.116)
//
// Variables : PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD (docs/preprod.md §6). Compte « claude_capture »
// (mot de passe tiré au hasard, gardé nulle part). Refuse toute adresse qui n'est pas un serveur de test.
//
// Profils : « mobile » = 375 px, processeur ralenti ×4, réseau 4G lente (150 ms, 1,6 Mbit/s), comme Lighthouse ;
//           « bureau » = 1440 px, sans ralentissement.
// Mesures (médiane des passages) : JavaScript et total reçus (compressés) jusqu'au calme du réseau après « prêt », FCP, LCP, temps bloquant jusqu'à « prêt » (tâches > 50 ms),
// stabilité (CLS, PERF_SHIFTS=1 affiche les éléments qui bougent ; PERF_LCP=1 : l'élément retenu pour le LCP) et « prêt » = premier titre de page visible. Seuils : ceux des Web Vitals (serverMetrics.ts : LCP bon < 2,5 s, mauvais > 4 s).
import PocketBase from "pocketbase";
import { chromium } from "playwright";
import { randomBytes } from "node:crypto";

const { PREPROD_PB_URL: URL_, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD } = process.env;
// 6.14.116 (É30-5) : mesure locale d'un build (`vite preview`) : PERF_FRONT_URL = adresse du front, PREPROD_PB_URL = PocketBase local.
const FRONT = (process.env.PERF_FRONT_URL || URL_ || "").replace(/\/$/, "");
const argv = process.argv.slice(2);
const runsAt = argv.indexOf("--runs");
const RUNS = runsAt >= 0 ? Number(argv[runsAt + 1]) || 3 : 3;
const paths = argv.filter((a, i) => a.startsWith("/") && i !== runsAt + 1);
const PAGES = paths.length ? paths : ["/", "/game", "/game/galaxie", "/game/succes", "/game/codex", "/game/simulateur", "/game/admin"];
if (!URL_ || !PREPROD_PB_ADMIN_EMAIL || !PREPROD_PB_ADMIN_PASSWORD) {
  console.error("Renseigne PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL et PREPROD_PB_ADMIN_PASSWORD.");
  process.exit(1);
}
const host = new URL(URL_).hostname;
if (!/(^|[.-])(test|preprod)([.-]|$)/.test(host) && host !== "127.0.0.1" && host !== "localhost") {
  console.error(`Refusé : ${URL_} n'est pas un serveur de test.`);
  process.exit(1);
}

const admin = new PocketBase(URL_);
admin.autoCancellation(false);
await admin.collection("_superusers").authWithPassword(PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD);
const pw = randomBytes(12).toString("hex");
let user = await admin.collection("users").getFirstListItem('username="claude_capture"').catch(() => null);
if (user) await admin.collection("users").update(user.id, { password: pw, passwordConfirm: pw });
else user = await admin.collection("users").create({ username: "claude_capture", name: "ClaudeCapture", email: "claude-capture@test.invalid", emailVisibility: false, password: pw, passwordConfirm: pw, verified: true });
const pb = new PocketBase(URL_);
const auth = await pb.collection("users").authWithPassword(user.email, pw);
const stored = JSON.stringify({ token: pb.authStore.token, record: auth.record });

const PROFILES = [
  { name: "mobile", viewport: { width: 375, height: 812 }, cpu: 4, net: { latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 } },
  { name: "bureau", viewport: { width: 1440, height: 900 }, cpu: 1, net: null },
];

// 6.14.116 : PERF_PROFILES=mobile ou bureau pour un seul profil.
if (process.env.PERF_PROFILES) PROFILES.splice(0, PROFILES.length, ...PROFILES.filter((p) => process.env.PERF_PROFILES.split(",").includes(p.name)));

const median = (xs) => {
  const s = xs.filter((x) => Number.isFinite(x)).sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : NaN;
};

async function measure(browser, profile, path) {
  const ctx = await browser.newContext({ viewport: profile.viewport });
  await ctx.addInitScript((s) => {
    localStorage.setItem("cosmic-empires:theme", "constellation");
    if (location.pathname !== "/") localStorage.setItem("pocketbase_auth", s);
    window.__perf = { lcp: 0, tbt: 0, cls: 0, shifts: [] };
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__perf.cls += e.value;
        // Éléments qui bougent le plus (pour trouver la cause).
        const src = e.sources?.[0]?.node;
        if (src && e.value > 0.01) window.__perf.shifts.push(`${Math.round(e.value * 1000) / 1000} ${src.nodeName}.${String(src.className || "").slice(0, 60)}`);
      }
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) {
        window.__perf.lcp = e.startTime;
        // 6.14.116 (É30-5) : élément retenu pour le LCP (PERF_LCP=1 l'affiche).
        const n = e.element;
        window.__perf.lcpEl = n ? `${n.nodeName}.${String(n.className || "").slice(0, 50)} ${String(e.url || "").split("/").pop()} ${Math.round(e.size)}px²` : "?";
      }
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__perf.tbt += Math.max(0, e.duration - 50);
    }).observe({ type: "longtask", buffered: true });
  }, stored);
  await ctx.route(/(base|empire)\.fs0ciety\.org/, (r) => r.abort());
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Network.enable");
  // Octets reçus (compressés) comptés par le navigateur : JavaScript seul, et tout le reste, jusqu'à « prêt ».
  const kinds = new Map();
  const bytes = { js: 0, jsCount: 0, all: 0, frozen: false };
  cdp.on("Network.responseReceived", (e) => kinds.set(e.requestId, /javascript/.test(e.response.mimeType) || /\.js(\?|$)/.test(e.response.url)));
  cdp.on("Network.loadingFinished", (e) => {
    if (bytes.frozen) return;
    bytes.all += e.encodedDataLength;
    if (kinds.get(e.requestId)) {
      bytes.js += e.encodedDataLength;
      bytes.jsCount++;
    }
  });
  await cdp.send("Network.setCacheDisabled", { cacheDisabled: true });
  if (profile.net) await cdp.send("Network.emulateNetworkConditions", { offline: false, ...profile.net });
  if (profile.cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.cpu });
  const t0 = Date.now();
  await page.goto(FRONT + path, { waitUntil: "load", timeout: 120000 });
  // « Prêt » : un titre de page (h1 ou h2) visible, hors écran de chargement.
  let ready = NaN;
  let tbtAtReady = NaN;
  try {
    await page.locator("h1:visible, h2:visible").first().waitFor({ state: "visible", timeout: 60000 });
    ready = Date.now() - t0;
    tbtAtReady = await page.evaluate(() => window.__perf.tbt);
    await page.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {});
  } catch {
    /* pas de titre : on garde NaN */
  }
  bytes.frozen = true;
  const r = await page.evaluate(() => ({
    fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? NaN,
    lcp: window.__perf.lcp || NaN,
    cls: window.__perf.cls,
    shifts: window.__perf.shifts.slice(0, 3),
    lcpEl: window.__perf.lcpEl,
  }));
  if (process.env.PERF_SHIFTS && r.shifts.length) console.error(`${profile.name} ${path} : ${r.shifts.join(" | ")}`);
  if (process.env.PERF_LCP) console.error(`${profile.name} ${path} : LCP ${Math.round(r.lcp)} ms sur ${r.lcpEl}`);
  await ctx.close();
  return { ...r, tbt: tbtAtReady, ready, js: bytes.js, jsCount: bytes.jsCount, all: bytes.all };
}

const browser = await chromium.launch();
const rows = [];
for (const profile of PROFILES) {
  for (const path of PAGES) {
    const runs = [];
    for (let i = 0; i < RUNS; i++) runs.push(await measure(browser, profile, path));
    const m = (k) => median(runs.map((x) => x[k]));
    const lcp = m("lcp");
    const row = {
      profil: profile.name,
      page: path,
      "JS (Ko)": Math.round(m("js") / 1024),
      fichiers: m("jsCount"),
      "total (Ko)": Math.round(m("all") / 1024),
      "FCP (ms)": Math.round(m("fcp")),
      "LCP (ms)": Math.round(lcp),
      "prêt (ms)": Math.round(m("ready")),
      "bloquant (ms)": Math.round(m("tbt")),
      CLS: Math.round(m("cls") * 1000) / 1000,
      LCP: !Number.isFinite(lcp) ? "?" : lcp <= 2500 ? "bon" : lcp <= 4000 ? "à surveiller" : "mauvais",
    };
    rows.push(row);
    // Ligne affichée aussitôt : une mesure interrompue garde ses résultats.
    console.error(JSON.stringify(row));
  }
}
await browser.close();
console.table(rows);
console.log(JSON.stringify(rows));
