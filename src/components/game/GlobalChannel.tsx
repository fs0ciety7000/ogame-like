import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { AtSign, CalendarClock, Coins, Crown, Flag, Flame, Globe2, Hash, Loader2, Pin, PinOff, Plus, Rocket, Send, Shield, Skull, SmilePlus, Sparkles, Swords, VolumeX, Volume2, X, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { LinkifiedText } from "@/components/ui/linkified-text";
import { PlayerName } from "@/components/ui/player-name";
import { SkeletonList } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/hud";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { CHAT_REACTIONS, CHAT_ROOM_RULES, GLOBAL_CHAT_RULES, KESH_REACTION, mentions, ROOM_EVENT_RULES, ROOM_ICONS, roomEventLive, type ChatRoom } from "@/game/globalChat";
import { KESH, NAME_TONES, ownsShopItem } from "@/game/bounties";
import { HUD_TONE, HudCallout, HudChip, type HudTone } from "@/components/ui/hud";
import { usePlayerStore } from "@/store/playerStore";
import { assetUrl } from "@/lib/assets";
import { Input } from "@/components/ui/input";
import { useIsAdmin } from "@/services/adminService";
import { closeChatRoom, createChatRoom, markRoomSeen, pinRoomMessage, setChatRoomIcon, setRoomEvent, useRoomUnread, markGlobalSeen, reactGlobalMessage, readPersonalMutes, reportGlobalMessage, sendGlobalMessage, useChatRooms, useGlobalMessages, writePersonalMutes } from "@/services/globalChatService";
import { cn } from "@/lib/utils";

/* 5.26 : canal global : tout le serveur, en direct. Signaler un message
   (masqué d'office à 3 signalements), masquer un joueur chez soi, filtre de
   grossièretés côté serveur, emotes du jeu. */

/* 5.26.3 : icônes de salon (Bannière de salon) et couleur de pseudo (jetons du thème). */
const ROOM_ICON: Record<string, LucideIcon> = { swords: Swords, coins: Coins, skull: Skull, rocket: Rocket, shield: Shield, crown: Crown, flame: Flame, sparkles: Sparkles };

function RoomIcon({ icon, className }: { icon?: string; className?: string }) {
  const Icon = (icon && ROOM_ICON[icon]) || Hash;
  return <Icon className={className} aria-hidden />;
}

const toneColor = (tone?: string) => (tone && NAME_TONES.some((t) => t.id === tone) ? HUD_TONE[tone as HudTone] : undefined);

function clock(ms: number) {
  return new Date(ms).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

export function GlobalChannel({ uid, onOpenPlayer }: { uid: string; onOpenPlayer: (p: { uid: string; pseudo: string }) => void }) {
  // 5.26.2 : salons thématiques créés par les joueurs (vide : canal global).
  // Salon choisi gardé dans l'adresse (?salon=) : il survit aux changements d'onglet et au rechargement.
  const [params, setParams] = useSearchParams();
  const room = params.get("salon") ?? "";
  const setRoom = (id: string) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set("salon", id);
        else next.delete("salon");
        return next;
      },
      { replace: true },
    );
  const { rooms, loaded: roomsLoaded, add: addRoom } = useChatRooms();
  const current = rooms.find((r) => r.id === room) ?? null;
  const admin = useIsAdmin();
  const bounties = usePlayerStore((s) => s.player?.bounties);
  const myPseudo = usePlayerStore((s) => s.player?.pseudo ?? "");
  const unread = useRoomUnread(uid, rooms, room);
  const isOwner = !!current && current.ownerUid === uid;
  const canKesh = ownsShopItem({ bounties }, "keshReaction");
  const canBanner = ownsShopItem({ bounties }, "roomBanner");
  const [creating, setCreating] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [roomTopic, setRoomTopic] = useState("");
  useEffect(() => {
    if (room && roomsLoaded && !rooms.some((r) => r.id === room)) setRoom("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- setRoom suit l'adresse.
  }, [room, rooms, roomsLoaded]);
  const { messages, loaded, remove, patch } = useGlobalMessages(room);
  // 5.26.2 : canal affiché = lu (badge « Communications » remis à zéro).
  useEffect(() => {
    const last = Math.max(Date.now(), messages[messages.length - 1]?.createdAtMs ?? 0);
    if (loaded && !room) markGlobalSeen(last);
    // 5.27 : salon affiché = lu (pastille du chip remise à zéro).
    if (loaded && room) markRoomSeen(room, last);
  }, [loaded, messages, room]);
  const createRoom = async () => {
    try {
      const r = await createChatRoom(roomName, roomTopic);
      toast.success(`Salon « ${r.name} » ouvert.`);
      setCreating(false);
      setRoomName("");
      setRoomTopic("");
      addRoom(r);
      setRoom(r.id);
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  const closeRoom = async () => {
    if (!current) return;
    if (!(await askConfirm({ title: `Fermer le salon « ${current.name} » ?`, message: "Il disparaît de la liste ; ses messages ne sont plus lisibles.", confirmLabel: "Fermer", tone: "danger" }))) return;
    try {
      await closeChatRoom(current.id);
      setRoom("");
      toast.success("Salon fermé.");
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
  const react = async (id: string, emoji: string) => {
    try {
      const out = await reactGlobalMessage(id, emoji);
      patch(id, { reactions: out.reactions });
    } catch (err) {
      toast.error((err as Error).message);
    }
  };
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
      const out = await sendGlobalMessage(draft, room);
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
      <div className="flex flex-wrap items-center gap-1.5 border-b border-cyan-glow/15 px-3 py-2" role="group" aria-label="Salons">
        <HudChip size="sm" tone={!room ? "accent" : "neutral"} asChild>
          <button type="button" onClick={() => setRoom("")} aria-pressed={!room}>
            <Globe2 className="h-3 w-3" /> Global
          </button>
        </HudChip>
        {rooms.map((r) => (
          <HudChip key={r.id} size="sm" tone={room === r.id ? "violet" : "neutral"} asChild>
            <button type="button" onClick={() => setRoom(r.id)} aria-pressed={room === r.id} title={r.topic || r.name}>
              <RoomIcon icon={r.icon} className="h-3 w-3" /> {r.name}
              {(unread[r.id] ?? 0) > 0 && (
                <span className="ml-0.5 bg-danger-glow px-1 font-mono text-[9px] tabular-nums text-space-950" aria-label={`${unread[r.id]} non lus`}>
                  {unread[r.id]}
                </span>
              )}
            </button>
          </HudChip>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setCreating((v) => !v)} aria-expanded={creating}>
          <Plus className="h-3.5 w-3.5" /> Salon
        </Button>
      </div>
      {creating && (
        <form
          className="flex flex-col gap-2 border-b border-cyan-glow/15 bg-white/[0.02] px-3 py-2 sm:flex-row"
          onSubmit={(e) => {
            e.preventDefault();
            void createRoom();
          }}
        >
          <Input value={roomName} maxLength={CHAT_ROOM_RULES.nameMax} onChange={(e) => setRoomName(e.target.value)} placeholder="Nom du salon (Commerce, Boss…)" className="h-8 text-xs sm:w-56" aria-label="Nom du salon" />
          <Input value={roomTopic} maxLength={CHAT_ROOM_RULES.topicMax} onChange={(e) => setRoomTopic(e.target.value)} placeholder="Sujet (facultatif)" className="h-8 flex-1 text-xs" aria-label="Sujet du salon" />
          <Button type="submit" size="sm" variant="secondary" disabled={roomName.trim().length < CHAT_ROOM_RULES.nameMin}>
            Ouvrir
          </Button>
          <p className="text-[10px] text-slate-500 sm:hidden">Un salon par joueur ; fermé après {CHAT_ROOM_RULES.idleDays} jours sans message.</p>
        </form>
      )}
      <div className="flex flex-wrap items-center gap-2 border-b border-cyan-glow/15 px-3 py-2">
        {current ? <RoomIcon icon={current.icon} className="h-4 w-4 text-violet-glow" /> : <Globe2 className="h-4 w-4 text-cyan-glow" aria-hidden />}
        <p className="font-display text-sm font-semibold text-slate-100">{current ? current.name : "Canal global"}</p>
        <span className="min-w-0 truncate text-[11px] text-slate-500">{current ? `${current.topic ? `${current.topic} · ` : ""}ouvert par ${current.ownerPseudo} · modéré` : "tout le serveur · modéré"}</span>
        {current && current.ownerUid === uid && canBanner && (
          <span className="flex flex-wrap gap-0.5" role="group" aria-label="Icône du salon">
            {ROOM_ICONS.map((i) => (
              <button
                key={i.id}
                type="button"
                title={i.label}
                aria-label={`Icône : ${i.label}`}
                aria-pressed={current.icon === i.id}
                onClick={() => void setChatRoomIcon(current.id, i.id).catch((err: Error) => toast.error(err.message))}
                className={cn("p-1.5 sm:p-1", current.icon === i.id ? "text-violet-glow" : "text-slate-500 hover:text-violet-glow")}
              >
                <RoomIcon icon={i.id} className="h-3.5 w-3.5" />
              </button>
            ))}
          </span>
        )}
        {current && (current.ownerUid === uid || admin) && (
          <Button size="sm" variant="ghost" onClick={() => void closeRoom()} title="Fermer ce salon">
            <X className="h-3.5 w-3.5" /> Fermer
          </Button>
        )}
        {muted.length > 0 && (
          <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setShowMuted((v) => !v)} aria-pressed={showMuted}>
            {showMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />} {showMuted ? "Cacher" : "Voir"} les masqués <span className="font-mono tabular-nums">({muted.length})</span>
          </Button>
        )}
      </div>
      {current && <RoomExtras room={current} canEdit={isOwner} canUnpin={isOwner || admin} />}
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
          // 5.27 : un message qui me mentionne ressort.
          const forMe = !mine && mentions(m.text, myPseudo);
          return (
            <div key={m.id} className={cn("group flex items-start gap-2 px-2 py-1 text-sm hover:bg-white/[0.03]", isMuted && "opacity-50", forMe && "border-l-2 border-gold-glow/60 bg-gold-glow/[0.05]")}>
              <span className="w-10 shrink-0 pt-0.5 font-mono text-[10px] tabular-nums text-slate-600">{clock(m.createdAtMs)}</span>
              <div className="min-w-0 flex-1">
                <button type="button" onClick={() => onOpenPlayer({ uid: m.uid, pseudo: m.pseudo })} className={cn("mr-1.5 font-semibold hover:underline", mine ? "text-cyan-glow" : "text-slate-200")} style={{ color: toneColor(m.nameTone) }}>
                  {m.allianceTag && <span className="font-mono text-[11px] text-slate-500">[{m.allianceTag}] </span>}
                  <PlayerName uid={m.uid} pseudo={m.pseudo} />
                </button>
                <span className="whitespace-pre-wrap break-words text-slate-300">
                  <LinkifiedText text={m.text} />
                </span>
                <Reactions reactions={m.reactions ?? {}} uid={uid} canKesh={canKesh} onReact={(e) => void react(m.id, e)} />
              </div>
              {current && isOwner && (
                <button type="button" title={current.pinnedId === m.id ? "Message épinglé" : "Épingler dans le salon"} aria-label={`Épingler le message de ${m.pseudo}`} onClick={() => void pinRoomMessage(current.id, m.id).then(() => toast.success("Message épinglé.")).catch((err: Error) => toast.error(err.message))} className={cn("shrink-0 p-1 opacity-0 transition-opacity focus-visible:opacity-100 group-hover:opacity-100", current.pinnedId === m.id ? "text-violet-glow opacity-100" : "text-slate-500 hover:text-violet-glow")}>
                  <Pin className="h-3.5 w-3.5" />
                </button>
              )}
              {!mine && (
                <span className="flex shrink-0 gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
                  <button type="button" title="Répondre (mentionner)" aria-label={`Mentionner ${m.pseudo}`} onClick={() => setDraft((d) => `${d}${d && !d.endsWith(" ") ? " " : ""}@${m.pseudo} `.slice(0, GLOBAL_CHAT_RULES.maxLength))} className="p-1 text-slate-500 hover:text-cyan-glow">
                    <AtSign className="h-3.5 w-3.5" />
                  </button>
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
            placeholder={current ? `Message dans #${current.name}… (Entrée pour envoyer)` : "Message à tout le serveur… (Entrée pour envoyer)"}
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

const eventWhen = (ms: number) => new Date(ms).toLocaleString("fr-FR", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** Valeur par défaut du champ date/heure : dans une heure, à l'heure locale. */
function inputLocal(ms: number) {
  const d = new Date(ms - new Date(ms).getTimezoneOffset() * 60_000);
  return d.toISOString().slice(0, 16);
}

/** 5.27 : message épinglé et événement programmé du salon (édition par son créateur). */
function RoomExtras({ room, canEdit, canUnpin }: { room: ChatRoom; canEdit: boolean; canUnpin: boolean }) {
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(room.eventLabel ?? "");
  const [at, setAt] = useState(() => inputLocal(room.eventAtMs || Date.now() + 3600_000));
  const [busy, setBusy] = useState(false);
  const now = Date.now();
  const live = roomEventLive(room, now);
  const save = async (atMs: number) => {
    setBusy(true);
    try {
      await setRoomEvent(room.id, label, atMs);
      toast.success(atMs ? "Événement programmé : il apparaît dans l'agenda de l'accueil." : "Événement retiré.");
      setEditing(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  };
  if (!room.pinnedText && !live && !canEdit) return null;
  return (
    <div className="flex flex-col gap-2 border-b border-cyan-glow/15 px-3 py-2">
      {room.pinnedText && (
        <HudCallout tone="violet" className="flex items-start gap-2 text-xs">
          <Pin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-violet-glow" aria-hidden />
          <span className="min-w-0 flex-1 whitespace-pre-wrap break-words text-slate-300">
            <span className="font-semibold text-violet-glow">{room.pinnedPseudo}</span> <LinkifiedText text={room.pinnedText} />
          </span>
          {canUnpin && (
            <button type="button" title="Retirer l'épingle" aria-label="Retirer l'épingle" className="shrink-0 p-1 text-slate-500 hover:text-danger-glow" onClick={() => void pinRoomMessage(room.id, "").catch((err: Error) => toast.error(err.message))}>
              <PinOff className="h-3.5 w-3.5" />
            </button>
          )}
        </HudCallout>
      )}
      {live && !editing && (
        <p className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
          <CalendarClock className="h-3.5 w-3.5 text-mint-glow" aria-hidden />
          <span className="font-semibold text-mint-glow">{room.eventLabel}</span>
          <span className="font-mono tabular-nums text-slate-400">{room.eventAtMs! <= now ? "en cours" : eventWhen(room.eventAtMs!)}</span>
          {canEdit && (
            <>
              <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>
                Modifier
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => void save(0)}>
                Retirer
              </Button>
            </>
          )}
        </p>
      )}
      {canEdit && !live && !editing && (
        <Button size="sm" variant="ghost" className="self-start" onClick={() => setEditing(true)}>
          <CalendarClock className="h-3.5 w-3.5" /> Programmer un événement
        </Button>
      )}
      {canEdit && editing && (
        <form
          className="flex flex-col gap-2 sm:flex-row sm:items-center"
          onSubmit={(e) => {
            e.preventDefault();
            void save(new Date(at).getTime());
          }}
        >
          <Input value={label} maxLength={ROOM_EVENT_RULES.labelMax} onChange={(e) => setLabel(e.target.value)} placeholder="Raid de boss, échange de plans…" className="h-8 flex-1 text-xs" aria-label="Événement" />
          <input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="h-8 border border-cyan-glow/20 bg-space-900 px-2 font-mono text-xs text-slate-100 [color-scheme:dark]" aria-label="Date et heure" />
          <div className="flex gap-1">
            <Button type="submit" size="sm" variant="secondary" disabled={busy || label.trim().length < ROOM_EVENT_RULES.labelMin}>
              Programmer
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Annuler
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

/** 5.26.2 : réactions sous un message (compte, la mienne en surbrillance) et palette au survol. */
function ReactionGlyph({ emoji }: { emoji: string }) {
  return emoji === KESH_REACTION ? <img src={assetUrl(KESH.emblem)} alt="" className="h-4 w-4 object-contain" /> : <span aria-hidden>{emoji}</span>;
}

function Reactions({ reactions, uid, canKesh, onReact }: { reactions: Partial<Record<string, string[]>>; uid: string; canKesh: boolean; onReact: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const all = [...CHAT_REACTIONS, KESH_REACTION];
  const used = all.filter((e) => (reactions[e]?.length ?? 0) > 0);
  const palette = canKesh ? all : [...CHAT_REACTIONS];
  const label = (e: string) => (e === KESH_REACTION ? "emblème kesh'vaar" : e);
  return (
    <span className="mt-0.5 flex flex-wrap items-center gap-1">
      {used.map((e) => {
        const mine = reactions[e]!.includes(uid);
        return (
          <button
            key={e}
            type="button"
            onClick={() => onReact(e)}
            aria-pressed={mine}
            aria-label={`${label(e)} : ${reactions[e]!.length}`}
            className={cn("inline-flex items-center gap-1 border px-1.5 text-xs", mine ? "border-cyan-glow/50 bg-cyan-glow/10" : "border-white/10 bg-white/[0.03] hover:border-cyan-glow/30")}
          >
            <ReactionGlyph emoji={e} />
            <span className="font-mono text-[10px] tabular-nums text-slate-300">{reactions[e]!.length}</span>
          </button>
        );
      })}
      <span className={cn("inline-flex items-center gap-0.5", !open && "opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100")}>
        {open ? (
          palette.map((e) => (
            <button
              key={e}
              type="button"
              className="px-0.5 text-sm hover:scale-110"
              aria-label={`Réagir ${label(e)}`}
              onClick={() => {
                onReact(e);
                setOpen(false);
              }}
            >
              <ReactionGlyph emoji={e} />
            </button>
          ))
        ) : (
          <button type="button" className="p-0.5 text-slate-500 hover:text-cyan-glow" aria-label="Ajouter une réaction" title="Réagir" onClick={() => setOpen(true)}>
            <SmilePlus className="h-3.5 w-3.5" />
          </button>
        )}
      </span>
    </span>
  );
}

