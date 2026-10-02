import { useEffect } from "react";
import { create } from "zustand";
import { subscribeAlliances } from "@/services/allianceService";
import { subscribeLeaderboard } from "@/services/playerService";

/* Annuaire (v3.5.1) : alliance de chaque joueur et tag de chaque alliance,
   pour afficher « [TAG] Pseudo » partout dans le jeu. Alimenté par les fiches
   publiques et la liste des alliances, une seule fois pour toute l'appli. */

interface Directory {
  allianceOf: Record<string, string>;
  tagOf: Record<string, string>;
  /** v4.6 : dernière activité réelle de chaque joueur (« en ligne »). */
  lastActiveOf: Record<string, number>;
}

export const useDirectoryStore = create<Directory>(() => ({ allianceOf: {}, tagOf: {}, lastActiveOf: {} }));

let users = 0;
let stop: (() => void) | null = null;

/** À monter une fois (coque du jeu) : tient l'annuaire à jour. */
export function useDirectorySync(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    if (users++ === 0) {
      const a = subscribeLeaderboard((players) =>
        useDirectoryStore.setState({
          allianceOf: Object.fromEntries(players.filter((p) => p.allianceId).map((p) => [p.uid, p.allianceId!])),
          lastActiveOf: Object.fromEntries(players.filter((p) => p.lastActiveMs).map((p) => [p.uid, p.lastActiveMs!])),
        }),
      );
      const b = subscribeAlliances((alliances) => useDirectoryStore.setState({ tagOf: Object.fromEntries(alliances.map((al) => [al.id, al.tag])) }));
      stop = () => {
        a();
        b();
      };
    }
    return () => {
      if (--users === 0) {
        stop?.();
        stop = null;
      }
    };
  }, [enabled]);
}

/** Tag d'alliance d'un joueur (ou d'une de ses colonies), sinon "". */
export function useAllianceTag(uid: string | null | undefined, allianceId?: string | null): string {
  return useDirectoryStore((s) => {
    const owner = uid ? uid.replace(/-c\d+$/, "") : "";
    const id = allianceId ?? (owner ? s.allianceOf[owner] : undefined);
    return id ? (s.tagOf[id] ?? "") : "";
  });
}
