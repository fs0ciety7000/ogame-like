import { galaxyCoords } from "@/game/galaxy";
import type { EffectGrant } from "@/game/effects";
import type { Buildings } from "@/types/game";

/* =====================================================
   Territoires d'alliance (v5.1) : la galaxie est découpée en 6 × 4
   secteurs. Une alliance contrôle un secteur quand ses membres y cumulent
   le plus de niveaux de bâtiments (planète mère et colonies situées dans le
   secteur), avec au moins 150 niveaux. Chaque membre présent dans un
   secteur tenu par son alliance gagne +2 % de production par secteur
   (+6 % au plus). Recalcul toutes les heures par le serveur.
===================================================== */

export const TERRITORY_RULES = {
  cols: 6,
  rows: 4,
  minLevels: 150,
  bonusPerSector: 0.02,
  maxBonus: 0.06,
  /** Le bonus écrit sur le joueur reste valable ce délai (h) sans recalcul. */
  validHours: 3,
};

/** 6.14.95 (AA2) : libellé, unité, bornes et aide de chaque réglage (admin, Tous les réglages ; bornes vérifiées par validateRules). */
export const TERRITORY_RULES_META = {
  cols: { label: "Grille : colonnes (figé)", min: 6, max: 6, hint: "Les secteurs en cours en dépendent." },
  rows: { label: "Grille : lignes (figé)", min: 4, max: 4, hint: "Les secteurs en cours en dépendent." },
  minLevels: { label: "Niveaux cumulés pour tenir un secteur", unit: "niveaux", min: 0, max: 10_000, hint: "Planètes mères et colonies comprises." },
  bonusPerSector: { label: "Production en plus par secteur tenu", unit: "part", min: 0, max: 0.2 },
  maxBonus: { label: "Bonus maximal", unit: "part", min: 0, max: 1 },
  validHours: { label: "Validité du bonus sans recalcul", unit: "h", min: 1, max: 48 },
};

export const SECTOR_COUNT = TERRITORY_RULES.cols * TERRITORY_RULES.rows;

/** Secteur d'un point de la carte (identifiant de planète ou de colonie). */
export function sectorOf(planetId: string): number {
  const c = galaxyCoords(planetId);
  const col = Math.min(TERRITORY_RULES.cols - 1, Math.floor(c.x * TERRITORY_RULES.cols));
  const row = Math.min(TERRITORY_RULES.rows - 1, Math.floor(c.y * TERRITORY_RULES.rows));
  return row * TERRITORY_RULES.cols + col;
}

/** « A1 » à « F4 » : colonne en lettre, ligne en chiffre. */
export function sectorLabel(id: number): string {
  return `${String.fromCharCode(65 + (id % TERRITORY_RULES.cols))}${Math.floor(id / TERRITORY_RULES.cols) + 1}`;
}

export interface TerritoryPlayer {
  uid: string;
  allianceId: string;
  buildings: Buildings;
  colonies?: { id: string; buildings: Buildings }[] | null;
}

export interface SectorControl {
  id: number;
  /** Alliance qui tient le secteur (vide : personne). */
  allianceId: string;
  levels: number;
  /** Les trois premières alliances présentes, pour l'affichage. */
  contenders: { allianceId: string; levels: number }[];
}

export interface PlayerTerritory {
  /** Bonus de production (0,04 = +4 %). */
  pct: number;
  /** Secteurs tenus par l'alliance où le joueur est présent. */
  sectors: number[];
  /** Fin de validité du bonus (sans recalcul, il s'éteint). */
  untilMs: number;
}

function levelsOf(b: Buildings | null | undefined): number {
  return Object.values(b ?? {}).reduce((a, s) => a + (s?.level ?? 0), 0);
}

/** Contrôle des secteurs et bonus de chaque joueur. */
export function computeTerritories(players: TerritoryPlayer[], now: number): { sectors: SectorControl[]; byUid: Record<string, PlayerTerritory> } {
  const per: Map<string, number>[] = Array.from({ length: SECTOR_COUNT }, () => new Map());
  const presence = new Map<string, Set<number>>();
  for (const p of players) {
    if (!p.allianceId) continue;
    const planets = [{ id: p.uid, buildings: p.buildings }, ...(p.colonies ?? [])];
    const here = new Set<number>();
    for (const planet of planets) {
      const s = sectorOf(planet.id);
      here.add(s);
      per[s].set(p.allianceId, (per[s].get(p.allianceId) ?? 0) + levelsOf(planet.buildings));
    }
    presence.set(p.uid, here);
  }
  const sectors: SectorControl[] = per.map((m, id) => {
    const ranked = [...m.entries()].map(([allianceId, levels]) => ({ allianceId, levels })).sort((a, b) => b.levels - a.levels);
    const top = ranked[0];
    // Égalité en tête : personne ne tient le secteur.
    const held = top && top.levels >= TERRITORY_RULES.minLevels && !(ranked[1] && ranked[1].levels === top.levels);
    return { id, allianceId: held ? top.allianceId : "", levels: top?.levels ?? 0, contenders: ranked.slice(0, 3) };
  });
  const byUid: Record<string, PlayerTerritory> = {};
  for (const p of players) {
    const held = [...(presence.get(p.uid) ?? [])].filter((s) => p.allianceId && sectors[s].allianceId === p.allianceId).sort((a, b) => a - b);
    byUid[p.uid] = { pct: Math.min(TERRITORY_RULES.maxBonus, held.length * TERRITORY_RULES.bonusPerSector), sectors: held, untilMs: now + TERRITORY_RULES.validHours * 3600_000 };
  }
  return { sectors, byUid };
}

/** Bonus de production en vigueur (0 s'il a expiré). */
export function territoryBonus(t: PlayerTerritory | null | undefined, now: number): number {
  return t && t.untilMs > now ? Math.min(TERRITORY_RULES.maxBonus, Math.max(0, t.pct)) : 0;
}

/** v5.14 : effet du territoire d'alliance (circuit d'effets, couche empire). */
export function territoryEffects(t: PlayerTerritory | null | undefined, now: number): EffectGrant[] {
  const pct = territoryBonus(t, now);
  return pct > 0 ? [{ stat: "productionAll", value: pct, layer: "empire", source: { kind: "territory", id: "territory", label: `Territoire d'alliance (${t?.sectors.length ?? 0} secteur${(t?.sectors.length ?? 0) > 1 ? "s" : ""})` } }] : [];
}

/** Secteurs tenus par une alliance (classement des guerres de saison). */
export function sectorsHeldBy(sectors: SectorControl[], allianceId: string): number {
  return sectors.filter((s) => s.allianceId === allianceId).length;
}
