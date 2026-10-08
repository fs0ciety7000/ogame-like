// 6.14.91 : fonctions pures de la génération d'illustrations par API (OpenAI, modèle gpt-image-1).
// Utilisé par scripts/generate-illustrations.mjs ; testé par src/lib/illustrationsApi.test.ts. Aucun accès réseau ici.

/** Modèle par défaut (réglable par --model). */
export const DEFAULT_MODEL = "gpt-image-1";

/** Tailles acceptées par gpt-image-1 (largeur × hauteur). */
export const API_SIZES = ["1024x1024", "1536x1024", "1024x1536"];

/**
 * Prix APPROXIMATIFS par image, en dollars, pour gpt-image-1 (grille publique d'OpenAI relevée en 2025, à vérifier sur
 * https://openai.com/api/pricing avant un gros lot). Le prix réel dépend des jetons consommés (champ `usage` de la réponse) :
 * le journal en garde la trace.
 */
export const PRICES = {
  low: { "1024x1024": 0.011, "1536x1024": 0.016, "1024x1536": 0.016 },
  medium: { "1024x1024": 0.042, "1536x1024": 0.063, "1024x1536": 0.063 },
  high: { "1024x1024": 0.167, "1536x1024": 0.25, "1024x1536": 0.25 },
};

/** Prix approximatifs des jetons de gpt-image-1, en dollars par million (pour le coût mesuré à partir de `usage`). */
export const TOKEN_PRICES = { textInput: 5, imageInput: 10, imageOutput: 40 };

/**
 * Préfixe de style commun : cohérence de la série, repris des prompts de scripts/illustrations.json et de docs/prompts-*.md.
 * 6.14.119 (demande de l'utilisateur, 2026-10-08) : plus science-fiction et spatial : technologie avancée, coques et alliages
 * futuristes, hologrammes, étoiles et nébuleuses, plus d'aspect médiéval ou fantasy ; accents cyan #4be8ff et or #ffd86b gardés.
 * Réglable par --style "<texte>" ou coupé par --no-style.
 */
export const STYLE_PREFIX =
  "High-end science-fiction space strategy game illustration, cinematic digital concept art in the style of AAA space games, " +
  "advanced futuristic technology, sleek armored alloys and starship-grade materials, glowing energy conduits and holographic details, " +
  "deep-space setting with stars, nebulae and distant planets, cyan (#4be8ff) and warm gold (#ffd86b) accent lighting, " +
  "volumetric light, crisp detail; no medieval or fantasy look.";

/** Consigne toujours ajoutée en fin de prompt. */
export const NO_TEXT = "No text, no letters, no numbers, no logos, no watermark.";

/** Consigne ajoutée quand l'emplacement demande un détourage (`cutout`). */
export const TRANSPARENT = "Single isolated object on a transparent background, nothing behind it, soft rim light, object fully visible and occupying about 65% of the frame, wide empty margin on every side.";

/** Paramètres Midjourney d'un prompt (`--ar 16:9 --v 7 --style raw --s 250` → { ar: "16:9", v: "7", style: "raw", s: "250" }). */
export function midjourneyParams(prompt) {
  const params = {};
  const re = /(?:^|\s)--([a-z]+)(?:\s+([^\s-][^\s]*))?/gi;
  let m;
  while ((m = re.exec(prompt))) params[m[1].toLowerCase()] = m[2] ?? true;
  return params;
}

/** Rapport largeur / hauteur voulu : `--ar` du prompt d'abord, sinon width / height de l'emplacement, sinon carré. */
export function targetRatio(slot) {
  const ar = midjourneyParams(slot.prompt ?? "").ar;
  if (typeof ar === "string") {
    const [w, h] = ar.split(":").map(Number);
    if (w > 0 && h > 0) return w / h;
  }
  if (slot.width > 0 && slot.height > 0) return slot.width / slot.height;
  return 1;
}

/** Taille d'API la plus proche du rapport (écart mesuré en logarithme : 2:1 et 1:2 sont à même distance du carré). */
export function pickSize(ratio) {
  let best = API_SIZES[0];
  let gap = Infinity;
  for (const size of API_SIZES) {
    const [w, h] = size.split("x").map(Number);
    const d = Math.abs(Math.log(ratio) - Math.log(w / h));
    if (d < gap - 1e-9) {
      gap = d;
      best = size;
    }
  }
  return best;
}

/** Rapport de la taille d'API (« 1536x1024 » → 1,5). */
export function sizeRatio(size) {
  const [w, h] = size.split("x").map(Number);
  return w / h;
}

/**
 * Prompt Midjourney → prompt d'API : paramètres `--…` retirés, préfixe `/imagine prompt:` retiré, mentions « no text » du prompt
 * retirées (la consigne commune les remplace), fond « dark neutral background » changé en fond transparent si `cutout`,
 * préfixe de style en tête, consignes de cadrage, de fond et « no text » en fin.
 */
