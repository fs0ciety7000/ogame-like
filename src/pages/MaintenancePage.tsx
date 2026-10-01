import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { KeyRound, LogOut } from "lucide-react";
import { GameIcon } from "@/components/ui/game-icon";
import { HudTag } from "@/components/ui/hud";
import { assetUrl } from "@/lib/assets";
import { useNowTicker } from "@/hooks/useNowTicker";
import { maintenanceProgress, maintenanceRemainingMs, DEFAULT_MAINTENANCE_MESSAGE, type MaintenanceState } from "@/game/maintenance";
import { cn } from "@/lib/utils";

/* Page affichée aux joueurs pendant la maintenance (v2.5) : illustration
   de l'opérateur en fond, compte à rebours, journal technique animé. */

const LOG_LINES = [
  "Sauvegarde des secteurs galactiques",
  "Gel des files de construction",
  "Recalibrage des réacteurs instables",
  "Mise à jour des protocoles de flotte",
  "Diagnostic des boucliers planétaires",
  "Synchronisation des archives",
  "Contrôle d'intégrité des données",
  "Mise en quarantaine des signaux pirates",
];

function pad(n: number) {
  return String(n).padStart(2, "0");
}

/** Chiffre qui défile vers le haut à chaque changement. */
function RollingDigits({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="hud-cut-sm relative flex overflow-hidden border border-cyan-glow/30 bg-space-950/80 px-2 py-1.5 shadow-[0_0_24px_-8px_var(--color-cyan-glow)] sm:px-3">
        {value.split("").map((d, i) => (
          <span key={i} className="relative inline-block h-[1.15em] w-[0.62em] overflow-hidden font-mono text-4xl font-bold tabular-nums text-white sm:text-6xl">
            <AnimatePresence initial={false} mode="popLayout">
              <motion.span
                key={d}
                initial={{ y: "-100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className="absolute inset-0 text-center"
              >
                {d}
              </motion.span>
            </AnimatePresence>
          </span>
        ))}
        <span aria-hidden className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/50" />
      </div>
      <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">{label}</span>
    </div>
  );
}

/** Anneau de progression avec couronne graduée qui tourne. */
function ProgressRing({ progress }: { progress: number | null }) {
  const reduce = useReducedMotion();
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative grid h-36 w-36 shrink-0 place-items-center sm:h-44 sm:w-44">
      <motion.svg
        viewBox="0 0 140 140"
        className="absolute inset-0 h-full w-full"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <circle cx="70" cy="70" r="66" fill="none" stroke="var(--color-cyan-glow)" strokeOpacity="0.35" strokeWidth="1" strokeDasharray="2 6" />
        <circle cx="70" cy="70" r="61" fill="none" stroke="var(--color-violet-glow)" strokeOpacity="0.4" strokeWidth="2" strokeDasharray="40 20 6 20" />
      </motion.svg>
      <svg viewBox="0 0 140 140" className="absolute inset-0 h-full w-full -rotate-90">
        <circle cx="70" cy="70" r={r} fill="none" stroke="white" strokeOpacity="0.06" strokeWidth="8" />
        <motion.circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="url(#mt-ring)"
          strokeWidth="8"
          strokeLinecap="butt"
          strokeDasharray={c}
          animate={{ strokeDashoffset: progress === null ? c * 0.72 : c * (1 - progress) }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          style={progress === null && !reduce ? { animation: "spin 2.4s linear infinite", transformOrigin: "center" } : undefined}
        />
        <defs>
          <linearGradient id="mt-ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--color-cyan-glow)" />
            <stop offset="100%" stopColor="var(--color-mint-glow)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="relative text-center">
        <motion.div animate={reduce ? undefined : { rotate: [0, 0, 180, 180] }} transition={{ duration: 6, repeat: Infinity, times: [0, 0.4, 0.6, 1] }}>
          <GameIcon name="repair" className="mx-auto h-10 w-10 drop-shadow-[0_0_8px_rgba(255,122,69,0.6)]" />
        </motion.div>
        <p className="mt-1 font-mono text-lg font-bold tabular-nums text-white">{progress === null ? "···" : `${Math.floor(progress * 100)} %`}</p>
      </div>
    </div>
  );
}

/** Journal technique : lignes tapées une à une, en boucle. */
function TerminalLog() {
  const reduce = useReducedMotion();
  const [line, setLine] = useState(0);
  const [chars, setChars] = useState(0);
  const text = LOG_LINES[line % LOG_LINES.length];
  useEffect(() => {
    if (reduce) return;
    const done = chars >= text.length;
    const t = setTimeout(
      () => {
        if (done) {
          setLine((l) => l + 1);
          setChars(0);
        } else setChars((n) => n + 1);
      },
      done ? 1400 : 28 + Math.random() * 40,
    );
    return () => clearTimeout(t);
  }, [chars, text, reduce]);
  const shown = Math.min(3, line);
  const history = Array.from({ length: shown }, (_, i) => LOG_LINES[(line - shown + i) % LOG_LINES.length]);
  return (
    <div className="hud-cut-sm border border-white/[0.07] bg-black/45 px-3 py-2.5 font-mono text-[11px] leading-relaxed backdrop-blur-sm">
      <div className="mb-2 flex items-center gap-2 border-b border-white/[0.06] pb-2">
        <img src={assetUrl("/assets/maintenance/operator-avatar.webp")} alt="" className="h-8 w-8 rounded-full border border-cyan-glow/40 object-cover shadow-[0_0_10px_-2px_var(--color-cyan-glow)]" />
        <span className="uppercase tracking-[0.16em] text-slate-300">Opérateur K-7</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] uppercase tracking-[0.16em] text-mint-glow">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-mint-glow" /> en intervention
        </span>
      </div>
      {history.map((l, i) => (
        <p key={`${line}-${i}`} className="truncate text-slate-500">
          <span className="text-mint-glow">✓</span> {l} <span className="text-mint-glow/70">· OK</span>
        </p>
      ))}
      <p className="mt-caret truncate text-cyan-glow">
        <span className="text-gold-glow">›</span> {reduce ? text : text.slice(0, chars)}
      </p>
    </div>
  );
}

/** Étincelles qui tombent d'un point (soudure en cours). */
function Sparks() {
  const sparks = useMemo(
    () =>
      Array.from({ length: 14 }, (_, i) => ({
        x: `${Math.round((Math.random() - 0.5) * 120)}px`,
        y: `${Math.round(60 + Math.random() * 120)}px`,
        d: `${(1.2 + Math.random() * 1.8).toFixed(2)}s`,
        delay: `${(i * 0.23).toFixed(2)}s`,
      })),
    [],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute right-[22%] top-[38%] hidden lg:block">
      {sparks.map((s, i) => (
        <span key={i} className="mt-spark" style={{ "--x": s.x, "--y": s.y, "--d": s.d, "--delay": s.delay } as React.CSSProperties} />
      ))}
    </div>
  );
}

export function MaintenancePage({
  state,
  onAdminAccess,
  account,
  onLogout,
}: {
  state: MaintenanceState;
  onAdminAccess?: () => void;
  /** Joueur connecté (non administrateur). */
  account?: string | null;
  onLogout?: () => void;
}) {
  useNowTicker();
  const reduce = useReducedMotion();
  const now = Date.now();
  const remaining = maintenanceRemainingMs(state, now);
  const progress = maintenanceProgress(state, now);
  const [imageOk, setImageOk] = useState(true);
  const total = Math.floor((remaining ?? Math.max(0, now - state.startedAtMs)) / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const reopen = state.endsAtMs ? new Date(state.endsAtMs).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : null;
  const overdue = remaining === 0;

  return (
    <div className="relative min-h-screen overflow-hidden bg-space-950 text-slate-200">
      {/* Illustration de fond (format paysage / portrait). */}
      <div aria-hidden className="absolute inset-0">
        {imageOk && (
          <picture>
            <source media="(max-width: 767px)" srcSet={assetUrl("/assets/maintenance/operator-portrait.webp")} />
            <img
              src={assetUrl("/assets/maintenance/operator.webp")}
              alt=""
              onError={() => setImageOk(false)}
              className="mt-kenburns absolute inset-0 h-full w-full object-cover object-[62%_center] max-md:object-[50%_15%]"
            />
          </picture>
        )}
        {!imageOk && (
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_40%,color-mix(in_srgb,var(--color-violet-glow)_22%,transparent),transparent_55%),radial-gradient(ellipse_at_20%_80%,color-mix(in_srgb,var(--color-cyan-glow)_14%,transparent),transparent_50%)]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-space-950 via-space-950/80 to-space-950/10 max-md:bg-gradient-to-t max-md:from-space-950 max-md:via-space-950/85 max-md:to-space-950/20" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:100%_3px]" />
        <div className="mt-beam absolute inset-x-0 top-0 h-40" />
        <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(0,0,0,0.85)]" />
      </div>
      <Sparks />

      {/* Rubans de chantier. */}
      <div aria-hidden className="mt-hazard absolute inset-x-0 top-0 h-2 opacity-80" />
      <div aria-hidden className="mt-hazard absolute inset-x-0 bottom-0 h-2 opacity-80" />

      <main className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col justify-end gap-6 px-4 pb-10 pt-8 sm:px-8 md:justify-center md:py-16">
        <motion.header
          initial={reduce ? false : { opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center gap-3"
        >
          <img src={assetUrl("/assets/logo/logo.webp")} alt="" className="h-10 w-10 object-contain drop-shadow-[0_0_10px_rgba(75,232,255,0.35)]" />
          <div className="leading-none">
            <p className="font-display text-base font-bold uppercase tracking-[0.16em] text-white">Cosmic</p>
            <p className="font-display text-[10px] font-semibold uppercase tracking-[0.42em] text-cyan-glow">Empires</p>
          </div>
        </motion.header>

        <motion.section
          initial={reduce ? false : "hidden"}
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.12, delayChildren: 0.15 } } }}
          className="flex max-w-2xl flex-col gap-5"
        >
          <motion.div variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }} className="flex flex-wrap items-center gap-2">
            <HudTag tone="ember">
              <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-ember-glow align-middle shadow-[0_0_6px_var(--color-ember-glow)]" />
              Maintenance en cours
            </HudTag>
            {state.version && <HudTag tone="accent">Mise à jour v{state.version}</HudTag>}
          </motion.div>

          <motion.h1
            variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } }}
            data-text="Systèmes en maintenance"
            className="mt-glitch hud-title text-4xl leading-[1.05] text-white sm:text-6xl"
          >
            Systèmes en maintenance
          </motion.h1>

          <motion.p variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="max-w-xl whitespace-pre-line text-[15px] leading-relaxed text-slate-300">
            {state.message || DEFAULT_MAINTENANCE_MESSAGE}
          </motion.p>

          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="flex flex-wrap items-center gap-5 sm:gap-7">
            <ProgressRing progress={overdue ? 1 : progress} />
            <div>
              <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.3em] text-cyan-glow/80">
                {remaining === null ? "En cours depuis" : overdue ? "Finalisation en cours" : "Réouverture dans"}
              </p>
              <div className={cn("flex items-start gap-1.5 sm:gap-2.5", overdue && "animate-pulse")}>
                <RollingDigits value={pad(h)} label="h" />
                <span className="pt-2 font-mono text-3xl text-cyan-glow/60 sm:pt-3 sm:text-5xl">:</span>
                <RollingDigits value={pad(m)} label="min" />
                <span className="pt-2 font-mono text-3xl text-cyan-glow/60 sm:pt-3 sm:text-5xl">:</span>
                <RollingDigits value={pad(s)} label="s" />
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {overdue
                  ? "Dernières vérifications : le jeu rouvre dans quelques instants."
                  : reopen
                    ? `Réouverture prévue vers ${reopen}. La page se recharge toute seule.`
                    : "Durée indéterminée : la page se recharge toute seule à la réouverture."}
              </p>
            </div>
          </motion.div>

          <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
            <TerminalLog />
          </motion.div>

          <motion.ul variants={{ hidden: { opacity: 0 }, show: { opacity: 1 } }} className="grid gap-2 text-xs text-slate-300 sm:grid-cols-3">
            {[
              { icon: "storage" as const, text: "Progression sauvegardée" },
              { icon: "build" as const, text: "Production maintenue" },
              { icon: "threat" as const, text: "Factions en pause, ultimatums prolongés" },
            ].map((it) => (
              <li key={it.icon} className="flex items-center gap-2 border-l-2 border-mint-glow/50 bg-white/[0.03] px-2.5 py-2">
                <GameIcon name={it.icon} className="h-6 w-6" />
                {it.text}
              </li>
            ))}
          </motion.ul>
        </motion.section>

        <footer className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-slate-500">
          {account ? (
            <>
              <span>
                Connecté : <strong className="text-slate-300">{account}</strong> (accès réservé aux administrateurs pendant la maintenance)
              </span>
              {onLogout && (
                <button type="button" onClick={onLogout} className="inline-flex items-center gap-1 text-slate-400 underline-offset-4 hover:text-cyan-glow hover:underline">
                  <LogOut className="h-3.5 w-3.5" /> Se déconnecter
                </button>
              )}
            </>
          ) : (
            onAdminAccess && (
              <button type="button" onClick={onAdminAccess} className="inline-flex items-center gap-1 text-slate-500 underline-offset-4 hover:text-cyan-glow hover:underline">
                <KeyRound className="h-3.5 w-3.5" /> Accès administrateur
              </button>
            )
          )}
        </footer>
      </main>
    </div>
  );
}

/** Écran bref affiché quand la maintenance se termine, avant rechargement. */
export function MaintenanceOver() {
  return (
    <div className="fixed inset-0 z-[200] grid place-items-center bg-space-950/95 backdrop-blur">
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center gap-3 text-center">
        <GameIcon name="shield" className="h-16 w-16 drop-shadow-[0_0_14px_rgba(75,232,255,0.6)]" />
        <p className="hud-title text-2xl text-white">Systèmes rétablis</p>
        <p className="font-mono text-xs uppercase tracking-[0.3em] text-cyan-glow">Reconnexion au poste de commandement…</p>
      </motion.div>
    </div>
  );
}
