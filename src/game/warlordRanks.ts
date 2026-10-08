import type { WarlordPersonality } from "@/game/warlords";

/* =====================================================
   5.22 : rangs de menace des seigneurs de guerre (I à V).

   Chaque seigneur accumule de la menace : un peu chaque jour, davantage
   quand il gagne un combat ou survit à une vendetta ; il en perd quand on
   le pille ou qu'il est repoussé. Une vendetta gagnée contre lui le fait
   chuter de deux rangs.

   Le rang augmente sa puissance visée et renforce le trait de sa
   personnalité :
   - Opportuniste : une partie de sa flotte à quai esquive le combat, il
     décroche plus tôt quand il attaque et emporte plus de butin ;
   - Bâtisseur : bouclier et défenses renforcés ;
   - Agressif (Belliqueux) : avantage de classe accru.
   Au rang V, il devient Seigneur Ascendant : vendetta d'alliance seulement,
   objectif relevé, relique mythique et titre pour les vainqueurs.

   Une unité d'élite contre chaque trait (voir eliteUnits.ts) l'annule.
===================================================== */

export type WarlordRank = 1 | 2 | 3 | 4 | 5;
export type EliteTarget = Extract<WarlordPersonality, "opportunist" | "builder" | "aggressive">;

export interface WarlordRankRules {
  enabled: boolean;
  /** Menace à atteindre pour les rangs II, III, IV et V. */
  thresholds: number[];
  /** Puissance visée : bonus par rang au-delà du premier. */
  powerPerRank: number;
  /** Menace gagnée (ou perdue, valeur négative) par évènement. */
  threat: {
    perDay: number;
    /** Le seigneur gagne une attaque. */
    attackWon: number;
    /** Il repousse un joueur. */
    defenseWon: number;
    /** Son attaque est repoussée. */
    attackLost: number;
    /** Un joueur le pille. */
    raided: number;
    /** Une vendetta contre lui échoue. */
    vendettaSurvived: number;
  };
  /** Vendetta gagnée par les joueurs : rangs perdus. */
  vendettaRankLoss: number;
  /** Bonus de trait par rang au-delà du premier. */
  traits: {
    opportunist: { evadePerRank: number; retreatEarlierPerRank: number; lootPerRank: number };
    builder: { shieldPerRank: number; defensePerRank: number };
    aggressive: { edgePerRank: number };
  };
  /** Rang V : vendetta d'alliance seulement et objectif multiplié. */
  ascendant: { goalFactor: number; allianceOnly: boolean };
  /** Unités d'élite : nombre minimal dans le camp du joueur pour annuler le trait. */
  eliteMinCount: number;
}

export const DEFAULT_RANK_RULES: WarlordRankRules = {
  enabled: true,
  thresholds: [12, 30, 55, 90],
  powerPerRank: 0.08,
  threat: { perDay: 1, attackWon: 3, defenseWon: 2, attackLost: -2, raided: -1, vendettaSurvived: 8 },
  vendettaRankLoss: 2,
  traits: {
    opportunist: { evadePerRank: 0.08, retreatEarlierPerRank: 0.04, lootPerRank: 0.1 },
    builder: { shieldPerRank: 0.04, defensePerRank: 0.06 },
    aggressive: { edgePerRank: 0.05 },
  },
  ascendant: { goalFactor: 1.5, allianceOnly: true },
  eliteMinCount: 1,
};

export const RANK_NUMERALS = ["I", "II", "III", "IV", "V"] as const;
export const RANK_NAMES = ["Chef de bande", "Seigneur", "Seigneur de guerre", "Tyran", "Seigneur Ascendant"] as const;

/** Unité d'élite qui contre chaque trait. */
export const ELITE_COUNTER: Record<EliteTarget, string> = {
  opportunist: "chasse_fantome",
  builder: "brise_rempart",
  aggressive: "lame_ecarlate",
};

export const TRAIT_NAMES: Record<EliteTarget, string> = {
  opportunist: "Insaisissable",
  builder: "Rempart",
  aggressive: "Fureur",
};

const num = (v: unknown, d: number) => (typeof v === "number" && Number.isFinite(v) ? v : d);

