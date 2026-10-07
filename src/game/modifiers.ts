import { mutatorEffects } from "@/game/mutators";
import { commanderEffects } from "@/game/commanders";
import { relicEffects } from "@/game/relics";
import { moduleEffects } from "@/game/modules";
import { territoryEffects } from "@/game/territories";
import { talentEffects } from "@/game/talents";
import { empireClassEffects } from "@/game/empireClass";
import { moonEffects } from "@/game/moon";
import { synthesisEffects } from "@/game/synthesis";
import { techEffectGrants } from "@/game/technologies";
import { effectSheet, effectTotal, rawEffectTotal, type EffectGrant, type EffectScope, type EffectSheetLine } from "@/game/effects";
import { COMBAT_RULES, fleetCargoCapacity } from "@/game/combat";
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
  /** 5.21 : cadence de l'Atelier de réparation (Mécanicien, reliques). */
  repairSpeed: number;
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
  /** 5.28.1 : réductions d'entretien de la flotte et de coût des bâtiments (couche empire). */
  fleetUpkeep: number;
  buildingDiscount: number;
  /** 6.14.44 : portée de la phalange (+ %) et recharge de la porte de saut (− %), couche empire. */
  phalanxRange: number;
  jumpGateCooldown: number;
}

type ModPlayer = Partial<Pick<PlayerState, "commanders" | "relics" | "ascensions" | "territory" | "talents" | "modules" | "empireClass" | "moon">>;
type SheetPlayer = ModPlayer & Partial<Pick<PlayerState, "techLevels" | "synthesis">>;

export function emptyModifiers(): Modifiers {
  return { attack: 0, defense: 0, buildTime: 0, researchTime: 0, productionAll: 0, production: {}, storage: 0, spyLevel: 0, detection: 0, repair: 0, repairSpeed: 0, cargo: 0, bossDamage: 0, fleetSpeed: 0, unitTime: 0, loot: 0, protectedStorage: 0, counterSpy: 0, tradeTax: 0, fleetUpkeep: 0, buildingDiscount: 0, phalanxRange: 0, jumpGateCooldown: 0 };
}

/** v5.14 : tous les effets de la couche empire (officiers, reliques, talents,
 *  territoire). Une nouvelle source se branche ici, et nulle part ailleurs. */
export function empireEffects(player: ModPlayer | null | undefined, now: number = Date.now()): EffectGrant[] {
  if (!player) return [];
  return [
    ...commanderEffects(player as Pick<PlayerState, "commanders">),
    ...relicEffects(player as Pick<PlayerState, "relics" | "ascensions">),
    ...talentEffects(player as Pick<PlayerState, "talents">),
    // 6.0 : classe d'empire.
    ...empireClassEffects(player),
    // 6.13.0 : lune (proposals/lunes.md).
    ...moonEffects(player),
    // 5.26 : modules de vaisseaux montés.
    ...moduleEffects(player as Pick<PlayerState, "modules">),
    ...territoryEffects(player.territory, now),
    // 5.16 : mutateur de saison (règle du mois, pour tout le serveur).
    ...mutatorEffects(now),
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
  m.repairSpeed = sum("repairSpeed");
  m.cargo = sum("cargo");
  m.bossDamage = sum("bossDamage");
  m.fleetSpeed = sum("fleetSpeed");
  m.unitTime = sum("unitTime");
  m.loot = sum("loot");
  m.protectedStorage = sum("protectedStorage");
  m.counterSpy = sum("counterSpy");
  m.tradeTax = sum("tradeTax");
  m.fleetUpkeep = sum("fleetUpkeep");
  m.buildingDiscount = sum("buildingDiscount");
  m.phalanxRange = sum("phalanxRange");
  m.jumpGateCooldown = sum("jumpGateCooldown");
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
  // 6.2 (lot M) : plafond réglable (COMBAT_RULES.repairCap), 95 % → 85 %.
  return Math.min(Math.max(0, Math.min(0.95, COMBAT_RULES.repairCap ?? 0.95)), base + playerModifiers(player).repair);
}

/** v5.9 : soute d'une flotte, bonus de soute compris (Soute pliée, talents…).
 *  Sert partout où la cargaison compte : butin, transports, livraisons. */
export function playerCargoCapacity(player: ModPlayer & Pick<PlayerState, "units" | "techLevels">, fleet: Record<string, number>): number {
  return Math.floor(fleetCargoCapacity(player.units, fleet, player.techLevels) * (1 + playerModifiers(player).cargo));
}
