import { useEffect, useMemo, useState } from "react";
import { PagedList } from "@/components/ui/panel";
import { CloudFog, Lightbulb, Lock, Search, Trophy } from "lucide-react";
import { toast } from "sonner";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { AmberAmount } from "@/components/ui/amber";
import { bountyState } from "@/game/bounties";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { EmptyState, HudCallout, HudChip } from "@/components/ui/hud";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import {
  ACHIEVEMENTS,
  ACHIEVEMENT_HINT_RULES,
  achievementHint,
  achievementProgress,
  achievementVisibility,
  previousTier,
  type AchievementVisibility,
  CATEGORY_LABELS,
  TIER_LABELS,
  type AchievementCategory,
  type AchievementDef,
  type AchievementTier,
} from "@/game/achievements";
import { buyAchievementHint, fetchAchievementRates, GameActionError } from "@/services/playerService";
import { assetUrl } from "@/lib/assets";
import { cn, formatCompact, formatNumber } from "@/lib/utils";
import type { PlayerState } from "@/types/game";
import { useNavUnlock } from "@/components/layout/NavBar";
import { achievementClosedPage, navCondition, navPageLabel } from "@/game/navUnlock";

type StatusFilter = "all" | "done" | "progress" | "todo";
const STATUS_FILTERS: { id: StatusFilter; label: string }[] = [
  { id: "all", label: "Tous" },
  { id: "done", label: "Obtenus" },
  { id: "progress", label: "En cours" },
  { id: "todo", label: "À obtenir" },
];

/** Minuscules sans accents, pour une recherche tolérante. */
const fold = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

const TIER_STYLE: Record<AchievementTier, { text: string; border: string }> = {
  bronze: { text: "text-ember-glow", border: "border-ember-glow/30" },
  argent: { text: "text-slate-200", border: "border-slate-300/30" },
  or: { text: "text-gold-glow", border: "border-gold-glow/40" },
  legendaire: { text: "text-cyan-glow", border: "border-cyan-glow/50" },
  mythique: { text: "text-[var(--th-rarity-mythic)]", border: "border-[var(--th-rarity-mythic)]/60" },
};

/** Médaille du palier, avec l'emoji du succès au centre. */
export function AchievementMedal({ a, unlocked, size = 72 }: { a: AchievementDef; unlocked: boolean; size?: number }) {
  return (
    <div className={cn("relative shrink-0", !unlocked && "opacity-40 grayscale")} style={{ width: size, height: size }}>
      <img
        src={assetUrl(`/assets/achievements/${a.tier}.webp`)}
        alt=""
        className={cn("absolute inset-0 h-full w-full object-contain", a.tier === "mythique" && "drop-shadow-[0_0_10px_var(--th-rarity-mythic)]")}
        loading="lazy"
      />
      <span className="absolute inset-0 flex items-center justify-center" style={{ fontSize: size * 0.32 }}>
        {unlocked || !a.secret ? a.emoji : <Lock className="h-1/3 w-1/3 text-slate-400" />}
      </span>
    </div>
  );
}

