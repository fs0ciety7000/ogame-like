// 6.14.15 : captures d'écran d'une page du jeu sur la pré-prod (thème Constellation, 375 px et bureau).
//
//   node scripts/preprod-capture.mjs /game/codex <dossier de sortie> ["Onglet 1,Onglet 2"] ["Texte 1,Texte 2"]
//
// 6.14.93 : le 4e argument (textes séparés par des virgules) fait défiler jusqu'à chaque texte, après le dernier onglet, et
// ajoute une capture par texte (`<page>-vue-<texte>-<largeur>.png`) : contenu sous la ligne de flottaison.
//
// Variables : PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD (docs/preprod.md §6).
// Compte de capture : « claude_capture » (créé au premier lancement) ; son mot de passe est tiré au hasard à chaque
// lancement et n'est gardé nulle part. Refuse toute adresse qui n'est pas un serveur de test.
// Affiche, pour chaque largeur, les onglets visibles, la largeur de la page (défilement horizontal si > largeur) et,
// depuis 6.14.53 (AD-3), les éléments qui dépassent la fenêtre à droite même quand un parent en overflow-hidden
// les coupe (scrollWidth reste alors égal à la fenêtre et ne voit rien).
import PocketBase from "pocketbase";
import { chromium } from "playwright";
import { randomBytes } from "node:crypto";

const { PREPROD_PB_URL: URL_, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD } = process.env;
const [path = "/game", out = ".", tabsArg = "", scrollArg = ""] = process.argv.slice(2);
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

/** Éléments visibles dont le bord droit dépasse la fenêtre (hors décor aria-hidden et hors zone défilante voulue). */
const measureOverflow = () => {
  const vw = document.documentElement.clientWidth;
  const out = [];
  const scrollsX = (el) => {
    for (let p = el.parentElement; p; p = p.parentElement) {
      const ox = getComputedStyle(p).overflowX;
      if ((ox === "auto" || ox === "scroll") && p.scrollWidth > p.clientWidth) return true;
    }
    return false;
  };
  for (const el of document.body.querySelectorAll("*")) {
    if (el.closest("[aria-hidden='true'], canvas, svg")) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0 || r.right <= vw + 1) continue;
    const st = getComputedStyle(el);
    if (st.position === "fixed" || st.visibility === "hidden") continue;
    if (scrollsX(el)) continue;
    // On ne garde que l'élément le plus haut de chaque branche : ses enfants dépassent avec lui.
    if (out.some((o) => o.el.contains(el))) continue;
    const id = el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 3).join(".") : "");
    out.push({ el, desc: `${id} (droite ${Math.round(r.right)} px)` });
  }
  return out.map((o) => o.desc);
};

const browser = await chromium.launch();
const dismiss = async (page) => {
  // Fenêtres d'accueil d'un compte neuf (« Plus tard », « Fermer »…).
  for (let i = 0; i < 6 && (await page.getByRole("dialog").count()); i++) {
    const later = page.getByRole("button", { name: /plus tard|fermer|passer|compris|ignorer/i });
    if (await later.count()) await later.first().click({ timeout: 2000 }).catch(() => {});
    else await page.keyboard.press("Escape");
    await page.waitForTimeout(700);
  }
};
const slug = path.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "accueil";
for (const [name, viewport] of [["mobile", { width: 375, height: 812 }], ["desktop", { width: 1440, height: 900 }]]) {
  const ctx = await browser.newContext({ viewport });
  await ctx.addInitScript((s) => {
    localStorage.setItem("cosmic-empires:theme", "constellation");
    localStorage.setItem("pocketbase_auth", s);
  }, stored);
  // Jamais de requête vers la production depuis une capture.
  await ctx.route(/(base|empire)\.fs0ciety\.org/, (r) => r.abort());
  const page = await ctx.newPage();
  await page.goto(URL_ + path, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(8000);
  await dismiss(page);
  await page.screenshot({ path: `${out}/${slug}-${name}.png` });
  for (const tab of tabsArg.split(",").map((t) => t.trim()).filter(Boolean)) {
    const t = page.getByRole("tab", { name: new RegExp(tab, "i") });
    if (!(await t.count())) continue;
    await t.first().click();
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `${out}/${slug}-${tab.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${name}.png` });
  }
  for (const text of scrollArg.split(",").map((t) => t.trim()).filter(Boolean)) {
    const el = page.getByText(text, { exact: false }).first();
    if (!(await el.count())) continue;
    await el.scrollIntoViewIfNeeded().catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${out}/${slug}-vue-${text.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${name}.png` });
  }
  const width = await page.evaluate(() => document.documentElement.scrollWidth);
  const overflow = await page.evaluate(measureOverflow);
  console.log(`${name} : largeur ${width} px (fenêtre ${viewport.width}) | onglets : ${(await page.getByRole("tab").allInnerTexts()).join(" | ")}`);
  console.log(overflow.length ? `${name} : ${overflow.length} élément(s) coupé(s) à droite : ${overflow.slice(0, 8).join(" ; ")}` : `${name} : aucun élément coupé à droite`);
  await ctx.close();
}
await browser.close();
