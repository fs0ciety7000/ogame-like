// 6.14.70 (É30-1e) : essai réel de la phalange et de la porte de saut sur la pré-prod.
//
//   node scripts/preprod-essai-lune.mjs [dossier des captures] [--sans-captures] [--garder]
//
// Variables : PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD (docs/preprod.md §6).
// Refuse toute adresse qui n'est pas un serveur de test. Trois comptes dédiés (« claude_lune_a », « _b », « _c », e-mails
// @test.invalid) ; leurs mots de passe sont tirés au hasard à chaque lancement et ne sont gardés nulle part.
//
// Déroulé :
//   1. préparation par le superutilisateur : A (lune niveau 4) et C (lune niveau 1, à portée de A) dans une alliance de test
//      créée et rejointe par l'API joueur ; B (attaquant, loin de A) avec des frégates, un brouilleur d'approche et un stimulant ;
//      les identifiants des comptes sont choisis pour que la carte place C dans la portée de A et B à plus de 60 de A
//      (trajet d'attaque d'au moins 65 min : la flotte reste en vol pendant l'essai) ;
//   2. jeu par l'API joueur : balayage refusé avant l'attaque, attaque leurrée de B, radar reçu par C seulement, composition
//      percée pour A (pas pour C), balayage de B (coût, recharge, rapport, notification), second balayage refusé, patrouille de A
//      rapatriée par la porte (recharge, notification), second saut refusé, compteurs, succès « Œil de la lune » et « Saut de l'ange » ;
//   3. captures Playwright (thème Constellation, 375 et 1440 px) des écrans de A et de C, Admin → Règles → Lunes par un droit
//      d'admin temporaire donné à A et retiré ensuite ;
//   4. ménage : flottes rappelées, droit d'admin retiré, alliance quittée (elle disparaît), comptes supprimés par la route
//      `account/delete` (sauf --garder).
// Sortie : une ligne « ok » ou « ÉCART » par vérification, puis le bilan ; code de sortie 1 s'il y a un écart.
// ESSAI_FRONT_URL (facultatif) : front à capturer (par défaut celui de la pré-prod), par exemple un Vite local lancé avec
// VITE_POCKETBASE_URL=$PREPROD_PB_URL pour voir un correctif d'interface sur les données de la pré-prod avant le push.
import PocketBase from "pocketbase";
import { randomBytes } from "node:crypto";
import { mkdirSync } from "node:fs";

const { PREPROD_PB_URL: URL_, PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD } = process.env;
const args = process.argv.slice(2);
const flags = new Set(args.filter((a) => a.startsWith("--")));
const out = args.find((a) => !a.startsWith("--")) ?? ".";
const withCaptures = !flags.has("--sans-captures");
const keepAccounts = flags.has("--garder");
if (!URL_ || !PREPROD_PB_ADMIN_EMAIL || !PREPROD_PB_ADMIN_PASSWORD) {
  console.error("Renseigne PREPROD_PB_URL, PREPROD_PB_ADMIN_EMAIL et PREPROD_PB_ADMIN_PASSWORD.");
  process.exit(1);
}
const host = new URL(URL_).hostname;
if (!/(^|[.-])(test|preprod)([.-]|$)/.test(host) && host !== "127.0.0.1" && host !== "localhost") {
  console.error(`Refusé : ${URL_} n'est pas un serveur de test.`);
  process.exit(1);
}
if (withCaptures) mkdirSync(out, { recursive: true });
const FRONT = process.env.ESSAI_FRONT_URL || URL_;

/* ---------- Vérifications ---------- */
const results = [];
const check = (label, ok, detail = "") => {
  results.push({ label, ok: !!ok, detail });
  console.log(`${ok ? "ok    " : "ÉCART "} ${label}${detail ? ` : ${detail}` : ""}`);
};
const rejects = async (label, promise, pattern) => {
  try {
    await promise;
    check(label, false, "accepté alors qu'il devait être refusé");
  } catch (err) {
    const msg = String(err?.response?.message ?? err?.message ?? err);
    check(label, pattern.test(msg), msg);
  }
};

/* ---------- Carte (copie de src/game/galaxy.ts et fleets.ts : position dérivée de l'identifiant) ---------- */
const hash = (input, seed) => {
  let h = (2166136261 ^ seed) >>> 0;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
};

