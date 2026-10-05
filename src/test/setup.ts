import { beforeEach } from "vitest";
import { EVENT_RULES } from "@/game/events";
import { setAchievements } from "@/game/achievements";

// Les événements du week-end dépendent de l'heure réelle : coupés par
// défaut pour que les tests donnent le même résultat quel que soit le jour.
// Les tests des événements les réactivent explicitement.
// Les succès (et leurs récompenses en XP) sont coupés de même : les tests
// des succès les rechargent.
beforeEach(() => {
  EVENT_RULES.rotationEnabled = false;
  EVENT_RULES.scheduled = [];
  setAchievements([]);
});

// 5.16 : le mutateur de saison change avec le mois réel ; les tests le neutralisent
// (ceux du mutateur le réactivent explicitement).
import { MUTATOR_RULES } from "@/game/mutators";
MUTATOR_RULES.enabled = false;
