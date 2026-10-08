import { WORLD_BOSSES } from "@/game/worldBosses";
import { isTargetedMetric, METRICS, type AchievementMetric } from "@/game/achievements";
import type { PlayerState } from "@/types/game";

/* =====================================================
   v5.10 : catalogue des titres (section de contenu « titles », modifiable
   dans l'administration). Un titre a un libellé, une description, une
   rareté (sa couleur) et une icône. Il peut :
   - se débloquer seul quand une mesure du joueur atteint un seuil (mêmes
     mesures que les succès : victoires, pillage, missions, dons…) ;
   - être décerné par un succès (champ « titleId » du succès) ;
   - habiller un titre gagné ailleurs (boss, défi, saison) : le catalogue
     est consulté par libellé pour la couleur et la description.
===================================================== */

export type TitleRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export const TITLE_RARITIES: { id: TitleRarity; label: string; color: string }[] = [
  { id: "common", label: "Commun", color: "#cbd5e1" },
  { id: "rare", label: "Rare", color: "#4be8ff" },
  { id: "epic", label: "Épique", color: "#a78bfa" },
  { id: "legendary", label: "Légendaire", color: "#ffd86b" },
  { id: "mythic", label: "Mythique", color: "#ff5df0" },
];

export interface TitleDef {
  id: string;
  label: string;
  description: string;
  /** Emoji affiché devant le titre. */
  icon: string;
  rarity: TitleRarity;
  enabled: boolean;
  /** Déblocage automatique : mesure du joueur et seuil (absent = décerné par une autre source). */
  unlock?: { metric: AchievementMetric; threshold: number } | null;
}

const T = (id: string, label: string, description: string, icon: string, rarity: TitleRarity, unlock?: TitleDef["unlock"]): TitleDef => ({
  id,
  label,
  description,
  icon,
  rarity,
  enabled: true,
  ...(unlock ? { unlock } : {}),
});

export const DEFAULT_TITLES: TitleDef[] = [
  // Décernés par des succès (voir leur champ titleId).
  T("conquerant", "Conquérant", "Mille victoires au compteur.", "👑", "legendary"),
  T("batisseur_mondes", "Bâtisseur de mondes", "Un empire bâti pierre après pierre.", "🏙️", "legendary"),
  T("omniscient", "Omniscient", "Toutes les sciences du secteur maîtrisées.", "🧠", "legendary"),
  T("amiral_maree", "Amiral de la Marée", "Une flotte capable de noyer l'horizon.", "🌊", "legendary"),
  T("fleau_factions", "Fléau des factions", "Les factions murmurent ton nom avec crainte.", "☠️", "legendary"),
  // Gagnés ailleurs : le catalogue les habille.
  T("fleau_leviathan", "Fléau du Léviathan", "Premier en dégâts contre le Léviathan.", "🐋", "mythic"),
  T("pilier_semaine", "Pilier de la semaine", "Meilleur contributeur du défi de la semaine.", "🏛️", "epic"),
  T("as_casino", "As du casino", "Vainqueur du dernier tournoi du Casino orbital.", "🎰", "epic"),
  T("main_or", "Main d'or", "A aligné trois 7 au Casino orbital.", "🍀", "legendary"),
  // 6.14.69 (É30-1d) : décerné par le succès « Maître du seuil » (25 sauts de porte).
  T("gardien_seuil", "Gardien du seuil", "25 flottes ramenées par la porte de saut lunaire.", "🗝️", "epic"),
  // 6.14.85 (RL-2) : décerné par le succès « Grand œuvre » (100 projets de prestige).
  T("batisseur_eternite", "Bâtisseur d'éternité", "100 projets de prestige achevés.", "🏛️", "epic"),
  // 6.14.146 (PB-L5) : décerné par le succès « Architecte » (les 4 paliers signature des bâtiments de système).
  T("grand_architecte", "Grand architecte", "Entrepôt, Atelier et hangars à leur palier signature en même temps.", "📐", "epic"),
  // Déblocage automatique sur une mesure.
  T("mecene", "Mécène", "A offert 10 cadeaux à d'autres commandants.", "🎁", "rare", { metric: "giftsSent", threshold: 10 }),
  T("marchand_etoiles", "Marchand des étoiles", "Un million de ressources échangées au marché.", "🪙", "rare", { metric: "traded", threshold: 1_000_000 }),
  T("eclaireur", "Éclaireur", "100 sondes d'espionnage lancées.", "🛰️", "common", { metric: "spies", threshold: 100 }),
  T("chasseur_epaves", "Chasseur d'épaves", "Un million de ressources recyclées.", "♻️", "rare", { metric: "recycled", threshold: 1_000_000 }),
];

export const TITLES: TitleDef[] = [];
const BY_LABEL = new Map<string, TitleDef>();

/** Titres ajoutés après coup : ajoutés aussi aux catalogues déjà personnalisés (v5.12). */
const LATE_DEFAULTS = ["as_casino", "main_or", "gardien_seuil", "batisseur_eternite", "grand_architecte"];

/** Catalogue enregistré + titres par défaut arrivés depuis. */
export function withLateDefaults(defs: TitleDef[]): TitleDef[] {
  const have = new Set(defs.map((t) => t.id));
  return [...defs, ...DEFAULT_TITLES.filter((t) => LATE_DEFAULTS.includes(t.id) && !have.has(t.id)).map((t) => structuredClone(t))];
}

/** v5.14 : titres des boss mondiaux (le Léviathan a déjà le sien), tirés du catalogue. */
export function derivedTitles(): TitleDef[] {
  return WORLD_BOSSES.filter((b) => b.id !== "leviathan").map((b) => T(`wb_${b.id}`, b.title, `Premier en dégâts contre ${b.name}.`, "🐉", "mythic"));
}

