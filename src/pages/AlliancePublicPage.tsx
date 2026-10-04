import { alpha } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, Crown, Handshake, Map, Shield, Swords, Trophy, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/hud";
import { PageHeader } from "@/components/layout/PageHeader";
import { PlayerName } from "@/components/ui/player-name";
import { ApplyDialog } from "@/components/game/ApplyDialog";
import { memberRankLabel, normalizeAllianceProfile, RECRUITING_LABELS } from "@/game/allianceProfile";
import { allianceRole, ALLIANCE_RULES } from "@/game/alliances";
import { findAllianceChallenge, type AllianceChallengeState } from "@/game/allianceChallenge";
import { AllianceError, fetchAllianceChallenge, joinAlliance, subscribeAlliance, withdrawApplication } from "@/services/allianceService";
import { useTerritories } from "@/services/territoryService";
import { usePlayerStore } from "@/store/playerStore";
import type { Alliance } from "@/types/game";

/* v5.10.5 : fiche publique d'une alliance — présentation, recrutement,
   membres et rangs, palmarès ; rejoindre ou postuler. */

export function AlliancePublicPage() {
  const { id = "" } = useParams();
  const player = usePlayerStore((s) => s.player);
  const [alliance, setAlliance] = useState<Alliance | null | undefined>(undefined);
  const [challenge, setChallenge] = useState<AllianceChallengeState | null>(null);
  const [applying, setApplying] = useState(false);
  const territories = useTerritories();
  useEffect(() => subscribeAlliance(id, setAlliance), [id]);
  useEffect(() => {
    void fetchAllianceChallenge().then(setChallenge);
  }, []);
  if (!player) return null;
  if (alliance === undefined) return <p className="text-sm text-slate-500">Chargement…</p>;
  if (alliance === null)
    return (
      <Card>
        <EmptyState icon="🚩" title="Alliance introuvable">
          Elle a peut-être été dissoute.
        </EmptyState>
      </Card>
    );
  const profile = normalizeAllianceProfile(alliance.profile);
  const isMember = alliance.members.includes(player.uid);
  const applied = profile.applications.some((a) => a.uid === player.uid);
  const full = alliance.members.length >= ALLIANCE_RULES.maxMembers;
  const sectors = territories ? territories.sectors.filter((s) => s.allianceId === alliance.id).length : null;
  const challengeRank = challenge ? challenge.standings.findIndex((s) => s.allianceId === alliance.id) : -1;
  const lastWin = challenge?.previous?.results.find((r) => r.allianceId === alliance.id);

  const join = async () => {
    try {
      await joinAlliance(player.uid, player.pseudo, alliance.id);
      toast.success("Alliance rejointe !");
    } catch (err) {
      toast.error(err instanceof AllianceError ? err.message : "Impossible de rejoindre.");
    }
  };
  const withdraw = async () => {
    try {
      await withdrawApplication(alliance.id);
      toast.success("Candidature retirée.");
    } catch (err) {
      toast.error(err instanceof AllianceError ? err.message : "Impossible de retirer la candidature.");
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Link to="/game/alliance" className="inline-flex items-center gap-1 self-start text-xs text-cyan-glow hover:underline">
        <ArrowLeft className="h-3.5 w-3.5" /> Alliances
      </Link>
      <PageHeader eyebrow={`Fiche d'alliance · [${alliance.tag}]`} title={alliance.name} description={RECRUITING_LABELS[profile.recruiting]} />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Card className="flex flex-col gap-3 p-4">
          <h2 className="hud-title text-sm">Présentation</h2>
          <p className="whitespace-pre-line text-sm text-slate-300">{profile.description || "Cette alliance ne s'est pas encore présentée."}</p>
          {!isMember && !player.allianceId && (
            <div className="flex flex-wrap items-center gap-2 border-t border-white/5 pt-3">
              {full ? (
                <span className="text-sm text-slate-400">Alliance complète ({ALLIANCE_RULES.maxMembers} membres).</span>
              ) : profile.recruiting === "open" ? (
                <Button onClick={() => void join()}>Rejoindre</Button>
              ) : profile.recruiting === "apply" ? (
                applied ? (
                  <>
                    <span className="text-sm text-mint-glow">Candidature envoyée, en attente de réponse.</span>
                    <Button size="sm" variant="ghost" onClick={() => void withdraw()}>
                      Retirer
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setApplying(true)}>Postuler</Button>
                )
              ) : (
                <span className="text-sm text-slate-400">Cette alliance ne recrute pas pour l'instant.</span>
              )}
            </div>
          )}
          {!isMember && player.allianceId && <p className="border-t border-white/5 pt-3 text-xs text-slate-500">Tu fais déjà partie d'une alliance.</p>}
        </Card>
        <Card className="flex flex-col gap-2 p-4 text-sm text-slate-300">
          <h2 className="hud-title flex items-center gap-2 text-sm">
            <Trophy className="h-4 w-4 text-gold-glow" /> Palmarès
          </h2>
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-slate-500" /> Fondée {alliance.createdAtMs ? `le ${new Date(alliance.createdAtMs).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}` : "il y a longtemps"}
          </p>
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4 text-slate-500" /> {alliance.members.length} / {ALLIANCE_RULES.maxMembers} membres
          </p>
          {sectors !== null && (
            <p className="flex items-center gap-2">
              <Map className="h-4 w-4 text-slate-500" /> {sectors} secteur{sectors > 1 ? "s" : ""} contrôlé{sectors > 1 ? "s" : ""}
            </p>
          )}
          {challenge && (
            <p className="flex items-center gap-2">
              <Swords className="h-4 w-4 text-slate-500" /> Défi « {findAllianceChallenge(challenge.challengeId).name} » : {challengeRank >= 0 ? `${challengeRank + 1}${challengeRank === 0 ? "re" : "e"} place` : "pas encore classée"}
            </p>
          )}
          {lastWin && (
            <p className="flex items-center gap-2 text-gold-glow">
              <Trophy className="h-4 w-4" /> {lastWin.rank === 1 ? "Victoire" : `${lastWin.rank}e place`} au défi de la semaine dernière
            </p>
          )}
        </Card>
      </div>
      <Card className="flex flex-col gap-2 p-4">
        <h2 className="hud-title text-sm">Membres</h2>
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {alliance.members.map((m) => {
            const role = allianceRole(alliance, m);
            const rank = memberRankLabel(alliance, m);
            return (
              <li key={m} className="flex items-center gap-2 text-sm text-slate-300">
                <PlayerName uid={m} pseudo={alliance.memberPseudos[m] ?? "?"} className="min-w-0 truncate" />
                {role === "founder" && <Crown className="h-3.5 w-3.5 text-gold-glow" aria-label="Fondateur" />}
                {role === "officer" && <Shield className="h-3.5 w-3.5 text-cyan-glow" aria-label="Officier" />}
                {role === "diplomat" && <Handshake className="h-3.5 w-3.5 text-mint-glow" aria-label="Diplomate" />}
                {rank && (
                  <span className="border px-1 font-mono text-[9px] font-bold uppercase" style={{ color: rank.color, borderColor: `${alpha(rank.color, 40)}` }}>
                    {rank.name}
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
      <ApplyDialog alliance={applying ? alliance : null} onClose={() => setApplying(false)} />
    </div>
  );
}
