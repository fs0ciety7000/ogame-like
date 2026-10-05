import { useState } from "react";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { BookOpen, Flame, ScrollText, Trophy } from "lucide-react";
import { MutatorCallout } from "@/components/game/MutatorCallout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, HudChip } from "@/components/ui/hud";
import { EmptyAction, HudPanel } from "@/components/ui/panel";
import { AmberAmount } from "@/components/ui/amber";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { ChronicleTimeline } from "@/components/game/ChronicleTimeline";
import { SceneDialog } from "@/components/game/StoryDialog";
import { RewardReveal } from "@/components/game/RewardReveal";
import { chronicleBonus, chronicleOf, chroniclesConfig, chronicleState, seasonBossWindow, unlockedEpisodes } from "@/game/chronicles";
import { describePassReward, PASS_POINTS } from "@/game/seasonPass";
import { claimChronicleEpisode, GameActionError } from "@/services/playerService";
import { useContentStore } from "@/services/contentService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";

/* 5.15.11 : page des Chroniques. Les quatre épisodes du mois en frise, ce que
   rapporte chacun (points de passe, jetons, Ambre), la fin du chapitre, le boss
   du mois et les chapitres déjà terminés. */

const fmtDay = (ms: number) => new Date(ms).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Paris" });

export function ChroniclesPage() {
  useNowTicker();
  useContentStore((s) => s.loaded);
  const player = usePlayerStore((s) => s.player);
  const [busy, setBusy] = useState<number | null>(null);
  const [replay, setReplay] = useState<number | null>(null);
  const [chapterGains, setChapterGains] = useState<string[] | null>(null);
  if (!player) return null;
  const now = Date.now();
  const month = chronicleOf(now);
  const bonus = chronicleBonus();

  if (!month) {
    return (
      <div className="flex flex-col gap-4">
        <PageHeader eyebrow="Cosmic Empires / Progression" title="Chroniques" description="L'histoire du secteur, un chapitre par mois, en quatre épisodes." />
        <Card>
          <EmptyState icon="📜" title="Pas de chapitre ce mois-ci" action={<EmptyAction to="/game/codex">Relire le Codex</EmptyAction>}>
            Le prochain chapitre s'ouvrira le 1er du mois.
          </EmptyState>
        </Card>
      </div>
    );
  }

  const st = chronicleState(player, now);
  const open = unlockedEpisodes(now);
  const boss = seasonBossWindow(now, true);
  const chapterDone = st.chapters.includes(month.id);
  const pastChapters = chroniclesConfig().months.filter((m) => st.chapters.includes(m.id) && m.id !== month.id);

  const claim = async (i: number) => {
    setBusy(i);
    try {
      const out = await claimChronicleEpisode(i);
      const extra = out.gained?.length ? ` · ${out.gained.join(" · ")}` : "";
      // 5.15.12 : la fin du chapitre a droit à la révélation des récompenses.
      if (out.chapter) setChapterGains([`+${PASS_POINTS.chronicle} points de passe`, ...(out.gained ?? [])]);
      else toast.success(`Épisode ${i + 1} terminé`, { description: `+${PASS_POINTS.chronicle} points de passe${extra}` });
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Réclamation impossible.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader backdrop={month.boss.image} eyebrow={`Chroniques · ${month.theme.label}`} title={month.title} description={month.synopsis ?? "Quatre épisodes ce mois-ci : le 1er, le 8, le 15 et le 22."} />
      <MutatorCallout />

      <HudPanel
        icon={<BookOpen />}
        title="Épisodes du mois"
        tone="accent"
        aside={
          <span className="font-mono text-[11px] tabular-nums text-slate-400">
            {st.claimed.length} / {month.episodes.length} terminés
          </span>
        }
      >
        <ChronicleTimeline
          month={month}
          bonus={bonus}
          now={now}
          open={open}
          episodes={month.episodes.map((_, i) => ({ progress: st.progress[i] ?? 0, done: st.claimed.includes(i) }))}
          busy={busy}
          onClaim={(i) => void claim(i)}
          onReplay={setReplay}
        />
      </HudPanel>

      <div className="grid gap-4 lg:grid-cols-2">
        <HudPanel icon={<Trophy />} title="Fin du chapitre" tone="gold" accent={chapterDone} aside={chapterDone ? <HudChip size="sm" tone="mint">Terminé</HudChip> : undefined}>
          <div className="flex items-center gap-3">
            {/* 5.16 : sceau « chapitre terminé », en couleur une fois le chapitre bouclé. */}
            <img src={assetUrl("/assets/pass/chapter-complete.webp")} alt="" aria-hidden className={cn("h-14 w-14 shrink-0 object-contain", !chapterDone && "opacity-40 grayscale")} />
            <p className="text-sm text-slate-300">{chapterDone ? "Tu as terminé les quatre épisodes de ce chapitre." : "Termine les quatre épisodes pour recevoir :"}</p>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {month.completion?.title && (
              <HudChip size="sm" tone="gold" className="normal-case tracking-normal">
                Titre « {month.completion.title} »
              </HudChip>
            )}
            {month.completion && (
              <HudChip size="sm" tone="accent" className="normal-case tracking-normal">
                Bannière « {month.title} »
              </HudChip>
            )}
            {bonus.chapter.tokens > 0 && (
              <HudChip size="sm" tone="gold" className="normal-case tracking-normal">
                <TokenIcon size={12} /> +{bonus.chapter.tokens} jetons
              </HudChip>
            )}
            {bonus.chapter.amber > 0 && (
              <HudChip size="sm" tone="gold" className="normal-case tracking-normal">
                <AmberAmount value={bonus.chapter.amber} />
              </HudChip>
            )}
            {(month.completion?.rewards ?? []).map((r, k) => (
              <HudChip key={k} size="sm" tone="mint" className="normal-case tracking-normal">
                {describePassReward(r, month.id)}
              </HudChip>
            ))}
          </div>
          {month.completion?.banner && <span aria-hidden className="h-8 w-full" style={{ background: month.completion.banner }} />}
        </HudPanel>

        <HudPanel icon={<Flame />} title={`Boss du mois · ${month.boss.name}`} tone="danger">
          <p className="text-sm text-slate-300">{month.boss.lore}</p>
          <p className="font-mono text-[11px] text-slate-400">
            {boss ? (now >= boss.startMs ? "Il est là : frappe avant qu'il ne reparte." : `Arrivée le ${fmtDay(boss.startMs)}.`) : "Pas d'apparition programmée pour l'instant."}
            {st.emblems.includes(month.id) ? " Sceau du mois gagné." : ""}
          </p>
          <Button asChild size="sm" variant="ghost" className="self-start">
            <Link to="/game/boss">Voir le boss de saison</Link>
          </Button>
        </HudPanel>
      </div>

      <HudPanel icon={<ScrollText />} title="Chapitres terminés">
        {pastChapters.length === 0 ? (
          <EmptyState size="sm" icon="📜" title="Aucun chapitre passé" action={<EmptyAction to="/game/codex">Ouvrir le Codex</EmptyAction>}>
            Les chapitres que tu termines restent ici, et leurs épisodes dans le Codex.
          </EmptyState>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {pastChapters.map((m) => (
              <li key={m.id} className="hud-cut-sm flex items-center gap-3 border border-white/10 p-2.5" style={{ borderLeft: `2px solid ${m.theme.accent}` }}>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-display text-sm text-white">{m.title}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{m.id}</span>
                </span>
                {m.completion?.title && <span className="truncate text-xs text-gold-glow">« {m.completion.title} »</span>}
              </li>
            ))}
          </ul>
        )}
      </HudPanel>

      <RewardReveal
        open={chapterGains !== null}
        onClose={() => setChapterGains(null)}
        icon={<Trophy />}
        title={`Chapitre « ${month.title} » terminé`}
        description="Les quatre épisodes du mois sont bouclés."
        items={(chapterGains ?? []).map((g, k) => ({ key: String(k), node: <span className="text-xs text-slate-100">{g}</span> }))}
      />
      {replay !== null && (
        <SceneDialog title={`Chroniques · ${month.title} · Épisode ${replay + 1} : ${month.episodes[replay].title}`} lines={month.episodes[replay].lines} pseudo={player.pseudo} onClose={() => setReplay(null)} />
      )}
    </div>
  );
}
