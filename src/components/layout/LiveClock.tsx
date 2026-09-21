import { useEffect, useState } from "react";

/** Horloge temps réel façon poste de contrôle (HH:MM:SS, police mono). */
export function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const time = now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  return <span className="tabular-mono text-xs text-slate-400">{time}</span>;
}
