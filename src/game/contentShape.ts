/**
 * 6.14.59 (AU27, lot AA1 : garde-fous) : validation récursive d'un contenu selon la forme de sa valeur par défaut.
 *
 * Une valeur saisie dans l'admin (ou envoyée directement à l'API) garde le type de son défaut, à toute profondeur :
 * - un nombre reste un nombre fini (`null`, texte ou `NaN` refusés) ; il n'est pas négatif quand tous les défauts
 *   connus sont positifs ou nuls ;
 * - un oui/non, un texte, une liste ou un objet gardent leur type ;
 * - chaque élément d'une liste d'objets est comparé aux éléments par défaut : un champ présent dans **tous** les
 *   éléments par défaut, s'il est un nombre, une liste ou un objet, est obligatoire (une recherche d'alliance sans
 *   `perLevel` donnait `NaN`) ;
 * - une clé inconnue du défaut est laissée passer (contenu ajouté, champ optionnel) : on ne refuse que ce qui casse.
 *
 * Moteur pur (pas de DOM, pas d'`Intl`) : appelé par le serveur (`guardContentConfig`) et par l'admin.
 * Question validée Q75 (AA-Q6) : refuser les types et formes invalides ; les écarts de valeur seulement avertis.
 */

type Kind = "number" | "string" | "boolean" | "array" | "object";

const KIND_LABEL: Record<Kind, string> = {
  number: "un nombre",
  string: "un texte",
  boolean: "oui ou non",
  array: "une liste",
  object: "un objet",
};

function kindOf(v: unknown): Kind | null {
  if (typeof v === "number") return "number";
  if (typeof v === "string") return "string";
  if (typeof v === "boolean") return "boolean";
  if (Array.isArray(v)) return "array";
  if (v && typeof v === "object") return "object";
  return null;
}

function describe(v: unknown): string {
  if (v === null) return "vide (null)";
  if (typeof v === "number" && !Number.isFinite(v)) return String(v);
  if (typeof v === "string") return `le texte « ${v.length > 24 ? `${v.slice(0, 24)}…` : v} »`;
  if (Array.isArray(v)) return "une liste";
  if (typeof v === "object") return "un objet";
  return String(v);
}

const join = (path: string, key: string | number) => (typeof key === "number" ? `${path}[${key}]` : path ? `${path}.${key}` : key);

/** Nombre d'erreurs au plus par appel (un JSON entièrement faux ne noie pas le message). */
const MAX_ERRORS = 20;

/**
 * Compare `value` aux valeurs par défaut `samples` (plusieurs exemples possibles : tous les éléments d'une liste par défaut).
 * `label` préfixe chaque message (« Unité Frégate », « Règles › Combat ») ; `path` est le champ fautif.
 */
function check(value: unknown, samples: unknown[], label: string, path: string, errors: string[]): void {
  if (errors.length >= MAX_ERRORS || value === undefined) return;
  const nullable = samples.some((s) => s === null);
  const known = samples.filter((s) => s !== null && s !== undefined);
  if (known.length === 0) return;
  const kinds = new Set(known.map(kindOf).filter((k): k is Kind => k !== null));
  if (kinds.size === 0) return;
  const field = path ? `« ${path} »` : "la valeur";
  const expected = [...kinds].map((k) => KIND_LABEL[k]).join(" ou ");
  if (value === null) {
    // `null` = « comportement par défaut » seulement là où le défaut l'est aussi, ou pour un objet (fusion champ par champ).
    if (!nullable && (kinds.has("number") || kinds.has("array") || kinds.has("string") || kinds.has("boolean"))) errors.push(`${label} : ${field} doit être ${expected}, reçu : vide (null).`);
    return;
  }
  const kind = kindOf(value);
  if (!kind || !kinds.has(kind)) {
    errors.push(`${label} : ${field} doit être ${expected}, reçu : ${describe(value)}.`);
    return;
  }
  if (kind === "number") {
    const n = value as number;
    if (!Number.isFinite(n)) errors.push(`${label} : ${field} doit être un nombre fini, reçu : ${describe(n)}.`);
    else if (n < 0 && known.every((s) => typeof s !== "number" || s >= 0)) errors.push(`${label} : ${field} ne peut pas être négatif (reçu : ${n}).`);
    return;
  }
  if (kind === "array") {
    const elementSamples = known.filter(Array.isArray).reduce<unknown[]>((acc, s) => acc.concat(s as unknown[]), []);
    if (elementSamples.length === 0) return;
    (value as unknown[]).forEach((el, i) => checkElement(el, elementSamples, label, join(path, i), errors));
    return;
  }
  if (kind === "object") {
    const objSamples = known.filter((s): s is Record<string, unknown> => kindOf(s) === "object");
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const sub = objSamples.filter((s) => k in s).map((s) => s[k]);
      if (sub.length > 0) check(v, sub, label, join(path, k), errors);
    }
  }
}

