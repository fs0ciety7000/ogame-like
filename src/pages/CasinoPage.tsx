import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import { Coins, Crown, History, ListOrdered, Percent, Dices } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { assetUrl } from "@/lib/assets";
import { PageHeader } from "@/components/layout/PageHeader";
import { HudBrackets } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { HudCallout, HudChip, EmptyState } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { SlotMachine, SlotSymbolView } from "@/components/casino/SlotMachine";
import { TournamentCard } from "@/components/casino/TournamentCard";
import { WeekRecap } from "@/components/casino/WeekRecap";
import { LEAGUE_TIERS } from "@/game/leagues";
import { ACHIEVEMENT_TOKENS } from "@/game/achievements";
import { LOOT_TABLES, lootTokensThisWeek } from "@/game/loot";
import { casinoOpen, dailyTokenReady, jackpotAmounts, jackpotOdds, nextCasinoOpening, OUTCOME_LABELS, playerCasino, type CasinoSettings, type SlotSymbol, type SpinOutcome } from "@/game/casino";
import { claimDailyToken, spinSlot, useCasino, type SpinResult } from "@/services/casinoService";
import { useServerPot } from "@/services/serverPotService";
import { useAdminStatus } from "@/services/adminService";
import { Link, Navigate } from "react-router-dom";
import { usePlayerStore } from "@/store/playerStore";
import { ignoreShortcut } from "@/lib/shortcuts";
import { playJackpot, playSlotPull, playSlotStop, playSlotWin } from "@/lib/sfx";
import { cn, formatCompact, formatNumber, formatDateTime } from "@/lib/utils";
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

