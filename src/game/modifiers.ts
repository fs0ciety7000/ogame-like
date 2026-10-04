import { activeLevels } from "@/game/commanders";
import { equippedRelics, findTemplate, PRODUCTION_EFFECT, relicBonus } from "@/game/relics";
import { territoryBonus } from "@/game/territories";
import { talentBonuses } from "@/game/talents";
import { fleetCargoCapacity } from "@/game/combat";
import type { PlayerState, ResourceId } from "@/types/game";

/* =====================================================
   Bonus du joueur (v4.0) : officiers en poste et reliques équipées, en
   un seul calcul pour le serveur et l'affichage. Toutes les valeurs sont
   des fractions (0,05 = 5 %).
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
}

type ModPlayer = Partial<Pick<PlayerState, "commanders" | "relics" | "ascensions" | "territory" | "talents">>;

export function emptyModifiers(): Modifiers {
  return { attack: 0, defense: 0, buildTime: 0, researchTime: 0, productionAll: 0, production: {}, storage: 0, spyLevel: 0, detection: 0, repair: 0, cargo: 0, bossDamage: 0 };
}

export function playerModifiers(player: ModPlayer | null | undefined): Modifiers {
  const m = emptyModifiers();
  if (!player) return m;
  const lv = activeLevels(player as Pick<PlayerState, "commanders">);
  m.attack += lv.admiral * 0.01;
  m.defense += lv.strategist * 0.01;
  m.buildTime += lv.engineer * 0.01;
  m.researchTime += lv.engineer * 0.01;
  m.spyLevel += lv.spy * 0.2;
  m.detection += lv.spy * 0.01;
  m.productionAll += lv.steward * 0.01;
  // v5.1 : territoires d'alliance (valable jusqu'au prochain recalcul du serveur).
  m.productionAll += territoryBonus(player.territory, Date.now());
  m.storage += lv.steward * 0.02;
  for (const item of equippedRelics(player as Pick<PlayerState, "relics" | "ascensions">)) {
    const effect = findTemplate(item.template)?.effect;
    const b = relicBonus(item);
    if (effect === "attack") m.attack += b;
    else if (effect === "defense") m.defense += b;
    else if (effect === "build_time") m.buildTime += b;
    else if (effect === "research_time") m.researchTime += b;
    else if (effect === "repair") m.repair += b;
    else if (effect === "cargo") m.cargo += b;
    else if (effect === "spy") m.spyLevel += b * 10;
    else if (effect === "production_all") m.productionAll += b;
    else if (effect === "boss_damage") m.bossDamage += b;
    else if (effect && PRODUCTION_EFFECT[effect]) {
      const res = PRODUCTION_EFFECT[effect]!;
      m.production[res] = (m.production[res] ?? 0) + b;
    }
  }
  // v5.1 : talents d'Ascension.
  for (const { def, value } of talentBonuses(player as Pick<PlayerState, "talents">)) {
    const e = def.effect;
    if (e.kind === "production") m.production[e.res] = (m.production[e.res] ?? 0) + value;
    else m[e.kind] += value;
  }
  // Durées : jamais en dessous de 50 % de la normale par ce biais.
  m.buildTime = Math.min(0.5, m.buildTime);
  m.researchTime = Math.min(0.5, m.researchTime);
  return m;
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
