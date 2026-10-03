import { useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { Minus, Plus } from "lucide-react";
import { formatDecimal, formatInt, formatShort } from "@/game/format";
import { cn } from "@/lib/utils";

/* v5.6 : champ numérique commun à tout le jeu (quantités d'unités, montants,
   réglages admin). Le 0 par défaut s'efface au clic, la saisie est bornée
   en direct (MIN / MAX), − / + se maintiennent pour accélérer, flèches du
   clavier (Maj : ×10), raccourcis « 10k » / « 2,5M », milliers espacés hors
   saisie. Champ texte (inputMode numérique) : pas de flèches natives ni de
   valeur changée par la molette. */

/** Lit une saisie : « 12 500 », « 2,5k », « 3M », « -4 ». null si vide ou illisible. */
export function parseNumberDraft(raw: string, decimals = 0): number | null {
  const s = raw.replace(/[\s\u202f\u00a0_]/g, "").replace(",", ".").toLowerCase();
  if (!s || s === "-" || s === ".") return null;
  const m = /^(-?\d*\.?\d*)([km]?)$/.exec(s);
  if (!m || m[1] === "" || m[1] === "-") return null;
  const n = Number(m[1]) * (m[2] === "k" ? 1e3 : m[2] === "m" ? 1e6 : 1);
  if (!Number.isFinite(n)) return null;
  const f = 10 ** decimals;
  return Math.round(n * f) / f;
}

/** Garde les caractères utiles pendant la saisie. */
function sanitize(raw: string, decimals: number, negative: boolean): string {
  let s = raw.replace(/[^\d.,kKmM\s\u202f\u00a0-]/g, "");
  if (!negative) s = s.replace(/-/g, "");
  else s = s.replace(/(?!^)-/g, "");
  return s;
}

function display(value: number, decimals: number): string {
  return decimals > 0 ? formatDecimal(value, decimals) : formatInt(value);
}

type Base = {
  min?: number;
  max?: number;
  step?: number;
  /** Chiffres après la virgule acceptés (0 : entiers). */
  decimals?: number;
  size?: "sm" | "md";
  /** Boutons − / + (oui par défaut). */
  stepper?: boolean;
  /** Boutons MIN / MAX (par défaut : dès qu'un maximum existe). */
  quick?: boolean;
  /** Raccourcis sous forme de puces (×1, ×10…). */
  presets?: number[];
  /** Fine jauge valeur / maximum sous le champ (par défaut : dès qu'un maximum existe). */
  meter?: boolean;
  suffix?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  autoFocus?: boolean;
  "aria-label"?: string;
  title?: string;
  /** Appelé à la sortie du champ ou sur Entrée (sauvegarde différée). */
  onCommit?: (value: number | undefined) => void;
};

export type NumberInputProps = Base &
  (
    | { nullable?: false; value: number | null | undefined; onChange?: (value: number) => void }
    | { nullable: true; value: number | null | undefined; onChange?: (value: number | undefined) => void }
  );

export function NumberInput(props: NumberInputProps) {
  const { min = 0, max, step = 1, decimals = 0, size = "md", stepper = true, presets, suffix, placeholder, disabled, className, id, autoFocus, title, onCommit } = props;
  const nullable = props.nullable === true;
  const hasMax = max !== undefined && Number.isFinite(max);
  const top = hasMax ? Math.max(min, max as number) : Infinity;
  // MIN (remise à zéro) dès que la place le permet ; MAX seulement s'il existe un maximum.
  const quick = props.quick ?? true;
  const meter = props.meter ?? (hasMax && top > min);
  const value = props.value ?? undefined;
  const shown = value ?? (nullable ? undefined : min);

  const [draft, setDraft] = useState<string | null>(null);
  const [flash, setFlash] = useState(0);
  const current = useRef<number | undefined>(shown);
  current.current = shown;
  const timers = useRef<{ t?: ReturnType<typeof setTimeout>; i?: ReturnType<typeof setInterval> }>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const clamp = (v: number) => Math.min(top, Math.max(min, v));
  const emit = (v: number | undefined) => {
    current.current = v;
    (props.onChange as ((x: number | undefined) => void) | undefined)?.(v);
  };
  const bump = () => setFlash((f) => f + 1);
  const editing = () => inputRef.current !== null && inputRef.current === document.activeElement;
  /** Valeur posée par un bouton : suit aussi le texte si le champ est en cours d'édition. */
  const put = (v: number) => {
    if (v !== current.current) emit(v);
    if (editing()) setDraft(display(v, decimals).replace(/\u202f/g, ""));
  };

  const stop = () => {
    clearTimeout(timers.current.t);
    clearInterval(timers.current.i);
    timers.current = {};
  };
  useEffect(() => () => stop(), []);

  const stepBy = (delta: number) => {
    const base = current.current ?? min;
    const next = clamp(Math.round((base + delta) * 10 ** decimals) / 10 ** decimals);
    if (next === base && ((delta > 0 && base >= top) || (delta < 0 && base <= min))) bump();
    put(next);
  };

  /** Appui maintenu : une fois, puis répétition qui accélère. */
  const hold = (dir: 1 | -1) => {
    if (disabled) return;
    stop();
    stepBy(dir * step);
    let ticks = 0;
    timers.current.t = setTimeout(() => {
      timers.current.i = setInterval(() => {
        ticks += 1;
        const mult = ticks > 40 ? 100 : ticks > 15 ? 10 : 1;
        stepBy(dir * step * mult);
      }, 70);
    }, 380);
  };

  const onText = (raw: string) => {
    const s = sanitize(raw, decimals, min < 0);
    const n = parseNumberDraft(s, decimals);
    if (n === null) {
      setDraft(s);
      if (s.trim() === "") emit(nullable ? undefined : min);
      return;
    }
    if (n > top) {
      setDraft(display(top, decimals).replace(/\u202f/g, ""));
      emit(top);
      bump();
      return;
    }
    setDraft(/[km]/i.test(s) ? String(n).replace(".", ",") : s);
    // En dessous du minimum (min = 1 et champ vidé) : la valeur suit, bornée à la sortie.
    emit(n < min ? min : n);
  };

  const finish = () => {
    stop();
    const s = draft;
    setDraft(null);
    if (s === null) return;
    const n = parseNumberDraft(s, decimals);
    const final = n === null ? (nullable ? undefined : min) : clamp(n);
    if (final !== current.current) emit(final);
    onCommit?.(final);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    const k = e.key;
    if (k === "ArrowUp" || k === "ArrowDown" || k === "PageUp" || k === "PageDown") {
      e.preventDefault();
      const mult = k.startsWith("Page") ? 100 : e.shiftKey ? 10 : 1;
      stepBy((k === "ArrowUp" || k === "PageUp" ? 1 : -1) * step * mult);
    } else if (k === "Enter") {
      finish();
      inputRef.current?.select();
    } else if (k === "Escape" && draft !== null) {
      e.stopPropagation();
      inputRef.current?.blur();
    }
  };

  const atMin = (shown ?? min) <= min;
  const atMax = hasMax && (shown ?? min) >= top;
  const ratio = meter && top > min ? Math.min(1, Math.max(0, ((shown ?? min) - min) / (top - min))) : 0;
  const sm = size === "sm";
  // Montants gigantesques (milliers de milliards) : forme courte hors saisie (« 95,2 Md »), valeur exacte au survol et en saisie.
  const huge = shown !== undefined && Math.abs(shown) >= 1e12;
  const text = draft ?? (shown === undefined ? "" : huge ? formatShort(shown) : display(shown, decimals));
  const btn = cn(
    "grid shrink-0 place-items-center text-slate-500 transition-colors select-none touch-manipulation",
    "hover:bg-cyan-glow/10 hover:text-cyan-glow active:bg-cyan-glow/20 disabled:pointer-events-none disabled:opacity-30",
    sm ? "w-7" : "w-9",
  );
  const chip = cn(
    "shrink-0 px-1.5 font-mono tracking-[0.12em] transition-colors select-none hover:bg-cyan-glow/10 hover:text-cyan-glow disabled:pointer-events-none disabled:opacity-30",
    sm ? "text-[9px]" : "text-[10px]",
  );

  // MIN seulement si le champ est assez large pour garder le chiffre lisible.
  const wideOnly = stepper ? "hidden items-center @min-[15rem]:flex" : "hidden items-center @min-[11rem]:flex";

  return (
    // Conteneur interrogé : dans une case étroite, MIN s'efface pour laisser la place au chiffre (MAX reste).
    <div className={cn("@container inline-flex min-w-0 flex-col gap-1.5", className)}>
      <div
        className={cn(
          "group relative flex min-w-0 items-stretch overflow-hidden border bg-space-900/80 transition-[border-color,box-shadow]",
          sm ? "h-8" : "h-10",
          disabled ? "border-white/10 opacity-50" : "border-cyan-glow/20 hover:border-cyan-glow/40 focus-within:border-cyan-glow/70 focus-within:shadow-[0_0_0_3px_rgba(34,211,238,0.12)]",
        )}
      >
        {flash > 0 && <i key={flash} aria-hidden className="number-input-bump pointer-events-none absolute inset-0 z-10" />}
        {stepper && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Diminuer"
            disabled={disabled || atMin}
            className={cn(btn, "border-r border-white/5")}
            onPointerDown={(e) => {
              e.preventDefault();
              hold(-1);
            }}
            onPointerUp={stop}
            onPointerLeave={stop}
            onPointerCancel={stop}
          >
            <Minus className={sm ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </button>
        )}
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode={decimals > 0 ? "decimal" : "numeric"}
          autoComplete="off"
          spellCheck={false}
          role="spinbutton"
          aria-valuemin={min}
          aria-valuemax={hasMax ? top : undefined}
          aria-valuenow={shown}
          aria-label={props["aria-label"]}
          title={title ?? (huge && draft === null ? display(shown as number, decimals) : undefined)}
          autoFocus={autoFocus}
          disabled={disabled}
          placeholder={placeholder ?? (nullable ? "" : display(min, decimals))}
          value={text}
          onFocus={(e) => {
            // Le 0 (ou le minimum) par défaut disparaît : on tape directement.
            const v = current.current;
            setDraft(v === undefined || (!nullable && v === min && min === 0) ? "" : display(v, decimals).replace(/\u202f/g, ""));
            const el = e.currentTarget;
            requestAnimationFrame(() => el.select());
          }}
          onBlur={finish}
          onChange={(e) => onText(e.target.value)}
          onKeyDown={onKey}
          className={cn(
            "min-w-0 flex-1 bg-transparent px-1.5 text-center font-mono tabular-nums text-slate-100 outline-none placeholder:text-slate-600",
            // Longs nombres : un cran plus petit pour rester entiers dans les cases étroites.
            text.length > 8 ? (sm ? "text-[11px] tracking-tight" : "text-xs tracking-tight") : sm ? "text-xs" : "text-sm",
            atMax && meter && !disabled && "text-gold-glow",
          )}
        />
        {suffix && <span className={cn("flex shrink-0 items-center pr-2 font-mono text-slate-500", sm ? "text-[10px]" : "text-xs")}>{suffix}</span>}
        {stepper && (
          <button
            type="button"
            tabIndex={-1}
            aria-label="Augmenter"
            disabled={disabled || atMax}
            className={cn(btn, "border-l border-white/5")}
            onPointerDown={(e) => {
              e.preventDefault();
              hold(1);
            }}
            onPointerUp={stop}
            onPointerLeave={stop}
            onPointerCancel={stop}
          >
            <Plus className={sm ? "h-3 w-3" : "h-3.5 w-3.5"} />
          </button>
        )}
        {quick && (
          <span className={cn("shrink-0 border-l border-white/5", hasMax ? "flex" : wideOnly)}>
            <button type="button" tabIndex={-1} disabled={disabled || atMin} className={cn(chip, "border-r border-white/5 text-slate-500", wideOnly)} onClick={() => put(min)} title={`Minimum : ${display(min, decimals)}`}>
              MIN
            </button>
            {hasMax && (
              <button type="button" tabIndex={-1} disabled={disabled || atMax} className={cn(chip, "text-cyan-glow/80")} onClick={() => put(top)} title={`Maximum : ${display(top, decimals)}`}>
                MAX
              </button>
            )}
          </span>
        )}
        {meter && (
          <i
            aria-hidden
            className="pointer-events-none absolute bottom-0 left-0 block h-[2px] transition-[width] duration-300 ease-out"
            style={{ width: `${ratio * 100}%`, background: atMax ? "var(--color-gold-glow)" : "linear-gradient(90deg, var(--color-cyan-glow), var(--color-mint-glow))" }}
          />
        )}
      </div>
      {presets && presets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => {
            const v = clamp(p);
            return (
              <button
                key={p}
                type="button"
                disabled={disabled}
                onClick={() => put(v)}
                className={cn(
                  "border px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] transition-colors disabled:opacity-40",
                  shown === v ? "border-cyan-glow/60 bg-cyan-glow/10 text-cyan-glow" : "border-cyan-glow/15 text-slate-400 hover:border-cyan-glow/50 hover:text-cyan-glow",
                )}
              >
                ×{formatInt(p)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
