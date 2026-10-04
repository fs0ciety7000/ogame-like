import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BookOpen, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { CODEX_CATEGORIES, CODEX_TITLE, codexEntries, codexProgress, foughtWarlords, type CodexCategory, type CodexEntry } from "@/game/codex";
import { claimCodexTitle, fetchNpcOpponents } from "@/services/codexService";
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
  const entries = useMemo(() => (player ? codexEntries(player, foughtWarlords(opponents), Date.now()) : []), [player, opponents]);
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

      {open && (
        <Dialog open onOpenChange={(o) => !o && setOpen(null)}>
          <DialogContent className="max-w-2xl overflow-hidden p-0">
            <div className="flex flex-col sm:flex-row">
              <img src={assetUrl(open.image)} alt="" className="h-56 w-full object-cover object-top sm:h-auto sm:w-56" />
              <div className="flex max-h-[70vh] flex-1 flex-col gap-2 overflow-y-auto p-5">
                <p className="hud-eyebrow text-[10px] text-gold-glow">{CODEX_CATEGORIES.find((c) => c.id === open.category)?.label}</p>
                <DialogTitle className="text-xl">{open.name}</DialogTitle>
                <p className="-mt-1 text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500">{open.subtitle}</p>
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
