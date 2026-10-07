import { useEffect } from "react";
import { create } from "zustand";
import { phalanxLevel } from "@/game/phalanx";
import { fetchPhalanx, type PhalanxFleetLine, type PhalanxStatus } from "@/services/playerService";

/* =====================================================
   6.14.49 (É30-1c, proposals/phalange-porte-de-saut.md) : état de la phalange
   lu sur le serveur (seul à voir les champs cachés des flottes, I22). Un seul
   état pour toute l'appli : l'alerte d'attaque, la jauge de menace, l'écran
   de la lune et la page Alliance le lisent. Rechargé quand les flottes
   hostiles changent, à la demande (balayage, saut) et au plus toutes les
   15 s ; jamais sans lune (le serveur rendrait des listes vides).
===================================================== */

interface PhalanxStore {
  data: PhalanxStatus | null;
  /** Clé du dernier chargement (flottes hostiles, niveau, minute…). */
  sig: string;
  loadedAt: number;
}

export const usePhalanxStore = create<PhalanxStore>(() => ({ data: null, sig: "", loadedAt: 0 }));

const MIN_GAP_MS = 15_000;
let pending: Promise<void> | null = null;
/** Demande arrivée pendant un chargement : rejouée à la fin. */
let queued: { sig: string; force: boolean } | null = null;

/** Recharge l'état de la phalange si la clé a changé (ou si `force`). Une seule requête à la fois. */
export function refreshPhalanx(sig = usePhalanxStore.getState().sig, force = false): Promise<void> {
  if (pending) {
    queued = { sig, force: force || queued?.force === true };
    return pending;
  }
  const st = usePhalanxStore.getState();
  if (!force && sig === st.sig && Date.now() - st.loadedAt < MIN_GAP_MS) return Promise.resolve();
  pending = fetchPhalanx()
    .then((data) => usePhalanxStore.setState({ data, sig, loadedAt: Date.now() }))
    .catch(() => usePhalanxStore.setState({ sig, loadedAt: Date.now() }))
    .finally(() => {
      pending = null;
      const next = queued;
      queued = null;
      if (next) void refreshPhalanx(next.sig, next.force);
    });
  return pending;
}

/** Vide l'état (pas de lune, déconnexion). */
export function clearPhalanx() {
  usePhalanxStore.setState({ data: null, sig: "", loadedAt: 0 });
}

/** Tient l'état à jour tant que `key` change (ex. identifiants des flottes hostiles). Rien sans lune. */
export function usePhalanxSync(player: Parameters<typeof phalanxLevel>[0], key: string) {
  const level = phalanxLevel(player);
  useEffect(() => {
    if (level <= 0) {
      if (usePhalanxStore.getState().data) clearPhalanx();
      return;
    }
    void refreshPhalanx(`${level}|${key}`);
  }, [level, key]);
}

/** Ligne percée d'une flotte qui te vise (null : rien de percé, ou pas de lune). */
export function usePiercedFleet(fleetId: string | undefined): PhalanxFleetLine | null {
  return usePhalanxStore((s) => {
    if (!fleetId) return null;
    const line = s.data?.incoming.find((l) => l.id === fleetId);
    return line && (line.pierced?.decoy || line.pierced?.boosts) ? line : null;
  });
}
