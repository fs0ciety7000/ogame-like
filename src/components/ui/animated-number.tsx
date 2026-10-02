import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/** Anime un nombre entre ses valeurs successives au lieu de le faire "sauter"
 *  à chaque mise à jour (ressources en temps réel, XP, puissances...). */
export function AnimatedNumber({
  value,
  format = (v) => String(Math.floor(v)),
  className,
  countUp = false,
}: {
  value: number;
  format?: (value: number) => string;
  className?: string;
  /** v4.8 : compte depuis 0 à l'apparition (statistiques mises en scène). */
  countUp?: boolean;
}) {
  const motionValue = useMotionValue(countUp ? 0 : value);
  const [display, setDisplay] = useState(() => format(countUp ? 0 : value));
  const previous = useRef(countUp ? 0 : value);
  const first = useRef(countUp);

  useMotionValueEvent(motionValue, "change", (latest) => setDisplay(format(latest)));

  useEffect(() => {
    // Une variation énorme (première charge, changement de compte) doit
    // s'afficher immédiatement plutôt que de compter depuis 0.
    const jump = Math.abs(value - previous.current);
    const controls = animate(motionValue, value, {
      duration: first.current ? 1.2 : jump > 10000 ? 0 : 0.6,
      ease: "easeOut",
    });
    first.current = false;
    previous.current = value;
    return () => controls.stop();
  }, [value, motionValue]);

  return <span className={className}>{display}</span>;
}