/* ---------- Superutilisateur et règles en vigueur ---------- */
const admin = new PocketBase(URL_);
admin.autoCancellation(false);
await admin.collection("_superusers").authWithPassword(PREPROD_PB_ADMIN_EMAIL, PREPROD_PB_ADMIN_PASSWORD);
const rulesRec = await admin.collection("game_config").getFirstListItem('key="rules"').catch(() => null);
const rules = rulesRec?.data ?? {};
const mapSize = Number(rules.fleets?.mapSize) || 100;
const rangePerLevel = Number(rules.phalanx?.rangePerLevel) || 15;
const pos = (uid) => ({ x: (hash(uid, 1) / 4294967296) * mapSize, y: (hash(uid, 2) / 4294967296) * mapSize });
const dist = (a, b) => {
  const p = pos(a);
  const q = pos(b);
  return Math.hypot(p.x - q.x, p.y - q.y);
};
// Identifiants stables (15 caractères [a-z0-9]) : un nouveau lancement retombe sur les mêmes comptes.
const pick = (prefix, ok) => {
  for (let i = 0; i < 10000; i++) {
    const id = prefix + String(i).padStart(15 - prefix.length, "0");
    if (ok(id)) return id;
  }
  throw new Error(`Aucun identifiant ${prefix}… ne convient.`);
};
const aId = "claudelunea0000";
const cId = pick("claudelunec", (id) => dist(aId, id) <= rangePerLevel * 0.8);
const bId = pick("claudeluneb", (id) => dist(aId, id) >= 60);
console.log(`Carte : C à ${dist(aId, cId).toFixed(1)} de A (portée niveau 1 : ${rangePerLevel}), B à ${dist(aId, bId).toFixed(1)}.`);

/* ---------- Comptes ---------- */
const ACCOUNTS = {
  a: { id: aId, username: "claude_lune_a", name: "ClaudeLuneA", email: "claude-lune-a@test.invalid" },
  b: { id: bId, username: "claude_lune_b", name: "ClaudeLuneB", email: "claude-lune-b@test.invalid" },
  c: { id: cId, username: "claude_lune_c", name: "ClaudeLuneC", email: "claude-lune-c@test.invalid" },
};
const clients = {};
for (const acc of Object.values(ACCOUNTS)) {
  acc.pw = randomBytes(12).toString("hex");
  // Un compte d'un lancement précédent dont l'identifiant ne convient plus (règles changées) est supprimé.
  const old = await admin.collection("users").getFirstListItem(`username="${acc.username}"`).catch(() => null);
  if (old && old.id !== acc.id) {
    await admin.collection("players").delete(old.id).catch(() => undefined);
    await admin.collection("users").delete(old.id);
  }
  const user = await admin.collection("users").getOne(acc.id).catch(() => null);
  if (user) await admin.collection("users").update(acc.id, { password: acc.pw, passwordConfirm: acc.pw, verified: true });
  else await admin.collection("users").create({ id: acc.id, username: acc.username, name: acc.name, email: acc.email, emailVisibility: false, password: acc.pw, passwordConfirm: acc.pw, verified: true });
  const pb = new PocketBase(URL_);
  pb.autoCancellation(false);
  acc.auth = await pb.collection("users").authWithPassword(acc.email, acc.pw);
  await pb.send("/api/cosmic/init", { method: "POST" });
  clients[acc.username.slice(-1)] = pb;
}
const post = (who, path, body = {}) => clients[who].send(`/api/cosmic/${path}`, { method: "POST", body });
const snap = (id) => admin.collection("players").getOne(id);
const notes = (uid, title, since) => admin.collection("notifications").getFullList({ filter: `player_id="${uid}" && title="${title}" && createdAtMs >= ${since}`, sort: "-createdAtMs" });

/* ---------- Ménage d'un lancement précédent ---------- */
for (const acc of Object.values(ACCOUNTS)) {
  for (const f of await admin.collection("fleets").getFullList({ filter: `ownerUid="${acc.id}" && status != "done"` })) await admin.collection("fleets").delete(f.id);
}
await admin.collection("admins").delete(aId).catch(() => undefined);
for (const who of ["c", "b", "a"]) await post(who, "alliance", { type: "leave" }).catch(() => undefined);

