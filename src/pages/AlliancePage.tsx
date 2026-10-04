import { DiplomacyTab } from "@/components/game/DiplomacyTab";
import { Link, useSearchParams } from "react-router-dom";
import { usePactUnreadStore } from "@/services/diplomacyService";

const ALLIANCE_TABS = ["fiche", "defi", "saga", "objectif", "calendrier", "membres", "boss", "tresor", "recherches", "projets", "renseignement", "guerre", "diplomatie", "classement"];

/** 5.15 : quatorze onglets regroupés en cinq sections, chacune avec ses sous-onglets. */
const ALLIANCE_SECTIONS: { id: string; label: string; tabs: { id: string; label: string }[] }[] = [
  { id: "qg", label: "QG", tabs: [{ id: "membres", label: "Membres et canal" }, { id: "fiche", label: "Fiche et rangs" }] },
  { id: "activites", label: "Activités", tabs: [{ id: "objectif", label: "Objectif du jour" }, { id: "defi", label: "Défi de la semaine" }, { id: "saga", label: "Saga" }, { id: "calendrier", label: "Calendrier" }] },
  { id: "economie", label: "Économie", tabs: [{ id: "tresor", label: "Trésor" }, { id: "recherches", label: "Recherches" }, { id: "projets", label: "Projets" }] },
  { id: "operations", label: "Opérations", tabs: [{ id: "boss", label: "Boss" }, { id: "guerre", label: "Guerre" }, { id: "diplomatie", label: "Diplomatie" }, { id: "renseignement", label: "Renseignement" }] },
  { id: "classement", label: "Classement", tabs: [{ id: "classement", label: "Classement" }] },
];
const sectionOf = (tab: string) => ALLIANCE_SECTIONS.find((s) => s.tabs.some((t) => t.id === tab)) ?? ALLIANCE_SECTIONS[0];
import { LinkifiedText } from "@/components/ui/linkified-text";
import { useEffect, useRef, useState } from "react";
import { AllianceBossTab } from "@/components/game/AllianceBossTab";
import { normalizeAllianceBoss } from "@/game/allianceBoss";
import { isOnline } from "@/game/retention";
import { useDirectoryStore } from "@/store/directoryStore";
import { EmptyState, HudChip } from "@/components/ui/hud";
import { toast } from "sonner";
import { Crown, Handshake, Shield, ShieldPlus, UserX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmojiPicker } from "@/components/ui/emoji-picker";
import { PageHeader } from "@/components/layout/PageHeader";
import { usePlayerStore } from "@/store/playerStore";
import { useAuthStore } from "@/store/authStore";
import {
  AllianceError,
  setMemberRole,
  createAlliance,
  joinAlliance,
  kickMember,
  leaveAlliance,
  markAllianceRead,
  sendAllianceMessage,
  sendTyping,
  subscribeAlliance,
  subscribeTyping,
  subscribeAllianceMessages,
  subscribeAlliances,
} from "@/services/allianceService";
import { splitMentions } from "@/game/mentions";
import { allianceRole, ALLIANCE_RULES, canDiplomacy } from "@/game/alliances";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { AllianceProfileTab } from "@/components/game/AllianceProfileTab";
import { ApplyDialog } from "@/components/game/ApplyDialog";
import { AllianceChallengeTab } from "@/components/game/AllianceChallengeTab";
import { hasAlliancePerm, memberRankLabel, normalizeAllianceProfile } from "@/game/allianceProfile";
import { WarTab } from "@/components/game/WarTab";
import { AllianceDailyTab } from "@/components/game/AllianceDailyTab";
import { AllianceSagaTab } from "@/components/game/AllianceSagaTab";
import { AllianceCalendarTab } from "@/components/game/AllianceCalendarTab";
import { AllianceRanking } from "@/components/game/AllianceRanking";
import { GarrisonDialog } from "@/components/game/MissionDialogs";
import {
  IntelTab,
  ProjectsTab,
  ResearchTab,
  TreasuryTab,
} from "@/components/game/AllianceTabs";
import { timeAgo, cn, alpha } from "@/lib/utils";
import type { Alliance, AllianceMessage } from "@/types/game";
import { StaffBadge } from "@/components/ui/staff-badge";

