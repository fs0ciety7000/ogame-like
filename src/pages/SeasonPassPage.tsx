import { ChroniclesCard } from "@/components/game/ChroniclesCard";
import { useState } from "react";
import { toast } from "sonner";
import { Check, Gift, Lock, Ticket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatTile } from "@/components/ui/hud";
import { PageHeader } from "@/components/layout/PageHeader";
import { activePass, describePassReward, isCumulativePass, OBJECTIVE_LABELS, PASS_POINTS, passState, passTier, passTitle, tierRequirements, activeChallengeTier, type PassReward } from "@/game/seasonPass";
import { publishedPassSeason, type PassSeason } from "@/game/passSeasons";
import { findCommander, type CommanderDef } from "@/game/commanders";
import { STORY_SPEAKERS } from "@/game/story";
import { HudChip } from "@/components/ui/hud";
import { seasonLabel } from "@/game/seasons";
import { GameActionError, claimPassTier } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { assetUrl } from "@/lib/assets";
import { cn, formatClock } from "@/lib/utils";

/* Passe de saison (v4.1) : 30 paliers gratuits par mois. */

const SOURCES: [keyof typeof PASS_POINTS, string][] = [
  ["contract", "Contrat du jour récupéré"],
  ["bounty", "Prime Kesh'Vaar remplie"],
  ["vendetta", "Vendetta gagnée contre un seigneur"],
  ["chronicle", "Épisode des Chroniques terminé"],
  ["seasonBoss", "Participation au boss de saison"],
  ["allianceBoss", "Boss d'alliance abattu (5 % des dégâts)"],
  ["allianceBossTry", "Participation au boss d'alliance"],
  ["coalition", "Coalition gagnée contre un seigneur (3 % de l'objectif)"],
  ["raidRepelled", "Raid de faction repoussé"],
  ["victory", "Combat gagné (attaque, défense, repaire)"],
  ["bossAssault", "Assaut sur le Léviathan ou la proie d'élite"],
  ["dailyLogin", "Connexion du jour"],
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
    case "tokens":
      return "/assets/casino/jeton.webp";
    case "commander":
      return findCommander(r.id)?.portrait ?? "/assets/icons/trophy.webp";
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
  // v5.4 : un chapitre généré peut apporter son propre passe.
  const pass = activePass(st.seasonId);
  const tiers = pass.tiers.length;
  const tier = passTier(st.points, st.seasonId);
  const max = tiers * pass.pointsPerTier;
  const inTier = st.points - tier * pass.pointsPerTier;
  // v5.13 : passe de saison publié (thème, scénario, prérequis, commandant).
  const season = publishedPassSeason(st.seasonId);
  const reqOf = (t: number) => tierRequirements(player, t, now);
  // v5.14.1 : un défi à la fois, celui du premier palier pas encore relevé.
  const challengeTier = activeChallengeTier(st);
  const challenge = challengeTier ? reqOf(challengeTier) : null;
  const claimable = Array.from({ length: tier }, (_, i) => i + 1).filter((t) => !st.claimed.includes(t) && reqOf(t)?.met !== false);
  const commander = season ? findCommander(season.commander.id) : undefined;

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
        eyebrow={season ? `Passe de ${seasonLabel(st.seasonId)}` : "Saison"}
        title={season ? season.theme.name : `Passe de ${seasonLabel(st.seasonId)}`}
        backdrop={season?.theme.image || "/assets/pass/pass-header.webp"}
        description={season ? `${season.theme.tagline} Gratuit pour tous : ${tiers} paliers, remise à zéro au début du mois.` : `Gratuit pour tous : ton activité de chaque jour remplit ${tiers} paliers de récompenses. Remise à zéro au début de chaque mois.`}
        right={
          claimable.length > 0 ? (
            <Button onClick={() => void claimAll()} disabled={busy !== null}>
              <Gift className="h-4 w-4" /> Tout réclamer ({claimable.length})
            </Button>
          ) : undefined
        }
      />

      {season && <SeasonStory season={season} tier={tier} />}
      {season && commander && <FinalReward season={season} def={commander} reached={tier >= tiers} claimed={st.claimed.includes(tiers)} />}

      <ChroniclesCard />

      {challenge && (
        <Card className="flex flex-col gap-2 p-4" style={season ? { borderLeft: `2px solid ${season.theme.accent}` } : undefined}>
          <p className="hud-eyebrow text-[10px] text-slate-400">Défi en cours · palier {challengeTier}</p>
          <div className="flex flex-wrap gap-1.5">
            {challenge.reqs.map((r) => (
              <HudChip key={r.key} size="md" tone={r.met ? "mint" : "accent"} className="max-w-full whitespace-normal normal-case tracking-normal">
                {r.met ? <Check /> : null} {OBJECTIVE_LABELS[r.key]} {r.done}/{r.count}
              </HudChip>
            ))}
          </div>
          <p className="text-xs text-slate-500">
            {isCumulativePass(st.seasonId)
              ? "Totaux du mois : chaque action compte pour tous les paliers, rien n'est perdu. Les défis se relèvent dans l'ordre ; il faut le défi ET les points pour réclamer un palier."
              : "Un défi à la fois : tes actions ne comptent que pour ce palier, puis le compteur repart de zéro au palier suivant. Il faut le défi ET les points pour réclamer un palier."}
          </p>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Palier" value={`${tier} / ${tiers}`} sub={tier < tiers ? `${inTier} / ${pass.pointsPerTier} points vers le palier ${tier + 1}` : "Passe terminé !"} icon={<Ticket className="h-4 w-4" />} />
        <StatTile label="Points" value={`${st.points} / ${max}`} sub="≈ 40 points par jour d'activité" tone="gold" />
        <StatTile label="Fin de la saison" value={formatClock(Math.max(0, Math.floor((endOfMonth(now) - now) / 1000)))} sub="Les paliers non réclamés sont perdus" tone="ember" />
      </div>

      <Card className="p-4">
        <div className="h-2.5 w-full overflow-hidden bg-white/5">
          <div className="h-full bg-gradient-to-r from-cyan-glow via-violet-glow to-gold-glow transition-all" style={{ width: `${(st.points / max) * 100}%` }} />
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
        {pass.tiers.map((rewards, i) => {
          const t = i + 1;
          const reached = tier >= t;
          const claimed = st.claimed.includes(t);
          const big = t % 10 === 0;
          const req = reqOf(t);
          const locked = !!req && !req.met;
          const current = req?.status === "active";
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
              {req && (
                <div className={cn("flex flex-col gap-1", req.status === "waiting" && "opacity-70")} title={isCumulativePass(st.seasonId) ? "Défi du palier : totaux du mois" : "Défi du palier : un palier à la fois"}>
                  {req.reqs.map((r) => (
                    <HudChip key={r.key} size="sm" tone={r.met ? "mint" : current ? "accent" : "neutral"} className="max-w-full whitespace-normal normal-case tracking-normal">
                      {r.met ? <Check /> : <Lock />} {OBJECTIVE_LABELS[r.key]} {r.done}/{r.count}
                    </HudChip>
                  ))}
                </div>
              )}
              <div className="flex flex-1 flex-col gap-1.5">
                {rewards.map((r, k) => (
                  <div key={k} className="flex items-center gap-2 text-xs text-slate-200">
                    <img src={assetUrl(rewardIcon(r))} alt="" className="h-7 w-7 shrink-0 object-contain" />
                    <span>{describePassReward(r, st.seasonId)}</span>
                  </div>
                ))}
              </div>
              {reached && !claimed && (
                <Button size="sm" variant={locked ? "outline" : "primary"} disabled={busy !== null || locked} onClick={() => void claim(t)}>
                  {locked ? (current ? "Défi en cours" : "Défi à relever") : "Réclamer"}
                </Button>
              )}
            </Card>
          );
        })}
      </div>
      <p className="text-xs text-slate-500">
        Palier {tiers} : {pass.tiers[tiers - 1].map((r) => describePassReward(r, st.seasonId)).join(", ")}. Le titre « {passTitle(st.seasonId)} » et la bannière de la saison sont gardés pour toujours.
      </p>
    </div>
  );
}

