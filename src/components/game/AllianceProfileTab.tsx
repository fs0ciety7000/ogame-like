import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { Check, ExternalLink, Plus, Save, Trash2, UserCheck, UserX } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ALLIANCE_PERMS, ALLIANCE_PROFILE_RULES, hasAlliancePerm, normalizeAllianceProfile, RECRUITING_LABELS, type AlliancePerm, type AllianceRank, type Recruiting, RANK_COLORS } from "@/game/allianceProfile";
import { allianceRole } from "@/game/alliances";
import { AllianceError, answerApplication, assignAllianceRank, deleteAllianceRank, saveAllianceProfile, saveAllianceRank } from "@/services/allianceService";
import { cn, timeAgo } from "@/lib/utils";
import type { Alliance } from "@/types/game";

/* v5.10.5 : onglet « Fiche » de l'alliance — présentation et recrutement,
   candidatures, rangs personnalisés (fondateur). */

const COLORS = RANK_COLORS;

const fail = (err: unknown, fallback: string) => toast.error(err instanceof AllianceError ? err.message : fallback);

function RankEditor({ rank, onDone }: { rank: Partial<AllianceRank> | null; onDone: () => void }) {
  const [name, setName] = useState(rank?.name ?? "");
  const [color, setColor] = useState(rank?.color ?? COLORS[0]);
  const [perms, setPerms] = useState<AlliancePerm[]>(rank?.perms ?? []);
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    try {
      await saveAllianceRank({ ...(rank?.id ? { id: rank.id } : {}), name, color, perms });
      toast.success("Rang enregistré.");
      onDone();
    } catch (err) {
      fail(err, "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="flex flex-col gap-2 border border-cyan-glow/20 bg-white/[0.02] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <Input value={name} maxLength={24} onChange={(e) => setName(e.target.value)} placeholder="Nom du rang (ex. Trésorier)" className="max-w-56" />
        <div className="flex gap-1" role="radiogroup" aria-label="Couleur">
          {COLORS.map((c) => (
            <button key={c} type="button" role="radio" aria-checked={color === c} aria-label={c} onClick={() => setColor(c)} className={cn("h-6 w-6 border-2", color === c ? "border-white" : "border-transparent")} style={{ background: c }} />
          ))}
        </div>
      </div>
      <div className="grid gap-1 sm:grid-cols-2">
        {ALLIANCE_PERMS.map((p) => (
          <label key={p.id} className="flex items-start gap-2 text-xs text-slate-300" title={p.hint}>
            <input type="checkbox" checked={perms.includes(p.id)} onChange={(e) => setPerms((cur) => (e.target.checked ? [...cur, p.id] : cur.filter((x) => x !== p.id)))} className="mt-0.5" />
            <span>
              <strong className="text-white">{p.label}</strong> <span className="text-slate-500">— {p.hint}</span>
            </span>
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" disabled={busy || !name.trim()} onClick={() => void save()}>
          <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>
          Annuler
        </Button>
      </div>
    </div>
  );
}

export function AllianceProfileTab({ alliance, uid }: { alliance: Alliance; uid: string }) {
  const profile = normalizeAllianceProfile(alliance.profile);
  const canRecruit = hasAlliancePerm(alliance, uid, "recruit");
  const isFounder = allianceRole(alliance, uid) === "founder";
  const [description, setDescription] = useState(profile.description);
  const [recruiting, setRecruiting] = useState<Recruiting>(profile.recruiting);
  const [editing, setEditing] = useState<Partial<AllianceRank> | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  const saveProfile = async () => {
    setBusy(true);
    try {
      await saveAllianceProfile({ description, recruiting });
      toast.success("Fiche enregistrée.");
    } catch (err) {
      fail(err, "Enregistrement impossible.");
    } finally {
      setBusy(false);
    }
  };

  const answer = async (target: string, accept: boolean) => {
    try {
      await answerApplication(target, accept);
      toast.success(accept ? "Candidature acceptée : bienvenue au nouveau membre !" : "Candidature refusée.");
    } catch (err) {
      fail(err, "Réponse impossible.");
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="flex flex-col gap-3 p-4">
        <div className="flex items-center gap-2">
          <h2 className="hud-title text-sm">Fiche publique</h2>
          <Link to={`/game/alliance/fiche/${alliance.id}`} className="ml-auto inline-flex items-center gap-1 text-xs text-cyan-glow hover:underline">
            Voir la fiche <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
        {canRecruit ? (
          <>
            <textarea
              value={description}
              maxLength={ALLIANCE_PROFILE_RULES.descriptionMax}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
              placeholder="Présente ton alliance : son esprit, ses horaires, ce que vous cherchez…"
              className="border border-cyan-glow/15 bg-space-900/80 px-3 py-2 text-sm text-slate-100 outline-none focus:border-cyan-glow/60"
              aria-label="Présentation"
            />
            <div className="flex flex-col gap-1.5" role="radiogroup" aria-label="Recrutement">
              {(Object.keys(RECRUITING_LABELS) as Recruiting[]).map((r) => (
                <label key={r} className="flex items-center gap-2 text-sm text-slate-300">
                  <input type="radio" checked={recruiting === r} onChange={() => setRecruiting(r)} /> {RECRUITING_LABELS[r]}
                </label>
              ))}
            </div>
            <Button size="sm" className="self-start" disabled={busy} onClick={() => void saveProfile()}>
              <Save className="mr-1 h-3.5 w-3.5" /> Enregistrer la fiche
            </Button>
          </>
        ) : (
          <>
            <p className="whitespace-pre-line text-sm text-slate-300">{profile.description || "Pas encore de présentation."}</p>
            <p className="text-xs text-slate-500">Recrutement : {RECRUITING_LABELS[profile.recruiting]}</p>
          </>
        )}
      </Card>

      {canRecruit && (
        <Card className="flex flex-col gap-2 p-4">
          <h2 className="hud-title text-sm">Candidatures ({profile.applications.length})</h2>
          {profile.applications.length === 0 ? (
            <p className="text-xs text-slate-500">{profile.recruiting === "apply" ? "Aucune candidature en attente." : "Passe le recrutement sur « candidature » pour en recevoir."}</p>
          ) : (
            profile.applications.map((a) => (
              <div key={a.uid} className="flex flex-col gap-1 border border-white/[0.06] bg-white/[0.02] p-2">
                <p className="flex items-center gap-2 text-sm text-white">
                  {a.pseudo} <span className="text-[11px] text-slate-500">{timeAgo(a.atMs)}</span>
                </p>
                {a.message && <p className="text-xs italic text-slate-300">« {a.message} »</p>}
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" disabled={alliance.members.length >= 6} onClick={() => void answer(a.uid, true)}>
                    <UserCheck className="mr-1 h-3.5 w-3.5" /> Accepter
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void answer(a.uid, false)}>
                    <UserX className="mr-1 h-3.5 w-3.5" /> Refuser
                  </Button>
                </div>
              </div>
            ))
          )}
        </Card>
      )}

      <Card className="flex flex-col gap-2 p-4 lg:col-span-2">
        <div className="flex items-center gap-2">
          <h2 className="hud-title text-sm">Rangs personnalisés</h2>
          {isFounder && profile.ranks.length < ALLIANCE_PROFILE_RULES.maxRanks && editing === undefined && (
            <Button size="sm" variant="ghost" className="ml-auto" onClick={() => setEditing(null)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Nouveau rang
            </Button>
          )}
        </div>
        <p className="text-xs text-slate-500">Les rangs s'ajoutent aux rôles d'officier et de diplomate : ils donnent des droits précis à qui tu veux. Seul le fondateur les crée et les attribue.</p>
        {editing !== undefined && <RankEditor rank={editing} onDone={() => setEditing(undefined)} />}
        {profile.ranks.length === 0 && editing === undefined && <p className="text-xs text-slate-500">Aucun rang pour l'instant.</p>}
        {profile.ranks.map((r) => (
          <div key={r.id} className="flex flex-wrap items-center gap-2 border border-white/[0.06] bg-white/[0.02] px-3 py-2">
            <span className="hud-chip hud-chip-sm font-bold" style={{ ["--c" as string]: r.color }}>
              {r.name}
            </span>
            <span className="min-w-0 flex-1 text-xs text-slate-400">{r.perms.length ? r.perms.map((p) => ALLIANCE_PERMS.find((x) => x.id === p)?.label).join(" · ") : "Aucun droit (rang honorifique)"}</span>
            <span className="text-[11px] text-slate-500">{Object.values(profile.memberRanks).filter((id) => id === r.id).length} membre(s)</span>
            {isFounder && (
              <>
                <Button size="sm" variant="ghost" onClick={() => setEditing(r)}>
                  Modifier
                </Button>
                <Button size="sm" variant="ghost" aria-label="Supprimer le rang" onClick={() => void deleteAllianceRank(r.id).then(() => toast.success("Rang supprimé."), (err) => fail(err, "Suppression impossible."))}>
                  <Trash2 className="h-3.5 w-3.5 text-danger-glow" />
                </Button>
              </>
            )}
          </div>
        ))}
        {isFounder && profile.ranks.length > 0 && (
          <div className="mt-1 grid gap-1 sm:grid-cols-2">
            {alliance.members
              .filter((m) => m !== alliance.createdBy)
              .map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="min-w-0 flex-1 truncate">{alliance.memberPseudos[m] ?? "?"}</span>
                  <select
                    value={profile.memberRanks[m] ?? ""}
                    onChange={(e) => void assignAllianceRank(m, e.target.value || null).then(() => toast.success("Rang attribué."), (err) => fail(err, "Attribution impossible."))}
                    className="h-7 border border-white/10 bg-space-900 px-1 text-xs text-slate-200"
                    aria-label={`Rang de ${alliance.memberPseudos[m] ?? "?"}`}
                  >
                    <option value="">Aucun rang</option>
                    {profile.ranks.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
          </div>
        )}
        {!isFounder && profile.memberRanks[uid] && (
          <p className="flex items-center gap-1 text-xs text-mint-glow">
            <Check className="h-3.5 w-3.5" /> Ton rang : {profile.ranks.find((r) => r.id === profile.memberRanks[uid])?.name}
          </p>
        )}
      </Card>
    </div>
  );
}
