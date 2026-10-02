import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Download, Link2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { canvasToBlob, drawVictoryCard, type VictoryCardInput } from "@/lib/victoryCard";
import { uploadVictoryCard } from "@/services/victoryCardService";

/* v4.1 : aperçu, téléchargement et lien de partage d'une carte de victoire. */

export function VictoryCardDialog({ card, target, onClose }: { card: VictoryCardInput | null; target: string; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    setReady(false);
    setLink(null);
    if (!card) return;
    // Le canvas existe au rendu suivant (fenêtre ouverte).
    const t = setTimeout(() => {
      if (canvas.current) void drawVictoryCard(canvas.current, card).then(() => setReady(true));
    }, 50);
    return () => clearTimeout(t);
  }, [card]);

  const download = async () => {
    if (!canvas.current) return;
    const blob = await canvasToBlob(canvas.current);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cosmic-empires-victoire.jpg";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const share = async () => {
    if (!canvas.current || !card) return;
    setBusy(true);
    try {
      const url = link ?? (await uploadVictoryCard(await canvasToBlob(canvas.current), `${card.headline} ${card.subtitle}`, `${card.pseudo} · ${card.stats.map((s) => `${s.label} ${s.value}`).join(" · ")}`, target));
      setLink(url);
      await navigator.clipboard?.writeText(url).catch(() => {});
      toast.success("Lien copié", { description: "Colle-le sur Discord, WhatsApp ou ailleurs : la carte s'affiche en aperçu." });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Partage impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!card} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogTitle>Carte de victoire</DialogTitle>
        <div className="relative border border-cyan-glow/20 bg-black">
          <canvas ref={canvas} className="block h-auto w-full" />
          {!ready && (
            <p className="absolute inset-0 grid place-items-center text-sm text-slate-400">
              <Loader2 className="h-5 w-5 animate-spin" />
            </p>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button variant="secondary" disabled={!ready} onClick={() => void download()}>
            <Download className="h-4 w-4" /> Télécharger
          </Button>
          <Button disabled={!ready || busy} onClick={() => void share()}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Copier le lien de partage
          </Button>
        </div>
        {link && <p className="mt-2 break-all font-mono text-xs text-slate-400">{link}</p>}
      </DialogContent>
    </Dialog>
  );
}
