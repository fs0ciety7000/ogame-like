import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  processBattleReportForDefender,
  subscribeNotifications,
  subscribePendingBattleReports,
  subscribePlayer,
  subscribeQueues,
  syncPlayer,
} from "@/services/playerService";
import { resetPlayerStore, setPlayerData, setQueuesData } from "@/store/playerStore";
import { setNotifications } from "@/store/notificationStore";
import { combatDisplayFromReport, showCombatResult } from "@/store/combatModalStore";
import type { NotificationKind } from "@/types/game";

const HEARTBEAT_MS = 20_000;

const NOTIFICATION_STYLE: Record<NotificationKind, { icon: string }> = {
  building: { icon: "🏗️" },
  research: { icon: "🔬" },
  unit: { icon: "🚀" },
  mission: { icon: "🧭" },
  "combat-attacker": { icon: "⚔️" },
  "combat-defender": { icon: "🛡️" },
  system: { icon: "✨" },
};

/** Point d'entrée unique de la synchro temps réel : abonnements Firestore,
 *  rattrapage de production hors-ligne, heartbeat, et traitement des rapports
 *  de combat reçus (même si l'onglet était fermé au moment de l'attaque). */
export function useGameSync(uid: string | null) {
  const processingReports = useRef<Set<string>>(new Set());
  const lastHeartbeatAt = useRef<number>(Date.now());
  const seenNotificationIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!uid) {
      resetPlayerStore();
      return;
    }

    lastHeartbeatAt.current = Date.now();
    void syncPlayer(uid);

    const unsubPlayer = subscribePlayer(uid, setPlayerData);
    const unsubQueues = subscribeQueues(uid, setQueuesData);

    const unsubNotifications = subscribeNotifications(uid, (items) => {
      setNotifications(items);

      if (seenNotificationIds.current === null) {
        seenNotificationIds.current = new Set(items.map((n) => n.id));
        return;
      }
      for (const item of items) {
        if (!seenNotificationIds.current.has(item.id)) {
          seenNotificationIds.current.add(item.id);
          toast(item.title, { description: item.message, icon: NOTIFICATION_STYLE[item.kind]?.icon });
        }
      }
    });

    const unsubBattleReports = subscribePendingBattleReports(uid, (reports) => {
      reports.forEach((report) => {
        if (processingReports.current.has(report.id)) return;
        processingReports.current.add(report.id);

        processBattleReportForDefender(uid, report.id)
          .then((processed) => {
            if (!processed) return;
            const display = combatDisplayFromReport(processed);
            showCombatResult(display);
          })
          .catch((err) => console.error("Erreur de traitement du rapport de combat :", err))
          .finally(() => processingReports.current.delete(report.id));
      });
    });

    const heartbeat = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.round((now - lastHeartbeatAt.current) / 1000);
      lastHeartbeatAt.current = now;
      void syncPlayer(uid, deltaSeconds);
    }, HEARTBEAT_MS);

    const flushOnHide = () => {
      if (document.visibilityState === "hidden") void syncPlayer(uid);
    };
    document.addEventListener("visibilitychange", flushOnHide);

    return () => {
      unsubPlayer();
      unsubQueues();
      unsubNotifications();
      unsubBattleReports();
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", flushOnHide);
      seenNotificationIds.current = null;
    };
  }, [uid]);
}