export function setTitles(defs: TitleDef[]): void {
  const have = new Set(defs.map((t) => t.id));
  defs = [...defs, ...derivedTitles().filter((t) => !have.has(t.id))];
  TITLES.splice(0, TITLES.length, ...defs);
  BY_LABEL.clear();
  for (const t of defs) if (t.label) BY_LABEL.set(t.label.toLowerCase(), t);
}
setTitles(structuredClone(DEFAULT_TITLES));

export function findTitle(id: string | undefined | null): TitleDef | undefined {
  return id ? TITLES.find((t) => t.id === id) : undefined;
}

/** Fiche du catalogue pour un libellé gagné (titres de saison, de boss… : absents → null). */
export function titleByLabel(label: string | undefined | null): TitleDef | null {
  return label ? (BY_LABEL.get(label.toLowerCase()) ?? null) : null;
}

export function titleRarity(id: TitleRarity | undefined): { id: TitleRarity; label: string; color: string } {
  return TITLE_RARITIES.find((r) => r.id === id) ?? TITLE_RARITIES[0];
}

/** Style d'affichage d'un titre gagné : couleur et icône du catalogue, sinon or et trophée. */
export function titleStyle(label: string | undefined | null): { icon: string; color: string; description: string; rarity: string } {
  const t = titleByLabel(label);
  if (!t) return { icon: "🏆", color: "#ffd86b", description: "", rarity: "" };
  const r = titleRarity(t.rarity);
  return { icon: t.icon || "🏆", color: r.color, description: t.description, rarity: r.label };
}

/** Donne un titre (une seule fois). Retourne true s'il est nouveau. */
export function grantTitle(player: PlayerState, label: string, sourceId: string): boolean {
  if (!label) return false;
  if ((player.titles ?? []).some((t) => t.label === label)) return false;
  player.titles = [...(player.titles ?? []), { label, seasonId: sourceId, rank: 1 }];
  return true;
}

export function titleProgress(t: TitleDef, player: PlayerState): number {
  if (!t.unlock) return 0;
  const m = METRICS[t.unlock.metric];
  return m ? m.value(player) : 0;
}

/** Titres à débloquer automatiquement (mesure atteinte, pas encore possédés). */
export function checkNewTitles(player: PlayerState): TitleDef[] {
  const owned = new Set((player.titles ?? []).map((t) => t.label));
  return TITLES.filter((t) => t.enabled && t.unlock && t.label && !owned.has(t.label) && titleProgress(t, player) >= t.unlock.threshold);
}

export function validateTitles(defs: TitleDef[]): string[] {
  const errors: string[] = [];
  const ids = new Set<string>();
  const labels = new Set<string>();
  for (const t of defs) {
    if (!/^[a-z0-9_]+$/.test(t.id ?? "")) errors.push(`Titre « ${t.label || t.id} » : identifiant invalide (minuscules, chiffres, _).`);
    if (ids.has(t.id)) errors.push(`Titre ${t.id} : identifiant en double.`);
    ids.add(t.id);
    if (!t.label?.trim()) errors.push(`Titre ${t.id} : libellé vide.`);
    const key = (t.label ?? "").toLowerCase();
    if (key && labels.has(key)) errors.push(`Titre « ${t.label} » : libellé en double.`);
    labels.add(key);
    if (!TITLE_RARITIES.some((r) => r.id === t.rarity)) errors.push(`Titre ${t.id} : rareté inconnue.`);
    if (t.unlock) {
      if (!(t.unlock.metric in METRICS)) errors.push(`Titre ${t.id} : mesure de déblocage inconnue.`);
      else if (isTargetedMetric(t.unlock.metric)) errors.push(`Titre ${t.id} : mesure réservée aux succès par contenu.`);
      if (!(Number(t.unlock.threshold) > 0)) errors.push(`Titre ${t.id} : seuil de déblocage invalide.`);
    }
  }
  return errors;
}

/* ---------- 6.8.0 (AU3, PRG-4) : titres groupés par famille ---------- */

const ROMAN_VALUES: Record<string, number> = { I: 1, V: 5, X: 10 };
function romanValue(r: string): number {
  let total = 0;
  for (let i = 0; i < r.length; i++) {
    const v = ROMAN_VALUES[r[i]] ?? 0;
    const next = ROMAN_VALUES[r[i + 1]] ?? 0;
    total += v < next ? -v : v;
  }
  return total;
}

/** « Magnat IV » → { family: "Magnat", rank: 4 } ; un titre sans palier est sa propre famille (rang 0). */
export function titleFamily(label: string): { family: string; rank: number } {
  const m = /^(.*\S)\s+([IVX]+)$/.exec(label.trim());
  return m ? { family: m[1], rank: romanValue(m[2]) } : { family: label.trim(), rank: 0 };
}

/** Titres proposés au choix : le plus haut palier de chaque famille (le titre affiché reste toujours proposé).
 *  `hidden` : paliers inférieurs gardés dans la vitrine, mais pas dans la liste de choix. */
export function groupedTitles<T extends { label: string }>(titles: readonly T[], active = ""): { shown: T[]; hidden: T[] } {
  const best = new Map<string, T>();
  for (const t of titles) {
    const { family, rank } = titleFamily(t.label);
    const cur = best.get(family);
    if (!cur || titleFamily(cur.label).rank < rank) best.set(family, t);
  }
  const keep = new Set<T>(best.values());
  for (const t of titles) if (t.label === active) keep.add(t);
  return { shown: titles.filter((t) => keep.has(t)), hidden: titles.filter((t) => !keep.has(t)) };
}
