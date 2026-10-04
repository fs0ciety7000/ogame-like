import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Loader2, Mail, Send, TestTube2, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IconSelect } from "@/components/ui/icon-select";
import { usePlayerStore } from "@/store/playerStore";
import { listCampaigns, loadCampaign, mailCount, mailSend, mailTest, type MailCampaign } from "@/services/mailService";

/* Campagnes e-mail (v3.9.2) : aperçu, test, envoi à tous les joueurs
   joignables. {{PSEUDO}} et {{UNSUBSCRIBE_URL}} sont remplacés pour chacun. */

export function MailPanel() {
  const pseudo = usePlayerStore((s) => s.player?.pseudo) ?? "Commandant";
  const [campaigns, setCampaigns] = useState<MailCampaign[]>([]);
  const [id, setId] = useState("");
  const [subject, setSubject] = useState("");
  const [fromName, setFromName] = useState("");
  const [content, setContent] = useState<{ html: string; text: string } | null>(null);
  const [count, setCount] = useState<{ recipients: number; optedOut: number; smtp: boolean } | null>(null);
  const [testTo, setTestTo] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState<"test" | "send" | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    void listCampaigns().then((list) => {
      setCampaigns(list);
      if (list[0]) setId(list[0].id);
    });
    void mailCount().then(setCount).catch(() => setCount(null));
  }, []);

  const campaign = campaigns.find((c) => c.id === id);
  useEffect(() => {
    if (!campaign) return;
    setSubject(campaign.subject);
    setFromName(campaign.fromName ?? "");
    setContent(null);
    setResult(null);
    void loadCampaign(campaign).then(setContent);
  }, [campaign]);

  const preview = useMemo(() => (content ? content.html.split("{{PSEUDO}}").join(pseudo).split("{{UNSUBSCRIBE_URL}}").join("#") : ""), [content, pseudo]);
  const body = content ? { subject, html: content.html, text: content.text, fromName } : null;

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
      setResult(`${out.sent} e-mail${out.sent > 1 ? "s" : ""} envoyé${out.sent > 1 ? "s" : ""}${out.failed ? ` · ${out.failed} échec(s) : ${out.failedPseudos.join(", ")}` : ""}.`);
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
          <IconSelect value={id} onChange={setId} options={campaigns.map((c) => ({ value: c.id, label: c.title }))} placeholder="Choisir une campagne…" ariaLabel="Campagne" />
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Objet
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-xs text-slate-400">
            Nom de l'expéditeur
            <Input value={fromName} onChange={(e) => setFromName(e.target.value)} placeholder="Support Cosmic Empires" />
          </label>
          <p className="flex items-center gap-1.5 text-xs text-slate-400">
            <Users className="h-3.5 w-3.5" />
            {count ? (
              <>
                <strong className="text-white">{count.recipients}</strong> joueur{count.recipients > 1 ? "s" : ""} joignable{count.recipients > 1 ? "s" : ""}
                {count.optedOut > 0 && <span> · {count.optedOut} désinscrit(s)</span>}
                {!count.smtp && <span className="text-danger-glow"> · SMTP non configuré</span>}
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
          <p className="text-xs text-slate-400">Vérifie l'affichage dans une vraie boîte mail avant l'envoi général.</p>
          <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="Ton adresse (par défaut : celle du compte)" />
          <Button variant="secondary" disabled={!body || busy !== null} onClick={() => void test()}>
            {busy === "test" ? <Loader2 className="h-4 w-4 animate-spin" /> : <TestTube2 className="h-4 w-4" />} M'envoyer un test
          </Button>
        </Card>

        <Card className="flex flex-col gap-2 border-ember-glow/40 p-4">
          <h3 className="hud-title flex items-center gap-2 text-sm text-white">
            <Send className="h-4 w-4 text-ember-glow" /> 2. Envoi à tous
          </h3>
          <p className="text-xs text-slate-400">
            Chaque joueur reçoit son pseudo et son lien de désinscription personnel. L'envoi prend environ {Math.ceil(((count?.recipients ?? 0) * 0.7) / 60) || 1} min. Tape <strong className="font-mono text-ember-glow">ENVOYER</strong> pour confirmer.
          </p>
          <Input value={confirm} onChange={(e) => setConfirm(e.target.value.toUpperCase())} placeholder="ENVOYER" className="font-mono" />
          <Button variant="warn" disabled={!body || confirm !== "ENVOYER" || busy !== null || !count?.recipients} onClick={() => void send()}>
            {busy === "send" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Envoyer à {count?.recipients ?? 0} joueur{(count?.recipients ?? 0) > 1 ? "s" : ""}
          </Button>
          {result && <p className="text-xs text-mint-glow">{result}</p>}
        </Card>
      </div>

      <Card className="flex flex-col gap-2 p-3">
        <p className="hud-eyebrow text-[10px] text-slate-500">Aperçu (avec ton pseudo)</p>
        {content ? (
          <iframe title="Aperçu de l'e-mail" srcDoc={preview} sandbox="" className="h-[75vh] w-full border border-white/10 bg-[#03040a]" />
        ) : (
          <p className="flex items-center gap-2 p-6 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </p>
        )}
      </Card>
    </div>
  );
}