/* ---------- 1. Préparation ---------- */
const started = Date.now();
const MONTH_AGO = started - 30 * 86400_000;
const RICH = { scrap: 5_000_000, energy: 5_000_000, nano: 5_000_000, data: 5_000_000, reinforcedSteel: 5000, cyberModule: 5000, syntheticNanites: 5000, aiFragment: 5000 };
const moon = (name, level) => ({ name, level, bornAtMs: started - 86400_000, fromDebris: 1 });
const xp = Math.max(Number((await snap(aId)).xp) || 0, 50_000);
const common = { createdAtMs: MONTH_AGO, lastDefeatAtMs: 0, lastAttackAtMs: 0, ascendedAtMs: 0, vacation: null, xp, colonies: [], stats: {}, unlockedAchievements: [], resources: RICH, resourcesUpdatedAtMs: started };
await admin.collection("players").update(aId, { ...common, moon: moon("Séléna", 4), units: { fregate: { level: 1, count: 30 }, chasseur: { level: 1, count: 20 } } });
await admin.collection("players").update(cId, { ...common, moon: moon("Nyx", 1), units: { chasseur: { level: 1, count: 10 } } });
await admin.collection("players").update(bId, {
  ...common,
  moon: null,
  units: { fregate: { level: 1, count: 40 } },
  synthesis: { crafting: null, stock: { assault: [4], armor: [], decoy: [5], veil: [] }, armor: null, veil: null, decoys: {} },
});
// Alliance de test : fondée par A, rejointe par C (recrutement ouvert au besoin).
const created = await post("a", "alliance", { type: "create", name: "Vigies de test Claude", tag: "VGTC" });
const allianceId = created.allianceId;
try {
  await post("c", "alliance", { type: "join", allianceId });
} catch {
  const rec = await admin.collection("alliances").getOne(allianceId);
  await admin.collection("alliances").update(allianceId, { profile: { ...(rec.profile ?? {}), recruiting: "open" } });
  await post("c", "alliance", { type: "join", allianceId });
}
for (const who of ["a", "b", "c"]) await post(who, "action", { type: "sync" });
check("alliance de test : A et C membres", ((await admin.collection("alliances").getOne(allianceId)).members ?? []).length === 2);
check("niveau de lune public (profil de A)", (await admin.collection("profiles").getOne(aId)).moonLevel === 4, `moonLevel ${(await admin.collection("profiles").getOne(aId)).moonLevel}`);

