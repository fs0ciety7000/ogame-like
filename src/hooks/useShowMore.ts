import { useEffect, useState } from "react";

/** 5.15.12 : affiche une longue liste par tranches (« Afficher plus »).
 *  La tranche revient au début quand `resetKey` change (filtre, onglet). */
export function useShowMore<T>(list: T[], step: number, resetKey?: unknown): { shown: T[]; more: number; showMore: () => void } {
  const [count, setCount] = useState(step);
  useEffect(() => setCount(step), [resetKey, step]);
  return { shown: list.slice(0, count), more: Math.max(0, list.length - count), showMore: () => setCount((c) => c + step) };
}
