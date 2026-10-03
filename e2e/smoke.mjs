// Parcours de fumée dans un vrai navigateur, contre un PocketBase de test
// (jamais la production : il crée un compte). Utilisé par la CI :
//   BASE_URL=http://localhost:4173 node e2e/smoke.mjs
// Inscrit un joueur, ouvre les pages principales (bureau puis téléphone) et
// échoue à la moindre erreur JavaScript, page vide ou débordement horizontal.
import { chromium } from "playwright";

const BASE_URL = process.env.BASE_URL ?? "http://localhost:4173";
const PAGES = ["", "ressources", "batiments", "unites", "labo", "missions", "galaxie", "colonies", "statistiques", "joueurs", "combats", "simulateur", "marche", "menaces", "leviathan", "palmares", "alliance", "messages", "journal", "profil", "succes", "nouveautes", "signalements", "reglages"];

const suffix = Date.now().toString(36);
const browser = await chromium.launch();
const failures = [];

try {
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));

  await page.goto(BASE_URL);
  await page.getByText("Nouveau joueur ? Crée ton empire").click();
  await page.getByPlaceholder("Nom du joueur").fill(`Smoke_${suffix}`);
  await page.getByPlaceholder("Email (pour récupérer ton compte)").fill(`smoke${suffix}@test.dev`);
  await page.getByPlaceholder("Mot de passe").fill("motdepasse1");
  await page.getByRole("button", { name: "Créer mon empire" }).click();
  await page.waitForURL("**/game**", { timeout: 20_000 });

  for (const [label, width] of [["bureau", 1400], ["téléphone", 390]]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of PAGES) {
      const before = errors.length;
      await page.goto(`${BASE_URL}/game/${path}`);
      await page.keyboard.press("Escape"); // annonces éventuelles
      const h1 = await page.locator("h1").first().textContent({ timeout: 15_000 }).catch(() => null);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const problems = [];
      if (!h1?.trim()) problems.push("aucun titre");
      if (errors.length > before) problems.push(errors.slice(before).join(" | "));
      if (overflow > 2) problems.push(`débordement horizontal de ${overflow} px`);
      console.log(`${problems.length ? "✗" : "✓"} [${label}] /game/${path}${problems.length ? ` : ${problems.join(", ")}` : ""}`);
      if (problems.length) failures.push(`[${label}] /game/${path} : ${problems.join(", ")}`);
    }
  }
} finally {
  await browser.close();
}

if (failures.length) {
  console.error(`\n${failures.length} page(s) en échec :\n${failures.join("\n")}`);
  process.exit(1);
}
console.log("\nParcours de fumée réussi.");
