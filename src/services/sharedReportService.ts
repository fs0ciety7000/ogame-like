import { pb } from "@/lib/pocketbase";
import { callGame } from "@/services/playerService";
import type { BattleReport, SpyReport } from "@/types/game";

/* Rapports partagés (v3.8) : instantané d'un rapport de combat ou
   d'espionnage, lisible par tout joueur connecté qui a le lien. */

export interface SharedReport {
  id: string;
  ownerUid: string;
  ownerPseudo: string;
  kind: "battle" | "spy";
  data: BattleReport | SpyReport;
  createdAtMs: number;
}

export function sharedReportPath(id: string) {
  return `/game/rapport/${id}`;
}

/** Crée (ou retrouve) le partage et renvoie le lien complet. */
export async function shareReport(kind: "battle" | "spy", id: string): Promise<string> {
  const out = await callGame<{ id: string }>("reports/share", { kind, id });
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}${sharedReportPath(out.id)}`;
}

export async function fetchSharedReport(id: string): Promise<SharedReport> {
  return pb.collection("shared_reports").getOne<SharedReport>(id);
}
