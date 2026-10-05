import type { EffectGrant, EffectStat } from "@/game/effects";

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
  /** Une phrase, affichée aux joueurs. */
  description: string;
  grants: { stat: EffectStat; value: number; target?: string }[];
}

export const MUTATORS: MutatorDef[] = [
  { id: "ruee", name: "Ruée industrielle", emoji: "🏭", description: "Les forges tournent à plein : +10 % de production de toutes les ressources.", grants: [{ stat: "productionAll", value: 0.1 }] },
  { id: "chantiers", name: "Chantiers fiévreux", emoji: "🏗️", description: "Les équipes se relaient jour et nuit : −15 % de temps de construction.", grants: [{ stat: "buildTime", value: 0.15 }] },
  { id: "savoir", name: "Âge du savoir", emoji: "🔬", description: "Les laboratoires s'emballent : −15 % de temps de recherche.", grants: [{ stat: "researchTime", value: 0.15 }] },
  { id: "vents", name: "Vents solaires", emoji: "☄️", description: "Les courants stellaires portent les flottes : −15 % de temps de vol.", grants: [{ stat: "fleetSpeed", value: 0.15 }] },
  { id: "guerre", name: "Saison de guerre", emoji: "⚔️", description: "Le secteur s'embrase : +10 % d'attaque et +20 % de butin pillé.", grants: [{ stat: "attack", value: 0.1 }, { stat: "loot", value: 0.2 }] },
  { id: "rempart", name: "Saison des remparts", emoji: "🛡️", description: "Les ingénieurs renforcent les coques : +10 % de défense et +10 % de vaisseaux réparés.", grants: [{ stat: "defense", value: 0.1 }, { stat: "repair", value: 0.1 }] },
  { id: "marchands", name: "Foire des marchands", emoji: "💱", description: "Les comptoirs baissent leurs taxes : −50 % de taxe au marché et sur les cadeaux.", grants: [{ stat: "tradeTax", value: 0.5 }] },
  { id: "chantiers_navals", name: "Cadence des arsenaux", emoji: "🚀", description: "Les arsenaux accélèrent : −20 % de temps de production des unités.", grants: [{ stat: "unitTime", value: 0.2 }] },
  { id: "soutes", name: "Grandes soutes", emoji: "📦", description: "Des soutes repensées : +25 % de cargaison pour les flottes.", grants: [{ stat: "cargo", value: 0.25 }] },
  { id: "chasse", name: "Grande chasse", emoji: "🐋", description: "Les géants sont vulnérables : +15 % de dégâts contre les boss.", grants: [{ stat: "bossDamage", value: 0.15 }] },
];

export const MUTATOR_RULES: { enabled: boolean; overrides: Record<string, string> } = {
  enabled: true,
  /** Mois (AAAA-MM) → identifiant de mutateur, ou « none ». */
  overrides: {},
};

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
  return errors;
}
