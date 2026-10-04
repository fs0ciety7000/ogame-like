import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarCheck, Share2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VictoryCardDialog } from "@/components/game/VictoryCardDialog";
import { weekIdOf, weekLabel, type WeeklyRecap } from "@/game/weeklyRecap";
import { weeklyCardInput } from "@/lib/shareCards";
import { formatCompact } from "@/lib/utils";
import { usePlayerStore } from "@/store/playerStore";
import { useAllianceTag } from "@/store/directoryStore";

/* v5.10 : résumé de la semaine écoulée (accueil), à partager en carte. */

const key = (weekId: string) => `cosmic:week-recap-hidden:${weekId}`;

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-slate-500">{label}</span>
      <span className="font-display text-lg tabular-nums text-white">{value}</span>
    </div>
  );
}

export function WeeklyRecapCard() {
  const player = usePlayerStore((s) => s.player);
  const tag = useAllianceTag(player?.uid, player?.allianceId) ?? undefined;
  const [params, setParams] = useSearchParams();
  const [sharing, setSharing] = useState(false);
  const recap: WeeklyRecap | undefined = player?.stats?.lastWeek;
  const lastWeekId = weekIdOf(Date.now() - 7 * 86_400_000);
  const [hidden, setHidden] = useState(() => {
    try {
      return !!recap && localStorage.getItem(key(recap.weekId)) === "1";
    } catch {
      return false;
    }
  });
  // « ?semaine=1 » (lien de la notification) : ouvre directement la carte.
  useEffect(() => {
    if (params.get("semaine") !== "1") return;
    setSharing(true);
    setParams((p) => {
      p.delete("semaine");
      return p;
    }, { replace: true });
  }, [params, setParams]);

  if (!player || !recap || recap.weekId !== lastWeekId || (hidden && !sharing)) return null;
  const hide = () => {
    try {
      localStorage.setItem(key(recap.weekId), "1");
    } catch {
      /* stockage indisponible : masqué pour cette visite seulement */
    }
    setHidden(true);
  };
  return (
    <>
      {!hidden && (
        <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="relative flex flex-col gap-3 border border-cyan-glow/25 bg-cyan-glow/[0.04] p-4">
          <button type="button" onClick={hide} className="absolute right-2 top-2 p-1 text-slate-500 hover:text-white" aria-label="Masquer le résumé">
            <X className="h-4 w-4" />
          </button>
          <p className="hud-eyebrow flex items-center gap-1.5 text-cyan-glow">
            <CalendarCheck className="h-3.5 w-3.5" /> Ma {weekLabel(recap.weekId)}
          </p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            <Stat label="Victoires" value={String(recap.victories)} />
            <Stat label="Butin" value={formatCompact(recap.loot)} />
            <Stat label="Missions" value={String(recap.missions)} />
            <Stat label="XP" value={`${recap.xp >= 0 ? "+" : ""}${formatCompact(recap.xp)}`} />
            <Stat label="Succès" value={String(recap.achievements)} />
            <Stat label="Contrats" value={String(recap.contracts)} />
          </div>
          <Button size="sm" variant="secondary" className="self-start" onClick={() => setSharing(true)}>
            <Share2 className="mr-1 h-3.5 w-3.5" /> Partager ma semaine
          </Button>
        </motion.div>
      )}
      <VictoryCardDialog
        card={sharing ? weeklyCardInput(recap, player, tag) : null}
        target="/game"
        title="Ma semaine"
        fileName="cosmic-empires-semaine.jpg"
        onClose={() => setSharing(false)}
      />
    </>
  );
}
