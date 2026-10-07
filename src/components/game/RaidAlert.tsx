import { importWithRetry } from "@/lib/updateReload";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { alarmGlitch } from "@/lib/fx/uiFx";
import { Link } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { AlertTriangle, Orbit, ScanSearch, Wind, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThreatGauge } from "@/components/game/ThreatGauge";
import { PatrolDialog } from "@/components/game/MissionDialogs";
import { isHostile } from "@/components/game/FleetsPanel";
import { useNowTicker } from "@/hooks/useNowTicker";
import { useFleetStore } from "@/store/fleetStore";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { usePhalanxSync } from "@/store/phalanxStore";
import { phalanxLevel } from "@/game/phalanx";
import { formatClock } from "@/lib/utils";

/* v4.9.3 : alerte plein écran à 5 minutes de l'impact d'une flotte hostile.
   Une seule fois par flotte (l'alerte fermée ne revient pas), avec la fuite à portée de main. */

export const RAID_ALERT_MS = 5 * 60_000;
const DISMISS_KEY = "cosmic-empires:raid-dismissed";
const dismissed = new Set<string>(readDismissed());

function readDismissed(): string[] {
  try {
    const raw = JSON.parse(sessionStorage.getItem(DISMISS_KEY) ?? "[]") as unknown;
    return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string").slice(-50) : [];
  } catch {
    return [];
  }
}

/* 5.23 : mini-scène 3D de la flotte en approche (chargée à la demande, absente sans WebGL ou animations réduites). */
const IncomingThreat3D = lazy(() => importWithRetry(() => import("@/components/fx/IncomingThreat3D")));

function Incoming3D({ ships, arriveAtMs }: { ships: number; arriveAtMs: number }) {
  const still = useReducedMotion() ?? false;
  const [off, setOff] = useState(false);
  if (still || off) return null;
  return (
    <Suspense fallback={<div className="mt-4 h-36 animate-pulse border border-danger-glow/15 bg-space-950/60" />}>
      <div className="mt-4">
        <IncomingThreat3D ships={Math.log2(1 + ships) * 3} arriveAtMs={arriveAtMs} windowMs={RAID_ALERT_MS} onUnsupported={() => setOff(true)} />
      </div>
    </Suspense>
  );
}

export function RaidAlert() {
  useNowTicker();
  const fleets = useFleetStore((s) => s.fleets);
  const uid = useAuthStore((s) => s.user?.uid);
  const [, force] = useState(0);
  const [patrol, setPatrol] = useState(false);
  // 6.14.49 (É30-1c) : la phalange relit les flottes qui te visent dès qu'une attaque apparaît ou disparaît
  // (alerte montée une fois pour toute l'appli : la jauge de menace et l'écran de la lune lisent le même état).
  const player = usePlayerStore((s) => s.player);
  const hostileKey = fleets
    .filter((f) => isHostile(f, uid) && f.mission === "attack")
    .map((f) => f.id)
    .sort()
    .join(",");
  usePhalanxSync(player, `hostile:${hostileKey}`);
  const now = Date.now();
  const imminent = fleets
    .filter((f) => isHostile(f, uid) && f.arriveAtMs > now && f.arriveAtMs - now <= RAID_ALERT_MS && !dismissed.has(f.id))
    .sort((a, b) => a.arriveAtMs - b.arriveAtMs);
  const next = imminent[0];
  const close = () => {
    for (const f of imminent) dismissed.add(f.id);
    try {
      sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...dismissed].slice(-50)));
    } catch {
      /* non mémorisé */
    }
    force((n) => n + 1);
  };
  const left = next ? Math.max(0, Math.floor((next.arriveAtMs - now) / 1000)) : 0;
  // 5.25 : le panneau d'alerte décroche par à-coups, comme un signal brouillé.
  const glitchRef = useRef<HTMLDivElement>(null);
  const alertId = next?.id;
  useEffect(() => {
    if (!alertId || !glitchRef.current) return;
    return alarmGlitch(glitchRef.current);
  }, [alertId]);

  return (
    <>
      <AnimatePresence>
        {next && (
          <motion.div
            key="raid-alert"
            role="alertdialog"
            aria-label="Attaque imminente"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] grid place-items-center bg-space-950/80 p-4 backdrop-blur-sm"
          >
            <span aria-hidden className="pointer-events-none absolute inset-0 animate-pulse bg-[radial-gradient(ellipse_at_center,transparent_40%,color-mix(in_srgb,var(--color-danger-glow)_28%,transparent)_100%)]" />
            <motion.div
              initial={{ scale: 0.92, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              className="hud-cut relative w-full max-w-md border border-danger-glow/60 bg-space-900/95 p-6 text-center shadow-[0_0_60px_-10px_var(--color-danger-glow)]"
            >
              <button type="button" onClick={close} className="absolute right-3 top-3 text-slate-500 hover:text-slate-100" aria-label="Fermer">
                <X className="h-4 w-4" />
              </button>
              <AlertTriangle className="mx-auto h-10 w-10 animate-pulse text-danger-glow" />
              <div ref={glitchRef}>
                <p className="hud-eyebrow mt-3 text-[11px] text-danger-glow">Attaque imminente</p>
              <p className="mt-1 font-display text-lg text-slate-100">
                {next.mission === "pirate" ? `Raid : ${next.ownerPseudo}` : `${next.ownerPseudo} attaque`}
                {next.targetOwnerUid ? ` ta colonie ${next.targetPseudo}` : ""}
              </p>
              <p className="hud-title mt-3 font-mono text-6xl tabular-nums text-danger-glow drop-shadow-[0_0_18px_var(--color-danger-glow)]">{formatClock(left)}</p>
              </div>
              {imminent.length > 1 && <p className="mt-1 text-xs text-slate-400">+ {imminent.length - 1} autre{imminent.length > 2 ? "s" : ""} flotte{imminent.length > 2 ? "s" : ""} dans les 5 minutes</p>}
              <Incoming3D ships={Object.values(next.units ?? {}).reduce((a, b) => a + (b ?? 0), 0) || 6} arriveAtMs={next.arriveAtMs} />
              <ThreatGauge fleet={next} className="mt-4" />
              <p className="mt-3 text-xs text-slate-400">Mets ta flotte à l'abri en patrouille, ou prépare tes défenses.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {/* L'alerte passe au-dessus des fenêtres : le balayage se fait depuis le panneau Lune (confirmation et rapport). */}
                {next.mission === "attack" && phalanxLevel(player) > 0 && (
                  <Button variant="outline" asChild onClick={close}>
                    <Link to="/game/statistiques?onglet=lune">
                      <ScanSearch className="h-4 w-4" /> Balayer l'agresseur
                    </Link>
                  </Button>
                )}
                <Button variant="danger" onClick={() => setPatrol(true)}>
                  <Wind className="h-4 w-4" /> Fuir en patrouille
                </Button>
                <Button variant="outline" asChild onClick={close}>
                  <Link to="/game/galaxie">
                    <Orbit className="h-4 w-4" /> Voir la galaxie
                  </Link>
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <PatrolDialog
        open={patrol}
        onClose={() => {
          setPatrol(false);
          close();
        }}
      />
    </>
  );
}
