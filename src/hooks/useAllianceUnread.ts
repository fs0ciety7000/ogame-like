import { useEffect } from "react";
import { subscribeAllianceMessages } from "@/services/allianceService";
import { setAllianceUnreadCount } from "@/store/allianceUnreadStore";
import { subscribePactUnread } from "@/services/diplomacyService";
import type { PlayerState } from "@/types/game";

/** Alimente le badge de messages non lus du chat d'alliance (voir NavBar) :
 *  compte les messages plus récents que allianceLastReadMs, hors les siens. */
export function useAllianceUnread(uid: string | null, player: PlayerState | null) {
  const allianceId = player?.allianceId ?? null;
  const lastReadMs = player?.allianceLastReadMs ?? 0;
  // v4.0 : pastilles coupées dans les réglages.
  const chatOn = player?.notifPrefs?.allianceChat !== false;
  const pactOn = player?.notifPrefs?.pactMessages !== false;

  useEffect(() => {
    if (!allianceId || !uid || !chatOn) {
      setAllianceUnreadCount(0);
      return;
    }
    return subscribeAllianceMessages(allianceId, (messages) => {
      const count = messages.filter((m) => m.createdAtMs > lastReadMs && m.authorUid !== uid).length;
      setAllianceUnreadCount(count);
    });
  }, [allianceId, uid, lastReadMs, chatOn]);

  // v4.0 : messages du canal diplomatique (pastilles de l'onglet Diplomatie).
  useEffect(() => (allianceId && uid && pactOn ? subscribePactUnread(uid, allianceId) : undefined), [allianceId, uid, pactOn]);
}
