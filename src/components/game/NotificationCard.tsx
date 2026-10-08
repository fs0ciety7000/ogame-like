import { TokenIcon } from "@/components/casino/TokenIcon";
import { assetUrl } from "@/lib/assets";
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
import { HUD_TONE, HudChip, type HudTone } from "@/components/ui/hud";
import { AmberIcon } from "@/components/ui/amber";
import { RESOURCE_LIST } from "@/game/resources";
import { cn, formatCompact, timeAgo } from "@/lib/utils";
import { isHostileFleetNotification } from "@/lib/notificationCategories";
import type { GameNotification, NotificationKind, ResourceId } from "@/types/game";

/* v5.9 : carte de notification commune (cloche et Journal) — une icône et
   une couleur par type, les détails (ressources, ambre, XP, relique,
   joueur) en pastilles lisibles. */

const KIND_STYLE: Record<NotificationKind, { icon: LucideIcon; tone: HudTone; label: string }> = {
  building: { icon: Building2, tone: "accent", label: "Chantier" },
  research: { icon: FlaskConical, tone: "violet", label: "Recherche" },
  unit: { icon: Rocket, tone: "accent", label: "Chantier spatial" },
  mission: { icon: Compass, tone: "mint", label: "Mission" },
  "combat-attacker": { icon: Swords, tone: "ember", label: "Combat" },
  "combat-defender": { icon: Shield, tone: "danger", label: "Défense" },
  achievement: { icon: Trophy, tone: "gold", label: "Succès" },
  "spy-detected": { icon: Radar, tone: "danger", label: "Sonde détectée" },
  spy: { icon: Eye, tone: "accent", label: "Espionnage" },
  debris: { icon: Recycle, tone: "mint", label: "Recyclage" },
  season: { icon: Award, tone: "gold", label: "Saison" },
  alliance: { icon: Users, tone: "violet", label: "Alliance" },
  event: { icon: Sparkles, tone: "violet", label: "Évènement" },
  gift: { icon: Gift, tone: "gold", label: "Cadeau" },
  fleet: { icon: Crosshair, tone: "danger", label: "Flotte" },
  report: { icon: Megaphone, tone: "neutral", label: "Signalement" },
  message: { icon: Mail, tone: "accent", label: "Message" },
  bounty: { icon: Crosshair, tone: "gold", label: "Prime" },
  system: { icon: Bell, tone: "neutral", label: "Système" },
};

/** 6.14.77 (É30-1f) : flotte sans menace (retour, saut réussi, livraison) : ton courant, pas le rouge des menaces. */
const FLEET_CALM: { icon: LucideIcon; tone: HudTone; label: string } = { icon: Rocket, tone: "accent", label: "Flotte" };

/** Style d'un type de notification : icône, ton du HUD (couleur du thème) et libellé. Avec la notification, une flotte
 *  sans menace (retour, saut) prend le ton courant ; le rouge reste à la flotte hostile (couleur = sens). */
export function notificationStyle(kind: NotificationKind, n?: { title?: string | null; message?: string | null }) {
  const s = kind === "fleet" && n && !isHostileFleetNotification({ kind, title: n.title, message: n.message }) ? FLEET_CALM : (KIND_STYLE[kind] ?? KIND_STYLE.system);
  return { ...s, color: HUD_TONE[s.tone] };
}

function Pill({ children, tone = "neutral" }: { children: React.ReactNode; tone?: HudTone }) {
  return (
    <HudChip size="sm" tone={tone} className="normal-case tracking-normal">
      {children}
    </HudChip>
  );
}

/** Détails structurés de la notification (s'il y en a). */
function Details({ n }: { n: GameNotification }) {
  const d = n.data;
  if (!d) return null;
  const order = RESOURCE_LIST.map((r) => r.id as string);
  const res = (Object.entries(d.resources ?? {}).filter(([, v]) => (v ?? 0) > 0) as [ResourceId, number][]).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  const who = d.fromPseudo ? { label: "De", name: d.fromPseudo } : d.toPseudo ? { label: "À", name: d.toPseudo } : null;
  // 6.14.155 (R8, AE-14) : part versée au-delà de l'entrepôt (ember : stock gardé, production arrêtée).
  const over = (Object.entries(d.overflow ?? {}).filter(([, v]) => (v ?? 0) > 0) as [ResourceId, number][]).sort((a, b) => order.indexOf(a[0]) - order.indexOf(b[0]));
  if (res.length === 0 && over.length === 0 && !who && !d.amber && !d.xp && !d.relic && !d.tokens) return null;
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
        <Pill tone="gold">
          <AmberIcon className="h-3.5 w-3.5" /> {formatCompact(d.amber)}
        </Pill>
      )}
      {!!d.xp && <Pill tone="accent">+{formatCompact(d.xp)} XP</Pill>}
      {d.relic && <Pill tone="violet">✦ {d.relic}</Pill>}
      {!!d.tokens && (
        <Pill tone="gold">
          <TokenIcon size={14} /> +{d.tokens} jeton{d.tokens > 1 ? "s" : ""}
        </Pill>
      )}
      {over.length > 0 && <span className="ml-1 text-[11px] text-ember-glow">au-delà de l'entrepôt</span>}
      {over.map(([id, v]) => (
        <Pill key={`over-${id}`} tone="ember">
          <ResourceIcon id={id} /> {formatCompact(v)}
        </Pill>
      ))}
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
  const s = notificationStyle(n.kind, n);
  const Icon = s.icon;
  const Tag = onOpen ? "button" : "div";
  return (
    <Tag
      type={onOpen ? "button" : undefined}
      onClick={onOpen}
      className={cn(
        "group relative flex w-full shrink-0 gap-3 overflow-hidden border border-white/[0.06] text-left transition-colors",
        compact ? "px-3 py-2" : "px-3.5 py-3",
        fresh ? "bg-white/[0.045]" : "bg-white/[0.015]",
        onOpen && "hover:border-white/15 hover:bg-white/[0.06]",
      )}
    >
      {/* Liseré de couleur du type, plus vif pour une nouveauté. */}
      <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: s.color, opacity: fresh ? 1 : 0.45 }} />
      <span
        className={cn("grid shrink-0 place-items-center border", compact ? "h-8 w-8" : "h-9 w-9")}
        style={{ color: s.color, borderColor: `color-mix(in srgb, ${s.color} 33%, transparent)`, background: `color-mix(in srgb, ${s.color} 8%, transparent)` }}
      >
        <Icon className={compact ? "h-4 w-4" : "h-[18px] w-[18px]"} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em]" style={{ color: s.color }}>
            {s.label}
          </span>
          {fresh && <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color, boxShadow: `0 0 6px ${s.color}` }} aria-label="Nouveau" />}
          <span className="ml-auto shrink-0 font-mono text-[11px] text-slate-500">{time ?? timeAgo(n.createdAtMs)}</span>
        </div>
        <p className={cn("mt-0.5 font-semibold leading-snug", compact ? "text-[13px]" : "text-sm", fresh ? "text-slate-100" : "text-slate-200")}>{n.title}</p>
        <p className="mt-0.5 break-words text-xs leading-relaxed text-slate-400">{n.message}</p>
        {n.data?.image && !compact && <img src={assetUrl(n.data.image)} alt="" aria-hidden loading="lazy" className="hud-cut-sm mt-2 aspect-[3/1] w-full border border-white/10 object-cover" />}
        <Details n={n} />
        {onOpen && !compact && <span className="mt-1.5 inline-block text-[11px] text-cyan-glow/70 group-hover:text-cyan-glow">Voir →</span>}
      </div>
    </Tag>
  );
}
