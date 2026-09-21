/** Crochets d'angle façon viseur/instrument de bord — à poser en overlay
 *  absolu dans un conteneur `relative`, sur les panneaux clés seulement
 *  (pas systématique : ça doit rester un accent, pas du bruit visuel). */
export function CornerBrackets({ color = "var(--color-cyan-glow)" }: { color?: string }) {
  const base = "absolute h-4 w-4";
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      <span className={`${base} left-0 top-0 border-l-2 border-t-2`} style={{ borderColor: color }} />
      <span className={`${base} right-0 top-0 border-r-2 border-t-2`} style={{ borderColor: color }} />
      <span className={`${base} bottom-0 left-0 border-b-2 border-l-2`} style={{ borderColor: color }} />
      <span className={`${base} bottom-0 right-0 border-b-2 border-r-2`} style={{ borderColor: color }} />
    </div>
  );
}
