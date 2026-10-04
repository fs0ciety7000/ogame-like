import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Award, Clock, Crosshair, Flag, Gem, Medal, PackageOpen, Share2, Sparkles, Swords, Trophy, Users } from "lucide-react";
import { VictoryCardDialog } from "@/components/game/VictoryCardDialog";
import { bossCardInput } from "@/lib/shareCards";
import { usePlayerStore } from "@/store/playerStore";
import { useAllianceTag } from "@/store/directoryStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ResourceIcon } from "@/components/ui/game-icon";
import { PlayerName } from "@/components/ui/player-name";
import { bossRecap, type BossRecap as Recap, type LeviathanState } from "@/game/leviathan";
import { RESOURCE_LIST } from "@/game/resources";
import { assetUrl } from "@/lib/assets";
import { cn, formatCompact, formatDuration } from "@/lib/utils";
import type { ResourceId } from "@/types/game";

/* v5.9 : bilan d'un boss terminé (Léviathan, boss de saison, boss
   d'alliance) — issue du combat, statistiques, podium des dégâts et
   récompenses reçues par le joueur. S'ouvre une fois en grand à la
   première visite après la fin, puis reste affiché sur la page. */

const MEDALS = ["#ffd86b", "#cbd5e1", "#e0a26b"];

function seenKey(id: string) {
  return `cosmic:boss-recap-seen:${id}`;
}

function Stat({ icon: Icon, label, value, tone }: { icon: typeof Clock; label: string; value: string; tone: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5 border border-white/[0.06] bg-white/[0.02] px-3 py-2">
      <span className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">
        <Icon className="h-3 w-3" style={{ color: tone }} /> {label}
      </span>
      <span className="truncate font-display text-base tabular-nums text-white">{value}</span>
    </div>
  );
}

/** v5.10 : « coffre » — les récompenses sortent une à une (fenêtre du bilan). */
function Reveal({ children, index, on }: { children: React.ReactNode; index: number; on: boolean }) {
  const reduce = useReducedMotion();
  if (!on || reduce) return <>{children}</>;
  return (
    <motion.span
      className="inline-flex"
      initial={{ opacity: 0, scale: 0.4, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 0.6 + index * 0.22, type: "spring", stiffness: 380, damping: 18 }}
    >
      {children}
    </motion.span>
  );
}

function RewardPills({ recap, reveal = false }: { recap: Recap; reveal?: boolean }) {
  const r = recap.reward;
  if (!r) return <p className="text-xs text-slate-500">{recap.mine ? "Récompenses en cours de distribution…" : "Tu n'as pas participé à ce combat."}</p>;
  const order = RESOURCE_LIST.map((x) => x.id as string);
  const gain = Object.entries(r.gain ?? {})
    .filter(([, v]) => (v ?? 0) > 0)
    .sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0])) as [ResourceId, number][];
  const pill = "inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-xs tabular-nums";
  const items: React.ReactNode[] = [
    ...gain.map(([id, v]) => (
      <span key={id} className={cn(pill, "border-white/10 bg-white/[0.04] text-slate-100")}>
        <ResourceIcon id={id} /> +{formatCompact(v)}
      </span>
    )),
    r.points ? (
      <span key="points" className={pill} style={{ borderColor: "#4be8ff55", color: "#4be8ff" }}>
        <Award className="h-3.5 w-3.5" /> +{r.points} points de passe
      </span>
    ) : null,
    r.title ? (
      <span key="title" className={pill} style={{ borderColor: "#ffd86b55", color: "#ffd86b" }}>
        <Medal className="h-3.5 w-3.5" /> Titre « {r.title} »
      </span>
    ) : null,
    r.relic ? (
      <span key="relic" className={pill} style={{ borderColor: "#a78bfa55", color: "#a78bfa" }}>
        <Gem className="h-3.5 w-3.5" /> {r.relic}
      </span>
    ) : null,
    r.mythic ? (
      <span key="mythic" className={cn(pill, "hud-sheen")} style={{ borderColor: "#ff5df088", color: "#ff5df0" }}>
        <Sparkles className="h-3.5 w-3.5" /> Mythique : {r.mythic}
      </span>
    ) : null,
  ].filter(Boolean);
  if (items.length === 0) return <span className="text-xs text-slate-500">Aucune récompense cette fois.</span>;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {reveal && <Chest />}
      {items.map((it, i) => (
        <Reveal key={i} index={i} on={reveal}>
          {it}
        </Reveal>
      ))}
    </div>
  );
}

