import { useEffect } from "react";
import { create } from "zustand";

/* 6.14.161 (S1, NJ-2) : une seule grande fenêtre à la fois entre l'histoire (bulles de Vashka et Varan) et l'alerte de raid.
   La première qui demande la place l'obtient ; l'autre attend qu'elle se ferme. Au raid scripté du tutoriel, l'histoire
   « La Confrérie attaque » passe d'abord, puis l'alerte (compte à rebours, « Fuir en patrouille »). Avant, les deux
   s'ouvraient ensemble : la fenêtre d'histoire cachée bloquait les touchers sur l'alerte et le premier toucher la fermait. */

export const useModalSlot = create<{ owner: string | null }>(() => ({ owner: null }));

/** Demande la place : vrai si elle était libre ou déjà à `id`. */
export function claimModalSlot(id: string): boolean {
  const owner = useModalSlot.getState().owner;
  if (owner !== null && owner !== id) return false;
  if (owner !== id) useModalSlot.setState({ owner: id });
  return true;
}

/** Rend la place (sans effet si elle est à un autre). */
export function releaseModalSlot(id: string): void {
  if (useModalSlot.getState().owner === id) useModalSlot.setState({ owner: null });
}

/** La fenêtre `id` veut s'afficher (`wants`) : vrai quand elle a la place. Elle la rend en se fermant ou en se démontant. */
export function useExclusiveModal(id: string, wants: boolean): boolean {
  const owner = useModalSlot((s) => s.owner);
  useEffect(() => {
    if (wants) claimModalSlot(id);
    else releaseModalSlot(id);
  }, [id, wants, owner]);
  useEffect(() => {
    return () => releaseModalSlot(id);
  }, [id]);
  return wants && owner === id;
}
