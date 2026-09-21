import { useEffect, useState } from "react";

const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Effet de "décryptage" façon terminal SF : le texte se stabilise
 *  caractère par caractère au lieu d'apparaître d'un coup. Se rejoue à
 *  chaque changement de `text` (ex: changement de page). */
export function DecodeText({ text, duration = 280 }: { text: string; duration?: number }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    let raf: number;
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const revealCount = Math.floor(progress * text.length);
      let out = "";
      for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        out += ch === " " || i < revealCount ? ch : CHARS[Math.floor(Math.random() * CHARS.length)];
      }
      setDisplay(out);
      if (progress < 1) raf = requestAnimationFrame(tick);
      else setDisplay(text);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, duration]);

  return <span>{display}</span>;
}