/** Le coffre qui s'ouvre avant les récompenses. */
function Chest() {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className="mr-1 grid h-8 w-8 place-items-center border border-gold-glow/50 bg-gold-glow/10 text-gold-glow"
      initial={reduce ? false : { rotate: 0, scale: 0.8 }}
      animate={reduce ? undefined : { rotate: [0, -12, 12, -8, 8, 0], scale: [0.8, 1, 1, 1, 1.1, 1] }}
      transition={{ duration: 0.6 }}
      aria-hidden
    >
      <PackageOpen className="h-4 w-4" />
    </motion.span>
  );
}

/** Contenu du bilan (carte sur la page ou fenêtre). */
export function BossRecapBody({ state, uid, name, image, accent = "#ff8a4c", reveal = false }: { state: LeviathanState; uid: string; name: string; image?: string; accent?: string; reveal?: boolean }) {
  const reduce = useReducedMotion();
  const recap = bossRecap(state, uid);
  const item = (i: number) => (reduce ? {} : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { delay: 0.05 * i, duration: 0.3 } });
  const tone = recap.won ? "#5cf2b0" : "#ffb347";
  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden border" style={{ borderColor: `${tone}55` }}>
        {image && <img src={assetUrl(image)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-30 grayscale-[30%]" />}
        <div className="absolute inset-0 bg-gradient-to-r from-space-950 via-space-950/80 to-space-950/30" />
        <div className="relative flex items-center gap-3 px-4 py-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center border" style={{ color: tone, borderColor: `${tone}66`, background: `${tone}14` }}>
            {recap.won ? <Trophy className="h-6 w-6" /> : <Flag className="h-6 w-6" />}
          </span>
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.2em]" style={{ color: tone }}>
              {recap.won ? "Victoire" : "Il s'est retiré"}
            </p>
            <p className="hud-title truncate text-lg text-white">{recap.won ? `${name} est tombé` : `${name} a survécu`}</p>
            <p className="text-xs text-slate-400">
              {recap.won ? "Les commandants ont abattu le colosse." : `Structure entamée à ${Math.round(recap.hpDealtPct * 100)} %. Moitié des récompenses.`}
            </p>
          </div>
        </div>
        <div className="relative h-1.5 bg-white/5">
          <motion.i
            className="block h-full"
            style={{ background: `linear-gradient(90deg, ${accent}, ${tone})` }}
            initial={reduce ? false : { width: 0 }}
            animate={{ width: `${Math.round(recap.hpDealtPct * 100)}%` }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <motion.div {...item(0)}>
          <Stat icon={Clock} label="Durée" value={formatDuration(recap.durationMs / 1000)} tone="#94a3b8" />
        </motion.div>
        <motion.div {...item(1)}>
          <Stat icon={Swords} label="Dégâts" value={formatCompact(recap.totalDamage)} tone={accent} />
        </motion.div>
        <motion.div {...item(2)}>
          <Stat icon={Users} label="Participants" value={String(recap.participants)} tone="#4be8ff" />
        </motion.div>
        <motion.div {...item(3)}>
          <Stat icon={Crosshair} label="Assauts" value={String(recap.assaults)} tone="#ff5c7a" />
        </motion.div>
      </div>

      <div className="flex flex-col gap-2 border border-white/[0.06] bg-white/[0.02] p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Ton bilan</p>
        {recap.mine ? (
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm text-slate-300">
            <span>
              Rang <strong className="font-display text-lg text-white">#{recap.mine.rank}</strong>
              <span className="text-slate-500"> / {recap.participants}</span>
            </span>
            <span>
              <strong className="text-white">{formatCompact(recap.mine.damage)}</strong> dégâts ({Math.round(recap.mine.share * 1000) / 10} %)
            </span>
            <span>
              {recap.mine.assaults} assaut{recap.mine.assaults > 1 ? "s" : ""}
            </span>
          </div>
        ) : null}
        <RewardPills recap={recap} reveal={reveal} />
      </div>

      {recap.top.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Meilleurs dégâts</p>
          <ol className="flex flex-col gap-1.5">
            {recap.top.map((c, i) => (
              <motion.li key={c.uid} {...item(4 + i)} className={cn("grid grid-cols-[1.75rem_1fr_auto] items-center gap-2 text-sm", c.uid === uid && "text-cyan-glow")}>
                <span className="font-mono text-xs font-bold" style={{ color: MEDALS[i] ?? "#64748b" }}>
                  #{c.rank}
                </span>
                <span className="min-w-0">
                  <PlayerName uid={c.uid} pseudo={c.pseudo} className="block truncate" />
                  <span className="mt-0.5 block h-1 bg-white/5">
                    <i className="block h-full" style={{ width: `${Math.max(2, c.share * 100)}%`, background: MEDALS[i] ?? accent }} />
                  </span>
                </span>
                <span className="text-right font-mono text-xs tabular-nums">
                  {formatCompact(c.damage)} <span className="text-slate-500">· {Math.round(c.share * 100)} %</span>
                </span>
              </motion.li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/**
 * Bilan d'un boss terminé : carte sur la page, et fenêtre ouverte une seule
 * fois (par boss) pour un participant dès que ses récompenses sont versées.
 */
export function BossRecapPanel(props: { state: LeviathanState; uid: string; name: string; image?: string; accent?: string; active: boolean }) {
  const { state, uid, active } = props;
  const [open, setOpen] = useState(false);
  const [sharing, setSharing] = useState(false);
  const player = usePlayerStore((s) => s.player);
  const tag = useAllianceTag(player?.uid, player?.allianceId) ?? undefined;
  const ended = !active && state.status !== "active";
  const participated = !!state.contributions[uid];
  useEffect(() => {
    if (!ended || !state.rewarded || !participated) return;
    try {
      if (localStorage.getItem(seenKey(state.id))) return;
      localStorage.setItem(seenKey(state.id), "1");
    } catch {
      return;
    }
    setOpen(true);
  }, [ended, state.rewarded, state.id, participated]);
  if (!ended) return null;
  return (
    <>
      <Card className="flex flex-col gap-3 p-5">
        <div className="flex items-center gap-2">
          <h2 className="hud-title flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-gold-glow" /> Bilan du combat
          </h2>
          {participated && player && (
            <Button variant="ghost" size="sm" className="ml-auto" onClick={() => setSharing(true)}>
              <Share2 className="mr-1 h-3.5 w-3.5" /> Partager ma carte
            </Button>
          )}
        </div>
        <BossRecapBody {...props} />
      </Card>
      <VictoryCardDialog
        card={sharing && player ? bossCardInput(bossRecap(state, uid), props.name, props.image, player, tag) : null}
        target={typeof window !== "undefined" ? window.location.pathname : "/game"}
        title="Carte du combat"
        fileName="cosmic-empires-boss.jpg"
        onClose={() => setSharing(false)}
      />
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogTitle>Bilan du combat</DialogTitle>
          <div className="mt-3">
            <BossRecapBody {...props} reveal />
          </div>
          <Button className="mt-4 w-full" onClick={() => setOpen(false)}>
            Fermer
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
