import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { DecodeText } from "@/components/ui/decode-text";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

/** Code d'étiquette stable pour une page (ex. « CE-0417 · BÂTIMENTS »). */
function signalCode(title: string): string {
  let h = 0;
  for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) >>> 0;
  return `CE-${String(h % 10000).padStart(4, "0")} · ${title.toUpperCase().slice(0, 18)}`;
}

/** En-tête de page commun : fil d'Ariane mono + gros titre display, avec un
 *  slot optionnel à droite (statut, compteur clé...) — remplace le simple
 *  <h1> répété sur chaque page pour un rendu "poste de contrôle" homogène. */
export function PageHeader({
  eyebrow,
  title,
  description,
  right,
  backdrop,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  right?: ReactNode;
  /** Illustration discrète derrière l'en-tête (fondue vers la gauche et le bas pour garder le texte lisible). */
  backdrop?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn("page-header relative flex flex-wrap items-end justify-between gap-3 pb-4", backdrop && "page-header-backdrop pt-10 sm:pt-16", "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-cyan-glow/40 after:via-cyan-glow/10 after:to-transparent")}
    >
      {backdrop && <img src={assetUrl(backdrop)} alt="" aria-hidden draggable={false} className="page-header-backdrop-img" />}
      <div className="relative">
        {/* 5.16 : étiquette code-barres, visible seulement dans le thème Signal. */}
        <span aria-hidden className="signal-tag">
          <span className="signal-barcode" />
          <span>{signalCode(title)}</span>
        </span>
        <p className="hud-eyebrow text-cyan-glow/80">{eyebrow}</p>
        <h1 className="hud-title mt-1 text-3xl text-white sm:text-4xl">
          <DecodeText text={title} />
        </h1>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {right && <div className="relative shrink-0">{right}</div>}
    </motion.div>
  );
}
