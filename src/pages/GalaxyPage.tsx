import { targetsPlayer } from "@/game/fleets";
import { TitleBadge } from "@/components/game/TitleBadge";
import { allianceFlightFactor } from "@/game/alliances";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { Eye, Gift, Grid3x3, LocateFixed, Minus, Plus, Recycle, Search, ShieldPlus, Sword } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { subscribeDebrisFields, subscribeLeaderboard, type LeaderboardEntry } from "@/services/playerService";
import { debrisTotal, type DebrisField } from "@/game/debris";
import { GarrisonDialog, RecycleDialog } from "@/components/game/MissionDialogs";
import { subscribeAlliances } from "@/services/allianceService";
import { formatCoords, galaxyCoords } from "@/game/galaxy";
import { attackTravelSeconds, distanceBetween, FLEET_RULES, fleetProgress, mapPosition } from "@/game/fleets";
import { OFFENSIVE_UNITS, findUnit } from "@/game/units";
import { getRankLabel } from "@/game/ranks";
import { formatClock, formatCompact, formatDuration, timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { ThreatGauge } from "@/components/game/ThreatGauge";
import { isHostile } from "@/components/game/FleetsPanel";
import { useFleetStore } from "@/store/fleetStore";
import { SpyModal } from "@/components/game/SpyModal";
import { AttackModal } from "@/components/game/AttackModal";
import { TradeModal } from "@/components/game/TradeModal";
import { FleetsPanel } from "@/components/game/FleetsPanel";
import type { Alliance } from "@/types/game";
import { GameIcon, ResourceIcon } from "@/components/ui/game-icon";
import { StaffBadge } from "@/components/ui/staff-badge";
import { NpcBadge, VacationBadge } from "@/components/ui/npc-badge";
import { ParallaxStars } from "@/components/fx/ParallaxStars";
import { isWarlordUid } from "@/game/warlords";
import { FLEET_MISSION_LABELS, type Fleet } from "@/game/fleets";
import { SECTOR_COUNT, sectorLabel, sectorOf, TERRITORY_RULES, territoryBonus } from "@/game/territories";
import { allianceHue, useTerritories } from "@/services/territoryService";

const SIZE = FLEET_RULES.mapSize;
/** Marge autour de la carte : les empires posés au bord restent entiers. */
const MARGIN = 4;
const VIEW = SIZE + 2 * MARGIN;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

/** Couleur stable d'une alliance (teinte dérivée de son identifiant). */
function allianceColor(id: string | undefined): string {
  if (!id) return "#7dd3fc";
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `hsl(${h} 85% 65%)`;
}

/** v4.4 : couleur d'une route de flotte. Seigneur de guerre en ambre, flotte
 *  qui arrive sur moi en rouge, les miennes en cyan (recyclage en vert). */
function routeStyle(f: Fleet, uid: string | undefined): { color: string; label: string; hostile: boolean } {
  const incoming = targetsPlayer(f, uid) && f.ownerUid !== uid;
  if (isWarlordUid(f.ownerUid)) return { color: "var(--color-ember-glow)", label: incoming ? "Seigneur de guerre · sur toi" : "Seigneur de guerre", hostile: incoming };
  if (incoming && ((f.mission ?? "attack") === "attack" || f.mission === "pirate" || f.mission === "spy")) return { color: "var(--color-danger-glow)", label: "Flotte hostile", hostile: true };
  if (f.ownerUid !== uid) return { color: "var(--color-violet-glow)", label: "Flotte alliée", hostile: false };
  if (f.mission === "recycle") return { color: "var(--color-mint-glow)", label: "Ta flotte", hostile: false };
  return { color: "var(--color-cyan-glow)", label: "Ta flotte", hostile: false };
}

interface View {
  k: number;
  x: number;
  y: number;
}

function clampView(v: View): View {
  const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.k));
  // La carte (0 → SIZE, mise à l'échelle k) doit continuer à couvrir la vue.
  const min = SIZE - SIZE * k;
  return { k, x: Math.min(0, Math.max(min, v.x)), y: Math.min(0, Math.max(min, v.y)) };
}

