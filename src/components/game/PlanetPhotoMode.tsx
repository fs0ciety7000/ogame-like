import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Download, Type, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { HomePlanet, type PlanetLife } from "@/components/game/HomePlanet";
import type { PlanetLook } from "@/game/planetLook";
import type { Buildings } from "@/types/game";

/* 5.16 : mode photo de la planète. Plein écran, interface masquée, cadrage
   réglable, légende facultative, puis export en PNG. Les couleurs du thème
   (variables CSS) sont figées dans l'image au moment de l'export. */

/** Remplace var(--x) par sa valeur calculée (une image SVG isolée ne connaît pas les variables du document). */
export function inlineCssVars(svg: string, resolve: (name: string) => string): string {
  let out = svg;
  for (let i = 0; i < 4 && out.includes("var(--"); i++) {
    out = out.replace(/var\((--[a-zA-Z0-9-]+)\)/g, (_, name: string) => resolve(name) || "transparent");
  }
  return out;
}

async function exportPng(svgEl: SVGSVGElement, caption: string | null, fileName: string): Promise<void> {
  const css = getComputedStyle(document.documentElement);
  const resolve = (name: string) => css.getPropertyValue(name).trim();
  const clone = svgEl.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  clone.setAttribute("width", "1000");
  clone.setAttribute("height", "1000");
  const markup = inlineCssVars(new XMLSerializer().serializeToString(clone), resolve);
  const url = URL.createObjectURL(new Blob([markup], { type: "image/svg+xml" }));
  try {
    const img = new Image();
    await new Promise<void>((ok, ko) => {
      img.onload = () => ok();
      img.onerror = () => ko(new Error("svg"));
      img.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1200;
    canvas.height = 1200;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas");
    const bg = ctx.createRadialGradient(600, 560, 40, 600, 600, 820);
    bg.addColorStop(0, resolve("--th-space-700") || "black");
    bg.addColorStop(1, resolve("--th-space-950") || "black");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1200, 1200);
    // Quelques étoiles, tirées toujours au même endroit.
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    ctx.fillStyle = resolve("--th-text-100") || "white";
    for (let i = 0; i < 140; i++) {
      ctx.globalAlpha = 0.2 + rand() * 0.6;
      ctx.fillRect(rand() * 1200, rand() * 1200, rand() < 0.1 ? 2 : 1, rand() < 0.1 ? 2 : 1);
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(img, 100, 70, 1000, 1000);
    if (caption) {
      ctx.fillStyle = resolve("--th-text-100") || "white";
      ctx.font = "600 34px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(caption, 600, 1130);
      ctx.fillStyle = resolve("--th-accent") || "white";
      ctx.font = "500 16px monospace";
      ctx.fillText("COSMIC EMPIRES", 600, 1165);
    }
    const a = document.createElement("a");
    a.download = fileName;
    a.href = canvas.toDataURL("image/png");
    a.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function PlanetPhotoMode({ buildings, life, look, caption }: { buildings: Buildings; life?: PlanetLife; look?: PlanetLook; caption: string }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [showCaption, setShowCaption] = useState(true);
  const [busy, setBusy] = useState(false);
  const stage = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const save = async () => {
    const svg = stage.current?.querySelector("svg");
    if (!svg) return;
    setBusy(true);
    try {
      await exportPng(svg, showCaption ? caption : null, "planete-cosmic-empires.png");
    } catch {
      toast.error("Export impossible sur ce navigateur.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)} title="Mode photo">
        <Camera className="h-3.5 w-3.5" /> Mode photo
      </Button>
      {open &&
        createPortal(
          <div className="planet-photo fixed inset-0 z-[70] flex flex-col items-center justify-center" role="dialog" aria-modal="true" aria-label="Mode photo de la planète">
            <div ref={stage} className="grid place-items-center" style={{ transform: `scale(${zoom})`, transition: "transform 0.25s ease-out" }}>
              <HomePlanet buildings={buildings} life={life} look={look} size={260} />
            </div>
            {showCaption && (
              <div className="pointer-events-none mt-2 text-center">
                <p className="hud-title text-2xl text-slate-100">{caption}</p>
                <p className="font-mono text-[11px] tracking-[0.3em] text-cyan-glow">COSMIC EMPIRES</p>
              </div>
            )}
            <div className="hud-cut-sm absolute bottom-5 left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 border border-white/10 bg-space-900/80 px-3 py-2">
              <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-slate-400">
                Cadrage
                <input type="range" min={0.6} max={1.6} step={0.05} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-28 accent-cyan-glow" aria-label="Cadrage" />
              </label>
              <Button size="sm" variant={showCaption ? "primary" : "secondary"} onClick={() => setShowCaption((v) => !v)} aria-pressed={showCaption}>
                <Type className="h-3.5 w-3.5" /> Légende
              </Button>
              <Button size="sm" variant="secondary" disabled={busy} onClick={() => void save()}>
                <Download className="h-3.5 w-3.5" /> PNG
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setOpen(false)} aria-label="Fermer le mode photo">
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
