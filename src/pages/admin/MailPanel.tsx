import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  BarChart3,
  Clock,
  Download,
  FileText,
  Loader2,
  Mail,
  PenLine,
  Send,
  TestTube2,
  Upload,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconSelect } from "@/components/ui/icon-select";
import { usePlayerStore } from "@/store/playerStore";
import { EMAIL_MARKDOWN_TEMPLATE, markdownToEmail } from "@/lib/emailMarkdown";
import { cn } from "@/lib/utils";
import { HudPanel } from "@/components/ui/panel";
import {
  MAIL_SEGMENTS,
  segmentLabel,
  type MailSegment,
  type ScheduledCampaign,
  type SentCampaign,
} from "@/game/mailSegments";
import { subscribeAlliances } from "@/services/allianceService";
import type { Alliance } from "@/types/game";
import {
  listCampaigns,
  loadMailState,
  mailSchedule,
  mailUnschedule,
  loadCampaign,
  mailCount,
  mailSend,
  mailTest,
  type MailCampaign,
} from "@/services/mailService";

/* Campagnes e-mail (v3.9.2) : aperçu, test, envoi à tous les joueurs
   joignables. {{PSEUDO}} et {{UNSUBSCRIBE_URL}} sont remplacés pour chacun.
   5.15.14 : ou une campagne en Markdown, déposée (.md) ou écrite ici,
   mise en forme comme les campagnes maison (src/lib/emailMarkdown.ts). */

const DRAFT_KEY = "cosmic.mailDraft";
function readDraft(): string {
  try {
    return localStorage.getItem(DRAFT_KEY) || EMAIL_MARKDOWN_TEMPLATE;
  } catch {
    return EMAIL_MARKDOWN_TEMPLATE;
  }
}

