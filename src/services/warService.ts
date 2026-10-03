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

/** v5.1 : `payFrom: "chest"` paie la déclaration avec le coffre de guerre. */
export function declareWar(targetAllianceId: string, payFrom: "treasury" | "chest" = "treasury") {
  return callGame<AllianceWar>("war", { action: "declare", targetAllianceId, payFrom });
}

/** v5.1 : bouclier de 2 h offert à un membre par le coffre de guerre. */
export function chestShield(memberUid: string) {
  return callGame<{ untilMs: number }>("war", { action: "chestShield", memberUid });
}

export interface SeasonWarRow {
  allianceId: string;
  tag: string;
  name: string;
  warPoints: number;
  power: number;
  powerPoints: number;
  sectors: number;
  score: number;
  rank: number;
}

/** v5.1 : classement des guerres de la saison en cours. */
export function fetchSeasonWar() {
  return pb.send<{ seasonId: string; standings: SeasonWarRow[] }>("/api/cosmic/season-war", { method: "GET" });
}

export function surrenderWar(warId: string) {
  return callGame<AllianceWar>("war", { action: "surrender", warId });
}
