import { GameActionError } from "@/game/errors";
import { FACTIONS, pirateState } from "@/game/pirates";
import type { PlayerState } from "@/types/game";

/* =====================================================
   5.16 : planète personnalisable. Le joueur choisit la palette de son
   monde, son anneau, son atmosphère et une lune. Certaines options sont
   offertes, les autres se débloquent par les exploits (expéditions, boss,
   Ascension, passes…). Purement cosmétique : aucun effet de jeu.
   Le choix est rangé dans profileStyle.planet, revérifié par le serveur,
   et publié dans la vitrine de la fiche publique.
   Les couleurs sont des jetons du thème (var(--color-…)) : la planète
   suit le thème choisi par celui qui la regarde.
===================================================== */

export type PlanetSlot = "palette" | "ring" | "atmosphere" | "moon";

export interface PlanetLook {
  palette: string;
  ring: string;
  atmosphere: string;
  moon: string;
}

export const DEFAULT_PLANET_LOOK: PlanetLook = { palette: "ocean", ring: "thin", atmosphere: "clear", moon: "none" };

export interface PlanetPalette {
  /** Teinte de l'océan (jeton du thème). */
  ocean: string;
  /** Teinte des continents. */
  land: string;
}

type LookPlayer = Partial<Pick<PlayerState, "stats" | "pirates" | "referral" | "seasonPass" | "ascensions" | "unlockedAchievements" | "bounties">>;

/** 5.26.3 : Effet de planète (Comptoir de la Ruche). Lecture brute : pas d'import circulaire avec bounties. */
const hasPlanetFx = (p: LookPlayer): boolean => {
  const owned = (p.bounties as { owned?: unknown } | undefined)?.owned;
  return Array.isArray(owned) && owned.includes("planetFx");
};

interface LookDef {
  id: string;
  label: string;
  hint: string;
  unlocked: (p: LookPlayer) => boolean;
}

export interface PlanetLookOption {
  id: string;
  label: string;
  hint: string;
  unlocked: boolean;
}

const stat = (p: LookPlayer, key: string): number => Number((p.stats as Record<string, unknown> | undefined)?.[key]) || 0;
const bossesKilled = (p: LookPlayer): number => ((p.stats as { worldBossKilled?: string[] } | undefined)?.worldBossKilled ?? []).length + (stat(p, "leviathanKills") > 0 ? 1 : 0);
const free = () => true;

const PLANET_PALETTES: Record<string, PlanetPalette> = {
  ocean: { ocean: "var(--color-cyan-glow)", land: "var(--color-slate-500)" },
  dunes: { ocean: "var(--color-gold-glow)", land: "var(--color-ember-glow)" },
  glacier: { ocean: "var(--color-slate-300)", land: "var(--color-cyan-glow)" },
  canopee: { ocean: "var(--color-cyan-glow)", land: "var(--color-mint-glow)" },
  magma: { ocean: "var(--color-danger-glow)", land: "var(--color-ember-glow)" },
  cristal: { ocean: "var(--color-violet-glow)", land: "var(--color-cyan-glow)" },
};

const OPTIONS: Record<PlanetSlot, LookDef[]> = {
  palette: [
    { id: "ocean", label: "Océan", hint: "Offerte", unlocked: free },
    { id: "dunes", label: "Dunes", hint: "Offerte", unlocked: free },
    { id: "glacier", label: "Glacier", hint: "Offerte", unlocked: free },
    { id: "canopee", label: "Canopée", hint: "Terminer 10 expéditions", unlocked: (p) => stat(p, "expeditions") >= 10 },
    { id: "magma", label: "Magma", hint: "Abattre un boss mondial", unlocked: (p) => bossesKilled(p) >= 1 },
    { id: "cristal", label: "Cristal", hint: "Faire une Ascension", unlocked: (p) => (Number(p.ascensions) || 0) >= 1 },
  ],
  ring: [
    { id: "thin", label: "Anneau fin", hint: "Offert", unlocked: free },
    { id: "none", label: "Sans anneau", hint: "Offert", unlocked: free },
    { id: "double", label: "Double anneau", hint: "Terminer un passe de saison", unlocked: (p) => (p.seasonPass?.completed ?? []).length > 0 },
    { id: "debris", label: "Ceinture de débris", hint: "Recycler un champ de débris", unlocked: (p) => stat(p, "recycled") > 0 },
    { id: "halo", label: "Halo pirate", hint: "Faire tomber un repaire pirate", unlocked: (p) => FACTIONS.some((f) => pirateState(p as Parameters<typeof pirateState>[0], f.id).lairsTaken > 0) },
    { id: "ambre", label: "Anneau d'ambre", hint: "Effet de planète (Comptoir de la Ruche)", unlocked: hasPlanetFx },
  ],
  atmosphere: [
    { id: "clear", label: "Claire", hint: "Offerte", unlocked: free },
    { id: "none", label: "Aucune", hint: "Offerte", unlocked: free },
    { id: "aurore", label: "Aurore", hint: "Obtenir 20 succès, ou Effet de planète (Comptoir)", unlocked: (p) => (p.unlockedAchievements ?? []).length >= 20 || hasPlanetFx(p) },
    { id: "doree", label: "Brume dorée", hint: "Conclure 25 échanges au marché", unlocked: (p) => stat(p, "marketTrades") >= 25 },
    { id: "braise", label: "Braise", hint: "Piller 1 M de ressources", unlocked: (p) => stat(p, "loot") >= 1_000_000 },
  ],
  moon: [
    { id: "none", label: "Aucune", hint: "Offerte", unlocked: free },
    { id: "grise", label: "Lune grise", hint: "Offerte", unlocked: free },
    { id: "jumelles", label: "Lunes jumelles", hint: "Parrainer un joueur", unlocked: (p) => (p.referral?.recruits ?? 0) > 0 },
    { id: "station", label: "Station orbitale", hint: "Construire 1 000 unités", unlocked: (p) => stat(p, "unitsBuilt") >= 1000 },
    { id: "eclat", label: "Éclat de boss", hint: "Abattre 3 boss mondiaux différents", unlocked: (p) => bossesKilled(p) >= 3 },
  ],
};