/** Règles complètes à partir d'une saisie partielle (administration). */
export function normalizeRankRules(raw: Partial<WarlordRankRules> | null | undefined): WarlordRankRules {
  const r = (raw ?? {}) as Partial<WarlordRankRules>;
  const D = DEFAULT_RANK_RULES;
  const t = (r.traits ?? {}) as Partial<WarlordRankRules["traits"]>;
  return {
    enabled: r.enabled !== false,
    thresholds: Array.isArray(r.thresholds) && r.thresholds.length === 4 ? r.thresholds.map((v, i) => num(v, D.thresholds[i])) : [...D.thresholds],
    powerPerRank: num(r.powerPerRank, D.powerPerRank),
    threat: {
      perDay: num(r.threat?.perDay, D.threat.perDay),
      attackWon: num(r.threat?.attackWon, D.threat.attackWon),
      defenseWon: num(r.threat?.defenseWon, D.threat.defenseWon),
      attackLost: num(r.threat?.attackLost, D.threat.attackLost),
      raided: num(r.threat?.raided, D.threat.raided),
      vendettaSurvived: num(r.threat?.vendettaSurvived, D.threat.vendettaSurvived),
    },
    vendettaRankLoss: num(r.vendettaRankLoss, D.vendettaRankLoss),
    traits: {
      opportunist: {
        evadePerRank: num(t.opportunist?.evadePerRank, D.traits.opportunist.evadePerRank),
        retreatEarlierPerRank: num(t.opportunist?.retreatEarlierPerRank, D.traits.opportunist.retreatEarlierPerRank),
        lootPerRank: num(t.opportunist?.lootPerRank, D.traits.opportunist.lootPerRank),
      },
      builder: {
        shieldPerRank: num(t.builder?.shieldPerRank, D.traits.builder.shieldPerRank),
        defensePerRank: num(t.builder?.defensePerRank, D.traits.builder.defensePerRank),
      },
      aggressive: { edgePerRank: num(t.aggressive?.edgePerRank, D.traits.aggressive.edgePerRank) },
    },
    ascendant: { goalFactor: num(r.ascendant?.goalFactor, D.ascendant.goalFactor), allianceOnly: r.ascendant?.allianceOnly !== false },
    eliteMinCount: Math.max(1, Math.floor(num(r.eliteMinCount, D.eliteMinCount))),
  };
}

export function validateRankRules(raw: Partial<WarlordRankRules> | undefined): string[] {
  if (!raw) return [];
  const r = normalizeRankRules(raw);
  const errors: string[] = [];
  if (r.thresholds.some((v, i) => !(v > 0) || (i > 0 && v <= r.thresholds[i - 1]))) errors.push("Rangs des seigneurs : seuils de menace positifs et croissants (II < III < IV < V).");
  if (!(r.powerPerRank >= 0 && r.powerPerRank <= 1)) errors.push("Rangs des seigneurs : bonus de puissance par rang entre 0 et 1.");
  if (!(r.vendettaRankLoss >= 0 && r.vendettaRankLoss <= 4)) errors.push("Rangs des seigneurs : rangs perdus par vendetta entre 0 et 4.");
  const o = r.traits.opportunist;
  if (!(o.evadePerRank >= 0 && o.evadePerRank * 4 <= 0.8)) errors.push("Trait Insaisissable : esquive par rang entre 0 et 0,2.");
  if (!(o.retreatEarlierPerRank >= 0 && o.retreatEarlierPerRank * 4 <= 0.5)) errors.push("Trait Insaisissable : retraite anticipée par rang entre 0 et 0,125.");
  if (!(o.lootPerRank >= 0 && o.lootPerRank <= 1)) errors.push("Trait Insaisissable : butin par rang entre 0 et 1.");
  if (!(r.traits.builder.shieldPerRank >= 0 && r.traits.builder.shieldPerRank * 4 <= 0.5)) errors.push("Trait Rempart : bouclier par rang entre 0 et 0,125.");
  if (!(r.traits.builder.defensePerRank >= 0 && r.traits.builder.defensePerRank <= 1)) errors.push("Trait Rempart : défense par rang entre 0 et 1.");
  if (!(r.traits.aggressive.edgePerRank >= 0 && r.traits.aggressive.edgePerRank <= 0.5)) errors.push("Trait Fureur : avantage de classe par rang entre 0 et 0,5.");
  if (!(r.ascendant.goalFactor >= 1 && r.ascendant.goalFactor <= 5)) errors.push("Seigneur Ascendant : objectif de vendetta multiplié par 1 à 5.");
  return errors;
}

