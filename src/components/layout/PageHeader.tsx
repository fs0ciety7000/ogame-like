import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { DecodeText } from "@/components/ui/decode-text";

/** En-tête de page commun : fil d'Ariane mono + gros titre display, avec un
 *  slot optionnel à droite (statut, compteur clé...) — remplace le simple
 *  <h1> répété sur chaque page pour un rendu "poste de contrôle" homogène. */
export function PageHeader({
  eyebrow,
  title,
  description,
  right,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  right?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="relative flex flex-wrap items-end justify-between gap-3 pb-4 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-gradient-to-r after:from-cyan-glow/40 after:via-cyan-glow/10 after:to-transparent"
    >
      <div>
        <p className="hud-eyebrow text-cyan-glow/80">{eyebrow}</p>
        <h1 className="hud-title mt-1 text-3xl text-white sm:text-4xl">
          <DecodeText text={title} />
        </h1>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </motion.div>
  );
}
