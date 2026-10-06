import { useState } from "react";
import { Play } from "lucide-react";
import { CornerBrackets } from "@/components/ui/corner-brackets";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

/* 5.24 : bande-annonce sur l'écran de connexion. Affiche d'abord (rien n'est
   téléchargé), la vidéo ne se charge qu'au clic. */

export const TRAILER_SRC = "/assets/video/presentation.mp4";
export const TRAILER_POSTER = "/assets/video/presentation-poster.webp";

export function TrailerCard({ className }: { className?: string }) {
  const [playing, setPlaying] = useState(false);
  return (
    <figure className={cn("relative", className)}>
      <div className="hud-cut relative aspect-video overflow-hidden border border-cyan-glow/25 bg-space-950">
        <CornerBrackets />
        {playing ? (
          <video src={assetUrl(TRAILER_SRC)} poster={assetUrl(TRAILER_POSTER)} autoPlay controls playsInline className="h-full w-full object-cover" aria-label="Bande-annonce de Cosmic Empires" />
        ) : (
          <button type="button" onClick={() => setPlaying(true)} className="group absolute inset-0" aria-label="Lire la bande-annonce (20 secondes, avec le son)">
            <img src={assetUrl(TRAILER_POSTER)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-opacity group-hover:opacity-100" />
            <span className="hud-cut-sm absolute bottom-3 left-3 flex items-center gap-2 border border-cyan-glow/60 bg-space-950/80 px-4 py-2 font-display text-xs uppercase tracking-[0.2em] text-cyan-glow transition-colors group-hover:bg-cyan-glow group-hover:text-space-950">
              <Play className="h-4 w-4" /> Bande-annonce
            </span>
          </button>
        )}
      </div>
      <figcaption className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Cosmic Empires en 20 s · avec le son</figcaption>
    </figure>
  );
}
