import { lastActivity } from "@/game/retention";
import type { PlayerState } from "@/types/game";

/* =====================================================
   v5.10.5 : messages ciblés de l'administration. Une notification dans
   le jeu, envoyée à un groupe de joueurs (inactifs, nouveaux, une
   alliance, sans alliance, tous).
===================================================== */

export type BroadcastSegment = "all" | "active7" | "inactive7" | "inactive30" | "new7" | "alliance" | "noAlliance";

export const BROADCAST_SEGMENTS: { id: BroadcastSegment; label: string; hint: string }[] = [
  { id: "all", label: "Tous les joueurs", hint: "Tous les comptes (hors PNJ)." },
  { id: "active7", label: "Actifs cette semaine", hint: "Vus ces 7 derniers jours." },
  { id: "inactive7", label: "Inactifs depuis 7 jours", hint: "Absents depuis 7 à 30 jours : idéal pour un « reviens, il se passe des choses »." },
  { id: "inactive30", label: "Inactifs depuis 30 jours", hint: "Absents depuis plus d'un mois." },
  { id: "new7", label: "Nouveaux (7 jours)", hint: "Inscrits ces 7 derniers jours." },
  { id: "alliance", label: "Une alliance", hint: "Tous les membres de l'alliance choisie." },
  { id: "noAlliance", label: "Sans alliance", hint: "Joueurs qui n'ont pas encore rejoint d'alliance." },
];

const DAY = 24 * 3600_000;

export function broadcastTargets(players: PlayerState[], segment: BroadcastSegment, now: number, allianceId?: string): PlayerState[] {
  const idle = (p: PlayerState) => now - Math.min(now, lastActivity(p));
  switch (segment) {
    case "all":
      return players;
    case "active7":
      return players.filter((p) => idle(p) < 7 * DAY);
    case "inactive7":
      return players.filter((p) => idle(p) >= 7 * DAY && idle(p) < 30 * DAY);
    case "inactive30":
      return players.filter((p) => idle(p) >= 30 * DAY);
    case "new7":
      return players.filter((p) => !!p.createdAtMs && now - p.createdAtMs < 7 * DAY);
    case "alliance":
      return allianceId ? players.filter((p) => p.allianceId === allianceId) : [];
    case "noAlliance":
      return players.filter((p) => !p.allianceId);
    default:
      return [];
  }
}

export function validateBroadcast(b: { segment: string; title: string; message: string; link?: string; allianceId?: string }): string[] {
  const errors: string[] = [];
  if (!BROADCAST_SEGMENTS.some((s) => s.id === b.segment)) errors.push("Groupe inconnu.");
  if (b.segment === "alliance" && !b.allianceId) errors.push("Choisis l'alliance.");
  if (!b.title?.trim()) errors.push("Le titre est vide.");
  if ((b.title ?? "").length > 80) errors.push("Titre : 80 caractères au plus.");
  if (!b.message?.trim()) errors.push("Le message est vide.");
  if ((b.message ?? "").length > 500) errors.push("Message : 500 caractères au plus.");
  if (b.link && !/^\/game(\/|$)/.test(b.link)) errors.push("Le lien doit être une page du jeu (/game/…).");
  return errors;
}