function JackpotOverlay({ result, pseudo, fallbackHours, onClose }: { result: SpinResult; pseudo: string; fallbackHours: number; onClose: () => void }) {
  const reduce = useReducedMotion();
  const coins = useMemo(() => Array.from({ length: reduce ? 0 : 24 }, (_, i) => ({ id: i, x: Math.random() * 100, delay: 0.8 + Math.random() * 1.6, dur: 2.2 + Math.random() * 1.6, rot: (Math.random() - 0.5) * 540 })), [reduce]);
  const gains = (Object.entries(result.resources) as [ResourceId, number][]).filter(([, n]) => n > 0);
  return (
    <motion.div className="jackpot-scene fixed inset-0 z-[80] grid place-items-center overflow-y-auto p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal aria-label="Gros lot">
      {/* 5.14.4 : la salle du casino en fond (docs/DESIGN.md : un lieu, le texte reste prioritaire). */}
      <img src={assetUrl("/assets/casino/banniere-777.webp")} alt="" aria-hidden className="jackpot-scene-bg" />
      <div className="jackpot-scene-veil" aria-hidden />
      {coins.map((c) => (
        <motion.span key={c.id} className="slot-coin" style={{ left: `${c.x}%` }} initial={{ y: -60, rotate: 0 }} animate={{ y: "110vh", rotate: c.rot }} transition={{ duration: c.dur, delay: c.delay, repeat: Infinity, ease: "easeIn" }}>
          <TokenIcon size={26} variant="art" />
        </motion.span>
      ))}
      <motion.div
        className="glass-panel hud-cut jackpot-panel relative z-10 grid w-full max-w-[560px] justify-items-center gap-4 p-6 text-center"
        initial={reduce ? false : { scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 240, damping: 20, delay: 0.1 }}
      >
        <HudBrackets className="border-gold-glow/80" />
        {!reduce && <span className="jackpot-sweep" aria-hidden />}
        <div className="flex flex-wrap items-center justify-center gap-2">
          <HudChip tone="gold" size="md" alert>
            Gros lot · 7-7-7
          </HudChip>
          <HudChip tone="neutral" size="md">
            Casino orbital
          </HudChip>
        </div>
        <div className="flex items-center gap-3">
          <motion.img
            src={assetUrl("/assets/casino/sceau-777.webp")}
            alt=""
            aria-hidden
            className="jackpot-seal h-20 w-20 object-contain sm:h-24 sm:w-24"
            initial={reduce ? false : { scale: 1.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 260, damping: 16 }}
          />
          <div className="flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.span key={i} initial={reduce ? false : { y: -24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.25 + i * 0.12, type: "spring", stiffness: 300 }}>
                <SlotSymbolView symbol="seven" size={64} />
              </motion.span>
            ))}
          </div>
        </div>
        <div className="grid gap-1">
          <p className="slot-title" style={{ fontSize: "clamp(28px, 7vw, 44px)" }}>
            Gros lot
          </p>
          <p className="text-sm text-slate-300">
            <b className="text-slate-100">{pseudo}</b>, le Casino orbital te verse :
          </p>
        </div>
        <div className={cn("grid w-full gap-2", gains.length > 2 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2")}>
          {gains.map(([res, n]) => (
            <div key={res} className="hud-cut-sm flex items-center gap-2 border border-gold-glow/25 bg-space-900/60 px-3 py-2 text-left">
              <ResourceIcon id={res} className="h-6 w-6" />
              <span className="min-w-0 font-mono text-lg font-bold tabular-nums text-gold-glow">{reduce ? formatCompact(n) : <AnimatedNumber value={n} countUp format={formatCompact} />}</span>
            </div>
          ))}
        </div>
        <HudCallout tone="gold" className="w-full text-left text-xs">
          {result.fromPot ? "Pris dans le pot commun du serveur. Tout le monde est prévenu !" : `Le pot commun était vide : ${fallbackHours} h de production à la place.`}
        </HudCallout>
        <Button size="lg" onClick={onClose}>
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
  // 5.21.1 : l'historique reste figé pendant que les rouleaux tournent (le serveur l'a déjà mis à jour).
  const [frozenHistory, setFrozenHistory] = useState<NonNullable<ReturnType<typeof playerCasino>>["history"] | null>(null);
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
  const history = frozenHistory ?? mine?.history ?? [];

  const pull = async () => {
    if (!canSpin) return;
    setBusy(true);
    setWin("none");
    setLast(null);
    setFrozenHistory(mine?.history ?? []);
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
      setFrozenHistory(null);
    }
  };

  const pullFive = async () => {
    if (busy) return;
    setBusy(true);
    const outcomes: string[] = [];
    try {
      for (let i = 0; i < 5; i++) {
        const r = await spinSlot();
        outcomes.push(OUTCOME_LABELS[r.outcome]);
        setOverride({ tokens: r.tokens, base });
        if (r.tokens < 1) break;
      }
      toast.success(`${outcomes.length} tirages`, { description: outcomes.join(" · ") });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Tirage impossible.");
    } finally {
      setBusy(false);
      reloadCasino();
    }
  };

  const onReelStop = (i: number) => {
    stops.current += 1;
    playSlotStop(i);
    if (stops.current < 3 || !pending.current) return;
    const r = pending.current;
    pending.current = null;
    setBusy(false);
    setFrozenHistory(null);
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

  // 5.15.9 : le gros lot pulse quand le pot grossit (taxes, cadeaux, dépôts).
  const potTotal = pot && settings ? Object.values(jackpotAmounts(pot, settings.jackpotShare)).reduce<number>((a, n) => a + (n ?? 0), 0) : 0;
  const prevPot = useRef(potTotal);
  const [potBump, setPotBump] = useState(0);
  useEffect(() => {
    if (potTotal > prevPot.current && prevPot.current > 0) setPotBump((k) => k + 1);
    prevPot.current = potTotal;
  }, [potTotal]);
  const reduceMotion = useReducedMotion();
  const bump = (node: React.ReactNode) =>
    reduceMotion || potBump === 0 ? (
      node
    ) : (
      <motion.span key={potBump} className="inline-flex flex-wrap items-center gap-[inherit]" initial={{ scale: 1.14, filter: "brightness(1.8)" }} animate={{ scale: 1, filter: "brightness(1)" }} transition={{ duration: 0.7, ease: "easeOut" }}>
        {node}
      </motion.span>
    );

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

      {/* 5.15.8 : trois colonnes. À gauche ce qui te concerne (jetons, semaine, tournoi),
          au centre la machine, à droite le gros lot et les gains. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[300px_minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-3 lg:col-start-1 xl:col-start-2 xl:row-start-1">
          <SlotMachine
            reels={reels}
            spinKey={spinKey}
            spinning={busy}
            win={win}
            tokens={tokens}
            disabled={!canSpin}
            onPull={() => void pull()}
            onReelStop={onReelStop}
            jackpotLabel={bump(
              jackpotList.length > 0 ? (
                jackpotList.map(([res, n]) => (
                  <span key={res} className="inline-flex items-center gap-1">
                    <ResourceIcon id={res} className="h-4 w-4" /> {formatCompact(n ?? 0)}
                  </span>
                ))
              ) : (
                <span>{settings?.jackpotFallbackHours ?? 12} h de production</span>
              ),
            )}
          />
          <div className="mx-auto min-h-[44px] w-full max-w-[560px] text-center" aria-live="polite">
            <AnimatePresence mode="wait">
              {last && (
                <motion.div key={spinKey} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  {last.outcome === "lose" ? (
                    <p className="font-mono text-sm uppercase tracking-[0.16em] text-slate-400">Pas cette fois… le cosmos est capricieux.</p>
                  ) : (
                    <HudCallout tone={last.outcome === "jackpot" ? "gold" : "mint"} className="flex flex-wrap items-center justify-center gap-3 py-2">
                      <span className="hud-title text-sm text-slate-100">{OUTCOME_LABELS[last.outcome]}</span>
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
          {admin && (
            <div className="mx-auto flex flex-wrap justify-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                // 5.14.3 : voir l'écran du gros lot sans tirage (rien n'est versé).
                setLast({ outcome: "jackpot", reels: ["seven", "seven", "seven"], resources: jackpot, token: false, tokens, fromPot: true });
                setShowJackpot(true);
              }}
            >
              Aperçu de l'écran du gros lot (admin)
            </Button>
            {/* 5.15 : les concours du pot commun quittent le menu (admins). */}
            <Button variant="ghost" size="sm" asChild>
              <Link to="/game/concours">Concours du pot commun (admin)</Link>
            </Button>
            {/* 5.15.12 : cinq tirages d'un coup, sans animation (tests). */}
            <Button variant="ghost" size="sm" disabled={busy || tokens < 1} onClick={() => void pullFive()}>
              Tirer ×5 (admin)
            </Button>
            </div>
          )}
          {settings && !open && (
            <HudCallout tone="ember" className="mx-auto w-full max-w-[560px] text-sm">
              <b className="text-slate-100">Fermé aux joueurs.</b> Tu le vois parce que tu es administrateur (tirages de test possibles).
              {nextOpen ? ` Prochaine ouverture programmée : ${formatDateTime(nextOpen, "long", "server")}.` : " Aucune ouverture programmée."}
            </HudCallout>
          )}
        </div>

        <div className="grid content-start gap-3 lg:col-span-2 lg:grid-cols-2 xl:col-span-1 xl:col-start-1 xl:row-start-1 xl:grid-cols-1">
          <HudPanel
            icon={<TokenIcon size={14} />}
            title="Mes jetons"
            tone="gold"
            accent={daily}
            aside={
              <span className="font-mono text-lg font-bold tabular-nums text-slate-100">
                {formatNumber(tokens)}
                <span className="text-xs font-normal text-slate-500"> / {formatNumber(settings?.maxTokens ?? 0)}</span>
              </span>
            }
          >
            <div className="flex items-center gap-3">
              <img src={assetUrl("/assets/casino/jetons-pile.webp")} alt="" aria-hidden className="hud-cut-sm h-12 w-12 shrink-0 object-cover" />
              <span className="min-w-0 flex-1 text-xs text-slate-400">
                <b className="block text-sm text-slate-100">Jeton du jour</b>
                {daily ? `${settings?.dailyTokens ?? 1} jeton${(settings?.dailyTokens ?? 1) > 1 ? "s" : ""} offert${(settings?.dailyTokens ?? 1) > 1 ? "s" : ""} chaque jour.` : "Déjà récupéré aujourd'hui. Reviens demain !"}
              </span>
              {daily && (
                <Button size="sm" onClick={() => void takeDaily()}>
                  Récupérer
                </Button>
              )}
            </div>
          </HudPanel>

          <WeekRecap player={player} />

          {/* 5.15.12 : mes derniers tirages. */}
          <HudPanel icon={<History />} title="Mes derniers tirages" aside={<span className="font-mono text-[11px] text-slate-500">{history.length} / 20</span>}>
            {history.length === 0 ? (
              <EmptyState size="sm" icon={<Dices />} title="Aucun tirage">Tes 20 derniers tirages s'afficheront ici.</EmptyState>
            ) : (
              <ul className="grid max-h-72 gap-1 overflow-y-auto pr-1 text-xs">
                {history.map((h, i) => (
                  <li key={`${h.atMs}-${i}`} className="flex flex-wrap items-center gap-x-2 gap-y-0.5 border-b border-white/5 pb-1 last:border-0">
                    <span className="w-12 shrink-0 font-mono text-[11px] text-slate-500">{formatDateTime(h.atMs, "time")}</span>
                    <span className={cn("min-w-0 flex-1 truncate", h.outcome === "lose" ? "text-slate-500" : h.outcome === "jackpot" ? "text-gold-glow" : "text-slate-200")}>{OUTCOME_LABELS[h.outcome]}</span>
                    <Gains resources={h.resources} className="flex flex-wrap gap-2 font-mono tabular-nums text-slate-300" />
                  </li>
                ))}
              </ul>
            )}
          </HudPanel>

          {casino && <TournamentCard casino={casino} uid={player.uid} />}

          {settings && <TokenSourcesCard settings={settings} />}
        </div>

        <div className="flex flex-col gap-3 lg:col-start-2 lg:row-start-1 xl:col-start-3">
          {/* v5.14.2 : le gros lot en jeu, en entier (ce que rafle le prochain 7-7-7). */}
          <HudPanel key={`pot-${potBump}`} className={potBump > 0 && !reduceMotion ? "casino-pot-bump" : undefined} icon={<Crown />} title={`Gros lot en jeu · ${Math.round((settings?.jackpotShare ?? 0.9) * 100)} % du pot`} tone="gold" accent>
            {Object.keys(jackpot).length > 0 ? (
              <div className="grid grid-cols-2 gap-1.5">
                {(Object.entries(jackpot) as [ResourceId, number][]).map(([res, n]) => (
                  <span key={res} className="hud-cut-sm flex min-w-0 items-center gap-1.5 border border-gold-glow/15 bg-gold-glow/[0.04] px-2 py-1 font-mono text-xs tabular-nums text-slate-100">
                    <ResourceIcon id={res} className="h-4 w-4 shrink-0" /> <span className="truncate">{formatCompact(n)}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs text-slate-400">Pot vide pour l'instant : le 7-7-7 rapporte {settings?.jackpotFallbackHours ?? 12} h de production.</span>
            )}
            <span className="text-[11px] text-slate-500">Le pot grossit avec les taxes du marché et des cadeaux, et les dépôts de l'équipe.</span>
          </HudPanel>

          <HudPanel icon={<ListOrdered />} title="Table des gains">
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
                      <span className="block whitespace-nowrap font-mono text-[11px] text-slate-500">{chanceLabel(settings.odds[row.outcome as keyof typeof settings.odds])}</span>
                    )}
                  </span>
                  <span className="shrink-0 text-right font-mono text-[11px] text-slate-100">
                    {row.outcome === "jackpot"
                      ? `${Math.round((settings?.jackpotShare ?? 0.5) * 100)} % du pot`
                      : row.outcome === "cherry"
                        ? "jeton rendu"
                        : `${settings?.hours[row.outcome as keyof typeof settings.hours] ?? 0} h de prod.`}
                  </span>
                </li>
              ))}
            </ul>
          </HudPanel>

          {settings && <JackpotOddsCard odds={jackpotOdds(settings)} />}

          <HudPanel icon={<Crown />} title="Gros lots" tone="gold">
            {(casino?.jackpots.length ?? 0) === 0 ? (
              <EmptyState size="sm" icon={<Crown />} title="Aucun gros lot">Personne n'a encore aligné trois 7. Le premier entrera dans la légende.</EmptyState>
            ) : (
              <ul className="grid gap-2">
                {casino!.jackpots.slice(0, 5).map((w) => (
                  <li key={`${w.uid}-${w.atMs}`} className="hud-callout hud-tone-gold p-2 text-xs">
                    <span className="flex items-center justify-between gap-2">
                      <b className="text-slate-100">{w.pseudo}</b>
                      <span className="font-mono text-[11px] text-slate-500">{formatDateTime(w.atMs, "dayShort")}</span>
                    </span>
                    <Gains resources={w.resources} className="mt-1 flex flex-wrap gap-2 font-mono text-slate-200" />
                  </li>
                ))}
              </ul>
            )}
          </HudPanel>

          <HudPanel icon={<History />} title="Derniers gains">
            {(casino?.recent.length ?? 0) === 0 ? (
              <EmptyState size="sm" icon={<Dices />} title="Aucun gain">Le premier gain s'affichera ici.</EmptyState>
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
          </HudPanel>
        </div>
      </div>

      <AnimatePresence>{showJackpot && last && <JackpotOverlay result={last} pseudo={player.pseudo} fallbackHours={settings?.jackpotFallbackHours ?? 12} onClose={() => setShowJackpot(false)} />}</AnimatePresence>
    </div>
  );
}

