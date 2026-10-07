import { useState } from "react";
import { toast } from "sonner";
import { Flame, PackageOpen } from "lucide-react";
import { AmberAmount } from "@/components/ui/amber";
import { RewardReveal, type RevealItem } from "@/components/game/RewardReveal";
import { HudChip } from "@/components/ui/hud";
import { ResourceIcon } from "@/components/ui/game-icon";
import { Tooltip, TooltipCard, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { TokenIcon } from "@/components/casino/TokenIcon";
import { describeGain } from "@/game/format";
import { cycleDay, STREAK_RULES, streakReward, streakState, streakStatus, type StreakChest } from "@/game/streak";
import { claimStreak, GameActionError } from "@/services/playerService";
import { usePlayerStore } from "@/store/playerStore";
import { useNowTicker } from "@/hooks/useNowTicker";
import { cn, formatCompact } from "@/lib/utils";
import type { ResourceId } from "@/types/game";

/** Ce que rapporte un jour du cycle (infobulle de la piste). */
function dayLabel(n: number): string {
  const parts = [`${STREAK_RULES.hours[n - 1]} h de production`, `${STREAK_RULES.dailyTokens} jetons`];
  if (n === 6) parts.push(`${STREAK_RULES.amberDay6} Ambre`);
  if (n === 7) parts.push("coffre surprise");
  return `Jour ${n} : ${parts.join(" + ")}`;
}

/** 5.15.6 : coffre du 7e jour ; 5.15.12 : révélation commune des récompenses. */
function ChestDialog({ chest, onClose }: { chest: StreakChest | null; onClose: () => void }) {
  const items: RevealItem[] = chest
    ? [
        { key: "amber", node: <AmberAmount value={chest.amber} className="font-mono text-sm text-slate-100" /> },
        {
          key: "tokens",
          node: (
            <span className="inline-flex items-center gap-1.5 font-mono text-sm text-slate-100">
              <TokenIcon size={16} /> {chest.tokens} jeton{chest.tokens > 1 ? "s" : ""}
            </span>
          ),
        },
        ...(Object.entries(chest.resources) as [ResourceId, number][]).map(([id, n]) => ({
          key: id,
          node: (
            <span className="inline-flex items-center gap-1.5 font-mono text-sm text-slate-100">
              <ResourceIcon id={id} className="h-4 w-4" /> +{formatCompact(n)}
            </span>
          ),
        })),
      ]
    : [];
  // 5.24 : la roue passe sur le contenu possible du coffre et s'arrête sur l'Ambre.
  const reel = chest
    ? {
        target: 0,
        items: [
          { id: "amber", image: "/assets/bounties/amber.webp", label: `${chest.amber} Ambre` },
          { id: "tokens", image: "/assets/casino/jeton.webp", label: `${chest.tokens} jetons` },
          ...(["scrap", "energy", "nano", "data"] as const).map((id) => ({ id, image: `/assets/icons/${id}.webp`, label: id })),
        ],
      }
    : undefined;
  return <RewardReveal open={chest !== null} onClose={onClose} icon={<PackageOpen />} title="Coffre de la série" description="Sept jours d'affilée : voici ce que contenait le coffre." items={items} reel={reel} />;
}

/** v5.3 : pastille de l'en-tête — série de connexion quotidienne. */
export function StreakBadge() {
  useNowTicker();
  const player = usePlayerStore((s) => s.player);
  const [busy, setBusy] = useState(false);
  const [chest, setChest] = useState<StreakChest | null>(null);
  if (!player) return null;
  const status = streakStatus(player, Date.now());
  const st = streakState(player);
  const day = cycleDay(status.next);
  const reward = streakReward(player, status.next);

  const claim = async () => {
    setBusy(true);
    try {
      const out = await claimStreak();
      toast.success(`Série : jour ${out.count} !`, {
        description: `${describeGain(out.resources)}, ${out.tokens} jetons${out.amber ? ` et ${out.amber} Ambre` : ""}.${out.chest ? " Et le coffre de la série !" : ""}`,
      });
      if (out.chest) setChest(out.chest);
    } catch (err) {
      toast.error(err instanceof GameActionError ? err.message : "Réclamation impossible.");
    } finally {
      setBusy(false);
    }
  };

  const track = (
    <div className="mt-1.5 flex gap-1">
      {STREAK_RULES.hours.map((_, i) => {
        const n = i + 1;
        const done = status.claimed ? n <= cycleDay(status.current) : n < day;
        const next = !status.claimed && n === day;
        return (
          <span
            key={n}
            title={dayLabel(n)}
            className={cn("grid h-5 w-5 place-items-center border font-mono text-[11px]", done ? "border-ember-glow/60 bg-ember-glow/25 text-slate-100" : next ? "border-gold-glow bg-gold-glow/20 text-gold-glow" : "border-white/15 text-slate-500")}
          >
            {n === 7 ? <PackageOpen className="h-3 w-3" /> : n}
          </span>
        );
      })}
    </div>
  );

  const c = STREAK_RULES.chest;
  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          {status.claimed ? (
            <HudChip tone="neutral">
              <Flame /> Série {status.current} j
            </HudChip>
          ) : (
            <HudChip asChild tone="gold" alert>
              <button type="button" disabled={busy} onClick={() => void claim()}>
                <Flame /> Série j{status.next} · {reward.chest ? "ouvrir le coffre" : "réclamer"}
              </button>
            </HudChip>
          )}
        </TooltipTrigger>
        <TooltipContent>
          <TooltipCard
            title="Série de connexion"
            icon={<Flame className="h-3 w-3" />}
            rows={
              status.claimed
                ? [{ label: "Aujourd'hui", value: "reçu", tone: "mint" }, { label: "Demain", value: `jour ${cycleDay(status.next)}` }]
                : [
                    { label: `Jour ${day}`, value: describeGain(reward.resources) },
                    { label: "Jetons du casino", value: `+${reward.tokens}`, tone: "gold" },
                    ...(reward.amber ? [{ label: "Ambre", value: `+${reward.amber}`, tone: "gold" as const }] : []),
                    ...(reward.chest ? [{ label: "Coffre", value: "à ouvrir !", tone: "gold" as const }] : []),
                  ]
            }
            sections={[
              {
                title: "Coffre du 7e jour (au hasard)",
                rows: [
                  { label: "Ambre", value: `${c.amber[0]} à ${c.amber[1]}` },
                  { label: "Jetons", value: `${c.tokens[0]} à ${c.tokens[1]}` },
                  { label: "Chaque commune", value: `${formatCompact(c.common[0])} à ${formatCompact(c.common[1])}` },
                ],
              },
            ]}
            note={`Un jour manqué remet la série à 1. Meilleure série : ${Math.max(st.best, status.current)} j.${status.current === 0 && st.count > 0 && !status.claimed ? " Ta série précédente s'est arrêtée." : ""}`}
          />
          {track}
        </TooltipContent>
      </Tooltip>
      <ChestDialog chest={chest} onClose={() => setChest(null)} />
    </>
  );
}
