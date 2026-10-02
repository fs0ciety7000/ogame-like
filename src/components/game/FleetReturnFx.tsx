import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Rocket } from "lucide-react";
import { useFleetStore } from "@/store/fleetStore";
import { useAuthStore } from "@/store/authStore";
import { FLEET_MISSION_LABELS, type Fleet } from "@/game/fleets";
import { ResourceIcon } from "@/components/ui/game-icon";
import { formatCompact } from "@/lib/utils";
import { playWarp } from "@/lib/sfx";

/* =====================================================
   Retour de flotte (v3.8) : un vaisseau traverse le coin de l'écran et
   dépose le butin rapporté. Déclenché quand une de mes flottes passe de
   « retour » à « terminée » pendant que je joue.
===================================================== */

interface Arrival {
  id: string;
  label: string;
  loot: [string, number][];
}

export function FleetReturnFx() {
  const uid = useAuthStore((s) => s.user?.uid);
  const reduced = useReducedMotion() ?? false;
  const [arrivals, setArrivals] = useState<Arrival[]>([]);

  useEffect(() => {
    if (!uid) return;
    let prev = new Map<string, Fleet>(useFleetStore.getState().fleets.map((f) => [f.id, f]));
    return useFleetStore.subscribe((s) => {
      const landed: Arrival[] = [];
      const current = new Map(s.fleets.map((f) => [f.id, f]));
      // Les flottes terminées sortent de la liste : une flotte à moi qui était
      // « en retour » et disparaît (ou passe « terminée ») vient d'atterrir.
      for (const [id, before] of prev) {
        const now = current.get(id);
        if (before.ownerUid !== uid || before.status !== "returning" || (now && now.status !== "done")) continue;
        if (before.mission === "spy" || before.mission === "patrol") continue;
        const f = now ?? before;
        const loot = Object.entries(f.loot ?? {}).filter(([, v]) => (v ?? 0) > 0) as [string, number][];
        landed.push({ id, label: `${FLEET_MISSION_LABELS[f.mission]}${f.targetPseudo ? ` · ${f.targetPseudo}` : ""}`, loot });
      }
      prev = current;
      if (landed.length === 0) return;
      playWarp();
      setArrivals((a) => [...a, ...landed].slice(-3));
      for (const l of landed) setTimeout(() => setArrivals((a) => a.filter((x) => x.id !== l.id)), 6000);
    });
  }, [uid]);

  return (
    <div className="pointer-events-none fixed bottom-24 right-4 z-[70] flex flex-col items-end gap-2 md:bottom-6">
      <AnimatePresence>
        {arrivals.map((a) => (
          <motion.div
            key={a.id}
            layout
            initial={reduced ? { opacity: 0 } : { opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="relative w-72 overflow-hidden border border-mint-glow/40 bg-space-950/90 p-3 shadow-[0_0_24px_-6px_var(--color-mint-glow)] backdrop-blur-md [clip-path:polygon(0_0,calc(100%-10px)_0,100%_10px,100%_100%,0_100%)]"
          >
            {!reduced && (
              <motion.span
                aria-hidden
                className="absolute left-0 top-3 flex items-center text-mint-glow"
                initial={{ x: 300 }}
                animate={{ x: -60 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
              >
                <span className="h-px w-16 bg-gradient-to-r from-transparent to-mint-glow" />
                <Rocket className="h-4 w-4 -rotate-[135deg]" />
              </motion.span>
            )}
            <p className="hud-eyebrow text-mint-glow">Flotte de retour</p>
            <p className="mt-0.5 truncate text-sm text-white">{a.label}</p>
            {a.loot.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                {a.loot.map(([res, n], i) => (
                  <motion.span
                    key={res}
                    className="flex items-center gap-1 text-sm font-semibold text-mint-glow"
                    initial={{ opacity: 0, y: 6, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.08 }}
                  >
                    <ResourceIcon id={res} className="h-5 w-5" /> +{formatCompact(n)}
                  </motion.span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-xs text-slate-500">Rentrée à la base, sans butin.</p>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
