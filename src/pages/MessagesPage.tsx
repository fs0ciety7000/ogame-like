import { LinkifiedText } from "@/components/ui/linkified-text";
import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, Ban, Check, CheckCheck, Loader2, Mail, Search, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlayerName } from "@/components/ui/player-name";
import { PlayerSheetDialog } from "@/components/game/PlayerSheetDialog";
import { useAuthStore } from "@/store/authStore";
import { blockPlayer, listBlocks, markConversationRead, sendPrivateMessage, unblock, useMessagesStore, type MessageBlock } from "@/services/messageService";
import { listAllPlayers, type LeaderboardEntry } from "@/services/playerService";
import { groupConversations, MESSAGE_RULES } from "@/game/messages";
import { cn, timeAgo } from "@/lib/utils";

/* =====================================================
   Messagerie privée (v3.7) : conversations à gauche, fil à droite (un seul
   panneau à la fois sur téléphone). ?with=uid&pseudo=… ouvre un fil.
===================================================== */

function timeLabel(ms: number) {
  const d = new Date(ms);
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay
    ? d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function MessagesPage() {
  const uid = useAuthStore((s) => s.user?.uid) ?? "";
  const messages = useMessagesStore((s) => s.messages);
  const loaded = useMessagesStore((s) => s.loaded);
  const [params, setParams] = useSearchParams();
  const withUid = params.get("with") ?? "";
  const conversations = useMemo(() => groupConversations(messages, uid), [messages, uid]);
  const current = conversations.find((c) => c.uid === withUid);
  const withPseudo = current?.pseudo ?? params.get("pseudo") ?? "";

  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [search, setSearch] = useState("");
  const [blocks, setBlocks] = useState<MessageBlock[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheet, setSheet] = useState<{ uid: string; pseudo: string } | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listAllPlayers().then(setPlayers).catch(() => {});
  }, []);
  useEffect(() => {
    if (uid) listBlocks(uid).then(setBlocks).catch(() => {});
  }, [uid]);

  const thread = useMemo(
    () => messages.filter((m) => (m.fromUid === withUid && m.toUid === uid) || (m.fromUid === uid && m.toUid === withUid)).sort((a, b) => a.createdAtMs - b.createdAtMs),
    [messages, withUid, uid],
  );
  const unreadInThread = thread.some((m) => m.toUid === uid && !m.readAtMs);

  // Fil ouvert : ses messages reçus passent en « lus ».
  useEffect(() => {
    if (withUid && unreadInThread) void markConversationRead(withUid).catch(() => {});
  }, [withUid, unreadInThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end" });
  }, [thread.length, withUid]);

  const open = (other: string, pseudo: string) => {
    setParams({ with: other, pseudo });
    setSearch("");
    setError(null);
    setDraft("");
  };

  const send = async () => {
    if (!withUid || !draft.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendPrivateMessage(withUid, draft);
      setDraft("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible.");
    } finally {
      setSending(false);
    }
  };

  const block = blocks.find((b) => b.blockedUid === withUid);
  const toggleBlock = async () => {
    if (!withUid) return;
    try {
      if (block) {
        await unblock(block.id);
        setBlocks((list) => list.filter((b) => b.id !== block.id));
      } else {
        const created = await blockPlayer(uid, withUid, withPseudo);
        setBlocks((list) => [...list, created]);
      }
    } catch {
      setError("Action impossible pour le moment.");
    }
  };

  const q = search.trim().toLowerCase();
  const matches = q ? players.filter((p) => p.uid !== uid && p.pseudo.toLowerCase().includes(q)).slice(0, 6) : [];

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Opérations" title="Messages" description="Échanges privés entre commandants." />

      <div className="grid gap-3 md:grid-cols-[18rem_1fr]">
        {/* Conversations */}
        <Card className={cn("flex flex-col gap-2 p-3", withUid && "max-md:hidden")}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Écrire à un joueur…" className="pl-8" />
          </div>
          {matches.length > 0 && (
            <div className="flex flex-col border border-cyan-glow/20">
              {matches.map((p) => (
                <button key={p.uid} type="button" onClick={() => open(p.uid, p.pseudo)} className="px-3 py-2 text-left text-sm text-slate-200 hover:bg-cyan-glow/10">
                  <PlayerName uid={p.uid} pseudo={p.pseudo} allianceId={p.allianceId ?? null} />
                </button>
              ))}
            </div>
          )}
          {!loaded && (
            <p className="flex items-center gap-2 px-1 py-3 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </p>
          )}
          {loaded && conversations.length === 0 && <p className="px-1 py-3 text-sm text-slate-500">Aucune conversation. Cherche un joueur pour lui écrire.</p>}
          <div className="flex flex-col">
            {conversations.map((c) => (
              <button
                key={c.uid}
                type="button"
                onClick={() => open(c.uid, c.pseudo)}
                className={cn(
                  "flex flex-col gap-0.5 border-l-2 px-3 py-2 text-left transition-colors",
                  c.uid === withUid ? "border-cyan-glow bg-cyan-glow/10" : "border-transparent hover:bg-white/5",
                )}
              >
                <span className="flex items-center justify-between gap-2">
                  <PlayerName uid={c.uid} pseudo={c.pseudo} className={cn("truncate text-sm", c.unread ? "font-semibold text-white" : "text-slate-300")} />
                  {c.unread > 0 ? (
                    <span className="rounded-full bg-danger-glow px-1.5 text-[10px] font-bold text-space-950">{c.unread}</span>
                  ) : (
                    <span className="shrink-0 text-[10px] text-slate-500">{timeAgo(c.last.createdAtMs)}</span>
                  )}
                </span>
                <span className="truncate text-xs text-slate-500">
                  {c.last.fromUid === uid ? "Toi : " : ""}
                  <LinkifiedText text={c.last.text} />
                </span>
              </button>
            ))}
          </div>
        </Card>

        {/* Fil */}
        <Card className={cn("flex min-h-[28rem] flex-col p-0", !withUid && "max-md:hidden")}>
          {!withUid ? (
            <div className="m-auto flex flex-col items-center gap-2 p-6 text-sm text-slate-500">
              <Mail className="h-6 w-6" />
              Choisis une conversation ou cherche un joueur.
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 border-b border-cyan-glow/15 px-3 py-2">
                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setParams({})} aria-label="Retour aux conversations">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <button type="button" className="min-w-0 flex-1 truncate text-left font-semibold text-white hover:text-cyan-glow" onClick={() => setSheet({ uid: withUid, pseudo: withPseudo })}>
                  <PlayerName uid={withUid} pseudo={withPseudo} />
                </button>
                <Button variant="ghost" size="sm" onClick={toggleBlock} title={block ? "Recevoir à nouveau ses messages" : "Ne plus recevoir ses messages"}>
                  <Ban className="h-3.5 w-3.5" /> {block ? "Débloquer" : "Bloquer"}
                </Button>
              </div>
              <div className="flex max-h-[60vh] flex-1 flex-col gap-2 overflow-y-auto px-3 py-3">
                {thread.length === 0 && <p className="m-auto text-sm text-slate-500">Premier message à {withPseudo || "ce joueur"}.</p>}
                {thread.map((m) => {
                  const mine = m.fromUid === uid;
                  return (
                    <div key={m.id} className={cn("max-w-[85%] px-3 py-2 text-sm", mine ? "self-end bg-cyan-glow/15 text-slate-100" : "self-start bg-white/[0.06] text-slate-200")}>
                      <p className="whitespace-pre-wrap break-words">
                        <LinkifiedText text={m.text} jumbo />
                      </p>
                      <p className={cn("mt-1 flex items-center gap-1 text-[10px] text-slate-500", mine && "justify-end")}>
                        {timeLabel(m.createdAtMs)}
                        {mine && (m.readAtMs ? <CheckCheck className="h-3 w-3 text-cyan-glow" aria-label="Lu" /> : <Check className="h-3 w-3" aria-label="Envoyé" />)}
                      </p>
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
                    onChange={(e) => setDraft(e.target.value.slice(0, MESSAGE_RULES.maxLength))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        void send();
                      }
                    }}
                    rows={2}
                    placeholder="Ton message… (Entrée pour envoyer)"
                    className="min-h-[2.75rem] flex-1 resize-y border border-cyan-glow/20 bg-space-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-glow/60 focus:outline-none"
                  />
                  <EmojiPicker onPick={(e) => setDraft((d) => (d + e).slice(0, MESSAGE_RULES.maxLength))} />
                  <Button type="submit" size="icon" disabled={sending || !draft.trim()} aria-label="Envoyer">
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-right text-[10px] text-slate-600">
                  {draft.length}/{MESSAGE_RULES.maxLength}
                </p>
              </form>
            </>
          )}
        </Card>
      </div>

      <PlayerSheetDialog target={sheet} onClose={() => setSheet(null)} />
    </div>
  );
}
