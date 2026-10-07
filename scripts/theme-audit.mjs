// 6.14.90 (AU28) : audit visuel des 13 thèmes. Captures 375 et 1440 px d'un échantillon de pages, puis mesures dans la page :
// contraste réel des textes (couleurs calculées, fonds composés), textes sous 11 px, débordement horizontal, éléments coupés à
// droite, textes tronqués, coins des cibles tactiles (clip-path), couleurs de sens présentes à l'écran.
//
// Montage isolé (jamais la production, jamais le port 8090 de l'intégration) :
//   .pb/pocketbase serve --http 127.0.0.1:8094 --dir <scratchpad>/pb/data --hooksDir <copie de pocketbase/pb_hooks>
//   PB_URL=http://127.0.0.1:8094 … node pocketbase/setup.mjs ; deux comptes (joueur, admin du jeu : collection admins)
//   VITE_POCKETBASE_URL=http://127.0.0.1:8094 npx vite build --outDir <scratchpad>/dist && npx vite preview --outDir <scratchpad>/dist --port 4194
//
//   AUDIT_PLAYER=themejoueur AUDIT_ADMIN=themeadmin AUDIT_PASSWORD=… AUDIT_OUT=<scratchpad>/themes \
//     node scripts/theme-audit.mjs [thème…]        # tous les thèmes sans argument ; ONLY=batiments-mobile pour une capture
//
// Sortie : <AUDIT_OUT>/<thème>/<page>-<mobile|desktop>.png et measures.json (fusionné avec le précédent).
// Le thème est posé par addInitScript (localStorage « cosmic-empires:theme ») avant chaque chargement.
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { chromium } from "playwright";
import PocketBase from "pocketbase";

const FRONT = process.env.AUDIT_FRONT ?? "http://127.0.0.1:4194";
const PB = process.env.AUDIT_PB ?? "http://127.0.0.1:8094";
const OUT = process.env.AUDIT_OUT ?? "theme-audit";
const { AUDIT_PLAYER, AUDIT_ADMIN, AUDIT_PASSWORD } = process.env;
for (const u of [FRONT, PB]) {
  const host = new URL(u).hostname;
  if (host !== "127.0.0.1" && host !== "localhost" && !/(^|[.-])(test|preprod)([.-]|$)/.test(host)) {
    console.error(`Refusé : ${u} n'est pas un serveur local ou de test.`);
    process.exit(1);
  }
}
if (!AUDIT_PLAYER || !AUDIT_ADMIN || !AUDIT_PASSWORD) {
  console.error("Renseigne AUDIT_PLAYER, AUDIT_ADMIN et AUDIT_PASSWORD (comptes de test).");
  process.exit(1);
}
const ALL = ["tactique", "holo", "cockpit", "netrunner", "aurora", "signal", "voyageur", "omni", "spartan", "constellation", "ishimura", "atlas", "matrice"];
const themes = process.argv.slice(2).length ? process.argv.slice(2) : ALL;

