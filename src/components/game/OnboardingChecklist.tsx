import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { LOCKABLE_BUILDINGS } from "@/game/buildings";
import { cn } from "@/lib/utils";
import type { PlayerState } from "@/types/game";

const DISMISS_KEY = "cosmic-empires:onboarding-dismissed";

interface Step {
  id: string;
  label: string;
  to: string;
  done: (player: PlayerState) => boolean;
}

const STEPS: Step[] = [
  {
    id: "research",
    label: "Lancer une recherche au Labo",
    to: "/game/labo",
    done: (p) => Object.values(p.techLevels).some((lvl) => lvl > 0),
  },
  {
    id: "building-level",
    label: "Améliorer un bâtiment au niveau 2",
    to: "/game/batiments",
    done: (p) => Object.values(p.buildings).some((b) => b.level > 1),
  },
  {
    id: "unlock-building",
    label: "Débloquer un second bâtiment",
    to: "/game/batiments",
    done: (p) => LOCKABLE_BUILDINGS.some((id) => p.buildings[id]?.unlocked),
  },
  {
    id: "first-unit",
    label: "Construire ta première unité",
    to: "/game/unites",
    done: (p) => Object.values(p.units).some((u) => u.count > 0),
  },
  {
    id: "mission-or-combat",
    label: "Terminer une mission ou remporter un combat",
    to: "/game/missions",
    done: (p) => p.xp > 0,
  },
];

export function OnboardingChecklist({ player }: { player: PlayerState }) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISS_KEY) === "1";
    } catch {
      return false;
    }
  });

  const results = STEPS.map((step) => ({ ...step, isDone: step.done(player) }));
  const doneCount = results.filter((s) => s.isDone).length;
  const allDone = doneCount === STEPS.length;

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* stockage indisponible (navigation privée…) : tant pis, non bloquant */
    }
  };

  return (
    <AnimatePresence>
      {!dismissed && !allDone && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <button
              onClick={dismiss}
              title="Masquer"
              className="absolute right-3 top-3 rounded-md p-1 text-slate-500 transition hover:text-slate-200"
            >
              <X className="h-4 w-4" />
            </button>

            <CardHeader>
              <CardTitle>Premiers pas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex items-center gap-3">
                <Progress value={(doneCount / STEPS.length) * 100} className="flex-1" />
                <span className="shrink-0 text-xs text-slate-400">
                  {doneCount} / {STEPS.length}
                </span>
              </div>

              <ul className="space-y-1.5">
                {results.map((step) => (
                  <li key={step.id}>
                    <Link
                      to={step.to}
                      className={cn(
                        "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition hover:bg-white/5",
                        step.isDone ? "text-slate-500 line-through" : "text-slate-200",
                      )}
                    >
                      {step.isDone ? (
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-mint-glow" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-slate-600" />
                      )}
                      {step.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
