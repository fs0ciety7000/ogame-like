import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/hud";
import { HudPanel, EmptyAction } from "@/components/ui/panel";
import { CoalitionCard } from "@/components/game/CoalitionCard";
import type { Coalition } from "@/game/coalition";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Eye, Loader2, Mail, Skull, Sword, Swords, Timer } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { NpcBadge } from "@/components/ui/npc-badge";
import { SpyModal } from "@/components/game/SpyModal";
import { AttackModal } from "@/components/game/AttackModal";
import { PERSONALITY_LABELS, TIER_LABELS, WARLORD_RULES, type Vendetta, type WarlordPublic } from "@/game/warlords";
import { productionHours } from "@/game/pirates";
import { RESOURCE_LIST } from "@/game/resources";
import { onVacation } from "@/game/vacation";
import { declareVendetta, fetchWarlords, useWarlordsStore } from "@/services/warlordService";
import { GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { assetUrl } from "@/lib/assets";
import { TiltPortrait } from "@/components/fx/TiltPortrait";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { cn, formatDuration, formatNumber } from "@/lib/utils";

/* v4.2 : les dix seigneurs de guerre, leurs vendettas et les actions possibles. */

function Portrait({ w, className }: { w: WarlordPublic; className?: string }) {
  const [src, setSrc] = useState(w.portrait);
  return <img src={assetUrl(src)} alt="" onError={() => src !== w.fallbackArt && setSrc(w.fallbackArt)} className={cn("object-cover object-top", className)} />;
}

const PERSONALITY_TONE: Record<string, string> = {
  aggressive: "border-danger-glow/50 text-danger-glow",
  opportunist: "border-gold-glow/50 text-gold-glow",
  builder: "border-cyan-glow/50 text-cyan-glow",
  merchant: "border-mint-glow/50 text-mint-glow",
};

export function WarlordsPage() {
  useNowTicker();
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const [list, setList] = useState<WarlordPublic[] | null>(null);
  const [history, setHistory] = useState<Vendetta[]>([]);
  const [spy, setSpy] = useState<{ uid: string; pseudo: string } | null>(null);
  const [attack, setAttack] = useState<{ uid: string; pseudo: string } | null>(null);
  const [vendetta, setVendetta] = useState<WarlordPublic | null>(null);
  const [scope, setScope] = useState<"player" | "alliance">("player");
  const [busy, setBusy] = useState(false);
  const [coalition, setCoalition] = useState<Coalition | null>(null);

  const reload = async () => {
    try {
      const view = await fetchWarlords();
      setList(view.warlords);
      setHistory(view.history);
      useWarlordsStore.setState({ list: view.warlords, loadedAtMs: Date.now(), coalition: view.coalition ?? null });
      setCoalition(view.coalition ?? null);
    } catch {
      setList([]);
    }
  };
  useEffect(() => {
    void reload();
    const t = setInterval(() => void reload(), 60_000);
    return () => clearInterval(t);
  }, []);

  const now = Date.now();
  const cost = player ? productionHours(player, WARLORD_RULES.vendetta.costHours) : {};
  const away = player ? onVacation(player, now) : false;
  const mine = list?.find((w) => w.vendetta && (w.vendetta.ownerUid === player?.uid || (w.vendetta.allianceId && w.vendetta.allianceId === player?.allianceId)));

  const open = async () => {
    if (!vendetta) return;
    setBusy(true);
    try {
      await declareVendetta(vendetta.id, scope);
      toast.success(`Vendetta déclarée à ${vendetta.name}`, { description: "72 h pour lui détruire deux fois sa puissance de flotte." });
      setVendetta(null);
      await reload();
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Vendetta impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Opérations"
        title="Seigneurs de guerre"
        description="Dix empires tenus par le jeu. Ils grandissent avec le secteur, attaquent parfois, commercent, et répondent à qui les provoque. Pille-les, espionne-les, ou déclare-leur une vendetta."
      />

      {coalition && list && <CoalitionCard coalition={coalition} warlords={list} uid={player?.uid ?? ""} />}

      {mine?.vendetta && (
        <Card className="flex flex-wrap items-center gap-4 border-danger-glow/40 p-4">
          <Swords className="h-5 w-5 text-danger-glow" />
          <div className="min-w-0 flex-1">
            <p className="hud-eyebrow text-[10px] text-danger-glow">Vendetta en cours</p>
            <p className="text-sm text-slate-200">
              Contre <strong style={{ color: mine.color }}>{mine.name}</strong> : {formatNumber(mine.vendetta.dealt)} / {formatNumber(mine.vendetta.goal)} de puissance détruite.
            </p>
            <div className="mt-2 h-2 bg-white/5">
              <div className="h-full bg-gradient-to-r from-danger-glow to-gold-glow" style={{ width: `${Math.min(100, (mine.vendetta.dealt / Math.max(1, mine.vendetta.goal)) * 100)}%` }} />
            </div>
          </div>
          <span className="flex items-center gap-1 font-mono text-xs text-slate-400">
            <Timer className="h-3.5 w-3.5" /> {formatDuration(Math.max(0, mine.vendetta.endsAtMs - now) / 1000)}
          </span>
        </Card>
      )}

      {list === null ? (
        <p className="flex items-center gap-2 text-sm text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Recherche des seigneurs…
        </p>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState icon="👑" title="Secteur calme" action={<EmptyAction to="/game/galaxie">Ouvrir la galaxie</EmptyAction>}>
            Aucun seigneur de guerre dans le secteur pour l'instant.
          </EmptyState>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((w, i) => {
            const gone = w.absentUntilMs > now;
            const v = w.vendetta;
            return (
              <motion.div key={w.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className={cn("relative flex h-full overflow-hidden p-0", gone && "opacity-60")} style={{ boxShadow: `inset 3px 0 0 ${w.color}` }}>
                  <TiltPortrait glow="var(--color-ember-glow)" className="w-32 shrink-0 sm:w-40">
                    <Portrait w={w} className="h-full w-full" />
                  </TiltPortrait>
                  <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <img src={assetUrl(w.emblem)} alt="" className="h-8 w-8 object-contain" onError={(e) => ((e.target as HTMLImageElement).style.display = "none")} />
                      <h3 className="hud-title text-base normal-case tracking-[0.02em]" style={{ color: w.color }}>
                        {w.name}
                      </h3>
                      <NpcBadge />
                    </div>
                    <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500">{w.originLabel}</p>
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span className={cn("border px-1.5 py-px", PERSONALITY_TONE[w.personality])}>{PERSONALITY_LABELS[w.personality]}</span>
                      <span className="hud-chip hud-chip-sm hud-tone-neutral">{TIER_LABELS[w.tier]}</span>
                      <span className="hud-chip hud-chip-sm hud-tone-neutral">
                        Puissance <AnimatedNumber value={w.power} format={formatNumber} countUp />
                      </span>
                    </div>
                    <p className="line-clamp-3 text-xs leading-relaxed text-slate-400">{w.bio}</p>
                    {gone && (
                      <p className="flex items-center gap-1 text-xs text-slate-400">
                        <Skull className="h-3.5 w-3.5" /> En fuite après une vendetta : retour dans {formatDuration((w.absentUntilMs - now) / 1000)}.
                      </p>
                    )}
                    {v && !gone && (
                      <div className="text-xs text-slate-300">
                        <p>
                          Vendetta de <strong>{v.ownerPseudo}</strong>
                          {v.allianceId ? " (alliance)" : ""} : {formatNumber(v.dealt)} / {formatNumber(v.goal)} · {formatDuration(Math.max(0, v.endsAtMs - now) / 1000)}
                        </p>
                        <div className="mt-1 h-1.5 bg-white/5">
                          <div className="h-full bg-danger-glow" style={{ width: `${Math.min(100, (v.dealt / Math.max(1, v.goal)) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                    <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
                      <Button size="sm" variant="secondary" disabled={gone || away} onClick={() => setSpy({ uid: w.uid, pseudo: w.name })}>
                        <Eye className="h-3.5 w-3.5" /> Espionner
                      </Button>
                      <Button size="sm" variant="secondary" disabled={gone || away} onClick={() => setAttack({ uid: w.uid, pseudo: w.name })}>
                        <Sword className="h-3.5 w-3.5" /> Attaquer
                      </Button>
                      <Button size="sm" disabled={gone || away || !!v || !!mine} onClick={() => setVendetta(w)} title={mine ? "Termine d'abord ta vendetta en cours." : undefined}>
                        <Swords className="h-3.5 w-3.5" /> Vendetta
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/game/messages?with=${w.uid}&pseudo=${encodeURIComponent(w.name)}`)}>
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {history.length > 0 && (
        <HudPanel icon={<Swords />} title="Dernières vendettas" tone="danger">
          <ul className="space-y-1 text-xs text-slate-400">
            {history
              .slice()
              .reverse()
              .map((h) => {
                const w = list?.find((x) => x.id === h.warlordId);
                return (
                  <li key={h.id}>
                    <span className={h.status === "won" ? "text-mint-glow" : "text-danger-glow"}>{h.status === "won" ? "Gagnée" : "Perdue"}</span> · {h.ownerPseudo}
                    {h.allianceId ? " et son alliance" : ""} contre {w?.name ?? h.warlordId} ({formatNumber(h.dealt)} / {formatNumber(h.goal)})
                  </li>
                );
              })}
          </ul>
        </HudPanel>
      )}

      <Dialog open={!!vendetta} onOpenChange={(o) => !o && setVendetta(null)}>
        <DialogContent className="max-w-lg">
          <DialogTitle>Vendetta contre {vendetta?.name}</DialogTitle>
          <div className="space-y-3 text-sm text-slate-300">
            <p>
              Pendant <strong>{WARLORD_RULES.vendetta.durationHours} h</strong>, détruis l'équivalent de <strong>{WARLORD_RULES.vendetta.goalFactor}× sa puissance de flotte</strong> (attaques, ou défense quand il t'attaque).
            </p>
            <ul className="list-disc space-y-1 pl-5 text-xs text-slate-400">
              <li>
                Gagnée : une relique {vendetta?.tier === "strong" ? "rare" : "commune"} au moins, le titre « Tombeur de … », +{WARLORD_RULES.vendetta.passPoints} points de passe. Le seigneur perd {Math.round(WARLORD_RULES.vendetta.powerLoss * 100)} % de sa puissance et fuit {WARLORD_RULES.vendetta.awayDays} jours.
              </li>
              <li>Perdue : il riposte une fois contre toi (jamais pendant une protection).</li>
              <li>En alliance : les dégâts de tous les membres comptent ; récompense pour chacun dès {Math.round(WARLORD_RULES.vendetta.minShare * 100)} % de l'objectif.</li>
            </ul>
            <div className="flex gap-2">
              {(["player", "alliance"] as const).map((sc) => (
                <button
                  key={sc}
                  type="button"
                  disabled={sc === "alliance" && !player?.allianceId}
                  onClick={() => setScope(sc)}
                  className={cn("flex-1 border px-3 py-2 text-left text-xs disabled:opacity-40", scope === sc ? "border-cyan-glow bg-cyan-glow/10 text-slate-100" : "border-white/15 text-slate-400")}
                >
                  {sc === "player" ? "Seul" : "Avec mon alliance"}
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-400">
              Coût : {WARLORD_RULES.vendetta.costHours} h de production (
              {Object.entries(cost)
                .map(([res, n]) => `${formatNumber(n ?? 0)} ${RESOURCE_LIST.find((r) => r.id === res)?.name.toLowerCase() ?? res}`)
                .join(", ") || "rien pour l'instant"}
              ).
            </p>
          </div>
          <div className="mt-3 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setVendetta(null)}>
              Annuler
            </Button>
            <Button disabled={busy} onClick={() => void open()}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Swords className="h-4 w-4" />} Déclarer la vendetta
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <SpyModal target={spy} onClose={() => setSpy(null)} />
      <AttackModal target={attack} onClose={() => setAttack(null)} />
    </div>
  );
}
