import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Keyboard } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { ignoreShortcut, SHORTCUTS } from "@/lib/shortcuts";
import { fullscreenSupported, toggleFullscreen } from "@/lib/fullscreen";

function Key({ k }: { k: string }) {
  return <kbd className="hud-cut-sm inline-grid min-w-7 place-items-center border border-cyan-glow/40 bg-cyan-glow/[0.08] px-1.5 py-0.5 font-mono text-[11px] uppercase text-cyan-glow">{k}</kbd>;
}

/** v5.11 : raccourcis clavier globaux et leur aide (« ? »). */
export function ShortcutsDialog() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "?" && !(e.target instanceof HTMLInputElement) && !(e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (ignoreShortcut(e)) return;
      // 5.21.1 : F bascule le plein écran.
      if (e.key.toLowerCase() === "f" && fullscreenSupported()) {
        e.preventDefault();
        void toggleFullscreen();
        return;
      }
      const s = SHORTCUTS.find((x) => x.key === e.key.toLowerCase());
      if (s) {
        e.preventDefault();
        navigate(s.to);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogTitle className="flex items-center gap-2">
          <Keyboard className="h-4 w-4 text-cyan-glow" /> Raccourcis clavier
        </DialogTitle>
        <DialogDescription>Une seule touche, n'importe où dans le jeu (hors saisie de texte).</DialogDescription>
        <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {SHORTCUTS.map((s) => (
            <p key={s.key} className="flex items-center gap-3 text-sm text-slate-300">
              <Key k={s.key} /> {s.label}
            </p>
          ))}
          <p className="flex items-center gap-3 text-sm text-slate-300">
            <span className="flex gap-1">
              <Key k="Ctrl" />
              <Key k="K" />
            </span>
            Recherche globale
          </p>
          <p className="flex items-center gap-3 text-sm text-slate-300">
            <Key k="1-6" /> Actions rapides (vue cockpit)
          </p>
          <p className="flex items-center gap-3 text-sm text-slate-300">
            <Key k="f" /> Plein écran
          </p>
          <p className="flex items-center gap-3 text-sm text-slate-300">
            <Key k="?" /> Cette aide
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
