import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { ExternalLink, Github, Mail, Radar, Save, Send, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/hud";
import { StaffBadge } from "@/components/ui/staff-badge";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ReportStatusTag, ReportThread } from "@/pages/ReportsPage";
import { REPORT_CATEGORIES, REPORT_RULES, REPORT_STATUSES, type GameReport, type ReportStatus } from "@/game/reports";
import {
  adminCreateGithubIssue,
  adminDeleteReport,
  adminScanAnomalies,
  adminReportConfig,
  adminUpdateReport,
  reportScreenshotUrl,
  subscribeReports,
} from "@/services/reportService";
import { cn, timeAgo } from "@/lib/utils";

type Filter = ReportStatus | "open" | "all";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "open", label: "À traiter" },
  ...REPORT_STATUSES.map((s) => ({ id: s.id as Filter, label: s.label })),
  { id: "all", label: "Tous" },
];

function matches(r: GameReport, f: Filter) {
  if (f === "all") return true;
  if (f === "open") return r.status === "new" || r.status === "in_progress";
  return r.status === f;
}

/** Triage des signalements des joueurs : statut, réponse, résolution, GitHub. */
export function ReportsPanel() {
  const [reports, setReports] = useState<GameReport[] | null>(null);
  const [filter, setFilter] = useState<Filter>("open");
  const [query, setQuery] = useState("");
  const [config, setConfig] = useState<{ email: boolean; github: boolean } | null>(null);
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("signalement");

  useEffect(() => subscribeReports(setReports), []);
  useEffect(() => {
    void adminReportConfig().then(setConfig);
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (reports ?? []).filter((r) => matches(r, filter) && (!q || `${r.title} ${r.reporterPseudo} ${r.description}`.toLowerCase().includes(q)));
  }, [reports, filter, query]);
  const selected = (reports ?? []).find((r) => r.id === selectedId) ?? null;
  const select = (id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set("signalement", id);
    else next.delete("signalement");
    setParams(next, { replace: true });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => {
          const n = (reports ?? []).filter((r) => matches(r, f.id)).length;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={cn(
                "border px-2.5 py-1 font-mono text-xs transition-colors",
                filter === f.id ? "border-cyan-glow/70 bg-cyan-glow/15 text-cyan-glow" : "border-white/10 text-slate-400 hover:border-cyan-glow/40",
              )}
            >
              {f.label} <span className="text-slate-500">{n}</span>
            </button>
          );
        })}
        <Input value={query} placeholder="Rechercher…" onChange={(e) => setQuery(e.target.value)} className="ml-auto h-8 w-48" />
        <Button
          variant="outline"
          size="sm"
          title="Recherche les bonds de stock anormaux depuis la dernière analyse (faite automatiquement chaque heure)."
          onClick={() =>
            void adminScanAnomalies()
              .then((r) => (r.alerts > 0 ? toast.warning(`${r.alerts} alerte(s) de ressources anormales.`) : toast.success("Aucun stock anormal.")))
              .catch(() => toast.error("Analyse impossible."))
          }
        >
          <Radar className="mr-1 h-3.5 w-3.5" /> Analyser les stocks
        </Button>
      </div>
      <p className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500">
        <span className="flex items-center gap-1">
          <Mail className="h-3.5 w-3.5" /> E-mails {config?.email ? "actifs (SMTP de PocketBase)" : "inactifs : configure le SMTP dans PocketBase"}
        </span>
        <span className="flex items-center gap-1">
          <Github className="h-3.5 w-3.5" /> GitHub {config?.github ? "configuré" : "non configuré (variables COSMIC_GITHUB_TOKEN et COSMIC_GITHUB_REPO du serveur)"}
        </span>
      </p>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)]">
        <Card className="flex max-h-[70vh] flex-col overflow-y-auto">
          {reports === null && <p className="p-4 text-sm text-slate-500">Chargement…</p>}
          {reports !== null && shown.length === 0 && <EmptyState icon="🔧" title="Rien ici">Aucun signalement dans cette catégorie.</EmptyState>}
          {shown.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => select(r.id)}
              className={cn(
                "flex flex-col gap-1 border-b border-white/5 px-4 py-3 text-left transition-colors hover:bg-white/[0.03]",
                selectedId === r.id && "bg-cyan-glow/[0.08] shadow-[inset_3px_0_0_var(--color-cyan-glow)]",
              )}
            >
              <span className="flex items-center gap-2">
                <ReportStatusTag status={r.status} />
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
                  {REPORT_CATEGORIES.find((c) => c.id === r.category)?.label} · {timeAgo(r.updatedAtMs)}
                </span>
              </span>
              <span className="truncate text-sm font-semibold text-slate-100">{r.title}</span>
              <span className="text-xs text-slate-500">
                {r.reporterPseudo || r.reporterId}
                {r.autoKey && <span className="ml-2 font-mono text-ember-glow">×{r.occurrences ?? 1}</span>}
              </span>
            </button>
          ))}
        </Card>
        {selected ? <ReportDetail key={selected.id} report={selected} github={!!config?.github} onDeleted={() => select(null)} /> : (
          <Card>
            <EmptyState icon="🔍" title="Aucun signalement sélectionné">Choisis un signalement dans la liste.</EmptyState>
          </Card>
        )}
      </div>
    </div>
  );
}

