import { useSeasonAccent } from "@/lib/seasonSkin";

/** v4.3 : liseré et halo aux couleurs du mois (habillage de saison). */
export function SeasonGlow() {
  const season = useSeasonAccent();
  if (!season) return null;
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <div className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg, transparent, ${season.accent}, transparent)` }} />
      <div className="absolute -top-40 left-1/2 h-80 w-[70vw] -translate-x-1/2 rounded-full opacity-[0.12] blur-3xl" style={{ background: season.accent }} />
      <div className="absolute -bottom-40 -right-20 h-72 w-72 rounded-full opacity-[0.08] blur-3xl" style={{ background: season.accent }} />
    </div>
  );
}
