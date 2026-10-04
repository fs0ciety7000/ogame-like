import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Building2, CalendarClock, Compass, FlaskConical, Globe2, Hammer, Orbit, Rocket, Send, Shield, Store, Zap, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CockpitViewport, type ViewportFleet } from "@/components/cockpit/CockpitViewport";
import { useAgenda } from "@/components/game/AgendaCard";
import { isHostile } from "@/components/game/FleetsPanel";
import { usePlayerStore } from "@/store/playerStore";
import { useFleetStore } from "@/store/fleetStore";
import { useAuthStore } from "@/store/authStore";
import { useLiveResources } from "@/hooks/useLiveResources";
import { useNowTicker } from "@/hooks/useNowTicker";
import { upcomingEvents, type TimelineEvent, type TimelineKind } from "@/game/timeline";
import { FLEET_MISSION_LABELS, fleetProgress, type Fleet } from "@/game/fleets";
import { economySnapshot } from "@/game/economy";
import { RESOURCE_LIST } from "@/game/resources";
import { BUILDINGS, effectiveBuildingLevel } from "@/game/buildings";
import { DEFENSIVE_UNITS, OFFENSIVE_UNITS } from "@/game/units";
import { unitStat } from "@/game/combat";
import { getRankIcon, getRankLabel } from "@/game/ranks";
import { onVacation } from "@/game/vacation";
import { cn, formatClock, formatCompact } from "@/lib/utils";

/* =====================================================
   Vue cockpit (accueil) : verrière au centre, écran multifonction à
   droite, console d'actions en bas. Même données que l'accueil classique,
   rangées comme un poste de commande.
===================================================== */

const QUICK: { key: string; label: string; to: string; icon: LucideIcon }[] = [
  { key: "1", label: "Bâtir", to: "/game/batiments", icon: Building2 },
  { key: "2", label: "Flotte", to: "/game/unites", icon: Rocket },
  { key: "3", label: "Labo", to: "/game/labo", icon: FlaskConical },
  { key: "4", label: "Galaxie", to: "/game/galaxie", icon: Orbit },
  { key: "5", label: "Marché", to: "/game/marche", icon: Store },
  { key: "6", label: "Missions", to: "/game/missions", icon: Compass },
];

const QUEUE_ICON: Record<TimelineKind, { icon: LucideIcon; color: string }> = {
  building: { icon: Hammer, color: "var(--color-gold-glow)" },
  research: { icon: FlaskConical, color: "var(--color-violet-glow)" },
  units: { icon: Rocket, color: "var(--color-ember-glow)" },
  mission: { icon: Compass, color: "var(--color-mint-glow)" },
  colony: { icon: Globe2, color: "var(--color-violet-glow)" },
  fleet: { icon: Send, color: "var(--color-cyan-glow)" },
  hostile: { icon: AlertTriangle, color: "var(--color-danger-glow)" },
};

const BOOT_KEY = "cosmic-empires:cockpit-boot";

function eta(ms: number, now: number) {
  return formatClock(Math.max(0, Math.floor((ms - now) / 1000)));
}

function fleetTitle(f: Fleet, mine: boolean): string {
  if (!mine) return f.mission === "pirate" ? `Raid : ${f.ownerPseudo}` : `Attaque de ${f.ownerPseudo}`;
  return FLEET_MISSION_LABELS[f.mission ?? "attack"] ?? "Flotte";
}

function fleetEnd(f: Fleet): number {
  if (f.status === "outbound") return f.arriveAtMs;
  if (f.status === "stationed") return f.stationedUntilMs ?? f.arriveAtMs;
  return f.returnAtMs ?? f.arriveAtMs;
}

/** Avancée d'un chantier, quand son départ est connu. */
function queueProgress(e: TimelineEvent, starts: Record<string, number | undefined>, now: number): number | null {
  const start = starts[e.id];
  if (!start || e.endTime <= start) return null;
  return Math.min(1, Math.max(0, (now - start) / (e.endTime - start)));
}