export function MailPanel() {
  const pseudo = usePlayerStore((s) => s.player?.pseudo) ?? "Commandant";
  const [campaigns, setCampaigns] = useState<MailCampaign[]>([]);
  const [id, setId] = useState("");
  const [subject, setSubject] = useState("");
  const [fromName, setFromName] = useState("");
  const [content, setContent] = useState<{ html: string; text: string } | null>(
    null,
  );
  const [count, setCount] = useState<{
    recipients: number;
    optedOut: number;
    smtp: boolean;
  } | null>(null);
  const [testTo, setTestTo] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState<"test" | "send" | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [mode, setMode] = useState<"campaign" | "markdown">("campaign");
  const [md, setMd] = useState(readDraft);
  const [dropping, setDropping] = useState(false);
  const draft = useMemo(
    () => (mode === "markdown" ? markdownToEmail(md) : null),
    [mode, md],
  );

  // 5.16 : segment visé, envoi programmé, historique (ouvertures, clics).
  const [segment, setSegment] = useState<MailSegment>({ id: "all" });
  const [sendAt, setSendAt] = useState("");
  const [history, setHistory] = useState<{
    campaigns: SentCampaign[];
    scheduled: ScheduledCampaign[];
  }>({ campaigns: [], scheduled: [] });
  const alliances = useAllianceList();
  const refreshHistory = () => void loadMailState().then(setHistory);

  useEffect(() => {
    void listCampaigns().then((list) => {
      setCampaigns(list);
      if (list[0]) setId(list[0].id);
    });
    refreshHistory();
  }, []);

  useEffect(() => {
    if (segment.id === "alliance" && !segment.allianceId) return setCount(null);
    void mailCount(segment)
      .then(setCount)
      .catch(() => setCount(null));
  }, [segment]);

  const campaign = campaigns.find((c) => c.id === id);
  useEffect(() => {
    if (!campaign || mode !== "campaign") return;
    setSubject(campaign.subject);
    setFromName(campaign.fromName ?? "");
    setContent(null);
    setResult(null);
    void loadCampaign(campaign).then(setContent);
  }, [campaign, mode]);

  // Markdown : brouillon gardé dans ce navigateur, objet et expéditeur repris de l'en-tête.
  useEffect(() => {
    if (!draft) return;
    try {
      localStorage.setItem(DRAFT_KEY, md);
    } catch {
      /* stockage indisponible : le brouillon reste en mémoire */
    }
    setContent({ html: draft.html, text: draft.text });
    if (draft.meta.subject) setSubject(draft.meta.subject);
    if (draft.meta.from) setFromName(draft.meta.from);
  }, [draft, md]);

  const importFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.(md|markdown|txt)$/i.test(file.name))
      return void toast.error("Dépose un fichier .md.");
    setMd(await file.text());
    setMode("markdown");
    setResult(null);
    toast.success(`« ${file.name} » chargé.`);
  };
  const exportFile = () => {
    const url = URL.createObjectURL(new Blob([md], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `campagne-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const preview = useMemo(
    () =>
      content
        ? content.html
            .split("{{PSEUDO}}")
            .join(pseudo)
            .split("{{UNSUBSCRIBE_URL}}")
            .join("#")
        : "",
    [content, pseudo],
  );
  const body = content
    ? { subject, html: content.html, text: content.text, fromName, segment }
    : null;

  const schedule = async () => {
    if (!body || !sendAt) return;
    try {
      const out = await mailSchedule(body, new Date(sendAt).getTime());
      toast.success(
        `Campagne programmée pour le ${new Date(out.sendAtMs).toLocaleString("fr-FR")}.`,
      );
      setSendAt("");
      refreshHistory();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Programmation impossible.",
      );
    }
  };

  const test = async () => {
    if (!body) return;
    setBusy("test");
    try {
      const out = await mailTest(body, testTo.trim() || undefined);
      toast.success(`Test envoyé à ${out.to}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    if (!body || confirm !== "ENVOYER") return;
    setBusy("send");
    setResult(null);
    try {
      const out = await mailSend(body);
      setResult(
        `${out.sent} e-mail${out.sent > 1 ? "s" : ""} envoyé${out.sent > 1 ? "s" : ""}${out.failed ? ` · ${out.failed} échec(s) : ${out.failedPseudos.join(", ")}` : ""}.`,
      );
      toast.success("Campagne envoyée.");
      setConfirm("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[22rem_1fr]">
      <div className="flex flex-col gap-3">
        <Card className="flex flex-col gap-3 p-4">
          <h3 className="hud-title flex items-center gap-2 text-sm text-slate-100">
            <Mail className="h-4 w-4 text-cyan-glow" /> Campagne
          </h3>
          <div
            className="grid grid-cols-2 gap-1"
            role="tablist"
            aria-label="Source de la campagne"
          >
            {(
              [
                ["campaign", "Campagne prête", FileText],
                ["markdown", "Markdown", PenLine],
              ] as const
            ).map(([m, label, Icon]) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => {
                  setMode(m);
                  setResult(null);
                  setContent(null);
                }}
                className={cn(
                  "hud-cut-sm flex items-center justify-center gap-1.5 border px-2 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors",
                  mode === m
                    ? "border-cyan-glow/60 bg-cyan-glow/10 text-cyan-glow"
                    : "border-white/10 text-slate-400 hover:text-slate-100",
                )}
              >
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>
          {mode === "campaign" ? (
            <IconSelect
              value={id}
              onChange={setId}
              options={campaigns.map((c) => ({ value: c.id, label: c.title }))}
              placeholder="Choisir une campagne…"
              ariaLabel="Campagne"
            />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              <Button asChild size="sm" variant="secondary">
                <label className="cursor-pointer">
                  <Upload className="h-3.5 w-3.5" /> Déposer un .md
                  <input
                    type="file"
                    accept=".md,.markdown,.txt,text/markdown"
                    className="sr-only"
                    onChange={(e) =>
                      void importFile(e.target.files?.[0]).finally(
                        () => (e.target.value = ""),
                      )
                    }
                  />
                </label>
              </Button>
              <Button size="sm" variant="ghost" onClick={exportFile}>
                <Download className="h-3.5 w-3.5" /> Télécharger
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setMd(EMAIL_MARKDOWN_TEMPLATE)}
              >
                Modèle
              </Button>
            </div>
          )}
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Objet
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Nom de l'expéditeur
            <Input
              value={fromName}
              onChange={(e) => setFromName(e.target.value)}
              placeholder="Support Cosmic Empires"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Destinataires
            <select
              value={segment.id}
              onChange={(e) =>
                setSegment(
                  e.target.value === "alliance"
                    ? { id: "alliance", allianceId: alliances[0]?.id ?? "" }
                    : { id: e.target.value as MailSegment["id"] },
                )
              }
              className="h-9 border border-white/10 bg-space-950 px-2 text-sm text-slate-100"
            >
              {MAIL_SEGMENTS.map((sg) => (
                <option key={sg.id} value={sg.id}>
                  {sg.label}
                </option>
              ))}
            </select>
            {segment.id === "alliance" && (
              <select
                value={segment.allianceId ?? ""}
                onChange={(e) =>
                  setSegment({ id: "alliance", allianceId: e.target.value })
                }
                className="h-9 border border-white/10 bg-space-950 px-2 text-sm text-slate-100"
              >
                {alliances.map((a) => (
                  <option key={a.id} value={a.id}>
                    [{a.tag}] {a.name}
                  </option>
                ))}
              </select>
            )}
            <span className="text-[11px] text-slate-500">
              {MAIL_SEGMENTS.find((sg) => sg.id === segment.id)?.hint}
            </span>
          </label>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5" />
            {count ? (
              <>
                <strong className="text-slate-100">{count.recipients}</strong>{" "}
                joueur{count.recipients > 1 ? "s" : ""} joignable
                {count.recipients > 1 ? "s" : ""}
                {count.optedOut > 0 && (
                  <span> · {count.optedOut} désinscrit(s)</span>
                )}
                {!count.smtp && (
                  <span className="text-danger-glow">
                    {" "}
                    · SMTP non configuré
                  </span>
                )}
              </>
            ) : (
              "Décompte indisponible"
            )}
          </p>
        </Card>

        <Card className="flex flex-col gap-2 p-4">
          <h3 className="hud-title flex items-center gap-2 text-sm text-slate-100">
            <TestTube2 className="h-4 w-4 text-mint-glow" /> 1. Envoi de test
          </h3>
          <p className="text-xs text-slate-400">
            Vérifie l'affichage dans une vraie boîte mail avant l'envoi général.
          </p>
          <Input
            value={testTo}
            onChange={(e) => setTestTo(e.target.value)}
            placeholder="Ton adresse (par défaut : celle du compte)"
          />
          <Button
            variant="secondary"
            disabled={!body || busy !== null}
            onClick={() => void test()}
          >
            {busy === "test" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <TestTube2 className="h-4 w-4" />
            )}{" "}
            M'envoyer un test
          </Button>
        </Card>

        <Card className="flex flex-col gap-2 border-ember-glow/40 p-4">
          <h3 className="hud-title flex items-center gap-2 text-sm text-slate-100">
            <Send className="h-4 w-4 text-ember-glow" /> 2. Envoi à tous
          </h3>
          <p className="text-xs text-slate-400">
            Chaque joueur reçoit son pseudo et son lien de désinscription
            personnel. L'envoi prend environ{" "}
            {Math.ceil(((count?.recipients ?? 0) * 0.7) / 60) || 1} min. Tape{" "}
            <strong className="font-mono text-ember-glow">ENVOYER</strong> pour
            confirmer.
          </p>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value.toUpperCase())}
            placeholder="ENVOYER"
            className="font-mono"
          />
          <Button
            variant="warn"
            disabled={
              !body ||
              confirm !== "ENVOYER" ||
              busy !== null ||
              !count?.recipients
            }
            onClick={() => void send()}
          >
            {busy === "send" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}{" "}
            Envoyer à {count?.recipients ?? 0} joueur
            {(count?.recipients ?? 0) > 1 ? "s" : ""}
          </Button>
          {result && <p className="text-xs text-mint-glow">{result}</p>}
          <div className="mt-1 flex flex-col gap-1.5 border-t border-white/10 pt-2">
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5 text-cyan-glow" /> Ou programmer
              l'envoi (le serveur l'envoie à l'heure dite, à ±5 min)
            </p>
            <Input
              type="datetime-local"
              value={sendAt}
              onChange={(e) => setSendAt(e.target.value)}
              className="font-mono"
            />
            <Button
              variant="secondary"
              disabled={!body || !sendAt || busy !== null}
              onClick={() => void schedule()}
            >
              <Clock className="h-4 w-4" /> Programmer
            </Button>
          </div>
        </Card>

        <MailHistory
          history={history}
          onCancel={(cid) => void mailUnschedule(cid).then(refreshHistory)}
          onRefresh={refreshHistory}
        />
      </div>

      <div
        className={cn("grid gap-4", mode === "markdown" && "2xl:grid-cols-2")}
      >
        {mode === "markdown" && (
          <Card
            className={cn(
              "flex flex-col gap-2 p-3",
              dropping && "border-cyan-glow",
            )}
            onDragOver={(e) => {
              e.preventDefault();
              setDropping(true);
            }}
            onDragLeave={() => setDropping(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDropping(false);
              void importFile(e.dataTransfer.files?.[0]);
            }}
          >
            <p className="hud-eyebrow text-[10px] text-slate-500">
              Texte de la campagne (Markdown) · glisse un .md ici
            </p>
            <textarea
              value={md}
              onChange={(e) => setMd(e.target.value)}
              spellCheck
              aria-label="Texte de la campagne en Markdown"
              className="min-h-[60vh] w-full flex-1 resize-y border border-white/10 bg-space-950 p-3 font-mono text-xs leading-relaxed text-slate-200 outline-none focus:border-cyan-glow/60"
            />
            <p className="text-[11px] leading-relaxed text-slate-500">
              En-tête entre <code className="text-slate-300">---</code> :
              subject, from, tag, image. Corps :{" "}
              <code className="text-slate-300"># titre</code>,{" "}
              <code className="text-slate-300">## intertitre</code>,{" "}
              <code className="text-slate-300">**gras**</code>,{" "}
              <code className="text-slate-300">[lien](url)</code>, listes,{" "}
              <code className="text-slate-300">&gt; encadré</code>,{" "}
              <code className="text-slate-300">---</code>,{" "}
              <code className="text-slate-300">![image](/assets/email/…)</code>,
              bouton <code className="text-slate-300">[[Libellé|url]]</code>.{" "}
              <code className="text-slate-300">{"{{PSEUDO}}"}</code> devient le
              pseudo de chaque joueur. Le brouillon est gardé dans ce
              navigateur.
            </p>
          </Card>
        )}
        <Card className="flex flex-col gap-2 p-3">
          <p className="hud-eyebrow text-[10px] text-slate-500">
            Aperçu (avec ton pseudo)
          </p>
          {content ? (
            <iframe
              title="Aperçu de l'e-mail"
              srcDoc={preview}
              sandbox=""
              className="h-[75vh] w-full border border-white/10 bg-[#03040a]"
            />
          ) : (
            <p className="flex items-center gap-2 p-6 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

function useAllianceList(): Alliance[] {
  const [list, setList] = useState<Alliance[]>([]);
  useEffect(() => subscribeAlliances(setList), []);
  return list;
}

/** 5.16 : envois programmés et historique des campagnes (taux d'ouverture et de clic). */
function MailHistory({
  history,
  onCancel,
  onRefresh,
}: {
  history: { campaigns: SentCampaign[]; scheduled: ScheduledCampaign[] };
  onCancel: (id: string) => void;
  onRefresh: () => void;
}) {
  const pct = (n: number, of: number) =>
    of > 0 ? `${Math.round((n / of) * 100)} %` : "—";
  return (
    <HudPanel
      icon={<BarChart3 />}
      title="Suivi des campagnes"
      aside={
        <Button size="sm" variant="ghost" onClick={onRefresh}>
          Actualiser
        </Button>
      }
    >
      {history.scheduled.length > 0 && (
        <ul className="flex flex-col gap-1">
          {history.scheduled.map((c) => (
            <li
              key={c.id}
              className="hud-cut-sm flex items-center gap-2 border border-cyan-glow/20 bg-cyan-glow/[0.04] px-2 py-1.5 text-xs"
            >
              <Clock className="h-3.5 w-3.5 shrink-0 text-cyan-glow" />
              <span className="min-w-0 flex-1 truncate text-slate-200">
                {c.subject}
              </span>
              <span className="shrink-0 font-mono text-[11px] text-slate-400">
                {new Date(c.sendAtMs).toLocaleString("fr-FR", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              <Button size="sm" variant="ghost" onClick={() => onCancel(c.id)}>
                Annuler
              </Button>
            </li>
          ))}
        </ul>
      )}
      {history.campaigns.length === 0 ? (
        <p className="text-xs text-slate-500">
          Aucune campagne envoyée depuis le suivi (5.16).
        </p>
      ) : (
        <div className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] gap-x-3 gap-y-1 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
            Campagne
          </span>
          <span className="text-right font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
            Envoyés
          </span>
          <span className="text-right font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
            Ouverts
          </span>
          <span className="text-right font-mono text-[10px] uppercase tracking-[0.12em] text-slate-500">
            Clics
          </span>
          {history.campaigns.map((c) => (
            <div key={c.id} className="contents">
              <span className="min-w-0">
                <span className="block truncate text-slate-200">
                  {c.subject}
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {new Date(c.sentAtMs).toLocaleDateString("fr-FR")} ·{" "}
                  {segmentLabel(c.segment)}
                </span>
              </span>
              <span className="text-right font-mono tabular-nums text-slate-300">
                {c.sent}
              </span>
              <span className="text-right font-mono tabular-nums text-mint-glow">
                {pct(c.opened.length, c.sent)}
              </span>
              <span className="text-right font-mono tabular-nums text-gold-glow">
                {pct(c.clicked.length, c.sent)}
              </span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-slate-500">
        Ouvertures mesurées par une image invisible : certaines boîtes mail les
        bloquent, le taux réel est souvent plus haut. Les clics sont fiables.
      </p>
    </HudPanel>
  );
}
