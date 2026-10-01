import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldPlus, UserMinus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HudTag } from "@/components/ui/hud";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/pages/admin/fields";
import { useAuthStore } from "@/store/authStore";
import { adminListAdmins, adminListPlayers, adminManageAdmin, type AdminPlayer, type GameAdmin } from "@/services/adminService";
import { cn, formatNumber } from "@/lib/utils";

/** Administrateurs du jeu : liste, ajout d'un joueur, retrait. */
export function AdminsPanel() {
  const me = useAuthStore((s) => s.user?.uid);
  const [admins, setAdmins] = useState<GameAdmin[] | null>(null);
  const [players, setPlayers] = useState<AdminPlayer[]>([]);
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState<AdminPlayer | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState<GameAdmin | null>(null);

  useEffect(() => {
    adminListAdmins()
      .then(setAdmins)
      .catch((err) => {
        toast.error((err as Error).message);
        setAdmins([]);
      });
    adminListPlayers()
      .then(setPlayers)
      .catch(() => setPlayers([]));
  }, []);

  const adminIds = useMemo(() => new Set((admins ?? []).map((a) => a.id)), [admins]);
  const candidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players.filter((p) => !adminIds.has(p.uid) && (!q || p.pseudo.toLowerCase().includes(q))).slice(0, 8);
  }, [players, adminIds, query]);

  const run = async (action: "add" | "remove", uid: string, label: string) => {
    setBusy(true);
    try {
      setAdmins(await adminManageAdmin(action, uid, action === "add" ? note : ""));
      toast.success(action === "add" ? `${label} est maintenant administrateur.` : `${label} n'est plus administrateur.`);
      setPicked(null);
      setNote("");
      setQuery("");
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
      setRemoving(null);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1.2fr_1fr]">
      <Card className="flex flex-col gap-3 p-5">
        <h3 className="hud-title flex items-center gap-2 text-sm text-white">
          <ShieldCheck className="h-4 w-4 text-cyan-glow" /> Administrateurs ({admins?.length ?? "…"})
        </h3>
        <p className="text-xs text-slate-500">
          Accès complet à la console : contenu, joueurs, maintenance et remise à zéro. Tu ne peux pas te retirer toi-même, et il reste toujours au moins un
          administrateur.
        </p>
        <ul className="divide-y divide-white/5">
          {(admins ?? []).map((a) => {
            const label = a.pseudo || a.email || a.id;
            return (
              <li key={a.id} className="flex items-center gap-3 py-2.5">
                <span className="hud-cut-sm grid h-9 w-9 shrink-0 place-items-center border border-cyan-glow/30 bg-cyan-glow/10 font-display text-sm font-bold uppercase text-cyan-glow">
                  {label.slice(0, 2)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 truncate text-sm font-semibold text-slate-100">
                    {label} {a.id === me && <HudTag tone="mint">Toi</HudTag>}
                  </p>
                  <p className="truncate font-mono text-[11px] text-slate-500">
                    {a.email || a.id}
                    {a.note && <span className="text-slate-400"> · {a.note}</span>}
                  </p>
                </div>
                {a.id !== me && (
                  <Button variant="ghost" size="sm" disabled={busy || (admins?.length ?? 0) <= 1} onClick={() => setRemoving(a)}>
                    <UserMinus className="h-4 w-4" /> Retirer
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      </Card>

      <Card className="flex flex-col gap-3 p-5">
        <h3 className="hud-title flex items-center gap-2 text-sm text-white">
          <ShieldPlus className="h-4 w-4 text-cyan-glow" /> Ajouter un administrateur
        </h3>
        <Field label="Joueur">
          <Input
            value={picked ? picked.pseudo : query}
            placeholder="Rechercher un pseudo…"
            onChange={(e) => {
              setPicked(null);
              setQuery(e.target.value);
            }}
          />
        </Field>
        {!picked && (
          <ul className="max-h-64 overflow-y-auto border border-white/5">
            {candidates.length === 0 && <li className="px-3 py-2 text-xs text-slate-500">Aucun joueur trouvé.</li>}
            {candidates.map((p) => (
              <li key={p.uid}>
                <button
                  type="button"
                  onClick={() => setPicked(p)}
                  className={cn("flex w-full items-center justify-between px-3 py-1.5 text-left text-sm text-slate-300 hover:bg-cyan-glow/10 hover:text-cyan-glow")}
                >
                  {p.pseudo}
                  <span className="font-mono text-[11px] text-slate-500">{formatNumber(p.xp)} XP</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <Field label="Note (facultatif)" hint="Rôle ou raison, visible des autres administrateurs.">
          <Input value={note} maxLength={200} placeholder="Modération, équilibrage…" onChange={(e) => setNote(e.target.value)} />
        </Field>
        <Button className="mt-auto" disabled={!picked || busy} onClick={() => picked && void run("add", picked.uid, picked.pseudo)}>
          <ShieldPlus className="h-4 w-4" /> Nommer administrateur
        </Button>
      </Card>

      <Dialog open={removing !== null} onOpenChange={(o) => !o && setRemoving(null)}>
        <DialogContent>
          <DialogTitle>Retirer cet administrateur ?</DialogTitle>
          <DialogDescription>
            {removing?.pseudo || removing?.email} perdra l'accès à la console d'administration. Son compte de joueur n'est pas touché.
          </DialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setRemoving(null)}>
              Annuler
            </Button>
            <Button variant="danger" disabled={busy} onClick={() => removing && void run("remove", removing.id, removing.pseudo || removing.email)}>
              Retirer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
