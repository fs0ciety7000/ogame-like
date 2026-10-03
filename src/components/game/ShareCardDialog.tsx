import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Link2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { canvasToBlob } from "@/lib/victoryCard";
import { uploadVictoryCard } from "@/services/victoryCardService";

/* v5.7 : aperçu d'une carte dessinée (empire, profil, victoire), téléchargement,
   copie de l'image et lien de partage avec aperçu (Discord, WhatsApp…). */

export interface ShareCardSpec {
  title: string;
  /** Dessine la carte dans le canvas. */
  draw: (canvas: HTMLCanvasElement) => Promise<void>;
  fileName: string;
  /** Titre et description de l'aperçu du lien. */
  shareTitle: string;
  shareDescription: string;
  /** Page du jeu ouverte depuis le lien. */
  target: string;
}

export function ShareCardDialog({ spec, onClose }: { spec: ShareCardSpec | null; onClose: () => void }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    setReady(false);
    setLink(null);
    if (!spec) return;
    // Le canvas existe au rendu suivant (fenêtre ouverte).
    const t = setTimeout(() => {
      if (canvas.current) void spec.draw(canvas.current).then(() => setReady(true));
    }, 50);
    return () => clearTimeout(t);
  }, [spec]);

  const download = async () => {
    if (!canvas.current || !spec) return;
    const url = URL.createObjectURL(await canvasToBlob(canvas.current));
    const a = document.createElement("a");
    a.href = url;
    a.download = spec.fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const copyImage = async () => {
    if (!canvas.current) return;
    try {
      const png = await new Promise<Blob>((resolve, reject) => canvas.current!.toBlob((b) => (b ? resolve(b) : reject(new Error("Image impossible à créer."))), "image/png"));
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      toast.success("Image copiée", { description: "Colle-la directement dans Discord ou ailleurs." });
    } catch {
      toast.error("Ton navigateur ne permet pas de copier l'image : utilise Télécharger.");
    }
  };

  const share = async () => {
    if (!canvas.current || !spec) return;
    setBusy(true);
    try {
      const url = link ?? (await uploadVictoryCard(await canvasToBlob(canvas.current), spec.shareTitle, spec.shareDescription, spec.target, spec.fileName));
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
    <Dialog open={!!spec} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogTitle>{spec?.title ?? "Carte"}</DialogTitle>
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
          <Button variant="secondary" disabled={!ready} onClick={() => void copyImage()}>
            <Copy className="h-4 w-4" /> Copier l'image
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