/** Temps d'animation fluide des flottes (rafraîchi 4 fois par seconde). */
function useSmoothNow(): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function GalaxyPage() {
  const [players, setPlayers] = useState<LeaderboardEntry[]>([]);
  const [alliances, setAlliances] = useState<Alliance[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [view, setView] = useState<View>({ k: 1, x: 0, y: 0 });
  const uid = useAuthStore((s) => s.user?.uid);
  const me = usePlayerStore((s) => s.player);
  // v5.1 : territoires d'alliance (secteurs teintés), affichables ou non.
  const territories = useTerritories();
  const [showSectors, setShowSectors] = useState(true);
  const fleets = useFleetStore((s) => s.fleets);
  const now = useSmoothNow();
  const [spyTarget, setSpyTarget] = useState<{ uid: string; pseudo: string } | null>(null);
  const [attackTarget, setAttackTarget] = useState<{ uid: string; pseudo: string } | null>(null);
  const [tradeTarget, setTradeTarget] = useState<{ uid: string; pseudo: string; allianceId?: string | null; createdAtMs?: number } | null>(null);
  const [debrisFields, setDebrisFields] = useState<DebrisField[]>([]);
  const [recycleField, setRecycleField] = useState<DebrisField | null>(null);
  const [garrisonTarget, setGarrisonTarget] = useState<{ uid: string; pseudo: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  // v4.4 : flotte survolée (info-bulle avec l'heure d'arrivée).
  const [hoverFleet, setHoverFleet] = useState<{ id: string; x: number; y: number } | null>(null);

  useEffect(() => subscribeLeaderboard(setPlayers), []);
  useEffect(() => subscribeAlliances(setAlliances), []);
  useEffect(() => subscribeDebrisFields(setDebrisFields), []);

  const allianceById = useMemo(() => new Map(alliances.map((a) => [a.id, a])), [alliances]);
  const blips = useMemo(() => players.map((p) => ({ ...p, pos: mapPosition(p.uid), coords: galaxyCoords(p.uid) })), [players]);
  // v3.5 : colonies, rattachées à leur empire.
  const colonyBlips = useMemo(
    () =>
      players.flatMap((p) =>
        (p.planets ?? []).map((c) => ({ ...p, uid: c.id, ownerUid: p.uid, colonyName: c.name, ownerPos: mapPosition(p.uid), pos: mapPosition(c.id), coords: galaxyCoords(c.id) })),
      ),
    [players],
  );
  const myPos = uid ? mapPosition(uid) : null;

  useEffect(() => {
    if (uid && !selectedUid && blips.some((b) => b.uid === uid)) setSelectedUid(uid);
  }, [uid, selectedUid, blips]);

  const query = search.trim().toLowerCase();
  const selectedColony = colonyBlips.find((b) => b.uid === selectedUid) ?? null;
  const selected = blips.find((b) => b.uid === selectedUid) ?? selectedColony;
  const selectedIsMine = !!selected && (selected.uid === uid || selectedColony?.ownerUid === uid);

  /* ---------- zoom / déplacement ---------- */

  // La carte carrée est entièrement affichée (« meet ») et centrée dans le
  // cadre, quelle que soit sa forme : un pixel vaut 1 / scale unité.
  const mapScale = () => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rect = svg.getBoundingClientRect();
    const scale = Math.min(rect.width, rect.height) / VIEW;
    return { rect, scale, ox: (rect.width - VIEW * scale) / 2, oy: (rect.height - VIEW * scale) / 2 };
  };

  const toMapPoint = (clientX: number, clientY: number) => {
    const m = mapScale();
    if (!m) return { x: SIZE / 2, y: SIZE / 2 };
    return { x: (clientX - m.rect.left - m.ox) / m.scale - MARGIN, y: (clientY - m.rect.top - m.oy) / m.scale - MARGIN };
  };

  const zoomAt = (factor: number, cx = SIZE / 2, cy = SIZE / 2) => {
    setView((v) => {
      const k = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.k * factor));
      const ratio = k / v.k;
      return clampView({ k, x: cx - (cx - v.x) * ratio, y: cy - (cy - v.y) * ratio });
    });
  };

  const centerOn = (pos: { x: number; y: number }, k = Math.max(view.k, 2.5)) => {
    setView(clampView({ k, x: SIZE / 2 - pos.x * k, y: SIZE / 2 - pos.y * k }));
  };

  const onWheel = (e: ReactWheelEvent) => {
    const p = toMapPoint(e.clientX, e.clientY);
    zoomAt(e.deltaY < 0 ? 1.2 : 1 / 1.2, p.x, p.y);
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    drag.current = { x: e.clientX, y: e.clientY, view, moved: false };
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current;
    const m = mapScale();
    if (!d || !m) return;
    const dx = (e.clientX - d.x) / m.scale;
    const dy = (e.clientY - d.y) / m.scale;
    if (Math.abs(e.clientX - d.x) + Math.abs(e.clientY - d.y) > 4) d.moved = true;
    setView(clampView({ ...d.view, x: d.view.x + dx, y: d.view.y + dy }));
  };
  const onPointerUp = () => {
    setTimeout(() => (drag.current = null), 0);
  };
  const clickPlayer = (targetUid: string) => {
    if (drag.current?.moved) return;
    setSelectedUid(targetUid);
  };

  // Empêche la page de défiler pendant le zoom à la molette sur la carte.
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const stop = (e: WheelEvent) => e.preventDefault();
    svg.addEventListener("wheel", stop, { passive: false });
    return () => svg.removeEventListener("wheel", stop);
  }, []);

  /* ---------- temps de vol vers la cible sélectionnée ---------- */

  const travel = useMemo(() => {
    if (!uid || !me || !selected || selectedIsMine) return null;
    const speeds = OFFENSIVE_UNITS.filter((id) => (me.units[id]?.count ?? 0) > 0).map(
      (id) => (findUnit(id)?.stats.vitesse ?? 1) * Math.max(1, me.units[id]?.level ?? 1),
    );
    if (speeds.length === 0) return { distance: distanceBetween(uid, selected.uid), fast: null, slow: null };
    const distance = distanceBetween(uid, selected.uid);
    const f = allianceFlightFactor(me.allianceResearch, me.techLevels);
    return { distance, fast: attackTravelSeconds(distance, Math.max(...speeds), f), slow: attackTravelSeconds(distance, Math.max(1, Math.min(...speeds)), f) };
  }, [uid, me, selected, selectedIsMine]);

  const k = view.k;
  const activeFleets = fleets.filter((f) => f.status === "outbound" || f.status === "returning");
  const visibleFleets = activeFleets.filter((f) => f.mission !== "patrol");
  const patrolling = activeFleets.some((f) => f.mission === "patrol" && f.ownerUid === uid);
  const liveDebris = debrisFields.filter((d) => d.expiresAtMs > now && debrisTotal(d) > 0);
  const selectedDebris = selected ? liveDebris.find((d) => d.id === selected.uid) ?? null : null;
  const debrisByDistance = uid ? [...liveDebris].sort((a, b) => distanceBetween(uid, a.id) - distanceBetween(uid, b.id)) : liveDebris;
  const shownAlliances = alliances.filter((a) => players.some((p) => p.allianceId === a.id)).slice(0, 8);

  return (
    <div className="flex flex-col gap-4">
      <PageHeader eyebrow="Cosmic Empires / Cartographie" title="Carte galactique" description="Repère les empires voisins, suis tes flottes et lance une opération." />

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              const q = e.target.value.trim().toLowerCase();
              const found = q && blips.find((b) => b.pseudo.toLowerCase().includes(q));
              if (found) {
                setSelectedUid(found.uid);
                centerOn(found.pos);
              }
            }}
            placeholder="Rechercher un empire…"
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="icon" title="Zoomer" onClick={() => zoomAt(1.4)}>
            <Plus className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" title="Dézoomer" onClick={() => zoomAt(1 / 1.4)}>
            <Minus className="h-4 w-4" />
          </Button>
          <Button variant={showSectors ? "secondary" : "outline"} size="icon" title={showSectors ? "Masquer les territoires" : "Afficher les territoires"} onClick={() => setShowSectors((v) => !v)}>
            <Grid3x3 className="h-4 w-4" />
          </Button>
          {myPos && (
            <Button
              variant="outline"
              onClick={() => {
                if (uid) setSelectedUid(uid);
                centerOn(myPos);
              }}
            >
              <LocateFixed className="h-4 w-4" /> Me localiser
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <div ref={cardRef} className="glass-panel tactical-grid relative aspect-square max-h-[75vh] w-full overflow-hidden p-0 xl:aspect-auto xl:h-[680px]">
          <ParallaxStars pan={{ x: view.x * 6, y: view.y * 6 }} />
          <svg
            ref={svgRef}
            viewBox={`${-MARGIN} ${-MARGIN} ${VIEW} ${VIEW}`}
            preserveAspectRatio="xMidYMid meet"
            className="h-full w-full cursor-grab touch-none select-none active:cursor-grabbing"
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            role="img"
            aria-label="Carte de la galaxie"
          >
            <g transform={`translate(${view.x} ${view.y}) scale(${k})`}>
              {/* v5.1 : secteurs et territoires d'alliance (teinte de l'alliance qui tient le secteur). */}
              {showSectors &&
                Array.from({ length: SECTOR_COUNT }, (_, id) => {
                  const w = FLEET_RULES.mapSize / TERRITORY_RULES.cols;
                  const h = FLEET_RULES.mapSize / TERRITORY_RULES.rows;
                  const x = (id % TERRITORY_RULES.cols) * w;
                  const y = Math.floor(id / TERRITORY_RULES.cols) * h;
                  const sector = territories?.sectors[id];
                  const hue = sector?.allianceId ? allianceHue(sector.allianceId) : null;
                  const mine = !!sector?.allianceId && sector.allianceId === me?.allianceId;
                  return (
                    <g key={`sector-${id}`} className="pointer-events-none">
                      <rect
                        x={x}
                        y={y}
                        width={w}
                        height={h}
                        fill={hue !== null ? `hsla(${hue}, 80%, 55%, ${mine ? 0.14 : 0.08})` : "transparent"}
                        stroke={mine ? "var(--color-mint-glow)" : "rgba(148,163,184,0.18)"}
                        strokeWidth={(mine ? 0.45 : 0.2) / k}
                        strokeDasharray={mine ? undefined : `${1.2 / k} ${0.8 / k}`}
                      />
                      <text x={x + 1.2 / k} y={y + 3 / k} fontSize={2 / k} fill="rgba(148,163,184,0.5)" className="font-mono">
                        {sectorLabel(id)}
                      </text>
                      {sector?.allianceId && (
                        <text x={x + w / 2} y={y + h / 2} textAnchor="middle" fontSize={Math.min(5, 3.2 / k)} fontWeight={700} fill={`hsla(${hue}, 85%, 70%, 0.55)`} className="font-display">
                          [{sector.tag}]
                        </text>
                      )}
                    </g>
                  );
                })}
              {/* Anneaux de distance autour de ma base */}
              {myPos &&
                [25, 50, 75].map((r) => (
                  <g key={r}>
                    <circle cx={myPos.x} cy={myPos.y} r={r} fill="none" stroke="rgba(255,209,102,0.12)" strokeWidth={0.25 / k} strokeDasharray={`${1 / k} ${1 / k}`} />
                    <text x={myPos.x + r} y={myPos.y - 0.6 / k} fontSize={1.6 / k} fill="rgba(255,209,102,0.45)">
                      {r}
                    </text>
                  </g>
                ))}

              {/* Trajectoires des flottes (v4.4 : couleur selon le camp, trajet restant animé) */}
              {visibleFleets.map((f) => {
                const from = mapPosition(f.ownerUid);
                const to = mapPosition(f.targetUid);
                const style = routeStyle(f, uid ?? undefined);
                const t = fleetProgress(f, now);
                const px = from.x + (to.x - from.x) * t;
                const py = from.y + (to.y - from.y) * t;
                const returning = f.status === "returning";
                const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI + (returning ? 180 : 0);
                // Reste à parcourir : vers la cible à l'aller, vers la base au retour.
                const end = returning ? from : to;
                const hover = (e: ReactPointerEvent) => {
                  const box = cardRef.current?.getBoundingClientRect();
                  if (box) setHoverFleet({ id: f.id, x: e.clientX - box.left, y: e.clientY - box.top });
                };
                return (
                  <g key={f.id} onPointerEnter={hover} onPointerMove={hover} onPointerLeave={() => setHoverFleet(null)}>
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke={style.color} strokeOpacity={0.14} strokeWidth={0.3 / k} />
                    <line
                      x1={px}
                      y1={py}
                      x2={end.x}
                      y2={end.y}
                      stroke={style.color}
                      strokeOpacity={style.hostile ? 0.95 : 0.7}
                      strokeWidth={(style.hostile ? 0.75 : 0.4) / k}
                      strokeDasharray={`${1.5 / k} ${1 / k}`}
                      className="fleet-route"
                      style={{ animationDuration: `${1.2 / Math.max(1, k * 0.6)}s` }}
                    />
                    <line x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="transparent" strokeWidth={2.4 / k} className="cursor-help" />
                    {/* v4.9.3 : flotte hostile plus visible — cible encerclée, compte à rebours au-dessus de la flotte. */}
                    {style.hostile && !returning && (
                      <g transform={`translate(${to.x} ${to.y})`} className="pointer-events-none">
                        <circle r={5 / k} fill="none" stroke={style.color} strokeWidth={0.35 / k} strokeOpacity={0.8} className="animate-ping [transform-box:fill-box] [transform-origin:center]" />
                        <circle r={3.6 / k} fill="none" stroke={style.color} strokeWidth={0.3 / k} strokeDasharray={`${0.8 / k} ${0.5 / k}`} />
                      </g>
                    )}
                    <g transform={`translate(${px} ${py}) rotate(${angle}) scale(${style.hostile ? 1.5 : 1})`} style={{ transition: "transform 0.25s linear" }} className="cursor-help">
                      <circle r={3 / k} fill={style.color} opacity={style.hostile ? 0.22 : 0.12} className={style.hostile ? "animate-pulse" : undefined} />
                      <circle r={1.8 / k} fill={style.color} opacity={0.22} />
                      <path d={`M ${1.6 / k} 0 L ${-1 / k} ${-0.9 / k} L ${-0.4 / k} 0 L ${-1 / k} ${0.9 / k} Z`} fill={style.color} />
                    </g>
                    {style.hostile && !returning && (
                      <text x={px} y={py - 4.2 / k} textAnchor="middle" fontSize={2.2 / k} fontWeight={700} fill={style.color} className="pointer-events-none font-mono" style={{ paintOrder: "stroke", stroke: "rgba(5,8,22,0.85)", strokeWidth: 0.5 / k }}>
                        {formatClock(Math.max(0, Math.floor((f.arriveAtMs - now) / 1000)))}
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Patrouille : orbite autour de ma base */}
              {myPos && patrolling && (
                <circle cx={myPos.x} cy={myPos.y} r={4 / k} fill="none" stroke="var(--color-cyan-glow)" strokeOpacity={0.6} strokeWidth={0.3 / k} strokeDasharray={`${0.8 / k} ${0.6 / k}`} className="fleet-route" />
              )}

              {/* Champs de débris */}
              {liveDebris.map((d) => {
                const pos = mapPosition(d.id);
                const r = Math.min(2.4, 0.9 + Math.log10(1 + debrisTotal(d)) * 0.3) / k;
                return (
                  <g key={`debris-${d.id}`} transform={`translate(${pos.x + 1.8 / k} ${pos.y + 1.8 / k})`} className="cursor-pointer" onClick={() => clickPlayer(d.id)}>
                    <title>{`Débris : ${formatCompact(d.scrap)} ferraille, ${formatCompact(d.energy)} énergie`}</title>
                    {[0, 72, 144, 216, 288].map((a) => (
                      <rect
                        key={a}
                        x={Math.cos((a * Math.PI) / 180) * r - 0.25 / k}
                        y={Math.sin((a * Math.PI) / 180) * r - 0.25 / k}
                        width={0.5 / k}
                        height={0.5 / k}
                        fill="var(--color-mint-glow)"
                        opacity={0.8}
                        transform={`rotate(${a} ${Math.cos((a * Math.PI) / 180) * r} ${Math.sin((a * Math.PI) / 180) * r})`}
                      />
                    ))}
                  </g>
                );
              })}

              {/* Colonies (v3.5) : petit carré relié à la planète mère */}
              {colonyBlips.map((c) => {
                const mine = c.ownerUid === uid;
                const color = mine ? "var(--color-gold-glow)" : allianceColor(c.allianceId);
                const isSelected = c.uid === selectedUid;
                const dim = query.length > 0 && !c.pseudo.toLowerCase().includes(query) && !c.colonyName.toLowerCase().includes(query);
                return (
                  <g key={c.uid} opacity={dim ? 0.15 : 0.9}>
                    <line x1={c.ownerPos.x} y1={c.ownerPos.y} x2={c.pos.x} y2={c.pos.y} stroke={color} strokeOpacity={0.12} strokeWidth={0.2 / k} />
                    <g transform={`translate(${c.pos.x} ${c.pos.y})`} className="cursor-pointer" onClick={() => clickPlayer(c.uid)}>
                      <circle r={2.6 / k} fill="transparent" />
                      {isSelected && <circle r={1.8 / k} fill="none" stroke="white" strokeOpacity={0.9} strokeWidth={0.3 / k} />}
                      <rect x={-0.7 / k} y={-0.7 / k} width={1.4 / k} height={1.4 / k} fill={color} transform="rotate(45)" />
                      {(k >= 2.4 || isSelected) && (
                        <text y={-1.9 / k} textAnchor="middle" fontSize={1.5 / k} fill="#94a3b8">
                          {c.colonyName}
                        </text>
                      )}
                    </g>
                  </g>
                );
              })}

              {/* Empires */}
              {blips.map((b) => {
                const isSelf = b.uid === uid;
                const isSelected = b.uid === selectedUid;
                const dim = query.length > 0 && !b.pseudo.toLowerCase().includes(query);
                const color = isSelf ? "var(--color-gold-glow)" : b.npc ? "var(--color-ember-glow)" : allianceColor(b.allianceId);
                const showLabel = k >= 1.8 || isSelf || isSelected || (query && !dim);
                const tag = b.allianceId ? allianceById.get(b.allianceId)?.tag : undefined;
                return (
                  <g
                    key={b.uid}
                    transform={`translate(${b.pos.x} ${b.pos.y})`}
                    opacity={dim ? 0.2 : 1}
                    className="cursor-pointer"
                    onClick={() => clickPlayer(b.uid)}
                  >
                    <circle r={3 / k} fill="transparent" />
                    {isSelf && <circle r={2.4 / k} fill="none" stroke={color} strokeOpacity={0.5} strokeWidth={0.3 / k} className="animate-pulse-slow" />}
                    {isSelected && <circle r={2 / k} fill="none" stroke="white" strokeOpacity={0.9} strokeWidth={0.3 / k} />}
                    {b.npc ? (
                      // v4.2 : seigneur de guerre, en losange.
                      <rect x={-1.1 / k} y={-1.1 / k} width={2.2 / k} height={2.2 / k} transform="rotate(45)" fill={color} style={{ filter: `drop-shadow(0 0 ${1.8 / k}px ${color})` }} />
                    ) : (
                      <circle r={(isSelf ? 1.3 : 1) / k} fill={color} style={{ filter: `drop-shadow(0 0 ${1.5 / k}px ${color})` }} />
                    )}
                    {showLabel && (
                      <text y={-2.2 / k} textAnchor="middle" fontSize={1.8 / k} fill={isSelf ? "var(--color-gold-glow)" : "#cbd5e1"}>
                        {tag ? `[${tag}] ` : ""}
                        {b.pseudo}
                      </text>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>

          {hoverFleet &&
            (() => {
              const f = visibleFleets.find((x) => x.id === hoverFleet.id);
              if (!f) return null;
              const style = routeStyle(f, uid ?? undefined);
              const eta = f.status === "returning" ? f.returnAtMs : f.arriveAtMs;
              return (
                <div
                  className="pointer-events-none absolute z-10 max-w-[16rem] border bg-space-950/90 px-2.5 py-1.5 text-xs shadow-lg backdrop-blur"
                  style={{ left: Math.min(hoverFleet.x + 14, (cardRef.current?.clientWidth ?? 400) - 260), top: hoverFleet.y + 14, borderColor: style.color }}
                >
                  <p className="font-mono text-[10px] uppercase tracking-[0.16em]" style={{ color: style.color }}>
                    {style.label} · {FLEET_MISSION_LABELS[f.mission ?? "attack"] ?? f.mission}
                  </p>
                  <p className="text-slate-200">
                    {f.status === "returning" ? `${f.targetPseudo} → ${f.ownerPseudo}` : `${f.ownerPseudo} → ${f.targetPseudo}`}
                  </p>
                  {isHostile(f, uid ?? undefined) && <ThreatGauge fleet={f} compact className="mt-1 w-56" />}
                  {eta && (
                    <p className="font-mono text-slate-400">
                      {f.status === "returning" ? "Retour" : "Arrivée"} à {new Date(eta).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })} · dans {formatDuration(Math.max(0, (eta - now) / 1000))}
                    </p>
                  )}
                </div>
              );
            })()}

          {blips.length === 0 && (
            <p className="pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-slate-500">Aucun empire détecté pour l'instant.</p>
          )}
          <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-x-3 gap-y-1 rounded-md bg-space-950/70 px-2 py-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-gold-glow" /> Toi
            </span>
            {shownAlliances.map((a) => (
              <span key={a.id} className="flex items-center gap-1">
                <span className="h-2 w-2 rounded-full" style={{ background: allianceColor(a.id) }} /> [{a.tag}] {a.name}
              </span>
            ))}
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-3 bg-cyan-glow" /> Ta flotte
            </span>
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-3 bg-danger-glow" /> Flotte hostile
            </span>
            <span className="flex items-center gap-1">
              <span className="h-0.5 w-3 bg-ember-glow" /> Seigneur de guerre
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 bg-mint-glow" /> Débris
            </span>
            <span className="flex items-center gap-1">
              <span className="h-1.5 w-1.5 rotate-45 bg-slate-300" /> Colonie
            </span>
          </div>
          <p className="pointer-events-none absolute right-2 top-2 rounded-md bg-space-950/70 px-2 py-1 text-[10px] text-slate-500">
            Molette : zoom · glisser : déplacer · ×{k.toFixed(1)}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {selected && (
            <Card className="flex flex-col gap-3 p-4">
              <div>
                <p className="text-sm font-medium text-slate-100">
                  {selectedColony ? (
                    <>
                      {selectedColony.colonyName} <span className="text-xs text-slate-400">· colonie de {selectedColony.pseudo}</span>
                    </>
                  ) : (
                    <>
                      {selected.pseudo} <StaffBadge uid={selected.uid} className="ml-1 align-middle" />
                      {"npc" in selected && selected.npc && <NpcBadge className="ml-1 align-middle" />}
                      {"vacationUntilMs" in selected && (selected.vacationUntilMs ?? 0) > Date.now() && <VacationBadge untilMs={selected.vacationUntilMs!} className="ml-1 align-middle" />}
                    </>
                  )}
                  {selectedIsMine && <span className="ml-2 text-xs text-gold-glow">(toi)</span>}
                </p>
                {selected.activeTitle && <TitleBadge label={selected.activeTitle} size="xs" className="mt-0.5" />}
                <p className="tabular-mono text-xs text-slate-500">
                  Secteur {formatCoords(selected.coords)} · {getRankLabel(selected.xp)}
                  {selected.allianceId && allianceById.get(selected.allianceId) && ` · [${allianceById.get(selected.allianceId)!.tag}]`}
                </p>
              </div>
              {travel && (
                <div className="rounded-lg bg-black/20 px-3 py-2 text-xs text-slate-400">
                  <p>
                    Distance : <strong className="text-slate-200">{Math.round(travel.distance)}</strong>
                  </p>
                  {travel.fast !== null ? (
                    <p>
                      Temps de vol : <strong className="text-slate-200">{formatDuration(travel.fast)}</strong>
                      {travel.slow !== travel.fast && <> à {formatDuration(travel.slow!)} selon tes vaisseaux</>}
                    </p>
                  ) : (
                    <p>Aucun vaisseau d'attaque disponible.</p>
                  )}
                </div>
              )}
              {selectedDebris && (
                <div className="flex items-center gap-2 rounded-lg border border-mint-glow/30 bg-mint-glow/5 px-3 py-2 text-xs text-slate-300">
                  <span className="flex-1">
                    <GameIcon name="recycle" /> Débris : <ResourceIcon id="scrap" /> {formatCompact(selectedDebris.scrap)} · <ResourceIcon id="energy" /> {formatCompact(selectedDebris.energy)}
                  </span>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setRecycleField(selectedDebris)}>
                    <Recycle className="mr-1 h-3.5 w-3.5" /> Recycler
                  </Button>
                </div>
              )}
              {selectedColony && !selectedIsMine && (
                <div className="flex gap-2">
                  {me?.allianceId && selected.allianceId === me.allianceId ? (
                    <p className="flex-1 text-xs text-slate-500">Colonie d'un allié.</p>
                  ) : (
                    <Button variant="danger" size="sm" className="flex-1" onClick={() => setAttackTarget({ uid: selected.uid, pseudo: `${selectedColony.colonyName} (${selected.pseudo})` })}>
                      <Sword className="mr-1 h-4 w-4" /> Attaquer la colonie
                    </Button>
                  )}
                  <Button variant="outline" size="icon" title="Espionner la colonie" onClick={() => setSpyTarget({ uid: selected.uid, pseudo: `${selectedColony.colonyName} (${selected.pseudo})` })}>
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {!selectedColony && selected.uid !== uid && (
                <div className="flex gap-2">
                  {me?.allianceId && selected.allianceId === me.allianceId ? (
                    <Button size="sm" className="flex-1" onClick={() => setGarrisonTarget({ uid: selected.uid, pseudo: selected.pseudo })}>
                      <ShieldPlus className="mr-1 h-4 w-4" /> Renforcer
                    </Button>
                  ) : (
                    <Button variant="danger" size="sm" className="flex-1" onClick={() => setAttackTarget({ uid: selected.uid, pseudo: selected.pseudo })}>
                      <Sword className="mr-1 h-4 w-4" /> Attaquer
                    </Button>
                  )}
                  <Button variant="outline" size="icon" title="Espionner" onClick={() => setSpyTarget({ uid: selected.uid, pseudo: selected.pseudo })}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  {!("npc" in selected && selected.npc) && (
                    <Button variant="outline" size="icon" title="Envoyer des ressources" onClick={() => setTradeTarget({ uid: selected.uid, pseudo: selected.pseudo, allianceId: "allianceId" in selected ? (selected.allianceId ?? null) : undefined, createdAtMs: "createdAtMs" in selected ? selected.createdAtMs : undefined })}>
                      <Gift className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              )}
            </Card>
          )}
          <TerritoryCard />
          <FleetsPanel />
          {debrisByDistance.length > 0 && (
            <Card className="flex flex-col gap-2 p-4">
              <h3 className="flex items-center gap-2 font-display text-sm text-white">
                <Recycle className="h-4 w-4 text-mint-glow" /> Champs de débris
              </h3>
              {debrisByDistance.slice(0, 6).map((d) => (
                <div key={d.id} className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    className="flex-1 truncate text-left text-slate-300 hover:text-white"
                    onClick={() => {
                      setSelectedUid(d.id);
                      centerOn(mapPosition(d.id));
                    }}
                  >
                    {d.locationPseudo} · {formatCompact(debrisTotal(d))}
                    <span className="ml-1 text-slate-500">({timeAgo(d.updatedAtMs)})</span>
                  </button>
                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setRecycleField(d)}>
                    Recycler
                  </Button>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      <SpyModal target={spyTarget} onClose={() => setSpyTarget(null)} />
      <AttackModal target={attackTarget} onClose={() => setAttackTarget(null)} />
      <TradeModal target={tradeTarget} onClose={() => setTradeTarget(null)} />
      <RecycleDialog field={recycleField} onClose={() => setRecycleField(null)} />
      <GarrisonDialog target={garrisonTarget} onClose={() => setGarrisonTarget(null)} />
    </div>
  );
}

/** v5.1 : territoires — secteurs tenus par ton alliance, ton bonus et le secteur de tes planètes. */
function TerritoryCard() {
  const me = usePlayerStore((s) => s.player);
  const map = useTerritories();
  if (!me) return null;
  const now = Date.now();
  const bonus = territoryBonus(me.territory, now);
  const home = sectorOf(me.uid);
  const held = map?.sectors.filter((x) => x.allianceId && x.allianceId === me.allianceId) ?? [];
  const homeSector = map?.sectors[home];
  return (
    <Card className="flex flex-col gap-2 p-4">
      <h3 className="flex items-center gap-2 font-display text-sm text-white">
        <Grid3x3 className="h-4 w-4 text-mint-glow" /> Territoires
        {bonus > 0 && <span className="ml-auto font-mono text-xs text-mint-glow">+{Math.round(bonus * 100)} % production</span>}
      </h3>
      <p className="text-xs text-slate-400">
        Ta planète est en secteur <b className="text-slate-200">{sectorLabel(home)}</b>
        {homeSector?.allianceId ? (
          <>
            , tenu par <b className="text-slate-200">[{homeSector.tag}]</b> ({formatCompact(homeSector.levels)} niveaux).
          </>
        ) : (
          ", que personne ne tient."
        )}
      </p>
      {me.allianceId ? (
        <p className="text-xs text-slate-400">
          Ton alliance tient {held.length} secteur{held.length > 1 ? "s" : ""}
          {held.length > 0 && ` : ${held.map((x) => sectorLabel(x.id)).join(", ")}`}.
        </p>
      ) : (
        <p className="text-xs text-slate-500">Rejoins une alliance pour conquérir des secteurs.</p>
      )}
      <p className="text-[11px] leading-relaxed text-slate-500">
        Un secteur appartient à l'alliance qui y cumule le plus de niveaux de bâtiments (au moins {TERRITORY_RULES.minLevels}), planètes mères et colonies comprises. +{Math.round(TERRITORY_RULES.bonusPerSector * 100)} % de production par secteur tenu où tu es présent, +{Math.round(TERRITORY_RULES.maxBonus * 100)} % au plus. Recalcul toutes les heures.
      </p>
    </Card>
  );
}
