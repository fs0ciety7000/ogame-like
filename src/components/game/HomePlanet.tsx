import { useMemo } from "react";
import { useReducedMotion } from "framer-motion";
import { BUILDINGS, effectiveBuildingLevel, findBuilding } from "@/game/buildings";
import type { Buildings } from "@/types/game";

/* =====================================================
   Planète-siège du joueur : chaque bâtiment y laisse sa marque.
   - extracteur de ferraille → mines à la surface
   - extracteur de nanocomposants → réseau vert entre les mines
   - réacteur instable → halo orange qui pulse
   - archives fracturées → balises qui clignotent
   - atelier de réparation → drone en orbite basse
   - hangar d'attaque → vaisseaux en orbite
   - hangar de défense → bouclier
   - développement global → lumières des villes, anneau, atmosphère
===================================================== */

const VIEW = 220;
const C = VIEW / 2;
const R = 56;
const TILE = 240; // largeur d'une « tuile » de surface qui défile

/** Pseudo-aléatoire déterministe : la planète garde le même relief. */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface Blob {
  x: number;
  y: number;
  rx: number;
  ry: number;
}

function makeRelief() {
  const rand = rng(1337);
  const continents: Blob[] = Array.from({ length: 7 }, () => ({
    x: rand() * TILE,
    y: C - R * 0.8 + rand() * R * 1.6,
    rx: 12 + rand() * 18,
    ry: 6 + rand() * 11,
  }));
  // Emplacements (mines, villes) posés sur les continents.
  const spots = Array.from({ length: 60 }, (_, i) => {
    const c = continents[i % continents.length];
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * 0.8;
    return { x: c.x + Math.cos(a) * c.rx * d, y: c.y + Math.sin(a) * c.ry * d };
  });
  return { continents, spots };
}

const RELIEF = makeRelief();

function useBuildingRatios(buildings: Buildings) {
  return useMemo(() => {
    const level = (id: string) => effectiveBuildingLevel(buildings, id);
    const ratio = (id: string) => {
      const def = findBuilding(id);
      return def && def.maxLevel > 0 ? Math.min(1, level(id) / def.maxLevel) : 0;
    };
    const total = BUILDINGS.reduce((sum, b) => sum + level(b.id), 0);
    const max = BUILDINGS.reduce((sum, b) => sum + b.maxLevel, 0);
    return {
      overall: max > 0 ? Math.min(1, total / max) : 0,
      mines: ratio("extracteur_ferraille"),
      nano: ratio("extracteur_nanocomposants"),
      reactor: ratio("reacteur_instable"),
      archives: ratio("archives_fracturees"),
      repair: level("atelier_reparation") > 0,
      attackHangar: ratio("hangar_attaque"),
      defenseHangar: ratio("hangar_defense"),
    };
  }, [buildings]);
}

/** Tuile de surface (dessinée deux fois côte à côte pour défiler sans raccord). */
function Surface({ mines, nano, lights }: { mines: number; nano: number; lights: number }) {
  const minePts = RELIEF.spots.slice(0, mines);
  const nanoPts = RELIEF.spots.slice(10, 10 + nano);
  const lightPts = RELIEF.spots.slice(20, 20 + lights);
  return (
    <g>
      {RELIEF.continents.map((c, i) => (
        <ellipse key={i} cx={c.x} cy={c.y} rx={c.rx} ry={c.ry} fill="#27405a" opacity={0.9} />
      ))}
      {/* Réseau nano : chaque nœud relié à la mine la plus proche. */}
      {nanoPts.map((p, i) => {
        const target = minePts.reduce<{ x: number; y: number } | null>(
          (best, m) => (!best || Math.hypot(m.x - p.x, m.y - p.y) < Math.hypot(best.x - p.x, best.y - p.y) ? m : best),
          null,
        );
        if (!target || Math.hypot(target.x - p.x, target.y - p.y) > 40) return null;
        return <line key={`nl${i}`} x1={p.x} y1={p.y} x2={target.x} y2={target.y} stroke="var(--color-mint-glow)" strokeWidth={0.7} strokeOpacity={0.5} />;
      })}
      {nanoPts.map((p, i) => (
        <circle key={`n${i}`} cx={p.x} cy={p.y} r={1.3} fill="var(--color-mint-glow)" />
      ))}
      {minePts.map((p, i) => (
        <rect key={`m${i}`} x={p.x - 1.8} y={p.y - 1.8} width={3.6} height={3.6} rx={0.6} fill="#c9a86a" stroke="#6b5530" strokeWidth={0.5} />
      ))}
      {lightPts.map((p, i) => (
        <circle key={`l${i}`} cx={p.x} cy={p.y} r={0.9} fill="#ffe7a3" opacity={0.85} />
      ))}
    </g>
  );
}

