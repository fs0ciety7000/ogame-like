import { MOON_RULES } from "@/game/moon";
import { clampEffect, EFFECT_STATS, type EffectLayer, type EffectSourceKind, type EffectStat } from "@/game/effects";
import { COMMANDER_RULES, COMMANDERS, ROLE_EFFECTS, OFFICER_TUNING_RULES } from "@/game/commanders";
import { RARITIES, RELIC_EFFECT_STAT, RELICS } from "@/game/relics";
import { TALENT_RULES, TALENTS } from "@/game/talents";
import { EMPIRE_CLASSES } from "@/game/empireClass";
import { MODULE_FAMILIES, MODULE_RULES } from "@/game/modules";
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
    const m = RELIC_EFFECT_STAT[t.effect];
    if (m) add(m.stat, m.target, "empire", { kind: "relic", label: t.name, max: best(!!t.mythicOnly) * (m.scale ?? 1), note: t.mythicOnly ? "mythique" : "légendaire" });
  }
  // Talents d'Ascension : rang maximal.
  for (const t of TALENTS) {
    add(t.effect.kind as EffectStat, t.effect.kind === "production" ? t.effect.res : undefined, "empire", { kind: "talent", label: t.name, max: t.perRank * TALENT_RULES.maxRank, note: `rang ${TALENT_RULES.maxRank}` });
  }
  // 5.26 : modules de vaisseaux, deux légendaires montés sur chaque classe permise.
  for (const fam of Object.values(MODULE_FAMILIES)) {
    for (const cls of fam.classes) {
      const target = fam.stat === "unitAttack" || fam.stat === "unitHp" ? `class:${cls}` : undefined;
      add(fam.stat, target, "empire", { kind: "module", label: fam.label, max: fam.values.legendary * MODULE_RULES.slotsPerClass, note: `${MODULE_RULES.slotsPerClass} légendaires` });
    }
  }
  // 6.0 : classes d'empire (une seule à la fois : chaque ligne montre la classe qui la donne).
  for (const c of EMPIRE_CLASSES) {
    for (const e of c.effects) add(e.stat, e.target, "empire", { kind: "class", label: c.name, max: e.value, note: "une classe à la fois" });
  }
  // 6.13.0 : lune (une par joueur).
  add("shield", undefined, "empire", { kind: "moon", label: "Lune", max: MOON_RULES.shieldBonus, note: "une lune" });
  add("protectedStorage", undefined, "empire", { kind: "moon", label: "Lune", max: MOON_RULES.protectedStorageBonus, note: "une lune" });
  // Territoire d'alliance.
  add("productionAll", undefined, "empire", { kind: "territory", label: "Territoire d'alliance", max: TERRITORY_RULES.maxBonus });

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
