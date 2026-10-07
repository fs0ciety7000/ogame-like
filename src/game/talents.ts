import { GameActionError } from "@/game/errors";
import { currentSeasonId } from "@/game/seasons";
import type { EffectGrant, EffectStat } from "@/game/effects";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Arbre de talents d'Ascension (v5.1) : chaque ascension donne 3 points,
   à placer dans 3 branches (Économie, Guerre, Logistique) de 5 talents,
   3 rangs chacun (+2 % par rang, soit +2 / +4 / +6 %). Les talents sont
   permanents ; on peut tout redistribuer une fois par saison.
===================================================== */

export const TALENT_RULES = {
  pointsPerAscension: 3,
  maxRank: 3,
  /** 6.14.104 (AA3, AA-2) : valeur par rang de chaque talent (0,02 = +2 % ; réseau : niveaux d'espionnage). Ids et effets en dur. */
  perRank: {
    rendement: 0.02,
    fonderies: 0.02,
    reacteurs: 0.02,
    nanoforges: 0.02,
    archivistes: 0.02,
    assaut: 0.02,
    rempart: 0.02,
    ateliers: 0.02,
    sentinelles: 0.02,
    reseau: 0.2,
    chantiers: 0.02,
    laboratoires: 0.02,
    entrepots: 0.02,
    soutes: 0.02,
    intendance: 0.02,
  } as Record<string, number>,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const TALENT_RULES_META = {
  pointsPerAscension: { label: "Points de talent par Ascension", min: 0, max: 20 },
  maxRank: { label: "Rang maximal d'un talent", min: 1, max: 10, hint: "En baisser ne retire pas les rangs déjà pris." },
  perRank: { label: "Valeur par rang de chaque talent", hint: "0,02 = +2 % par rang (entre 0 et 0,25). Réseau d'informateurs : niveaux d'espionnage par rang (entre 0 et 2). Les plafonds d'effets s'appliquent toujours." },
};

export type TalentBranch = "economie" | "guerre" | "logistique";

export type TalentEffect =
  | { kind: "productionAll" }
  | { kind: "production"; res: ResourceId }
  | { kind: "attack" | "defense" | "repair" | "detection" | "cargo" | "storage" | "buildTime" | "researchTime" }
  | { kind: "spyLevel" };

export interface TalentDef {
  id: string;
  branch: TalentBranch;
  name: string;
  description: string;
  effect: TalentEffect;
  /** Valeur par rang (0,02 = +2 %). */
  perRank: number;
}

export const TALENT_BRANCHES: { id: TalentBranch; name: string; color: string }[] = [
  { id: "economie", name: "Économie", color: "var(--color-mint-glow)" },
  { id: "guerre", name: "Guerre", color: "var(--color-danger-glow)" },
  { id: "logistique", name: "Logistique", color: "var(--color-cyan-glow)" },
];

/** 6.14.104 (AA3) : « 0,2 ». */
const decimalText = (n: number) => String(Math.round(n * 1000) / 1000).replace(".", ",");

/** 6.14.104 (AA3, AA-2) : valeur par rang lue dans TALENT_RULES.perRank (admin, Talents d'Ascension) ; ids et effets en dur. */
const talent = (id: string, branch: TalentBranch, name: string, description: string | (() => string), effect: TalentEffect): TalentDef => ({
  id,
  branch,
  name,
  get description() {
    return typeof description === "function" ? description() : description;
  },
  effect,
  get perRank() {
    const v = Number(TALENT_RULES.perRank[id]);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  },
});

export const TALENTS: TalentDef[] = [
  talent("rendement", "economie", "Rendement impérial", "Production de toutes les ressources.", { kind: "productionAll" }),
  talent("fonderies", "economie", "Fonderies profondes", "Production de ferraille.", { kind: "production", res: "scrap" }),
  talent("reacteurs", "economie", "Réacteurs stabilisés", "Production d'énergie instable.", { kind: "production", res: "energy" }),
  talent("nanoforges", "economie", "Nanoforges", "Production de nanocomposants.", { kind: "production", res: "nano" }),
  talent("archivistes", "economie", "Archivistes", "Production de données anciennes.", { kind: "production", res: "data" }),

  talent("assaut", "guerre", "Doctrine d'assaut", "Attaque de tes flottes.", { kind: "attack" }),
  talent("rempart", "guerre", "Rempart", "Défense de tes unités.", { kind: "defense" }),
  talent("ateliers", "guerre", "Ateliers de campagne", "Vaisseaux réparés après un combat.", { kind: "repair" }),
  talent("sentinelles", "guerre", "Sentinelles", "Chances de repérer l'espionnage adverse.", { kind: "detection" }),
  talent("reseau", "guerre", "Réseau d'informateurs", () => `Niveau d'espionnage (+${decimalText(TALENT_RULES.perRank.reseau ?? 0)} par rang).`, { kind: "spyLevel" }),

  talent("chantiers", "logistique", "Chantiers rapides", "Durée de construction des bâtiments.", { kind: "buildTime" }),
  talent("laboratoires", "logistique", "Laboratoires", "Durée des recherches.", { kind: "researchTime" }),
  talent("entrepots", "logistique", "Entrepôts étendus", "Capacité des entrepôts.", { kind: "storage" }),
  talent("soutes", "logistique", "Soutes renforcées", "Capacité de transport des flottes.", { kind: "cargo" }),
  talent("intendance", "logistique", "Intendance", "Production de toutes les ressources (logistique).", { kind: "productionAll" }),
];

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
  const def = TALENTS.find((t) => t.id === talentId);
  if (!def) throw new GameActionError("Talent inconnu.");
  const st = talentState(player);
  if ((st.ranks[def.id] ?? 0) >= TALENT_RULES.maxRank) throw new GameActionError("Ce talent est déjà au rang maximum.");
  if (talentPoints(player).free <= 0) throw new GameActionError(`Aucun point de talent disponible : chaque Ascension en donne ${TALENT_RULES.pointsPerAscension}.`);
  st.ranks[def.id] = (st.ranks[def.id] ?? 0) + 1;
  player.talents = st;
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

/** Bonus cumulés par effet (lus par playerModifiers). */
export function talentBonuses(player: Pick<PlayerState, "talents">): { def: TalentDef; value: number }[] {
  const st = talentState(player);
  return TALENTS.filter((t) => (st.ranks[t.id] ?? 0) > 0).map((def) => ({ def, value: def.perRank * (st.ranks[def.id] ?? 0) }));
}

/** v5.14 : effets des talents appris (circuit d'effets, couche empire). */
export function talentEffects(player: Pick<PlayerState, "talents">): EffectGrant[] {
  return talentBonuses(player).map(({ def, value }) => ({
    stat: def.effect.kind as EffectStat,
    target: def.effect.kind === "production" ? def.effect.res : undefined,
    value,
    layer: "empire" as const,
    source: { kind: "talent" as const, id: def.id, label: def.name },
  }));
}