function CreateOrBrowse({ uid, pseudo }: { uid: string; pseudo: string }) {
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [name, setName] = useState("");
  const [tag, setTag] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [applyTo, setApplyTo] = useState<Alliance | null>(null);

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
            {(() => {
              // v5.10.5 : mode de recrutement (ouvert, sur candidature, fermé) et fiche publique.
              const profile = normalizeAllianceProfile(a.profile);
              const full = a.members.length >= ALLIANCE_RULES.maxMembers;
              const applied = profile.applications.some((x) => x.uid === uid);
              return (
                <span className="flex flex-wrap items-center justify-end gap-1.5">
                  <Link to={`/game/alliance/fiche/${a.id}`} className="text-xs text-cyan-glow hover:underline">
                    Fiche
                  </Link>
                  {full ? (
                    <Button size="sm" variant="outline" disabled>
                      Complète
                    </Button>
                  ) : profile.recruiting === "open" ? (
                    <Button size="sm" variant="outline" onClick={() => void handleJoin(a.id)}>
                      Rejoindre
                    </Button>
                  ) : profile.recruiting === "apply" ? (
                    <Button size="sm" variant="outline" disabled={applied} onClick={() => setApplyTo(a)}>
                      {applied ? "Candidature envoyée" : "Postuler"}
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" disabled>
                      Fermée
                    </Button>
                  )}
                </span>
              );
            })()}
          </div>
        ))}
        </div>
      </Card>
      <ApplyDialog alliance={applyTo} onClose={() => setApplyTo(null)} />
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
  const [tab, setTabState] = useState(() => (tabParam && ALLIANCE_TABS.includes(tabParam) ? tabParam : "membres"));
  // 5.15 : dernier sous-onglet ouvert dans chaque section (on y revient en changeant de section).
  const memory = useRef<Record<string, string>>({});
  const pactUnread = usePactUnreadStore((s) => Object.values(s.unread).reduce((a, b) => a + b, 0));
  const [text, setText] = useState("");
  const [leaving, setLeaving] = useState(false);
  const [garrisonTarget, setGarrisonTarget] = useState<{
    uid: string;
    pseudo: string;
  } | null>(null);

  useEffect(() => subscribeAlliance(allianceId, setAlliance), [allianceId]);
  // v4.6 : présence, « … écrit » et défilement vers le dernier message.
  const lastActiveOf = useDirectoryStore((s) => s.lastActiveOf);
  const player = usePlayerStore((s) => s.player);
  const [typing, setTyping] = useState<string[]>([]);
  useEffect(() => subscribeTyping(allianceId, uid, setTyping), [allianceId, uid]);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);
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

  const handleRole = async (targetUid: string, role: "officer" | "diplomat" | "member") => {
    try {
      await setMemberRole(targetUid, role);
      toast.success(role === "officer" ? "Membre promu officier." : role === "diplomat" ? "Membre nommé diplomate." : "Membre redevenu simple membre.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Changement de rôle impossible.");
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
  // v5.10.5 : droits fins (rangs personnalisés).
  const canKick = hasAlliancePerm(alliance, uid, "kick");
  const canRecruit = hasAlliancePerm(alliance, uid, "recruit");
  const applications = normalizeAllianceProfile(alliance.profile).applications.length;
  const bossState = normalizeAllianceBoss(alliance.boss);
  const bossActive = !!bossState && bossState.status === "active" && Date.now() < bossState.endMs && bossState.hp > 0;
  const online = (m: string) => m === uid || isOnline(lastActiveOf[m], Date.now());
  const role = allianceRole(alliance, uid);
  const setTab = (t: string) => {
    memory.current[sectionOf(t).id] = t;
    setTabState(t);
  };
  const section = sectionOf(tab);
  const badges: Record<string, number> = { diplomatie: pactUnread, fiche: applications > 0 && canRecruit ? applications : 0 };

  return (
    <Tabs value={tab} onValueChange={setTab} className="flex flex-col gap-4">
      {/* 5.15 : sections, puis sous-onglets en pastilles (docs/DESIGN.md). */}
      <div className="flex flex-col gap-2">
        <div role="tablist" aria-label="Sections de l'alliance" className="flex flex-wrap gap-1 border-b border-white/10 pb-2">
          {ALLIANCE_SECTIONS.map((sec) => {
            const badge = sec.tabs.reduce((n, t) => n + (badges[t.id] ?? 0), 0);
            const on = section.id === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setTab(memory.current[sec.id] ?? sec.tabs[0].id)}
                className={cn("hud-title inline-flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors", on ? "border-b-2 border-cyan-glow text-white" : "text-slate-400 hover:text-slate-200")}
              >
                {sec.label}
                {badge > 0 && <span className="grid h-4 min-w-4 place-items-center bg-ember-glow px-1 font-mono text-[9px] font-bold text-space-950">{badge}</span>}
                {sec.id === "operations" && bossActive && <span className="h-1.5 w-1.5 animate-pulse bg-danger-glow" aria-label="Boss en cours" />}
              </button>
            );
          })}
        </div>
        {section.tabs.length > 1 && (
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label={section.label}>
            {section.tabs.map((t) => (
              <HudChip key={t.id} asChild size="md" tone={tab === t.id ? "accent" : "neutral"}>
                <button type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
                  {t.label}
                  {(badges[t.id] ?? 0) > 0 && <span className="font-mono">· {badges[t.id]}</span>}
                  {t.id === "boss" && bossActive && <span className="h-1.5 w-1.5 animate-pulse bg-danger-glow" aria-label="En cours" />}
                </button>
              </HudChip>
            ))}
          </div>
        )}
      </div>
      <TabsContent value="saga">
        <AllianceSagaTab allianceId={alliance.id} />
      </TabsContent>
      <TabsContent value="objectif">
        <AllianceDailyTab alliance={alliance} uid={uid} canVote={role === "founder" || role === "officer"} />
      </TabsContent>
      <TabsContent value="calendrier">
        <AllianceCalendarTab alliance={alliance} />
      </TabsContent>
      <TabsContent value="boss">{player && <AllianceBossTab alliance={alliance} player={player} />}</TabsContent>
      <TabsContent value="defi">
        <AllianceChallengeTab allianceId={alliance.id} />
      </TabsContent>
      <TabsContent value="fiche">
        <AllianceProfileTab alliance={alliance} uid={uid} />
      </TabsContent>
      <TabsContent value="classement">
        <AllianceRanking currentId={alliance.id} />
      </TabsContent>
      <TabsContent value="diplomatie">
        <DiplomacyTab alliance={alliance} uid={uid} canLead={canDiplomacy(role)} />
      </TabsContent>
      <TabsContent value="guerre">
        <WarTab alliance={alliance} canLead={canDiplomacy(role)} />
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
                      : alliance.roles?.[m] === "diplomat"
                        ? "diplomat"
                        : "member";
                return (
                  <li key={m} className="flex flex-col gap-1 border-b border-white/5 pb-1.5 last:border-0">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className={cn("h-2 w-2 shrink-0 rounded-full", online(m) ? "bg-mint-glow shadow-[0_0_6px_var(--color-mint-glow)]" : "bg-slate-600")}
                        title={online(m) ? "En ligne" : lastActiveOf[m] ? `Vu ${timeAgo(lastActiveOf[m])}` : "Hors ligne"}
                      />
                      <span className="truncate">{alliance.memberPseudos[m] ?? "?"}</span>
                      <StaffBadge uid={m} compact />
                      {role === "founder" && <Crown className="h-3.5 w-3.5 shrink-0 text-gold-glow" aria-label="Fondateur" />}
                      {role === "officer" && <Shield className="h-3.5 w-3.5 shrink-0 text-cyan-glow" aria-label="Officier" />}
                      {role === "diplomat" && <Handshake className="h-3.5 w-3.5 shrink-0 text-mint-glow" aria-label="Diplomate" />}
                      {(() => {
                        const rank = memberRankLabel(alliance, m);
                        return rank ? (
                          <span className="shrink-0 border px-1 font-mono text-[9px] font-bold uppercase" style={{ color: rank.color, borderColor: `${alpha(rank.color, 40)}` }}>
                            {rank.name}
                          </span>
                        ) : null;
                      })()}
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
                        {isFounder && role !== "founder" && (
                          <select
                            value={role}
                            onChange={(e) => void handleRole(m, e.target.value as "officer" | "diplomat" | "member")}
                            className="h-6 border border-white/10 bg-space-900 px-1 text-[10px] text-slate-300"
                            aria-label="Rôle"
                          >
                            <option value="member">Membre</option>
                            <option value="officer">Officier</option>
                            <option value="diplomat">Diplomate</option>
                          </select>
                        )}
                        {canKick && role !== "founder" && (
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
            <div ref={scrollRef} className="max-h-96 flex-1 space-y-3 overflow-y-auto">
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
            <p className="mt-2 h-4 text-[11px] italic text-slate-400" aria-live="polite">
              {typing.length > 0 && `${typing.join(", ")} ${typing.length > 1 ? "écrivent" : "écrit"}…`}
            </p>
            <div className="mt-1 flex gap-2">
              <Input
                value={text}
                onChange={(e) => {
                  setText(e.target.value);
                  if (e.target.value.trim()) sendTyping();
                }}
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
