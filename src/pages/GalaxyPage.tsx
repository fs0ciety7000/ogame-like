import { allianceFlightFactor } from "@/game/alliances";
import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent, type WheelEvent as ReactWheelEvent } from "react";
import { Eye, Gift, LocateFixed, Minus, Plus, Recycle, Search, ShieldPlus, Sword } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/PageHeader";
import { subscribeDebrisFields, subscribeLeaderboard, type LeaderboardEntry } from "@/services/playerService";
import { debrisTotal, type DebrisField } from "@/game/debris";
import { GarrisonDialog, RecycleDialog } from "@/components/game/MissionDialogs";
import { subscribeAlliances } from "@/services/allianceService";
import { formatCoords, galaxyCoords } from "@/game/galaxy";
import { distanceBetween, FLEET_RULES, fleetProgress, mapPosition, travelSeconds } from "@/game/fleets";
import { OFFENSIVE_UNITS, findUnit } from "@/game/units";
import { getRankLabel } from "@/game/ranks";
import { formatCompact, formatDuration, timeAgo } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { usePlayerStore } from "@/store/playerStore";
import { useFleetStore } from "@/store/fleetStore";
import { SpyModal } from "@/components/game/SpyModal";
import { AttackModal } from "@/components/game/AttackModal";
import { TradeModal } from "@/components/game/TradeModal";
import { FleetsPanel } from "@/components/game/FleetsPanel";
import type { Alliance } from "@/types/game";

const SIZE = FLEET_RULES.mapSize;
const MIN_ZOOM = 1;
const MAX_ZOOM = 8;