/** Ellipse d'orbite (même plan incliné que l'anneau). */
function orbitPath(rx: number, ry: number) {
  return `M ${C - rx} ${C} a ${rx} ${ry} 0 1 0 ${rx * 2} 0 a ${rx} ${ry} 0 1 0 ${-rx * 2} 0`;
}

/** v4.0 : ce qui se passe autour de la planète en ce moment. */
export interface PlanetLife {
  /** Niveau du Labo de synthèse (0 = absent). */
  synth?: number;
  armor?: boolean;
  veil?: boolean;
  /** Officiers en poste. */
  officers?: number;
  /** Une relique légendaire est équipée. */
  legendary?: boolean;
  /** Flottes en mission / flottes hostiles en approche. */
  away?: number;
  incoming?: number;
  /** Heure locale (0-24) : position du terminateur jour/nuit. */
  hour?: number;
}

export function HomePlanet({ buildings, size = 116, life = {} }: { buildings: Buildings; size?: number; life?: PlanetLife }) {
  const r = useBuildingRatios(buildings);
  const still = useReducedMotion() ?? false;
  // Terminateur : le côté éclairé suit l'heure (midi = face au joueur).
  const sun = life.hour === undefined ? 30 : Math.round(15 + (((life.hour + 18) % 24) / 24) * 70);

  const mines = Math.ceil(r.mines * 8);
  const nano = Math.ceil(r.nano * 7);
  const lights = Math.round(r.overall * 36);
  const beacons = Math.ceil(r.archives * 3);
  const ships = Math.ceil(r.attackHangar * 6);
  const glow = 0.25 + r.overall * 0.55;
  const wrap = size * 1.9;

  const summary = [
    `Développement : ${Math.round(r.overall * 100)} %`,
    mines > 0 && `${mines} mine(s)`,
    r.reactor > 0 && "réacteur actif",
    beacons > 0 && `${beacons} balise(s) d'archives`,
    r.repair && "drone de réparation",
    ships > 0 && `${ships} vaisseau(x) en orbite`,
    r.defenseHangar > 0 && "bouclier planétaire",
    (life.synth ?? 0) > 0 && "vapeurs du Labo de synthèse",
    life.armor && "carapace réactive active",
    life.veil && "brouilleur de défense actif",
    (life.officers ?? 0) > 0 && `${life.officers} officier(s) en poste`,
    life.legendary && "relique légendaire",
    (life.away ?? 0) > 0 && `${life.away} flotte(s) en mission`,
    (life.incoming ?? 0) > 0 && `${life.incoming} flotte(s) hostile(s) en approche`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} width={wrap} height={wrap} className="shrink-0 overflow-visible" role="img" aria-label={summary}>
      <title>{summary}</title>
      <defs>
        <radialGradient id="hp-ocean" cx="35%" cy="30%" r="80%">
          <stop offset="0%" style={{ stopColor: "color-mix(in srgb, var(--color-cyan-glow) 45%, var(--color-space-600))" }} />
          <stop offset="75%" style={{ stopColor: "var(--color-space-800)" }} />
        </radialGradient>
        <radialGradient id="hp-shade" cx={`${sun}%`} cy="28%" r="85%">
          <stop offset="45%" style={{ stopColor: "#000", stopOpacity: 0 }} />
          <stop offset="100%" style={{ stopColor: "#000", stopOpacity: 0.75 }} />
        </radialGradient>
        <radialGradient id="hp-reactor">
          <stop offset="55%" style={{ stopColor: "var(--color-ember-glow)", stopOpacity: 0.9 }} />
          <stop offset="100%" style={{ stopColor: "var(--color-ember-glow)", stopOpacity: 0 }} />
        </radialGradient>
        <radialGradient id="hp-halo">
          <stop offset="40%" style={{ stopColor: "var(--color-cyan-glow)", stopOpacity: glow }} />
          <stop offset="100%" style={{ stopColor: "var(--color-cyan-glow)", stopOpacity: 0 }} />
        </radialGradient>
        <clipPath id="hp-sphere">
          <circle cx={C} cy={C} r={R} />
        </clipPath>
        <clipPath id="hp-back">
          <rect x={0} y={0} width={VIEW} height={C} />
        </clipPath>
        <clipPath id="hp-front">
          <rect x={0} y={C} width={VIEW} height={C} />
        </clipPath>
      </defs>

      {/* Halo d'atmosphère */}
      <circle cx={C} cy={C} r={R * 1.55} fill="url(#hp-halo)" />

      {/* Réacteur : halo orange qui pulse */}
      {r.reactor > 0 && (
        <circle cx={C} cy={C} r={R + 10 + r.reactor * 8} fill="url(#hp-reactor)" opacity={0.2 + r.reactor * 0.5}>
          {!still && <animate attributeName="opacity" values={`${0.15 + r.reactor * 0.3};${0.3 + r.reactor * 0.6};${0.15 + r.reactor * 0.3}`} dur="3.2s" repeatCount="indefinite" />}
        </circle>
      )}

      {/* Anneau, moitié arrière */}
      <g transform={`rotate(-14 ${C} ${C})`}>
        <ellipse cx={C} cy={C} rx={100} ry={22} fill="none" stroke="var(--color-gold-glow)" strokeOpacity={0.15 + r.overall * 0.5} strokeWidth={1.5} clipPath="url(#hp-back)" />
      </g>

      {/* Sphère */}
      <circle cx={C} cy={C} r={R} fill="url(#hp-ocean)" />
      <g clipPath="url(#hp-sphere)">
        <g>
          <g transform={`translate(${C - R} 0)`}>
            <Surface mines={mines} nano={nano} lights={lights} />
            <g transform={`translate(${TILE} 0)`}>
              <Surface mines={mines} nano={nano} lights={lights} />
            </g>
          </g>
          {!still && <animateTransform attributeName="transform" type="translate" from="0 0" to={`${-TILE} 0`} dur="70s" repeatCount="indefinite" />}
        </g>
        <circle cx={C} cy={C} r={R} fill="url(#hp-shade)" />
      </g>
      <circle cx={C} cy={C} r={R} fill="none" stroke="var(--color-cyan-glow)" strokeOpacity={0.2 + r.overall * 0.4} strokeWidth={1.2} />

      {/* Archives : balises au pôle */}
      {Array.from({ length: beacons }, (_, i) => {
        const angle = (-90 + (i - (beacons - 1) / 2) * 22) * (Math.PI / 180);
        const x = C + Math.cos(angle) * R;
        const y = C + Math.sin(angle) * R;
        const tx = C + Math.cos(angle) * (R + 7);
        const ty = C + Math.sin(angle) * (R + 7);
        return (
          <g key={`b${i}`}>
            <line x1={x} y1={y} x2={tx} y2={ty} stroke="#94a3b8" strokeWidth={0.8} />
            <circle cx={tx} cy={ty} r={1.8} fill="var(--color-cyan-glow)">
              {!still && <animate attributeName="opacity" values="0.2;1;0.2" dur="1.6s" begin={`${i * 0.5}s`} repeatCount="indefinite" />}
            </circle>
          </g>
        );
      })}

      {/* Hangar de défense : bouclier */}
      {r.defenseHangar > 0 && (
        <circle
          cx={C}
          cy={C}
          r={R + 13}
          fill="var(--color-cyan-glow)"
          fillOpacity={0.03 + r.defenseHangar * 0.06}
          stroke="var(--color-cyan-glow)"
          strokeOpacity={0.2 + r.defenseHangar * 0.5}
          strokeWidth={1}
          strokeDasharray="6 4"
        >
          {!still && <animateTransform attributeName="transform" type="rotate" from={`0 ${C} ${C}`} to={`360 ${C} ${C}`} dur="40s" repeatCount="indefinite" />}
        </circle>
      )}

      {/* Anneau, moitié avant */}
      <g transform={`rotate(-14 ${C} ${C})`}>
        <ellipse cx={C} cy={C} rx={100} ry={22} fill="none" stroke="var(--color-gold-glow)" strokeOpacity={0.15 + r.overall * 0.5} strokeWidth={1.5} clipPath="url(#hp-front)" />

        {/* Hangar d'attaque : vaisseaux en orbite */}
        {Array.from({ length: ships }, (_, i) => (
          <path key={`s${i}`} d="M 3 0 L -2.5 -2 L -1.2 0 L -2.5 2 Z" fill="var(--color-danger-glow)" transform={still ? `translate(${C - 86 + i * 12} ${C})` : undefined}>
            {!still && <animateMotion path={orbitPath(86, 30)} dur="16s" begin={`${(-16 * i) / ships}s`} rotate="auto" repeatCount="indefinite" />}
          </path>
        ))}
      </g>

      {/* v4.0 : relique légendaire, aura dorée scintillante */}
      {life.legendary && (
        <circle cx={C} cy={C} r={R + 4} fill="none" stroke="var(--color-gold-glow)" strokeWidth={2} strokeOpacity={0.35} strokeDasharray="1 7" strokeLinecap="round">
          {!still && <animateTransform attributeName="transform" type="rotate" from={`360 ${C} ${C}`} to={`0 ${C} ${C}`} dur="24s" repeatCount="indefinite" />}
          {!still && <animate attributeName="stroke-opacity" values="0.15;0.6;0.15" dur="2.6s" repeatCount="indefinite" />}
        </circle>
      )}

      {/* v4.0 : carapace réactive (bouclier hexagonal qui pulse) */}
      {life.armor && (
        <polygon
          points={Array.from({ length: 6 }, (_, i) => `${C + Math.cos((i * Math.PI) / 3) * (R + 18)},${C + Math.sin((i * Math.PI) / 3) * (R + 18)}`).join(" ")}
          fill="var(--color-cyan-glow)"
          fillOpacity={0.05}
          stroke="#e0fbff"
          strokeOpacity={0.7}
          strokeWidth={1.4}
        >
          {!still && <animate attributeName="stroke-opacity" values="0.3;0.9;0.3" dur="1.8s" repeatCount="indefinite" />}
        </polygon>
      )}

      {/* v4.0 : brouilleur de défense, scintillement vert */}
      {life.veil && (
        <circle cx={C} cy={C} r={R + 22} fill="none" stroke="var(--color-mint-glow)" strokeWidth={6} strokeOpacity={0.12} strokeDasharray="14 9 3 9">
          {!still && <animateTransform attributeName="transform" type="rotate" from={`0 ${C} ${C}`} to={`-360 ${C} ${C}`} dur="9s" repeatCount="indefinite" />}
          {!still && <animate attributeName="stroke-opacity" values="0.05;0.25;0.08;0.2;0.05" dur="3.3s" repeatCount="indefinite" />}
        </circle>
      )}

      {/* v4.0 : vapeurs violettes du Labo de synthèse */}
      {(life.synth ?? 0) > 0 &&
        Array.from({ length: Math.min(3, 1 + Math.floor((life.synth ?? 0) / 4)) }, (_, i) => (
          <circle key={`v${i}`} cx={C + 18 - i * 14} cy={C - R + 10} r={2.5} fill="#a78bfa" opacity={still ? 0.5 : 0}>
            {!still && (
              <>
                <animate attributeName="cy" values={`${C - R + 10};${C - R - 22}`} dur="4.5s" begin={`${i * 1.5}s`} repeatCount="indefinite" />
                <animate attributeName="r" values="2;6" dur="4.5s" begin={`${i * 1.5}s`} repeatCount="indefinite" />
                <animate attributeName="opacity" values="0;0.65;0" dur="4.5s" begin={`${i * 1.5}s`} repeatCount="indefinite" />
              </>
            )}
          </circle>
        ))}

      {/* v4.0 : officiers en poste, insignes dorés en orbite haute */}
      {Array.from({ length: Math.min(3, life.officers ?? 0) }, (_, i) => (
        <path key={`o${i}`} d="M -3 1.5 L 0 -1.5 L 3 1.5" fill="none" stroke="var(--color-gold-glow)" strokeWidth={1.4} strokeLinecap="round" transform={still ? `translate(${C} ${C - R - 26 + i * 6})` : undefined}>
          {!still && <animateMotion path={orbitPath(R + 26, R + 26)} dur="28s" begin={`${(-28 * i) / 3}s`} repeatCount="indefinite" />}
        </path>
      ))}

      {/* v4.0 : flottes qui partent en mission */}
      {!still &&
        Array.from({ length: Math.min(3, life.away ?? 0) }, (_, i) => (
          <path key={`a${i}`} d="M 3 0 L -2.5 -1.6 L -1.2 0 L -2.5 1.6 Z" fill="var(--color-cyan-glow)" opacity={0}>
            <animateMotion path={`M ${C} ${C} L ${C - 105 + i * 20} ${C - 90 + i * 30}`} dur="6s" begin={`${i * 2}s`} rotate="auto" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0;0.9;0.9;0" keyTimes="0;0.25;0.8;1" dur="6s" begin={`${i * 2}s`} repeatCount="indefinite" />
          </path>
        ))}

      {/* v4.0 : flottes hostiles en approche (échos radar rouges) */}
      {Array.from({ length: Math.min(3, life.incoming ?? 0) }, (_, i) => (
        <circle key={`h${i}`} r={2.4} fill="var(--color-danger-glow)" cx={still ? VIEW - 12 : 0} cy={still ? 30 + i * 20 : 0}>
          {!still && <animateMotion path={`M ${VIEW + 10} ${20 + i * 25} L ${C + R + 16} ${C - 10 + i * 8}`} dur="5s" begin={`${i * 1.3}s`} repeatCount="indefinite" />}
          {!still && <animate attributeName="opacity" values="0.2;1;0.2" dur="0.9s" repeatCount="indefinite" />}
        </circle>
      ))}

      {/* Atelier de réparation : drone en orbite basse */}
      {r.repair && (
        <circle r={2} fill="var(--color-mint-glow)" cx={still ? C + R + 6 : 0} cy={still ? C : 0}>
          {!still && <animateMotion path={orbitPath(R + 6, R + 6)} dur="7s" repeatCount="indefinite" />}
        </circle>
      )}
    </svg>
  );
}

