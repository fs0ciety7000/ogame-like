import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  Coins,
  Crown,
  Flag,
  HandHeart,
  Newspaper,
  Send,
  Shield,
  Skull,
  Sparkles,
  Store,
  Swords,
  TrendingUp,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState, HudChip, StatTile, type HudTone } from "@/components/ui/hud";
import { EmptyAction, HudPanel } from "@/components/ui/panel";
import { PageHeader } from "@/components/layout/PageHeader";
import { gazetteNumber, gazettePublishAt, gazetteTrend, type GazetteSectionKind, type GazetteStats } from "@/game/gazette";
import { adminPublishGazette, useGazetteStore } from "@/services/gazetteService";
import { useAdminStatus } from "@/services/maintenanceService";
import { cn } from "@/lib/utils";
import { askConfirm } from "@/components/ui/confirm-dialog";

/* v4.6 : la Gazette du secteur, chaque lundi à 9 h.
   5.15.15 : une page de journal aux composants du design system : manchette,
   chiffres de la semaine comparés au numéro précédent, rubriques en
   panneaux (une couleur sémantique par rubrique), agenda de la semaine. */

const KIND: Record<GazetteSectionKind, { icon: LucideIcon; tone: HudTone; wide?: boolean }> = {
  boss: { icon: Skull, tone: "danger", wide: true },
  vendetta: { icon: Crown, tone: "ember" },
  war: { icon: Flag, tone: "violet" },
  progress: { icon: TrendingUp, tone: "mint" },
  ascension: { icon: Sparkles, tone: "gold" },
  raid: { icon: Swords, tone: "gold" },
  defense: { icon: Shield, tone: "accent" },
  market: { icon: Store, tone: "accent" },
  solidarity: { icon: HandHeart, tone: "mint" },
  alliance: { icon: Users, tone: "violet" },
  warlord: { icon: Crown, tone: "ember" },
  newcomers: { icon: UserPlus, tone: "accent" },
  agenda: { icon: CalendarDays, tone: "accent", wide: true },
};

const STATS: { key: keyof GazetteStats; label: string; tone: HudTone; icon: LucideIcon }[] = [
  { key: "battles", label: "Combats", tone: "danger", icon: Swords },
  { key: "loot", label: "Butin pillé", tone: "gold", icon: Coins },
  { key: "trades", label: "Échanges", tone: "accent", icon: Store },
  { key: "activePlayers", label: "Commandants actifs", tone: "mint", icon: Users },
];

const TREND_CLASS = { up: "text-mint-glow", down: "text-danger-glow", flat: "text-slate-500" };
const day = (ms: number) => new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });

