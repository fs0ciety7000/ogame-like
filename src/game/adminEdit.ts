import { findBuilding } from "@/game/buildings";
import { COMMON_RESOURCES, storageCapacityOf } from "@/game/economy";
import { GameActionError } from "@/game/errors";
import { hangarLoad, type HangarCategory } from "@/game/hangar";
import { RESOURCE_LIST } from "@/game/resources";
import { findTech } from "@/game/technologies";
import { findUnit } from "@/game/units";
import type { PlayerState, QueuesState, ResourceId } from "@/types/game";

/* =====================================================
   6.14.65 (AC-B, revue AU27) : édition d'un joueur par l'administration.

   L'éditeur de la page Admin n'envoie que des DIFFÉRENCES (delta) entre la
   fiche affichée et ce que l'admin a saisi ; le serveur les applique sur
   l'état rattrapé, relu dans la transaction (invariant I24). Une fiche
   ouverte depuis 10 min ne réécrit donc plus ce que le joueur a fait entre-temps.

   - nombres (XP, ressources, niveaux, quantités) : delta ajouté à la valeur fraîche ;
   - `unlocked` d'un bâtiment : valeur absolue (case cochée ou non) ;
   - plafonds : niveaux dans [0, niveau maximal] ; une ressource commune ne monte
     pas au-delà de l'entrepôt (un stock déjà au-delà est gardé) ; une hausse
     d'unités ne crée ni n'aggrave une surcharge du hangar (`hangarLoad`).
   Un retrait plus grand que le stock s'arrête à 0.
===================================================== */

export interface AdminEditChanges {
  xp?: number;
  seasonXp?: number;
  resources?: Partial<Record<ResourceId, number>>;
  buildings?: Record<string, { level?: number; unlocked?: boolean }>;
  units?: Record<string, { level?: number; count?: number }>;
  techLevels?: Record<string, number>;
}

/** Fiche telle que l'éditeur l'affiche (champs éditables seulement). */
export type AdminEditable = Pick<PlayerState, "xp" | "resources" | "buildings" | "units" | "techLevels"> & { seasonXp?: number };

/** Valeurs par défaut d'une entrée absente, communes à l'éditeur et au serveur. */
const ADMIN_EDIT_DEFAULTS = {
  building: { level: 1, unlocked: false },
  unit: { level: 0, count: 0 },
  tech: 0,
} as const;

/** Une modification change au plus 10^12 d'un coup (garde contre une saisie absurde). */
const MAX_DELTA = 1e12;

const num = (v: unknown): number => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/** Différences entre la fiche affichée et le brouillon de l'éditeur (vide si rien n'a changé). */
export function adminEditDiff(original: AdminEditable, draft: AdminEditable): AdminEditChanges {
  const out: AdminEditChanges = {};
  const dXp = num(draft.xp) - num(original.xp);
  if (dXp) out.xp = dXp;
  const dSeason = num(draft.seasonXp) - num(original.seasonXp);
  if (dSeason) out.seasonXp = dSeason;

  const resources: Partial<Record<ResourceId, number>> = {};
  for (const r of RESOURCE_LIST) {
    const d = Math.floor(num(draft.resources?.[r.id])) - Math.floor(num(original.resources?.[r.id]));
    if (d) resources[r.id] = d;
  }
  if (Object.keys(resources).length) out.resources = resources;

  const buildings: NonNullable<AdminEditChanges["buildings"]> = {};
  for (const id of new Set([...Object.keys(original.buildings ?? {}), ...Object.keys(draft.buildings ?? {})])) {
    const a = original.buildings?.[id] ?? ADMIN_EDIT_DEFAULTS.building;
    const b = draft.buildings?.[id] ?? a;
    const entry: { level?: number; unlocked?: boolean } = {};
    const d = num(b.level) - num(a.level);
    if (d) entry.level = d;
    if (!!b.unlocked !== !!a.unlocked) entry.unlocked = !!b.unlocked;
    if (Object.keys(entry).length) buildings[id] = entry;
  }
  if (Object.keys(buildings).length) out.buildings = buildings;

  const units: NonNullable<AdminEditChanges["units"]> = {};
  for (const id of new Set([...Object.keys(original.units ?? {}), ...Object.keys(draft.units ?? {})])) {
    const a = original.units?.[id] ?? ADMIN_EDIT_DEFAULTS.unit;
    const b = draft.units?.[id] ?? a;
    const entry: { level?: number; count?: number } = {};
    const dl = num(b.level) - num(a.level);
    const dc = num(b.count) - num(a.count);
    if (dl) entry.level = dl;
    if (dc) entry.count = dc;
    if (Object.keys(entry).length) units[id] = entry;
  }
  if (Object.keys(units).length) out.units = units;

  const techs: Record<string, number> = {};
  for (const id of new Set([...Object.keys(original.techLevels ?? {}), ...Object.keys(draft.techLevels ?? {})])) {
    const d = num(draft.techLevels?.[id] ?? ADMIN_EDIT_DEFAULTS.tech) - num(original.techLevels?.[id] ?? ADMIN_EDIT_DEFAULTS.tech);
    if (d) techs[id] = d;
  }
  if (Object.keys(techs).length) out.techLevels = techs;
  return out;
}