/** Couleur stable d'une alliance (teinte dérivée de son identifiant). */
function allianceColor(id: string | undefined): string {
  if (!id) return "#7dd3fc";
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) % 360;
  return `hsl(${h} 85% 65%)`;
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
  const fleets = useFleetStore((s) => s.fleets);
  const now = useSmoothNow();
  const [spyTarget, setSpyTarget] = useState<{ uid: string; pseudo: string } | null>(null);
  const [attackTarget, setAttackTarget] = useState<{ uid: string; pseudo: string } | null>(null);
  const [tradeTarget, setTradeTarget] = useState<{ uid: string; pseudo: string } | null>(null);
  const [debrisFields, setDebrisFields] = useState<DebrisField[]>([]);
  const [recycleField, setRecycleField] = useState<DebrisField | null>(null);
  const [garrisonTarget, setGarrisonTarget] = useState<{ uid: string; pseudo: string } | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);

  useEffect(() => subscribeLeaderboard(setPlayers), []);
  useEffect(() => subscribeAlliances(setAlliances), []);
  useEffect(() => subscribeDebrisFields(setDebrisFields), []);

  const allianceById = useMemo(() => new Map(alliances.map((a) => [a.id, a])), [alliances]);
  const blips = useMemo(() => players.map((p) => ({ ...p, pos: mapPosition(p.uid), coords: galaxyCoords(p.uid) })), [players]);
  const myPos = uid ? mapPosition(uid) : null;

  useEffect(() => {
    if (uid && !selectedUid && blips.some((b) => b.uid === uid)) setSelectedUid(uid);
  }, [uid, selectedUid, blips]);

  const query = search.trim().toLowerCase();
  const selected = blips.find((b) => b.uid === selectedUid) ?? null;

  /* ---------- zoom / déplacement ---------- */

  const toMapPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return { x: SIZE / 2, y: SIZE / 2 };
    const rect = svg.getBoundingClientRect();
    return { x: ((clientX - rect.left) / rect.width) * SIZE, y: ((clientY - rect.top) / rect.height) * SIZE };
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
    const svg = svgRef.current;
    if (!d || !svg) return;
    const rect = svg.getBoundingClientRect();
    const dx = ((e.clientX - d.x) / rect.width) * SIZE;
    const dy = ((e.clientY - d.y) / rect.height) * SIZE;
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
    if (!uid || !me || !selected || selected.uid === uid) return null;
    const speeds = OFFENSIVE_UNITS.filter((id) => (me.units[id]?.count ?? 0) > 0).map(
      (id) => (findUnit(id)?.stats.vitesse ?? 1) * Math.max(1, me.units[id]?.level ?? 1),
    );
    if (speeds.length === 0) return { distance: distanceBetween(uid, selected.uid), fast: null, slow: null };
    const distance = distanceBetween(uid, selected.uid);
    const f = allianceFlightFactor(me.allianceResearch);
    return { distance, fast: travelSeconds(distance, Math.max(...speeds), f), slow: travelSeconds(distance, Math.max(1, Math.min(...speeds)), f) };
  }, [uid, me, selected]);

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
        <div className="relative flex-1">
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
        <Card className="tactical-grid relative aspect-square max-h-[75vh] w-full overflow-hidden p-0 xl:aspect-auto xl:h-[680px]">
          <svg
            ref={svgRef}
            viewBox={`0 0 ${SIZE} ${SIZE}`}
            preserveAspectRatio="xMidYMid slice"
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

              {/* Trajectoires des flottes */}
              {visibleFleets.map((f) => {
                const from = mapPosition(f.ownerUid);
                const to = mapPosition(f.targetUid);
                const hostile = f.targetUid === uid && f.ownerUid !== uid && (f.mission ?? "attack") === "attack";
                const color = hostile ? "var(--color-danger-glow)" : f.mission === "recycle" ? "var(--color-mint-glow)" : "var(--color-cyan-glow)";
                const t = fleetProgress(f, now);
                const px = from.x + (to.x - from.x) * t;
                const py = from.y + (to.y - from.y) * t;
                const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI + (f.status === "returning" ? 180 : 0);
                return (
                  <g key={f.id}>
                    <line
                      x1={from.x}
                      y1={from.y}
                      x2={to.x}
                      y2={to.y}
                      stroke={color}
                      strokeOpacity={0.45}
                      strokeWidth={0.35 / k}
                      strokeDasharray={`${1.5 / k} ${1 / k}`}
                      className="fleet-route"
                    />
                    <g transform={`translate(${px} ${py}) rotate(${angle})`} style={{ transition: "transform 0.25s linear" }}>
                      <circle r={2.2 / k} fill={color} opacity={0.18} />
                      <path d={`M ${1.6 / k} 0 L ${-1 / k} ${-0.9 / k} L ${-0.4 / k} 0 L ${-1 / k} ${0.9 / k} Z`} fill={color} />
                    </g>
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

              {/* Empires */}
              {blips.map((b) => {
                const isSelf = b.uid === uid;
                const isSelected = b.uid === selectedUid;
                const dim = query.length > 0 && !b.pseudo.toLowerCase().includes(query);
                const color = isSelf ? "var(--color-gold-glow)" : allianceColor(b.allianceId);
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
                    <circle r={(isSelf ? 1.3 : 1) / k} fill={color} style={{ filter: `drop-shadow(0 0 ${1.5 / k}px ${color})` }} />
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
              <span className="h-1.5 w-1.5 bg-mint-glow" /> Débris
            </span>
          </div>
          <p className="pointer-events-none absolute right-2 top-2 rounded-md bg-space-950/70 px-2 py-1 text-[10px] text-slate-500">
            Molette : zoom · glisser : déplacer · ×{k.toFixed(1)}
          </p>
        </Card>

        <div className="flex flex-col gap-4">
          {selected && (
            <Card className="flex flex-col gap-3 p-4">
              <div>
                <p className="text-sm font-medium text-slate-100">
                  {selected.pseudo}
                  {selected.uid === uid && <span className="ml-2 text-xs text-gold-glow">(toi)</span>}
                </p>
                {selected.activeTitle && <p className="text-xs text-gold-glow">🏆 {selected.activeTitle}</p>}
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
                    ♻️ Débris : 🔩 {formatCompact(selectedDebris.scrap)} · ⚡ {formatCompact(selectedDebris.energy)}
                  </span>
                  <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setRecycleField(selectedDebris)}>
                    <Recycle className="mr-1 h-3.5 w-3.5" /> Recycler
                  </Button>
                </div>
              )}
              {selected.uid !== uid && (
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
                  <Button variant="outline" size="icon" title="Envoyer des ressources" onClick={() => setTradeTarget({ uid: selected.uid, pseudo: selected.pseudo })}>
                    <Gift className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </Card>
          )}
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
