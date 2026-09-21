import { cn } from "@/lib/utils";

/** Mini courbe de tendance sans axes — pour un aperçu d'évolution en un
 *  coup d'œil dans un espace réduit (HUD, pastille de ressource...). */
export function Sparkline({
  values,
  width = 40,
  height = 14,
  color = "var(--color-cyan-glow)",
  className,
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => `${i * step},${height - ((v - min) / span) * height}`).join(" ");

  return (
    <svg width={width} height={height} className={cn("shrink-0 opacity-80", className)} aria-hidden>
      <polyline points={points} fill="none" stroke={color} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