/** Nombre de changements décrits (0 : rien à envoyer). */
export function adminEditCount(changes: AdminEditChanges): number {
  let n = (changes.xp ? 1 : 0) + (changes.seasonXp ? 1 : 0);
  n += Object.keys(changes.resources ?? {}).length + Object.keys(changes.techLevels ?? {}).length;
  for (const e of Object.values(changes.buildings ?? {})) n += Object.keys(e ?? {}).length;
  for (const e of Object.values(changes.units ?? {})) n += Object.keys(e ?? {}).length;
  return n;
}

function delta(v: unknown, label: string): number {
  if (v === undefined || v === null) return 0;
  const n = Number(v);
  if (!Number.isFinite(n) || Math.abs(n) > MAX_DELTA) throw new GameActionError(`${label} : valeur invalide.`);
  return Math.trunc(n);
}

function inRange(value: number, max: number, label: string): number {
  if (value < 0 || value > max) throw new GameActionError(`${label} : niveau ${value} hors limites (0 à ${max}).`);
  return value;
}

const RESOURCE_NAMES = new Map(RESOURCE_LIST.map((r) => [r.id as string, r.name]));
const CATEGORY_LABEL: Record<HangarCategory, string> = { attack: "Hangar d'attaque", defense: "Hangar de défense" };

export interface AdminEditResult {
  /** Champ → valeurs avant et après (journal de l'admin). */
  changes: Record<string, { avant: unknown; après: unknown }>;
}

/**
 * Applique les différences de l'éditeur sur la fiche fraîche (déjà rattrapée). Modifie `player`.
 * `away` : unités en vol du joueur (flottes non terminées), comptées par le hangar.
 * Lève une GameActionError si une valeur est invalide ou si un plafond serait dépassé : rien n'est alors sauvé.
 */
