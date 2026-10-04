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

export const TALENT_RULES = { pointsPerAscension: 3, maxRank: 3 };

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

export const TALENTS: TalentDef[] = [
  { id: "rendement", branch: "economie", name: "Rendement impérial", description: "Production de toutes les ressources.", effect: { kind: "productionAll" }, perRank: 0.02 },
  { id: "fonderies", branch: "economie", name: "Fonderies profondes", description: "Production de ferraille.", effect: { kind: "production", res: "scrap" }, perRank: 0.02 },
  { id: "reacteurs", branch: "economie", name: "Réacteurs stabilisés", description: "Production d'énergie instable.", effect: { kind: "production", res: "energy" }, perRank: 0.02 },
  { id: "nanoforges", branch: "economie", name: "Nanoforges", description: "Production de nanocomposants.", effect: { kind: "production", res: "nano" }, perRank: 0.02 },
  { id: "archivistes", branch: "economie", name: "Archivistes", description: "Production de données anciennes.", effect: { kind: "production", res: "data" }, perRank: 0.02 },

  { id: "assaut", branch: "guerre", name: "Doctrine d'assaut", description: "Attaque de tes flottes.", effect: { kind: "attack" }, perRank: 0.02 },
  { id: "rempart", branch: "guerre", name: "Rempart", description: "Défense de tes unités.", effect: { kind: "defense" }, perRank: 0.02 },
  { id: "ateliers", branch: "guerre", name: "Ateliers de campagne", description: "Vaisseaux réparés après un combat.", effect: { kind: "repair" }, perRank: 0.02 },
  { id: "sentinelles", branch: "guerre", name: "Sentinelles", description: "Chances de repérer l'espionnage adverse.", effect: { kind: "detection" }, perRank: 0.02 },
  { id: "reseau", branch: "guerre", name: "Réseau d'informateurs", description: "Niveau d'espionnage (+0,2 par rang).", effect: { kind: "spyLevel" }, perRank: 0.2 },

  { id: "chantiers", branch: "logistique", name: "Chantiers rapides", description: "Durée de construction des bâtiments.", effect: { kind: "buildTime" }, perRank: 0.02 },
  { id: "laboratoires", branch: "logistique", name: "Laboratoires", description: "Durée des recherches.", effect: { kind: "researchTime" }, perRank: 0.02 },
  { id: "entrepots", branch: "logistique", name: "Entrepôts étendus", description: "Capacité des entrepôts.", effect: { kind: "storage" }, perRank: 0.02 },
  { id: "soutes", branch: "logistique", name: "Soutes renforcées", description: "Capacité de transport des flottes.", effect: { kind: "cargo" }, perRank: 0.02 },
  { id: "intendance", branch: "logistique", name: "Intendance", description: "Production de toutes les ressources (logistique).", effect: { kind: "productionAll" }, perRank: 0.02 },
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
  if (talentPoints(player).free <= 0) throw new GameActionError("Aucun point de talent disponible : chaque Ascension en donne 3.");
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
