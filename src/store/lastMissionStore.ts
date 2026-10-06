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
  /** 6.6 (revue AU1, PNJ-7) : repères pour relancer autrement (palier d'une prime). */
  meta?: { bountyTier?: number };
}

const KEY = "cosmic-empires:last-mission";

/** Lecture tolérante : accepte aussi la forme 5.33 (`targetUid`, `fleet`, `options`). */
export function parseLastMission(raw: unknown): LastMission | null {
  if (!raw || typeof raw !== "object") return null;
  const v = raw as Record<string, unknown>;
  if (v.body && typeof v.body === "object" && typeof v.mission === "string") {
    const meta = v.meta && typeof v.meta === "object" ? (v.meta as LastMission["meta"]) : undefined;
    return { body: v.body as Record<string, unknown>, mission: v.mission as FleetMission, targetLabel: typeof v.targetLabel === "string" ? v.targetLabel : "", at: Number(v.at) || 0, ...(meta ? { meta } : {}) };
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

/** 6.6 (revue AU1, PNJ-7) : une prime remplie se relance sur la prime ouverte
 *  suivante du même palier ; sans prime ouverte, pas de relance (null). */
export function resolveRelaunch(last: LastMission | null, board: readonly { id: string; status: string; tier: number }[]): LastMission | null {
  if (!last || last.mission !== "bounty") return last;
  const id = String(last.body.bountyId ?? "");
  if (board.some((c) => c.id === id && c.status === "open")) return last;
  const tier = last.meta?.bountyTier;
  const next = board.find((c) => c.status === "open" && (tier === undefined || c.tier === tier));
  return next ? { ...last, body: { ...last.body, bountyId: next.id } } : null;
}
