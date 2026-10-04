import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { FlaskConical, Flag, Search, User } from "lucide-react";
import { subscribeAlliances } from "@/services/allianceService";
import { BUILDINGS } from "@/game/buildings";
import { UNITS } from "@/game/units";
import { TECHNOLOGIES } from "@/game/technologies";
import { assetUrl } from "@/lib/assets";
import type { Alliance } from "@/types/game";
import { ALL_NAV_ITEMS } from "@/components/layout/NavBar";
import { useCasinoVisible } from "@/services/casinoService";
import { closeCommandPalette, useCommandPaletteStore } from "@/store/commandPaletteStore";
import { subscribeLeaderboard, type LeaderboardEntry } from "@/services/playerService";
import { getRankLabel } from "@/game/ranks";
import { cn } from "@/lib/utils";

interface PaletteItem {
  key: string;
  label: string;
  sublabel?: string;
  icon: ReactNode;
  run: () => void;
}

export function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const casinoVisible = useCasinoVisible();

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const offPlayers = subscribeLeaderboard(setPlayers);
    const offAlliances = subscribeAlliances(setAlliances);
    return () => {
      offPlayers();
      offAlliances();
    };
  }, [open]);

  const items = useMemo<PaletteItem[]>(() => {
    const q = query.trim().toLowerCase();

    const navItems: PaletteItem[] = ALL_NAV_ITEMS.filter((n) => (casinoVisible || n.to !== "/game/casino") && (!q || n.label.toLowerCase().includes(q))).map(
      (n) => ({
        key: `nav-${n.to}`,
        label: n.label,
        sublabel: "Navigation",
        icon: <n.icon className="h-4 w-4 text-cyan-glow" />,
        run: () => navigate(n.to),
      }),
    );

    const playerItems: PaletteItem[] = q
      ? players
          .filter((p) => p.pseudo.toLowerCase().includes(q))
          .slice(0, 6)
          .map((p) => ({
            key: `player-${p.uid}`,
            label: p.pseudo,
            sublabel: getRankLabel(p.xp),
            icon: <User className="h-4 w-4 text-mint-glow" />,
            run: () => navigate(`/game/joueurs?fiche=${p.uid}`),
          }))
      : [];

    // v3.8 : alliances, unités, bâtiments et technologies.
    const thumb = (src?: string) => (src ? <img src={assetUrl(src)} alt="" className="h-5 w-5 object-contain" /> : null);
    const match = (label: string) => q.length >= 2 && label.toLowerCase().includes(q);
    const allianceItems: PaletteItem[] = alliances
      .filter((a) => match(a.name) || match(a.tag))
      .slice(0, 4)
      .map((a) => ({
        key: `alliance-${a.id}`,
        label: `[${a.tag}] ${a.name}`,
        sublabel: `Alliance · ${a.members.length} membre${a.members.length > 1 ? "s" : ""}`,
        icon: <Flag className="h-4 w-4 text-gold-glow" />,
        run: () => navigate("/game/joueurs?mode=alliances"),
      }));
    const unitItems: PaletteItem[] = UNITS.filter((u) => match(u.name))
      .slice(0, 4)
      .map((u) => ({ key: `unit-${u.id}`, label: u.name, sublabel: "Unité", icon: thumb(u.image) ?? <User className="h-4 w-4" />, run: () => navigate("/game/unites") }));
    const buildingItems: PaletteItem[] = BUILDINGS.filter((b) => match(b.name))
      .slice(0, 4)
      .map((b) => ({ key: `building-${b.id}`, label: b.name, sublabel: "Bâtiment", icon: thumb(b.image) ?? <User className="h-4 w-4" />, run: () => navigate("/game/batiments") }));
    const techItems: PaletteItem[] = TECHNOLOGIES.filter((t) => match(t.nom))
      .slice(0, 4)
      .map((t) => ({ key: `tech-${t.id}`, label: t.nom, sublabel: "Technologie", icon: <FlaskConical className="h-4 w-4 text-violet-glow" />, run: () => navigate("/game/labo") }));

    return [...navItems, ...playerItems, ...allianceItems, ...unitItems, ...buildingItems, ...techItems];
  }, [query, players, alliances, navigate, casinoVisible]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const activate = (item: PaletteItem) => {
    item.run();
    closeCommandPalette();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(v) => !v && closeCommandPalette()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <DialogPrimitive.Content
          className="!fixed left-1/2 top-24 z-[100] w-[92vw] max-w-lg -translate-x-1/2 glass-panel overflow-hidden rounded-2xl shadow-2xl focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Palette de commandes</DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Page, joueur, alliance, unité, bâtiment, technologie…"
              className="w-full bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.min(items.length - 1, i + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveIndex((i) => Math.max(0, i - 1));
                } else if (e.key === "Enter" && items[activeIndex]) {
                  e.preventDefault();
                  activate(items[activeIndex]);
                }
              }}
            />
            <kbd className="hud-eyebrow hud-cut-sm shrink-0 border border-white/10 px-1.5 py-0.5 text-slate-500">
              Esc
            </kbd>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">Aucun résultat.</p>
            ) : (
              items.map((item, i) => (
                <button
                  key={item.key}
                  onClick={() => activate(item)}
                  onMouseEnter={() => setActiveIndex(i)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    i === activeIndex ? "bg-cyan-glow/10 text-cyan-glow" : "text-slate-300",
                  )}
                >
                  {item.icon}
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.sublabel && <span className="hud-eyebrow shrink-0 text-slate-600">{item.sublabel}</span>}
                </button>
              ))
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
