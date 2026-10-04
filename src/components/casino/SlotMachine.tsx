import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Cherry, Skull, Star } from "lucide-react";
import { SLOT_SYMBOLS, type SlotSymbol } from "@/game/casino";
import { Button } from "@/components/ui/button";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { cn } from "@/lib/utils";

/* =====================================================
   Machine à sous « 777 » du Casino orbital : trois rouleaux qui défilent
   et s'arrêtent l'un après l'autre sur le résultat tiré par le serveur,
   ligne de paiement au centre, levier animé, lumières qui courent.
===================================================== */

/** Symbole dessiné (pas d'emoji : même rendu partout). */
export function SlotSymbolView({ symbol, size = 64 }: { symbol: SlotSymbol; size?: number }) {
  switch (symbol) {
    case "seven":
      return (
        <span className="slot-seven font-display font-black leading-none" style={{ fontSize: size * 0.95 }}>
          7
        </span>
      );
    case "bar":
      return (
        <span className="slot-bar hud-cut-sm font-display font-black tracking-[0.08em]" style={{ fontSize: size * 0.28, padding: `${size * 0.06}px ${size * 0.12}px` }}>
          BAR
        </span>
      );
    case "star":
      return <Star className="slot-star" style={{ width: size * 0.8, height: size * 0.8 }} />;
    case "cherry":
      return <Cherry className="slot-cherry" style={{ width: size * 0.78, height: size * 0.78 }} />;
    case "skull":
      return <Skull className="slot-skull" style={{ width: size * 0.66, height: size * 0.66 }} />;
    case "planet":
      return (
        <svg viewBox="0 0 64 64" className="slot-planet" style={{ width: size * 0.82, height: size * 0.82 }} aria-hidden>
          <defs>
            <radialGradient id="slot-planet-g" cx="38%" cy="35%" r="70%">
              <stop offset="0%" stopColor="color-mix(in srgb, var(--th-accent2) 35%, var(--th-text-100))" />
              <stop offset="50%" stopColor="var(--th-accent2)" />
              <stop offset="100%" stopColor="var(--th-space-950)" />
            </radialGradient>
          </defs>
          <ellipse cx="32" cy="34" rx="29" ry="8" fill="none" stroke="var(--th-gold)" strokeWidth="2.5" opacity="0.5" transform="rotate(-18 32 34)" />
          <circle cx="32" cy="32" r="17" fill="url(#slot-planet-g)" />
          <path d="M5 39 Q32 50 59 29" fill="none" stroke="var(--th-gold)" strokeWidth="2.5" transform="rotate(-6 32 34)" />
        </svg>
      );
  }
}

const ALL = SLOT_SYMBOLS.map((s) => s.id);
const randomSymbol = () => ALL[Math.floor(Math.random() * ALL.length)];

