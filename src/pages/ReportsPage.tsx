import { useEffect, useMemo, useRef, useState } from "react";
import { PagedList } from "@/components/ui/panel";
import { SkeletonList } from "@/components/ui/skeleton";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Bug, ChevronDown, ImagePlus, Send, X, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState, HudTag } from "@/components/ui/hud";
import { PageHeader } from "@/components/layout/PageHeader";
import { useAuthStore } from "@/store/authStore";
import { CURRENT_VERSION } from "@/lib/changelog";
import { cn, timeAgo } from "@/lib/utils";
import {
  REPORT_CATEGORIES,
  REPORT_RULES,
  REPORT_STATUSES,
  unreadStaffReplies,
  type GameReport,
  type ReportCategory,
  type ReportEntry,
} from "@/game/reports";
import { commentReport, createReport, markReportSeen, reportScreenshotUrl, subscribeReports } from "@/services/reportService";

/** Statut d'un signalement, en étiquette colorée. */
export function ReportStatusTag({ status }: { status: string }) {
  const s = REPORT_STATUSES.find((x) => x.id === status);
  return <HudTag tone={s?.tone ?? "accent"}>{s?.label ?? status}</HudTag>;
}

/** Fil d'un signalement : création, changements de statut, messages. */
export function ReportThread({ history }: { history: ReportEntry[] }) {
  return (
    <ol className="relative flex flex-col gap-3 border-l border-white/10 pl-4">
      {history.map((h, i) => (
        <li key={i} className="relative">
          <span
            aria-hidden
            className={cn("absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-space-900", h.staff ? "bg-cyan-glow" : "bg-slate-500")}
          />
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
            <span className={h.staff ? "text-cyan-glow" : "text-slate-300"}>{h.staff ? `Équipe · ${h.byName}` : h.byName || "Joueur"}</span> · {timeAgo(h.atMs)}
          </p>
          {h.kind === "created" && <p className="text-sm text-slate-400">Signalement envoyé.</p>}
          {h.kind === "status" && (
            <p className="flex items-center gap-2 text-sm text-slate-300">
              Statut changé : <ReportStatusTag status={h.status ?? ""} />
            </p>
          )}
          {h.kind === "comment" && (
            <p
              className={cn(
                "mt-1 whitespace-pre-line border px-3 py-2 text-sm",
                h.staff ? "border-cyan-glow/25 bg-cyan-glow/[0.06] text-slate-100" : "border-white/10 bg-white/[0.03] text-slate-200",
              )}
            >
              {h.text}
            </p>
          )}
        </li>
      ))}
    </ol>
  );
}

function NewReportForm({ uid, onSent }: { uid: string; onSent: (r: GameReport) => void }) {
  const [category, setCategory] = useState<ReportCategory>("bug");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file]);
  useEffect(() => {
    return () => void (preview && URL.revokeObjectURL(preview));
  }, [preview]);

  const submit = async () => {
    setBusy(true);
    try {
      const r = await createReport({ uid, category, title, description, screenshot: file });
      toast.success("Signalement envoyé : l'équipe te répondra ici.");
      setTitle("");
      setDescription("");
      setFile(null);
      onSent(r);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-4 p-5">
      <h2 className="hud-title flex items-center gap-2 text-base text-slate-100">
        <Bug className="h-4 w-4 text-cyan-glow" /> Nouveau signalement
      </h2>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {REPORT_CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            title={c.hint}
            onClick={() => setCategory(c.id)}
            className={cn(
              "hud-cut-sm border px-2.5 py-2 text-left transition-colors",
              category === c.id ? "border-cyan-glow/70 bg-cyan-glow/15 text-cyan-glow" : "border-white/10 bg-white/[0.02] text-slate-300 hover:border-cyan-glow/40",
            )}
          >
            <span className="block font-display text-xs font-semibold uppercase tracking-[0.1em]">{c.label}</span>
            <span className="block truncate text-[11px] text-slate-500">{c.hint}</span>
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">Titre</span>
        <Input value={title} maxLength={REPORT_RULES.titleMax} placeholder="Ex. : le menu ne se ferme pas sur mobile" onChange={(e) => setTitle(e.target.value)} />
      </label>
      <label className="flex flex-col gap-1">
        <span className="flex justify-between font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
          Description
          <span className="normal-case tracking-normal text-slate-500">
            {description.length} / {REPORT_RULES.descriptionMax}
          </span>
        </span>
        <textarea
          value={description}
          rows={5}
          maxLength={REPORT_RULES.descriptionMax}
          placeholder="Ce que tu faisais, ce qui s'est passé, ce que tu attendais…"
          onChange={(e) => setDescription(e.target.value)}
          className="hud-cut-sm border border-cyan-glow/15 bg-space-900/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-glow/60"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            if (f && f.size > 5 * 1024 * 1024) toast.error("Capture trop lourde (5 Mo maximum).");
            else setFile(f);
            e.target.value = "";
          }}
        />
        {preview ? (
          <span className="relative">
            <img src={preview} alt="Capture jointe" className="h-16 w-24 border border-white/10 object-cover" />
            <button type="button" aria-label="Retirer la capture" onClick={() => setFile(null)} className="absolute -right-2 -top-2 grid h-5 w-5 place-items-center bg-danger-glow text-space-950">
              <X className="h-3 w-3" />
            </button>
          </span>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => input.current?.click()}>
            <ImagePlus className="h-4 w-4" /> Joindre une capture
          </Button>
        )}
        <p className="min-w-0 flex-1 text-[11px] text-slate-500">
          Joint automatiquement : version v{CURRENT_VERSION ?? "?"}, page, thème et appareil, pour aider l'équipe à reproduire.
        </p>
      </div>
      <Button disabled={busy || !title.trim() || description.trim().length < REPORT_RULES.descriptionMin} onClick={() => void submit()}>
        <Send className="h-4 w-4" /> Envoyer le signalement
      </Button>
    </Card>
  );
}