/** Rang atteint pour une menace donnée. */
export function rankForThreat(threat: number, rules: WarlordRankRules): WarlordRank {
  if (!rules.enabled) return 1;
  return (1 + rules.thresholds.filter((t) => threat >= t).length) as WarlordRank;
}

/** Menace minimale d'un rang (début de palier). */
function threatFloor(rank: number, rules: WarlordRankRules): number {
  return rank <= 1 ? 0 : (rules.thresholds[Math.min(4, rank) - 2] ?? 0);
}

export interface RankState {
  threat?: number;
  rank?: number;
  /** Premier passage au rang V (annonce). */
  ascendedAtMs?: number;
}

export function rankOf(rt: RankState | undefined, rules: WarlordRankRules): WarlordRank {
  if (!rules.enabled) return 1;
  const r = Math.round(rt?.rank ?? 1);
  return (Math.max(1, Math.min(5, r)) || 1) as WarlordRank;
}

/** Ajoute de la menace ; renvoie l'ancien et le nouveau rang. La menace est plafonnée au seuil du rang V + 50 %. */
export function addThreat<T extends RankState>(rt: T, delta: number, rules: WarlordRankRules): { rt: T; from: WarlordRank; to: WarlordRank } {
  const from = rankOf(rt, rules);
  const cap = (rules.thresholds[3] ?? 90) * 1.5;
  const threat = Math.max(0, Math.min(cap, (rt.threat ?? 0) + (Number.isFinite(delta) ? delta : 0)));
  const to = rankForThreat(threat, rules);
  return { rt: { ...rt, threat: Math.round(threat * 100) / 100, rank: to }, from, to };
}

/** Vendetta gagnée par les joueurs : chute de `vendettaRankLoss` rangs, menace ramenée au début du palier. */
export function dropRank<T extends RankState>(rt: T, rules: WarlordRankRules): { rt: T; from: WarlordRank; to: WarlordRank } {
  const from = rankOf(rt, rules);
  const to = Math.max(1, from - Math.round(rules.vendettaRankLoss)) as WarlordRank;
  return { rt: { ...rt, rank: to, threat: threatFloor(to, rules) }, from, to };
}

/** Multiplicateur de la puissance visée. */
export function rankPowerFactor(rank: number, rules: WarlordRankRules): number {
  return 1 + Math.max(0, rank - 1) * rules.powerPerRank;
}

export interface WarlordTraitValues {
  /** Part de la flotte à quai qui esquive le combat (défense). */
  evade: number;
  /** Retraite anticipée en attaque (points de vie perdus en moins avant de décrocher). */
  retreatEarlier: number;
  /** Bonus de butin en attaque. */
  loot: number;
  /** Bouclier ajouté (défense). */
  shield: number;
  /** Bonus de défense (défense). */
  defense: number;
  /** Avantage de classe ajouté à ses unités. */
  edge: number;
}

export function traitValues(personality: WarlordPersonality, rank: number, rules: WarlordRankRules): WarlordTraitValues {
  const k = rules.enabled ? Math.max(0, Math.min(4, rank - 1)) : 0;
  const out: WarlordTraitValues = { evade: 0, retreatEarlier: 0, loot: 0, shield: 0, defense: 0, edge: 0 };
  if (personality === "opportunist") {
    out.evade = k * rules.traits.opportunist.evadePerRank;
    out.retreatEarlier = k * rules.traits.opportunist.retreatEarlierPerRank;
    out.loot = k * rules.traits.opportunist.lootPerRank;
  } else if (personality === "builder") {
    out.shield = k * rules.traits.builder.shieldPerRank;
    out.defense = k * rules.traits.builder.defensePerRank;
  } else if (personality === "aggressive") out.edge = k * rules.traits.aggressive.edgePerRank;
  return out;
}

const pct = (v: number) => `${Math.round(v * 100)} %`;

