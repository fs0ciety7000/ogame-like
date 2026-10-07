import type { ChronicleObjective } from "@/game/chronicles";
import type { PassReward } from "@/game/seasonPass";
import type { CapsuleType } from "@/game/synthesis";

/* =====================================================
   6.8.1 : passe généré par budget (proposition generation-passe-chroniques,
   §5.2 à §5.4). Réglages dans GameRules.passGen (Admin → Règles → Passe généré).
   - Récompenses : un budget en heures de production équivalentes réparti
     sur les paliers 1 à 29 selon une courbe croissante, jalons renforcés,
     table pondérée et plafonds par mois. Le dernier palier (commandant de
     saison, Ambre, cosmétique) reste hors budget.
   - Points par palier : calculés sur les points par jour du joueur médian et
     du plus actif du mois observé (jour cible de fin de chacun).
   - Prérequis : poids par action ; les actions que le joueur ne déclenche
     pas à volonté n'entrent que si le serveur les pratique assez.
   Valeurs littérales : un objet de règles ne lit jamais une constante d'un
   autre module du moteur au chargement (CLAUDE.md).
===================================================== */

export type PassGenKind = "production" | "amber" | "capsule" | "dossier" | "tokens";

export const PASS_GEN_RULES = {
  /** false : ancien gabarit fixe des récompenses (points par palier toujours calculés). */
  enabled: true,
  /** Valeur des paliers 1 à 29, en heures de production équivalentes. */
  budgetHours: 140,
  /** Le dernier palier ordinaire vaut (1 + courbe) fois le premier. */
  curve: 2,
  /** Paliers jalons : valeur multipliée, deux récompenses. */
  milestones: [5, 10, 15, 20, 25],
  milestoneBoost: 2.5,
  /** Reliques données aux paliers indiqués (comptées dans le budget). */
  rareRelicTiers: [20],
  epicRelicTiers: [] as number[],
  /** Valeur d'une unité, en heures de production (1 h de production = 1). */
  values: { amber: 0.1, tokens: 1, dossier: 3, capsule3: 2, capsule4: 3, capsule5: 4, relicRare: 10, relicEpic: 20 },
  /** Plafonds du mois (paliers 1 à 29). */
  caps: { amber: 350, tokens: 6, dossier: 4, capsules: 10 },
  /** Heures de production au plus par récompense. */
  productionMaxHours: 12,
  /** Poids de tirage des récompenses (0 : jamais). */
  weights: { production: 3, amber: 3, capsule: 2, dossier: 1, tokens: 1 },
  /** Rythme : jour de fin visé pour le joueur médian, et pas avant ce jour pour le plus actif. */
  targetMedianDay: 24,
  targetTopDay: 15,
  /** Le joueur médian doit finir au plus tard ce jour, quitte à laisser le plus actif finir plus tôt. */
  latestMedianDay: 28,
  /** « Plus actif » : ce centile des points par jour (0,9 = 9e décile). */
  topPercentile: 0.9,
  pointsMin: 25,
  pointsMax: 200,
  /** Poids des actions dans les défis des paliers (0 : jamais). */
  challengeWeights: { victory: 1, contract: 1, spy: 1, market: 1, bounty: 1, warlordWin: 1, bossAssault: 0.5, raidRepelled: 0, mission: 0 } as Record<string, number>,
  /** Actions que le joueur ne déclenche pas à volonté : seulement si la médiane du serveur en fait au moins autant par semaine. */
  passiveKeys: ["warlordWin", "bossAssault", "raidRepelled"],
  passiveMinWeekly: 0.5,
  /** 6.14.58 (AU27, AP-2) : rythme d'une action dans les défis = médiane du serveur par semaine, bornée entre ces facteurs de
   *  sa base ; le plancher ne dépasse jamais la médiane (un défi ne demande pas plus que ce que fait le joueur médian). */
  challengeMinFactor: 0.5,
  challengeMaxFactor: 3,
  /** 6.14.58 (Q-AP3) : sur un serveur mesuré, une action dont la médiane par semaine est sous ce seuil (ou nulle) n'entre pas
   *  dans les défis (un défi bloque les suivants). Les actions passives demandent en plus `passiveMinWeekly`. */
  challengeMinWeekly: 0.25,
  /** 6.14.58 : garde de faisabilité. Si le joueur médian simulé finit après `latestMedianDay` : jusqu'à ce nombre de nouveaux
   *  tirages des défis, puis seuils réduits par pas jusqu'à ce plancher (part des seuils tirés). */
  challengeRedraws: 5,
  challengeReduceStep: 0.1,
  challengeReduceMin: 0.4,
};