function Reel({ target, spinKey, index, cell, onStop }: { target: SlotSymbol[]; spinKey: number; index: number; cell: number; onStop: (i: number) => void }) {
  const reduce = useReducedMotion();
  // Bande : les symboles visibles avant, un long défilé, puis la cible (dessus, centre, dessous).
  const strip = useMemo(() => {
    if (spinKey === 0) return target;
    const filler = Array.from({ length: reduce ? 3 : 18 + index * 7 }, randomSymbol);
    return [...filler, ...target];
    // eslint-disable-next-line react-hooks/exhaustive-deps -- une nouvelle bande seulement à chaque tirage
  }, [spinKey]);
  const end = -(strip.length - 3) * cell;
  const duration = reduce ? 0.2 : 1.25 + index * 0.45;
  // Arrêt annoncé à la fin prévue du défilé (plus fiable que la fin d'animation).
  const stopRef = useRef(onStop);
  stopRef.current = onStop;
  useEffect(() => {
    if (spinKey === 0) return;
    const id = window.setTimeout(() => stopRef.current(index), duration * 1000);
    return () => window.clearTimeout(id);
  }, [spinKey, index, duration]);
  return (
    <div className="slot-reel" style={{ height: cell * 3, width: cell * 1.18 }}>
      <motion.div
        key={spinKey}
        initial={{ y: 0, filter: "blur(0px)" }}
        animate={{ y: end, filter: reduce ? "blur(0px)" : ["blur(0px)", "blur(3px)", "blur(3px)", "blur(0px)"] }}
        transition={{ y: { duration, ease: [0.12, 0.8, 0.28, 1.04] }, filter: { duration, times: [0, 0.15, 0.75, 1] } }}
      >
        {strip.map((s, i) => (
          <div key={i} className="grid place-items-center" style={{ height: cell }}>
            <SlotSymbolView symbol={s} size={cell * 0.78} />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

export interface SlotMachineProps {
  /** Symboles de la ligne centrale (résultat). */
  reels: SlotSymbol[];
  spinKey: number;
  spinning: boolean;
  /** Gain affiché sur la ligne : allume la machine. */
  win: "none" | "small" | "jackpot";
  tokens: number;
  jackpotLabel: React.ReactNode;
  onPull: () => void;
  onReelStop: (i: number) => void;
  disabled: boolean;
}

export function SlotMachine({ reels, spinKey, spinning, win, tokens, jackpotLabel, onPull, onReelStop, disabled }: SlotMachineProps) {
  const [cell, setCell] = useState(88);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 520px)");
    const set = () => setCell(mq.matches ? 64 : 88);
    set();
    mq.addEventListener("change", set);
    return () => mq.removeEventListener("change", set);
  }, []);
  // Dessus et dessous de la ligne : tirés au hasard à chaque tirage.
  const columns = useMemo(() => reels.map((c) => [randomSymbol(), c, randomSymbol()]), [reels]);

  return (
    <div className={cn("slot-cabinet", spinning && "slot-cabinet-spinning", win === "jackpot" && "slot-cabinet-jackpot", win === "small" && "slot-cabinet-win")}>
      <div className="slot-lights" aria-hidden>
        {Array.from({ length: 22 }, (_, i) => (
          <i key={i} style={{ animationDelay: `${(i % 2) * 0.35}s` }} />
        ))}
      </div>
      <div className="slot-marquee">
        <p className="slot-title">Casino orbital</p>
        <div className="slot-jackpot">
          <span className="hud-eyebrow text-[10px] text-slate-400">Gros lot 7 · 7 · 7</span>
          <span className="slot-led">{jackpotLabel}</span>
        </div>
      </div>

      <div className="slot-body">
        <div className="slot-window">
          {columns.map((col, i) => (
            <Reel key={i} target={col} spinKey={spinKey} index={i} cell={cell} onStop={onReelStop} />
          ))}
          <span className="slot-payline" aria-hidden />
          <span className="slot-arrow slot-arrow-left" aria-hidden />
          <span className="slot-arrow slot-arrow-right" aria-hidden />
        </div>

        <button type="button" className={cn("slot-lever", spinning && "slot-lever-pulled")} onClick={onPull} disabled={disabled} aria-label="Tirer le levier">
          <span className="slot-lever-stick" />
          <span className="slot-lever-ball" />
        </button>
      </div>

      <div className="slot-console">
        <div className="slot-credits">
          <span className="hud-eyebrow text-[10px] text-slate-400">Jetons</span>
          <span className="slot-led">
            <TokenIcon size={18} />
            {String(tokens).padStart(2, "0")}
          </span>
        </div>
        <Button size="lg" className="slot-spin" onClick={onPull} disabled={disabled}>
          {spinning ? "Ça tourne…" : "Tirer"}
          <small>1 jeton · Espace</small>
        </Button>
      </div>
      <div className="slot-lights slot-lights-bottom" aria-hidden>
        {Array.from({ length: 22 }, (_, i) => (
          <i key={i} style={{ animationDelay: `${((i + 1) % 2) * 0.35}s` }} />
        ))}
      </div>
    </div>
  );
}
