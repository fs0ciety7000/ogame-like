import { useMemo } from "react";
import { BUILDINGS } from "@/game/buildings";
import type { Buildings } from "@/types/game";

/** Rendu de la planète-siège du joueur : plus les bâtiments sont
 *  développés, plus la sphère, l'anneau et le halo sont lumineux. */
export function HomePlanet({ buildings, size = 116 }: { buildings: Buildings; size?: number }) {
  const percent = useMemo(() => {
    const total = BUILDINGS.reduce((sum, b) => sum + (buildings[b.id]?.level ?? 0), 0);
    const max = BUILDINGS.reduce((sum, b) => sum + b.maxLevel, 0);
    return max > 0 ? Math.min(1, total / max) : 0;
  }, [buildings]);

  const glowPct = Math.round(25 + percent * 55);
  const ringPct = Math.round(15 + percent * 55);
  const wrapSize = size * 1.9;

  return (
    <div className="relative shrink-0" style={{ width: wrapSize, height: wrapSize }}>
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl"
        style={{
          width: size * 1.4,
          height: size * 1.4,
          background: `radial-gradient(circle, color-mix(in srgb, var(--color-cyan-glow) ${glowPct}%, transparent) 0%, transparent 72%)`,
        }}
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
        style={{
          width: wrapSize,
          height: size * 0.42,
          borderColor: `color-mix(in srgb, var(--color-gold-glow) ${ringPct}%, transparent)`,
          transform: "translate(-50%, -50%) rotate(-14deg)",
        }}
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow overflow-hidden rounded-full"
        style={{
          width: size,
          height: size,
          background:
            "radial-gradient(circle at 34% 30%, color-mix(in srgb, var(--color-cyan-glow) 45%, var(--color-space-600)) 0%, var(--color-space-800) 72%)",
          boxShadow: `0 0 ${18 + percent * 36}px color-mix(in srgb, var(--color-cyan-glow) ${glowPct}%, transparent)`,
        }}
        aria-hidden
      >
        <div
          className="absolute inset-0 opacity-40"
          style={{
            background:
              "repeating-linear-gradient(100deg, transparent 0px, transparent 10px, rgba(0,0,0,0.25) 10px, rgba(0,0,0,0.25) 14px)",
          }}
        />
      </div>
      {percent > 0.25 && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 animate-orbit" style={{ width: wrapSize, height: wrapSize }} aria-hidden>
          <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-mint-glow shadow-[0_0_6px_var(--color-mint-glow)]" />
        </div>
      )}
    </div>
  );
}