export type PassGenRules = typeof PASS_GEN_RULES;

const DEFAULTS: PassGenRules = structuredClone(PASS_GEN_RULES);

/** Règles en vigueur, sous-objets complétés par les valeurs par défaut (un champ ajouté plus tard reste lu). */
export function passGenRules(): PassGenRules {
  const r = PASS_GEN_RULES;
  return {
    ...DEFAULTS,
    ...r,
    values: { ...DEFAULTS.values, ...(r.values ?? {}) },
    caps: { ...DEFAULTS.caps, ...(r.caps ?? {}) },
    weights: { ...DEFAULTS.weights, ...(r.weights ?? {}) },
    challengeWeights: { ...DEFAULTS.challengeWeights, ...(r.challengeWeights ?? {}) },
  };
}

export function validatePassGenRules(r: PassGenRules | undefined): string[] {
  if (!r) return [];
  const e: string[] = [];
  const L = "Passe généré";
  if (!(r.budgetHours > 0)) e.push(`${L} : budget > 0.`);
  if (!(r.curve >= 0 && r.curve <= 10)) e.push(`${L} : courbe entre 0 et 10.`);
  if (!(r.milestoneBoost >= 1 && r.milestoneBoost <= 10)) e.push(`${L} : renfort des jalons entre 1 et 10.`);
  for (const t of [...(r.milestones ?? []), ...(r.rareRelicTiers ?? []), ...(r.epicRelicTiers ?? [])])
    if (!(Number.isInteger(t) && t >= 1 && t <= 29)) e.push(`${L} : palier ${t} hors des paliers 1 à 29.`);
  if (!(r.targetTopDay >= 1 && r.targetTopDay <= r.targetMedianDay && r.targetMedianDay <= r.latestMedianDay && r.latestMedianDay <= 31))
    e.push(`${L} : jours cibles dans l'ordre (plus actif ≤ médian ≤ au plus tard ≤ 31).`);
  if (!(r.topPercentile > 0.5 && r.topPercentile <= 1)) e.push(`${L} : centile du plus actif entre 0,5 et 1.`);
  if (!(r.pointsMin >= 1 && r.pointsMin <= r.pointsMax)) e.push(`${L} : points par palier min ≤ max.`);
  if (!(r.productionMaxHours >= 1)) e.push(`${L} : heures de production par récompense ≥ 1.`);
  for (const [k, v] of Object.entries(r.values ?? {})) if (!(Number(v) > 0)) e.push(`${L} : valeur « ${k} » > 0.`);
  if (!Object.values(r.challengeWeights ?? {}).some((v) => Number(v) > 0)) e.push(`${L} : au moins une action dans les défis.`);
  if (!(r.challengeMinFactor > 0 && r.challengeMinFactor <= r.challengeMaxFactor)) e.push(`${L} : bornes du rythme des défis min ≤ max.`);
  if (!(r.challengeMinWeekly >= 0)) e.push(`${L} : seuil d'entrée des défis ≥ 0.`);
  if (!(Number.isInteger(r.challengeRedraws) && r.challengeRedraws >= 0 && r.challengeRedraws <= 20)) e.push(`${L} : nouveaux tirages des défis entre 0 et 20.`);
  if (!(r.challengeReduceStep > 0 && r.challengeReduceStep < 1 && r.challengeReduceMin > 0 && r.challengeReduceMin <= 1)) e.push(`${L} : réduction des seuils (pas et plancher entre 0 et 1).`);
  return e;
}