function AchievementCard({ a, player, rate, visibility, before, closedPage }: { a: AchievementDef; player: PlayerState; rate: number | null; visibility: AchievementVisibility; before: AchievementDef | null; closedPage: string | null }) {
  const unlocked = (player.unlockedAchievements ?? []).includes(a.id);
  const fog = !unlocked && visibility === "fog";
  const hidden = !unlocked && (visibility === "secret" || fog || a.secret);
  const progress = achievementProgress(a, player);
  const style = TIER_STYLE[a.tier];
  if (fog) {
    // Palier dans le brouillard : seuls la catégorie et le palier se devinent.
    return (
      <div className="hud-cut-sm relative flex gap-3 overflow-hidden border border-dashed border-white/10 bg-black/30 p-3">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,color-mix(in_srgb,var(--color-slate-400)_10%,transparent),transparent_70%)] backdrop-blur-[1px]" aria-hidden />
        <div className="relative grid h-[72px] w-[72px] shrink-0 place-items-center opacity-40 blur-[1.5px] grayscale">
          <img src={assetUrl(`/assets/achievements/${a.tier}.webp`)} alt="" className="absolute inset-0 h-full w-full object-contain" loading="lazy" />
          <CloudFog className="relative h-6 w-6 text-slate-300" aria-hidden />
        </div>
        <div className="relative flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-sm font-semibold italic text-slate-500">Palier dans le brouillard</p>
            <span className={cn("shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider opacity-60", style.text)}>{TIER_LABELS[a.tier]}</span>
          </div>
          <p className="text-xs text-slate-500">{before ? `Obtiens « ${before.name} » pour le révéler.` : "Révélé quand les paliers précédents tombent."}</p>
          <p className="text-[11px] text-slate-600">
            {CATEGORY_LABELS[a.category].emoji} {CATEGORY_LABELS[a.category].label}
            {rate !== null && ` · ${rate} % des joueurs`}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className={cn("hud-cut-sm flex gap-3 border bg-black/20 p-3", unlocked ? style.border : "border-white/5")}>
      <AchievementMedal a={a} unlocked={unlocked} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className={cn("truncate text-sm font-semibold", unlocked ? "text-slate-100" : "text-slate-300")}>{hidden ? "???" : a.name}</p>
          <span className={cn("shrink-0 font-mono text-[10px] font-semibold uppercase tracking-wider", style.text)}>{TIER_LABELS[a.tier]}</span>
        </div>
        <p className="text-xs text-slate-400">{hidden ? "Succès secret : à toi de le découvrir." : a.description}</p>
        {hidden && a.secret && <SecretHint a={a} player={player} />}
        {/* 6.14.81 (DP-L6, I30) : système pas encore ouvert : la condition d'ouverture, sans le chiffre de progression. */}
        {!unlocked && !hidden && closedPage && (
          <p className="flex items-start gap-1.5 text-[11px] text-slate-500">
            <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
            <span>
              À découvrir : {navPageLabel(closedPage)}. {navCondition(closedPage)}.
            </span>
          </p>
        )}
        {!unlocked && !hidden && !closedPage && progress.target > 1 && (
          <div className="flex items-center gap-2">
            <Progress value={(progress.value / progress.target) * 100} className="h-1.5 flex-1" />
            <span className="tabular-mono text-[10px] text-slate-500">
              {formatCompact(progress.value)} / {formatCompact(progress.target)}
            </span>
          </div>
        )}
        <p className="text-[11px] text-slate-500">
          {a.rewardXp > 0 && `+${a.rewardXp} XP`}
          {a.rewardHours > 0 && ` · ${a.rewardHours} h de production`}
          {a.title && !hidden && ` · titre « ${a.title} »`}
          {rate !== null && ` · ${rate} % des joueurs`}
        </p>
      </div>
    </div>
  );
}

