import { useEffect, useState } from "react";
import { Award } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HudPanel } from "@/components/ui/panel";
import { MutatorCallout } from "@/components/game/MutatorCallout";
import { DailyMissionsCard } from "@/components/game/DailyMissionsCard";
import { ContractsCard } from "@/components/game/ContractsCard";
import { PassProgressCard } from "@/components/game/PassProgressCard";
import { ChronicleHomeCard } from "@/components/game/ChronicleHomeCard";
import { MonthRecapCard } from "@/components/game/MonthRecapCard";
import { ChallengeCard } from "@/components/game/ChallengeCard";
import { WeeklyRecapCard } from "@/components/game/WeeklyRecapCard";
import { dailyMissions } from "@/game/dailyMissions";
import { activePass, passState, passTier, tierRequirements } from "@/game/seasonPass";
import { chronicleOf, chronicleState, unlockedEpisodes } from "@/game/chronicles";
import { HUD_TONE, type HudTone } from "@/components/ui/hud";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";

/* 5.21.1 : un seul bloc pour tout ce qui fait progresser et rapporte
   (missions du jour, contrats, passe, chroniques, défi de la semaine),
   en onglets au lieu de cinq cartes empilées. Un point signale un onglet
   où une récompense attend. */

type HubTab = "today" | "pass" | "chronicles" | "week";

function Dot({ on }: { on: boolean }) {
  return on ? <span aria-label="récompense à récupérer" className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-mint-glow" /> : null;
}

export function ProgressHub({ now }: { now: number }) {
  const player = usePlayerStore((s) => s.player);
  const [tab, setTab] = useState<HubTab>("today");
  // « #contrats » (Que faire maintenant) ouvre l'onglet du jour.
  useEffect(() => {
    const open = () => window.location.hash === "#contrats" && setTab("today");
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, []);
  if (!player) return null;
  const contracts = (player.contracts?.items ?? []).filter((c) => !c.claimed && c.progress >= c.target).length;
  const dm = dailyMissions(player, now);
  const daily = dm.tasks.some((t) => t.done && !t.claimed);
  const items = player.contracts?.items ?? [];
  // Passe : palier atteint et paliers à réclamer.
  const ps = passState(player, now);
  const pass = activePass(ps.seasonId);
  const tier = passTier(ps.points, ps.seasonId);
  const passClaimable = Array.from({ length: tier }, (_, i) => i + 1).filter((t) => !ps.claimed.includes(t) && tierRequirements(player, t, now)?.met !== false).length;
  // Chroniques : épisodes du mois terminés.
  const month = chronicleOf(now);
  const cs = month ? chronicleState(player, now) : null;
  const open = month ? unlockedEpisodes(now) : 0;
  const chronReady = !!month && !!cs && month.episodes.some((e, i) => i < open && !cs.claimed.includes(i) && (cs.progress[i] ?? 0) >= e.objective.count);
  // 5.21.1 : résumé toujours visible, chaque case ouvre son onglet.
  const summary: { tab: HubTab; label: string; value: string; sub: string; tone: HudTone; ready: boolean }[] = [
    { tab: "today", label: "Missions du jour", value: `${dm.tasks.filter((t) => t.claimed).length} / ${dm.tasks.length}`, sub: daily ? "récompense prête" : "récupérées", tone: "mint", ready: daily },
    { tab: "today", label: "Contrats", value: `${items.filter((c) => c.claimed).length} / ${items.length}`, sub: contracts > 0 ? `${contracts} à récupérer` : "récupérés", tone: "mint", ready: contracts > 0 },
    { tab: "pass", label: "Passe", value: `${tier} / ${pass.tiers.length}`, sub: passClaimable > 0 ? `${passClaimable} palier${passClaimable > 1 ? "s" : ""} à réclamer` : "paliers atteints", tone: "gold", ready: passClaimable > 0 },
    { tab: "chronicles", label: "Chroniques", value: month && cs ? `${cs.claimed.length} / ${month.episodes.length}` : "—", sub: chronReady ? "épisode à valider" : "épisodes terminés", tone: "accent", ready: chronReady },
  ];

  return (
    <HudPanel icon={<Award />} title="Progression et récompenses" tone="mint">
      <div id="contrats" className="scroll-mt-24" />
      <div className="mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        {summary.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setTab(s.tab)}
            className={cn("hud-cut-sm relative border bg-space-900/50 px-3 py-2 text-left transition-colors hover:border-cyan-glow/40", tab === s.tab ? "border-cyan-glow/30" : "border-white/10")}
          >
            <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: HUD_TONE[s.tone] }} />
            <span className="block font-mono text-[10px] uppercase tracking-wider text-slate-500">{s.label}</span>
            <span className="block font-mono text-lg text-slate-100">{s.value}</span>
            <span className={cn("block text-[11px]", s.ready ? "text-mint-glow" : "text-slate-500")}>{s.sub}</span>
          </button>
        ))}
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as HubTab)}>
        <TabsList className="w-full justify-start">
          <TabsTrigger value="today">
            Aujourd'hui
            <Dot on={contracts > 0 || daily} />
          </TabsTrigger>
          <TabsTrigger value="pass">
            Passe
            <Dot on={passClaimable > 0} />
          </TabsTrigger>
          <TabsTrigger value="chronicles">
            Chroniques
            <Dot on={chronReady} />
          </TabsTrigger>
          <TabsTrigger value="week">Semaine</TabsTrigger>
        </TabsList>
        <TabsContent value="today" className="mt-4 grid gap-4 lg:grid-cols-2">
          <DailyMissionsCard now={now} />
          <ContractsCard compact />
        </TabsContent>
        <TabsContent value="pass" className="mt-4 flex flex-col gap-4">
          <PassProgressCard now={now} />
          <p className="text-xs text-slate-500">Chaque palier du passe se débloque avec les points gagnés en jouant : missions, combats, boss, primes.</p>
        </TabsContent>
        <TabsContent value="chronicles" className="mt-4 grid gap-4 lg:grid-cols-2">
          <ChronicleHomeCard now={now} />
          <MonthRecapCard now={now} />
        </TabsContent>
        <TabsContent value="week" className="mt-4 flex flex-col gap-4">
          <MutatorCallout compact />
          <ChallengeCard />
          <WeeklyRecapCard />
        </TabsContent>
      </Tabs>
    </HudPanel>
  );
}
