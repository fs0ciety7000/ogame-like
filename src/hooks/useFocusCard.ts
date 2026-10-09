import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";

/* 6.14.164 (S4, NJ-13) : « J'y vais » (prise en main) mène à `?focus=<id>` : la page défile jusqu'à la carte qui porte
   `data-focus-id="<id>"` et la met en évidence 2,5 s (contour accent). Avant, le joueur arrivait en haut de la page,
   au-dessus de la file planifiée, et cherchait l'extracteur lui-même. */

const FOCUS_HIGHLIGHT = ["outline", "outline-2", "outline-offset-2", "outline-cyan-glow"];

/** Identifiant visé par `?focus=` (ou null). `ready` : la liste est affichée (données chargées). */
export function useFocusCard(ready: boolean): string | null {
  const [params] = useSearchParams();
  const focus = params.get("focus");
  useEffect(() => {
    if (!focus || !ready) return;
    let el: HTMLElement | null = null;
    // Attente d'une image : les cartes apparaissent avec une courte animation (motion), on laisse la page se poser.
    const start = setTimeout(() => {
      el = document.querySelector<HTMLElement>(`[data-focus-id="${CSS.escape(focus)}"]`);
      if (!el) return;
      el.scrollIntoView({ block: "center", behavior: "smooth" });
      el.classList.add(...FOCUS_HIGHLIGHT);
    }, 350);
    const stop = setTimeout(() => el?.classList.remove(...FOCUS_HIGHLIGHT), 2_850);
    return () => {
      clearTimeout(start);
      clearTimeout(stop);
      el?.classList.remove(...FOCUS_HIGHLIGHT);
    };
  }, [focus, ready]);
  return focus;
}
