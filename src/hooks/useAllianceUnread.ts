import { useEffect } from "react";
import { subscribeAllianceMessages } from "@/services/allianceService";
import { setAllianceUnreadCount } from "@/store/allianceUnreadStore";
import type { PlayerState } from "@/types/game";

/** Alimente le badge de messages non lus du chat d'alliance (voir NavBar) :
 *  compte les messages plus récents que allianceLastReadMs, hors les siens. */
export function useAllianceUnread(uid: string | null, player: PlayerState | null) {
  const allianceId = player?.allianceId ?? null;
  const lastReadMs = player?.allianceLastReadMs ?? 0;

  useEffect(() => {
    if (!allianceId || !uid) {
      setAllianceUnreadCount(0);
      return;
    }
    return subscribeAllianceMessages(allianceId, (messages) => {
      const count = messages.filter((m) => m.createdAtMs > lastReadMs && m.authorUid !== uid).length;
      setAllianceUnreadCount(count);
    });
  }, [allianceId, uid, lastReadMs]);
}
