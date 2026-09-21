import { create } from "zustand";

const STORAGE_KEY = "cosmic-empires:sfx-enabled";

function readInitial(): boolean {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v === null ? true : v === "1";
  } catch {
    return true;
  }
}

interface SfxState {
  enabled: boolean;
}

export const useSfxStore = create<SfxState>(() => ({ enabled: readInitial() }));

export function toggleSfx() {
  const next = !useSfxStore.getState().enabled;
  useSfxStore.setState({ enabled: next });
  try {
    localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
  } catch {
    /* stockage indisponible (navigation privée…) : préférence non retenue, tant pis */
  }
}
