import type { EffectGrant, EffectStat } from "@/game/effects";
import { formatPct } from "@/game/format";

/* =====================================================
   5.16 : mutateur de saison. Chaque mois, une règle spéciale s'applique à
   tout le serveur (production, durées, combat, flottes, marché…). Elle est
   tirée de façon déterministe à partir du mois (jamais deux fois de suite),
   annoncée dans les Chroniques et sur l'accueil, et passe par le circuit
   d'effets : client et serveur appliquent exactement la même chose.
   L'administration peut imposer un mutateur pour un mois, ou n'en mettre aucun.
===================================================== */

export interface MutatorDef {
  id: string;
  name: string;
  emoji: string;
  /** Une phrase, affichée aux joueurs. 6.14.105 (AA4) : construite depuis les valeurs en vigueur (`mutators.values`). */
  readonly description: string;
  readonly grants: { stat: EffectStat; value: number; target?: string }[];
}

/** 6.14.105 (AA4) : « +10 % », « −15 % » (signe moins typographique), sans Intl (goja). */
const plus = (v: number) => `+${formatPct(v)}`;
const minus = (v: number) => `−${formatPct(v)}`;

/** 6.14.105 (AA4, AA-6 en partie) : un mutateur lit ses valeurs dans MUTATOR_RULES.values[id] (réglable dans l'admin), une par
 *  effet, dans l'ordre de `stats` ; sa description est construite depuis ces valeurs à l'usage. */
function mutator(id: string, name: string, emoji: string, stats: { stat: EffectStat; target?: string }[], text: (v: number[]) => string): MutatorDef {
  return {
    id,
    name,
    emoji,
    get description() {
      return text(mutatorValues(id));
    },
    get grants() {
      const v = mutatorValues(id);
      return stats.map((s, i) => ({ ...s, value: v[i] }));
    },
  };
}

export const MUTATORS: MutatorDef[] = [
  mutator("ruee", "Ruée industrielle", "🏭", [{ stat: "productionAll" }], (v) => `Les forges tournent à plein : ${plus(v[0])} de production de toutes les ressources.`),
  mutator("chantiers", "Chantiers fiévreux", "🏗️", [{ stat: "buildTime" }], (v) => `Les équipes se relaient jour et nuit : ${minus(v[0])} de temps de construction.`),
  mutator("savoir", "Âge du savoir", "🔬", [{ stat: "researchTime" }], (v) => `Les laboratoires s'emballent : ${minus(v[0])} de temps de recherche.`),
  mutator("vents", "Vents solaires", "☄️", [{ stat: "fleetSpeed" }], (v) => `Les courants stellaires portent les flottes : ${minus(v[0])} de temps de vol.`),
  mutator("guerre", "Saison de guerre", "⚔️", [{ stat: "attack" }, { stat: "loot" }], (v) => `Le secteur s'embrase : ${plus(v[0])} d'attaque et ${plus(v[1])} de butin pillé.`),
  mutator("rempart", "Saison des remparts", "🛡️", [{ stat: "defense" }, { stat: "repair" }], (v) => `Les ingénieurs renforcent les coques : ${plus(v[0])} de défense et ${plus(v[1])} de vaisseaux réparés.`),
  mutator("marchands", "Foire des marchands", "💱", [{ stat: "tradeTax" }], (v) => `Les comptoirs baissent leurs taxes : ${minus(v[0])} de taxe au marché et sur les cadeaux.`),
  mutator("chantiers_navals", "Cadence des arsenaux", "🚀", [{ stat: "unitTime" }], (v) => `Les arsenaux accélèrent : ${minus(v[0])} de temps de production des unités.`),
  mutator("soutes", "Grandes soutes", "📦", [{ stat: "cargo" }], (v) => `Des soutes repensées : ${plus(v[0])} de cargaison pour les flottes.`),
  mutator("chasse", "Grande chasse", "🐋", [{ stat: "bossDamage" }], (v) => `Les géants sont vulnérables : ${plus(v[0])} de dégâts contre les boss.`),
];

/** 6.14.105 (AA4) : valeurs par défaut de chaque mutateur (littérales : piège « Initialisation des modules »). */
const DEFAULT_MUTATOR_VALUES: Record<string, number[]> = {
  ruee: [0.1],
  chantiers: [0.15],
  savoir: [0.15],
  vents: [0.15],
  guerre: [0.1, 0.2],
  rempart: [0.1, 0.1],
  marchands: [0.5],
  chantiers_navals: [0.2],
  soutes: [0.25],
  chasse: [0.15],
};

