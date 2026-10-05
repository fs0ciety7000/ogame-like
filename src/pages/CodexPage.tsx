import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BookOpen, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { bossesFoughtBy, CODEX_CATEGORIES, CODEX_TITLE, codexCategoryState, codexEntries, codexProgress, foughtWarlords, type CodexCategory, type CodexEntry } from "@/game/codex";
import { claimCodexCategoryReward, claimCodexTitle, fetchNpcOpponents } from "@/services/codexService";
import { useBossHistory } from "@/services/bossHistoryService";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { AmberAmount } from "@/components/ui/amber";
import { RewardReveal } from "@/components/game/RewardReveal";
import { GameActionError } from "@/services/playerService";
import { useContentStore } from "@/services/contentService";
import { usePlayerStore } from "@/store/playerStore";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

/* v4.8 : le Codex, encyclopédie du secteur qui se débloque en jouant. */

export function CodexPage() {
  const player = usePlayerStore((s) => s.player);
  useContentStore((s) => s.loaded);
  const [opponents, setOpponents] = useState<string[]>([]);
  const [tab, setTab] = useState<CodexCategory | "all">("all");
  const [open, setOpen] = useState<CodexEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const uid = player?.uid;
  useEffect(() => {
    if (uid) void fetchNpcOpponents(uid).then(setOpponents).catch(() => undefined);
  }, [uid]);
  const history = useBossHistory();
  const entries = useMemo(
    () => (player ? codexEntries(player, foughtWarlords(opponents), Date.now(), { bossesFought: bossesFoughtBy(history ?? [], player.uid) }) : []),
    [player, opponents, history],
  );
  const [claiming, setClaiming] = useState<CodexCategory | null>(null);
  const [revealed, setRevealed] = useState<{ label: string; tokens: number; amber: number } | null>(null);
  if (!player) return null;
  const progress = codexProgress(entries);
  const shown = tab === "all" ? entries : entries.filter((e) => e.category === tab);
  const hasTitle = (player.titles ?? []).some((t) => t.label === CODEX_TITLE);

  const claim = async () => {
    setBusy(true);
    try {
      const out = await claimCodexTitle();
      toast.success(`Titre « ${out.title} » obtenu !`);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  // 5.15.11 : récompense d'une catégorie complète.
  const claimCategory = async (c: CodexCategory) => {
    setClaiming(c);
    try {
      const out = await claimCodexCategoryReward(c);
      setRevealed({ label: CODEX_CATEGORIES.find((x) => x.id === c)?.label ?? c, tokens: out.tokens, amber: out.amber });
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Impossible pour le moment.");
    } finally {
      setClaiming(null);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Archives" title="Codex" description="L'encyclopédie du secteur. Chaque rencontre ajoute une fiche : factions, seigneurs, boss, unités et Chroniques." />
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <BookOpen className="hidden h-8 w-8 shrink-0 text-gold-glow sm:block" />
        <div className="flex-1">
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="font-display text-sm text-white">
              {progress.unlocked} / {progress.total} fiches
            </span>
            <span className="font-mono text-lg text-gold-glow">{progress.pct} %</span>
          </div>
          <div className="h-2 overflow-hidden bg-white/5">
            <motion.div className="h-full bg-gradient-to-r from-gold-glow/60 to-gold-glow" initial={{ width: 0 }} animate={{ width: `${progress.pct}%` }} transition={{ duration: 0.9, ease: "easeOut" }} />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">À 100 % : le titre « {CODEX_TITLE} ».</p>
        </div>
        {progress.pct >= 100 && !hasTitle && (
          <Button variant="warn" disabled={busy} onClick={() => void claim()}>
            Recevoir le titre
          </Button>
        )}
      </Card>

      {/* 5.15.11 : avancement par catégorie, et sa récompense une fois complète. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
        {CODEX_CATEGORIES.map((c) => {
          const st = codexCategoryState(player, entries, c.id);
          const paid = st.reward.tokens > 0 || st.reward.amber > 0;
          return (
            <div key={c.id} className={cn("hud-cut-sm flex flex-col gap-1.5 border bg-white/[0.02] p-2.5", st.complete ? "border-gold-glow/40" : "border-white/10")}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">{c.label}</span>
                <span className="font-mono text-xs tabular-nums text-slate-100">
                  {st.unlocked}/{st.total}
                </span>
              </div>
              <div className="h-1 bg-white/5">
                <div className="h-full bg-gold-glow/70 transition-[width] duration-500" style={{ width: `${st.total ? (st.unlocked / st.total) * 100 : 0}%` }} />
              </div>
              {paid &&
                (st.claimed ? (
                  <span className="font-mono text-[10px] text-mint-glow">Récompense reçue</span>
                ) : st.complete ? (
                  <Button size="sm" disabled={claiming !== null} onClick={() => void claimCategory(c.id)}>
                    Réclamer
                  </Button>
                ) : (
                  <span className="flex flex-wrap items-center gap-1 text-[10px] text-slate-500">
                    <TokenIcon size={11} /> {st.reward.tokens} · <AmberAmount value={st.reward.amber} />
                  </span>
                ))}
            </div>
          );
        })}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as CodexCategory | "all")}>
        <div className="-mx-1 overflow-x-auto px-1">
          <TabsList>
            <TabsTrigger value="all">Tout</TabsTrigger>
            {CODEX_CATEGORIES.map((c) => {
              const list = entries.filter((e) => e.category === c.id);
              return (
                <TabsTrigger key={c.id} value={c.id}>
                  {c.label} <span className="ml-1 font-mono text-[10px] text-slate-500">{list.filter((e) => e.unlocked).length}/{list.length}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>
      </Tabs>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {shown.map((e, i) => (
          <motion.button
            key={e.id}
            type="button"
            disabled={!e.unlocked}
            onClick={() => setOpen(e)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i, 15) * 0.025 }}
            whileHover={e.unlocked ? { y: -3 } : undefined}
            className={cn(
              "hud-cut group relative flex flex-col overflow-hidden border text-left transition-colors",
              e.unlocked ? "border-gold-glow/25 bg-space-900/60 hover:border-gold-glow/60" : "cursor-default border-white/5 bg-space-950/60",
            )}
          >
            <div className="relative aspect-square w-full overflow-hidden bg-space-950">
              <img
                src={assetUrl(e.image)}
                alt=""
                loading="lazy"
                className={cn("h-full w-full object-cover transition-transform duration-500", e.unlocked ? "group-hover:scale-105" : "scale-110 opacity-25 blur-md grayscale")}
              />
              {!e.unlocked && (
                <span className="absolute inset-0 grid place-items-center">
                  <Lock className="h-6 w-6 text-slate-500" />
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5 p-2.5">
              <span className={cn("truncate font-display text-sm", e.unlocked ? "text-white" : "text-slate-600")}>{e.unlocked ? e.name : "???"}</span>
              <span className="truncate text-[10px] text-slate-500">{e.unlocked ? e.subtitle : CODEX_CATEGORIES.find((c) => c.id === e.category)?.hint}</span>
            </div>
          </motion.button>
        ))}
      </div>

      <RewardReveal
        open={revealed !== null}
        onClose={() => setRevealed(null)}
        icon={<BookOpen />}
        title={`Catégorie « ${revealed?.label ?? ""} » complète`}
        description="Toutes les fiches de la catégorie sont dans ton Codex."
        items={[
          ...(revealed && revealed.tokens > 0 ? [{ key: "t", node: <span className="inline-flex items-center gap-1.5 font-mono text-sm text-slate-100"><TokenIcon size={16} /> +{revealed.tokens} jetons</span> }] : []),
          ...(revealed && revealed.amber > 0 ? [{ key: "a", node: <AmberAmount value={revealed.amber} className="font-mono text-sm text-slate-100" /> }] : []),
        ]}
      />

      {open && (
        <Dialog open onOpenChange={(o) => !o && setOpen(null)}>
          <DialogContent className="max-w-2xl overflow-hidden p-0">
            <div className="flex flex-col sm:flex-row">
              <img src={assetUrl(open.image)} alt="" className="h-56 w-full object-cover object-top sm:h-auto sm:w-56" />
              <div className="flex max-h-[70vh] flex-1 flex-col gap-2 overflow-y-auto p-5">
                <p className="hud-eyebrow text-[10px] text-gold-glow">{CODEX_CATEGORIES.find((c) => c.id === open.category)?.label}</p>
                <DialogTitle className="text-xl">{open.name}</DialogTitle>
                <p className="-mt-1 text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500">{open.subtitle}</p>
                {open.facts && open.facts.length > 0 && (
                  <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 border-y border-white/5 py-2 text-xs">
                    {open.facts.map((f) => (
                      <div key={f.label} className="contents">
                        <dt className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">{f.label}</dt>
                        <dd className="text-slate-200">{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                {open.text.split(/\n\s*\n/).map((para, i) => (
                  <p key={i} className="text-sm leading-relaxed text-slate-300">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