/* ---------- valeur des récompenses ---------- */

/** Valeur d'une récompense en heures de production (commandant et cosmétique : 0). */
export function rewardValue(r: PassReward, rules: PassGenRules = passGenRules()): number {
  const v = rules.values;
  switch (r.kind) {
    case "production":
      return r.hours;
    case "amber":
      return r.amount * v.amber;
    case "tokens":
      return r.count * v.tokens;
    case "dossier":
      return r.count * v.dossier;
    case "capsule":
      return r.level >= 5 ? v.capsule5 : r.level >= 4 ? v.capsule4 : v.capsule3;
    case "relic":
      return r.rarity === "epic" || r.rarity === "legendary" ? v.relicEpic : v.relicRare;
    default:
      return 0;
  }
}

export function tiersValue(tiers: PassReward[][], rules: PassGenRules = passGenRules()): number {
  return tiers.reduce((a, t) => a + t.reduce((b, r) => b + rewardValue(r, rules), 0), 0);
}

/* ---------- récompenses par budget ---------- */

const CAPSULES: CapsuleType[] = ["assault", "armor", "decoy", "veil"];
const capsuleLevel = (t: number) => (t < 10 ? 3 : t < 20 ? 4 : 5);

/** Valeur visée de chaque palier ordinaire (1 à tiers − 1). */
export function tierBudgets(tiers: number, rules: PassGenRules = passGenRules()): number[] {
  const n = Math.max(1, tiers - 1);
  const w = Array.from({ length: n }, (_, i) => (1 + (rules.curve * i) / Math.max(1, n - 1)) * (rules.milestones.includes(i + 1) ? rules.milestoneBoost : 1));
  const total = w.reduce((a, b) => a + b, 0);
  return w.map((x) => (rules.budgetHours * x) / total);
}

