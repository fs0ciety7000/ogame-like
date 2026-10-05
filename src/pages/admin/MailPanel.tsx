import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
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
import {
  listCampaigns,
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

  useEffect(() => {
    void listCampaigns().then((list) => {
      setCampaigns(list);
      if (list[0]) setId(list[0].id);
    });
    void mailCount()
      .then(setCount)
      .catch(() => setCount(null));
  }, []);

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
    ? { subject, html: content.html, text: content.text, fromName }
    : null;

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
          <h3 className="hud-title flex items-center gap-2 text-sm text-white">
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
                    : "border-white/10 text-slate-400 hover:text-white",
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
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5" />
            {count ? (
              <>
                <strong className="text-white">{count.recipients}</strong>{" "}
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
          <h3 className="hud-title flex items-center gap-2 text-sm text-white">
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
          <h3 className="hud-title flex items-center gap-2 text-sm text-white">
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
        </Card>
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