/** 5.26.2 : indice cryptique d'un succès secret, acheté une fois en Ambre. */
function SecretHint({ a, player }: { a: AchievementDef; player: PlayerState }) {
  const [busy, setBusy] = useState(false);
  const bought = (player.stats?.hintsBought ?? []).includes(a.id);
  if (bought) return <HudCallout tone="violet" className="px-2 py-1.5 text-[11px] italic text-slate-300">{achievementHint(a)}</HudCallout>;
  const amber = bountyState(player).amber;
  const buy = async () => {
    const ok = await askConfirm({
      title: "Acheter un indice ?",
      message: "Une piste cryptique sur ce succès secret, sans le seuil exact. Elle reste affichée ensuite.",
      details: <AmberAmount value={ACHIEVEMENT_HINT_RULES.price} className="font-mono tabular-nums" />,
      confirmLabel: "Acheter l'indice",
      tone: "gold",
    });
    if (!ok) return;
    setBusy(true);
    try {
      await buyAchievementHint(a.id);
      toast.success("Indice débloqué.");
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Achat impossible.");
    }
    setBusy(false);
  };
  // 6.14.68 (UX-7) : raison visible (le title ne s'affiche pas au toucher).
  return (
    <span className="flex flex-wrap items-center gap-2 self-start">
    <Button size="sm" variant="ghost" className="self-start" disabled={busy || amber < ACHIEVEMENT_HINT_RULES.price} title={amber < ACHIEVEMENT_HINT_RULES.price ? "Pas assez d'Ambre." : undefined} onClick={() => void buy()}>
      <Lightbulb className="h-3.5 w-3.5" /> Indice · <AmberAmount value={ACHIEVEMENT_HINT_RULES.price} label={false} className="font-mono tabular-nums" />
    </Button>
    {amber < ACHIEVEMENT_HINT_RULES.price && <span className="text-[11px] text-slate-400">Pas assez d'Ambre.</span>}
    </span>
  );
}

/** Page Succès : progression par catégorie, récompenses et rareté. */
export function AchievementsPage() {
  const player = usePlayerStore((s) => s.player);
  const [tab, setTab] = useState<AchievementCategory | "all">("all");
  // 5.26.1 : recherche, état et palier.
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [tier, setTier] = useState<AchievementTier | "all">("all");
  const [rates, setRates] = useState<{ players: number; counts: Record<string, number> } | null>(null);
  useEffect(() => {
    void fetchAchievementRates().then(setRates);
  }, []);
  const list = useMemo(() => ACHIEVEMENTS.filter((a) => a.enabled), []);
  const nav = useNavUnlock();
  if (!player) return null;

  const unlocked = new Set(player.unlockedAchievements ?? []);
  const done = list.filter((a) => unlocked.has(a.id));
  // 5.26.1 : brouillard des paliers (anti-calcul d'échelle complète).
  const visibility = achievementVisibility(list, unlocked);
  const fogged = list.filter((a) => visibility.get(a.id) === "fog").length;
  // Le palier précédent n'est nommé que s'il est lui-même visible (pas de fuite en cascade).
  const revealedBefore = (a: AchievementDef) => {
    const b = previousTier(list, a);
    return b && (unlocked.has(b.id) || (visibility.get(b.id) === "shown" && !b.secret)) ? b : null;
  };
  const xp = done.reduce((s, a) => s + a.rewardXp, 0);
  const categories = Object.keys(CATEGORY_LABELS) as AchievementCategory[];
  const ratio = (a: AchievementDef) => {
    const p = achievementProgress(a, player);
    return p.target > 0 ? p.value / p.target : 0;
  };
  const q = fold(query.trim());
  const shown = list
    .filter((a) => tab === "all" || a.category === tab)
    .filter((a) => tier === "all" || a.tier === tier)
    .filter((a) => {
      if (status === "all") return true;
      const got = unlocked.has(a.id);
      if (status === "done") return got;
      if (status === "progress") return !got && visibility.get(a.id) === "shown" && ratio(a) > 0 && !achievementClosedPage(a.metric, nav.closed);
      return !got;
    })
    .filter((a) => {
      if (!q) return true;
      // Un succès secret ou dans le brouillard ne se trahit pas par la recherche.
      if (!unlocked.has(a.id) && (a.secret || visibility.get(a.id) !== "shown")) return false;
      return fold(`${a.name} ${a.description} ${CATEGORY_LABELS[a.category].label} ${TIER_LABELS[a.tier]}`).includes(q);
    })
    .sort(
      (x, y) =>
        Number(unlocked.has(y.id)) - Number(unlocked.has(x.id)) ||
        Number(visibility.get(x.id) === "fog") - Number(visibility.get(y.id) === "fog") ||
        ratio(y) - ratio(x),
    );
  const rate = (id: string) => (rates && rates.players > 0 ? Math.round(((rates.counts[id] ?? 0) / rates.players) * 100) : null);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Succès" title="Succès" description="Tes exploits, leurs récompenses, et les secrets qui restent à découvrir." />
      <Card className="flex flex-wrap items-center gap-4 p-4">
        <Trophy className="h-8 w-8 text-gold-glow" />
        <div>
          <p className="font-mono text-xl tabular-nums text-slate-100">
            {done.length} / {list.length}
          </p>
          <p className="text-xs text-slate-400">
            succès obtenus · <span className="font-mono tabular-nums">{formatNumber(xp)}</span> XP gagnés
            {fogged > 0 && (
              <>
                {" "}
                · <span className="font-mono tabular-nums">{fogged}</span> paliers dans le brouillard
              </>
            )}
          </p>
        </div>
        <Progress value={(done.length / Math.max(1, list.length)) * 100} className="min-w-40 flex-1" />
        <div className="flex gap-3 text-xs">
          {(Object.keys(TIER_LABELS) as AchievementTier[]).map((t) => (
            <span key={t} className={TIER_STYLE[t].text}>
              {TIER_LABELS[t]}{" "}
              <span className="font-mono tabular-nums">
                {done.filter((a) => a.tier === t).length}/{list.filter((a) => a.tier === t).length}
              </span>
            </span>
          ))}
        </div>
      </Card>
      <div className="flex flex-wrap gap-1" role="tablist" aria-label="Catégories">
        {(["all", ...categories] as const).map((c) => {
          const items = c === "all" ? list : list.filter((a) => a.category === c);
          return (
            <HudChip key={c} tone={tab === c ? "accent" : "neutral"} asChild>
              <button type="button" role="tab" aria-selected={tab === c} onClick={() => setTab(c)}>
                {c === "all" ? "Tous" : `${CATEGORY_LABELS[c].emoji} ${CATEGORY_LABELS[c].label}`}{" "}
                <span className="font-mono tabular-nums opacity-70">
                  {items.filter((a) => unlocked.has(a.id)).length}/{items.length}
                </span>
              </button>
            </HudChip>
          );
        })}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="relative min-w-52 flex-1 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" aria-hidden />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un succès (nom, description)…" aria-label="Rechercher un succès" className="pl-8" />
        </label>
        <div className="flex flex-wrap gap-1" role="group" aria-label="État">
          {STATUS_FILTERS.map((f) => (
            <HudChip key={f.id} size="sm" tone={status === f.id ? "accent" : "neutral"} asChild>
              <button type="button" aria-pressed={status === f.id} onClick={() => setStatus(f.id)}>
                {f.label}
              </button>
            </HudChip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1" role="group" aria-label="Palier">
          {(["all", ...(Object.keys(TIER_LABELS) as AchievementTier[])] as const).map((t) => (
            <HudChip key={t} size="sm" tone={tier === t ? "accent" : "neutral"} asChild>
              <button type="button" aria-pressed={tier === t} onClick={() => setTier(t)}>
                {t === "all" ? "Tous paliers" : TIER_LABELS[t]}
              </button>
            </HudChip>
          ))}
        </div>
        <span className="ml-auto font-mono text-[11px] tabular-nums text-slate-500">
          {shown.length} / {list.length}
        </span>
      </div>
      {shown.length === 0 && (
        <EmptyState icon="🔎" title="Aucun succès ne correspond" action={<Button size="sm" variant="ghost" onClick={() => (setQuery(""), setStatus("all"), setTier("all"), setTab("all"))}>Effacer les filtres</Button>}>
          Change la recherche ou les filtres.
        </EmptyState>
      )}
      <PagedList key={`${tab}|${status}|${tier}|${q}`} items={shown} className="grid gap-2 md:grid-cols-2 xl:grid-cols-3" render={(a) => <AchievementCard key={a.id} a={a} player={player} rate={rate(a.id)} visibility={visibility.get(a.id) ?? "shown"} before={revealedBefore(a)} closedPage={unlocked.has(a.id) ? null : achievementClosedPage(a.metric, nav.closed)} />} />
    </div>
  );
}
