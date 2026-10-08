import { describeEffect, EFFECT_STATS, formatEffectValue, isUnitSelector, validateValuedEffects, type EffectGrant, type EffectStat, type ValuedEffect } from "@/game/effects";
import { parisOffsetMs } from "@/game/events";
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

export const MUTATOR_RULES: {
  enabled: boolean;
  overrides: Record<string, string>;
  defs: MutatorEntry[];
  values?: Record<string, number[]>;
  noRepeatMonths: number;
  freshMonths: number;
  noRepeatFrom: string;
} = {
  enabled: true,
  /** Mois (AAAA-MM) → identifiant de mutateur, ou « none ». */
  overrides: {},
  /** 6.14.125 (AA7) : liste des mutateurs (tirage, effets, textes). Ajouter ou retirer un mutateur change le tirage des mois
   *  qui ne sont pas imposés (`overrides`). */
  defs: structuredClone(DEFAULT_MUTATOR_DEFS),
  /** 6.14.136 (AU27, lot AP-L9) : un mutateur ne revient pas avant N mois (0 : ancien tirage, seulement jamais deux mois de suite). */
  noRepeatMonths: 6,
  /** 6.14.136 : fenêtre de fraîcheur : un mutateur absent des N derniers mois (mois tiré compris) passe d'abord (0 : sans préférence). */
  freshMonths: 12,
  /** 6.14.136 : premier mois tiré sans répétition (AAAA-MM). Les mois d'avant gardent l'ancien tirage : un mois passé, en cours
   *  ou déjà annoncé ne change pas. */
  noRepeatFrom: "2027-01",
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

/** Mois (AAAA-MM) à l'heure de Paris. 6.14.136 (AP-L9, AP-13) : heure d'été et d'hiver (`parisOffsetMs`, comme les
 *  Chroniques) ; avant, UTC+2 fixe : le mutateur changeait à 22 h UTC, une heure trop tôt en hiver. */
export function mutatorMonthId(now: number): string {
  const d = new Date(now + parisOffsetMs(now));
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

/** Ancien tirage déterministe d'un mois (avant 6.14.136), différent de l'ancien tirage du mois précédent. */
function legacyIndex(monthId: string, n: number): number {
  const i = hashIndex(`mut:${monthId}`, n);
  const prev = hashIndex(`mut:${prevMonth(monthId)}`, n);
  return i === prev ? (i + 1) % n : i;
}

type DrawRules = Pick<typeof MUTATOR_RULES, "overrides" | "noRepeatMonths" | "freshMonths" | "noRepeatFrom">;

/** Cache du dernier calcul (le mutateur est relu à chaque calcul de modificateurs) : clé = liste, mois imposés, réglages. */
let drawCache: { key: string; map: Map<string, string | null> } = { key: "", map: new Map() };

/**
 * 6.14.136 (AU27, lot AP-L9, constat AP-10) : tirage sans répétition.
 * - avant `noRepeatFrom` : ancien tirage (aucun mois passé, en cours ou annoncé ne change) ;
 * - ensuite : les mutateurs des `noRepeatMonths` mois précédents (mois imposés compris) sont exclus ; parmi les autres, ceux absents
 *   de la fenêtre de fraîcheur passent d'abord ; l'ancien tirage est gardé s'il reste permis, sinon tirage à la graine du mois.
 * Déterministe (client et serveur d'accord), calculé de proche en proche depuis `noRepeatFrom`.
 */
function drawIds(ids: string[], r: DrawRules): (monthId: string, includeOverride: boolean) => string | null {
  const n = ids.length;
  const N = Math.max(0, Math.min(n - 1, Math.floor(Number(r.noRepeatMonths) || 0)));
  const F = Math.max(0, Math.floor(Number(r.freshMonths) || 0));
  const from = typeof r.noRepeatFrom === "string" && /^\d{4}-\d{2}$/.test(r.noRepeatFrom) ? r.noRepeatFrom : "9999-12";
  const key = `${ids.join(",")}|${JSON.stringify(r.overrides ?? {})}|${N}|${F}|${from}`;
  if (drawCache.key !== key) drawCache = { key, map: new Map() };
  const memo = drawCache.map;
  const auto = (monthId: string): string => {
    const legacy = ids[legacyIndex(monthId, n)];
    if (N === 0 || monthId < from) return legacy;
    const k = `a:${monthId}`;
    if (memo.has(k)) return memo.get(k) as string;
    // Mois précédents, du plus proche au plus lointain.
    const back: (string | null)[] = [];
    let m = monthId;
    for (let i = 0; i < Math.max(N, F - 1); i++) {
      m = prevMonth(m);
      back.push(effective(m));
    }
    const recent = new Set(back.slice(0, N).filter((x): x is string => !!x));
    const candidates = ids.filter((id) => !recent.has(id));
    const seen = new Set(back.slice(0, Math.max(0, F - 1)).filter((x): x is string => !!x));
    const fresh = F > 0 ? candidates.filter((id) => !seen.has(id)) : [];
    const pool = fresh.length > 0 ? fresh : candidates.length > 0 ? candidates : ids;
    const out = pool.includes(legacy) ? legacy : pool[hashIndex(`mut-norepeat:${monthId}`, pool.length)];
    memo.set(k, out);
    return out;
  };
  const effective = (monthId: string): string | null => {
    const forced = r.overrides?.[monthId];
    if (forced === "none") return null;
    if (forced && ids.includes(forced)) return forced;
    return auto(monthId);
  };
  return (monthId, includeOverride) => (includeOverride ? effective(monthId) : auto(monthId));
}

/** 6.14.136 : tirage automatique d'un mois (sans son propre mois imposé ; les mois imposés d'avant comptent pour la répétition). */
export function autoMutatorFor(monthId: string, r: Partial<DrawRules> & { defs?: MutatorEntry[] } = MUTATOR_RULES): MutatorDef | null {
  const list = Array.isArray(r.defs) && r.defs.length > 0 ? r.defs.map(toDef) : mutatorList();
  const id = drawIds(
    list.map((m) => m.id),
    { overrides: r.overrides ?? MUTATOR_RULES.overrides, noRepeatMonths: r.noRepeatMonths ?? MUTATOR_RULES.noRepeatMonths, freshMonths: r.freshMonths ?? MUTATOR_RULES.freshMonths, noRepeatFrom: r.noRepeatFrom ?? MUTATOR_RULES.noRepeatFrom },
  )(monthId, false);
  return list.find((m) => m.id === id) ?? null;
}

/** Mutateur d'un mois (override de l'administration, sinon tirage). */
export function mutatorFor(monthId: string): MutatorDef | null {
  if (!MUTATOR_RULES.enabled) return null;
  const list = mutatorList();
  const forced = MUTATOR_RULES.overrides[monthId];
  if (forced === "none") return null;
  const found = forced ? list.find((m) => m.id === forced) : undefined;
  if (found) return found;
  const id = drawIds(
    list.map((m) => m.id),
    MUTATOR_RULES,
  )(monthId, false);
  return list.find((m) => m.id === id) ?? list[0] ?? null;
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
  // 6.14.136 (AP-L9) : tirage sans répétition.
  if (r.noRepeatMonths !== undefined && !(Number.isInteger(Number(r.noRepeatMonths)) && Number(r.noRepeatMonths) >= 0 && Number(r.noRepeatMonths) <= 24)) errors.push("Mutateurs : « ne revient pas avant » entier entre 0 et 24 mois.");
  if (r.freshMonths !== undefined && !(Number.isInteger(Number(r.freshMonths)) && Number(r.freshMonths) >= 0 && Number(r.freshMonths) <= 36)) errors.push("Mutateurs : fenêtre de fraîcheur entière entre 0 et 36 mois.");
  if (r.noRepeatFrom !== undefined && !(typeof r.noRepeatFrom === "string" && /^\d{4}-\d{2}$/.test(r.noRepeatFrom))) errors.push("Mutateurs : premier mois sans répétition au format AAAA-MM.");
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
