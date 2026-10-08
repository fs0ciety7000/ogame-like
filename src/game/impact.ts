import { buildingTierEffectMaxima } from "@/game/buildingTiers";
import { MOON_RULES } from "@/game/moon";
import { ALLIANCE_RULES, allianceDefEffects, allianceEffectLayer, type AllianceProjectDef, type AllianceResearchDef } from "@/game/alliances";
import { clampEffect, EFFECT_STATS, type EffectLayer, type EffectSourceKind, type EffectStat } from "@/game/effects";
import { COMMANDER_RULES, COMMANDERS, ROLE_EFFECTS, OFFICER_TUNING_RULES } from "@/game/commanders";
import { RARITIES, RELIC_EFFECT_STAT, RELICS } from "@/game/relics";
import { TALENT_RULES, TALENTS } from "@/game/talents";
import { empireClasses } from "@/game/empireClass";
import { MODULE_FAMILIES, MODULE_RULES, moduleValue, SIGNATURE_PREFIX, signatureTemplate, signatureUnits } from "@/game/modules";
import { TERRITORY_RULES } from "@/game/territories";
import { effectValuePerLevel, TECH_EFFECT_STAT, techEffects, TECHNOLOGIES } from "@/game/technologies";

/* =====================================================
   v5.14 : rapport d'impact du circuit d'effets (administration). Pour
   chaque grandeur : toutes les sources que le contenu peut donner, leur
   maximum, et le total théorique (plafonds compris). Une techno, une
   relique ou un rôle ajouté apparaît ici sans autre code.
===================================================== */

export interface ImpactSource {
  kind: EffectSourceKind;
  label: string;
  /** Valeur maximale (techno au niveau max, officier niveau 20, relique de la meilleure rareté…). */
  max: number;
  note?: string;
}

export interface ImpactRow {
  stat: EffectStat;
  target?: string;
  layer: EffectLayer;
  sources: ImpactSource[];
  /** Somme des maxima, avant plafond. */
  raw: number;
  /** Total théorique, plafond compris. */
  total: number;
  capped: boolean;
}