function ReportCard({ report, open, onToggle }: { report: GameReport; open: boolean; onToggle: () => void }) {
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const unread = unreadStaffReplies(report);
  const shot = reportScreenshotUrl(report, true);
  const full = reportScreenshotUrl(report);
  const category = REPORT_CATEGORIES.find((c) => c.id === report.category)?.label ?? report.category;

  useEffect(() => {
    if (open && unread > 0) void markReportSeen(report.id);
  }, [open, unread, report.id]);

  const send = async () => {
    setBusy(true);
    try {
      await commentReport(report.id, reply);
      setReply("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className={cn("overflow-hidden", open && "border-cyan-glow/40")}>
      <button type="button" onClick={onToggle} className="flex w-full items-center gap-3 p-4 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <ReportStatusTag status={report.status} />
            <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-slate-500">
              {category} · {timeAgo(report.updatedAtMs)}
            </span>
            {unread > 0 && <span className="bg-danger-glow px-1.5 font-mono text-[11px] font-bold text-space-950">{unread} réponse(s)</span>}
          </div>
          <p className="mt-1 truncate font-semibold text-slate-100">{report.title}</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-500 transition-transform", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="flex flex-col gap-4 border-t border-white/5 p-4">
              <p className="whitespace-pre-line text-sm text-slate-300">{report.description}</p>
              {shot && full && (
                <a href={full} target="_blank" rel="noreferrer" className="self-start">
                  <img src={shot} alt="Capture jointe" className="max-h-40 border border-white/10" />
                </a>
              )}
              {report.resolution && (
                <div className="border-l-2 border-mint-glow bg-mint-glow/[0.06] px-3 py-2">
                  <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-mint-glow">Résolution</p>
                  <p className="whitespace-pre-line text-sm text-slate-200">{report.resolution}</p>
                </div>
              )}
              <ReportThread history={report.history} />
              <div className="flex flex-col gap-2">
                <textarea
                  value={reply}
                  rows={2}
                  maxLength={REPORT_RULES.commentMax}
                  placeholder={report.status === "resolved" || report.status === "rejected" ? "Le problème revient ? Écris ici pour rouvrir le signalement." : "Ajouter une précision…"}
                  onChange={(e) => setReply(e.target.value)}
                  className="hud-cut-sm border border-cyan-glow/15 bg-space-900/80 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-cyan-glow/60"
                />
                <Button variant="secondary" size="sm" className="self-end" disabled={busy || !reply.trim()} onClick={() => void send()}>
                  <Send className="h-4 w-4" /> Envoyer
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}

/** Signaler un problème et suivre ses signalements. */
export function ReportsPage() {
  const uid = useAuthStore((s) => s.user?.uid);
  const [reports, setReports] = useState<GameReport[] | null>(null);
  const [params, setParams] = useSearchParams();
  const openId = params.get("id");

  useEffect(() => {
    if (!uid) return;
    return subscribeReports(setReports, `reporterId = "${uid}"`);
  }, [uid]);

  const toggle = (id: string) => setParams(openId === id ? {} : { id }, { replace: true });
  if (!uid) return null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Support" title="Signalements" description="Un bug, un souci d'affichage, une idée ? Préviens l'équipe et suis la résolution ici." />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <NewReportForm uid={uid} onSent={(r) => setParams({ id: r.id }, { replace: true })} />
        <div className="flex flex-col gap-3">
          <h2 className="hud-eyebrow text-[11px] text-slate-500">Mes signalements</h2>
          {reports === null ? (
            <SkeletonList rows={3} />
          ) : reports.length === 0 ? (
            <Card>
              <EmptyState icon={<Wrench />} title="Aucun signalement">Tout fonctionne ? Parfait. Sinon, décris le problème à gauche.</EmptyState>
            </Card>
          ) : (
            <PagedList items={reports} className="flex flex-col gap-3" render={(r) => <ReportCard key={r.id} report={r} open={openId === r.id} onToggle={() => toggle(r.id)} />} />
          )}
        </div>
      </div>
    </div>
  );
}