/** Description lisible du trait au rang donné (fiche du seigneur). */
export function traitSummary(personality: WarlordPersonality, rank: number, rules: WarlordRankRules): string | null {
  const v = traitValues(personality, rank, rules);
  if (personality === "opportunist") return v.evade > 0 ? `${pct(v.evade)} de sa flotte à quai esquive tes attaques ; en attaque, il décroche plus tôt et emporte +${pct(v.loot)} de butin.` : "Pas encore de trait : il se renforce au rang II.";
  if (personality === "builder") return v.shield > 0 ? `Bouclier +${pct(v.shield)}, défenses +${pct(v.defense)}.` : "Pas encore de trait : il se renforce au rang II.";
  if (personality === "aggressive") return v.edge > 0 ? `Avantage de classe de ses unités +${pct(v.edge)}.` : "Pas encore de trait : il se renforce au rang II.";
  return null;
}

/** Le trait est-il contré par ce camp (unités d'élite en nombre suffisant) ? */
function countersTrait(personality: WarlordPersonality, units: Record<string, number>, rules: WarlordRankRules): boolean {
  const id = ELITE_COUNTER[personality as EliteTarget];
  return !!id && (units[id] ?? 0) >= rules.eliteMinCount;
}

export interface WarlordCombatMods {
  /** Défense du seigneur : part de la flotte à quai engagée (multiplicateur). */
  homeFleetFactor?: number;
  /** Défense du seigneur : bouclier ajouté, ou bouclier annulé. */
  shieldBonus?: number;
  shieldIgnored?: boolean;
  /** Défense du seigneur : multiplicateur de défense. */
  defenseFactor?: number;
  /** Attaque du seigneur : seuil de retraite (part des PV perdus). */
  retreatAt?: number;
  /** Attaque du seigneur : multiplicateur du plafond de butin. */
  lootFactor?: number;
  /** Avantage de classe : bonus du seigneur, ou annulé. */
  edgeBonus?: number;
  edgeCancelled?: boolean;
  /** Pour le rapport de combat. */
  rank: WarlordRank;
  notes: string[];
}

/**
 * Effets du rang et du trait d'un seigneur dans un combat contre un joueur.
 * `humanUnits` : unités du joueur engagées (flotte d'attaque, ou unités à quai quand le seigneur attaque).
 */
export function warlordCombatMods(
  personality: WarlordPersonality,
  rank: WarlordRank,
  warlordSide: "attacker" | "defender",
  humanUnits: Record<string, number>,
  rules: WarlordRankRules,
  baseRetreatAt: number,
): WarlordCombatMods {
  const v = traitValues(personality, rank, rules);
  const countered = countersTrait(personality, humanUnits, rules);
  const out: WarlordCombatMods = { rank, notes: [] };
  const name = TRAIT_NAMES[personality as EliteTarget];
  if (personality === "opportunist") {
    if (warlordSide === "defender") {
      if (countered) out.notes.push("Chasse-Fantôme : sa flotte n'a pas pu esquiver le combat.");
      else if (v.evade > 0) {
        out.homeFleetFactor = 1 - v.evade;
        out.notes.push(`${name} : ${pct(v.evade)} de sa flotte à quai a esquivé le combat.`);
      }
    } else {
      if (countered) {
        out.retreatAt = 1;
        out.notes.push("Chasse-Fantôme : il n'a pas pu décrocher, combat jusqu'au bout.");
      } else if (v.retreatEarlier > 0) out.retreatAt = Math.max(0.1, baseRetreatAt - v.retreatEarlier);
      if (v.loot > 0) out.lootFactor = 1 + v.loot;
    }
  } else if (personality === "builder" && warlordSide === "defender") {
    if (countered) {
      out.shieldIgnored = true;
      out.notes.push("Brise-Rempart : bouclier planétaire ignoré, défenses sans bonus.");
    } else if (v.shield > 0 || v.defense > 0) {
      out.shieldBonus = v.shield;
      out.defenseFactor = 1 + v.defense;
      out.notes.push(`${name} : bouclier +${pct(v.shield)}, défenses +${pct(v.defense)}.`);
    }
  } else if (personality === "aggressive") {
    if (countered) {
      out.edgeCancelled = true;
      out.notes.push("Lame Écarlate : ses unités perdent leur avantage de classe.");
    } else if (v.edge > 0) {
      out.edgeBonus = v.edge;
      out.notes.push(`${name} : avantage de classe +${pct(v.edge)}.`);
    }
  }
  return out;
}
