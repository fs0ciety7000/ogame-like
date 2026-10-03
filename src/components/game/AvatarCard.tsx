import { useRef, useState } from "react";
import { toast } from "sonner";
import { ImagePlus, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { removeAvatar, uploadAvatar, useAvatar } from "@/services/avatarService";
import type { PlayerState } from "@/types/game";

/** v5.1 : avatar de profil, visible sur ta fiche publique. */
export function AvatarCard({ player }: { player: PlayerState }) {
  const [file, setFile] = useAvatar(player.uid);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  const pick = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      setFile(await uploadAvatar(player.uid, f));
      toast.success("Avatar mis à jour.");
    } catch (err) {
      toast.error(err instanceof Error && !("status" in err) ? err.message : "Envoi impossible (image de 400 ko au plus après recadrage).");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  const clear = async () => {
    setBusy(true);
    try {
      await removeAvatar(player.uid);
      setFile("");
    } catch {
      toast.error("Suppression impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card className="flex flex-col items-center gap-4 p-4 sm:flex-row">
      <PlayerAvatar uid={player.uid} pseudo={player.pseudo} file={file} className="h-24 w-24" />
      <div className="flex flex-1 flex-col gap-2 text-center sm:text-left">
        <p className="hud-title text-sm text-white">Avatar</p>
        <p className="text-xs text-slate-400">Visible sur ta fiche publique. L'image est recadrée en carré (256 px). Pas de contenu choquant : la modération peut la retirer.</p>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
          <Button variant="primary" disabled={busy} onClick={() => input.current?.click()}>
            <ImagePlus className="h-4 w-4" /> {file ? "Changer" : "Choisir une image"}
          </Button>
          {file && (
            <Button variant="ghost" disabled={busy} onClick={clear}>
              <Trash2 className="h-4 w-4" /> Retirer
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}
