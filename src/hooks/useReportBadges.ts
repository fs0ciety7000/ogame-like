import { useEffect } from "react";
import { setAllReportsForBadge, setMyReportsForBadge, subscribeReports } from "@/services/reportService";

/** Pastilles des signalements : réponses non lues (joueur) et nouveaux
 *  signalements à trier (administrateurs). */
export function useReportBadgeSync(uid: string | null, isAdmin: boolean) {
  useEffect(() => {
    if (!uid) return;
    return subscribeReports(setMyReportsForBadge, `reporterId = "${uid}"`);
  }, [uid]);
  useEffect(() => {
    if (!uid || !isAdmin) return;
    return subscribeReports(setAllReportsForBadge, `status = "new"`);
  }, [uid, isAdmin]);
}
