import { animate, useMotionValue, useMotionValueEvent } from "framer-motion";
import { useEffect, useRef, useState } from "react";

/** Anime un nombre entre ses valeurs successives au lieu de le faire "sauter"
 *  à chaque mise à jour (ressources en temps réel, XP, puissances...). */
export function AnimatedNumber({
  value,
  format = (v) => String(Math.floor(v)),
  className,
}: {
  value: number;
  format?: (value: number) => string;
  className?: string;
}) {
  const motionValue = useMotionValue(value);
  const [display, setDisplay] = useState(() => format(value));
  const previous = useRef(value);

  useMotionValueEvent(motionValue, "change", (latest) => setDisplay(format(latest)));

  useEffect(() => {
    // Une variation énorme (première charge, changement de compte) doit
    // s'afficher immédiatement plutôt que de compter depuis 0.
    const jump = Math.abs(value - previous.current);
    const controls = animate(motionValue, value, {
      duration: jump > 10000 ? 0 : 0.6,
      ease: "easeOut",
    });
    previous.current = value;
    return () => controls.stop();
  }, [value, motionValue]);

  return <span className={className}>{display}</span>;
}
