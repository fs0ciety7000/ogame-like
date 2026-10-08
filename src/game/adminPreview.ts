import { diffValues } from "@/game/contentHistory";
import { ruleFieldMeta } from "@/game/ruleRegistry";

/* =====================================================
   6.14.154 (AU27, lot R6, constat AA-28) : aperçu avant / après dans
   l'admin. Avant d'enregistrer, l'éditeur montre la valeur enregistrée
   (en vigueur) et la nouvelle, avec l'ordre de grandeur de l'écart : un
   coût, une durée ou un réglage qui passe à plus de ×2 (ou moins de ÷2)
   est signalé. Rien n'est bloqué : c'est une aide à la relecture.
   Module pur (sans DOM) : testé par `adminEvolutifSuite.test.ts`.
===================================================== */

/** Écart au-delà duquel un changement est signalé (×2 ou ÷2, comme `ruleDriftWarnings`). */
const PREVIEW_ALERT_FACTOR = 2;

export interface ValueDelta {
  before: number;
  after: number;
  /** after ÷ before (null si l'une des deux valeurs est nulle ou absente). */
  ratio: number | null;
  /** Écart d'au moins ×2 ou ÷2, ou passage de 0 à une valeur (et inversement). */
  alert: boolean;
}

/** Écart entre la valeur enregistrée et la nouvelle. */
export function valueDelta(before: number, after: number, factor = PREVIEW_ALERT_FACTOR): ValueDelta {
  const b = Number(before) || 0;
  const a = Number(after) || 0;
  if (b === a) return { before: b, after: a, ratio: b === 0 ? null : 1, alert: false };
  if (b === 0 || a === 0) return { before: b, after: a, ratio: null, alert: true };
  const ratio = a / b;
  return { before: b, after: a, ratio, alert: ratio >= factor || ratio <= 1 / factor };
}

/** Total d'un coût (toutes ressources confondues) : ordre de grandeur pour l'écart. */
export function costTotal(cost: Record<string, number | undefined> | null | undefined): number {
  return Object.values(cost ?? {}).reduce<number>((s, v) => s + (Number(v) || 0), 0);
}

/** « ×1,5 », « ÷3 », « ±0 » : écart lisible (le chiffre avant le sens). */
export function formatRatio(ratio: number | null): string {
  if (ratio === null) return "nouveau";
  if (ratio === 1) return "=";
  const r = ratio >= 1 ? ratio : 1 / ratio;
  const text = (Math.round(r * 100) / 100).toString().replace(".", ",");
  return ratio >= 1 ? `×${text}` : `÷${text}`;
}

export interface RuleChange {
  /** Chemin complet (« research.timeGrowth »). */
  path: string;
  /** Libellé du champ (métadonnées du registre), sinon le chemin. */
  label: string;
  before: string;
  after: string;
  ratio: number | null;
  alert: boolean;
}

/**
 * Changements entre les règles enregistrées (`saved`) et le brouillon (`draft`), feuille par feuille : valeur avant, valeur
 * après et, pour un nombre, l'écart. Sert l'encart « Avant / après » de l'onglet Règles (et de tout éditeur de section).
 */
export function previewChanges(saved: unknown, draft: unknown, max = 200): RuleChange[] {
  return diffValues(saved, draft, max).map((d) => {
    const [group, key] = d.path.split(/[.[]/);
    const meta = group && key ? ruleFieldMeta(group, key) : undefined;
    const b = Number(d.before);
    const a = Number(d.after);
    const numeric = d.kind === "changed" && d.before !== undefined && d.after !== undefined && d.before.trim() !== "" && d.after.trim() !== "" && Number.isFinite(b) && Number.isFinite(a);
    const delta = numeric ? valueDelta(b, a) : null;
    return {
      path: d.path,
      label: meta?.label ? `${meta.label}${d.path === `${group}.${key}` ? "" : ` (${d.path})`}` : d.path,
      // Nombre écrit à la française (virgule décimale), comme le reste de l'admin.
      before: numeric ? String(b).replace(".", ",") : (d.before ?? "—"),
      after: numeric ? String(a).replace(".", ",") : (d.after ?? "—"),
      ratio: delta?.ratio ?? null,
      alert: delta?.alert ?? false,
    };
  });
}