/* ---------- 2. Jeu ---------- */
await rejects("balayage de B refusé avant toute attaque", post("a", "moon/scan", { targetUid: bId }), /ne balaie qu'un joueur/);

// B attaque A avec un brouilleur d'approche (leurre) et un stimulant d'assaut.
const sent = await post("b", "fleet/send", { targetUid: aId, fleet: { fregate: 40 }, mission: "attack", capsules: { decoy: true, assault: true } });
const fleetsToRecall = [{ who: "b", id: sent.id }];
const fleetRec = await admin.collection("fleets").getOne(sent.id);
const shownTotal = Object.values(fleetRec.units ?? {}).reduce((s, n) => s + n, 0);
check("attaque leurrée en vol (composition affichée ≠ vraie)", fleetRec.status === "outbound" && !!fleetRec.trueUnits && shownTotal !== 40, `affichée ${shownTotal}, vraie ${JSON.stringify(fleetRec.trueUnits)}, stimulant ${JSON.stringify(fleetRec.boosts)}`);
check("trajet assez long pour l'essai (≥ 30 min)", fleetRec.arriveAtMs - Date.now() > 30 * 60_000, `${Math.round((fleetRec.arriveAtMs - Date.now()) / 60_000)} min`);

const radarC = await notes(cId, "Phalange : allié menacé", started);
check("radar : C (allié à portée) prévenu une fois", radarC.length === 1 && radarC[0].data?.fleetId === sent.id, radarC[0]?.message ?? "aucune notification");
check("radar : ni A ni B prévenus", (await notes(aId, "Phalange : allié menacé", started)).length === 0 && (await notes(bId, "Phalange : allié menacé", started)).length === 0);

const aView = await post("a", "moon/phalanx");
const inc = aView.incoming.find((f) => f.id === sent.id);
check("A (lune 4) voit l'attaque", !!inc, `niveau ${aView.level}, portée ${aView.range}`);
check("A : leurre et stimulant percés", inc?.pierced?.decoy === true && inc?.pierced?.boosts === true && inc?.units?.fregate === 40 && inc?.assault === 20, JSON.stringify({ units: inc?.units, assault: inc?.assault, pierced: inc?.pierced }));
check("A : texte du perce-brouillard", /40 vaisseaux, pas /.test(inc?.piercedText ?? ""), inc?.piercedText ?? "");
const cView = await post("c", "moon/phalanx");
const threat = cView.allies.find((f) => f.id === sent.id);
check("C (lune 1) voit l'attaque sur son allié", !!threat && threat.allyUid === aId, JSON.stringify(threat ? { allyPseudo: threat.allyPseudo, units: threat.units } : cView.allies));
check("C : composition affichée seulement (I22)", !!threat && JSON.stringify(threat.units) === JSON.stringify(fleetRec.units) && !/trueUnits|"assault":20/.test(JSON.stringify(cView)));
const bView = await post("b", "moon/phalanx");
check("B sans lune : rien", bView.level === 0 && bView.incoming.length === 0 && bView.allies.length === 0);

// Balayage de l'agresseur.
const energyBefore = (await snap(aId)).resources.energy;
const scan = await post("a", "moon/scan", { targetUid: bId });
const aAfterScan = await snap(aId);
const scanLine = scan.report?.fleets?.find((f) => f.id === sent.id);
check("balayage : coût en énergie payé", scan.cost >= 1000 && aAfterScan.resources.energy <= energyBefore - scan.cost + 1000, `coût ${scan.cost}, énergie ${energyBefore} → ${aAfterScan.resources.energy}`);
check("balayage : recharge posée", aAfterScan.moon?.scanReadyAtMs === scan.scanReadyAtMs && scan.scanReadyAtMs - Date.now() > 60_000, `${Math.round((scan.scanReadyAtMs - Date.now()) / 60_000)} min`);
check("balayage : rapport sans champ caché", !!scanLine && JSON.stringify(scanLine.units) === JSON.stringify(fleetRec.units) && !/trueUnits/.test(JSON.stringify(scan.report)), `${scan.report?.fleets?.length ?? 0} flotte(s) en vol, message « ${scan.message} »`);
check("balayage : compteur phalanxScans = 1", aAfterScan.stats?.phalanxScans === 1, String(aAfterScan.stats?.phalanxScans));
check("balayage : notification au joueur", (await notes(aId, `Balayage de ${ACCOUNTS.b.name}`, started)).length === 1);
await rejects("second balayage refusé (recharge)", post("a", "moon/scan", { targetUid: bId }), /se recharge/);

// Porte de saut.
const patrol1 = await post("a", "fleet/send", { mission: "patrol", fleet: { chasseur: 10 }, minutes: 30 });
check("patrouille partie (10 chasseurs)", (await snap(aId)).units?.chasseur?.count === 10);
const jump = await post("a", "fleet/jump", { fleetId: patrol1.id });
const aAfterJump = await snap(aId);
check("saut : patrouille à quai tout de suite", jump.status === "done" && (await admin.collection("fleets").getOne(patrol1.id)).status === "done" && aAfterJump.units?.chasseur?.count === 20, jump.message);
check("saut : recharge posée", aAfterJump.moon?.gateReadyAtMs === jump.gateReadyAtMs && jump.gateReadyAtMs - Date.now() > 3600_000, `${((jump.gateReadyAtMs - Date.now()) / 3600_000).toFixed(1)} h`);
check("saut : compteur gateJumps = 1", aAfterJump.stats?.gateJumps === 1, String(aAfterJump.stats?.gateJumps));
check("saut : notification « Saut réussi »", (await notes(aId, "Saut réussi", started)).length === 1);
const patrol2 = await post("a", "fleet/send", { mission: "patrol", fleet: { chasseur: 10 }, minutes: 30 });
fleetsToRecall.push({ who: "a", id: patrol2.id });
await rejects("second saut refusé (recharge)", post("a", "fleet/jump", { fleetId: patrol2.id }), /se recharge/);
check("seconde patrouille toujours en vol", (await admin.collection("fleets").getOne(patrol2.id)).status === "outbound");

// Succès débloqués à la synchronisation.
await post("a", "action", { type: "sync" });
const unlocked = (await snap(aId)).unlockedAchievements ?? [];
const has = (id) => unlocked.some((u) => (typeof u === "string" ? u : u?.id) === id);
check("succès « Œil de la lune » (phalange_1)", has("phalange_1"));
check("succès « Saut de l'ange » (porte_1)", has("porte_1"));
const cPhal = await post("c", "moon/phalanx");
check("C : balayage possible (attaque sur un allié à portée)", cPhal.scan?.readyAtMs <= Date.now());

/* ---------- 3. Captures ---------- */
if (withCaptures) {
  await admin.collection("admins").create({ id: aId, note: "Essai lune (É30-1e), droit temporaire" });
  try {
    const { chromium } = await import("playwright");
    const browser = await chromium.launch();
    const storedOf = (acc) => JSON.stringify({ token: clients[acc.username.slice(-1)].authStore.token, record: acc.auth.record });
    const dismiss = async (page) => {
      for (let i = 0; i < 6 && (await page.getByRole("dialog").count()); i++) {
        const later = page.getByRole("dialog").getByRole("button", { name: /plus tard|fermer|passer|compris|ignorer|j'ai vu/i });
        if (await later.count()) await later.first().click({ timeout: 2000 }).catch(() => {});
        else await page.keyboard.press("Escape");
        await page.waitForTimeout(700);
      }
    };
    // `press` : bouton à état (aria-pressed) à enfoncer ; `focus` : texte à centrer avant la capture ; `keepDialogs` : ne rien fermer.
    const SHOTS = [
      { who: "a", name: "accueil", path: "/game", keepDialogs: true },
      { who: "a", name: "accueil-frise", path: "/game", focus: /Prochaines fins/i },
      { who: "a", name: "stats-lune", path: "/game/statistiques?onglet=lune", focus: /Flottes qui te visent/i },
      { who: "a", name: "flottes-attaque", path: "/game/galaxie", focus: /Percé par la phalange/i },
      { who: "a", name: "flottes-saut", path: "/game/galaxie", focus: /Patrouille \(aller\)/ },
      { who: "a", name: "galaxie", path: "/game/galaxie" },
      { who: "a", name: "codex-legendes", path: "/game/codex", press: [/Légendes/i, /Grille/i], focus: /La phalange/ },
      { who: "a", name: "succes", path: "/game/succes", press: [/^Obtenus$/], next: true, focus: /Œil de la lune/ },
      { who: "a", name: "admin-lunes", path: "/game/admin?onglet=rules", focus: /Lunes : phalange/i },
      { who: "c", name: "alliance-allies-menaces", path: "/game/alliance", focus: /Alliés menacés/i },
      { who: "c", name: "stats-lune", path: "/game/statistiques?onglet=lune", focus: /Ta phalange veille/i },
      // Balayage depuis l'interface (une fois : la recharge de C dure 30 min) : confirmation, puis rapport.
      { who: "c", name: "balayage", path: "/game/alliance", focus: /Alliés menacés/i, only: "375", scan: true },
      { who: "c", name: "galaxie", path: "/game/galaxie" },
    ];
    for (const [vname, viewport] of [["375", { width: 375, height: 812 }], ["1440", { width: 1440, height: 900 }]]) {
      for (const who of ["a", "c"]) {
        const acc = ACCOUNTS[who];
        const ctx = await browser.newContext({ viewport });
        await ctx.addInitScript((s) => {
          localStorage.setItem("cosmic-empires:theme", "constellation");
          localStorage.setItem("pocketbase_auth", s);
        }, storedOf(acc));
        // Jamais de requête vers la production depuis une capture.
        await ctx.route(/(base|empire)\.fs0ciety\.org/, (r) => r.abort());
        const page = await ctx.newPage();
        const errors = [];
        page.on("pageerror", (e) => errors.push(String(e.message ?? e)));
        for (const shot of SHOTS.filter((s) => s.who === who && (!s.only || s.only === vname))) {
          await page.goto(FRONT + shot.path, { waitUntil: "load", timeout: 60000 });
          await page.waitForTimeout(6000);
          if (!shot.keepDialogs) await dismiss(page);
          for (const press of shot.press ?? []) {
            const b = page.locator("button[aria-pressed]").filter({ hasText: press });
            if (await b.count()) {
              await b.first().click();
              await page.waitForTimeout(1500);
            } else check(`${who.toUpperCase()} ${shot.name} ${vname} px : filtre « ${press.source} »`, false, "absent");
          }
          // Liste paginée : page suivante (les succès les plus récents viennent après les anciens).
          if (shot.next) {
            const n = page.getByRole("button", { name: /suivant/i });
            if (await n.count()) {
              await n.first().click();
              await page.waitForTimeout(1000);
            }
          }
          if (shot.focus) {
            const el = page.getByText(shot.focus).first();
            if (await el.count()) await el.evaluate((n) => n.scrollIntoView({ block: "center" })).catch(() => {});
            else check(`${who.toUpperCase()} ${shot.name} ${vname} px : texte « ${shot.focus.source} » visible`, false, "absent");
            await page.waitForTimeout(800);
          }
          if (shot.scan) {
            const btn = page.getByRole("button", { name: /^Balayer/ }).first();
            if (await btn.count()) {
              await btn.click();
              await page.waitForTimeout(1200);
              await page.screenshot({ path: `${out}/${who}-${shot.name}-confirmation-${vname}.png` });
              await page.getByRole("dialog").getByRole("button", { name: /^Balayer$/i }).last().click().catch(() => {});
              await page.waitForTimeout(3000);
              const report = await page.getByRole("dialog").filter({ hasText: /Balayage de/ }).count();
              check(`${who.toUpperCase()} balayage depuis l'Alliance : rapport affiché`, report > 0);
            } else check(`${who.toUpperCase()} balayage depuis l'Alliance : bouton « Balayer »`, false, "absent");
          }
          const file = `${out}/${who}-${shot.name}-${vname}.png`;
          await page.screenshot({ path: file });
          const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
          check(`${who.toUpperCase()} ${shot.name} ${vname} px : pas de défilement horizontal`, over <= 0, `${file}${over > 0 ? `, +${over} px` : ""}`);
        }
        check(`${who.toUpperCase()} ${vname} px : aucune erreur de page`, errors.length === 0, errors.slice(0, 3).join(" | "));
        await ctx.close();
      }
    }
    // Alerte plein écran (RaidAlert, à 5 min de l'impact) : l'arrivée de B est avancée à +4 min pour l'affichage seulement ;
    // la flotte est rappelée juste après (ménage), bien avant le contact.
    await admin.collection("fleets").update(sent.id, { arriveAtMs: Date.now() + 4 * 60_000 });
    for (const [vname, viewport] of [["375", { width: 375, height: 812 }], ["1440", { width: 1440, height: 900 }]]) {
      const ctx = await browser.newContext({ viewport });
      await ctx.addInitScript((s) => {
        localStorage.setItem("cosmic-empires:theme", "constellation");
        localStorage.setItem("pocketbase_auth", s);
      }, storedOf(ACCOUNTS.a));
      await ctx.route(/(base|empire)\.fs0ciety\.org/, (r) => r.abort());
      const page = await ctx.newPage();
      await page.goto(FRONT + "/game/statistiques", { waitUntil: "load", timeout: 60000 });
      await page.waitForTimeout(7000);
      const alert = page.getByRole("dialog", { name: /Attaque imminente/i }).or(page.getByLabel(/Attaque imminente/i));
      const file = `${out}/a-alerte-raid-${vname}.png`;
      await page.screenshot({ path: file });
      check(`A alerte d'attaque imminente ${vname} px`, (await alert.count()) > 0, file);
      await ctx.close();
    }
    await browser.close();
  } finally {
    // Rappel tout de suite (l'arrivée avancée ne doit jamais aboutir à un combat).
    await post("b", "fleet/recall", { fleetId: sent.id }).then(() => fleetsToRecall.splice(fleetsToRecall.findIndex((f) => f.id === sent.id), 1)).catch(() => undefined);
    await admin.collection("admins").delete(aId).catch(() => undefined);
  }
}

/* ---------- 4. Ménage ---------- */
for (const f of fleetsToRecall) {
  await post(f.who, "fleet/recall", { fleetId: f.id }).catch((err) => check(`rappel de la flotte ${f.id}`, false, String(err?.message ?? err)));
}
check("droit d'admin temporaire retiré", !(await admin.collection("admins").getOne(aId).catch(() => null)));
await post("c", "alliance", { type: "leave" });
await post("a", "alliance", { type: "leave" });
check("alliance de test dissoute", !(await admin.collection("alliances").getOne(allianceId).catch(() => null)));
if (!keepAccounts) {
  for (const who of ["a", "b", "c"]) {
    const acc = ACCOUNTS[who];
    const res = await post(who, "account/delete", { password: acc.pw, confirm: acc.name }).catch((err) => ({ error: String(err?.message ?? err) }));
    check(`compte ${acc.username} supprimé`, !res.error && !(await admin.collection("users").getOne(acc.id).catch(() => null)), res.error ?? `${res.fleets ?? 0} flotte(s)`);
  }
}

const bad = results.filter((r) => !r.ok);
console.log(`\nBilan : ${results.length - bad.length} vérifications réussies, ${bad.length} écart(s).`);
for (const r of bad) console.log(`  - ${r.label}${r.detail ? ` : ${r.detail}` : ""}`);
process.exit(bad.length ? 1 : 0);
