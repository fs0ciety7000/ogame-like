// 6.14.91 : génère les illustrations restantes par l'API d'images d'OpenAI (modèle gpt-image-1), à la place de Midjourney.
//
//   node scripts/generate-illustrations.mjs --dry-run                      # ce qui serait généré, coût estimé (ni clé ni réseau)
//   node scripts/generate-illustrations.mjs --group reliques --limit 3     # génère 3 reliques dans le dossier de travail
//   node scripts/generate-illustrations.mjs --ids tech-tech16,tech-tech17 --quality high --integrate
//
// Options :
//   --group <texte>        groupe de scripts/illustrations.json (sous-chaîne, sans casse ni accents : « reliques », « passe »)
//   --ids a,b,c            identifiants précis
//   --limit N              au plus N emplacements
//   --all                  inclut les emplacements déjà intégrés (`done` daté) : pour refaire une image
//   --quality low|medium|high (défaut medium)    --n N   variantes par image (défaut 1)
//   --concurrency N        requêtes simultanées (défaut 3)
//   --model <id>           défaut gpt-image-1
//   --style "<texte>"      remplace le préfixe de style commun (scripts/illustrations-api.mjs, STYLE_PREFIX) ; --no-style le retire
//   --out <dossier>        dossier de travail (défaut : $ILLU_API_OUT, sinon le scratchpad de la session, voir DEFAULT_OUT)
//   --force                régénère même si <dossier>/<id>.png existe déjà (sinon l'image est sautée : on ne paie pas deux fois)
//   --prompts              affiche aussi le prompt d'API complet de chaque image (avec --dry-run)
//   --integrate            enchaîne python3 scripts/illustrations.py <dossier>, puis rappelle le branchement à faire
//
// Clé : variable d'environnement OPENAI_API_KEY (jamais écrite, jamais journalisée). Hôte : api.openai.com.
// Sorties : <dossier>/<id>.png (variante 1, l'entrée attendue par scripts/illustrations.py), <dossier>/variantes/<id>-<k>.png
// (variantes suivantes, à échanger à la main), <dossier>/brut/<id>.png (rendu avant recadrage, seulement s'il a été recadré),
// <dossier>/journal.jsonl (une ligne par requête : identifiant, taille, qualité, coût estimé et mesuré, durée).
// Recadrage : un emplacement à hauteur libre (height 0) garde les proportions de l'image ; si le --ar du prompt (21:9, 16:10…)
// diffère de la taille d'API, le rendu est recadré au centre à ce rapport (Pillow, déjà requis par illustrations.py).
// Aucune dépendance npm : fetch natif de Node 22. Docs : docs/illustrations.md, « Génération par API ».
import { spawnSync } from "node:child_process";
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DEFAULT_MODEL,
  PRICES,
  WIRING,
  WIRING_DEFAULT,
  backoffMs,
  estimateCost,
  isRetryable,
  midjourneyParams,
  requestBody,
  selectSlots,
  sizeRatio,
  targetRatio,
  usageCost,
} from "./illustrations-api.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const API_URL = "https://api.openai.com/v1/images/generations";
const DEFAULT_OUT = "/tmp/claude-0/-home-user-ogame-like/3fb9e973-5e92-5833-9654-581cc080bff7/scratchpad/illu-api";
const MAX_ATTEMPTS = 6;

