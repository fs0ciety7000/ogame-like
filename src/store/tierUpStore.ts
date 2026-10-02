import { create } from "zustand";
import { currentTiers, newTierUps, type SeenTiers, type TierUp } from "@/game/tierUp";
import type { Buildings } from "@/types/game";

/* v4.4 : file des passages de palier à célébrer en plein écran. */

const key = (uid: string) => `cosmic-empires:tiers:${uid}`;

interface TierUpState {
  queue: TierUp[];
}

export const useTierUpStore = create<TierUpState>(() => ({ queue: [] }));

function readSeen(uid: string): SeenTiers | null {
  try {
    const raw = localStorage.getItem(key(uid));
    return raw ? (JSON.parse(raw) as SeenTiers) : null;
  } catch {
    return null;
  }
}

function writeSeen(uid: string, seen: SeenTiers) {
  try {
    localStorage.setItem(key(uid), JSON.stringify(seen));
  } catch {
    /* sans stockage : pas de rattrapage hors ligne, tant pis */
  }
}

const memory = new Map<string, SeenTiers>();

/** Compare les bâtiments aux paliers déjà vus. La première fois sur cet
 *  appareil, mémorise l'état sans rien célébrer. */
export function checkTierUps(uid: string, buildings: Buildings) {
  const seen = memory.get(uid) ?? readSeen(uid);
  const now = currentTiers(buildings);
  if (!seen) {
    memory.set(uid, now);
    writeSeen(uid, now);
    return;
  }
  const ups = newTierUps(seen, buildings);
  if (ups.length === 0) return;
  const next = { ...seen };
  for (const u of ups) next[u.buildingId] = u.tier;
  memory.set(uid, next);
  writeSeen(uid, next);
  useTierUpStore.setState((s) => ({ queue: [...s.queue, ...ups].slice(-4) }));
}

export function dismissTierUp() {
  useTierUpStore.setState((s) => ({ queue: s.queue.slice(1) }));
}
