import { isOnline } from "@/game/retention";
import { useDirectoryStore } from "@/store/directoryStore";
import { usePlayerStore } from "@/store/playerStore";
import { cn } from "@/lib/utils";

/* 5.16 : présence. Pastille verte qui pulse quand le joueur est en ligne
   (synchro réelle depuis moins de 5 min) ; rien sinon. Couleur du thème
   (mint-glow), écho coupé si le joueur a demandé de réduire les animations. */

export function useIsOnline(uid: string | null | undefined): boolean {
  const last = useDirectoryStore((s) => (uid ? s.lastActiveOf[uid] : undefined));
  const self = usePlayerStore((s) => s.player?.uid);
  if (!uid) return false;
  return uid === self || isOnline(last, Date.now());
}

export function OnlineDot({ uid, className, size = "sm" }: { uid: string | null | undefined; className?: string; size?: "sm" | "md" }) {
  const online = useIsOnline(uid);
  if (!online) return null;
  return <span role="img" aria-label="En ligne" title="En ligne" className={cn("online-dot", size === "md" && "online-dot-md", className)} />;
}