export function applyAdminEdit(player: PlayerState, queues: Pick<QueuesState, "unitQueues"> | null | undefined, away: Record<string, number>, input: unknown, now: number): AdminEditResult {
  const changes = (input && typeof input === "object" ? input : {}) as AdminEditChanges;
  const log: AdminEditResult["changes"] = {};
  const before = (["attack", "defense"] as const).map((c) => hangarLoad(player, queues, away, c, now).overflow);
  const unitsUp = new Set<HangarCategory>();

  for (const field of ["xp", "seasonXp"] as const) {
    const d = delta(changes[field], field === "xp" ? "XP" : "XP de saison");
    if (!d) continue;
    const cur = num(player[field]);
    const next = Math.max(0, cur + d);
    player[field] = next;
    log[field] = { avant: cur, après: next };
  }

  for (const [id, entry] of Object.entries(changes.buildings ?? {})) {
    const def = findBuilding(id);
    if (!def) throw new GameActionError(`Bâtiment inconnu : ${id}.`);
    const cur = { ...ADMIN_EDIT_DEFAULTS.building, ...(player.buildings?.[id] ?? {}) };
    const d = delta(entry?.level, def.name);
    const next = { ...cur, level: inRange(cur.level + d, def.maxLevel, def.name) };
    if (typeof entry?.unlocked === "boolean") next.unlocked = entry.unlocked;
    if (next.level === cur.level && next.unlocked === cur.unlocked) continue;
    player.buildings = { ...player.buildings, [id]: next };
    log[`buildings.${id}`] = { avant: cur, après: next };
  }

  for (const [id, raw] of Object.entries(changes.techLevels ?? {})) {
    const def = findTech(id);
    if (!def) throw new GameActionError(`Technologie inconnue : ${id}.`);
    const d = delta(raw, def.nom);
    if (!d) continue;
    const cur = num(player.techLevels?.[id]);
    const next = inRange(cur + d, def.maxLevel, def.nom);
    player.techLevels = { ...player.techLevels, [id]: next };
    log[`techLevels.${id}`] = { avant: cur, après: next };
  }

  // Ressources après les bâtiments : un entrepôt monté par la même édition compte.
  const capacity = storageCapacityOf(player);
  for (const [id, raw] of Object.entries(changes.resources ?? {})) {
    const name = RESOURCE_NAMES.get(id);
    if (!name) throw new GameActionError(`Ressource inconnue : ${id}.`);
    const res = id as ResourceId;
    const d = delta(raw, name);
    if (!d) continue;
    const cur = num(player.resources?.[res]);
    let next = Math.max(0, cur + d);
    if (d > 0 && COMMON_RESOURCES.includes(res) && next > Math.max(capacity, cur)) {
      const room = Math.max(0, Math.floor(capacity - cur));
      throw new GameActionError(`Entrepôt : ${name} +${room} au plus (capacité ${Math.floor(capacity)}). Pour une compensation au-delà, utilise « Rendre des ressources ».`);
    }
    next = Math.floor(next);
    player.resources = { ...player.resources, [res]: next };
    log[`resources.${id}`] = { avant: cur, après: next };
  }

  for (const [id, entry] of Object.entries(changes.units ?? {})) {
    const def = findUnit(id);
    if (!def) throw new GameActionError(`Unité inconnue : ${id}.`);
    const cur = { ...ADMIN_EDIT_DEFAULTS.unit, ...(player.units?.[id] ?? {}) };
    const dl = delta(entry?.level, def.name);
    const dc = delta(entry?.count, def.name);
    const next = { ...cur, level: inRange(cur.level + dl, def.maxLevel, def.name), count: Math.max(0, cur.count + dc) };
    if (next.level === cur.level && next.count === cur.count) continue;
    if (dc > 0 && (def.category === "attack" || def.category === "defense")) unitsUp.add(def.category);
    player.units = { ...player.units, [id]: next };
    log[`units.${id}`] = { avant: cur, après: next };
  }

  // Hangar : une hausse d'unités (ou un hangar baissé) ne crée ni n'aggrave une surcharge.
  (["attack", "defense"] as const).forEach((c, i) => {
    const after = hangarLoad(player, queues, away, c, now);
    if (after.overflow > before[i]) {
      const why = unitsUp.has(c) ? `${after.overflow} place(s) de trop` : `capacité baissée, ${after.overflow} place(s) de trop`;
      throw new GameActionError(`${CATEGORY_LABEL[c]} : ${why} (capacité ${after.capacity}, occupé ${after.used}).`);
    }
  });

  if (Object.keys(log).length === 0) throw new GameActionError("Aucune modification à enregistrer.");
  return { changes: log };
}