async function authFor(user) {
  const pb = new PocketBase(PB);
  const auth = await pb.collection("users").authWithPassword(user, AUDIT_PASSWORD);
  return JSON.stringify({ token: pb.authStore.token, record: auth.record });
}
async function newCtx(browser, theme, width, stored) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 800 ? 812 : 900 }, reducedMotion: "reduce" });
  await ctx.addInitScript(([t, s]) => {
    localStorage.setItem("cosmic-empires:theme", t);
    if (s) localStorage.setItem("pocketbase_auth", s);
  }, [theme, stored]);
  await ctx.route(/fs0ciety\.org/, (r) => r.abort());
  return ctx;
}
async function dismiss(page) {
  for (let i = 0; i < 6 && (await page.getByRole("dialog").count()); i++) {
    const later = page.getByRole("dialog").getByRole("button", { name: /plus tard|fermer|passer|compris|ignorer|c'est parti|continuer|close/i });
    if (await later.count()) await later.first().click({ timeout: 2000 }).catch(() => {});
    else await page.keyboard.press("Escape");
    await page.waitForTimeout(600);
  }
}

/** Mesures évaluées dans la page. */
const measure = () => {
  const vw = document.documentElement.clientWidth, vh = window.innerHeight;
  const root = getComputedStyle(document.documentElement);
  const tok = (n) => root.getPropertyValue("--th-" + n).trim();
  const parse = (s) => {
    if (!s) return null;
    let m = s.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)/);
    if (m) { let a = m[4] === undefined ? 1 : (m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4])); return [+m[1], +m[2], +m[3], a]; }
    m = s.match(/color\(srgb\s+([\d.e-]+)\s+([\d.e-]+)\s+([\d.e-]+)(?:\s*\/\s*([\d.]+%?))?\)/);
    if (m) { let a = m[4] === undefined ? 1 : (m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4])); return [m[1] * 255, m[2] * 255, m[3] * 255, a]; }
    m = s.match(/#([0-9a-f]{6})/i);
    if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16), 1];
    return null;
  };
  const firstColor = (img) => {
    const m = img.match(/(rgba?\([^)]*\)|color\(srgb[^)]*\)|#[0-9a-f]{6})/i);
    return m ? parse(m[1]) : null;
  };
  const over = (top, bot) => { const a = top[3]; return [top[0] * a + bot[0] * (1 - a), top[1] * a + bot[1] * (1 - a), top[2] * a + bot[2] * (1 - a), 1]; };
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const base = parse(tok("space-950")) || [0, 0, 0, 1];
  const scan = parseFloat(tok("scan")) || 0;
  const bgOf = (el) => {
    const layers = [];
    let opacity = 1;
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const st = getComputedStyle(e);
      opacity *= parseFloat(st.opacity);
      let c = parse(st.backgroundColor);
      if ((!c || c[3] === 0) && st.backgroundImage && st.backgroundImage !== "none" && /gradient/.test(st.backgroundImage) && e.tagName !== "BODY") {
        const f = firstColor(st.backgroundImage);
        if (f && f[3] > 0.3) c = f;
      }
      if (c && c[3] > 0) { layers.push(c); if (c[3] >= 0.99) break; }
    }
    let bg = base;
    for (let i = layers.length - 1; i >= 0; i--) bg = over(layers[i], bg);
    return { bg, opacity };
  };
  const sense = {};
  for (const k of ["accent", "accent2", "ok", "danger", "gold", "ember", "text-100", "text-400", "text-500", "text-600"]) sense[k] = parse(tok(k));
  const near = (c, t) => t && Math.abs(c[0] - t[0]) + Math.abs(c[1] - t[1]) + Math.abs(c[2] - t[2]) < 6;
  const desc = (el) => el.tagName.toLowerCase() + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 4).join(".") : "");
  let total = 0, low = 0, lowFirst = 0, totalFirst = 0, small = 0, gradText = 0, scanLow = 0;
  const lows = [], smalls = [], senseCount = {}, senseFirst = {};
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("[aria-hidden='true'], svg, canvas, script, style, noscript")) continue;
    let own = "";
    for (const n of el.childNodes) if (n.nodeType === 3) own += n.textContent;
    own = own.trim();
    if (!own) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const st = getComputedStyle(el);
    if (st.visibility === "hidden" || st.display === "none") continue;
    const disabled = !!el.closest("[disabled], [aria-disabled='true']");
    const inFirst = r.top < vh && r.bottom > 0 && r.left < vw && r.right > 0;
    const fs = parseFloat(st.fontSize);
    if (fs < 11) { small++; if (smalls.length < 6) smalls.push(`${fs}px « ${own.slice(0, 30)} » ${desc(el)}`); }
    if (st.backgroundClip === "text" || st.webkitBackgroundClip === "text") { gradText++; continue; }
    let col = parse(st.color);
    if (!col || col[3] === 0) { gradText++; continue; }
    const { bg, opacity } = bgOf(el);
    const eff = over([col[0], col[1], col[2], col[3] * opacity], bg);
    const cr = ratio(eff, bg);
    const large = fs >= 24 || (fs >= 18.6 && parseInt(st.fontWeight) >= 700);
    const need = large ? 3 : 4.5;
    for (const [k, t] of Object.entries(sense)) if (near(col, t)) { senseCount[k] = (senseCount[k] || 0) + 1; if (inFirst) senseFirst[k] = (senseFirst[k] || 0) + 1; }
    if (disabled) continue;
    total++; if (inFirst) totalFirst++;
    if (cr < need) {
      low++; if (inFirst) lowFirst++;
      lows.push({ cr: +cr.toFixed(2), t: own.slice(0, 32), d: desc(el), fs, col: st.color, first: inFirst });
    } else if (scan > 0 && el.closest(".glass-panel")) {
      const bg2 = over([255, 255, 255, scan], bg);
      const eff2 = over([255, 255, 255, scan], eff);
      if (ratio(eff2, bg2) < need) scanLow++;
    }
  }
  lows.sort((a, b) => a.cr - b.cr);
  // Débordement horizontal et éléments coupés à droite.
  const scrollW = document.documentElement.scrollWidth;
  const cut = [];
  const scrollsX = (el) => { for (let p = el.parentElement; p; p = p.parentElement) { const ox = getComputedStyle(p).overflowX; if ((ox === "auto" || ox === "scroll") && p.scrollWidth > p.clientWidth) return true; } return false; };
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("[aria-hidden='true'], canvas, svg")) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || r.right <= vw + 1) continue;
    const st = getComputedStyle(el);
    if (st.position === "fixed" || st.visibility === "hidden") continue;
    if (scrollsX(el)) continue;
    if (cut.some((o) => o.el.contains(el))) continue;
    cut.push({ el, d: `${desc(el)} (droite ${Math.round(r.right)})` });
  }
  // Textes tronqués (overflow caché sans ellipse).
  let trunc = 0; const truncs = [];
  for (const el of document.body.querySelectorAll("*")) {
    const st = getComputedStyle(el);
    if (!(st.overflowX === "hidden" || st.overflowX === "clip")) continue;
    if (el.scrollWidth <= el.clientWidth + 2 || st.textOverflow === "ellipsis") continue;
    if (!el.textContent.trim() || el.closest("[aria-hidden='true']")) continue;
    if (el.clientWidth === 0) continue;
    if (el.children.length > 3) continue;
    trunc++; if (truncs.length < 5) truncs.push(`« ${el.textContent.trim().slice(0, 30)} » ${desc(el)} ${el.scrollWidth}>${el.clientWidth}`);
  }
  // clip-path : zones tactiles coupées (premier écran).
  let inter = 0, cornerCut = 0, textCut = 0; const clipS = [];
  const hit = (el, x, y) => { if (x < 0 || y < 0 || x >= vw || y >= vh) return true; const h = document.elementFromPoint(x, y); return !h || h === el || el.contains(h) || h.contains(el); };
  for (const el of document.querySelectorAll("button, a[href], [role='button'], [role='tab'], input, select")) {
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4 || r.top < 0 || r.bottom > vh || r.left < 0 || r.right > vw) continue;
    if (el.closest("[aria-hidden='true']")) continue;
    if (!hit(el, r.left + r.width / 2, r.top + r.height / 2)) continue; // couvert par autre chose
    inter++;
    const pts = [[r.left + 2, r.top + 2], [r.right - 2, r.top + 2], [r.left + 2, r.bottom - 2], [r.right - 2, r.bottom - 2]];
    const miss = pts.filter(([x, y]) => !hit(el, x, y)).length;
    if (miss) cornerCut++;
    const range = document.createRange(); range.selectNodeContents(el);
    const tr = range.getBoundingClientRect();
    if (tr.width > 2 && tr.height > 2 && (getComputedStyle(el).clipPath !== "none" || el.closest(".glass-panel"))) {
      const tp = [[tr.left + 1, tr.top + 1], [tr.right - 1, tr.top + 1], [tr.left + 1, tr.bottom - 1], [tr.right - 1, tr.bottom - 1]].filter(([x, y]) => x > r.left && x < r.right && y > r.top && y < r.bottom);
      if (tp.some(([x, y]) => !hit(el, x, y))) { textCut++; if (clipS.length < 5) clipS.push(`« ${el.textContent.trim().slice(0, 24)} » ${desc(el)}`); }
    }
  }
  return {
    vw, scrollW, hscroll: scrollW > vw + 1, total, low, lowPct: total ? +(100 * low / total).toFixed(1) : 0, totalFirst, lowFirst,
    lows: lows.slice(0, 10), lowByCol: lows.reduce((a, l) => { const k = l.col + " " + l.cr; a[k] = (a[k] || 0) + 1; return a; }, {}), small, smalls, gradText, scan, scanLow, cut: cut.map((c) => c.d).slice(0, 6), cutN: cut.length, trunc, truncs,
    inter, cornerCut, textCut, clipS, senseCount, senseFirst,
  };
};

