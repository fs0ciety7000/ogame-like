import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Crown, History } from "lucide-react";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { assetUrl } from "@/lib/assets";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HudCallout, HudChip, EmptyState } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { SlotMachine, SlotSymbolView } from "@/components/casino/SlotMachine";
import { TournamentCard } from "@/components/casino/TournamentCard";
import { WeekRecap } from "@/components/casino/WeekRecap";
import { casinoOpen, dailyTokenReady, jackpotAmounts, jackpotOdds, nextCasinoOpening, OUTCOME_LABELS, playerCasino, type SlotSymbol, type SpinOutcome } from "@/game/casino";
import { claimDailyToken, spinSlot, useCasino, type SpinResult } from "@/services/casinoService";
import { useServerPot } from "@/services/serverPotService";
import { useAdminStatus } from "@/services/adminService";
import { Navigate } from "react-router-dom";
import { usePlayerStore } from "@/store/playerStore";
import { ignoreShortcut } from "@/lib/shortcuts";
import { playJackpot, playSlotPull, playSlotStop, playSlotWin } from "@/lib/sfx";
import { formatCompact, formatNumber } from "@/lib/utils";
import type { ResourceId } from "@/types/game";

/* v5.12 : Casino orbital — machine à sous « 777 » alimentée par le pot commun. */

function Gains({ resources, className }: { resources: Partial<Record<ResourceId, number>>; className?: string }) {
  const list = Object.entries(resources).filter(([, n]) => (n ?? 0) > 0);
  if (list.length === 0) return null;
  return (
    <span className={className ?? "inline-flex flex-wrap items-center gap-2 font-mono tabular-nums"}>
      {list.map(([res, n]) => (
        <span key={res} className="inline-flex items-center gap-1">
          <ResourceIcon id={res} className="h-4 w-4" /> {formatCompact(n ?? 0)}
        </span>
      ))}
    </span>
  );
}

const PAYTABLE: { combo: SlotSymbol[]; outcome: SpinOutcome }[] = [
  { combo: ["seven", "seven", "seven"], outcome: "jackpot" },
  { combo: ["star", "star", "star"], outcome: "star3" },
  { combo: ["planet", "planet", "planet"], outcome: "planet3" },
  { combo: ["bar", "bar", "bar"], outcome: "bar3" },
  { combo: ["cherry", "cherry", "cherry"], outcome: "cherry3" },
  { combo: ["seven", "seven", "skull"], outcome: "seven2" },
  { combo: ["cherry", "skull", "bar"], outcome: "cherry" },
];

function JackpotOverlay({ result, pseudo, onClose }: { result: SpinResult; pseudo: string; onClose: () => void }) {
  const reduce = useReducedMotion();
  const coins = useMemo(() => Array.from({ length: reduce ? 0 : 46 }, (_, i) => ({ id: i, x: Math.random() * 100, delay: Math.random() * 1.6, dur: 1.8 + Math.random() * 1.6, rot: (Math.random() - 0.5) * 720 })), [reduce]);
  return (
    <motion.div className="fixed inset-0 z-[80] grid place-items-center overflow-hidden bg-space-950/85 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal aria-label="Gros lot">
      {coins.map((c) => (
        <motion.span key={c.id} className="slot-coin" style={{ left: `${c.x}%` }} initial={{ y: -60, rotate: 0 }} animate={{ y: "110vh", rotate: c.rot }} transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: "easeIn" }}>
          <TokenIcon size={30} variant="art" />
        </motion.span>
      ))}
      <motion.div className="relative z-10 grid justify-items-center gap-3 text-center" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 220, damping: 14, delay: 0.15 }}>
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span key={i} initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 + i * 0.15, type: "spring", stiffness: 300 }}>
              <SlotSymbolView symbol="seven" size={110} />
            </motion.span>
          ))}
        </div>
        <p className="slot-title" style={{ fontSize: "clamp(32px, 8vw, 64px)" }}>
          Gros lot !
        </p>
        <p className="text-lg text-slate-200">
          Bravo <b className="text-gold-glow">{pseudo}</b>, le Casino orbital te verse :
        </p>
        <Gains resources={result.resources} className="flex flex-wrap items-center justify-center gap-4 font-mono text-2xl font-bold text-white tabular-nums" />
        <p className="text-xs text-slate-400">{result.fromPot ? "Pris dans le pot commun du serveur. Tout le monde est prévenu !" : "Le pot commun était vide : 12 h de production à la place."}</p>
        <Button size="lg" className="mt-2" onClick={onClose}>
          Encaisser
        </Button>
      </motion.div>
    </motion.div>
  );
}

