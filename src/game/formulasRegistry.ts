/* =====================================================
   6.14.130 (AU27, lot AJ27-8, constat AJ-8) : sections de la page Formules
   générées depuis les registres, au lieu de textes écrits.
   - officiers : un rang par officier (onglet Officiers de l'admin), effet
     lu dans `ROLE_EFFECTS` par `roleBonusText` ;
   - plafonds : chaque grandeur plafonnée, par couche (`effectCaps`, et
     `combat.techCombatCap` pour l'attaque et la défense des technos) ;
   - sources : chaque source du circuit d'effets (`EFFECT_SOURCE_LABELS`),
     ses contenus et les grandeurs qu'elle peut donner (rapport d'impact) ;
   - classes d'empire : effets en vigueur (`describeEffect`).
   Un officier, une relique, une classe ou un plafond réglé dans l'admin
   change la page sans autre code. Moteur pur (pas de DOM, pas d'Intl).
===================================================== */
import { allCommanders, COMMANDER_RULES, isSeasonOfficer, roleBonusText, type CommanderId } from "@/game/commanders";
import { describeEffect, EFFECT_SOURCE_LABELS, EFFECT_STATS, EFFECT_STAT_IDS, effectCap, TECH_COMBAT_LIMITS, type EffectLayer, type EffectSourceKind, type EffectStat } from "@/game/effects";
import { empireClasses } from "@/game/empireClass";
import { effectImpactReport } from "@/game/impact";
import { mutatorList } from "@/game/mutators";
import { CAPSULES } from "@/game/synthesis";

export const FORMULA_LAYER_LABELS: Record<EffectLayer, string> = { tech: "Technologies", empire: "Empire", alliance: "Alliance" };

export interface FormulaOfficerRow {
  id: string;
  name: string;
  /** Effet au niveau 1 (« Attaque +1 % »). */
  perLevel: string;
  /** Effet au niveau maximal. */
  atMax: string;
  rare: boolean;
}

/** Officiers ordinaires et rares (pas ceux de saison, dérivés de deux rôles) : effet par niveau et au niveau maximal. */
export function formulaOfficerRows(): FormulaOfficerRow[] {
  const max = Math.max(1, Math.floor(Number(COMMANDER_RULES.maxLevel) || 1));
  return allCommanders()
    .filter((c) => !isSeasonOfficer(c.id))
    .map((c) => {
      const role = (c.role ?? c.id) as CommanderId;
      return { id: c.id, name: c.title ? `${c.title} ${c.name}` : c.name, perLevel: roleBonusText(role, 1), atMax: roleBonusText(role, max), rare: !!c.rare };
    });
}

export interface FormulaCapRow {
  stat: EffectStat;
  label: string;
  /** Réduction (durée, coût) plutôt que bonus. */
  reduction: boolean;
  caps: Partial<Record<EffectLayer, number>>;
}

/** Grandeurs plafonnées et leurs plafonds en vigueur, par couche. */
export function formulaCapRows(): FormulaCapRow[] {
  const out: FormulaCapRow[] = [];
  for (const stat of EFFECT_STAT_IDS) {
    const caps: Partial<Record<EffectLayer, number>> = {};
    for (const layer of ["tech", "empire", "alliance"] as EffectLayer[]) {
      // Attaque et défense des technos : `combat.techCombatCap` (6.7.1), pas `effectCaps`.
      const v = (stat === "attack" || stat === "defense") && layer === "tech" ? TECH_COMBAT_LIMITS.cap : effectCap(stat, layer);
      if (v !== undefined && Number.isFinite(v)) caps[layer] = v;
    }
    if (Object.keys(caps).length > 0) out.push({ stat, label: EFFECT_STATS[stat].label, reduction: !!EFFECT_STATS[stat].reduction, caps });
  }
  return out;
}

export interface FormulaSourceRow {
  kind: EffectSourceKind;
  label: string;
  /** Couches où la source agit. */
  layers: EffectLayer[];
  /** Contenus qui portent cette source (noms, sans doublon). */
  carriers: string[];
  /** Grandeurs qu'elle peut donner (libellés). */
  stats: string[];
}

/** Sources du circuit d'effets : contenus et grandeurs (rapport d'impact ; mutateurs et capsules lus dans leur catalogue). */
export function formulaSourceRows(): FormulaSourceRow[] {
  const acc = new Map<EffectSourceKind, { layers: Set<EffectLayer>; carriers: Set<string>; stats: Set<string> }>();
  const get = (k: EffectSourceKind) => {
    let v = acc.get(k);
    if (!v) acc.set(k, (v = { layers: new Set(), carriers: new Set(), stats: new Set() }));
    return v;
  };
  for (const row of effectImpactReport()) {
    for (const s of row.sources) {
      const v = get(s.kind);
      v.layers.add(row.layer);
      v.carriers.add(s.label);
      v.stats.add(EFFECT_STATS[row.stat].label);
    }
  }
  // Mutateurs de saison : un par mois, couche empire.
  for (const m of mutatorList()) {
    const v = get("season");
    v.layers.add("empire");
    v.carriers.add(m.name);
    for (const g of m.grants) if (g.stat in EFFECT_STATS) v.stats.add(EFFECT_STATS[g.stat as EffectStat].label);
  }
  // Capsules du Labo de synthèse : la capsule de blindage agit dans le circuit (défense contre les joueurs).
  const caps = get("capsule");
  caps.layers.add("empire");
  for (const c of Object.values(CAPSULES)) caps.carriers.add(c.name);
  caps.stats.add(`${EFFECT_STATS.defense.label} (contre les joueurs)`);
  return (Object.keys(EFFECT_SOURCE_LABELS) as EffectSourceKind[]).map((kind) => {
    const v = acc.get(kind);
    return { kind, label: EFFECT_SOURCE_LABELS[kind], layers: v ? [...v.layers] : [], carriers: v ? [...v.carriers] : [], stats: v ? [...v.stats] : [] };
  });
}

export interface FormulaClassRow {
  id: string;
  name: string;
  emoji: string;
  effects: string[];
}

/** Classes d'empire en vigueur et leurs effets chiffrés (couche empire). */
export function formulaClassRows(): FormulaClassRow[] {
  return empireClasses().map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    effects: (c.effects ?? []).filter((e) => e.stat in EFFECT_STATS).map((e) => describeEffect(e.stat as EffectStat, Number(e.value) || 0, e.target, e.scope)),
  }));
}