function ReportDetail({ report, github, onDeleted }: { report: GameReport; github: boolean; onDeleted: () => void }) {
  const [resolution, setResolution] = useState(report.resolution);
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const shot = reportScreenshotUrl(report);
  const ctx = report.context ?? {};

  useEffect(() => setResolution(report.resolution), [report.resolution]);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
          {REPORT_CATEGORIES.find((c) => c.id === report.category)?.label} · ouvert {timeAgo(report.createdAtMs)}
        </p>
        <h3 className="hud-title mt-1 text-lg text-slate-100">{report.title}</h3>
        <p className="mt-1 flex items-center gap-2 text-sm text-slate-400">
          par <strong className="text-slate-200">{report.reporterPseudo || report.reporterId}</strong>
          <StaffBadge uid={report.reporterId} compact />
        </p>
        {report.autoKey && (
          <p className="mt-2 text-xs text-slate-400">
            Erreur automatique · <strong className="text-ember-glow">{report.occurrences ?? 1} occurrence{(report.occurrences ?? 1) > 1 ? "s" : ""}</strong>
            {(report.affected ?? []).length > 0 && <> · joueurs touchés : {(report.affected ?? []).join(", ")}</>}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {REPORT_STATUSES.map((s) => (
          <button
            key={s.id}
            type="button"
            disabled={busy || report.status === s.id}
            onClick={() => void run(() => adminUpdateReport(report.id, { status: s.id }), `Statut : ${s.label}.`)}
            className={cn(
              "border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.12em] transition-colors",
              report.status === s.id ? "border-cyan-glow/70 bg-cyan-glow/15 text-cyan-glow" : "border-white/10 text-slate-400 hover:border-cyan-glow/40",
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <p className="whitespace-pre-line break-words border-l-2 border-white/10 pl-3 text-sm text-slate-200">{report.description}</p>
      {shot && (
        <a href={shot} target="_blank" rel="noreferrer" className="self-start">
          <img src={shot} alt="Capture du joueur" className="max-h-72 border border-white/10" />
        </a>
      )}

      <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 border border-white/5 bg-black/20 p-3 font-mono text-[11px]">
        {(
          [
            ["Version", ctx.version],
            ["Page", ctx.page],
            ["Thème", ctx.theme],
            ["Écran", ctx.screen],
            ["Navigateur", ctx.userAgent],
          ] as const
        ).map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-slate-500">{k}</dt>
            <dd className="break-all text-slate-300">{v || "—"}</dd>
          </div>
        ))}
      </dl>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-400">Résolution (visible du joueur)</span>
        <textarea
          value={resolution}
          rows={3}
          maxLength={REPORT_RULES.resolutionMax}
          placeholder="Ce qui a été corrigé, ou pourquoi ce n'est pas retenu."
          onChange={(e) => setResolution(e.target.value)}
          className="hud-cut-sm border border-cyan-glow/15 bg-space-900/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-glow/60"
        />
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="secondary" size="sm" disabled={busy || resolution === report.resolution} onClick={() => void run(() => adminUpdateReport(report.id, { resolution }), "Résolution enregistrée.")}>
            <Save className="h-4 w-4" /> Enregistrer
          </Button>
          <Button
            size="sm"
            disabled={busy || !resolution.trim()}
            onClick={() => void run(() => adminUpdateReport(report.id, { resolution, status: "resolved" }), "Signalement résolu : le joueur est prévenu.")}
          >
            Marquer résolu
          </Button>
        </div>
      </label>

      <ReportThread history={report.history} />

      <div className="flex flex-col gap-2">
        <textarea
          value={reply}
          rows={2}
          maxLength={REPORT_RULES.commentMax}
          placeholder="Répondre au joueur (il est notifié)…"
          onChange={(e) => setReply(e.target.value)}
          className="hud-cut-sm border border-cyan-glow/15 bg-space-900/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-cyan-glow/60"
        />
        <div className="flex flex-wrap items-center gap-2">
          {report.githubUrl ? (
            <a href={report.githubUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-cyan-glow hover:underline">
              <Github className="h-4 w-4" /> Issue GitHub <ExternalLink className="h-3 w-3" />
            </a>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              disabled={busy || !github}
              title={github ? undefined : "Configure COSMIC_GITHUB_TOKEN et COSMIC_GITHUB_REPO sur le serveur"}
              onClick={() => void run(() => adminCreateGithubIssue(report.id), "Issue GitHub créée.")}
            >
              <Github className="h-4 w-4" /> Créer l'issue GitHub
            </Button>
          )}
          <Button variant="ghost" size="sm" disabled={busy} onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4 text-danger-glow" /> Supprimer
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="ml-auto"
            disabled={busy || !reply.trim()}
            onClick={() =>
              void run(async () => {
                await adminUpdateReport(report.id, { comment: reply, status: report.status === "new" ? "in_progress" : undefined });
                setReply("");
              }, "Réponse envoyée.")
            }
          >
            <Send className="h-4 w-4" /> Répondre
          </Button>
        </div>
      </div>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogTitle>Supprimer ce signalement ?</DialogTitle>
          <DialogDescription>Le joueur ne le verra plus. À réserver aux doublons et aux abus.</DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Annuler
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await adminDeleteReport(report.id);
                  setConfirmDelete(false);
                  onDeleted();
                }, "Signalement supprimé.")
              }
            >
              Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
