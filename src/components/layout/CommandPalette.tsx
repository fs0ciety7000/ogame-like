import { playerBuildingDiscount } from "@/game/bonuses";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { ArrowUpCircle, CornerDownRight, FlaskConical, Flag, Gift, Hammer, Search, User, Zap } from "lucide-react";
import { matchPaletteTabs } from "@/lib/paletteTabs";
import { subscribeAlliances } from "@/services/allianceService";
import { BUILDINGS } from "@/game/buildings";
import { UNITS } from "@/game/units";
import { TECHNOLOGIES } from "@/game/technologies";
import { assetUrl } from "@/lib/assets";
import type { Alliance } from "@/types/game";
import { ALL_NAV_ITEMS, useHardHiddenRoutes, useNavUnlock } from "@/components/layout/NavBar";
import { navCondition } from "@/game/navUnlock";
import { closeCommandPalette, useCommandPaletteStore } from "@/store/commandPaletteStore";
import { subscribeLeaderboard, type LeaderboardEntry } from "@/services/playerService";
import { getRankLabel } from "@/game/ranks";
import { cn, formatNumber } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";
import { claimAllRewards, claimStreak, enqueueUnitBuild, GameActionError, startBuildingUpgrade, startResearch } from "@/services/playerService";
import { applyBuildingDiscount, getBuildingUpgradeCost } from "@/game/buildings";
import type { BuildingId } from "@/types/game";
import { canAffordAll } from "@/game/resources";

interface PaletteItem {
  key: string;
  label: string;
  sublabel?: string;
  icon: ReactNode;
  run: () => void;
  /** 6.14.75 (DP-L2) : page pas encore ouverte (grisée, avec sa condition) ; la choisir l'ouvre. */
  muted?: boolean;
}

