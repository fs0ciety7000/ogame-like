import { useState } from "react";
import { AmberAmount } from "@/components/ui/amber";
import { toast } from "sonner";
import { PenLine } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bountyState, KESH } from "@/game/bounties";
import { cleanNewPseudo, RENAME_RULES } from "@/game/rename";
import { GameActionError, renamePlayer } from "@/services/playerService";
import { assetUrl } from "@/lib/assets";
import type { PlayerState } from "@/types/game";

/** v5.1 : changement de pseudo, une seule fois, contre de l'Ambre. */
export function RenameCard({ player }: { player: PlayerState }) {
  const [value, setValue] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const amber = bountyState(player).amber;

  if (player.renamed) {
    return (
      <Card className="flex items-center gap-3 p-4 text-sm text-slate-400">
        <PenLine className="h-4 w-4 shrink-0 text-slate-500" />
        Pseudo changé le {new Date(player.renamed.atMs).toLocaleDateString("fr-FR")} (anciennement « {player.renamed.fromPseudo} »). Le changement est définitif.
      </Card>
    );
  }

  let error = "";
  if (value.trim()) {
    try {
      if (cleanNewPseudo(value) === player.pseudo) error = "C'est déjà ton pseudo.";
    } catch (err) {
      error = err instanceof Error ? err.message : "Pseudo invalide.";
    }
  }
  const short = amber < RENAME_RULES.amber;

  const submit = async () => {
    setBusy(true);
    try {
      const out = await renamePlayer(value);
      toast.success(`Tu t'appelles désormais ${out.pseudo}. Connecte-toi avec ce pseudo ou ton e-mail.`);
      setValue("");
      setConfirm(false);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Changement impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-center gap-2">
        <PenLine className="h-4 w-4 text-cyan-glow" />
        <p className="hud-title text-sm text-white">Changer de pseudo</p>
        <span className="ml-auto inline-flex items-center gap-1 text-xs text-slate-400">
          <img src={assetUrl(KESH.amberIcon)} alt="Ambre" className="h-4 w-4" /> {RENAME_RULES.amber} Ambre · une seule fois
        </span>
      </div>
      <p className="text-xs text-slate-400">
        Ton nouveau pseudo devient aussi ton identifiant de connexion. Les anciens rapports et messages gardent l'ancien nom.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={value}
          maxLength={RENAME_RULES.maxLength}
          placeholder={player.pseudo}
          onChange={(ev) => {
            setValue(ev.target.value);
            setConfirm(false);
          }}
          className="sm:max-w-xs"
        />
        {confirm ? (
          <div className="flex gap-2">
            <Button variant="primary" disabled={busy} onClick={submit}>
              Confirmer « {value.trim()} »
            </Button>
            <Button variant="ghost" disabled={busy} onClick={() => setConfirm(false)}>
              Annuler
            </Button>
          </div>
        ) : (
          <Button variant="primary" disabled={!value.trim() || !!error || short} onClick={() => setConfirm(true)}>
            Changer
          </Button>
        )}
      </div>
      {error ? <p className="text-xs text-ember-glow">{error}</p> : short ? <p className="text-xs text-ember-glow">Il te faut <AmberAmount value={RENAME_RULES.amber} /> (tu en as {amber}). Gagne-en avec les primes Kesh'Vaar.</p> : null}
    </Card>
  );
}
