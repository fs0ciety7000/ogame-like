import { createElement, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { notificationStyle } from "@/components/game/NotificationCard";
import { toast } from "sonner";
import {
  claimResourceGift,
  ensurePlayerDoc,
  GameActionError,
  processBattleReportForDefender,
  subscribeNotifications,
  subscribePendingBattleReports,
  subscribePendingGifts,
  subscribePlayer,
  subscribeQueues,
  subscribeFleets,
  fetchBattleReport,
  syncPlayer,
  type AwaySummary,
} from "@/services/playerService";
import { pb } from "@/lib/pocketbase";
import { resetPlayerStore, setPlayerData, setQueuesData } from "@/store/playerStore";
import { setBellOpen, setNotifications } from "@/store/notificationStore";
import { notificationLink, summarizeKinds, URGENT_KINDS } from "@/lib/notificationCategories";
import { useNavigate } from "react-router-dom";
import { showBrowserNotification } from "@/store/browserNotifyStore";
import { setSyncedFromServer, startConnectionListeners } from "@/store/connectionStore";
import { combatDisplayFromReport, combatDisplayFromReportForViewer, showCombatResult } from "@/store/combatModalStore";
import { setFleets } from "@/store/fleetStore";
import { showAwaySummary } from "@/store/awaySummaryStore";
import { playAlert, playAttackAlert, playBuildDone, playConfirm, playMessage, playSpyAlert, playUnlock } from "@/lib/sfx";
import type { GameNotification, NotificationKind } from "@/types/game";

const HEARTBEAT_MS = 20_000;
// En dessous de ce seuil, la resynchronisation est trop récente pour
// justifier une modale — ça couvrirait aussi les rechargements de page.
const AWAY_SUMMARY_THRESHOLD_MS = 3 * 60 * 1000;

const NOTIFICATION_STYLE: Record<NotificationKind, { icon: string; sound: () => void }> = {
  building: { icon: "🏗️", sound: playBuildDone },
  research: { icon: "🔬", sound: playBuildDone },
  unit: { icon: "🚀", sound: playConfirm },
  mission: { icon: "🧭", sound: playConfirm },
  "combat-attacker": { icon: "⚔️", sound: playConfirm },
  "combat-defender": { icon: "🛡️", sound: playAlert },
  achievement: { icon: "🏆", sound: playUnlock },
  "spy-detected": { icon: "🔍", sound: playSpyAlert },
  bounty: { icon: "🐝", sound: playUnlock },
  spy: { icon: "🛰️", sound: playConfirm },
  debris: { icon: "♻️", sound: playConfirm },
  season: { icon: "🏆", sound: playUnlock },
  alliance: { icon: "🤝", sound: playConfirm },
  event: { icon: "🎉", sound: playConfirm },
  gift: { icon: "🎁", sound: playConfirm },
  fleet: { icon: "🛸", sound: playAttackAlert },
  report: { icon: "🔧", sound: playConfirm },
  message: { icon: "✉️", sound: playMessage },
  system: { icon: "✨", sound: playConfirm },
};

/** syncPlayer suppose que les documents PocketBase du joueur existent déjà.
 *  Ils sont créés par authService juste après connexion/inscription, mais
 *  on retombe ici sur ensurePlayerDoc en filet de sécurité si besoin. */
async function safeSyncPlayer(uid: string, playtimeDeltaSeconds = 0): Promise<AwaySummary | undefined> {
  try {
    return await syncPlayer(uid, playtimeDeltaSeconds);
  } catch (err) {
    if (err instanceof GameActionError) {
      try {
        const currentUser = pb.authStore.record;
        const fallbackName = (currentUser?.name as string) || (currentUser?.username as string) || "Joueur";
        await ensurePlayerDoc(uid, fallbackName);
        return await syncPlayer(uid, playtimeDeltaSeconds);
      } catch (retryErr) {
        console.error("Impossible de synchroniser le profil joueur :", retryErr);
        return undefined;
      }
    }
    console.error("Erreur de synchronisation :", err);
    return undefined;
  }
}

/** Point d'entrée unique de la synchro temps réel : abonnements PocketBase,
 *  rattrapage de production hors-ligne, heartbeat, et traitement des rapports
 *  de combat reçus. */
export function useGameSync(uid: string | null) {
  const processingReports = useRef<Set<string>>(new Set());
  const processingGifts = useRef<Set<string>>(new Set());
  const lastHeartbeatAt = useRef<number>(Date.now());
  const seenNotificationIds = useRef<Set<string> | null>(null);
  // Navigation depuis les toasts (référence stable pour l'abonnement).
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    startConnectionListeners();

    if (!uid) {
      resetPlayerStore();
      return;
    }

    lastHeartbeatAt.current = Date.now();
    void safeSyncPlayer(uid).then((summary) => {
      if (!summary || summary.elapsedMs < AWAY_SUMMARY_THRESHOLD_MS) return;
      if (Object.keys(summary.resourceGains).length === 0 && summary.notifications.length === 0) return;
      showAwaySummary(summary);
    });

    const unsubPlayer = subscribePlayer(uid, setPlayerData, setSyncedFromServer);
    const unsubQueues = subscribeQueues(uid, setQueuesData);

    const pendingToasts: GameNotification[] = [];
    let toastTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubNotifications = subscribeNotifications(uid, (items) => {
      setNotifications(items);

      if (seenNotificationIds.current === null) {
        seenNotificationIds.current = new Set(items.map((n) => n.id));
        return;
      }
      const incoming = items.filter((item) => !seenNotificationIds.current!.has(item.id)).reverse(); // plus ancienne d'abord
      incoming.forEach((item) => seenNotificationIds.current!.add(item.id));
      // 6.14.110 (AC-6, Q76) : une trace écrite déjà lue (réclamation, cadeau envoyé…) va au Journal sans toast.
      const toToast = incoming.filter((item) => !item.read);
      if (toToast.length === 0) return;
      // Les notifications d'un même évènement arrivent souvent une par une :
      // on les regroupe sur une courte fenêtre avant de les afficher.
      pendingToasts.push(...toToast);
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(flushToasts, 600);
    });

    function flushToasts() {
      toastTimer = null;
      const fresh = pendingToasts.splice(0, pendingToasts.length);
      if (fresh.length === 0) return;

      const showOne = (item: (typeof fresh)[number]) => {
        // Toast du HUD : icône et couleur du type, comme dans la cloche.
        const style = notificationStyle(item.kind, item);
        const icon = createElement(style.icon);
        const className = `hud-tone-${style.tone}`;
        // v3.8 : « Voir » ouvre la page concernée (conversation, rapport…).
        const link = notificationLink(item);
        const action = link ? { label: "Voir", onClick: () => navigateRef.current(link) } : undefined;
        if (item.kind === "achievement") toast.success(item.title, { description: item.message, icon, duration: 6000, action, className });
        else toast(item.title, { description: item.message, icon, action, className });
      };
      // Un seul son par rafale : celui de l'alerte la plus importante.
      const loudest = fresh.find((n) => URGENT_KINDS.includes(n.kind)) ?? fresh[fresh.length - 1];
      NOTIFICATION_STYLE[loudest.kind]?.sound();

      if (fresh.length <= 3) {
        fresh.forEach((item) => {
          showOne(item);
          const link = notificationLink(item);
          showBrowserNotification(`${NOTIFICATION_STYLE[item.kind]?.icon ?? ""} ${item.title}`.trim(), item.message, item.id, link ? () => navigateRef.current(link) : undefined);
        });
        return;
      }
      // Rafale (retour après une absence…) : les alertes gardent leur toast,
      // le reste est résumé en un seul, avec un accès direct à la cloche.
      const urgent = fresh.filter((n) => URGENT_KINDS.includes(n.kind));
      const others = fresh.filter((n) => !URGENT_KINDS.includes(n.kind));
      urgent.slice(-3).forEach(showOne);
      if (others.length > 0) {
        const summary = summarizeKinds(others.map((n) => n.kind));
        toast(`${others.length} nouvelles notifications`, {
          description: summary.charAt(0).toUpperCase() + summary.slice(1) + ".",
          icon: createElement(Bell),
          duration: 8000,
          action: { label: "Voir", onClick: () => setBellOpen(true) },
        });
      }
      showBrowserNotification(`🔔 ${fresh.length} nouvelles notifications`, summarizeKinds(fresh.map((n) => n.kind)), `batch-${fresh[0].id}`);
    }

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

    const unsubGifts = subscribePendingGifts(uid, (gifts) => {
      gifts.forEach((gift) => {
        if (processingGifts.current.has(gift.id)) return;
        processingGifts.current.add(gift.id);

        claimResourceGift(uid, gift.id)
          .catch((err) => console.error("Erreur de réception du don de ressources :", err))
          .finally(() => processingGifts.current.delete(gift.id));
      });
    });

    // Flottes : à l'arrivée d'une de mes flottes, le serveur y attache le
    // rapport de combat ; on l'affiche une fois (pas au premier chargement).
    const shownReports = new Set<string>();
    let fleetsLoaded = false;
    const unsubFleets = subscribeFleets(uid, (fleets) => {
      setFleets(fleets);
      for (const f of fleets) {
        if (f.ownerUid !== uid || !f.reportId || (f.mission ?? "attack") !== "attack" || shownReports.has(f.reportId)) continue;
        shownReports.add(f.reportId);
        if (!fleetsLoaded) continue;
        void fetchBattleReport(f.reportId).then((report) => {
          if (report) showCombatResult(combatDisplayFromReportForViewer(report, uid));
        });
      }
      fleetsLoaded = true;
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
      if (toastTimer) clearTimeout(toastTimer);
      unsubBattleReports();
      unsubGifts();
      unsubFleets();
      setFleets([]);
      clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", flushOnHide);
      seenNotificationIds.current = null;
    };
  }, [uid]);
}