import { create } from "zustand";

/* =====================================================
   Compositions de flotte enregistrées (v3.8), par joueur et par appareil.
   Une composition est appliquée dans la limite des vaisseaux possédés.
===================================================== */

export interface FleetPreset {
  id: string;
  name: string;
  units: Record<string, number>;
}

export const MAX_PRESETS = 6;

const key = (uid: string) => `cosmic-empires:fleet-presets:${uid}`;

function read(uid: string): FleetPreset[] {
  try {
    const raw = JSON.parse(localStorage.getItem(key(uid)) ?? "[]");
    return Array.isArray(raw) ? raw.filter((p) => p && typeof p.name === "string" && p.units && typeof p.units === "object") : [];
  } catch {
    return [];
  }
}

function write(uid: string, presets: FleetPreset[]) {
  try {
    localStorage.setItem(key(uid), JSON.stringify(presets));
  } catch {
    /* navigation privée : la composition vit le temps de la session */
  }
}

export const useFleetPresetStore = create<{ byUid: Record<string, FleetPreset[]> }>(() => ({ byUid: {} }));

export function useFleetPresets(uid: string | null | undefined): FleetPreset[] {
  return useFleetPresetStore((s) => (uid ? (s.byUid[uid] ?? read(uid)) : []));
}

function set(uid: string, presets: FleetPreset[]) {
  write(uid, presets);
  useFleetPresetStore.setState((s) => ({ byUid: { ...s.byUid, [uid]: presets } }));
}

/** Enregistre (ou remplace, même nom) une composition. */
export function saveFleetPreset(uid: string, name: string, units: Record<string, number>): FleetPreset[] {
  const clean = Object.fromEntries(Object.entries(units).filter(([, n]) => n > 0).map(([id, n]) => [id, Math.floor(n)]));
  const label = name.trim().slice(0, 24) || "Composition";
  const others = read(uid).filter((p) => p.name.toLowerCase() !== label.toLowerCase());
  const next = [...others, { id: `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name: label, units: clean }].slice(-MAX_PRESETS);
  set(uid, next);
  return next;
}

export function deleteFleetPreset(uid: string, id: string) {
  set(
    uid,
    read(uid).filter((p) => p.id !== id),
  );
}

/** Composition ramenée aux vaisseaux disponibles (`only` : unités autorisées). */
export function applyPreset(preset: FleetPreset, owned: Record<string, number>, only?: string[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [id, n] of Object.entries(preset.units)) {
    if (only && !only.includes(id)) continue;
    const qty = Math.min(n, owned[id] ?? 0);
    if (qty > 0) out[id] = qty;
  }
  return out;
}
