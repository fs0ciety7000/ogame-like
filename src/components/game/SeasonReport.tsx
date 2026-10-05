import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AmberAmount } from "@/components/ui/amber";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { RewardReveal, type RevealItem } from "@/components/game/RewardReveal";
import { currentSeasonId, seasonLabel, seasonRewardFor } from "@/game/seasons";
import { fetchMySeasonResult } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { formatCompact, formatNumber } from "@/lib/utils";
import type { SeasonResult } from "@/types/game";

/* 5.15.12 : rapport de fin de saison, montré une fois au premier passage du
   nouveau mois : rang, XP, gains et titre. Un résumé se copie pour le partager. */

const SEEN_KEY = "cosmic:season-report-seen";

function seen(): string {
  try {
    return localStorage.getItem(SEEN_KEY) ?? "";
  } catch {
    return "";
  }
}

export function SeasonReport() {
  const player = usePlayerStore((s) => s.player);
  const [result, setResult] = useState<SeasonResult | null | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const last = player?.lastSeasonId ?? "";
  const uid = player?.uid;
  const show = !!uid && !!last && last !== currentSeasonId() && seen() !== last;

  useEffect(() => {
    if (!show || !uid) return;
    let alive = true;
    void fetchMySeasonResult(uid, last).then((r) => {
      if (!alive) return;
      setResult(r);
      setOpen(true);
    });
    return () => {
      alive = false;
    };
  }, [show, uid, last]);

  if (!player || !open) return null;
  const xp = result?.seasonXp ?? player.lastSeasonXp ?? 0;
  const rank = result?.rank ?? 0;
  const reward = rank > 0 ? seasonRewardFor(rank, xp, last) : seasonRewardFor(9999, xp, last);
  const close = () => {
    try {
      localStorage.setItem(SEEN_KEY, last);
    } catch {
      /* déjà vu sur cet appareil seulement */
    }
    setOpen(false);
  };
  const summary = `Saison ${seasonLabel(last)} sur Cosmic Empires : ${rank > 0 ? `${rank}e` : "classé"} avec ${formatNumber(xp)} XP${reward?.title ? `, titre « ${reward.title} »` : ""}.`;
  const items: RevealItem[] = [
    { key: "rank", node: <span className="font-mono text-sm text-slate-100">{rank > 0 ? `Rang ${rank}` : "Classé"}</span> },
    { key: "xp", node: <span className="font-mono text-sm text-slate-100">{formatNumber(xp)} XP</span> },
    ...((reward?.tokens ?? 0) > 0 ? [{ key: "tokens", node: <span className="inline-flex items-center gap-1.5 font-mono text-sm text-slate-100"><TokenIcon size={16} /> +{reward?.tokens} jetons</span> }] : []),
    ...((reward?.amber ?? 0) > 0 ? [{ key: "amber", node: <AmberAmount value={reward?.amber ?? 0} className="font-mono text-sm text-slate-100" /> }] : []),
    ...((reward?.common ?? 0) > 0 ? [{ key: "common", node: <span className="font-mono text-sm text-slate-100">+{formatCompact(reward?.common ?? 0)} de chaque</span> }] : []),
  ];
  return (
    <RewardReveal
      open
      onClose={close}
      icon={<Trophy />}
      title={`Saison ${seasonLabel(last)} terminée`}
      description={reward?.title ? `Tu portes le titre « ${reward.title} ».` : xp > 0 ? "Merci d'avoir défendu le secteur ce mois-ci. Voici ce que tu as gagné." : "Pas d'XP de saison ce mois-là : la nouvelle saison commence, à toi de jouer."}
      items={items}
      closeLabel="En route pour la nouvelle saison"
      footer={
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            void navigator.clipboard?.writeText(summary).then(
              () => toast.success("Résumé copié."),
              () => toast.error("Copie impossible."),
            );
          }}
        >
          Copier le résumé à partager
        </Button>
      }
    />
  );
}
