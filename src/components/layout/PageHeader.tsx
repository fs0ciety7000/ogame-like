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
      className="flex flex-wrap items-end justify-between gap-3 border-b border-white/5 pb-4"
    >
      <div>
        <p className="hud-eyebrow text-slate-500">{eyebrow}</p>
        <h1 className="font-display text-2xl text-white glow-text sm:text-3xl">
          <DecodeText text={title} />
        </h1>
        {description && <p className="mt-1 text-sm text-slate-400">{description}</p>}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </motion.div>
  );
}