// --- Arguments ---------------------------------------------------------------------------------------------------------------
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 && i + 1 < argv.length ? argv[i + 1] : fallback;
};
if (flag("help") || flag("h")) {
  console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\nimport ")[0].replace(/^\/\/ ?/gm, ""));
  process.exit(0);
}
const dry = flag("dry-run");
const quality = opt("quality", "medium");
if (!PRICES[quality]) fail(`Qualité inconnue : ${quality} (low, medium ou high).`);
const n = Math.max(1, Math.min(10, Number(opt("n", 1)) || 1));
const concurrency = Math.max(1, Number(opt("concurrency", 3)) || 3);
const model = opt("model", DEFAULT_MODEL);
const style = flag("no-style") ? "" : opt("style", undefined);
const out = resolve(opt("out", process.env.ILLU_API_OUT || DEFAULT_OUT));
const ids = opt("ids", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const SLOTS = JSON.parse(readFileSync(join(ROOT, "scripts", "illustrations.json"), "utf8")).slots;
const unknown = ids.filter((id) => !SLOTS.some((s) => s.id === id));
if (unknown.length) fail(`Identifiant(s) inconnu(s) : ${unknown.join(", ")} (voir scripts/illustrations.json).`);
const selected = selectSlots(SLOTS, { group: opt("group"), ids, limit: Number(opt("limit", 0)), all: flag("all") });

function fail(msg) {
  console.error(msg);
  process.exit(1);
}
const usd = (x) => `${x.toFixed(2)} $`;

// --- Plan --------------------------------------------------------------------------------------------------------------------
const plan = selected.map((slot) => {
  const body = requestBody(slot, { model, quality, n, style });
  const ar = midjourneyParams(slot.prompt).ar;
  const crop = slot.height === 0 && Math.abs(targetRatio(slot) / sizeRatio(body.size) - 1) > 0.02 ? targetRatio(slot) : null;
  const exists = existsSync(join(out, `${slot.id}.png`));
  return { slot, body, ar: typeof ar === "string" ? ar : "?", crop, skip: exists && !flag("force") };
});
const todo = plan.filter((p) => !p.skip);

console.log(`${selected.length} emplacement(s) sélectionné(s), ${todo.length} à générer (${plan.length - todo.length} déjà dans ${out}).`);
console.table(
  plan.map((p) => ({
    id: p.slot.id,
    groupe: p.slot.group,
    ar: p.ar,
    taille: p.body.size,
    fond: p.body.background,
    recadrage: p.crop ? p.ar : "",
    final: `${p.slot.width}×${p.slot.height || "auto"}`,
    coût: p.skip ? "déjà là" : usd(estimateCost(p.body.size, quality, n)),
  })),
);
const total = (q) => todo.reduce((sum, p) => sum + estimateCost(p.body.size, q, n), 0);
const bySize = {};
for (const p of todo) bySize[p.body.size] = (bySize[p.body.size] ?? 0) + n;
console.log(`Images à produire : ${todo.length * n} (${Object.entries(bySize).map(([s, c]) => `${c} en ${s}`).join(", ") || "aucune"}).`);
console.log(`Coût estimé (grille approximative, à vérifier) : low ${usd(total("low"))} · medium ${usd(total("medium"))} · high ${usd(total("high"))} — retenu : ${quality} ${usd(total(quality))}.`);
if (flag("prompts")) for (const p of todo) console.log(`\n[${p.slot.id}] ${p.body.size} ${p.body.background}\n${p.body.prompt}`);

if (dry) {
  console.log("\n--dry-run : aucune requête, aucune clé lue.");
  process.exit(0);
}

// --- Génération --------------------------------------------------------------------------------------------------------------
if (!process.env.OPENAI_API_KEY) fail("OPENAI_API_KEY absente : renseigne la variable d'environnement (jamais dans le dépôt), ou lance avec --dry-run.");
mkdirSync(join(out, "variantes"), { recursive: true });
const journal = join(out, "journal.jsonl");
let spent = 0;
let measured = 0;
let stopAll = false;
const failed = [];
const generated = [];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Appel à l'API avec reprise sur 429, 5xx et erreur réseau. La clé ne sort jamais de l'en-tête. */
async function callApi(body, id) {
  for (let attempt = 0; ; attempt++) {
    let status;
    let retryAfter;
    let message;
    let code;
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify(body),
      });
      status = res.status;
      retryAfter = res.headers.get("retry-after");
      const json = await res.json().catch(() => ({}));
      if (res.ok) return json;
      message = json?.error?.message ?? res.statusText;
      code = json?.error?.code ?? json?.error?.type;
    } catch (e) {
      message = e?.cause?.code ?? e?.message ?? String(e);
    }
    if (status === 401 || status === 403) {
      stopAll = true;
      throw new Error(`accès refusé (${status}) : clé invalide ou sans droit sur ${body.model}. Arrêt du lot.`);
    }
    // 6.14.147 : crédits épuisés (429 « insufficient_quota ») : inutile de réessayer, arrêt du lot.
    if (status === 429 && (code === "insufficient_quota" || /no credits|quota/i.test(message ?? ""))) {
      stopAll = true;
      throw new Error(`crédits épuisés (429) : ${message} Arrêt du lot.`);
    }
    if (!isRetryable(status) || attempt + 1 >= MAX_ATTEMPTS) throw new Error(`${status ?? "réseau"} : ${message}`);
    const wait = backoffMs(attempt, retryAfter) + Math.floor(Math.random() * 500);
    console.warn(`  ${id} : ${status ?? "réseau"} (${message}), nouvel essai dans ${Math.round(wait / 1000)} s (${attempt + 2}/${MAX_ATTEMPTS}).`);
    await sleep(wait);
  }
}

