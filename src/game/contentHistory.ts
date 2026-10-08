import { normalizeAnnouncementSettings } from "@/game/announcements";
import { normalizeBanners } from "@/game/banners";
import { normalizeCasinoSettings, validateCasinoSettings } from "@/game/casino";
import { normalizeCustomEmojis } from "@/game/emojis";
import { normalizeProcedural } from "@/game/procedural";

/* =====================================================
   6.14.126 (AU27, lot AA8, constat AA-27) : historique dans l'admin.
   - Différence champ par champ entre deux états d'une section de contenu ou
     d'un réglage serveur (journal des versions : « ce qui a changé »).
   - Retour arrière d'un seul groupe de règles (au lieu de toute la section
     « rules ») : les autres groupes gardent leur état actuel.
   - Instantanés étendus aux réglages serveur hors CONTENT_SECTIONS (casino,
     générateurs, annonces, bandeaux, émojis, équipe). Pour chacun : la partie
     gardée (réglages seulement, jamais l'état de jeu : pot du casino, journal
     des générateurs) et si un retour arrière est permis.
   Moteur pur (goja) : le serveur fait autorité (route admin, garde de contenu).
===================================================== */

export interface SettingsHistoryDef {
  /** Nom affiché dans le journal. */
  label: string;
  /** Seule cette partie de la donnée est gardée et restaurée (le reste est de l'état de jeu). */
  field?: string;
  /** Champs jamais restaurés (gardés tels qu'ils sont au moment du retour). */
  keep?: string[];
  /** Retour arrière permis (sinon : historique et différence seulement). */
  rollback: boolean;
  /** Pourquoi le retour arrière est fermé. */
  why?: string;
}

/** Réglages serveur suivis par le journal (clés de game_config hors sections de contenu). */
export const SETTINGS_HISTORY: Record<string, SettingsHistoryDef> = {
  casino: { label: "Casino (réglages)", field: "settings", rollback: true },
  procedural: { label: "Générateurs (réglages)", keep: ["log"], rollback: true },
  announcements: { label: "Annonces", rollback: true },
  banners: { label: "Bandeaux", rollback: true },
  emojis: { label: "Émojis", rollback: true },
  staff: { label: "Équipe (rôles)", rollback: false, why: "Les rôles suivent les administrateurs et les titres des joueurs : change-les dans l'onglet Administrateurs." },
};

export function isSettingsHistoryKey(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(SETTINGS_HISTORY, key);
}

/** Partie gardée d'un réglage serveur (instantané). */
export function settingsSnapshot(key: string, data: unknown): unknown {
  const def = SETTINGS_HISTORY[key];
  if (!def || data === null || data === undefined) return data ?? null;
  if (def.field) return data && typeof data === "object" ? ((data as Record<string, unknown>)[def.field] ?? null) : null;
  if (def.keep && data && typeof data === "object" && !Array.isArray(data)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) if (!def.keep.includes(k)) out[k] = v;
    return out;
  }
  return data;
}

/** Donnée à écrire pour revenir à `snapshot`, sans toucher à l'état de jeu de `current`, normalisée ; erreurs bloquantes. */
export function restoreSettings(key: string, current: unknown, snapshot: unknown): { data: unknown; errors: string[] } {
  const def = SETTINGS_HISTORY[key];
  if (!def) return { data: null, errors: [`Réglage « ${key} » sans historique.`] };
  if (!def.rollback) return { data: null, errors: [def.why ?? "Retour arrière fermé pour ce réglage."] };
  const cur = current && typeof current === "object" && !Array.isArray(current) ? (current as Record<string, unknown>) : {};
  let data: unknown;
  if (def.field) data = { ...cur, [def.field]: snapshot };
  else if (def.keep) {
    data = { ...(snapshot && typeof snapshot === "object" && !Array.isArray(snapshot) ? (snapshot as Record<string, unknown>) : {}) };
    for (const k of def.keep) if (k in cur) (data as Record<string, unknown>)[k] = cur[k];
  } else data = snapshot;
  const errors: string[] = [];
  switch (key) {
    case "casino": {
      const settings = normalizeCasinoSettings((data as Record<string, unknown>).settings);
      errors.push(...validateCasinoSettings(settings));
      data = { ...(data as Record<string, unknown>), settings };
      break;
    }
    case "procedural":
      data = normalizeProcedural(data);
      break;
    case "announcements":
      data = normalizeAnnouncementSettings(data);
      break;
    case "banners":
      data = normalizeBanners(data);
      break;
    case "emojis":
      data = normalizeCustomEmojis(data);
      break;
  }
  return { data, errors };
}

