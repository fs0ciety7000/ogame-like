import { pb, subscribeRecords } from "@/lib/pocketbase";
import { callGame } from "@/services/playerService";
import type { AllianceWar } from "@/game/wars";

/* Guerres d'alliance (v3.2) : lisibles par tous les joueurs connectés ;
   déclarer et se rendre passent par le serveur. */

export function subscribeWars(allianceId: string, cb: (wars: AllianceWar[]) => void): () => void {
  let active = true;
  const load = () =>
    pb
      .collection("alliance_wars")
      .getList<AllianceWar>(1, 30, { filter: pb.filter("attackerId = {:a} || defenderId = {:a}", { a: allianceId }), sort: "-declaredAtMs" })
      .then((r) => active && cb(r.items.map((w) => ({ ...w, log: w.log ?? [] }))))
      .catch(() => active && cb([]));
  load();
  const stop = subscribeRecords("alliance_wars", "*", () => load());
  return () => {
    active = false;
    stop();
  };
}

export function declareWar(targetAllianceId: string) {
  return callGame<AllianceWar>("war", { action: "declare", targetAllianceId });
}

export function surrenderWar(warId: string) {
  return callGame<AllianceWar>("war", { action: "surrender", warId });
}
