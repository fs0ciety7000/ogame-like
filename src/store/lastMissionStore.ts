import { create } from "zustand";
import type { FleetMission } from "@/game/fleets";

/* 5.33 (proposals/flottes-emplacements.md) : « Relancer la dernière mission ». Le dernier départ envoyé par
   sendFleet est gardé dans ce navigateur (confort personnel). Le serveur revérifie tout au relancement. */

export interface LastMission {
  targetUid: string;
  targetPseudo: string;
  fleet: Record<string, number>;
  mission: FleetMission;
  options: Record<string, unknown>;
  at: number;
}

const KEY = "cosmic-empires:last-mission";

function read(): LastMission | null {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "null") as LastMission | null;
    return v && typeof v.targetUid === "string" && v.fleet && typeof v.mission === "string" ? v : null;
  } catch {
    return null;
  }
}

export const useLastMission = create<{ last: LastMission | null }>(() => ({ last: read() }));

export function rememberLastMission(last: LastMission) {
  useLastMission.setState({ last });
  try {
    localStorage.setItem(KEY, JSON.stringify(last));
  } catch {
    /* stockage indisponible */
  }
}
