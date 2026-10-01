/* =====================================================
   Rangs (v2.2) : 28 paliers d'XP totale, modifiables dans l'administration
   (section de contenu « ranks »). Triés par XP croissante, le premier à 0.
===================================================== */

/** Version des emblèmes (cache des navigateurs). */
export const RANK_ASSET_VERSION = "2.3";

export interface RankDef {
  id: string;
  name: string;
  /** Famille (Fer, Bronze…) : regroupements des statistiques. */
  family: string;
  /** XP totale requise. */
  xp: number;
  /** Emblème (chemin public ou URL d'un fichier envoyé). */
  image: string;
}

const rank = (id: string, name: string, family: string, xp: number): RankDef => ({ id, name, family, xp, image: `/assets/ranks/${id}.webp` });
const tiers = (prefix: string, family: string, xps: [number, number, number]): RankDef[] => [
  rank(`${prefix}3`, `${family} III`, family, xps[0]),
  rank(`${prefix}2`, `${family} II`, family, xps[1]),
  rank(`${prefix}1`, `${family} I`, family, xps[2]),
];

export const DEFAULT_RANKS: RankDef[] = [
  rank("non_classe", "Non classé", "Non classé", 0),
  ...tiers("fer", "Fer", [100, 250, 500]),
  ...tiers("bronze", "Bronze", [900, 1_400, 2_000]),
  ...tiers("argent", "Argent", [3_000, 4_200, 5_600]),
  ...tiers("or", "Or", [7_500, 10_000, 13_000]),
  ...tiers("platine", "Platine", [17_000, 22_000, 28_000]),
  ...tiers("emeraude", "Émeraude", [36_000, 45_000, 56_000]),
  ...tiers("diamant", "Diamant", [70_000, 87_000, 107_000]),
  ...tiers("maitre", "Maître", [130_000, 160_000, 195_000]),
  rank("grand_maitre", "Grand Maître", "Grand Maître", 240_000),
  rank("challenger", "Challenger", "Challenger", 320_000),
  rank("elite", "Élite", "Élite", 420_000),
];

/** Registre courant (remplacé par applyGameContent). */
export const RANKS: RankDef[] = [];
export function setRanks(defs: RankDef[]) {
  RANKS.splice(0, RANKS.length, ...[...defs].sort((a, b) => a.xp - b.xp));
}
setRanks(structuredClone(DEFAULT_RANKS));

export function getRankIndex(xp: number): number {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if ((xp ?? 0) >= RANKS[i].xp) index = i;
  }
  return index;
}

export function getRank(xp: number): RankDef {
  return RANKS[getRankIndex(xp)] ?? DEFAULT_RANKS[0];
}

export function getRankLabel(xp: number): string {
  return getRank(xp).name;
}

export function getRankIcon(xp: number): string {
  const image = getRank(xp).image;
  // Même règle que assetUrl (src/lib/assets.ts), sans dépendre du client.
  return image.startsWith("/assets/") && !image.includes("?") ? `${image}?v=${RANK_ASSET_VERSION}` : image;
}

/** Indice du premier rang d'une famille (succès, statistiques). */
export function familyIndex(family: string): number {
  return RANKS.findIndex((r) => r.family === family);
}

export function getRankProgress(xp: number): { percent: number; current: string; next: string | null; nextXp: number | null } {
  const idx = getRankIndex(xp);
  const min = RANKS[idx]?.xp ?? 0;
  const next = RANKS[idx + 1];
  const percent = next && next.xp > min ? Math.floor(((xp - min) / (next.xp - min)) * 100) : 100;
  return { percent, current: RANKS[idx]?.name ?? "", next: next?.name ?? null, nextXp: next?.xp ?? null };
}

/** Validation des rangs (administration). */
export function validateRanks(defs: RankDef[]): string[] {
  const errors: string[] = [];
  if (defs.length === 0) return ["Rangs : au moins un rang est nécessaire."];
  const seen = new Set<string>();
  for (const r of defs) {
    const label = `Rang ${r.name || r.id}`;
    if (!/^[a-z0-9_]+$/.test(r.id ?? "")) errors.push(`${label} : identifiant « ${r.id} » invalide (minuscules, chiffres, _).`);
    if (seen.has(r.id)) errors.push(`${label} : identifiant en double.`);
    seen.add(r.id);
    if (!r.name?.trim()) errors.push(`${label} : nom manquant.`);
    if (!(r.xp >= 0)) errors.push(`${label} : XP requise invalide.`);
  }
  if (!defs.some((r) => r.xp === 0)) errors.push("Rangs : il faut un rang à 0 XP (le rang de départ).");
  const xps = defs.map((r) => r.xp);
  if (new Set(xps).size !== xps.length) errors.push("Rangs : deux rangs ont la même XP requise.");
  return errors;
}