/** 5.15 : toutes les façons de gagner des jetons, avec les chiffres en vigueur. */
function TokenSourcesCard({ settings }: { settings: CasinoSettings }) {
  const r = settings.rewards;
  const player = usePlayerStore((st) => st.player);
  const lootWeek = player ? lootTokensThisWeek(player, Date.now()) : null;
  const pct = (v: number | undefined) => `${Math.round((v ?? 0) * 100)} %`;
  const rows: [string, string][] = [
    ["Jeton du jour", `${settings.dailyTokens} par jour (réserve de ${settings.maxTokens})`],
    ["Défi de la semaine", r.challenge.join(" puis ")],
    ["Boss abattu", `${r.bossWin} chacun, +${r.bossTop} au premier en dégâts`],
    ["Proie d'élite Kesh'Vaar", String(r.elite)],
    ["Seigneur de guerre pillé", String(r.warlord)],
    ["Divisions (chaque lundi)", `${LEAGUE_TIERS[0].tokens} à ${LEAGUE_TIERS[LEAGUE_TIERS.length - 1].tokens} selon la division`],
    ["Succès", `Or ${ACHIEVEMENT_TOKENS.or}, Légendaire ${ACHIEVEMENT_TOKENS.legendaire}, Mythique ${ACHIEVEMENT_TOKENS.mythique}`],
    ["Butin des boss", `${pct(LOOT_TABLES.worldBoss.tokenChance)} de chances, plus au podium`],
    ["Butin des combats", `seigneurs ${pct(LOOT_TABLES.warlord.tokenChance)}, menaces ${pct(LOOT_TABLES.threat.tokenChance)}, joueurs ${pct(LOOT_TABLES.pvp.tokenChance)}, expéditions ${pct(LOOT_TABLES.expedition.tokenChance)}`],
    ["Tournoi de la semaine", r.tournament.join(", ") + " pour le podium"],
  ];
  return (
    <HudPanel icon={<Coins />} title="Gagner des jetons" tone="gold">
      <ul className="grid gap-1 text-xs">
        {rows.map(([label, value]) => (
          <li key={label} className="flex flex-col gap-0.5 border-b border-white/5 pb-1 last:border-0">
            <span className="text-slate-400">{label}</span>
            <span className="font-mono tabular-nums text-slate-100">{value}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-slate-500">Les chances de butin augmentent face à un adversaire plus fort que toi (jusqu'à ×2).</p>
      {lootWeek && lootWeek.left !== null && (
        <div className="flex flex-col gap-1">
          <p className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Jetons de butin cette semaine</span>
            <span className="font-mono tabular-nums text-slate-100">
              {lootWeek.used} / {lootWeek.cap}
            </span>
          </p>
          <div className="h-1 bg-white/5">
            <div className="meter-fill h-full bg-gold-glow" style={{ width: `${Math.min(100, (lootWeek.used / Math.max(1, lootWeek.cap)) * 100)}%` }} />
          </div>
          <p className="text-[11px] text-slate-500">Plafond remis à zéro chaque lundi. Le jeton du jour, la série, les défis et le passe n'y comptent pas.</p>
        </div>
      )}
    </HudPanel>
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
    <HudPanel icon={<Percent />} title="Tes chances au 7-7-7">
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
    </HudPanel>
  );
}