export function effectImpactReport(): ImpactRow[] {
  const rows = new Map<string, ImpactRow>();
  const add = (stat: EffectStat, target: string | undefined, layer: EffectLayer, src: ImpactSource) => {
    if (!(src.max > 0)) return;
    const key = `${layer}|${stat}|${target ?? ""}`;
    let row = rows.get(key);
    if (!row) rows.set(key, (row = { stat, target, layer, sources: [], raw: 0, total: 0, capped: false }));
    row.sources.push(src);
  };

  // Technologies : niveau maximal.
  for (const tech of TECHNOLOGIES) {
    for (const e of techEffects(tech)) {
      const stat = TECH_EFFECT_STAT[e.type];
      if (stat) add(stat, e.target, "tech", { kind: "tech", label: tech.nom, max: effectValuePerLevel(e) * tech.maxLevel, note: `niveau ${tech.maxLevel}` });
    }
  }
  // Officiers : un par rôle, niveau maximal (en poste : deux ou trois à la fois).
  for (const c of COMMANDERS) {
    for (const e of ROLE_EFFECTS[c.role] ?? []) {
      add(e.stat, e.target, "empire", { kind: "officer", label: `${c.title} ${c.name}`, max: e.perLevel * COMMANDER_RULES.maxLevel, note: `niveau ${COMMANDER_RULES.maxLevel}${e.scope && e.scope !== "all" ? `, ${e.scope === "colonies" ? "colonies" : e.scope}` : ""}${c.rare ? ", rare" : ""}` });
    }
  }
  // Reliques : meilleure rareté possible (mythique pour les mythiques, sinon légendaire).
  const best = (mythic: boolean) => RARITIES.find((r) => r.id === (mythic ? "mythic" : "legendary"))?.pct ?? 0;
  for (const t of RELICS) {
    if (t.disabled) continue;
    // 6.14.69 : une relique composée compte aussi (lune : portée de la phalange, recharge de la porte), sauf si elle vise un mode de
    // combat (JcJ, PNJ, seigneurs) : ces portées ne se cumulent pas dans un même combat, le rapport ne les distingue pas.
    const scoped = !!t.custom?.scope && t.custom.scope !== "all";
    const m = t.effect === "custom" ? (t.custom?.stat && !scoped ? { stat: t.custom.stat, target: t.custom.target, scale: t.custom.scale } : undefined) : RELIC_EFFECT_STAT[t.effect];
    if (m) add(m.stat, m.target, "empire", { kind: "relic", label: t.name, max: best(!!t.mythicOnly) * (m.scale ?? 1), note: t.mythicOnly ? "mythique" : "légendaire" });
  }
  // Talents d'Ascension : rang maximal.
  // 6.14.127 (AA9) : effets composés de chaque talent (valeur par rang × rang maximal) ; un talent retiré compte encore (rangs
  // gardés) ; comme les reliques, un effet qui vise un mode de combat ne se cumule pas dans un même combat.
  for (const t of TALENTS) {
    for (const e of t.effects ?? []) if (!e.scope || e.scope === "all") add(e.stat, e.target || undefined, "empire", { kind: "talent", label: t.name, max: (Number(e.value) || 0) * TALENT_RULES.maxRank, note: `rang ${TALENT_RULES.maxRank}` });
  }
  // 5.26 : modules de vaisseaux, deux légendaires montés sur chaque classe permise.
  for (const fam of Object.values(MODULE_FAMILIES)) {
    for (const cls of fam.classes) {
      const target = EFFECT_STATS[fam.stat]?.unitTarget ? `class:${cls}` : undefined;
      add(fam.stat, target, "empire", { kind: "module", label: fam.label, max: fam.values.legendary * MODULE_RULES.slotsPerClass, note: `${MODULE_RULES.slotsPerClass} légendaires` });
    }
  }
  // 6.14.133 (AJ27-10) : plans signature, deux légendaires montés sur la classe de leur unité (un par unité, cible `unit:<id>`).
  for (const id of signatureUnits()) {
    const t = signatureTemplate(id);
    const fam = MODULE_FAMILIES[t.family];
    if (!fam || !EFFECT_STATS[fam.stat]?.unitTarget) continue;
    add(fam.stat, `unit:${id}`, "empire", { kind: "module", label: t.name, max: moduleValue({ template: `${SIGNATURE_PREFIX}${id}`, rarity: "legendary" }) * MODULE_RULES.slotsPerClass, note: `${MODULE_RULES.slotsPerClass} légendaires` });
  }
  // 6.0 : classes d'empire (une seule à la fois : chaque ligne montre la classe qui la donne).
  for (const c of empireClasses()) {
    // 6.14.125 (AA7) : comme les reliques, un effet qui vise un mode de combat ne se cumule pas dans un même combat.
    for (const e of c.effects ?? []) if (!e.scope || e.scope === "all") add(e.stat, e.target, "empire", { kind: "class", label: c.name, max: Number(e.value) || 0, note: "une classe à la fois" });
  }
  // 6.13.0 : lune (une par joueur).
  add("shield", undefined, "empire", { kind: "moon", label: "Lune", max: MOON_RULES.shieldBonus + Math.max(0, MOON_RULES.shieldPerLevel) * Math.max(0, MOON_RULES.maxLevel - 1), note: `niveau ${MOON_RULES.maxLevel}` });
  add("protectedStorage", undefined, "empire", { kind: "moon", label: "Lune", max: MOON_RULES.protectedStorageBonus, note: "une lune" });
  // 6.14.142 (PB-L1) : paliers des bâtiments de système (un choix à la fois).
  for (const b of buildingTierEffectMaxima()) add(b.stat, undefined, "empire", { kind: "building", label: b.label, max: b.max, note: b.note });
  // Territoire d'alliance.
  add("productionAll", undefined, "empire", { kind: "territory", label: "Territoire d'alliance", max: TERRITORY_RULES.maxBonus });
  // 6.14.124 (AA6) : recherches et projets d'alliance au niveau maximal (couche alliance, ou couche empire pour les autres effets).
  const allianceDefs: [AllianceResearchDef | AllianceProjectDef, "research" | "project"][] = [...ALLIANCE_RULES.researches.map((d) => [d, "research"] as [AllianceResearchDef, "research"]), ...ALLIANCE_RULES.projects.map((d) => [d, "project"] as [AllianceProjectDef, "project"])];
  for (const [def, kind] of allianceDefs) {
    for (const e of allianceDefEffects(def, kind)) {
      const layer = allianceEffectLayer(e);
      if (!layer || !(e.stat in EFFECT_STATS)) continue;
      // Comme les reliques : un effet de couche empire qui vise un mode de combat ne se cumule pas dans un même combat.
      if (layer === "empire" && e.scope && e.scope !== "all") continue;
      add(e.stat as EffectStat, e.target, layer, { kind: "alliance", label: def.name, max: (Number(def.perLevel) || 0) * (def.maxLevel ?? 0), note: `${kind === "research" ? "niveau" : "palier"} ${def.maxLevel}` });
    }
  }

  const order = Object.keys(EFFECT_STATS);
  return [...rows.values()]
    .map((r) => {
      const raw = r.sources.reduce((a, s) => a + s.max, 0);
      const total = clampEffect(r.stat, r.layer, raw);
      return { ...r, sources: r.sources.sort((a, b) => b.max - a.max), raw, total, capped: Math.abs(total - raw) > 1e-9 };
    })
    .sort((a, b) => order.indexOf(a.stat) - order.indexOf(b.stat) || (a.layer < b.layer ? 1 : a.layer > b.layer ? -1 : 0) || ((a.target ?? "") < (b.target ?? "") ? -1 : 1));
}

/** Part du second rôle d'un commandant de saison (rappel pour l'affichage). */
export function seasonShareNote(): string {
  return `Commandants de saison : rôle principal entier, second rôle à ${Math.round(OFFICER_TUNING_RULES.seasonSecondaryShare * 100)} %.`;
}
