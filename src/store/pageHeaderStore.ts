import { useEffect } from "react";
import { create } from "zustand";

/* 6.14.62 (AD-2) : nombre de `PageHeader` montés. Tant qu'une page affiche son en-tête, l'en-tête du jeu ne répète pas
   son titre sur téléphone (il était écrit deux fois l'un sous l'autre). */
export const usePageHeaderStore = create<{ mounted: number }>(() => ({ mounted: 0 }));

/** Déclare un en-tête de page monté (appelé par `PageHeader`). */
export function useRegisterPageHeader() {
  useEffect(() => {
    usePageHeaderStore.setState((s) => ({ mounted: s.mounted + 1 }));
    return () => {
      usePageHeaderStore.setState((s) => ({ mounted: Math.max(0, s.mounted - 1) }));
    };
  }, []);
}
