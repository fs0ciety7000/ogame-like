import { useEffect, useState } from "react";

/** Force un re-render chaque seconde, pour les décomptes en direct. */
export function useNowTicker() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
}
