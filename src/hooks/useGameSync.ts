import { useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  acknowledgeSpyReport,
  claimResourceGift,
  ensurePlayerDoc,
  GameActionError,
  processBattleReportForDefender,
  subscribeNotifications,
  subscribePendingBattleReports,
  subscribePendingGifts,
  subscribePendingSpyReports,
  subscribePlayer,
  subscribeQueues,
  syncPlayer,
} from "@/services/playerService";
import { auth } from "@/lib/firebase";
import { resetPlayerStore, setPlayerData, setQueuesData } from "@/store/playerStore";
import { setNotifications } from "@/store/notificationStore";
import { setSyncedFromServer, startConnectionListeners } from "@/store/connectionStore";
import { combatDisplayFromReport, showCombatResult } from "@/store/combatModalStore";
import { playAlert, playConfirm, playUnlock } from "@/lib/sfx";
import type { NotificationKind } from "@/types/game";

const HEARTBEAT_MS = 20_000;

const NOTIFICATION_STYLE: Record<NotificationKind, { icon: string; sound: () => void }> = {
  building: { icon: "🏗️", sound: playConfirm },
  research: { icon: "🔬", sound: playConfirm },
  unit: { icon: "🚀", sound: playConfirm },
  mission: { icon: "🧭", sound: playConfirm },
  "combat-attacker": { icon: "⚔️", sound: playConfirm },
  "combat-defender": { icon: "🛡️", sound: playAlert },
  achievement: { icon: "🏆", sound: playUnlock },
  "spy-detected": { icon: "🔍", sound: playAlert },
  gift: { icon: "🎁", sound: playConfirm },
  system: { icon: "✨", sound: playConfirm },
};

/** syncPlayer suppose que les documents Firestore du joueur existent déjà.
 *  Ils sont créés par authService juste après connexion/inscription, mais
 *  la navigation vers /game (déclenchée dès que Firebase Auth signale un
 *  utilisateur connecté) peut survenir avant que cette création n'ait fini
 *  d'écrire — on retombe donc ici sur ensurePlayerDoc en filet de sécurité,
 *  plutôt que de laisser une promesse échouer sans être interceptée. */
async function safeSyncPlayer(uid: string, playtimeDeltaSeconds = 0) {
  try {
    await syncPlayer(uid, playtimeDeltaSeconds);
  } catch (err) {
    if (err instanceof GameActionError) {
      try {
        await ensurePlayerDoc(uid, auth.currentUser?.displayName || "Joueur");
        await syncPlayer(uid, playtimeDeltaSeconds);
        return;
      } catch (retryErr) {
        console.error("Impossible de synchroniser le profil joueur :", retryErr);
        return;
      }
    }
    console.error("Erreur de synchronisation :", err);
  }
}

/** Point d'entrée unique de la synchro temps réel : abonnements Firestore,
 *  rattrapage de production hors-ligne, heartbeat, et traitement des rapports
 *  de combat reçus (même si l'onglet était fermé au moment de l'attaque). */
export function useGameSync(uid: string | null) {
  const processingReports = useRef<Set<string>>(new Set());
  const processingSpyReports = useRef<Set<string>>(new Set());
  const processingGifts = useRef<Set<string>>(new Set());
  const lastHeartbeatAt = useRef<number>(Date.now());
  const seenNotificationIds = useRef<Set<string> | null>(null);

  useEffect(() => {
    startConnectionListeners();

    if (!uid) {
      resetPlayerStore();
      return;
    }

    lastHeartbeatAt.current = Date.now();
    void safeSyncPlayer(uid);

    const unsubPlayer = subscribePlayer(uid, setPlayerData, setSyncedFromServer);
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
          NOTIFICATION_STYLE[item.kind]?.sound();
          const isAchievement = item.kind === "achievement";
          if (isAchievement) {
            toast.success(item.title, { description: item.message, icon: NOTIFICATION_STYLE[item.kind]?.icon, duration: 6000 });
          } else {
            toast(item.title, { description: item.message, icon: NOTIFICATION_STYLE[item.kind]?.icon });
          }
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

    const unsubSpyReports = subscribePendingSpyReports(uid, (reports) => {
      reports.forEach((report) => {
        if (processingSpyReports.current.has(report.id)) return;
        processingSpyReports.current.add(report.id);

        acknowledgeSpyReport(uid, report.id)
          .catch((err) => console.error("Erreur de traitement du rapport d'espionnage :", err))
          .finally(() => processingSpyReports.current.delete(report.id));
      });
    });

    const unsubGifts = subscribePendingGifts(uid, (gifts) => {
      gifts.forEach((gift) => {
        if (processingGifts.current.has(gift.id)) return;
        processingGifts.current.add(gift.id);

        claimResourceGift(uid, gift.id)
          .catch((err) => console.error("Erreur de réception du don de ressources :", err))
          .finally(() => processingGifts.current.delete(gift.id));
      });
    });

    const heartbeat = setInterval(() => {
      const now = Date.now();
      const deltaSeconds = Math.round((now - lastHeartbeatAt.current) / 1000);
      lastHeartbeatAt.current = now;
      void safeSyncPlayer(uid, deltaSeconds);
    }, HEARTBEAT_MS);

    const flushOnHide = () => {
      if (document.visibilityState === "hidden") void safeSyncPlayer(uid);
    };
    document.addEventListener("visibilitychange", flushOnHide);

    return () => {
      unsubPlayer();
      unsubQueues();
      unsubNotifications();
      unsubBattleReports();
      unsubSpyReports();
      unsubGifts();
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", flushOnHide);
      seenNotificationIds.current = null;
    };
  }, [uid]);
}
