import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { flyResources, landFlight, trackPointer, useFxStore, type ResourceFlight } from "@/store/fxStore";
import { usePlayerStore } from "@/store/playerStore";
import { discreteGains } from "@/game/gains";
import { formatCompact } from "@/lib/utils";
import type { PlayerState } from "@/types/game";
import { ResourceIcon } from "@/components/ui/game-icon";

/** Cible d'une ressource : sa puce dans l'en-tête (data-hud-res). */
function targetOf(res: string) {
  const el = document.querySelector(`[data-hud-res="${res}"]`);
  const rect = el?.getBoundingClientRect();
  if (rect && rect.width > 0) return { x: rect.left + 14, y: rect.top + rect.height / 2 };
  return { x: window.innerWidth / 2, y: 24 };
}

function Flight({ flight }: { flight: ResourceFlight }) {
  const [to] = useState(() => targetOf(flight.res));
  const { from } = flight;
  // Trajectoire en arc : monte d'abord un peu, puis file vers l'en-tête.
  const midX = from.x + (to.x - from.x) * 0.35;
  const midY = Math.min(from.y, to.y) - 60;
  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[80] flex items-center gap-1 whitespace-nowrap text-base font-semibold text-mint-glow drop-shadow-[0_0_6px_color-mix(in_srgb,var(--color-space-950)_80%,transparent)]"
      initial={{ x: from.x, y: from.y, scale: 0.6, opacity: 0 }}
      animate={{ x: [from.x, midX, to.x], y: [from.y, midY, to.y], scale: [0.6, 1.35, 0.7], opacity: [0, 1, 0.9] }}
      transition={{ duration: 1.25, delay: flight.delay, ease: "easeInOut", times: [0, 0.4, 1] }}
      onAnimationComplete={() => landFlight(flight.id)}
    >
      <ResourceIcon id={flight.res} className="h-7 w-7" />
      <span className="tabular-mono">+{formatCompact(flight.amount)}</span>
    </motion.div>
  );
}

/** Détecte les gains ponctuels (état serveur précédent → nouveau) et
 *  lance les envols correspondants. */
function useDiscreteGainFlights(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    let prev: PlayerState | null = usePlayerStore.getState().player;
    return usePlayerStore.subscribe((s) => {
      const next = s.player;
      if (!next || next === prev) return;
      // Ignore le premier chargement, un changement de compte et les longues
      // absences (déjà résumées par la fenêtre « Pendant ton absence »).
      if (prev && prev.uid === next.uid && next.resourcesUpdatedAtMs - prev.resourcesUpdatedAtMs < 10 * 60 * 1000) {
        flyResources(discreteGains(prev, next));
      }
      prev = next;
    });
  }, [enabled]);
}

export function FxLayer() {
  const flights = useFxStore((s) => s.flights);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    return trackPointer();
  }, []);
  useDiscreteGainFlights(!reduced);

  return (
    <AnimatePresence>
      {flights.map((f) => (
        <Flight key={f.id} flight={f} />
      ))}
    </AnimatePresence>
  );
}