/** Paliers 1 à tiers − 1 tirés sous budget ; le dernier est laissé vide (rempli par l'appelant). */
export function generateBudgetTiers(rng: () => number, tiers = 30, rules: PassGenRules = passGenRules()): { tiers: PassReward[][]; reasons: string[] } {
  const budgets = tierBudgets(tiers, rules);
  const used = { amber: 0, tokens: 0, dossier: 0, capsules: 0 };
  const out: PassReward[][] = [];
  let carry = 0;
  let prev: PassGenKind | null = null;
  let capIdx = Math.floor(rng() * CAPSULES.length);
  const v = rules.values;

  // Quantité d'une récompense pour une valeur visée (null : impossible sous les plafonds).
  const make = (kind: PassGenKind, goal: number, t: number): PassReward | null => {
    if (kind === "production") return { kind, hours: Math.max(1, Math.min(rules.productionMaxHours, Math.round(goal))) };
    if (kind === "amber") {
      const left = rules.caps.amber - used.amber;
      const amount = Math.min(left - (left % 5), Math.max(5, Math.round(goal / v.amber / 5) * 5));
      return amount >= 5 ? { kind, amount } : null;
    }
    if (kind === "tokens") {
      const count = Math.min(rules.caps.tokens - used.tokens, Math.max(1, Math.round(goal / v.tokens)));
      return count >= 1 ? { kind, count } : null;
    }
    if (kind === "dossier") {
      const count = Math.min(rules.caps.dossier - used.dossier, Math.max(1, Math.round(goal / v.dossier)));
      return count >= 1 ? { kind, count } : null;
    }
    if (used.capsules >= rules.caps.capsules) return null;
    return { kind: "capsule", capsule: CAPSULES[capIdx % CAPSULES.length], level: capsuleLevel(t) };
  };
  const note = (r: PassReward) => {
    if (r.kind === "amber") used.amber += r.amount;
    else if (r.kind === "tokens") used.tokens += r.count;
    else if (r.kind === "dossier") used.dossier += r.count;
    else if (r.kind === "capsule") {
      used.capsules += 1;
      capIdx += 1;
    }
  };
  // Tirage pondéré parmi les récompenses possibles qui ne dépassent pas la valeur visée de plus de moitié.
  const draw = (goal: number, t: number, exclude: PassGenKind[]): PassGenKind => {
    const kinds = (Object.keys(rules.weights) as PassGenKind[]).filter((k) => (rules.weights[k] ?? 0) > 0 && !exclude.includes(k));
    const fits = kinds.filter((k) => {
      const r = make(k, goal, t);
      return r !== null && rewardValue(r, rules) <= Math.max(goal * 1.5, 1);
    });
    const pool = fits.length > 0 ? fits : ["production" as PassGenKind];
    const total = pool.reduce((a, k) => a + rules.weights[k], 0);
    let x = rng() * total;
    return pool.find((k) => (x -= rules.weights[k]) <= 0) ?? pool[0];
  };

  for (let t = 1; t < tiers; t++) {
    let goal = budgets[t - 1] + carry;
    const list: PassReward[] = [];
    for (const [ts, rarity] of [
      [rules.rareRelicTiers, "rare"],
      [rules.epicRelicTiers, "epic"],
    ] as const) {
      if (!ts.includes(t)) continue;
      const r: PassReward = { kind: "relic", rarity };
      list.push(r);
      goal -= rewardValue(r, rules);
    }
    const milestone = rules.milestones.includes(t);
    const slots = list.length > 0 ? (goal > 1 ? 1 : 0) : milestone ? 2 : 1;
    const taken: PassGenKind[] = prev ? [prev] : [];
    for (let s = 0; s < slots; s++) {
      const share = s === 0 && slots === 2 ? goal * 0.6 : goal - list.reduce((a, r) => a + (r.kind === "relic" ? 0 : rewardValue(r, rules)), 0);
      const kind = draw(share, t, taken);
      const r = make(kind, share, t) ?? make("production", share, t)!;
      note(r);
      list.push(r);
      taken.push(r.kind as PassGenKind);
    }
    carry = budgets[t - 1] + carry - list.reduce((a, r) => a + rewardValue(r, rules), 0);
    prev = (list.find((r) => r.kind !== "relic")?.kind as PassGenKind | undefined) ?? prev;
    out.push(list);
  }
  // Reste du budget : en production sur le dernier palier ordinaire.
  if (carry >= 0.5 && out.length > 0) {
    const last = out[out.length - 1];
    const prod = last.find((r): r is Extract<PassReward, { kind: "production" }> => r.kind === "production");
    if (prod) prod.hours += Math.round(carry);
    else last.push({ kind: "production", hours: Math.round(carry) });
  }
  out.push([]);
  const total = tiersValue(out, rules);
  return {
    tiers: out,
    reasons: [
      `Récompenses tirées sous budget : ${Math.round(total)} h de production équivalentes pour ${rules.budgetHours} h visées (paliers 1 à ${tiers - 1}, jalons ${rules.milestones.join(", ")}).`,
      `Plafonds du mois : ${used.amber} / ${rules.caps.amber} Ambre, ${used.tokens} / ${rules.caps.tokens} jetons, ${used.dossier} / ${rules.caps.dossier} dossiers, ${used.capsules} / ${rules.caps.capsules} capsules.`,
    ],
  };
}

/* ---------- points par palier ---------- */

export interface PassPace {
  /** Points de passe par jour (joueur médian, plus actif) mesurés sur le mois observé. */
  median: number;
  top: number;
}

const round5 = (x: number) => Math.round(x / 5) * 5;

/** Points par palier pour que le joueur médian finisse au jour visé, le plus actif pas avant le sien
 *  (le médian finit au plus tard `latestMedianDay`). Null sans mesure. */
