import { describeEffect, EFFECT_STATS, formatEffectValue, isUnitSelector, validateValuedEffects, type EffectGrant, type EffectStat, type ValuedEffect } from "@/game/effects";
import { formatPct } from "@/game/format";

/* =====================================================
   5.16 : mutateur de saison. Chaque mois, une règle spéciale s'applique à
   tout le serveur (production, durées, combat, flottes, marché…). Elle est
   tirée de façon déterministe à partir du mois (jamais deux fois de suite),
   annoncée dans les Chroniques et sur l'accueil, et passe par le circuit
   d'effets : client et serveur appliquent exactement la même chose.
   L'administration peut imposer un mutateur pour un mois, ou n'en mettre aucun.
===================================================== */

/** Mutateur tel que le jeu le lit : description construite depuis ses effets en vigueur. */
export interface MutatorDef {
  id: string;
  name: string;
  emoji: string;
  /** Une phrase, affichée aux joueurs. 6.14.125 (AA7) : accroche + effets en vigueur. */
  readonly description: string;
  readonly grants: ValuedEffect[];
}

/** 6.14.125 (AU27, lot AA7, constat AA-6) : mutateur tel que l'admin le règle (`mutators.defs`). */
export interface MutatorEntry {
  id: string;
  name: string;
  emoji: string;
  /** Phrase d'accroche, avant les effets (« Les forges tournent à plein »). Vide : le nom. */
  flavor?: string;
  /** Effets composés chiffrés (couche empire, source « season »), pour tout le serveur. */
  effects: ValuedEffect[];
}

/** Mutateurs livrés (valeurs littérales : piège « Initialisation des modules »). */
const DEFAULT_MUTATOR_DEFS: MutatorEntry[] = [
  { id: "ruee", name: "Ruée industrielle", emoji: "🏭", flavor: "Les forges tournent à plein", effects: [{ stat: "productionAll", value: 0.1 }] },
  { id: "chantiers", name: "Chantiers fiévreux", emoji: "🏗️", flavor: "Les équipes se relaient jour et nuit", effects: [{ stat: "buildTime", value: 0.15 }] },
  { id: "savoir", name: "Âge du savoir", emoji: "🔬", flavor: "Les laboratoires s'emballent", effects: [{ stat: "researchTime", value: 0.15 }] },
  { id: "vents", name: "Vents solaires", emoji: "☄️", flavor: "Les courants stellaires portent les flottes", effects: [{ stat: "fleetSpeed", value: 0.15 }] },
  { id: "guerre", name: "Saison de guerre", emoji: "⚔️", flavor: "Le secteur s'embrase", effects: [{ stat: "attack", value: 0.1 }, { stat: "loot", value: 0.2 }] },
  { id: "rempart", name: "Saison des remparts", emoji: "🛡️", flavor: "Les ingénieurs renforcent les coques", effects: [{ stat: "defense", value: 0.1 }, { stat: "repair", value: 0.1 }] },
  { id: "marchands", name: "Foire des marchands", emoji: "💱", flavor: "Les comptoirs baissent leurs taxes", effects: [{ stat: "tradeTax", value: 0.5 }] },
  { id: "chantiers_navals", name: "Cadence des arsenaux", emoji: "🚀", flavor: "Les arsenaux accélèrent", effects: [{ stat: "unitTime", value: 0.2 }] },
  { id: "soutes", name: "Grandes soutes", emoji: "📦", flavor: "Des soutes repensées", effects: [{ stat: "cargo", value: 0.25 }] },
  { id: "chasse", name: "Grande chasse", emoji: "🐋", flavor: "Les géants sont vulnérables", effects: [{ stat: "bossDamage", value: 0.15 }] },
];

/** Tournures propres à un mutateur (le libellé de la grandeur ne se lit pas bien après « de »). */
const STAT_PHRASES: Partial<Record<EffectStat, string>> = {
  tradeTax: "taxe au marché et sur les cadeaux",
  cargo: "cargaison pour les flottes",
};

