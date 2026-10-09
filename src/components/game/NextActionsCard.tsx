import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowLeftRight, ArrowRight, Building2, Crosshair, FlaskConical, Gift, MapPin, Rocket, Warehouse, Zap, Wrench } from "lucide-react";
import { Card } from "@/components/ui/card";
import { nextActions, type NextActionKind } from "@/game/nextActions";
import { usePlayerStore } from "@/store/playerStore";
import { useFleetStore } from "@/store/fleetStore";
import { cn } from "@/lib/utils";
import type { HudTone } from "@/components/ui/hud";

/* Accueil (v3.8) : ce qui attend le joueur, en cartes cliquables. */

/* Couleur = sens (docs/DESIGN.md) : danger (panne), attention (entrepôt),
   récompense (contrats, primes), action à mener (chantier à l'arrêt), neutre. */
const STYLE: Record<NextActionKind, { icon: typeof Zap; tone: HudTone }> = {
  outage: { icon: Zap, tone: "danger" },
  contracts: { icon: Gift, tone: "gold" },
  storage: { icon: Warehouse, tone: "ember" },
  surplus: { icon: ArrowLeftRight, tone: "accent" },
  build: { icon: Building2, tone: "accent" },
  research: { icon: FlaskConical, tone: "accent" },
  mission: { icon: MapPin, tone: "accent" },
  units: { icon: Rocket, tone: "accent" },
  fleet: { icon: AlertTriangle, tone: "neutral" },
  bounty: { icon: Crosshair, tone: "gold" },
  repair: { icon: Wrench, tone: "ember" },
};

/** `exclude` : sortes déjà dites ailleurs sur l'écran (6.14.63 : sur l'accueil, les pastilles de chantiers à l'arrêt).
 *  `only` : seulement ces sortes (6.14.165 : pendant la prise en main, le conseil « Échange ton surplus » seul). */
export function NextActionsCard({ max = 4, exclude = [], only }: { max?: number; exclude?: readonly NextActionKind[]; only?: readonly NextActionKind[] }) {
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const fleets = useFleetStore((s) => s.fleets);
  if (!player) return null;
  const actions = nextActions(player, queues, fleets, Date.now())
    .filter((a) => !exclude.includes(a.kind) && (!only || only.includes(a.kind)))
    .slice(0, max);
  if (actions.length === 0) return null;

  return (
    <Card className="p-4">
      <p className="hud-eyebrow mb-3 text-cyan-glow/80">Que faire maintenant ?</p>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((a, i) => {
          const { icon: Icon, tone } = STYLE[a.kind];
          const body = (
            <>
              <span className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0 text-[var(--c)]" />
                <span className="font-semibold text-slate-100">{a.title}</span>
                <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </span>
              <span className="mt-1 block text-xs text-slate-400">{a.text}</span>
            </>
          );
          const cls = cn("hud-callout group block h-full p-3 text-sm transition-colors hover:brightness-125", `hud-tone-${tone}`);
          return (
            <motion.div key={a.kind} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: i * 0.05 }}>
              {a.to.startsWith("#") ? (
                <a
                  href={a.to}
                  className={cls}
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById(a.to.slice(1))?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                >
                  {body}
                </a>
              ) : (
                <Link to={a.to} className={cls}>
                  {body}
                </Link>
              )}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}
