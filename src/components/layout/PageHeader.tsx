import { useEffect, useRef, type ReactNode } from "react";
import { motion } from "framer-motion";
import { lightUp, scramble } from "@/lib/fx/uiFx";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { PageTip } from "@/components/game/PageTip";
import { useRegisterPageHeader } from "@/store/pageHeaderStore";

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
  // 5.25 : le titre s'allume lettre par lettre (tube néon), le fil d'Ariane se décode.
  useRegisterPageHeader();
  const titleRef = useRef<HTMLSpanElement>(null);
  const eyebrowRef = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (titleRef.current) void lightUp(titleRef.current);
    if (eyebrowRef.current) void scramble(eyebrowRef.current, eyebrow, 0.5);
  }, [title, eyebrow]);
  // 6.14.62 (AD-6) : l'astuce de la page vient sous le titre, plus au-dessus.
  return (
    <>
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
          <p className="hud-eyebrow text-cyan-glow/80">
            <span ref={eyebrowRef} key={eyebrow}>{eyebrow}</span>
          </p>
          <h1 className="hud-title mt-1 text-3xl text-slate-100 sm:text-4xl">
            <span ref={titleRef} key={title}>{title}</span>
          </h1>
          {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
        </div>
        {right && <div className="relative max-w-full shrink-0">{right}</div>}
      </motion.div>
      <PageTip />
    </>
  );
}
