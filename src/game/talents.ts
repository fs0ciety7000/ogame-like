import { GameActionError } from "@/game/errors";
import { currentSeasonId } from "@/game/seasons";
import { EFFECT_STATS, validateComposedEffect, type EffectGrant, type EffectStat, type ValuedEffect } from "@/game/effects";
import type { PlayerState } from "@/types/game";

/* =====================================================
   Arbre de talents d'Ascension (v5.1) : chaque ascension donne 3 points,
   à placer dans 3 branches (Économie, Guerre, Logistique) de 5 talents,
   3 rangs chacun (+2 % par rang, soit +2 / +4 / +6 %). Les talents sont
   permanents ; on peut tout redistribuer une fois par saison.
   6.14.127 (AA9) : la liste est une section de contenu (Admin → Talents).
===================================================== */

export const TALENT_RULES = {
  pointsPerAscension: 3,
  maxRank: 3,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const TALENT_RULES_META = {
  pointsPerAscension: { label: "Points de talent par Ascension", min: 0, max: 20 },
  maxRank: { label: "Rang maximal d'un talent", min: 1, max: 10, hint: "En baisser ne retire pas les rangs déjà pris." },
};

export type TalentBranch = "economie" | "guerre" | "logistique";

/**
 * 6.14.127 (AU27, lot AA9, constat AA-2) : un talent est une fiche de contenu (section `talents`, Admin → Talents) : branche,
 * nom, texte et **effets composés** (grandeur × cible × portée), chacun avec sa valeur **par rang**. Un talent ajouté dans
 * l'admin s'apprend et agit sans code (couche empire, source « talent »). Un talent enregistré ne se supprime pas : on le
 * **retire** (`retired`) : il ne s'apprend plus, les rangs déjà pris gardent leur effet (invariant I43).
 */
export interface TalentDef {
  id: string;
  branch: TalentBranch;
  name: string;
  /** « {value} » : valeur par rang du premier effet (« +0,2 »). */
  description: string;
  /** Effets composés ; `value` = valeur par rang (0,02 = +2 % par rang). */
  effects: ValuedEffect[];
  /** Retiré du jeu : ne s'apprend plus et quitte l'arbre (sauf pour qui y a des rangs) ; les rangs gardent leur effet. */
  retired?: boolean;
}

export const TALENT_BRANCHES: { id: TalentBranch; name: string; color: string }[] = [
  { id: "economie", name: "Économie", color: "var(--color-mint-glow)" },
  { id: "guerre", name: "Guerre", color: "var(--color-danger-glow)" },
  { id: "logistique", name: "Logistique", color: "var(--color-cyan-glow)" },
];

/** 6.14.104 (AA3) : « 0,2 ». */
const decimalText = (n: number) => String(Math.round(n * 1000) / 1000).replace(".", ",");

const talent = (id: string, branch: TalentBranch, name: string, description: string, effect: ValuedEffect): TalentDef => ({ id, branch, name, description, effects: [effect] });

/** Talents livrés (15 : trois branches de cinq). Valeurs par rang d'avant (6.14.104) : +2 %, réseau +0,2 niveau. */
export const DEFAULT_TALENTS: TalentDef[] = [
  talent("rendement", "economie", "Rendement impérial", "Production de toutes les ressources.", { stat: "productionAll", value: 0.02 }),
  talent("fonderies", "economie", "Fonderies profondes", "Production de ferraille.", { stat: "production", target: "scrap", value: 0.02 }),
  talent("reacteurs", "economie", "Réacteurs stabilisés", "Production d'énergie instable.", { stat: "production", target: "energy", value: 0.02 }),
  talent("nanoforges", "economie", "Nanoforges", "Production de nanocomposants.", { stat: "production", target: "nano", value: 0.02 }),
  talent("archivistes", "economie", "Archivistes", "Production de données anciennes.", { stat: "production", target: "data", value: 0.02 }),

  talent("assaut", "guerre", "Doctrine d'assaut", "Attaque de tes flottes.", { stat: "attack", value: 0.02 }),
  talent("rempart", "guerre", "Rempart", "Défense de tes unités.", { stat: "defense", value: 0.02 }),
  talent("ateliers", "guerre", "Ateliers de campagne", "Vaisseaux réparés après un combat.", { stat: "repair", value: 0.02 }),
  talent("sentinelles", "guerre", "Sentinelles", "Chances de repérer l'espionnage adverse.", { stat: "detection", value: 0.02 }),
  talent("reseau", "guerre", "Réseau d'informateurs", "Niveau d'espionnage (+{value} par rang).", { stat: "spyLevel", value: 0.2 }),

  talent("chantiers", "logistique", "Chantiers rapides", "Durée de construction des bâtiments.", { stat: "buildTime", value: 0.02 }),
  talent("laboratoires", "logistique", "Laboratoires", "Durée des recherches.", { stat: "researchTime", value: 0.02 }),
  talent("entrepots", "logistique", "Entrepôts étendus", "Capacité des entrepôts.", { stat: "storage", value: 0.02 }),
  talent("soutes", "logistique", "Soutes renforcées", "Capacité de transport des flottes.", { stat: "cargo", value: 0.02 }),
  talent("intendance", "logistique", "Intendance", "Production de toutes les ressources (logistique).", { stat: "productionAll", value: 0.02 }),
];

/** Talents en vigueur (posés par `setTalents`, depuis `applyGameContent`). */
export const TALENTS: TalentDef[] = structuredClone(DEFAULT_TALENTS);

export function setTalents(defs: TalentDef[]): void {
  TALENTS.splice(0, TALENTS.length, ...defs);
}

function findTalent(id: unknown): TalentDef | undefined {
  return TALENTS.find((t) => t.id === id);
}

/** Texte d'un talent, « {value} » remplacé par la valeur par rang du premier effet. */
export function talentDescription(def: Pick<TalentDef, "description" | "effects">): string {
  const v = Number(def.effects?.[0]?.value) || 0;
  return String(def.description ?? "").split("{value}").join(decimalText(v));
}

/**
 * 6.14.127 (AA9) : liste enregistrée complétée des talents livrés absents (des joueurs y ont peut-être des rangs ; un talent
 * livré se **retire**, il ne disparaît pas). `legacyPerRank` : ancien réglage `rules.talents.perRank` (6.14.104), lu tant que
 * la section n'est pas enregistrée (migration « talents-section-6.14.127 »).
 */
export function withDefaultTalents(list: unknown, legacyPerRank?: unknown): TalentDef[] {
  const saved = Array.isArray(list) ? (list as TalentDef[]).filter((t) => !!t && typeof t === "object") : null;
  const ids = new Set((saved ?? []).map((t) => t.id));
  const legacy = legacyPerRank && typeof legacyPerRank === "object" ? (legacyPerRank as Record<string, unknown>) : {};
  const fromCode = DEFAULT_TALENTS.filter((t) => !ids.has(t.id)).map((t) => {
    if (saved || legacy[t.id] === undefined) return t;
    const v = Number(legacy[t.id]);
    return { ...t, effects: t.effects.map((e) => ({ ...e, value: Number.isFinite(v) && v >= 0 ? v : 0 })) };
  });
  return [...(saved ?? []), ...fromCode];
}

/** Valeur par rang au plus : part 0,25 (+25 % par rang), niveaux 2, points 5. */
export function talentValueMax(stat: EffectStat): number {
  const info = EFFECT_STATS[stat];
  if (!info) return 0;
  return info.unit === "level" ? 2 : info.unit === "points" ? 5 : 0.25;
}

/** Erreurs de la section `talents` (identifiants, branche, nom, effets chiffrés par rang). */
export function validateTalents(list: unknown, validTarget: (sel: string | undefined) => boolean): string[] {
  if (!Array.isArray(list)) return ["Talents : la section doit être une liste."];
  const errors: string[] = [];
  const seen = new Set<string>();
  for (const t of list as Partial<TalentDef>[]) {
    const label = `Talent ${t?.name || t?.id || "?"}`;
    if (!t || typeof t.id !== "string" || !/^[A-Za-z0-9_]+$/.test(t.id)) errors.push(`${label} : identifiant invalide (lettres, chiffres, _).`);
    else if (seen.has(t.id)) errors.push(`Talents : identifiant « ${t.id} » en double.`);
    else seen.add(t.id);
    if (!t) continue;
    if (!TALENT_BRANCHES.some((b) => b.id === t.branch)) errors.push(`${label} : branche « ${String(t.branch)} » inconnue (economie, guerre, logistique).`);
    if (typeof t.name !== "string" || !t.name.trim()) errors.push(`${label} : nom manquant.`);
    if (typeof t.description !== "string") errors.push(`${label} : texte manquant.`);
    if (t.retired !== undefined && typeof t.retired !== "boolean") errors.push(`${label} : « retiré » doit être oui ou non.`);
    if (!Array.isArray(t.effects) || t.effects.length === 0) {
      errors.push(`${label} : au moins un effet.`);
      continue;
    }
    t.effects.forEach((e, i) => {
      for (const m of validateComposedEffect(e, validTarget)) errors.push(`${label} : effet n° ${i + 1}, ${m}.`);
      if (!e?.stat || !(e.stat in EFFECT_STATS)) return;
      const max = talentValueMax(e.stat);
      if (!(typeof e.value === "number" && Number.isFinite(e.value) && e.value >= 0 && e.value <= max)) errors.push(`${label} : effet n° ${i + 1}, valeur par rang entre 0 et ${decimalText(max)}.`);
    });
  }
  return errors;
}

export interface TalentState {
  ranks: Record<string, number>;
  /** Saison de la dernière redistribution. */
  resetSeasonId?: string;
}

export function talentState(player: Pick<PlayerState, "talents">): TalentState {
  const raw = (player.talents ?? {}) as Partial<TalentState>;
  const ranks: Record<string, number> = {};
  for (const t of TALENTS) {
    const r = Math.floor(Number(raw.ranks?.[t.id]) || 0);
    if (r > 0) ranks[t.id] = Math.min(TALENT_RULES.maxRank, r);
  }
  return { ranks, resetSeasonId: raw.resetSeasonId };
}

export function talentPoints(player: Pick<PlayerState, "ascensions" | "talents">): { total: number; spent: number; free: number } {
  const total = Math.max(0, Math.floor(player.ascensions ?? 0)) * TALENT_RULES.pointsPerAscension;
  const spent = Object.values(talentState(player).ranks).reduce((a, b) => a + b, 0);
  return { total, spent, free: Math.max(0, total - spent) };
}

export function learnTalent(player: PlayerState, talentId: unknown): TalentState {
  const def = findTalent(talentId);
  if (!def) throw new GameActionError("Talent inconnu.");
  if (def.retired) throw new GameActionError("Ce talent n'est plus proposé : tes rangs gardent leur effet, mais il ne s'apprend plus.");
  const st = talentState(player);
  if ((st.ranks[def.id] ?? 0) >= TALENT_RULES.maxRank) throw new GameActionError("Ce talent est déjà au rang maximum.");
  if (talentPoints(player).free <= 0) throw new GameActionError(`Aucun point de talent disponible : chaque Ascension en donne ${TALENT_RULES.pointsPerAscension}.`);
  st.ranks[def.id] = (st.ranks[def.id] ?? 0) + 1;
  player.talents = st;
  // 6.14.132 (AJ27-9) : fiche « Doctrines » du Codex, gardée après une redistribution.
  const learned = Array.isArray(player.stats?.talentsLearned) ? player.stats!.talentsLearned : [];
  if (!learned.includes(def.id)) player.stats = { ...(player.stats ?? {}), talentsLearned: [...learned, def.id] } as PlayerState["stats"];
  return st;
}

/** Redistribution : tous les points reviennent, une fois par saison. */
export function resetTalents(player: PlayerState, now: number): TalentState {
  const st = talentState(player);
  const season = currentSeasonId(now);
  if (st.resetSeasonId === season) throw new GameActionError("Tu as déjà redistribué tes talents cette saison.");
  if (Object.keys(st.ranks).length === 0) throw new GameActionError("Aucun talent à redistribuer.");
  const next: TalentState = { ranks: {}, resetSeasonId: season };
  player.talents = next;
  return next;
}

/** Talents appris et leur rang (lus par l'interface). */
function talentBonuses(player: Pick<PlayerState, "talents">): { def: TalentDef; rank: number }[] {
  const st = talentState(player);
  return TALENTS.filter((t) => (st.ranks[t.id] ?? 0) > 0).map((def) => ({ def, rank: st.ranks[def.id] ?? 0 }));
}

/** v5.14 : effets des talents appris (circuit d'effets, couche empire). 6.14.127 (AA9) : effets composés de la fiche, valeur par
 *  rang × rang. */
export function talentEffects(player: Pick<PlayerState, "talents">): EffectGrant[] {
  return talentBonuses(player).flatMap(({ def, rank }) =>
    (def.effects ?? []).map((e) => ({
      stat: e.stat,
      target: e.target || undefined,
      ...(e.scope && e.scope !== "all" ? { scope: e.scope } : {}),
      value: (Number(e.value) || 0) * rank,
      layer: "empire" as const,
      source: { kind: "talent" as const, id: def.id, label: def.name },
    })),
  );
}
