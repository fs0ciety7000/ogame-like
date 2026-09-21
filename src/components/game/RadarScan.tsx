import { motion } from "framer-motion";

/** Balayage radar circulaire — utilisé pendant l'espionnage ou l'envoi
 *  d'une flotte, le temps que la requête aboutisse. */
export function RadarScan({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-full border border-cyan-glow/30">
        <div className="absolute inset-2 rounded-full border border-cyan-glow/20" />
        <div className="absolute inset-[14px] rounded-full border border-cyan-glow/10" />
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "conic-gradient(from 0deg, transparent 0deg, transparent 260deg, color-mix(in srgb, var(--color-cyan-glow) 55%, transparent) 300deg, color-mix(in srgb, var(--color-cyan-glow) 90%, transparent) 360deg)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
        />
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-glow shadow-[0_0_8px_1px_var(--color-cyan-glow)]" />
      </div>
      {label && <p className="hud-eyebrow text-slate-500">{label}</p>}
    </div>
  );
}