export function computePointsPerTier(pace: PassPace | undefined, tiers: number, rules: PassGenRules = passGenRules()): { ppt: number; reasons: string[] } | null {
  if (!pace || !(pace.median > 0)) return null;
  const top = Math.max(pace.top, pace.median);
  const byMedian = (pace.median * rules.targetMedianDay) / tiers;
  const byTop = (top * rules.targetTopDay) / tiers;
  const medianMax = (pace.median * rules.latestMedianDay) / tiers;
  const raw = Math.max(byMedian, Math.min(byTop, medianMax));
  // 6.14.58 (AU27, AP-2) : l'arrondi ne fait jamais dépasser le jour limite du médian (60 au lieu de 59,07 : fin au jour 29).
  const rounded = round5(raw) > medianMax ? Math.max(5, Math.floor(medianMax / 5) * 5) : round5(raw);
  const ppt = Math.max(rules.pointsMin, Math.min(rules.pointsMax, rounded));
  const reasons = [
    `Points par jour mesurés : ${Math.round(pace.median)} (joueur médian), ${Math.round(top)} (plus actif, ${Math.round(rules.topPercentile * 100)}e centile).`,
    `Points par palier : ${ppt} (médian au dernier palier vers le jour ${Math.round((tiers * ppt) / pace.median)}, plus actif vers le jour ${Math.round((tiers * ppt) / top)} ; cibles ${rules.targetMedianDay} et ${rules.targetTopDay}).`,
  ];
  if (byTop > medianMax) reasons.push(`Le plus actif va beaucoup plus vite que le médian : le médian garde sa fin au jour ${rules.latestMedianDay} au plus tard.`);
  if (ppt !== rounded) reasons.push(`Garde-fou : points par palier bornés entre ${rules.pointsMin} et ${rules.pointsMax}.`);
  return { ppt, reasons };
}

/** Centile (0 à 1) d'une liste. */
export function percentile(xs: number[], p: number): number {
  if (xs.length === 0) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.max(0, Math.ceil(p * s.length) - 1))];
}

/* ---------- prérequis ---------- */

/** Actions des défis et leur poids : poids > 0, et les actions passives seulement si le serveur les pratique. */
export function challengePool(weeklyMedian: Partial<Record<ChronicleObjective, number>>, rules: PassGenRules = passGenRules()): { key: ChronicleObjective; weight: number }[] {
  const weighted = Object.entries(rules.challengeWeights).filter(([, w]) => Number(w) > 0);
  const pool = weighted.filter(([k]) => actionPlayable(k as ChronicleObjective, weeklyMedian, rules));
  // Serveur où presque rien n'est mesuré : les actions que le joueur déclenche à volonté restent (un palier sans défi n'existe pas).
  const out = pool.length > 0 ? pool : weighted.filter(([k]) => !rules.passiveKeys.includes(k));
  return out.map(([k, w]) => ({ key: k as ChronicleObjective, weight: Number(w) }));
}

/** 6.14.58 (AU27, AP-2) : le serveur a-t-il mesuré une activité (sinon : valeurs de base partout) ? */
export function hasActivityData(weeklyMedian: Partial<Record<ChronicleObjective, number>>): boolean {
  return Object.values(weeklyMedian).some((v) => (v ?? 0) > 0);
}

/** 6.14.58 : seuil unique d'une action pour les défis du passe et les objectifs des Chroniques. Une action passive (seigneurs,
 *  assauts de boss, raids) demande une médiane d'au moins `passiveMinWeekly` par semaine ; sur un serveur mesuré, toute action
 *  demande une médiane non nulle et d'au moins `challengeMinWeekly`. Sans mesure (serveur neuf) : actions actives seulement. */
export function actionPlayable(key: ChronicleObjective, weeklyMedian: Partial<Record<ChronicleObjective, number>>, rules: PassGenRules = passGenRules()): boolean {
  const m = weeklyMedian[key] ?? 0;
  if (rules.passiveKeys.includes(key)) return m > 0 && m >= rules.passiveMinWeekly && m >= rules.challengeMinWeekly;
  if (!hasActivityData(weeklyMedian)) return true;
  return m > 0 && m >= rules.challengeMinWeekly;
}
