import { useMemo, useState } from "react";
import { AmberIcon } from "@/components/ui/amber";
import { toast } from "sonner";
import { BookOpen, Crosshair, Crown, Hourglass, Lock, Radar, ShieldHalf, ShoppingBag, Sparkles, Star, Timer, Trophy, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/ui/number-input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { HudTag, StatTile } from "@/components/ui/hud";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { IconSelect } from "@/components/ui/icon-select";
import { ResourceIcon } from "@/components/ui/game-icon";
import { PlayerName } from "@/components/ui/player-name";
import { PageHeader } from "@/components/layout/PageHeader";
import { FormationPicker } from "@/components/game/FormationPicker";
import { allianceSiegeFactor } from "@/game/alliances";
import { findBuilding } from "@/game/buildings";
import { computeFleetPower, pveAttackFactor } from "@/game/combat";
import { formationEffects, type FormationId } from "@/game/formations";
import { findFaction } from "@/game/pirates";
import { RESOURCE_LIST } from "@/game/resources";
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
  exchangeLeft,
  FUGITIVES,
  fugitivePower,
  KESH,
  KESH_EMOJIS,
  nextRank,
  nextRefreshMs,
  owns,
  rankName,
  SHOP_ITEMS,
  shopBlocker,
  viewBounties,
  type BountyContract,
  type BountyState,
  type ShopItem,
  type ShopItemId,
} from "@/game/bounties";
import { buyBountyItem, exchangeBountyAmber, sendBountyHunt, sendEliteAssault, useElite } from "@/services/bountyService";
import { GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useFleetStore } from "@/store/fleetStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { triggerWarpEffect } from "@/store/warpEffectStore";
import { assetUrl } from "@/lib/assets";
import { cn, formatCompact, formatDuration, formatNumber } from "@/lib/utils";
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
  const wins = target.targetPower === null ? power > 0 : power > target.targetPower;

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
          {ids.length === 0 && <p className="text-sm text-slate-500">Aucun vaisseau de combat à quai.</p>}
          {ids.map((id) => {
            const owned = player.units[id]?.count ?? 0;
            return (
              <div key={id} className="flex items-center gap-2 text-sm">
                <img src={assetUrl(findUnit(id)?.image ?? "")} alt="" className="h-7 w-7 object-contain" />
                <span className="flex-1 truncate text-slate-300">
                  {findUnit(id)?.name}
                  {id === KESH_HUNTER_UNIT.id && <span className="ml-1 text-[10px] text-gold-glow">+50 % PNJ</span>}
                </span>
                <NumberInput size="sm" value={fleet[id] ?? 0} max={owned} aria-label={`Quantité ${findUnit(id)?.name}`} onChange={(v) => setFleet((f) => ({ ...f, [id]: v }))} className="w-40 shrink-0" />
                <span className="w-10 shrink-0 text-right font-mono text-[10px] text-slate-500" title="À quai">/{formatCompact(owned)}</span>
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
        {target.targetPower !== null && Object.keys(selected).length > 0 && (
          <p className={cn("mt-2 text-xs font-semibold", wins ? "text-mint-glow" : "text-danger-glow")}>
            {wins ? "Ta flotte l'emporte : capture assurée." : "Pas assez puissante : le fugitif s'échappera. Ajoute des vaisseaux, des Traqueurs Kesh ou passe en formation Assaut."}
          </p>
        )}
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
        <img src={assetUrl(KESH.art)} alt={KESH.leader} className="mx-auto h-44 w-32 border border-gold-glow/40 object-cover object-top shadow-[0_0_30px_rgba(255,190,80,0.25)] sm:h-52 sm:w-36 lg:h-56 lg:w-40" />
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <img src={assetUrl(KESH.emblem)} alt="" className="h-10 w-10 drop-shadow-[0_0_10px_rgba(255,190,80,0.45)]" />
            <div>
              <p className="hud-title text-xl text-white">Les {KESH.name}</p>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold-glow">{KESH.full} · alliés</p>
            </div>
          </div>
          <p className="max-w-2xl whitespace-pre-line text-sm leading-relaxed text-slate-300">{KESH.story.split("\n\n").slice(0, 2).join("\n\n")}</p>
          <p className="text-sm italic text-gold-glow/90">« Rapporte-nous leurs noms, commandant. L'Essaim n'oublie ni ses morts, ni ses chasseurs. » — {KESH.leader}</p>
        </div>
        <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-1">
          <div className="border border-gold-glow/30 bg-space-950/70 p-3">
            <p className="hud-eyebrow text-[10px] text-slate-500">Ambre de Ruche</p>
            <p className="flex items-center gap-2 font-display text-3xl text-gold-glow">
              <Amber className="h-8 w-8" /> {formatNumber(st.amber)}
            </p>
            <p className="text-[11px] text-slate-500">{formatNumber(st.amberEarned)} gagnés au total</p>
          </div>
          <div className="border border-white/10 bg-space-950/70 p-3">
            <p className="hud-eyebrow text-[10px] text-slate-500">Rang dans l'Essaim</p>
            <p className="flex items-center gap-1.5 font-display text-lg text-white">
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
          <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.25em] text-slate-500">Avis de recherche</span>
        </div>
        <div>
          <p className="hud-title text-lg leading-tight text-white">{fugitive.name}</p>
          <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{faction?.name ?? "Indépendant"}</p>
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
      send: (fleet, formation) => sendBountyHunt(c.id, fleet, formation),
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
      <Card className="p-6 text-center text-sm text-slate-400">
        <p>Aucune proie d'élite pour l'instant. L'Essaim en désigne une chaque lundi.</p>
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
      intro: `Les dégâts valent la puissance d'attaque de ta flotte. ${Math.round(ELITE_RULES.lossPct * 100)} % des vaisseaux sont perdus (en partie réparés par l'Atelier). Trajet de ${ELITE_RULES.flightMinutes} min, puis retour.`,
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
            <p className="hud-title text-2xl text-white">{f.name}</p>
            <p className="text-sm italic text-slate-300">« {f.crime[0].toUpperCase() + f.crime.slice(1)}. »</p>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">{faction?.name}</p>
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
      <Card className="flex flex-col gap-3 p-4">
        <h2 className="hud-title flex items-center gap-2 text-sm">
          <Trophy className="h-4 w-4 text-gold-glow" /> Meute de chasse
        </h2>
        {ranking.length === 0 && <p className="text-xs text-slate-500">Personne n'a encore frappé.</p>}
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
      </Card>
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
  title: Crown,
  frame: Star,
  emblem: Trophy,
  emojis: Sparkles,
};

function itemStatus(item: ShopItem, st: BountyState, now: number): string | null {
  switch (item.id) {
    case "boost":
      return st.boostUntilMs > now ? `Active encore ${formatDuration(Math.floor((st.boostUntilMs - now) / 1000))}` : null;
    case "jammer":
      return st.jammers > 0 ? `${st.jammers} en réserve` : null;
    case "beacon":
      return st.beacons > 0 ? `${st.beacons} en réserve (bouton « Balise » des flottes)` : null;
    case "shield":
      return st.shieldUntilMs > now ? `Actif encore ${formatDuration(Math.floor((st.shieldUntilMs - now) / 1000))}` : null;
    default:
      return owns(st, item.id) ? "Acquis" : null;
  }
}

function ShopItemCard({ item, player, st }: { item: ShopItem; player: PlayerState; st: BountyState }) {
  const queues = usePlayerStore((s) => s.queues);
  const [busy, setBusy] = useState(false);
  const now = Date.now();
  const building = Object.entries(queues?.buildingUpgrades ?? {}).filter(([, u]) => u && u.endTime > now);
  const [buildingId, setBuildingId] = useState("");
  const blocker = shopBlocker(player, item, now, queues ?? undefined);
  const status = itemStatus(item, st, now);
  const Icon = ITEM_ICONS[item.id];
  const buy = async () => {
    if (item.price >= 150 && !window.confirm(`${item.name} pour ${item.price} Ambre ?`)) return;
    setBusy(true);
    try {
      toast.success((await buyBountyItem(item.id, buildingId || undefined)).message);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className={cn("flex flex-col gap-2 p-4", item.group === "unit" && "border-gold-glow/40")}>
      <div className="flex items-start gap-3">
        {item.id === "blueprint" ? (
          <img src={assetUrl(KESH_HUNTER_UNIT.image)} alt="" className="h-14 w-14 object-contain" />
        ) : item.id === "emblem" ? (
          <img src={assetUrl(KESH.emblem)} alt="" className="h-12 w-12 object-contain" />
        ) : item.id === "emojis" ? (
          <span className="grid grid-cols-2 gap-0.5">
            {KESH_EMOJIS.map((e) => (
              <img key={e.code} src={assetUrl(e.url)} alt="" className="h-6 w-6" />
            ))}
          </span>
        ) : (
          <span className="grid h-12 w-12 shrink-0 place-items-center border border-gold-glow/30 bg-gold-glow/10 text-gold-glow">
            <Icon className="h-6 w-6" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="font-display text-sm text-white">{item.name}</p>
          <p className="text-xs text-slate-400">{item.description}</p>
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
      {status && <p className="text-[11px] text-mint-glow">{status}</p>}
      <Button size="sm" variant={blocker ? "outline" : "warn"} className="mt-auto" disabled={busy || !!blocker} title={blocker ?? undefined} onClick={() => void buy()}>
        <Amber className="mr-1" /> {item.price}
        {blocker && blocker !== "Pas assez d'Ambre." ? <span className="ml-2 truncate text-[11px] font-normal text-slate-500">{blocker}</span> : null}
      </Button>
    </Card>
  );
}

function ExchangeCard({ player, st }: { player: PlayerState; st: BountyState }) {
  const [amount, setAmount] = useState(10);
  const [busy, setBusy] = useState(false);
  const left = exchangeLeft(player, Date.now());
  const rares = RESOURCE_LIST.filter((r) => r.rarity === "rare");
  const exchange = async () => {
    setBusy(true);
    try {
      await exchangeBountyAmber(amount);
      toast.success(`${amount} Ambre échangés contre ${amount * BOUNTY_RULES.exchange.rarePerAmber} de chaque ressource rare.`);
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div>
        <h3 className="hud-title text-sm text-white">Échange d'Ambre</h3>
        <p className="mt-1 text-xs text-slate-400">
          1 <Amber /> = {BOUNTY_RULES.exchange.rarePerAmber} de chaque ressource rare. {BOUNTY_RULES.exchange.weeklyCap} Ambre par semaine au plus ; l'Ambre ne s'achète pas.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <NumberInput size="sm" min={1} max={Math.max(1, Math.min(left, st.amber))} value={amount} onChange={setAmount} className="w-48" aria-label="Ambre à échanger" />
        <span className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          →
          {rares.map((r) => (
            <span key={r.id} className="flex items-center gap-1">
              <ResourceIcon id={r.id} /> {formatCompact(amount * BOUNTY_RULES.exchange.rarePerAmber)}
            </span>
          ))}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={busy || amount > left || amount > st.amber} onClick={() => void exchange()}>
          Échanger
        </Button>
        <span className="text-[11px] text-slate-500">Encore {left} cette semaine</span>
      </div>
    </Card>
  );
}

function ShopTab({ player, st }: { player: PlayerState; st: BountyState }) {
  const groups: { id: ShopItem["group"]; label: string }[] = [
    { id: "consumable", label: "Fournitures de l'Essaim" },
    { id: "unit", label: "Vaisseau" },
    { id: "cosmetic", label: "Prestige" },
  ];
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 lg:grid-cols-[1fr_2fr]">
        <ExchangeCard player={player} st={st} />
        <Card className="relative overflow-hidden p-0">
          <img src={assetUrl(KESH.hunters)} alt="Chasseurs kesh'vaar" className="h-full max-h-56 w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-space-950 via-transparent to-transparent" />
          <p className="absolute bottom-3 left-4 right-4 text-sm text-slate-200">
            Le Comptoir de la Ruche n'accepte que l'Ambre. <span className="text-gold-glow">Chaque prime remplie</span> rapporte de quoi s'équiper.
          </p>
        </Card>
      </div>
      {groups.map((g) => (
        <section key={g.id} className="flex flex-col gap-2">
          <h3 className="hud-eyebrow flex items-center gap-2 text-[11px] text-gold-glow">
            <ShoppingBag className="h-3.5 w-3.5" /> {g.label}
          </h3>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {SHOP_ITEMS.filter((i) => i.group === g.id).map((item) => (
              <ShopItemCard key={item.id} item={item} player={player} st={st} />
            ))}
          </div>
        </section>
      ))}
      <p className="text-xs text-slate-500">
        Gelée de la Reine : +{Math.round(BOUNTY_SHOP_RULES.boostPct * 100)} % sur la planète mère. Voile de chitine : protège des nouvelles attaques de joueurs, pas des flottes déjà en route ni des factions.
      </p>
    </div>
  );
}

/* ---------- page ---------- */

export function BountiesPage() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const [target, setTarget] = useState<HuntTarget | null>(null);
  const [tab, setTab] = useState("board");
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
