import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EyeOff, Flag, MessageSquareOff, RefreshCw, RotateCcw, Trash2, Volume2 } from "lucide-react";
import { HudPanel } from "@/components/ui/panel";
import { EmptyState, HudTag } from "@/components/ui/hud";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pb } from "@/lib/pocketbase";
import { BASE_FILTER } from "@/game/globalChat";
import { BAN_DURATIONS } from "@/game/moderation";
import { cn, formatDuration, timeAgo } from "@/lib/utils";

/* 5.26 : modération du canal global : messages signalés ou masqués,
   sourdines (parole retirée), mots filtrés en plus de la liste de base. */

interface Flagged {
  id: string;
  uid: string;
  pseudo: string;
  text: string;
  createdAtMs: number;
  hidden: boolean;
  reports: number;
}
interface Mute {
  uid: string;
  untilMs: number | null;
  reason: string;
  byName: string;
  active: boolean;
}

function post(body: Record<string, unknown>) {
  return pb.send("/api/cosmic/admin/global", { method: "POST", body }).catch((err) => {
    throw new Error((err as { response?: { message?: string } })?.response?.message || "Action impossible.");
  });
}

export function ChatModerationPanel() {
  const [data, setData] = useState<{ flagged: Flagged[]; mutes: Mute[]; filter: string[] } | null>(null);
  const [words, setWords] = useState("");
  const [muteFor, setMuteFor] = useState<{ uid: string; pseudo: string } | null>(null);
  const [hours, setHours] = useState<number | null>(24);
  const [reason, setReason] = useState("");
  const load = async () => {
    try {
      const d = await pb.send<{ flagged: Flagged[]; mutes: Mute[]; filter: string[] }>("/api/cosmic/admin/global", { requestKey: null });
      setData(d);
      setWords(d.filter.join(", "));
    } catch {
      toast.error("Route absente : mets à jour les hooks.");
    }
  };
  useEffect(() => {
    void load();
  }, []);
  const act = async (body: Record<string, unknown>, ok: string) => {
    try {
      await post(body);
      toast.success(ok);
      await load();
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <HudPanel icon={<Flag />} title="Messages signalés ou masqués" tone="danger" aside={<Button size="sm" variant="ghost" onClick={() => void load()}><RefreshCw className="h-3.5 w-3.5" /> Actualiser</Button>}>
        {!data || data.flagged.length === 0 ? (
          <EmptyState size="sm" icon={<Flag />} title="Rien à modérer">Les messages signalés par les joueurs apparaîtront ici.</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {data.flagged.map((m) => (
              <li key={m.id} className={cn("flex flex-col gap-1.5 border p-2.5 text-sm", m.hidden ? "border-danger-glow/30 bg-danger-glow/[0.04]" : "border-white/10")}>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-100">{m.pseudo}</span>
                  <span className="text-slate-500">{timeAgo(m.createdAtMs)}</span>
                  <HudTag tone={m.reports >= 3 ? "danger" : "ember"}>{m.reports} signalement{m.reports > 1 ? "s" : ""}</HudTag>
                  {m.hidden && <HudTag tone="danger">Masqué</HudTag>}
                </div>
                <p className="break-words text-slate-300">{m.text}</p>
                <div className="flex flex-wrap gap-1.5">
                  {m.hidden ? (
                    <Button size="sm" variant="ghost" onClick={() => void act({ action: "restore", id: m.id }, "Message rétabli.")}>
                      <RotateCcw className="h-3.5 w-3.5" /> Rétablir
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => void act({ action: "hide", id: m.id }, "Message masqué.")}>
                      <EyeOff className="h-3.5 w-3.5" /> Masquer
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => void act({ action: "delete", id: m.id }, "Message supprimé.")}>
                    <Trash2 className="h-3.5 w-3.5" /> Supprimer
                  </Button>
                  <Button size="sm" variant="ghost" className="text-ember-glow" onClick={() => (setMuteFor({ uid: m.uid, pseudo: m.pseudo }), setReason(""))}>
                    <MessageSquareOff className="h-3.5 w-3.5" /> Retirer la parole
                  </Button>
                </div>
                {muteFor?.uid === m.uid && (
                  <div className="flex flex-col gap-2 border-t border-white/5 pt-2">
                    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Durée de la sourdine">
                      {BAN_DURATIONS.map((d) => (
                        <button key={d.label} type="button" aria-pressed={hours === d.hours} onClick={() => setHours(d.hours)} className={cn("border px-2 py-0.5 font-mono text-xs", hours === d.hours ? "border-ember-glow/70 bg-ember-glow/15 text-ember-glow" : "border-white/10 text-slate-400")}>
                          {d.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Motif (montré au joueur)" className="h-8 flex-1" />
                      <Button size="sm" variant="danger" disabled={reason.trim().length < 5} onClick={() => void act({ action: "mute", uid: m.uid, hours, reason: reason.trim() }, `${muteFor.pseudo} n'a plus la parole.`).then(() => setMuteFor(null))}>
                        Appliquer
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </HudPanel>

      <div className="flex flex-col gap-4">
        <HudPanel icon={<MessageSquareOff />} title="Sourdines" tone="ember">
          {!data || data.mutes.filter((x) => x.active).length === 0 ? (
            <p className="text-xs text-slate-500">Personne n'a perdu la parole.</p>
          ) : (
            <ul className="flex flex-col gap-1.5 text-xs">
              {data.mutes
                .filter((x) => x.active)
                .map((x) => (
                  <li key={x.uid} className="flex items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-slate-300">
                      <span className="font-mono text-slate-500">{x.uid}</span> · {x.reason}
                    </span>
                    <span className="font-mono text-slate-500">{x.untilMs === null ? "permanent" : formatDuration(Math.max(0, x.untilMs - Date.now()) / 1000)}</span>
                    <Button size="sm" variant="ghost" onClick={() => void act({ action: "unmute", uid: x.uid }, "Parole rendue.")}>
                      <Volume2 className="h-3.5 w-3.5" />
                    </Button>
                  </li>
                ))}
            </ul>
          )}
        </HudPanel>
        <HudPanel icon={<EyeOff />} title="Filtre de mots">
          <p className="text-[11px] text-slate-500">Toujours masqués : {BASE_FILTER.length} mots de base. Ajoute les tiens, séparés par des virgules (accents et majuscules ignorés).</p>
          <textarea value={words} onChange={(e) => setWords(e.target.value)} rows={3} aria-label="Mots filtrés" className="hud-cut-sm border border-cyan-glow/15 bg-space-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-glow/60" />
          <Button size="sm" className="self-start" onClick={() => void act({ action: "filter", words: words.split(",").map((w) => w.trim()).filter(Boolean) }, "Filtre enregistré.")}>
            Enregistrer
          </Button>
        </HudPanel>
      </div>
    </div>
  );
}
