import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Crown, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import {
  AllianceError,
  clearOwnAllianceId,
  createAlliance,
  demoteOfficer,
  joinAlliance,
  kickMember,
  leaveAlliance,
  markAllianceRead,
  promoteToOfficer,
  sendAllianceMessage,
  subscribeAlliance,
  subscribeAllianceMessages,
  subscribeAlliances,
} from "@/services/allianceService";
import { splitMentions } from "@/game/mentions";
import { timeAgo, cn } from "@/lib/utils";
import type { Alliance, AllianceMessage } from "@/types/game";

function CreateOrBrowse({ uid, pseudo }: { uid: string; pseudo: string }) {
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => subscribeAlliances(setAlliances), []);

  const handleCreate = async () => {
    setSubmitting(true);
    try {
      await createAlliance(uid, pseudo, name, tag);
      toast.success("Alliance créée !");
    } catch (err) {
      toast.error(err instanceof AllianceError ? err.message : "Création impossible.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (allianceId: string) => {
    try {
      await joinAlliance(uid, pseudo, allianceId);
      toast.success("Alliance rejointe !");
    } catch (err) {
      toast.error(err instanceof AllianceError ? err.message : "Impossible de rejoindre.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Créer une alliance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input placeholder="Nom de l'alliance" value={name} onChange={(e) => setName(e.target.value)} />
          <Input
            placeholder="Tag (2-5 car.)"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            className="sm:w-32"
          />
          <Button disabled={submitting} onClick={() => void handleCreate()}>
            Créer
          </Button>
        </CardContent>
      </Card>

      <Card className="divide-y divide-white/5">
        <CardHeader>
          <CardTitle>Alliances existantes</CardTitle>
        </CardHeader>
        {alliances.length === 0 && (
          <p className="p-4 text-sm text-slate-500">Aucune alliance pour l'instant — sois le premier à en créer une !</p>
        )}
        {alliances.map((a) => (
          <div key={a.id} className="flex items-center justify-between gap-3 p-3">
            <div>
              <p className="text-sm font-medium text-slate-100">
                [{a.tag}] {a.name}
              </p>
              <p className="text-xs text-slate-500">
                {a.members.length} membre{a.members.length > 1 ? "s" : ""}
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={() => void handleJoin(a.id)}>
              Rejoindre
            </Button>
          </div>
        ))}
      </Card>
    </div>
  );
}

function AllianceRoom({ uid, pseudo, allianceId }: { uid: string; pseudo: string; allianceId: string }) {
  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [messages, setMessages] = useState<AllianceMessage[]>([]);
  const [text, setText] = useState("");
  const [leaving, setLeaving] = useState(false);

  useEffect(() => subscribeAlliance(allianceId, setAlliance), [allianceId]);
  useEffect(() => subscribeAllianceMessages(allianceId, setMessages), [allianceId]);
  useEffect(() => {
    void markAllianceRead(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- marque "lu à l'instant" une fois à l'ouverture, pas à chaque nouveau message reçu pendant que le chat reste ouvert
  }, [allianceId]);

  // On ne peut plus écrire sur le doc alliance une fois exclu (plus dans
  // `members`) : on efface donc soi-même son allianceId en le détectant.
  useEffect(() => {
    if (alliance && !alliance.members.includes(uid)) {
      void clearOwnAllianceId(uid);
      toast.info("Tu as été exclu de cette alliance.");
    }
  }, [alliance, uid]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const value = text;
    setText("");
    try {
      await sendAllianceMessage(allianceId, uid, pseudo, value);
    } catch (err) {
      toast.error(err instanceof AllianceError ? err.message : "Envoi impossible.");
    }
  };

  const handleLeave = async () => {
    setLeaving(true);
    try {
      await leaveAlliance(uid, allianceId);
      toast.success("Tu as quitté l'alliance.");
    } catch {
      toast.error("Impossible de quitter l'alliance.");
    } finally {
      setLeaving(false);
    }
  };

  const handlePromote = async (targetUid: string) => {
    try {
      await promoteToOfficer(uid, allianceId, targetUid);
      toast.success("Membre promu officier.");
    } catch (err) {
      toast.error(err instanceof AllianceError ? err.message : "Promotion impossible.");
    }
  };

  const handleDemote = async (targetUid: string) => {
    try {
      await demoteOfficer(uid, allianceId, targetUid);
      toast.success("Officier rétrogradé.");
    } catch (err) {
      toast.error(err instanceof AllianceError ? err.message : "Rétrogradation impossible.");
    }
  };

  const handleKick = async (targetUid: string) => {
    try {
      await kickMember(uid, allianceId, targetUid);
      toast.success("Membre exclu de l'alliance.");
    } catch (err) {
      toast.error(err instanceof AllianceError ? err.message : "Exclusion impossible.");
    }
  };

  if (!alliance) return null;

  const isFounder = uid === alliance.createdBy;

  return (
    <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
      <Card className="flex h-fit flex-col gap-3 p-4">
        <div>
          <p className="font-display text-lg text-white">
            [{alliance.tag}] {alliance.name}
          </p>
          <p className="text-xs text-slate-500">
            {alliance.members.length} membre{alliance.members.length > 1 ? "s" : ""}
          </p>
        </div>
        <ul className="space-y-1.5 text-sm text-slate-300">
          {alliance.members.map((m) => {
            const role = m === alliance.createdBy ? "founder" : alliance.roles?.[m] === "officer" ? "officer" : "member";
            return (
              <li key={m} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint-glow" />
                <span className="flex-1 truncate">{alliance.memberPseudos[m] ?? "?"}</span>
                {role === "founder" && <Crown className="h-3.5 w-3.5 shrink-0 text-gold-glow" aria-label="Fondateur" />}
                {role === "officer" && <Shield className="h-3.5 w-3.5 shrink-0 text-cyan-glow" aria-label="Officier" />}
                {isFounder && m !== uid && (
                  <div className="flex shrink-0 gap-1">
                    {role === "officer" ? (
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={() => void handleDemote(m)}>
                        Rétrograder
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs" onClick={() => void handlePromote(m)}>
                        Promouvoir
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-6 px-1.5 text-xs text-danger-glow" onClick={() => void handleKick(m)}>
                      Exclure
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        <Button variant="outline" disabled={leaving} onClick={() => void handleLeave()}>
          Quitter l'alliance
        </Button>
      </Card>

      <Card className="flex flex-col p-4">
        <p className="hud-eyebrow mb-3 text-slate-500">Canal d'alliance</p>
        <div className="max-h-96 flex-1 space-y-3 overflow-y-auto">
          {messages.length === 0 && <p className="text-sm text-slate-500">Aucun message pour l'instant.</p>}
          {messages.map((m) => (
            <div key={m.id} className="text-sm">
              <span className="text-cyan-glow">{m.authorPseudo}</span>{" "}
              <span className="text-xs text-slate-600">{timeAgo(m.createdAtMs)}</span>
              <p className="text-slate-200">
                {splitMentions(m.text, Object.values(alliance.memberPseudos)).map((seg, i) => (
                  <span key={i} className={cn(seg.isMention && "font-medium text-gold-glow")}>
                    {seg.text}
                  </span>
                ))}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrire un message…"
            onKeyDown={(e) => e.key === "Enter" && void handleSend()}
          />
          <Button onClick={() => void handleSend()}>Envoyer</Button>
        </div>
      </Card>
    </div>
  );
}

export function AlliancePage() {
  const player = usePlayerStore((s) => s.player);
  const uid = useAuthStore((s) => s.user?.uid);

  if (!player || !uid) return null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Diplomatie" title="Alliance" description="Rejoins ou crée une alliance, discute en temps réel." />
      {player.allianceId ? (
        <AllianceRoom uid={uid} pseudo={player.pseudo} allianceId={player.allianceId} />
      ) : (
        <CreateOrBrowse uid={uid} pseudo={player.pseudo} />
      )}
    </div>
  );
}
