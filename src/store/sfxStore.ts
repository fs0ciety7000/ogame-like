import { create } from "zustand";

/* =====================================================
   v4.4 : sons par catégorie, avec un volume chacune. Coupés par défaut
   sur mobile (écran tactile) tant que le joueur ne les a pas activés.
===================================================== */

const STORAGE_KEY = "cosmic-empires:sfx-enabled";
const VOLUMES_KEY = "cosmic-empires:sfx-volumes";

export type SfxCategory = "ui" | "events" | "combat" | "casino" | "notifications" | "alerts" | "ambience";

export const SFX_CATEGORIES: { id: SfxCategory; label: string; description: string }[] = [
  { id: "ui", label: "Interface", description: "Clics, confirmations." },
  { id: "events", label: "Évènements", description: "Fin de construction, palier, succès, saut de flotte." },
  // 5.15.9 : catégories séparées pour pouvoir couper le casino ou les combats seuls.
  { id: "combat", label: "Combats", description: "Victoire, défaite." },
  { id: "casino", label: "Casino", description: "Levier, rouleaux, gains, gros lot." },
  { id: "notifications", label: "Notifications", description: "Message reçu, notification de jeu." },
  { id: "alerts", label: "Alertes", description: "Attaque en approche, espion repéré, flotte hostile." },
  { id: "ambience", label: "Ambiance", description: "Nappe sonore continue, propre à chaque thème." },
];

export const DEFAULT_VOLUMES: Record<SfxCategory, number> = { ui: 0.6, events: 0.8, combat: 0.8, casino: 0.7, notifications: 0.7, alerts: 0.9, ambience: 0 };

function isTouchDevice(): boolean {
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

function readEnabled(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v !== null) return v === "1";
  } catch {
    /* stockage indisponible */
  }
  return !isTouchDevice();
}

function readVolumes(): Record<SfxCategory, number> {
  try {
    const raw = JSON.parse(localStorage.getItem(VOLUMES_KEY) ?? "null") as Partial<Record<SfxCategory, number>> | null;
    if (raw && typeof raw === "object") {
      const out = { ...DEFAULT_VOLUMES };
      for (const c of Object.keys(out) as SfxCategory[]) {
        const n = Number(raw[c]);
        if (Number.isFinite(n)) out[c] = Math.min(1, Math.max(0, n));
      }
      return out;
    }
  } catch {
    /* valeurs par défaut */
  }
  return { ...DEFAULT_VOLUMES };
}

interface SfxState {
  enabled: boolean;
  volumes: Record<SfxCategory, number>;
}

export const useSfxStore = create<SfxState>(() => ({ enabled: readEnabled(), volumes: readVolumes() }));

export function setSfxEnabled(next: boolean) {
  useSfxStore.setState({ enabled: next });
  try {
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* préférence non retenue */
  }
}

export function toggleSfx() {
  setSfxEnabled(!useSfxStore.getState().enabled);
}

export function setSfxVolume(category: SfxCategory, volume: number) {
  const volumes = { ...useSfxStore.getState().volumes, [category]: Math.min(1, Math.max(0, volume)) };
  useSfxStore.setState({ volumes });
  try {
    localStorage.setItem(VOLUMES_KEY, JSON.stringify(volumes));
  } catch {
    /* préférence non retenue */
  }
}

/** Volume effectif d'une catégorie (0 si les sons sont coupés). */
export function sfxVolume(category: SfxCategory): number {
  const s = useSfxStore.getState();
  return s.enabled ? s.volumes[category] : 0;
}