const joueur = await authFor(AUDIT_PLAYER);
const admin = await authFor(AUDIT_ADMIN);
// Le compte joueur a besoin d'un peu d'Ambre pour ouvrir la confirmation du don (Primes → Comptoir de la Ruche).
const PAGES = [
  ["accueil-public", "/", null],
  ["game", "/game", joueur],
  ["batiments", "/game/batiments", joueur],
  ["galaxie", "/game/galaxie", joueur],
  ["alliance", "/game/alliance", joueur],
  ["passe", "/game/passe", joueur],
  ["codex", "/game/codex", joueur],
  ["confirmation", "/game/primes", joueur, async (p) => {
    await p.getByRole("tab", { name: /Comptoir de la Ruche/i }).first().click();
    await p.waitForTimeout(1200);
    const btn = p.getByRole("button", { name: /^Verser$/ }).first();
    await btn.scrollIntoViewIfNeeded();
    await btn.click();
    await p.waitForTimeout(900);
  }],
  ["toast", "/game/reglages", joueur, async (p) => {
    await p.locator('input[name="currentPassword"]').fill(AUDIT_PASSWORD);
    await p.locator('input[name="newPassword"]').fill("Nouveau-Mot2passe!x");
    await p.locator('input[name="confirmPassword"]').fill("Autre-Mot2passe!y");
    await p.getByRole("button", { name: /Mettre à jour/ }).click();
    await p.waitForTimeout(700);
  }],
  ["menu-plus", "/game", joueur, async (p) => {
    await p.getByRole("button", { name: /^Plus$/ }).click();
    await p.waitForTimeout(900);
  }, "mobile"],
  ["admin-regles", "/game/admin", admin, async (p) => {
    await p.getByRole("tab", { name: /Règles/ }).or(p.getByRole("button", { name: /^Règles/ })).first().click();
    await p.waitForTimeout(1500);
  }],
];

