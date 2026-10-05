import { COMBAT_RULES } from "@/game/combat";
import { UNITS, unitLevelBonus, type UnitDef } from "@/game/units";

/* =====================================================
   5.18 : classes d'unités et audit d'équilibrage, d'après le combat en tours.

   Valeur de combat d'une unité = √(attaque × points de vie) : au combat en
   tours, deux armées s'usent l'une l'autre et ce produit décide de l'issue
   (deux fois plus d'attaque ou deux fois plus de points de vie se valent).
   Les unités de chaque catégorie (attaque, défense) sont rangées en tiers :
   faible, moyen, fort. Les unités sans attaque (sondes) sont « soutien ».
===================================================== */

export type UnitClass = "support" | "light" | "medium" | "heavy";

export const UNIT_CLASS_LABELS: Record<UnitClass, string> = {
  support: "Soutien",
  light: "Faible",
  medium: "Moyen",
  heavy: "Fort",
};

/** Valeur de combat d'une unité à un niveau donné (sans technologie). */
export function combatValue(unit: Pick<UnitDef, "stats" | "levelBonus">, level = 1): number {
  const grow = (Math.max(1, level) - 1) * unitLevelBonus(unit);
  const att = Math.max(0, unit.stats.attaque + grow);
  const res = Math.max(1, unit.stats.defense + grow);
  return Math.sqrt(att * res * COMBAT_RULES.hpPerResistance);
}

/** Classe de chaque unité, par tiers de valeur de combat dans sa catégorie. */
export function unitClasses(all: UnitDef[] = UNITS): Record<string, UnitClass> {
  const out: Record<string, UnitClass> = {};
  for (const category of ["attack", "defense"] as const) {
    const fighters = all.filter((u) => u.category === category && u.stats.attaque > 0).sort((a, b) => combatValue(a) - combatValue(b));
    all.filter((u) => u.category === category && !(u.stats.attaque > 0)).forEach((u) => (out[u.id] = "support"));
    fighters.forEach((u, i) => {
      const third = fighters.length > 0 ? i / fighters.length : 0;
      out[u.id] = third < 1 / 3 ? "light" : third < 2 / 3 ? "medium" : "heavy";
    });
  }
  return out;
}

export interface UnitAuditRow {
  id: string;
  name: string;
  category: UnitDef["category"];
  cls: UnitClass;
  /** Valeur de combat au niveau 1 et au niveau maximal. */
  value: number;
  valueMax: number;
  /** Valeur par 1 000 ressources et par place de hangar (niveau maximal). */
  perK: number;
  perSlot: number;
  /** Rapport à la médiane de la catégorie (1 = dans la norme). */
  perKRatio: number;
  perSlotRatio: number;
  flag: "strong" | "weak" | null;
  note: string;
}

const median = (xs: number[]) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Seuils de l'audit : au-delà (ou en deçà) de ces rapports à la médiane, l'unité est signalée. */
export const UNIT_AUDIT_RULES = {
  strongAbove: 1.6,
  weakBelow: 0.6,
  /** Unités lourdes de fin de partie (au moins `endgameSlots` places) : leur avance est voulue, jusqu'à ce rapport. */
  endgameSlots: 10,
  endgameStrongAbove: 2.2,
};

/** Audit d'équilibrage : valeur de combat par coût et par place, comparée à la médiane de la catégorie. */
export function unitBalanceAudit(all: UnitDef[] = UNITS): UnitAuditRow[] {
  const classes = unitClasses(all);
  const rows = all
    .filter((u) => u.stats.attaque > 0)
    .map((u) => {
      const valueMax = combatValue(u, u.maxLevel);
      const cost = Math.max(1, (u.cost.scrap || 0) + (u.cost.energy || 0));
      return { u, value: combatValue(u, 1), valueMax, perK: (valueMax / cost) * 1000, perSlot: valueMax / Math.max(1, u.hangarSpace || 1) };
    });
  return rows.map(({ u, value, valueMax, perK, perSlot }) => {
    const same = rows.filter((r) => r.u.category === u.category);
    const perKRatio = perK / Math.max(1e-9, median(same.map((r) => r.perK)));
    const perSlotRatio = perSlot / Math.max(1e-9, median(same.map((r) => r.perSlot)));
    const best = Math.max(perKRatio, perSlotRatio);
    const worst = Math.max(perKRatio, perSlotRatio) < UNIT_AUDIT_RULES.weakBelow;
    const endgame = (u.hangarSpace || 1) >= UNIT_AUDIT_RULES.endgameSlots;
    const strongAt = endgame ? UNIT_AUDIT_RULES.endgameStrongAbove : UNIT_AUDIT_RULES.strongAbove;
    let flag: UnitAuditRow["flag"] = null;
    let note = endgame && best >= UNIT_AUDIT_RULES.strongAbove ? "Unité lourde de fin de partie : son avance est voulue." : "";
    if (perKRatio >= strongAt && perSlotRatio >= strongAt) {
      flag = "strong";
      note = "Meilleure que les autres par coût ET par place : rien ne justifie d'en construire d'autres.";
    } else if (worst) {
      flag = "weak";
      note = "Moins rentable que la norme par coût ET par place : piège pour les joueurs.";
    } else if (!endgame && best >= UNIT_AUDIT_RULES.strongAbove) note = perKRatio > perSlotRatio ? "Très rentable par coût, chère en places : bon choix de début." : "Très dense par place, chère : bon choix de fin de partie.";
    return { id: u.id, name: u.name, category: u.category, cls: classes[u.id], value, valueMax, perK, perSlot, perKRatio, perSlotRatio, flag, note };
  });
}
