import { BUILDINGS, effectiveBuildingLevel } from "@/game/buildings";
import { economySnapshot } from "@/game/economy";
import { MAX_CONCURRENT_RESEARCH } from "@/game/technologies";
import { OFFENSIVE_UNITS } from "@/game/units";
import { RESOURCE_LIST } from "@/game/resources";
import type { Fleet } from "@/game/fleets";
import type { PlayerState, QueuesState } from "@/types/game";

/* =====================================================
   « Que faire maintenant ? » (v3.8) : ce qui attend le joueur, du plus
   urgent au moins urgent. Fonction pure, testée ; l'accueil affiche les
   premières cartes.
===================================================== */

export type NextActionKind = "outage" | "contracts" | "storage" | "build" | "research" | "mission" | "units" | "fleet";

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
    if (researching < MAX_CONCURRENT_RESEARCH) {
      out.push({
        kind: "research",
        priority: researching === 0 ? 3 : 5,
        title: researching === 0 ? "Laboratoire à l'arrêt" : "File de recherche libre",
        text: `${researching} / ${MAX_CONCURRENT_RESEARCH} recherches en cours.`,
        to: "/game/labo",
      });
    }

    if ((queues.activeMissions?.length ?? 0) === 0) out.push({ kind: "mission", priority: 4, title: "Aucune mission en cours", text: "Envoie des unités en exploration : ressources et XP.", to: "/game/missions" });

    const producing = (queues.unitQueues?.attack?.length ?? 0) + (queues.unitQueues?.defense?.length ?? 0);
    if (producing === 0) out.push({ kind: "units", priority: 6, title: "Chantier naval inactif", text: "Aucune unité en production.", to: "/game/unites" });
  }

  const ships = OFFENSIVE_UNITS.reduce((a, id) => a + (player.units[id]?.count ?? 0), 0);
  const flying = fleets.some((f) => f.ownerUid === player.uid && (f.status === "outbound" || f.status === "returning" || f.status === "stationed"));
  if (ships > 0 && !flying) out.push({ kind: "fleet", priority: 7, title: "Flotte à quai", text: `${ships.toLocaleString("fr-FR")} vaisseaux attendent des ordres.`, to: "/game/galaxie" });

  return out.sort((a, b) => a.priority - b.priority);
}
