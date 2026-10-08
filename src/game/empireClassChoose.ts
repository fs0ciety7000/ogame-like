import { bountyState } from "@/game/bounties";
import { spendAmber } from "@/game/spending";
import { empireClassPrice, empireClassReadyAt, findEmpireClass, type EmpireClassState } from "@/game/empireClass";
import { GameActionError } from "@/game/errors";
import type { PlayerState } from "@/types/game";

/* 6.0 : choix de classe (séparé de empireClass.ts, lu par modifiers.ts : pas de cycle avec bounties.ts). */

export function chooseEmpireClass(player: PlayerState, idIn: unknown, now: number): EmpireClassState {
  const def = findEmpireClass(String(idIn ?? ""));
  if (!def) throw new GameActionError("Classe inconnue.");
  const cur = player.empireClass ?? null;
  if (cur?.id === def.id) throw new GameActionError(`Tu es déjà ${def.name}.`);
  if (cur && now < empireClassReadyAt(player)) throw new GameActionError("Tu as changé de classe trop récemment.");
  const price = empireClassPrice(player);
  if (price > 0) {
    const st = bountyState(player);
    spendAmber(player, st, price, `Il te faut ${price} Ambre pour changer de classe.`);
    player.bounties = st;
  }
  const next: EmpireClassState = { id: def.id, chosenAtMs: now, changes: cur ? (cur.changes ?? 0) + 1 : 0 };
  player.empireClass = next;
  return next;
}
