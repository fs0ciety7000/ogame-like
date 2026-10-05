import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Handshake, MessagesSquare, Send, ShieldCheck, Timer, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { EmptyState } from "@/components/ui/hud";
import { IconSelect } from "@/components/ui/icon-select";
import { LinkifiedText } from "@/components/ui/linkified-text";
import { useNowTicker } from "@/hooks/useNowTicker";
import { subscribeAlliances } from "@/services/allianceService";
import { diplomacy, markPactRead, subscribePactMessages, subscribePacts, usePactUnreadStore, type PactMessage } from "@/services/diplomacyService";
import { useSearchParams } from "react-router-dom";
import { DIPLOMACY_RULES, involves, pactOpen, pactStatusAt, type AlliancePact } from "@/game/diplomacy";
import { cn, formatDuration, timeAgo } from "@/lib/utils";
import type { Alliance } from "@/types/game";
import { askConfirm } from "@/components/ui/confirm-dialog";

/* Onglet Diplomatie (v3.8) : pactes de non-agression et canal partagé. */

function errorText(err: unknown) {
  return err instanceof Error ? err.message : "Action impossible.";
}

function PactChannel({ pact, uid }: { pact: AlliancePact; uid: string }) {
  const [messages, setMessages] = useState<PactMessage[]>([]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottom = useRef<HTMLDivElement>(null);
  useEffect(() => subscribePactMessages(pact.id, setMessages), [pact.id]);
  // Canal ouvert : tout ce qui s'y affiche est lu.
  useEffect(() => {
    markPactRead(uid, pact.id);
  }, [uid, pact.id, messages.length]);
  // Accolades obligatoires : scrollIntoView renvoie une Promise dans les navigateurs
  // récents, que React prenait pour une fonction de nettoyage (« i is not a function »).
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const send = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await diplomacy("message", { pactId: pact.id, text });
      setText("");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3 border-t border-white/5 pt-3">
      <div className="flex max-h-56 flex-col gap-1.5 overflow-y-auto pr-1">
        {messages.length === 0 && <p className="text-xs text-slate-500">Canal ouvert entre les deux alliances. Personne n'a encore écrit.</p>}
        {messages.map((m) => (
          <p key={m.id} className="text-sm">
            <span className={cn("font-mono text-[11px]", m.authorUid === uid ? "text-cyan-glow" : "text-gold-glow")}>[{m.authorTag}]</span>{" "}
            <span className="text-slate-300">{m.authorPseudo}</span> <span className="text-[10px] text-slate-600">{timeAgo(m.createdAtMs)}</span>
            <br />
            <span className="whitespace-pre-wrap break-words text-slate-200">
              <LinkifiedText text={m.text} jumbo />
            </span>
          </p>
        ))}
        <div ref={bottom} />
      </div>
      <form
        className="mt-2 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void send();
        }}
      >
        <Input value={text} maxLength={DIPLOMACY_RULES.messageMax} onChange={(e) => setText(e.target.value)} placeholder="Message aux deux alliances…" className="h-9 flex-1" />
        <EmojiPicker onPick={(e) => setText((t) => (t + e).slice(0, DIPLOMACY_RULES.messageMax))} />
        <Button type="submit" size="icon" disabled={busy || !text.trim()} aria-label="Envoyer">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}

