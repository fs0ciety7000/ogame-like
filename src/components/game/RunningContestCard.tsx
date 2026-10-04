import { ContestCard } from "@/components/game/ContestCard";
import { contestPhase } from "@/game/contests";
import { useContests } from "@/services/contestService";
import { useServerPot } from "@/services/serverPotService";
import { usePlayerStore } from "@/store/playerStore";

/** v5.10.5 : concours en cours ou à venir, en résumé sur l'accueil. */
export function RunningContestCard() {
  const player = usePlayerStore((s) => s.player);
  const state = useContests();
  const pot = useServerPot();
  const now = Date.now();
  const c = state?.list.find((x) => ["running", "ending", "scheduled"].includes(contestPhase(x, now)));
  if (!player || !c) return null;
  return <ContestCard contest={c} player={player} pot={pot} now={now} compact />;
}
