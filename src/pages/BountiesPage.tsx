import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { HullWarning } from "@/components/game/HullWarning";
import { PveFightEstimate } from "@/components/game/PveFightEstimate";
import { HudPanel, EmptyAction, PagedList } from "@/components/ui/panel";
import { AmberAmount, AmberIcon } from "@/components/ui/amber";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { ArrowUpToLine, Loader2, BookOpen, Eye, History, CalendarClock, Crosshair, Crown, Dices, Flag, Ghost, Hourglass, Lock, Orbit, Palette, Pill, Radar, ShieldHalf, ShoppingBag, Smile, Sparkles, Star, Swords, Timer, Trophy, Users, Zap, Receipt, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { CostPill, HudChip, HudTag, StatTile, EmptyState, type HudTone } from "@/components/ui/hud";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconSelect } from "@/components/ui/icon-select";
import { PlayerName } from "@/components/ui/player-name";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormationPicker } from "@/components/game/FormationPicker";
import { allianceSiegeFactor } from "@/game/alliances";
import { findBuilding } from "@/game/buildings";
import { computeFleetPower, pveAttackFactor } from "@/game/combat";
import { formationEffects, type FormationId } from "@/game/formations";
import { findFaction } from "@/game/pirates";
import { findUnit, KESH_HUNTER_UNIT, OFFENSIVE_UNITS } from "@/game/units";
import {
  amberFor,
  BOUNTY_RULES,
  BOUNTY_SHOP_RULES,
  bountyRank,
  describeElite,
  ELITE_RULES,
  eliteActive,
  eliteRanking,
  eliteReadyAt,
  FUGITIVES,
  fugitivePower,
  KESH,
  KESH_EMOJIS,
  NAME_TONES,
  nextRank,
  nextRefreshMs,
  owns,
  rankName,
  rerollablePlans,
  SHOP_ITEMS,
  shopBlocker,
  viewBounties,
  type BountyContract,
  type BountyState,
  type ShopItem,
  type ShopItemId,
} from "@/game/bounties";
import { moduleLabel } from "@/game/modules";
import { DonateCard } from "@/components/game/DonateCard";
import { WeeklyStockCard } from "@/components/game/WeeklyStockCard";
import { PrestigePreview, PREVIEWABLE } from "@/components/game/PrestigePreview";
import { RewardReveal } from "@/components/game/RewardReveal";
import { normalizePlanetLook } from "@/game/planetLook";
import { WEEKLY_OFFERS } from "@/game/weeklyStock";
import { ECONOMY_RULES } from "@/game/economy";
import { buyBountyItem, setBountyNameTone, sendBountyHunt, sendEliteAssault, useElite } from "@/services/bountyService";
import { GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useFleetStore } from "@/store/fleetStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { assetUrl } from "@/lib/assets";
import { cn, formatCompact, formatDuration, formatNumber, timeAgo } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

/* =====================================================
   Page Primes (v3.9) : l'Essaim Kesh'Vaar, son tableau des primes, la
   proie d'élite de la semaine et le Comptoir de la Ruche.
===================================================== */

const Amber = AmberIcon;

function Stars({ n, className }: { n: number; className?: string }) {
  return (
    <span className={cn("inline-flex gap-0.5 text-gold-glow", className)} aria-label={`${n} étoile${n > 1 ? "s" : ""}`}>
      {Array.from({ length: n }).map((_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-current" />
      ))}
    </span>
  );
}

function errorText(err: unknown) {
  return err instanceof GameActionError ? err.message : "Action impossible.";
}

/* ---------- envoi d'une flotte ---------- */

interface HuntTarget {
  title: string;
  intro: string;
  /** Puissance du fugitif (null : proie d'élite, dégâts libres). */
  targetPower: number | null;
  minutes: number;
  send: (fleet: Record<string, number>, formation: FormationId) => Promise<unknown>;
}

function huntPower(player: PlayerState, fleet: Record<string, number>, formation: FormationId) {
  return Math.round(
    computeFleetPower(player.units, player.techLevels, fleet, ["attack"]) *
      formationEffects(formation).attackFactor *
      allianceSiegeFactor(player.allianceResearch) *
      pveAttackFactor(player.units, player.techLevels, fleet),
  );
}

