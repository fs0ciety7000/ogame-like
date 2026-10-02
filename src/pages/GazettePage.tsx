import { useState } from "react";
import { toast } from "sonner";
import { Crown, Flag, Newspaper, Send, Skull, Sparkles, Swords, TrendingUp, UserPlus, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/hud";
import { PageHeader } from "@/components/layout/PageHeader";
import { gazettePublishAt, type GazetteSectionKind } from "@/game/gazette";
import { adminPublishGazette, useGazetteStore } from "@/services/gazetteService";
import { useAdminStatus } from "@/services/maintenanceService";
import { cn } from "@/lib/utils";

/* v4.6 : la Gazette du secteur, chaque lundi à 9 h. */

const KIND: Record<GazetteSectionKind, { icon: LucideIcon; color: string }> = {
  boss: { icon: Skull, color: "text-danger-glow" },
  vendetta: { icon: Crown, color: "text-ember-glow" },
  war: { icon: Flag, color: "text-violet-glow" },
  progress: { icon: TrendingUp, color: "text-mint-glow" },
  raid: { icon: Swords, color: "text-gold-glow" },
  warlord: { icon: Sparkles, color: "text-ember-glow" },
  newcomers: { icon: UserPlus, color: "text-cyan-glow" },
};

const day = (ms: number) => new Date(ms).toLocaleDateString("fr-FR", { day: "numeric", month: "long", timeZone: "Europe/Paris" });

export function GazettePage() {
  const { issues } = useGazetteStore();
  const admin = useAdminStatus();
  const [selected, setSelected] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const issue = issues.find((i) => i.id === selected) ?? issues[0];
  const now = Date.now();
  const next = gazettePublishAt(now) > now ? gazettePublishAt(now) : gazettePublishAt(now + 7 * 86400_000);

  const publish = async () => {
    if (!confirm("Publier un numéro maintenant ? Tous les joueurs seront notifiés.")) return;
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
          <EmptyState icon={<Newspaper className="h-10 w-10 text-slate-500" />} title="Le premier numéro arrive bientôt">
            Parution : {new Date(next).toLocaleString("fr-FR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" })}.
          </EmptyState>
        </Card>
      ) : (
        <Card className="relative overflow-hidden p-0">
          <div className="border-b-2 border-double border-gold-glow/40 px-5 pb-4 pt-5 text-center sm:px-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-slate-500">
              N°{issue.number} · semaine du {day(issue.fromMs)} au {day(issue.toMs)}
            </p>
            <p className="hud-title mt-1 text-2xl tracking-[0.2em] text-gold-glow sm:text-3xl">La Gazette du Secteur</p>
          </div>
          <div className="px-5 py-5 sm:px-8">
            <h2 className="font-display text-2xl leading-tight text-white sm:text-4xl">{issue.headline}</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {issue.sections.map((sec) => {
                const k = KIND[sec.kind] ?? KIND.boss;
                return (
                  <section key={sec.kind} className="border-t border-white/10 pt-3">
                    <h3 className="mb-1.5 flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-slate-400">
                      <k.icon className={cn("h-4 w-4", k.color)} /> {sec.title}
                    </h3>
                    <ul className="space-y-1 text-sm leading-relaxed text-slate-200">
                      {sec.lines.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {issues.length > 1 && (
        <div className="flex flex-wrap gap-1.5">
          <span className="self-center text-xs text-slate-500">Anciens numéros :</span>
          {issues.map((i) => (
            <Button key={i.id} size="sm" variant={i.id === issue?.id ? "primary" : "secondary"} onClick={() => setSelected(i.id)}>
              N°{i.number}
            </Button>
          ))}
        </div>
      )}

      {admin === true && (
        <Card className="flex flex-wrap items-center gap-2 p-4">
          <span className="text-xs text-slate-400">Administration :</span>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void publish()}>
            <Send className="mr-1 h-3.5 w-3.5" /> Publier un numéro maintenant
          </Button>
        </Card>
      )}
    </div>
  );
}
