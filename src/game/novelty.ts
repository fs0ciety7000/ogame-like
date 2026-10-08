import { BUILDINGS, findBuilding } from "@/game/buildings";
import { checkPrereqs, findTech, TECHNOLOGIES } from "@/game/technologies";
import { findUnit, UNITS } from "@/game/units";
import { CONTENT_FAMILIES, contentName, contentObjective, parseContentObjective, type ContentFamily, type ContentObjective } from "@/game/trackedActions";
import type { PlayerState } from "@/types/game";

/* =====================================================
   6.14.122 (AU27, lot AP-L8, constat AP-10) : épisode « nouveauté ».

   Un contenu ajouté récemment (unité, techno, bâtiment : date d'ajout
   `addedOn` dans sa fiche, réglable dans l'admin) prend un épisode du
   chapitre suivant des Chroniques : « Le chantier a un nouveau plan :
   Récolteur. Construis-en 5. » L'objectif est l'action par contenu du
   registre des actions suivies (`unit:<id>`, `research:<id>`,
   `building:<id>`, 6.14.121), comptée dès le lancement.
   - Fréquence, durée de « nouveauté », épisode remplacé, quantités, part
     des joueurs actifs qui doivent y avoir accès : GameRules.novelty.
   - Textes : bibliothèque réglable (titres, accroches, ordres par famille).
   - Le choix a sa propre graine : le reste du chapitre ne change pas.
   - Un contenu n'est mis en avant qu'une fois ; un mois déjà écrit ne se
     régénère pas (I17) ; un chapitre de la bibliothèque n'en reçoit pas.
   Valeurs littérales (CLAUDE.md : pas de constante d'un autre module au chargement).
===================================================== */

export const NOVELTY_RULES = {
  /** Faux : jamais d'épisode « nouveauté ». */
  enabled: true,
  /** Au plus un épisode « nouveauté » tous les N mois (1 : chaque mois où un contenu est nouveau). */
  everyMonths: 1,
  /** Un contenu reste « nouveau » N jours après sa date d'ajout (comptés jusqu'au 1er du mois du chapitre). */
  noveltyDays: 45,
  /** Épisode remplacé (1 à 4). Le 2e par défaut : ouvert le 8, il laisse trois semaines. */
  episode: 2,
  /** Quantité demandée par famille. */
  counts: { unit: 5, research: 1, building: 1 } as Record<string, number>,
  /** Familles mises en avant. */
  families: { unit: true, research: true, building: true } as Record<string, boolean>,
  /** Part minimale des joueurs actifs qui y ont accès (unité débloquée, techno aux prérequis remplis, bâtiment ouvert). */
  minAccessShare: 0.5,
  /** Bibliothèque de textes ({name} : nom du contenu ; {count}, {s} : quantité et pluriel ; {faction}, {villain} : chapitre). */
  texts: {
    titles: ["Nouvelle donne", "Arrivage", "Le Prototype", "Plans frais", "La Pièce manquante", "Sorti des ateliers"],
    hooks: [
      "Une nouveauté vient d'arriver dans le secteur, et {faction} ne la connaît pas encore.",
      "Nos ingénieurs ont fini quelque chose. Tant que {villain} ne s'y attend pas, profitons-en.",
      "Ce que {faction} craint le plus, c'est ce qu'il n'a jamais vu. Nous avons du neuf.",
      "Le secteur change vite. Ceux qui prennent l'avance la gardent.",
    ],
    orders: {
      unit: ["Le chantier a un nouveau plan : {name}. Construis-en {count}.", "Les premiers {name} sont prêts à sortir. Lance-en {count} au chantier."],
      research: ["Le Labo a une piste neuve : {name}. Lance {count} niveau{s} de recherche.", "{name} peut tout changer. {count} niveau{s} au Labo, commandant."],
      building: ["Un nouveau bâtiment attend tes ordres : {name}. Lance {count} amélioration{s}.", "{name} doit sortir de terre. {count} amélioration{s}, et vite."],
    } as Record<string, string[]>,
  },
};

export type NoveltyRules = typeof NOVELTY_RULES;

/** Libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const NOVELTY_RULES_META = {
  enabled: { label: "Épisode « nouveauté » dans les Chroniques générées", hint: "Un contenu ajouté récemment (date d'ajout dans sa fiche) prend un épisode du chapitre suivant. Un mois déjà écrit ne change pas." },
  everyMonths: { label: "Au plus un épisode « nouveauté » tous les", unit: "mois", min: 1, max: 12 },
  noveltyDays: { label: "Un contenu reste nouveau pendant", unit: "j", min: 1, max: 365, hint: "Jours entre la date d'ajout du contenu et le 1er du mois du chapitre." },
  episode: { label: "Épisode remplacé", min: 1, max: 4, hint: "2 : ouvert le 8 du mois, trois semaines pour le faire." },
  counts: { label: "Quantité demandée par famille", hint: "unit : unités à lancer ; research : niveaux de recherche ; building : améliorations." },
  families: { label: "Familles mises en avant", hint: "unit, research, building : décocher pour ne jamais mettre en avant ce type." },
  minAccessShare: { label: "Part des joueurs actifs qui doivent y avoir accès", unit: "part", min: 0, max: 1, hint: "Unité débloquée, techno aux prérequis remplis, bâtiment ouvert. Sans joueur actif mesuré : pas d'épisode « nouveauté »." },
  texts: { label: "Bibliothèque de textes", hint: "titles, hooks, orders.unit, orders.research, orders.building ; {name}, {count}, {s}, {faction}, {villain}." },
};

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

export function validateNoveltyRules(r: Partial<NoveltyRules> | undefined): string[] {
  if (!r) return [];
  const e: string[] = [];
  const L = "Épisode « nouveauté »";
  for (const [k, v] of Object.entries(r.counts ?? {})) {
    if (!(CONTENT_FAMILIES as string[]).includes(k)) e.push(`${L} : famille « ${k} » inconnue.`);
    else if (!(Number.isInteger(Number(v)) && Number(v) >= 1 && Number(v) <= 1000)) e.push(`${L} : quantité de ${k} entière, entre 1 et 1 000.`);
  }
  const t = r.texts;
  if (t) {
    if (!Array.isArray(t.titles) || t.titles.filter((x) => typeof x === "string" && x.trim()).length === 0) e.push(`${L} : au moins un titre.`);
    if (!Array.isArray(t.hooks) || t.hooks.filter((x) => typeof x === "string" && x.trim()).length === 0) e.push(`${L} : au moins une accroche.`);
    for (const f of CONTENT_FAMILIES) {
      const list = t.orders?.[f];
      if (!Array.isArray(list) || !list.some((x) => typeof x === "string" && x.includes("{name}"))) e.push(`${L} : au moins un ordre « ${f} » avec {name}.`);
    }
  }
  return e;
}

/** Date d'ajout d'un contenu (`addedOn`, AAAA-MM-JJ) : erreur de format (null : absente ou bonne). */
export function addedOnError(v: unknown): string | null {
  if (v === undefined || v === null || v === "") return null;
  if (typeof v !== "string" || !DATE.test(v) || !Number.isFinite(Date.parse(`${v}T00:00:00Z`))) return "date d'ajout au format AAAA-MM-JJ";
  return null;
}

/** Fiches en vigueur d'une famille, avec leur date d'ajout. */
function familyDefs(family: ContentFamily): { id: string; addedOn?: string }[] {
  return family === "unit" ? UNITS : family === "research" ? TECHNOLOGIES : BUILDINGS;
}

export function contentAddedOn(key: ContentObjective): string | null {
  const c = parseContentObjective(key);
  if (!c) return null;
  const d = c.family === "unit" ? findUnit(c.id) : c.family === "research" ? findTech(c.id) : findBuilding(c.id);
  const v = (d as { addedOn?: string } | undefined)?.addedOn;
  return typeof v === "string" && addedOnError(v) === null ? v : null;
}

/** 1er du mois (« 2026-12 ») à 0 h UTC. */
function monthStartMs(monthId: string): number {
  const [y, m] = monthId.split("-").map(Number);
  return Date.UTC(y, m - 1, 1);
}

function monthsBetween(a: string, b: string): number {
  const [ya, ma] = a.split("-").map(Number);
  const [yb, mb] = b.split("-").map(Number);
  return (yb - ya) * 12 + (mb - ma);
}

