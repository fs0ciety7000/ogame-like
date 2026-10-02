import { useLocation } from "react-router-dom";

/* Nappe de nébuleuses en arrière-plan (taches de couleur floutées, sans
 * image externe). Chaque page a sa teinte ; le changement se fait en fondu
 * (transition CSS de la couleur). Toujours rendue derrière le Starfield. */

type Palette = [string, string, string];

const PALETTES: [string, Palette][] = [
  ["/game/batiments", ["var(--color-gold-glow)", "var(--color-ember-glow)", "var(--color-cyan-glow)"]],
  ["/game/unites", ["var(--color-danger-glow)", "var(--color-ember-glow)", "var(--color-cyan-glow)"]],
  ["/game/labo", ["#8b5cf6", "var(--color-cyan-glow)", "var(--color-mint-glow)"]],
  ["/game/missions", ["var(--color-mint-glow)", "var(--color-cyan-glow)", "var(--color-gold-glow)"]],
  ["/game/primes", ["var(--color-gold-glow)", "var(--color-ember-glow)", "#8b5cf6"]],
  ["/game/galaxie", ["#6366f1", "#ec4899", "var(--color-cyan-glow)"]],
  ["/game/joueurs", ["var(--color-danger-glow)", "#6366f1", "var(--color-cyan-glow)"]],
  ["/game/combats", ["var(--color-danger-glow)", "var(--color-gold-glow)", "#ec4899"]],
  ["/game/alliance", ["var(--color-mint-glow)", "#6366f1", "var(--color-gold-glow)"]],
  ["/game/ressources", ["var(--color-gold-glow)", "var(--color-mint-glow)", "var(--color-cyan-glow)"]],
  ["/game/admin", ["#64748b", "var(--color-cyan-glow)", "var(--color-gold-glow)"]],
];
const DEFAULT_PALETTE: Palette = ["var(--color-cyan-glow)", "var(--color-ember-glow)", "var(--color-mint-glow)"];

export function Nebula() {
  const { pathname } = useLocation();
  const palette = PALETTES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? DEFAULT_PALETTE;

  return (
    <div className="nebula-field" aria-hidden>
      <div className="nebula-blob" style={{ top: "-10%", left: "-5%", width: "45vw", height: "45vw", backgroundColor: palette[0] }} />
      <div
        className="nebula-blob"
        style={{ bottom: "-15%", right: "-10%", width: "42vw", height: "42vw", backgroundColor: palette[1], animationDelay: "-8s" }}
      />
      <div
        className="nebula-blob"
        style={{ top: "35%", right: "20%", width: "28vw", height: "28vw", backgroundColor: palette[2], opacity: 0.16, animationDelay: "-15s" }}
      />
    </div>
  );
}