/** Légende de la planète : ce que chaque bâtiment y a ajouté. */
export function HomePlanetLegend({ buildings }: { buildings: Buildings }) {
  const r = useBuildingRatios(buildings);
  const items = [
    { on: r.mines > 0, color: "#c9a86a", label: `Mines (${Math.ceil(r.mines * 8)})`, from: "Extracteur de ferraille" },
    { on: r.nano > 0, color: "var(--color-mint-glow)", label: "Réseau nano", from: "Extracteur de nanocomposants" },
    { on: r.reactor > 0, color: "var(--color-ember-glow)", label: "Halo du réacteur", from: "Réacteur instable" },
    { on: r.archives > 0, color: "var(--color-cyan-glow)", label: `Balises (${Math.ceil(r.archives * 3)})`, from: "Archives fracturées" },
    { on: r.repair, color: "var(--color-mint-glow)", label: "Drone de réparation", from: "Atelier de réparation" },
    { on: r.attackHangar > 0, color: "var(--color-danger-glow)", label: `Vaisseaux en orbite (${Math.ceil(r.attackHangar * 6)})`, from: "Hangar d'attaque" },
    { on: r.defenseHangar > 0, color: "var(--color-cyan-glow)", label: "Bouclier planétaire", from: "Hangar de défense" },
  ];
  return (
    <ul className="grid gap-x-6 gap-y-1 text-xs sm:grid-cols-2">
      {items.map((it) => (
        <li key={it.label} className={it.on ? "flex items-center gap-2 text-slate-300" : "flex items-center gap-2 text-slate-600"} title={it.from}>
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: it.on ? it.color : "#334155" }} />
          {it.on ? it.label : `${it.from} : à développer`}
        </li>
      ))}
    </ul>
  );
}