/* ---------- différence champ par champ ---------- */

export interface DiffLine {
  /** Chemin lisible : « combat.maxRounds », « units[fregate].cost.scrap », « alliances.researches[logistique] ». */
  path: string;
  kind: "added" | "removed" | "changed";
  before?: string;
  after?: string;
}

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === "object" && !Array.isArray(v);
const byId = (v: unknown[]): boolean => v.length > 0 && v.every((x) => isObj(x) && typeof x.id === "string" && x.id !== "");

/** Valeur courte (80 caractères au plus) pour le journal. */
function shortJson(v: unknown, max = 80): string {
  if (v === undefined) return "—";
  const text = typeof v === "string" ? `« ${v} »` : JSON.stringify(v);
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

const sortKeys = (keys: string[]) => [...keys].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0));

/**
 * Différence entre deux états (`before` → `after`), feuille par feuille. Une liste d'objets à identifiant se compare par
 * identifiant (un élément ajouté ou retiré est une ligne) ; une autre liste, élément par élément. `max` lignes au plus.
 */
export function diffValues(before: unknown, after: unknown, max = 200): DiffLine[] {
  const out: DiffLine[] = [];
  const walk = (a: unknown, b: unknown, path: string) => {
    if (out.length >= max) return;
    if (a === undefined && b === undefined) return;
    if (a === undefined) {
      out.push({ path: path || "(tout)", kind: "added", after: shortJson(b) });
      return;
    }
    if (b === undefined) {
      out.push({ path: path || "(tout)", kind: "removed", before: shortJson(a) });
      return;
    }
    if (isObj(a) && isObj(b)) {
      for (const k of sortKeys([...new Set([...Object.keys(a), ...Object.keys(b)])])) walk(a[k], b[k], path ? `${path}.${k}` : k);
      return;
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      if (byId(a) && byId(b)) {
        const ia = new Map(a.map((x) => [(x as { id: string }).id, x]));
        const ib = new Map(b.map((x) => [(x as { id: string }).id, x]));
        const ids = [...ia.keys(), ...[...ib.keys()].filter((id) => !ia.has(id))];
        for (const id of ids) walk(ia.get(id), ib.get(id), `${path}[${id}]`);
        return;
      }
      if (a.every((x) => !x || typeof x !== "object") && b.every((x) => !x || typeof x !== "object")) {
        if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ path: path || "(tout)", kind: "changed", before: shortJson(a), after: shortJson(b) });
        return;
      }
      for (let i = 0; i < Math.max(a.length, b.length); i++) walk(a[i], b[i], `${path}[${i}]`);
      return;
    }
    if (JSON.stringify(a) !== JSON.stringify(b)) out.push({ path: path || "(tout)", kind: "changed", before: shortJson(a), after: shortJson(b) });
  };
  walk(before ?? undefined, after ?? undefined, "");
  return out;
}

/* ---------- retour arrière d'un groupe de règles ---------- */

/** Groupes de règles (premier niveau de la section « rules ») qui diffèrent entre deux états enregistrés. */
export function changedRuleGroups(before: unknown, after: unknown): string[] {
  const a = isObj(before) ? before : {};
  const b = isObj(after) ? after : {};
  return sortKeys([...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => JSON.stringify(a[k]) !== JSON.stringify(b[k])));
}

/**
 * Règles enregistrées après le retour d'un seul groupe : `current` (état actuel) dont le groupe `group` prend sa valeur dans
 * `version` (absent de la version : le groupe revient aux valeurs du code). Les autres groupes ne bougent pas.
 */
export function rollbackRuleGroup(current: unknown, version: unknown, group: string): Record<string, unknown> {
  const out: Record<string, unknown> = { ...(isObj(current) ? current : {}) };
  const v = isObj(version) ? version : {};
  if (group in v) out[group] = structuredClone(v[group]);
  else delete out[group];
  return out;
}