function PactCard({ pact, own, uid, canLead, initiallyOpen = false }: { pact: AlliancePact; own: Alliance; uid: string; canLead: boolean; initiallyOpen?: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  const unread = usePactUnreadStore((s) => s.unread[pact.id] ?? 0);
  const [busy, setBusy] = useState(false);
  const now = Date.now();
  const status = pactStatusAt(pact, now);
  const mine = pact.allianceA === own.id;
  const otherTag = mine ? pact.tagB : pact.tagA;
  const otherName = mine ? pact.nameB : pact.nameA;

  const act = async (action: "accept" | "decline" | "cancel" | "break") => {
    if (action === "break" && !(await askConfirm({ title: `Rompre le pacte avec [${otherTag}] ?`, message: `Il restera en vigueur ${DIPLOMACY_RULES.breakNoticeHours} h.`, confirmLabel: "Rompre", tone: "danger" }))) return;
    setBusy(true);
    try {
      await diplomacy(action, { pactId: pact.id });
      toast.success(action === "accept" ? "Pacte signé." : action === "break" ? "Pacte rompu : préavis lancé." : action === "decline" ? "Proposition refusée." : "Proposition retirée.");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  const badge =
    status === "active"
      ? { label: "Pacte actif", cls: "text-mint-glow border-mint-glow/40 bg-mint-glow/10", icon: ShieldCheck }
      : status === "ending"
        ? { label: `Fin dans ${formatDuration(Math.max(0, pact.endsAtMs - now) / 1000)}`, cls: "text-ember-glow border-ember-glow/40 bg-ember-glow/10", icon: Timer }
        : { label: mine ? "Proposition envoyée" : "Proposition reçue", cls: "text-gold-glow border-gold-glow/40 bg-gold-glow/10", icon: Handshake };

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-display text-base text-slate-100">
          <span className="font-mono text-gold-glow">[{otherTag}]</span> {otherName}
        </p>
        <span className={cn("inline-flex items-center gap-1 border px-2 py-0.5 text-[11px] font-semibold", badge.cls)}>
          <badge.icon className="h-3 w-3" /> {badge.label}
        </span>
        <div className="ml-auto flex flex-wrap gap-1">
          {canLead && status === "proposed" && !mine && (
            <>
              <Button size="sm" disabled={busy} onClick={() => void act("accept")}>
                Accepter
              </Button>
              <Button size="sm" variant="ghost" disabled={busy} onClick={() => void act("decline")}>
                Refuser
              </Button>
            </>
          )}
          {canLead && status === "proposed" && mine && (
            <Button size="sm" variant="ghost" disabled={busy} onClick={() => void act("cancel")}>
              <X className="h-3.5 w-3.5" /> Retirer
            </Button>
          )}
          {canLead && status === "active" && (
            <Button size="sm" variant="ghost" className="text-danger-glow" disabled={busy} onClick={() => void act("break")}>
              Rompre
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setOpen((o) => !o)}>
            <MessagesSquare className="h-3.5 w-3.5" /> Canal
            {unread > 0 && !open && <span className="ml-1 min-w-4 bg-ember-glow px-1 font-mono text-[10px] font-bold leading-4 tabular-nums text-space-950">{unread}</span>}
          </Button>
        </div>
      </div>
      <p className="mt-1 text-xs text-slate-500">
        {status === "proposed"
          ? `Proposé par ${pact.proposedByPseudo} ${timeAgo(pact.createdAtMs)}.`
          : status === "ending"
            ? `Rompu par [${pact.brokenByTag}] : attaques toujours interdites jusqu'à la fin du préavis.`
            : `Signé ${timeAgo(pact.acceptedAtMs)} : aucune attaque ni guerre entre vos deux alliances.`}
      </p>
      {open && <PactChannel pact={pact} uid={uid} />}
    </Card>
  );
}

export function DiplomacyTab({ alliance, uid, canLead }: { alliance: Alliance; uid: string; canLead: boolean }) {
  useNowTicker();
  const [pacts, setPacts] = useState<AlliancePact[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  // Lien d'une notification : ouvre directement le canal de ce pacte.
  const [params] = useSearchParams();
  const focusPact = params.get("pacte");
  useEffect(() => subscribePacts(setPacts), []);
  useEffect(() => subscribeAlliances(setAlliances), []);
  const now = Date.now();

  const mine = useMemo(() => pacts.filter((p) => involves(p, alliance.id) && pactOpen(p, now)), [pacts, alliance.id, now]);
  const busyWith = new Set(mine.flatMap((p) => [p.allianceA, p.allianceB]));
  const options = alliances
    .filter((a) => a.id !== alliance.id && !busyWith.has(a.id))
    .map((a) => ({ value: a.id, label: `[${a.tag}] ${a.name} · ${a.members.length} membre${a.members.length > 1 ? "s" : ""}` }));

  const propose = async () => {
    if (!target) return;
    setBusy(true);
    try {
      await diplomacy("propose", { targetAllianceId: target });
      setTarget("");
      toast.success("Proposition envoyée : leurs officiers doivent l'accepter.");
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-3 p-4">
        <div>
          <h3 className="hud-title text-sm text-slate-100">Pactes de non-agression</h3>
          <p className="mt-1 text-xs text-slate-400">
            Tant qu'un pacte est actif, vos membres ne peuvent ni s'attaquer ni se déclarer la guerre. Rompre un pacte laisse {DIPLOMACY_RULES.breakNoticeHours} h de
            préavis. {DIPLOMACY_RULES.maxPacts} relations au plus par alliance ; chacune a son canal de discussion.
          </p>
        </div>
        {canLead ? (
          <div className="flex flex-wrap gap-2">
            <IconSelect value={target} onChange={setTarget} options={options} placeholder="Choisir une alliance…" ariaLabel="Alliance" className="min-w-[14rem] flex-1" />
            <Button disabled={busy || !target || mine.length >= DIPLOMACY_RULES.maxPacts} onClick={() => void propose()}>
              <Handshake className="h-4 w-4" /> Proposer un pacte
            </Button>
          </div>
        ) : (
          <p className="text-xs text-slate-500">Seuls le fondateur et les officiers négocient les pactes.</p>
        )}
      </Card>
      {mine.length === 0 ? (
        <EmptyState icon={<Handshake className="h-5 w-5" />} title="Aucune relation">
          Propose un pacte à une alliance voisine pour sécuriser tes arrières.
        </EmptyState>
      ) : (
        mine.map((p) => <PactCard key={p.id} pact={p} own={alliance} uid={uid} canLead={canLead} initiallyOpen={p.id === focusPact} />)
      )}
    </div>
  );
}