export function GazettePage() {
  const { issues } = useGazetteStore();
  const admin = useAdminStatus();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const index = Math.max(0, issues.findIndex((i) => i.id === selected));
  const issue = issues[index];
  const previous = issues[index + 1];
  const now = Date.now();
  const next = gazettePublishAt(now) > now ? gazettePublishAt(now) : gazettePublishAt(now + 7 * 86400_000);
  const nextLabel = new Date(next).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });

  const publish = async () => {
    if (!(await askConfirm({ title: "Publier un numéro maintenant ?", message: "Il couvrira la période depuis le numéro précédent. Tous les joueurs seront notifiés.", confirmLabel: "Publier" }))) return;
    setBusy(true);
    try {
      await adminPublishGazette();
      setSelected(null);
      toast.success("Numéro publié.");
    } catch (err) {
      toast.error((err as { response?: { message?: string } })?.response?.message ?? "Publication impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Secteur" title="La Gazette" description="Chaque lundi à 9 h, les grands faits de la semaine dans le secteur." />

      {!issue ? (
        <Card>
          <EmptyState icon={<Newspaper />} title="Le premier numéro arrive bientôt" action={<EmptyAction to="/game/joueurs">Voir le classement</EmptyAction>}>
            Parution : {nextLabel}.
          </EmptyState>
        </Card>
      ) : (
        <>
          {/* Manchette */}
          <Card className="tab-enter flex flex-col gap-3 border-t-2 border-t-gold-glow p-5 sm:p-7" key={issue.id}>
            <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-3">
              <span className="hud-title text-lg tracking-[0.2em] text-gold-glow sm:text-xl">La Gazette du Secteur</span>
              <span className="ml-auto flex flex-wrap items-center gap-1.5">
                <HudChip size="sm" tone="gold">
                  N°{issue.number}
                </HudChip>
                <HudChip size="sm" tone="neutral" className="normal-case tracking-normal">
                  {day(issue.fromMs)} → {day(issue.toMs)}
                </HudChip>
              </span>
            </div>
            <h2 className="hud-title text-2xl leading-tight text-slate-100 normal-case sm:text-4xl">{issue.headline}</h2>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">
              {issue.sections.filter((s) => s.kind !== "agenda").length} rubrique{issue.sections.length > 1 ? "s" : ""} · prochain numéro {nextLabel}
            </p>
          </Card>

          {/* Chiffres de la semaine, comparés au numéro précédent */}
          {issue.stats && (
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {STATS.map((s) => {
                const value = issue.stats![s.key];
                const trend = gazetteTrend(value, previous?.stats?.[s.key]);
                return (
                  <StatTile
                    key={s.key}
                    size="sm"
                    tone={s.tone}
                    label={s.label}
                    icon={<s.icon className="h-3.5 w-3.5" />}
                    value={<span className="font-mono">{gazetteNumber(value)}</span>}
                    sub={trend ? <span className={cn("font-mono tabular-nums", TREND_CLASS[trend.dir])}>{trend.text} vs n°{previous!.number}</span> : "premier relevé"}
                  />
                );
              })}
            </div>
          )}

          {/* Rubriques */}
          {issue.sections.length === 0 ? (
            <Card>
              <EmptyState size="sm" icon={<Newspaper />} title="Semaine calme">
                Aucun fait marquant depuis le numéro précédent.
              </EmptyState>
            </Card>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {issue.sections.map((sec) => {
                const k = KIND[sec.kind] ?? KIND.boss;
                return (
                  <HudPanel key={sec.kind} icon={<k.icon />} title={sec.title} tone={k.tone} className={cn("tab-enter", k.wide && "md:col-span-2")}>
                    <ul className={cn("grid gap-1.5 text-sm leading-relaxed text-slate-200", sec.kind === "agenda" && "sm:grid-cols-2")}>
                      {sec.lines.map((l, i) => (
                        <li key={i} className={cn(sec.kind === "agenda" && "hud-cut-sm border border-white/5 bg-white/[0.02] px-2.5 py-1.5 first-letter:uppercase")}>
                          {l}
                        </li>
                      ))}
                    </ul>
                  </HudPanel>
                );
              })}
            </div>
          )}

          {/* Les autres chiffres, plus discrets */}
          {issue.stats && (
            <p className="flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] tabular-nums text-slate-500">
              <span>{gazetteNumber(issue.stats.raids)} pillages réussis</span>
              <span>{gazetteNumber(issue.stats.defenses)} défenses tenues</span>
              <span>{gazetteNumber(issue.stats.tradeVolume)} ressources échangées</span>
              <span>{gazetteNumber(issue.stats.gifts)} dons</span>
              <span>{gazetteNumber(issue.stats.newcomers)} nouveaux</span>
            </p>
          )}
        </>
      )}

      {issues.length > 1 && (
        <HudPanel icon={<Newspaper />} title="Anciens numéros">
          <div className="flex flex-wrap gap-1.5">
            {issues.map((i) => (
              <Button key={i.id} size="sm" variant={i.id === issue?.id ? "primary" : "secondary"} onClick={() => setSelected(i.id)} title={i.headline}>
                N°{i.number}
              </Button>
            ))}
          </div>
        </HudPanel>
      )}

      {admin === true && (
        <HudPanel icon={<Send />} title="Administration">
          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" disabled={busy} onClick={() => void publish()}>
              <Send className="h-3.5 w-3.5" /> Publier un numéro maintenant
            </Button>
            <span className="text-xs text-slate-500">Le numéro couvre la période depuis le précédent : rien n'est publié deux fois.</span>
          </div>
        </HudPanel>
      )}
    </div>
  );
}
