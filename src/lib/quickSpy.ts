import { toast } from "sonner";
import { primaryProbeUnitId } from "@/game/espionage";
import { GameActionError, sendFleet } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { formatDuration } from "@/lib/utils";

/* 5.23 : sondes en un clic (classement, carte, espionnage en masse).
   Le nombre de sondes par cible est mémorisé (préférence du navigateur). */

const KEY = "cosmic.quickProbes";

export function quickProbeCount(): number {
  try {
    const n = Math.floor(Number(localStorage.getItem(KEY)));
    return n > 0 ? n : 3;
  } catch {
    return 3;
  }
}

export function setQuickProbeCount(n: number): void {
  try {
    localStorage.setItem(KEY, String(Math.max(1, Math.floor(n))));
  } catch {
    /* préférence non enregistrée */
  }
}

/** Envoie les sondes ; renvoie l'heure d'arrivée, ou null si l'envoi échoue (message déjà affiché). */
export async function quickSpy(target: { uid: string; pseudo: string }, count = quickProbeCount(), silent = false): Promise<number | null> {
  const owned = usePlayerStore.getState().player?.units[primaryProbeUnitId()]?.count ?? 0;
  const n = Math.min(owned, count);
  if (n <= 0) {
    if (!silent) toast.error("Plus de sondes à quai : construis des Sondes d'espionnage.");
    return null;
  }
  try {
    const sent = await sendFleet(target.uid, { [primaryProbeUnitId()]: n }, "spy");
    if (!silent) {
      triggerWarpEffect();
      toast.success(`${n} sonde${n > 1 ? "s" : ""} en route vers ${target.pseudo}`, { description: `Rapport dans ${formatDuration((sent.arriveAtMs - Date.now()) / 1000)}.` });
    }
    return sent.arriveAtMs;
  } catch (err) {
    toast.error(`${target.pseudo} : ${err instanceof GameActionError ? err.message : "envoi impossible."}`);
    return null;
  }
}
