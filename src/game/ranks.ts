export const RANK_NAMES = [
  "Non-classé", "Fer III", "Fer II", "Fer I",
  "Bronze III", "Bronze II", "Bronze I",
  "Argent III", "Argent II", "Argent I",
  "Or III", "Or II", "Or I",
  "Platine III", "Platine II", "Platine I",
  "Émeraude", "Diamant", "Master",
  "Challenger", "Elite",
];

export const RANK_THRESHOLDS = [
  0, 100, 300, 600, 1000, 1500, 2000,
  2600, 3300, 4000, 5000, 6500, 8000,
  10000, 13000, 16000, 20000, 26000,
  33000, 42000, 52000,
];

export const RANK_ICONS = [
  "non_classe.png", "fer3.png", "fer2.png", "fer1.png",
  "bronze3.png", "bronze2.png", "bronze1.png",
  "argent3.png", "argent2.png", "argent1.png",
  "or3.png", "or2.png", "or1.png",
  "platine3.png", "platine2.png", "platine1.png",
  "emeraude.png", "diamant.png", "master.png",
  "challenger.png", "elite.png",
];

export function getRankIndex(xp: number): number {
  let index = 0;
  for (let i = 0; i < RANK_THRESHOLDS.length; i++) {
    if (xp >= RANK_THRESHOLDS[i]) index = i;
  }
  return index;
}

export function getRankLabel(xp: number): string {
  return RANK_NAMES[getRankIndex(xp)] ?? "Non-classé";
}

export function getRankIcon(xp: number): string {
  return `/assets/ranks/${RANK_ICONS[getRankIndex(xp)]}`;
}

export function getRankProgress(xp: number): { percent: number; current: string; next: string | null } {
  const idx = getRankIndex(xp);
  const min = RANK_THRESHOLDS[idx];
  const max = RANK_THRESHOLDS[idx + 1] ?? min;
  const percent = max > min ? Math.floor(((xp - min) / (max - min)) * 100) : 100;
  return { percent, current: RANK_NAMES[idx], next: RANK_NAMES[idx + 1] ?? null };
}
