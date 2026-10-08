import { TECHNOLOGIES } from "@/game/technologies";
import { ELITE_UNIT_IDS, findUnit, isEliteUnit } from "@/game/units";
import { GameActionError } from "@/game/errors";
import type { PlayerState } from "@/types/game";

/* =====================================================
   5.22 : unités d'élite (Chasse-Fantôme, Brise-Rempart, Lame Écarlate).

   Déblocage (définitif) : toutes les technologies du Labo au niveau
   maximal ET au moins une vendetta gagnée contre un seigneur de la
   personnalité visée. Si de nouvelles technologies arrivent ensuite au
   Labo, l'unité reste débloquée mais ne peut plus être construite tant
   qu'elles ne sont pas, elles aussi, au maximum.

   Elles ne combattent que les seigneurs de guerre : le lancement les
   refuse contre un joueur (et pour toute autre mission), et elles restent
   hors du combat quand un joueur attaque leur propriétaire.
===================================================== */

export type ElitePersonality = "opportunist" | "builder" | "aggressive";

/** Titres de vendetta par personnalité (renseigné par warlords.ts, qui importe ce module : pas de cycle). */
let titlesResolver: (p: ElitePersonality) => string[] = () => [];
export function setVendettaTitlesResolver(fn: (p: ElitePersonality) => string[]): void {
  titlesResolver = fn;
}

/** Technologies pas encore au niveau maximal. */
function missingTechs(player: Pick<PlayerState, "techLevels">): { id: string; nom: string; level: number; max: number }[] {
  return TECHNOLOGIES.filter((t) => (player.techLevels?.[t.id] ?? 0) < t.maxLevel).map((t) => ({ id: t.id, nom: t.nom, level: player.techLevels?.[t.id] ?? 0, max: t.maxLevel }));
}

function labComplete(player: Pick<PlayerState, "techLevels">): boolean {
  return missingTechs(player).length === 0;
}

/** Vendettas gagnées contre une personnalité (compteur 5.22, ou titres « Tombeur de … » plus anciens). */
function vendettasWonAgainst(player: Pick<PlayerState, "stats" | "titles">, personality: ElitePersonality, titlesOf: (p: ElitePersonality) => string[] = titlesResolver): number {
  const counted = player.stats?.vendettaWins?.[personality] ?? 0;
  if (counted > 0) return counted;
  const labels = titlesOf(personality);
  return (player.titles ?? []).filter((t) => t.seasonId === "vendetta" && labels.includes(t.label)).length;
}

export function recordVendettaWin(player: PlayerState, personality: string): void {
  const s = { ...(player.stats ?? {}) };
  s.vendettaWins = { ...(s.vendettaWins ?? {}), [personality]: (s.vendettaWins?.[personality] ?? 0) + 1 };
  player.stats = s;
}

export interface EliteStatus {
  unitId: string;
  personality: ElitePersonality;
  /** Débloquée (définitif). */
  unlocked: boolean;
  lab: boolean;
  vendetta: boolean;
  /** Constructible maintenant. */
  buildable: boolean;
  missing: ReturnType<typeof missingTechs>;
}

export function eliteStatus(player: Pick<PlayerState, "units" | "techLevels" | "stats" | "titles">, unitId: string, titlesOf?: (p: ElitePersonality) => string[]): EliteStatus | null {
  const u = findUnit(unitId);
  if (!u?.elite) return null;
  const missing = missingTechs(player);
  const lab = missing.length === 0;
  const vendetta = vendettasWonAgainst(player, u.elite, titlesOf) > 0;
  const unlocked = (player.units?.[unitId]?.level ?? 0) > 0;
  return { unitId, personality: u.elite, unlocked, lab, vendetta, buildable: unlocked && lab, missing };
}

/** Débloque les unités d'élite dont les conditions sont réunies ; renvoie les nouvelles. */
export function refreshEliteUnlocks(player: PlayerState, titlesOf?: (p: ElitePersonality) => string[]): string[] {
  const out: string[] = [];
  if (!labComplete(player)) return out;
  for (const id of ELITE_UNIT_IDS) {
    if ((player.units?.[id]?.level ?? 0) > 0) continue;
    const st = eliteStatus(player, id, titlesOf);
    if (st?.vendetta) {
      player.units[id] = { level: 1, count: player.units[id]?.count ?? 0 };
      out.push(id);
    }
  }
  return out;
}

/** Chantier : refuse une unité d'élite si le Labo n'est plus complet. */
export function assertEliteBuildable(player: Pick<PlayerState, "units" | "techLevels" | "stats" | "titles">, unitId: string): void {
  const st = eliteStatus(player, unitId);
  if (!st) return;
  if (!st.unlocked) throw new GameActionError("Unité d'élite verrouillée : termine toutes les technologies du Labo et gagne une vendetta contre un seigneur de cette personnalité.");
  if (!st.lab) throw new GameActionError(`Nouvelles technologies au Labo : termine-les pour reprendre la construction (${st.missing.map((m) => m.nom).join(", ")}).`);
}

/** Unités d'élite d'une flotte. */
export function eliteIn(fleet: Record<string, unknown>): string[] {
  return Object.entries(fleet ?? {})
    .filter(([id, n]) => isEliteUnit(id) && Number(n) > 0)
    .map(([id]) => id);
}

/** Lancement : unités d'élite seulement contre un seigneur de guerre. */
export function assertEliteMission(fleet: Record<string, unknown>, againstWarlord: boolean): void {
  if (!againstWarlord && eliteIn(fleet).length > 0) throw new GameActionError("Les unités d'élite ne combattent que les seigneurs de guerre : retire-les de cette flotte.");
}

/** Unités à quai sans les unités d'élite (combat contre un joueur). */
export function withoutElite<T>(units: Record<string, T>): Record<string, T> {
  return Object.fromEntries(Object.entries(units ?? {}).filter(([id]) => !isEliteUnit(id)));
}
