import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, Building2, Crosshair, FlaskConical, Gift, MapPin, Rocket, Warehouse, Zap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { nextActions, type NextActionKind } from "@/game/nextActions";
import { usePlayerStore } from "@/store/playerStore";
import { useFleetStore } from "@/store/fleetStore";
import { cn } from "@/lib/utils";

/* Accueil (v3.8) : ce qui attend le joueur, en cartes cliquables. */

const STYLE: Record<NextActionKind, { icon: typeof Zap; tone: string }> = {
  outage: { icon: Zap, tone: "text-danger-glow border-danger-glow/40 bg-danger-glow/[0.07]" },
  contracts: { icon: Gift, tone: "text-gold-glow border-gold-glow/40 bg-gold-glow/[0.07]" },
  storage: { icon: Warehouse, tone: "text-ember-glow border-ember-glow/40 bg-ember-glow/[0.07]" },
  build: { icon: Building2, tone: "text-cyan-glow border-cyan-glow/30 bg-cyan-glow/[0.05]" },
  research: { icon: FlaskConical, tone: "text-violet-glow border-violet-glow/30 bg-violet-glow/[0.05]" },
  mission: { icon: MapPin, tone: "text-mint-glow border-mint-glow/30 bg-mint-glow/[0.05]" },
  units: { icon: Rocket, tone: "text-cyan-glow border-cyan-glow/25 bg-cyan-glow/[0.04]" },
  fleet: { icon: AlertTriangle, tone: "text-slate-300 border-white/15 bg-white/[0.03]" },
  bounty: { icon: Crosshair, tone: "text-gold-glow border-gold-glow/35 bg-gold-glow/[0.06]" },
};

export function NextActionsCard({ max = 4 }: { max?: number }) {
  const player = usePlayerStore((s) => s.player);
  const queues = usePlayerStore((s) => s.queues);
  const fleets = useFleetStore((s) => s.fleets);
  if (!player) return null;
  const actions = nextActions(player, queues, fleets, Date.now()).slice(0, max);
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
                <Icon className="h-4 w-4 shrink-0" />
                <span className="font-semibold text-white">{a.title}</span>
                <ArrowRight className="ml-auto h-3.5 w-3.5 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
              </span>
              <span className="mt-1 block text-xs text-slate-400">{a.text}</span>
            </>
          );
          const cls = cn("group block h-full border p-3 text-sm transition-colors hover:brightness-125", tone);
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
