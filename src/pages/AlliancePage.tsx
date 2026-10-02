import { DiplomacyTab } from "@/components/game/DiplomacyTab";
import { useSearchParams } from "react-router-dom";
import { usePactUnreadStore } from "@/services/diplomacyService";

const ALLIANCE_TABS = ["membres", "tresor", "recherches", "projets", "renseignement", "guerre", "diplomatie", "classement"];
import { LinkifiedText } from "@/components/ui/linkified-text";
import { useEffect, useState } from "react";
import { EmptyState } from "@/components/ui/hud";
import { toast } from "sonner";
import { ChevronsDown, ChevronsUp, Crown, Shield, ShieldPlus, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import {
  AllianceError,
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
import { allianceRole, ALLIANCE_RULES } from "@/game/alliances";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WarTab } from "@/components/game/WarTab";
import { AllianceRanking } from "@/components/game/AllianceRanking";
import { GarrisonDialog } from "@/components/game/MissionDialogs";
import {
  IntelTab,
  ProjectsTab,
  ResearchTab,
  TreasuryTab,
} from "@/components/game/AllianceTabs";
import { timeAgo, cn } from "@/lib/utils";
import type { Alliance, AllianceMessage } from "@/types/game";
import { StaffBadge } from "@/components/ui/staff-badge";

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
      toast.error(
        err instanceof AllianceError ? err.message : "Création impossible.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoin = async (allianceId: string) => {
    try {
      await joinAlliance(uid, pseudo, allianceId);
      toast.success("Alliance rejointe !");
    } catch (err) {
      toast.error(
        err instanceof AllianceError ? err.message : "Impossible de rejoindre.",
      );
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Créer une alliance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row">
          <Input
            placeholder="Nom de l'alliance"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
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

      <Card>
        <CardHeader>
          <CardTitle>Alliances existantes</CardTitle>
        </CardHeader>
        {alliances.length === 0 && (
          <EmptyState icon="🚩" title="Aucune alliance">
            Sois le premier à en créer une !
          </EmptyState>
        )}
        <div className="relative flex flex-col gap-2 px-3 pb-3">
        {alliances.map((a) => (
          <div
            key={a.id}
            className="grid grid-cols-[auto_1fr_auto] items-center gap-3 border border-cyan-glow/[0.12] bg-gradient-to-r from-white/[0.035] to-transparent px-3 py-2.5 transition-colors [clip-path:polygon(0_0,calc(100%-12px)_0,100%_12px,100%_100%,0_100%)] hover:border-cyan-glow/35"
          >
            <span className="hud-cut-sm grid h-10 min-w-12 place-items-center border border-gold-glow/35 bg-gold-glow/[0.08] px-1.5 font-mono text-xs font-bold tracking-[0.1em] text-gold-glow">
              {a.tag}
            </span>
            <div className="min-w-0">
              <p className="hud-title truncate text-[15px] normal-case tracking-[0.03em] text-white">{a.name}</p>
              <div className="mt-1 flex items-center gap-2">
                <div className="flex gap-0.5">
                  {Array.from({ length: ALLIANCE_RULES.maxMembers }, (_, i) => (
                    <i key={i} className={i < a.members.length ? "h-1.5 w-3 bg-cyan-glow" : "h-1.5 w-3 bg-white/[0.08]"} />
                  ))}
                </div>
                <span className="font-mono text-[10px] text-slate-500">
                  {a.members.length}/{ALLIANCE_RULES.maxMembers}
                </span>
              </div>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={a.members.length >= ALLIANCE_RULES.maxMembers}
              onClick={() => void handleJoin(a.id)}
            >
              {a.members.length >= ALLIANCE_RULES.maxMembers
                ? "Complète"
                : "Rejoindre"}
            </Button>
          </div>
        ))}
        </div>
      </Card>
    </div>
  );
}

function AllianceRoom({
  uid,
  pseudo,
  allianceId,
}: {
  uid: string;
  pseudo: string;
  allianceId: string;
}) {
  const [alliance, setAlliance] = useState<Alliance | null>(null);
  const [messages, setMessages] = useState<AllianceMessage[]>([]);
  // v4.0 : onglet ouvert par un lien de notification, non lus du canal diplomatique.
  const tabParam = useSearchParams()[0].get("onglet");
  const pactUnread = usePactUnreadStore((s) => Object.values(s.unread).reduce((a, b) => a + b, 0));
  const [text, setText] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [garrisonTarget, setGarrisonTarget] = useState<{
    uid: string;
    pseudo: string;
  } | null>(null);

  useEffect(() => subscribeAlliance(allianceId, setAlliance), [allianceId]);
  useEffect(
    () => subscribeAllianceMessages(allianceId, setMessages),
    [allianceId],
  );
  useEffect(() => {
    void markAllianceRead(uid);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- marque "lu à l'instant" une fois à l'ouverture, pas à chaque nouveau message reçu pendant que le chat reste ouvert
  }, [allianceId]);

  const handleSend = async () => {
    if (!text.trim()) return;
    const value = text;
    setText("");
    try {
      await sendAllianceMessage(allianceId, uid, pseudo, value);
    } catch (err) {
      toast.error(
        err instanceof AllianceError ? err.message : "Envoi impossible.",
      );
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
      toast.error(
        err instanceof AllianceError ? err.message : "Promotion impossible.",
      );
    }
  };

  const handleDemote = async (targetUid: string) => {
    try {
      await demoteOfficer(uid, allianceId, targetUid);
      toast.success("Officier rétrogradé.");
    } catch (err) {
      toast.error(
        err instanceof AllianceError
          ? err.message
          : "Rétrogradation impossible.",
      );
    }
  };

  const handleKick = async (targetUid: string) => {
    try {
      await kickMember(uid, allianceId, targetUid);
      toast.success("Membre exclu de l'alliance.");
    } catch (err) {
      toast.error(
        err instanceof AllianceError ? err.message : "Exclusion impossible.",
      );
    }
  };

  if (!alliance) return null;

  const isFounder = uid === alliance.createdBy;
  const role = allianceRole(alliance, uid);

  return (
    <Tabs defaultValue={tabParam && ALLIANCE_TABS.includes(tabParam) ? tabParam : "membres"} className="flex flex-col gap-4">
      <TabsList className="self-start">
        <TabsTrigger value="membres">Membres et canal</TabsTrigger>
        <TabsTrigger value="tresor">Trésor</TabsTrigger>
        <TabsTrigger value="recherches">Recherches</TabsTrigger>
        <TabsTrigger value="projets">Projets</TabsTrigger>
        <TabsTrigger value="renseignement">Renseignement</TabsTrigger>
        <TabsTrigger value="guerre">Guerre</TabsTrigger>
        <TabsTrigger value="diplomatie" className="inline-flex items-center gap-1.5">
          Diplomatie
          {pactUnread > 0 && <span className="min-w-4 rounded-full bg-ember-glow px-1 text-[10px] font-bold leading-4 text-space-950">{pactUnread}</span>}
        </TabsTrigger>
        <TabsTrigger value="classement">Classement</TabsTrigger>
      </TabsList>
      <TabsContent value="classement">
        <AllianceRanking currentId={alliance.id} />
      </TabsContent>
      <TabsContent value="diplomatie">
        <DiplomacyTab alliance={alliance} uid={uid} canLead={role === "founder" || role === "officer"} />
      </TabsContent>
      <TabsContent value="guerre">
        <WarTab alliance={alliance} canLead={role === "founder" || role === "officer"} />
      </TabsContent>
      <TabsContent value="tresor">
        <TreasuryTab
          alliance={alliance}
          uid={uid}
          canDistribute={role === "founder" || role === "officer"}
        />
      </TabsContent>
      <TabsContent value="recherches">
        <ResearchTab
          alliance={alliance}
          canStart={role === "founder" || role === "officer"}
        />
      </TabsContent>
      <TabsContent value="projets">
        <ProjectsTab alliance={alliance} canUseTreasury={role === "founder" || role === "officer"} />
      </TabsContent>
      <TabsContent value="renseignement">
        <IntelTab />
      </TabsContent>
      <TabsContent value="membres">
        <div className="grid gap-4 lg:grid-cols-[300px_1fr]">
          <Card className="flex h-fit flex-col gap-3 p-4">
            <div>
              <p className="font-display text-lg text-white">
                [{alliance.tag}] {alliance.name}
              </p>
              <p className="text-xs text-slate-500">
                {alliance.members.length} / {ALLIANCE_RULES.maxMembers} membres
              </p>
            </div>
            <ul className="space-y-1.5 text-sm text-slate-300">
              {alliance.members.map((m) => {
                const role =
                  m === alliance.createdBy
                    ? "founder"
                    : alliance.roles?.[m] === "officer"
                      ? "officer"
                      : "member";
                return (
                  <li key={m} className="flex flex-col gap-1 border-b border-white/5 pb-1.5 last:border-0">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-mint-glow" />
                      <span className="truncate">{alliance.memberPseudos[m] ?? "?"}</span>
                      <StaffBadge uid={m} compact />
                      {role === "founder" && <Crown className="h-3.5 w-3.5 shrink-0 text-gold-glow" aria-label="Fondateur" />}
                      {role === "officer" && <Shield className="h-3.5 w-3.5 shrink-0 text-cyan-glow" aria-label="Officier" />}
                    </span>
                    {/* Actions sur une seconde ligne : le pseudo reste toujours lisible. */}
                    {m !== uid && (
                      <span className="flex flex-wrap gap-1 pl-3.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 gap-1 px-1.5 text-[10px] text-cyan-glow"
                          title="Envoyer une garnison"
                          onClick={() => setGarrisonTarget({ uid: m, pseudo: alliance.memberPseudos[m] ?? "?" })}
                        >
                          <ShieldPlus className="h-3 w-3" /> Renforcer
                        </Button>
                        {isFounder &&
                          (role === "officer" ? (
                            <Button size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[10px]" onClick={() => void handleDemote(m)}>
                              <ChevronsDown className="h-3 w-3" /> Rétrograder
                            </Button>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[10px]" onClick={() => void handlePromote(m)}>
                              <ChevronsUp className="h-3 w-3" /> Promouvoir
                            </Button>
                          ))}
                        {isFounder && (
                          <Button size="sm" variant="ghost" className="h-6 gap-1 px-1.5 text-[10px] text-danger-glow" onClick={() => void handleKick(m)}>
                            <UserX className="h-3 w-3" /> Exclure
                          </Button>
                        )}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
            <Button
              variant="outline"
              disabled={leaving}
              onClick={() => void handleLeave()}
            >
              Quitter l'alliance
            </Button>
            <GarrisonDialog
              target={garrisonTarget}
              onClose={() => setGarrisonTarget(null)}
            />
          </Card>

          <Card className="flex flex-col p-4">
            <p className="hud-eyebrow mb-3 text-slate-500">Canal d'alliance</p>
            <div className="max-h-96 flex-1 space-y-3 overflow-y-auto">
              {messages.length === 0 && (
                <p className="text-sm text-slate-500">
                  Aucun message pour l'instant.
                </p>
              )}
              {messages.map((m) => (
                <div key={m.id} className="text-sm">
                  <span className="text-cyan-glow">{m.authorPseudo}</span> <StaffBadge uid={m.authorUid} compact className="align-middle" />{" "}
                  <span className="text-xs text-slate-600">
                    {timeAgo(m.createdAtMs)}
                  </span>
                  <p className="text-slate-200">
                    {splitMentions(
                      m.text,
                      Object.values(alliance.memberPseudos),
                    ).map((seg, i) => (
                      <span
                        key={i}
                        className={cn(
                          seg.isMention && "font-medium text-gold-glow",
                        )}
                      >
                        {seg.isMention ? seg.text : <LinkifiedText text={seg.text} jumbo />}
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
              <EmojiPicker onPick={(e) => setText((t) => t + e)} />
              <Button onClick={() => void handleSend()}>Envoyer</Button>
            </div>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}

export function AlliancePage() {
  const player = usePlayerStore((s) => s.player);
  const uid = useAuthStore((s) => s.user?.uid);

  if (!player || !uid) return null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        eyebrow="Cosmic Empires / Diplomatie"
        title="Alliance"
        description="Rejoins ou crée une alliance, discute en temps réel."
      />
      {player.allianceId ? (
        <AllianceRoom
          uid={uid}
          pseudo={player.pseudo}
          allianceId={player.allianceId}
        />
      ) : (
        <CreateOrBrowse uid={uid} pseudo={player.pseudo} />
      )}
    </div>
  );
}