/** « +10 % de production de toutes les ressources », « −15 % de temps de vol », « +10 % d'attaque ». Sans Intl (goja). */
export function mutatorEffectPhrase(e: ValuedEffect): string {
  const info = EFFECT_STATS[e.stat];
  if (!info) return e.stat;
  const v = Number(e.value) || 0;
  const sign = info.reduction ? "−" : "+";
  const amount = info.unit === "pct" ? `${sign}${formatPct(v, Math.abs(v * 100 - Math.round(v * 100)) < 1e-9 ? 0 : 1)}` : formatEffectValue(e.stat, v);
  // Libellé (cible et portée comprises) tel que l'écrit la fiche d'effets, après « · ».
  const described = describeEffect(e.stat, v, e.target, e.scope);
  const rest = described.slice(described.indexOf(" · ") + 3);
  const label = STAT_PHRASES[e.stat] && !e.target && (!e.scope || e.scope === "all") ? STAT_PHRASES[e.stat]! : rest.replace(/^\S/, (c) => c.toLowerCase());
  return `${amount} ${/^[aeiouyéèêâîôûh]/i.test(label) ? "d'" : "de "}${label}`;
}

/** Description d'un mutateur : « Accroche : effet 1, effet 2 et effet 3. » */
export function mutatorDescription(m: Pick<MutatorEntry, "name" | "flavor" | "effects">): string {
  const parts = (m.effects ?? []).map(mutatorEffectPhrase);
  const list = parts.length <= 1 ? (parts[0] ?? "aucun effet") : `${parts.slice(0, -1).join(", ")} et ${parts[parts.length - 1]}`;
  return `${(m.flavor ?? "").trim() || m.name} : ${list}.`;
}

function toDef(e: MutatorEntry): MutatorDef {
  return {
    id: e.id,
    name: e.name,
    emoji: e.emoji,
    get description() {
      return mutatorDescription(e);
    },
    get grants() {
      return (e.effects ?? []).map((g) => ({ ...g, value: Number(g.value) || 0 }));
    },
  };
}

/** 6.14.105 (AA4) : ancien réglage `values` (une valeur par effet, dans l'ordre) appliqué aux mutateurs livrés. Gardé pour les
 *  règles enregistrées avant la 6.14.125 (repli à la lecture, migration « mutators-defs-6.14.125 »). */
export function defaultMutatorDefs(values?: Record<string, number[]>): MutatorEntry[] {
  return structuredClone(DEFAULT_MUTATOR_DEFS).map((m) => {
    const set = values?.[m.id];
    if (!Array.isArray(set)) return m;
    return { ...m, effects: m.effects.map((e, i) => (Number.isFinite(Number(set[i])) && set[i] !== null ? { ...e, value: Number(set[i]) } : e)) };
  });
}

export const MUTATOR_RULES: { enabled: boolean; overrides: Record<string, string>; defs: MutatorEntry[]; values?: Record<string, number[]> } = {
  enabled: true,
  /** Mois (AAAA-MM) → identifiant de mutateur, ou « none ». */
  overrides: {},
  /** 6.14.125 (AA7) : liste des mutateurs (tirage, effets, textes). Ajouter ou retirer un mutateur change le tirage des mois
   *  qui ne sont pas imposés (`overrides`). */
  defs: structuredClone(DEFAULT_MUTATOR_DEFS),
};

/** Mutateurs en vigueur (règles), dans l'ordre du tirage. */
export function mutatorList(): MutatorDef[] {
  const defs = Array.isArray(MUTATOR_RULES.defs) && MUTATOR_RULES.defs.length > 0 ? MUTATOR_RULES.defs : DEFAULT_MUTATOR_DEFS;
  return defs.map(toDef);
}

/** Liste des mutateurs d'un groupe de règles enregistré : `defs`, sinon l'ancien réglage `values` sur les mutateurs livrés. */
export function mutatorDefsOf(r: { defs?: unknown; values?: Record<string, number[]> } | undefined): MutatorEntry[] {
  if (r && Array.isArray(r.defs)) return r.defs as MutatorEntry[];
  return defaultMutatorDefs(r?.values);
}

/** Mois (AAAA-MM) à l'heure de Paris (approximation : UTC+1/+2 sans Intl). */
export function mutatorMonthId(now: number): string {
  const d = new Date(now + 2 * 3600_000);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function hashIndex(seed: string, n: number): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return Math.abs(h) % n;
}

