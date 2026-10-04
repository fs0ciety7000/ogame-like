import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Gift, Target, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameActionError } from "@/services/playerService";
import { describeGain } from "@/game/format";
import { Card } from "@/components/ui/card";
import { useNowTicker } from "@/hooks/useNowTicker";
import { claimChallenge, useChallengeStore } from "@/services/challengeService";
import { useAuthStore } from "@/store/authStore";
import { CHALLENGE_RULES, CHALLENGE_TYPES, challengeClaimable, challengeRanking, challengeTier, type Challenge } from "@/game/challenges";
import { cn, formatCompact, formatDuration } from "@/lib/utils";

/* Accueil (v3.8) : défi hebdomadaire du serveur, progression commune. */

function timeLeft(ms: number) {
  const days = Math.floor(ms / 86_400_000);
  return days >= 1 ? `${days} j ${Math.floor((ms % 86_400_000) / 3_600_000)} h` : formatDuration(Math.max(0, ms) / 1000);
}

/** v5.10 : récompense du défi terminé, à récupérer d'un clic. */
function ClaimBanner({ previous }: { previous: Challenge }) {
  const [busy, setBusy] = useState(false);
  const tier = challengeTier(previous);
  const claim = async () => {
    setBusy(true);
    try {
      const out = await claimChallenge();
      toast.success(`Récompense du défi : +${describeGain(out.gain)}`);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Récupération impossible.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap items-center gap-3 border border-gold-glow/40 bg-gold-glow/[0.07] px-4 py-3 text-sm"
    >
      <Gift className="h-5 w-5 shrink-0 animate-pulse text-gold-glow" />
      <span className="min-w-0 flex-1 text-slate-200">
        Défi « {CHALLENGE_TYPES[previous.type].label.toLowerCase()} » réussi ! Ta récompense t'attend
        {tier ? ` : ${tier.hours} h de production et ${tier.rare} de chaque ressource rare` : ""}.
        <span className="block text-[11px] text-slate-500">Non récupérée, elle sera versée d'office à la fin du défi suivant.</span>
      </span>
      <Button size="sm" disabled={busy} onClick={() => void claim()}>
        Récupérer
      </Button>
    </motion.div>
  );
}

export function ChallengeCard() {
  const uid = useAuthStore((s) => s.user?.uid) ?? "";
  const { previous } = useChallengeStore();
  const claimable = challengeClaimable(previous, uid);
  return (
    <div className="flex flex-col gap-3 empty:hidden">
      {claimable && previous && <ClaimBanner previous={previous} />}
      <ChallengeProgress hideResult={claimable} />
    </div>
  );
}

function ChallengeProgress({ hideResult }: { hideResult: boolean }) {
  useNowTicker();
  const uid = useAuthStore((s) => s.user?.uid) ?? "";
  const { current, previous } = useChallengeStore();
  const now = Date.now();

  if (!current) {
    if (hideResult) return null;
    // Résultat du défi précédent pendant 2 jours, ou pause du Léviathan.
    if (previous && now - previous.endMs < 2 * 86_400_000) {
      const ratio = previous.target > 0 ? previous.total / previous.target : 0;
      return (
        <Card className="flex items-center gap-3 p-4 text-sm">
          <Trophy className={cn("h-5 w-5 shrink-0", previous.success ? "text-gold-glow" : "text-slate-500")} />
          <span className="text-slate-300">
            Défi de la semaine passée ({CHALLENGE_TYPES[previous.type].label.toLowerCase()}) : {previous.success ? "réussi" : "manqué"} à {Math.round(ratio * 100)} %.
            {previous.success && challengeRanking(previous)[0] && <> {challengeRanking(previous)[0].pseudo} devient « {CHALLENGE_RULES.title} ».</>}
          </span>
        </Card>
      );
    }
    // Semaine de Léviathan ou défi pas encore ouvert : rien à afficher.
    return null;
  }

  const def = CHALLENGE_TYPES[current.type];
  const ratio = current.target > 0 ? current.total / current.target : 0;
  const tier = challengeTier(current);
  const ranking = challengeRanking(current);
  const mine = current.contributions[uid]?.amount ?? 0;
  const eligible = mine >= current.target * CHALLENGE_RULES.minShare;
  const maxRatio = CHALLENGE_RULES.tiers[CHALLENGE_RULES.tiers.length - 1].at;
  const width = Math.min(1, ratio / maxRatio) * 100;

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <p className="hud-eyebrow flex items-center gap-1.5 text-gold-glow">
          <Target className="h-3.5 w-3.5" /> Défi de la semaine
        </p>
        <p className="font-display text-base text-white">{def.label}</p>
        <p className="ml-auto font-mono text-[11px] text-slate-500">fin dans {timeLeft(current.endMs - now)}</p>
      </div>

      <div className="relative mt-3 h-3 overflow-hidden bg-white/5">
        <motion.div
          className="h-full bg-gradient-to-r from-gold-glow/60 to-gold-glow shadow-[0_0_12px_var(--color-gold-glow)]"
          initial={{ width: 0 }}
          animate={{ width: `${width}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
        {CHALLENGE_RULES.tiers.map((t) => (
          <span key={t.at} className="absolute inset-y-0 w-px bg-white/40" style={{ left: `${(t.at / maxRatio) * 100}%` }} />
        ))}
      </div>
      <div className="mt-1 flex justify-between font-mono text-[11px] text-slate-400">
        <span>
          {formatCompact(current.total)} / {formatCompact(current.target)} {def.unit} · <strong className="text-gold-glow">{Math.round(ratio * 100)} %</strong>
        </span>
        <span>
          {CHALLENGE_RULES.tiers.map((t, i) => (
            <span key={t.at} className={cn("ml-2", tier && tier.at >= t.at ? "text-mint-glow" : "")}>
              {i > 0 && "· "}
              {t.at * 100} % : {t.hours} h + {t.rare} rares
            </span>
          ))}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <p className="text-xs text-slate-400">
          Ta contribution : <strong className="text-white">{formatCompact(mine)}</strong> {def.unit}.{" "}
          {eligible ? (
            <span className="text-mint-glow">Tu seras récompensé si l'objectif est atteint.</span>
          ) : (
            <span>Il faut {formatCompact(Math.ceil(current.target * CHALLENGE_RULES.minShare))} pour être récompensé.</span>
          )}{" "}
          Le meilleur contributeur devient « {CHALLENGE_RULES.title} » pendant {CHALLENGE_RULES.titleDays} jours.
        </p>
        {ranking.length > 0 && (
          <ol className="text-xs">
            {ranking.slice(0, 5).map((r, i) => (
              <li key={r.uid} className={cn("flex justify-between gap-2", r.uid === uid ? "text-cyan-glow" : "text-slate-300")}>
                <span className="truncate">
                  {i + 1}. {r.pseudo}
                </span>
                <span className="tabular-mono">{formatCompact(r.amount)}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </Card>
  );
}
