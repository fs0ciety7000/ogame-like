import { ChroniclesCard } from "@/components/game/ChroniclesCard";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Gift, Lock, Ticket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/hud";
import { PageHeader } from "@/components/layout/PageHeader";
import { describePassReward, PASS_POINTS, PASS_RULES, PASS_TIERS, passState, passTier, passTitle, type PassReward } from "@/game/seasonPass";
import { seasonLabel } from "@/game/seasons";
import { GameActionError, claimPassTier } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { assetUrl } from "@/lib/assets";
import { cn, formatDuration } from "@/lib/utils";

/* Passe de saison (v4.1) : 30 paliers gratuits par mois. */

const SOURCES: [keyof typeof PASS_POINTS, string][] = [
  ["contract", "Contrat du jour récupéré"],
  ["bounty", "Prime Kesh'Vaar remplie"],
  ["vendetta", "Vendetta gagnée contre un seigneur"],
  ["chronicle", "Épisode des Chroniques terminé"],
  ["seasonBoss", "Participation au boss de saison"],
  ["allianceBoss", "Boss d'alliance abattu (5 % des dégâts)"],
  ["allianceBossTry", "Participation au boss d'alliance"],
  ["raidRepelled", "Raid de faction repoussé"],
  ["victory", "Combat gagné (attaque, défense, repaire)"],
  ["bossAssault", "Assaut sur le Léviathan ou la proie d'élite"],
  ["dailyLogin", "Connexion du jour"],
  ["mission", "Mission terminée"],
];

function rewardIcon(r: PassReward): string {
  switch (r.kind) {
    case "production":
      return "/assets/icons/scrap.webp";
    case "amber":
      return "/assets/bounties/amber.webp";
    case "dossier":
      return "/assets/icons/research.webp";
    case "capsule":
      return `/assets/capsules/${r.capsule}.webp`;
    case "relic":
      return r.rarity === "epic" ? "/assets/relics/ecaille_leviathan.webp" : "/assets/relics/engrenage_varan.webp";
    case "cosmetic":
      return "/assets/icons/trophy.webp";
  }
}

function endOfMonth(now: number): number {
  const d = new Date(now);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1);
}

export function SeasonPassPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const [busy, setBusy] = useState<number | null>(null);
  if (!player) return null;
  const now = Date.now();
  const st = passState(player, now);
  const tier = passTier(st.points);
  const max = PASS_RULES.tiers * PASS_RULES.pointsPerTier;
  const inTier = st.points - tier * PASS_RULES.pointsPerTier;
  const claimable = Array.from({ length: tier }, (_, i) => i + 1).filter((t) => !st.claimed.includes(t));

  const claim = async (t: number) => {
    setBusy(t);
    try {
      const out = await claimPassTier(t);
      toast.success(`Palier ${t} réclamé`, { description: out.gained.join(" · ") });
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Réclamation impossible.");
    } finally {
      setBusy(null);
    }
  };
  const claimAll = async () => {
    for (const t of claimable) await claim(t);
  };

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        eyebrow="Saison"
        title={`Passe de ${seasonLabel(st.seasonId)}`}
        description={`Gratuit pour tous : ton activité de chaque jour remplit ${PASS_RULES.tiers} paliers de récompenses. Remise à zéro au début de chaque mois.`}
        right={
          claimable.length > 0 ? (
            <Button onClick={() => void claimAll()} disabled={busy !== null}>
              <Gift className="h-4 w-4" /> Tout réclamer ({claimable.length})
            </Button>
          ) : undefined
        }
      />

      <ChroniclesCard />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Palier" value={`${tier} / ${PASS_RULES.tiers}`} sub={tier < PASS_RULES.tiers ? `${inTier} / ${PASS_RULES.pointsPerTier} points vers le palier ${tier + 1}` : "Passe terminé !"} icon={<Ticket className="h-4 w-4" />} />
        <StatTile label="Points" value={`${st.points} / ${max}`} sub="≈ 40 points par jour d'activité" tone="var(--color-gold-glow)" />
        <StatTile label="Fin de la saison" value={formatDuration(Math.max(0, Math.floor((endOfMonth(now) - now) / 1000)))} sub="Les paliers non réclamés sont perdus" tone="var(--color-ember-glow)" />
      </div>

      <Card className="p-4">
        <div className="h-2.5 w-full overflow-hidden bg-white/5">
          <div className="h-full bg-gradient-to-r from-cyan-glow via-violet-400 to-gold-glow transition-all" style={{ width: `${(st.points / max) * 100}%` }} />
        </div>
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
          {SOURCES.map(([k, label]) => (
            <span key={k}>
              <strong className="font-mono text-cyan-glow">+{PASS_POINTS[k]}</strong> {label}
            </span>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6">
        {PASS_TIERS.map((rewards, i) => {
          const t = i + 1;
          const reached = tier >= t;
          const claimed = st.claimed.includes(t);
          const big = t % 10 === 0;
          return (
            <Card
              key={t}
              className={cn(
                "flex flex-col gap-2 p-3",
                big && "border-gold-glow/50",
                reached && !claimed && "ring-1 ring-mint-glow/70",
                claimed && "opacity-60",
                !reached && "opacity-75",
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn("font-mono text-xs", big ? "text-gold-glow" : "text-slate-400")}>Palier {t}</span>
                {claimed ? <Check className="h-4 w-4 text-mint-glow" /> : !reached ? <Lock className="h-3.5 w-3.5 text-slate-600" /> : null}
              </div>
              <div className="flex flex-1 flex-col gap-1.5">
                {rewards.map((r, k) => (
                  <div key={k} className="flex items-center gap-2 text-xs text-slate-200">
                    <img src={assetUrl(rewardIcon(r))} alt="" className="h-7 w-7 shrink-0 object-contain" />
                    <span>{describePassReward(r, st.seasonId)}</span>
                  </div>
                ))}
              </div>
              {reached && !claimed && (
                <Button size="sm" disabled={busy !== null} onClick={() => void claim(t)}>
                  Réclamer
                </Button>
              )}
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">Palier 30 : relique épique, 40 Ambre, la bannière de la saison et le titre « {passTitle(st.seasonId)} », gardés pour toujours.</p>
    </div>
  );
}