/** Contenus datés depuis moins de `noveltyDays` jours au 1er du mois (le plus récent d'abord ; identifiant à égalité). */
export function recentContent(monthId: string, r: NoveltyRules = NOVELTY_RULES): { key: ContentObjective; addedOn: string }[] {
  const start = monthStartMs(monthId);
  const span = Math.max(1, Number(r.noveltyDays) || 0) * DAY_MS;
  const out: { key: ContentObjective; addedOn: string }[] = [];
  for (const f of CONTENT_FAMILIES) {
    if (r.families?.[f] === false) continue;
    for (const d of familyDefs(f)) {
      const at = d.addedOn;
      if (typeof at !== "string" || addedOnError(at)) continue;
      const ms = Date.parse(`${at}T00:00:00Z`);
      if (ms <= start && start - ms <= span) out.push({ key: contentObjective(f, d.id), addedOn: at });
    }
  }
  return out.sort((a, b) => (a.addedOn > b.addedOn ? -1 : a.addedOn < b.addedOn ? 1 : a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
}

/** Contenus datés à mesurer dans la photographie du monde (fenêtre large : le mois en cours et les deux suivants). */
export function contentToMeasure(now: number, r: NoveltyRules = NOVELTY_RULES): ContentObjective[] {
  const span = (Math.max(1, Number(r.noveltyDays) || 0) + 92) * DAY_MS;
  const out: ContentObjective[] = [];
  for (const f of CONTENT_FAMILIES)
    for (const d of familyDefs(f)) {
      const at = d.addedOn;
      if (typeof at !== "string" || addedOnError(at)) continue;
      const ms = Date.parse(`${at}T00:00:00Z`);
      if (ms <= now + 62 * DAY_MS && now - ms <= span) out.push(contentObjective(f, d.id));
    }
  return out;
}

/** Le joueur a-t-il accès au contenu (unité débloquée, techno aux prérequis remplis ou déjà lancée, bâtiment ouvert) ? */
export function hasContentAccess(p: Pick<PlayerState, "units" | "techLevels" | "buildings">, key: ContentObjective): boolean {
  const c = parseContentObjective(key);
  if (!c) return false;
  if (c.family === "unit") return (Number(p.units?.[c.id]?.level) || 0) > 0;
  if (c.family === "research") {
    const t = findTech(c.id);
    if (!t) return false;
    return (Number(p.techLevels?.[c.id]) || 0) > 0 || checkPrereqs(t, p.techLevels ?? {}).valid;
  }
  const b = findBuilding(c.id);
  const st = p.buildings?.[c.id as keyof PlayerState["buildings"]];
  return !!b && (!!b.startsUnlocked || !!st?.unlocked || (Number(st?.level) || 0) > 0);
}

/** Mois déjà marqués par un épisode « nouveauté » (pour la fréquence et pour ne jamais mettre deux fois le même contenu en avant). */
export interface NoveltyMark {
  key: string;
  addedOn: string;
  episode: number;
}

export interface NoveltyPick {
  key: ContentObjective;
  addedOn: string;
  name: string;
  count: number;
  episode: number;
  reason: string;
}

/**
 * Contenu à mettre en avant dans le chapitre de `monthId`, ou null avec la raison. `existing` : mois déjà écrits (marques
 * `auto.novelty`) ; `access` : part des joueurs actifs qui ont accès à chaque contenu mesuré (`WorldDigest.access`).
 */
export function chooseNovelty(
  monthId: string,
  existing: { id: string; auto?: { novelty?: NoveltyMark } }[],
  access: Partial<Record<string, number>> | undefined,
  activePlayers: number,
  r: NoveltyRules = NOVELTY_RULES,
): { pick: NoveltyPick | null; reason: string | null } {
  if (!r.enabled) return { pick: null, reason: null };
  const candidates = recentContent(monthId, r);
  if (candidates.length === 0) return { pick: null, reason: null };
  const marked = existing.filter((m) => m.auto?.novelty && m.id < monthId).sort((a, b) => (a.id < b.id ? -1 : 1));
  const last = marked.at(-1);
  const every = Math.max(1, Math.floor(Number(r.everyMonths) || 1));
  if (last && monthsBetween(last.id, monthId) < every) return { pick: null, reason: `Nouveauté : un épisode au plus tous les ${every} mois (dernier : ${last.id}).` };
  if (!(activePlayers > 0)) return { pick: null, reason: "Nouveauté : aucun joueur actif mesuré, pas d'épisode « nouveauté »." };
  const featured = new Set(existing.map((m) => m.auto?.novelty?.key).filter((k): k is string => !!k));
  const minShare = Math.max(0, Math.min(1, Number(r.minAccessShare) || 0));
  const skipped: string[] = [];
  for (const c of candidates) {
    if (featured.has(c.key)) continue;
    const share = Number(access?.[c.key] ?? 0);
    const name = contentName(parseContentObjective(c.key)!.family, parseContentObjective(c.key)!.id);
    if (share < minShare) {
      skipped.push(`${name} (${Math.round(share * 100)} % y ont accès)`);
      continue;
    }
    const family = parseContentObjective(c.key)!.family;
    const count = Math.max(1, Math.floor(Number(r.counts?.[family]) || 1));
    const episode = Math.min(4, Math.max(1, Math.floor(Number(r.episode) || 2)));
    return {
      pick: { key: c.key, addedOn: c.addedOn, name, count, episode, reason: `Nouveauté : ${name} (ajouté le ${c.addedOn}, ${Math.round(share * 100)} % des joueurs actifs y ont accès) prend l'épisode ${episode}.` },
      reason: null,
    };
  }
  return { pick: null, reason: skipped.length > 0 ? `Nouveauté : contenu trop peu accessible (moins de ${Math.round(minShare * 100)} %) : ${skipped.join(", ")}.` : null };
}

/** Textes de l'épisode « nouveauté » (bibliothèque réglable ; une liste vide reprend celle du code). */
export function noveltyTexts(family: ContentFamily, r: NoveltyRules = NOVELTY_RULES): { titles: string[]; hooks: string[]; orders: string[] } {
  const d = DEFAULT_TEXTS;
  const ok = (xs: unknown, fallback: string[]) => (Array.isArray(xs) && xs.some((x) => typeof x === "string" && x.trim()) ? (xs as string[]).filter((x) => typeof x === "string" && x.trim()) : fallback);
  return {
    titles: ok(r.texts?.titles, d.titles),
    hooks: ok(r.texts?.hooks, d.hooks),
    orders: ok(r.texts?.orders?.[family], d.orders[family]),
  };
}

const DEFAULT_TEXTS = structuredClone(NOVELTY_RULES.texts);