function prevMonth(monthId: string): string {
  const [y, m] = monthId.split("-").map(Number);
  return m === 1 ? `${y - 1}-12` : `${y}-${String(m - 1).padStart(2, "0")}`;
}

/** Tirage déterministe d'un mois, différent de celui du mois précédent. */
function drawn(monthId: string): MutatorDef {
  const list = mutatorList();
  const i = hashIndex(`mut:${monthId}`, list.length);
  const prev = hashIndex(`mut:${prevMonth(monthId)}`, list.length);
  return list[i === prev ? (i + 1) % list.length : i];
}

/** Mutateur d'un mois (override de l'administration, sinon tirage). */
export function mutatorFor(monthId: string): MutatorDef | null {
  if (!MUTATOR_RULES.enabled) return null;
  const forced = MUTATOR_RULES.overrides[monthId];
  if (forced === "none") return null;
  if (forced) return mutatorList().find((m) => m.id === forced) ?? drawn(monthId);
  return drawn(monthId);
}

export function activeMutator(now: number): MutatorDef | null {
  return mutatorFor(mutatorMonthId(now));
}

/** Effets du mutateur en cours (couche empire, source « season »). */
export function mutatorEffects(now: number): EffectGrant[] {
  const m = activeMutator(now);
  if (!m) return [];
  return m.grants.map((g) => ({ stat: g.stat, value: g.value, target: g.target, ...(g.scope && g.scope !== "all" ? { scope: g.scope } : {}), layer: "empire" as const, source: { kind: "season" as const, id: m.id, label: m.name } }));
}

export function validateMutatorRules(r: Partial<typeof MUTATOR_RULES> | undefined, unitIds: Set<string> = new Set()): string[] {
  if (!r) return [];
  const errors: string[] = [];
  // 6.14.125 (AA7) : liste des mutateurs (identifiants, effets composés chiffrés et leurs bornes).
  if (r.defs !== undefined && !Array.isArray(r.defs)) errors.push("Mutateurs : la liste doit être une liste.");
  const defs = mutatorDefsOf(r);
  const seen = new Set<string>();
  for (const m of defs) {
    if (!m || typeof m !== "object") {
      errors.push("Mutateurs : chaque mutateur est un objet.");
      continue;
    }
    const label = `Mutateur « ${m.name || m.id} »`;
    if (!m.id || !/^[a-z0-9_]{2,32}$/.test(m.id) || m.id === "none") errors.push(`${label} : identifiant en minuscules, chiffres et _ (2 à 32 caractères, pas « none »).`);
    else if (seen.has(m.id)) errors.push(`${label} : identifiant en double.`);
    if (m.id) seen.add(m.id);
    if (!m.name?.trim()) errors.push(`${label} : nom vide.`);
    errors.push(...validateValuedEffects(label, m.effects, (sel) => isUnitSelector(sel, (id) => unitIds.has(id))));
  }
  if (Array.isArray(r.defs) && r.defs.length === 0) errors.push("Mutateurs : au moins un mutateur (ou décocher « Une règle spéciale chaque mois »).");
  for (const [month, id] of Object.entries(r.overrides ?? {})) {
    if (!/^\d{4}-\d{2}$/.test(month)) errors.push(`Mutateur : mois « ${month} » invalide (AAAA-MM).`);
    if (id !== "none" && !defs.some((m) => m?.id === id)) errors.push(`Mutateur : « ${id} » inconnu (${month}).`);
  }
  // 6.14.105 (AA4) : ancien réglage `values` (règles enregistrées avant la 6.14.125, sans `defs`) : une valeur par effet.
  if (!Array.isArray(r.defs)) {
    for (const [id, list] of Object.entries(r.values ?? {})) {
      const m = DEFAULT_MUTATOR_DEFS.find((x) => x.id === id);
      if (!m) {
        errors.push(`Mutateur : valeurs de « ${id} », mutateur inconnu.`);
        continue;
      }
      if (!Array.isArray(list) || list.length !== m.effects.length) errors.push(`Mutateur « ${m.name} » : ${m.effects.length} valeur(s) attendue(s), une par effet.`);
    }
  }
  return errors;
}
