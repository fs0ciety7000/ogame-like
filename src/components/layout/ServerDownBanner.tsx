import { useEffect } from "react";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { pb } from "@/lib/pocketbase";
import { useServerHealth } from "@/store/serverHealthStore";

/* 6.14.164 (S4, NJ-11) : bandeau discret quand le serveur ne répond plus (redéploiement : 502, 503 sans message du jeu,
   504, ou requête sans réponse). Il essaie de joindre le serveur toutes les 5 s et disparaît à la première réponse ; les
   actions qui échouent entre-temps le disent dans leur message (« Serveur en cours de mise à jour… »). Attention (ember),
   pas danger : rien n'est perdu, le serveur fait autorité et reprend où il en était. */

const RETRY_MS = 5_000;

export function ServerDownBanner() {
  const downSince = useServerHealth((s) => s.downSince);
  useEffect(() => {
    if (downSince === null) return;
    const started = downSince;
    const timer = setInterval(() => {
      // Une réponse normale passe `downSince` à null (crochet `afterSend` de `pb`).
      void pb.health.check().catch(() => undefined);
    }, RETRY_MS);
    return () => {
      clearInterval(timer);
      if (useServerHealth.getState().downSince === null && Date.now() - started > 3_000) toast.success("Serveur de retour : tu peux reprendre.");
    };
  }, [downSince]);
  if (downSince === null) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      className="hud-cut-sm fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] left-1/2 z-[60] flex w-max max-w-[calc(100vw-2rem)] md:bottom-4 -translate-x-1/2 items-center gap-2 border border-ember-glow/50 bg-space-950/95 px-3 py-1.5 text-xs text-slate-200 backdrop-blur"
    >
      <RefreshCw aria-hidden className="h-3.5 w-3.5 shrink-0 animate-spin text-ember-glow [animation-duration:2s]" />
      <span>Serveur en cours de mise à jour, nouvelle tentative…</span>
    </div>
  );
}