function Seg({ value, color }: { value: number; color: string }) {
  const on = Math.round(Math.min(1, Math.max(0, value)) * 12);
  return (
    <div className="ck-seg" style={{ ["--seg" as string]: color }}>
      {Array.from({ length: 12 }, (_, i) => (
        <i key={i} className={i < on ? "on" : undefined} />
      ))}
    </div>
  );
}

function Panel({ title, code, children, className }: { title: string; code?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("glass-panel min-w-0", className)}>
      <header className="relative z-[2] flex items-center justify-between gap-2 border-b border-[var(--th-edge)] px-3.5 pb-2 pt-2.5">
        <h2 className="hud-title text-[12.5px] text-slate-100">{title}</h2>
        {code && <span className="whitespace-nowrap font-mono text-[9.5px] tracking-[0.16em] text-slate-500">{code}</span>}
      </header>
      <div className="relative z-[2] p-3.5">{children}</div>
    </section>
  );
}

export function CockpitHub() {
  useNowTicker();
  const navigate = useNavigate();
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const fleets = useFleetStore((s) => s.fleets);
  const uid = useAuthStore((s) => s.user?.uid);
  const resources = useLiveResources(player);
  const now = Date.now();
  const agenda = useAgenda(now, 7);
  const [tab, setTab] = useState<"fleets" | "queue" | "alerts">("fleets");
  // Écran tactile sans clavier : pas de rappel des touches 1 à 6.
  const [coarse] = useState(() => typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches);
  const [boot, setBoot] = useState(() => {
    try {
      return sessionStorage.getItem(BOOT_KEY) !== "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!boot) return;
    try {
      sessionStorage.setItem(BOOT_KEY, "1");
    } catch {
      /* rejouée au prochain passage */
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const id = window.setTimeout(() => setBoot(false), reduce ? 300 : 2000);
    return () => window.clearTimeout(id);
  }, [boot]);

  // Raccourcis 1 à 6 de la console (hors saisie).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      const q = QUICK.find((x) => x.key === e.key);
      if (q) navigate(q.to);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  const mine = useMemo(() => fleets.filter((f) => f.ownerUid === uid && f.status !== "done").sort((a, b) => fleetEnd(a) - fleetEnd(b)), [fleets, uid]);
  const hostile = useMemo(() => fleets.filter((f) => isHostile(f, uid)).sort((a, b) => a.arriveAtMs - b.arriveAtMs), [fleets, uid]);
  const hostileKey = hostile.map((f) => f.id).join(",");
  const [pulse, setPulse] = useState(0);
  const [seenHostile, setSeenHostile] = useState(hostileKey);
  if (hostileKey !== seenHostile) {
    setSeenHostile(hostileKey);
    if (hostile.length > 0) setPulse((p) => p + 1);
  }

  if (!player) return null;

  const friendlyView: ViewportFleet[] = mine.map((f) => ({ id: f.id, label: fleetTitle(f, true), progress: fleetProgress(f, now) }));
  const hostileView: ViewportFleet[] = hostile.map((f) => ({ id: f.id, label: `${f.ownerPseudo}`, progress: fleetProgress(f, now) }));

  const events = upcomingEvents(queues, now, fleets, uid, player);
  const works = events.filter((e) => e.kind !== "fleet" && e.kind !== "hostile");
  const starts: Record<string, number | undefined> = {};
  for (const [id, u] of Object.entries(queues?.buildingUpgrades ?? {})) if (u) starts[`b:${id}`] = u.startedAtMs;
  for (const r of queues?.activeResearches ?? []) starts[`r:${r.id}`] = r.startedAtMs;

  const economy = economySnapshot(resources ? { ...player, resources } : player, now);
  const common = RESOURCE_LIST.filter((r) => r.rarity === "common");
  const fills = common.map((r) => ({ r, fill: Number.isFinite(economy.capacity) && economy.capacity > 0 && resources ? resources[r.id] / economy.capacity : 0 }));
  const storageMax = fills.reduce((m, f) => Math.max(m, f.fill), 0);
  const energyNet = economy.net.energy ?? 0;

  const totalLevels = BUILDINGS.reduce((s, b) => s + effectiveBuildingLevel(player.buildings, b.id), 0);
  const maxLevels = BUILDINGS.reduce((s, b) => s + b.maxLevel, 0);
  const dev = maxLevels > 0 ? totalLevels / maxLevels : 0;
  const power = (ids: string[]) => ids.reduce((s, id) => s + unitStat(player.units, player.techLevels, id, "attack") * (player.units[id]?.count ?? 0), 0);
  const attack = power(OFFENSIVE_UNITS);
  const defense = power(DEFENSIVE_UNITS);
  const vacation = onVacation(player, now);

  const alerts: { id: string; tone: string; icon: LucideIcon; title: string; sub: string; to: string; urgent?: boolean }[] = [
    ...hostile.map((f) => ({ id: f.id, tone: "var(--color-danger-glow)", icon: AlertTriangle, title: fleetTitle(f, false), sub: `Impact dans ${eta(f.arriveAtMs, now)}`, to: f.mission === "pirate" ? "/game/menaces" : "/game/galaxie", urgent: true })),
    ...(economy.outage ? [{ id: "outage", tone: "var(--color-danger-glow)", icon: Zap, title: "Panne d'énergie", sub: "Production à 50 %", to: "/game/batiments" }] : []),
    ...fills
      .filter((f) => f.fill >= 0.85)
      .map((f) => ({ id: `full:${f.r.id}`, tone: f.fill >= 1 ? "var(--color-ember-glow)" : "var(--color-gold-glow)", icon: Zap, title: f.fill >= 1 ? `${f.r.name} : entrepôt plein` : `${f.r.name} presque plein`, sub: `${Math.round(f.fill * 100)} % de l'entrepôt`, to: "/game/batiments" })),
    ...agenda
      .filter((a) => !a.done && (a.endMs ?? a.startMs) > now)
      .slice(0, 3)
      .map((a) => ({ id: `ag:${a.id}`, tone: "var(--color-gold-glow)", icon: CalendarClock, title: `${a.emoji ? `${a.emoji} ` : ""}${a.title}`, sub: a.startMs > now ? `Dans ${eta(a.startMs, now)}` : a.endMs ? `En cours · fin dans ${eta(a.endMs, now)}` : "Maintenant", to: a.link })),
  ];
  const urgentCount = alerts.filter((a) => a.urgent).length;
  const firstHostile = hostile[0];

  return (
    <div className="ck-stage">
      {boot && (
        <div className="ck-boot" role="status" aria-live="polite">
          {["Alimentation principale ........ OK", vacation ? "Mode vacances ........ actif" : "Boucliers ........ en ligne", `Flottes en vol ........ ${mine.length}`, hostile.length > 0 ? `Contacts hostiles ........ ${hostile.length}` : "Contacts hostiles ........ aucun", `Bienvenue à bord, ${player.pseudo}`].map((l, i, a) => (
            <p key={l} style={{ animationDelay: `${i * 0.28}s`, color: i === a.length - 1 ? "var(--color-slate-100)" : undefined }}>
              &gt; {l}
            </p>
          ))}
        </div>
      )}
      <div className="ck">
        {/* Identité */}
        <div className="glass-panel ck-top flex flex-wrap items-center justify-between gap-3 px-3 py-2">
          <Link to="/game/profil" className="relative z-[2] flex min-w-0 items-center gap-3">
            <img src={getRankIcon(player.xp)} alt="" className="h-10 w-10 shrink-0 object-contain" />
            <span className="min-w-0">
              <span className="hud-title block truncate text-sm text-slate-100">{player.pseudo}</span>
              <span className="block truncate font-mono text-[10px] tracking-[0.12em] text-slate-400">
                {getRankLabel(player.xp).toUpperCase()} // {(player.colonies?.length ?? 0) + 1} PLANÈTE{(player.colonies?.length ?? 0) > 0 ? "S" : ""}
              </span>
            </span>
          </Link>
          <div className="relative z-[2] flex flex-wrap items-center gap-2">
            <span className="ck-tag" style={{ ["--c" as string]: "var(--color-mint-glow)" }}>
              <i className="ck-dot" /> Liaison stable
            </span>
            {vacation && <span className="ck-tag" style={{ ["--c" as string]: "var(--color-gold-glow)" }}>Vacances</span>}
            {hostile.length > 0 && (
              <span className="ck-tag" style={{ ["--c" as string]: "var(--color-danger-glow)" }}>
                <i className="ck-dot animate-pulse-alert" /> {hostile.length} hostile{hostile.length > 1 ? "s" : ""}
              </span>
            )}
            <span className="font-mono text-xs tracking-[0.1em] text-slate-200">{new Date(now).toISOString().slice(11, 19)} UTC</span>
          </div>
        </div>

        {/* Verrière */}
        <div className="ck-view">
          <CockpitViewport friendly={friendlyView} hostile={hostileView} pulse={pulse} />
          <div className="ck-vig" aria-hidden />
          <div className="ck-hud left-7 top-5 grid gap-0.5">
            <span>Verrière // ant.</span>
            <span className="ck-hud-big">DÉV. {Math.round(dev * 100)} %</span>
            <span>
              Flottes en vol <b>{mine.length}</b>
            </span>
            <span>
              Prochaine fin <b>{works[0] ? eta(works[0].endTime, now) : "—"}</b>
            </span>
          </div>
          <div className="ck-hud right-7 top-5 hidden justify-items-end gap-1.5 sm:grid">
            <span className="ck-tag" style={{ ["--c" as string]: "var(--color-mint-glow)" }}>
              <Shield className="h-3 w-3" /> Défense {formatCompact(defense)}
            </span>
            <span className="ck-tag" style={{ ["--c" as string]: "var(--color-violet-glow)" }}>
              <Rocket className="h-3 w-3" /> Attaque {formatCompact(attack)}
            </span>
          </div>
          <div className="ck-target" aria-hidden>
            <i />
            <i />
            <i />
            <i />
            <div className="ck-ring" />
          </div>
          <div className="glass-panel ck-target-card">
            <div className="relative z-[2]">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-500">Cible verrouillée // planète mère</p>
              <p className="hud-title text-[17px] text-slate-100">{player.pseudo}</p>
            </div>
            <div className="relative z-[2] grid grid-cols-3 gap-2">
              {[
                ["Bâtiments", `${totalLevels}`],
                ["Colonies", `${player.colonies?.length ?? 0}`],
                ["Victoires", `${player.victories}`],
              ].map(([k, v]) => (
                <div key={k} className="font-mono text-[9px] uppercase tracking-[0.14em] text-slate-500">
                  {k}
                  <b className="block text-sm tracking-normal text-slate-100">{v}</b>
                </div>
              ))}
            </div>
          </div>
          {firstHostile && (
            <Link to={firstHostile.mission === "pirate" ? "/game/menaces" : "/game/galaxie"} className="ck-threat">
              <span className="ck-glyph" style={{ ["--c" as string]: "var(--color-danger-glow)" }}>
                <AlertTriangle className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <b>Flotte hostile détectée</b>
                <span className="block truncate text-[11.5px] text-slate-300">
                  {fleetTitle(firstHostile, false)}
                  {hostile.length > 1 ? ` · +${hostile.length - 1}` : ""}
                </span>
              </span>
              <span className="ck-threat-eta">{eta(firstHostile.arriveAtMs, now)}</span>
            </Link>
          )}
        </div>

        {/* Écran multifonction */}
        <aside className="glass-panel ck-mfd">
          <div className="ck-tabs" role="tablist" aria-label="Écran multifonction">
            {(
              [
                ["fleets", "Flottes", mine.length],
                ["queue", "File", works.length],
                ["alerts", "Alertes", alerts.length],
              ] as const
            ).map(([id, label, n]) => (
              <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => setTab(id)}>
                {label}
                {n > 0 && <span className={cn("ck-badge", id === "alerts" && urgentCount > 0 && "ck-badge-hot")}>{n}</span>}
              </button>
            ))}
          </div>
          <div className="ck-pane" role="tabpanel" key={tab}>
            {tab === "fleets" &&
              (mine.length === 0 ? (
                <p className="text-sm text-slate-400">Aucune flotte en vol.</p>
              ) : (
                mine.slice(0, 6).map((f) => {
                  const back = f.status === "returning";
                  return (
                    <Link key={f.id} to="/game/galaxie" className="ck-item">
                      <span className="ck-glyph" style={{ ["--c" as string]: back ? "var(--color-mint-glow)" : "var(--color-cyan-glow)" }}>
                        <Send className={cn("h-3.5 w-3.5", back && "-scale-x-100")} />
                      </span>
                      <span className="min-w-0">
                        <span className="ck-item-t">{fleetTitle(f, true)}</span>
                        <span className="ck-item-s">
                          {back ? "Retour ←" : f.status === "stationed" ? "Sur place ·" : "→"} {f.targetPseudo}
                        </span>
                      </span>
                      <span className="ck-eta" style={{ color: back ? "var(--color-mint-glow)" : undefined }}>
                        {eta(fleetEnd(f), now)}
                      </span>
                    </Link>
                  );
                })
              ))}
            {tab === "fleets" && hostile.slice(0, 3).map((f) => (
              <Link key={f.id} to={f.mission === "pirate" ? "/game/menaces" : "/game/galaxie"} className="ck-item ck-item-hostile">
                <span className="ck-glyph" style={{ ["--c" as string]: "var(--color-danger-glow)" }}>
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">
                  <span className="ck-item-t">{fleetTitle(f, false)}</span>
                  <span className="ck-item-s">Hostile → {player.pseudo}</span>
                </span>
                <span className="ck-eta">{eta(f.arriveAtMs, now)}</span>
              </Link>
            ))}
            {tab === "fleets" && (
              <Button asChild variant="primary" size="sm" className="mt-1 justify-self-start">
                <Link to="/game/galaxie">Envoyer une flotte</Link>
              </Button>
            )}
            {tab === "queue" &&
              (works.length === 0 ? (
                <p className="text-sm text-slate-400">Tous les chantiers sont à l'arrêt.</p>
              ) : (
                works.slice(0, 6).map((e) => {
                  const k = QUEUE_ICON[e.kind];
                  const p = queueProgress(e, starts, now);
                  return (
                    <Link key={e.id} to={e.to} className="ck-item" style={{ gridTemplateColumns: "auto minmax(0,1fr)" }}>
                      <span className="ck-glyph" style={{ ["--c" as string]: k.color }}>
                        <k.icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="ck-item-t">{e.label}</span>
                          <span className="ck-eta">{eta(e.endTime, now)}</span>
                        </span>
                        <span className="ck-bar mt-1.5">
                          <span style={{ width: `${Math.round((p ?? 1) * 100)}%`, opacity: p === null ? 0.35 : 1 }} />
                        </span>
                      </span>
                    </Link>
                  );
                })
              ))}
            {tab === "alerts" &&
              (alerts.length === 0 ? (
                <p className="text-sm text-slate-400">Rien à signaler, commandant.</p>
              ) : (
                alerts.slice(0, 7).map((a) => (
                  <Link key={a.id} to={a.to} className={cn("ck-item", a.urgent && "ck-item-hostile")}>
                    <span className="ck-glyph" style={{ ["--c" as string]: a.tone }}>
                      <a.icon className="h-3.5 w-3.5" />
                    </span>
                    <span className="min-w-0">
                      <span className="ck-item-t">{a.title}</span>
                      <span className="ck-item-s">{a.sub}</span>
                    </span>
                    {a.urgent ? <span className="ck-tag" style={{ ["--c" as string]: "var(--color-danger-glow)" }}>Urgent</span> : <span />}
                  </Link>
                ))
              ))}
          </div>
        </aside>

        {/* Console */}
        <div className="ck-con">
          <Panel title="Actions rapides" code={coarse ? undefined : "[ TOUCHES 1-6 ]"}>
            <div className="grid grid-cols-3 gap-2">
              {QUICK.map((q) => (
                <Link key={q.key} to={q.to} className="ck-qbtn">
                  <q.icon className="h-5 w-5 text-cyan-glow" />
                  {q.label}
                  {!coarse && <small>[{q.key}]</small>}
                </Link>
              ))}
            </div>
          </Panel>
          <Panel title="Chantiers en cours" code={`[ ${works.length} ACTIF${works.length > 1 ? "S" : ""} ]`}>
            {works.length === 0 ? (
              <p className="text-sm text-slate-400">
                Rien en cours. Lance une <Link to="/game/batiments" className="text-cyan-glow hover:underline">construction</Link> ou une{" "}
                <Link to="/game/labo" className="text-cyan-glow hover:underline">recherche</Link>.
              </p>
            ) : (
              <div className="grid gap-2.5">
                {works.slice(0, 3).map((e) => {
                  const p = queueProgress(e, starts, now);
                  return (
                    <Link key={e.id} to={e.to} className="block">
                      <span className="ck-statrow">
                        <span className="truncate">{e.label}</span>
                        <b className="text-cyan-glow">{eta(e.endTime, now)}</b>
                      </span>
                      <span className={cn("ck-bar ck-bar-striped", e.kind === "units" && "ck-bar-hot")}>
                        <span style={{ width: `${Math.round((p ?? 1) * 100)}%`, opacity: p === null ? 0.35 : 1 }} />
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </Panel>
          <Panel title="Statut du vaisseau" code="[ RADAR ]">
            <div className="flex items-center gap-4">
              <div className="ck-radar" aria-label={`Radar : ${mine.length} flotte(s) amie(s), ${hostile.length} hostile(s)`}>
                <div className="ck-sweep" />
                {mine.slice(0, 5).map((f, i) => (
                  <i key={f.id} className="ck-blip" style={{ left: `${28 + ((i * 37) % 60)}%`, top: `${24 + ((i * 53) % 55)}%` }} />
                ))}
                {hostile.slice(0, 3).map((f, i) => (
                  <i key={f.id} className="ck-blip ck-blip-hostile" style={{ left: `${70 - i * 18}%`, top: `${14 + i * 12 + (1 - fleetProgress(f, now)) * 10}%` }} />
                ))}
              </div>
              <div className="grid min-w-0 flex-1 gap-2">
                <div>
                  <span className="ck-statrow">
                    Développement <b>{Math.round(dev * 100)} %</b>
                  </span>
                  <Seg value={dev} color="var(--color-mint-glow)" />
                </div>
                <div>
                  <span className="ck-statrow">
                    Entrepôt <b>{Math.round(storageMax * 100)} %</b>
                  </span>
                  <Seg value={storageMax} color={storageMax >= 1 ? "var(--color-ember-glow)" : storageMax >= 0.85 ? "var(--color-gold-glow)" : "var(--color-cyan-glow)"} />
                </div>
                <div>
                  <span className="ck-statrow">
                    Énergie <b className={energyNet < 0 ? "text-danger-glow" : undefined}>{energyNet >= 0 ? "+" : ""}{formatCompact(Math.round(energyNet))}/s</b>
                  </span>
                  <Seg value={economy.outage ? 0.15 : energyNet >= 0 ? 1 : 0.5} color={economy.outage ? "var(--color-danger-glow)" : "var(--color-cyan-glow)"} />
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