export const PLANET_SLOTS: { slot: PlanetSlot; label: string }[] = [
  { slot: "palette", label: "Palette" },
  { slot: "ring", label: "Anneau" },
  { slot: "atmosphere", label: "Atmosphère" },
  { slot: "moon", label: "Lune" },
];

export function planetLookOptions(p: LookPlayer, slot: PlanetSlot): PlanetLookOption[] {
  return OPTIONS[slot].map((o) => ({ id: o.id, label: o.label, hint: o.hint, unlocked: o.unlocked(p) }));
}

/** Lecture tolérante (identifiants inconnus → valeur par défaut). */
export function normalizePlanetLook(raw: unknown): PlanetLook {
  const r = (raw && typeof raw === "object" ? raw : {}) as Partial<Record<PlanetSlot, unknown>>;
  const pick = (slot: PlanetSlot) => {
    const id = String(r[slot] ?? "");
    return OPTIONS[slot].some((o) => o.id === id) ? id : DEFAULT_PLANET_LOOK[slot];
  };
  return { palette: pick("palette"), ring: pick("ring"), atmosphere: pick("atmosphere"), moon: pick("moon") };
}

/** Choix du joueur, revérifié : une option verrouillée est refusée. */
export function checkPlanetLook(p: LookPlayer, input: unknown, current: PlanetLook = DEFAULT_PLANET_LOOK): PlanetLook {
  const req = (input && typeof input === "object" ? input : {}) as Partial<Record<PlanetSlot, unknown>>;
  const next = { ...current };
  for (const { slot } of PLANET_SLOTS) {
    if (req[slot] === undefined) continue;
    const def = OPTIONS[slot].find((o) => o.id === String(req[slot]));
    if (!def) throw new GameActionError("Option de planète inconnue.");
    if (!def.unlocked(p)) throw new GameActionError(`${def.label} est verrouillé : ${def.hint.toLowerCase()}.`);
    next[slot] = def.id;
  }
  return next;
}

/** Ce qui n'est plus débloqué (cas rare : statistiques remises à zéro) retombe sur la valeur par défaut. */
export function unlockedPlanetLook(p: LookPlayer, look: PlanetLook): PlanetLook {
  const out = { ...look };
  for (const { slot } of PLANET_SLOTS) if (!OPTIONS[slot].find((o) => o.id === look[slot])?.unlocked(p)) out[slot] = DEFAULT_PLANET_LOOK[slot];
  return out;
}

export function planetPalette(look: Pick<PlanetLook, "palette"> | undefined): PlanetPalette {
  return PLANET_PALETTES[look?.palette ?? "ocean"] ?? PLANET_PALETTES.ocean;
}

/** Couleur d'atmosphère (null = pas de halo). */
export function planetAtmosphere(look: Pick<PlanetLook, "atmosphere"> | undefined): string | null {
  switch (look?.atmosphere) {
    case "none":
      return null;
    case "aurore":
      return "var(--color-mint-glow)";
    case "doree":
      return "var(--color-gold-glow)";
    case "braise":
      return "var(--color-ember-glow)";
    default:
      return "var(--color-cyan-glow)";
  }
}
