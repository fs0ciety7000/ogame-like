import {
  Award,
  Bell,
  Building2,
  Compass,
  Crosshair,
  Eye,
  FlaskConical,
  Gift,
  Mail,
  Megaphone,
  Radar,
  Recycle,
  Rocket,
  Shield,
  Sparkles,
  Swords,
  Trophy,
  Users,
  type LucideIcon,
} from "lucide-react";
import { ResourceIcon } from "@/components/ui/game-icon";
import { AmberIcon } from "@/components/ui/amber";
import { RESOURCE_LIST } from "@/game/resources";
import { cn, formatCompact, timeAgo } from "@/lib/utils";
import type { GameNotification, NotificationKind, ResourceId } from "@/types/game";

/* v5.9 : carte de notification commune (cloche et Journal) — une icône et
   une couleur par type, les détails (ressources, ambre, XP, relique,
   joueur) en pastilles lisibles. */

const KIND_STYLE: Record<NotificationKind, { icon: LucideIcon; color: string; label: string }> = {
  building: { icon: Building2, color: "#4be8ff", label: "Chantier" },
  research: { icon: FlaskConical, color: "#a78bfa", label: "Recherche" },
  unit: { icon: Rocket, color: "#4be8ff", label: "Chantier spatial" },
  mission: { icon: Compass, color: "#5cf2b0", label: "Mission" },
  "combat-attacker": { icon: Swords, color: "#ff8a4c", label: "Combat" },
  "combat-defender": { icon: Shield, color: "#ff5c7a", label: "Défense" },
  achievement: { icon: Trophy, color: "#ffd86b", label: "Succès" },
  "spy-detected": { icon: Radar, color: "#ff5c7a", label: "Sonde détectée" },
  spy: { icon: Eye, color: "#4be8ff", label: "Espionnage" },
  debris: { icon: Recycle, color: "#5cf2b0", label: "Recyclage" },
  season: { icon: Award, color: "#ffd86b", label: "Saison" },
  alliance: { icon: Users, color: "#a78bfa", label: "Alliance" },
  event: { icon: Sparkles, color: "#ffd86b", label: "Évènement" },
  gift: { icon: Gift, color: "#ff5df0", label: "Cadeau" },
  fleet: { icon: Crosshair, color: "#ff5c7a", label: "Flotte" },
  report: { icon: Megaphone, color: "#94a3b8", label: "Signalement" },
  message: { icon: Mail, color: "#4be8ff", label: "Message" },
  bounty: { icon: Crosshair, color: "#ffb347", label: "Prime" },
  system: { icon: Bell, color: "#94a3b8", label: "Système" },
};

export function notificationStyle(kind: NotificationKind) {
  return KIND_STYLE[kind] ?? KIND_STYLE.system;
}

function Pill({ children, color }: { children: React.ReactNode; color?: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-slate-200"
      style={color ? { borderColor: `${color}55`, color } : undefined}
    >
      {children}
    </span>
  );
}

/** Détails structurés de la notification (s'il y en a). */
function Details({ n }: { n: GameNotification }) {
  const d = n.data;
  if (!d) return null;
  const order = RESOURCE_LIST.map((r) => r.id as string);
  const res = (Object.entries(d.resources ?? {}).filter(([, v]) => (v ?? 0) > 0) as [ResourceId, number][]).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  const who = d.fromPseudo ? { label: "De", name: d.fromPseudo } : d.toPseudo ? { label: "À", name: d.toPseudo } : null;
  if (res.length === 0 && !who && !d.amber && !d.xp && !d.relic) return null;
  return (
    <div className="mt-1.5 flex flex-wrap items-center gap-1">
      {who && (
        <span className="mr-1 text-[11px] text-slate-500">
          {who.label} <strong className="font-semibold text-slate-200">{who.name}</strong>
        </span>
      )}
      {res.map(([id, v]) => (
        <Pill key={id}>
          <ResourceIcon id={id} /> {formatCompact(v)}
        </Pill>
      ))}
      {!!d.amber && (
        <Pill color="#ffb347">
          <AmberIcon className="h-3.5 w-3.5" /> {formatCompact(d.amber)}
        </Pill>
      )}
      {!!d.xp && <Pill color="#4be8ff">+{formatCompact(d.xp)} XP</Pill>}
      {d.relic && <Pill color="#a78bfa">✦ {d.relic}</Pill>}
    </div>
  );
}

export function NotificationCard({
  n,
  fresh = false,
  time,
  onOpen,
  compact = false,
}: {
  n: GameNotification;
  fresh?: boolean;
  /** Texte d'heure (défaut : « il y a … »). */
  time?: string;
  /** Clic sur la carte (navigation) ; absent : carte non cliquable. */
  onOpen?: () => void;
  compact?: boolean;
}) {
  const s = notificationStyle(n.kind);
  const Icon = s.icon;
  const Tag = onOpen ? "button" : "div";
  return (
    <Tag
      type={onOpen ? "button" : undefined}
      onClick={onOpen}
      className={cn(
        "group relative flex w-full gap-3 overflow-hidden border border-white/[0.06] text-left transition-colors",
        compact ? "px-3 py-2" : "px-3.5 py-3",
        fresh ? "bg-white/[0.045]" : "bg-white/[0.015]",
        onOpen && "hover:border-white/15 hover:bg-white/[0.06]",
      )}
    >
      {/* Liseré de couleur du type, plus vif pour une nouveauté. */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: s.color, opacity: fresh ? 1 : 0.45 }} />
      <span
        className={cn("grid shrink-0 place-items-center border", compact ? "h-8 w-8" : "h-9 w-9")}
        style={{ color: s.color, borderColor: `${s.color}55`, background: `${s.color}14` }}
      >
        <Icon className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em]" style={{ color: s.color }}>
            {s.label}
          </span>
          {fresh && <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} aria-label="Nouveau" />}
          <span className="ml-auto shrink-0 font-mono text-[10px] text-slate-500">{time ?? timeAgo(n.createdAtMs)}</span>
        </div>
        <p className={cn("mt-0.5 font-semibold leading-snug", compact ? "text-[13px]" : "text-sm", fresh ? "text-white" : "text-slate-200")}>{n.title}</p>
        <p className="mt-0.5 break-words text-xs leading-relaxed text-slate-400">{n.message}</p>
        <Details n={n} />
        {onOpen && !compact && <span className="mt-1.5 inline-block text-[11px] text-cyan-glow/70 group-hover:text-cyan-glow">Voir →</span>}
      </div>
    </Tag>
  );
}
