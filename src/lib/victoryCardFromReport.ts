import { publicShowcase } from "@/game/profile";
import { getRankIcon, getRankLabel } from "@/game/ranks";
import { formatCompact } from "@/lib/utils";
import type { VictoryCardInput } from "@/lib/victoryCard";
import type { BattleReport, PlayerState } from "@/types/game";

/** Carte d'un combat gagné, vue du joueur (attaquant ou défenseur). */
export function victoryCardFromReport(report: BattleReport, player: PlayerState, tag?: string): VictoryCardInput | null {
  const attacker = report.attackerUid === player.uid;
  const won = attacker ? report.outcome === "attacker_win" : report.outcome === "defender_win";
  if (!won) return null;
  const show = publicShowcase(player);
  const opponent = attacker ? report.defenderPseudo : report.attackerPseudo;
  const loot = Object.values(report.loot ?? {}).reduce((a, b) => a + (b ?? 0), 0);
  const myLoss = Math.round((attacker ? report.attackerLossPercent : report.defenderLossPercent) * 100);
  const theirLoss = Math.round((attacker ? report.defenderLossPercent : report.attackerLossPercent) * 100);
  const xp = attacker ? report.attackerXpDelta : report.defenderXpDelta;
  return {
    headline: attacker ? "Victoire" : "Défense héroïque",
    subtitle: `contre ${opponent}`,
    pseudo: player.pseudo,
    tag,
    rank: getRankLabel(player.xp ?? 0),
    banner: show.banner,
    emblem: show.emblem ?? getRankIcon(player.xp ?? 0),
    stats: [
      { label: "Pertes adverses", value: `${theirLoss} %` },
      { label: "Mes pertes", value: `${myLoss} %` },
      attacker ? { label: "Butin", value: formatCompact(loot) } : { label: "Puissance", value: formatCompact(report.defenderPower) },
      { label: "XP", value: `${(xp ?? 0) >= 0 ? "+" : ""}${xp ?? 0}` },
    ],
    footer: `${new Date(report.timestamp).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })} · empire.fs0ciety.org`,
  };
}