export function CasinoPage() {
  const player = usePlayerStore((s) => s.player);
  const [casino, reloadCasino] = useCasino();
  const pot = useServerPot();
  const [reels, setReels] = useState<SlotSymbol[]>(["seven", "star", "cherry"]);
  const [spinKey, setSpinKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [win, setWin] = useState<"none" | "small" | "jackpot">("none");
  const [last, setLast] = useState<SpinResult | null>(null);
  const [showJackpot, setShowJackpot] = useState(false);
  const pending = useRef<SpinResult | null>(null);
  const stops = useRef(0);
  // Jetons renvoyés par le serveur, en attendant la mise à jour du profil.
  const [override, setOverride] = useState<{ tokens: number; base: string } | null>(null);

  const settings = casino?.settings;
  const adminStatus = useAdminStatus();
  const admin = adminStatus === true;
  const open = !!settings && casinoOpen(settings, Date.now());
  const mine = player ? playerCasino(player) : null;
  const base = JSON.stringify(player?.casino ?? null);
  const tokens = override && override.base === base ? override.tokens : (mine?.tokens ?? 0);
  const canSpin = (open || admin) && tokens > 0 && !busy;

  const pull = async () => {
    if (!canSpin) return;
    setBusy(true);
    setWin("none");
    setLast(null);
    try {
      playSlotPull();
      const r = await spinSlot();
      pending.current = r;
      stops.current = 0;
      setOverride({ tokens: r.tokens, base });
      setReels(r.reels);
      setSpinKey((k) => k + 1);
      // v5.14.2 : filet de sécurité — si un rouleau ne signale pas son arrêt, le tirage
      // se termine quand même (sinon le bouton restait grisé jusqu'au rechargement).
      window.setTimeout(() => {
        if (pending.current === r) for (let i = stops.current; i < 3; i++) onReelStopRef.current(i);
      }, 8000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tirage impossible.");
      setBusy(false);
    }
  };

  const onReelStop = (i: number) => {
    stops.current += 1;
    playSlotStop(i);
    if (stops.current < 3 || !pending.current) return;
    const r = pending.current;
    pending.current = null;
    setBusy(false);
    setLast(r);
    if (r.outcome === "jackpot") {
      setWin("jackpot");
      setShowJackpot(true);
      playJackpot();
    } else if (r.outcome !== "lose") {
      setWin("small");
      playSlotWin();
    }
    reloadCasino();
  };

  const onReelStopRef = useRef(onReelStop);
  onReelStopRef.current = onReelStop;

  // Espace : tirer (hors saisie).
  const pullRef = useRef(pull);
  pullRef.current = pull;
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" || ignoreShortcut(e)) return;
      e.preventDefault();
      void pullRef.current();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!player) return null;
  // Fermé : la page n'existe pas pour les joueurs (les administrateurs la voient toujours).
  if (casino && !open && adminStatus === false) return <Navigate to="/game" replace />;
  const now = Date.now();
  const nextOpen = settings ? nextCasinoOpening(settings, now) : null;
  const jackpot = pot && settings ? jackpotAmounts(pot, settings.jackpotShare) : {};
  const jackpotList = Object.entries(jackpot).filter(([, n]) => (n ?? 0) > 0).slice(0, 2);
  const daily = settings ? dailyTokenReady(player, settings, now) : false;

  const takeDaily = async () => {
    try {
      const r = await claimDailyToken();
      setOverride({ tokens: r.tokens, base });
      toast.success(`+${r.added} jeton${r.added > 1 ? "s" : ""}`, { description: "Bonne chance, commandant." });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Impossible pour l'instant.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader backdrop="/assets/casino/salle-777.webp" eyebrow="Cosmic Empires / Social" title="Casino orbital" description={`Le pot commun du serveur est le gros lot. Un jeton, un tirage : aligne trois 7 pour rafler ${Math.round((settings?.jackpotShare ?? 0.9) * 100)} % du pot.`} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex flex-col gap-3">
          <SlotMachine
            reels={reels}
            spinKey={spinKey}
            spinning={busy}
            win={win}
            tokens={tokens}
            disabled={!canSpin}
            onPull={() => void pull()}
            onReelStop={onReelStop}
            jackpotLabel={
              jackpotList.length > 0 ? (
                jackpotList.map(([res, n]) => (
                  <span key={res} className="inline-flex items-center gap-1">
                    <ResourceIcon id={res} className="h-4 w-4" /> {formatCompact(n ?? 0)}
                  </span>
                ))
              ) : (
                <span>{settings?.jackpotFallbackHours ?? 12} h de production</span>
              )
            }
          />
          <div className="mx-auto min-h-[44px] w-full max-w-[560px] text-center" aria-live="polite">
            <AnimatePresence mode="wait">
              {last && (
                <motion.div key={spinKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {last.outcome === "lose" ? (
                    <p className="font-mono text-sm uppercase tracking-[0.16em] text-slate-400">Pas cette fois… le cosmos est capricieux.</p>
                  ) : (
                    <HudCallout tone={last.outcome === "jackpot" ? "gold" : "mint"} className="flex flex-wrap items-center justify-center gap-3 py-2">
                      <span className="hud-title text-sm text-white">{OUTCOME_LABELS[last.outcome]}</span>
                      <Gains resources={last.resources} />
                      {last.token && (
                        <HudChip size="sm" tone="mint">
                          <TokenIcon size={14} /> +1 jeton
                        </HudChip>
                      )}
                    </HudCallout>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {settings && !open && (
            <HudCallout tone="ember" className="mx-auto w-full max-w-[560px] text-sm">
              <b className="text-slate-100">Fermé aux joueurs.</b> Tu le vois parce que tu es administrateur (tirages de test possibles).
              {nextOpen ? ` Prochaine ouverture programmée : ${new Date(nextOpen).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}.` : " Aucune ouverture programmée."}
            </HudCallout>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {/* v5.14.2 : le gros lot en jeu, en entier (ce que rafle le prochain 7-7-7). */}
          <HudCallout tone="gold" className="flex flex-col gap-2">
            <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-gold-glow">
              <Crown className="h-3.5 w-3.5" /> Gros lot en jeu · {Math.round((settings?.jackpotShare ?? 0.9) * 100)} % du pot commun
            </span>
            {Object.keys(jackpot).length > 0 ? (
              <span className="flex flex-wrap gap-x-3 gap-y-1">
                {(Object.entries(jackpot) as [ResourceId, number][]).map(([res, n]) => (
                  <span key={res} className="inline-flex items-center gap-1 font-mono text-sm tabular-nums text-slate-100">
                    <ResourceIcon id={res} className="h-4 w-4" /> {formatNumber(n)}
                  </span>
                ))}
              </span>
            ) : (
              <span className="text-xs text-slate-400">Pot vide pour l'instant : le 7-7-7 rapporte {settings?.jackpotFallbackHours ?? 12} h de production.</span>
            )}
            <span className="text-xs text-slate-400">Le pot grossit avec les taxes du marché et des cadeaux, et les dépôts de l'équipe.</span>
          </HudCallout>

          <HudCallout tone={daily ? "gold" : "neutral"} className="flex items-center gap-3">
            <img src={assetUrl("/assets/casino/jetons-pile.webp")} alt="" aria-hidden className="hud-cut-sm h-12 w-12 shrink-0 object-cover" />
            <span className="min-w-0 flex-1 text-sm">
              <b className="block text-slate-100">Jeton du jour</b>
              <span className="text-xs text-slate-400">
                {daily ? `${settings?.dailyTokens ?? 1} jeton offert chaque jour. L'équipe en distribue aussi lors des évènements.` : "Déjà récupéré aujourd'hui. Revenez demain !"}
              </span>
            </span>
            {daily && (
              <Button size="sm" onClick={() => void takeDaily()}>
                Récupérer
              </Button>
            )}
          </HudCallout>

          <WeekRecap player={player} />

          {casino && <TournamentCard casino={casino} uid={player.uid} />}

          <Card className="p-4">
            <p className="hud-eyebrow mb-2 text-[10px] text-slate-500">Table des gains</p>
            <ul className="grid gap-1.5">
              {PAYTABLE.map((row) => (
                <li key={row.outcome} className="flex items-center gap-3 text-xs">
                  <span className="hud-cut-sm flex shrink-0 gap-0.5 border border-white/10 bg-space-950 px-1 py-0.5">
                    {row.combo.map((s, i) => (
                      <span key={i} className="grid h-6 w-6 place-items-center">
                        <SlotSymbolView symbol={s} size={22} />
                      </span>
                    ))}
                  </span>
                  <span className="min-w-0 flex-1 text-slate-300">
                    {OUTCOME_LABELS[row.outcome]}
                    {/* v5.14.2 : chance de chaque gain, par tirage. */}
                    {settings && row.outcome in settings.odds && (
                      <span className="block font-mono text-[10px] text-slate-500">{chanceLabel(settings.odds[row.outcome as keyof typeof settings.odds])}</span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-slate-100">
                    {row.outcome === "jackpot"
                      ? `${Math.round((settings?.jackpotShare ?? 0.5) * 100)} % du pot`
                      : row.outcome === "cherry"
                        ? "jeton rendu"
                        : `${settings?.hours[row.outcome as keyof typeof settings.hours] ?? 0} h de prod.`}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          {settings && <JackpotOddsCard odds={jackpotOdds(settings)} />}

          <Card className="p-4">
            <p className="hud-eyebrow mb-2 flex items-center gap-2 text-[10px] text-gold-glow">
              <Crown className="h-3.5 w-3.5" /> Gros lots
            </p>
            {(casino?.jackpots.length ?? 0) === 0 ? (
              <p className="text-xs text-slate-500">Personne n'a encore aligné trois 7. Le premier entrera dans la légende.</p>
            ) : (
              <ul className="grid gap-2">
                {casino!.jackpots.slice(0, 5).map((w) => (
                  <li key={`${w.uid}-${w.atMs}`} className="hud-callout hud-tone-gold p-2 text-xs">
                    <span className="flex items-center justify-between gap-2">
                      <b className="text-slate-100">{w.pseudo}</b>
                      <span className="font-mono text-[10px] text-slate-500">{new Date(w.atMs).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                    </span>
                    <Gains resources={w.resources} className="mt-1 flex flex-wrap gap-2 font-mono text-slate-200" />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-4">
            <p className="hud-eyebrow mb-2 flex items-center gap-2 text-[10px] text-slate-500">
              <History className="h-3.5 w-3.5" /> Derniers gains
            </p>
            {(casino?.recent.length ?? 0) === 0 ? (
              <EmptyState icon="🎰" className="p-0">Aucun gain pour l'instant.</EmptyState>
            ) : (
              <ul className="grid gap-1">
                {casino!.recent.slice(0, 10).map((w) => (
                  <li key={`${w.uid}-${w.atMs}`} className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                    <span className="min-w-0 flex-1 truncate text-slate-300">
                      <b className="text-slate-100">{w.pseudo}</b> · {OUTCOME_LABELS[w.outcome]}
                    </span>
                    {w.token ? (
                      <span className="shrink-0 font-mono text-mint-glow">+1 jeton</span>
                    ) : (
                      <Gains resources={w.resources} className="flex w-full flex-wrap gap-x-3 gap-y-0.5 font-mono tabular-nums text-slate-200" />
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>

      <AnimatePresence>{showJackpot && last && <JackpotOverlay result={last} pseudo={player.pseudo} onClose={() => setShowJackpot(false)} />}</AnimatePresence>
    </div>
  );
}

/** « 1 sur 200 · 0,5 % » */
function chanceLabel(p: number): string {
  if (!(p > 0)) return "jamais";
  const pct = p * 100;
  return `1 sur ${formatNumber(Math.round(1 / p))} · ${pct < 1 ? pct.toFixed(1).replace(".", ",") : Math.round(pct)} %`;
}

/** v5.14.2 : tes chances au 7-7-7, calculées sur les réglages en vigueur (une cerise rend le jeton). */
function JackpotOddsCard({ odds }: { odds: ReturnType<typeof jackpotOdds> }) {
  const steps = [10, 50, 100, 200, 500];
  return (
    <Card className="flex flex-col gap-3 p-4">
      <p className="hud-eyebrow text-[10px] text-slate-500">Tes chances au 7-7-7</p>
      <div className="grid grid-cols-2 gap-2">
        <div className="hud-cut-sm border border-white/10 p-2">
          <p className="font-mono text-lg tabular-nums text-slate-100">≈ {formatNumber(Math.round(odds.meanTokens))}</p>
          <p className="text-[11px] text-slate-400">jetons en moyenne</p>
        </div>
        <div className="hud-cut-sm border border-white/10 p-2">
          <p className="font-mono text-lg tabular-nums text-slate-100">{formatNumber(odds.medianTokens)}</p>
          <p className="text-[11px] text-slate-400">jetons : un joueur sur deux l'a eu avant</p>
        </div>
      </div>
      <ul className="grid gap-1 text-xs">
        {steps.map((n) => {
          const pct = Math.round(odds.within(n) * 100);
          return (
            <li key={n} className="flex items-center gap-2">
              <span className="w-20 shrink-0 font-mono tabular-nums text-slate-300">{n} jetons</span>
              <span className="relative h-1.5 flex-1 overflow-hidden bg-white/5">
                <span className="absolute inset-y-0 left-0 bg-gold-glow/70" style={{ width: `${pct}%` }} />
              </span>
              <span className="w-10 shrink-0 text-right font-mono tabular-nums text-slate-100">{pct} %</span>
            </li>
          );
        })}
      </ul>
      <p className="text-[11px] text-slate-500">Calculé sur les réglages du casino. Chaque tirage est indépendant : la machine n'a pas de mémoire.</p>
    </Card>
  );
}
