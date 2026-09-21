import { motion } from "framer-motion";

const LINES = [
  "Connexion au réseau stellaire…",
  "Authentification du commandant…",
  "Synchronisation de l'empire…",
];

/** Écran de chargement initial (une seule fois, au premier sync) façon
 *  séquence de démarrage — remplacé par le simple spinner pour les
 *  transitions de page suivantes (PageLoader), trop fréquentes pour
 *  rejouer une animation de plusieurs lignes à chaque fois. */
export function BootSequence() {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-2 tabular-mono text-xs text-slate-400">
      {LINES.map((line, i) => (
        <motion.p
          key={line}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: i * 0.5 }}
        >
          <span className="text-cyan-glow">{">"}</span> {line}
        </motion.p>
      ))}
      <motion.span
        className="mt-1 h-3 w-1.5 bg-cyan-glow"
        animate={{ opacity: [1, 0, 1] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: "linear", times: [0, 0.5, 0.51] }}
      />
    </div>
  );
}