function HuntDialog({ target, onClose }: { target: HuntTarget | null; onClose: () => void }) {
  const player = usePlayerStore((s) => s.player);
  const [fleet, setFleet] = useState<Record<string, number>>({});
  const [formation, setFormation] = useState<FormationId>("balanced");
  const [busy, setBusy] = useState(false);
  if (!player || !target) return null;
  const ids = OFFENSIVE_UNITS.filter((id) => id !== "sonde_espionnage" && (player.units[id]?.count ?? 0) > 0);
  const selected = Object.fromEntries(Object.entries(fleet).filter(([, n]) => n > 0));
  const power = huntPower(player, selected, formation);

  const send = async () => {
    setBusy(true);
    try {
      await target.send(selected, formation);
      triggerWarpEffect();
      toast.success(`Chasseurs lancés : contact dans ${target.minutes} min.`);
      setFleet({});
      onClose();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogTitle>{target.title}</DialogTitle>
        <p className="text-sm text-slate-400">{target.intro}</p>
        <div className="mt-3 flex flex-col gap-1.5">
          {ids.length === 0 && (
            <EmptyState size="sm" icon={<Swords />} title="Aucun vaisseau de combat à quai" action={<EmptyAction to="/game/unites">Construire des vaisseaux</EmptyAction>}>
              Rappelle ta flotte ou arme de nouveaux chasseurs.
            </EmptyState>
          )}
          {ids.map((id) => {
            const owned = player.units[id]?.count ?? 0;
            return (
              <div key={id} className="flex items-center gap-2 text-sm">
                <img src={assetUrl(findUnit(id)?.image ?? "")} alt="" className="h-7 w-7 object-contain" />
                <span className="flex-1 truncate text-slate-300">
                  {findUnit(id)?.name}
                  {id === KESH_HUNTER_UNIT.id && <span className="ml-1 text-[11px] text-gold-glow">+50 % PNJ</span>}
                </span>
                <NumberInput size="sm" value={fleet[id] ?? 0} max={owned} aria-label={`Quantité ${findUnit(id)?.name}`} onChange={(v) => setFleet((f) => ({ ...f, [id]: v }))} className="w-40 shrink-0" />
                <span className="w-10 shrink-0 text-right font-mono text-[11px] text-slate-500" title="À quai">/{formatCompact(owned)}</span>
              </div>
            );
          })}
        </div>
        <FormationPicker value={formation} onChange={setFormation} className="mt-3" />
        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="border border-cyan-glow/20 bg-cyan-glow/5 p-2">
            <p className="text-slate-500">Ta puissance d'attaque</p>
            <p className="tabular-mono text-base text-cyan-glow">{formatNumber(power)}</p>
          </div>
          <div className="border border-gold-glow/25 bg-gold-glow/5 p-2">
            <p className="text-slate-500">{target.targetPower === null ? "Dégâts infligés" : "Force du fugitif"}</p>
            <p className="tabular-mono text-base text-gold-glow">{formatNumber(target.targetPower ?? power)}</p>
          </div>
        </div>
        {/* 5.20 : estimation par le combat en tours ; le lancement reste toujours possible. */}
        <HullWarning player={player} fleet={selected} />
        {target.targetPower !== null && <PveFightEstimate player={player} fleet={selected} enemyPower={target.targetPower} formation={formation} enemyLabel="le fugitif" />}
        <Button className="mt-3 w-full" disabled={busy || Object.keys(selected).length === 0} onClick={() => void send()}>
          <Crosshair className="mr-1.5 h-4 w-4" /> Lancer la traque
        </Button>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- en-tête de l'Essaim ---------- */

function KeshHero({ st }: { st: BountyState }) {
  const rank = bountyRank(st.reputation);
  const next = nextRank(st.reputation);
  return (
    <div className="hud-cut relative overflow-hidden border border-gold-glow/30">
      <img src={assetUrl(KESH.banner)} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <div className="absolute inset-0 bg-gradient-to-r from-space-950 via-space-950/85 to-space-950/40" />
      <div className="relative grid gap-4 p-4 sm:grid-cols-[9rem_1fr] sm:p-5 lg:grid-cols-[11rem_1fr_16rem]">
        <img src={assetUrl(KESH.art)} alt={KESH.leader} className="mx-auto h-44 w-32 border border-gold-glow/40 object-cover object-top shadow-[0_0_30px_color-mix(in_srgb,var(--color-gold-glow)_25%,transparent)] sm:h-52 sm:w-36 lg:h-56 lg:w-40" />
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <img src={assetUrl(KESH.emblem)} alt="" className="h-10 w-10 drop-shadow-[0_0_10px_color-mix(in_srgb,var(--color-gold-glow)_45%,transparent)]" />
            <div>
              <p className="hud-title text-xl text-slate-100">Les {KESH.name}</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold-glow">{KESH.full} · alliés</p>
            </div>
          </div>
          <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-slate-300">{KESH.story.split("\n\n").slice(0, 2).join("\n\n")}</p>
          <p className="text-sm italic text-gold-glow/90">« Rapporte-nous leurs noms, commandant. L'Essaim n'oublie ni ses morts, ni ses chasseurs. » — {KESH.leader}</p>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
          <div className="border border-gold-glow/30 bg-space-950/70 p-3">
            <p className="hud-eyebrow text-[11px] text-slate-500">Ambre de Ruche</p>
            <p className="flex items-center gap-2 font-display text-3xl text-gold-glow">
              <Amber className="h-8 w-8" /> {formatNumber(st.amber)}
            </p>
            <p className="text-[11px] text-slate-500">{formatNumber(st.amberEarned)} gagnés au total</p>
          </div>
          <div className="border border-white/10 bg-space-950/70 p-3">
            <p className="hud-eyebrow text-[11px] text-slate-500">Rang dans l'Essaim</p>
            <p className="flex items-center gap-1.5 font-display text-lg text-slate-100">
              <Crown className="h-4 w-4 text-gold-glow" /> {rankName(rank)} <span className="text-xs text-slate-500">({rank}/5)</span>
            </p>
            {next ? (
              <>
                <div className="mt-1.5 h-1.5 bg-white/5">
                  <i className="block h-full bg-gradient-to-r from-ember-glow to-gold-glow" style={{ width: `${next.progress * 100}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-slate-500">
                  {st.reputation} / {next.at} réputation → {next.name}
                </p>
              </>
            ) : (
              <p className="text-[11px] text-gold-glow">Rang suprême atteint.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------- tableau des primes ---------- */

function ContractCard({ contract, player, st, onHunt }: { contract: BountyContract; player: PlayerState; st: BountyState; onHunt: (c: BountyContract) => void }) {
  const fleets = useFleetStore((s) => s.fleets);
  const now = Date.now();
  const fugitive = FUGITIVES[contract.fugitive] ?? FUGITIVES[0];
  const faction = findFaction(fugitive.factionId);
  const t = BOUNTY_RULES.tiers[contract.tier];
  const rank = bountyRank(st.reputation);
  const hunting = contract.status === "hunting";
  const fleet = fleets.find((f) => f.mission === "bounty" && f.targetUid === `bounty_${contract.id}` && f.status === "outbound");
  const power = fugitivePower(contract.tier, player);
  const full = st.doneToday >= BOUNTY_RULES.dailyLimit;
  return (
    <Card className={cn("group relative flex flex-col overflow-hidden border-gold-glow/20 p-0 transition-transform hover:-translate-y-0.5", contract.tier === 4 && "border-danger-glow/40")}>
      {faction?.art && <img src={assetUrl(faction.art)} alt="" className="absolute inset-y-0 right-0 h-full w-2/3 object-cover object-top opacity-25 transition-opacity group-hover:opacity-35" />}
      <div className="absolute inset-0 bg-gradient-to-r from-space-950 via-space-950/90 to-space-950/30" />
      <div className="relative flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-center gap-2">
          <Stars n={contract.tier} />
          <HudTag tone={contract.tier >= 4 ? "danger" : contract.tier === 3 ? "ember" : "gold"}>{t.label}</HudTag>
          <span className="ml-auto font-mono text-[11px] uppercase tracking-[0.25em] text-slate-500">Avis de recherche</span>
        </div>
        <div>
          <p className="hud-title text-lg leading-tight text-slate-100">{fugitive.name}</p>
          <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500">{faction?.name ?? "Indépendant"}</p>
        </div>
        <p className="text-sm italic text-slate-300">« {fugitive.crime[0].toUpperCase() + fugitive.crime.slice(1)}. »</p>
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-xs">
          <span className="flex items-center gap-1 font-semibold text-gold-glow">
            <Amber /> {amberFor(contract.tier, rank)}
          </span>
          <span className="text-cyan-glow">+{t.xp} XP</span>
          <span className="text-slate-400">+{t.rep} réputation</span>
          <span className="flex items-center gap-1 text-slate-400">
            <Timer className="h-3 w-3" /> {contract.minutes} min
          </span>
          <span className="flex items-center gap-1 text-slate-400" title="Force du fugitif (selon ta flotte à quai)">
            <Radar className="h-3 w-3" /> {formatCompact(power)}
          </span>
        </div>
        {contract.tries > 0 && !hunting && <p className="text-[11px] text-ember-glow">Il t'a déjà échappé : dernière chance.</p>}
        {hunting ? (
          <p className="flex items-center gap-1.5 border border-cyan-glow/30 bg-cyan-glow/10 px-2 py-1.5 text-xs text-cyan-glow">
            <Hourglass className="h-3.5 w-3.5 animate-pulse" /> Traque en cours{fleet ? ` · contact dans ${formatDuration(Math.max(0, Math.floor((fleet.arriveAtMs - now) / 1000)))}` : ""}
          </p>
        ) : (
          <Button size="sm" className="mt-1" disabled={full} onClick={() => onHunt(contract)}>
            <Crosshair className="mr-1.5 h-4 w-4" /> {full ? "Plus de prime aujourd'hui" : "Lancer la traque"}
          </Button>
        )}
      </div>
    </Card>
  );
}

function BoardTab({ player, st, onHunt }: { player: PlayerState; st: BountyState; onHunt: (target: HuntTarget) => void }) {
  const now = Date.now();
  const rank = bountyRank(st.reputation);
  const hunt = (c: BountyContract) => {
    const f = FUGITIVES[c.fugitive] ?? FUGITIVES[0];
    onHunt({
      title: `Traque : ${f.name}`,
      intro: `Prime « ${BOUNTY_RULES.tiers[c.tier].label} ». Le fugitif vaut ${Math.round(BOUNTY_RULES.tiers[c.tier].pct * 100)} % de la puissance d'attaque de ta flotte à quai (vaisseaux envoyés compris). Trajet de ${c.minutes} min, retour aussi long.`,
      targetPower: fugitivePower(c.tier, player),
      minutes: c.minutes,
      send: (fleet, formation) => sendBountyHunt(c.id, fleet, formation, c.tier),
    });
  };
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatTile label="Primes du jour" value={`${st.doneToday} / ${BOUNTY_RULES.dailyLimit}`} sub="remises à zéro à minuit (UTC)" tone="gold" icon={<Crosshair className="h-4 w-4" />} />
        <StatTile label="Nouveau tableau" value={formatDuration(Math.max(0, Math.floor((nextRefreshMs(now) - now) / 1000)))} sub={`toutes les ${BOUNTY_RULES.refreshHours} h`} tone="accent" icon={<Timer className="h-4 w-4" />} />
        <StatTile label="Tableau de chasse" value={st.completed} sub={`${st.failed} échec${st.failed > 1 ? "s" : ""}`} tone="mint" icon={<Trophy className="h-4 w-4" />} />
      </div>
      <div className={cn("grid gap-3 md:grid-cols-2", st.board.length >= 3 && "xl:grid-cols-3", st.board.length >= 4 && "2xl:grid-cols-4")}>
        {st.board.map((c) => (
          <ContractCard key={c.id} contract={c} player={player} st={st} onHunt={hunt} />
        ))}
      </div>
      {rank < BOUNTY_RULES.tiers[3].minRank && (
        <p className="flex items-center gap-1.5 text-xs text-slate-500">
          <Lock className="h-3.5 w-3.5" /> Proies majeures (★★★) au rang {rankName(BOUNTY_RULES.tiers[3].minRank)}, primes d'élite (★★★★) au rang {rankName(BOUNTY_RULES.tiers[4].minRank)}.
        </p>
      )}
    </div>
  );
}

/* ---------- proie d'élite ---------- */

function EliteTab({ player, st, onHunt }: { player: PlayerState; st: BountyState; onHunt: (target: HuntTarget) => void }) {
  const elite = useElite();
  const now = Date.now();
  if (!elite) {
    return (
      <Card>
        <EmptyState icon={<Target />} title="Pas de proie d'élite" action={<EmptyAction to="/game/primes">Voir le tableau des primes</EmptyAction>}>
          L'Essaim en désigne une chaque lundi.
        </EmptyState>
      </Card>
    );
  }
  const f = describeElite(elite);
  const faction = findFaction(f.factionId);
  const active = eliteActive(elite, now);
  const mine = elite.contributions[player.uid];
  const ready = eliteReadyAt(elite, player.uid);
  const rankOk = bountyRank(st.reputation) >= ELITE_RULES.minRank;
  const ranking = eliteRanking(elite);
  const top = ranking[0]?.damage ?? 1;
  const hpPct = (elite.hp / elite.maxHp) * 100;
  const launch = () =>
    onHunt({
      title: `Proie d'élite : ${f.name}`,
      intro: `Les dégâts valent la puissance d'attaque de ta flotte. ${Math.round(ELITE_RULES.lossPct * 100)} % des vaisseaux sont perdus : ceux que l'Atelier sauve y restent le temps de la réparation, et les survivants rentrent abîmés. Trajet de ${ELITE_RULES.flightMinutes} min, puis retour.`,
      targetPower: null,
      minutes: ELITE_RULES.flightMinutes,
      send: (fleet, formation) => sendEliteAssault(fleet, formation),
    });
  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
      <Card className="relative flex flex-col gap-4 overflow-hidden p-5">
        {faction?.art && <img src={assetUrl(faction.art)} alt="" className="absolute inset-0 h-full w-full object-cover object-top opacity-15" />}
        <div className="absolute inset-0 bg-gradient-to-b from-space-950/40 to-space-950" />
        <div className="relative flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Stars n={5} />
            <HudTag tone={active ? "danger" : elite.status === "killed" ? "mint" : "gold"}>{active ? "Traque ouverte" : elite.status === "killed" ? "Capturé" : "Enfui"}</HudTag>
            <span className="ml-auto font-mono text-xs text-slate-400">
              {active ? `s'enfuit dans ${formatDuration(Math.max(0, Math.floor((elite.endMs - now) / 1000)))}` : "nouvelle proie lundi"}
            </span>
          </div>
          <div>
            <p className="hud-title text-2xl text-slate-100">{f.name}</p>
            <p className="text-sm italic text-slate-300">« {f.crime[0].toUpperCase() + f.crime.slice(1)}. »</p>
            <p className="text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500">{faction?.name}</p>
          </div>
          <div>
            <div className="flex justify-between font-mono text-xs text-slate-400">
              <span>Résistance</span>
              <span>
                {formatNumber(elite.hp)} / {formatNumber(elite.maxHp)}
              </span>
            </div>
            <div className="mt-1 h-4 overflow-hidden border border-gold-glow/40 bg-gold-glow/10">
              <i className="hud-sheen block h-full bg-gradient-to-r from-ember-glow to-gold-glow transition-[width] duration-700" style={{ width: `${hpPct}%` }} />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Tes dégâts" value={formatCompact(mine?.damage ?? 0)} sub={`${mine?.assaults ?? 0} assaut(s)`} tone="ember" />
            <StatTile
              label="Si elle tombe"
              value={
                <span className="flex items-center gap-1">
                  <Amber /> {ELITE_RULES.killed.amber}
                </span>
              }
              sub={`+${ELITE_RULES.killed.xp} XP · ${ELITE_RULES.failed.amber} si elle fuit`}
              tone="gold"
            />
            <StatTile label="Chasseurs" value={ranking.length} tone="accent" />
          </div>
          {active &&
            (rankOk ? (
              <Button className="self-start" disabled={ready > now} onClick={launch}>
                <Crosshair className="mr-1.5 h-4 w-4" /> {ready > now ? `Prochain assaut dans ${formatDuration(Math.ceil((ready - now) / 1000))}` : "Lancer un assaut"}
              </Button>
            ) : (
              <p className="flex items-center gap-1.5 text-sm text-slate-400">
                <Lock className="h-4 w-4" /> Réservée aux chasseurs de rang {rankName(ELITE_RULES.minRank)} : remplis encore quelques primes.
              </p>
            ))}
          <p className="text-xs text-slate-500">
            Un assaut toutes les {ELITE_RULES.cooldownHours} h. Récompense pour chaque chasseur ayant infligé au moins {ELITE_RULES.minShare * 100} % de sa résistance.
          </p>
        </div>
      </Card>
      <HudPanel icon={<Trophy />} title="Meute de chasse" tone="gold">
        {ranking.length === 0 && <EmptyState size="sm" icon={<Target />} title="Personne n'a encore frappé">Lance la traque pour ouvrir le classement.</EmptyState>}
        <ol className="flex flex-col gap-1.5">
          {ranking.slice(0, 15).map((c, i) => (
            <li key={c.uid} className={cn("grid grid-cols-[2rem_1fr_auto] items-center gap-2 text-sm", c.uid === player.uid && "text-cyan-glow")}>
              <span className="font-mono text-xs text-slate-500">#{i + 1}</span>
              <span className="min-w-0">
                <PlayerName uid={c.uid} pseudo={c.pseudo} className="block truncate" />
                <span className="mt-0.5 block h-1 bg-white/5">
                  <i className="block h-full bg-gold-glow" style={{ width: `${(c.damage / top) * 100}%` }} />
                </span>
              </span>
              <span className="text-right font-mono text-xs tabular-nums">{formatCompact(c.damage)}</span>
            </li>
          ))}
        </ol>
      </HudPanel>
    </div>
  );
}

/* ---------- Comptoir de la Ruche ---------- */

const ITEM_ICONS: Record<ShopItemId, typeof Zap> = {
  accelerator: Hourglass,
  boost: Sparkles,
  jammer: Radar,
  beacon: Zap,
  shield: ShieldHalf,
  dossier: BookOpen,
  blueprint: Crosshair,
  planner: CalendarClock,
  title: Crown,
  frame: Star,
  emblem: Trophy,
  emojis: Sparkles,
  phantom: Ghost,
  painkiller: Pill,
  reroll: Dices,
  priority: ArrowUpToLine,
  pheromone: Users,
  vendettaToken: Swords,
  nameColor: Palette,
  keshReaction: Smile,
  roomBanner: Flag,
  planetFx: Orbit,
};

/** 5.27 : illustrations du Comptoir déjà en place (public/assets/bounties/items, docs/illustrations.md) ; 6.14.26 : les 10 premières ; 6.14.92 : les 9 autres. */
const SHOP_ITEM_ART: Partial<Record<ShopItemId, string>> = {
  phantom: "/assets/bounties/items/phantom.webp",
  painkiller: "/assets/bounties/items/painkiller.webp",
  reroll: "/assets/bounties/items/reroll.webp",
  priority: "/assets/bounties/items/priority.webp",
  pheromone: "/assets/bounties/items/pheromone.webp",
  vendettaToken: "/assets/bounties/items/vendettaToken.webp",
  nameColor: "/assets/bounties/items/nameColor.webp",
  keshReaction: "/assets/bounties/items/keshReaction.webp",
  roomBanner: "/assets/bounties/items/roomBanner.webp",
  planetFx: "/assets/bounties/items/planetFx.webp",
  accelerator: "/assets/bounties/items/accelerator.webp",
  boost: "/assets/bounties/items/boost.webp",
  jammer: "/assets/bounties/items/jammer.webp",
  beacon: "/assets/bounties/items/beacon.webp",
  shield: "/assets/bounties/items/shield.webp",
  dossier: "/assets/bounties/items/dossier.webp",
  planner: "/assets/bounties/items/planner.webp",
  title: "/assets/bounties/items/title.webp",
  frame: "/assets/bounties/items/frame.webp",
};

/** 5.28 : état d'un objet, en pastille (effet actif, réserve, acquis). */
function itemState(item: ShopItem, st: BountyState, now: number): { label: string; tone: HudTone } | null {
  const left = (until: number) => formatDuration(Math.floor((until - now) / 1000));
  const reserve = (n: number) => (n > 0 ? { label: `${n} / ${BOUNTY_SHOP_RULES.maxCharges}`, tone: "neutral" as const } : null);
  switch (item.id) {
    case "boost":
      return st.boostUntilMs > now ? { label: `Actif · ${left(st.boostUntilMs)}`, tone: "mint" } : null;
    case "shield":
      return st.shieldUntilMs > now ? { label: `Actif · ${left(st.shieldUntilMs)}`, tone: "mint" } : null;
    case "pheromone":
      return st.pheromoneUntilMs > now ? { label: `Active · ${left(st.pheromoneUntilMs)}`, tone: "mint" } : null;
    case "jammer":
      return reserve(st.jammers);
    case "beacon":
      return reserve(st.beacons);
    case "phantom":
      return reserve(st.phantoms);
    case "priority":
      return reserve(st.priorityContracts);
    case "vendettaToken":
      return reserve(st.vendettaTokens);
    default:
      return owns(st, item.id) ? { label: "Acquis", tone: "mint" } : null;
  }
}

/** Où sert un objet en réserve (rappel sous la description). */
const ITEM_USE: Partial<Record<ShopItemId, string>> = {
  beacon: "S'utilise depuis tes flottes en vol (bouton « Balise »).",
  phantom: "Consommé par ton prochain espionnage.",
  priority: "Consommé par ton prochain contrat de livraison.",
  vendettaToken: "S'utilise sur la page Seigneurs (bouton « Le rappeler »).",
  dossier: "L'officier se choisit sur la page Commandants.",
};

function ShopItemCard({ item, player, st }: { item: ShopItem; player: PlayerState; st: BountyState }) {
  const queues = usePlayerStore((s) => s.queues);
  const [busy, setBusy] = useState(false);
  const now = Date.now();
  const building = Object.entries(queues?.buildingUpgrades ?? {}).filter(([, u]) => u && u.endTime > now);
  const [buildingId, setBuildingId] = useState("");
  // 5.27 : aperçu avant achat et révélation après l'achat d'un objet de prestige.
  const [preview, setPreview] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const canPreview = PREVIEWABLE.includes(item.id);
  const owned = owns(st, item.id);
  const plans = item.id === "reroll" ? rerollablePlans(player) : [];
  const blocker = shopBlocker(player, item, now, queues ?? undefined);
  const short = blocker === "Pas assez d'Ambre.";
  const state = itemState(item, st, now);
  const Icon = ITEM_ICONS[item.id];
  const look = normalizePlanetLook(player.profileStyle?.planet);
  const buy = async () => {
    if (
      item.price >= 150 &&
      !(await askConfirm({
        title: `Acheter ${item.name} ?`,
        message: item.description,
        details: (
          <div className="flex flex-wrap items-center gap-3">
            <CostPill>
              <AmberAmount value={item.price} />
            </CostPill>
            <span className="text-xs text-slate-400">
              Solde après achat : <AmberAmount value={Math.max(0, st.amber - item.price)} label={false} className="font-mono tabular-nums text-slate-200" />
            </span>
          </div>
        ),
        confirmLabel: "Acheter",
        tone: "gold",
      }))
    )
      return;
    setBusy(true);
    try {
      const out = await buyBountyItem(item.id, buildingId || undefined);
      if (canPreview) setRevealed(true);
      else toast.success(out.message);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className={cn("flex min-w-0 flex-col gap-3 p-5", owned && "opacity-80")}>
      <div className="flex items-start gap-3">
        {item.id === "blueprint" ? (
          <img src={assetUrl(KESH_HUNTER_UNIT.image)} alt="" className="h-12 w-12 shrink-0 object-contain" />
        ) : item.id === "emblem" ? (
          <img src={assetUrl(KESH.emblem)} alt="" className="h-12 w-12 shrink-0 object-contain" />
        ) : item.id === "emojis" ? (
          <span className="grid h-12 w-12 shrink-0 grid-cols-2 gap-0.5">
            {KESH_EMOJIS.map((e) => (
              <img key={e.code} src={assetUrl(e.url)} alt="" className="h-6 w-6" />
            ))}
          </span>
        ) : SHOP_ITEM_ART[item.id] ? (
          <img src={assetUrl(SHOP_ITEM_ART[item.id]!)} alt="" className="h-12 w-12 shrink-0 object-contain" />
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center border border-gold-glow/30 bg-gold-glow/10 text-gold-glow">
            <Icon className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="font-display text-sm text-slate-100">{item.name}</p>
            {state && (
              <HudChip size="sm" tone={state.tone}>
                {state.label}
              </HudChip>
            )}
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">{item.description}</p>
          {ITEM_USE[item.id] && <p className="mt-1 text-[11px] text-slate-500">{ITEM_USE[item.id]}</p>}
        </div>
      </div>
      {item.id === "accelerator" && building.length > 1 && (
        <IconSelect
          value={buildingId}
          onChange={setBuildingId}
          options={building.map(([id]) => ({ value: id, label: findBuilding(id)?.name ?? id }))}
          placeholder="Chantier le plus proche de la fin"
          ariaLabel="Chantier à accélérer"
        />
      )}
      {item.id === "reroll" && plans.length > 1 && (
        <IconSelect
          value={buildingId}
          onChange={setBuildingId}
          options={plans.map((m) => ({ value: m.id, label: moduleLabel(m) }))}
          placeholder={`${moduleLabel(plans[0])} (le premier)`}
          ariaLabel="Plan à relancer"
        />
      )}
      {item.id === "nameColor" && owned && <NameTonePicker current={st.nameTone} />}
      {canPreview && !owned && preview && (
        <div className="border border-white/10 bg-space-950/40 p-3">
          <PrestigePreview item={item.id} pseudo={player.pseudo} look={look} />
        </div>
      )}
      {canPreview && (
        <RewardReveal
          open={revealed}
          onClose={() => setRevealed(false)}
          icon={<Icon />}
          title={item.name}
          description="Acquis au Comptoir de la Ruche."
          items={[{ key: item.id, node: <PrestigePreview item={item.id} pseudo={player.pseudo} look={look} /> }]}
          closeLabel="Superbe"
        />
      )}
      {!owned && (
        <div className="mt-auto flex flex-col gap-2 border-t border-white/5 pt-3">
          {blocker && !short && (
            <p className="flex items-start gap-1.5 text-[11px] text-ember-glow">
              <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden /> {blocker}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <CostPill missing={short ? `il manque ${item.price - st.amber}` : undefined}>
              <AmberAmount value={item.price} label={false} />
            </CostPill>
            {canPreview && (
              <Button size="sm" variant="ghost" onClick={() => setPreview((v) => !v)} aria-expanded={preview}>
                <Eye className="h-3.5 w-3.5" /> {preview ? "Masquer" : "Aperçu"}
              </Button>
            )}
            <Button size="sm" variant="warn" className="ml-auto" disabled={busy || !!blocker} title={blocker ?? undefined} onClick={() => void buy()}>
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShoppingBag className="h-3.5 w-3.5" />} Acheter
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}

/** 5.26.3 : couleur de pseudo, parmi les jetons du thème (DESIGN.md). */
function NameTonePicker({ current }: { current: string }) {
  const [busy, setBusy] = useState(false);
  const pick = async (tone: string) => {
    setBusy(true);
    try {
      await setBountyNameTone(tone);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-wrap gap-1" role="group" aria-label="Couleur de pseudo">
      {NAME_TONES.map((t) => (
        <HudChip key={t.id} size="sm" tone={t.id as HudTone} asChild>
          <button type="button" disabled={busy} onClick={() => void pick(t.id)} aria-pressed={current === t.id} className={cn(current !== t.id && "opacity-60")}>
            {t.label}
          </button>
        </HudChip>
      ))}
    </div>
  );
}

/** 5.27 : derniers achats et dons au Comptoir. */
function ShopHistory({ st }: { st: BountyState }) {
  const list = [...st.history].reverse();
  return (
    <HudPanel icon={<History />} title="Mes achats et dons" tone="gold">
      {list.length === 0 ? (
        <EmptyState icon={<Receipt />} title="Rien encore" size="sm" className="p-0">
          Tes achats au Comptoir et tes dons au pot commun s'afficheront ici.
        </EmptyState>
      ) : (
        <PagedList
          items={list}
          as="ul"
          className="flex flex-col divide-y divide-white/5"
          render={(h, i) => (
            <li key={`${h.atMs}-${i}`} className="flex items-center gap-2 py-1.5 text-sm">
              <span className="min-w-0 flex-1 truncate text-slate-200">{h.item === "donate" ? "Don au pot commun" : h.item.startsWith("weekly:") ? `${WEEKLY_OFFERS.find((o) => `weekly:${o.id}` === h.item)?.name ?? "Offre"} (offre de la semaine)` : (SHOP_ITEMS.find((it) => it.id === h.item)?.name ?? h.item)}</span>
              <AmberAmount value={h.amber} label={false} className="font-mono tabular-nums text-slate-300" />
              <span className="w-24 text-right font-mono text-[11px] text-slate-500">{h.atMs ? timeAgo(h.atMs) : "—"}</span>
            </li>
          )}
        />
      )}
    </HudPanel>
  );
}

/** 5.28 : tout ce qui est en cours ou en réserve, en un coup d'œil. */
function ShopSummary({ st }: { st: BountyState }) {
  const now = Date.now();
  const left = (until: number) => formatDuration(Math.floor((until - now) / 1000));
  const effects = [
    { on: st.boostUntilMs > now, label: "Gelée de la Reine", until: st.boostUntilMs },
    { on: st.shieldUntilMs > now, label: "Voile de chitine", until: st.shieldUntilMs },
    { on: st.pheromoneUntilMs > now, label: "Phéromone", until: st.pheromoneUntilMs },
  ].filter((e) => e.on);
  const reserves = [
    { n: st.jammers, label: "Brouilleurs", icon: Radar },
    { n: st.beacons, label: "Balises", icon: Zap },
    { n: st.phantoms, label: "Sondes fantômes", icon: Ghost },
    { n: st.priorityContracts, label: "Contrats prioritaires", icon: ArrowUpToLine },
    { n: st.vendettaTokens, label: "Jetons de vendetta", icon: Swords },
  ];
  return (
    <HudPanel icon={<ShoppingBag />} title="Comptoir de la Ruche" tone="gold" aside={<span className="text-xs text-slate-400">Solde : <AmberAmount value={st.amber} label={false} className="font-mono tabular-nums text-slate-200" /></span>}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">Effets actifs</p>
          {effects.length === 0 ? (
            <p className="text-xs text-slate-500">Aucun pour l'instant.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {effects.map((e) => (
                <HudChip key={e.label} size="sm" tone="mint">
                  {e.label} · <span className="tabular-nums">{left(e.until)}</span>
                </HudChip>
              ))}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500">Réserves</p>
          <ul className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
            {reserves.map((r) => (
              <li key={r.label} className={cn("flex items-center gap-1.5", r.n > 0 ? "text-slate-200" : "text-slate-500")}>
                <r.icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{r.label}</span>
                <span className="font-mono tabular-nums">
                  {r.n} / {BOUNTY_SHOP_RULES.maxCharges}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </HudPanel>
  );
}

const SHOP_GROUPS: { id: ShopItem["group"]; label: string }[] = [
  { id: "consumable", label: "Fournitures de l'Essaim" },
  { id: "unit", label: "Vaisseau" },
  { id: "feature", label: "Outils de commandement" },
  { id: "cosmetic", label: "Prestige" },
];

function ShopTab({ player, st }: { player: PlayerState; st: BountyState }) {
  const queues = usePlayerStore((s) => s.queues);
  const [group, setGroup] = useState<"all" | ShopItem["group"]>("all");
  const [buyable, setBuyable] = useState(false);
  const now = Date.now();
  // Ce qui s'achète maintenant d'abord, ce qui est acquis en dernier.
  const rank = (i: ShopItem) => (owns(st, i.id) ? 2 : shopBlocker(player, i, now, queues ?? undefined) ? 1 : 0);
  const shown = (g: ShopItem["group"]) =>
    SHOP_ITEMS.filter((i) => i.group === g && (!buyable || !shopBlocker(player, i, now, queues ?? undefined))).sort((a, b) => rank(a) - rank(b));
  const groups = SHOP_GROUPS.filter((g) => group === "all" || g.id === group).map((g) => ({ ...g, items: shown(g.id) }));
  return (
    <div className="flex flex-col gap-6">
      <ShopSummary st={st} />
      <WeeklyStockCard />
      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Rayons du Comptoir">
        {[{ id: "all" as const, label: "Tout" }, ...SHOP_GROUPS].map((g) => (
          <HudChip key={g.id} size="sm" tone={group === g.id ? "accent" : "neutral"} asChild>
            <button type="button" onClick={() => setGroup(g.id)} aria-pressed={group === g.id}>
              {g.label}
            </button>
          </HudChip>
        ))}
        <HudChip size="sm" tone={buyable ? "gold" : "neutral"} asChild className="ml-auto">
          <button type="button" onClick={() => setBuyable((v) => !v)} aria-pressed={buyable}>
            Achetables maintenant
          </button>
        </HudChip>
      </div>
      {groups.every((g) => g.items.length === 0) ? (
        <EmptyState icon={<ShoppingBag />} title="Rien d'achetable pour l'instant" size="sm">
          Remplis des primes pour gagner de l'Ambre, ou retire le filtre « Achetables maintenant ».
        </EmptyState>
      ) : (
        groups
          .filter((g) => g.items.length > 0)
          .map((g) => (
            <section key={g.id} className="flex flex-col gap-3">
              <h3 className="hud-eyebrow flex items-center gap-2 text-[11px] text-gold-glow">
                {g.label} <span className="font-mono tabular-nums text-slate-500">{g.items.length}</span>
              </h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {g.items.map((item) => (
                  <ShopItemCard key={item.id} item={item} player={player} st={st} />
                ))}
              </div>
            </section>
          ))
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        <DonateCard />
        <ShopHistory st={st} />
      </div>
      <p className="text-xs text-slate-500">
        Gelée de la Reine : +{Math.round(ECONOMY_RULES.keshBoostPct * 100)} % sur la planète mère. Voile de chitine : protège des nouvelles attaques de joueurs, pas des flottes déjà en route ni des factions.
      </p>
    </div>
  );
}

/* ---------- page ---------- */

export function BountiesPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const [target, setTarget] = useState<HuntTarget | null>(null);
  // 5.26.1 : onglet dans l'adresse (?onglet=comptoir depuis le Planificateur verrouillé).
  const [params, setParams] = useSearchParams();
  const tab = params.get("onglet") === "comptoir" ? "shop" : params.get("onglet") === "elite" ? "elite" : "board";
  const setTab = (v: string) => setParams((p) => (p.set("onglet", v === "shop" ? "comptoir" : v), p), { replace: true });
  const now = Math.floor(Date.now() / 60_000);
  const st = useMemo(() => (player ? viewBounties(player, Date.now()) : null), [player, now]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!player || !st) return null;
  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Opérations" title="Primes" description="Les Kesh'Vaar paient en Ambre de Ruche la capture des pillards de leur Ruche-Mère." />
      <KeshHero st={st} />
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="board">Tableau des primes</TabsTrigger>
          <TabsTrigger value="elite">Proie d'élite</TabsTrigger>
          <TabsTrigger value="shop">Comptoir de la Ruche</TabsTrigger>
        </TabsList>
        <TabsContent value="board" className="mt-3">
          <BoardTab player={player} st={st} onHunt={setTarget} />
        </TabsContent>
        <TabsContent value="elite" className="mt-3">
          <EliteTab player={player} st={st} onHunt={setTarget} />
        </TabsContent>
        <TabsContent value="shop" className="mt-3">
          <ShopTab player={player} st={st} />
        </TabsContent>
      </Tabs>
      {target && <HuntDialog target={target} onClose={() => setTarget(null)} />}
    </div>
  );
}
