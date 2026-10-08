import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Ban, Plus, Trophy } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { isTargetedMetric, METRICS, type AchievementMetric } from "@/game/achievements";
import { CONTEST_RULES, contestPhase, validateContest, type ContestsState } from "@/game/contests";
import { adminCancelContest, adminCreateContest, useContests } from "@/services/contestService";
import { Field, SelectField, TextAreaField } from "@/pages/admin/fields";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { useServerPot } from "@/services/serverPotService";
import { formatDateTime } from "@/lib/utils";

/* v5.10.5 : création et suivi des concours du pot commun. */

const PLACES: { id: string; label: string; places: number[] }[] = [
  { id: "podium", label: "Podium : 50 / 30 / 20 %", places: [0.5, 0.3, 0.2] },
  { id: "winner", label: "Un seul gagnant : 100 %", places: [1] },
  { id: "top5", label: "Top 5 : 35 / 25 / 18 / 12 / 10 %", places: [0.35, 0.25, 0.18, 0.12, 0.1] },
  { id: "top10", label: "Top 10 : 25 / 18 / 13 / 10 / 8 / 7 / 6 / 5 / 4 / 4 %", places: [0.25, 0.18, 0.13, 0.1, 0.08, 0.07, 0.06, 0.05, 0.04, 0.04] },
];

const PHASE_LABEL = { scheduled: "À venir", running: "En cours", ending: "Résultats imminents", done: "Terminé", cancelled: "Annulé" } as const;

function toLocalInput(ms: number): string {
  return new Date(ms - new Date(ms).getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
}

export function ContestsAdmin() {
  const live = useContests();
  const pot = useServerPot();
  const [state, setState] = useState<ContestsState | null>(null);
  const contests = state ?? live;
  const now = Date.now();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [metric, setMetric] = useState<AchievementMetric>("loot");
  const [start, setStart] = useState(() => toLocalInput(now));
  const [end, setEnd] = useState(() => toLocalInput(now + 7 * 24 * 3600_000));
  const [share, setShare] = useState(25);
  const [amberShare, setAmberShare] = useState(0);
  const [places, setPlaces] = useState("podium");
  const [busy, setBusy] = useState(false);
  const draft = { title, description, metric, startMs: new Date(start).getTime(), endMs: new Date(end).getTime(), potShare: share / 100, amberShare: amberShare / 100, places: PLACES.find((p) => p.id === places)!.places };
  const errors = useMemo(() => validateContest(draft, now), [title, metric, start, end, share, amberShare, places]); // eslint-disable-line react-hooks/exhaustive-deps
  const metricOptions = (Object.keys(METRICS) as AchievementMetric[]).filter((k) => !isTargetedMetric(k)).map((k) => ({ value: k, label: METRICS[k].label })).sort((a, b) => a.label.localeCompare(b.label, "fr"));

  const create = async () => {
    setBusy(true);
    try {
      setState(await adminCreateContest(draft));
      toast.success("Concours créé : il sera annoncé à tous les joueurs à son début.");
      setTitle("");
      setDescription("");
    } catch (err) {
      toast.error((err as { response?: { message?: string } }).response?.message ?? "Création impossible.");
    } finally {
      setBusy(false);
    }
  };
  const cancel = async (id: string) => {
    if (!(await askConfirm({ title: "Annuler ce concours ?", message: "Aucun prix ne sera versé.", confirmLabel: "Annuler le concours", tone: "danger" }))) return;
    try {
      setState(await adminCancelContest(id));
      toast.success("Concours annulé.");
    } catch (err) {
      toast.error((err as { response?: { message?: string } }).response?.message ?? "Annulation impossible.");
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="hud-title flex items-center gap-2 text-sm text-slate-100">
        <Trophy className="h-4 w-4 text-gold-glow" /> Concours du pot commun
      </h3>
      <p className="text-xs text-slate-400">
        Le score d'un joueur est la progression du critère entre le début et la fin du concours. Le classement est relevé tous les quarts d'heure ; à la fin, la part du pot est versée aux premiers et chacun reçoit une notification.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Field label="Titre">
          <Input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. : Les pillards d'Halloween" />
        </Field>
        <SelectField<AchievementMetric> label="Critère (progression pendant le concours)" value={metric} options={metricOptions} onChange={setMetric} />
        <TextAreaField label="Description (facultatif)" value={description} onChange={setDescription} />
        <Field label="Début (heure du navigateur)">
          <Input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Fin (heure du navigateur)">
          <Input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </Field>
        <Field label={`Part du pot engagée (${share} %)`} hint={`${CONTEST_RULES.maxPotShare * 100} % au plus. Calculée sur le solde du pot à la fin.`}>
          <input type="range" min={0} max={CONTEST_RULES.maxPotShare * 100} value={share} onChange={(e) => setShare(Number(e.target.value))} className="accent-[var(--color-gold-glow)]" aria-label="Part du pot" />
        </Field>
        <Field label={`Part de l'Ambre du pot (${amberShare} %)`} hint={`Réserve d'Ambre actuelle : ${pot?.amber ?? 0}. 0 % : concours sans Ambre.`}>
          <input type="range" min={0} max={CONTEST_RULES.maxPotShare * 100} value={amberShare} onChange={(e) => setAmberShare(Number(e.target.value))} className="accent-[var(--color-gold-glow)]" aria-label="Part de l'Ambre du pot" />
        </Field>
        <SelectField label="Répartition des prix" value={places} options={PLACES.map((p) => ({ value: p.id, label: p.label }))} onChange={setPlaces} />
      </div>
      {errors.length > 0 && title && <p className="text-xs text-danger-glow">{errors.join(" ")}</p>}
      <Button className="self-start" disabled={busy || errors.length > 0} onClick={() => void create()}>
        <Plus className="mr-1 h-3.5 w-3.5" /> Créer le concours
      </Button>

      <div className="flex flex-col gap-1.5 border-t border-white/5 pt-3">
        {(contests?.list ?? []).length === 0 && <p className="text-xs text-slate-500">Aucun concours pour l'instant.</p>}
        {(contests?.list ?? []).map((c) => {
          const phase = contestPhase(c, now);
          return (
            <div key={c.id} className="flex flex-wrap items-center gap-2 border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm">
              <span className="min-w-0 flex-1">
                <span className="text-slate-100">{c.title}</span>{" "}
                <span className="text-xs text-slate-500">
                  · {METRICS[c.metric]?.label} · {Math.round(c.potShare * 100)} % du pot{c.amberShare ? ` + ${Math.round(c.amberShare * 100)} % de l'Ambre` : ""} · {formatDateTime(c.startMs, "numeric")} → {formatDateTime(c.endMs, "numericTime")}
                  {c.results ? ` · ${c.results.length} gagnant(s)` : c.standings.length ? ` · ${c.standings.length} classé(s)` : ""}
                </span>
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">{PHASE_LABEL[phase]}</span>
              {(phase === "scheduled" || phase === "running") && (
                <Button size="sm" variant="ghost" onClick={() => void cancel(c.id)}>
                  <Ban className="mr-1 h-3.5 w-3.5" /> Annuler
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