/** Élément d'une liste : objet comparé aux éléments par défaut (champs obligatoires = présents dans tous). */
function checkElement(value: unknown, samples: unknown[], label: string, path: string, errors: string[]): void {
  const objSamples = samples.filter((s): s is Record<string, unknown> => kindOf(s) === "object");
  if (objSamples.length > 0 && objSamples.length === samples.filter((s) => s !== null && s !== undefined).length && kindOf(value) === "object") {
    const el = value as Record<string, unknown>;
    // Obligatoire : présent dans tous les défauts, et nombre, liste ou objet (un texte ou un oui/non absent ne casse rien).
    const required = Object.keys(objSamples[0]).filter((k) => objSamples.every((s) => s[k] !== undefined && s[k] !== null && (typeof s[k] === "number" || typeof s[k] === "object")));
    for (const k of required) if (el[k] === undefined && errors.length < MAX_ERRORS) errors.push(`${label} : « ${join(path, k)} » manquant (attendu : ${KIND_LABEL[kindOf(objSamples[0][k]) ?? "number"]}).`);
  }
  check(value, samples, label, path, errors);
}

/** Valide une valeur selon la forme de son défaut. Vide = conforme. */
export function shapeErrors(label: string, value: unknown, defaultValue: unknown, path = ""): string[] {
  const errors: string[] = [];
  check(value, [defaultValue], label, path, errors);
  return errors;
}

/**
 * Liste de définitions (unités, bâtiments, technos, reliques) : chaque élément est comparé à tous les éléments par défaut.
 * L'élément est désigné par son nom (ou son identifiant) dans le message.
 */
export function listShapeErrors(section: string, itemLabel: string, value: unknown, defaults: readonly unknown[]): string[] {
  if (!Array.isArray(value)) return [`${section} : la section doit être une liste, reçu : ${describe(value)}.`];
  const errors: string[] = [];
  value.forEach((el, i) => {
    if (errors.length >= MAX_ERRORS) return;
    if (kindOf(el) !== "object") {
      errors.push(`${section} : l'élément n° ${i + 1} doit être un objet, reçu : ${describe(el)}.`);
      return;
    }
    const o = el as Record<string, unknown>;
    const name = typeof o.name === "string" && o.name ? o.name : typeof o.nom === "string" && o.nom ? o.nom : typeof o.id === "string" ? o.id : `n° ${i + 1}`;
    checkElement(el, [...defaults], `${itemLabel} ${name}`, "", errors);
  });
  return errors;
}

/**
 * Avertissements (non bloquants, Q75) : nombre de premier ou second niveau d'un groupe de règles qui s'écarte de plus
 * de ×`factor` (ou ÷`factor`) de sa valeur par défaut. Un défaut à 0 n'est pas comparé.
 */
export function driftWarnings(label: string, value: unknown, defaultValue: unknown, factor = 2): string[] {
  const out: string[] = [];
  const walk = (v: unknown, d: unknown, path: string, depth: number) => {
    if (typeof v === "number" && typeof d === "number") {
      if (d !== 0 && Number.isFinite(v) && Math.sign(v) === Math.sign(d) && (Math.abs(v) > Math.abs(d) * factor || Math.abs(v) < Math.abs(d) / factor))
        out.push(`${label} : « ${path} » vaut ${v} (défaut ${d}), plus de ×${factor} d'écart.`);
      return;
    }
    if (depth >= 2 || kindOf(v) !== "object" || kindOf(d) !== "object") return;
    for (const [k, sub] of Object.entries(v as Record<string, unknown>)) walk(sub, (d as Record<string, unknown>)[k], join(path, k), depth + 1);
  };
  walk(value, defaultValue, "", 0);
  return out;
}
