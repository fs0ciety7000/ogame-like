import { Suspense, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Wind } from "lucide-react";
import { targetsPlayer, type Fleet } from "@/game/fleets";
import { HudChip } from "@/components/ui/hud";
import { useFleetStore } from "@/store/fleetStore";
import { useAuthStore } from "@/store/authStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { formatClock } from "@/lib/utils";
import { lazyPage } from "@/lib/lazyPage";

/* 6.14.157 (R4b) : sortis de `FleetsPanel.tsx` : la barre du menu et l'en-tête (coque du jeu, chargée sur chaque page) n'ont
   besoin que de ce test et de la pastille ; le panneau des flottes, la phalange et les fenêtres de mission (≈ 60 Ko) restent
   avec les pages qui les affichent. La fenêtre « Fuir » se charge au clic. */
const PatrolDialog = lazyPage(() => import("@/components/game/MissionDialogs"), "PatrolDialog");

/** Flotte hostile : une attaque d'un autre joueur, encore en approche. */
export function isHostile(f: Fleet, uid: string | undefined): boolean {
  return (
    targetsPlayer(f, uid) &&
    f.ownerUid !== uid &&
    f.status === "outbound" &&
    ((f.mission ?? "attack") === "attack" || f.mission === "pirate")
  );
}

/** Pastille de l'en-tête : flottes hostiles en approche. */
export function HostileFleetAlert() {
  useNowTicker();
  const fleets = useFleetStore((s) => s.fleets);
  const uid = useAuthStore((s) => s.user?.uid);
  const [patrolOpen, setPatrolOpen] = useState(false);
  const incoming = fleets.filter((f) => isHostile(f, uid));
  if (incoming.length === 0) return null;
  const next = Math.min(...incoming.map((f) => f.arriveAtMs));
  return (
    <div className="flex items-center gap-1">
      <HudChip asChild tone="danger" alert title="Flottes hostiles en approche">
        <Link to="/game/galaxie">
          <AlertTriangle />
          {incoming.length > 1 ? `${incoming.length} flottes hostiles` : "Flotte hostile"} · {formatClock(Math.max(0, Math.floor((next - Date.now()) / 1000)))}
        </Link>
      </HudChip>
      <HudChip asChild tone="danger" title="Mode fuite : mettre la flotte à l'abri en patrouille">
        <button type="button" onClick={() => setPatrolOpen(true)}>
          <Wind /> Fuir
        </button>
      </HudChip>
      {patrolOpen && (
        <Suspense fallback={null}>
          <PatrolDialog open={patrolOpen} onClose={() => setPatrolOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
