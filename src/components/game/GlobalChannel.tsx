import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Flag, Globe2, Loader2, Send, VolumeX, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { LinkifiedText } from "@/components/ui/linkified-text";
import { PlayerName } from "@/components/ui/player-name";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/hud";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { GLOBAL_CHAT_RULES } from "@/game/globalChat";
import { readPersonalMutes, reportGlobalMessage, sendGlobalMessage, useGlobalMessages, writePersonalMutes } from "@/services/globalChatService";
import { cn } from "@/lib/utils";

/* 5.26 : canal global : tout le serveur, en direct. Signaler un message
   (masqué d'office à 3 signalements), masquer un joueur chez soi, filtre de
   grossièretés côté serveur, emotes du jeu. */

function clock(ms: number) {
  return new Date(ms).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function GlobalChannel({ uid, onOpenPlayer }: { uid: string; onOpenPlayer: (p: { uid: string; pseudo: string }) => void }) {
  const { messages, loaded, remove } = useGlobalMessages();
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [muted, setMuted] = useState<string[]>(() => readPersonalMutes());
  const [showMuted, setShowMuted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const shown = messages.filter((m) => showMuted || !muted.includes(m.uid));

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [shown.length]);

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const out = await sendGlobalMessage(draft);
      setDraft("");
      if (out.masked) toast.message("Certains mots ont été masqués par le filtre du canal.");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSending(false);
    }
  };
  const toggleMute = (other: string, pseudo: string) => {
    const next = muted.includes(other) ? muted.filter((x) => x !== other) : [...muted, other];
    setMuted(next);
    writePersonalMutes(next);
    toast.success(muted.includes(other) ? `${pseudo} est de nouveau visible.` : `${pseudo} est masqué chez toi.`);
  };
  const report = async (id: string, pseudo: string) => {
    if (!(await askConfirm({ title: `Signaler ce message de ${pseudo} ?`, message: "L'équipe de modération le verra. À trois signalements, il est masqué en attendant sa décision.", confirmLabel: "Signaler", tone: "danger" }))) return;
    try {
      const out = await reportGlobalMessage(id);
      if (out.hidden) remove(id);
      toast.success("Merci, message signalé.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  return (
    <Card className="flex min-h-[32rem] flex-col p-0">
      <div className="flex flex-wrap items-center gap-2 border-b border-cyan-glow/15 px-3 py-2">
        <Globe2 className="h-4 w-4 text-cyan-glow" aria-hidden />
        <p className="font-display text-sm font-semibold text-slate-100">Canal global</p>
        <span className="text-[11px] text-slate-500">tout le serveur · modéré</span>
        {muted.length > 0 && (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setShowMuted((v) => !v)} aria-pressed={showMuted}>
            {showMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />} {showMuted ? "Cacher" : "Voir"} les masqués ({muted.length})
          </Button>
        )}
      </div>
      <div className="flex max-h-[62vh] flex-1 flex-col gap-1 overflow-y-auto px-3 py-3" aria-live="polite">
        {!loaded && <SkeletonList rows={5} />}
        {loaded && shown.length === 0 && (
          <EmptyState size="sm" icon={<Globe2 />} title="Silence radio" className="m-auto">
            Lance la conversation : tout le serveur te lira.
          </EmptyState>
        )}
        {shown.map((m) => {
          const mine = m.uid === uid;
          const isMuted = muted.includes(m.uid);
          return (
            <div key={m.id} className={cn("group flex items-start gap-2 px-2 py-1 text-sm hover:bg-white/[0.03]", isMuted && "opacity-50")}>
              <span className="w-10 shrink-0 pt-0.5 font-mono text-[10px] tabular-nums text-slate-600">{clock(m.createdAtMs)}</span>
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => onOpenPlayer({ uid: m.uid, pseudo: m.pseudo })} className={cn("mr-1.5 font-semibold hover:underline", mine ? "text-cyan-glow" : "text-slate-200")}>
                  {m.allianceTag && <span className="font-mono text-[11px] text-slate-500">[{m.allianceTag}] </span>}
                  <PlayerName uid={m.uid} pseudo={m.pseudo} />
                </button>
                <span className="whitespace-pre-wrap break-words text-slate-300">
                  <LinkifiedText text={m.text} />
                </span>
              </div>
              {!mine && (
                <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <button type="button" title={isMuted ? "Ne plus masquer" : "Masquer ce joueur (chez moi)"} aria-label={isMuted ? `Ne plus masquer ${m.pseudo}` : `Masquer ${m.pseudo}`} onClick={() => toggleMute(m.uid, m.pseudo)} className="p-1 text-slate-500 hover:text-ember-glow">
                    <VolumeX className="h-3.5 w-3.5" />
                  </button>
                  <button type="button" title="Signaler" aria-label={`Signaler le message de ${m.pseudo}`} onClick={() => void report(m.id, m.pseudo)} className="p-1 text-slate-500 hover:text-danger-glow">
                    <Flag className="h-3.5 w-3.5" />
                  </button>
                </span>
              )}
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <form
        className="flex flex-col gap-1 border-t border-cyan-glow/15 p-3"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        {error && <p className="text-xs text-danger-glow">{error}</p>}
        <div className="flex items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, GLOBAL_CHAT_RULES.maxLength))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            rows={1}
            placeholder="Message à tout le serveur… (Entrée pour envoyer)"
            aria-label="Message au canal global"
            className="min-h-[2.5rem] flex-1 resize-none border border-cyan-glow/20 bg-space-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-glow/60 focus:outline-none"
          />
          <EmojiPicker onPick={(e) => setDraft((d) => (d + e).slice(0, GLOBAL_CHAT_RULES.maxLength))} />
          <Button type="submit" size="icon" disabled={sending || !draft.trim()} aria-label="Envoyer">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        <p className="flex justify-between text-[10px] text-slate-600">
          <span>Respect et bonne humeur : les grossièretés sont masquées, les abus signalés.</span>
          <span className="font-mono">
            {draft.length}/{GLOBAL_CHAT_RULES.maxLength}
          </span>
        </p>
      </form>
    </Card>
  );
}