export function toApiPrompt(slot, { style = STYLE_PREFIX } = {}) {
  let body = (slot.prompt ?? "")
    .replace(/^\s*\/imagine\s+prompt:\s*/i, "")
    .replace(/(?:^|\s)--[a-z]+(?:\s+[^\s-][^\s]*)?/gi, "")
    .replace(/,?\s*\bno (?:text|letters|numbers|logos?)\b/gi, "")
    .replace(/,?\s*\bwithout text\b/gi, "");
  if (slot.cutout) body = body.replace(/\b(?:dark )?neutral background\b/gi, "transparent background");
  body = body
    .replace(/\s+,/g, ",")
    .replace(/,{2,}/g, ",")
    .replace(/\s{2,}/g, " ")
    .trim()
    .replace(/^,\s*|,\s*$/g, "");
  const parts = [];
  if (style) parts.push(style.trim());
  parts.push(`Subject: ${body}.`);
  const ratio = targetRatio(slot);
  const api = sizeRatio(pickSize(ratio));
  if (Math.abs(ratio / api - 1) > 0.1) {
    const ar = midjourneyParams(slot.prompt ?? "").ar;
    parts.push(`The image will be cropped to ${typeof ar === "string" ? ar : ratio.toFixed(2)}: keep the subject well inside the central area.`);
  }
  if (slot.cutout) parts.push(TRANSPARENT);
  parts.push(NO_TEXT);
  return parts.join(" ");
}

/** Emplacements à générer : `done` vide, filtres --group (sous-chaîne, sans casse ni accents), --ids, --limit. */
export function selectSlots(slots, { group, ids, limit, all = false } = {}) {
  const fold = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  let list = slots.filter((s) => all || !s.done);
  if (ids?.length) list = list.filter((s) => ids.includes(s.id));
  if (group) list = list.filter((s) => fold(s.group).includes(fold(group)));
  if (limit > 0) list = list.slice(0, limit);
  return list;
}

/** Corps de la requête images/generations pour un emplacement. */
export function requestBody(slot, { model = DEFAULT_MODEL, quality = "medium", n = 1, style } = {}) {
  return {
    model,
    prompt: toApiPrompt(slot, style === undefined ? {} : { style }),
    size: pickSize(targetRatio(slot)),
    quality,
    n,
    background: slot.cutout ? "transparent" : "opaque",
    output_format: "png",
  };
}

/** Coût estimé (dollars) d'une requête, d'après la grille PRICES. */
export function estimateCost(size, quality, n = 1) {
  return (PRICES[quality]?.[size] ?? NaN) * n;
}

/** Coût mesuré d'après le champ `usage` de la réponse (null s'il manque). */
export function usageCost(usage) {
  if (!usage) return null;
  const d = usage.input_tokens_details ?? {};
  const text = d.text_tokens ?? usage.input_tokens ?? 0;
  const image = d.image_tokens ?? 0;
  return (text * TOKEN_PRICES.textInput + image * TOKEN_PRICES.imageInput + (usage.output_tokens ?? 0) * TOKEN_PRICES.imageOutput) / 1e6;
}

/** Erreur à retenter : quota (429), erreur serveur (5xx) ou réseau (status absent). */
export function isRetryable(status) {
  return status === undefined || status === 429 || (status >= 500 && status <= 599);
}

/** Attente avant l'essai n° attempt (0, 1, 2…) : exponentielle (2 s, 4 s, 8 s… plafonnée à 60 s), ou `retry-after` s'il est donné. */
export function backoffMs(attempt, retryAfter, base = 2000) {
  const ra = Number(retryAfter);
  if (retryAfter != null && retryAfter !== "" && Number.isFinite(ra) && ra >= 0) return Math.min(ra * 1000, 120000);
  return Math.min(base * 2 ** attempt, 60000);
}

/** Rappels de branchement après intégration, par groupe (docs/illustrations.md, « Côté Claude », étape 3). */
export const WIRING = {
  "Technologies (Codex)": "ajouter l'identifiant de la techno à TECH_ART (src/game/technologies.ts), puis npm run build:hooks.",
  "Offres de la semaine": "rien à faire : la carte lit weekly-<id>.webp.",
  Annonces: "retirer pendingArt de l'annonce dont artSlot vaut l'identifiant (src/components/Announcement.tsx) ; illustrations.test.ts vérifie.",
  "Comptoir de la Ruche": "ajouter l'identifiant à SHOP_ITEM_ART (src/pages/BountiesPage.tsx).",
  Lune: "phalanx / jumpgate : image des fiches legend:phalange et legend:porte_saut (codex.ts) ; reliques : retirer le champ image de lentille_selene / cle_seuil (DEFAULT_RELICS) + migration patches ; announce-phalange : retirer pendingArt.",
  Prestige: "remplacer PRESTIGE_IMAGE (src/game/prestige.ts) par /assets/prestige/monument.webp, puis npm run build:hooks.",
  Bâtiments: "même nom de fichier : augmenter ASSET_VERSION (src/lib/assets.ts).",
};

/** Rappel par défaut (groupes sans branchement connu). */
export const WIRING_DEFAULT =
  "vérifier où l'image est lue (cible déjà référencée ? image provisoire à remplacer ?) ; même nom de fichier qu'une image existante : augmenter ASSET_VERSION (src/lib/assets.ts).";