export function CommandPalette() {
  const open = useCommandPaletteStore((s) => s.open);
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  // 6.14.75 (DP-L2, Q153) : une page pas encore ouverte reste trouvable, grisée avec sa condition ; la choisir l'ouvre.
  const hidden = useHardHiddenRoutes();
  const closed = useNavUnlock().closed;
  const player = usePlayerStore((s) => s.player);

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

    const navItems: PaletteItem[] = ALL_NAV_ITEMS.filter((n) => !hidden.has(n.to) && (!q || n.label.toLowerCase().includes(q))).map(
      (n) => ({
        key: `nav-${n.to}`,
        label: n.label,
        sublabel: closed.has(n.to) ? navCondition(n.to) : "Navigation",
        icon: <n.icon className={cn("h-4 w-4", closed.has(n.to) ? "text-slate-500" : "text-cyan-glow")} />,
        run: () => navigate(n.to),
        muted: closed.has(n.to),
      }),
    );

    // 5.26.2 : onglets des pages (« enchères », « modules », « atelier »…).
    const tabItems: PaletteItem[] = matchPaletteTabs(q, hidden).map((t) => ({
      key: `tab-${t.to}-${t.label}`,
      label: t.label,
      sublabel: `Onglet · ${t.pageLabel}`,
      icon: <CornerDownRight className="h-4 w-4 text-cyan-glow" />,
      run: () => navigate(t.to),
    }));

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

    // 5.16 : actions directes (améliorer, rechercher, construire, réclamer) ; le serveur valide tout.
    const run = (label: string, action: () => Promise<unknown>) => () => {
      void action()
        .then(() => toast.success(label))
        .catch((err) => toast.error(err instanceof GameActionError ? err.message : "Action impossible."));
    };
    const actionItems: PaletteItem[] = [];
    if (player) {
      const words = ["reclamer", "réclamer", "tout", "recompense", "récompense", "serie", "série"];
      if (!q || words.some((w) => w.startsWith(q) || q.startsWith(w))) {
        actionItems.push(
          { key: "act-claim-all", label: "Tout réclamer", sublabel: "Action", icon: <Gift className="h-4 w-4 text-gold-glow" />, run: run("Récompenses réclamées.", claimAllRewards) },
          { key: "act-streak", label: "Réclamer la série du jour", sublabel: "Action", icon: <Zap className="h-4 w-4 text-gold-glow" />, run: run("Série réclamée.", claimStreak) },
        );
      }
      for (const b of BUILDINGS.filter((x) => match(x.name)).slice(0, 3)) {
        const level = player.buildings[b.id as BuildingId]?.level ?? 0;
        if (level <= 0 || (b.maxLevel && level >= b.maxLevel)) continue;
        const cost = applyBuildingDiscount(getBuildingUpgradeCost(b, level + 1), playerBuildingDiscount(player));
        const ok = canAffordAll(player.resources, cost);
        actionItems.push({
          key: `act-up-${b.id}`,
          label: `Améliorer ${b.name} → niv. ${level + 1}`,
          sublabel: ok ? "Action" : "Ressources insuffisantes",
          icon: <ArrowUpCircle className={cn("h-4 w-4", ok ? "text-mint-glow" : "text-slate-600")} />,
          run: run(`${b.name} : amélioration lancée.`, () => startBuildingUpgrade(player.uid, b.id as BuildingId)),
        });
      }
      for (const t of TECHNOLOGIES.filter((x) => match(x.nom)).slice(0, 3)) {
        const level = player.techLevels?.[t.id] ?? 0;
        actionItems.push({
          key: `act-tech-${t.id}`,
          label: `Rechercher ${t.nom} → niv. ${level + 1}`,
          sublabel: "Action",
          icon: <FlaskConical className="h-4 w-4 text-mint-glow" />,
          run: run(`${t.nom} : recherche lancée.`, () => startResearch(player.uid, t.id)),
        });
      }
      // « 10 chasseur » : construire 10 unités.
      const qty = /^(\d{1,5})\s+(.+)$/.exec(q);
      if (qty) {
        const n = Number(qty[1]);
        for (const u of UNITS.filter((x) => x.name.toLowerCase().includes(qty[2])).slice(0, 3)) {
          if (!((player.units[u.id]?.level ?? 0) > 0)) continue;
          actionItems.push({
            key: `act-unit-${u.id}`,
            label: `Construire ${formatNumber(n)} × ${u.name}`,
            sublabel: "Action",
            icon: <Hammer className="h-4 w-4 text-mint-glow" />,
            run: run(`${formatNumber(n)} × ${u.name} en construction.`, () => enqueueUnitBuild(player.uid, u.id, n)),
          });
        }
      }
    }

    return [...actionItems, ...navItems, ...tabItems, ...playerItems, ...allianceItems, ...unitItems, ...buildingItems, ...techItems];
  }, [query, players, alliances, navigate, hidden, closed, player]);

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
          className="!fixed left-1/2 top-24 z-[100] w-[92vw] max-w-lg -translate-x-1/2 glass-panel hud-cut overflow-hidden focus:outline-none data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">Palette de commandes</DialogPrimitive.Title>
          <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
            <Search className="h-4 w-4 shrink-0 text-slate-500" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Page, joueur, action (« améliorer », « 10 chasseur », « réclamer »)…"
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
                    "hud-cut-sm flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors",
                    i === activeIndex ? "bg-cyan-glow/10 text-cyan-glow" : item.muted ? "text-slate-500" : "text-slate-300",
                  )}
                >
                  {item.icon}
                  <span className="flex-1 truncate">{item.label}</span>
                  {item.muted ? (
                    <span className="min-w-0 max-w-[55%] truncate text-[11px] text-slate-500" title={item.sublabel}>
                      {item.sublabel}
                    </span>
                  ) : (
                    item.sublabel && <span className="hud-eyebrow shrink-0 text-slate-500">{item.sublabel}</span>
                  )}
                </button>
              ))
            )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
