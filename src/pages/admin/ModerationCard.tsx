import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Ban, ShieldOff, Trash2, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/ui/number-input";
import { HudCallout, HudTag } from "@/components/ui/hud";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { askConfirm } from "@/components/ui/confirm-dialog";
import { BAN_DURATIONS } from "@/game/moderation";
import { adminBanPlayer, adminDeletePlayer, adminLiftBan, adminListBans, type AdminBan, type AdminPlayer } from "@/services/adminService";
import { cn, formatDuration } from "@/lib/utils";

/* 5.26 : modération d'un joueur : suspension (durée au choix) ou bannissement
   définitif, toujours motivés et consignés au journal ; suppression définitive
   du compte avec confirmation par le pseudo. */

function errorText(err: unknown) {
  return (err as { response?: { message?: string } })?.response?.message ?? (err as Error).message ?? "Action impossible.";
}

export function ModerationCard({ player, onDeleted }: { player: AdminPlayer; onDeleted: () => void }) {
  const [ban, setBan] = useState<AdminBan | null>(null);
  const [hours, setHours] = useState<number | null>(24);
  const [customDays, setCustomDays] = useState(0);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmPseudo, setConfirmPseudo] = useState("");
  const [deleteReason, setDeleteReason] = useState("");

  const load = async () => {
    try {
      const list = await adminListBans();
      setBan(list.find((b) => b.uid === player.id && b.active) ?? null);
    } catch {
      setBan(null);
    }
  };
  useEffect(() => {
    void load();
    setReason("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- rechargé à chaque joueur
  }, [player.id]);

  const effectiveHours = customDays > 0 ? customDays * 24 : hours;
  const doBan = async () => {
    const label = effectiveHours === null ? "Bannir définitivement" : `Suspendre ${formatDuration(effectiveHours * 3600)}`;
    if (!(await askConfirm({ title: `${label} ${player.pseudo} ?`, message: `Motif : ${reason.trim()}. Le joueur est déconnecté de toutes ses actions et ne peut plus se reconnecter.`, confirmLabel: label, tone: "danger" }))) return;
    setBusy(true);
    try {
      await adminBanPlayer(player.id, effectiveHours, reason.trim());
      toast.success(effectiveHours === null ? `${player.pseudo} est banni définitivement.` : `${player.pseudo} est suspendu.`);
      setReason("");
      await load();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  const lift = async () => {
    setBusy(true);
    try {
      await adminLiftBan(player.id, "levée depuis l'administration");
      toast.success("Bannissement levé.");
      await load();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };
  const remove = async () => {
    setBusy(true);
    try {
      const out = await adminDeletePlayer(player.id, confirmPseudo, deleteReason.trim());
      toast.success(`Compte de ${out.pseudo} supprimé.`, { description: `${out.fleets} flotte(s), ${out.offers} offre(s) retirées${out.alliance ? ` · alliance ${out.alliance}` : ""}.` });
      setDeleting(false);
      onDeleted();
    } catch (err) {
      toast.error(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3 border border-danger-glow/25 bg-danger-glow/[0.03] p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="hud-eyebrow flex items-center gap-2 text-[10px] text-danger-glow">
          <UserX className="h-3.5 w-3.5" /> Modération
        </p>
        {ban && <HudTag tone="danger">{ban.untilMs === null ? "Banni" : "Suspendu"}</HudTag>}
        <Button size="sm" variant="ghost" className="ml-auto text-danger-glow" disabled={busy} onClick={() => (setDeleting(true), setConfirmPseudo(""), setDeleteReason(""))}>
          <Trash2 className="h-3.5 w-3.5" /> Supprimer le compte
        </Button>
      </div>

      {ban ? (
        <HudCallout tone="danger" className="flex flex-wrap items-center gap-3 text-xs">
          <span className="min-w-0 flex-1">
            {ban.untilMs === null ? (
              "Banni définitivement"
            ) : (
              <>
                Suspendu encore <span className="font-mono tabular-nums">{formatDuration(Math.max(0, ban.untilMs - Date.now()) / 1000)}</span>
              </>
            )}{" "}
            · par {ban.byName}
            <span className="block text-slate-400">Motif : {ban.reason}</span>
          </span>
          <Button size="sm" variant="secondary" disabled={busy} onClick={() => void lift()}>
            <ShieldOff className="h-3.5 w-3.5" /> Lever
          </Button>
        </HudCallout>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Durée">
            {BAN_DURATIONS.map((d) => (
              <button
                key={d.label}
                type="button"
                onClick={() => (setHours(d.hours), setCustomDays(0))}
                aria-pressed={customDays === 0 && hours === d.hours}
                className={cn(
                  "border px-2.5 py-1 font-mono text-xs transition-colors",
                  customDays === 0 && hours === d.hours ? (d.hours === null ? "border-danger-glow/70 bg-danger-glow/15 text-danger-glow" : "border-ember-glow/70 bg-ember-glow/15 text-ember-glow") : "border-white/10 text-slate-400 hover:border-white/30",
                )}
              >
                {d.label}
              </button>
            ))}
            <span className="ml-1 text-[11px] text-slate-500">ou</span>
            <NumberInput size="sm" value={customDays} onChange={setCustomDays} min={0} max={3650} suffix="j" aria-label="Durée en jours" className="w-32" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Input value={reason} maxLength={300} placeholder="Motif (obligatoire, montré au joueur)" className="h-8 flex-1" onChange={(e) => setReason(e.target.value)} />
            <Button size="sm" variant="danger" disabled={busy || reason.trim().length < 5} onClick={() => void doBan()}>
              <Ban className="h-3.5 w-3.5" /> {effectiveHours === null ? "Bannir" : "Suspendre"}
            </Button>
          </div>
        </>
      )}

      <Dialog open={deleting} onOpenChange={(o) => !o && !busy && setDeleting(false)}>
        <DialogContent>
          <DialogTitle className="text-danger-glow">Supprimer définitivement {player.pseudo} ?</DialogTitle>
          <DialogDescription>
            Compte, empire, colonies, flottes en vol, offres du marché et notifications sont effacés ; le joueur quitte son alliance. Irréversible (une sauvegarde automatique reste le seul recours).
          </DialogDescription>
          <Input value={deleteReason} maxLength={300} placeholder="Motif (obligatoire, consigné au journal)" onChange={(e) => setDeleteReason(e.target.value)} />
          <Input value={confirmPseudo} placeholder={`Tape « ${player.pseudo} » pour confirmer`} onChange={(e) => setConfirmPseudo(e.target.value)} aria-label="Confirmation par le pseudo" />
          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={busy} onClick={() => setDeleting(false)}>
              Annuler
            </Button>
            <Button variant="danger" disabled={busy || confirmPseudo !== player.pseudo || deleteReason.trim().length < 5} onClick={() => void remove()}>
              <Trash2 className="h-3.5 w-3.5" /> Supprimer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
