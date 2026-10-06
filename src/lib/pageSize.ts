import { create } from "zustand";

/* 5.25 : nombre d'éléments par page des listes paginées, choisi par le joueur
   (Réglages), mémorisé sur l'appareil. 5 par défaut (5.26.1). */

export const PAGE_SIZES = [5, 10, 15, 20, 50] as const;
export const DEFAULT_PAGE_SIZE = 5;
const KEY = "cosmic-empires:page-size";

function initial(): number {
  try {
    const n = Number(localStorage.getItem(KEY));
    return (PAGE_SIZES as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
  } catch {
    return DEFAULT_PAGE_SIZE;
  }
}

const usePageSizeStore = create<{ size: number }>(() => ({ size: initial() }));

export function usePageSize(): number {
  return usePageSizeStore((s) => s.size);
}

export function setPageSize(size: number) {
  if (!(PAGE_SIZES as readonly number[]).includes(size)) return;
  try {
    localStorage.setItem(KEY, String(size));
  } catch {
    /* choix gardé pour la session */
  }
  usePageSizeStore.setState({ size });
}
