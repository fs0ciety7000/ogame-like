import { useLocation } from "react-router-dom";
import { useSeasonAccent } from "@/lib/seasonSkin";

/* 5.16 : uniquement des couleurs du thème (plus de teintes figées).
 * Nappe de nébuleuses en arrière-plan (taches de couleur floutées, sans
 * image externe). Chaque page a sa teinte ; le changement se fait en fondu
 * (transition CSS de la couleur). Toujours rendue derrière le Starfield. */

type Palette = [string, string, string];

const PALETTES: [string, Palette][] = [
  ["/game/batiments", ["var(--color-gold-glow)", "var(--color-ember-glow)", "var(--color-cyan-glow)"]],
  ["/game/unites", ["var(--color-danger-glow)", "var(--color-ember-glow)", "var(--color-cyan-glow)"]],
  ["/game/labo", ["var(--color-violet-glow)", "var(--color-cyan-glow)", "var(--color-mint-glow)"]],
  ["/game/missions", ["var(--color-mint-glow)", "var(--color-cyan-glow)", "var(--color-gold-glow)"]],
  ["/game/etat-major", ["var(--color-violet-glow)", "var(--color-gold-glow)", "var(--color-cyan-glow)"]],
  ["/game/primes", ["var(--color-gold-glow)", "var(--color-ember-glow)", "var(--color-violet-glow)"]],
  ["/game/galaxie", ["color-mix(in srgb, var(--color-violet-glow) 60%, var(--color-cyan-glow))", "color-mix(in srgb, var(--color-violet-glow) 50%, var(--color-danger-glow))", "var(--color-cyan-glow)"]],
  ["/game/joueurs", ["var(--color-danger-glow)", "color-mix(in srgb, var(--color-violet-glow) 60%, var(--color-cyan-glow))", "var(--color-cyan-glow)"]],
  ["/game/combats", ["var(--color-danger-glow)", "var(--color-gold-glow)", "color-mix(in srgb, var(--color-violet-glow) 50%, var(--color-danger-glow))"]],
  ["/game/alliance", ["var(--color-mint-glow)", "color-mix(in srgb, var(--color-violet-glow) 60%, var(--color-cyan-glow))", "var(--color-gold-glow)"]],
  ["/game/ressources", ["var(--color-gold-glow)", "var(--color-mint-glow)", "var(--color-cyan-glow)"]],
  ["/game/admin", ["var(--color-slate-500)", "var(--color-cyan-glow)", "var(--color-gold-glow)"]],
];
const DEFAULT_PALETTE: Palette = ["var(--color-cyan-glow)", "var(--color-ember-glow)", "var(--color-mint-glow)"];

/** 5.16 : la teinte de la page reste discrète, le thème choisi domine. */
const tame = (c: string, pct = 35) => `color-mix(in srgb, ${c} ${pct}%, var(--th-accent))`;

export function Nebula() {
  const { pathname } = useLocation();
  const season = useSeasonAccent();
  // v4.3 : sur les pages sans teinte propre, la couleur du mois prend la tête.
  const raw = PALETTES.find(([prefix]) => pathname.startsWith(prefix))?.[1] ?? (season ? ([season.accent, DEFAULT_PALETTE[1], DEFAULT_PALETTE[0]] as Palette) : DEFAULT_PALETTE);
  const palette: Palette = [tame(raw[0]), tame(raw[1], 25), tame(raw[2], 50)];

  return (
    <div className="nebula-field" aria-hidden>
      <div className="nebula-blob" style={{ top: "-10%", left: "-5%", width: "60vw", height: "60vw", ["--blob" as string]: palette[0] }} />
      <div
        className="nebula-blob"
        style={{ bottom: "-15%", right: "-10%", width: "56vw", height: "56vw", ["--blob" as string]: palette[1], animationDelay: "-8s" }}
      />
      <div
        className="nebula-blob"
        style={{ top: "35%", right: "20%", width: "38vw", height: "38vw", ["--blob" as string]: palette[2], opacity: 0.16, animationDelay: "-15s" }}
      />
    </div>
  );
}
