import { useRef, useState } from "react";
import { toast } from "sonner";
import { Check, ImagePlus, LayoutGrid, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayerAvatar } from "@/components/ui/player-avatar";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { AVATAR_PRESET_GROUPS, type AvatarPreset } from "@/lib/avatarPresets";
import { cn } from "@/lib/utils";
import { removeAvatar, uploadAvatar, useAvatar } from "@/services/avatarService";
import type { PlayerState } from "@/types/game";

/** v5.1 : avatar de profil, visible sur ta fiche publique. */
export function AvatarCard({ player }: { player: PlayerState }) {
  const [file, setFile] = useAvatar(player.uid);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const [gallery, setGallery] = useState(false);

  // Avatar prédéfini : l'image du jeu est recopiée sur la fiche, comme un envoi.
  const choose = async (p: AvatarPreset) => {
    setBusy(true);
    try {
      const res = await fetch(p.src);
      if (!res.ok) throw new Error("Image introuvable.");
      const blob = await res.blob();
      setFile(await uploadAvatar(player.uid, new File([blob], `${p.id}.webp`, { type: blob.type || "image/webp" })));
      toast.success(`Avatar « ${p.label} » choisi.`);
      setGallery(false);
    } catch (err) {
      toast.error(err instanceof Error && !("status" in err) ? err.message : "Choix impossible pour le moment.");
    } finally {
      setBusy(false);
    }
  };

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
        <p className="hud-title text-sm text-slate-100">Avatar</p>
        <p className="text-xs text-slate-400">Visible sur ta fiche publique. L'image est recadrée en carré (256 px). Pas de contenu choquant : la modération peut la retirer.</p>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
          <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void pick(e.target.files?.[0])} />
          <Button variant="primary" disabled={busy} onClick={() => input.current?.click()}>
            <ImagePlus className="h-4 w-4" /> {file ? "Changer" : "Choisir une image"}
          </Button>
          <Button variant="secondary" disabled={busy} onClick={() => setGallery(true)}>
            <LayoutGrid className="h-4 w-4" /> Galerie
          </Button>
          {file && (
            <Button variant="ghost" disabled={busy} onClick={clear}>
              <Trash2 className="h-4 w-4" /> Retirer
            </Button>
          )}
        </div>
      </div>
      <Dialog open={gallery} onOpenChange={setGallery}>
        <DialogContent className="max-w-3xl">
          <DialogTitle>Choisir un avatar</DialogTitle>
          <DialogDescription>Un portrait du jeu, prêt à l'emploi. Tu peux toujours envoyer ta propre image à la place.</DialogDescription>
          <div className="mt-2 flex max-h-[65vh] flex-col gap-4 overflow-y-auto pr-1">
            {AVATAR_PRESET_GROUPS.map((g) => (
              <PresetGroup key={g.id} label={g.label} presets={g.presets} busy={busy} onPick={(p) => void choose(p)} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

/** Groupe de la galerie : les images absentes (pas encore livrées) sont masquées. */
function PresetGroup({ label, presets, busy, onPick }: { label: string; presets: AvatarPreset[]; busy: boolean; onPick: (p: AvatarPreset) => void }) {
  const [missing, setMissing] = useState<Record<string, true>>({});
  const shown = presets.filter((p) => !missing[p.id]);
  if (shown.length === 0) return null;
  return (
    <section>
      <p className="hud-eyebrow mb-2 text-slate-400">{label}</p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {shown.map((p) => (
          <button
            key={p.id}
            type="button"
            disabled={busy}
            title={p.label}
            onClick={() => onPick(p)}
            className={cn("group relative aspect-square overflow-hidden border border-white/10 bg-space-950 transition hover:border-cyan-glow/60 disabled:opacity-50")}
          >
            <img src={p.src} alt={p.label} loading="lazy" className="h-full w-full object-cover object-top transition group-hover:scale-105" onError={() => setMissing((m) => ({ ...m, [p.id]: true }))} />
            <span className="absolute inset-x-0 bottom-0 truncate bg-gradient-to-t from-black/90 to-transparent px-1.5 pb-1 pt-4 text-left text-[10px] text-slate-200">{p.label}</span>
            <Check className="absolute right-1 top-1 h-4 w-4 text-cyan-glow opacity-0 transition group-hover:opacity-100" />
          </button>
        ))}
      </div>
    </section>
  );
}