/** Grandeurs de durée ou de taxe : une réduction de 100 % n'a pas de sens (plafond 0,9 à la validation). */
const REDUCTION_STATS: string[] = ["buildTime", "researchTime", "fleetSpeed", "unitTime", "tradeTax"];

export const MUTATOR_RULES: { enabled: boolean; overrides: Record<string, string>; values: Record<string, number[]> } = {
  enabled: true,
  /** Mois (AAAA-MM) → identifiant de mutateur, ou « none ». */
  overrides: {},
  /** 6.14.105 (AA4) : force de chaque mutateur, une valeur par effet (0,1 = 10 %). */
  values: {
    ruee: [0.1],
    chantiers: [0.15],
    savoir: [0.15],
    vents: [0.15],
    guerre: [0.1, 0.2],
    rempart: [0.1, 0.1],
    marchands: [0.5],
    chantiers_navals: [0.2],
    soutes: [0.25],
    chasse: [0.15],
  },
};

/** 6.14.105 (AA4) : valeurs en vigueur d'un mutateur (règle, sinon défaut du code, effet par effet). */
export function mutatorValues(id: string, values: Record<string, number[]> | undefined = MUTATOR_RULES.values): number[] {
  const def = DEFAULT_MUTATOR_VALUES[id] ?? [];
  const set = values?.[id];
  return def.map((d, i) => {
    const v = Number(set?.[i]);
    return set && Number.isFinite(v) ? v : d;
  });
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
  const i = hashIndex(`mut:${monthId}`, MUTATORS.length);
  const prev = hashIndex(`mut:${prevMonth(monthId)}`, MUTATORS.length);
  return MUTATORS[i === prev ? (i + 1) % MUTATORS.length : i];
}

/** Mutateur d'un mois (override de l'administration, sinon tirage). */
export function mutatorFor(monthId: string): MutatorDef | null {
  if (!MUTATOR_RULES.enabled) return null;
  const forced = MUTATOR_RULES.overrides[monthId];
  if (forced === "none") return null;
  if (forced) return MUTATORS.find((m) => m.id === forced) ?? drawn(monthId);
  return drawn(monthId);
}

export function activeMutator(now: number): MutatorDef | null {
  return mutatorFor(mutatorMonthId(now));
}

/** Effets du mutateur en cours (couche empire, source « season »). */
export function mutatorEffects(now: number): EffectGrant[] {
  const m = activeMutator(now);
  if (!m) return [];
  return m.grants.map((g) => ({ stat: g.stat, value: g.value, target: g.target, layer: "empire" as const, source: { kind: "season" as const, id: m.id, label: m.name } }));
}

export function validateMutatorRules(r: Partial<typeof MUTATOR_RULES> | undefined): string[] {
  if (!r) return [];
  const errors: string[] = [];
  for (const [month, id] of Object.entries(r.overrides ?? {})) {
    if (!/^\d{4}-\d{2}$/.test(month)) errors.push(`Mutateur : mois « ${month} » invalide (AAAA-MM).`);
    if (id !== "none" && !MUTATORS.some((m) => m.id === id)) errors.push(`Mutateur : « ${id} » inconnu (${month}).`);
  }
  // 6.14.105 (AA4) : force de chaque mutateur, une valeur par effet, entre 0 et 2 (réduction de durée ou de taxe : 0,9 au plus).
  for (const [id, list] of Object.entries(r.values ?? {})) {
    const m = MUTATORS.find((x) => x.id === id);
    if (!m) {
      errors.push(`Mutateur : valeurs de « ${id} », mutateur inconnu.`);
      continue;
    }
    if (!Array.isArray(list) || list.length !== DEFAULT_MUTATOR_VALUES[id].length) {
      errors.push(`Mutateur « ${m.name} » : ${DEFAULT_MUTATOR_VALUES[id].length} valeur(s) attendue(s), une par effet.`);
      continue;
    }
    const stats = m.grants.map((g) => g.stat);
    list.forEach((v, i) => {
      const max = REDUCTION_STATS.includes(stats[i]) ? 0.9 : 2;
      if (!(typeof v === "number" && v >= 0 && v <= max)) errors.push(`Mutateur « ${m.name} » : valeur n° ${i + 1} entre 0 et ${String(max).replace(".", ",")}.`);
    });
  }
  return errors;
}