/** Recadrage au centre au rapport voulu (Pillow) ; l'original va dans brut/. */
function cropTo(file, ratio, id) {
  mkdirSync(join(out, "brut"), { recursive: true });
  const raw = join(out, "brut", `${id}.png`);
  renameSync(file, raw);
  const py = [
    "import sys",
    "from PIL import Image",
    "src, dst, r = sys.argv[1], sys.argv[2], float(sys.argv[3])",
    "im = Image.open(src)",
    "w, h = im.size",
    "if w / h > r:",
    "    nw = round(h * r); im = im.crop(((w - nw) // 2, 0, (w - nw) // 2 + nw, h))",
    "else:",
    "    nh = round(w / r); im = im.crop((0, (h - nh) // 2, w, (h - nh) // 2 + nh))",
    "im.save(dst)",
  ].join("\n");
  const r = spawnSync("python3", ["-c", py, raw, file, String(ratio)], { encoding: "utf8" });
  if (r.status !== 0) {
    renameSync(raw, file);
    console.warn(`  ${id} : recadrage impossible (Pillow ?), image gardée telle quelle. ${r.stderr?.trim().split("\n").pop() ?? ""}`);
  }
}

async function generate(p) {
  const { slot, body } = p;
  const t0 = Date.now();
  const est = estimateCost(body.size, quality, n);
  try {
    const json = await callApi(body, slot.id);
    const images = (json.data ?? []).map((d) => d.b64_json).filter(Boolean);
    if (!images.length) throw new Error("réponse sans image (b64_json absent)");
    images.forEach((b64, k) => {
      const file = k === 0 ? join(out, `${slot.id}.png`) : join(out, "variantes", `${slot.id}-${k + 1}.png`);
      writeFileSync(file, Buffer.from(b64, "base64"));
      if (p.crop) cropTo(file, p.crop, k === 0 ? slot.id : `${slot.id}-${k + 1}`);
    });
    const real = usageCost(json.usage);
    spent += est;
    if (real != null) measured += real;
    appendFileSync(journal, JSON.stringify({ at: new Date().toISOString(), id: slot.id, model: body.model, size: body.size, quality, n: images.length, background: body.background, estimatedUsd: est, measuredUsd: real, usage: json.usage ?? null, ms: Date.now() - t0 }) + "\n");
    generated.push(slot);
    console.log(`  ✓ ${slot.id} (${body.size}, ${images.length} image(s), ~${usd(est)}${real != null ? `, mesuré ${usd(real)}` : ""}, ${Math.round((Date.now() - t0) / 1000)} s)`);
  } catch (e) {
    failed.push(slot.id);
    appendFileSync(journal, JSON.stringify({ at: new Date().toISOString(), id: slot.id, model: body.model, size: body.size, quality, error: e.message }) + "\n");
    console.error(`  ✗ ${slot.id} : ${e.message}`);
  }
}

console.log(`\nGénération : ${todo.length} requête(s), ${concurrency} à la fois, modèle ${model}, qualité ${quality} → ${out}`);
const queue = [...todo];
await Promise.all(
  Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length && !stopAll) await generate(queue.shift());
  }),
);
const notRun = queue.map((p) => p.slot.id);
console.log(`\n${generated.length} générée(s), ${failed.length} en échec${notRun.length ? `, ${notRun.length} non lancée(s)` : ""}. Coût estimé ${usd(spent)}${measured ? `, mesuré ${usd(measured)}` : ""}. Journal : ${journal}`);
if (failed.length) console.log(`Échecs : ${failed.join(", ")} (relancer avec --ids ${failed.join(",")}).`);

// --- Intégration -------------------------------------------------------------------------------------------------------------
if (flag("integrate")) {
  console.log(`\nIntégration : python3 scripts/illustrations.py ${out}`);
  const r = spawnSync("python3", [join(ROOT, "scripts", "illustrations.py"), out], { stdio: "inherit", cwd: ROOT });
  if (r.status !== 0) fail("illustrations.py a échoué : rien n'est branché.");
  const groups = {};
  for (const p of plan) if (existsSync(join(out, `${p.slot.id}.png`))) (groups[p.slot.group] ??= []).push(p.slot.id);
  console.log("\nÀ faire ensuite (docs/illustrations.md, « Côté Claude », étapes 2 à 4) :");
  console.log("- regarder chaque image produite (détourage, cadrage, texte parasite) ; une image ratée se refait avec --ids <id> --force ;");
  for (const [g, list] of Object.entries(groups)) console.log(`- ${g} (${list.join(", ")}) : ${WIRING[g] ?? WIRING_DEFAULT}`);
  console.log("- node scripts/live-docs.mjs push (page /img à jour) ; fiche docs/changes/, validation (npx vitest run src/game/illustrations.test.ts), commit, push.");
}
process.exit(failed.length || stopAll ? 2 : 0);
