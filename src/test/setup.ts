import { beforeEach } from "vitest";
import { EVENT_RULES } from "@/game/events";

// Les événements du week-end dépendent de l'heure réelle : coupés par
// défaut pour que les tests donnent le même résultat quel que soit le jour.
// Les tests des événements les réactivent explicitement.
beforeEach(() => {
  EVENT_RULES.rotationEnabled = false;
  EVENT_RULES.scheduled = [];
});
