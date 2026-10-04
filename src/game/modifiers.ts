import { commanderEffects } from "@/game/commanders";
import { relicEffects } from "@/game/relics";
import { territoryEffects } from "@/game/territories";
import { talentEffects } from "@/game/talents";
import { synthesisEffects } from "@/game/synthesis";
import { techEffectGrants } from "@/game/technologies";
import { effectSheet, effectTotal, rawEffectTotal, type EffectGrant, type EffectScope, type EffectSheetLine } from "@/game/effects";
import { fleetCargoCapacity } from "@/game/combat";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Bonus du joueur (v4.0) : officiers en poste et reliques équipées, en
   un seul calcul pour le serveur et l'affichage. Toutes les valeurs sont
   des fractions (0,05 = 5 %).

   v5.14 : lu dans le circuit d'effets (effects.ts). Chaque système déclare
   ses effets ; on ne fait ici que les rassembler.
===================================================== */

export interface Modifiers {
  attack: number;
  defense: number;
  /** Réduction de durée (0,1 = −10 %). */
  buildTime: number;
  researchTime: number;
  productionAll: number;
  production: Partial<Record<ResourceId, number>>;
  storage: number;
  /** Niveaux d'espionnage en plus. */
  spyLevel: number;
  detection: number;
  repair: number;
  cargo: number;
  /** v5.1 : dégâts contre les boss (relique mythique). */
  bossDamage: number;
  /** v5.14 : rôles rares (Logisticienne, Mécanicien, Corsaire, Gardienne, Diplomate). */
  fleetSpeed: number;
  unitTime: number;
  loot: number;
  protectedStorage: number;
  counterSpy: number;
  tradeTax: number;
}

type ModPlayer = Partial<Pick<PlayerState, "commanders" | "relics" | "ascensions" | "territory" | "talents">>;
type SheetPlayer = ModPlayer & Partial<Pick<PlayerState, "techLevels" | "synthesis">>;

export function emptyModifiers(): Modifiers {
  return { attack: 0, defense: 0, buildTime: 0, researchTime: 0, productionAll: 0, production: {}, storage: 0, spyLevel: 0, detection: 0, repair: 0, cargo: 0, bossDamage: 0, fleetSpeed: 0, unitTime: 0, loot: 0, protectedStorage: 0, counterSpy: 0, tradeTax: 0 };
}

/** v5.14 : tous les effets de la couche empire (officiers, reliques, talents,
 *  territoire). Une nouvelle source se branche ici, et nulle part ailleurs. */
export function empireEffects(player: ModPlayer | null | undefined, now: number = Date.now()): EffectGrant[] {
  if (!player) return [];
  return [
    ...commanderEffects(player as Pick<PlayerState, "commanders">),
    ...relicEffects(player as Pick<PlayerState, "relics" | "ascensions">),
    ...talentEffects(player as Pick<PlayerState, "talents">),
    ...territoryEffects(player.territory, now),
  ];
}

/** v5.14 : tous les effets du joueur, technologies et capsules comprises. */
export function allEffects(player: SheetPlayer | null | undefined, now: number = Date.now()): EffectGrant[] {
  if (!player) return [];
  return [...techEffectGrants(player.techLevels), ...empireEffects(player, now), ...synthesisEffects(player as Pick<PlayerState, "synthesis">, now)];
}

/** v5.14 : fiche d'effets (chaque grandeur, son total et ses sources). */
export function playerEffectSheet(player: SheetPlayer | null | undefined, now: number = Date.now()): EffectSheetLine[] {
  return effectSheet(allEffects(player, now));
}

/** Bonus de la couche empire, au format historique. `scope` : « colonies »
 *  ajoute les effets propres aux colonies, « home » ceux de la planète mère. */
export function modifiersFrom(grants: readonly EffectGrant[], scope?: EffectScope): Modifiers {
  const m = emptyModifiers();
  const sum = (stat: Parameters<typeof effectTotal>[2]) => effectTotal(grants, "empire", stat, { scope });
  m.attack = sum("attack");
  m.defense = sum("defense");
  m.buildTime = sum("buildTime");
  m.researchTime = sum("researchTime");
  m.productionAll = sum("productionAll");
  m.storage = sum("storage");
  m.spyLevel = sum("spyLevel");
  m.detection = sum("detection");
  m.repair = sum("repair");
  m.cargo = sum("cargo");
  m.bossDamage = sum("bossDamage");
  m.fleetSpeed = sum("fleetSpeed");
  m.unitTime = sum("unitTime");
  m.loot = sum("loot");
  m.protectedStorage = sum("protectedStorage");
  m.counterSpy = sum("counterSpy");
  m.tradeTax = sum("tradeTax");
  for (const g of grants) {
    if (g.layer !== "empire" || g.stat !== "production" || !g.target || m.production[g.target as ResourceId] !== undefined) continue;
    m.production[g.target as ResourceId] = rawEffectTotal(grants, "empire", "production", { target: g.target, scope });
  }
  return m;
}

export function playerModifiers(player: ModPlayer | null | undefined, now: number = Date.now(), scope?: EffectScope): Modifiers {
  return modifiersFrom(empireEffects(player, now), scope);
}

/** Multiplicateur de production d'une ressource. */
export function productionFactor(player: ModPlayer | null | undefined, res: ResourceId): number {
  const m = playerModifiers(player);
  return 1 + m.productionAll + (m.production[res] ?? 0);
}

/** Part des vaisseaux réparés, bonus compris (plafond 95 %). */
export function withRepairBonus(base: number, player: ModPlayer | null | undefined): number {
  return Math.min(0.95, base + playerModifiers(player).repair);
}

/** v5.9 : soute d'une flotte, bonus de soute compris (Soute pliée, talents…).
 *  Sert partout où la cargaison compte : butin, transports, livraisons. */
export function playerCargoCapacity(player: ModPlayer & Pick<PlayerState, "units" | "techLevels">, fleet: Record<string, number>): number {
  return Math.floor(fleetCargoCapacity(player.units, fleet, player.techLevels) * (1 + playerModifiers(player).cargo));
}
