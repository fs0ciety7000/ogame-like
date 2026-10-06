import { create } from "zustand";
import type { FleetMission } from "@/game/fleets";

/* 5.33 (proposals/flottes-emplacements.md) : « Relancer la dernière mission ». Le dernier départ envoyé à
   fleet/send est gardé dans ce navigateur (confort personnel). Le serveur revérifie tout au relancement.
   6.3 (lot O) : toutes les missions passent par là (primes, boss, transports, livraisons), d'où la requête
   gardée telle quelle dans `body`. */

export interface LastMission {
  /** Corps envoyé à fleet/send, sans le départ différé. */
  body: Record<string, unknown>;
  mission: FleetMission;
  /** Cible lisible (pseudo, colonie, boss…), vide si inconnue. */
  targetLabel: string;
  at: number;
}

const KEY = "cosmic-empires:last-mission";

/** Lecture tolérante : accepte aussi la forme 5.33 (`targetUid`, `fleet`, `options`). */
export function parseLastMission(raw: unknown): LastMission | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  if (v.body && typeof v.body === "object" && typeof v.mission === "string") {
    return { body: v.body as Record<string, unknown>, mission: v.mission as FleetMission, targetLabel: typeof v.targetLabel === "string" ? v.targetLabel : "", at: Number(v.at) || 0 };
  }
  if (typeof v.targetUid === "string" && v.fleet && typeof v.mission === "string") {
    const options = v.options && typeof v.options === "object" ? (v.options as Record<string, unknown>) : {};
    return { body: { targetUid: v.targetUid, fleet: v.fleet, mission: v.mission, ...options }, mission: v.mission as FleetMission, targetLabel: typeof v.targetPseudo === "string" ? v.targetPseudo : "", at: Number(v.at) || 0 };
  }
  return null;
}

function read(): LastMission | null {
  try {
    return parseLastMission(JSON.parse(localStorage.getItem(KEY) ?? "null"));
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