/** v5.13 : scénario du passe — prologue, puis un acte tous les 10 paliers. */
function SeasonStory({ season, tier }: { season: PassSeason; tier: number }) {
  return (
    <Card className="flex flex-col gap-3 p-4" style={{ borderTop: `2px solid ${season.theme.accent}` }}>
      <p className="hud-eyebrow text-[10px]" style={{ color: season.theme.accent }}>
        Scénario de la saison
      </p>
      <p className="text-sm text-slate-300">{season.scenario.synopsis}</p>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
        {season.scenario.milestones.map((m) => {
          const open = tier >= m.tier;
          return (
            <div key={m.tier} className={cn("hud-cut-sm flex flex-col gap-2 border p-3", open ? "border-white/10 bg-white/[0.03]" : "border-dashed border-white/10")}>
              <p className="flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
                {m.title} {m.tier > 0 && <span>palier {m.tier}</span>}
              </p>
              {open ? (
                m.lines.map((l, i) => {
                  const sp = l.as ?? STORY_SPEAKERS[l.speaker];
                  return (
                    <div key={i} className="flex gap-2">
                      <img src={assetUrl(sp.image)} alt="" className="h-8 w-8 shrink-0 object-cover" />
                      <p className="text-xs text-slate-300">
                        <b style={{ color: sp.color }}>{sp.name}</b> — {l.text}
                      </p>
                    </div>
                  );
                })
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Lock className="h-3.5 w-3.5" /> Se dévoile au palier {m.tier}.
                </p>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/** v5.13 : la récompense du dernier palier, en vitrine (commandant de saison + Ambre). */
function FinalReward({ season, def, reached, claimed }: { season: PassSeason; def: CommanderDef; reached: boolean; claimed: boolean }) {
  const amber = season.tiers[season.tiers.length - 1].reduce((a, r) => a + (r.kind === "amber" ? r.amount : 0), 0);
  return (
    <Card className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <img src={assetUrl(def.portrait)} alt="" className="hud-cut h-28 w-24 shrink-0 border object-cover" style={{ borderColor: season.theme.accent }} />
        <div className="min-w-0 flex-1">
          <p className="hud-eyebrow text-[10px] text-gold-glow">Dernier palier · commandant de saison</p>
          <h3 className="hud-title mt-1 text-lg text-slate-100">
            {def.title} {def.name}
          </h3>
          <p className="mt-1 text-sm text-slate-300">{def.bonus(1)} (au niveau 1, jusqu'au niveau 20).</p>
          {def.lore && <p className="mt-1 text-xs italic text-slate-400">{def.lore}</p>}
        </div>
      </div>
      {/* v5.14 : sur téléphone, les pastilles passent sous le texte (il n'avait plus que quelques pixels). */}
      <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
        {amber > 0 && (
          <HudChip size="md" tone="gold">
            + {amber} Ambre
          </HudChip>
        )}
        <HudChip size="sm" tone={claimed ? "mint" : reached ? "gold" : "neutral"}>
          {claimed ? "Dans ton état-major" : reached ? "À réclamer" : "Exclusif à ce passe"}
        </HudChip>
      </div>
    </Card>
  );
}
