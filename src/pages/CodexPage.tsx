import { useEffect, useMemo, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { BookOpen, LayoutGrid, Lock, Orbit } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/PageHeader";
import { bossesFoughtBy, CODEX_CATEGORIES, CODEX_TITLE, codexCategoryState, codexEntries, codexProgress, foughtWarlords, type CodexCategory, type CodexEntry } from "@/game/codex";
import { claimCodexCategoryReward, claimCodexTitle, fetchNpcOpponents } from "@/services/codexService";
import { useBossHistory } from "@/services/bossHistoryService";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { AmberAmount } from "@/components/ui/amber";
import { RewardReveal } from "@/components/game/RewardReveal";
import { HoloCylinderLazy, hasWebGL } from "@/components/fx/HoloCylinderLazy";
import { GameActionError } from "@/services/playerService";
import { useContentStore } from "@/services/contentService";
import { usePlayerStore } from "@/store/playerStore";
import { assetUrl } from "@/lib/assets";
import { cn } from "@/lib/utils";

/* v4.8 : le Codex, encyclopédie du secteur qui se débloque en jouant. */

const VIEW_KEY = "cosmic-empires:codex-view";

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
  // 5.24 : archives holographiques (cylindre 3D) ou grille classique, choix mémorisé.
  const [view, setView] = useState<"holo" | "grid">(() => {
    try {
      // 6.14.116 (É30-5) : par défaut, archives 3D sur grand écran à souris seulement ; sur mobile, la grille (images chargées
      // à mesure du défilement, sans three.js). Le choix du joueur reste mémorisé.
      return (localStorage.getItem(VIEW_KEY) as "holo" | "grid" | null) ?? (hasWebGL() && window.matchMedia("(min-width: 1024px) and (pointer: fine)").matches ? "holo" : "grid");
    } catch {
      return "grid";
    }
  });
  if (!player) return null;
  const progress = codexProgress(entries);
  const shown = tab === "all" ? entries : entries.filter((e) => e.category === tab);
  const pickView = (v: "holo" | "grid") => {
    setView(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* stockage indisponible : choix pour la session */
    }
  };
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
      // 5.15.13 : un serveur aux hooks anciens ignore la catégorie et répond sur le titre.
      const msg = err instanceof GameActionError ? err.message : "Impossible pour le moment.";
      toast.error(/^Codex complété/.test(msg) ? "Le serveur n'est pas encore à jour : réessaie dans quelques minutes." : msg);
    } finally {
      setClaiming(null);
    }
  };

  const grid = (
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
            decoding="async"
            className={cn("h-full w-full object-cover transition-transform duration-500", e.unlocked ? "group-hover:scale-105" : "scale-110 opacity-25 blur-md grayscale")}
          />
          {!e.unlocked && (
            <span className="absolute inset-0 grid place-items-center">
              <Lock className="h-6 w-6 text-slate-500" />
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5 p-2.5">
          <span className={cn("truncate font-display text-sm", e.unlocked ? "text-slate-100" : "text-slate-500")}>{e.unlocked ? e.name : "???"}</span>
          <span className="truncate text-[11px] text-slate-500">{e.unlocked ? e.subtitle : e.bonus ? "Commandant de saison : dernier palier de son passe." : CODEX_CATEGORIES.find((c) => c.id === e.category)?.hint}</span>
          {/* 6.14.132 (AJ-16) : fiche en plus, hors du pourcentage. */}
          {e.bonus && <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-violet-glow">Fiche en plus</span>}
        </div>
      </motion.button>
    ))}
  </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Archives" title="Codex" description="L'encyclopédie du secteur. Chaque rencontre ajoute une fiche : factions, seigneurs, boss, unités, bâtiments, technologies, colonies et Chroniques." />
      <Card className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <BookOpen className="hidden h-8 w-8 shrink-0 text-gold-glow sm:block" />
        <div className="flex-1">
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <span className="hud-title text-sm text-slate-100">
              <span className="font-mono tabular-nums">
                {progress.unlocked} / {progress.total}
              </span>{" "}
              fiches
            </span>
            <span className="font-mono text-lg tabular-nums text-gold-glow">{progress.pct} %</span>
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

      {/* 5.15.11 : avancement par catégorie, et sa récompense une fois complète.
          6.14.67 (UX-6, AD-17) : les tuiles sont aussi le filtre (aria-pressed) ; la barre d'onglets
          qui répétait les mêmes catégories est retirée. */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6" role="group" aria-label="Filtrer les fiches par catégorie">
        <CategoryTile label="Tout" unlocked={progress.unlocked} total={progress.total} selected={tab === "all"} onSelect={() => setTab("all")} />
        {CODEX_CATEGORIES.map((c) => {
          const st = codexCategoryState(player, entries, c.id);
          const paid = st.reward.tokens > 0 || st.reward.amber > 0;
          return (
            <CategoryTile key={c.id} label={c.label} unlocked={st.unlocked} total={st.total} complete={st.complete} selected={tab === c.id} onSelect={() => setTab(tab === c.id ? "all" : c.id)}>
              {paid &&
                (st.claimed ? (
                  <span className="font-mono text-[11px] text-mint-glow">Récompense reçue</span>
                ) : st.complete ? (
                  <Button size="sm" disabled={claiming !== null} onClick={() => void claimCategory(c.id)}>
                    Réclamer
                  </Button>
                ) : (
                  <span className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                    <TokenIcon size={11} /> {st.reward.tokens} · <AmberAmount value={st.reward.amber} />
                  </span>
                ))}
            </CategoryTile>
          );
        })}
      </div>

      <div className="flex justify-end gap-1.5">
        <Button size="sm" variant={view === "holo" ? "secondary" : "ghost"} onClick={() => pickView("holo")} aria-pressed={view === "holo"}>
          <Orbit className="h-3.5 w-3.5" /> Archives 3D
        </Button>
        <Button size="sm" variant={view === "grid" ? "secondary" : "ghost"} onClick={() => pickView("grid")} aria-pressed={view === "grid"}>
          <LayoutGrid className="h-3.5 w-3.5" /> Grille
        </Button>
      </div>

      {view === "holo" && shown.length > 0 ? (
        <HoloCylinderLazy
          key={tab}
          className="hud-cut h-[340px] border border-cyan-glow/15 bg-space-950/60 sm:h-[420px]"
          items={shown.map((e) => ({ id: e.id, image: e.image, label: e.name, sub: e.unlocked ? e.subtitle : CODEX_CATEGORIES.find((c) => c.id === e.category)?.hint, locked: !e.unlocked }))}
          onSelect={(it) => {
            const e = shown.find((x) => x.id === it.id);
            if (e?.unlocked) setOpen(e);
          }}
          fallback={grid}
        />
      ) : (
        grid
      )}

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
                <p className="hud-eyebrow text-[11px] text-gold-glow">{CODEX_CATEGORIES.find((c) => c.id === open.category)?.label}</p>
                <DialogTitle className="text-xl">{open.name}</DialogTitle>
                <p className="-mt-1 text-[11px] font-mono uppercase tracking-[0.14em] text-slate-500">{open.subtitle}</p>
                {open.facts && open.facts.length > 0 && (
                  <dl className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-3 gap-y-1 border-y border-white/5 py-2 text-xs">
                    {open.facts.map((f) => (
                      <div key={f.label} className="contents">
                        <dt className="font-mono text-[11px] uppercase tracking-[0.12em] text-slate-500">{f.label}</dt>
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

/** 6.14.67 (UX-6) : tuile de catégorie, qui filtre la grille (aria-pressed) et porte sa récompense. */
function CategoryTile({ label, unlocked, total, complete, selected, onSelect, children }: { label: string; unlocked: number; total: number; complete?: boolean; selected: boolean; onSelect: () => void; children?: ReactNode }) {
  return (
    <div
      className={cn(
        "hud-cut-sm flex flex-col gap-1.5 border bg-white/[0.02] p-2.5 transition-colors",
        selected ? "border-cyan-glow/70 bg-cyan-glow/[0.06] shadow-[inset_0_-2px_0_0_var(--color-cyan-glow)]" : complete ? "border-gold-glow/40" : "border-white/10",
      )}
    >
      <button type="button" aria-pressed={selected} onClick={onSelect} className="hud-hit flex flex-col gap-1.5 text-left">
        <span className="flex w-full items-baseline justify-between gap-2">
          <span className={cn("font-mono text-[11px] uppercase tracking-[0.14em]", selected ? "text-cyan-glow" : "text-slate-400")}>{label}</span>
          <span className="font-mono text-xs tabular-nums text-slate-100">
            {unlocked}/{total}
          </span>
        </span>
        <span className="block h-1 w-full bg-white/5">
          <span className="block h-full bg-gold-glow/70 transition-[width] duration-500" style={{ width: `${total ? (unlocked / total) * 100 : 0}%` }} />
        </span>
      </button>
      {children}
    </div>
  );
}
