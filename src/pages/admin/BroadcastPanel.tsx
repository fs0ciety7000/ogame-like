import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Bell, Send, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BROADCAST_SEGMENTS, validateBroadcast, type BroadcastSegment } from "@/game/broadcast";
import { pb } from "@/lib/pocketbase";
import { Field, SelectField, TextAreaField } from "@/pages/admin/fields";
import { askConfirm } from "@/components/ui/confirm-dialog";

/* v5.10.5 : messages ciblés — une notification dans le jeu pour un groupe de joueurs. */

const LINKS = [
  { value: "", label: "Aucun lien" },
  { value: "/game", label: "Accueil" },
  { value: "/game/uber", label: "Boss mondial" },
  { value: "/game/etat-major", label: "État-major (officiers, reliques, capsules)" },
  { value: "/game/boss", label: "Boss de saison" },
  { value: "/game/concours", label: "Concours" },
  { value: "/game/commerce", label: "Commerce" },
  { value: "/game/alliance", label: "Alliance" },
  { value: "/game/passe", label: "Passe de saison" },
  { value: "/game/nouveautes", label: "Nouveautés" },
];

function send(body: Record<string, unknown>): Promise<{ count: number; sent: boolean }> {
  return pb.send("/api/cosmic/admin/broadcast", { method: "POST", body });
}

export function BroadcastPanel() {
  const [segment, setSegment] = useState<BroadcastSegment>("inactive7");
  const [allianceId, setAllianceId] = useState("");
  const [alliances, setAlliances] = useState<{ id: string; name: string; tag: string }[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [link, setLink] = useState("");
  const [count, setCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void pb
      .collection("alliances")
      .getFullList<{ id: string; name: string; tag: string }>({ fields: "id,name,tag", sort: "name" })
      .then(setAlliances)
      .catch(() => setAlliances([]));
  }, []);

  useEffect(() => {
    let alive = true;
    setCount(null);
    if (segment === "alliance" && !allianceId) return;
    void send({ segment, allianceId, dryRun: true })
      .then((r) => alive && setCount(r.count))
      .catch(() => alive && setCount(null));
    return () => {
      alive = false;
    };
  }, [segment, allianceId]);

  const errors = validateBroadcast({ segment, title, message, link, allianceId });
  const seg = BROADCAST_SEGMENTS.find((s) => s.id === segment)!;

  const submit = async () => {
    if (!(await askConfirm({ title: `Envoyer à ${count ?? "?"} joueur(s) ?`, message: "La notification part tout de suite.", confirmLabel: "Envoyer" }))) return;
    setBusy(true);
    try {
      const r = await send({ segment, allianceId, title, message, link });
      toast.success(`Notification envoyée à ${r.count} joueur(s).`);
      setTitle("");
      setMessage("");
    } catch (err) {
      toast.error((err as { response?: { message?: string } }).response?.message ?? "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <h3 className="hud-title flex items-center gap-2 text-sm text-slate-100">
        <Bell className="h-4 w-4 text-cyan-glow" /> Messages ciblés
      </h3>
      <p className="text-xs text-slate-400">Une notification dans le jeu (cloche et accueil), envoyée à un groupe de joueurs. Pour un e-mail, utilise l'onglet E-mails.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SelectField<BroadcastSegment> label="Destinataires" value={segment} options={BROADCAST_SEGMENTS.map((s) => ({ value: s.id, label: s.label }))} onChange={setSegment} hint={seg.hint} />
        {segment === "alliance" ? (
          <SelectField label="Alliance" value={allianceId} options={[{ value: "", label: "Choisir…" }, ...alliances.map((a) => ({ value: a.id, label: `[${a.tag}] ${a.name}` }))]} onChange={setAllianceId} />
        ) : (
          <Field label="Nombre de destinataires">
            <p className="flex h-10 items-center gap-2 text-sm text-slate-200">
              <Users className="h-4 w-4 text-cyan-glow" /> {count === null ? "…" : `${count} joueur${count > 1 ? "s" : ""}`}
            </p>
          </Field>
        )}
        <Field label="Titre">
          <Input value={title} maxLength={80} onChange={(e) => setTitle(e.target.value)} placeholder="Ex. : Le Titan de rouille arrive demain !" />
        </Field>
        <SelectField label="Lien (page ouverte au clic)" value={link} options={LINKS} onChange={setLink} />
        <TextAreaField label={`Message (${message.length}/500)`} value={message} onChange={(v) => setMessage(v.slice(0, 500))} rows={3} />
      </div>
      {(title || message) && (
        <div className="flex items-start gap-3 border border-cyan-glow/20 bg-white/[0.03] p-3">
          <Bell className="mt-0.5 h-4 w-4 shrink-0 text-cyan-glow" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-100">{title || "Titre"}</p>
            <p className="text-xs text-slate-300">{message || "Message"}</p>
            {link && <p className="mt-1 text-[11px] text-cyan-glow">→ {LINKS.find((l) => l.value === link)?.label}</p>}
          </div>
          <span className="ml-auto shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">Aperçu</span>
        </div>
      )}
      {errors.length > 0 && (title || message) && <p className="text-xs text-danger-glow">{errors.join(" ")}</p>}
      <Button className="self-start" disabled={busy || errors.length > 0 || !count} onClick={() => void submit()}>
        <Send className="mr-1 h-3.5 w-3.5" /> Envoyer à {count ?? "…"} joueur{(count ?? 0) > 1 ? "s" : ""}
      </Button>
    </Card>
  );
}
