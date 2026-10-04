/* v5.11 : raccourcis clavier globaux (une touche, hors saisie). « ? » ouvre l'aide. */

export const SHORTCUTS: { key: string; label: string; to: string }[] = [
  { key: "h", label: "Accueil", to: "/game" },
  { key: "b", label: "Bâtiments", to: "/game/batiments" },
  { key: "u", label: "Unités", to: "/game/unites" },
  { key: "l", label: "Labo", to: "/game/labo" },
  { key: "g", label: "Galaxie", to: "/game/galaxie" },
  { key: "m", label: "Missions", to: "/game/missions" },
  { key: "c", label: "Colonies", to: "/game/colonies" },
  { key: "a", label: "Alliance", to: "/game/alliance" },
  { key: "p", label: "Passe de saison", to: "/game/passe" },
  { key: "j", label: "Journal", to: "/game/journal" },
];

/** Vrai si la touche doit être ignorée (saisie en cours, modificateur, fenêtre ouverte). */
export function ignoreShortcut(e: Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "altKey" | "target">): boolean {
  if (e.ctrlKey || e.metaKey || e.altKey) return true;
  const el = e.target as HTMLElement | null;
  if (!el || typeof el.closest !== "function") return false;
  if (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName)) return true;
  // Pas de navigation au clavier sous une fenêtre modale ou un menu ouvert.
  return !!el.closest('[role="dialog"], [role="menu"], [role="listbox"]') || !!document.querySelector('[role="dialog"][data-state="open"]');
}