const browser = await chromium.launch();
for (const theme of themes) {
  mkdirSync(`${OUT}/${theme}`, { recursive: true });
  let res = {};
  try {
    res = JSON.parse(readFileSync(`${OUT}/${theme}/measures.json`, "utf8"));
  } catch {
    /* première mesure */
  }
  for (const [name, w] of [["mobile", 375], ["desktop", 1440]]) {
    for (const [slug, path, stored, act, only] of PAGES) {
      if (only && only !== name) continue;
      if (process.env.ONLY && !process.env.ONLY.split(",").includes(`${slug}-${name}`)) continue;
      const ctx = await newCtx(browser, theme, w, stored);
      const p = await ctx.newPage();
      try {
        await p.goto(FRONT + path, { waitUntil: "load", timeout: 30000 });
        await p.waitForTimeout(2500);
        await p.waitForFunction(() => !/Synchronisation de l|Connexion au réseau/.test(document.body.innerText), null, { timeout: 25000 }).catch(() => {});
        await p.waitForTimeout(2500);
        await dismiss(p);
        if (act) await act(p);
        await p.screenshot({ path: `${OUT}/${theme}/${slug}-${name}.png` });
        res[`${slug}-${name}`] = await p.evaluate(measure);
      } catch (e) {
        res[`${slug}-${name}`] = { error: String(e).slice(0, 200) };
      }
      await ctx.close();
    }
  }
  writeFileSync(`${OUT}/${theme}/measures.json`, JSON.stringify(res, null, 1));
  const ok = Object.values(res).filter((v) => !v.error);
  const total = ok.reduce((a, v) => a + v.total, 0);
  const low = ok.reduce((a, v) => a + v.low, 0);
  console.log(`${theme} : ${low}/${total} textes sous le seuil AA (${((100 * low) / Math.max(1, total)).toFixed(1)} %), défilement horizontal : ${ok.filter((v) => v.hscroll).length}, sous 11 px : ${ok.reduce((a, v) => a + v.small, 0)}`);
}
await browser.close();
