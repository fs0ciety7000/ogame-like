import PocketBase from "pocketbase";
import { chromium } from "playwright";
const URL_ = process.env.PREPROD_PB_URL;
const su = new PocketBase(URL_); su.autoCancellation(false);
const browser = await chromium.launch();
for (let attempt = 0; attempt < 40; attempt++) {
  try {
    await su.collection("_superusers").authWithPassword(process.env.PREPROD_PB_ADMIN_EMAIL, process.env.PREPROD_PB_ADMIN_PASSWORD);
    const imp = await su.collection("users").impersonate("dkn2paqrn1mou9u", 600);
    const stored = JSON.stringify({ token: imp.authStore.token, record: imp.authStore.record });
    const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
    await ctx.addInitScript((s) => { localStorage.setItem("pocketbase_auth", s); localStorage.setItem("cosmic-empires:theme", "constellation"); }, stored);
    await ctx.route(/(base|empire)\.fs0ciety\.org/, (r) => r.abort());
    const page = await ctx.newPage();
    await page.goto(URL_ + "/img", { waitUntil: "load" });
    await page.waitForTimeout(8000);
    const line = page.getByText(/images? affichées?/);
    if (!(await line.count())) { await ctx.close(); await new Promise((r) => setTimeout(r, 30000)); continue; }
    const read = async () => (await line.first().innerText()).trim();
    const out = { "À faire": await read() };
    for (const label of ["Intégrées", "Toutes", "Reçues", "À faire"]) {
      await page.getByRole("button", { name: new RegExp("^" + label) }).click();
      await page.waitForTimeout(500);
      out[label] = await read();
    }
    console.log(JSON.stringify(out));
    await page.screenshot({ path: process.argv[2] + "/img-filtre.png" });
    await browser.close();
    process.exit(0);
  } catch (e) { await new Promise((r) => setTimeout(r, 30000)); }
}
console.log("pas encore déployé"); await browser.close();
