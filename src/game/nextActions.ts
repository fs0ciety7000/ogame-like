import { formatInt } from "@/game/format";
import { atelierLevel, hullPercent, workshopRushCost, workshopUnits } from "@/game/workshop";
import { BUILDINGS, effectiveBuildingLevel } from "@/game/buildings";
import { economySnapshot } from "@/game/economy";
import { RESEARCH_RULES } from "@/game/technologies";
import { OFFENSIVE_UNITS } from "@/game/units";
import { RESOURCE_LIST } from "@/game/resources";
import { BOUNTY_RULES, bountyState, viewBounties } from "@/game/bounties";
import type { Fleet } from "@/game/fleets";
import { navPageOpen, navPath } from "@/game/navUnlock";
import type { PlayerState, QueuesState } from "@/types/game";

/* =====================================================
   « Que faire maintenant ? » (v3.8) : ce qui attend le joueur, du plus
   urgent au moins urgent. Fonction pure, testée ; l'accueil affiche les
   premières cartes.
===================================================== */

export type NextActionKind = "outage" | "contracts" | "storage" | "build" | "research" | "mission" | "units" | "fleet" | "bounty" | "repair";

export interface NextAction {
  kind: NextActionKind;
  title: string;
  text: string;
  to: string;
  /** 0 = le plus urgent. */
  priority: number;
}

export function nextActions(player: PlayerState, queues: QueuesState | null, fleets: Fleet[], now: number): NextAction[] {
  const out: NextAction[] = [];
  const economy = economySnapshot(player, now);

  if (economy.outage) {
    out.push({ kind: "outage", priority: 0, title: "Panne d'énergie", text: "Ta flotte consomme plus d'énergie que tu n'en produis : la production tourne au ralenti.", to: "/game/ressources" });
  }

  const claimable = (player.contracts?.items ?? []).filter((c) => !c.claimed && c.progress >= c.target).length;
  if (claimable > 0) {
    out.push({ kind: "contracts", priority: 1, title: `${claimable} contrat${claimable > 1 ? "s" : ""} à récupérer`, text: "Récompense prête : récupère-la avant minuit.", to: "#contrats" });
  }

  if (economy.full.length > 0) {
    const names = economy.full.map((id) => RESOURCE_LIST.find((r) => r.id === id)?.name ?? id).join(", ");
    out.push({ kind: "storage", priority: 2, title: "Entrepôt plein", text: `${names} : la production est perdue. Dépense ou agrandis l'entrepôt.`, to: "/game/batiments" });
  }

  if (queues) {
    const building = Object.keys(queues.buildingUpgrades ?? {}).length > 0;
    const upgradable = BUILDINGS.some((b) => {
      const level = effectiveBuildingLevel(player.buildings, b.id);
      return level > 0 && level < b.maxLevel;
    });
    if (!building && upgradable) out.push({ kind: "build", priority: 3, title: "Aucun chantier en cours", text: "Tes ouvriers attendent : lance une amélioration.", to: "/game/batiments" });

    const researching = queues.activeResearches?.length ?? 0;
    if (researching < RESEARCH_RULES.maxConcurrent) {
      out.push({
        kind: "research",
        priority: researching === 0 ? 3 : 5,
        title: researching === 0 ? "Laboratoire à l'arrêt" : "File de recherche libre",
        text: `${researching} / ${RESEARCH_RULES.maxConcurrent} recherches en cours.`,
        to: "/game/labo",
      });
    }

    if ((queues.activeMissions?.length ?? 0) === 0) out.push({ kind: "mission", priority: 4, title: "Aucune mission en cours", text: "Envoie des unités en exploration : ressources et XP.", to: "/game/missions" });

    const producing = (queues.unitQueues?.attack?.length ?? 0) + (queues.unitQueues?.defense?.length ?? 0);
    if (producing === 0) out.push({ kind: "units", priority: 6, title: "Chantier naval inactif", text: "Aucune unité en production.", to: "/game/unites" });
  }

  const ships = OFFENSIVE_UNITS.reduce((a, id) => a + (player.units[id]?.count ?? 0), 0);
  const flying = fleets.some((f) => f.ownerUid === player.uid && (f.status === "outbound" || f.status === "returning" || f.status === "stationed"));
  // v3.9 : primes Kesh'Vaar encore possibles aujourd'hui.
  const bounties = viewBounties(player, now);
  const left = BOUNTY_RULES.dailyLimit - bounties.doneToday;
  if (ships > 0 && left > 0 && bounties.board.some((c) => c.status === "open")) {
    out.push({ kind: "bounty", priority: 6, title: "Primes de l'Essaim", text: `${left} prime${left > 1 ? "s" : ""} possible${left > 1 ? "s" : ""} aujourd'hui : XP et Ambre de Ruche.`, to: "/game/primes" });
  }
  if (ships > 0 && !flying) out.push({ kind: "fleet", priority: 7, title: "Flotte à quai", text: `${formatInt(ships)} vaisseaux attendent des ordres.`, to: "/game/galaxie" });

  // 5.21 : flotte abîmée (dégâts conservés entre les combats).
  const shipIds = OFFENSIVE_UNITS.filter((id) => (player.units?.[id]?.count ?? 0) > 0);
  const hullWeight = shipIds.reduce((s, id) => s + (player.units[id]?.count ?? 0), 0);
  const avgHull = hullWeight > 0 ? shipIds.reduce((s, id) => s + (player.units[id]?.count ?? 0) * hullPercent(player, id), 0) / hullWeight : 1;
  if (avgHull < 0.8) {
    const hasAtelier = atelierLevel(player) > 0;
    out.push({
      kind: "repair",
      priority: 5,
      title: `Flotte abîmée (${Math.round(avgHull * 100)} %)`,
      text: hasAtelier ? "Elle se bat moins bien : laisse l'Atelier finir avant une grosse opération." : "Sans Atelier, les coques se réparent lentement : débloque-le au Labo.",
      to: hasAtelier ? "/game/batiments?onglet=atelier" : "/game/labo",
    });
  }

  // 5.21 : unités immobilisées à l'Atelier qu'on peut faire sortir tout de suite contre de l'Ambre.
  const stuck = Object.values(workshopUnits(player)).reduce((a, n) => a + n, 0);
  if (stuck > 0) {
    const rush = workshopRushCost(player);
    if (rush.seconds >= 900 && bountyState(player).amber >= rush.amber) {
      out.push({ kind: "repair", priority: 6, title: `${formatInt(stuck)} unité${stuck > 1 ? "s" : ""} à l'Atelier`, text: `Elles rentrent seules, ou tout de suite pour ${formatInt(rush.amber)} Ambre.`, to: "/game/batiments?onglet=atelier" });
    }
  }

  // 6.14.81 (DP-L6, I30) : « Que faire maintenant ? » ne propose pas une page que le menu progressif n'a pas encore ouverte.
  const hostileIncoming = fleets.some((f) => f.targetUid === player.uid && f.ownerUid !== player.uid && f.status === "outbound" && ((f.mission ?? "attack") === "attack" || f.mission === "pirate"));
  return out.filter((a) => !a.to.startsWith("/game/") || navPageOpen(player, navPath(a.to), { now, hostileIncoming })).sort((a, b) => a.priority - b.priority);
}
